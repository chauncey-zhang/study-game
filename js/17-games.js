'use strict';

/* ===================== 休闲游戏模块 · 引擎 =====================
 * 统一容器：大厅（分类 Tab + 卡片）+ 游戏页（标题/HUD/游戏区/开始重玩）
 * 每款游戏通过 regGame(id, factory) 注册，factory(ctx) 返回实例：
 *   { init, start, reset, tick, draw, onKey, onTap, onEnter, stop }
 * 游戏结束调用 ctx.finish(score, level) 记录成绩并结算。
 */
var GAME_REG = {};
function regGame(id, factory) { GAME_REG[id] = factory; }

var curGame = null;
var curGameDef = null;
var curGameCtx = null;
var gameLoopId = null;
var gamePaused = false;
var gameStarted = false;
var gameOverShown = false;
var gameToken = 0;   // 游戏代际：切换游戏时递增，供异步回调判断是否仍属于当前游戏

function gameFind(id) {
  for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i];
  return null;
}

/* ---- 收藏（独立 localStorage） ---- */
function gameGetFavs() { try { return JSON.parse(localStorage.getItem('game-favs') || '[]'); } catch (e) { return []; } }
function gameIsFav(id) { return gameGetFavs().indexOf(id) !== -1; }
function gameToggleFav(id) {
  var f = gameGetFavs(), i = f.indexOf(id);
  if (i === -1) f.push(id); else f.splice(i, 1);
  try { localStorage.setItem('game-favs', JSON.stringify(f)); } catch (e) {}
}

/* ---- 大厅 ---- */
var gameTab = 'all';
function showGameHub() {
  gameTab = 'all';
  setHash('games');
  renderGameTabs();
  renderGameList();
  showScreen('gameHub');
  focusFirstNav($('gameHubScreen'));
}
function renderGameTabs() {
  var html = '<button class="writing-tab' + (gameTab === 'all' ? ' active' : '') + '" data-gtab="all">🎮 全部 (' + GAMES.length + ')</button>';
  GAME_CATS.forEach(function (c) {
    var n = 0;
    GAMES.forEach(function (g) { if (g.cat === c.id) n++; });
    html += '<button class="writing-tab' + (gameTab === c.id ? ' active' : '') + '" data-gtab="' + c.id + '">' + c.icon + ' ' + c.name + ' (' + n + ')</button>';
  });
  html += '<button class="writing-tab' + (gameTab === 'fav' ? ' active' : '') + '" data-gtab="fav">⭐ 我的最爱</button>';
  $('gameTabs').innerHTML = html;
  Array.prototype.forEach.call($('gameTabs').querySelectorAll('.writing-tab'), function (b) {
    b.addEventListener('click', function () {
      SFX.click();
      gameTab = b.getAttribute('data-gtab');
      renderGameTabs();
      renderGameList();
      focusFirstNav($('gameHubScreen'));
    });
  });
}
function gameBestText(g) {
  var st = save.gameStats[g.id];
  if (!st || st.best === undefined || st.best === null) return '未玩过';
  if (g.bestMode === 'min') return '最佳 ' + st.best;
  return '最佳 ' + st.best;
}
function renderGameList() {
  var list = GAMES.filter(function (g) {
    if (gameTab === 'all') return true;
    if (gameTab === 'fav') return gameIsFav(g.id);
    return g.cat === gameTab;
  });
  var html = '';
  list.forEach(function (g) {
    html += '<div class="game-item" data-gid="' + g.id + '">' +
      '<span class="game-item-icon">' + g.icon + '</span>' +
      '<div class="game-item-info"><div class="game-item-name">' + g.name + '</div>' +
      '<div class="game-item-desc">' + g.desc + '</div></div>' +
      '<div class="game-item-best">' + gameBestText(g) + '</div>' +
      '<button class="game-item-fav" data-fav="' + g.id + '">' + (gameIsFav(g.id) ? '⭐' : '☆') + '</button>' +
      '</div>';
  });
  $('gameList').innerHTML = html || '<div class="hub-empty">暂无游戏</div>';
  Array.prototype.forEach.call($('gameList').querySelectorAll('.game-item'), function (item) {
    item.addEventListener('click', function (e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-fav')) return;
      SFX.click();
      startGame(item.getAttribute('data-gid'));
    });
  });
  Array.prototype.forEach.call($('gameList').querySelectorAll('.game-item-fav'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      gameToggleFav(btn.getAttribute('data-fav'));
      renderGameList();
    });
  });
}

