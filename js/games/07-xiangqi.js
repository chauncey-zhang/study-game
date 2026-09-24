'use strict';
/* ===================== 休闲游戏 · 中国象棋 ===================== */

/* ---------- 棋子文字 & 初始布局 ---------- */
var XQ_PIECES = {
  K: '帅', A: '仕', B: '相', N: '马', R: '车', C: '炮', P: '兵',
  k: '将', a: '士', b: '象', n: '马', r: '车', c: '炮', p: '卒'
};
/* 初始棋盘（9列×10行）行0=红方底/行9=黑方底 */
/* eslint-disable */
var XQ_INIT = [
  ['r','n','b','a','k','a','b','n','r'],  // 0
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],  // 1
  [ 0 ,'c', 0 , 0 , 0 , 0 , 0 ,'c', 0 ],  // 2
  ['p', 0 ,'p', 0 ,'p', 0 ,'p', 0 ,'p'],  // 3
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],  // 4
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],  // 5
  ['P', 0 ,'P', 0 ,'P', 0 ,'P', 0 ,'P'],  // 6
  [ 0 ,'C', 0 , 0 , 0 , 0 , 0 ,'C', 0 ],  // 7
  [ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 ],  // 8
  ['R','N','B','A','K','A','B','N','R']   // 9
];
/* eslint-enable */

