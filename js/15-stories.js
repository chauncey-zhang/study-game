'use strict';

/* ===================== 故事乐园（分类浏览 / 朗读 / 收藏 / 今日故事 / 成就） ===================== */
var STORIES = window.__STORIES__ || { cats: [], list: [] };
var storyTab = 'all';              // 当前 tab：all / bedtime / fairy / ... / favs
var storyCurrent = null;           // 当前打开的故事 id
var storyPlaying = false;          // 是否正在朗读
var STORY_FAV_KEY = 'story-favs';
var storyFavs = [];
try { storyFavs = JSON.parse(localStorage.getItem(STORY_FAV_KEY) || '[]'); } catch (e) { storyFavs = []; }

function storyFind(id) {
  for (var i = 0; i < STORIES.list.length; i++) if (STORIES.list[i].id === id) return STORIES.list[i];
  return null;
}
function storyCatName(catId) {
  for (var i = 0; i < STORIES.cats.length; i++) if (STORIES.cats[i].id === catId) return STORIES.cats[i].icon + ' ' + STORIES.cats[i].name;
  return '';
}
function isStoryFav(id) { return storyFavs.indexOf(id) !== -1; }
function toggleStoryFav(id) {
  var i = storyFavs.indexOf(id);
  if (i === -1) storyFavs.push(id); else storyFavs.splice(i, 1);
  try { localStorage.setItem(STORY_FAV_KEY, JSON.stringify(storyFavs)); } catch (e) {}
}
function storyGroup() {
  if (storyTab === 'all') return STORIES.list;
  if (storyTab === 'favs') return STORIES.list.filter(function (s) { return isStoryFav(s.id); });
  return STORIES.list.filter(function (s) { return s.cat === storyTab; });
}

