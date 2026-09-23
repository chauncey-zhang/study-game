'use strict';
/* ===================== 休闲游戏 · 消除排列 4 款 ===================== */

/* ===== 连连看 ===== */
regGame('linkup', function (ctx) {
  var R=6,C=8, grid, over, score, sel;
  var EMO=['🍎','🍌','🍇','🍉','🍓','🍒','🥝','🍑'];
  function fresh(){
    var pool=[],i;
    for(i=0;i<EMO.length;i++)pool.push(EMO[i],EMO[i],EMO[i]); // 每种3个，共24
    while(pool.length<R*C)pool.push('🍊');
    pool=gShuffle(pool);
    grid=[];for(i=0;i<R*C;i++)grid.push(pool[i]);
    score=0;sel=-1;over=false;draw();
  }
  function lineClear(r1,c1,r2,c2){
    if(r1===r2){var a=Math.min(c1,c2),b=Math.max(c1,c2),c;for(c=a+1;c<b;c++)if(grid[r1*C+c]!==0)return false;return true;}
    if(c1===c2){var a2=Math.min(r1,r2),b2=Math.max(r1,r2),r;for(r=a2+1;r<b2;r++)if(grid[r*C+c1]!==0)return false;return true;}
    return false;
  }
  function canConnect(i1,i2){
    var r1=Math.floor(i1/C),c1=i1%C,r2=Math.floor(i2/C),c2=i2%C;
    if(i1===i2)return false;
    if(grid[i1]!==grid[i2]||grid[i1]===0)return false;
    if(lineClear(r1,c1,r2,c2))return true;
    if(grid[r1*C+c2]===0&&lineClear(r1,c1,r1,c2)&&lineClear(r1,c2,r2,c2))return true;
    if(grid[r2*C+c1]===0&&lineClear(r1,c1,r2,c1)&&lineClear(r2,c1,r2,c2))return true;
    for(var r=0;r<R;r++)if(r!==r1&&r!==r2&&grid[r*C+c1]===0&&grid[r*C+c2]===0&&lineClear(r1,c1,r,c1)&&lineClear(r,c1,r,c2)&&lineClear(r,c2,r2,c2))return true;
    for(var c=0;c<C;c++)if(c!==c1&&c!==c2&&grid[r1*C+c]===0&&grid[r2*C+c]===0&&lineClear(r1,c1,r1,c)&&lineClear(r1,c,r2,c)&&lineClear(r2,c,r2,c2))return true;
    return false;
  }
  function draw(){
    var h='<div class="link-grid">';
    for(var i=0;i<R*C;i++){
      h+='<button class="link-cell'+(sel===i?' sel':'')+'" data-i="'+i+'">'+(grid[i]?grid[i]:'')+'</button>';
    }
    h+='</div><button class="btn btn-outline" id="linkShuffle" style="margin-top:.5rem">🔀 洗牌</button>';
    ctx.container.innerHTML=h;ctx.hud('得分 '+score);
    ctx.container.querySelectorAll('.link-cell').forEach(function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');
      if(grid[i]===0)return;
      if(sel===-1){sel=i;SFX.click();draw();return;}
      if(sel===i){sel=-1;draw();return;}
      if(grid[sel]===grid[i]&&canConnect(sel,i)){
        grid[sel]=0;grid[i]=0;score+=10;SFX.pop();sel=-1;draw();
        ctx.float('+10');
        ctx.burst(ctx.container.clientWidth/2, ctx.container.clientHeight/2, '#60a5fa', 6);
        ctx.vibrate(15);
        if(grid.every(function(v){return v===0;})){over=true;ctx.finish(score);}
      }else{sel=i;SFX.click();draw();}
    });});
    var sh=ctx.container.querySelector('#linkShuffle');
    if(sh)sh.addEventListener('click',function(){SFX.click();var arr=grid.filter(function(v){return v!==0;});grid=[];var i;for(i=0;i<R*C;i++)grid.push(arr[i]||0);draw();});
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 俄罗斯方块 ===== */
regGame('tetris', function (ctx) {
  var CW=10,CH=20,CS=20, board, cur, cx, cy, score, over, acc, spd, curColor;
  var SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
  var COLORS=['#f87171','#fbbf24','#a78bfa','#60a5fa','#60a5fa','#34d399','#facc15'];
  function newPiece(){curColor=Math.floor(Math.random()*SHAPES.length);cur=SHAPES[curColor].map(function(r){return r.slice();});cx=Math.floor((CW-cur[0].length)/2);cy=0;}
  function fresh(){board=[];for(var r=0;r<CH;r++){board.push([]);for(var c=0;c<CW;c++)board[r].push(0);}score=0;over=false;acc=0;spd=800;newPiece();}
  function collide(p,px,py){for(var r=0;r<p.length;r++)for(var c=0;c<p[r].length;c++){if(p[r][c]){var x=px+c,y=py+r;if(x<0||x>=CW||y>=CH)return true;if(y>=0&&board[y][x])return true;}}return false;}
  function merge(){for(var r=0;r<cur.length;r++)for(var c=0;c<cur[r].length;c++){if(cur[r][c]){var y=cy+r;if(y<0){over=true;ctx.finish(score);return;}board[y][cx+c]=1;}}clearLines();newPiece();if(collide(cur,cx,cy)){over=true;ctx.finish(score);}}
  function clearLines(){var n=0,r;for(r=CH-1;r>=0;r--){if(board[r].every(function(v){return v;})){board.splice(r,1);board.unshift([]);for(var c=0;c<CW;c++)board[0].push(0);n++;r++;}}if(n){score+=n*n*100;spd=Math.max(200,spd-40);ctx.float('+'+n*n*100);ctx.burst(ctx.canvas.width/2,ctx.canvas.height/2,'#34d399',12);ctx.vibrate(20);SFX.pop();}}
  function rot(p){var h=p.length,w=p[0].length,r,c;var n=[];for(c=0;c<w;c++){n.push([]);for(r=h-1;r>=0;r--)n[c].push(p[r][c]);}return n;}
  function tryMove(dx,dy,np){if(!collide(np||cur,cx+dx,cy+dy)){cx+=dx;cy+=dy;if(np)cur=np;return true;}return false;}
  function down(){if(!tryMove(0,1))merge();}
  function draw(){
    var cv=ctx.canvas,c=cv.getContext('2d');
    c.clearRect(0,0,cv.width,cv.height);
    c.fillStyle='#f1f5f9';c.fillRect(0,0,cv.width,cv.height);
    for(var r=0;r<CH;r++)for(var cc=0;cc<CW;cc++)if(board[r][cc]){c.fillStyle='#94a3b8';c.fillRect(cc*CS,r*CS,CS-1,CS-1);}
    for(var rr=0;rr<cur.length;rr++)for(var cc2=0;cc2<cur[rr].length;cc2++)if(cur[rr][cc2]){c.fillStyle=COLORS[curColor];c.fillRect((cx+cc2)*CS,(cy+rr)*CS,CS-1,CS-1);}
    ctx.hud('得分 '+score+' · ←→ 移动 · ↑ 旋转 · ↓ 下落');
  }
  function act(d){if(over)return;if(d==='left')tryMove(-1,0);else if(d==='right')tryMove(1,0);else if(d==='down')down();else if(d==='up'){var np=rot(cur);if(!collide(np,cx,cy))cur=np;}draw();}
  return {
    init:function(){ctx.canvas.width=CW*CS;ctx.canvas.height=CH*CS;fresh();draw();},
    start:fresh, reset:fresh,
    tick:function(dt){if(over)return;acc+=16;if(acc>=spd){acc=0;down();}draw();},
    draw:draw,
    onKey:act,
    onSwipe:act
  };
});

