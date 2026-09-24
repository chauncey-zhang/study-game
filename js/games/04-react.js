'use strict';
/* ===================== 休闲游戏 · 反应操作 6 款 ===================== */

/* ===== 打地鼠 ===== */
regGame('whackamole', function (ctx) {
  var score, timeLeft, t1, t2, mole, over;
  function fresh(){score=0;timeLeft=30;over=false;mole=-1;draw();}
  function tickTime(){if(over||!gameStarted)return;timeLeft--;if(timeLeft<=0){over=true;ctx.finish(score);return;}draw();}
  function tickMole(){if(over||!gameStarted)return;mole=Math.random()<0.5?Math.floor(Math.random()*9):-1;draw();}
  function draw(){
    var h='<div class="wm-time">⏱ '+timeLeft+' 秒 · 得分 '+score+'</div><div class="wm-grid">';
    for(var i=0;i<9;i++)h+='<button class="wm-hole" data-i="'+i+'">'+(mole===i?'🐹':'🕳️')+'</button>';
    h+='</div>';
    ctx.container.innerHTML=h;
    ctx.container.querySelectorAll('.wm-hole').forEach(function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');if(i===mole){score+=10;SFX.correct();mole=-1;draw();}
    });});
  }
  return {
    init:fresh,
    start:function(){fresh();clearInterval(t1);clearInterval(t2);t1=setInterval(tickTime,1000);t2=setInterval(tickMole,650);},
    reset:function(){clearInterval(t1);clearInterval(t2);fresh();t1=setInterval(tickTime,1000);t2=setInterval(tickMole,650);},
    stop:function(){clearInterval(t1);clearInterval(t2);}
  };
});

/* ===== 接水果 ===== */
regGame('catchfruit', function (ctx) {
  var W=300,H=420, basket, fruits, score, lives, over;
  function fresh(){basket={x:W/2-25,w:54};fruits=[];score=0;lives=3;over=false;}
  function tick(){
    if(over)return;
    if(Math.random()<0.04)fruits.push({x:Math.random()*(W-24)+12,y:-20,t:Math.floor(Math.random()*5)});
    var i;
    for(i=fruits.length-1;i>=0;i--){fruits[i].y+=4.5;if(fruits[i].y>H){fruits.splice(i,1);lives--;if(lives<=0){over=true;ctx.finish(score);return;}}}
    for(i=fruits.length-1;i>=0;i--){var f=fruits[i];if(f.y+18>H-34&&f.y<H&&f.x>basket.x-6&&f.x<basket.x+basket.w+6){score+=10;SFX.coin();ctx.float('+10',f.x,H-50);ctx.burst(f.x,H-30,'#34d399',6);ctx.vibrate(12);fruits.splice(i,1);}}
  }
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.clearRect(0,0,W,H);c.fillStyle='#f1f5f9';c.fillRect(0,0,W,H);
    var EMO=['🍎','🍌','🍇','🍉','🍓'];
    for(var i=0;i<fruits.length;i++){c.font='20px sans-serif';c.fillText(EMO[fruits[i].t],fruits[i].x-10,fruits[i].y);}
    c.fillStyle='#fbbf24';c.fillRect(basket.x,H-30,basket.w,16);
    ctx.hud('得分 '+score+' · 生命 '+lives);
  }
  return {
    init:function(){ctx.canvas.width=W;ctx.canvas.height=H;fresh();draw();},
    start:fresh, reset:fresh, tick:tick, draw:draw,
    onKey:function(d){if(over)return;if(d==='left')basket.x=Math.max(0,basket.x-20);else if(d==='right')basket.x=Math.min(W-basket.w,basket.x+20);},
    onTap:function(x){if(over)return;basket.x=Math.max(0,Math.min(W-basket.w,x-basket.w/2));},
    onMove:function(x){if(over)return;basket.x=Math.max(0,Math.min(W-basket.w,x-basket.w/2));}
  };
});

