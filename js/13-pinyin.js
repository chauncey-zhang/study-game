'use strict';

/* ===================== 拼音乐园（读音 / 口诀记忆 / 笔顺描边 / 练笔判分） ===================== */
var PINYIN = window.__PINYIN__ || { shengmu: [], yunmu: [], zhengti: [], strokes: {} };
var pinyinTab = 'shengmu';          // 当前 tab：shengmu / yunmu / zhengti
var pyCurrent = null;               // 当前拼音项
var pyLetters = [];                 // 当前拼音拆成的字母序列（如 zh -> ['z','h']）
var pyLetterIdx = 0;                // 当前展示/练笔的字母下标
var pyAnimId = null;                // 笔顺描边动画定时器 id
/* 停止笔顺动画（兼容 interval/rAF 两种驱动） */
function stopPyAnim() {
  if (pyAnimId) { clearInterval(pyAnimId); cancelAnimationFrame(pyAnimId); pyAnimId = null; }
}
var pyWriting = false;              // 练笔：是否正在书写
var pyUserStrokes = [];             // 练笔：用户笔迹（多笔画点集）
var PY_SIZE = 480;                  // canvas 逻辑尺寸（方形，大于 CSS 显示尺寸，保证高清屏不模糊）
var PY_DPR = window.devicePixelRatio || 1; // 设备像素比：canvas 物理尺寸 = 逻辑尺寸 * dpr

/* ===================== 字体渲染标准字母（保证 100% 标准字形） ===================== */
/* 字体度量：测量标准字体的 x-height，确定字号与基线位置，使字体字形与笔画坐标系精确对齐
 * 笔画坐标系约定（见 data/pinyin.js）：ascender y=18、x-height 顶 y=42、baseline y=78、descender y=90
 * 对齐目标：字体的 x-height 高度 = 笔画 x-height(42~78) 对应的像素；x-height 中心 = 画布中心 */
var pyMetricsCache = null;
function pyFontMetrics(S) {
  if (pyMetricsCache && pyMetricsCache.S === S) return pyMetricsCache;
  var testSize = 100;
  var cv = document.createElement('canvas');
  cv.width = cv.height = 300;
  var c = cv.getContext('2d');
  c.font = '900 ' + testSize + 'px Arial, "Helvetica Neue", sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#000';
  c.fillText('x', 50, 200);
  var d = c.getImageData(0, 0, 300, 300).data;
  var minY = 300, maxY = -1;
  for (var y = 0; y < 300; y++) {
    for (var x = 0; x < 300; x++) {
      if (d[(y * 300 + x) * 4 + 3] > 128) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
  }
  var xhTest = (maxY - minY) || 52;      // 100px 字号下的 x-height 像素
  var k = S * 0.00833;                    // 笔画坐标 1 单位 = k 像素（统一比例）
  var targetXH = 36 * k;                  // 目标 x-height 像素（笔画坐标 42~78 共 36 单位）
  pyMetricsCache = {
    S: S,
    k: k,
    fontSize: Math.round(testSize * targetXH / xhTest),
    baselineY: S / 2 + 18 * k             // 笔画坐标 y=78（基线）对应像素；x-height 中心(60) = 画布中心
  };
  return pyMetricsCache;
}
/* 字形水平视觉中心：字体按 advance width 居中会偏左，这里测量实际像素包围盒中心用于校正 */
var pyHCenterCache = {};
function glyphHCenter(text, S) {
  var key = text + '@' + S;
  if (pyHCenterCache[key] !== undefined) return pyHCenterCache[key];
  var m = pyFontMetrics(S);
  var cv = document.createElement('canvas');
  cv.width = cv.height = S;
  var c = cv.getContext('2d');
  c.font = '900 ' + m.fontSize + 'px Arial, "Helvetica Neue", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = '#000';
  c.fillText(text, S / 2, m.baselineY);
  var d = c.getImageData(0, 0, S, S).data;
  var minX = S, maxX = -1;
  for (var y = 0; y < S; y++) {
    for (var x = 0; x < S; x++) {
      if (d[(y * S + x) * 4 + 3] > 128) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
    }
  }
  var cx = (maxX < 0) ? S / 2 : (minX + maxX) / 2;
  pyHCenterCache[key] = cx;
  return cx;
}
/* 笔画坐标（0~100）-> 画布坐标：x 按字母自身中心水平居中，y 用统一基准（x-height 中心 = 画布中心） */
function letterStrokePts(letter, S) {
  var strokes = PINYIN.strokes[letter] || [];
  if (!strokes.length) return [];
  var m = pyFontMetrics(S);
  var mnx = 1e9, mxx = -1e9;
  strokes.forEach(function (s) {
    s.forEach(function (p) { if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; });
  });
  var cx = (mnx + mxx) / 2;               // 字母自身水平中心
  return strokes.map(function (s) {
    return s.map(function (p) {
      return [S / 2 + (p[0] - cx) * m.k, S / 2 + (p[1] - 60) * m.k];
    });
  });
}
function drawGrid(ctx, S) {          // 田字格背景
  var pad = S * 0.125;
  ctx.strokeStyle = '#d6defc';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, pad, S - pad * 2, S - pad * 2);
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pad, S / 2); ctx.lineTo(S - pad, S / 2);
  ctx.moveTo(S / 2, pad); ctx.lineTo(S / 2, S - pad);
  ctx.stroke();
  ctx.restore();
}
function drawLetterText(ctx, text, S, color, isStroke) {
  // 用系统字体渲染标准字母（字号/基线来自 pyFontMetrics，水平按视觉中心居中，与笔画坐标系精确对齐）
  var m = pyFontMetrics(S);
  var hc = glyphHCenter(text, S);
  var dx = S / 2 - hc;                     // 视觉中心偏移量
  ctx.font = '900 ' + m.fontSize + 'px Arial, "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (isStroke) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, S * 0.015);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeText(text, S / 2 + dx, m.baselineY);
  } else {
    ctx.fillStyle = color;
    ctx.fillText(text, S / 2 + dx, m.baselineY);
  }
}