var XQ_VALUE = { K: 10000, k: 10000, R: 900, r: 900, N: 400, n: 400, C: 450, c: 450, B: 200, b: 200, A: 200, a: 200, P: 100, p: 100 };
/* 兵/卒位置加成表 */
var XQ_POS_BONUS = {
  P: [
    [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
    [10,20,30,45,45,45,30,20,10],[20,40,60,75,75,75,60,40,20],
    [30,50,80,100,100,100,80,50,30],[40,60,80,100,100,100,80,60,40],
    [50,70,100,120,120,120,100,70,50],[60,80,110,130,130,130,110,80,60],
    [70,90,120,140,140,140,120,90,70]
  ],
  p: [
    [70,90,120,140,140,140,120,90,70],[60,80,110,130,130,130,110,80,60],
    [50,70,100,120,120,120,100,70,50],[40,60,80,100,100,100,80,60,40],
    [30,50,80,100,100,100,80,50,30],[20,40,60,75,75,75,60,40,20],
    [10,20,30,45,45,45,30,20,10],[0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]
  ]
};

regGame('xiangqi', function (ctx) {
  var board, turn, selected, moves, over, diff, stepCount;
  var animFrom, animTo, animT;
  var CELL, W, H; // CELL=格子像素大小, W=棋盘总宽, H=棋盘总高
  var checkFlash = 0, checkPiece = null;
  var animTimer = null;
  /* AI 思考等待状态：thinking=思考中, thinkDot=点动画计数, thinkDone/Total=进度 */
  var thinking = false, thinkDot = 0, thinkDone = 0, thinkTotal = 0, thinkDepth = 1;
  var playerIsRed = true; // 玩家固定执红

  /* ---------- 布局：自适应棋盘尺寸（等比，无拉伸） ---------- */
  function layout() {
    var area = ctx.container;
    var aw = (area && area.clientWidth) || 450;
    var ah = (area && area.clientHeight) || 540;
    // 棋盘内边距（难度条已移到棋盘外，无需额外预留）
    var availW = aw - 8, availH = ah - 8;
    // 取能同时满足宽高的最大格子边长，保证棋盘 9:10 比例不变形
    CELL = Math.max(30, Math.floor(Math.min(availW / 9, availH / 10)));
    W = CELL * 9;
    H = CELL * 10;
    var cv = ctx.canvas;
    var c = cv.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    // 缓冲 = 逻辑尺寸 × dpr（高清）；CSS = 逻辑尺寸（与缓冲同比，杜绝拉伸）
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    // 对 2D context 做 dpr 缩放，绘制坐标仍用逻辑像素
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- 初始化 ---------- */
  function fresh() {
    board = [];
    var r, c;
    for (r = 0; r < 10; r++) {
      board.push([]);
      for (c = 0; c < 9; c++) board[r].push(XQ_INIT[r][c]);
    }
    turn = 1; selected = null; moves = [];
    over = false; stepCount = 0;
    animFrom = null; animTo = null; animT = 0;
    checkFlash = 0; checkPiece = null;
    /* 重开局时清除思考状态，避免残留气泡 */
    thinking = false; thinkDot = 0; thinkDone = 0; thinkTotal = 0;
    aiAll = null; aiIdx = 0; aiBestMove = null;
    if (animTimer) { clearInterval(animTimer); animTimer = null; }
    layout();
    draw();
    startAnim();
  }

  /* ---------- 棋子颜色判断 ---------- */
  function isRed(p)   { return p && p === p.toUpperCase(); }
  function isBlack(p) { return p && p === p.toLowerCase(); }
  function sameColor(p, t) { return p && ((isRed(p) && t === 1) || (isBlack(p) && t === 2)); }

  /* 马蹩腿辅助：马走「日」字，马腿 = 两格方向上紧邻的那一格
   * |dr|=2 → 腿在 [r±1, c]（同列）；|dc|=2 → 腿在 [r, c±1]（同行）
   * 旧实现把腿算在对角格且方向取反，导致越界异常 + 误判蹩腿。 */
  function horseLeg(r, c, dr, dc) {
    if (Math.abs(dr) === 2) return [r + (dr > 0 ? 1 : -1), c];
    return [r, c + (dc > 0 ? 1 : -1)];
  }

  /* 走法合法性（含送将检测） */
  function canMove(r, c, tr, tc) {
    var p = board[r][c], tp = board[tr][tc];
    if (p === 0) return false;
    if (tp !== 0 && sameColor(tp, turn)) return false;
    var dr = tr - r, dc = tc - c, adr = Math.abs(dr), adc = Math.abs(dc);
    var code = p.toUpperCase();
    switch (code) {
      case 'K':
        if (adr + adc !== 1) return false;
        if (isRed(p) && (tc < 3 || tc > 5 || tr < 7 || tr > 9)) return false;
        if (isBlack(p) && (tc < 3 || tc > 5 || tr < 0 || tr > 2)) return false;
        break;
      case 'A':
        if (adr !== 1 || adc !== 1) return false;
        if (isRed(p) && (tc < 3 || tc > 5 || tr < 7 || tr > 9)) return false;
        if (isBlack(p) && (tc < 3 || tc > 5 || tr < 0 || tr > 2)) return false;
        break;
      case 'B':
        if (adr !== 2 || adc !== 2) return false;
        if (board[r + dr / 2][c + dc / 2] !== 0) return false;
        if (isRed(p) && tr < 5) return false;
        if (isBlack(p) && tr > 4) return false;
        break;
      case 'N':
        if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
        var leg = horseLeg(r, c, dr, dc);
        if (board[leg[0]][leg[1]] !== 0) return false;
        break;
      case 'R':
        if (adr !== 0 && adc !== 0) return false;
        { var i, sR = dr === 0 ? 0 : (dr > 0 ? 1 : -1), sC = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
          var cr = r + sR, cc = c + sC;
          while (cr !== tr || cc !== tc) { if (board[cr][cc] !== 0) return false; cr += sR; cc += sC; } }
        break;
      case 'C':
        if (adr !== 0 && adc !== 0) return false;
        { var i2, sR2 = dr === 0 ? 0 : (dr > 0 ? 1 : -1), sC2 = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
          var cr2 = r + sR2, cc2 = c + sC2, mid = 0;
          while (cr2 !== tr || cc2 !== tc) { if (board[cr2][cc2] !== 0) mid++; cr2 += sR2; cc2 += sC2; }
          if (tp === 0) { if (mid !== 0) return false; }
          else { if (mid !== 1) return false; } }
        break;
      case 'P':
        if (isRed(p)) {
          /* 过河后可横走或前进，但永不后退 */
          if (r < 5) { if (!((dr === -1 && dc === 0) || (dr === 0 && adc === 1))) return false; }
          else { if (dr !== -1 || dc !== 0) return false; }
        } else {
          if (r > 4) { if (!((dr === 1 && dc === 0) || (dr === 0 && adc === 1))) return false; }
          else { if (dr !== 1 || dc !== 0) return false; }
        }
        break;
      default: return false;
    }
    /* 送将检测：不得让自己的将帅被将军，也不得走成「将帅对面」 */
    var saved = board[tr][tc]; board[tr][tc] = p; board[r][c] = 0;
    var illegal = isKingInCheck(turn) || isFaceToFace();
    board[r][c] = p; board[tr][tc] = saved;
    return !illegal;
  }

  /* 生成某位置所有合法走法 */
  function genMoves(r, c) {
    var p = board[r][c];
    if (!p || !sameColor(p, turn)) return [];
    var result = [], tr, tc;
    for (tr = 0; tr < 10; tr++) for (tc = 0; tc < 9; tc++) if (canMove(r, c, tr, tc)) result.push([tr, tc]);
    return result;
  }

  function findKing(t) {
    var r, c;
    for (r = 0; r < 10; r++) for (c = 0; c < 9; c++) {
      if (t === 1 && board[r][c] === 'K') return [r, c];
      if (t === 2 && board[r][c] === 'k') return [r, c];
    }
    return null;
  }
  function isKingInCheck(t) {
    var k = findKing(t);
    if (!k) return false;
    var r, c, p;
    for (r = 0; r < 10; r++) for (c = 0; c < 9; c++) {
      p = board[r][c];
      if (!p) continue;
      if ((t === 1 && isBlack(p)) || (t === 2 && isRed(p))) {
        if (canMoveForPiece(r, c, k[0], k[1], t)) return true;
      }
    }
    return false;
  }
  function isFaceToFace() {
    var k1 = findKing(1), k2 = findKing(2);
    if (!k1 || !k2) return false;
    if (k1[1] !== k2[1]) return false;
    /* 红帅在下（行号大）、黑将在上（行号小），必须按 min/max 取中间区间；
     * 旧写法 k1[0]+1 → k2[0] 会得到空区间，误判为「对面」。 */
    var lo = Math.min(k1[0], k2[0]), hi = Math.max(k1[0], k2[0]);
    var r;
    for (r = lo + 1; r < hi; r++) if (board[r][k1[1]] !== 0) return false;
    return true;
  }

  /* canMoveForPiece：独立版本（不依赖全局 turn），用于 AI 和终局检测 */
  function canMoveForPiece(r, c, tr, tc, t) {
    var p = board[r][c], tp = board[tr][tc];
    /* 目标格不能是「移动方自己」的棋子。按棋子 p 自身颜色判断，
     * 兼容两种调用语义：genMovesForPiece（p 属于 t）与 isKingInCheck（p 是 t 的敌方）。 */
    if (tp !== 0 && sameColor(tp, isRed(p) ? 1 : 2)) return false;
    var dr = tr - r, dc = tc - c, adr = Math.abs(dr), adc = Math.abs(dc);
    var code = p.toUpperCase();
    switch (code) {
      case 'K':
        if (adr + adc !== 1) return false;
        if (isRed(p) && (tc < 3 || tc > 5 || tr < 7 || tr > 9)) return false;
        if (isBlack(p) && (tc < 3 || tc > 5 || tr < 0 || tr > 2)) return false;
        break;
      case 'A':
        if (adr !== 1 || adc !== 1) return false;
        if (isRed(p) && (tc < 3 || tc > 5 || tr < 7 || tr > 9)) return false;
        if (isBlack(p) && (tc < 3 || tc > 5 || tr < 0 || tr > 2)) return false;
        break;
      case 'B':
        if (adr !== 2 || adc !== 2) return false;
        if (board[r + dr / 2][c + dc / 2] !== 0) return false;
        if (isRed(p) && tr < 5) return false;
        if (isBlack(p) && tr > 4) return false;
        break;
      case 'N':
        if (!((adr === 2 && adc === 1) || (adr === 1 && adc === 2))) return false;
        var leg2 = horseLeg(r, c, dr, dc);
        if (board[leg2[0]][leg2[1]] !== 0) return false;
        break;
      case 'R':
        if (adr !== 0 && adc !== 0) return false;
        { var i3, sR = dr === 0 ? 0 : (dr > 0 ? 1 : -1), sC = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
          var cr3 = r + sR, cc3 = c + sC;
          while (cr3 !== tr || cc3 !== tc) { if (board[cr3][cc3] !== 0) return false; cr3 += sR; cc3 += sC; } }
        break;
      case 'C':
        if (adr !== 0 && adc !== 0) return false;
        { var i4, sR2 = dr === 0 ? 0 : (dr > 0 ? 1 : -1), sC2 = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
          var cr4 = r + sR2, cc4 = c + sC2, mid2 = 0;
          while (cr4 !== tr || cc4 !== tc) { if (board[cr4][cc4] !== 0) mid2++; cr4 += sR2; cc4 += sC2; }
          if (tp === 0) { if (mid2 !== 0) return false; }
          else { if (mid2 !== 1) return false; } }
        break;
      case 'P':
        if (isRed(p)) {
          /* 过河后可横走或前进，但永不后退 */
          if (r < 5) { if (!((dr === -1 && dc === 0) || (dr === 0 && adc === 1))) return false; }
          else { if (dr !== -1 || dc !== 0) return false; }
        } else {
          if (r > 4) { if (!((dr === 1 && dc === 0) || (dr === 0 && adc === 1))) return false; }
          else { if (dr !== 1 || dc !== 0) return false; }
        }
        break;
      default: return false;
    }
    var saved = board[tr][tc]; board[tr][tc] = p; board[r][c] = 0;
    var illegal = isKingInCheck(t) || isFaceToFace();
    board[r][c] = p; board[tr][tc] = saved;
    return !illegal;
  }

  function genAllMovesForAI(t) {
    var result = [], r, c, ms;
    for (r = 0; r < 10; r++) for (c = 0; c < 9; c++) {
      if (!board[r][c]) continue;
      if ((t === 1 && isRed(board[r][c])) || (t === 2 && isBlack(board[r][c]))) {
        ms = genMovesForPiece(r, c, t);
        for (var i = 0; i < ms.length; i++) result.push([r, c, ms[i][0], ms[i][1]]);
      }
    }
    return result;
  }
  function genMovesForPiece(r, c, t) {
    var p = board[r][c], result = [], tr, tc;
    for (tr = 0; tr < 10; tr++) for (tc = 0; tc < 9; tc++) if (canMoveForPiece(r, c, tr, tc, t)) result.push([tr, tc]);
    return result;
  }

  /* ---------- AI ---------- */
  var AI_DEPTH = { 1: 1, 2: 2, 3: 4, 4: 10 };

  function evaluate() {
    var r, c, p, sum = 0;
    for (r = 0; r < 10; r++) for (c = 0; c < 9; c++) {
      p = board[r][c];
      if (!p) continue;
      var v = XQ_VALUE[p.toUpperCase()] || 0;
      var pb = (p === 'P' ? XQ_POS_BONUS.P[r][c] : (p === 'p' ? XQ_POS_BONUS.p[r][c] : 0));
      if (isRed(p)) sum += v + pb;
      else sum -= v + pb;
    }
    if (isKingInCheck(2)) sum += 50;
    if (isKingInCheck(1)) sum -= 50;
    return sum;
  }

  function alphaBeta(depth, alpha, beta, t) {
    if (depth === 0) return evaluate();
    var all = genAllMovesForAI(t);
    if (!all.length) return evaluate();
    all.sort(function(a, b) {
      var va = board[b[2]][b[3]] ? (XQ_VALUE[board[b[2]][b[3]].toUpperCase()] || 0) : 0;
      var vb = board[a[2]][a[3]] ? (XQ_VALUE[board[a[2]][a[3]].toUpperCase()] || 0) : 0;
      return va - vb;
    });
    var best = t === 2 ? Infinity : -Infinity;
    for (var i = 0; i < all.length; i++) {
      var fr = all[i][0], fc = all[i][1], tr2 = all[i][2], tc2 = all[i][3];
      var saved2 = board[tr2][tc2]; board[tr2][tc2] = board[fr][fc]; board[fr][fc] = 0;
      var val;
      if (t === 2) {
        val = alphaBeta(depth - 1, alpha, beta, 1);
        if (val < beta) { beta = val; if (val < best) best = val; }
      } else {
        val = alphaBeta(depth - 1, alpha, beta, 2);
        if (val > alpha) { alpha = val; if (val > best) best = val; }
      }
      board[fr][fc] = board[tr2][tc2]; board[tr2][tc2] = saved2;
      if (beta <= alpha) break;
    }
    return t === 2 ? beta : alpha;
  }

  /* AI 搜索状态（跨 setTimeout 保持） */
  var aiAll = null, aiIdx = 0, aiBest = 0, aiBestMove = null;
  var aiCurDepth = 1, aiTarget = 2, aiDeadline = 0;
  /* 迭代加深 + 时间预算：走法生成开销大，深度越大越慢，
   * 用「目标深度 + 时间上限」双约束保证任何难度都不会卡死界面。 */
  var AI_BUDGET = { 1: 400, 2: 900, 3: 2500, 4: 4000 };

  /* 调度：先把「思考中」气泡渲染出来，再开始搜索 */
  function scheduleAI() {
    if (over || turn !== 2) return;
    thinking = true; thinkDot = 0; thinkDone = 0; thinkTotal = 0;
    draw();
    updateHUD();
    setTimeout(aiSearchStart, 80); /* 留一帧给浏览器绘制气泡 */
  }

  function aiSearchStart() {
    aiAll = genAllMovesForAI(2);
    aiIdx = 0; aiBest = -Infinity; aiBestMove = null;
    aiTarget = AI_DEPTH[diff] || 2;
    aiCurDepth = 1;
    aiDeadline = Date.now() + (AI_BUDGET[diff] || 900);
    thinkTotal = aiAll.length; thinkDone = 0; thinkDepth = 1;
    if (!aiAll.length) { thinking = false; draw(); updateHUD(); return; }
    /* 根节点按吃子价值排序：先搜好招，剪枝更狠、更快出结果 */
    aiAll.sort(function (a, b) {
      var va = board[b[2]][b[3]] ? (XQ_VALUE[board[b[2]][b[3]].toUpperCase()] || 0) : 0;
      var vb = board[a[2]][a[3]] ? (XQ_VALUE[board[a[2]][a[3]].toUpperCase()] || 0) : 0;
      return va - vb;
    });
    setTimeout(aiSearchChunk, 0);
  }

  /* 分片搜索：每片最多跑 24ms，然后让出主线程，
   * 使「思考中」动画与进度能持续渲染（否则深度 10 会冻结画面数秒）。 */
  function aiSearchChunk() {
    var t0 = Date.now(), i, fr, fc, tr, tc, saved, val, cap;
    while (aiIdx < aiAll.length) {
      i = aiIdx;
      fr = aiAll[i][0]; fc = aiAll[i][1]; tr = aiAll[i][2]; tc = aiAll[i][3];
      if (aiCurDepth === 1) {
        cap = board[tr][tc] ? (XQ_VALUE[board[tr][tc].toUpperCase()] || 0) : 0;
        if (!aiBestMove || cap > aiBest) { aiBest = cap; aiBestMove = aiAll[i]; }
      } else {
        saved = board[tr][tc]; board[tr][tc] = board[fr][fc]; board[fr][fc] = 0;
        val = alphaBeta(aiCurDepth - 1, -Infinity, Infinity, 1);
        board[fr][fc] = board[tr][tc]; board[tr][tc] = saved;
        if (val > aiBest) { aiBest = val; aiBestMove = aiAll[i]; }
      }
      aiIdx++; thinkDone = aiIdx;
      if (Date.now() - t0 >= 24) break; /* 时间片到，让出主线程 */
    }
    if (aiIdx < aiAll.length) { setTimeout(aiSearchChunk, 0); return; }
    /* 本层搜完：时间还够且未达目标深度 → 加深一层继续（迭代加深） */
    if (aiCurDepth < aiTarget && Date.now() < aiDeadline) {
      aiCurDepth++;
      aiIdx = 0; aiBest = -Infinity; aiBestMove = null;
      thinkDepth = aiCurDepth; thinkDone = 0;
      setTimeout(aiSearchChunk, 0);
      return;
    }
    /* 搜索完成（达到目标深度或时间预算用尽） */
    thinking = false;
    if (aiBestMove) doMove(aiBestMove[0], aiBestMove[1], aiBestMove[2], aiBestMove[3]);
    else { draw(); updateHUD(); }
  }

  /* ---------- 执行走子 ---------- */
  function doMove(fr, fc, tr, tc) {
    var captured = board[tr][tc];
    animFrom = [fr, fc]; animTo = [tr, tc]; animT = 0;
    board[tr][tc] = board[fr][fc]; board[fr][fc] = 0;
    stepCount++;
    SFX.move();
    if (captured) {
      SFX.capture();
      ctx.burst(tc * CELL + CELL / 2, tr * CELL + CELL / 2, isRed(captured) ? '#ef4444' : '#16a34a', 10);
    }
    turn = turn === 1 ? 2 : 1;
    selected = null; moves = [];
    var inCheck = isKingInCheck(turn);
    checkPiece = inCheck ? findKing(turn) : null;
    if (isFaceToFace()) {
      over = true; ctx.float('将帅对面，红胜！');
      SFX.win(); setTimeout(function() { ctx.finish(1); }, 1500);
      return;
    }
    /* 困毙检测：无论是否被将军，无合法走步即判负（将死或困毙） */
    var allM = genAllMovesForAI(turn);
    if (!allM.length) {
      over = true;
      var winMsg = inCheck
        ? (turn === 1 ? '黑胜！将死红方' : '红胜！将死黑方')
        : (turn === 1 ? '黑胜！红方困毙' : '红胜！黑方困毙');
      ctx.float(winMsg);
      if (inCheck) SFX.lose(); else SFX.lose();
      setTimeout(function() { ctx.finish(turn === 2 ? 0 : 1); }, 1500);
      return;
    }
    if (inCheck) {
      ctx.float(turn === 1 ? '将军！' : '将军！');
      SFX.check();
      checkFlash = 80;
    }
    updateHUD();
    if (!over && turn === 2) setTimeout(scheduleAI, 420);
  }

  /* ---------- 动画循环 ---------- */
  function startAnim() {
    if (animTimer) clearInterval(animTimer);
    animTimer = setInterval(function() {
      var dirty = false;
      if (animFrom && animTo && animT < 1) { animT += 0.12; if (animT > 1) animT = 1; dirty = true; }
      if (checkFlash > 0) { checkFlash--; dirty = true; }
      /* 思考中必须持续重绘：否则进度与省略点动画不刷新 */
      if (thinking) dirty = true;
      if (dirty) draw();
    }, 30);
  }

  /* ---------- 绘制（Canvas 2D，无 dpr 缩放） ---------- */
  function draw() {
    var cv = ctx.canvas;
    if (!cv) return;
    var c = cv.getContext('2d');
    if (thinking) thinkDot++;
    c.clearRect(0, 0, W, H);
    drawBoard(c);
    drawPieces(c);
    drawOverlay(c);
    drawThinking(c);
  }

  /* 圆角矩形路径（Chrome 69 无 roundRect，手写兼容） */
  function roundRectPath(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* AI 思考中气泡：半透明遮罩 + 思考表情 + 动态省略点 + 搜索进度。
   * 放在棋盘中央最上层，字号/气泡都放大，文字加白边描边，确保清晰。 */
  function drawThinking(c) {
    if (!thinking) return;
    var cw = W, ch = H, cl = CELL;
    var bw = Math.min(cl * 6.6, cw * 0.92), bh = cl * 2.35;
    var bx = (cw - bw) / 2, by = (ch - bh) / 2;
    c.save();
    /* 轻压暗棋盘，突出气泡（仍可透视看到棋子） */
    c.fillStyle = 'rgba(255,255,255,0.50)';
    c.fillRect(0, 0, cw, ch);
    /* 气泡本体 */
    c.shadowColor = 'rgba(80,60,30,0.35)';
    c.shadowBlur = cl * 0.32;
    c.shadowOffsetY = cl * 0.10;
    roundRectPath(c, bx, by, bw, bh, cl * 0.26);
    c.fillStyle = 'rgba(255,255,255,0.98)';
    c.fill();
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0;
    c.strokeStyle = 'rgba(140,120,80,0.75)'; c.lineWidth = 1.6;
    c.stroke();
    /* 思考表情：随点数轻微上下浮动，像在「动脑筋」 */
    var n = Math.floor(thinkDot / 12) % 4;
    var dots = '', k;
    for (k = 0; k < n; k++) dots += '·';
    var bob = Math.sin(thinkDot * 0.08) * cl * 0.05;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = Math.round(cl * 0.72) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
    c.fillText('🤔', bx + bw * 0.18, by + bh * 0.50 + bob);
    /* 主文案：加粗+放大+白边描边，避免与棋盘背景糊在一起 */
    c.font = 'bold ' + Math.round(cl * 0.40) + 'px "楷体","STKaiti","KaiTi",serif';
    var text1 = '黑方思考中' + dots;
    var tx = bx + bw * 0.61, ty1 = by + bh * 0.38;
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = cl * 0.08;
    c.strokeText(text1, tx, ty1);
    c.fillStyle = '#3f3220';
    c.fillText(text1, tx, ty1);
    /* 进度 */
    if (thinkTotal > 0) {
      c.font = 'bold ' + Math.round(cl * 0.32) + 'px "楷体","STKaiti","KaiTi",serif';
      var text2 = '第 ' + thinkDepth + ' 层 · 已想 ' + thinkDone + '/' + thinkTotal;
      var ty2 = by + bh * 0.73;
      c.strokeStyle = 'rgba(255,255,255,0.80)';
      c.lineWidth = cl * 0.06;
      c.strokeText(text2, tx, ty2);
      c.fillStyle = '#5a4a30';
      c.fillText(text2, tx, ty2);
    }
    c.restore();
  }

  function drawBoard(c) {
    var cw = W, ch = H, cl = CELL;
    /* 底色：低饱和温润米杏色竖向渐变，柔和护眼、久看不累 */
    var woodGrad = c.createLinearGradient(0, 0, 0, ch);
    woodGrad.addColorStop(0, '#f6efe1');
    woodGrad.addColorStop(0.38, '#efe4cf');
    woodGrad.addColorStop(0.72, '#e7d9be');
    woodGrad.addColorStop(1, '#dccaa8');
    c.fillStyle = woodGrad;
    c.fillRect(0, 0, cw, ch);
    /* 极淡木纹：宽间距、低透明度，只做质感点缀 */
    c.strokeStyle = 'rgba(150,122,82,0.045)';
    c.lineWidth = 1;
    for (var yy = 0; yy < ch; yy += 7) { c.beginPath(); c.moveTo(0, yy); c.lineTo(cw, yy); c.stroke(); }
    /* 四周柔和内晕影，营造温润层次 */
    var vig = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.22, cw / 2, ch / 2, Math.max(cw, ch) * 0.74);
    vig.addColorStop(0, 'rgba(120,95,60,0)');
    vig.addColorStop(1, 'rgba(120,95,60,0.09)');
    c.fillStyle = vig; c.fillRect(0, 0, cw, ch);

    /* 网格区域坐标：上下左右各留半格 */
    var gx = cl / 2, gy = cl / 2;
    var gw = cw - cl, gh = ch - cl;
    var right = gx + gw, bottom = gy + gh;

    /* 外框：双层柔和棕线，位于网格外一点，精致不抢眼 */
    var pad = cl * 0.26;
    c.strokeStyle = 'rgba(150,128,92,0.42)'; c.lineWidth = 1;
    c.strokeRect(gx - pad - 3, gy - pad - 3, gw + (pad + 3) * 2, gh + (pad + 3) * 2);
    c.strokeStyle = '#a08b64'; c.lineWidth = 2;
    c.strokeRect(gx - pad, gy - pad, gw + pad * 2, gh + pad * 2);

    /* 网格线：横竖均从边界贯通到边界，与外框/边界线严丝合缝 */
    c.strokeStyle = '#9c8663'; c.lineWidth = 1.2;
    var r, col;
    for (r = 0; r < 10; r++) {
      var y = r * cl + cl / 2;
      c.beginPath(); c.moveTo(gx, y); c.lineTo(right, y); c.stroke();
    }
    for (col = 0; col < 9; col++) {
      var x = col * cl + cl / 2;
      if (col === 0 || col === 8) {
        c.beginPath(); c.moveTo(x, gy); c.lineTo(x, bottom); c.stroke();
      } else {
        c.beginPath(); c.moveTo(x, gy); c.lineTo(x, 4.5 * cl); c.stroke();
        c.beginPath(); c.moveTo(x, 5.5 * cl); c.lineTo(x, bottom); c.stroke();
      }
    }
    /* 棋盘边界：与最外层网格线重合，加粗强调，彻底消除空隙 */
    c.strokeStyle = '#8c7852'; c.lineWidth = 2;
    c.strokeRect(gx, gy, gw, gh);

    /* 九宫斜线 */
    c.strokeStyle = '#9c8663'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(3 * cl + cl / 2, 0 * cl + cl / 2); c.lineTo(5 * cl + cl / 2, 2 * cl + cl / 2); c.stroke();
    c.beginPath(); c.moveTo(5 * cl + cl / 2, 0 * cl + cl / 2); c.lineTo(3 * cl + cl / 2, 2 * cl + cl / 2); c.stroke();
    c.beginPath(); c.moveTo(3 * cl + cl / 2, 7 * cl + cl / 2); c.lineTo(5 * cl + cl / 2, 9 * cl + cl / 2); c.stroke();
    c.beginPath(); c.moveTo(5 * cl + cl / 2, 7 * cl + cl / 2); c.lineTo(3 * cl + cl / 2, 9 * cl + cl / 2); c.stroke();

    /* 兵/炮位小十字（边缘行只画内侧，贴合真实棋盘） */
    var marks = [[3,0],[6,0],[1,2],[7,2],[0,3],[2,3],[4,3],[6,3],[8,3],[0,6],[2,6],[4,6],[6,6],[8,6],[1,7],[7,7],[3,9],[6,9]];
    c.strokeStyle = '#9c8663'; c.lineWidth = 1.2;
    for (var mi = 0; mi < marks.length; mi++) {
      var mcol = marks[mi][0], mrow = marks[mi][1];
      var mx = mcol * cl + cl / 2, my = mrow * cl + cl / 2;
      var ms = cl * 0.055;
      var up = mrow !== 0, down = mrow !== 9;
      var left = mcol !== 0, rightSide = mcol !== 8;
      if (up) {
        if (left) { c.beginPath(); c.moveTo(mx - ms, my - ms * 2.4); c.lineTo(mx - ms, my - ms * 0.7); c.stroke(); }
        if (rightSide) { c.beginPath(); c.moveTo(mx + ms, my - ms * 2.4); c.lineTo(mx + ms, my - ms * 0.7); c.stroke(); }
      }
      if (down) {
        if (left) { c.beginPath(); c.moveTo(mx - ms, my + ms * 0.7); c.lineTo(mx - ms, my + ms * 2.4); c.stroke(); }
        if (rightSide) { c.beginPath(); c.moveTo(mx + ms, my + ms * 0.7); c.lineTo(mx + ms, my + ms * 2.4); c.stroke(); }
      }
    }
    /* 楚河汉界：柔和棕字，与整体色调统一 */
    c.save();
    c.font = 'bold ' + Math.round(cl * 0.34) + 'px "楷体","STKaiti","KaiTi",serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(140,120,82,0.72)';
    c.fillText('楚  河', 2.5 * cl, 5.0 * cl);
    c.fillText('汉  界', 6.5 * cl, 5.0 * cl);
    c.restore();
  }

  function drawPieces(c) {
    var r, col, p;
    /* 走子动画期间：起点与终点都交给下方「中间帧」统一绘制。
     * 旧逻辑只隐藏起点，终点仍被静态绘制一次、又被动画绘制一次 →
     * 同一格出现两个棋子（吃子后看起来像「被吃的子没消失、重叠」）。 */
    var animating = !!(animFrom && animTo && animT < 1);
    for (r = 0; r < 10; r++) for (col = 0; col < 9; col++) {
      p = board[r][col];
      if (!p) continue;
      if (animating && ((r === animFrom[0] && col === animFrom[1]) || (r === animTo[0] && col === animTo[1]))) continue;
      var px = col * CELL + CELL / 2, py = r * CELL + CELL / 2;
      drawPieceAt(c, px, py, p, (checkFlash > 0 && checkPiece && checkPiece[0] === r && checkPiece[1] === col) ? checkFlash : 0);
    }
    /* 走子动画：中间帧（起点 → 终点的移动棋子）。
     * 必须不透明绘制：飞行途中会经过其它棋子，若半透明会与下方棋子
     * 的红/黑文字叠色，看起来「一个字里又有黑又有红」。 */
    if (animating) {
      var ax = animFrom[1] + (animTo[1] - animFrom[1]) * animT;
      var ay = animFrom[0] + (animTo[0] - animFrom[0]) * animT;
      var ap = board[animTo[0]][animTo[1]];
      if (ap) {
        var cx2 = ax * CELL + CELL / 2, cy2 = ay * CELL + CELL / 2;
        drawPieceAt(c, cx2, cy2, ap, 0);
      }
    }
    }

  function drawPieceAt(c, x, y, p, flash) {
    var R = CELL * 0.44;
    var isR = isRed(p);
    /* 棋子底色全部统一为象牙白；文字分红/黑，采用柔和朱墨色，降低刺眼感 */
    var textColor = isR ? '#b23a2e' : '#3a3733';
    /* 将军红光闪烁 */
    if (flash > 0) {
      var fl = Math.sin(flash * 0.25) * 0.5 + 0.5;
      c.save();
      c.shadowColor = '#ef4444'; c.shadowBlur = 18 + fl * 16;
      c.beginPath(); c.arc(x, y, R + 6, 0, Math.PI * 2);
      c.fillStyle = 'rgba(239,68,68,' + (0.15 + fl * 0.20) + ')'; c.fill();
      c.restore();
    }
    /* 选中光晕（金色） */
    if (selected && selected[0] === Math.round((y - CELL / 2) / CELL) && selected[1] === Math.round((x - CELL / 2) / CELL)) {
      c.save();
      c.shadowColor = '#fbbf24'; c.shadowBlur = 20;
      c.beginPath(); c.arc(x, y, R + 4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(251,191,36,0.28)'; c.fill();
      c.restore();
    }
    /* 棋子本体：统一象牙白径向渐变，细腻立体浮雕感（带投影，浮于浅色棋盘之上） */
    c.save();
    c.shadowColor = 'rgba(96,74,42,0.32)';
    c.shadowBlur = R * 0.24;
    c.shadowOffsetY = R * 0.10;
    var grad = c.createRadialGradient(x - R * 0.30, y - R * 0.34, R * 0.05, x, y, R);
    grad.addColorStop(0, '#fffef9');     /* 高光区：近白 */
    grad.addColorStop(0.35, '#f7eccf'); /* 中层：淡米 */
    grad.addColorStop(0.75, '#ecdaad'); /* 边缘过渡 */
    grad.addColorStop(1, '#d0ad63');    /* 底部：古铜金 */
    c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2);
    c.fillStyle = grad; c.fill();
    c.restore();
    /* 棋子外圈细线（金褐色），加强轮廓对比 */
    c.strokeStyle = '#a67c34'; c.lineWidth = R * 0.085; c.stroke();
    /* 顶部高光椭圆 */
    c.save();
    c.beginPath(); c.ellipse(x - R * 0.18, y - R * 0.28, R * 0.28, R * 0.10, -Math.PI / 4, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill();
    c.restore();
    /* 底部投影 */
    c.save();
    c.beginPath(); c.ellipse(x, y + R * 0.72, R * 0.50, R * 0.085, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(0,0,0,0.14)'; c.fill();
    c.restore();
    /* 棋子文字：去掉投影，笔画干净利落不重影 */
    c.save();
    c.font = 'bold ' + Math.round(R * 1.02) + 'px "楷体","STKaiti","KaiTi","SimSun",serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = textColor;
    c.fillText(XQ_PIECES[p] || p, x, y + 1);
    c.restore();
  }

  function drawOverlay(c) {
    if (!selected || !moves.length) return;
    var i, mr, mc, mx, my;
    for (i = 0; i < moves.length; i++) {
      mr = moves[i][0]; mc = moves[i][1];
      mx = mc * CELL + CELL / 2; my = mr * CELL + CELL / 2;
      if (board[mr][mc] !== 0) {
        /* 吃子位：红色双圈 */
        c.strokeStyle = 'rgba(220,38,38,0.72)'; c.lineWidth = 2.2;
        c.beginPath(); c.arc(mx, my, CELL * 0.22, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(220,38,38,0.28)'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(mx, my, CELL * 0.34, 0, Math.PI * 2); c.stroke();
      } else {
        /* 空位：绿色实心圆点 */
        c.beginPath(); c.arc(mx, my, CELL * 0.12, 0, Math.PI * 2);
        c.fillStyle = 'rgba(22,163,74,0.52)'; c.fill();
      }
    }
  }

  /* ---------- 输入处理 ---------- */
  /* 棋子位于交点 (c*CELL + CELL/2)，最近交点列号 = round((x - CELL/2)/CELL)，
   * 等价于 floor(x/CELL)。此前误用 round(x/CELL)，在交点中心得到 c+1，
   * 整体偏移一格 → 目标格永远匹配不上走法，才出现「不能走」的假报错。 */
  function pixelToCell(px, py) {
    var dpr = window.devicePixelRatio || 1;
    var lx = px / dpr, ly = py / dpr;
    var col = Math.round((lx - CELL / 2) / CELL);
    var row = Math.round((ly - CELL / 2) / CELL);
    if (col < 0 || col > 8 || row < 0 || row > 9) return null;
    return [row, col];
  }

  /* 命中红子：优先最近交点，否则在容差内取最近的红子（手指友好） */
  function hitTestPiece(px, py) {
    var dpr = window.devicePixelRatio || 1;
    var lx = px / dpr, ly = py / dpr;
    var col = Math.round((lx - CELL / 2) / CELL);
    var row = Math.round((ly - CELL / 2) / CELL);
    if (row >= 0 && row <= 9 && col >= 0 && col <= 8) {
      var p0 = board[row][col];
      if (p0 && isRed(p0)) return [row, col];
    }
    var best = null, bestD = Infinity;
    var rr, cc, pp, cx, cy, ddx, ddy, d2;
    for (rr = 0; rr < 10; rr++) for (cc = 0; cc < 9; cc++) {
      pp = board[rr][cc];
      if (!pp || !isRed(pp)) continue;
      cx = cc * CELL + CELL / 2;
      cy = rr * CELL + CELL / 2;
      ddx = lx - cx; ddy = ly - cy;
      if (Math.abs(ddx) <= CELL * 0.72 && Math.abs(ddy) <= CELL * 0.72) {
        d2 = ddx * ddx + ddy * ddy;
        if (d2 < bestD) { bestD = d2; best = [rr, cc]; }
      }
    }
    return best;
  }

  /* 把当前选中的棋子走到 (r,c)，成功返回 true */
  function tryMoveTo(r, c) {
    var i;
    for (i = 0; i < moves.length; i++) if (moves[i][0] === r && moves[i][1] === c) {
      doMove(selected[0], selected[1], r, c);
      return true;
    }
    return false;
  }

  function onTap(x, y) {
    if (over || turn === 2) return;
    var cell = pixelToCell(x, y);
    if (!cell) { selected = null; moves = []; draw(); return; }
    var r = cell[0], c = cell[1], p = board[r][c];
    /* 点到自己的棋子：切换 / 保持选中，绝不报错 */
    if (p && isRed(p)) {
      if (selected && selected[0] === r && selected[1] === c) return;
      selected = [r, c]; moves = genMoves(r, c); SFX.click(); draw();
      return;
    }
    /* 已选中棋子：尝试落子 */
    if (selected) {
      if (tryMoveTo(r, c)) return;
      SFX.illegal();
      ctx.float('此处不能走！');
      return;
    }
    selected = null; moves = []; draw();
  }

  function onPress(x, y) {
    if (over || turn === 2) return;
    var hit = hitTestPiece(x, y);
    if (hit) { selected = hit; moves = genMoves(hit[0], hit[1]); SFX.click(); draw(); }
  }

  function onRelease(x, y) {
    if (over || turn === 2) return;
    if (!selected) {
      /* 没有选中棋子时，尝试用容差命中 */
      var hit = hitTestPiece(x, y);
      if (hit) { selected = hit; moves = genMoves(hit[0], hit[1]); draw(); }
      return;
    }
    var cell = pixelToCell(x, y);
    if (!cell) return;
    var r = cell[0], c = cell[1];
    /* 原地抬起（点选）或落回自身：保持选中，不取消 */
    if (r === selected[0] && c === selected[1]) return;
    if (tryMoveTo(r, c)) return;
    /* 落在另一颗己方棋子上：切换选中 */
    var p = board[r][c];
    if (p && isRed(p)) { selected = [r, c]; moves = genMoves(r, c); draw(); return; }
    /* 其它非法位置：取消选中 */
    selected = null; moves = []; draw();
  }

  function updateHUD() {
    var status;
    if (thinking) status = '黑方思考中…';
    else status = over ? '（结束）' : (turn === 1 ? '红方回合' : '黑方回合');
    if (checkPiece && !over && !thinking) status += ' [将军]';
    ctx.hud(status + '  步数:' + stepCount);
  }

  /* ---------- 难度选择条（棋盘与按钮之间，不遮挡棋子） ---------- */
  var diffBar = null;

  function buildDiffBar() {
    var screen = document.getElementById('gamePlayScreen');
    if (!screen || screen.querySelector('.xq-diff-bar')) return;
    diffBar = document.createElement('div');
    diffBar.className = 'game-diff-bar xq-diff-bar';
    diffBar.style.margin = '.2rem 0';
    diffBar.style.background = 'rgba(255,255,255,.65)';
    diffBar.style.borderRadius = '1rem';
    diffBar.style.padding = '.2rem .35rem';
    diffBar.style.display = 'flex';
    diffBar.style.justifyContent = 'center';
    diffBar.style.gap = '.35rem';
    diffBar.setAttribute('data-game-control', '1'); // 未点「开始」也能选难度
    var ctrl = screen.querySelector('.game-ctrl');
    if (ctrl) screen.insertBefore(diffBar, ctrl);
    else screen.appendChild(diffBar);
    renderDiffBar();
  }

  function renderDiffBar() {
    if (!diffBar) return;
    var labels = ['😊 简单', '🙂 普通', '🤯 困难', '🏆 大师'];
    var html = '', d;
    for (d = 1; d <= 4; d++) {
      html += '<button class="diff-btn' + (diff === d ? ' active' : '') + '" data-d="' + d + '" style="white-space:nowrap;padding:.25rem .45rem;font-size:.68rem;">' + labels[d - 1] + '</button>';
    }
    diffBar.innerHTML = html;
    Array.prototype.forEach.call(diffBar.querySelectorAll('.diff-btn'), function (b) {
      b.addEventListener('click', function () {
        var nd = +b.getAttribute('data-d');
        if (nd === diff) return;
        diff = nd;
        SFX.click();
        renderDiffBar();
        fresh();
        updateHUD();
      });
    });
  }

  return {
    init: function() { diff = 1; buildDiffBar(); fresh(); updateHUD(); },
    start: function() { fresh(); updateHUD(); },   /* 保留用户已选难度，不重置 */
    reset: function() { fresh(); updateHUD(); },
    draw: draw,
    onTap: function(x, y) { onTap(x, y); updateHUD(); },
    onPress: function(x, y) { onPress(x, y); },
    onRelease: function(x, y) { onRelease(x, y); updateHUD(); },
    stop: function() { over = true; thinking = false; if (animTimer) clearInterval(animTimer); }
  };
});
