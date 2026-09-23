'use strict';
/* ===================== 积分商店（金币兑换装扮/头像框/主题皮肤） =====================
 * 金币来源：玩休闲游戏（每局 +2，刷新最佳 +5）
 * 商品分 3 类：hat=宠物装扮  frame=头像框  theme=主题皮肤
 * 存档字段：save.coins / save.cosmetics(已拥有) / save.activeHat / activeFrame / activeTheme
 */

var SHOP_ITEMS = [
  /* 宠物装扮（帽子） */
  { id: 'hat-bow', cat: 'hat', icon: '🎀', name: '蝴蝶结', price: 80, desc: '给出战宠物戴上蝴蝶结' },
  { id: 'hat-cap', cat: 'hat', icon: '🧢', name: '棒球帽', price: 100, desc: '运动风棒球帽' },
  { id: 'hat-glasses', cat: 'hat', icon: '🕶️', name: '墨镜', price: 120, desc: '酷酷的墨镜' },
  { id: 'hat-top', cat: 'hat', icon: '🎩', name: '礼帽', price: 150, desc: '绅士礼帽' },
  { id: 'hat-grad', cat: 'hat', icon: '🎓', name: '学士帽', price: 200, desc: '学霸学士帽' },
  { id: 'hat-crown', cat: 'hat', icon: '👑', name: '皇冠', price: 400, desc: '王者皇冠' },
  /* 头像框 */
  { id: 'frame-star', cat: 'frame', icon: '⭐', name: '星星框', price: 100, desc: '金色星星头像框' },
  { id: 'frame-rainbow', cat: 'frame', icon: '🌈', name: '彩虹框', price: 250, desc: '七彩彩虹头像框' },
  { id: 'frame-fire', cat: 'frame', icon: '🔥', name: '火焰框', price: 300, desc: '炽热火焰头像框' },
  { id: 'frame-diamond', cat: 'frame', icon: '💎', name: '钻石框', price: 500, desc: '闪耀钻石头像框' },
  /* 主题皮肤 */
  { id: 'theme-ocean', cat: 'theme', icon: '🌊', name: '海洋蓝', price: 200, desc: '清新海洋主题' },
  { id: 'theme-sakura', cat: 'theme', icon: '🌸', name: '樱花粉', price: 200, desc: '浪漫樱花主题' },
  { id: 'theme-forest', cat: 'theme', icon: '🌿', name: '森林绿', price: 300, desc: '自然森林主题' },
  { id: 'theme-sunset', cat: 'theme', icon: '☀️', name: '阳光橙', price: 250, desc: '温暖阳光主题' },
  { id: 'theme-galaxy', cat: 'theme', icon: '🌙', name: '星空紫', price: 400, desc: '梦幻星空主题' }
];

function shopItem(id) { for (var i = 0; i < SHOP_ITEMS.length; i++) if (SHOP_ITEMS[i].id === id) return SHOP_ITEMS[i]; return null; }
function shopOwned(id) { return !!(save.cosmetics && save.cosmetics[id]); }
function shopActiveKey(item) {
  if (item.cat === 'hat') return 'activeHat';
  if (item.cat === 'frame') return 'activeFrame';
  return 'activeTheme';
}
function shopIsActive(item) { return save[shopActiveKey(item)] === item.id; }

/* 应用装扮到界面（body class 驱动主题与头像框；帽子在渲染时叠加） */
function applyCosmetics() {
  var cls = document.body.className.split(/\s+/).filter(function (c) { return c.indexOf('theme-') !== 0 && c.indexOf('frame-') !== 0; });
  if (save.activeTheme) cls.push(save.activeTheme);
  if (save.activeFrame) cls.push(save.activeFrame);
  document.body.className = cls.join(' ');
}

/* 出战宠物图标叠加帽子 */
function petIconWithHat(p) {
  if (!p) return '';
  var icon = p.icon;
  if (save.activeHat && shopOwned(save.activeHat)) {
    var item = shopItem(save.activeHat);
    if (item) icon += '<span class="pet-hat">' + item.icon + '</span>';
  }
  return icon;
}

function renderShop() {
  $('shopCoin').textContent = save.coins || 0;
  var cats = [
    { id: 'hat', name: '🎩 宠物装扮', tip: '戴在出战宠物头上' },
    { id: 'frame', name: '🖼️ 头像框', tip: '装饰顶栏头像' },
    { id: 'theme', name: '🎨 主题皮肤', tip: '切换全屏配色' }
  ];
  var wrap = $('shopList');
  wrap.innerHTML = '';
  cats.forEach(function (cat) {
    var sec = document.createElement('div');
    sec.className = 'shop-sec';
    sec.innerHTML = '<div class="shop-sec-title">' + cat.name + '<small>' + cat.tip + '</small></div>';
    var grid = document.createElement('div');
    grid.className = 'shop-grid';
    SHOP_ITEMS.filter(function (s) { return s.cat === cat.id; }).forEach(function (item) {
      var owned = shopOwned(item.id);
      var active = shopIsActive(item);
      var b = document.createElement('button');
      b.className = 'shop-item' + (owned ? ' owned' : '') + (active ? ' active' : '');
      b.innerHTML =
        '<div class="shop-item-icon">' + item.icon + '</div>' +
        '<div class="shop-item-name">' + item.name + '</div>' +
        '<div class="shop-item-desc">' + item.desc + '</div>' +
        '<div class="shop-item-foot">' + (owned ? (active ? '✅ 使用中' : '▶ 使用') : '🪙 ' + item.price) + '</div>';
      b.addEventListener('click', function () { shopClick(item); });
      grid.appendChild(b);
    });
    sec.appendChild(grid);
    wrap.appendChild(sec);
  });
}

function shopClick(item) {
  if (!shopOwned(item.id)) {
    // 购买
    if ((save.coins || 0) < item.price) {
      toast('🪙 金币不足，去玩休闲游戏赚金币吧');
      SFX.wrong();
      return;
    }
    save.coins -= item.price;
    if (!save.cosmetics) save.cosmetics = {};
    save.cosmetics[item.id] = true;
    SFX.coin();
    toast('🎉 购买成功：' + item.icon + ' ' + item.name);
    // 购买后自动启用
    save[shopActiveKey(item)] = item.id;
  } else {
    // 已拥有：切换启用/停用
    var key = shopActiveKey(item);
    if (save[key] === item.id) { save[key] = ''; SFX.click(); toast('已停用 ' + item.name); }
    else { save[key] = item.id; SFX.select(); toast('已启用 ' + item.icon + ' ' + item.name); }
  }
  persist();
  applyCosmetics();
  updateTopbar();
  renderShop();
  if (save.activeHat) renderPetModal(); // 帽子变化刷新宠物
}

function showShop() {
  SFX.click();
  renderShop();
  applyCosmetics();
  $('shopModal').className = 'modal-mask show';
  $('shopClose').focus();
}

$('shopBtn').addEventListener('click', showShop);
$('shopClose').addEventListener('click', function () { SFX.click(); $('shopModal').className = 'modal-mask'; $('shopBtn').focus(); });