/* ===================== 专区主页 ===================== */
function showPinyin() {
  setHash('pinyin');
  renderPinyinTabs();
  renderPinyinList();
  showScreen('pinyinHub');
  focusFirstNav($('pinyinHubScreen'));
}
function renderPinyinTabs() {
  var tabs = [
    { id: 'shengmu', icon: '🔤', name: '声母' },
    { id: 'yunmu', icon: '🎵', name: '韵母' },
    { id: 'zhengti', icon: '🔗', name: '整体认读' }
  ];
  var el = $('pinyinTabs'); el.innerHTML = '';
  tabs.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'writing-tab' + (pinyinTab === t.id ? ' active' : '');
    b.textContent = t.icon + ' ' + t.name;
    b.addEventListener('click', function () {
      SFX.click();
      pinyinTab = t.id;
      renderPinyinTabs();
      renderPinyinList();
      focusFirstNav($('pinyinHubScreen'));
    });
    el.appendChild(b);
  });
}
function pinyinGroup() {
  if (pinyinTab === 'shengmu') return PINYIN.shengmu;
  if (pinyinTab === 'yunmu') return PINYIN.yunmu;
  return PINYIN.zhengti;
}
/* 读口诀时把单字母/拼音替换成正确「呼读音」（如 b→波、zh→知、ai→哀），
 * 避免浏览器 TTS 把孤立字母 b 读成「逼」、p 读成「批」等错误发音 */
function pyJingleSpeak(item, tail) {
  if (!item) return;
  var j = (item.jingle || '').split(item.ch).join(item.name);
  TTS.speak(item.name + '。' + j + (tail || ''), 0.85);
}
function renderPinyinList() {
  var el = $('pinyinList'); el.innerHTML = '';
  var group = pinyinGroup();
  group.forEach(function (item, idx) {
    var d = document.createElement('div');
    d.className = 'py-item';
    d.innerHTML = '<div class="py-item-ch">' + item.ch + '</div>' +
      '<div class="py-item-info"><div class="py-item-name">' + item.name + ' · ' + item.jingle + '</div>' +
      '<div class="py-item-word">' + item.word + '（' + item.wordPinyin + '）</div></div>' +
      '<button class="w-speak py-item-read" data-i="' + idx + '">🔊</button>';
    d.addEventListener('click', function (e) {
      if (e.target && e.target.className && String(e.target.className).indexOf('py-item-read') !== -1) return;
      SFX.click(); openPinyinDetail(item);
    });
    el.appendChild(d);
  });
  Array.prototype.forEach.call(el.querySelectorAll('.py-item-read'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      var it = group[parseInt(btn.getAttribute('data-i'), 10)];
      pyJingleSpeak(it);
    });
  });
  var body = $('pinyinHubScreen').querySelector('.hub-body');
  if (body) body.scrollTop = 0;
}