/* ---- 特效：得分飘字 + 粒子爆炸 ---- */
function gameFloat(text, x, y) {
  var area = $('gamePlayArea');
  var el = document.createElement('div');
  el.className = 'game-float';
  el.textContent = text;
  if (x === undefined || y === undefined) { x = area.clientWidth / 2; y = area.clientHeight / 2; }
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  area.appendChild(el);
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
}
function gameBurst(x, y, color, n) {
  var area = $('gamePlayArea');
  n = n || 10;
  for (var i = 0; i < n; i++) {
    var el = document.createElement('div');
    el.className = 'game-particle';
    el.style.left = (x || 0) + 'px';
    el.style.top = (y || 0) + 'px';
    el.style.background = color || '#fbbf24';
    var ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
    var dist = 22 + Math.random() * 30;
    el.style.setProperty('--dx', (Math.cos(ang) * dist) + 'px');
    el.style.setProperty('--dy', (Math.sin(ang) * dist) + 'px');
    area.appendChild(el);
    (function (e) { setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 650); })(el);
  }
}
/* 震动反馈：移动端 navigator.vibrate，桌面/老电视不支持时静默忽略 */
function vibrate(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

/* ---- 页面切换过渡：淡入淡出（大厅 ↔ 游戏页） ---- */
function playScreenEnter(el) {
  if (!el) return;
  el.classList.remove('screen-enter');
  void el.offsetWidth; // 强制 reflow，重置动画
  el.classList.add('screen-enter');
}

/* ---- 游戏页 ---- */
function startGame(id) {
  var def = gameFind(id);
  if (!def) return;
  if (!GAME_REG[id]) { toast('游戏开发中…'); return; }
  if (curGame && curGame.stop) { try { curGame.stop(); } catch (e) {} }
  cancelAnimationFrame(gameLoopId);
  gameToken++;
  var myToken = gameToken;
  curGameDef = def;
  curGame = null;
  gameStarted = false;
  gameOverShown = false;
  gamePaused = false;
  setHash('games/' + id);
  showScreen('gamePlay');
  playScreenEnter($('gamePlayScreen'));
  $('gamePlayTitle').textContent = def.icon + ' ' + def.name;
  $('gamePlayHud').textContent = '';
  syncGameButtons();
  var container = $('gamePlayArea');
  container.innerHTML = '';
  container.className = 'game-area game-area-' + def.type;
  var canvas = null;
  if (def.type === 'canvas') {
    canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    container.appendChild(canvas);
  }
  curGameCtx = {
    def: def,
    container: container,
    canvas: canvas,
    hud: function (s) { $('gamePlayHud').textContent = s; },
    finish: gameFinish,
    toast: toast,
    alive: function () { return gameToken === myToken; },
    float: gameFloat,
    burst: gameBurst,
    vibrate: vibrate
  };
  var inst;
  try { inst = GAME_REG[id](curGameCtx); } catch (e) { toast('游戏加载失败'); return; }
  curGame = inst;
  try { if (inst.init) inst.init(); } catch (e) {}
  gameLoopId = requestAnimationFrame(gameLoop);
}

function syncGameButtons() {
  var startBtn = $('gameStartBtn');
  var pauseBtn = $('gamePauseBtn');
  if (gameOverShown) {
    startBtn.disabled = false;
    startBtn.textContent = '↻ 再玩一次';
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ 暂停';
  } else if (gameStarted) {
    startBtn.disabled = true;
    startBtn.textContent = '游戏中…';
    pauseBtn.disabled = false;
    pauseBtn.textContent = gamePaused ? '▶ 继续' : '⏸ 暂停';
  } else {
    startBtn.disabled = false;
    startBtn.textContent = '▶ 开始';
    pauseBtn.disabled = true;
    pauseBtn.textContent = '⏸ 暂停';
  }
}
function gameDoStart() {
  if (!curGame) return;
  gameStarted = true;
  gameOverShown = false;
  gamePaused = false;
  try { if (curGame.start) curGame.start(); } catch (e) {}
  syncGameButtons();
}
function gameDoReset() {
  if (!curGame) return;
  gameStarted = false;
  gameOverShown = false;
  gamePaused = false;
  try { if (curGame.reset) curGame.reset(); } catch (e) {}
  gameDoStart();
}
function toggleGamePause() {
  if (!curGame || !gameStarted || gameOverShown) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    try { if (curGame.pause) curGame.pause(); } catch (e) {}
    $('gamePlayHud').textContent = '已暂停';
  } else {
    try { if (curGame.resume) curGame.resume(); } catch (e) {}
  }
  syncGameButtons();
}
function gameLoop() {
  if (curGame && !gamePaused && gameStarted) {
    try { if (curGame.tick) curGame.tick(); } catch (e) {}
    try { if (curGame.draw) curGame.draw(); } catch (e) {}
  }
  gameLoopId = requestAnimationFrame(gameLoop);
}