/* ===== 打砖块（关卡递增：砖块行数随关卡增加） ===== */
regGame('breakout', function (ctx) {
  var W=320,H=420, pad, ball, bricks, score, over, lives, lv;
  function buildLevel(){
    bricks=[];
    var rows=Math.min(3+lv, 8);
    for(var r=0;r<rows;r++)for(var c=0;c<7;c++)bricks.push({x:c*44+8,y:r*20+30,w:38,h:14,alive:true});
  }
  function fresh(){
    lv=1;
    pad={x:W/2-30,y:H-20,w:60,h:10};
    ball={x:W/2,y:H-40,r:6,dx:2.5,dy:-3};
    score=0;over=false;lives=3;
    buildLevel();
  }
  function update(){
    if(over)return;
    ball.x+=ball.dx;ball.y+=ball.dy;
    if(ball.x<ball.r||ball.x>W-ball.r)ball.dx=-ball.dx;
    if(ball.y<ball.r)ball.dy=-ball.dy;
    if(ball.y+ball.r>H){lives--;if(lives<=0){over=true;ctx.finish(score, lv);return;}ball.x=W/2;ball.y=H-40;ball.dy=-3;}
    if(ball.y+ball.r>pad.y&&ball.y-ball.r<pad.y+pad.h&&ball.x>pad.x-ball.r&&ball.x<pad.x+pad.w+ball.r){ball.dy=-Math.abs(ball.dy);ball.dx=(ball.x-(pad.x+pad.w/2))/10;SFX.click();}
    for(var i=0;i<bricks.length;i++){var b=bricks[i];if(b.alive&&ball.x>b.x&&ball.x<b.x+b.w&&ball.y>b.y&&ball.y<b.y+b.h){b.alive=false;ball.dy=-ball.dy;score+=10;SFX.pop();ctx.burst(b.x+b.w/2,b.y+b.h/2,'#fbbf24',6);ctx.vibrate(12);if(bricks.every(function(x){return !x.alive;})){lv++;score+=50;SFX.levelup();ctx.float('第 '+lv+' 关');ball.x=W/2;ball.y=H-40;ball.dy=-3;buildLevel();}}}
  }
  function draw(){
    var cv=ctx.canvas,c=cv.getContext('2d');
    c.clearRect(0,0,W,H);c.fillStyle='#f1f5f9';c.fillRect(0,0,W,H);
    c.fillStyle='#fbbf24';c.fillRect(pad.x,pad.y,pad.w,pad.h);
    c.fillStyle='#334155';c.beginPath();c.arc(ball.x,ball.y,ball.r,0,7);c.fill();
    var cols=['#f87171','#fbbf24','#60a5fa','#a78bfa','#34d399','#facc15'];
    for(var i=0;i<bricks.length;i++){var b=bricks[i];if(b.alive){c.fillStyle=cols[Math.floor(i/7)%6];c.fillRect(b.x,b.y,b.w,b.h);}}
    ctx.hud('第 '+lv+' 关 · 得分 '+score+' · 生命 '+lives);
  }
  return {
    init:function(){ctx.canvas.width=W;ctx.canvas.height=H;fresh();draw();},
    start:fresh, reset:fresh,
    tick:update, draw:draw,
    onKey:function(d){if(over)return;if(d==='left')pad.x=Math.max(0,pad.x-18);else if(d==='right')pad.x=Math.min(W-pad.w,pad.x+18);},
    onTap:function(x){if(over)return;pad.x=Math.max(0,Math.min(W-pad.w,x-pad.w/2));}
  };
});

