'use strict';

  /* ===================== 音效系统（Web Audio，无需音频文件） ===================== */
  var audioCtx = null;
  /* Chrome 自动播放策略：AudioContext 只能在用户手势（点击/触摸/按键）后创建。
   * 这里加一把锁，所有 SFX/音乐在未解锁前只静默返回，避免控制台警告。 */
  var audioUnlocked = false;
  function tryResumeAudio() {
    audioUnlocked = true;
    if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
  }
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, tryResumeAudio, true);
  });
  function ensureAudio() {
    if (!audioUnlocked) return; // 尚无用户手势：不创建 AudioContext，避免 Chrome 自动播放警告
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
  }
  function tone(freq, dur, type, vol, delay) {
    if (!audioCtx) return;
    var t0 = audioCtx.currentTime + (delay || 0);
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  var SFX = {
    click: function () { ensureAudio(); tone(720, 0.06, 'square', 0.06); },
    correct: function () { ensureAudio(); tone(523, 0.12, 'sine', 0.14); tone(659, 0.12, 'sine', 0.14, 0.09); tone(784, 0.18, 'sine', 0.14, 0.18); },
    wrong: function () { ensureAudio(); tone(220, 0.22, 'sawtooth', 0.1); tone(180, 0.28, 'sawtooth', 0.1, 0.1); },
    levelup: function () { ensureAudio(); tone(523, 0.12, 'triangle', 0.15); tone(659, 0.12, 'triangle', 0.15, 0.1); tone(784, 0.12, 'triangle', 0.15, 0.2); tone(1047, 0.28, 'triangle', 0.15, 0.3); },
    badge: function () { ensureAudio(); tone(880, 0.1, 'sine', 0.13); tone(1109, 0.22, 'sine', 0.13, 0.1); },
    start: function () { ensureAudio(); tone(392, 0.1, 'triangle', 0.12); tone(523, 0.16, 'triangle', 0.12, 0.08); },
    /* 精致化新增音效 */
    pop: function () { ensureAudio(); tone(620, 0.07, 'sine', 0.13); tone(930, 0.09, 'sine', 0.13, 0.05); },
    coin: function () { ensureAudio(); tone(988, 0.07, 'sine', 0.12); tone(1319, 0.14, 'sine', 0.12, 0.06); },
    move: function () { ensureAudio(); tone(440, 0.05, 'square', 0.05); },
    select: function () { ensureAudio(); tone(660, 0.05, 'square', 0.05); },
    fall: function () { ensureAudio(); slideTone(620, 200, 0.22, 'sawtooth', 0.08); },
    combo: function (n) { ensureAudio(); var base = 523 + (n || 1) * 80; tone(base, 0.07, 'sine', 0.12); tone(base + 200, 0.1, 'sine', 0.12, 0.05); },
    /* 象棋音效 */
    capture: function () { ensureAudio(); tone(280, 0.08, 'square', 0.07); tone(180, 0.12, 'sawtooth', 0.08, 0.06); },  // 吃子：低沉撞击
    check: function () { ensureAudio(); tone(880, 0.15, 'square', 0.1); tone(660, 0.20, 'square', 0.1, 0.1); },            // 将军：警告双音
    win: function () { ensureAudio(); tone(523, 0.15, 'sine', 0.14); tone(659, 0.15, 'sine', 0.14, 0.12); tone(784, 0.15, 'sine', 0.14, 0.24); tone(1047, 0.30, 'sine', 0.14, 0.36); }, // 胜利：上行四音
    lose: function () { ensureAudio(); tone(400, 0.18, 'sawtooth', 0.10); tone(300, 0.22, 'sawtooth', 0.10, 0.15); tone(200, 0.30, 'sawtooth', 0.10, 0.30); }, // 失败：下行三音
    illegal: function () { ensureAudio(); tone(200, 0.12, 'sawtooth', 0.08); tone(160, 0.16, 'sawtooth', 0.08, 0.10); },   // 非法走棋：短促嘟嘟
    /* 飞机大战专用 */
    boom: function () { ensureAudio(); slideTone(420, 70, 0.26, 'sawtooth', 0.11); tone(110, 0.16, 'square', 0.07, 0.03); }, // 击中敌机：爆炸轰鸣
    crash: function () { ensureAudio(); slideTone(300, 50, 0.4, 'sawtooth', 0.12); tone(80, 0.3, 'square', 0.09, 0.05); }     // 撞机：沉重爆裂
  };
  /* 滑音（宠物叫声用）：频率从 f1 滑到 f2 */
  function slideTone(f1, f2, dur, type, vol, delay) {
    if (!audioCtx) return;
    var t0 = audioCtx.currentTime + (delay || 0);
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + dur);
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  /* 每只宠物独一无二的叫声（振荡器合成，零音频文件） */
  var PET_CRIES = {
    dog:     function () { slideTone(520, 300, 0.12, 'square', 0.08); slideTone(520, 300, 0.12, 'square', 0.08, 0.16); },
    cat:     function () { slideTone(600, 950, 0.16, 'sawtooth', 0.05); slideTone(950, 480, 0.26, 'sawtooth', 0.05, 0.18); },
    pig:     function () { slideTone(210, 120, 0.18, 'sawtooth', 0.1); slideTone(210, 120, 0.18, 'sawtooth', 0.1, 0.22); },
    rabbit:  function () { tone(950, 0.06, 'sine', 0.09); tone(1150, 0.07, 'sine', 0.09, 0.09); },
    bear:    function () { slideTone(170, 90, 0.35, 'sawtooth', 0.12); },
    koala:   function () { slideTone(320, 180, 0.3, 'sawtooth', 0.08); },
    monkey:  function () { tone(820, 0.06, 'square', 0.07); tone(1020, 0.06, 'square', 0.07, 0.08); tone(820, 0.06, 'square', 0.07, 0.16); },
    chicken: function () { tone(720, 0.06, 'square', 0.08); tone(920, 0.07, 'square', 0.08, 0.08); slideTone(820, 480, 0.14, 'square', 0.08, 0.17); },
    frog:    function () { slideTone(230, 160, 0.12, 'square', 0.1); slideTone(230, 160, 0.12, 'square', 0.1, 0.15); },
    turtle:  function () { slideTone(190, 140, 0.3, 'sine', 0.1); },
    fox:     function () { slideTone(700, 1150, 0.14, 'sawtooth', 0.05); slideTone(1000, 600, 0.18, 'sawtooth', 0.05, 0.16); },
    panda:   function () { slideTone(260, 150, 0.24, 'sawtooth', 0.1); tone(420, 0.1, 'sine', 0.08, 0.27); },
    penguin: function () { tone(660, 0.08, 'square', 0.08); slideTone(520, 860, 0.16, 'square', 0.08, 0.1); },
    owl:     function () { tone(400, 0.18, 'sine', 0.1); tone(330, 0.26, 'sine', 0.1, 0.22); },
    octopus: function () { slideTone(300, 520, 0.2, 'sine', 0.09); slideTone(520, 300, 0.2, 'sine', 0.09, 0.22); },
    unicorn: function () { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.1, 'triangle', 0.1, 0.1); tone(1109, 0.1, 'triangle', 0.1, 0.2); tone(1319, 0.28, 'triangle', 0.1, 0.3); },
    dragon:  function () { slideTone(190, 70, 0.45, 'sawtooth', 0.13); slideTone(120, 260, 0.3, 'sawtooth', 0.1, 0.45); },
    ghost:   function () { slideTone(500, 720, 0.4, 'sine', 0.06); slideTone(720, 440, 0.4, 'sine', 0.06, 0.42); }
  };
  /* 扩展宠物（id 形如 pet18…）没有预置叫声时，按 id 稳定派生专属音色：
   * 同一只宠物每次叫声完全一致，不同宠物音高/波形/时长都不同，
   * 无需为 232 只扩展宠物硬编码，也不会全部退化成狗叫。 */
  function petHash(s, salt, mod) {
    var h = salt, i;
    for (i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) % mod;
    return h;
  }
  function petCryById(id) {
    var s = String(id || '');
    /* 四个参数各用独立哈希：若共用同一 seed 取模，相近 id 的哈希只差 1，
       参数会强相关，组合数退化到 42 种（几百只宠物叫声重复）。 */
    /* 四个 mod 取互质（13/7/4/5），组合周期 = 1820，远大于宠物总数，
       保证每只宠物的参数组合都不同（若 mod 不互质，周期会被 lcm 拉低导致大量重音）。 */
    var a = petHash(s, 7, 13);   /* 基频档 0~12 */
    var b = petHash(s, 23, 7);   /* 上扬档 0~6  */
    var c = petHash(s, 41, 4);   /* 波形   0~3  */
    var d = petHash(s, 59, 5);   /* 时长档 0~4  */
    var base = 240 + a * 48;                                 /* 基频 240~816 */
    var peak = Math.round(base * (1.25 + b * 0.09));          /* 上扬目标音高 */
    var wave = ['sine', 'square', 'triangle', 'sawtooth'][c]; /* 四种音色 */
    var dur = 0.13 + d * 0.035;
    slideTone(base, peak, dur, wave, 0.07);
    slideTone(peak, Math.round(base * 0.8), dur + 0.06, wave, 0.06, dur + 0.04);
  }
  function petCry(id) {
    ensureAudio();
    if (PET_CRIES[id]) PET_CRIES[id]();
    else petCryById(id);
  }
  /* 宠物讨好主人的随机台词 */
  var PET_TALK = [
    '主人最棒啦！', '我会一直陪着你的！', '带我一起闯关吧！', '今天也要加油哦！',
    '嘿嘿，最喜欢主人啦！', '答对题目给我加餐哦！', '我们是最强搭档！', '再答几题就带我玩嘛！',
    '主人加油，我给你打气！', '你笑起来真好看！'
  ];
  function petTalk() { return PET_TALK[Math.floor(Math.random() * PET_TALK.length)]; }

