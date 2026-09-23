'use strict';
/* ===================== 休闲游戏 · 路径解谜 4 款 ===================== */

/* ===== 迷宫（DFS 生成，方向键走出） ===== */
regGame('maze', function (ctx) {
  var W=13,H=9,CW=22,CH=22, walls, visited, px, py, over, steps;
  function fresh(){
    walls=[];visited=[];var i,j;
    for(i=0;i<H;i++){walls.push([]);visited.push([]);for(j=0;j<W;j++){walls[i].push([true,true,true,true]);visited[i].push(false);}}
    gen(0,0);
    px=0;py=0;over=false;steps=0;
  }
  function gen(r,c){
    visited[r][c]=true;
    var dirs=[[0,-1,'left'],[0,1,'right'],[-1,0,'up'],[1,0,'down']];
    dirs=gShuffle(dirs);
    for(var i=0;i<4;i++){
      var nr=r+dirs[i][0],nc=c+dirs[i][1];
      if(nr<0||nr>=H||nc<0||nc>=W||visited[nr][nc])continue;
      if(dirs[i][2]==='left'){walls[r][c][3]=false;walls[nr][nc][1]=false;}
      else if(dirs[i][2]==='right'){walls[r][c][1]=false;walls[nr][nc][3]=false;}
      else if(dirs[i][2]==='up'){walls[r][c][0]=false;walls[nr][nc][2]=false;}
      else{walls[r][c][2]=false;walls[nr][nc][0]=false;}
      gen(nr,nc);
    }
  }
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
    c.fillStyle='#f1f5f9';c.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    var i,j;
    for(i=0;i<H;i++)for(j=0;j<W;j++){
      var x=j*CW,y=i*CH;
      c.strokeStyle='#334155';c.lineWidth=2;c.beginPath();
      if(walls[i][j][0]){c.moveTo(x,y);c.lineTo(x+CW,y);}
      if(walls[i][j][1]){c.moveTo(x+CW,y);c.lineTo(x+CW,y+CH);}
      if(walls[i][j][2]){c.moveTo(x,y+CH);c.lineTo(x+CW,y+CH);}
      if(walls[i][j][3]){c.moveTo(x,y);c.lineTo(x,y+CH);}
      c.stroke();
    }
    c.fillStyle='#60a5fa';c.fillRect(px*CW+4,py*CH+4,CW-8,CH-8);
    c.fillStyle='#34d399';c.fillRect((W-1)*CW+4,(H-1)*CH+4,CW-8,CH-8);
    ctx.hud('步数 '+steps+' · 从蓝到绿');
  }
  function move(d){if(over)return;var nx=px,ny=py;
    if(d==='left'&&!walls[py][px][3])nx--;
    else if(d==='right'&&!walls[py][px][1])nx++;
    else if(d==='up'&&!walls[py][px][0])ny--;
    else if(d==='down'&&!walls[py][px][2])ny++;
    if(nx!==px||ny!==py){px=nx;py=ny;steps++;SFX.click();draw();
      if(px===W-1&&py===H-1){over=true;ctx.finish(steps);}}
  }
  return {
    init:function(){ctx.canvas.width=W*CW;ctx.canvas.height=H*CH;fresh();draw();},
    start:fresh, reset:fresh, draw:draw,
    onKey:move,
    onSwipe:move
  };
});

