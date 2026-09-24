'use strict';

/* ===================== 英语音标学院（元音 / 辅音 / 清浊对比 / 音标挑战） ===================== */
var PHONICS = window.__PHONICS__ || { vowels: [], consonants: [], pairs: [] };
var phoTab = 'vowels';            // 当前 tab：vowels / consonants / pairs
var phoCurrent = null;            // 当前详情音标
var phoQuiz = null;               // 挑战状态 { idx, total, correct, wrong[] }
var phoLastQuiz = null;           // 最近一局结果（驱动 phonicsPerfect 成就，检查后复位）

function phoGroup() {
  if (phoTab === 'consonants') return PHONICS.consonants;
  if (phoTab === 'pairs') return PHONICS.pairs;
  return PHONICS.vowels;
}
/* 机构内按 sym 找音标 */
function phoFind(sym) {
  var i;
  for (i = 0; i < PHONICS.vowels.length; i++) if (PHONICS.vowels[i].sym === sym) return PHONICS.vowels[i];
  for (i = 0; i < PHONICS.consonants.length; i++) if (PHONICS.consonants[i].sym === sym) return PHONICS.consonants[i];
  return null;
}

/* ===================== 主页 ===================== */
function showPhonics() {
  setHash('phonics');
  renderPhoneticDaily();
  renderPhoTabs();
  renderPhoList();
  showScreen('phonicsHub');
  focusFirstNav($('phonicsHubScreen'));
}
function renderPhoneticDaily() {
  var all = [];
  PHONICS.vowels.forEach(function (v) { all.push(v); });
  PHONICS.consonants.forEach(function (c) { all.push(c); });
  if (!all.length) { $('phoDaily').innerHTML = ''; return; }
  var d = new Date();
  var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  var it = all[seed % all.length];
  $('phoDaily').innerHTML = '<div class="w-daily-icon">🔊</div>' +
    '<div class="w-daily-body"><div class="w-daily-label">今日一音</div>' +
    '<div class="w-daily-text">/' + it.sym + '/ → 例词 ' + it.words[0].w + ' ' + it.words[0].ph + '</div></div>' +
    '<button class="w-speak pho-daily-say" data-sym="' + it.sym + '">🔊</button>';
}
function renderPhoTabs() {
  var tabs = [
    { id: 'vowels', icon: '🔤', name: '元音 (20)' },
    { id: 'consonants', icon: '🧩', name: '辅音 (28)' },
    { id: 'pairs', icon: '🤝', name: '清浊对比' },
    { id: 'quiz', icon: '🏆', name: '音标挑战' }
  ];
  var el = $('phoTabs'); el.innerHTML = '';
  tabs.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'writing-tab' + (phoTab === t.id ? ' active' : '');
    b.textContent = t.icon + ' ' + t.name;
    b.addEventListener('click', function () {
      SFX.click();
      phoTab = t.id;
      renderPhoTabs();
      renderPhoList();
      focusFirstNav($('phonicsHubScreen'));
    });
    el.appendChild(b);
  });
}
function renderPhoList() {
  var el = $('phoList'); el.innerHTML = '';
  if (phoTab === 'quiz') { renderPhoQuiz(el); return; }
  if (phoTab === 'pairs') { renderPhoPairs(el); return; }
  var group = phoGroup();
  var html = '', lastGroup = '';
  group.forEach(function (it) {
    if (it.group && it.group !== lastGroup) {
      lastGroup = it.group;
      html += '<div class="w-cat-title">🎯 ' + it.group + '</div>';
    }
    html += '<div class="py-item pho-item" data-sym="' + it.sym + '">' +
      '<div class="py-item-ch pho-sym">' + it.sym + '</div>' +
      '<div class="py-item-info"><div class="py-item-name">' + it.hint + ' · ' + it.tip + '</div>' +
      '<div class="py-item-word">例词 ' + it.words[0].w + ' ' + it.words[0].ph + (it.words[1] ? ' · ' + it.words[1].w + ' ' + it.words[1].ph : '') + '</div></div>' +
      '<button class="w-speak pho-read" data-sym="' + it.sym + '">🔊</button>' +
      '</div>';
  });
  el.innerHTML = html;
  /* 事件：点击卡片进详情 / 朗读 */
  Array.prototype.forEach.call(el.querySelectorAll('.pho-item'), function (card) {
    card.addEventListener('click', function (e) {
      if (e.target && e.target.className && String(e.target.className).indexOf('pho-read') !== -1) return;
      SFX.click();
      var item = phoFind(card.getAttribute('data-sym'));
      if (item) openPhoDetail(item);
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll('.pho-read'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      var item = phoFind(btn.getAttribute('data-sym'));
      if (!item) return;
      speakPhoSound(item);
    });
  });
  var body = $('phonicsHubScreen').querySelector('.hub-body');
  if (body) body.scrollTop = 0;
}
/* 清浊对比 tab */
function renderPhoPairs(el) {
  var html = '';
  PHONICS.pairs.forEach(function (p) {
    var vk = phoFind(p.voiceless), vd = phoFind(p.voiced);
    if (!vk || !vd) return;
    html += '<div class="pho-pair">' +
      '<div class="pho-pair-head"><span class="pho-pair-tag">清音</span>' +
      '<button class="pho-pair-sym pho-read" data-sym="' + vk.sym + '">' + vk.sym + '</button>' +
      '<button class="pho-pair-sym pho-read" data-sym="' + vd.sym + '">' + vd.sym + '</button>' +
      '<span class="pho-pair-tag">浊音</span><span class="pho-pair-name">' + vk.hint + ' ↔ ' + vd.hint + '</span></div>' +
      '<div class="pho-pair-note">💬 ' + p.note + '</div>' +
      '<div class="pho-pair-words">例词 ' + vk.words[0].w + ' ' + vk.words[0].ph + ' · ' + vd.words[0].w + ' ' + vd.words[0].ph + '</div>' +
      '</div>';
  });
  el.innerHTML = html || '<div class="hub-card">暂时没有清浊对比数据</div>';
  Array.prototype.forEach.call(el.querySelectorAll('.pho-read'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation(); e.preventDefault();
      SFX.click();
      var item = phoFind(btn.getAttribute('data-sym'));
      if (item) speakPhoSound(item);
    });
  });
}
/* 朗读一个音标的"声音"。
 * 浏览器 TTS 无法直接读 IPA 音标（/iː/ 会被读成 slash i），故用数据里的「拼音近似读法」(hint，
 * 如 /iː/→"衣"、/eɪ/→"诶衣"、/p/→"泼") 用中文语音近似还原音标发音，先让孩子听到音标近似音，
 * 再跟读例词，方便对照口型模仿——即「先读音标、再读例词」，修复此前只读例词的问题。 */
