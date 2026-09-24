'use strict';
  /* ===================== 四大名著专区 ===================== */
  var CLASSICS = window.__CLASSICS__ || [];
  var curClassic = null;
  function showClassics() {
    setHash('classics');
    renderClassics();
    showScreen('classicHub');
    focusFirstNav($('classicHubScreen'));
  }
  function renderClassics() {
    var el = $('classicGrid'); el.innerHTML = '';
    CLASSICS.forEach(function (b, i) {
      var d = document.createElement('button');
      d.className = 'classic-card';
      d.style.background = 'linear-gradient(135deg,' + b.grad[0] + ',' + b.grad[1] + ')';
      d.style.animationDelay = (i * 0.08) + 's';
      d.innerHTML = '<span class="cc-glow"></span><span class="cc-icon">' + b.icon + '</span>' +
        '<div class="cc-name">' + b.name + '</div><div class="cc-meta">' + b.author + ' · ' + b.dynasty + ' · 人物' + b.people.length + ' / 故事' + b.stories.length + '</div>' +
        '<div class="cc-tag">' + b.tag + '</div>';
      d.addEventListener('click', function () { SFX.click(); showClassicBook(b.id); });
      el.appendChild(d);
    });
  }
  function showClassicBook(id) {
    var b = CLASSICS.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    curClassic = b;
    setHash('classic/' + id);
    renderClassicBook();
    showScreen('classicBook');
    focusFirstNav($('classicBookScreen'));
  }
  function renderClassicBook() {
    var b = curClassic;
    $('cbTitle').textContent = b.icon + ' ' + b.name;
    $('cbSub').textContent = b.author + ' · ' + b.dynasty + ' · ' + b.tag;
    $('cbIntro').innerHTML = '<div class="hub-label">' + b.icon + ' 这本书讲什么？</div>' +
      '<div style="font-size:.88rem;line-height:1.7">' + b.intro + '</div>' +
      '<button class="btn btn-outline" style="margin-top:.5rem;padding:.4rem .8rem;font-size:.8rem" id="cbIntroRead">🔊 听讲解</button>';
    $('cbIntroRead').onclick = function () { SFX.click(); TTS.speak(b.intro, 0.9); };
    var people = $('cbPeople'); people.innerHTML = '';
    b.people.forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'cl-card';
      d.style.animationDelay = (i * 0.09) + 's';
      d.style.borderLeft = '.3rem solid ' + b.color;
      d.innerHTML = '<div class="cl-head"><div class="cl-avatar" style="background:' + b.grad[1] + '55">' + p.icon + '</div>' +
        '<div class="cl-name">' + p.name + '<span class="cl-title" style="background:' + b.color + '">' + p.title + '</span></div></div>' +
        '<button class="cl-read">🔊</button>' +
        '<div class="cl-text">' + p.text + '</div>' +
        '<div class="cl-tip" style="background:' + b.grad[1] + '55">💡 ' + p.tip + '</div>';
      d.querySelector('.cl-read').addEventListener('click', function (e) {
        e.stopPropagation(); SFX.click(); TTS.speak(p.name + '，' + p.title + '。' + p.text, 0.9);
      });
      people.appendChild(d);
    });
    renderChapters();
    var stories = $('cbStories'); stories.innerHTML = '';
    b.stories.forEach(function (s, i) {
      var d = document.createElement('div');
      d.className = 'cl-card';
      d.style.animationDelay = (i * 0.07) + 's';
      d.style.borderLeft = '.3rem solid ' + b.color;
      var ext = (window.__CLASSIC_EXT__ || {})[b.id + '-' + i] || {};
      d.innerHTML = '<span class="cl-order">' + (i + 1) + '</span>' +
        '<div class="cl-head"><div class="cl-avatar" style="background:' + b.grad[1] + '55">' + s.icon + '</div>' +
        '<div class="cl-name">' + s.title + '</div></div>' +
        '<button class="cl-read" style="right:2.65rem" title="看皮影戏">🎭</button><button class="cl-read" title="听朗读">🔊</button>' +
        '<div class="cl-text">' + s.text + '</div>' +
        (ext.q ? '<div class="cl-quote">📜 原著金句：' + ext.q + '</div>' : '') +
        (ext.w && ext.w.length ? '<div class="cl-words">' + ext.w.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' : '') +
        '<div class="cl-tip" style="background:' + b.grad[1] + '55">💡 这个故事告诉我们：' + s.tip + '</div>';
      var btns = d.querySelectorAll('.cl-read');
      btns[0].addEventListener('click', function (e) {
        e.stopPropagation(); SFX.click(); openPuppetShow(b.id, i);
      });
      btns[1].addEventListener('click', function (e) {
        e.stopPropagation(); SFX.click();
        var say = '第' + (i + 1) + '个故事，' + s.title + '。' + s.text;
        if (ext.q) say += '。书里有名句：' + ext.q;
        say += '。这个故事告诉我们：' + s.tip;
        TTS.speak(say, 0.9);
      });
      stories.appendChild(d);
    });
  }

  /* ===================== 皮影戏剧场（故事可视化播放） ===================== */
  var PUPPET_RULES = [
    [/妖怪|妖精|妖|魔|怪|精/, { e: '👹', a: 'fight' }],
    [/打|杀|斩|战|吼|撞|摔|掰|制服|收服|斗/, { e: '⚔️', a: 'fight' }],
    [/火|烧|灯|炎/, { e: '🔥', a: 'fire' }],
    [/哭|泪|伤心|含恨|难过/, { e: '💧', a: 'sad' }],
    [/笑|开心|喝彩|有趣|逗/, { e: '😄', a: 'happy' }],
    [/计|谋|智|想|算|骗|学问|诗/, { e: '✨', a: 'magic' }],
    [/借|求|请|学|拜/, { e: '🙏', a: 'walk' }],
    [/龙|海|河|江|船|水|涧/, { e: '🌊', a: 'walk' }],
    [/酒|碗|茶|饭|果/, { e: '🍶', a: 'walk' }],
    [/雪/, { e: '❄️', a: 'walk' }],
    [/雨/, { e: '🌧️', a: 'walk' }],
    [/山|桥|冈|崖/, { e: '⛰️', a: 'walk' }],
    [/城|宫|府|园|庄|楼/, { e: '🏯', a: 'walk' }],
    [/虎/, { e: '🐯', a: 'fight' }],
    [/刀|枪|剑|戟|棒|斧|箭|耙|矛/, { e: '⚔️', a: 'fight' }],
    [/树|杨柳|桃|花|草/, { e: '🌳', a: 'walk' }],
    [/玉|宝|扇|镜|琴|信/, { e: '💎', a: 'magic' }],
    [/马/, { e: '🐎', a: 'walk' }],
    [/兄弟|结拜|朋友|感情/, { e: '🤝', a: 'happy' }]
  ];
  var ppState = null;
  /* 人物 → 皮影造型映射（t: 造型模板, robe: 戏服色, w: 兵器） */
  var PUPPET_CAST = {
    '孙悟空': { t: 'monkey', robe: '#e67e22', w: '🪄' },
    '唐僧': { t: 'monk', robe: '#d5c8a1' },
    '猪八戒': { t: 'pig', robe: '#9b59b6' },
    '沙僧': { t: 'monk', robe: '#8d6e63' },
    '白龙马': { t: 'horse', robe: '#ecf0f1' },
    '诸葛亮': { t: 'scholar', robe: '#ecf0f1' },
    '刘备': { t: 'noble', robe: '#2ecc71' },
    '关羽': { t: 'general', robe: '#c0392b', w: '⚔️' },
    '张飞': { t: 'general', robe: '#34495e', w: '🗡️' },
    '曹操': { t: 'noble', robe: '#34495e' },
    '赵云': { t: 'general', robe: '#4a90d9', w: '⚔️' },
    '宋江': { t: 'noble', robe: '#e67e22' },
    '武松': { t: 'general', robe: '#c0392b', w: '🗡️' },
    '林冲': { t: 'general', robe: '#16a085', w: '⚔️' },
    '鲁智深': { t: 'monk', robe: '#e67e22', w: '🪄' },
    '李逵': { t: 'general', robe: '#2c3e50', w: '🪓' },
    '贾宝玉': { t: 'noble', robe: '#3498db' },
    '林黛玉': { t: 'lady', robe: '#c8a2c8' },
    '薛宝钗': { t: 'lady', robe: '#f1c40f' },
    '王熙凤': { t: 'lady', robe: '#e74c3c' },
    '刘姥姥': { t: 'old', robe: '#795548' }
  };
  function puppetHat(t) {
    if (t === 'monkey') return '<div class="hband"></div><div class="ear l"></div><div class="ear r"></div>';
    if (t === 'pig') return '<div class="ear l"></div><div class="ear r"></div><div class="snout"></div>';
    if (t === 'monk') return '<div class="hmonk"></div>';
    if (t === 'general') return '<div class="hgen"></div><div class="plume"></div>';
    if (t === 'noble') return '<div class="hnoble"></div>';
    if (t === 'scholar') return '<div class="hnoble" style="background:#5d6d7e"></div>';
    if (t === 'lady') return '<div class="bun"></div><div class="hflower">🌸</div>';
    if (t === 'old') return '<div class="bun" style="background:#ccc"></div>';
    if (t === 'monster') return '<div class="horn l"></div><div class="horn r"></div>';
    return '';
  }
  function buildPuppet(cfg, act) {
    var d = document.createElement('div');
    d.className = 'pp-puppet act-' + act;
    d.title = cfg.name || '';
    d.style.setProperty('--robe', cfg.robe);
    d.style.setProperty('--skin', cfg.skin || '#f5cba7');
    var h = '<div class="pp-stick"></div><div class="pp-stick s2"></div>';
    if (cfg.t === 'horse' || cfg.t === 'tiger') {
      h += '<div class="beast"></div><div class="bhead"><div class="eye l"></div><div class="eye r"></div></div>' +
        '<div class="btail"></div>' +
        '<div class="bleg" style="left:.45rem"></div><div class="bleg" style="left:1rem"></div>' +
        '<div class="bleg" style="right:1rem"></div><div class="bleg" style="right:.45rem"></div>';
    } else {
      h += '<div class="leg l"></div><div class="leg r"></div>' +
        '<div class="torso"></div>' +
        '<div class="arm l"></div><div class="arm r"></div>' +
        (cfg.w ? '<div class="weapon">' + cfg.w + '</div>' : '') +
        '<div class="head">' + puppetHat(cfg.t) + '<div class="eye l"></div><div class="eye r"></div></div>';
    }
    d.innerHTML = h;
    return d;
  }
  var ppMusicWasOn = false; // 进剧场前全局背景乐的状态（退出时恢复用）
  /* 让位机制：剧场内静音全局背景乐，退出后按原状态恢复 */
  function ppDuckGlobalMusic(muted) {
    if (muted) {
      clearTimeout(musicTimer); musicTimer = null;
      if (musicGain) musicGain.gain.value = 0;
    } else if (musicOn) {
      if (ensureMusic()) {
        musicGain.gain.value = 0.05;
        if (!musicTimer) scheduleBar();
      }
    }
  }
  /* 皮影戏专属配乐：五声音阶弹拨 + 低锣点（合成，零音频文件） */
  var PP_MELODY = [523, 587, 659, 784, 880, 784, 659, 587, 523, 587, 659, 440, 392, 659, 587, 523];
  var ppMusicTimer = null, ppMusicStep = 0;
  function ppMusicStop() { clearTimeout(ppMusicTimer); ppMusicTimer = null; }
  function ppMusicStart() {
    ppMusicStop();
    ensureAudio();
    var step = function () {
      if (!ppState || !ppState.sound) { ppMusicStop(); return; }
      var f = PP_MELODY[ppMusicStep % PP_MELODY.length];
      tone(f, 0.3, 'triangle', 0.04);
      if (ppMusicStep % 4 === 0) tone(f / 2, 0.35, 'sine', 0.03);
      if (ppMusicStep % 16 === 0) tone(130, 0.6, 'sine', 0.06);
      ppMusicStep++;
      ppMusicTimer = setTimeout(step, 340);
    };
    step();
  }
  function puppetScenes(text) {
    var parts = text.split(/(?=[。！？；])/);
    var scenes = [];
    parts.forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var roles = [], seen = {}, act = 'walk', actRank = { fight: 3, magic: 2, sad: 1, fire: 2, happy: 1, walk: 0 };
      PUPPET_RULES.forEach(function (r) {
        if (r[0].test(line) && !seen[r[1].e]) {
          seen[r[1].e] = 1;
          roles.push(r[1]);
          if (actRank[r[1].a] > actRank[act]) act = r[1].a;
        }
      });
      scenes.push({ line: line, roles: roles.slice(0, 3), act: act });
    });
    return scenes.length ? scenes : [{ line: text, roles: [], act: 'walk' }];
  }
  function openPuppetShow(bookId, idx) {
    var b = CLASSICS.filter(function (x) { return x.id === bookId; })[0];
    if (!b) return;
    var s = b.stories[idx];
    if (!s) return;
    var cast = [];
    b.people.forEach(function (p) {
      if (s.text.indexOf(p.name) !== -1 && cast.length < 4) {
        var cfg = PUPPET_CAST[p.name] || { t: 'general', robe: b.color };
        cast.push({ t: cfg.t, robe: cfg.robe, w: cfg.w, name: p.name });
      }
    });
    if (!cast.length) cast.push({ t: 'general', robe: b.color, name: '主角' });
    ppState = { book: b, story: s, idx: idx, scenes: puppetScenes(s.text), cast: cast, auto: true, sound: true, timer: null };
    $('ppTitle').textContent = s.title;
    $('puppetModal').className = 'modal-mask show';
    ppMusicWasOn = musicOn;
    if (ppMusicWasOn) ppDuckGlobalMusic(true); // 全局背景乐让位
    ppMusicStart();
    ppShowScene(0);
  }
  function ppShowScene(i) {
    var st = ppState;
    if (!st) return;
    st.idx = Math.max(0, Math.min(i, st.scenes.length - 1));
    var sc = st.scenes[st.idx];
    var castEl = $('ppCast'); castEl.innerHTML = '';
    st.cast.forEach(function (c) {
      castEl.appendChild(buildPuppet(c, sc.act));
    });
    sc.roles.forEach(function (r, k) {
      var f = document.createElement('div');
      f.className = 'pp-fx';
      f.textContent = r.e;
      f.style.animationDelay = (0.15 + k * 0.12) + 's';
      castEl.appendChild(f);
    });
    /* 场景停留节奏由“朗读时长”驱动，而非字幕滚动时长：
       原逻辑用 marqSecs(>=9s) 作切换延时，朗读早已结束却要干等字幕滚完才切下一幕，
       中间出现空白停顿。改为按文本长度估算朗读秒数作字幕时长，并由 TTS 朗读结束回调精确切幕 */
    var marqSecs = Math.max(2.5, Math.round(sc.line.length * 0.32));
    $('ppSub').innerHTML = '<span class="pp-marquee" style="animation-duration:' + marqSecs + 's">🎬 第 <b>' + (st.idx + 1) + ' / ' + st.scenes.length + '</b> 幕 ｜ ' + sc.line + '</span>';
    var rect = $('puppetStage').getBoundingClientRect();
    if (sc.act === 'fight') burst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['💥', '⚡']);
    else if (sc.act === 'fire') burst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['🔥', '✨']);
    else if (sc.act === 'happy') burst(rect.left + rect.width / 2, rect.top + rect.height / 2, ['✨', '🎉']);
    clearTimeout(st.timer);
    function ppGoNext() {
      if (!ppState || ppState !== st) return; // 已切换/关闭则作废，防止过期回调误切
      if (st.idx >= st.scenes.length - 1) { ppEnd(); return; }
      ppShowScene(st.idx + 1);
    }
    if (st.auto) st.timer = setTimeout(ppGoNext, marqSecs * 1000 + 600); // 字幕兜底：朗读结束回调未触发时按字幕时长切
    if (st.sound && TTS.enabled) {
      // 朗读结束立即（留 0.8s 余量）切下一幕；全局语音关闭时 TTS 不发声，仅走字幕兜底
      TTS.speak(sc.line, 0.95, 1.2, st.auto ? function () {
        clearTimeout(st.timer);
        st.timer = setTimeout(ppGoNext, 800);
      } : null);
    }
  }
  function ppEnd() {
    var st = ppState;
    if (!st) return;
    clearTimeout(st.timer);
    $('ppPlay').textContent = '▶ 重播';
    $('ppSub').innerHTML = '—— 完 —— ' + st.story.title + ' 讲完啦！💡 ' + st.story.tip;
    if (st.sound) TTS.speak('故事讲完啦！这个故事告诉我们：' + st.story.tip, 0.9);
  }
  function ppTogglePlay() {
    var st = ppState;
    if (!st) return;
    if (st.auto) {
      st.auto = false; clearTimeout(st.timer); $('ppPlay').textContent = '▶ 播放';
    } else {
      st.auto = true; $('ppPlay').textContent = '⏸ 暂停';
      if (st.idx >= st.scenes.length - 1) ppShowScene(0); else ppShowScene(st.idx + 1);
    }
  }
  function closePuppet() {
    ppMusicStop();
    if (ppMusicWasOn) ppDuckGlobalMusic(false); // 恢复全局背景乐
    ppMusicWasOn = false;
    if (ppState) { clearTimeout(ppState.timer); TTS.stop(); }
    ppState = null;
    $('puppetModal').className = 'modal-mask';
  }

  /* ===================== 全书章回阅读器 ===================== */
  var chState = null;
  function chsForBook(id) {
    var all = (window.__CLASSIC_CHS__ || {})[id] || [];
    return all.map(function (s) {
      var i = s.indexOf('||');
      return { title: i === -1 ? s : s.slice(0, i), text: i === -1 ? '' : s.slice(i + 2) };
    });
  }
  function renderChapters() {
    var b = curClassic;
    var chs = chsForBook(b.id);
    $('cbChCount').textContent = chs.length;
    var el = $('cbChapters'); el.innerHTML = '';
    if (!chs.length) {
      el.innerHTML = '<span style="font-size:.75rem;color:var(--muted)">本书章回内容整理中，敬请期待…</span>';
      return;
    }
    chs.forEach(function (c, i) {
      var b2 = document.createElement('button');
      b2.className = 'ch-chip';
      var lines = c.title.split(/\s+/).filter(function (x) { return x; });
      b2.innerHTML = '<i>第' + (i + 1) + '回</i><span>' + lines.join('<br>') + '</span>';
      b2.title = c.title;
      b2.addEventListener('click', function () { SFX.click(); openChapter(b.id, i); });
      el.appendChild(b2);
    });
  }
  function openChapter(bookId, idx) {
    var b = CLASSICS.filter(function (x) { return x.id === bookId; })[0];
    var chs = chsForBook(bookId);
    if (!b || !chs.length) return;
    chState = { book: b, chs: chs, idx: Math.max(0, Math.min(idx, chs.length - 1)), reading: false, auto: false };
    $('chAuto').textContent = '🔁 连播';
    $('chapterModal').className = 'modal-mask show';
    chShow(chState.idx);
  }
  function chShow(i) {
    var st = chState;
    if (!st) return;
    TTS.stop(); chReadStop(); // 翻页时停掉上一回朗读
    st.idx = Math.max(0, Math.min(i, st.chs.length - 1));
    var c = st.chs[st.idx];
    $('chTitle').textContent = '📜 ' + st.book.name + ' · 第 ' + (st.idx + 1) + ' 回';
    $('chBody').innerHTML = '<div class="ch-hui">' + c.title + '</div><div class="ch-text">' + c.text + '</div>' +
      '<div class="ch-nav-tip">本章 ' + (st.idx + 1) + ' / ' + st.chs.length + ' · 点击 🔊 可听朗读</div>';
  }
  function chRead() {
    if (!chState) return;
    var btn = $('chRead');
    if (chState.reading) { TTS.stop(); chReadStop(); chSetAuto(false); return; } // 再点一次 = 停止（并退出连播）
    if (!TTS.enabled) { toast('当前设备浏览器不支持语音朗读'); return; }
    var c = chState.chs[chState.idx];
    chState.reading = true;
    btn.textContent = '⏹ 停止';
    var myIdx = chState.idx;
    var ok = TTS.speak('第' + (chState.idx + 1) + '回，' + c.title + '。' + c.text, 0.9, 1.1, function () {
      if (!chState || chState.idx !== myIdx) { chReadStop(); return; }
      if (chState.auto && chState.idx < chState.chs.length - 1) {
        chShow(chState.idx + 1);   // 自动切下一回
        chRead();                  // 继续朗读
      } else {
        chReadStop();
        chSetAuto(false);          // 连播到最后一回后自动关闭
      }
    });
    if (!ok) chReadStop(); // 引擎不支持等异常：立即复位按钮
  }
  function chSetAuto(on) {
    if (chState) chState.auto = on;
    $('chAuto').textContent = on ? '🔁 连播中' : '🔁 连播';
  }
  function chToggleAuto() {
    if (!chState) return;
    SFX.click();
    if (chState.auto) { chSetAuto(false); return; } // 再点取消连播
    chSetAuto(true);
    if (!chState.reading) chRead(); // 未在朗读则立即开播
  }
  function chReadStop() {
    if (chState) chState.reading = false;
    $('chRead').textContent = '🔊 朗读';
  }
  function closeChapter() {
    TTS.stop();
    chState = null;
    $('chRead').textContent = '🔊 朗读';
    $('chAuto').textContent = '🔁 连播';
    $('chapterModal').className = 'modal-mask';
  }

  /* ===================== 词库顺序闯关（人教版 3~9 年级，含音标/读音/重点词） ===================== */
  function libWordsForGrade(g) {
    var ipa = (window.__PEP_IPA__ && window.__PEP_IPA__[g]) || {};
    var list = [];
    var srcList = (window.__EN_WORDS__ && window.__EN_WORDS__[g]) || '';
    srcList.split('|').forEach(function (s) {
      var i = s.trim().lastIndexOf(' ');
      var w = s.slice(0, i).trim(), cn = s.slice(i + 1).trim();
      if (!w || !cn) return;
      var meta = ipa[w] || '';
      list.push({ w: w, cn: cn, ipa: meta.replace(/\*/g, ''), key: meta.indexOf('*') !== -1 });
    });
    return list;
  }
  var WORDS_PER_LEVEL = 10;
  function libLevelCount(g) { return Math.max(1, Math.ceil(libWordsForGrade(g).length / WORDS_PER_LEVEL)); }
  function libWordPassedCount() { var c = 0, k; for (k in (save.wordLibStars || {})) { if (save.wordLibStars[k] > 0) c++; } return c; }
  function showWordLib() {
    setHash('word-lib/g' + wordLibGrade);
    renderWordLib();
    showScreen('wordLib');
    focusFirstNav($('wordLibScreen'));
  }
  function renderWordLib() {
    var words = libWordsForGrade(wordLibGrade);
    var keyCount = words.filter(function (e) { return e.key; }).length;
    var n = libLevelCount(wordLibGrade);
    var passed = 0, lv;
    for (lv = 0; lv < n; lv++) { if ((save.wordLibStars[wordLibGrade + '-' + lv] || 0) > 0) passed++; }
    var pct = n ? Math.round(passed / n * 100) : 0;
    $('wordLibSub').textContent = '人教版 ' + wordLibGrade + ' 年级 · 共 ' + words.length + ' 词（重点词 ' + keyCount + ' 个）· 每关 ' + WORDS_PER_LEVEL + ' 词';
    var progEl = $('wordLibProgress');
    if (progEl) progEl.innerHTML = '📊 通关进度：<b>' + passed + ' / ' + n + '</b> 关（' + pct + '%）· 已学 <b>' + Math.min(passed * WORDS_PER_LEVEL, words.length) + '</b> 词' +
      '<span class="bar-wrap" style="display:inline-block;vertical-align:middle;width:6rem;height:.55rem;margin-left:.4rem"><i class="bar" style="display:block;width:' + pct + '%"></i></span>';
    renderCountChips('wordLibGradeRow', [3, 4, 5, 6, 7, 8, 9], wordLibGrade, function (v) { wordLibGrade = v; renderWordLib(); });
    var el = $('wordLibMap'); el.innerHTML = '';
    var n = libLevelCount(wordLibGrade);
    for (var lv = 0; lv < n; lv++) {
      var unlocked = lv === 0 || (save.wordLibStars[wordLibGrade + '-' + (lv - 1)] || 0) > 0;
      var stars = save.wordLibStars[wordLibGrade + '-' + lv] || 0;
      var b = document.createElement('button');
      b.className = 'level-node' + (unlocked ? '' : ' locked');
      b.innerHTML = (unlocked ? (lv + 1) : '🔒') + '<span class="lv-stars">' + repeatStr('⭐', stars) + '</span>';
      (function (lv2, un) {
        b.addEventListener('click', function () {
          if (!un) { toast('🔒 先通过上一关才能解锁'); return; }
          SFX.click();
          startWordLibLevel(wordLibGrade, lv2);
        });
      })(lv, unlocked);
      el.appendChild(b);
    }
  }
  function startWordLibLevel(g, lv) {
    var words = libWordsForGrade(g);
    var slice = words.slice(lv * WORDS_PER_LEVEL, lv * WORDS_PER_LEVEL + WORDS_PER_LEVEL);
    if (!slice.length) { toast('🎉 该年级词库已全部通关！'); return; }
    libWordMode = true; dailyMode = ''; dailyReport = null; dailyIsReview = false;
    freeMode = false; wrongMode = false; battleWrongIdx = []; flashMode = false; lastWasFlash = false;
    gameMode = 'spelling'; roundTimes = []; roundOk = []; spellLower = true;
    curSubject = 'english'; curGrade = g; curLevel = lv;
    curQuestions = slice.map(function (e) {
      return { q: '“' + e.cn + '”的英文是？', o: [e.w], a: 0, e: e.w + ' /' + e.ipa + '/' + (e.key ? '（⭐重点词）' : ''), ipa: e.ipa, key: e.key };
    });
    setHash('word-lib/g' + g + '/' + lv);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0; earnedFood = 0;
    showScreen('battle');
    $('battleTitle').textContent = '📖 词库闯关 · ' + GRADE_LABEL[g] + '年级 · 第 ' + (lv + 1) + ' 关';
    $('battleSub').textContent = '共 ' + slice.length + ' 词 · 自动朗读 · 拼对赚🍖';
    renderBattlePet();
    renderBattle();
  }

  /* ===================== 语音朗读（Web Speech API，浏览器内置 TTS，零音频文件） ===================== */
  var TTS = {
    enabled: (typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'),
    _token: 0, /* 朗读令牌：新朗读/停止会使旧的回调作废，防止串音与误复位 */
    _voices: null, /* 语音列表缓存：getVoices 异步加载，用 onvoiceschanged 刷新 */
    /* 朗读时让全局背景乐让位：部分内核上 Web Audio（背景乐振荡器）持续播放会抢占音频焦点，
       导致 speechSynthesis 偶发被静默丢弃（表现为"背景乐开着时点播放题目没反应"），
       故朗读开始让背景乐静音让位、朗读结束再恢复 */
    _duckedByTTS: false,
    _duckMusic: function () {
      if (this._duckedByTTS) return;
      if (musicOn && musicTimer) { // 仅在背景乐确实在播放时让位（剧场/休息已让位则不再重复处理）
        clearTimeout(musicTimer); musicTimer = null;
        if (musicGain) musicGain.gain.value = 0;
        this._duckedByTTS = true;
      }
    },
    _restoreMusic: function () {
      if (!this._duckedByTTS) return;
      this._duckedByTTS = false;
      if (musicOn && !ppState) { // 剧场/休息让位期间不抢回背景乐
        if (ensureMusic()) {
          if (musicGain) musicGain.gain.value = 0.05;
          if (!musicTimer) scheduleBar();
        }
      }
    },
    /* 获取并缓存语音列表；getVoices 是异步加载的，需配合 onvoiceschanged 刷新 */
    _getVoices: function () {
      try {
        if (this._voices && this._voices.length) return this._voices;
        var vs = speechSynthesis.getVoices() || [];
        if (vs.length) this._voices = vs;
        return vs;
      } catch (e) { return []; }
    },
    /* 口语化预处理：去除会被误读或卡顿的 emoji/装饰符号，压缩空白，
       英文句末标点后补空格帮助英文语音正确断句，让朗读更干净自然 */
    _clean: function (text) {
      var s = String(text);
      s = s.replace(/[\uD83C-\uD83F][\uDC00-\uDFFF]/g, ''); // 主要 emoji（代理对）
      s = s.replace(/[\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u2190-\u21FF\u2300-\u23FF]/g, ''); // 符号/箭头/变体选择符/零宽连接符
      s = s.replace(/\s+/g, ' ');
      s = s.replace(/([.!?;:])(?=[A-Za-z])/g, '$1 '); // 英文句末标点后补空格
      return s;
    },
    /* Chrome 的 cancel() 与 speak() 有竞态 bug（紧跟调用会被 interrupted 吞掉），需延迟重发；
       长文本一次朗读在部分内核会静默失败，故分句切块排队朗读 */
    speak: function (text, rate, pitch, onEnd) {
      if (!this.enabled || !text) { if (onEnd) try { onEnd(); } catch (e) {} return false; }
      var self = this;
      var myToken = ++this._token;
      try { speechSynthesis.cancel(); } catch (e) {}
      self._duckMusic(); // 朗读开始：背景乐让位，避免与 speechSynthesis 争抢音频焦点
      /* 分句切块：遇句号/问号等且已积攒 40 字以上就切一段 */
      var s = self._clean(text), chunks = [], buf = '', i, ch;
      for (i = 0; i < s.length; i++) {
        ch = s.charAt(i); buf += ch;
        if ('。！？；\n'.indexOf(ch) !== -1 && buf.length >= 40) { chunks.push(buf); buf = ''; }
      }
      if (buf) {
        if (chunks.length && buf.length < 20) chunks[chunks.length - 1] += buf;
        else chunks.push(buf);
      }
      /* 语速/音调收敛到自然区间：过高会尖细机械，过慢会拖沓生硬 */
      var r = rate || 0.88;
      if (r > 1.3) r = 1.3; else if (r < 0.6) r = 0.65;
      var p = pitch || 1.0;
      if (p > 1.25) p = 1.22; else if (p < 0.75) p = 0.8;
      var retried0 = false;
      function playChunk(k) {
        if (self._token !== myToken) return; // 已被新朗读/停止取代
        if (k >= chunks.length) { self._restoreMusic(); if (onEnd) try { onEnd(); } catch (e) {} return; }
        var u = new SpeechSynthesisUtterance(chunks[k]);
        u.lang = 'zh-CN';
        u.rate = r;   // 放慢语速，适合低年级
        u.pitch = p;  // 自然音调，不过高尖细
        var v = self.zhVoice();
        if (v) u.voice = v;
        u.onend = function () { if (self._token === myToken) playChunk(k + 1); };
        u.onerror = function () {
          if (self._token !== myToken) return;
          /* 首段被竞态吞掉：延迟重试一次；中途失败：跳到下一句避免整篇卡死 */
          if (k === 0 && !retried0) { retried0 = true; setTimeout(function () { playChunk(0); }, 260); return; }
          playChunk(k + 1);
        };
        try {
          speechSynthesis.speak(u);
          if (speechSynthesis.paused) speechSynthesis.resume(); // 后台切回被暂停时自动恢复
        } catch (e) { if (onEnd) try { onEnd(); } catch (e2) {} }
      }
      setTimeout(function () { playChunk(0); }, 150);
      return true;
    },
    /* 优先选自然度高的中文语音：在线自然语音（晓晓/云希等 Azure Neural）> 本地优质语音（慧慧/瑶瑶等）。
       部分内核不选 voice 会静音，故尽量返回可用 voice */
    zhVoice: function () {
      try {
        var vs = this._getVoices();
        var best = null, bestScore = -1, i, v, lang, name, score;
        for (i = 0; i < vs.length; i++) {
          v = vs[i];
          lang = (v.lang || '').toLowerCase();
          if (!/^zh/.test(lang) && !/^cmn/.test(lang)) continue; // 只认普通话/中文
          name = v.name || '';
          score = 0;
          if (/natural/i.test(name)) score += 100;                    // 在线自然语音
          if (/xiaoxiao|xiaoyi|xiaohan|xiaomo|xiaoshuang|xiaoxuan|xiaozhen|xiaoyan|xiaorui|xiaomeng|xiaochen|yunxi|yunjian|yunyang|yunxia|yunye|yunhao/i.test(name)) score += 90; // 微软自然语音名
          else if (/huihui|yaoyao|kangkang|tingting|meijia|lili|sinji/i.test(name)) score += 50; // 本地常见中文语音
          if (/microsoft/i.test(name) && /online/i.test(name)) score += 60; // 微软在线语音
          if (v.localService) score += 25;                            // 本地语音更稳定
          if (/zh-cn|cmn-cn|zh-hans/i.test(lang)) score += 12;        // 简体普通话优先
          if (v.default) score += 3;
          if (score > bestScore) { bestScore = score; best = v; }
        }
        return best;
      } catch (e) {}
      return null;
    },
    /* 优先选英文发音（en-US 优先，自然语音优先） */
    enVoice: function () {
      try {
        var vs = this._getVoices();
        var best = null, bestScore = -1, i, v, lang, name, score;
        for (i = 0; i < vs.length; i++) {
          v = vs[i];
          lang = (v.lang || '').toLowerCase();
          if (!/^en/.test(lang)) continue;
          name = v.name || '';
          score = 0;
          if (/natural/i.test(name)) score += 100;
          if (/aria|jenny|guy|ana|susan|samantha|alex|daniel|karen|moira|tessa|zira|david|mark|ava|allison/i.test(name)) score += 40; // 常见高质量英文语音
          if (/en-us/i.test(lang)) score += 20;
          if (v.localService) score += 10;
          if (v.default) score += 3;
          if (score > bestScore) { bestScore = score; best = v; }
        }
        return best;
      } catch (e) {}
      return null;
    },
    stop: function () { this._token++; this._restoreMusic(); if (this.enabled) { try { speechSynthesis.cancel(); } catch (e) {} } },
    /* 英文单词读音（en-US，慢速） */
    speakEn: function (text) {
      if (!this.enabled || !text) return;
      var self = this;
      this._token++;
      this._duckMusic(); // 朗读开始：背景乐让位
      try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(self._clean(text));
        u.lang = 'en-US';
        u.rate = 0.7;
        u.pitch = 1;
        var v = self.enVoice();
        if (v) u.voice = v; // 指定英文语音，避免用默认中文语音读英文单词导致生硬
        u.onend = function () { self._restoreMusic(); }; // 英文单词读完恢复背景乐
        speechSynthesis.speak(u);
      } catch (e) { this._restoreMusic(); }
    },
    /* 故事朗读（舒缓模式）：更慢语速 + 柔和低音调 + 逐句停顿，
     * 让声音娓娓道来、更有睡前故事的情感节奏（与答题/提示的普通朗读区分）
     * lang：'zh-CN'（默认，中文）或 'en-US'（英文，用英文语音） */
    speakStory: function (text, onEnd, lang) {
      if (!this.enabled || !text) { if (onEnd) try { onEnd(); } catch (e) {} return false; }
      var self = this;
      var myToken = ++this._token;
      try { speechSynthesis.cancel(); } catch (e) {}
      self._duckMusic(); // 朗读开始：背景乐让位
      var isEn = lang === 'en-US';
      /* 按句切分：每句独立成段，句间停顿，形成舒缓的朗读节奏（中英文句读符号不同） */
      var stops = isEn ? '.!?;\n' : '。！？；\n';
      var s = self._clean(text), chunks = [], buf = '', i, ch;
      for (i = 0; i < s.length; i++) {
        ch = s.charAt(i); buf += ch;
        if (stops.indexOf(ch) !== -1) {
          if (buf.replace(/[\s\n]/g, '').length > 0) chunks.push(buf);
          buf = '';
        }
      }
      if (buf.replace(/[\s\n]/g, '').length > 0) chunks.push(buf);
      if (!chunks.length) { if (onEnd) try { onEnd(); } catch (e) {} return false; }
      var GAP = isEn ? 520 : 420;   /* 句间停顿毫秒：留出呼吸与想象的空间 */
      var RATE = isEn ? 0.7 : 0.72;  /* 舒缓语速 */
      var PITCH = isEn ? 0.95 : 0.9; /* 柔和低音调 */
      var retried0 = false;
      function playChunk(k) {
        if (self._token !== myToken) return;
        if (k >= chunks.length) { self._restoreMusic(); if (onEnd) try { onEnd(); } catch (e) {} return; }
        var u = new SpeechSynthesisUtterance(chunks[k]);
        u.lang = isEn ? 'en-US' : 'zh-CN';
        u.rate = RATE;
        u.pitch = PITCH;
        var v = isEn ? self.enVoice() : self.zhVoice();
        if (v) u.voice = v;
        u.onend = function () {
          if (self._token !== myToken) return;
          setTimeout(function () { if (self._token === myToken) playChunk(k + 1); }, GAP);
        };
        u.onerror = function () {
          if (self._token !== myToken) return;
          if (k === 0 && !retried0) { retried0 = true; setTimeout(function () { playChunk(0); }, 260); return; }
          setTimeout(function () { if (self._token === myToken) playChunk(k + 1); }, GAP);
        };
        try {
          speechSynthesis.speak(u);
          if (speechSynthesis.paused) speechSynthesis.resume();
        } catch (e) { if (onEnd) try { onEnd(); } catch (e2) {} }
      }
      setTimeout(function () { playChunk(0); }, 150);
      return true;
    }
  };
  if (TTS.enabled) { /* 预热语音列表：getVoices 异步，需监听 voiceschanged 在加载完成后刷新缓存 */
    try { TTS._voices = speechSynthesis.getVoices() || []; } catch (e) {}
    try {
      speechSynthesis.onvoiceschanged = function () {
        try { TTS._voices = speechSynthesis.getVoices() || []; } catch (e2) {}
      };
    } catch (e) {}
  }
  var PRAISE = ['答对啦，真棒！', '太厉害了！', '你真聪明！', '哇，好厉害，继续加油！', '完全正确！'];
  var CHEER = ['没关系，再想想哦！', '加油，你可以的！', '差一点点，下次一定行！', '别灰心，继续努力！'];
  function speakQuestion(q) {
    /* 图形类题目（optHtml 为 true）的选项是 HTML 片段，无法朗读，
       拼进语音会把 HTML 代码读出来；此类只朗读题干，提示看图形选项 */
    if (q.optHtml) { TTS.speak(q.q + '。请观察下面的图形选项。', 0.85); return; }
    TTS.speak(q.q + '。选项：' + q.o.join('，') + '。', 0.85);
  }

  /* ===================== 背景音乐（Web Audio 合成循环，无需音频文件） ===================== */
  var musicOn = true;
  try { musicOn = localStorage.getItem('study-adventure-music') !== 'off'; } catch (e) {}
  var musicTimer = null;
  var musicGain = null;
  var BEAT = 0.42;
  // 柔和琶音旋律（16 拍一轮，C-G-Am-F 和弦进行）
  var MELODY = [
    [523.25, 0, 1], [659.25, 1, 1], [783.99, 2, 1], [659.25, 3, 1],
    [587.33, 4, 1], [698.46, 5, 1], [880.00, 6, 1], [698.46, 7, 1],
    [523.25, 8, 1], [659.25, 9, 1], [783.99, 10, 1], [659.25, 11, 1],
    [440.00, 12, 1], [523.25, 13, 1], [659.25, 14, 1], [523.25, 15, 1]
  ];
  function ensureMusic() {
    ensureAudio();
    if (!audioCtx) return false;
    if (!musicGain) {
      musicGain = audioCtx.createGain();
      musicGain.gain.value = 0.05;
      musicGain.connect(audioCtx.destination);
    }
    return true;
  }
  function scheduleBar() {
    if (!musicOn || !musicGain) { musicTimer = null; return; }
    if (typeof antiResting !== 'undefined' && antiResting) { musicTimer = null; return; } // 防沉迷休息期间不排程全局乐
    if (typeof ppState !== 'undefined' && ppState) { musicTimer = null; return; } // 皮影戏让位期间不抢全局乐
    musicTimer = setTimeout(scheduleBar, MELODY.length * BEAT * 1000 - 120); // 先续链，音符调度异常也不会断
    try {
      var t0 = audioCtx.currentTime + 0.05;
      MELODY.forEach(function (n) {
        var osc = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = n[0];
        var st = t0 + n[1] * BEAT;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.5, st + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, st + n[2] * BEAT);
        osc.connect(g); g.connect(musicGain);
        osc.start(st); osc.stop(st + n[2] * BEAT + 0.05);
      });
    } catch (e) {}
  }
  function updateMusicBtn() {
    var b = $('musicBtn');
    if (!b) return;
    b.textContent = musicOn ? '🎵' : '🔇';
    b.style.opacity = musicOn ? '1' : '0.55';
    b.title = musicOn ? '背景音乐：开（点击关闭）' : '背景音乐：关（点击开启）';
    document.body.classList.toggle('music-playing', musicOn);
  }
  function setMusic(on) {
    musicOn = !!on;
    try { localStorage.setItem('study-adventure-music', musicOn ? 'on' : 'off'); } catch (e) {}
    if (musicOn) {
      if (ensureMusic()) {
        musicGain.gain.value = 0.05; // 恢复音量（此前关闭时被置 0）
        if (!musicTimer) scheduleBar();
      }
    } else {
      clearTimeout(musicTimer);
      musicTimer = null;
      if (musicGain) musicGain.gain.value = 0; // 立即静音已排队的音符
    }
    updateMusicBtn();
  }
  /* 音乐看门狗：旋律链因异常/浏览器挂起断掉时，自动续上 */
  setInterval(function () {
    if (document.hidden) return; // 后台不续链，避免挂起后复活背景乐在后台播放
    if (!musicOn || ppState) return; // 剧场让位期间不抢
    if (typeof antiResting !== 'undefined' && antiResting) return; // 防沉迷休息期间全局乐让位，只放休息乐
    if (!ensureMusic()) return;
    try { if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    if (!musicTimer) scheduleBar();
  }, 8000);
  /* 切后台/回前台时管控 Web Audio：移动端浏览器切到后台不会自动暂停音频上下文，
     导致背景乐（乃至皮影/休息配乐）在后台持续播放；故隐藏时挂起 audioCtx 并停掉所有
     音频链，回到前台再恢复对应模块的声音 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearTimeout(musicTimer); musicTimer = null;
      if (typeof ppMusicStop === 'function') ppMusicStop();
      if (typeof antiRestMusicStop === 'function') antiRestMusicStop();
      if (audioCtx && audioCtx.state === 'running') { try { audioCtx.suspend(); } catch (e) {} }
    } else {
      if (audioCtx && audioCtx.state === 'suspended') { try { audioCtx.resume(); } catch (e) {} }
      if (TTS && TTS._duckedByTTS) { try { TTS._restoreMusic(); } catch (e) {} } // 防止朗读让位残留导致增益卡 0
      if (ppState) { if (typeof ppMusicStart === 'function') ppMusicStart(); return; } // 皮影戏让位期间不抢全局背景乐
      if (typeof antiResting !== 'undefined' && antiResting) { if (typeof antiRestMusicStart === 'function') antiRestMusicStart(); return; }
      if (musicOn && !musicTimer) { ensureAudio(); if (ensureMusic()) scheduleBar(); }
    }
  });

