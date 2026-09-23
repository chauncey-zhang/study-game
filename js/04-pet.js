'use strict';
  /* ===================== 宠物系统 ===================== */
  var PETS = [
    { id:'dog',     icon:'🐶', name:'旺财',   rarity:'common' },
    { id:'cat',     icon:'🐱', name:'咪咪',   rarity:'common' },
    { id:'pig',     icon:'🐷', name:'嘟嘟',   rarity:'common' },
    { id:'rabbit',  icon:'🐰', name:'跳跳',   rarity:'common' },
    { id:'bear',    icon:'🐻', name:'憨憨',   rarity:'common' },
    { id:'koala',   icon:'🐨', name:'睡睡',   rarity:'common' },
    { id:'monkey',  icon:'🐵', name:'皮皮',   rarity:'common' },
    { id:'chicken', icon:'🐔', name:'咕咕',   rarity:'common' },
    { id:'frog',    icon:'🐸', name:'呱呱',   rarity:'common' },
    { id:'turtle',  icon:'🐢', name:'慢慢',   rarity:'common' },
    { id:'fox',     icon:'🦊', name:'灵灵',   rarity:'rare' },
    { id:'panda',   icon:'🐼', name:'团子',   rarity:'rare' },
    { id:'penguin', icon:'🐧', name:'冰冰',   rarity:'rare' },
    { id:'owl',     icon:'🦉', name:'博士',   rarity:'rare' },
    { id:'octopus', icon:'🐙', name:'墨墨',   rarity:'rare' },
    { id:'unicorn', icon:'🦄', name:'彩虹',   rarity:'legend' },
    { id:'dragon',  icon:'🐲', name:'烈焰',   rarity:'legend' },
    { id:'ghost',   icon:'👻', name:'豆豆',   rarity:'legend' }
  ];
  var RARITY_NAME = { common: '普通', rare: '稀有', legend: '传说' };
  function getActivePet() {
    var id = (save.activePet && save.pets.indexOf(save.activePet) !== -1) ? save.activePet : (save.pets[0] || null);
    if (!id) return null;
    return PETS.filter(function (p) { return p.id === id; })[0] || null;
  }
  function renderBattlePet() {
    var ap = getActivePet();
    var bp = $('battlePet');
    if (ap) {
      bp.style.display = 'flex';
      bp.innerHTML = petIconWithHat(ap) + '<span class="pet-side-name">' + ap.name + '</span>';
    } else {
      bp.style.display = 'none';
    }
  }
  function getPetLevel(id) { return (save.petLevels && save.petLevels[id]) || 1; }
  function renderActivePetBar() {
    var ap = getActivePet();
    var bar = $('activePetBar');
    if (!bar) return;
    if (!ap) { bar.style.display = 'none'; return; }
    var lv = getPetLevel(ap.id);
    var canFeed = Math.floor((save.food || 0) / FEED_COST);
    bar.style.display = 'flex';
    bar.innerHTML =
      '<span class="ap-icon">' + petIconWithHat(ap) + '</span>' +
      '<span class="ap-info"><b>' + ap.name + '</b> Lv.' + lv +
      '<small>' + (lv >= 10 ? '已满级 · 经验 +45% · 结算食物 +10' : '经验 +' + ((lv - 1) * 5) + '% · 结算食物 +' + lv + ' · 🍖 余 ' + (save.food || 0) + '（可喂 ' + canFeed + ' 次）') + '</small></span>' +
      (lv < 10 ? '<button class="btn btn-gold feed-btn" id="feedBtn">🍼 喂食 (🍖' + FEED_COST + ')</button>' : '');
    var fb = $('feedBtn');
    if (fb) fb.addEventListener('click', feedPet);
  }
  function feedPet() {
    var ap = getActivePet();
    if (!ap) return;
    var lv = getPetLevel(ap.id);
    if (lv >= 10) { toast(ap.name + ' 已满级啦！'); return; }
    if ((save.food || 0) < FEED_COST) {
      toast('🍖 食物不足（还差 ' + (FEED_COST - (save.food || 0)) + '），闯关答题/签到可赚食物');
      TTS.speak('食物不够了，快去闯关赚食物吧', 0.9);
      return;
    }
    save.food -= FEED_COST;
    save.petLevels[ap.id] = lv + 1;
    SFX.levelup();
    burst(window.innerWidth / 2, window.innerHeight / 2, ['🍼', '✨', ap.icon, '💖']);
    toast('🍼 ' + ap.name + ' 升到 Lv.' + (lv + 1) + '！经验加成 +' + (lv * 5) + '%');
    TTS.speak(ap.name + '升级啦！现在经验加成百分之' + (lv * 5), 0.9);
    persist();
    updateTopbar();
    renderActivePetBar();
  }
  /* ===================== 错题本 ===================== */
  function addToWrongBook(subjectId, grade, q) {
    if (!save.wrongBook) save.wrongBook = [];
    var dup = save.wrongBook.some(function (w) { return w.q === q.q; });
    if (dup) return;
    save.wrongBook.unshift({ s: subjectId, g: grade, q: q.q, o: q.o, a: q.a, e: q.e });
    if (save.wrongBook.length > 50) save.wrongBook.pop(); // 上限 50 题
  }
  function removeFromWrongBook(qText) {
    save.wrongBook = (save.wrongBook || []).filter(function (w) { return w.q !== qText; });
  }
  function renderWrongModal() {
    var list = save.wrongBook || [];
    $('wrongCount').textContent = list.length;
    $('wrongStartBtn').style.display = list.length ? 'inline-flex' : 'none';
    var el = $('wrongList');
    el.innerHTML = list.length ? '' : '<div class="empty-tip">太棒了，暂无错题！继续保持 🎉</div>';
    list.forEach(function (w) {
      var d = document.createElement('div');
      d.className = 'wrong-item';
      d.innerHTML = '<div class="wq">' + w.q + '</div><div class="wa">✅ 正确答案：' + w.o[w.a] + '</div><div class="we">💡 ' + (w.e || '') + '</div>';
      el.appendChild(d);
    });
  }
  function startWrongBattle() {
    var pool = shuffle((save.wrongBook || []).slice()).slice(0, 10);
    if (!pool.length) { toast('错题本是空的，太棒了！'); return; }
    setHash('wrong');
    wrongMode = true;
    battleWrongIdx = [];
    curSubject = null;
    curLevel = 0;
    curQuestions = pool.map(shuffleOptions);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    $('battleTitle').textContent = '📒 错题重练';
    $('battleSub').textContent = '答对的错题会自动移出错题本 · 本次 ' + curQuestions.length + ' 题';
    renderBattlePet();
    renderBattle();
  }

  function eggDropRate() {
    if (lastStars >= 3) return 1;
    if (lastStars === 2) return 0.7;
    if (lastStars === 1) return 0.4;
    return 0;
  }
  function tryDropEgg() {
    if (Math.random() < eggDropRate()) {
      save.eggs++;
      SFX.badge();
      burst(window.innerWidth / 2, window.innerHeight * 0.4, ['🥚', '✨', '⭐']);
      setTimeout(function () { toast('🎁 掉落宠物蛋！去 🐾 宠物乐园孵化吧'); }, 600);
    }
  }
  function renderPetModal() {
    $('petEggCount').textContent = save.eggs;
    $('petFoodTip').textContent = '🍖 食物余量：' + (save.food || 0) + '（喂食 1 次消耗 ' + FEED_COST + '）';
    $('hatchBtn').style.display = save.eggs > 0 ? 'inline-flex' : 'none';
    $('eggIcon').textContent = save.eggs > 0 ? '🥚' : '🕳️';
    renderActivePetBar();
    var el = $('petGrid');
    el.innerHTML = '';
    PETS.forEach(function (p) {
      var owned = save.pets.indexOf(p.id) !== -1;
      var isActive = owned && save.activePet === p.id;
      var d = document.createElement('div');
      d.className = 'pet-card ' + (owned ? 'r-' + p.rarity + ' clickable' : 'locked') + (isActive ? ' active' : '');
      d.title = owned ? '点击让 ' + p.name + ' 出战' : '';
      d.innerHTML = '<div class="pi">' + (owned ? (isActive ? petIconWithHat(p) : p.icon) : '❓') + '</div><div class="pn">' + (owned ? p.name : '？？？') + '</div>' +
        (isActive ? '<div class="active-mark">⭐出战</div>' : '');
      if (owned) {
        d.addEventListener('click', function () {
          if (isActive) {
            /* 互动模式：已出战的宠物 → 叫声 + 蹦跳 + 随机讨好 */
            petCry(p.id);
            d.classList.remove('hop'); void d.offsetWidth; d.classList.add('hop');
            var say = petTalk();
            setTimeout(function () { TTS.speak(p.name + '：' + say, 0.95, 1.4); }, 350);
            toast(p.icon + ' ' + p.name + '：' + say);
          } else {
            /* 出战模式：切换出战 + 叫声 */
            save.activePet = p.id;
            persist();
            SFX.click();
            petCry(p.id);
            setTimeout(function () { TTS.speak(p.name + '，出战！主人最强！', 0.9); }, 350);
            toast(p.icon + ' ' + p.name + ' 出战！战斗中为你加油');
            renderPetModal();
          }
        });
      }
      el.appendChild(d);
    });
  }
  function hatchEgg() {
    if (save.eggs <= 0) return;
    var btn = $('hatchBtn');
    btn.style.pointerEvents = 'none';
    var egg = $('eggIcon');
    egg.classList.add('shaking');
    TTS.stop();
    setTimeout(function () {
      egg.classList.remove('shaking');
      btn.style.pointerEvents = '';
      save.eggs--;
      save.hatches++;
      var roll = Math.random();
      var pool = roll < 0.05 ? 'legend' : (roll < 0.25 ? 'rare' : 'common');
      var candidates = PETS.filter(function (p) { return p.rarity === pool; });
      var pet = candidates[Math.floor(Math.random() * candidates.length)];
      var isNew = save.pets.indexOf(pet.id) === -1;
      if (isNew) {
        save.pets.push(pet.id);
        SFX.levelup();
        TTS.speak('哇！孵出了' + (pool === 'legend' ? '传说宠物' : '新宠物') + pet.name + '！', 0.9);
        toast('🎉 孵出新宠物：' + pet.icon + ' ' + pet.name + '（' + RARITY_NAME[pool] + '）');
        burst(window.innerWidth / 2, window.innerHeight / 2, ['🎉', pet.icon, '✨', '💖', '⭐']);
      } else {
        save.stars += 5;
        save.food = (save.food || 0) + 5;
        SFX.badge();
        toast(pet.icon + ' ' + pet.name + ' 已拥有，转化为 ⭐5 + 🍖5！');
        TTS.speak(pet.name + '已经在家里啦，送你五颗星星和五份食物！', 0.9);
      }
      unlockBadges();
      persist();
      updateTopbar();
      renderPetModal();
    }, 900);
  }

  /* ===================== 存档 ===================== */
  function defaultSave() {
    return { xp: 0, stars: 0, food: 0, totalCorrect: 0, bestCombo: 0, rounds: 0, subjectCorrect: {}, badges: [], levelStars: {}, eggs: 0, hatches: 0, pets: [], activePet: null, petLevels: {}, wrongBook: [], lastSignDate: '', signStreak: 0, mentalLog: {}, mentalStreak: 0, mentalLast: '', wordStats: {}, wordTotal: 0, reviewTotal: 0, wordLibStars: {}, thinkLog: {}, thinkStreak: 0, thinkLast: '', thinkTotal: 0, phonicsDone: 0, phonicsTotal: 0, phonicsBest: 0, phonicsLog: {}, storyHeard: [], storyLog: {}, storyStreak: 0, storyLast: '', grammarDone: 0, grammarTotal: 0, grammarBest: 0, grammarLog: {}, grammarStreak: 0, grammarLast: '', gameStats: {}, coins: 0, cosmetics: {}, activeHat: '', activeFrame: '', activeTheme: '' };
  }
  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        /* 主档被清：先从备份槽同步取回（04b-backup.js），再交给 __BACKUP__.recover 做 IndexedDB 兜底 */
        var bk = (window.__BACKUP__ && window.__BACKUP__.loadLSSlot) ? window.__BACKUP__.loadLSSlot() : null;
        if (bk) return bk;
        return defaultSave();
      }
      var s = JSON.parse(raw); var d = defaultSave();
      for (var k in d) { if (!(k in s)) s[k] = d[k]; }
      return s;
    } catch (e) { return defaultSave(); }
  }
  /* ===================== 用户系统（多档案 + 备份迁移） ===================== */
  var USERS_KEY = 'study-adventure-users';
  var CURRENT_KEY = 'study-adventure-current-user';
  function loadUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; } }
  function saveUsers(u) { try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch (e) {} }
  function getCurrentUser() { try { return localStorage.getItem(CURRENT_KEY) || null; } catch (e) { return null; } }
  function setCurrentUser(name) { try { name ? localStorage.setItem(CURRENT_KEY, name) : localStorage.removeItem(CURRENT_KEY); } catch (e) {} }
  function hashPass(p) { var h = 5381; p = String(p); for (var i = 0; i < p.length; i++) { h = ((h << 5) + h + p.charCodeAt(i)) >>> 0; } return 'h' + h.toString(36); }
  function persist() {
    try {
      var cu = getCurrentUser();
      if (cu) {
        var users = loadUsers();
        if (users[cu]) { users[cu].save = save; users[cu].updatedAt = Date.now(); saveUsers(users); }
      } else {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save)); // 游客档
      }
    } catch (e) {}
    /* 自动备份挂钩（04b-backup.js）：静默写入备份槽 + 每日快照 + 跨天自动下载 */
    try { if (window.__BACKUP__) window.__BACKUP__.tick(false); } catch (e) {}
  }
  var save = loadSave();
  /* 自动恢复：主档被清时从备份（IndexedDB → localStorage → 内存）找回 */
  try { if (window.__BACKUP__) window.__BACKUP__.recover(); } catch (e) {}
  /* 恢复登录用户档案：刷新后 save 必须指向当前用户，否则会误用游客档并覆盖用户数据 */
  (function () {
    var cu = getCurrentUser();
    if (!cu) return;
    var users = loadUsers();
    if (!users[cu] || !users[cu].save) return;
    var d = defaultSave(), s = users[cu].save;
    for (var k in d) { if (!(k in s)) s[k] = d[k]; }
    save = s;
  })();
  function refreshAll() {
    updateTopbar();
    updateUserBtn();
    renderGrades();
    renderSubjects();
  }
  function updateUserBtn() {
    var cu = getCurrentUser();
    $('userBtn').textContent = cu ? cu.slice(0, 2) : '👤';
    $('userBtn').title = cu ? '用户中心（' + cu + '）' : '用户中心（游客模式）';
  }
  function registerUser(name, pass) {
    name = (name || '').trim();
    if (!name || !pass) return '请填写用户名和密码';
    if (name.length > 12) return '用户名最多 12 个字';
    var users = loadUsers();
    if (users[name]) return '这个用户名已被使用';
    users[name] = { pass: hashPass(pass), save: JSON.parse(JSON.stringify(save)), createdAt: Date.now() }; // 继承当前进度
    saveUsers(users);
    setCurrentUser(name);
    refreshAll();
    return null;
  }
  function loginUser(name, pass) {
    name = (name || '').trim();
    var users = loadUsers();
    if (!users[name]) return '用户不存在，请先注册';
    if (users[name].pass !== hashPass(pass)) return '密码错误';
    persist(); // 保存当前（游客）进度
    setCurrentUser(name);
    var d = defaultSave();
    var s = users[name].save || d;
    for (var k in d) { if (!(k in s)) s[k] = d[k]; }
    save = s;
    refreshAll();
    try { if (window.__BACKUP__) window.__BACKUP__.tick(true); } catch (e) {} // 切换用户后立即备份用户档
    return null;
  }
  function logoutUser() {
    persist(); // 写回当前用户档
    try { if (window.__BACKUP__) window.__BACKUP__.tick(true); } catch (e) {} // 退出前备份用户档
    setCurrentUser(null);
    save = loadSave(); // 回到游客档
    refreshAll();
  }
  function level() { return Math.floor(save.xp / 100) + 1; }
  function xpInLevel() { return save.xp % 100; }
  /* 出战宠物的结算食物加成：每级 +1 粮 */
  function petFoodBonus() { var p = getActivePet(); return p ? getPetLevel(p.id) : 0; }

  function $(id) { return document.getElementById(id); }

  var curGrade = 1, curSubject = null, curQuestions = [], curIndex = 0;
  var hp = MAX_HP, monsterHp = 0, combo = 0, maxCombo = 0, correctCount = 0, earnedXp = 0, earnedFood = 0, roundLocked = false;
  var curLevel = 0, lastStars = 0, QUESTIONS_PER_LEVEL = 5;
  var wrongMode = false, lastWrongMode = false, battleWrongIdx = [];
  /* 多模式状态 */
  var gameMode = 'adventure', curMode = 'adventure';
  var freeMode = false, lastFreeMode = '';
  var judgeAnswer = '', judgeIsTrue = false, speedStart = 0;
  var mentalInput = '', spellInput = '', spellCn = '';
  var spellLower = true; // 字母键盘默认小写
  var flashMode = false, lastWasFlash = false, flashDeck = [], flashIdx = 0, flashKnown = 0, flashRevealed = false;
  /* 专项训练状态 */
  var dailyMode = '', dailyIsReview = false, dailyReport = null;
  var roundTimes = [], roundOk = [], qStartTs = 0;
  var mentalCount = 20, wordCount = 10;
  /* 词库顺序闯关（人教版 3~9 年级） */
  var libWordMode = false, wordLibGrade = 3;
  var MODES = [
    { id: 'adventure', name: '⚔️ 闯关选择' },
    { id: 'judge', name: '⚖️ 判对错' },
    { id: 'flashcard', name: '🃏 闪卡记忆' },
    { id: 'mental', name: '🔢 口算输入', subjects: ['math', 'physics'] },
    { id: 'spelling', name: '🔤 单词拼写', subjects: ['english'] }
  ];
  function modesFor(subjectId) {
    return MODES.filter(function (m) { return !m.subjects || m.subjects.indexOf(subjectId) !== -1; });
  }
  function modeName(id) {
    var m = MODES.filter(function (x) { return x.id === id; })[0];
    return m ? m.name : id;
  }
  function renderModeBar() {
    var el = $('modeBar');
    if (!el || !curSubject) return;
    el.innerHTML = '';
    modesFor(curSubject).forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'mode-chip' + (curMode === m.id ? ' active' : '');
      b.textContent = m.name;
      b.addEventListener('click', function () {
        SFX.click();
        curMode = m.id;
        if (m.id === 'flashcard') { startFlash(); return; }
        if (m.id === 'mental') { startMental(); return; }
        if (m.id === 'spelling') { startSpelling(); return; }
        renderLevelMap();
      });
      el.appendChild(b);
    });
  }
  /* 口算：数值题池（选项全部为数字） */
  function numericPool(subjectId, grade) {
    return gradeQuestions(subjectId, grade).filter(function (q) {
      return q.o.every(function (o) { return /^-?\d+(\.\d+)?$/.test(o); });
    });
  }
  /* 拼写：英语“中文→英文”题池 */
  function spellingPool(grade) {
    return (BANK.english || []).filter(function (q) {
      return q.g.indexOf(grade) !== -1 && q.q.indexOf('的英文是？') !== -1;
    });
  }
  function startMental() {
    var pool = shuffle(numericPool(curSubject, curGrade)).slice(0, 10);
    if (pool.length < 4) { toast('该年级口算题不足'); return; }
    setHash('mental/' + curSubject + '/g' + curGrade);
    freeMode = true; lastFreeMode = 'mental'; lastWasFlash = false; lastWrongMode = false;
    gameMode = 'mental'; wrongMode = false; battleWrongIdx = [];
    curLevel = 0;
    curQuestions = pool;
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    var s = SUBJECTS.filter(function (x) { return x.id === curSubject; })[0];
    $('battleTitle').textContent = '🔢 ' + s.name + ' 口算挑战';
    $('battleSub').textContent = '直接输入答案 · 共 ' + curQuestions.length + ' 题';
    renderBattlePet();
    renderBattle();
  }
  function startSpelling() {
    var pool = shuffle(spellingPool(curGrade)).slice(0, 10);
    if (pool.length < 4) { toast('该年级暂无拼写单词'); return; }
    setHash('spelling/' + curSubject + '/g' + curGrade);
    freeMode = true; lastFreeMode = 'spelling'; lastWasFlash = false; lastWrongMode = false;
    gameMode = 'spelling'; wrongMode = false; battleWrongIdx = []; spellLower = true;
    curLevel = 0;
    curQuestions = pool;
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    $('battleTitle').textContent = '🔤 单词拼写挑战';
    $('battleSub').textContent = '看中文，用键盘拼出英文 · 共 ' + curQuestions.length + ' 题';
    renderBattlePet();
    renderBattle();
  }
  function startFlash() {
    var deck = shuffle(gradeQuestions(curSubject, curGrade)).slice(0, 10);
    if (!deck.length) { toast('该年级暂无闪卡题目'); return; }
    setHash('flash/' + curSubject + '/g' + curGrade);
    freeMode = false; flashMode = true; lastWasFlash = true; lastFreeMode = '';
    flashDeck = deck; flashIdx = 0; flashKnown = 0; flashRevealed = false;
    earnedXp = 0;
    SFX.start();
    showScreen('battle');
    $('battleTitle').textContent = '🃏 闪卡记忆';
    $('battleSub').textContent = '心里想好答案，再翻开核对 · 共 ' + deck.length + ' 张';
    renderBattlePet();
    renderFlash();
  }
  function renderFlash() {
    $('hearts').textContent = '🃏 ' + (flashIdx + 1) + ' / ' + flashDeck.length;
    $('monsterHpFill').parentNode.style.display = 'none'; // 闪卡无战斗，隐藏怪物血条
    $('vsMark').style.display = 'none';
    $('monsterEmoji').textContent = '🦉';
    $('monsterEmoji').className = 'monster';
    renderDots();
    var q = flashDeck[flashIdx];
    $('qText').textContent = q.q;
    $('answerDisplay').className = 'answer-display hidden';
    var optEl = $('options'); optEl.innerHTML = '';
    var flip = document.createElement('button');
    flip.className = 'option flash-flip';
    flip.innerHTML = '<span>👆 想好了？点击翻开答案</span>';
    flip.addEventListener('click', flipCard);
    optEl.appendChild(flip);
    $('explain').className = 'explain'; $('explain').innerHTML = '';
    $('nextBtn').className = 'btn next-btn';
    roundLocked = false;
    flashRevealed = false;
    flashRevealed = false;
    $('comboBadge').className = 'combo-badge';
    if (curGrade <= 2) setTimeout(function () { TTS.speak(q.q, 0.85); }, 400);
  }
  function flipCard() {
    if (flashRevealed || roundLocked) return;
    flashRevealed = true;
    roundLocked = true;
    var q = flashDeck[flashIdx];
    var optEl = $('options'); optEl.innerHTML = '';
    var ans = document.createElement('div');
    ans.className = 'flash-answer';
    ans.textContent = '💡 ' + q.o[q.a];
    optEl.appendChild(ans);
    var yes = document.createElement('button');
    yes.className = 'option correct';
    yes.innerHTML = '<span>😊 我会了</span>';
    yes.addEventListener('click', function () { rateFlash(true); });
    var no = document.createElement('button');
    no.className = 'option wrong';
    no.innerHTML = '<span>🤔 还不会</span>';
    no.addEventListener('click', function () { rateFlash(false); });
    optEl.appendChild(yes); optEl.appendChild(no);
    $('explain').innerHTML = '<b>解析：</b>' + (q.e || '');
    $('explain').className = 'explain show';
    TTS.speak('答案是：' + q.o[q.a], 0.9);
    burstAtEl(ans, ['💡', '✨']);
  }
  function rateFlash(know) {
    roundLocked = false;
    if (know) { flashKnown++; earnedXp += 5; save.totalCorrect++; SFX.correct(); flashKnownStars(); }
    else { addToWrongBook(curSubject, curGrade, flashDeck[flashIdx]); SFX.wrong(); }
    flashIdx++;
    updateTopbar();
    if (flashIdx >= flashDeck.length) finishFlash();
    else renderFlash();
  }
  function flashKnownStars() { /* 闪卡掌握不加星星，避免刷星 */ }