function speakPhoSound(item) {
  if (!item) return;
  var words = [];
  item.words.forEach(function (w) { words.push(w.w); });
  var approx = (item.hint || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ''); // 去掉 (长)/(清) 等描述标注
  if (approx) {
    TTS.speak(approx, 0.8, 1.1, function () {
      setTimeout(function () { TTS.speakEn(words.join(', ')); }, 350); // 近似音读完，再跟读例词
    });
  } else {
    TTS.speakEn(words.join(', '));
  }
}
/* 音标挑战（听音选音标 / 看音标选例词 交替，10 题一局） */
function renderPhoQuiz(el) {
  var done = save.phonicsDone || 0, total = save.phonicsTotal || 0;
  var best = save.phonicsBest >= 1 ? save.phonicsBest : 0;
  var html =
    '<div class="hub-card pho-quiz-card">' +
    '<div class="pho-quiz-stats"><span>📊 累计练习 <b>' + total + '</b> 题 · 答对 <b>' + done + '</b></span><span>🏅 最佳 <b>' + best + '%</b></span></div>' +
    '<div class="pho-quiz-desc">💡 每局 10 题：✅ 听读音选正确音标 · 👂 看音标选正确例词（带发音）。全对解锁成就！</div>' +
    '<button class="btn btn-primary hub-start" id="phoQuizStart">🏁 开始挑战</button>' +
    '</div>';
  el.innerHTML = html;
  $('phoQuizStart').addEventListener('click', function () {
    SFX.click(); startPhoQuiz();
  });
}
function startPhoQuiz() {
  /* 从元音+辅音中随机选 10 个不重复音标 */
  var pool = [];
  PHONICS.vowels.forEach(function (v) { pool.push(v); });
  PHONICS.consonants.forEach(function (c) { pool.push(c); });
  /* 洗牌 */
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  var items = pool.slice(0, 10);
  phoQuiz = { idx: 0, total: items.length, correct: 0, items: items, wrong: [] };
  renderPhoQuizQ();
}
function renderPhoQuizQ() {
  var q = phoQuiz;
  var it = q.items[q.idx];
  var el = $('phoList');
  /* 题型：偶数题听读音选音标，奇数题看音标选读法 */
  var listenMode = (q.idx % 2 === 0);
  var html = '<div class="hub-card">' +
    '<div class="pho-q-progress">第 ' + (q.idx + 1) + ' / ' + q.total + ' 题 · 已答对 ' + q.correct + '</div>' +
    '<div class="pho-q-mode">' + (listenMode ? '🎧 听读音，选音标' : '👀 看音标，选读法') + '</div>';
  if (listenMode) {
    html += '<div class="pho-q-listen">' +
      '<button class="btn btn-gold" id="phoQSay" style="padding:.6rem 1.3rem;font-size:1.05rem">🔊 听读音</button>' +
      '<div class="pho-q-hint">听一听例词的发音，选出正确的音标</div></div>';
  } else {
    html += '<div class="pho-q-sym">/' + it.sym + '/</div>' +
      '<div class="pho-q-hint">这个音标该怎么读？</div>';
  }
  /* 4 个选项（去重后洗牌） */
  var opts = phoQuizOptions(it, listenMode);
  html += '<div class="pho-opts">';
  opts.forEach(function (val, oi) {
    html += '<button class="pho-opt" data-val="' + val + '" data-i="' + oi + '">' + val + '</button>';
  });
  html += '</div>';
  html += '<div class="pho-q-fb" id="phoQFb"></div></div>';
  el.innerHTML = html;
  var qSay = $('phoQSay');
  if (qSay) qSay.addEventListener('click', function () { SFX.click(); speakPhoSound(it); });
  if (listenMode) setTimeout(function () { if ($('phoQSay')) { SFX.click(); speakPhoSound(it); } }, 350);
  Array.prototype.forEach.call(el.querySelectorAll('.pho-opt'), function (btn) {
    btn.addEventListener('click', function () {
      var oi = parseInt(btn.getAttribute('data-i'), 10);
      answerPhoQuizQ(oi);
    });
  });
  focusFirstNav($('phonicsHubScreen'));
}
function phoQuizOptions(it, listenMode) {
  /* 返回 4 个选项字符串（一个正确 + 三个去重干扰） */
  var pool = [];
  PHONICS.vowels.forEach(function (v) { pool.push(v); });
  PHONICS.consonants.forEach(function (c) { pool.push(c); });
  function valOf(o) { return listenMode ? o.sym : o.hint; }
  var chosen = [it];
  var used = {}; used[valOf(it)] = 1;
  var tried = 0;
  while (chosen.length < 4 && tried < 300) {
    tried++;
    var o = pool[Math.floor(Math.random() * pool.length)];
    var v = valOf(o);
    if (used[v]) continue;
    used[v] = 1;
    chosen.push(o);
  }
  /* 洗牌选项 */
  for (var i = chosen.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = chosen[i]; chosen[i] = chosen[j]; chosen[j] = t;
  }
  return chosen.map(valOf);
}
function answerPhoQuizQ(oi) {
  var q = phoQuiz;
  var it = q.items[q.idx];
  var listenMode = (q.idx % 2 === 0);
  var ansVal = listenMode ? it.sym : it.hint;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.pho-opt'));
  var isCorrect = buttons[oi] && buttons[oi].getAttribute('data-val') === ansVal;
  buttons.forEach(function (b) {
    b.classList.add('disabled');
    if (b.getAttribute('data-val') === ansVal) b.classList.add('correct');
  });
  if (!isCorrect && buttons[oi]) buttons[oi].classList.add('wrong');
  if (isCorrect) {
    q.correct++;
    SFX.correct();
  } else {
    q.wrong.push(it.sym);
    SFX.wrong();
  }
  var fb = $('phoQFb');
  if (fb) {
    fb.innerHTML = (isCorrect ? '✅ 答对了！' : '❌ 正确答案是 ' + ansVal) +
      ' <button class="btn btn-outline" id="phoQNext" style="padding:.3rem .8rem;font-size:.82rem">下一题 ➡️</button>';
    $('phoQNext').addEventListener('click', nextPhoQuizQ);
  }
}
function nextPhoQuizQ() {
  var q = phoQuiz;
  TTS.stop();
  if (q.idx < q.total - 1) {
    q.idx++;
    renderPhoQuizQ();
  } else {
    finishPhoQuiz();
  }
}
function finishPhoQuiz() {
  var q = phoQuiz;
  var rate = Math.round(q.correct / q.total * 100);
  /* 存档：累计题数 + 最佳正确率 */
  save.phonicsDone = (save.phonicsDone || 0) + q.correct;
  save.phonicsTotal = (save.phonicsTotal || 0) + q.total;
  save.phonicsBest = Math.max((save.phonicsBest || 0), rate);
  phoLastQuiz = { total: q.total, correct: q.correct }; // 供成就检查
  /* 每日打卡（驱动 phonics7 成就） */
  var dk = todayStr(0);
  if (!save.phonicsLog) save.phonicsLog = {};
  var firstToday = !save.phonicsLog[dk];
  if (firstToday) save.phonicsLog[dk] = { n: q.correct, total: q.total };
  else { save.phonicsLog[dk].n += q.correct; save.phonicsLog[dk].total += q.total; }
  persist();
  unlockBadges();
  phoLastQuiz = null;
  var emoji = rate >= 90 ? '🏆' : (rate >= 60 ? '🎉' : '💪');
  var html = '<div class="hub-card pho-result">' +
    '<div class="pho-result-emoji">' + emoji + '</div>' +
    '<div class="pho-result-title">' + (rate >= 90 ? '音标小达人！' : (rate >= 60 ? '不错哦，继续加油！' : '再练一次，一定能行！')) + '</div>' +
    '<div class="pho-result-sub">答对 ' + q.correct + ' / ' + q.total + ' 题 · 正确率 <b>' + rate + '%</b>（历史最佳 ' + (save.phonicsBest || rate) + '%）</div>';
  if (q.wrong.length) {
    html += '<div class="pho-result-wrong">❌ 需要复习的音标：' + q.wrong.join(' 、 ') + '</div>';
  }
  html += '<button class="btn btn-primary hub-start" id="phoQuizAgain" style="margin-top:.6rem">🔁 再练一局</button></div>';
  $('phoList').innerHTML = html;
  $('phoQuizAgain').addEventListener('click', function () { SFX.click(); startPhoQuiz(); });
  if (rate >= 60) setTimeout(function () { TTS.speak('音标挑战完成！答对' + q.correct + '题，你真棒！', 0.9); }, 400);
}

