'use strict';

/* ===================== 语法课堂（分类浏览 / 来源讲解 / 例句 / 训练 / 收藏） ===================== */
var GRAMMAR = window.__GRAMMAR__ || { cats: [], list: [] };
var grammarTab = 'all';            // 当前 tab：all / word / tense / ... / favs / quiz
var grammarCurrent = null;         // 当前详情语法点
var grammarQuiz = null;            // 训练状态 { idx, total, correct, wrong[], items[] }
var grammarLastQuiz = null;        // 最近一局结果（驱动成就，检查后复位）
var GRAMMAR_FAV_KEY = 'grammar-favs';
var grammarFavs = [];
try { grammarFavs = JSON.parse(localStorage.getItem(GRAMMAR_FAV_KEY) || '[]'); } catch (e) { grammarFavs = []; }

function grammarFind(id) {
  for (var i = 0; i < GRAMMAR.list.length; i++) if (GRAMMAR.list[i].id === id) return GRAMMAR.list[i];
  return null;
}
function grammarCatName(catId) {
  for (var i = 0; i < GRAMMAR.cats.length; i++) if (GRAMMAR.cats[i].id === catId) return GRAMMAR.cats[i].icon + ' ' + GRAMMAR.cats[i].name;
  return '';
}
function isGrammarFav(id) { return grammarFavs.indexOf(id) !== -1; }
function toggleGrammarFav(id) {
  var i = grammarFavs.indexOf(id);
  if (i === -1) grammarFavs.push(id); else grammarFavs.splice(i, 1);
  try { localStorage.setItem(GRAMMAR_FAV_KEY, JSON.stringify(grammarFavs)); } catch (e) {}
}
function grammarGroup() {
  if (grammarTab === 'all') return GRAMMAR.list;
  if (grammarTab === 'favs') return GRAMMAR.list.filter(function (s) { return isGrammarFav(s.id); });
  return GRAMMAR.list.filter(function (s) { return s.cat === grammarTab; });
}