/* ---- 结算与存档 ---- */
function gameFinish(score, level) {
  if (!curGameDef) return;
  if (gameOverShown) return;
  gameOverShown = true;
  gameStarted = false;
  gamePaused = false;
  var r = recordGameResult(curGameDef.id, score, level);
  var isNewBest = r.best, coins = r.coins;
  var best = save.gameStats[curGameDef.id] ? save.gameStats[curGameDef.id].best : null;
  var scoreTxt = (score === undefined || score === null) ? '' : ('得分 ' + score);
  $('gamePlayHud').textContent = '🏁 游戏结束 ' + scoreTxt + (best !== null && best !== undefined ? ' · 最佳 ' + best : '');
  syncGameButtons();
  SFX.levelup();
  vibrate([20, 40, 20]);
  updateTopbar();
  var area = $('gamePlayArea');
  var aw = area.clientWidth || 300, ah = area.clientHeight || 300;
  if (isNewBest && score !== undefined && score !== null) {
    gameFloat('🏆 新纪录 ' + score, aw / 2, ah / 2 - 40);
    gameBurst(aw / 2, ah / 2, '#fbbf24', 16);
    gameBurst(aw / 2, ah / 2, '#34d399', 8);
  } else if (score !== undefined && score !== null) {
    gameFloat('得分 ' + score, aw / 2, ah / 2 - 40);
    gameBurst(aw / 2, ah / 2, '#60a5fa', 10);
  }
  setTimeout(function () { toast('🎮 成绩已记录 +🪙' + coins); }, 200);
}
function recordGameResult(id, score, level) {
  save.gameStats = save.gameStats || {};
  var st = save.gameStats[id] || { best: null, played: 0, level: 0 };
  st.played = (st.played || 0) + 1;
  var def = gameFind(id);
  var isNewBest = false;
  if (score !== undefined && score !== null && def) {
    if (st.best === null || st.best === undefined) { st.best = score; isNewBest = true; }
    else {
      var nb = def.bestMode === 'min' ? Math.min(st.best, score) : Math.max(st.best, score);
      if (nb !== st.best) isNewBest = true;
      st.best = nb;
    }
  }
  if (level) st.level = Math.max(st.level || 0, level);
  save.gameStats[id] = st;
  /* 金币：每局 +2，刷新最佳纪录额外 +5 */
  var earned = 2 + (isNewBest ? 5 : 0);
  save.coins = (save.coins || 0) + earned;
  persist();
  unlockBadges();
  return { best: isNewBest, coins: earned };
}

function exitGame() {
  if (curGame && curGame.stop) { try { curGame.stop(); } catch (e) {} }
  curGame = null;
  curGameDef = null;
  curGameCtx = null;
  cancelAnimationFrame(gameLoopId);
  gameLoopId = null;
  gameStarted = false;
  gameOverShown = false;
  gamePaused = false;
  showGameHub();
  playScreenEnter($('gameHubScreen'));
}