/* ===================== 详情 + 笔顺描边 + 练笔 ===================== */
function openPinyinDetail(item) {
  pyCurrent = item;
  pyLetters = item.ch.split('');
  pyLetterIdx = 0;
  $('pyTitle').textContent = item.ch;
  $('pyBig').textContent = item.ch;
  $('pyJingle').innerHTML = '<b>📖 记忆口诀：</b>' + item.jingle;
  $('pyWord').innerHTML = '<b>📝 例词：</b>' + item.word + '<span class="py-word-py">' + item.wordPinyin + '</span>';
  $('pyScore').innerHTML = '';
  renderLetterTabs();
  setActiveLetter(0);
  $('pinyinModal').className = 'modal-mask show';
  $('pyReadBtn').focus();
}
function closePinyin() {
  SFX.click();
  TTS.stop();
  stopPyAnim();
  pyWriting = false;
  $('pinyinModal').className = 'modal-mask';
}
function renderLetterTabs() {
  var el = $('pyLetterTabs'); el.innerHTML = '';
  pyLetters.forEach(function (L, i) {
    var b = document.createElement('button');
    b.className = 'py-letter-tab' + (i === pyLetterIdx ? ' active' : '');
    b.textContent = L;
    b.addEventListener('click', function () { SFX.click(); setActiveLetter(i); });
    el.appendChild(b);
  });
}
function setActiveLetter(idx) {
  pyLetterIdx = idx;
  renderLetterTabs();
  stopPyAnim();
  pyUserStrokes = [];
  pyWriting = false;
  resetStrokeCanvas();
  resetTemplateCanvas();
  resetWriteCanvas();
}
function resetStrokeCanvas() {
  var c = $('pyStrokeCanvas');
  var ctx = c.getContext('2d');
  ctx.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  ctx.clearRect(0, 0, PY_SIZE, PY_SIZE);
  drawGrid(ctx, PY_SIZE);
}
function resetTemplateCanvas() {
  // 底层标准字母模板（浅色填充，用户照着描）
  var c = $('pyTemplateCanvas');
  var ctx = c.getContext('2d');
  ctx.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  ctx.clearRect(0, 0, PY_SIZE, PY_SIZE);
  drawGrid(ctx, PY_SIZE);
  drawLetterText(ctx, pyLetters[pyLetterIdx], PY_SIZE, 'rgba(79,110,247,0.22)', false);
}
function resetWriteCanvas() {
  // 上层书写画布（透明，清空即可）
  var c = $('pyWriteCanvas');
  var ctx = c.getContext('2d');
  ctx.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  ctx.clearRect(0, 0, PY_SIZE, PY_SIZE);
}
/* ===================== 专业笔顺动画（参考悟空识字） =====================
 * 原理：笔尖沿笔画路径引导，「写出来的内容」直接从标准字体字形增量显影（与描红底字 100% 重合）
 * 性能：字形/背景只渲染一次缓存，蒙版增量累积，每帧只做贴图合成 —— 低端设备也流畅不跳帧 */
