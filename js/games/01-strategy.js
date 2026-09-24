'use strict';
/* ===================== 休闲游戏 · 棋牌策略 7 款 ===================== */

function gShuffle(a) { var r = a.slice(); for (var i = r.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; } return r; }

/* ===== 井字棋 ===== */
regGame('tictactoe', function (ctx) {
  var b, over, wins = 0;
  var L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function win(p) { for (var i=0;i<L.length;i++) if (b[L[i][0]]===p&&b[L[i][1]]===p&&b[L[i][2]]===p) return true; return false; }
  function ai() {
    var e=[],i; for(i=0;i<9;i++) if(b[i]===0)e.push(i);
    for(i=0;i<e.length;i++){b[e[i]]=2;if(win(2)){b[e[i]]=0;return e[i];}b[e[i]]=0;}
    for(i=0;i<e.length;i++){b[e[i]]=1;if(win(1)){b[e[i]]=0;return e[i];}b[e[i]]=0;}
    if(b[4]===0)return 4;
    return e[Math.floor(Math.random()*e.length)];
  }
  function draw() {
    var h='<div class="ttt-grid">';
    for(var i=0;i<9;i++){var s=b[i]===1?'❌':b[i]===2?'⭕':'';h+='<button class="ttt-cell" data-i="'+i+'">'+s+'</button>';}
    h+='</div>';
    ctx.container.innerHTML=h;
    Array.prototype.forEach.call(ctx.container.querySelectorAll('.ttt-cell'),function(c){c.addEventListener('click',function(){
      if(over)return;var i=+c.getAttribute('data-i');if(b[i]!==0)return;
      b[i]=1;SFX.click();draw();
      if(win(1)){over=true;wins++;ctx.finish(wins);return;}
      if(b.indexOf(0)===-1){over=true;ctx.finish(wins);return;}
      b[ai()]=2;draw();
      if(win(2)){over=true;ctx.finish(wins);return;}
      if(b.indexOf(0)===-1){over=true;ctx.finish(wins);}
    });});
  }
  function fresh(){b=[0,0,0,0,0,0,0,0,0];over=false;draw();}
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 五子棋（11×11，难度分级 AI：简单=贪心 / 困难=极小极大搜索） ===== */
regGame('gomoku', function (ctx) {
  var N=11, b, over, wins=0, diff=1;
  function count(x,y,dx,dy,p){var c=0,nx=x+dx,ny=y+dy;while(nx>=0&&nx<N&&ny>=0&&ny<N&&b[ny][nx]===p){c++;nx+=dx;ny+=dy;}return c;}
  function score(x,y,p){
    if(b[y][x]!==0)return -1;
    var s=0,d=[[1,0],[0,1],[1,1],[1,-1]],i;
    for(i=0;i<4;i++){var c=count(x,y,d[i][0],d[i][1],p)+count(x,y,-d[i][0],-d[i][1],p);if(c>=4)s+=10000;else s+=c*c;}
    return s;
  }
  function winAt(x,y,p){
    var d=[[1,0],[0,1],[1,1],[1,-1]],i;
    for(i=0;i<4;i++){if(count(x,y,d[i][0],d[i][1],p)+count(x,y,-d[i][0],-d[i][1],p)>=4)return true;}
    return false;
  }
  function hasWin(p){var x,y;for(y=0;y<N;y++)for(x=0;x<N;x++)if(b[y][x]===p&&winAt(x,y,p))return true;return false;}
  function genCand(){var cand=[],seen={},x,y,dx,dy;for(y=0;y<N;y++)for(x=0;x<N;x++){if(b[y][x]===0)continue;for(dx=-1;dx<=1;dx++)for(dy=-1;dy<=1;dy++){var nx=x+dx,ny=y+dy;if(nx<0||nx>=N||ny<0||ny>=N||b[ny][nx]!==0)continue;var k=ny*N+nx;if(!seen[k]){seen[k]=1;cand.push([nx,ny]);}}}return cand;}
  function evalBoard(){var x,y,sum=0;for(y=0;y<N;y++)for(x=0;x<N;x++){if(b[y][x]===2)sum+=score(x,y,2);else if(b[y][x]===1)sum-=score(x,y,1);}return sum;}
  function aiEasy(){
    var bx=-1,by=-1,bs=-1,ms=-1,mx=-1,my=-1,x,y,s1,s2;
    for(y=0;y<N;y++)for(x=0;x<N;x++){
      s1=score(x,y,2);s2=score(x,y,1);
      var s=s1*1.1+s2;
      if(s1>=10000){b[y][x]=2;return;}
      if(s2>=10000){if(ms<0){ms=s2;mx=x;my=y;}}
      if(s>bs){bs=s;bx=x;by=y;}
    }
    if(ms>=0)b[my][mx]=2;else if(bx>=0)b[by][bx]=2;
  }
  function aiHard(){
    var cand=genCand();
    if(!cand.length){aiEasy();return;}
    var i,x,y;
    /* 1. 立即取胜 */
    for(i=0;i<cand.length;i++){x=cand[i][0];y=cand[i][1];b[y][x]=2;if(hasWin(2))return;b[y][x]=0;}
    /* 2. 阻止玩家取胜 */
    for(i=0;i<cand.length;i++){x=cand[i][0];y=cand[i][1];b[y][x]=1;if(hasWin(1)){b[y][x]=0;b[y][x]=2;return;}b[y][x]=0;}
    /* 3. 极小极大（深度2，候选点按评分裁剪） */
    cand.sort(function(a,c){return (score(c[0],c[1],2)+score(c[0],c[1],1))-(score(a[0],a[1],2)+score(a[0],a[1],1));});
    var top=cand.slice(0,12);
    var best=-Infinity,bx=-1,by=-1;
    for(i=0;i<top.length;i++){
      x=top[i][0];y=top[i][1];
      b[y][x]=2;
      var worst=Infinity;
      var cand2=genCand();
      cand2.sort(function(a,c){return score(c[0],c[1],1)-score(a[0],a[1],1);});
      var top2=cand2.slice(0,8);
      if(!top2.length)worst=evalBoard();
      else for(var j=0;j<top2.length;j++){
        var x2=top2[j][0],y2=top2[j][1];
        b[y2][x2]=1;
        var e=evalBoard();
        if(e<worst)worst=e;
        b[y2][x2]=0;
      }
      b[y][x]=0;
      if(worst>best){best=worst;bx=x;by=y;}
    }
    if(bx>=0)b[by][bx]=2;else aiEasy();
  }
  function ai(){ if(diff===1) aiHard(); else aiEasy(); }
  /* 落子后推进：自动跳过无合法步的一方，直到某方有步或终局（避免无子可下时卡死） */
  function advance(){
    while(true){
      if(!moves(1).length && !moves(2).length){
        over=true; var d=tally(); if(d>0) wins++; ctx.finish(wins); return;
      }
      if(turn===2){
        if(!moves(2).length){ turn=1; draw(); continue; }
        ai(); turn=1; draw(); continue;
      } else {
        if(!moves(1).length){ turn=2; draw(); continue; }
        break;
      }
    }
  }
  function draw(){
    var h='<div class="game-diff-bar">'+
      '<button class="diff-btn'+(diff===0?' active':'')+'" data-game-control="1" data-d="0">😊 简单</button>'+
      '<button class="diff-btn'+(diff===1?' active':'')+'" data-game-control="1" data-d="1">🤖 困难</button>'+
      '</div><div class="go-grid" style="grid-template-columns:repeat('+N+',1fr)">';
    for(var y=0;y<N;y++)for(var x=0;x<N;x++){
      var s=b[y][x]===1?'⚫':b[y][x]===2?'⚪':'';
      h+='<button class="go-cell" data-x="'+x+'" data-y="'+y+'">'+s+'</button>';
    }
    h+='</div>';
    ctx.container.innerHTML=h;
    ctx.container.querySelectorAll('.diff-btn').forEach(function(d){d.addEventListener('click',function(){
      var nd=+d.getAttribute('data-d');if(nd===diff)return;diff=nd;SFX.click();fresh();
    });});
    Array.prototype.forEach.call(ctx.container.querySelectorAll('.go-cell'),function(c){c.addEventListener('click',function(){
      if(over)return;var x=+c.getAttribute('data-x'),y=+c.getAttribute('data-y');if(b[y][x]!==0)return;
      b[y][x]=1;SFX.click();draw();
      if(winAt(x,y,1)){over=true;wins++;ctx.finish(wins);return;}
      ai();draw();
      var ex,ey,ended=false;for(ey=0;ey<N;ey++)for(ex=0;ex<N;ex++)if(b[ey][ex]===2&&winAt(ex,ey,2))ended=true;
      if(ended){over=true;ctx.finish(wins);}
    });});
  }
  function fresh(){b=[];for(var y=0;y<N;y++){b.push([]);for(var x=0;x<N;x++)b[y].push(0);}over=false;draw();}
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 翻转棋（8×8，难度分级 AI：简单=贪心 / 困难=位置权重极小极大） ===== */
regGame('reversi', function (ctx) {
  var b, over, turn, wins=0, diff=1;
  var D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  var W=[[100,-20,10,5,5,10,-20,100],[-20,-50,-2,-2,-2,-2,-50,-20],[10,-2,-1,-1,-1,-1,-2,10],[5,-2,-1,-1,-1,-1,-2,5],[5,-2,-1,-1,-1,-1,-2,5],[10,-2,-1,-1,-1,-1,-2,10],[-20,-50,-2,-2,-2,-2,-50,-20],[100,-20,10,5,5,10,-20,100]];
  function inb(x,y){return x>=0&&x<8&&y>=0&&y<8;}
  function moves(p){
    var r=[],x,y;
    for(y=0;y<8;y++)for(x=0;x<8;x++){
      if(b[y][x]!==0)continue;
      var ok=false;
      for(var k=0;k<8;k++){var nx=x+D[k][0],ny=y+D[k][1],f=false;while(inb(nx,ny)&&b[ny][nx]===3-p){nx+=D[k][0];ny+=D[k][1];f=true;}if(f&&inb(nx,ny)&&b[ny][nx]===p){ok=true;break;}}
      if(ok)r.push([x,y]);
    }
    return r;
  }
  function put(x,y,p){
    b[y][x]=p;
    for(var k=0;k<8;k++){
      var nx=x+D[k][0],ny=y+D[k][1],flip=[];
      while(inb(nx,ny)&&b[ny][nx]===3-p){flip.push([nx,ny]);nx+=D[k][0];ny+=D[k][1];}
      if(flip.length&&inb(nx,ny)&&b[ny][nx]===p)for(var i=0;i<flip.length;i++)b[flip[i][1]][flip[i][0]]=p;
    }
  }
  function cloneB(){return JSON.parse(JSON.stringify(b));}
  function tally(){var c1=0,c2=0,x,y;for(y=0;y<8;y++)for(x=0;x<8;x++){if(b[y][x]===1)c1++;if(b[y][x]===2)c2++;}return c1-c2;}
  function evalRev(p){var sum=0,x,y;for(y=0;y<8;y++)for(x=0;x<8;x++){if(b[y][x]===p)sum+=W[y][x];else if(b[y][x]===3-p)sum-=W[y][x];}return sum;}
  function aiEasy(){
    var am=moves(2);if(!am.length)return;
    var a=am[0];
    for(var i=1;i<am.length;i++){if(am[i][0]===0||am[i][0]===7||am[i][1]===0||am[i][1]===7){a=am[i];break;}}
    put(a[0],a[1],2);
  }
  function aiHard(){
    var ms=moves(2);if(!ms.length)return;
    var best=-Infinity,bx=-1,by=-1;
    for(var i=0;i<ms.length;i++){
      var x=ms[i][0],y=ms[i][1];
      var bak=cloneB();
      put(x,y,2);
      var worst=Infinity;
      var ms2=moves(1);
      if(!ms2.length)worst=evalRev(2);
      else for(var j=0;j<ms2.length;j++){
        var bak2=cloneB();
        put(ms2[j][0],ms2[j][1],1);
        var e=evalRev(2);
        if(e<worst)worst=e;
        b=bak2;
      }
      b=bak;
      if(worst>best){best=worst;bx=x;by=y;}
    }
    if(bx>=0)put(bx,by,2);
  }
  function ai(){ if(diff===1) aiHard(); else aiEasy(); }
  /* 落子后推进：自动跳过无合法步的一方，直到某方有步或终局（避免无子可下时卡死） */
  function advance(){
    while(true){
      if(!moves(1).length && !moves(2).length){
        over=true; var d=tally(); if(d>0) wins++; ctx.finish(wins); return;
      }
      if(turn===2){
        if(!moves(2).length){ turn=1; draw(); continue; }
        ai(); turn=1; draw(); continue;
      } else {
        if(!moves(1).length){ turn=2; draw(); continue; }
        break;
      }
    }
  }
  function draw(){
    var ms=(turn===1&&!over)?moves(1):[];
    var h='<div class="game-diff-bar">'+
      '<button class="diff-btn'+(diff===0?' active':'')+'" data-game-control="1" data-d="0">😊 简单</button>'+
      '<button class="diff-btn'+(diff===1?' active':'')+'" data-game-control="1" data-d="1">🤖 困难</button>'+
      '</div><div class="rv-grid">';
    for(var y=0;y<8;y++)for(var x=0;x<8;x++){
      var legal=ms.some(function(m){return m[0]===x&&m[1]===y;});
      var s=legal?'<span class="rv-dot"></span>':(b[y][x]===1?'⚫':b[y][x]===2?'⚪':'');
      h+='<button class="rv-cell'+(legal?' rv-legal':'')+'" data-x="'+x+'" data-y="'+y+'">'+s+'</button>';
    }
    h+='</div>';
    ctx.container.innerHTML=h;
    var tip=turn===1?'你的回合：点高亮处落子':(over?'本局结束':'AI 思考中…');
    ctx.hud(tip+' · 黑 '+ (function(){var a=tally();return a>0?'领先':a<0?'落后':'平';})());
    ctx.container.querySelectorAll('.diff-btn').forEach(function(d){d.addEventListener('click',function(){
      var nd=+d.getAttribute('data-d');if(nd===diff)return;diff=nd;SFX.click();fresh();
    });});
    Array.prototype.forEach.call(ctx.container.querySelectorAll('.rv-cell'),function(c){c.addEventListener('click',function(){
      if(over||turn!==1)return;var x=+c.getAttribute('data-x'),y=+c.getAttribute('data-y');
      var ms=moves(1);if(!ms.length||!ms.some(function(m){return m[0]===x&&m[1]===y;})){ctx.toast('请点击高亮的空位落子');return;}
      put(x,y,1);SFX.click();turn=2;advance();
    });});
  }
  function fresh(){
    b=[];for(var y=0;y<8;y++){b.push([]);for(var x=0;x<8;x++)b[y].push(0);}
    b[3][3]=2;b[3][4]=1;b[4][3]=1;b[4][4]=2;turn=1;over=false;draw();
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 石头剪刀布（5 局计胜负） ===== */
regGame('rps', function (ctx) {
  var round=0, won=0, over=false;
  var M=['✊','✋','✌️'];
  function result(p,c){ if(p===c)return 0; if((p===0&&c===2)||(p===1&&c===0)||(p===2&&c===1))return 1; return 2; }
  function draw(){
    var h='<div class="rps-area"><div class="rps-score">第 '+(round+1)+'/5 局 · 已胜 '+won+'</div>'+
      '<div class="rps-btns">';
    for(var i=0;i<3;i++)h+='<button class="rps-btn" data-p="'+i+'">'+M[i]+'</button>';
    h+='</div><div class="rps-out" id="rpsOut">点击选择出拳</div></div>';
    ctx.container.innerHTML=h;
    ctx.container.querySelectorAll('.rps-btn').forEach(function(b){b.addEventListener('click',function(){
      if(over)return;var p=+b.getAttribute('data-p');var c=Math.floor(Math.random()*3);
      var r=result(p,c);var out=ctx.container.querySelector('#rpsOut');
      out.innerHTML='你 '+M[p]+' vs AI '+M[c]+' → '+(r===0?'平局':r===1?'你赢了！':'你输了');
      if(r===1){won++;SFX.correct();}else if(r===2)SFX.wrong();else SFX.click();
      round++;
      if(round>=5){over=true;ctx.finish(won);}
      else draw();
    });});
  }
  function fresh(){round=0;won=0;over=false;draw();}
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 猜数字（Bulls & Cows） ===== */
regGame('bulls', function (ctx) {
  var ans, attempts, over;
  function fresh(){ans=gShuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,4);attempts=0;over=false;draw();}
  function draw(){
    var h='<div class="bulls-area"><div class="bulls-tip">猜一个 4 位数字（数字不重复）</div>'+
      '<input id="bullsInput" inputmode="numeric" maxlength="4" placeholder="输入 4 位数字">'+
      '<button class="btn btn-primary" id="bullsGo" style="margin-top:.5rem">猜</button>'+
      '<div class="bulls-log" id="bullsLog"></div></div>';
    ctx.container.innerHTML=h;
    ctx.container.querySelector('#bullsGo').addEventListener('click',guess);
    ctx.container.querySelector('#bullsInput').addEventListener('keyup',function(e){if(e.key==='Enter')guess();});
  }
  function guess(){
    if(over)return;
    var v=ctx.container.querySelector('#bullsInput').value.trim();
    if(!/^\d{4}$/.test(v)||new Set(v.split('')).size!==4){ctx.toast('请输入 4 位不重复数字');return;}
    var g=v.split('').map(Number),a=0,b=0,i;
    for(i=0;i<4;i++){if(g[i]===ans[i])a++;else if(ans.indexOf(g[i])!==-1)b++;}
    attempts++;
    var log=ctx.container.querySelector('#bullsLog');
    log.innerHTML+='<div>'+v+' → '+a+'A'+b+'B</div>';
    ctx.container.querySelector('#bullsInput').value='';
    if(a===4){over=true;ctx.finish(attempts);}
  }
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 记忆翻牌 ===== */
regGame('memory', function (ctx) {
  var cards, flipped, lock, steps, matched, over;
  var EMOJI=['🍎','🍌','🍇','🍉','🍓','🍒','🥝','🍑','🐶','🐱','🐰','🐻'];
  /* 兜底配色：部分老设备（电视内核）渲染不出 emoji，用专属背景色保证可区分 */
  var MEM_COL=['#ffd6d6','#ffe9b3','#d6f5d6','#cfeffd','#e6d6ff','#ffd6ef','#d6fff0','#fff3c4','#ffd9c2','#d9e8ff','#e8ffd6','#f0d6ff'];
  function fresh(){
    var pairs=gShuffle(EMOJI).slice(0,8);cards=gShuffle(pairs.concat(pairs));
    flipped=[];lock=false;steps=0;matched=0;over=false;matchedArr=[];draw();
  }
  function draw(){
    var h='<div class="mem-grid">';
    for(var i=0;i<cards.length;i++){
      var up=flipped.indexOf(i)!==-1||matchedArr.indexOf(i)!==-1;
      var bg=up?(' style="background:'+MEM_COL[EMOJI.indexOf(cards[i])%MEM_COL.length]+'"'):'';
      h+='<button class="mem-cell'+(up?' up':'')+'" data-i="'+i+'"'+bg+'>'+(up?cards[i]:'❓')+'</button>';
    }
    h+='</div>';
    ctx.container.innerHTML=h;
    ctx.hud('步数 '+steps+' · 配对 '+matched+'/8');
    ctx.container.querySelectorAll('.mem-cell').forEach(function(c){c.addEventListener('click',function(){
      if(lock||over)return;var i=+c.getAttribute('data-i');
      if(flipped.indexOf(i)!==-1||matchedArr.indexOf(i)!==-1)return;
      flipped.push(i);SFX.click();draw();
      if(flipped.length===2){
        steps++;lock=true;
        if(cards[flipped[0]]===cards[flipped[1]]){
          matchedArr.push(flipped[0],flipped[1]);flipped=[];lock=false;matched++;
          if(matched===8){over=true;ctx.finish(steps);}else draw();
        }else{
          setTimeout(function(){if(!ctx.alive())return;flipped=[];lock=false;draw();},700);
        }
      }
    });});
  }
  var matchedArr=[];
  return { init:fresh, start:fresh, reset:fresh };
});

/* ===== 24 点 ===== */
regGame('math24', function (ctx) {
  var nums, solved, over;
  function fresh(){
    nums=[Math.floor(Math.random()*9)+1,Math.floor(Math.random()*9)+1,Math.floor(Math.random()*9)+1,Math.floor(Math.random()*9)+1];
    solved=0;over=false;draw();
  }
  function draw(){
    var h='<div class="m24-area"><div class="m24-nums">'+nums.join('  ')+'</div>'+
      '<div class="m24-tip">用这 4 个数和 + - × ÷ 括号，凑出 24（每个数用一次）</div>'+
      '<input id="m24Input" placeholder="例：(3+5)×(4-1)">'+
      '<button class="btn btn-primary" id="m24Go" style="margin-top:.5rem">验证</button>'+
      '<div class="m24-msg" id="m24Msg"></div></div>';
    ctx.container.innerHTML=h;
    ctx.hud('已解 '+solved+' 题');
    ctx.container.querySelector('#m24Go').addEventListener('click',check);
    ctx.container.querySelector('#m24Input').addEventListener('keyup',function(e){if(e.key==='Enter')check();});
  }
  function check(){
    if(over)return;
    var v=ctx.container.querySelector('#m24Input').value;
    var safe=v.replace(/[0-9+\-*/().×÷\s]/g,'');
    if(safe){ctx.toast('只能包含数字和运算符');return;}
    var expr=v.replace(/×/g,'*').replace(/÷/g,'/');
    var used={},i;for(i=0;i<4;i++)used[i]=false;
    var digits=v.replace(/[^0-9]/g,'');
    if(digits.length!==4){ctx.toast('请使用 4 个数字各一次');return;}
    for(i=0;i<4;i++){var d=+digits[i];var idx=nums.indexOf(d);if(idx===-1||used[idx]){ctx.toast('数字不符');return;}used[idx]=true;}
    var val;try{val=new Function('return ('+expr+')')();}catch(e){ctx.toast('表达式错误');return;}
    if(Math.abs(val-24)<0.0001){solved++;ctx.toast('✅ 正确！');ctx.container.querySelector('#m24Input').value='';if(solved>=5){over=true;ctx.finish(5);return;}freshNums();}
    else ctx.toast('❌ 结果不是 24');
  }
  function freshNums(){nums=[Math.floor(Math.random()*9)+1,Math.floor(Math.random()*9)+1,Math.floor(Math.random()*9)+1,Math.floor(Math.random()*9)+1];draw();}
  return { init:fresh, start:fresh, reset:fresh };
});
