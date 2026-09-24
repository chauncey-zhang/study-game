'use strict';
  /* ===================== 宠物系统 ===================== */
  /* 稀有度：基础经验加成(%/级)、基础食物加成(粮/级)、展示名、抽蛋概率权重 */
  var RARITY = {
    common: { name: '普通', xpPerLv: 3, foodPerLv: 1, weight: 70 },
    rare:   { name: '稀有', xpPerLv: 5, foodPerLv: 2, weight: 26 },
    legend: { name: '传说', xpPerLv: 8, foodPerLv: 3, weight: 4 }
  };
  var RARITY_NAME = { common: '普通', rare: '稀有', legend: '传说' };
  var MAX_PET_LV = 100;       // 宠物等级上限
  var FEED_BASE = 2;          // 升到 Lv.2 所需食物（之后每级翻倍）
  var FEED_COST_CAP = 999;    // 单次喂食消耗食物上限（防止高阶天文数字）
  var MAX_XP_BONUS = 999;     // 经验加成上限（%）
  /* 原始 18 种（保留 id 兼容旧存档） */
  var PETS_BASE = [
    { id:'dog',     icon:'🐶', name:'旺财',   rarity:'common' },
    { id:'cat',     icon:'🐱', name:'咪咪',   rarity:'common' },
    { id:'pig',     icon:'🐷', name:'嘟嘟',   rarity:'common' },
    { id:'rabbit',  icon:'🐰', name:'跳跳',   rarity:'common' },
    { id:'bear',    icon:'🐻', name:'憨憨',   rarity:'common' },
    { id:'koala',   icon:'🐨', name:'睡睡',   rarity:'common' },
    { id:'monkey',  icon:'🐵', name:'皮皮',   rarity:'common' },
    { id:'chicken', icon:'🐔', name:'咕咕',   rarity:'common' },
    { id:'frog',    icon:'🐸', name:'呱呱',   rarity:'common' },
    { id:'turtle',  icon:'🐢', name:'慢慢',   rarity:'common' },
    { id:'fox',     icon:'🦊', name:'灵灵',   rarity:'rare' },
    { id:'panda',   icon:'🐼', name:'团子',   rarity:'rare' },
    { id:'penguin', icon:'🐧', name:'冰冰',   rarity:'rare' },
    { id:'owl',     icon:'🦉', name:'博士',   rarity:'rare' },
    { id:'octopus', icon:'🐙', name:'墨墨',   rarity:'rare' },
    { id:'unicorn', icon:'🦄', name:'彩虹',   rarity:'legend' },
    { id:'dragon',  icon:'🐲', name:'烈焰',   rarity:'legend' },
    { id:'ghost',   icon:'👻', name:'豆豆',   rarity:'legend' }
  ];
  /* 扩充用的 emoji / 名字池：250 个唯一图标，与宠物一一对应，绝不循环复用 */
  var PET_ICONS = [
    /* 动物 85 */
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
    '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔',
    '🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺',
    '🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦂',
    '🐢','🐍','🦎','🦖','🦕','🐙','🦑','🐡','🐠','🐟',
    '🐬','🐳','🐋','🦈','🐅','🐆','🐊','🐘','🐪','🐫',
    '🦓','🦒','🐐','🐑','🐂','🐃','🐄','🐎','🐖','🦌',
    '🦏','🦛','🐉','🐲','👻','🦃','🐚','🦞','🦪','🦭',
    '🕷️','🦟','🪲','🪳','🪰',
    /* 幻想精灵 15 */
    '👾','👽','🤖','🎃','👹','👺','💀','☠️','🤡','🦴',
    '🦷','🐾','👁️','🦿','🦾',
    /* 植物 21 */
    '🌵','🌲','🌳','🌴','🌱','🌿','☘️','🍀','🎋','🍃',
    '🍂','🍁','🌾','🌷','🌹','🌺','🌸','🌼','🌻','🌰',
    '🍄',
    /* 自然天体 19 */
    '🌞','🌝','🌕','🌟','⭐','🌠','🌌','☀️','⛅','🌈',
    '❄️','☃️','⛄','🔥','💧','🌊','⚡','☁️','🌤️',
    /* 食物精灵 90 */
    '🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈',
    '🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦',
    '🥬','🥒','🌶️','🫑','🌽','🥕','🥔','🍠','🧄','🧅',
    '🥜','🍞','🥐','🥖','🧀','🥚','🍳','🥞','🧇','🥓',
    '🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🥙',
    '🧆','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤',
    '🍚','🍙','🍘','🍥','🥠','🍢','🍡','🍧','🍨','🍦',
    '🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩',
    '🍪','🥤','🧋','🍵','☕','🍶','🥂','🍷','🍸','🍹',
    /* 活动物品 20 */
    '🍾','⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸',
    '🎯','🎲','🎮','🎸','🎺','🎻','🥁','🎤','🚀','✈️'
  ];
  var PET_NAMES = ['旺财','咪咪','嘟嘟','跳跳','憨憨','睡睡','皮皮','咕咕','呱呱','慢慢','灵灵','团子','冰冰','博士','墨墨','彩虹','烈焰','豆豆','淘淘','球球','点点','毛毛','糖糖','果果','乐乐','安安','可可','丁丁','花花','胖胖','小七','阿福','小白','黑米','橘座','奶酪','布丁','奶昔','雪球','煤球','栗子','松果','椰果','蜜柚','棉花','云朵','星仔','月牙','闪电','风风','火苗','小满','阿黄','柚柚','团团','圆圆','壮壮','小帅','阿宝','贝贝','妞妞','毛毛','奔奔','飞飞','跳跳','悠悠','点点','泡泡','波波','噜噜','呆呆','萌萌','皮蛋','元宝','招财','进宝','平安','喜喜','小美','帅帅','大圣','齐天','红红','火火','青青','蓝蓝','绿绿','紫紫','橙橙','粉粉','金金','银银','铁蛋','铜锣','喵喵','汪汪','咩咩','哞哞','嘎嘎','叽叽','喳喳','嗡嗡','嗡嗡','蛐蛐','扑扑','闪闪','亮亮','晶晶','灿灿','阳阳','光光','暖暖','甜甜','香香','脆脆','软软','糯糯','酥酥','小糯','阿糯','雪糕','冰淇淋','小布','布奇','奇奇','妙妙','妙妙','巧巧','可可','乐乐','欢欢','喜喜','庆庆','祥祥','瑞瑞','福福','顺顺','康康','健健','安安','宁宁','静静','恬恬','悠悠','然然','默默','小默','阿默','小语','语语','言言','小诗','诗诗','词词','小小','阿小','大壮','壮壮','铁牛','水牛','老牛','小羊','羊羊','小马','骏骏','飞马','天马','云马','小鹿','鹿鹿','小象','象象','小河','河河','小鱼','鱼鱼','小鲸','鲸鲸','海海','豚豚','鲨鲨','小龟','龟龟','小蛇','蛇蛇','小龙','龙龙','凤凤','小凤','麒麒','麟麟','凰凰','小鹤','鹤鹤','小鹰','鹰鹰','小雕','雕雕','鸮鸮','企鹅','鹅鹅','小鸭','鸭鸭','小鹅','天鹅','小蜂','蜂蜂','小蝶','蝶蝶','小蚁','蚁蚁','小蟹','蟹蟹','小虾','虾虾','小章','章章','小乌','乌乌','小鳄','鳄鳄','小虎','虎虎','小狮','狮狮','小豹','豹豹','小狼','狼狼','小狐','狐狐','小熊','熊熊','小猴','猴猴','小兔','兔兔','小鹿','小羊','小牛','小象','小鹰','小鹏','鹏鹏','小雕','飞飞','燕燕','小燕','雀雀','小雀','小鸥','鸥鸥','小鸽','鸽鸽','小雀','小鸢','鸢鸢','小隼','隼隼','小鹞','鹞鹞','小鸻','鸻鸻','小鹬','鹬鹬','小鹭','鹭鹭','小鹳','鹳鹳','小鹤','丹顶','小企','小鸬','鸬鸬','小鹚','鹚鹚','小鲣','鲣鲣','小鲷','鲷鲷','小鲈','鲈鲈','小鲤','鲤鲤','小鲫','鲫鲫','小鲶','鲶鲶','小鳗','鳗鳗','小鳝','鳝鳝','小鳅','鳅鳅','小豚','小海','小贝','贝贝','小螺','螺螺','小蚌','蚌蚌','小珊','珊珊','小瑚','瑚瑚','小珊瑚','小珍','珍珍','小宝','宝儿','小福','福儿','小禄','禄禄','小寿','寿寿','小喜','喜儿','小财','财财','小运','运运','小吉','吉吉','小祥','祥儿','小瑞','瑞儿','小安','安儿','小康','康儿','小宁','宁儿','小静','静儿','小乐','乐儿','小欢','欢儿','小笑','笑儿','小甜','甜儿','小蜜','蜜儿','小糖','糖儿','小果','果儿','小萌','萌儿','小乖','乖乖','小侠','侠侠','小剑','剑剑','小弓','弓弓','小盾','盾盾','小枪','枪枪','小锤','锤锤','小斧','斧斧','小刀','刀刀','小叉','叉叉','小矛','矛矛','小旗','旗旗','小鼓','鼓鼓','小锣','锣锣','小钹','钹钹','小铃','铃铃','小箫','箫箫','小笛','笛笛','小琴','琴琴','小瑟','瑟瑟','小磬','磬磬','小钟','钟钟','小鼓','小号','号号','小角','角角','小笙','笙笙','小竽','竽竽','小埙','埙埙','小篪','篪篪','小篴','篴篴'];
  function rollRarity() {
    /* 扩充宠物按稀有度权重分布（传说少、普通多），形成等级感 */
    var r = Math.random();
    if (r < 0.04) return 'legend';
    if (r < 0.30) return 'rare';
    return 'common';
  }
  var PETS = PETS_BASE.slice();
  var _usedNames = {};
  PETS_BASE.forEach(function (p) { _usedNames[p.name] = 1; });
  for (var _pi = PETS_BASE.length; _pi < 250; _pi++) {
    var _nm = PET_NAMES[_pi] || ('宠物' + (_pi + 1));
    if (_usedNames[_nm]) { var _k = 2; while (_usedNames[_nm + _k]) _k++; _nm = _nm + _k; }
    _usedNames[_nm] = 1;
    PETS.push({
      id: 'pet' + _pi,
      icon: PET_ICONS[_pi % PET_ICONS.length],
      name: _nm,
      rarity: rollRarity()
    });
  }
  /* 图鉴按稀有度排序（普通 → 稀有 → 传说），体现等级感；分桶 concat 保证 ES5 稳定顺序 */
  (function sortPets() {
    var common = [], rare = [], legend = [];
    PETS.forEach(function (p) {
      if (p.rarity === 'legend') legend.push(p);
      else if (p.rarity === 'rare') rare.push(p);
      else common.push(p);
    });
    PETS = common.concat(rare, legend);
  })();
  function getActivePet() {
    var id = (save.activePet && save.pets.indexOf(save.activePet) !== -1) ? save.activePet : (save.pets[0] || null);
    if (!id) return null;
    return PETS.filter(function (p) { return p.id === id; })[0] || null;
  }
  /* 升到「下一级」所需食物：随当前等级翻倍（Lv.n→n+1 需 FEED_BASE·2^(n-1)），封顶 FEED_COST_CAP */
  function feedCost(curLv) {
    var c = FEED_BASE * Math.pow(2, curLv - 1);
    return Math.min(FEED_COST_CAP, c);
  }
  /* 出战宠物的经验加成（%），按稀有度×等级累加，封顶 MAX_XP_BONUS */
  function petXpBonus() {
    var p = getActivePet();
    if (!p) return 0;
    var r = RARITY[p.rarity] || RARITY.common;
    return Math.min(MAX_XP_BONUS, r.xpPerLv * (getPetLevel(p.id) - 1));
  }
  /* 出战宠物的结算食物加成（粮），按稀有度×等级累加 */
  function petFoodBonus() {
    var p = getActivePet();
    if (!p) return 0;
    var r = RARITY[p.rarity] || RARITY.common;
    return r.foodPerLv * (getPetLevel(p.id) - 1);
  }
  function renderBattlePet() {
    var ap = getActivePet();
    var bp = $('battlePet');
    if (ap) {
      bp.style.display = 'flex';
      bp.innerHTML = petIconWithHat(ap) + '<span class="pet-side-name">' + ap.name + '</span>';
    } else {
      bp.style.display = 'none';
    }
  }
  function getPetLevel(id) { return (save.petLevels && save.petLevels[id]) || 1; }
  function renderActivePetBar() {
    var ap = getActivePet();
    var bar = $('activePetBar');
    if (!bar) return;
    if (!ap) { bar.style.display = 'none'; return; }
    var lv = getPetLevel(ap.id);
    var r = RARITY[ap.rarity] || RARITY.common;
    var cost = feedCost(lv);
    var canFeed = Math.floor((save.food || 0) / cost);
    var bonus = petXpBonus();
    bar.style.display = 'flex';
    bar.style.flexWrap = 'wrap';
    bar.innerHTML =
      '<span class="ap-icon">' + petIconWithHat(ap) + '</span>' +
      '<span class="ap-info" style="flex:1; min-width:0"><b>' + ap.name + '</b> <span class="r-tag r-' + ap.rarity + '">' + r.name + '</span> Lv.' + lv +
      '<small>经验 +' + bonus + '% · 结算食物 +' + petFoodBonus() +
      (lv >= MAX_PET_LV ? '<br>已满级' : '<br>升下一级需 🍖' + cost + '（可喂 ' + canFeed + ' 次）') + '</small></span>' +
      (lv < MAX_PET_LV ? '<button class="btn btn-gold feed-btn" id="feedBtn">🍼 喂食 (🍖' + cost + ')</button>' : '');
    var fb = $('feedBtn');
    if (fb) fb.addEventListener('click', feedPet);
  }
  function feedPet() {
    var ap = getActivePet();
    if (!ap) return;
    var lv = getPetLevel(ap.id);
    if (lv >= MAX_PET_LV) { toast(ap.name + ' 已满级啦！'); return; }
    var cost = feedCost(lv);
    if ((save.food || 0) < cost) {
      toast('🍖 食物不足（还差 ' + (cost - (save.food || 0)) + '），闯关答题/签到可赚食物');
      TTS.speak('食物不够了，快去闯关赚食物吧', 0.9);
      return;
    }
    save.food -= cost;
    save.petLevels[ap.id] = lv + 1;
    SFX.levelup();
    petCry(ap.id); /* 升级时宠物叫一声 */
    burst(window.innerWidth / 2, window.innerHeight / 2, ['🍼', '✨', ap.icon, '💖']);
    toast('🍼 ' + ap.name + ' 升到 Lv.' + (lv + 1) + '！经验加成 +' + petXpBonus() + '%');
    /* 语音延后 350ms，避免盖住叫声 */
    setTimeout(function () { TTS.speak(ap.name + '升级啦！现在经验加成百分之' + petXpBonus(), 0.9); }, 350);
    persist();
    updateTopbar();
    renderActivePetBar();
  }
  /* ===================== 错题本 ===================== */
  function addToWrongBook(subjectId, grade, q, mode) {
    if (!save.wrongBook) save.wrongBook = [];
    var dup = save.wrongBook.some(function (w) { return w.q === q.q; });
    if (dup) return;
    var rec = { s: subjectId, g: grade, q: q.q, o: q.o, a: q.a, e: q.e, m: mode || 'adventure' };
    /* 保留题目上的额外字段（ipa 音标 / key 重点词 / cn 等），否则错题重练时这些“关键字”会丢失 */
    for (var k in q) { if (q.hasOwnProperty(k) && !(k in rec)) rec[k] = q[k]; }
    save.wrongBook.unshift(rec);
    if (save.wrongBook.length > 50) save.wrongBook.pop(); // 上限 50 题
  }
  function removeFromWrongBook(qText) {
    save.wrongBook = (save.wrongBook || []).filter(function (w) { return w.q !== qText; });
  }
  function renderWrongModal() {
    var list = save.wrongBook || [];
    $('wrongCount').textContent = list.length;
    $('wrongStartBtn').style.display = list.length ? 'inline-flex' : 'none';
    var el = $('wrongList');
    el.innerHTML = list.length ? '' : '<div class="empty-tip">太棒了，暂无错题！继续保持 🎉</div>';
    list.forEach(function (w) {
      var d = document.createElement('div');
      d.className = 'wrong-item';
      d.innerHTML = '<div class="wq">' + w.q + '</div><div class="wa">✅ 正确答案：' + w.o[w.a] + '</div><div class="we">💡 ' + (w.e || '') + '</div>';
      el.appendChild(d);
    });
  }
  function startWrongBattle() {
    var pool = shuffle((save.wrongBook || []).slice()).slice(0, 10);
    if (!pool.length) { toast('错题本是空的，太棒了！'); return; }
    setHash('wrong');
    wrongMode = true;
    battleWrongIdx = [];
    curSubject = null;
    libWordMode = false; // 错题重练不属于词库闯关，避免沿用词库模式导致返回/显示错乱
    curLevel = 0;
    curQuestions = pool.map(shuffleOptions);
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    $('battleTitle').textContent = '📒 错题重练';
    $('battleSub').textContent = '答对的错题会自动移出错题本 · 本次 ' + curQuestions.length + ' 题';
    renderBattlePet();
    renderBattle();
  }

  function eggDropRate() {
    if (lastStars >= 3) return 1;
    if (lastStars === 2) return 0.7;
    if (lastStars === 1) return 0.4;
    return 0;
  }
  function tryDropEgg() {
    if (Math.random() < eggDropRate()) {
      save.eggs++;
      SFX.badge();
      burst(window.innerWidth / 2, window.innerHeight * 0.4, ['🥚', '✨', '⭐']);
      setTimeout(function () { toast('🎁 掉落宠物蛋！去 🐾 宠物乐园孵化吧'); }, 600);
    }
  }
  function renderPetModal() {
    $('petEggCount').textContent = save.eggs;
    $('petFoodTip').textContent = '🍖 食物余量：' + (save.food || 0) + '（喂食消耗随等级翻倍，升满 100 级）';
    $('hatchBtn').style.display = save.eggs > 0 ? 'inline-flex' : 'none';
    $('eggIcon').textContent = save.eggs > 0 ? '🥚' : '🕳️';
    renderActivePetBar();
    var el = $('petGrid');
    el.innerHTML = '';
    PETS.forEach(function (p) {
      var owned = save.pets.indexOf(p.id) !== -1;
      var isActive = owned && save.activePet === p.id;
      var r = RARITY[p.rarity] || RARITY.common;
      var d = document.createElement('div');
      d.className = 'pet-card ' + (owned ? 'r-' + p.rarity + ' clickable' : 'locked') + (isActive ? ' active' : '');
      d.title = owned ? '点击让 ' + p.name + ' 出战' : (p.name + '（未拥有，孵化可获得）');
      /* 未拥有的宠物显示为灰色真图标，不再用问号代替；普通/稀有/传说均用文字标签标识 */
      d.innerHTML = '<div class="pi">' + (owned ? (isActive ? petIconWithHat(p) : p.icon) : p.icon) + '</div>' +
        '<div class="pn">' + p.name + '</div>' +
        '<div class="r-tag r-' + p.rarity + '">' + r.name + '</div>' +
        (isActive ? '<div class="active-mark">⭐出战</div>' : '');
      if (owned) {
        d.addEventListener('click', function () {
          if (isActive) {
            /* 互动模式：已出战的宠物 → 叫声 + 蹦跳 + 随机讨好 */
            petCry(p.id);
            d.classList.remove('hop'); void d.offsetWidth; d.classList.add('hop');
            var say = petTalk();
            setTimeout(function () { TTS.speak(p.name + '：' + say, 0.95, 1.15); }, 350);
            toast(p.icon + ' ' + p.name + '：' + say);
          } else {
            /* 出战模式：切换出战 + 叫声 */
            save.activePet = p.id;
            persist();
            SFX.click();
            petCry(p.id);
            setTimeout(function () { TTS.speak(p.name + '，出战！主人最强！', 0.9); }, 350);
            toast(p.icon + ' ' + p.name + ' 出战！战斗中为你加油');
            renderPetModal();
          }
        });
      }
      el.appendChild(d);
    });
  }
  function hatchEgg() {
    if (save.eggs <= 0) return;
    var btn = $('hatchBtn');
    btn.style.pointerEvents = 'none';
    var egg = $('eggIcon');
    egg.classList.add('shaking');
    TTS.stop();
    setTimeout(function () {
      egg.classList.remove('shaking');
      btn.style.pointerEvents = '';
      save.eggs--;
      save.hatches++;
      var roll = Math.random();
      var pool = roll < 0.05 ? 'legend' : (roll < 0.25 ? 'rare' : 'common');
      var candidates = PETS.filter(function (p) { return p.rarity === pool; });
      var pet = candidates[Math.floor(Math.random() * candidates.length)];
      var isNew = save.pets.indexOf(pet.id) === -1;
      if (isNew) {
        save.pets.push(pet.id);
        SFX.levelup();
        petCry(pet.id); /* 新宠物出生叫一声 */
        setTimeout(function () { TTS.speak('哇！孵出了' + (pool === 'legend' ? '传说宠物' : '新宠物') + pet.name + '！', 0.9); }, 350);
        toast('🎉 孵出新宠物：' + pet.icon + ' ' + pet.name + '（' + RARITY_NAME[pool] + '）');
        burst(window.innerWidth / 2, window.innerHeight / 2, ['🎉', pet.icon, '✨', '💖', '⭐']);
      } else {
        save.stars += 5;
        save.food = (save.food || 0) + 5;
        SFX.badge();
        petCry(pet.id); /* 老宠物打招呼 */
        setTimeout(function () { TTS.speak(pet.name + '已经在家里啦，送你五颗星星和五份食物！', 0.9); }, 350);
        toast(pet.icon + ' ' + pet.name + '（' + RARITY_NAME[pet.rarity] + '）已拥有，重复转化为 ⭐5 + 🍖5！');
      }
      unlockBadges();
      persist();
      updateTopbar();
      renderPetModal();
    }, 900);
  }

  /* ===================== 存档 ===================== */
  function defaultSave() {
    return { xp: 0, stars: 0, food: 0, totalCorrect: 0, bestCombo: 0, rounds: 0, subjectCorrect: {}, badges: [], levelStars: {}, eggs: 0, hatches: 0, pets: [], activePet: null, petLevels: {}, wrongBook: [], lastSignDate: '', signStreak: 0, mentalLog: {}, mentalStreak: 0, mentalLast: '', wordStats: {}, wordTotal: 0, reviewTotal: 0, wordLibStars: {}, thinkLog: {}, thinkStreak: 0, thinkLast: '', thinkTotal: 0, phonicsDone: 0, phonicsTotal: 0, phonicsBest: 0, phonicsLog: {}, storyHeard: [], storyLog: {}, storyStreak: 0, storyLast: '', grammarDone: 0, grammarTotal: 0, grammarBest: 0, grammarLog: {}, grammarStreak: 0, grammarLast: '', gameStats: {}, coins: 0, cosmetics: {}, activeHat: '', activeFrame: '', activeTheme: '' };
  }
  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        /* 主档被清：先从备份槽同步取回（04b-backup.js），再交给 __BACKUP__.recover 做 IndexedDB 兜底 */
        var bk = (window.__BACKUP__ && window.__BACKUP__.loadLSSlot) ? window.__BACKUP__.loadLSSlot() : null;
        if (bk) return bk;
        return defaultSave();
      }
      var s = JSON.parse(raw); var d = defaultSave();
      for (var k in d) { if (!(k in s)) s[k] = d[k]; }
      return s;
    } catch (e) { return defaultSave(); }
  }
  /* ===================== 用户系统（多档案 + 备份迁移） ===================== */
  var USERS_KEY = 'study-adventure-users';
  var CURRENT_KEY = 'study-adventure-current-user';
  function loadUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; } }
  function saveUsers(u) { try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch (e) {} }
  function getCurrentUser() { try { return localStorage.getItem(CURRENT_KEY) || null; } catch (e) { return null; } }
  function setCurrentUser(name) { try { name ? localStorage.setItem(CURRENT_KEY, name) : localStorage.removeItem(CURRENT_KEY); } catch (e) {} }
  function hashPass(p) { var h = 5381; p = String(p); for (var i = 0; i < p.length; i++) { h = ((h << 5) + h + p.charCodeAt(i)) >>> 0; } return 'h' + h.toString(36); }
  function persist() {
    try {
      var cu = getCurrentUser();
      if (cu) {
        var users = loadUsers();
        if (users[cu]) { users[cu].save = save; users[cu].updatedAt = Date.now(); saveUsers(users); }
      } else {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save)); // 游客档
      }
    } catch (e) {}
    /* 自动备份挂钩（04b-backup.js）：静默写入备份槽 + 每日快照 + 跨天自动下载 */
    try { if (window.__BACKUP__) window.__BACKUP__.tick(false); } catch (e) {}
  }
  var save = loadSave();
  /* 自动恢复：主档被清时从备份（IndexedDB → localStorage → 内存）找回 */
  try { if (window.__BACKUP__) window.__BACKUP__.recover(); } catch (e) {}
  /* 恢复登录用户档案：刷新后 save 必须指向当前用户，否则会误用游客档并覆盖用户数据 */
  (function () {
    var cu = getCurrentUser();
    if (!cu) return;
    var users = loadUsers();
    if (!users[cu] || !users[cu].save) return;
    var d = defaultSave(), s = users[cu].save;
    for (var k in d) { if (!(k in s)) s[k] = d[k]; }
    save = s;
  })();
  function refreshAll() {
    updateTopbar();
    updateUserBtn();
    renderGrades();
    renderSubjects();
  }
  function updateUserBtn() {
    var cu = getCurrentUser();
    $('userBtn').textContent = cu ? cu.slice(0, 2) : '👤';
    $('userBtn').title = cu ? '用户中心（' + cu + '）' : '用户中心（游客模式）';
  }
  function registerUser(name, pass) {
    name = (name || '').trim();
    if (!name || !pass) return '请填写用户名和密码';
    if (name.length > 12) return '用户名最多 12 个字';
    var users = loadUsers();
    if (users[name]) return '这个用户名已被使用';
    users[name] = { pass: hashPass(pass), save: JSON.parse(JSON.stringify(save)), createdAt: Date.now() }; // 继承当前进度
    saveUsers(users);
    setCurrentUser(name);
    refreshAll();
    return null;
  }
  function loginUser(name, pass) {
    name = (name || '').trim();
    var users = loadUsers();
    if (!users[name]) return '用户不存在，请先注册';
    if (users[name].pass !== hashPass(pass)) return '密码错误';
    persist(); // 保存当前（游客）进度
    setCurrentUser(name);
    var d = defaultSave();
    var s = users[name].save || d;
    for (var k in d) { if (!(k in s)) s[k] = d[k]; }
    save = s;
    refreshAll();
    try { if (window.__BACKUP__) window.__BACKUP__.tick(true); } catch (e) {} // 切换用户后立即备份用户档
    return null;
  }
  function logoutUser() {
    persist(); // 写回当前用户档
    try { if (window.__BACKUP__) window.__BACKUP__.tick(true); } catch (e) {} // 退出前备份用户档
    setCurrentUser(null);
    save = loadSave(); // 回到游客档
    refreshAll();
  }
  /* ===== 等级 / 经验（递增曲线，等级上限与成就挂钩）=====
   * 升到下一级所需经验随等级递增：need(L)=100+(L-1)*40
   * 累计阈值 xpForLevel(L)=20*(L-1)*(L+3)，即达到 L 级所需的总经验
   * 等级上限 = 1 + 已解锁成就数（每解锁一个成就多开一级；经验照常累计、永不丢失） */
  function xpForLevel(L) { return L <= 1 ? 0 : 20 * (L - 1) * (L + 3); }
  function levelCap() { return 1 + (save.badges ? save.badges.length : 0); }
  function level() {
    var cap = levelCap(), L = 1;
    while (L < cap && xpForLevel(L + 1) <= save.xp) L++;
    return L;
  }
  function xpInLevel() { return save.xp - xpForLevel(level()); }
  function xpToNext() { return xpForLevel(level() + 1) - xpForLevel(level()); }
  function xpPct() { var t = xpToNext(); return t > 0 ? Math.min(100, Math.round(xpInLevel() / t * 100)) : 100; }
  /* 出战宠物的结算食物加成：每级 +1 粮 */
  function petFoodBonus() { var p = getActivePet(); return p ? getPetLevel(p.id) : 0; }

  function $(id) { return document.getElementById(id); }

  var curGrade = 1, curSubject = null, curQuestions = [], curIndex = 0;
  var hp = MAX_HP, monsterHp = 0, combo = 0, maxCombo = 0, correctCount = 0, earnedXp = 0, earnedFood = 0, roundLocked = false;
  var curLevel = 0, lastStars = 0, QUESTIONS_PER_LEVEL = 5;
  var wrongMode = false, lastWrongMode = false, battleWrongIdx = [];
  /* 多模式状态 */
  var gameMode = 'adventure', curMode = 'adventure';
  var freeMode = false, lastFreeMode = '';
  var judgeAnswer = '', judgeIsTrue = false, speedStart = 0;
  var mentalInput = '', spellInput = '', spellCn = '';
  var spellLower = true; // 字母键盘默认小写
  var flashMode = false, lastWasFlash = false, flashDeck = [], flashIdx = 0, flashKnown = 0, flashRevealed = false;
  /* 专项训练状态 */
  var dailyMode = '', dailyIsReview = false, dailyReport = null;
  var roundTimes = [], roundOk = [], qStartTs = 0;
  var mentalCount = 20, wordCount = 10;
  /* 词库顺序闯关（人教版 3~9 年级） */
  var libWordMode = false, wordLibGrade = 3;
  var MODES = [
    { id: 'adventure', name: '⚔️ 闯关选择' },
    { id: 'judge', name: '⚖️ 判对错' },
    { id: 'flashcard', name: '🃏 闪卡记忆' },
    { id: 'mental', name: '🔢 口算输入', subjects: ['math', 'physics'] },
    { id: 'spelling', name: '🔤 单词拼写', subjects: ['english'] }
  ];
  function modesFor(subjectId) {
    return MODES.filter(function (m) { return !m.subjects || m.subjects.indexOf(subjectId) !== -1; });
  }
  function modeName(id) {
    var m = MODES.filter(function (x) { return x.id === id; })[0];
    return m ? m.name : id;
  }
  function renderModeBar() {
    var el = $('modeBar');
    if (!el || !curSubject) return;
    el.innerHTML = '';
    modesFor(curSubject).forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'mode-chip' + (curMode === m.id ? ' active' : '');
      b.textContent = m.name;
      b.addEventListener('click', function () {
        SFX.click();
        curMode = m.id;
        if (m.id === 'flashcard') { startFlash(); return; }
        if (m.id === 'mental') { startMental(); return; }
        if (m.id === 'spelling') { startSpelling(); return; }
        renderLevelMap();
      });
      el.appendChild(b);
    });
  }
  /* 口算：数值题池（选项全部为数字） */
  function numericPool(subjectId, grade) {
    return gradeQuestions(subjectId, grade).filter(function (q) {
      return q.o.every(function (o) { return /^-?\d+(\.\d+)?$/.test(o); });
    });
  }
  /* 拼写：英语“中文→英文”题池 */
  function spellingPool(grade) {
    return (BANK.english || []).filter(function (q) {
      return q.g.indexOf(grade) !== -1 && q.q.indexOf('的英文是？') !== -1;
    });
  }
  function startMental() {
    var pool = shuffle(numericPool(curSubject, curGrade)).slice(0, 10);
    if (pool.length < 4) { toast('该年级口算题不足'); return; }
    setHash('mental/' + curSubject + '/g' + curGrade);
    freeMode = true; lastFreeMode = 'mental'; lastWasFlash = false; lastWrongMode = false;
    gameMode = 'mental'; wrongMode = false; battleWrongIdx = [];
    curLevel = 0;
    curQuestions = pool;
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    var s = SUBJECTS.filter(function (x) { return x.id === curSubject; })[0];
    $('battleTitle').textContent = '🔢 ' + s.name + ' 口算挑战';
    $('battleSub').textContent = '直接输入答案 · 共 ' + curQuestions.length + ' 题';
    renderBattlePet();
    renderBattle();
  }
  function startSpelling() {
    var pool = shuffle(spellingPool(curGrade)).slice(0, 10);
    if (pool.length < 4) { toast('该年级暂无拼写单词'); return; }
    setHash('spelling/' + curSubject + '/g' + curGrade);
    freeMode = true; lastFreeMode = 'spelling'; lastWasFlash = false; lastWrongMode = false;
    gameMode = 'spelling'; wrongMode = false; battleWrongIdx = []; spellLower = true;
    curLevel = 0;
    curQuestions = pool;
    SFX.start();
    curIndex = 0; hp = MAX_HP; combo = 0; maxCombo = 0; correctCount = 0; earnedXp = 0;
    monsterHp = curQuestions.length;
    showScreen('battle');
    $('battleTitle').textContent = '🔤 单词拼写挑战';
    $('battleSub').textContent = '看中文，用键盘拼出英文 · 共 ' + curQuestions.length + ' 题';
    renderBattlePet();
    renderBattle();
  }
  function startFlash() {
    var deck = shuffle(gradeQuestions(curSubject, curGrade)).slice(0, 10);
    if (!deck.length) { toast('该年级暂无闪卡题目'); return; }
    setHash('flash/' + curSubject + '/g' + curGrade);
    freeMode = false; flashMode = true; lastWasFlash = true; lastFreeMode = '';
    flashDeck = deck; flashIdx = 0; flashKnown = 0; flashRevealed = false;
    earnedXp = 0;
    SFX.start();
    showScreen('battle');
    $('battleTitle').textContent = '🃏 闪卡记忆';
    $('battleSub').textContent = '心里想好答案，再翻开核对 · 共 ' + deck.length + ' 张';
    renderBattlePet();
    renderFlash();
  }
  function renderFlash() {
    $('hearts').textContent = '🃏 ' + (flashIdx + 1) + ' / ' + flashDeck.length;
    $('monsterHpFill').parentNode.style.display = 'none'; // 闪卡无战斗，隐藏怪物血条
    $('vsMark').style.display = 'none';
    $('monsterEmoji').textContent = '🦉';
    $('monsterEmoji').className = 'monster';
    renderDots();
    var q = flashDeck[flashIdx];
    $('qText').textContent = q.q;
    $('answerDisplay').className = 'answer-display hidden';
    var optEl = $('options'); optEl.innerHTML = '';
    var flip = document.createElement('button');
    flip.className = 'option flash-flip';
    flip.innerHTML = '<span>👆 想好了？点击翻开答案</span>';
    flip.addEventListener('click', flipCard);
    optEl.appendChild(flip);
    $('explain').className = 'explain'; $('explain').innerHTML = '';
    $('nextBtn').className = 'btn next-btn';
    roundLocked = false;
    flashRevealed = false;
    flashRevealed = false;
    $('comboBadge').className = 'combo-badge';
    if (curGrade <= 2) setTimeout(function () { TTS.speak(q.q, 0.85); }, 400);
  }
  function flipCard() {
    if (flashRevealed || roundLocked) return;
    flashRevealed = true;
    roundLocked = true;
    var q = flashDeck[flashIdx];
    var optEl = $('options'); optEl.innerHTML = '';
    var ans = document.createElement('div');
    ans.className = 'flash-answer';
    ans.textContent = '💡 ' + q.o[q.a];
    optEl.appendChild(ans);
    var yes = document.createElement('button');
    yes.className = 'option correct';
    yes.innerHTML = '<span>😊 我会了</span>';
    yes.addEventListener('click', function () { rateFlash(true); });
    var no = document.createElement('button');
    no.className = 'option wrong';
    no.innerHTML = '<span>🤔 还不会</span>';
    no.addEventListener('click', function () { rateFlash(false); });
    optEl.appendChild(yes); optEl.appendChild(no);
    $('explain').innerHTML = '<b>解析：</b>' + (q.e || '');
    $('explain').className = 'explain show';
    TTS.speak('答案是：' + q.o[q.a], 0.9);
    burstAtEl(ans, ['💡', '✨']);
  }
  function rateFlash(know) {
    roundLocked = false;
    if (know) { flashKnown++; earnedXp += 5; save.totalCorrect++; SFX.correct(); flashKnownStars(); }
    else { addToWrongBook(curSubject, curGrade, flashDeck[flashIdx]); SFX.wrong(); }
    flashIdx++;
    updateTopbar();
    if (flashIdx >= flashDeck.length) finishFlash();
    else renderFlash();
  }
  function flashKnownStars() { /* 闪卡掌握不加星星，避免刷星 */ }