/* ===================== 详情弹窗 ===================== */
var phoPairShown = false; // 详情页是否展示清浊对比
function openPhoDetail(item) {
  phoCurrent = item;
  phoPairShown = false;
  $('phoTitle').textContent = '/' + item.sym + '/';
  $('phoBig').textContent = '/' + item.sym + '/';
  $('phoType').textContent = (item.group || '') + ' · ' + item.hint;
  $('phoMouth').innerHTML = '<b>👄 口型要领：</b>' + item.mouth;
  $('phoTip').innerHTML = '<b>💡 记忆口诀：</b>' + item.tip;
  $('phoSpells').innerHTML = '<b>🔠 常见拼写：</b>' + item.spells;
  var wordsHtml = '';
  item.words.forEach(function (w) {
    wordsHtml += '<div class="pho-word">' + w.w + ' <span class="pho-word-ph">' + w.ph + '</span></div>';
  });
  $('phoWords').innerHTML = '<b>📝 例词：</b>' + wordsHtml;
  renderPhoPairInfo(item);
  $('phonicsModal').className = 'modal-mask show';
  $('phoReadBtn').focus();
}
function renderPhoPairInfo(item) {
  /* 找该音标是否有清浊配对，展示对比 */
  var el = $('phoPairInfo');
  var html = '';
  PHONICS.pairs.forEach(function (p) {
    var isV = p.voiceless === item.sym, isD = p.voiced === item.sym;
    if (!isV && !isD) return;
    var otherSym = isV ? p.voiced : p.voiceless;
    var other = phoFind(otherSym);
    if (!other) return;
    html = '<div class="pho-pair-box"><button class="pho-pair-btn" data-sym="' + otherSym + '">对比 ' + (isV ? '浊音' : '清音') + ' /' + otherSym + '/ 🔊</button>' +
      '<div class="pho-pair-info">' + p.note + '</div></div>';
  });
  if (html) phoPairShown = true;
  el.innerHTML = html;
  var btn = el.querySelector('.pho-pair-btn');
  if (btn) btn.addEventListener('click', function () {
    SFX.click();
    var o = phoFind(btn.getAttribute('data-sym'));
    if (o) speakPhoSound(o);
  });
}
function closePhoDetail() {
  SFX.click();
  TTS.stop();
  phoCurrent = null;
  $('phonicsModal').className = 'modal-mask';
}

/* ===================== 事件绑定 ===================== */
$('phonicsBtn').addEventListener('click', function () { SFX.click(); showPhonics(); });
$('phonicsBack').addEventListener('click', goHome);
$('phonicsClose').addEventListener('click', closePhoDetail);
$('phoReadBtn').addEventListener('click', function () {
  if (!phoCurrent) return;
  SFX.click();
  speakPhoSound(phoCurrent);
});
/* 每日一音朗读（事件委托） */
$('phoDaily').addEventListener('click', function (e) {
  var btn = e.target && e.target.closest ? e.target.closest('.pho-daily-say') : null;
  if (!btn) return;
  SFX.click();
  var item = phoFind(btn.getAttribute('data-sym'));
  if (!item) return;
  speakPhoSound(item);
});