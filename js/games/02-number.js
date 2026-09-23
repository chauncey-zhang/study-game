'use strict';
/* ===================== 休闲游戏 · 数字烧脑 6 款 ===================== */

/* ===== 2048 ===== */
regGame('game2048', function (ctx) {
  var grid, over, score;
  function spawn(){var e=[],r,c;for(r=0;r<4;r++)for(c=0;c<4;c++)if(grid[r][c]===0)e.push([r,c]);if(!e.length)return;var p=e[Math.floor(Math.random()*e.length)];grid[p[0]][p[1]]=Math.random()<0.9?2:4;}
  function slideRow(row){var a=row.filter(function(v){return v!==0;}),i,r=[];for(i=0;i<a.length;i++){if(a[i]===a[i+1]){r.push(a[i]*2);score+=a[i]*2;i++;}else r.push(a[i]);}while(r.length<4)r.push(0);return r;}
  function slide(d){
    var old=JSON.stringify(grid),r,c;
    if(d==='left'){for(r=0;r<4;r++)grid[r]=slideRow(grid[r]);}
    else if(d==='right'){for(r=0;r<4;r++)grid[r]=slideRow(grid[r].slice().reverse()).reverse();}
    else if(d==='up'){for(c=0;c<4;c++){var col=[grid[0][c],grid[1][c],grid[2][c],grid[3][c]];col=slideRow(col);for(r=0;r<4;r++)grid[r][c]=col[r];}}
    else if(d==='down'){for(c=0;c<4;c++){var col2=[grid[3][c],grid[2][c],grid[1][c],grid[0][c]];col2=slideRow(col2);for(r=0;r<4;r++)grid[r][c]=col2[3-r];}}
    return old!==JSON.stringify(grid);
  }
  function full(){for(var r=0;r<4;r++)for(var c=0;c<4;c++)if(grid[r][c]===0)return false;return true;}
  function dead(){if(!full())return false;for(var r=0;r<4;r++)for(var c=0;c<4;c++){if(c<3&&grid[r][c]===grid[r][c+1])return false;if(r<3&&grid[r][c]===grid[r+1][c])return false;}return true;}
  function draw(){
    var h='<div class="g2048-grid">';
    for(var r=0;r<4;r++)for(var c=0;c<4;c++){var v=grid[r][c];h+='<div class="g2048-cell n'+v+'">'+(v?v:'')+'</div>';}
    h+='</div>';
    ctx.container.innerHTML=h;ctx.hud('得分 '+score);
  }
  function move(d){
    if(over)return;
    var before=score;
    if(slide(d)){
      var gained=score-before;
      spawn();draw();
      if(gained>0){
        ctx.float('+'+gained);
        ctx.burst(ctx.container.clientWidth/2, ctx.container.clientHeight/2, '#fbbf24', 8);
        ctx.vibrate(15);
        SFX.pop();
      }
      if(dead()){over=true;ctx.finish(score);}
    }
  }
  return {
    init:function(){ ctx.container.style.touchAction = 'none'; fresh(); },
    start:fresh, reset:fresh,
    onKey:move,
    onSwipe:move
  };
  function fresh(){grid=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];score=0;over=false;spawn();spawn();draw();}
});

