'use strict';
  /* ===================== 思维素养模块 ===================== */
  var THINK_TYPES = [
    { id: 'seq',   icon: '🔢', name: '找规律' },
    { id: 'logic', icon: '🕵️', name: '逻辑推理' },
    { id: 'fig',   icon: '🔷', name: '图形规律' },
    { id: 'space', icon: '🧊', name: '空间想象' },
    { id: 'math',  icon: '🧩', name: '数学谜题' },
    { id: 'fun',   icon: '💡', name: '趣味谜题' }
  ];
  var thinkCount = 10;
  var thinkSel = {};
  THINK_TYPES.forEach(function (t) { thinkSel[t.id] = false; });
  thinkSel.space = true; // 默认仅选中空间想象类题型

  function thinkPack(r) {
    var o = [r.ans].concat(r.dist || []);
    var idx = shuffle([0, 1, 2, 3]);
    return { q: r.q, o: idx.map(function (i) { return o[i]; }), a: idx.indexOf(0), e: r.e, gfx: r.gfx || null, optHtml: r.optHtml || false };
  }
  function thinkDist(ans, step) {
    var cand = [ans + step, ans - step, ans + 2 * step, ans - 2 * step, ans + 1, ans + 3];
    var out = [], seen = {};
    seen[ans] = 1;
    for (var i = 0; i < cand.length && out.length < 3; i++) {
      var v = cand[i];
      if (v > 0 && !seen[v]) { seen[v] = 1; out.push(v); }
    }
    var k = ans + 5;
    while (out.length < 3) { if (!seen[k]) { seen[k] = 1; out.push(k); } k++; }
    return out;
  }
  function genSeqOne(grade) {
    function diff(s, d) { var seq = []; for (var i = 0; i < 5; i++) seq.push(s + d * i); var nxt = s + d * 5; return { q: seq.join('，') + '，？下一个是？', ans: nxt, dist: thinkDist(nxt, Math.abs(d) || 1), e: '每次' + (d >= 0 ? '加' : '减') + Math.abs(d) + '，所以是 ' + nxt }; }
    function ratio(s, r) { var seq = []; for (var i = 0; i < 5; i++) seq.push(s * Math.pow(r, i)); var nxt = s * Math.pow(r, 5); return { q: seq.join('，') + '，？下一个是？', ans: nxt, dist: thinkDist(nxt, Math.max(2, Math.round(nxt / 4))), e: '每次乘 ' + r + '，所以是 ' + nxt }; }
    function squares(s) { var seq = []; for (var i = 0; i < 5; i++) seq.push((s + i) * (s + i)); var nxt = (s + 5) * (s + 5); return { q: seq.join('，') + '，？下一个是？', ans: nxt, dist: thinkDist(nxt, Math.max(4, Math.round(nxt / 8))), e: '平方数：' + (s + 5) + '²=' + nxt }; }
    function fib() { var a = 1, b = 1, seq = [1, 1]; for (var i = 0; i < 3; i++) { var c = a + b; seq.push(c); a = b; b = c; } return { q: seq.join('，') + '，？下一个是？', ans: a + b, dist: thinkDist(a + b, 5), e: '前两数相加：' + a + '+' + b + '=' + (a + b) }; }
    function cubes() { var seq = []; for (var i = 1; i <= 5; i++) seq.push(i * i * i); return { q: seq.join('，') + '，？下一个是？', ans: 216, dist: [125, 343, 100], e: '立方数：6³=216' }; }
    function tri() { var seq = []; for (var i = 1; i <= 5; i++) seq.push(i * (i + 1) / 2); return { q: seq.join('，') + '，？下一个是？', ans: 21, dist: [18, 20, 24], e: '三角数：6×7÷2=21' }; }
    function np1() { var seq = []; for (var i = 1; i <= 5; i++) seq.push(i * i + 1); return { q: seq.join('，') + '，？下一个是？', ans: 37, dist: [35, 40, 50], e: 'n²+1：6²+1=37' }; }
    var pool;
    if (grade <= 3) pool = [function () { return diff(1 + Math.floor(Math.random() * 5), 1 + Math.floor(Math.random() * 3)); }, function () { return diff(10 + Math.floor(Math.random() * 15), -(1 + Math.floor(Math.random() * 3))); }, function () { return diff(5, 5); }];
    else if (grade <= 6) pool = [function () { return ratio(1 + Math.floor(Math.random() * 3), 2); }, function () { return squares(1); }, function () { return fib(); }, function () { return diff(1 + Math.floor(Math.random() * 5), 2 + Math.floor(Math.random() * 3)); }];
    else pool = [function () { return squares(1); }, function () { return cubes(); }, function () { return tri(); }, function () { return np1(); }, function () { return ratio(2, 2); }];
    return pool[Math.floor(Math.random() * pool.length)]();
  }
  function genFigOne(grade) {
    if (Math.random() < 0.45) {
      var palette = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠', '⬛', '⬜'];
      var k = 2 + Math.floor(Math.random() * 2);
      var set = shuffle(palette).slice(0, k);
      var seq = []; for (var i = 0; i < 6; i++) seq.push(set[i % k]);
      var ans = set[6 % k];
      var dist = shuffle(palette.filter(function (c) { return c !== ans; })).slice(0, 3);
      return { q: seq.join(' ') + ' ？下一个是什么？', ans: ans, dist: dist, e: '规律是 ' + set.join('、') + ' 循环，下一个是 ' + ans };
    }
    var syms = ['➜', '6', '9', 'F'];
    var s = syms[Math.floor(Math.random() * syms.length)];
    if (s === '➜') {
      var rot = [90, 180, 270][Math.floor(Math.random() * 3)];
      var dirs = { 90: '下', 180: '左', 270: '上' };
      return { q: '图中箭头 ➜ 顺时针旋转 ' + rot + '° 后，指向哪边？', ans: dirs[rot], dist: shuffle(['上', '下', '左', '右'].filter(function (x) { return x !== dirs[rot]; })).slice(0, 3), e: '➜ 顺转 ' + rot + '° 指向' + dirs[rot] + '。可点“旋转”试试。', gfx: { kind: 'sym', s: '➜' } };
    }
    if (s === '6') return { q: '数字 6 旋转 180° 后，看起来是哪个数字？', ans: '9', dist: ['6', '8', '0'], e: '6 倒过来是 9。可点“旋转”两次试试。', gfx: { kind: 'sym', s: '6' } };
    if (s === '9') return { q: '数字 9 旋转 180° 后，看起来是哪个数字？', ans: '6', dist: ['9', '8', '0'], e: '9 倒过来是 6。', gfx: { kind: 'sym', s: '9' } };
    return { q: '字母 F 做左右镜像后，看起来是什么样？', ans: '左右反过来的 F', dist: ['还是 F', '上下颠倒的 F', '变成 E'], e: '左右镜像后 F 左右颠倒。可点“镜像”看看。', gfx: { kind: 'sym', s: 'F' } };
  }
  /* 柱状堆叠（3×3 底座）生成器：返回 { h, n, X, Y, H } */
  function genStackShape() {
    var X = 3, Y = 3, H = 3;
    var h = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var n = 0;
    var base = 3 + Math.floor(Math.random() * 3); // 3~5 列有方块
    var cells = [];
    for (var x = 0; x < X; x++) for (var y = 0; y < Y; y++) cells.push([x, y]);
    cells = shuffle(cells);
    for (var i = 0; i < base; i++) {
      var x = cells[i][0], y = cells[i][1];
      var ht = 1 + Math.floor(Math.random() * (H - 1)); // 1~2 层
      h[x][y] = ht; n += ht;
    }
    if (n < 4) { h[cells[0][0]][cells[0][1]] += 1; n += 1; }
    return { h: h, n: n, X: X, Y: Y, H: H };
  }
  function frontView(sh) {
    var m = [];
    for (var z = 0; z < sh.H; z++) {
      var row = [];
      for (var x = 0; x < sh.X; x++) {
        var mx = 0;
        for (var y = 0; y < sh.Y; y++) mx = Math.max(mx, sh.h[x][y]);
        row.push(mx > z ? 1 : 0);
      }
      m.push(row);
    }
    return m;
  }
  function sideView(sh) {
    var m = [];
    for (var z = 0; z < sh.H; z++) {
      var row = [];
      for (var y = 0; y < sh.Y; y++) {
        var mx = 0;
        for (var x = 0; x < sh.X; x++) mx = Math.max(mx, sh.h[x][y]);
        row.push(mx > z ? 1 : 0);
      }
      m.push(row);
    }
    return m;
  }
  function gridViewHtml(m) {
    var rows = m.length, cols = m[0].length, html = '<span class="gv">';
    for (var z = rows - 1; z >= 0; z--) {
      html += '<span class="gv-row">';
      for (var c = 0; c < cols; c++) html += '<i class="' + (m[z][c] ? 'on' : 'off') + '"></i>';
      html += '</span>';
    }
    html += '</span>';
    return html;
  }
  function topGridHtml(h) {
    var X = h.length, Y = h[0].length, html = '<span class="gv">';
    for (var y = 0; y < Y; y++) {
      html += '<span class="gv-row">';
      for (var x = 0; x < X; x++) {
        var v = h[x][y];
        html += '<i class="' + (v > 0 ? 'num' : 'off') + '">' + (v > 0 ? v : '') + '</i>';
      }
      html += '</span>';
    }
    html += '</span>';
    return html;
  }
  function perturbView(m) {
    var rows = m.length, cols = m[0].length, mm = [];
    for (var z = 0; z < rows; z++) mm.push(m[z].slice());
    var flips = 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < flips; i++) {
      var z2 = Math.floor(Math.random() * rows);
      var c = Math.floor(Math.random() * cols);
      mm[z2][c] = mm[z2][c] ? 0 : 1;
    }
    return mm;
  }
  function stackHtml(h) {
    var S = 1.4, X = h.length, Y = h[0].length;
    var cx = (X - 1) / 2, cy = (Y - 1) / 2;
    var html = '<div class="stack-wrap"><div class="stack3d" id="gfxStack">';
    for (var x = 0; x < X; x++) for (var y = 0; y < Y; y++) {
      var ht = h[x][y];
      for (var z = 0; z < ht; z++) {
        var tx = ((x - cx) * S).toFixed(2), ty = (-(z + 0.5) * S).toFixed(2), tz = ((y - cy) * S).toFixed(2);
        html += '<div class="sb" style="transform:translate3d(' + tx + 'rem,' + ty + 'rem,' + tz + 'rem)">' +
          '<div class="sf f0"></div><div class="sf f1"></div><div class="sf f2"></div>' +
          '<div class="sf f3"></div><div class="sf sf-top f4"></div><div class="sf f5"></div></div>';
      }
    }
    html += '</div></div>';
    return html;
  }
  /* 空间题：堆叠方块三种题型（数块数 / 俯视图标数 / 三视图判断） */
  function genStackQuestion(grade) {
    var sh = genStackShape();
    var kind = Math.floor(Math.random() * 3);
    if (kind === 0) {
      return { q: '下面这个立体图形一共用了几个小正方体？（可拖动旋转观察）', ans: String(sh.n), dist: thinkDist(sh.n, 1), e: '数一数：一共有 ' + sh.n + ' 个小正方体。', gfx: { kind: 'stack', h: sh.h } };
    }
    if (kind === 1) {
      return { q: '俯视图每个数字表示这一列叠了几个小正方体，一共几个？', ans: String(sh.n), dist: thinkDist(sh.n, 1), e: '把数字加起来：一共 ' + sh.n + ' 个。', gfx: { kind: 'topgrid', h: sh.h } };
    }
    var fv = frontView(sh);
    var ansHtml = gridViewHtml(fv);
    var dist = [], guard = 0;
    while (dist.length < 3 && guard < 50) {
      guard++;
      var cand = gridViewHtml(perturbView(fv));
      if (cand !== ansHtml && dist.indexOf(cand) === -1) dist.push(cand);
    }
    var alt = gridViewHtml(sideView(sh));
    if (dist.length < 3 && alt !== ansHtml && dist.indexOf(alt) === -1) dist.push(alt);
    while (dist.length < 3) dist.push(alt);
    return { q: '这个立体图形从正面看，是下面哪个形状？（可拖动旋转）', ans: ansHtml, dist: dist, e: '从正面看，每列的高度就是这一列最高的方块数。', gfx: { kind: 'stack', h: sh.h }, optHtml: true };
  }
  function genSolidQuestion() {
    var shapes = [
      { id: 'cuboid', name: '长方体' },
      { id: 'pyramid', name: '四棱锥' },
      { id: 'prism', name: '三棱柱' },
      { id: 'cylinder', name: '圆柱' },
      { id: 'cone', name: '圆锥' },
      { id: 'sphere', name: '球体' },
      { id: 'cube', name: '正方体' }
    ];
    var s = shapes[Math.floor(Math.random() * shapes.length)];
    var others = [];
    shapes.forEach(function (x) { if (x.name !== s.name) others.push(x.name); });
    var dist = shuffle(others).slice(0, 3);
    return { q: '下面这个立体图形是什么？（可拖动旋转观察）', ans: s.name, dist: dist, e: '这是' + s.name + '。可以旋转从各个方向观察它的形状。', gfx: { kind: 'solid', shape: s.id } };
  }
  function genSpaceOne(grade) {
    var r = Math.random();
    if (r < 0.35) return genStackQuestion(grade);
    if (r < 0.55) return genSolidQuestion();
    if (r < 0.7) {
      var faces = ['1', '2', '3', '4', '5', '6'];
      var shown = faces[Math.floor(Math.random() * 6)];
      var opp = String(7 - parseInt(shown, 10));
      var dist = shuffle(faces.filter(function (f) { return f !== opp; })).slice(0, 3);
      return { q: '正方体对面数字之和是 7。看到「' + shown + '」这一面，它对面是几？', ans: opp, dist: dist, e: '对面之和 7，' + shown + ' 的对面是 7−' + shown + '=' + opp + '。转动方块找一找。', gfx: { kind: 'cube', faces: faces } };
    }
    if (r < 0.8) {
      var facts = [
        { q: '正方体有几个顶点？', ans: '8', dist: ['4', '6', '12'], e: '正方体有 8 个顶点、6 个面、12 条棱。' },
        { q: '正方体有几条棱？', ans: '12', dist: ['6', '8', '10'], e: '正方体有 12 条棱。' },
        { q: '正方体有几个面？', ans: '6', dist: ['4', '8', '12'], e: '正方体有 6 个面。' },
        { q: '从正面看正方体，是什么形状？', ans: '正方形', dist: ['圆形', '三角形', '长方形'], e: '每个面都是正方形。' },
        { q: '从上面看圆柱体，是什么形状？', ans: '圆形', dist: ['长方形', '三角形', '正方形'], e: '圆柱体俯视图是圆。' },
        { q: '从侧面看圆锥，是什么形状？', ans: '三角形', dist: ['圆', '正方形', '梯形'], e: '圆锥侧视图是三角形。' }
      ];
      var f = facts[Math.floor(Math.random() * facts.length)];
      return { q: f.q, ans: f.ans, dist: f.dist.slice(), e: f.e };
    }
    var netPick = Math.random();
    if (netPick < 0.28) return { q: '下面这个十字形展开图，能折成一个正方体吗？', ans: '能', dist: ['不能', '不一定', '只能折成长方体'], e: '6 个面正好组成正方体。点“折叠”看它怎么折起来。', gfx: { kind: 'net', shape: 'cube' } };
    if (netPick < 0.56) return { q: '下面这个展开图，能折成一个长方体吗？', ans: '能', dist: ['不能', '不一定', '只能折成正方体'], e: '6 个面正好组成长方体。点“折叠”看它怎么折起来。', gfx: { kind: 'net', shape: 'cuboid' } };
    if (netPick < 0.84) return { q: '下面这个展开图，能折成一个三棱柱吗？', ans: '能', dist: ['不能', '不一定', '只能折成圆柱'], e: '2 个三角形加 3 个长方形正好组成三棱柱。点“折叠”看它怎么折起来。', gfx: { kind: 'net', shape: 'prism' } };
    return { q: '如果把 6 个小正方形排成“一字长条”，能折成正方体吗？', ans: '不能', dist: ['能', '有时能', '能折成球'], e: '一字排开会重叠，无法折成正方体。' };
  }
  function genMathOne(grade) {
    var pool = [];
    if (grade <= 3) pool = pool.concat([
      { q: '小明有 5 个苹果，吃掉 2 个，还剩几个？', ans: '3', dist: ['2', '4', '5'], e: '5−2=3' },
      { q: '3 只鸡有几条腿？', ans: '6', dist: ['3', '4', '8'], e: '3×2=6' },
      { q: '一个数加上 8 等于 15，这个数是几？', ans: '7', dist: ['6', '8', '9'], e: '15−8=7' },
      { q: '一根绳子剪 3 次，剪成几段？', ans: '4', dist: ['3', '2', '5'], e: '剪 n 次得 n+1 段' },
      { q: '小明今年 8 岁，爸爸比他大 30 岁，爸爸几岁？', ans: '38', dist: ['36', '40', '42'], e: '8+30=38' }
    ]);
    if (grade >= 3 && grade <= 6) pool = pool.concat([
      { q: '鸡兔同笼：共 5 只，14 条腿，几只鸡？', ans: '3', dist: ['2', '4', '1'], e: '设鸡 x：2x+4(5−x)=14' },
      { q: '鸡兔同笼：共 10 个头，28 条腿，几只兔？', ans: '4', dist: ['6', '5', '3'], e: '设兔 x：4x+2(10−x)=28' },
      { q: '从 1 加到 10 是多少？', ans: '55', dist: ['50', '45', '60'], e: '(1+10)×10÷2=55' },
      { q: '6 个同学每两人比赛一场，共几场？', ans: '15', dist: ['12', '18', '30'], e: '6×5÷2=15' },
      { q: '两位数，十位是 3，个位比十位大 4，是几？', ans: '37', dist: ['34', '43', '47'], e: '个位 3+4=7' }
    ]);
    if (grade >= 7) pool = pool.concat([
      { q: '从 1 到 100 有多少个数字含“9”？', ans: '19', dist: ['10', '20', '11'], e: '个位 9 十个，十位 9 十个，99 重复，共 19' },
      { q: '100 以内最大的质数是？', ans: '97', dist: ['99', '98', '91'], e: '97 是最大质数' },
      { q: '三个连续整数之和是 36，中间数是？', ans: '12', dist: ['11', '13', '14'], e: '36÷3=12' },
      { q: '小明从一楼到三楼用 6 秒，从一楼到六楼用几秒？', ans: '15', dist: ['12', '18', '10'], e: '每层 3 秒，5 层 15 秒' },
      { q: '小明上坡 10km/h 下坡 15km/h，往返平均速度？', ans: '12', dist: ['12.5', '13', '11'], e: '2/(1/10+1/15)=12 km/h' }
    ]);
    var f = pool[Math.floor(Math.random() * pool.length)];
    return { q: f.q, ans: f.ans, dist: f.dist.slice(), e: f.e };
  }
  function thinkGenOne(type, grade) {
    if (type === 'seq') return genSeqOne(grade);
    if (type === 'fig') return genFigOne(grade);
    if (type === 'space') return genSpaceOne(grade);
    if (type === 'math') return genMathOne(grade);
    return genSeqOne(grade);
  }
  function thinkPool(grade, count) {
    var sel = THINK_TYPES.filter(function (t) { return thinkSel[t.id]; });
    if (!sel.length) sel = THINK_TYPES.slice();
    var pool = [], added = 0;
    /* 不再限制上限：生成类题型（找规律/图形/空间/数学）可按年级无限不重复产出；
       仅当「一整轮遍历所有选中题型都没新增任何题」才退出——即固定题库（趣味156+逻辑19）已抽空，
       此时无法再凑足数量，自然停止，避免死循环 */
    while (pool.length < count) {
      added = 0;
      sel.forEach(function (t) {
        if (pool.length >= count) return;
        var q = null;
        if (t.id === 'fun') { var a = shuffle(window.__THINK_FUN__ || []); if (a[0]) q = shuffleOptions(a[0]); }
        else if (t.id === 'logic') { var b = shuffle(window.__THINK_LOGIC__ || []); if (b[0]) q = shuffleOptions(b[0]); }
        else q = thinkPack(thinkGenOne(t.id, grade));
        if (q) { pool.push(q); added++; }
      });
      if (added === 0) break;
    }
    return shuffle(pool).slice(0, count);
  }
  function showThinkHub() {
    setHash('think-hub/g' + curGrade);
    renderThinkHub();
    showScreen('thinkHub');
    focusFirstNav($('thinkHubScreen'));
  }
  function renderThinkHub() {
    var cnt = 0; THINK_TYPES.forEach(function (t) { if (thinkSel[t.id]) cnt++; });
    $('thinkHubSub').textContent = GRADE_LABEL[curGrade] + '年级 · 当前 ' + thinkCount + ' 题 · ' + cnt + ' 类题型 · 答对赚 🍖';
    renderCountChips('thinkCountRow', [10, 15, 20, 30], thinkCount, function (v) { thinkCount = v; renderThinkHub(); });
    var tr = $('thinkTypeRow'); tr.innerHTML = '';
    THINK_TYPES.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'think-type' + (thinkSel[t.id] ? ' active' : '');
      b.textContent = t.icon + ' ' + t.name;
      b.addEventListener('click', function () {
        SFX.click();
        thinkSel[t.id] = !thinkSel[t.id];
        if (!THINK_TYPES.some(function (x) { return thinkSel[x.id]; })) thinkSel[t.id] = true; // 至少保留一类
        renderThinkHub();
      });
      tr.appendChild(b);
    });
    var log = save.thinkLog || {};
    var days = Object.keys(log).sort();
    $('thinkStreakInfo').innerHTML = '🔥 连续打卡 <b>' + (save.thinkStreak || 0) + '</b> 天 · 累计 <b>' + days.length + '</b> 天 · 今天' + (save.thinkLast === todayStr(0) ? '已打卡 ✅' : '还未打卡');
    var last7 = days.slice(-7).reverse();
    var html = last7.length ? '' : '<div class="hub-info" style="color:var(--muted)">还没有记录，完成第一次思维挑战吧！</div>';
    last7.forEach(function (d) {
      var e = log[d];
      var acc = e.total ? Math.round(e.n / e.total * 100) : 0;
      html += '<div class="trend-row"><span class="td">' + d.slice(5) + '</span><div class="bar-wrap"><div style="width:' + acc + '%;height:100%;background:linear-gradient(90deg,#7c6ff0,#a78bfa);border-radius:.3rem"></div></div><span style="color:var(--muted)">' + acc + '%</span></div>';
    });
    $('thinkTrend').innerHTML = html;
  }
  function startDailyThink() {
    var pool = thinkPool(curGrade, thinkCount);
    if (pool.length < 4) { toast('题目不足，请多选几类题型'); return; }
    freeMode = true; lastWasFlash = false; lastFreeMode = ''; wrongMode = false; battleWrongIdx = [];
    flashMode = false; dailyMode = 'think'; dailyIsReview = false; dailyReport = null;
    gameMode = 'adventure'; roundTimes = []; roundOk = [];
    curSubject = 'think'; curLevel = 0;
    curQuestions = pool;
    setHash('think-run/g' + curGrade + '/' + thinkCount);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0; earnedFood = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    $('battleTitle').textContent = '🧠 思维素养';
    $('battleSub').textContent = GRADE_LABEL[curGrade] + '年级 · ' + pool.length + ' 题 · 动脑赚🍖';
    renderBattlePet();
    renderBattle();
  }
  /* 交互图形演示：旋转/镜像符号、可拖拽 3D 立方体、展开图折叠 */
  function renderThinkGfx(q) {
    var el = $('qGraphic');
    if (!q || !q.gfx) { el.className = 'q-graphic hidden'; el.innerHTML = ''; return; }
    el.className = 'q-graphic';
    var g = q.gfx;
    if (g.kind === 'sym') {
      el.innerHTML = '<div class="gfx-stage"><span class="gfx-sym" id="gfxSym">' + g.s + '</span></div>' +
        '<div class="gfx-ctrl"><button id="gfxRot">↻ 旋转90°</button><button id="gfxMir">⇋ 镜像</button><button id="gfxReset">↺ 复位</button></div>' +
        '<div class="gfx-hint">动手点一点，看看图形怎么变</div>';
      var deg = 0, mir = false;
      function applySym() { $('gfxSym').style.transform = 'rotate(' + deg + 'deg) scaleX(' + (mir ? -1 : 1) + ')'; }
      $('gfxRot').onclick = function () { SFX.click(); deg += 90; applySym(); };
      $('gfxMir').onclick = function () { SFX.click(); mir = !mir; applySym(); };
      $('gfxReset').onclick = function () { SFX.click(); deg = 0; mir = false; applySym(); };
    } else if (g.kind === 'cube') {
      var fcls = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5'];
      var html = '<div class="cube-wrap"><div class="cube3d" id="gfxCube">';
      for (var i = 0; i < 6; i++) html += '<div class="cf ' + fcls[i] + '">' + g.faces[i] + '</div>';
      html += '</div></div><div class="gfx-hint">👆 拖动方块旋转，观察六个面</div>';
      el.innerHTML = html;
      bindCubeDrag($('gfxCube'));
    } else if (g.kind === 'net') {
      var nshape = g.shape || 'cube';
      var nHint, nDone;
      if (nshape === 'cuboid') {
        nHint = '这是长方体展开图（6 个面），点“折叠”看它怎么折起来';
        nDone = '✅ 折起来，正好是一个长方体！';
      } else if (nshape === 'prism') {
        nHint = '这是三棱柱展开图（2 个三角形 + 3 个长方形），点“折叠”看它怎么折起来';
        nDone = '✅ 折起来，正好是一个三棱柱！';
      } else {
        nHint = '这是正方体展开图（6 个面），点“折叠”看它怎么折起来';
        nDone = '✅ 6 个面折起来，正好是一个正方体！';
      }
      el.innerHTML = '<div class="gfx-stage"><canvas class="fold-canvas" id="gfxFold"></canvas></div>' +
        '<div class="gfx-ctrl"><button id="gfxNetFold">▶ 折叠</button></div>' +
        '<div class="gfx-hint" id="gfxNetHint">' + nHint + '</div>';
      var folded = false;
      bindFoldNet($('gfxFold'), nshape);
      $('gfxNetFold').onclick = function () {
        SFX.click();
        folded = !folded;
        $('gfxFold')._toggleFold();
        $('gfxNetFold').textContent = folded ? '↺ 展开' : '▶ 折叠';
        $('gfxNetHint').textContent = folded ? nDone : nHint;
      };
    } else if (g.kind === 'stack') {
      el.innerHTML = stackHtml(g.h) + '<div class="gfx-hint">👆 拖动方块旋转，从各个方向观察</div>';
      bindCubeDrag($('gfxStack'), -26, -38);
    } else if (g.kind === 'topgrid') {
      el.innerHTML = '<div class="gfx-stage">' + topGridHtml(g.h) + '</div>' +
        '<div class="gfx-hint">每个数字表示这一列叠了几个小正方体</div>';
    } else if (g.kind === 'solid') {
      el.innerHTML = '<div class="gfx-stage"><canvas class="solid-canvas" id="gfxSolid"></canvas></div>' +
        '<div class="gfx-hint">👆 拖动旋转，从各个方向观察</div>';
      bindSolidView($('gfxSolid'), g.shape);
    }
  }
  /* ===== 展开图折叠演示（Canvas 3D 投影 + 刚性折叠动画） ===== */
  function v3(x, y, z) { return [x, y, z]; }
  function v3Sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function v3Cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function v3Dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function v3Scale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function v3Add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function v3RotAxis(p, ap, u, angle) {
    var c = Math.cos(angle), s = Math.sin(angle);
    var d = v3Sub(p, ap);
    var dPar = v3Scale(u, v3Dot(d, u));
    var dPerp = v3Sub(d, dPar);
    var w = v3Cross(u, dPerp);
    return v3Add(ap, v3Add(dPar, v3Add(v3Scale(dPerp, c), v3Scale(w, s))));
  }
  function foldFace(pts, ap, u, angle, fill, label) {
    return { pts: pts, steps: [{ ap: ap, u: u, angle: angle }], fill: fill, label: label || '' };
  }
  function buildFoldNet(shape) {
    var faces = [];
    var ux = [1, 0, 0], uy = [0, 1, 0];
    if (shape === 'prism') {
      // 等边三角形截面三棱柱：边长 s、柱高 L、三角形高 h
      var s = 1.4, L = 1.8, h = s * Math.sqrt(3) / 2, hs = s / 2, hl = L / 2;
      // 中间侧面（底边，固定不动）
      faces.push(foldFace([[-hs, -hl, 0], [hs, -hl, 0], [hs, hl, 0], [-hs, hl, 0]], [0, 0, 0], [0, 0, 1], 0, 'rgba(96,125,250,0.68)', ''));
      // 左侧面：绕左棱折 +120°
      faces.push(foldFace([[-hs - s, -hl, 0], [-hs, -hl, 0], [-hs, hl, 0], [-hs - s, hl, 0]], [-hs, 0, 0], uy, Math.PI * 2 / 3, 'rgba(96,125,250,0.68)', ''));
      // 右侧面：绕右棱折 -120°
      faces.push(foldFace([[hs, -hl, 0], [hs + s, -hl, 0], [hs + s, hl, 0], [hs, hl, 0]], [hs, 0, 0], uy, -Math.PI * 2 / 3, 'rgba(96,125,250,0.68)', ''));
      // 顶三角形端面：绕上边折 +90°
      faces.push(foldFace([[-hs, hl, 0], [hs, hl, 0], [0, hl + h, 0]], [0, hl, 0], ux, Math.PI / 2, 'rgba(112,140,252,0.8)', '顶'));
      // 底三角形端面：绕下边折 -90°
      faces.push(foldFace([[-hs, -hl, 0], [0, -hl - h, 0], [hs, -hl, 0]], [0, -hl, 0], ux, -Math.PI / 2, 'rgba(112,140,252,0.8)', '底'));
    } else if (shape === 'cuboid') {
      var a = 1.6, b = 1.2, c = 0.9, ha = a / 2, hb = b / 2;
      faces.push(foldFace([[-ha, -hb, 0], [ha, -hb, 0], [ha, hb, 0], [-ha, hb, 0]], [0, 0, 0], [0, 0, 1], 0, 'rgba(79,110,247,0.52)', '前'));
      faces.push(foldFace([[-ha, hb, 0], [ha, hb, 0], [ha, hb + c, 0], [-ha, hb + c, 0]], [0, hb, 0], ux, Math.PI / 2, 'rgba(112,140,252,0.72)', '上'));
      faces.push(foldFace([[-ha, -hb - c, 0], [ha, -hb - c, 0], [ha, -hb, 0], [-ha, -hb, 0]], [0, -hb, 0], ux, -Math.PI / 2, 'rgba(112,140,252,0.68)', '下'));
      faces.push(foldFace([[-ha - c, -hb, 0], [-ha, -hb, 0], [-ha, hb, 0], [-ha - c, hb, 0]], [-ha, 0, 0], uy, Math.PI / 2, 'rgba(96,125,250,0.68)', '左'));
      faces.push(foldFace([[ha, -hb, 0], [ha + c, -hb, 0], [ha + c, hb, 0], [ha, hb, 0]], [ha, 0, 0], uy, -Math.PI / 2, 'rgba(96,125,250,0.68)', '右'));
      var back = foldFace([[ha + c, -hb, 0], [ha + c + a, -hb, 0], [ha + c + a, hb, 0], [ha + c, hb, 0]], [ha + c, 0, 0], uy, -Math.PI / 2, 'rgba(58,84,212,0.78)', '后');
      back.steps.push({ ap: [ha, 0, 0], u: uy, angle: -Math.PI / 2 }); // 跟随右面一起折
      faces.push(back);
    } else {
      var a2 = 1, h2 = a2 / 2;
      faces.push(foldFace([[-h2, -h2, 0], [h2, -h2, 0], [h2, h2, 0], [-h2, h2, 0]], [0, 0, 0], [0, 0, 1], 0, 'rgba(79,110,247,0.52)', '前'));
      faces.push(foldFace([[-h2, h2, 0], [h2, h2, 0], [h2, h2 + a2, 0], [-h2, h2 + a2, 0]], [0, h2, 0], ux, Math.PI / 2, 'rgba(112,140,252,0.72)', '上'));
      faces.push(foldFace([[-h2, -h2 - a2, 0], [h2, -h2 - a2, 0], [h2, -h2, 0], [-h2, -h2, 0]], [0, -h2, 0], ux, -Math.PI / 2, 'rgba(112,140,252,0.68)', '下'));
      faces.push(foldFace([[-h2 - a2, -h2, 0], [-h2, -h2, 0], [-h2, h2, 0], [-h2 - a2, h2, 0]], [-h2, 0, 0], uy, Math.PI / 2, 'rgba(96,125,250,0.68)', '左'));
      faces.push(foldFace([[h2, -h2, 0], [h2 + a2, -h2, 0], [h2 + a2, h2, 0], [h2, h2, 0]], [h2, 0, 0], uy, -Math.PI / 2, 'rgba(96,125,250,0.68)', '右'));
      var back = foldFace([[h2 + a2, -h2, 0], [h2 + 2 * a2, -h2, 0], [h2 + 2 * a2, h2, 0], [h2 + a2, h2, 0]], [h2 + a2, 0, 0], uy, -Math.PI / 2, 'rgba(58,84,212,0.78)', '后');
      back.steps.push({ ap: [h2, 0, 0], u: uy, angle: -Math.PI / 2 }); // 跟随右面一起折
      faces.push(back);
    }
    // 整体居中（基于展开态包围盒）
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, i, k;
    for (i = 0; i < faces.length; i++) for (k = 0; k < faces[i].pts.length; k++) {
      if (faces[i].pts[k][0] < minX) minX = faces[i].pts[k][0];
      if (faces[i].pts[k][0] > maxX) maxX = faces[i].pts[k][0];
      if (faces[i].pts[k][1] < minY) minY = faces[i].pts[k][1];
      if (faces[i].pts[k][1] > maxY) maxY = faces[i].pts[k][1];
    }
    var ox = -(minX + maxX) / 2, oy = -(minY + maxY) / 2;
    for (i = 0; i < faces.length; i++) {
      var f = faces[i];
      for (k = 0; k < f.pts.length; k++) { f.pts[k][0] += ox; f.pts[k][1] += oy; }
      for (var si = 0; si < f.steps.length; si++) { f.steps[si].ap[0] += ox; f.steps[si].ap[1] += oy; }
    }
    return faces;
  }
  function renderFoldNet(canvas, faces, t, rx, ry) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var dpr = window.devicePixelRatio || 1;
    var lw = W / dpr, lh = H / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lw, lh);
    var cx = lw / 2, cy = lh / 2;
    var scale = Math.min(lw, lh) * 0.23;
    var fov = 6;
    var cyc = Math.cos(ry), syc = Math.sin(ry);
    var cxc = Math.cos(rx), sxc = Math.sin(rx);
    var drawFaces = [], i, k, si;
    for (i = 0; i < faces.length; i++) {
      var f = faces[i];
      var proj = [], sumZ = 0;
      for (k = 0; k < f.pts.length; k++) {
        var p = f.pts[k];
        for (si = 0; si < f.steps.length; si++) {
          var st = f.steps[si];
          var ang = st.angle * t;
          if (ang !== 0) p = v3RotAxis(p, st.ap, st.u, ang);
        }
        var q = p;
        var x1 = q[0] * cyc + q[2] * syc;
        var z1 = -q[0] * syc + q[2] * cyc;
        var y2 = q[1] * cxc - z1 * sxc;
        var z2 = q[1] * sxc + z1 * cxc;
        var ps = fov / (fov + z2);
        proj.push([cx + x1 * scale * ps, cy - y2 * scale * ps]);
        sumZ += z2;
      }
      // 背面剔除：只保留面向相机的面（投影多边形有向面积为正）
      var area = 0;
      for (k = 0; k < proj.length; k++) {
        var k2 = (k + 1) % proj.length;
        area += proj[k][0] * proj[k2][1] - proj[k2][0] * proj[k][1];
      }
      if (area < 0) drawFaces.push({ f: f, proj: proj, d: sumZ / f.pts.length });
    }
    drawFaces.sort(function (a, b) { return a.d - b.d; });
    for (i = 0; i < drawFaces.length; i++) {
      var df = drawFaces[i], pts = df.proj;
      ctx.beginPath();
      for (k = 0; k < pts.length; k++) {
        if (k === 0) ctx.moveTo(pts[k][0], pts[k][1]); else ctx.lineTo(pts[k][0], pts[k][1]);
      }
      ctx.closePath();
      ctx.fillStyle = df.f.fill.replace(/[\d.]+\)$/, '0.88)');
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,84,212,0.95)';
      ctx.lineWidth = Math.max(1.2, scale * 0.025);
      ctx.stroke();
      if (df.f.label) {
        var mx = 0, my = 0;
        for (k = 0; k < pts.length; k++) { mx += pts[k][0]; my += pts[k][1]; }
        mx /= pts.length; my /= pts.length;
        ctx.fillStyle = '#3a54d4';
        ctx.font = 'bold ' + Math.round(scale * 0.26) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(df.f.label, mx, my);
      }
    }
  }
  var foldRafId = null;
  function bindFoldNet(canvas, shape) {
    var faces = buildFoldNet(shape);
    var dpr = window.devicePixelRatio || 1;
    var LW = 700, LH = 600;
    canvas.width = LW * dpr;
    canvas.height = LH * dpr;
    if (foldRafId) { cancelAnimationFrame(foldRafId); foldRafId = null; }
    var t = 0, target = 0;
    var baseRx = -0.32, baseRy = 0.5, spin = 0, userRx = 0, userRy = 0;
    var dragging = false, lx = 0, ly = 0;
    function step() {
      var dir = target > t ? 1 : -1;
      if (dir > 0 && t < target) { t += 0.04; if (t >= target) t = target; }
      else if (dir < 0 && t > target) { t -= 0.04; if (t <= target) t = target; }
      if (t >= 1 && !dragging) spin += 0.004;
      renderFoldNet(canvas, faces, t, (baseRx + userRx) * t, (baseRy + spin + userRy) * t);
      if (t !== target || t >= 1 || dragging) foldRafId = requestAnimationFrame(step);
      else foldRafId = null;
    }
    canvas._toggleFold = function () {
      target = target > 0.5 ? 0 : 1;
      if (!foldRafId) foldRafId = requestAnimationFrame(step);
    };
    function down(x, y) { if (t < 1) return; dragging = true; lx = x; ly = y; if (!foldRafId) foldRafId = requestAnimationFrame(step); }
    function move(x, y) {
      if (!dragging) return;
      var dx = x - lx, dy = y - ly;
      lx = x; ly = y;
      userRy += dx * 0.01; userRx += dy * 0.01;
    }
    function up() { dragging = false; }
    canvas.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
    canvas.addEventListener('touchstart', function (e) { var tv = e.touches[0]; down(tv.clientX, tv.clientY); }, { passive: true });
    document.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) { if (dragging) e.preventDefault(); var tv = e.touches[0]; move(tv.clientX, tv.clientY); }, { passive: false });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
    foldRafId = requestAnimationFrame(step);
  }
  /* ===== 立体图形 3D 展示（Canvas 投影渲染，支持正方体/长方体/棱锥/棱柱/圆柱/圆锥） ===== */
  function buildSolidShape(id) {
    var N = 18, i, a, v, f;
    if (id === 'cuboid') {
      v = [[-2, -1, -1], [2, -1, -1], [2, 1, -1], [-2, 1, -1], [-2, -1, 1], [2, -1, 1], [2, 1, 1], [-2, 1, 1]];
      f = [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [3, 7, 6, 2], [0, 1, 5, 4]];
      return { v: v, f: f };
    }
    if (id === 'pyramid') {
      v = [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, 1.5, 0]];
      f = [[0, 3, 2, 1], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]];
      return { v: v, f: f };
    }
    if (id === 'prism') {
      v = [[1, -1, 0], [-0.5, -1, 0.87], [-0.5, -1, -0.87], [1, 1, 0], [-0.5, 1, 0.87], [-0.5, 1, -0.87]];
      f = [[0, 1, 2], [3, 5, 4], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]];
      return { v: v, f: f };
    }
    if (id === 'cylinder') {
      v = []; f = [];
      for (i = 0; i < N; i++) { a = Math.PI * 2 * i / N; v.push([Math.cos(a), -1, Math.sin(a)]); }
      for (i = 0; i < N; i++) { a = Math.PI * 2 * i / N; v.push([Math.cos(a), 1, Math.sin(a)]); }
      var bot = [], top = [];
      for (i = 0; i < N; i++) bot.push(i);
      for (i = 0; i < N; i++) top.push(N + i);
      f.push(bot);
      f.push(top.slice().reverse());
      for (i = 0; i < N; i++) { var j = (i + 1) % N; f.push([i, j, N + j, N + i]); }
      return { v: v, f: f };
    }
    if (id === 'cone') {
      v = []; f = [];
      for (i = 0; i < N; i++) { a = Math.PI * 2 * i / N; v.push([Math.cos(a), -1, Math.sin(a)]); }
      v.push([0, 1.5, 0]);
      var b2 = [];
      for (i = 0; i < N; i++) b2.push(i);
      f.push(b2);
      for (i = 0; i < N; i++) { var j2 = (i + 1) % N; f.push([i, j2, N]); }
      return { v: v, f: f };
    }
    if (id === 'sphere') {
      var latN = 10, lonN = 18;
      v = []; f = [];
      for (i = 0; i <= latN; i++) {
        var theta = Math.PI * i / latN;
        var sy2 = Math.sin(theta), cy2 = Math.cos(theta);
        for (var lj = 0; lj < lonN; lj++) {
          var phi = Math.PI * 2 * lj / lonN;
          v.push([sy2 * Math.cos(phi), cy2, sy2 * Math.sin(phi)]);
        }
      }
      for (i = 0; i < latN; i++) {
        for (var lj2 = 0; lj2 < lonN; lj2++) {
          var pa = i * lonN + lj2;
          var pb = (lj2 === lonN - 1) ? i * lonN : pa + 1;
          var pc = (lj2 === lonN - 1) ? (i + 1) * lonN : pa + lonN + 1;
          var pd = pa + lonN;
          f.push([pa, pb, pc, pd]);
        }
      }
      return { v: v, f: f };
    }
    // 默认正方体
    v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    f = [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [3, 7, 6, 2], [0, 1, 5, 4]];
    return { v: v, f: f };
  }
  function renderSolid(canvas, shapeId, rx, ry) {
    var shape = buildSolidShape(shapeId);
    if (!shape) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var dpr = window.devicePixelRatio || 1;
    var lw = W / dpr, lh = H / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lw, lh);
    var cx = lw / 2, cy = lh / 2;
    var scale = Math.min(lw, lh) * 0.3;
    var fov = 5.5;
    var cyc = Math.cos(ry), syc = Math.sin(ry);
    var cxc = Math.cos(rx), sxc = Math.sin(rx);
    var pts = [], i, k;
    for (i = 0; i < shape.v.length; i++) {
      var x = shape.v[i][0], y = shape.v[i][1], z = shape.v[i][2];
      var x1 = x * cyc + z * syc;
      var z1 = -x * syc + z * cyc;
      var y2 = y * cxc - z1 * sxc;
      var z2 = y * sxc + z1 * cxc;
      var s = fov / (fov + z2);
      pts.push([cx + x1 * scale * s, cy - y2 * scale * s, z2]);
    }
    var faces = [];
    for (i = 0; i < shape.f.length; i++) {
      var face = shape.f[i], ds = 0;
      for (k = 0; k < face.length; k++) ds += pts[face[k]][2];
      faces.push({ idx: face, d: ds / face.length });
    }
    faces.sort(function (a, b) { return a.d - b.d; });
    for (i = 0; i < faces.length; i++) {
      var f2 = faces[i].idx;
      var t = Math.max(0, Math.min(1, (faces[i].d + 3) / 6));
      ctx.beginPath();
      for (k = 0; k < f2.length; k++) {
        var p = pts[f2[k]];
        if (k === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(79,110,247,' + (0.35 + t * 0.5).toFixed(2) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,84,212,0.9)';
      ctx.lineWidth = Math.max(1, scale * 0.02);
      ctx.stroke();
    }
  }
  var solidRafId = null;
  function bindSolidView(canvas, shape) {
    var dpr = window.devicePixelRatio || 1;
    var LW = 480, LH = 380;
    canvas.width = LW * dpr;
    canvas.height = LH * dpr;
    if (solidRafId) { cancelAnimationFrame(solidRafId); solidRafId = null; }
    var rx = -0.35, ry = 0.5;
    var dragging = false, lx = 0, ly = 0, vx = 0, vy = 0;
    function draw() {
      if (!dragging) {
        ry += 0.006;
        if (Math.abs(vx) > 0.0005 || Math.abs(vy) > 0.0005) { rx += vy; ry += vx; vx *= 0.94; vy *= 0.94; }
        else { vx = 0; vy = 0; }
      }
      renderSolid(canvas, shape, rx, ry);
      solidRafId = requestAnimationFrame(draw);
    }
    solidRafId = requestAnimationFrame(draw);
    function down(x, y) { dragging = true; lx = x; ly = y; vx = 0; vy = 0; }
    function move(x, y) {
      if (!dragging) return;
      var dx = x - lx, dy = y - ly;
      lx = x; ly = y;
      ry += dx * 0.01; rx += dy * 0.01;
      vx = dx * 0.01; vy = dy * 0.01;
    }
    function up() { dragging = false; }
    canvas.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
    canvas.addEventListener('touchstart', function (e) { var t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    document.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) { if (dragging) e.preventDefault(); var t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
  }
  function bindCubeDrag(el, rx0, ry0) {
    var rx = (typeof rx0 === 'number') ? rx0 : -22, ry = (typeof ry0 === 'number') ? ry0 : 32;
    var dragging = false, lx = 0, ly = 0;
    var vx = 0, vy = 0, rafId = null;

    function apply() { el.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; }
    function stopInertia() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    function inertia() {
      if (!dragging && (Math.abs(vx) > 0.03 || Math.abs(vy) > 0.03)) {
        rx += vy; ry += vx;
        vx *= 0.94; vy *= 0.94;
        apply();
        rafId = requestAnimationFrame(inertia);
      } else {
        vx = 0; vy = 0; rafId = null;
      }
    }
    function down(x, y) { dragging = true; lx = x; ly = y; vx = 0; vy = 0; stopInertia(); el.style.cursor = 'grabbing'; }
    function move(x, y) {
      if (!dragging) return;
      var dx = x - lx, dy = y - ly;
      lx = x; ly = y;
      ry += dx * 0.6; rx += dy * 0.6;
      vx = dx * 0.6; vy = dy * 0.6;
      apply();
    }
    function up() {
      if (!dragging) return;
      dragging = false; el.style.cursor = 'grab';
      stopInertia();
      rafId = requestAnimationFrame(inertia);
    }
    el.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
    el.addEventListener('touchstart', function (e) { var t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    document.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    document.addEventListener('touchmove', function (e) { if (dragging) e.preventDefault(); var t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
    document.addEventListener('mouseup', up);
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
  }

  function renderDailyReport() {
    var el = $('dailyReport');
    if (!dailyReport) { el.className = 'daily-report'; el.innerHTML = ''; return; }
    var html = '';
    if (dailyReport.kind === 'mental') {
      var acc = dailyReport.n ? Math.round(dailyReport.correct / dailyReport.n * 100) : 0;
      html += '<div class="dr-row"><span>⏱ 总耗时</span><b>' + fmtMs(dailyReport.totalMs) + '</b></div>';
      html += '<div class="dr-row"><span>⚡ 平均每题</span><b>' + (dailyReport.avgMs / 1000).toFixed(1) + ' 秒</b></div>';
      html += '<div class="dr-row"><span>🎯 正确率</span><b>' + acc + '%</b></div>';
      if (dailyReport.yAvgMs > 0) {
        var d = Math.round((dailyReport.yAvgMs - dailyReport.avgMs) / 100) / 10;
        html += '<div class="dr-row"><span>📊 对比昨天</span><b>' + (d >= 0 ? '快了 ' + d.toFixed(1) + ' 秒/题 🎉' : '慢了 ' + (-d).toFixed(1) + ' 秒/题，继续加油') + '</b></div>';
      } else {
        html += '<div class="dr-row"><span>📊 对比昨天</span><b>昨天没有记录，今天起开始积累</b></div>';
      }
      var maxT = 0;
      dailyReport.per.forEach(function (t) { if (t > maxT) maxT = t; });
      html += '<div class="dr-bars">';
      dailyReport.per.forEach(function (t, i) {
        html += '<span class="dr-chip' + (dailyReport.ok[i] ? '' : ' bad') + '">' + (i + 1) + '. ' + (t / 1000).toFixed(1) + 's</span>';
      });
      html += '</div>';
    } else if (dailyReport.kind === 'think') {
      var tacc = dailyReport.n ? Math.round(dailyReport.correct / dailyReport.n * 100) : 0;
      html += '<div class="dr-row"><span>🎯 正确率</span><b>' + tacc + '%</b></div>';
      html += '<div class="dr-row"><span>📈 累计答对</span><b>' + (save.thinkTotal || 0) + ' 题</b></div>';
      html += '<div class="dr-row"><span>🔥 连续打卡</span><b>' + (save.thinkStreak || 0) + ' 天</b></div>';
      if (dailyReport.correct === dailyReport.n) html += '<div class="dr-row"><span>🌟</span><b>全部答对，思维力爆棚！</b></div>';
    } else if (dailyReport.kind === 'wordlib') {
      html += '<div class="dr-row"><span>📚 词库关卡</span><b>答对 ' + dailyReport.correct + ' / ' + dailyReport.n + ' 词</b></div>';
    } else {
      html += '<div class="dr-row"><span>📖 本局模式</span><b>' + (dailyIsReview ? '错词复习' : '新词闯关') + '</b></div>';
      html += '<div class="dr-row"><span>📚 词库进度</span><b>已练 ' + dailyReport.lib.seen + ' / ' + dailyReport.lib.lib + ' 词 · 熟词 ' + dailyReport.lib.known + ' · 待复习 ' + dailyReport.lib.review + '</b></div>';
      if (dailyReport.correct === dailyReport.n) html += '<div class="dr-row"><span>🌟</span><b>全部拼对，太厉害了！</b></div>';
    }
    el.innerHTML = html;
    el.className = 'daily-report show';
  }
  function finishFlash() {
    dailyReport = null;
    earnedXp += 20; // 完成奖励
    save.xp += earnedXp;
    save.stars += flashKnown;
    earnedFood = flashKnown + petFoodBonus();
    save.food = (save.food || 0) + earnedFood;
    save.rounds++;
    if (curSubject) {
      if (!save.subjectCorrect[curSubject]) save.subjectCorrect[curSubject] = 0;
      save.subjectCorrect[curSubject] += flashKnown;
    }
    unlockBadges();
    persist();
    updateTopbar();
    showResult();
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function getQuestions(subjectId, grade) {
    var all = BANK[subjectId] || [];
    var list = all.filter(function (q) { return q.g.indexOf(grade) !== -1; });
    if (list.length === 0) list = all;
    return shuffle(list).slice(0, QUESTIONS_PER_ROUND);
  }

