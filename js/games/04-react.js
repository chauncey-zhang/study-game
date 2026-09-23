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
    onTap:function(x){if(over)return;basket.x=Math.max(0,Math.min(W-basket.w,x-basket.w/2));}
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

/* ===== 飞机大战 ===== */
regGame('plane', function (ctx) {
  var W=300,H=440, plane, bullets, enemies, score, over, acc;
  function fresh(){plane={x:W/2-12,w:24};bullets=[];enemies=[];score=0;over=false;acc=0;}
  function tick(){
    if(over)return;
    acc++;
    if(acc%12===0)bullets.push({x:plane.x+plane.w/2,y:H-60});
    if(acc%40===0)enemies.push({x:Math.random()*(W-20)+10,y:-20,w:22});
    var i;
    for(i=bullets.length-1;i>=0;i--){bullets[i].y-=7;if(bullets[i].y<-10)bullets.splice(i,1);}
    for(i=enemies.length-1;i>=0;i--){enemies[i].y+=2.2;if(enemies[i].y>H){enemies.splice(i,1);continue;}}
    for(i=bullets.length-1;i>=0;i--){for(var j=enemies.length-1;j>=0;j--){var b=bullets[i],e=enemies[j];if(b&&e&&b.x>e.x&&b.x<e.x+e.w&&b.y>e.y&&b.y<e.y+22){bullets.splice(i,1);enemies.splice(j,1);score+=10;SFX.correct();break;}}}
    for(i=enemies.length-1;i>=0;i--){var e=enemies[i];if(e.y+22>H-54&&e.x>plane.x-8&&e.x<plane.x+plane.w+8){over=true;ctx.finish(score);return;}}
  }
  function draw(){
    var c=ctx.canvas.getContext('2d');
    c.clearRect(0,0,W,H);c.fillStyle='#f1f5f9';c.fillRect(0,0,W,H);
    c.fillStyle='#334155';c.fillRect(plane.x,H-54,plane.w,16);
    c.fillStyle='#facc15';for(var i=0;i<bullets.length;i++)c.fillRect(bullets[i].x-1.5,bullets[i].y,3,10);
    c.fillStyle='#f87171';for(var j=0;j<enemies.length;j++){var e=enemies[j];c.fillRect(e.x,e.y,e.w,22);}
    ctx.hud('得分 '+score);
  }
  return {
    init:function(){ctx.canvas.width=W;ctx.canvas.height=H;fresh();draw();},
    start:fresh, reset:fresh, tick:tick, draw:draw,
    onKey:function(d){if(over)return;if(d==='left')plane.x=Math.max(0,plane.x-16);else if(d==='right')plane.x=Math.min(W-plane.w,plane.x+16);},
    onTap:function(x){if(over)return;plane.x=Math.max(0,Math.min(W-plane.w,x-plane.w/2));}
  };
});

/* ===== 记忆序列（Simon） ===== */
regGame('simon', function (ctx) {
  var seq, level, playing, idx, over;
  var COLS=['#f87171','#60a5fa','#34d399','#fbbf24'];
  function fresh(){seq=[];level=0;over=false;nextRound();}
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
    var dist=power*2.2;
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
      last={x:last.x+last.w+70+Math.random()*60, w:60};
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
      if(charging){power=Math.min(60,power+1.2);}
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