/* ===== 贪吃蛇 ===== */
regGame('snake', function (ctx) {
  var N=20,CS=16,W=N*CS, snake, dir, food, score, over, acc;
  function fresh(){snake=[{x:6,y:10},{x:5,y:10},{x:4,y:10},{x:3,y:10}];dir='right';score=0;over=false;acc=0;placeFood();}
  function placeFood(){var p;do{p={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};}while(snake.some(function(s){return s.x===p.x&&s.y===p.y;}));food=p;}
  function step(){
    var h=snake[0],nx=h.x,ny=h.y;
    if(dir==='right')nx++;else if(dir==='left')nx--;else if(dir==='up')ny--;else ny++;
    if(nx<0||nx>=N||ny<0||ny>=N||snake.some(function(s){return s.x===nx&&s.y===ny;})){over=true;ctx.finish(score);return;}
    snake.unshift({x:nx,y:ny});
    if(nx===food.x&&ny===food.y){score+=10;SFX.coin();ctx.float('+10',food.x*CS,food.y*CS);ctx.burst(food.x*CS+CS/2,food.y*CS+CS/2,'#f87171',8);ctx.vibrate(15);placeFood();}else snake.pop();
  }
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.fillStyle='#f1f5f9';c.fillRect(0,0,W,W);
    c.fillStyle='#f87171';c.fillRect(food.x*CS,food.y*CS,CS-1,CS-1);
    c.fillStyle='#60a5fa';
    for(var i=0;i<snake.length;i++)c.fillRect(snake[i].x*CS,snake[i].y*CS,CS-1,CS-1);
    ctx.hud('得分 '+score+' · 滑动改变方向');
  }
  function setDir(d){if(over)return;var opp={right:'left',left:'right',up:'down',down:'up'};if(d!==opp[dir])dir=d;}
  return {
    init:function(){ctx.canvas.width=W;ctx.canvas.height=W;fresh();draw();},
    start:fresh, reset:fresh,
    tick:function(){if(over)return;acc+=16;if(acc>=110){acc=0;step();}draw();},
    draw:draw,
    onKey:setDir,
    onSwipe:setDir
  };
});