/* ===== 推箱子（5 关递增，通关进下一关） ===== */
regGame('sokoban', function (ctx) {
  var LEVELS=[
    ['######','#    #','# @$.#','#    #','######'],
    ['########','#      #','# .@$  #','#  $.  #','#      #','########'],
    ['#########','#       #','# . $   #','# $ # $ #','#   @ . #','#   .   #','#########'],
    ['##########','#        #','#  $  $  #','# .    . #','#  $  $  #','#  .  .  #','#   @    #','##########'],
    ['###########','#         #','#  ##  ## #','#  #  # # #','#  .$ $   #','#    $  . #','# @   .   #','###########']
  ];
  var lv=0, grid, goals, player, steps, over, boxes, won;
  function fresh(){
    var LEVEL=LEVELS[lv];
    grid=[];goals=[];boxes=[];steps=0;over=false;won=false;
    var r,c;
    for(r=0;r<LEVEL.length;r++){
      grid.push([]);
      for(c=0;c<LEVEL[r].length;c++){
        var ch=LEVEL[r][c];
        grid[r].push(ch==='#'?1:0);
        if(ch==='.'||ch==='*'||ch==='+')goals.push([r,c]);
        if(ch==='$'||ch==='*')boxes.push([r,c]);
        if(ch==='@'||ch==='+')player=[r,c];
      }
    }
    draw();
  }
  function isWall(r,c){return r<0||r>=grid.length||c<0||c>=grid[r].length||grid[r][c]===1;}
  function isBox(r,c){return boxes.some(function(b){return b[0]===r&&b[1]===c;});}
  function boxAt(r,c){for(var i=0;i<boxes.length;i++)if(boxes[i][0]===r&&boxes[i][1]===c)return i;return -1;}
  function btnHtml(){
    var cells=[['','up',''],['left','','right'],['','down','']];
    var ICON={up:'⬆',down:'⬇',left:'⬅',right:'➡'};
    var h='<div class="sk-pad">';
    cells.forEach(function(row){ row.forEach(function(d){
      if(d)h+='<button class="sk-btn" data-move="'+d+'">'+ICON[d]+'</button>';
      else h+='<span class="sk-gap"></span>';
    });});
    h+='</div>';
    return h;
  }
  function draw(){
    var maxC=0,i;for(i=0;i<grid.length;i++)maxC=Math.max(maxC,grid[i].length);
    var h='<div class="sk-level">第 '+(lv+1)+'/'+LEVELS.length+' 关 · 步数 '+steps+'</div>';
    h+='<div class="sk-grid" style="grid-template-columns:repeat('+maxC+',1fr)">';
    for(var r=0;r<grid.length;r++)for(var c=0;c<maxC;c++){
      var cls='sk-cell',s='';
      if(c>=grid[r].length||grid[r][c]===1){cls+=' wall';s='';}
      else if(isBox(r,c)){cls+=' box';s='📦';}
      else if(player[0]===r&&player[1]===c){cls+=' player';s='🧍';}
      if(goals.some(function(g){return g[0]===r&&g[1]===c;}))cls+=' goal';
      h+='<div class="'+cls+'">'+s+'</div>';
    }
    h+='</div>';
    if(won){
      if(lv<LEVELS.length-1)h+='<button class="btn btn-primary sk-next" data-game-control="1" id="skNext" style="margin-top:.5rem">🎉 通关！进入下一关</button>';
    } else {
      h+=btnHtml()+'<div class="sk-tip">滑动或点方向键，把 📦 推到 🎯</div>';
    }
    ctx.container.innerHTML=h;
    ctx.hud('第 '+(lv+1)+' 关 · 步数 '+steps);
    ctx.container.querySelectorAll('.sk-btn').forEach(function(b){b.addEventListener('click',function(){move(b.getAttribute('data-move'));});});
    var nb=ctx.container.querySelector('#skNext');
    if(nb)nb.addEventListener('click',function(){SFX.click();lv++;fresh();});
  }
  function move(d){
    if(over||won)return;
    var dr=d==='up'?-1:d==='down'?1:0,dc=d==='left'?-1:d==='right'?1:0;
    var nr=player[0]+dr,nc=player[1]+dc;
    if(isWall(nr,nc))return;
    if(isBox(nr,nc)){
      var bi=boxAt(nr,nc),br=nr+dr,bc=nc+dc;
      if(isWall(br,bc)||isBox(br,bc))return;
      boxes[bi]=[br,bc];
    }
    player=[nr,nc];steps++;SFX.click();draw();
    if(boxes.length===goals.length && goals.every(function(g){return isBox(g[0],g[1]);})){
      won=true;
      if(lv>=LEVELS.length-1){over=true;ctx.finish(steps, lv+1);return;}
      SFX.levelup();ctx.vibrate([20,40,20]);
      draw();
    }
  }
  return {
    init:fresh, start:fresh, reset:fresh,
    onKey:move,
    onSwipe:move
  };
});

