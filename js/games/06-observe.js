'use strict';
/* ===================== 休闲游戏 · 观察创意 5 款 ===================== */

/* ===== 找不同 ===== */
regGame('finddiff', function (ctx) {
  var N=4, left, right, diff, found, over;
  var EMO=['🍎','🍌','🍇','🍉','🍓','🍒','🥝','🍑','🍊','🍋','🥕','🌽'];
  function fresh(){
    left=[];var i;for(i=0;i<N*N;i++)left.push(EMO[Math.floor(Math.random()*EMO.length)]);
    right=left.slice();
    diff=[];var picks=[];
    while(picks.length<3){var p=Math.floor(Math.random()*N*N);if(picks.indexOf(p)===-1)picks.push(p);}
    picks.forEach(function(p){var alt;do{alt=EMO[Math.floor(Math.random()*EMO.length)];}while(alt===left[p]);right[p]=alt;diff.push(p);});
    found=[];over=false;draw();
  }
  function draw(){
    var h='<div class="fd-grid"><div class="fd-col">';
    var i;
    for(i=0;i<N*N;i++)h+='<div class="fd-cell">'+left[i]+'</div>';
    h+='</div><div class="fd-col">';
    for(i=0;i<N*N;i++)h+='<button class="fd-cell'+(found.indexOf(i)!==-1?' found':'')+'" data-i="'+i+'">'+(found.indexOf(i)!==-1?'✅':right[i])+'</button>';
    h+='</div></div><div class="fd-tip">找出右图与左图不同的 '+diff.length+' 处</div>';
    ctx.container.innerHTML=h;ctx.hud('已找 '+found.length+'/'+diff.length);
    ctx.container.querySelectorAll('.fd-cell[data-i]').forEach(function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');
      if(diff.indexOf(i)!==-1&&found.indexOf(i)===-1){found.push(i);SFX.correct();draw();if(found.length===diff.length){over=true;ctx.finish(found.length);}}
    });});
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 拼图（3×3 交换式） ===== */
regGame('jigsaw', function (ctx) {
  var board, sel, steps, over;
  function fresh(){board=gShuffle([1,2,3,4,5,6,7,8,9]);sel=-1;steps=0;over=false;draw();}
  function draw(){
    var h='<div class="jig-grid">';
    for(var i=0;i<9;i++)h+='<button class="jig-cell'+(sel===i?' sel':'')+'" data-i="'+i+'">'+board[i]+'</button>';
    h+='</div>';
    ctx.container.innerHTML=h;ctx.hud('步数 '+steps+' · 排成 1-9');
    ctx.container.querySelectorAll('.jig-cell').forEach(function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');
      if(sel===-1){sel=i;SFX.click();draw();return;}
      if(sel===i){sel=-1;draw();return;}
      var t=board[sel];board[sel]=board[i];board[i]=t;steps++;SFX.click();sel=-1;draw();
      if(board.join(',')==='1,2,3,4,5,6,7,8,9'){over=true;ctx.finish(steps);}
    });});
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 数字涂色（心形像素画） ===== */
regGame('colorby', function (ctx) {
  var P=[0,0,0,0,0,0, 0,1,2,0,2,1, 0,1,2,2,2,1, 0,0,1,2,1,0, 0,0,0,1,0,0];
  var N=6, colored, over;
  var COLS={1:'#f87171',2:'#f87171'};
  function fresh(){colored=[];var i;for(i=0;i<N*N;i++)colored.push(false);over=false;draw();}
  function draw(){
    var h='<div class="cb-grid" style="grid-template-columns:repeat('+N+',1fr)">';
    for(var i=0;i<N*N;i++){
      var n=P[i];
      h+='<button class="cb-cell" data-i="'+i+'" style="background:'+(n&&colored[i]?COLS[n]:'#f1f5f9')+'">'+(n?n:'')+'</button>';
    }
    h+='</div><div class="cb-tip">按数字点击格子，涂出图案</div>';
    ctx.container.innerHTML=h;ctx.hud('已涂 '+colored.filter(function(v){return v;}).length+'/'+N*N);
    ctx.container.querySelectorAll('.cb-cell').forEach(function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');if(P[i]===0)return;
      colored[i]=true;SFX.click();draw();
      if(P.every(function(n,k){return n===0||colored[k];})){over=true;ctx.finish(1);}
    });});
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 节奏大师 ===== */
regGame('rhythm', function (ctx) {
  var W=320,H=440, LANES=4, notes, acc, score, over, frames;
  function fresh(){notes=[];acc=0;score=0;over=false;frames=0;}
  function tick(){
    if(over)return;
    frames++;
    if(frames%50===0&&frames<50*16)notes.push({lane:Math.floor(Math.random()*LANES),y:-20});
    for(var i=notes.length-1;i>=0;i--){notes[i].y+=4;if(notes[i].y>H+30)notes.splice(i,1);}
    if(frames>=50*30){over=true;ctx.finish(score);}
  }
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.clearRect(0,0,W,H);c.fillStyle='#f1f5f9';c.fillRect(0,0,W,H);
    var lw=W/LANES,i;
    for(i=1;i<LANES;i++){c.strokeStyle='#cbd5e1';c.beginPath();c.moveTo(i*lw,0);c.lineTo(i*lw,H);c.stroke();}
    c.fillStyle='#60a5fa';c.fillRect(0,H-60,W,8);
    var cols=['#f87171','#fbbf24','#60a5fa','#34d399'];
    for(i=0;i<notes.length;i++){var n=notes[i];c.fillStyle=cols[n.lane];c.fillRect(n.lane*lw+lw/2-14,n.y,28,16);}
    ctx.hud('得分 '+score);
  }
  function tap(x){
    if(over)return;
    var lane=Math.floor(x/(W/LANES));
    var best=-1,min=1e9;
    for(var i=0;i<notes.length;i++){if(notes[i].lane!==lane)continue;var d=Math.abs(notes[i].y-(H-60));if(d<min){min=d;best=i;}}
    if(best!==-1&&min<60){notes.splice(best,1);score+=10;SFX.correct();}
  }
  return {
    init:function(){ctx.canvas.width=W;ctx.canvas.height=H;fresh();draw();},
    start:fresh, reset:fresh, tick:tick, draw:draw, onTap:tap
  };
});