/* ===================== 主页 ===================== */
function showGrammar() {
  setHash('grammar');
  renderGrammarTabs();
  renderGrammarList();
  showScreen('grammarHub');
  focusFirstNav($('grammarHubScreen'));
}
function renderGrammarTabs() {
  var tabs = [{ id: 'all', icon: '📚', name: '全部 (' + GRAMMAR.list.length + ')' }];
  GRAMMAR.cats.forEach(function (c) {
    var n = GRAMMAR.list.filter(function (s) { return s.cat === c.id; }).length;
    tabs.push({ id: c.id, icon: c.icon, name: c.name + ' (' + n + ')' });
  });
  tabs.push({ id: 'favs', icon: '⭐', name: '收藏' });
  tabs.push({ id: 'quiz', icon: '🎯', name: '语法训练' });
  var el = $('grammarTabs'); el.innerHTML = '';
  tabs.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'writing-tab' + (grammarTab === t.id ? ' active' : '');
    b.textContent = t.icon + ' ' + t.name;
    b.addEventListener('click', function () {
      SFX.click();
      grammarTab = t.id;
      renderGrammarTabs();
      renderGrammarList();
      focusFirstNav($('grammarHubScreen'));
    });
    el.appendChild(b);
  });
}
function renderGrammarList() {
  var el = $('grammarList'); el.innerHTML = '';
  if (grammarTab === 'quiz') { renderGrammarQuizHome(el); return; }
  var group = grammarGroup();
  var html = '', lastCat = '';
  if (!group.length) { html = '<div class="hub-card">' + (grammarTab === 'favs' ? '还没有收藏～ 点语法点卡片右上角的 ☆ 就能收藏啦！' : '这个分类还没有语法点') + '</div>'; }
  group.forEach(function (g) {
    if (grammarTab === 'all' && g.cat !== lastCat) {
      lastCat = g.cat;
      html += '<div class="w-cat-title">' + grammarCatName(g.cat) + '</div>';
    }
    html += '<div class="gr-item" data-id="' + g.id + '">' + grammarFavHtml(g.id) +
      '<div class="gr-item-title">' + g.title + '</div>' +
      '<div class="gr-item-mn">🧠 ' + g.mnemonic + '</div>' +
      '<button class="w-speak gr-say" data-id="' + g.id + '">🔊</button></div>';
  });
  el.innerHTML = html;
  Array.prototype.forEach.call(el.querySelectorAll('.gr-item'), function (card) {
    card.addEventListener('click', function (e) {
      if (e.target && e.target.closest && (e.target.closest('.gr-say') || e.target.closest('.w-fav'))) return;
      SFX.click();
      var item = grammarFind(card.getAttribute('data-id'));
      if (item) openGrammarDetail(item);
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll('.gr-say'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      var item = grammarFind(btn.getAttribute('data-id'));
      if (item) speakGrammarMn(item);
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll('.w-fav'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      toggleGrammarFav(btn.getAttribute('data-fav'));
      renderGrammarList();
    });
  });
  var body = $('grammarHubScreen').querySelector('.hub-body');
  if (body) body.scrollTop = 0;
}
function grammarFavHtml(id) {
  var on = isGrammarFav(id);
  return '<button class="w-fav' + (on ? ' active' : '') + '" data-fav="' + id + '">' + (on ? '⭐' : '☆') + '</button>';
}
function speakGrammarMn(item) {
  if (!item) return;
  TTS.speak(item.mnemonic + '。' + item.origin, 0.88);
}

/* ===================== 详情弹窗 ===================== */
function openGrammarDetail(item) {
  grammarCurrent = item;
  $('grTitle').textContent = item.title;
  $('grMeta').innerHTML = '<span class="w-tag">' + grammarCatName(item.cat) + '</span>' +
    '<span class="w-tag">适用 ' + item.grade.join('、') + ' 年级</span>';
  $('grMnemonic').innerHTML = '<b>🧠 记忆口诀：</b>' + item.mnemonic;
  $('grOrigin').innerHTML = '<b>💡 为什么这么用：</b>' + item.origin;
  var kp = '';
  item.keyPoints.forEach(function (p) { kp += '<div class="gr-li">· ' + p + '</div>'; });
  $('grKeyPoints').innerHTML = '<b>📌 要点：</b>' + kp;
  $('grRule').innerHTML = '<b>📖 规则：</b>' + item.rule;
  var ex = '';
  item.examples.forEach(function (e2, i) {
    ex += '<div class="gr-ex"><div class="gr-ex-en">' + e2.en + '</div><div class="gr-ex-cn">' + e2.cn + '</div>' +
      '<button class="gr-ex-say" data-ex="' + i + '">🔊</button></div>';
  });
  $('grExamples').innerHTML = '<b>💬 示例：</b>' + ex;
  $('grTips').innerHTML = '<b>⚠️ 避坑：</b>' + item.tips;
  $('grFav').textContent = isGrammarFav(item.id) ? '⭐ 已收藏' : '☆ 收藏';
  $('grammarModal').className = 'modal-mask show';
  /* 例句朗读（事件委托） */
  Array.prototype.forEach.call($('grExamples').querySelectorAll('.gr-ex-say'), function (btn) {
    btn.addEventListener('click', function () {
      SFX.click();
      var i = parseInt(btn.getAttribute('data-ex'), 10);
      TTS.speakEn(item.examples[i].en);
    });
  });
  $('grReadBtn').focus();
}
function closeGrammarDetail() {
  SFX.click();
  TTS.stop();
  grammarCurrent = null;
  $('grammarModal').className = 'modal-mask';
}
function speakCurrentGrammar() {
  if (!grammarCurrent) return;
  TTS.speak(grammarCurrent.mnemonic + '。' + grammarCurrent.origin + '。' + grammarCurrent.rule, 0.85, 1.1, function () {
    var en = '';
    grammarCurrent.examples.forEach(function (e2) { en += e2.en + ' '; });
    TTS.speakEn(en);
  });
}

/* ===================== 训练 ===================== */
function renderGrammarQuizHome(el) {
  var done = save.grammarDone || 0, total = save.grammarTotal || 0;
  var best = save.grammarBest >= 1 ? save.grammarBest : 0;
  el.innerHTML = '<div class="hub-card pho-quiz-card">' +
    '<div class="pho-quiz-stats"><span>📊 累计答题 <b>' + total + '</b> · 答对 <b>' + done + '</b></span><span>🏅 最佳 <b>' + best + '%</b></span></div>' +
    '<div class="pho-quiz-desc">💡 每局 10 题，覆盖全部语法点。看题选答案，答完看解析，全对解锁成就！</div>' +
    '<button class="btn btn-primary hub-start" id="grQuizStart">🏁 开始训练</button></div>';
  $('grQuizStart').addEventListener('click', function () { SFX.click(); startGrammarQuiz(); });
}
function startGrammarQuiz(filterId) {
  var pool = [];
  GRAMMAR.list.forEach(function (g) {
    if (filterId && g.id !== filterId) return;
    (g.questions || []).forEach(function (q) { pool.push({ g: g, q: q }); });
  });
  if (!pool.length) { toast('该语法点暂无题目'); return; }
  /* 洗牌 */
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  var items = pool.slice(0, filterId ? pool.length : Math.min(10, pool.length));
  grammarQuiz = { idx: 0, total: items.length, correct: 0, items: items, wrong: [] };
  renderGrammarQuizQ();
}
function renderGrammarQuizQ() {
  var q = grammarQuiz;
  var it = q.items[q.idx];
  var el = $('grammarList');
  var html = '<div class="hub-card">' +
    '<div class="pho-q-progress">第 ' + (q.idx + 1) + ' / ' + q.total + ' 题 · 已答对 ' + q.correct + '</div>' +
    '<div class="gr-q-tag">' + it.g.title + '</div>' +
    '<div class="gr-q-text">' + it.q.q + '</div><div class="pho-opts">';
  it.q.o.forEach(function (o, oi) {
    html += '<button class="pho-opt" data-i="' + oi + '">' + o + '</button>';
  });
  html += '</div><div class="pho-q-fb" id="grQFb"></div></div>';
  el.innerHTML = html;
  Array.prototype.forEach.call(el.querySelectorAll('.pho-opt'), function (btn) {
    btn.addEventListener('click', function () {
      var oi = parseInt(btn.getAttribute('data-i'), 10);
      answerGrammarQuizQ(oi);
    });
  });
  focusFirstNav($('grammarHubScreen'));
}
function answerGrammarQuizQ(oi) {
  var q = grammarQuiz;
  var it = q.items[q.idx];
  var ans = it.q.a;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.pho-opt'));
  var isCorrect = oi === ans;
  buttons.forEach(function (b, bi) {
    b.classList.add('disabled');
    if (bi === ans) b.classList.add('correct');
    if (bi === oi && !isCorrect) b.classList.add('wrong');
  });
  if (isCorrect) { q.correct++; SFX.correct(); }
  else {
    q.wrong.push(it.g.title);
    addToWrongBook('英语', curGrade, it.q); // 错题入错题本（按题干去重，上限 50）
    persist();
    SFX.wrong();
  }
  var fb = $('grQFb');
  if (fb) {
    fb.innerHTML = (isCorrect ? '✅ 答对了！' : '❌ 正确答案是 ' + it.q.o[ans]) +
      (it.q.e ? '<div class="gr-q-e">💡 ' + it.q.e + '</div>' : '') +
      ' <button class="btn btn-outline" id="grQNext" style="padding:.3rem .8rem;font-size:.82rem;margin-left:auto">下一题 ➡️</button>';
    $('grQNext').addEventListener('click', nextGrammarQuizQ);
  }
}
function nextGrammarQuizQ() {
  var q = grammarQuiz;
  if (q.idx < q.total - 1) { q.idx++; renderGrammarQuizQ(); }
  else finishGrammarQuiz();
}
function finishGrammarQuiz() {
  var q = grammarQuiz;
  var rate = Math.round(q.correct / q.total * 100);
  save.grammarDone = (save.grammarDone || 0) + q.correct;
  save.grammarTotal = (save.grammarTotal || 0) + q.total;
  save.grammarBest = Math.max((save.grammarBest || 0), rate);
  grammarLastQuiz = { total: q.total, correct: q.correct };
  var dk = todayStr(0);
  if (!save.grammarLog) save.grammarLog = {};
  if (!save.grammarLog[dk]) {
    save.grammarLog[dk] = 1;
    save.grammarStreak = (save.grammarLast === todayStr(-1)) ? ((save.grammarStreak || 0) + 1) : 1;
    save.grammarLast = dk;
  }
  persist();
  unlockBadges();
  grammarLastQuiz = null;
  var emoji = rate >= 90 ? '🏆' : (rate >= 60 ? '🎉' : '💪');
  var html = '<div class="hub-card pho-result">' +
    '<div class="pho-result-emoji">' + emoji + '</div>' +
    '<div class="pho-result-title">' + (rate >= 90 ? '语法小达人！' : (rate >= 60 ? '不错哦，继续加油！' : '再练一次，一定能行！')) + '</div>' +
    '<div class="pho-result-sub">答对 ' + q.correct + ' / ' + q.total + ' 题 · 正确率 <b>' + rate + '%</b></div>';
  if (q.wrong.length) html += '<div class="pho-result-wrong">❌ 需要复习的语法：' + q.wrong.join(' 、 ') + '</div>';
  html += '<button class="btn btn-primary hub-start" id="grQuizAgain" style="margin-top:.6rem">🔁 再练一局</button></div>';
  $('grammarList').innerHTML = html;
  $('grQuizAgain').addEventListener('click', function () { SFX.click(); startGrammarQuiz(); });
}

/* ===================== 事件绑定 ===================== */
$('grammarBtn').addEventListener('click', function () { SFX.click(); showGrammar(); });
$('grammarBack').addEventListener('click', goHome);
$('grammarClose').addEventListener('click', closeGrammarDetail);
$('grReadBtn').addEventListener('click', function () { SFX.click(); speakCurrentGrammar(); });
$('grFav').addEventListener('click', function () {
  SFX.click();
  if (!grammarCurrent) return;
  toggleGrammarFav(grammarCurrent.id);
  $('grFav').textContent = isGrammarFav(grammarCurrent.id) ? '⭐ 已收藏' : '☆ 收藏';
});
$('grTrainBtn').addEventListener('click', function () {
  SFX.click();
  if (!grammarCurrent) return;
  var trainId = grammarCurrent.id; // 先捕获，closeGrammarDetail 会把 grammarCurrent 置空
  closeGrammarDetail();
  grammarTab = 'quiz';
  renderGrammarTabs();
  startGrammarQuiz(trainId);
});
$('grMnSay').addEventListener('click', function () {
  if (!grammarCurrent) return;
  SFX.click();
  speakGrammarMn(grammarCurrent);
});