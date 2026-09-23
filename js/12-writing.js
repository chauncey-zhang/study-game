'use strict';

/* ===================== 作文专区（写作技巧 / 美词美句 / 常用谚语 + 收藏 + 今日好句） ===================== */
var WRITING = window.__WRITING__ || { tips: [], beauty: [], proverbs: [] };
var writingTab = 'tips'; // 当前 tab：tips / beauty / proverbs / favs
var FAV_KEY = 'writing-favs';
var writingFavs = [];
try { writingFavs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { writingFavs = []; }

function isFav(id) { return writingFavs.indexOf(id) !== -1; }
function toggleFav(id) {
  var i = writingFavs.indexOf(id);
  if (i === -1) writingFavs.push(id); else writingFavs.splice(i, 1);
  try { localStorage.setItem(FAV_KEY, JSON.stringify(writingFavs)); } catch (e) {}
}
function favBtnHtml(id) {
  var on = isFav(id);
  return '<button class="w-fav' + (on ? ' active' : '') + '" data-fav="' + id + '">' + (on ? '⭐' : '☆') + '</button>';
}

function showWriting() {
  setHash('writing');
  renderWritingDaily();
  renderWritingTabs();
  renderWritingList();
  showScreen('writingHub');
  focusFirstNav($('writingHubScreen'));
}
function renderWritingDaily() {
  var all = [];
  WRITING.beauty.forEach(function (cat) { cat.items.forEach(function (it) { all.push(it.text); }); });
  if (!all.length) { $('wDaily').innerHTML = ''; return; }
  var d = new Date();
  var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  $('wDaily').innerHTML = '<div class="w-daily-icon">🌟</div><div class="w-daily-body"><div class="w-daily-label">今日好句</div><div class="w-daily-text">' + all[seed % all.length] + '</div></div>';
}
function renderWritingTabs() {
  var tabs = [
    { id: 'tips', icon: '💡', name: '写作技巧' },
    { id: 'beauty', icon: '🌸', name: '美词美句' },
    { id: 'proverbs', icon: '📜', name: '常用谚语' },
    { id: 'favs', icon: '⭐', name: '我的收藏' }
  ];
  var el = $('writingTabs'); el.innerHTML = '';
  tabs.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'writing-tab' + (writingTab === t.id ? ' active' : '');
    b.textContent = t.icon + ' ' + t.name;
    b.addEventListener('click', function () {
      SFX.click();
      writingTab = t.id;
      renderWritingTabs();
      renderWritingList();
      focusFirstNav($('writingHubScreen'));
    });
    el.appendChild(b);
  });
}
function renderWritingList() {
  var el = $('writingList');
  el.innerHTML = '';
  if (writingTab === 'tips') renderTips(el);
  else if (writingTab === 'beauty') renderBeauty(el);
  else if (writingTab === 'proverbs') renderProverbs(el);
  else renderFavs(el);
  var body = $('writingHubScreen').querySelector('.hub-body');
  if (body) body.scrollTop = 0;
}
function renderTips(el) {
  var html = '';
  WRITING.tips.forEach(function (t) {
    html += '<div class="w-card">' + favBtnHtml(t.id) +
      '<div class="w-head"><span class="w-icon">' + t.icon + '</span><b>' + t.title + '</b><span class="w-tag">' + t.tag + '</span>' +
      '<button class="w-speak" data-t="tips" data-i="' + t.id + '">🔊</button></div>' +
      '<div class="w-explain">' + t.explain + '</div>' +
      '<div class="w-example">' + t.example.replace(/\n/g, '<br>') + '</div>' +
      '<div class="w-tip">💡 ' + t.tip + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}
function renderBeauty(el) {
  var html = '';
  WRITING.beauty.forEach(function (cat, ci) {
    html += '<div class="w-cat-title">' + cat.icon + ' ' + cat.cat + '</div>';
    cat.items.forEach(function (it, ii) {
      html += '<div class="w-item">' + favBtnHtml('b-' + ci + '-' + ii) +
        '<div class="w-item-text">' + it.text + '</div>' +
        '<div class="w-item-note">' + it.note + '</div>' +
        '<button class="w-speak" data-t="beauty" data-ci="' + ci + '" data-ii="' + ii + '">🔊</button>' +
        '</div>';
    });
  });
  el.innerHTML = html;
}
function renderProverbs(el) {
  var html = '';
  WRITING.proverbs.forEach(function (cat, ci) {
    html += '<div class="w-cat-title">' + cat.icon + ' ' + cat.cat + '</div>';
    cat.items.forEach(function (it, ii) {
      html += '<div class="w-item">' + favBtnHtml('p-' + ci + '-' + ii) +
        '<div class="w-item-text w-prov">' + it.text + '</div>' +
        '<div class="w-item-mean">💬 ' + it.meaning + '</div>' +
        '<div class="w-item-note">📝 ' + it.example + '</div>' +
        '<button class="w-speak" data-t="proverbs" data-ci="' + ci + '" data-ii="' + ii + '">🔊</button>' +
        '</div>';
    });
  });
  el.innerHTML = html;
}
function renderFavs(el) {
  var html = '', has = false;
  WRITING.tips.forEach(function (t) {
    if (!isFav(t.id)) return;
    has = true;
    html += '<div class="w-card">' + favBtnHtml(t.id) +
      '<div class="w-head"><span class="w-icon">' + t.icon + '</span><b>' + t.title + '</b><span class="w-tag">写作技巧</span>' +
      '<button class="w-speak" data-t="tips" data-i="' + t.id + '">🔊</button></div>' +
      '<div class="w-explain">' + t.explain + '</div>' +
      '<div class="w-tip">💡 ' + t.tip + '</div>' +
      '</div>';
  });
  WRITING.beauty.forEach(function (cat, ci) {
    cat.items.forEach(function (it, ii) {
      if (!isFav('b-' + ci + '-' + ii)) return;
      has = true;
      html += '<div class="w-item">' + favBtnHtml('b-' + ci + '-' + ii) +
        '<div class="w-item-text">' + it.text + '</div>' +
        '<div class="w-item-note">' + it.note + ' · ' + cat.cat + '</div>' +
        '<button class="w-speak" data-t="beauty" data-ci="' + ci + '" data-ii="' + ii + '">🔊</button>' +
        '</div>';
    });
  });
  WRITING.proverbs.forEach(function (cat, ci) {
    cat.items.forEach(function (it, ii) {
      if (!isFav('p-' + ci + '-' + ii)) return;
      has = true;
      html += '<div class="w-item">' + favBtnHtml('p-' + ci + '-' + ii) +
        '<div class="w-item-text w-prov">' + it.text + '</div>' +
        '<div class="w-item-mean">💬 ' + it.meaning + '</div>' +
        '<button class="w-speak" data-t="proverbs" data-ci="' + ci + '" data-ii="' + ii + '">🔊</button>' +
        '</div>';
    });
  });
  if (!has) html = '<div class="hub-card">还没有收藏～ 点任意卡片右上角的 ☆ 就能收藏喜欢的内容啦！</div>';
  el.innerHTML = html;
}

// 事件委托：语音朗读 + 收藏
$('writingList').addEventListener('click', function (e) {
  var target = e.target;
  var speakBtn = target && target.closest ? target.closest('.w-speak') : null;
  var favBtn = target && target.closest ? target.closest('.w-fav') : null;
  if (favBtn) {
    SFX.click();
    toggleFav(favBtn.getAttribute('data-fav'));
    if (writingTab === 'favs') renderWritingList(); else renderWritingList();
    return;
  }
  if (!speakBtn) return;
  SFX.click();
  var t = speakBtn.getAttribute('data-t');
  var i = speakBtn.getAttribute('data-i');
  var ci = parseInt(speakBtn.getAttribute('data-ci'), 10);
  var ii = parseInt(speakBtn.getAttribute('data-ii'), 10);
  var text = '';
  if (t === 'tips') {
    var tip = WRITING.tips.filter(function (x) { return x.id === i; })[0];
    if (tip) text = tip.title + '。' + tip.explain + '。' + tip.tip;
  } else if (t === 'beauty' && WRITING.beauty[ci] && WRITING.beauty[ci].items[ii]) {
    text = WRITING.beauty[ci].items[ii].text;
  } else if (t === 'proverbs' && WRITING.proverbs[ci] && WRITING.proverbs[ci].items[ii]) {
    var pv = WRITING.proverbs[ci].items[ii];
    text = pv.text + '。' + pv.meaning;
  }
  if (text) TTS.speak(text, 0.9);
});

// 入口与返回
$('writingBtn').addEventListener('click', function () { SFX.click(); showWriting(); });
$('writingBack').addEventListener('click', goHome);