/* ===== 反应测试 ===== */
regGame('reaction', function (ctx) {
  var state, startT, greenT, results, count, over;
  function fresh(){state='idle';results=[];count=0;over=false;draw();}
  function draw(){
    var bg=state==='green'?'#34d399':state==='waiting'?'#f87171':'#94a3b8';
    var txt=state==='idle'?'点击开始':state==='waiting'?'等待变绿…':state==='green'?'快点击！':'';
    var h='<div class="rt-area" id="rtArea" style="background:'+bg+'"><div class="rt-txt">'+txt+'</div>'+
      '<div class="rt-sub">第 '+(count+1)+'/5 次 · 已测 '+results.join(', ')+' ms</div></div>';
    ctx.container.innerHTML=h;
    var area=ctx.container.querySelector('#rtArea');
    area.addEventListener('click',function(){
      if(over)return;
      if(state==='idle'){state='waiting';draw();setTimeout(function(){if(!ctx.alive())return;if(state==='waiting'){state='green';greenT=Date.now();draw();}},Math.random()*3000+1000);}
      else if(state==='green'){var rt=Date.now()-greenT;results.push(rt);count++;SFX.correct();if(count>=5){over=true;var avg=Math.round(results.reduce(function(a,b){return a+b;},0)/5);ctx.finish(avg);}else{state='idle';draw();}}
    });
  }
  return { init:fresh, start:fresh, reset:fresh };
});