/* ===================== 主页 ===================== */
function showStories() {
  setHash('stories');
  renderStoryDaily();
  renderStoryTabs();
  renderStoryList();
  showScreen('storiesHub');
  focusFirstNav($('storiesHubScreen'));
}
function renderStoryDaily() {
  if (!STORIES.list.length) { $('storyDaily').innerHTML = ''; return; }
  var d = new Date();
  var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  var s = STORIES.list[seed % STORIES.list.length];
  $('storyDaily').innerHTML = '<div class="w-daily-icon">🌙</div>' +
    '<div class="w-daily-body"><div class="w-daily-label">今日故事</div>' +
    '<div class="w-daily-text">' + s.title + ' · ' + storyCatName(s.cat) + '</div></div>' +
    '<button class="w-speak story-say" data-id="' + s.id + '">🔊</button>';
}
function renderStoryTabs() {
  var tabs = [{ id: 'all', icon: '📚', name: '全部 (' + STORIES.list.length + ')' }];
  STORIES.cats.forEach(function (c) {
    var n = STORIES.list.filter(function (s) { return s.cat === c.id; }).length;
    tabs.push({ id: c.id, icon: c.icon, name: c.name + ' (' + n + ')' });
  });
  tabs.push({ id: 'favs', icon: '⭐', name: '我的收藏' });
  var el = $('storyTabs'); el.innerHTML = '';
  tabs.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'writing-tab' + (storyTab === t.id ? ' active' : '');
    b.textContent = t.icon + ' ' + t.name;
    b.addEventListener('click', function () {
      SFX.click();
      storyTab = t.id;
      renderStoryTabs();
      renderStoryList();
      focusFirstNav($('storiesHubScreen'));
    });
    el.appendChild(b);
  });
}
function storyPreview(text) {
  return text.length > 42 ? text.slice(0, 42) + '…' : text;
}
function storyFavHtml(id) {
  var on = isStoryFav(id);
  return '<button class="w-fav' + (on ? ' active' : '') + '" data-fav="' + id + '">' + (on ? '⭐' : '☆') + '</button>';
}
function renderStoryList() {
  var el = $('storyList');
  var group = storyGroup();
  var html = '';
  if (!group.length) { html = '<div class="hub-card">' + (storyTab === 'favs' ? '还没有收藏～ 点故事卡片右上角的 ☆ 就能收藏喜欢的故事啦！' : '这个分类还没有故事') + '</div>'; }
  group.forEach(function (s) {
    html += '<div class="story-item" data-id="' + s.id + '">' + storyFavHtml(s.id) +
      '<div class="story-item-head"><b>' + s.title + '</b><span class="w-tag">' + storyCatName(s.cat) + '</span></div>' +
      '<div class="story-item-preview">' + storyPreview(s.text) + '</div>' +
      '<button class="w-speak story-say" data-id="' + s.id + '">🔊</button></div>';
  });
  el.innerHTML = html;
  /* 事件：点卡片打开 / 朗读 / 收藏 */
  Array.prototype.forEach.call(el.querySelectorAll('.story-item'), function (card) {
    card.addEventListener('click', function (e) {
      if (e.target && e.target.closest && (e.target.closest('.story-say') || e.target.closest('.w-fav'))) return;
      SFX.click();
      openStory(card.getAttribute('data-id'));
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll('.story-say'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      speakStoryById(btn.getAttribute('data-id'));
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll('.w-fav'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      SFX.click();
      toggleStoryFav(btn.getAttribute('data-fav'));
      renderStoryList();
    });
  });
  var body = $('storiesHubScreen').querySelector('.hub-body');
  if (body) body.scrollTop = 0;
}

/* ===================== 详情弹窗 + 朗读 ===================== */
function openStory(id) {
  var s = storyFind(id);
  if (!s) return;
  storyCurrent = id;
  stopStorySpeak();
  $('storyTitle').textContent = s.title;
  $('storyCat').textContent = storyCatName(s.cat);
  $('storyText').textContent = s.text;
  $('storyFav').textContent = isStoryFav(id) ? '⭐ 已收藏' : '☆ 收藏';
  $('storyPlay').textContent = '🔊 朗读';
  $('storyModal').className = 'modal-mask show';
  recordStoryHeard(id);
  $('storyPlay').focus();
}
function closeStory() {
  SFX.click();
  stopStorySpeak();
  storyCurrent = null;
  $('storyModal').className = 'modal-mask';
}
function speakStoryById(id) {
  var s = storyFind(id);
  if (!s) return;
  var isEn = s.cat === 'english';
  /* 标题单独一句，正文舒缓朗读（逐句停顿）；英语故事走 en-US 舒缓模式 */
  var sep = isEn ? '. ' : '。';
  TTS.speakStory(s.title + sep + s.text, function () {
    storyPlaying = false;
    var btn = $('storyPlay');
    if (btn) btn.textContent = '🔊 朗读';
  }, isEn ? 'en-US' : 'zh-CN');
  storyPlaying = true;
  var btn = $('storyPlay');
  if (btn) btn.textContent = '⏹ 停止';
}
function stopStorySpeak() {
  TTS.stop();
  storyPlaying = false;
  var btn = $('storyPlay');
  if (btn) btn.textContent = '🔊 朗读';
}
function storyNav(dir) {
  var group = storyGroup();
  var idx = -1, i;
  for (i = 0; i < group.length; i++) if (group[i].id === storyCurrent) { idx = i; break; }
  var nidx = idx + dir;
  if (nidx < 0 || nidx >= group.length) { SFX.click(); return; }
  SFX.click();
  openStory(group[nidx].id);
}
/* 记录已听（驱动成就：story1 / story10 / story30 / story7） */
function recordStoryHeard(id) {
  if (!save.storyHeard) save.storyHeard = [];
  if (save.storyHeard.indexOf(id) !== -1) return;
  save.storyHeard.push(id);
  var dk = todayStr(0);
  if (!save.storyLog) save.storyLog = {};
  if (!save.storyLog[dk]) {
    save.storyLog[dk] = 1;
    save.storyStreak = (save.storyLast === todayStr(-1)) ? ((save.storyStreak || 0) + 1) : 1;
    save.storyLast = dk;
  }
  persist();
  unlockBadges();
}

/* ===================== 事件绑定 ===================== */
$('storiesBtn').addEventListener('click', function () { SFX.click(); showStories(); });
$('storiesBack').addEventListener('click', goHome);
$('storyClose').addEventListener('click', closeStory);
$('storyPlay').addEventListener('click', function () {
  SFX.click();
  if (!storyCurrent) return;
  if (storyPlaying) stopStorySpeak();
  else speakStoryById(storyCurrent);
});
$('storyFav').addEventListener('click', function () {
  SFX.click();
  if (!storyCurrent) return;
  toggleStoryFav(storyCurrent);
  $('storyFav').textContent = isStoryFav(storyCurrent) ? '⭐ 已收藏' : '☆ 收藏';
});
$('storyPrev').addEventListener('click', function () { storyNav(-1); });
$('storyNext').addEventListener('click', function () { storyNav(1); });
/* 今日故事朗读 */
$('storyDaily').addEventListener('click', function (e) {
  var btn = e.target && e.target.closest ? e.target.closest('.story-say') : null;
  if (!btn) return;
  SFX.click();
  speakStoryById(btn.getAttribute('data-id'));
});