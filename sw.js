/* ===================== Service Worker（离线缓存，移动端更接近原生应用） =====================
 * 缓存优先 + 运行时动态缓存：首次访问缓存核心文件，后续资源按需缓存，离线也能玩 */
var CACHE = 'study-game-v5';

self.addEventListener('install', function (e) {
  self.skipWaiting(); // 新版本立即激活，免去 waiting 期，缓存策略改动即时生效
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll([
        './',
        './index.html',
        './css/style.css',
        './manifest.json',
        './icon.svg',
        './js/01-core.js',
        './js/02-classics.js',
        './js/03-basic.js',
        './js/04-pet.js',
        './js/04b-backup.js',
        './js/05-training.js',
        './js/06-think.js',
        './js/07-level.js',
        './js/08-route.js',
        './js/09-tv.js',
        './js/10-init.js',
        './js/11-anti.js',
        './js/12-writing.js',
        './js/13-pinyin.js',
        './js/14-phonics.js',
        './js/15-stories.js',
        './js/16-grammar.js',
        './data/chinese.js',
        './data/math.js',
        './data/english.js',
        './data/physics.js',
        './data/chemistry.js',
        './data/biology.js',
        './data/geography.js',
        './data/history.js',
        './data/politics.js',
        './data/generated.js',
        './data/words-pep.js',
        './data/classics.js',
        './data/classics-chs.js',
        './data/think.js',
        './data/writing.js',
        './data/pinyin.js',
        './data/phonics.js',
        './data/stories.js',
        './data/stories-bedtime-a.js',
        './data/stories-bedtime-b.js',
        './data/stories-fairy-a.js',
        './data/stories-fairy-b.js',
        './data/stories-fable-a.js',
        './data/stories-fable-b.js',
        './data/stories-idiom-a.js',
        './data/stories-idiom-b.js',
        './data/stories-idiom-c.js',
        './data/stories-myth-a.js',
        './data/stories-myth-b.js',
        './data/stories-folk-a.js',
        './data/stories-folk-b.js',
        './data/stories-science-a.js',
        './data/stories-science-b.js',
        './data/stories-english-a.js',
        './data/stories-english-b.js',
        './data/grammar.js',
        './data/grammar-word.js',
        './data/grammar-tense.js',
        './data/grammar-sentence.js',
        './data/grammar-rule.js',
        './data/games.js',
        './js/17-games.js',
        './js/games/01-strategy.js',
        './js/games/02-number.js',
        './js/games/03-eliminate.js',
        './js/games/04-react.js',
        './js/games/05-path.js',
        './js/games/06-observe.js',
        './js/18-shop.js'
      ]);
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var req = e.request;
  /* 入口页（index.html）：网络优先，保证升级后尽快看到新版本 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }
  /* 静态资源（js/css/data/图片）：缓存优先 + 后台更新
   * ——首屏从缓存秒开，离线可玩；后台静默拉取最新版本写入缓存，
   * 既消除弱网下"每次刷新都走网络"的卡顿，又能随版本升级自动更新。 */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