/* ===== 数独（程序生成 + 三档难度） ===== */
regGame('sudoku', function (ctx) {
  var grid, fixed, sel, over, diff=1;
  function valid(g, p, n){
    var r=Math.floor(p/9), c=p%9, i;
    for(i=0;i<9;i++){ if(g[r*9+i]===n)return false; if(g[i*9+c]===n)return false; }
    var br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
    for(var rr=0;rr<3;rr++)for(var cc=0;cc<3;cc++)if(g[(br+rr)*9+(bc+cc)]===n)return false;
    return true;
  }
  function genFull(){
    var g=[],i;for(i=0;i<81;i++)g.push(0);
    var nums;
    function fill(pos){
      if(pos===81)return true;
      nums=gShuffle([1,2,3,4,5,6,7,8,9]);
      for(var i=0;i<9;i++){
        var n=nums[i];
        if(valid(g,pos,n)){ g[pos]=n; if(fill(pos+1))return true; g[pos]=0; }
      }
      return false;
    }
    fill(0);
    return g;
  }
  function fresh(){
    var full=genFull();
    grid=full.slice();
    fixed=[];var i;
    for(i=0;i<81;i++)fixed.push(true);
    var holes=diff===0?30:diff===1?40:50, removed=0;
    while(removed<holes){var p=Math.floor(Math.random()*81);if(fixed[p]){fixed[p]=false;grid[p]=0;removed++;}}
    sel=-1;over=false;draw();
  }
  function draw(){
    var h='<div class="game-diff-bar">'+
      '<button class="diff-btn'+(diff===0?' active':'')+'" data-game-control="1" data-d="0">😊 简单</button>'+
      '<button class="diff-btn'+(diff===1?' active':'')+'" data-game-control="1" data-d="1">🙂 普通</button>'+
      '<button class="diff-btn'+(diff===2?' active':'')+'" data-game-control="1" data-d="2">🤯 困难</button>'+
      '</div><div class="sud-grid">';
    for(var i=0;i<81;i++){
      var cls='sud-cell'+(fixed[i]?' fixed':'')+(sel===i?' sel':'');
      h+='<button class="'+cls+'" data-i="'+i+'">'+(grid[i]?grid[i]:'')+'</button>';
    }
    h+='</div><div class="sud-pad">';
    for(var n=1;n<=9;n++)h+='<button class="sud-num" data-n="'+n+'">'+n+'</button>';
    h+='<button class="sud-num sud-eraser" data-n="0">✕</button></div>';
    ctx.container.innerHTML=h;
    ctx.hud(diff===0?'简单':diff===1?'普通':'困难');
    ctx.container.querySelectorAll('.diff-btn').forEach(function(d){d.addEventListener('click',function(){
      var nd=+d.getAttribute('data-d');if(nd===diff)return;diff=nd;SFX.click();fresh();
    });});
    ctx.container.querySelectorAll('.sud-cell').forEach(function(c){c.addEventListener('click',function(){
      var i=+c.getAttribute('data-i');if(fixed[i])return;sel=i;SFX.click();draw();
    });});
    ctx.container.querySelectorAll('.sud-num').forEach(function(b){b.addEventListener('click',function(){
      if(sel===-1||fixed[sel])return;var n=+b.getAttribute('data-n');
      grid[sel]=n;SFX.click();sel=-1;draw();
      if(grid.indexOf(0)===-1){if(checkWin()){over=true;ctx.finish(1);}else ctx.toast('有错误，再检查一下');}
    });});
  }
  function checkWin(){
    var i,r,c;
    for(i=0;i<81;i++){r=Math.floor(i/9);c=i%9;var v=grid[i];var j;for(j=0;j<9;j++){if(j!==c&&grid[r*9+j]===v)return false;if(j!==r&&grid[j*9+c]===v)return false;}}
    for(var b=0;b<9;b++){var seen={};var br=Math.floor(b/3)*3,bc=(b%3)*3;for(r=0;r<3;r++)for(c=0;c<3;c++){var val=grid[(br+r)*9+(bc+c)];if(seen[val])return false;seen[val]=1;}}
    return true;
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 15 拼图 ===== */
regGame('fifteen', function (ctx) {
  var board, over, steps;
  function solvable(){var inv=0,i,j;for(i=0;i<16;i++){if(board[i]===0)continue;for(j=i+1;j<16;j++){if(board[j]!==0&&board[i]>board[j])inv++;}}return inv%2===0;}
  function fresh(){
    board=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
    do{board=gShuffle(board);}while(!solvable());
    steps=0;over=false;draw();
  }
  function draw(){
    var h='<div class="f15-grid">';
    for(var i=0;i<16;i++)h+='<button class="f15-cell'+(board[i]===0?' empty':'')+'" data-i="'+i+'">'+(board[i]?board[i]:'')+'</button>';
    h+='</div>';
    ctx.container.innerHTML=h;ctx.hud('步数 '+steps);
    ctx.container.querySelectorAll('.f15-cell').forEach(function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');var z=board.indexOf(0);
      var r1=Math.floor(i/4),c1=i%4,r2=Math.floor(z/4),c2=z%4;
      if(Math.abs(r1-r2)+Math.abs(c1-c2)!==1)return;
      board[z]=board[i];board[i]=0;steps++;SFX.click();draw();
      if(board.join(',')==='1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0'){over=true;ctx.finish(steps);}
    });});
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 经典华容道（3 关，方向键/按钮移动选中块） ===== */
regGame('klotski', function (ctx) {
  // 5 行 4 列；块 id：1=曹操(2x2) 2=关羽(2x1横) 3-6=四将(1x2竖) 7-10=四兵(1x1) 0=空格
  var LAYOUTS=[
    [1,1,2,2, 1,1,3,4, 5,6,3,4, 5,6,7,8, 0,0,9,10],
    [1,1,2,2, 1,1,3,4, 0,5,3,4, 6,5,7,8, 6,0,9,10],
    [0,2,2,0, 3,1,1,4, 3,1,1,4, 5,6,7,8, 5,6,9,10]
  ];
  var lv=0, grid, sel, steps, over, won;
  var NAMES={1:'曹',2:'关',3:'张',4:'赵',5:'马',6:'黄',7:'兵',8:'兵',9:'兵',10:'兵'};
  function fresh(){grid=LAYOUTS[lv].slice();sel=0;steps=0;over=false;won=false;draw();}
  function cells(id){var r=[];for(var i=0;i<20;i++)if(grid[i]===id)r.push(i);return r;}
  function canMove(id,dir){
    var cs=cells(id),i;
    for(i=0;i<cs.length;i++){
      var p=cs[i],r=Math.floor(p/4),c=p%4,np;
      if(dir==='up')np=p-4;else if(dir==='down')np=p+4;else if(dir==='left')np=p-1;else np=p+1;
      if(dir==='up'&&r===0)return false;if(dir==='down'&&r===4)return false;if(dir==='left'&&c===0)return false;if(dir==='right'&&c===3)return false;
      var other=grid[np];
      if(other!==0&&other!==id)return false;
    }
    return true;
  }
  function move(id,dir){
    if(!canMove(id,dir))return false;
    var cs=cells(id);
    for(var i=0;i<cs.length;i++)grid[cs[i]]=0;
    var off=dir==='up'?-4:dir==='down'?4:dir==='left'?-1:1;
    for(var j=0;j<cs.length;j++)grid[cs[j]+off]=id;
    steps++;
    return true;
  }
  function draw(){
    var h='<div class="klot-level">第 '+(lv+1)+'/'+LAYOUTS.length+' 关 · 步数 '+steps+'</div>';
    h+='<div class="klot-grid">';
    for(var i=0;i<20;i++){
      var id=grid[i];
      var cls='klot-cell'+(id?(' k'+id):'')+(sel===id?' sel':'');
      h+='<button class="'+cls+'" data-p="'+i+'">'+(id?NAMES[id]:'')+'</button>';
    }
    h+='</div>';
    if(won){
      if(lv<LAYOUTS.length-1)h+='<button class="btn btn-primary" data-game-control="1" id="klotNext" style="margin-top:.5rem">🎉 通关！进入下一关</button>';
    } else {
      h+='<div class="klot-pad">';
      var dirs=[['up','⬆'],['left','⬅'],['right','➡'],['down','⬇']];
      for(var k=0;k<4;k++)h+='<button class="klot-btn" data-d="'+dirs[k][0]+'">'+dirs[k][1]+'</button>';
      h+='</div>';
    }
    ctx.container.innerHTML=h;ctx.hud('第 '+(lv+1)+' 关 · 目标：曹操到底部中间');
    ctx.container.querySelectorAll('.klot-cell').forEach(function(c){c.addEventListener('click',function(){
      var id=grid[+c.getAttribute('data-p')];if(id===0)return;sel=id;SFX.click();draw();
    });});
    ctx.container.querySelectorAll('.klot-btn').forEach(function(b){b.addEventListener('click',function(){
      if(!sel||won)return;if(move(sel,b.getAttribute('data-d'))){SFX.click();draw();tryWin();}
    });});
    var nb=ctx.container.querySelector('#klotNext');
    if(nb)nb.addEventListener('click',function(){SFX.click();lv++;fresh();});
  }
  function winReal(){var cs=cells(1);if(cs.length!==4)return false;var rows=[],cols=[],i;for(i=0;i<cs.length;i++){rows.push(Math.floor(cs[i]/4));cols.push(cs[i]%4);}return rows.indexOf(3)!==-1&&rows.indexOf(4)!==-1&&cols.indexOf(1)!==-1&&cols.indexOf(2)!==-1;}
  function tryWin(){
    if(winReal()){
      won=true;
      if(lv>=LAYOUTS.length-1){over=true;ctx.finish(steps, lv+1);return;}
      SFX.levelup();ctx.vibrate([20,40,20]);
      draw();
    }
  }
  function doMove(d){if(!sel||won)return;if(move(sel,d)){SFX.click();draw();tryWin();}}
  return { init:fresh, start:fresh, reset:fresh, onKey:doMove };
});

/* ===== 扫雷 ===== */
regGame('minesweeper', function (ctx) {
  var W=8,H=8,M=10, grid, opened, flagged, over, win;
  function fresh(){
    grid=[];opened=[];flagged=[];over=false;win=false;
    var i;for(i=0;i<W*H;i++){grid.push(0);opened.push(false);flagged.push(false);}
    var mines=0;while(mines<M){var p=Math.floor(Math.random()*W*H);if(grid[p]!==-1){grid[p]=-1;mines++;}}
    for(i=0;i<W*H;i++){if(grid[i]===-1)continue;var c=0;var r=Math.floor(i/W),cc=i%W;for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){var nr=r+dr,nc=cc+dc;if(nr>=0&&nr<H&&nc>=0&&nc<W&&grid[nr*W+nc]===-1)c++;}grid[i]=c;}
    draw();
  }
  function open(i){
    if(opened[i]||flagged[i]||over)return;
    opened[i]=true;
    if(grid[i]===0){var r=Math.floor(i/W),c=i%W;for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){var nr=r+dr,nc=c+dc;if(nr>=0&&nr<H&&nc>=0&&nc<W)open(nr*W+nc);}}
    if(grid[i]===-1){over=true;draw();ctx.finish(0);return;}
    if(winCheck()){over=true;win=true;draw();ctx.finish(1);}
  }
  function winCheck(){for(var i=0;i<W*H;i++)if(grid[i]!==-1&&!opened[i])return false;return true;}
  function draw(){
    var h='<div class="ms-grid">';
    for(var i=0;i<W*H;i++){
      var s='';if(opened[i])s=grid[i]===-1?'💣':(grid[i]||'');else s=flagged[i]?'🚩':'';
      h+='<button class="ms-cell'+(opened[i]?' o':'')+'" data-i="'+i+'">'+s+'</button>';
    }
    h+='</div><div class="ms-tip">点开格子，避开 💣（长按插旗）</div>';
    ctx.container.innerHTML=h;
    ctx.container.querySelectorAll('.ms-cell').forEach(function(c){
      var i=+c.getAttribute('data-i');
      c.addEventListener('click',function(){if(!opened[i]&&!flagged[i]){SFX.click();open(i);draw();}});
      c.addEventListener('contextmenu',function(e){e.preventDefault();if(!opened[i]){flagged[i]=!flagged[i];SFX.click();draw();}});
      var pressT;c.addEventListener('touchstart',function(){pressT=setTimeout(function(){if(!opened[i]){flagged[i]=!flagged[i];SFX.click();draw();}},400);});
      c.addEventListener('touchend',function(){clearTimeout(pressT);});
    });
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 算得快（60 秒限时口算） ===== */
regGame('fastcalc', function (ctx) {
  var score, timeLeft, timer, q, over;
  function gen(){var op=Math.floor(Math.random()*3),a,b;if(op===0){a=Math.floor(Math.random()*50)+1;b=Math.floor(Math.random()*50)+1;q={t:a+'+'+b,a:a+b};}else if(op===1){a=Math.floor(Math.random()*90)+10;b=Math.floor(Math.random()*a);q={t:a+'-'+b,a:a-b};}else{a=Math.floor(Math.random()*9)+2;b=Math.floor(Math.random()*9)+2;q={t:a+'×'+b,a:a*b};}}
  function fresh(){score=0;timeLeft=60;over=false;gen();draw();}
  function tick(){if(over||!gameStarted)return;timeLeft--;if(timeLeft<=0){over=true;clearInterval(timer);ctx.finish(score);return;}draw();}
  function draw(){
    var h='<div class="fc-area"><div class="fc-time">⏱ '+timeLeft+' 秒 · 得分 '+score+'</div>'+
      '<div class="fc-q">'+q.t+' = ?</div>'+
      '<input id="fcInput" inputmode="numeric" placeholder="输入答案">'+
      '<button class="btn btn-primary" id="fcGo" style="margin-top:.5rem">答</button></div>';
    ctx.container.innerHTML=h;ctx.hud('得分 '+score);
    ctx.container.querySelector('#fcGo').addEventListener('click',ans);
    ctx.container.querySelector('#fcInput').addEventListener('keyup',function(e){if(e.key==='Enter')ans();});
  }
  function ans(){
    if(over)return;var v=+ctx.container.querySelector('#fcInput').value;
    if(isNaN(v)){ctx.toast('请输入数字');return;}
    if(v===q.a){score+=10;SFX.correct();}else{SFX.wrong();}
    ctx.container.querySelector('#fcInput').value='';gen();draw();
  }
  return { init:fresh, start:function(){fresh();clearInterval(timer);timer=setInterval(tick,1000);}, reset:function(){clearInterval(timer);fresh();timer=setInterval(tick,1000);}, stop:function(){clearInterval(timer);} };
});