/* ===== 一笔画（4 个图形，通关进下一关） ===== */
regGame('onestroke', function (ctx) {
  var GRAPHS=[
    { start:0, nodes:[{x:80,y:130},{x:220,y:130},{x:150,y:40},{x:80,y:250},{x:220,y:250}], edges:[[0,1],[1,2],[2,0],[0,3],[3,4],[4,1]] },
    { start:0, nodes:[{x:150,y:30},{x:45,y:255},{x:255,y:180},{x:45,y:180},{x:255,y:255}], edges:[[0,2],[2,1],[1,3],[3,4],[4,0]] },
    { start:1, nodes:[{x:150,y:40},{x:70,y:130},{x:230,y:130},{x:70,y:250},{x:230,y:250}], edges:[[0,1],[1,2],[0,2],[2,4],[4,3],[3,1]] },
    { start:0, nodes:[{x:150,y:50},{x:230,y:150},{x:150,y:250},{x:70,y:150}], edges:[[0,1],[1,2],[2,3],[3,0],[0,2]] }
  ];
  var g=0, nodes, edges, cur, used, over;
  function fresh(){nodes=GRAPHS[g].nodes;edges=GRAPHS[g].edges;cur=GRAPHS[g].start;used=[];var i;for(i=0;i<edges.length;i++)used.push(false);over=false;draw();}
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.clearRect(0,0,300,300);c.fillStyle='#f1f5f9';c.fillRect(0,0,300,300);
    var i;
    for(i=0;i<edges.length;i++){
      var e=edges[i],a=nodes[e[0]],b=nodes[e[1]];
      c.strokeStyle=used[i]?'#facc15':'#94a3b8';c.lineWidth=used[i]?5:3;
      c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
    }
    for(i=0;i<nodes.length;i++){
      c.fillStyle=i===cur?'#60a5fa':'#334155';
      c.beginPath();c.arc(nodes[i].x,nodes[i].y,10,0,7);c.fill();
    }
    ctx.hud('第 '+(g+1)+'/'+GRAPHS.length+' 关 · 已画 '+used.filter(function(v){return v;}).length+'/'+edges.length+' 条');
  }
  function tap(x,y){
    if(over)return;
    var i,target=-1;
    for(i=0;i<nodes.length;i++){if(Math.abs(nodes[i].x-x)<20&&Math.abs(nodes[i].y-y)<20){target=i;break;}}
    if(target===-1)return;
    var e=-1,k;
    for(k=0;k<edges.length;k++){
      if(used[k])continue;
      if((edges[k][0]===cur&&edges[k][1]===target)||(edges[k][1]===cur&&edges[k][0]===target)){e=k;break;}
    }
    if(e===-1)return;
    used[e]=true;cur=target;SFX.click();draw();
    if(used.every(function(v){return v;})){
      if(g<GRAPHS.length-1){SFX.levelup();ctx.vibrate([20,40,20]);g++;fresh();}
      else{over=true;ctx.finish(GRAPHS.length);}
    }
  }
  return { init:function(){ctx.canvas.width=300;ctx.canvas.height=300;fresh();draw();}, start:fresh, reset:fresh, draw:draw, onTap:tap };
});

/* ===== 水管连通（尺寸递增多关） ===== */
regGame('pipes', function (ctx) {
  var SIZES=[3,4,5,6];
  var lv=0, N, grid, over, steps;
  // 0=直(上下) 1=直(左右) 2=弯(上右) 3=弯(右下)
  function openings(t){
    if(t===0)return [1,0,1,0];
    if(t===1)return [0,1,0,1];
    if(t===2)return [1,1,0,0];
    if(t===3)return [0,1,1,0];
    return [0,0,0,0];
  }
  function fresh(){
    N=SIZES[lv];
    grid=[];var i,j;
    for(i=0;i<N;i++){grid.push([]);for(j=0;j<N;j++)grid[i].push(Math.floor(Math.random()*4));}
    grid[0][0]=1;grid[N-1][N-1]=1; // 起点终点左右管
    steps=0;over=false;draw();
  }
  function reach(){
    var seen=[],i,j;for(i=0;i<N;i++){seen.push([]);for(j=0;j<N;j++)seen[i].push(false);}
    var q=[[0,0]];seen[0][0]=true;
    while(q.length){
      var p=q.shift(),r=p[0],c=p[1],o=openings(grid[r][c]);
      var nbs=[[r-1,c,0,2],[r,c+1,1,3],[r+1,c,2,0],[r,c-1,3,1]];
      for(var k=0;k<4;k++){
        var nr=nbs[k][0],nc=nbs[k][1],out=nbs[k][2],din=nbs[k][3];
        if(nr<0||nr>=N||nc<0||nc>=N||seen[nr][nc])continue;
        if(!o[out])continue;
        var oo=openings(grid[nr][nc]);
        if(!oo[din])continue;
        seen[nr][nc]=true;q.push([nr,nc]);
      }
    }
    return seen[N-1][N-1];
  }
  function draw(){
    var h='<div class="pipe-level">第 '+(lv+1)+'/'+SIZES.length+' 关（'+N+'×'+N+'）· 步数 '+steps+'</div>';
    h+='<div class="pipe-grid" style="grid-template-columns:repeat('+N+',3.2rem)">';
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){
      h+='<button class="pipe-cell" data-r="'+r+'" data-c="'+c+'">'+['║','═','┏','┗','┓','┛'][grid[r][c]]+'</button>';
    }
    h+='</div><div class="pipe-tip">点击水管旋转，连通左上到右下</div>';
    ctx.container.innerHTML=h;ctx.hud('第 '+(lv+1)+' 关 · 步数 '+steps);
    ctx.container.querySelectorAll('.pipe-cell').forEach(function(b){b.addEventListener('click',function(){
      if(over)return;var r=+b.getAttribute('data-r'),c=+b.getAttribute('data-c');
      grid[r][c]=(grid[r][c]+1)%4;steps++;SFX.click();draw();
      if(reach()){
        if(lv<SIZES.length-1){SFX.levelup();ctx.vibrate([20,40,20]);lv++;fresh();}
        else{over=true;ctx.finish(steps, lv+1);}
      }
    });});
  }
  return { init:fresh, start:fresh, reset:fresh };
});