/* ===== 飞机大战（像素风：小方块拼成小飞机 + DPR 高清 + 连击积分） ===== */
regGame('plane', function (ctx) {
  var W=300,H=440, plane, bullets, enemies, booms, score, over, acc, stars;
  var combo, level;
  var dpr=1, dispW=300, dispH=440, scale=1;

  /* 像素方块边长 2px（更精细） */
  var PX=2;
  /* 我方小飞机（11列×12行，机头朝上）：B=机身 L=机翼 C=驾驶舱 */
  var P_MINE=[
    '.....B.....',
    '....BLB....',
    '....BCB....',
    '....BLB....',
    '...BBBBB...',
    '..BBLLLBB..',
    '.BBLLLLLBB.',
    'BBLLLLLLLBB',
    'BB.LLLLL.BB',
    '...BLLLB...',
    '...B...B...',
    '..BB...BB..'
  ];
  var C_MINE={B:'#1e40af',L:'#60a5fa',C:'#dbeafe'};
  /* 敌机（11列×12行，机头朝下）：R=机身 D=机翼 C=驾驶舱 */
  var P_ENEMY=[
    '..R.....R..',
    '..RR...RR..',
    '..RRR.RRR..',
    '.RRDDDDDRR.',
    'RRDDDDDDDRR',
    'RRDDDDDDDRR',
    '.RRDDDDDRR.',
    '...RRRRR...',
    '....RRR....',
    '....RCR....',
    '....RRR....',
    '.....R.....'
  ];
  var C_ENEMY={R:'#b91c1c',D:'#f87171',C:'#fee2e2'};

  var PL_W=11*PX, PL_H=12*PX; /* 22 × 24 */

  /* 缓冲 = 显示尺寸 × dpr，绘制坐标仍是 300×440 逻辑坐标（高清不模糊） */
  function layout(){
    var area=ctx.container;
    var aw=(area&&area.clientWidth)||W;
    var ah=(area&&area.clientHeight)||H;
    var s=Math.min((aw-8)/W,(ah-8)/H);
    if(!isFinite(s)||s<=0)s=1;
    dispW=Math.max(180,Math.floor(W*s));
    dispH=Math.round(dispW*H/W);
    scale=dispW/W;
    dpr=window.devicePixelRatio||1;
    var cv=ctx.canvas;
    if(!cv)return;
    cv.width=Math.round(dispW*dpr);
    cv.height=Math.round(dispH*dpr);
    cv.style.width=dispW+'px';
    cv.style.height=dispH+'px';
  }

  function makeStars(){
    stars=[];
    var i;
    for(i=0;i<46;i++)stars.push([Math.floor(Math.random()*W),Math.floor(Math.random()*H)]);
  }

  function fresh(){
    plane={x:W/2-PL_W/2,w:PL_W};
    bullets=[];enemies=[];booms=[];score=0;over=false;acc=0;
    combo=0;level=1;
    makeStars();layout();
  }

  function tick(){
    if(over)return;
    acc++;
    /* 星空缓慢下移，营造飞行感 */
    var s,i,j,b,e;
    for(s=0;s<stars.length;s++){stars[s][1]+=0.7;if(stars[s][1]>H){stars[s][1]=0;stars[s][0]=Math.floor(Math.random()*W);}}
    /* 难度随等级递增：出机更密、下落更快 */
    var spawnGap=Math.max(16,42-level*3);
    var fallSpd=Math.min(6,2.2+level*0.28);
    if(acc%10===0)bullets.push({x:plane.x+plane.w/2,y:H-54});
    if(acc%spawnGap===0)enemies.push({x:Math.random()*(W-PL_W),y:-PL_H,w:PL_W,h:PL_H});
    for(i=bullets.length-1;i>=0;i--){bullets[i].y-=8;if(bullets[i].y<-10)bullets.splice(i,1);}
    for(i=enemies.length-1;i>=0;i--){
      enemies[i].y+=fallSpd;
      if(enemies[i].y>H){enemies.splice(i,1);combo=0;continue;} /* 漏机：断连击 */
    }
    /* 子弹命中：爆炸特效 + 击中音效 + 连击计分 */
    for(i=bullets.length-1;i>=0;i--){
      for(j=enemies.length-1;j>=0;j--){
        b=bullets[i];e=enemies[j];
        if(b&&e&&b.x>e.x&&b.x<e.x+e.w&&b.y>e.y&&b.y<e.y+e.h){
          booms.push({x:e.x+e.w/2,y:e.y+e.h/2,t:0});
          bullets.splice(i,1);enemies.splice(j,1);
          combo++;
          score+=10+Math.min(combo,10)*5; /* 连击奖励，最高额外 +50 */
          SFX.boom();
          if(combo>1)SFX.combo(Math.min(combo,10));
          var lv=Math.floor(score/100)+1;
          if(lv>level){level=lv;SFX.levelup();ctx.float('Lv.'+level+' 速度提升！');}
          break;
        }
      }
    }
    /* 爆炸特效推进 */
    for(i=booms.length-1;i>=0;i--){booms[i].t++;if(booms[i].t>12)booms.splice(i,1);}
    for(i=enemies.length-1;i>=0;i--){
      e=enemies[i];
      if(e.y+e.h>H-54&&e.x>plane.x-6&&e.x<plane.x+plane.w+6){
        over=true;booms.push({x:e.x+e.w/2,y:e.y+e.h/2,t:0});SFX.crash();ctx.finish(score);return;
      }
    }
  }

  /* 把像素图案逐格画成小方块（像俄罗斯方块一样拼图形） */
  function drawPixels(c,pat,colors,ox,oy){
    var r,col,ch;
    for(r=0;r<pat.length;r++){
      for(col=0;col<pat[r].length;col++){
        ch=pat[r].charAt(col);
        if(ch===' ')continue;
        if(!colors[ch])continue;
        c.fillStyle=colors[ch];
        c.fillRect(ox+col*PX,oy+r*PX,PX,PX);
      }
    }
  }

  function drawFlame(c,x,y){
    var f=(acc%6<3)?PX*2:PX*4;
    c.fillStyle='#fb923c';c.fillRect(x+5*PX,y+PL_H,PX,f);      /* 中心列 = 第5列 */
    c.fillStyle='#fde047';c.fillRect(x+5*PX,y+PL_H,PX,PX*2);
  }

  /* 击中爆炸：四散的小方块碎片 */
  function drawBooms(c){
    var i,b,r;
    for(i=0;i<booms.length;i++){
      b=booms[i];r=b.t*1.8;
      c.fillStyle=b.t<6?'#fde047':'#f97316';
      c.fillRect(b.x-r,b.y-r,PX,PX);
      c.fillRect(b.x+r,b.y-r,PX,PX);
      c.fillRect(b.x-r,b.y+r,PX,PX);
      c.fillRect(b.x+r,b.y+r,PX,PX);
      if(b.t<5){c.fillStyle='#fff7ed';c.fillRect(b.x,b.y,PX,PX);}
    }
  }

  function draw(){
    var cv=ctx.canvas;
    if(!cv)return;
    var c=cv.getContext('2d');
    c.setTransform(scale*dpr,0,0,scale*dpr,0,0);
    /* 夜空背景 */
    var g=c.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0b1220');
    g.addColorStop(1,'#1e293b');
    c.fillStyle=g;c.fillRect(0,0,W,H);
    /* 星星 */
    c.fillStyle='rgba(255,255,255,0.7)';
    var s;
    for(s=0;s<stars.length;s++)c.fillRect(stars[s][0],stars[s][1],PX,PX);
    /* 子弹（小方块 + 白心） */
    var i;
    for(i=0;i<bullets.length;i++){
      c.fillStyle='#fde047';c.fillRect(bullets[i].x-PX/2,bullets[i].y,PX,PX*4);
      c.fillStyle='#fffbeb';c.fillRect(bullets[i].x-PX/2,bullets[i].y,PX,PX);
    }
    /* 敌机 */
    for(i=0;i<enemies.length;i++)drawPixels(c,P_ENEMY,C_ENEMY,enemies[i].x,enemies[i].y);
    /* 我方小飞机 + 尾焰 */
    drawPixels(c,P_MINE,C_MINE,plane.x,H-54);
    drawFlame(c,plane.x,H-54);
    /* 击中爆炸 */
    drawBooms(c);
    ctx.hud('得分 '+score+' · 连击 x'+combo+' · Lv.'+level);
  }

  /* 物理像素 → 逻辑坐标 */
  function setX(px){
    var lx=px/(scale*dpr);
    if(!isFinite(lx))return;
    plane.x=Math.max(0,Math.min(W-plane.w,lx-plane.w/2));
  }

  return {
    init:function(){fresh();draw();},
    start:fresh, reset:fresh, tick:tick, draw:draw,
    onKey:function(d){if(over)return;if(d==='left')plane.x=Math.max(0,plane.x-16);else if(d==='right')plane.x=Math.min(W-plane.w,plane.x+16);},
    onTap:function(x){if(over)return;setX(x);},
    onMove:function(x){if(over)return;setX(x);}
  };
});

