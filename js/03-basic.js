'use strict';
  /* ===================== 特效 ===================== */
  function flash(color) {
    var f = document.getElementById('flash');
    f.className = 'flash ' + color + ' go';
    setTimeout(function () { f.className = 'flash'; }, 480);
  }
  function shakeScreen() {
    var app = document.querySelector('.app');
    app.classList.add('screen-shake');
    setTimeout(function () { app.classList.remove('screen-shake'); }, 420);
  }
  function burst(x, y, emojis) {
    var n = emojis.length;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.textContent = emojis[i];
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      var dist = 50 + Math.random() * 50;
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist - 30 + 'px');
      document.body.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 950); })(p);
    }
  }
  function burstAtEl(el, emojis) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, emojis);
  }

  /* ===================== 背景装饰 ===================== */
  var DECO = ['⭐', '✨', '🌸', '🍀', '🎈', '💫', '🌟', '📚'];
  function initBg() {
    var wrap = document.getElementById('bgDeco');
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('span');
      s.textContent = DECO[i % DECO.length];
      s.style.left = (Math.random() * 96) + 'vw';
      s.style.fontSize = (1 + Math.random() * 1.2) + 'rem';
      s.style.animationDuration = (8 + Math.random() * 12) + 's';
      s.style.animationDelay = (Math.random() * 10) + 's';
      wrap.appendChild(s);
    }
  }

  /* ===================== 学科配置 ===================== */
  var SUBJECTS = [
    { id: 'chinese',   name: '语文',     icon: '📖', color: '#ff6b6b', grades: [1,2,3,4,5,6,7,8,9] },
    { id: 'math',      name: '数学',     icon: '🔢', color: '#4f6ef7', grades: [1,2,3,4,5,6,7,8,9] },
    { id: 'english',   name: '英语',     icon: '🔤', color: '#2ecc71', grades: [1,2,3,4,5,6,7,8,9] },
    { id: 'physics',   name: '物理',     icon: '🧲', color: '#9b59b6', grades: [8,9] },
    { id: 'chemistry', name: '化学',     icon: '🧪', color: '#e67e22', grades: [9] },
    { id: 'biology',   name: '生物',     icon: '🌱', color: '#16a085', grades: [7,8] },
    { id: 'geography', name: '地理',     icon: '🌍', color: '#3498db', grades: [7,8] },
    { id: 'history',   name: '历史',     icon: '🏛️', color: '#c0392b', grades: [7,8,9] },
    { id: 'politics',  name: '道德与法治', icon: '⚖️', color: '#f39c12', grades: [7,8,9] }
  ];
  var GRADE_LABEL = { 1:'一',2:'二',3:'三',4:'四',5:'五',6:'六',7:'七',8:'八',9:'九' };
  var BANK = window.__STUDY_BANK__ || {};
  var SAVE_KEY = 'study-adventure-save-v1';
  var QUESTIONS_PER_ROUND = 10;
  var MAX_HP = 3;
  var FEED_COST = 3; // 喂食一次消耗的食物

  var BADGES = [
    { id:'first',   icon:'🎯', name:'初出茅庐', desc:'完成第一次闯关' },
    { id:'ten',     icon:'✅', name:'小有所成', desc:'累计答对 10 题' },
    { id:'fifty',   icon:'🌟', name:'学习达人', desc:'累计答对 50 题' },
    { id:'hundred', icon:'🏆', name:'学霸之路', desc:'累计答对 100 题' },
    { id:'lvl5',    icon:'🚀', name:'飞速成长', desc:'达到等级 5' },
    { id:'lvl10',   icon:'👑', name:'王者风范', desc:'达到等级 10' },
    { id:'combo5',  icon:'🔥', name:'连击大师', desc:'单场连击达到 5' },
    { id:'perfect', icon:'💯', name:'满分学霸', desc:'单场全部答对' },
    { id:'hatch5',  icon:'🐣', name:'孵蛋小能手', desc:'累计孵化 5 次宠物蛋' },
    { id:'pet3',    icon:'🐾', name:'宠物训练师', desc:'收养 3 只宠物' },
    { id:'mental1',  icon:'🧮', name:'口算新秀', desc:'完成第一次口算特训' },
    { id:'mentalFast', icon:'⏱️', name:'快算达人', desc:'口算特训平均 ≤6 秒/题（≥10 题）' },
    { id:'mental7',  icon:'📅', name:'七日打卡', desc:'口算特训累计 7 天' },
    { id:'word50',   icon:'🔤', name:'拼词高手', desc:'累计拼对 50 个单词' },
    { id:'review30', icon:'📖', name:'复习达人', desc:'累计复习 30 词次' },
    { id:'wordPerfect', icon:'🌟', name:'单词满分', desc:'一局单词特训全部拼对' },
    { id:'lib1',  icon:'🔖', name:'词关新秀', desc:'通过第一个词库闯关关卡' },
    { id:'lib10', icon:'🏅', name:'词关勇将', desc:'累计通过 10 个词库关卡' },
    { id:'lib30', icon:'👑', name:'词关大师', desc:'累计通过 30 个词库关卡' },
    { id:'think1',  icon:'🧠', name:'思维新星', desc:'完成第一次思维挑战' },
    { id:'think30', icon:'🕵️', name:'思维达人', desc:'累计答对 30 道思维题' },
    { id:'thinkPerfect', icon:'🏅', name:'全对大师', desc:'一局 10+ 道思维题全部答对' },
    { id:'think7',  icon:'🔥', name:'思维七日', desc:'思维挑战累计打卡 7 天' },
    { id:'phonics1', icon:'🔠', name:'音标新星', desc:'完成第一次音标挑战' },
    { id:'phonics30', icon:'🗣️', name:'发音小达人', desc:'音标挑战累计答对 30 题' },
    { id:'phonicsPerfect', icon:'🎯', name:'音标学霸', desc:'一局音标挑战 10 题全部答对' },
    { id:'phonics7', icon:'📅', name:'音标七日', desc:'音标挑战累计打卡 7 天' },
    { id:'story1',  icon:'📖', name:'故事启航', desc:'听完第一个故事' },
    { id:'story10', icon:'🌙', name:'小故事迷', desc:'累计听完 10 个不同故事' },
    { id:'story30', icon:'🏰', name:'故事大王', desc:'累计听完 30 个不同故事' },
    { id:'story7',  icon:'📅', name:'故事七日', desc:'听故事累计打卡 7 天' },
    { id:'grammar1', icon:'📝', name:'语法启航', desc:'完成第一次语法训练' },
    { id:'grammar30', icon:'🏅', name:'语法小达人', desc:'语法训练累计答对 30 题' },
    { id:'grammarPerfect', icon:'🎯', name:'语法学霸', desc:'一局语法训练 10 题全部答对' },
    { id:'grammar7', icon:'📅', name:'语法七日', desc:'语法训练累计打卡 7 天' },
    { id:'game1', icon:'🎮', name:'游戏初体验', desc:'玩过第一款休闲游戏' },
    { id:'game10', icon:'🎯', name:'游戏玩家', desc:'玩过 10 款不同游戏' },
    { id:'gameAll', icon:'🏆', name:'游戏收藏家', desc:'玩遍全部 32 款游戏' },
    { id:'gameMaster', icon:'👑', name:'游戏大师', desc:'累计游玩 50 局' }
  ];

