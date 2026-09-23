'use strict';
  /* ===================== 关卡系统（RPG 冒险地图） ===================== */
  function gradeQuestions(subjectId, grade) {
    var all = BANK[subjectId] || [];
    var list = all.filter(function (q) { return q.g.indexOf(grade) !== -1; });
    return list.length ? list : all;
  }
  function getLevelCount(subjectId, grade) {
    return Math.max(1, Math.ceil(gradeQuestions(subjectId, grade).length / QUESTIONS_PER_LEVEL));
  }
  // 选项每次洗牌（题干固定 → 关卡结构稳定，又防止背选项位置）
  function shuffleOptions(q) {
    var idx = shuffle([0, 1, 2, 3].slice(0, q.o.length));
    return { q: q.q, o: idx.map(function (i) { return q.o[i]; }), a: idx.indexOf(q.a), e: q.e, g: q.g };
  }
  function getLevelQuestions(subjectId, grade, lv) {
    var start = lv * QUESTIONS_PER_LEVEL;
    return gradeQuestions(subjectId, grade).slice(start, start + QUESTIONS_PER_LEVEL).map(shuffleOptions);
  }
  function levelStarsOf(subjectId, grade, lv) {
    var m = (save.levelStars[subjectId] || {})[grade] || {};
    return m[lv] || 0;
  }
  function isLevelUnlocked(subjectId, grade, lv) {
    return lv === 0 || levelStarsOf(subjectId, grade, lv - 1) >= 1;
  }
  function setLevelStars(subjectId, grade, lv, stars) {
    if (!save.levelStars[subjectId]) save.levelStars[subjectId] = {};
    if (!save.levelStars[subjectId][grade]) save.levelStars[subjectId][grade] = {};
    if (stars > (save.levelStars[subjectId][grade][lv] || 0)) save.levelStars[subjectId][grade][lv] = stars;
  }
  function openLevelMap(subjectId) {
    SFX.click();
    curSubject = subjectId;
    setHash('map/' + subjectId + '/g' + curGrade);
    renderLevelMap();
    showScreen('levelMap');
    focusFirstNav($('levelMapScreen'));
  }
  var MAP_PAGE_SIZE = 28, mapPage = 0;
  function renderLevelMap() {
    var s = SUBJECTS.filter(function (x) { return x.id === curSubject; })[0];
    var n = getLevelCount(curSubject, curGrade);
    var pages = Math.max(1, Math.ceil(n / MAP_PAGE_SIZE));
    if (mapPage >= pages) mapPage = pages - 1;
    if (mapPage < 0) mapPage = 0;
    $('mapTitle').textContent = s.icon + ' ' + s.name + ' 冒险地图';
    $('mapSub').textContent = GRADE_LABEL[curGrade] + '年级 · 共 ' + n + ' 关 · 每关 ' + QUESTIONS_PER_LEVEL + ' 题（每关最后一题是 Boss！）';
    var el = $('levelMap'); el.innerHTML = '';
    var start = mapPage * MAP_PAGE_SIZE;
    var end = Math.min(n, start + MAP_PAGE_SIZE);
    for (var lv = start; lv < end; lv++) {
      var unlocked = isLevelUnlocked(curSubject, curGrade, lv);
      var stars = levelStarsOf(curSubject, curGrade, lv);
      var b = document.createElement('button');
      b.className = 'level-node' + (lv === n - 1 ? ' boss' : '') + (unlocked ? '' : ' locked');
      b.innerHTML = (unlocked ? (lv + 1) : '🔒') + '<span class="lv-stars">' + repeatStr('⭐', stars) + '</span>';
      (function (lv2, un) {
        b.addEventListener('click', function () {
          if (!un) { toast('🔒 先通过上一关才能解锁'); TTS.speak('先通过上一关，才能解锁哦', 0.9); return; }
          TTS.speak('第' + (lv2 + 1) + '关，开始挑战！', 0.9);
          startBattle(curSubject, lv2);
        });
      })(lv, unlocked);
      el.appendChild(b);
    }
    if (pages > 1) {
      var nav = document.createElement('div');
      nav.className = 'map-page-nav';
      var prev = document.createElement('button');
      prev.className = 'btn map-page-btn';
      prev.textContent = '◀ 上一页';
      prev.disabled = mapPage === 0;
      prev.addEventListener('click', function () { SFX.click(); mapPage--; renderLevelMap(); focusFirstNav(el); });
      var info = document.createElement('span');
      info.className = 'map-page-info';
      info.textContent = (mapPage + 1) + ' / ' + pages + ' 页';
      var next = document.createElement('button');
      next.className = 'btn map-page-btn';
      next.textContent = '下一页 ▶';
      next.disabled = mapPage >= pages - 1;
      next.addEventListener('click', function () { SFX.click(); mapPage++; renderLevelMap(); focusFirstNav(el); });
      nav.appendChild(prev); nav.appendChild(info); nav.appendChild(next);
      el.appendChild(nav);
    }
    renderModeBar();
  }
  function goMap() {
    SFX.click();
    if (libWordMode) { showWordLib(); return; }
    if (freeMode) {
      if (lastFreeMode === 'mental' || lastFreeMode === 'spelling') {
        // 自由口算/拼写：回到对应学科地图（curSubject 为有效学科，走下方地图逻辑）
      } else if (dailyMode === 'think') { showThinkHub(); return; }
      else if (dailyMode === 'mental') { showMentalHub(); return; }
      else if (dailyMode === 'word') { showWordHub(); return; }
    }
    if (!curSubject || !SUBJECTS.some(function (s) { return s.id === curSubject; })) { goHome(); return; }
    setHash('map/' + curSubject + '/g' + curGrade); renderLevelMap(); showScreen('levelMap'); focusFirstNav($('levelMapScreen'));
  }

  /* ===================== 渲染年级/学科 ===================== */
  function renderGrades() {
    var el = $('gradeList'); el.innerHTML = '';
    for (var g = 1; g <= 9; g++) {
      var b = document.createElement('button');
      b.className = 'grade-btn' + (curGrade === g ? ' active' : '');
      b.setAttribute('data-g', g);
      b.innerHTML = g + '<small>年级</small>';
      b.addEventListener('click', function () { SFX.click(); selectGrade(this.getAttribute('data-g') * 1); });
      el.appendChild(b);
    }
  }
  function selectGrade(g) { curGrade = g; renderGrades(); renderSubjects(); setHash('g' + g); }

  function renderSubjects() {
    var el = $('subjectList'); el.innerHTML = '';
    var list = SUBJECTS.filter(function (s) { return s.grades.indexOf(curGrade) !== -1; });
    list.forEach(function (s) {
      var total = (BANK[s.id] || []).filter(function (q) { return q.g.indexOf(curGrade) !== -1; }).length;
      var got = save.subjectCorrect[s.id] || 0;
      var pct = total > 0 ? Math.min(100, Math.round(got / Math.max(total, 1) * 100)) : 0;
      var card = document.createElement('div');
      card.className = 'subject-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('data-subject', s.id);
      card.style.setProperty('--c', s.color);
      card.innerHTML =
        '<div class="star">★ ' + got + '</div>' +
        '<div class="icon">' + s.icon + '</div>' +
        '<div class="name">' + s.name + '</div>' +
        '<div class="desc">' + GRADE_LABEL[curGrade] + '年级 · ' + total + ' 题</div>' +
        '<div class="progress-wrap"><div class="progress-bar" style="width:' + pct + '%"></div></div>';
      card.addEventListener('click', function () { TTS.speak(s.name + '，出发！', 0.9); openLevelMap(s.id); });
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLevelMap(s.id); } });
      el.appendChild(card);
    });
  }

  /* ===================== 战斗（关卡制） ===================== */
  function startBattle(subjectId, lv) {
    wrongMode = false;
    battleWrongIdx = [];
    freeMode = false;
    flashMode = false;
    lastWasFlash = false;
    gameMode = (curMode === 'judge') ? 'judge' : 'adventure';
    curSubject = subjectId;
    curLevel = lv || 0;
    curQuestions = getLevelQuestions(subjectId, curGrade, curLevel);
    if (curQuestions.length === 0) { toast('😅 该关卡暂无题目'); return; }
    setHash('battle/' + subjectId + '/g' + curGrade + '/' + curLevel + '/' + gameMode);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    var s = SUBJECTS.filter(function (x) { return x.id === subjectId; })[0];
    $('battleTitle').textContent = s.icon + ' ' + s.name + ' · 第 ' + (curLevel + 1) + ' 关';
    $('battleSub').textContent = GRADE_LABEL[curGrade] + '年级 · ' + curQuestions.length + ' 题 · ' +
      (gameMode === 'judge' ? '判断给出的答案对不对！' : '答对攻击怪物，答错扣命！');
    renderBattlePet();
    renderBattle();
  }
  function renderBattle() {
    $('monsterHpFill').parentNode.style.display = '';
    $('vsMark').style.display = '';
    $('hearts').textContent = repeatStr('❤️', hp) + repeatStr('🖤', MAX_HP - hp);
    $('monsterHpFill').style.width = (monsterHp / curQuestions.length * 100) + '%';
    renderDots();
    if (curIndex >= curQuestions.length) { finishBattle(); return; }
    var q = curQuestions[curIndex];
    var isBoss = (curIndex === curQuestions.length - 1);
    var mon = $('monsterEmoji');
    mon.textContent = isBoss ? '👹' : '👾';
    mon.className = 'monster' + (isBoss ? ' boss' : '');
    $('qText').textContent = (isBoss ? '👑 BOSS战！' : '') + q.q;
    renderThinkGfx(dailyMode === 'think' ? q : null);
    var optEl = $('options'); optEl.innerHTML = '';
    var ad = $('answerDisplay');
    ad.className = 'answer-display hidden';
    speedStart = Date.now();
    qStartTs = Date.now();
    var letters = ['A', 'B', 'C', 'D'];
    if (gameMode === 'judge') {
      var trueShow = Math.random() < 0.5;
      judgeIsTrue = trueShow;
      var wrongPool = q.o.filter(function (_, idx) { return idx !== q.a; });
      judgeAnswer = trueShow ? q.o[q.a] : wrongPool[Math.floor(Math.random() * wrongPool.length)];
      ad.className = 'answer-display';
      ad.innerHTML = '🎯 它说：' + judgeAnswer + ' ，对不对？';
      optEl.className = 'options';
      [['✔ 对，就是这个', true], ['✘ 不对', false]].forEach(function (p) {
        var b = document.createElement('button');
        b.className = 'option judge-btn';
        b.innerHTML = '<span class="tag">' + (p[1] ? '✔' : '✘') + '</span><span>' + p[0] + '</span>';
        b.addEventListener('click', function () { answerJudge(p[1]); });
        optEl.appendChild(b);
      });
    } else if (gameMode === 'mental') {
      mentalInput = '';
      ad.className = 'answer-display';
      ad.innerHTML = '你的答案：<span class="mental-val" id="mentalVal">_</span>';
      optEl.className = 'key-grid';
      renderNumPad(optEl);
    } else if (gameMode === 'spelling') {
      spellInput = '';
      var mm = q.q.match(/“(.+)”/);
      spellCn = mm ? mm[1] : '';
      $('qText').textContent = (isBoss ? '👑 BOSS战！' : '') + '拼写出 “' + spellCn + '” 的英文单词';
      if (libWordMode && q.ipa) {
        ad.className = 'answer-display';
        ad.innerHTML = '<span class="ipa-tag">/' + q.ipa + '/</span>' + (q.key ? '<span class="key-tag">⭐重点</span>' : '') +
          ' <span class="mental-val" id="spellVal">_</span>';
        setTimeout(function () { if (!roundLocked && $('battleScreen').classList.contains('hidden') === false) TTS.speakEn(q.o[q.a]); }, 500);
      } else {
        ad.className = 'answer-display';
        ad.innerHTML = '<span class="mental-val" id="spellVal">_</span>';
      }
      optEl.className = 'key-grid key-letters';
      renderLetterPad(optEl);
    } else {
      optEl.className = 'options';
      q.o.forEach(function (opt, i) {
        var b = document.createElement('button');
        b.className = 'option' + (q.optHtml ? ' opt-grid' : '');
        b.innerHTML = '<span class="tag">' + letters[i] + '</span>' + (q.optHtml ? opt : '<span>' + opt + '</span>');
        b.addEventListener('click', function () { if (!q.optHtml) TTS.speak(opt, 0.9); answer(i); });
        optEl.appendChild(b);
      });
    }
    $('explain').className = 'explain'; $('explain').innerHTML = '';
    $('nextBtn').className = 'btn next-btn';
    roundLocked = false;
    flashRevealed = false;
    $('comboBadge').className = 'combo-badge' + (combo >= 2 ? ' show' : '');
    $('comboNum').textContent = combo;
    // 低年级（1-2年级）自动朗读题目（口算/拼写只读题干，避免泄露选项）
    if (curGrade <= 2) {
      setTimeout(function () {
        if (gameMode === 'mental' || gameMode === 'spelling') TTS.speak(q.q, 0.85);
        else speakQuestion(q);
      }, 400);
    }
  }
  function renderNumPad(el) {
    ['1', '2', '3', '⌫', '4', '5', '6', 'C', '7', '8', '9', '±', '0', '.', '提交'].forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'key' + (k === '提交' ? ' key-ok' : '');
      b.textContent = k;
      b.addEventListener('click', function () {
        if (roundLocked) return;
        SFX.click();
        if (k === '⌫') mentalInput = mentalInput.slice(0, -1);
        else if (k === 'C') mentalInput = '';
        else if (k === '±') { if (mentalInput.charAt(0) === '-') mentalInput = mentalInput.slice(1); else if (mentalInput) mentalInput = '-' + mentalInput; }
        else if (k === '.') { if (mentalInput.indexOf('.') === -1) mentalInput += '.'; }
        else if (k === '提交') { submitMental(); return; }
        else mentalInput += k;
        $('mentalVal').textContent = mentalInput || '_';
      });
      el.appendChild(b);
    });
  }
  function renderLetterPad(el) {
    ['⇧', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].forEach(function (ch) {
      var b = document.createElement('button');
      if (ch === '⇧') {
        b.className = 'key key-shift' + (spellLower ? '' : ' key-on');
        b.textContent = spellLower ? 'aA' : 'AA';
        b.addEventListener('click', function () {
          if (roundLocked) return;
          SFX.click();
          spellLower = !spellLower;
          el.innerHTML = '';
          renderLetterPad(el);
        });
        el.appendChild(b);
        return;
      }
      b.className = 'key';
      b.textContent = spellLower ? ch.toLowerCase() : ch;
      b.addEventListener('click', function () {
        if (roundLocked) return;
        SFX.click();
        spellInput += spellLower ? ch.toLowerCase() : ch;
        $('spellVal').textContent = spellInput || '_';
      });
      el.appendChild(b);
    });
    var bs = document.createElement('button');
    bs.className = 'key';
    bs.textContent = '⌫';
    bs.addEventListener('click', function () {
      if (roundLocked) return;
      SFX.click();
      spellInput = spellInput.slice(0, -1);
      $('spellVal').textContent = spellInput || '_';
    });
    el.appendChild(bs);
    var ok = document.createElement('button');
    ok.className = 'key key-ok';
    ok.textContent = '提交';
    ok.addEventListener('click', function () { if (!roundLocked) submitSpell(); });
    el.appendChild(ok);
  }
  function prepJudge(q) { /* 已内联到 renderBattle，保留占位避免外部引用 */ return null; }
  function renderDots() {
    var el = $('dots'); el.innerHTML = '';
    for (var i = 0; i < curQuestions.length; i++) {
      var d = document.createElement('div');
      d.className = 'dot' + (i < curIndex ? ' done' : '') + (i === curIndex ? ' cur' : '');
      el.appendChild(d);
    }
  }
  function showDmg(el, text, gold) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'dmg-num' + (gold ? ' gold' : '');
    d.textContent = text;
    d.style.left = (r.left + r.width / 2 - 14) + 'px';
    d.style.top = r.top + 'px';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 900);
  }
  function ultFlash() {
    var d = document.createElement('div');
    d.className = 'ult-text';
    d.textContent = '⚡ 必杀技！';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 950);
    burst(window.innerWidth / 2, window.innerHeight / 2, ['💥', '⚡', '✨', '🔥']);
  }
  function answer(i) {
    if (roundLocked) return;
    var q = curQuestions[curIndex];
    var target = $('options').children[i] || null;
    answerCore(i === q.a, target, q.o[q.a]);
  }
  function answerJudge(saysTrue) {
    if (roundLocked) return;
    answerCore(saysTrue === judgeIsTrue, null, judgeAnswer);
  }
  function submitMental() {
    if (roundLocked || !mentalInput) { if (!mentalInput) toast('先输入答案哦'); return; }
    var q = curQuestions[curIndex];
    var ans = parseFloat(q.o[q.a]);
    var ok = Math.abs(parseFloat(mentalInput) - ans) < 1e-9;
    answerCore(ok, null, q.o[q.a]);
  }
  function submitSpell() {
    if (roundLocked || !spellInput) { if (!spellInput) toast('先拼写单词哦'); return; }
    var q = curQuestions[curIndex];
    var ok = spellInput.trim().toLowerCase() === q.o[q.a].trim().toLowerCase();
    answerCore(ok, null, q.o[q.a]);
  }
  function answerCore(isCorrect, targetEl, shownAns) {
    if (roundLocked) return;
    roundLocked = true;
    var q = curQuestions[curIndex];
    var mon = $('monsterEmoji');
    var isBoss = (curIndex === curQuestions.length - 1);
    var speedBonus = (isCorrect && speedStart && Date.now() - speedStart < 5000) ? 2 : 0;
    speedStart = 0;
    /* 专项训练记录：口算逐题耗时 / 单词记忆档案 */
    if (dailyMode === 'mental' && qStartTs) { roundTimes.push(Date.now() - qStartTs); roundOk.push(!!isCorrect); qStartTs = 0; }
    if (gameMode === 'spelling') {
      var wKey = (q.o[q.a] || '').trim().toLowerCase();
      var wSt = save.wordStats[wKey] || { w: 0, s: 0, t: 0 };
      if (isCorrect) { wSt.s = (wSt.s || 0) + 1; save.wordTotal = (save.wordTotal || 0) + 1; }
      else { wSt.w = (wSt.w || 0) + 1; wSt.s = 0; }
      if (dailyMode === 'word' && dailyIsReview) save.reviewTotal = (save.reviewTotal || 0) + 1;
      wSt.t = Date.now();
      save.wordStats[wKey] = wSt;
    }
    if (isCorrect) {
      combo++; maxCombo = Math.max(maxCombo, combo);
      correctCount++;
      var gain = Math.round(10 * (1 + (combo - 1) * 0.1)) + (isBoss ? 10 : 0) + speedBonus;
      var myPet = getActivePet();
      if (myPet) gain = Math.round(gain * (1 + (getPetLevel(myPet.id) - 1) * 0.05));
      earnedXp += gain;
      monsterHp = Math.max(0, monsterHp - 1);
      SFX.correct();
      flash('green');
      var hero = $('heroEmoji');
      hero.classList.add('attack');
      setTimeout(function () { hero.classList.remove('attack'); }, 420);
      mon.classList.add('hit');
      setTimeout(function () { mon.classList.remove('hit'); }, 420);
      showDmg(mon, '-1', false);
      burstAtEl(targetEl || mon, ['⭐', '✨', '🌟']);
      if (combo >= 3) { ultFlash(); showDmg(mon, '暴击!', true); }
      if (combo >= 2) { $('comboBadge').className = 'combo-badge show'; $('comboNum').textContent = combo; }
      var bp = $('battlePet');
      if (bp && bp.style.display !== 'none') {
        bp.classList.add('cheer');
        setTimeout(function () { bp.classList.remove('cheer'); }, 650);
      }
    } else {
      combo = 0;
      hp--;
      SFX.wrong();
      flash('red');
      shakeScreen();
      showDmg($('heroEmoji'), '-1❤', false);
      battleWrongIdx.push(curIndex);
      if (!wrongMode && curSubject) addToWrongBook(curSubject, curGrade, q);
      var bpe = $('battlePet');
      if (bpe && bpe.style.display !== 'none') {
        bpe.classList.add('encourage');
        setTimeout(function () { bpe.classList.remove('encourage'); }, 850);
      }
    }
    // 选项着色（仅选择题模式）；其余模式在答案区显示正确答案
    if (gameMode === 'adventure' && targetEl) {
      var opts = $('options').children;
      if (isCorrect) targetEl.classList.add('correct');
      else {
        targetEl.classList.add('wrong');
        if (opts[q.a]) opts[q.a].classList.add('correct');
      }
      for (var j = 0; j < opts.length; j++) opts[j].classList.add('disabled');
    } else {
      var keys = $('options').querySelectorAll('button');
      for (var k2 = 0; k2 < keys.length; k2++) keys[k2].classList.add('disabled');
      var ad = $('answerDisplay');
      ad.className = 'answer-display ' + (isCorrect ? 'ok' : 'no');
      ad.innerHTML = (isCorrect ? '✅ 答对了！正确答案：' : '❌ 正确答案：') + shownAns + (speedBonus ? ' ⚡手速+' + speedBonus : '');
    }
    $('explain').innerHTML = '<b>解析：</b>' + (q.e || '');
    $('explain').className = 'explain show';
    $('nextBtn').className = 'btn next-btn show';
    $('nextBtn').textContent = (curIndex + 1 >= curQuestions.length || hp <= 0) ? '查看结果 🏁' : '下一题 ➜';
    updateTopbar();
    setTimeout(function () {
      var say = isCorrect
        ? PRAISE[Math.floor(Math.random() * PRAISE.length)]
        : CHEER[Math.floor(Math.random() * CHEER.length)];
      if (curGrade <= 3) TTS.speak(say + '。' + (q.e || ''), 0.85);
      else TTS.speak(say, 1);
    }, 1100);
  }
  function nextQuestion() {
    SFX.click();
    curIndex++;
    if (curIndex >= curQuestions.length || hp <= 0) { finishBattle(); return; }
    renderBattle();
  }
  function finishBattle() {
    var oldLevel = level();
    lastWrongMode = wrongMode;
    // 星级结算：全对3星、差1题2星、≥60% 1星，其余失败（不解锁下一关）
    var total = curQuestions.length;
    lastStars = correctCount >= total ? 3 : (correctCount >= total - 1 ? 2 : (correctCount >= Math.ceil(total * 0.6) ? 1 : 0));
    if (libWordMode) {
      /* 词库闯关星级单独记录，不写入普通英语地图 */
      var wk = curGrade + '-' + curLevel;
      if (!save.wordLibStars) save.wordLibStars = {};
      if (lastStars > (save.wordLibStars[wk] || 0)) save.wordLibStars[wk] = lastStars;
    } else if (!wrongMode && !freeMode && lastStars > 0) {
      setLevelStars(curSubject, curGrade, curLevel, lastStars);
    }
    save.xp += earnedXp;
    save.stars += correctCount;
    earnedFood = correctCount + petFoodBonus();
    save.food = (save.food || 0) + earnedFood;
    save.totalCorrect += correctCount;
    save.bestCombo = Math.max(save.bestCombo, maxCombo);
    save.rounds++;
    if (curSubject) {
      if (!save.subjectCorrect[curSubject]) save.subjectCorrect[curSubject] = 0;
      save.subjectCorrect[curSubject] += correctCount;
    }
    /* 专项训练结算：生成报告 + 打卡记录（放在 unlockBadges 前，成就条件依赖报告） */
    if (dailyMode === 'mental') {
      var tSum = 0; roundTimes.forEach(function (t) { tSum += t; });
      var tAvg = roundTimes.length ? Math.round(tSum / roundTimes.length) : 0;
      var dk = todayStr(0), yk = todayStr(-1);
      if (!save.mentalLog) save.mentalLog = {};
      var firstToday = !save.mentalLog[dk];
      if (firstToday) {
        save.mentalStreak = (save.mentalLast === yk) ? (save.mentalStreak || 0) + 1 : 1;
        save.mentalLast = dk;
        save.mentalLog[dk] = { n: correctCount, total: total, avgMs: tAvg, combo: maxCombo };
      }
      var ylog = save.mentalLog[yk] || null;
      dailyReport = { kind: 'mental', n: total, correct: correctCount, totalMs: tSum, avgMs: tAvg, per: roundTimes.slice(), ok: roundOk.slice(), yAvgMs: ylog ? ylog.avgMs : 0 };
    } else if (dailyMode === 'word') {
      var lib = wordLibStats();
      dailyReport = { kind: 'word', n: total, correct: correctCount, review: dailyIsReview, lib: lib };
    } else if (dailyMode === 'think') {
      var tdk = todayStr(0), tyk = todayStr(-1);
      if (!save.thinkLog) save.thinkLog = {};
      if (!save.thinkLog[tdk]) {
        save.thinkStreak = (save.thinkLast === tyk) ? (save.thinkStreak || 0) + 1 : 1;
        save.thinkLast = tdk;
        save.thinkLog[tdk] = { n: correctCount, total: total };
      } else {
        save.thinkLog[tdk].n = (save.thinkLog[tdk].n || 0) + correctCount;
        save.thinkLog[tdk].total = (save.thinkLog[tdk].total || 0) + total;
      }
      save.thinkTotal = (save.thinkTotal || 0) + correctCount;
      dailyReport = { kind: 'think', n: total, correct: correctCount };
    } else if (libWordMode) {
      dailyReport = { kind: 'wordlib', n: total, correct: correctCount };
    } else {
      dailyReport = null;
    }
    unlockBadges();
    if (!flashMode) tryDropEgg();
    if (wrongMode) {
      // 重练中答对的题移出错题本
      var removed = 0;
      curQuestions.forEach(function (cq, idx) {
        if (battleWrongIdx.indexOf(idx) === -1) { removeFromWrongBook(cq.q); removed++; }
      });
      if (removed > 0) setTimeout(function () { toast('✨ 答对的 ' + removed + ' 题已移出错题本'); }, 900);
    }
    wrongMode = false;
    persist();
    updateTopbar();
    if (level() > oldLevel) { SFX.levelup(); toast('🎉 升级啦！现在是 Lv.' + level()); }
    showResult();
  }
  function showResult() {
    setHash(dailyReport && dailyReport.kind === 'think' ? 'think-hub/g' + curGrade : (lastWrongMode || !curSubject ? 'g' + curGrade : 'map/' + curSubject + '/g' + curGrade));
    showScreen('result');
    $('rFood').textContent = '+' + (earnedFood || 0);
    renderDailyReport();
    if (dailyReport) {
      $('resultEmoji').textContent = dailyReport.kind === 'mental' ? '🧮' : (dailyReport.kind === 'think' ? '🧠' : '🔤');
      $('resultTitle').textContent = dailyReport.kind === 'mental' ? '口算特训完成！'
        : dailyReport.kind === 'wordlib' ? '词库关卡完成！'
        : dailyReport.kind === 'think' ? '思维挑战完成！'
        : (dailyIsReview ? '单词复习完成！' : '单词特训完成！');
      $('resultSub').textContent = dailyReport.kind === 'think'
        ? '答对 ' + correctCount + ' / ' + dailyReport.n + ' 题 · 动脑最棒！'
        : '答对 ' + correctCount + ' / ' + dailyReport.n + (dailyReport.kind === 'mental' ? ' 题 · 平均 ' + (dailyReport.avgMs / 1000).toFixed(1) + ' 秒' : ' 词');
    }
    if (flashMode) {
      flashMode = false;
      $('resultEmoji').textContent = flashKnown === flashDeck.length ? '🌟' : '📖';
      $('resultTitle').textContent = '复习完成！';
      $('resultSub').textContent = '掌握 ' + flashKnown + ' / ' + flashDeck.length + ' 张 · 不会的已存入错题本';
      $('rCorrect').textContent = flashKnown;
      $('rXp').textContent = '+' + earnedXp;
      $('rCombo').textContent = 0;
      $('nextLvBtn').style.display = 'none';
      focusFirstNav($('resultScreen'));
      if (curGrade <= 2) setTimeout(function () { TTS.speak('复习完成，你真棒！', 0.9); }, 500);
      return;
    }
    var total = curQuestions.length;
    var passed = lastStars > 0;
    var emoji = lastStars === 3 ? '🏆' : (passed ? '🎉' : (correctCount > 0 ? '💪' : '😢'));
    $('resultEmoji').textContent = emoji;
    $('resultTitle').textContent = lastWrongMode
      ? (passed ? '错题重练完成！' : '再练一次，一定能行！')
      : (lastStars === 3 ? '完美通关！三星！' : (passed ? '关卡通过！' : '挑战失败…'));
    $('resultSub').textContent = lastWrongMode
      ? ('答对 ' + correctCount + ' / ' + total + ' 题 · 答对的已移出错题本')
      : ('第 ' + (curLevel + 1) + ' 关 · 答对 ' + correctCount + ' / ' + total + ' 题 · ' + repeatStr('⭐', lastStars) + repeatStr('☆', 3 - lastStars));
    $('rCorrect').textContent = correctCount;
    $('rXp').textContent = '+' + earnedXp;
    $('rCombo').textContent = maxCombo;
    var hasNext = lastWrongMode ? false
      : libWordMode ? (passed && (curLevel + 1) < libLevelCount(curGrade))
      : (!freeMode && passed && (curLevel + 1) < getLevelCount(curSubject, curGrade));
    var nlb = $('nextLvBtn');
    nlb.style.display = hasNext ? 'inline-flex' : 'none';
    if (hasNext) nlb.textContent = '➡️ 第 ' + (curLevel + 2) + ' 关';
    focusFirstNav($('resultScreen'));
    // 低年级朗读结算结果
    if (curGrade <= 2) {
      setTimeout(function () {
        TTS.speak((lastStars === 3 ? '太棒了，三颗星，完美通关！' : (passed ? '关卡通过，你真棒！' : '挑战失败，再试一次一定能行！')), 0.9);
      }, 500);
    }
  }

  /* ===================== 成就 ===================== */
  function unlockBadges() {
    var checks = {
      'first': save.rounds >= 1,
      'ten': save.totalCorrect >= 10,
      'fifty': save.totalCorrect >= 50,
      'hundred': save.totalCorrect >= 100,
      'lvl5': level() >= 5,
      'lvl10': level() >= 10,
      'combo5': save.bestCombo >= 5,
      'perfect': (correctCount === curQuestions.length && curQuestions.length > 0),
      'hatch5': save.hatches >= 5,
      'pet3': save.pets.length >= 3,
      'mental1': (function () { var c = 0, k; for (k in (save.mentalLog || {})) { c++; } return c >= 1; })(),
      'mentalFast': !!(dailyReport && dailyReport.kind === 'mental' && dailyReport.n >= 10 && dailyReport.avgMs <= 6000),
      'mental7': (function () { var c = 0, k; for (k in (save.mentalLog || {})) { c++; } return c >= 7; })(),
      'word50': (save.wordTotal || 0) >= 50,
      'review30': (save.reviewTotal || 0) >= 30,
      'wordPerfect': dailyMode === 'word' && curQuestions.length > 0 && correctCount === curQuestions.length,
      'lib1': libWordPassedCount() >= 1,
      'lib10': libWordPassedCount() >= 10,
      'lib30': libWordPassedCount() >= 30,
      'think1': (function () { var c = 0, k; for (k in (save.thinkLog || {})) { c++; } return c >= 1; })(),
      'think30': (save.thinkTotal || 0) >= 30,
      'thinkPerfect': dailyMode === 'think' && curQuestions.length >= 10 && correctCount === curQuestions.length,
      'think7': (function () { var c = 0, k; for (k in (save.thinkLog || {})) { c++; } return c >= 7; })(),
      'phonics1': (save.phonicsTotal || 0) >= 10,
      'phonics30': (save.phonicsDone || 0) >= 30,
      'phonicsPerfect': !!(phoLastQuiz && phoLastQuiz.total === 10 && phoLastQuiz.correct === 10),
      'phonics7': (function () { var c = 0, k; for (k in (save.phonicsLog || {})) { c++; } return c >= 7; })(),
      'story1': (save.storyHeard || []).length >= 1,
      'story10': (save.storyHeard || []).length >= 10,
      'story30': (save.storyHeard || []).length >= 30,
      'story7': (function () { var c = 0, k; for (k in (save.storyLog || {})) { c++; } return c >= 7; })(),
      'grammar1': (save.grammarTotal || 0) >= 10,
      'grammar30': (save.grammarDone || 0) >= 30,
      'grammarPerfect': !!(grammarLastQuiz && grammarLastQuiz.total === 10 && grammarLastQuiz.correct === 10),
      'grammar7': (function () { var c = 0, k; for (k in (save.grammarLog || {})) { c++; } return c >= 7; })(),
      'game1': (function () { var c = 0, k; for (k in (save.gameStats || {})) { if ((save.gameStats[k] || {}).played > 0) c++; } return c >= 1; })(),
      'game10': (function () { var c = 0, k; for (k in (save.gameStats || {})) { if ((save.gameStats[k] || {}).played > 0) c++; } return c >= 10; })(),
      'gameAll': (function () { var c = 0, k; for (k in (save.gameStats || {})) { if ((save.gameStats[k] || {}).played > 0) c++; } return c >= 32; })(),
      'gameMaster': (function () { var c = 0, k; for (k in (save.gameStats || {})) { c += (save.gameStats[k] || {}).played || 0; } return c >= 50; })()
    };
    BADGES.forEach(function (b) {
      if (checks[b.id] && save.badges.indexOf(b.id) === -1) {
        save.badges.push(b.id);
        SFX.badge();
        toast(b.icon + ' 解锁成就：' + b.name);
      }
    });
  }
  function renderBadges() {
    var el = $('badgeList'); el.innerHTML = '';
    BADGES.forEach(function (b) {
      var unlocked = save.badges.indexOf(b.id) !== -1;
      var d = document.createElement('div');
      d.className = 'badge' + (unlocked ? '' : ' locked');
      d.innerHTML = '<div class="bi">' + (unlocked ? b.icon : '🔒') + '</div><div><div class="bt">' + b.name + '</div><div class="bd">' + b.desc + '</div></div>';
      el.appendChild(d);
    });
  }

  function updateTopbar() {
    $('levelBadge').textContent = '⭐ Lv.' + level();
    $('xpNum').textContent = xpInLevel() + '/' + 100;
    $('starNum').textContent = save.stars;
    $('foodNum').textContent = save.food || 0;
    $('coinNum').textContent = save.coins || 0;
    var pb = $('petBtn');
    pb.textContent = save.eggs > 0 ? '🥚' + save.eggs : '🐾';
    pb.title = save.eggs > 0 ? '宠物乐园（有 ' + save.eggs + ' 颗蛋待孵化！）' : '宠物乐园';
    /* 首次填充正确值后取消隐藏，避免初始默认值闪现 */
    var hs = $('hudStats');
    if (hs) hs.style.visibility = 'visible';
  }