/* ===== 记忆序列（Simon） ===== */
regGame('simon', function (ctx) {
  var seq, level, playing, idx, over;
  var COLS=['#f87171','#60a5fa','#34d399','#fbbf24'];
  function fresh(){seq=[];level=0;over=false;draw();nextRound();}
  function nextRound(){
    seq.push(Math.floor(Math.random()*4));level++;
    playing=true;idx=0;
    ctx.hud('第 '+level+' 轮');
    playSeq(0);
  }
  function playSeq(k){
    if(k>=seq.length){playing=false;idx=0;return;}
    flash(seq[k],function(){playSeq(k+1);});
  }
  function flash(i,cb){var b=ctx.container.querySelectorAll('.simon-btn')[i];if(!b){cb();return;}b.classList.add('on');SFX.click();setTimeout(function(){if(!ctx.alive())return;b.classList.remove('on');setTimeout(cb,180);},320);}
  function draw(){
    var h='<div class="simon-grid">';
    for(var i=0;i<4;i++)h+='<button class="simon-btn" data-i="'+i+'" style="background:'+COLS[i]+'"></button>';
    h+='</div><div class="simon-tip">记住亮灯顺序，依次重复</div>';
    ctx.container.innerHTML=h;
    ctx.container.querySelectorAll('.simon-btn').forEach(function(b){b.addEventListener('click',function(){
      if(playing||over)return;var i=+b.getAttribute('data-i');
      b.classList.add('on');SFX.click();setTimeout(function(){if(!ctx.alive())return;b.classList.remove('on');},200);
      if(i!==seq[idx]){over=true;ctx.finish(level);return;}
      idx++;
      if(idx>=seq.length)nextRound();
    });});
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 跳一跳（蓄力跳跃，无尽平台，抛物线动画） ===== */
regGame('jump', function (ctx) {
  var W=300,H=440, px, py, plat, power, charging, over, score;
  var jumping, jumpT, jumpStartX, jumpTargetX, jumpLanded, scrollRemain;
  function fresh(){
    px=40;py=H-80;power=0;charging=false;over=false;score=0;
    jumping=false;jumpT=0;jumpStartX=0;jumpTargetX=0;jumpLanded=false;scrollRemain=0;
    plat=[{x:15,w:60},{x:130,w:60},{x:245,w:60}];
  }
  function jump(){
    if(jumping||over||scrollRemain>0)return;
    charging=false;
    var dist=power*2.4;
    var targetX=px+dist;
    var i,landed=false;
    for(i=0;i<plat.length;i++){
      var p=plat[i];
      if(targetX>p.x && targetX<p.x+p.w){ landed=true; break; }
    }
    // 启动跳跃动画（不立即落地）
    jumping=true;jumpT=0;jumpStartX=px;jumpTargetX=targetX;jumpLanded=landed;
    power=0;
  }
  function land(){
    jumping=false;
    if(jumpLanded){
      px=jumpTargetX;
      score+=10;
      SFX.correct();
      scrollRemain=px-70;  // 记录需要平滑滚动的距离
    } else {
      over=true;ctx.finish(score);
    }
  }
  function finishScroll(){
    px=70;
    while(plat.length && plat[0].x+plat[0].w<-20)plat.shift();
    var last=plat[plat.length-1];
    while(plat.length<5){
      last={x:last.x+last.w+45+Math.random()*55, w:60};
      plat.push(last);
    }
  }
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.clearRect(0,0,W,H);c.fillStyle='#f1f5f9';c.fillRect(0,0,W,H);
    c.fillStyle='#94a3b8';for(var i=0;i<plat.length;i++){var p=plat[i];c.fillRect(p.x,py+20,p.w,10);}
    var jx=px,jy=py;
    if(jumping){
      var t=jumpT;
      jx=jumpStartX+(jumpTargetX-jumpStartX)*t;      // 水平线性
      jy=py-60*Math.sin(Math.PI*t);                   // 抛物线高度
      // 影子（玩家投影，随高度缩小）
      c.fillStyle='rgba(51,65,85,.15)';
      c.beginPath();
      c.ellipse(jx,py+22,12*(1-t*0.4),4*(1-t*0.4),0,0,7);
      c.fill();
    }
    c.fillStyle='#334155';c.fillRect(jx-9,jy-18,18,18);
    if(charging){c.fillStyle='#fbbf24';c.fillRect(20,H-30,power*3,10);}
    else if(!over && !jumping){c.fillStyle='rgba(51,65,85,.9)';c.font='14px sans-serif';c.textAlign='center';c.fillText('按住蓄力 · 松开跳到下一个平台',W/2,50);}
    ctx.hud('按住蓄力，松开跳跃 · 得分 '+score);
  }
  return {
    init:function(){
      ctx.canvas.width=W;ctx.canvas.height=H;fresh();draw();
      ctx.canvas.addEventListener('pointerdown',function(){charging=true;});
      ctx.canvas.addEventListener('pointerup',function(){jump();});
    },
    start:fresh, reset:fresh,
    tick:function(){
      if(over)return;
      if(charging){power=Math.min(75,power+1.2);}
      if(jumping){jumpT+=0.06;if(jumpT>=1){land();}}
      if(scrollRemain>0){
        var step=Math.min(scrollRemain,10);  // 每帧平滑横移 10px
        for(var j=0;j<plat.length;j++)plat[j].x-=step;
        px-=step;
        scrollRemain-=step;
        if(scrollRemain<=0){scrollRemain=0;finishScroll();}
      }
      draw();
    },
    draw:draw,
    onKey:function(d){if(over)return;if(d==='down')charging=true;else if(d==='up'){jump();}}
  };
});
