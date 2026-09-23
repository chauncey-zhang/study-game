'use strict';
  /* ===================== 页面切换 ===================== */
  function showScreen(name) {
    $('homeScreen').classList.add('hidden');
    $('levelMapScreen').classList.add('hidden');
    $('battleScreen').classList.add('hidden');
    $('resultScreen').classList.add('hidden');
    $('mentalHubScreen').classList.add('hidden');
    $('wordHubScreen').classList.add('hidden');
    $('wordLibScreen').classList.add('hidden');
    $('classicHubScreen').classList.add('hidden');
    $('classicBookScreen').classList.add('hidden');
    $('thinkHubScreen').classList.add('hidden');
    $('writingHubScreen').classList.add('hidden');
    $('pinyinHubScreen').classList.add('hidden');
    $('phonicsHubScreen').classList.add('hidden');
    $('storiesHubScreen').classList.add('hidden');
    $('grammarHubScreen').classList.add('hidden');
    $('gameHubScreen').classList.add('hidden');
    $('gamePlayScreen').classList.add('hidden');
    if (name === 'home') $('homeScreen').classList.remove('hidden');
    else if (name === 'levelMap') $('levelMapScreen').classList.remove('hidden');
    else if (name === 'battle') $('battleScreen').classList.remove('hidden');
    else if (name === 'result') $('resultScreen').classList.remove('hidden');
    else if (name === 'mentalHub') $('mentalHubScreen').classList.remove('hidden');
    else if (name === 'wordHub') $('wordHubScreen').classList.remove('hidden');
    else if (name === 'wordLib') $('wordLibScreen').classList.remove('hidden');
    else if (name === 'classicHub') $('classicHubScreen').classList.remove('hidden');
    else if (name === 'classicBook') $('classicBookScreen').classList.remove('hidden');
    else if (name === 'thinkHub') $('thinkHubScreen').classList.remove('hidden');
    else if (name === 'writingHub') $('writingHubScreen').classList.remove('hidden');
    else if (name === 'pinyinHub') $('pinyinHubScreen').classList.remove('hidden');
    else if (name === 'phonicsHub') $('phonicsHubScreen').classList.remove('hidden');
    else if (name === 'storiesHub') $('storiesHubScreen').classList.remove('hidden');
    else if (name === 'grammarHub') $('grammarHubScreen').classList.remove('hidden');
    else if (name === 'gameHub') $('gameHubScreen').classList.remove('hidden');
    else if (name === 'gamePlay') $('gamePlayScreen').classList.remove('hidden');
  }
  function goHome() { SFX.click(); setHash('g' + curGrade); showScreen('home'); renderSubjects(); focusFirstNav($('homeScreen')); }

  /* ===================== Hash 路由（刷新/返回不丢页面） ===================== */
  var appHash = '';
  function setHash(h) {
    appHash = h;
    var target = '#/' + h;
    if (location.hash !== target) { try { location.hash = target; } catch (e) {} }
  }
  function applyHash() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    appHash = h;
    var p = h ? h.split('/') : [];
    function goHomeView() { renderGrades(); renderSubjects(); showScreen('home'); focusFirstNav($('homeScreen')); }
    if (p[0] === 'wrong') { startWrongBattle(); return; }
    if (p[0] === 'writing') { showWriting(); return; }
    if (p[0] === 'pinyin') { showPinyin(); return; }
    if (p[0] === 'phonics') { showPhonics(); return; }
    if (p[0] === 'stories') { showStories(); return; }
    if (p[0] === 'grammar') { showGrammar(); return; }
    if (p[0] === 'games') { showGameHub(); return; }
    if (p[0] === 'classics') { showClassics(); return; }
    if (p[0] === 'classic') {
      var cb = CLASSICS.filter(function (x) { return x.id === p[1]; })[0];
      if (!cb) { goHomeView(); return; }
      showClassicBook(cb.id);
      return;
    }
    if (p[0] === 'word-lib') {
      var g3 = parseInt((p[1] || '').replace('g', ''), 10);
      if (!(g3 >= 3 && g3 <= 9)) { goHomeView(); return; }
      wordLibGrade = g3;
      if (p[2] !== undefined && p[2] !== '') startWordLibLevel(g3, parseInt(p[2], 10) || 0);
      else showWordLib();
      return;
    }
    if (p[0] === 'think-hub' || p[0] === 'think-run') {
      var tg = parseInt((p[1] || '').replace('g', ''), 10);
      if (!(tg >= 1 && tg <= 9)) { goHomeView(); return; }
      curGrade = tg;
      renderGrades(); renderSubjects();
      if (p[0] === 'think-hub') showThinkHub();
      else { thinkCount = parseInt(p[2], 10) || 10; startDailyThink(); }
      return;
    }
    if (p[0] === 'mental-hub' || p[0] === 'word-hub' || p[0] === 'mental-run' || p[0] === 'word-run' || p[0] === 'word-review') {
      var g2 = parseInt((p[1] || '').replace('g', ''), 10);
      if (!(g2 >= 1 && g2 <= 9)) { goHomeView(); return; }
      curGrade = g2;
      renderGrades(); renderSubjects();
      if (p[0] === 'mental-hub') showMentalHub();
      else if (p[0] === 'word-hub') showWordHub();
      else if (p[0] === 'mental-run') { mentalCount = parseInt(p[2], 10) || 20; startDailyMental(); }
      else { wordCount = parseInt(p[2], 10) || 10; startDailyWord(p[0] === 'word-review'); }
      return;
    }
    if (p[0] === 'map' || p[0] === 'battle' || p[0] === 'mental' || p[0] === 'spelling' || p[0] === 'flash') {
      var subj = p[1], g = parseInt((p[2] || '').replace('g', ''), 10);
      var valid = SUBJECTS.some(function (s) { return s.id === subj; });
      if (!valid || !(g >= 1 && g <= 9)) { goHomeView(); return; }
      curGrade = g; curSubject = subj;
      renderGrades(); renderSubjects();
      if (p[0] === 'map') { renderLevelMap(); showScreen('levelMap'); focusFirstNav($('levelMapScreen')); }
      else if (p[0] === 'battle') {
        var lv = parseInt(p[3], 10) || 0;
        if (lv < 0 || lv >= getLevelCount(subj, g)) lv = 0;
        curMode = (p[4] === 'judge') ? 'judge' : 'adventure';
        startBattle(subj, lv);
      }
      else if (p[0] === 'mental') { curMode = 'mental'; startMental(); }
      else if (p[0] === 'spelling') { curMode = 'spelling'; startSpelling(); }
      else if (p[0] === 'flash') { curMode = 'flashcard'; startFlash(); }
      return;
    }
    if (/^g[1-9]$/.test(p[0] || '')) curGrade = parseInt(p[0].slice(1), 10);
    goHomeView();
  }
  window.addEventListener('hashchange', function () {
    var h = (location.hash || '').replace(/^#\/?/, '');
    if (h === appHash) return; // 程序内部设置的不处理，避免循环
    SFX.click();
    applyHash();
  });

  /* ===================== 遥控/键盘导航 ===================== */
  function focusFirstNav(scope) {
    var first = scope.querySelector('button:not(.hidden), [tabindex]');
    if (first) first.focus();
  }
  function navMove(dir) {
    var cur = document.activeElement;
    var group = cur && cur.closest('[data-nav]') ? cur.closest('[data-nav]') : null;
    var scope = group || document;
    var items = Array.prototype.slice.call(scope.querySelectorAll('button, [tabindex]')).filter(function (el) {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled;
    });
    if (!items.length) return false;
    if (!cur) { if (items[0]) items[0].focus(); return true; }
    if (items.indexOf(cur) === -1) items.unshift(cur);
    var r = cur.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var best = null, bestScore = Infinity;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (el === cur) continue;
      var er = el.getBoundingClientRect();
      var ex = er.left + er.width / 2, ey = er.top + er.height / 2;
      var dx = ex - cx, dy = ey - cy;
      var ok = false;
      if (dir === 'ArrowRight' && dx > 0) ok = true;
      else if (dir === 'ArrowLeft' && dx < 0) ok = true;
      else if (dir === 'ArrowDown' && dy > 0) ok = true;
      else if (dir === 'ArrowUp' && dy < 0) ok = true;
      if (!ok) continue;
      var dist = dx * dx + dy * dy;
      if (dist < bestScore) { bestScore = dist; best = el; }
    }
    if (best) {
      SFX.click();
      best.focus();
      best.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return true;
    }
    return false;
  }

  document.addEventListener('keydown', function (e) {
    ensureAudio();
    var key = e.key;
    var code = e.keyCode || e.which || 0;
    var tag = ((e.target && e.target.tagName) || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      // 输入框内：放行退格/方向键等所有编辑按键，仅 Esc 退出输入
      if (key === 'Escape') e.target.blur();
      return;
    }
    // 方向键（e.key 优先，e.keyCode 兜底，兼容部分电视浏览器）
    var dirMap = { 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown' };
    var dir = (key && key.indexOf('Arrow') === 0) ? key : dirMap[code];
    if (dir) {
      if (navMove(dir)) { e.preventDefault(); return; }
    }
    // 返回键：Escape / Backspace / KEYCODE_BACK(461) / 10009 / Android BACK(4)
    if (key === 'Escape' || key === 'Backspace' || code === 461 || code === 10009 || code === 4) {
      e.preventDefault();
      if ($('puppetModal').classList.contains('show')) closePuppet();
      else if ($('chapterModal').classList.contains('show')) closeChapter();
      else if ($('pinyinModal').classList.contains('show')) closePinyin();
      else if ($('phonicsModal').classList.contains('show')) closePhoDetail();
      else if ($('storyModal').classList.contains('show')) closeStory();
      else if ($('grammarModal').classList.contains('show')) closeGrammarDetail();
      else if (!$('gamePlayScreen').classList.contains('hidden')) { exitGame(); }
      else if ($('badgeModal').classList.contains('show')) closeBadge();
      else if ($('petModal').classList.contains('show')) closePetModal();
      else if ($('shopModal').classList.contains('show')) { $('shopModal').className = 'modal-mask'; }
      else if ($('userModal').classList.contains('show')) { $('userModal').className = 'modal-mask'; }
      else if ($('wrongModal').classList.contains('show')) { $('wrongModal').className = 'modal-mask'; }
      else if ($('signModal').classList.contains('show')) { $('signModal').className = 'modal-mask'; }
      else if (!$('resultScreen').classList.contains('hidden')) goMap();
      else if (!$('battleScreen').classList.contains('hidden')) goMap();
      else if (!$('levelMapScreen').classList.contains('hidden')) goHome();
      return;
    }
    // OK 键：Enter(13) / DPAD_CENTER(23)
    if (key === 'Enter' || code === 13 || code === 23) {
      var ae = document.activeElement;
      if (ae && ae.tagName === 'DIV' && ae.getAttribute('data-subject')) {
        e.preventDefault(); startBattle(ae.getAttribute('data-subject'));
      } else if (ae && ae.tagName === 'BUTTON' && code === 23) {
        // 部分电视 OK 键(DPAD_CENTER)不会自动触发 click，手动触发
        e.preventDefault(); ae.click();
      }
    }
  });
  // 首次任意交互解锁音频，并按用户偏好开播背景音乐
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      ensureAudio();
      if (musicOn && ensureMusic() && !musicTimer) scheduleBar();
    }, { once: true });
  });

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2200);
  }

  $('musicBtn').addEventListener('click', function () { setMusic(!musicOn); SFX.click(); });
  updateMusicBtn();
  $('badgeBtn').addEventListener('click', function () {
    SFX.click(); renderBadges();
    $('badgeModal').className = 'modal-mask show';
    $('badgeClose').focus();
  });
  $('badgeClose').addEventListener('click', closeBadge);
  function closeBadge() { SFX.click(); $('badgeModal').className = 'modal-mask'; $('badgeBtn').focus(); }
  $('petBtn').addEventListener('click', function () {
    SFX.click(); renderPetModal();
    $('petModal').className = 'modal-mask show';
    $('petClose').focus();
  });
  $('petClose').addEventListener('click', closePetModal);
  function closePetModal() { SFX.click(); $('petModal').className = 'modal-mask'; $('petBtn').focus(); }
  $('hatchBtn').addEventListener('click', hatchEgg);
  $('wrongBtn').addEventListener('click', function () {
    SFX.click(); renderWrongModal();
    $('wrongModal').className = 'modal-mask show';
    $('wrongClose').focus();
  });
  $('wrongClose').addEventListener('click', function () { SFX.click(); $('wrongModal').className = 'modal-mask'; });
  $('wrongStartBtn').addEventListener('click', function () {
    SFX.click(); $('wrongModal').className = 'modal-mask';
    startWrongBattle();
  });
  $('userBtn').addEventListener('click', function () {
    SFX.click(); renderUserModal();
    $('userModal').className = 'modal-mask show';
    $('userClose').focus();
  });
  $('userClose').addEventListener('click', function () { SFX.click(); $('userModal').className = 'modal-mask'; });
  $('userRegBtn').addEventListener('click', function () {
    var err = registerUser($('userNameInput').value, $('userPassInput').value);
    if (err) { toast('⚠️ ' + err); return; }
    SFX.levelup();
    toast('🎉 注册成功！进度已绑定用户：' + getCurrentUser());
    renderUserModal();
  });
  $('userLoginBtn').addEventListener('click', function () {
    var err = loginUser($('userNameInput').value, $('userPassInput').value);
    if (err) { toast('⚠️ ' + err); return; }
    SFX.levelup();
    toast('👋 欢迎回来，' + getCurrentUser() + '！');
    TTS.speak('欢迎回来，' + getCurrentUser(), 0.9);
    renderUserModal();
  });
  $('backupExportBtn').addEventListener('click', function () { SFX.click(); exportBackupCode(); });
  $('backupImportBtn').addEventListener('click', function () {
    importBackupText($('backupCode').value, false);
  });
  $('backupFileBtn').addEventListener('click', function () { SFX.click(); exportBackupFile(); });
  $('backupFileInBtn').addEventListener('click', function () { $('backupFileInput').click(); });
  $('backupFileInput').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () { importBackupText(r.result, true); };
    r.readAsText(f);
    e.target.value = '';
  });
  $('speakBtn').addEventListener('click', function () {
    var q = curQuestions[curIndex];
    if (!q) return;
    SFX.click();
    if (libWordMode && gameMode === 'spelling') TTS.speakEn(q.o[q.a]); // 词库闯关：朗读英文单词
    else speakQuestion(q);
  });
  $('mapBackBtn').addEventListener('click', goHome);
  $('backBtn').addEventListener('click', goMap);
  /* 专项训练入口与配置页 */
  $('mentalHubBtn').addEventListener('click', function () { SFX.click(); showMentalHub(); });
  $('wordHubBtn').addEventListener('click', function () { SFX.click(); showWordHub(); });
  $('mentalHubBack').addEventListener('click', goHome);
  $('wordHubBack').addEventListener('click', goHome);
  $('mentalStartBtn').addEventListener('click', function () { SFX.click(); startDailyMental(); });
  $('wordStartBtn').addEventListener('click', function () { SFX.click(); startDailyWord(false); });
  $('wordReviewBtn').addEventListener('click', function () { SFX.click(); startDailyWord(true); });
  $('wordLibBtn').addEventListener('click', function () { SFX.click(); showWordLib(); });
  $('wordLibBack').addEventListener('click', function () { SFX.click(); showWordHub(); });
  /* 思维素养 */
  $('thinkHubBtn').addEventListener('click', function () { SFX.click(); showThinkHub(); });
  $('thinkHubBack').addEventListener('click', goHome);
  $('thinkStartBtn').addEventListener('click', function () { SFX.click(); startDailyThink(); });
  $('thinkCustomBtn').addEventListener('click', function () { SFX.click(); applyCustomCount('think'); });
  /* 四大名著 */
  $('classicBtn').addEventListener('click', function () { SFX.click(); showClassics(); });
  $('classicBack').addEventListener('click', goHome);
  $('classicBookBack').addEventListener('click', function () { SFX.click(); showClassics(); });
  /* 章回阅读器 */
  $('chPrev').addEventListener('click', function () { SFX.click(); if (chState) chShow(chState.idx - 1); });
  $('chNext').addEventListener('click', function () { SFX.click(); if (chState) chShow(chState.idx + 1); });
  $('chRead').addEventListener('click', function () { SFX.click(); chRead(); });
  $('chAuto').addEventListener('click', chToggleAuto);
  $('chClose').addEventListener('click', function () { SFX.click(); closeChapter(); });
  /* 皮影戏控件 */
  $('ppPrev').addEventListener('click', function () { SFX.click(); if (ppState) ppShowScene(ppState.idx - 1); });
  $('ppNext').addEventListener('click', function () { SFX.click(); if (ppState) ppShowScene(ppState.idx + 1); });
  $('ppPlay').addEventListener('click', function () { SFX.click(); ppTogglePlay(); });
  $('ppSound').addEventListener('click', function () {
    SFX.click();
    if (!ppState) return;
    ppState.sound = !ppState.sound;
    $('ppSound').textContent = ppState.sound ? '🔊' : '🔇';
    $('ppSound').style.background = ppState.sound ? '' : '#fdeeee';
    if (!ppState.sound) { TTS.stop(); ppMusicStop(); if (ppMusicWasOn) ppDuckGlobalMusic(false); }
    else { if (ppMusicWasOn) ppDuckGlobalMusic(true); ppMusicStart(); TTS.speak(ppState.scenes[ppState.idx].line, 0.95, 1.2); }
  });
  $('ppClose').addEventListener('click', function () { SFX.click(); closePuppet(); });
  /* 自定义数量 */
  $('mentalCustomBtn').addEventListener('click', function () { SFX.click(); applyCustomCount('mental'); });
  $('wordCustomBtn').addEventListener('click', function () { SFX.click(); applyCustomCount('word'); });
  $('mentalCustomInput').addEventListener('keyup', function (e) { if (e.key === 'Enter') applyCustomCount('mental'); });
  $('wordCustomInput').addEventListener('keyup', function (e) { if (e.key === 'Enter') applyCustomCount('word'); });
  $('nextBtn').addEventListener('click', nextQuestion);
  $('retryBtn').addEventListener('click', function () {
    if (libWordMode) { startWordLibLevel(curGrade, curLevel); return; }
    if (dailyMode === 'mental') { startDailyMental(); return; }
    if (dailyMode === 'word') { startDailyWord(dailyIsReview); return; }
    if (lastWasFlash) { startFlash(); return; }
    if (lastFreeMode === 'mental') { startMental(); return; }
    if (lastFreeMode === 'spelling') { startSpelling(); return; }
    if (lastWrongMode) { startWrongBattle(); return; }
    startBattle(curSubject, curLevel);
  });
  $('nextLvBtn').addEventListener('click', function () {
    if (libWordMode) { startWordLibLevel(curGrade, curLevel + 1); return; }
    startBattle(curSubject, curLevel + 1);
  });
  $('homeBtn').addEventListener('click', goMap);

  function repeatStr(s, n) { var r = ''; for (var i = 0; i < n; i++) r += s; return r; }