/* ===== 泡泡龙（关卡递增：初始泡泡行数随关卡增加） ===== */
regGame('bubble', function (ctx) {
  var COLS=6,ROWS=7,BW=40, W=COLS*BW, H=ROWS*BW+50, grid, shooter, curCol, score, over, lv;
  var COL=['#f87171','#fbbf24','#60a5fa','#34d399'];
  function gen(){
    grid=[];var r,c;
    for(r=0;r<ROWS;r++){grid.push([]);for(c=0;c<COLS;c++)grid[r].push(0);}
    var rows=Math.min(3+lv, 6);
    for(r=0;r<rows;r++)for(c=0;c<COLS;c++)grid[r][c]=Math.floor(Math.random()*COL.length)+1;
    shooter=Math.floor(Math.random()*COL.length)+1;curCol=Math.floor(COLS/2);
  }
  function fresh(){lv=1;score=0;over=false;gen();}
  function firstEmpty(c){for(var r=ROWS-1;r>=0;r--)if(grid[r][c]===0)return r;return -1;}
  function flood(r,c,color,seen){
    if(r<0||r>=ROWS||c<0||c>=COLS||grid[r][c]!==color||seen[r][c])return;
    seen[r][c]=true;
    flood(r-1,c,color,seen);flood(r+1,c,color,seen);flood(r,c-1,color,seen);flood(r,c+1,color,seen);
  }
  function shoot(){
    if(over)return;
    var r=firstEmpty(curCol);if(r<0){over=true;ctx.finish(score, lv);return;} // 该列堆到顶
    grid[r][curCol]=shooter;SFX.click();
    var seen=[];var i,j;for(i=0;i<ROWS;i++){seen.push([]);for(j=0;j<COLS;j++)seen[i].push(false);}
    flood(r,curCol,shooter,seen);
    var cnt=0;for(i=0;i<ROWS;i++)for(j=0;j<COLS;j++)if(seen[i][j])cnt++;
    if(cnt>=3){for(i=0;i<ROWS;i++)for(j=0;j<COLS;j++)if(seen[i][j])grid[i][j]=0;score+=cnt*10;SFX.pop();ctx.float('+'+cnt*10);ctx.burst(curCol*BW+BW/2,r*BW+BW/2,'#f87171',12);ctx.vibrate(15);}
    shooter=Math.floor(Math.random()*COL.length)+1;
    if(grid.every(function(row){return row.every(function(v){return v===0;});})){
      if(lv<3){lv++;score+=50;SFX.levelup();ctx.float('第 '+lv+' 关');gen();}
      else{over=true;ctx.finish(score, lv);}
    }
    draw();
  }
  function draw(){
    var cv=ctx.canvas,c=cv.getContext('2d');
    c.clearRect(0,0,W,H);c.fillStyle='#f1f5f9';c.fillRect(0,0,W,H);
    var r,cc;
    for(r=0;r<ROWS;r++)for(cc=0;cc<COLS;cc++)if(grid[r][cc]){c.fillStyle=COL[grid[r][cc]-1];c.beginPath();c.arc(cc*BW+BW/2,r*BW+BW/2,BW/2-3,0,7);c.fill();}
    c.fillStyle=COL[shooter-1];c.beginPath();c.arc(curCol*BW+BW/2,H-25,BW/2-3,0,7);c.fill();
    ctx.hud('第 '+lv+' 关 · 得分 '+score+' · 滑动移动 · 上滑发射');
  }
  function moveCol(d){if(over)return;if(d==='left')curCol=Math.max(0,curCol-1);else if(d==='right')curCol=Math.min(COLS-1,curCol+1);else if(d==='up'||d==='down')shoot();draw();}
  return {
    init:function(){ctx.canvas.width=W;ctx.canvas.height=H;fresh();draw();},
    start:fresh, reset:fresh, draw:draw,
    onKey:moveCol,
    onSwipe:moveCol,
    onTap:function(x){if(over)return;curCol=Math.max(0,Math.min(COLS-1,Math.floor(x/BW)));shoot();draw();}
  };
});
