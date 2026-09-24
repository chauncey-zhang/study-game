'use strict';
  /* ===================== 专项训练（口算 / 单词） ===================== */
  function wordOf(q) { return ((q && q.o && q.o[q.a]) || '').trim().toLowerCase(); }
  function isKnownWord(st) { return st && (st.s || 0) >= 2 && (st.w || 0) === 0; }
  function fmtMs(ms) { var s = Math.round((ms || 0) / 1000); return Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒'; }
  function wordLibStats() {
    var pool = spellingPool(curGrade);
    var seen = 0, known = 0, review = 0;
    pool.forEach(function (q) {
      var st = save.wordStats ? save.wordStats[wordOf(q)] : null;
      if (!st) return;
      seen++;
      if (isKnownWord(st)) known++;
      else if ((st.w || 0) > 0) review++;
    });
    return { lib: pool.length, seen: seen, known: known, review: review };
  }
  function renderCountChips(elId, opts, cur, onPick) {
    var el = $(elId); el.innerHTML = '';
    opts.forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'count-chip' + (cur === v ? ' active' : '');
      b.textContent = v;
      b.addEventListener('click', function () { SFX.click(); onPick(v); });
      el.appendChild(b);
    });
  }
  function applyCustomCount(kind) {
    var inp = $(kind === 'mental' ? 'mentalCustomInput' : (kind === 'think' ? 'thinkCustomInput' : 'wordCustomInput'));
    var v = parseInt(inp.value, 10);
    /* 不限制上限：只校验最小值，便于把固定题库（思维素养 175 题、单词 ~970 等）全部刷完 */
    if (!v || v < 5) { toast('请输入不小于 5 的数量'); return; }
    if (kind === 'mental') { mentalCount = v; renderMentalHub(); }
    else if (kind === 'think') { thinkCount = v; renderThinkHub(); }
    else { wordCount = v; renderWordHub(); }
    toast('✅ 已设置为每次 ' + v + (kind === 'word' ? ' 个单词' : ' 题'));
  }
  function showMentalHub() {
    setHash('mental-hub/g' + curGrade);
    renderMentalHub();
    showScreen('mentalHub');
    focusFirstNav($('mentalHubScreen'));
  }
  function renderMentalHub() {
    $('mentalHubSub').textContent = GRADE_LABEL[curGrade] + '年级 · 当前 ' + mentalCount + ' 题 · 答对赚 🍖';
    renderCountChips('mentalCountRow', [10, 20, 30, 50], mentalCount, function (v) { mentalCount = v; renderMentalHub(); });
    var log = save.mentalLog || {};
    var days = Object.keys(log).sort();
    $('mentalStreakInfo').innerHTML = '🔥 连续打卡 <b>' + (save.mentalStreak || 0) + '</b> 天 · 累计 <b>' + days.length + '</b> 天 · 今天' + (save.mentalLast === todayStr(0) ? '已打卡 ✅' : '还未打卡');
    var last7 = days.slice(-7).reverse();
    var maxAvg = 0;
    last7.forEach(function (d) { if (log[d].avgMs > maxAvg) maxAvg = log[d].avgMs; });
    var html = last7.length ? '' : '<div class="hub-info" style="color:var(--muted)">还没有记录，完成第一次口算特训吧！</div>';
    last7.forEach(function (d) {
      var e = log[d];
      var acc = e.total ? Math.round(e.n / e.total * 100) : 0;
      var w = maxAvg ? Math.max(8, Math.round(e.avgMs / maxAvg * 100)) : 8;
      html += '<div class="trend-row"><span class="td">' + d.slice(d.indexOf('-') + 1) + '</span><span class="bar-wrap"><i class="bar" style="width:' + w + '%"></i></span><span class="val">' + (e.avgMs / 1000).toFixed(1) + ' 秒/题 · ' + acc + '%</span></div>';
    });
    $('mentalTrend').innerHTML = html;
  }
  function showWordHub() {
    setHash('word-hub/g' + curGrade);
    renderWordHub();
    showScreen('wordHub');
    focusFirstNav($('wordHubScreen'));
  }
  function renderWordHub() {
    $('wordHubSub').textContent = GRADE_LABEL[curGrade] + '年级词库 · 拼对赚 🍖';
    renderCountChips('wordCountRow', [10, 20], wordCount, function (v) { wordCount = v; renderWordHub(); });
    var st = wordLibStats();
    $('wordStatsInfo').innerHTML = '📚 词库共 <b>' + st.lib + '</b> 词 · 已练 <b>' + st.seen + '</b> 词 · 熟词 <b>' + st.known + '</b> · 待复习 <b>' + st.review + '</b> 词<br><small style="color:var(--muted)">同一单词连续拼对 2 次且从未拼错 → 标记为熟词</small>';
    var rb = $('wordReviewBtn');
    rb.style.display = st.review > 0 ? 'block' : 'none';
    rb.textContent = '📖 复习错词（待复习 ' + st.review + ' 词）';
  }
  function startDailyMental() {
    var pool = shuffle(numericPool('math', curGrade)).slice(0, mentalCount);
    if (pool.length < 4) { toast('该年级口算题不足'); return; }
    freeMode = true; lastWasFlash = false; lastFreeMode = ''; wrongMode = false; battleWrongIdx = [];
    flashMode = false; dailyMode = 'mental'; dailyIsReview = false; dailyReport = null;
    gameMode = 'mental'; roundTimes = []; roundOk = []; spellLower = true;
    curSubject = 'math'; curLevel = 0;
    curQuestions = pool;
    setHash('mental-run/g' + curGrade + '/' + mentalCount);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0; earnedFood = 0;
    showScreen('battle');
    $('battleTitle').textContent = '🧮 口算特训';
    $('battleSub').textContent = GRADE_LABEL[curGrade] + '年级 · ' + pool.length + ' 题 · 逐题计时 · 答对赚🍖';
    renderBattlePet();
    renderBattle();
  }
  function startDailyWord(isReview) {
    var poolAll = spellingPool(curGrade);
    var pool;
    if (isReview) {
      var due = poolAll.filter(function (q) { var st = save.wordStats[wordOf(q)]; return st && (st.w || 0) > 0; });
      due.sort(function (a, b) { return (save.wordStats[wordOf(a)].t || 0) - (save.wordStats[wordOf(b)].t || 0); });
      var fresh = shuffle(poolAll.filter(function (q) { return !save.wordStats[wordOf(q)]; }));
      pool = due.concat(fresh).slice(0, wordCount);
    } else {
      var notKnown = poolAll.filter(function (q) { var st = save.wordStats[wordOf(q)]; return !st || !isKnownWord(st); });
      pool = shuffle(notKnown.length >= wordCount ? notKnown : poolAll).slice(0, wordCount);
    }
    if (pool.length < 4) { toast(isReview ? '暂无待复习的单词' : '该年级单词不足'); return; }
    freeMode = true; lastWasFlash = false; lastFreeMode = ''; wrongMode = false; battleWrongIdx = [];
    flashMode = false; dailyMode = 'word'; dailyIsReview = !!isReview; dailyReport = null;
    gameMode = 'spelling'; roundTimes = []; roundOk = []; spellLower = true;
    curSubject = 'english'; curLevel = 0;
    curQuestions = pool;
    setHash((isReview ? 'word-review' : 'word-run') + '/g' + curGrade + '/' + wordCount);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0; earnedFood = 0;
    showScreen('battle');
    $('battleTitle').textContent = isReview ? '📖 单词复习' : '🔤 单词特训';
    $('battleSub').textContent = GRADE_LABEL[curGrade] + '年级 · ' + pool.length + ' 词 · 拼对赚🍖';
    renderBattlePet();
    renderBattle();
  }