var PY_INK = '#4f6ef7';             // 笔画主色
var PY_INK_LIGHT = 'rgba(79,110,247,0.16)'; // 描红底字（淡色）
var PY_TIP = '#ff6b6b';             // 笔尖圆点颜色（醒目）
var PY_REVEAL_W = 0.15;             // 显影笔刷宽度比例（覆盖本笔字形 + 偏差容差）
var PY_CORE_W = 0.11;               // 笔画「核心领地」宽度比例（归该笔画所有，前面的笔刷不得侵入）
var pyGlyphCanvas = null;           // 离屏：深色标准字形（播放开始时渲染一次）
var pyBgCanvas = null;              // 离屏：田字格 + 淡色底字（播放开始时渲染一次）
var pyMaskCanvas = null;            // 离屏：显影蒙版（增量累积）
var pyWorkCanvas = null;            // 离屏：增量段计算
var pyCoreCanvas = null;            // 离屏：核心挖除区
var pyComposedCanvas = null;        // 离屏：字形 ∩ 蒙版 合成结果
var pyLastWritten = 0;              // 上一帧已写长度（增量显影游标）
function newPyCanvas() {
  // 离屏画布物理尺寸与主画布一致（乘 DPR），context 统一用 PY_DPR 逻辑变换
  var cv = document.createElement('canvas');
  cv.width = cv.height = PY_SIZE * PY_DPR;
  return cv;
}
function strokeLength(pts) {
  var L = 0;
  for (var i = 1; i < pts.length; i++) L += Math.hypot ? Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) : Math.sqrt(Math.pow(pts[i][0] - pts[i - 1][0], 2) + Math.pow(pts[i][1] - pts[i - 1][1], 2));
  return L;
}
function playStrokeAnim() {
  if (!pyLetters[pyLetterIdx]) return;
  SFX.click();
  stopPyAnim();
  var letter = pyLetters[pyLetterIdx];
  var strokePts = letterStrokePts(letter, PY_SIZE);
  if (!strokePts.length) return;
  var c = $('pyStrokeCanvas');
  var ctx = c.getContext('2d');
  if (!pyGlyphCanvas) pyGlyphCanvas = newPyCanvas();
  if (!pyBgCanvas) pyBgCanvas = newPyCanvas();
  if (!pyMaskCanvas) pyMaskCanvas = newPyCanvas();
  if (!pyWorkCanvas) pyWorkCanvas = newPyCanvas();
  if (!pyCoreCanvas) pyCoreCanvas = newPyCanvas();
  if (!pyComposedCanvas) pyComposedCanvas = newPyCanvas();
  var gc = pyGlyphCanvas.getContext('2d');
  var bc = pyBgCanvas.getContext('2d');
  var mc = pyMaskCanvas.getContext('2d');
  // —— 一次性渲染：深色字形 + 静态背景（每帧 0 次 fillText） ——
  gc.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  gc.globalCompositeOperation = 'source-over';
  gc.clearRect(0, 0, PY_SIZE, PY_SIZE);
  drawLetterText(gc, letter, PY_SIZE, PY_INK, false);
  bc.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  bc.globalCompositeOperation = 'source-over';
  bc.clearRect(0, 0, PY_SIZE, PY_SIZE);
  drawGrid(bc, PY_SIZE);
  drawLetterText(bc, letter, PY_SIZE, PY_INK_LIGHT, false);
  // —— 蒙版重置（增量显影从 0 开始） ——
  mc.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  mc.globalCompositeOperation = 'source-over';
  mc.clearRect(0, 0, PY_SIZE, PY_SIZE);
  pyLastWritten = 0;
  // 各笔画长度 + 总长度（按真实书写速度推进）
  var lens = strokePts.map(strokeLength);
  var totalLen = 0;
  lens.forEach(function (L) { totalLen += L; });
  totalLen = totalLen || 1;
  var t0 = Date.now();
  var DUR = 2400;
  var speed = totalLen / DUR;
  function step() {
    var elapsed = Date.now() - t0;
    var written = Math.min(totalLen, speed * elapsed);
    var done = elapsed >= DUR;
    ctx.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
    // 1) 背景（田字格 + 淡色底字）直接贴图
    ctx.clearRect(0, 0, PY_SIZE, PY_SIZE);
    ctx.drawImage(pyBgCanvas, 0, 0, PY_SIZE, PY_SIZE);
    if (!done) {
      // 2) 增量显影：只把「新增的一小段」累积进蒙版（代价极小，帧率稳）
      if (written > pyLastWritten) {
        revealIncrement(mc, strokePts, lens, pyLastWritten, written);
        pyLastWritten = written;
      }
      // 3) 合成：深色字形 ∩ 蒙版 = 已写出的字形部分（形状 100% 来自字体）
      var pc = pyComposedCanvas.getContext('2d');
      pc.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
      pc.globalCompositeOperation = 'source-over';
      pc.clearRect(0, 0, PY_SIZE, PY_SIZE);
      pc.drawImage(pyGlyphCanvas, 0, 0, PY_SIZE, PY_SIZE);
      pc.globalCompositeOperation = 'destination-in';
      pc.drawImage(pyMaskCanvas, 0, 0, PY_SIZE, PY_SIZE);
      pc.globalCompositeOperation = 'source-over';
      ctx.drawImage(pyComposedCanvas, 0, 0, PY_SIZE, PY_SIZE);
    } else {
      // 4) 收笔：直接显示完整标准字形（100% 完整）
      drawLetterText(ctx, letter, PY_SIZE, PY_INK, false);
    }
    // 5) 起笔序号标记
    drawStartMarks(ctx, strokePts);
    // 6) 笔尖圆点（书写过程中跟随）
    if (!done) {
      var tip = tipPosition(strokePts, lens, written);
      if (tip) {
        ctx.fillStyle = PY_TIP;
        ctx.beginPath();
        ctx.arc(tip[0], tip[1], PY_SIZE * 0.024, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    /* 用 setInterval 驱动（不依赖 vsync/rAF）：电视内核、省电模式下 rAF 可能每秒仅数帧，
     * 会导致笔画「跳格出现」；动画本身基于时间推进，驱动频率只影响平滑度 */
    if (!done) return;
    stopPyAnim();
  }
  pyAnimId = setInterval(step, 16);
}
/* 折线上按比例取点（索引插值） */
function polyPointAt(pts, t) {
  var n = pts.length - 1;
  var a = Math.max(0, Math.min(1, t)) * n;
  var i = Math.min(Math.floor(a), n - 1);
  var f = a - i;
  var p0 = pts[i], p1 = pts[Math.min(i + 1, n)];
  return [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f];
}
/* 绘制折线的 [f0, f1] 区间段（增量显影用，亚点精度保证每帧都有微小推进） */
function drawPolySegment(ctx, pts, f0, f1) {
  if (!pts || pts.length < 2 || f1 <= f0) return;
  var n = pts.length - 1;
  var a = f0 * n, b = f1 * n;
  var i0 = Math.floor(a), i1 = Math.ceil(b);
  if (i1 > n) i1 = n;
  var p0 = polyPointAt(pts, f0), p1 = polyPointAt(pts, f1);
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  for (var i = i0 + 1; i < i1; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(p1[0], p1[1]);
  ctx.stroke();
}
/* 增量显影：把 [from, to] 区间的新增笔刷段累积进蒙版
 * 每段显影 = 新增笔刷 - 后续笔画「核心领地」（连接处归本笔），不会提前显影后面的笔画 */
function revealIncrement(mc, strokePts, lens, from, to) {
  var wc = pyWorkCanvas.getContext('2d');
  var cc = pyCoreCanvas.getContext('2d');
  var acc = 0;
  for (var i = 0; i < strokePts.length && acc < to; i++) {
    var L = lens[i];
    var segStart = Math.max(from, acc);
    var segEnd = Math.min(to, acc + L);
    if (segEnd > segStart) {
      var f0 = (segStart - acc) / (L || 1);
      var f1 = (segEnd - acc) / (L || 1);
      // 1) 核心挖除区 = union(后续笔画核心) - 本笔完整中心细线（连接处归本笔）
      cc.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
      cc.globalCompositeOperation = 'source-over';
      cc.clearRect(0, 0, PY_SIZE, PY_SIZE);
      cc.strokeStyle = '#000';
      cc.lineWidth = PY_SIZE * PY_CORE_W;
      cc.lineCap = 'round';
      cc.lineJoin = 'round';
      for (var j = i + 1; j < strokePts.length; j++) drawPolyStroke(cc, strokePts[j], 1);
      cc.globalCompositeOperation = 'destination-out';
      drawPolyStroke(cc, strokePts[i], 1);
      cc.globalCompositeOperation = 'source-over';
      // 2) 新增笔刷段
      wc.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
      wc.globalCompositeOperation = 'source-over';
      wc.clearRect(0, 0, PY_SIZE, PY_SIZE);
      wc.strokeStyle = '#000';
      wc.lineWidth = PY_SIZE * PY_REVEAL_W;
      wc.lineCap = 'round';
      wc.lineJoin = 'round';
      drawPolySegment(wc, strokePts[i], f0, f1);
      // 3) 挖掉核心区
      wc.globalCompositeOperation = 'destination-out';
      wc.drawImage(pyCoreCanvas, 0, 0, PY_SIZE, PY_SIZE);
      wc.globalCompositeOperation = 'source-over';
      // 4) 累积到蒙版
      mc.drawImage(pyWorkCanvas, 0, 0, PY_SIZE, PY_SIZE);
    }
    acc += L;
  }
}
/* 取「已写长度」处的笔尖位置 */
function tipPosition(strokePts, lens, written) {
  var remain = written;
  for (var i = 0; i < strokePts.length; i++) {
    var L = lens[i];
    if (remain >= L) { remain -= L; continue; }
    return pointOnPoly(strokePts[i], L > 0 ? remain / L : 1);
  }
  var last = strokePts[strokePts.length - 1];
  return last ? [last[last.length - 1][0], last[last.length - 1][1]] : null;
}
/* 绘制一条笔画路径（frac 为写到第多少比例） */
function drawPolyStroke(ctx, pts, frac) {
  if (!pts || pts.length < 2 || frac <= 0) return;
  var target = 1 + frac * (pts.length - 1);
  var full = Math.floor(target);
  var f = target - full;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  var end = Math.min(full, pts.length - 1);
  for (var i = 1; i <= end; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (f > 0 && full < pts.length - 1) {
    var a = pts[full], b = pts[full + 1];
    ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
  }
  ctx.stroke();
}
/* 取路径上某比例处的点（笔尖位置） */
function pointOnPoly(pts, frac) {
  if (!pts || !pts.length) return null;
  if (frac <= 0) return [pts[0][0], pts[0][1]];
  if (frac >= 1) return [pts[pts.length - 1][0], pts[pts.length - 1][1]];
  var target = 1 + frac * (pts.length - 1);
  var full = Math.floor(target);
  var f = target - full;
  var a = pts[full], b = pts[Math.min(full + 1, pts.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
/* 起笔序号标记：每个笔画起点画小圆点 + 笔顺数字 */
function drawStartMarks(ctx, strokePts) {
  for (var i = 0; i < strokePts.length; i++) {
    var p = strokePts[i][0];
    if (!p) continue;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p[0], p[1], PY_SIZE * 0.028, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PY_INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = PY_INK;
    ctx.font = '900 ' + Math.round(PY_SIZE * 0.042) + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), p[0], p[1] + PY_SIZE * 0.002);
  }
}
/* 练笔：坐标换算 + 手写采集 */
function canvasPos(canvas, cx, cy) {
  var r = canvas.getBoundingClientRect();
  return [(cx - r.left) * (PY_SIZE / r.width), (cy - r.top) * (PY_SIZE / r.height)];
}
var pyWriteCtx = null;
function writeStart(x, y) {
  if (!pyLetters[pyLetterIdx]) return;
  pyWriting = true;
  pyUserStrokes.push([[x, y]]);
  if (!pyWriteCtx) pyWriteCtx = $('pyWriteCanvas').getContext('2d');
  pyWriteCtx.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  pyWriteCtx.strokeStyle = '#3a54d4';
  pyWriteCtx.lineWidth = PY_SIZE * 0.018;
  pyWriteCtx.lineCap = 'round';
  pyWriteCtx.lineJoin = 'round';
}
function writeMove(x, y) {
  if (!pyWriting) return;
  var cur = pyUserStrokes[pyUserStrokes.length - 1];
  cur.push([x, y]);
  var n = cur.length;
  if (n >= 2) {
    var a = cur[n - 2], b = cur[n - 1];
    pyWriteCtx.beginPath();
    pyWriteCtx.moveTo(a[0], a[1]);
    pyWriteCtx.lineTo(b[0], b[1]);
    pyWriteCtx.stroke();
  }
}
function writeEnd() { pyWriting = false; }
/* 练笔准确度判断：用户笔迹 vs 字体渲染标准字母，像素匹配 */
function checkWriting() {
  var letter = pyLetters[pyLetterIdx];
  if (!letter) return;
  SFX.click();
  var userPts = [];
  pyUserStrokes.forEach(function (s) { s.forEach(function (p) { userPts.push(p); }); });
  if (userPts.length < 8) { $('pyScore').innerHTML = '<div class="py-score-box low">✍️ 先在格子里写一写哦</div>'; return; }
  // 模板离屏 canvas：字体渲染标准字母
  var tpl = document.createElement('canvas'); tpl.width = tpl.height = PY_SIZE;
  var tc = tpl.getContext('2d');
  drawLetterText(tc, letter, PY_SIZE, '#000', false);
  // 用户离屏 canvas：用户笔迹
  var usr = document.createElement('canvas'); usr.width = usr.height = PY_SIZE;
  var uc = usr.getContext('2d');
  uc.strokeStyle = '#000'; uc.lineWidth = PY_SIZE * 0.05; uc.lineCap = 'round'; uc.lineJoin = 'round';
  pyUserStrokes.forEach(function (s) {
    if (s.length < 2) return;
    uc.beginPath();
    s.forEach(function (p, i) { if (i === 0) uc.moveTo(p[0], p[1]); else uc.lineTo(p[0], p[1]); });
    uc.stroke();
  });
  // 像素匹配（邻域容差）
  var td = tc.getImageData(0, 0, PY_SIZE, PY_SIZE).data;
  var ud = uc.getImageData(0, 0, PY_SIZE, PY_SIZE).data;
  var tol = Math.round(PY_SIZE * 0.012);
  var userCount = 0, match = 0;
  for (var y = 0; y < PY_SIZE; y++) {
    for (var x = 0; x < PY_SIZE; x++) {
      var i = (y * PY_SIZE + x) * 4;
      if (ud[i + 3] < 128) continue;
      userCount++;
      var hit = false;
      for (var dy = -tol; dy <= tol && !hit; dy++) {
        for (var dx = -tol; dx <= tol && !hit; dx++) {
          var nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= PY_SIZE || ny >= PY_SIZE) continue;
          if (td[(ny * PY_SIZE + nx) * 4 + 3] >= 128) hit = true;
        }
      }
      if (hit) match++;
    }
  }
  if (userCount === 0) { $('pyScore').innerHTML = '<div class="py-score-box low">✍️ 先在格子里写一写哦</div>'; return; }
  var score = Math.round(match / userCount * 100);
  var msg, cls;
  if (score >= 85) { msg = '⭐⭐⭐ 太棒了！写得很标准！'; cls = 'high'; }
  else if (score >= 70) { msg = '⭐⭐ 不错哦，继续加油！'; cls = 'mid'; }
  else if (score >= 50) { msg = '⭐ 还可以，跟着描红再练练'; cls = 'mid'; }
  else { msg = '💪 再试一次，照着描红写'; cls = 'low'; }
  $('pyScore').innerHTML = '<div class="py-score-box ' + cls + '"><div class="py-score-num">准确度 ' + score + '%</div><div>' + msg + '</div></div>';
}

/* ===================== 事件绑定 ===================== */
function setupPinyinCanvas() {
  PY_DPR = window.devicePixelRatio || 1;
  ['pyStrokeCanvas', 'pyTemplateCanvas', 'pyWriteCanvas'].forEach(function (id) {
    var c = $(id);
    c.width = PY_SIZE * PY_DPR;
    c.height = PY_SIZE * PY_DPR;
    var ctx = c.getContext('2d');
    ctx.setTransform(PY_DPR, 0, 0, PY_DPR, 0, 0);
  });
  resetStrokeCanvas();
  resetTemplateCanvas();
  resetWriteCanvas();
  var wc = $('pyWriteCanvas');
  var lastTouchTime = 0;
  wc.addEventListener('mousedown', function (e) {
    if (Date.now() - lastTouchTime < 500) return;
    var p = canvasPos(wc, e.clientX, e.clientY); writeStart(p[0], p[1]);
  });
  wc.addEventListener('touchstart', function (e) {
    e.preventDefault();
    lastTouchTime = Date.now();
    var tv = e.touches[0]; var p = canvasPos(wc, tv.clientX, tv.clientY); writeStart(p[0], p[1]);
  }, { passive: false });
  document.addEventListener('mousemove', function (e) { if (!pyWriting) return; var p = canvasPos(wc, e.clientX, e.clientY); writeMove(p[0], p[1]); });
  document.addEventListener('touchmove', function (e) {
    if (!pyWriting) return; e.preventDefault();
    var tv = e.touches[0]; var p = canvasPos(wc, tv.clientX, tv.clientY); writeMove(p[0], p[1]);
  }, { passive: false });
  document.addEventListener('mouseup', writeEnd);
  document.addEventListener('touchend', writeEnd);
  document.addEventListener('touchcancel', writeEnd);
}
setupPinyinCanvas();
$('pinyinBtn').addEventListener('click', function () { SFX.click(); showPinyin(); });
$('pinyinBack').addEventListener('click', goHome);
$('pinyinClose').addEventListener('click', closePinyin);
$('pyReadBtn').addEventListener('click', function () {
  if (!pyCurrent) return;
  SFX.click();
  pyJingleSpeak(pyCurrent, '。例词：' + pyCurrent.word);
});
$('pyPlayBtn').addEventListener('click', playStrokeAnim);
$('pyClearBtn').addEventListener('click', function () { SFX.click(); pyUserStrokes = []; pyWriting = false; resetWriteCanvas(); });
$('pyCheckBtn').addEventListener('click', checkWriting);