/* ---- 输入：键盘方向/OK（捕获阶段拦截，优先交给游戏） ---- */
function gameCanvasPos(clientX, clientY) {
  if (!curGameCtx || !curGameCtx.canvas) return { x: clientX, y: clientY };
  var c = curGameCtx.canvas;
  var r = c.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { x: clientX, y: clientY };
  return { x: (clientX - r.left) * (c.width / r.width), y: (clientY - r.top) * (c.height / r.height) };
}
document.addEventListener('keydown', function (e) {
  if (!curGame || !gameStarted || gameOverShown) return;
  var key = e.key;
  var code = e.keyCode || e.which || 0;
  var dirMap = { 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown' };
  var dir = (key && key.indexOf('Arrow') === 0) ? key : dirMap[code];
  if (dir) {
    var d = dir.replace('Arrow', '').toLowerCase();
    try { curGame.onKey(d); } catch (err) {}
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (key === 'Enter' || code === 13 || code === 23) {
    try { if (curGame.onEnter) curGame.onEnter(); } catch (err) {}
    e.preventDefault();
    e.stopPropagation();
    return;
  }
}, true);

/* ---- 触摸/点击：canvas 统一换算坐标，dom 由游戏自理 ---- */
document.addEventListener('pointerdown', function (e) {
  if (!curGame || !gameStarted || gameOverShown) return;
  if (!curGameCtx || curGameCtx.def.type !== 'canvas') return;
  if (curGameCtx.canvas && !curGameCtx.canvas.contains(e.target)) return;
  var p = gameCanvasPos(e.clientX, e.clientY);
  try { curGame.onTap(p.x, p.y); } catch (err) {}
}, true);

/* ---- 触摸滑动：统一分发（绑定一次，避免各游戏在固定容器上重复绑定导致监听泄漏） ---- */
var gTouchX = 0, gTouchY = 0;
document.addEventListener('touchstart', function (e) {
  if (!curGame || !gameStarted || gameOverShown) return;
  gTouchX = e.touches[0].clientX;
  gTouchY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', function (e) {
  if (!curGame || !gameStarted || gameOverShown) return;
  var dx = e.changedTouches[0].clientX - gTouchX;
  var dy = e.changedTouches[0].clientY - gTouchY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  var d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  if (curGame.onSwipe) { try { curGame.onSwipe(d); } catch (err) {} }
}, { passive: true });

/* ---- 未开始时的输入门控：拦截游戏区内的点击/指针，防止未点"开始"就能玩 ---- */
function gateGameInput(e) {
  if (!curGame || gameStarted) return;
  var area = document.getElementById('gamePlayArea');
  if (area && area.contains(e.target)) {
    // 允许游戏标记为 data-game-control="1" 的控件（如难度/关卡选择）在未开始时交互
    var el = e.target;
    while (el && el !== area) {
      if (el.getAttribute && el.getAttribute('data-game-control') === '1') return false;
      el = el.parentNode;
    }
    return true;
  }
  return false;
}
document.addEventListener('click', function (e) {
  if (gateGameInput(e)) { e.preventDefault(); e.stopPropagation(); }
}, true);
document.addEventListener('pointerdown', function (e) {
  if (gateGameInput(e)) { e.stopPropagation(); }
}, true);
document.addEventListener('pointerup', function (e) {
  if (gateGameInput(e)) { e.stopPropagation(); }
}, true);

/* ---- 事件绑定 ---- */
$('gameHubBtn').addEventListener('click', function () { SFX.click(); showGameHub(); });
$('gameHubBack').addEventListener('click', goHome);
$('gameExitBtn').addEventListener('click', function () { SFX.click(); exitGame(); });
$('gameStartBtn').addEventListener('click', function () {
  SFX.click();
  if (gameOverShown || !gameStarted) gameDoStart();
});
$('gameResetBtn').addEventListener('click', function () { SFX.click(); gameDoReset(); });
$('gamePauseBtn').addEventListener('click', function () { SFX.click(); toggleGamePause(); });
