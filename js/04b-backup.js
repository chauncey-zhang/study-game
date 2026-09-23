'use strict';
/* ===================== 自动备份 + 防清缓存保护 =====================
 * 目标：孩子零操作自动备份学习进度；即使浏览器/电视盒清缓存，进度也能找回。
 * 三层防线：
 *  A. 自动下载备份文件到浏览器「下载目录」（全兼容 Chrome 69+，TV 可用）
 *  B. localStorage 备份槽（与主档不同 key，清缓存时概率性幸存）
 *  C. IndexedDB 每日快照（与 localStorage 清除策略不同步，常能幸存）+ 内存快照
 * 外加：关闭前确认框 + 下次打开强制备份门槛（家长可关闭，默认开）。
 * 完全复用现有备份/还原格式（v2：{ app, v, user, save, t }），与 js/09-tv.js 互通。
 * 注意：本文件加载于 js/04-pet.js 之前，内部不得在初始化阶段依赖 04-pet 的全局
 * 函数/变量（$、save、persist 等），仅在函数体内（调用时）引用。
 * ==================================================================== */

(function () {
  /* 本地 DOM 简写（不依赖 04-pet.js 的 $） */
  function bk$(id) { return document.getElementById(id); }

  /* ===================== 常量与状态 ===================== */
  var LS_BACKUP_KEY = 'study-adventure-backup-v1';   // localStorage 备份槽
  var LS_BACKUP_KEY2 = 'study-adventure-backup-v2';  // 备份槽双写（防单 key 被清）
  var DB_NAME = 'study-adventure-backup';
  var DB_VER = 1;
  var DB_STORE = 'snapshots';
  var LAST_DL_KEY = 'study-adventure-last-dl';       // 上次自动下载日期（YYYY-M-D）
  var PENDING_KEY = 'study-adventure-pending-backup';// 关闭时未备份标记（1 = 下次打开需处理）
  var FORCE_KEY = 'study-adventure-force-backup';    // 家长开关：强制备份模式（'1'=开，默认开）
  var SKIP_KEY = 'study-adventure-skip-count';       // 连续跳过备份次数
  var MAX_KEEP = 7;                                  // IndexedDB 保留最近 7 天快照

  var memSnapshot = null;     // 内存快照（最后写入的完整备份）
  var lastPersistTs = 0;      // 最近一次 persist() 时刻（用于跨天判断）
  var lastDownTs = 0;         // 最近一次自动下载时刻（节流）
  var downTimer = null;
  var idbReady = false;       // IndexedDB 是否可用
  var restoredFrom = '';      // 本次启动恢复来源：'' / 'idb' / 'ls'

  /* ===================== 工具 ===================== */
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function getLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setLS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function delLS(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /* ===================== 备份快照组装（兼容现有 v2 格式） ===================== */
  function buildSnapshot() {
    /* 注意：loadUsers/getCurrentUser/save 均为 04-pet.js 全局，调用时已定义 */
    var snap = {
      app: 'study-adventure',
      v: 2,
      user: getCurrentUser() || '游客',
      save: save,
      users: loadUsers(),
      currentUser: getCurrentUser(),
      t: Date.now()
    };
    return snap;
  }

  /* ===================== localStorage 备份槽（同步，供 loadSave 内兜底） ===================== */
  function lsBackupSave(snap) {
    try {
      var j = JSON.stringify(snap);
      setLS(LS_BACKUP_KEY, j);
      setLS(LS_BACKUP_KEY2, j); // 双写，防单 key 丢失
    } catch (e) {}
  }
  function lsBackupLoad() {
    var raw = getLS(LS_BACKUP_KEY);
    if (!raw) raw = getLS(LS_BACKUP_KEY2);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  /* 供 04-pet.js loadSave() 调用：主档被清时同步取回游客档（不含用户档，用户档走 recoverIDB） */
  function loadLSSlot() {
    var ls = lsBackupLoad();
    if (ls && ls.save) return ls.save;
    return null;
  }

  /* ===================== IndexedDB ===================== */
  function idbOpen(cb) {
    if (!('indexedDB' in window)) { if (cb) cb(null); return null; }
    try {
      var req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { if (cb) cb(req.result); };
      req.onerror = function () { if (cb) cb(null); };
      return req;
    } catch (e) { if (cb) cb(null); return null; }
  }
  function idbPut(key, val) {
    if (!idbReady) return;
    idbOpen(function (db) {
      if (!db) return;
      try {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(val, key);
        tx.oncomplete = function () { try { db.close(); } catch (e) {} };
        tx.onerror = function () { try { db.close(); } catch (e) {} };
      } catch (e) { try { db.close(); } catch (e2) {} }
    });
  }
  function idbGet(key, cb) {
    if (!idbReady) { if (cb) cb(null); return; }
    idbOpen(function (db) {
      if (!db) { if (cb) cb(null); return; }
      try {
        var tx = db.transaction(DB_STORE, 'readonly');
        var g = tx.objectStore(DB_STORE).get(key);
        g.onsuccess = function () { try { db.close(); } catch (e) {}; if (cb) cb(g.result || null); };
        g.onerror = function () { try { db.close(); } catch (e) {}; if (cb) cb(null); };
      } catch (e) { try { db.close(); } catch (e2) {}; if (cb) cb(null); }
    });
  }
  function idbKeys(cb) {
    if (!idbReady) { if (cb) cb([]); return; }
    idbOpen(function (db) {
      if (!db) { if (cb) cb([]); return; }
      try {
        var tx = db.transaction(DB_STORE, 'readonly');
        var g = tx.objectStore(DB_STORE).getAllKeys();
        g.onsuccess = function () { try { db.close(); } catch (e) {}; if (cb) cb(g.result || []); };
        g.onerror = function () { try { db.close(); } catch (e) {}; if (cb) cb([]); };
      } catch (e) { try { db.close(); } catch (e2) {}; if (cb) cb([]); }
    });
  }
  function idbDel(key) {
    if (!idbReady) return;
    idbOpen(function (db) {
      if (!db) return;
      try {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(key);
        tx.oncomplete = function () { try { db.close(); } catch (e) {} };
        tx.onerror = function () { try { db.close(); } catch (e) {} };
      } catch (e) { try { db.close(); } catch (e2) {} }
    });
  }
  /* 保留最近 MAX_KEEP 天快照（key 形如 'day-YYYY-M-D'） */
  function idbPrune() {
    idbKeys(function (keys) {
      if (!keys || !keys.length) return;
      var days = keys.filter(function (k) { return typeof k === 'string' && k.indexOf('day-') === 0; });
      if (days.length <= MAX_KEEP) return;
      days.sort();
      var drop = days.length - MAX_KEEP;
      for (var i = 0; i < drop; i++) idbDel(days[i]);
    });
  }
  function idbInit() {
    if (!('indexedDB' in window)) { idbReady = false; return; }
    idbOpen(function (db) {
      idbReady = !!db;
      if (db) try { db.close(); } catch (e) {}
    });
  }

  /* ===================== 触发时机与节流 ===================== */
  /**
   * 核心入口：在 persist() 后调用。
   * - 内存快照：每次
   * - localStorage 备份槽 + IndexedDB 今日快照：跨天或距上次 ≥30 秒
   * - 自动下载：跨天每天 1 次（持久化日期防刷新/多开重复）
   */
  var lastLSCheck = 0;
  function autoBackupTick(forceDl) {
    try {
      var snap = buildSnapshot();
      memSnapshot = snap; // 内存快照永远最新

      var now = Date.now();
      var newDay = (lastPersistTs === 0) ? true : !sameDay(new Date(lastPersistTs), new Date(now));
      var due = newDay || (now - lastLSCheck >= 30000);
      if (due) {
        lastLSCheck = now;
        lsBackupSave(snap);          // B：localStorage 备份槽
        idbPut('day-' + todayKey(), snap); // C：IndexedDB 今日快照
        idbPrune();
      }
      lastPersistTs = now;

      /* 自动下载：跨天每天 1 次；forceDl=true（登录/切换/还原后）跳过节流立即下载 */
      var lastDlDay = getLS(LAST_DL_KEY) || '';
      if (forceDl || (lastDlDay !== todayKey() && (now - lastDownTs >= 60000))) {
        if (!downTimer) {
          downTimer = setTimeout(doAutoDownload, 1000); // 延迟避开结算高峰
        }
      }
    } catch (e) {}
  }

  /* ===================== 自动下载到浏览器下载目录 ===================== */
  function doAutoDownload() {
    downTimer = null;
    var now = Date.now();
    if (now - lastDownTs < 60000) return; // 60 秒节流
    try {
      var snap = buildSnapshot();
      var ts = new Date();
      var fname = '知识大冒险-备份-' +
        ts.getFullYear() + '-' + pad(ts.getMonth() + 1) + '-' + pad(ts.getDate()) + '-' +
        pad(ts.getHours()) + pad(ts.getMinutes()) + pad(ts.getSeconds()) + '.json';
      var blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 1000);
      lastDownTs = now;
      setLS(LAST_DL_KEY, todayKey());
      clearPending();
      if (typeof toast === 'function') toast('📁 已备份成功！文件在 Download 文件夹（文件管理可查看）');
    } catch (e) {}
  }

  /* ===================== 恢复逻辑 ===================== */
  /* 把快照写回主档 + 全局 save（游客档路径），返回是否成功 */
  function restoreFromSnapshot(snap) {
    if (!snap || !snap.save) return false;
    try {
      var d = defaultSave();
      var s = snap.save;
      for (var k in d) { if (!(k in s)) s[k] = d[k]; }
      save = s;
      /* 恢复多用户档案 + 当前用户（仅在备份里带 users 时） */
      if (snap.users && typeof snap.users === 'object' && Object.keys(snap.users).length) {
        try { localStorage.setItem(USERS_KEY, JSON.stringify(snap.users)); } catch (e) {}
      }
      if (snap.currentUser) {
        try { localStorage.setItem(CURRENT_KEY, snap.currentUser); } catch (e) {}
      }
      return true;
    } catch (e) { return false; }
  }

  /* 主档是否有效：游客 save 可解析 或 用户档非空（损坏/为空视为无主档） */
  function hasValidMain() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object' && Object.keys(o).length) return true;
      }
      var ur = localStorage.getItem(USERS_KEY);
      if (ur) {
        var u = JSON.parse(ur);
        if (u && typeof u === 'object' && Object.keys(u).length) return true;
      }
    } catch (e) {}
    return false;
  }
  /* 启动恢复入口（04-pet.js 在 save=loadSave() 后调用）： */
  function recoverSave() {
    /* 主档有效就不动 */
    if (hasValidMain()) return;

    /* 同步：ls 备份槽恢复 save（0 号路径） + users/currentUser（1 号路径） */
    var ls = lsBackupLoad();
    if (ls && ls.save) {
      if (restoreFromSnapshot(ls)) {
        restoredFrom = 'ls';
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} // 写回主档
        if (typeof refreshAll === 'function') refreshAll();
        if (typeof toast === 'function') toast('🔁 检测到进度被清理，已从本地备份自动恢复');
      }
    }
    /* 异步：IndexedDB 兜底（仅在 ls 也没有时） */
    var useIdb = !(ls && ls.save);
    if (!useIdb) return;
    idbKeys(function (keys) {
      if (!keys || !keys.length) return;
      var pending = keys.length, latest = null, latestT = 0;
      keys.forEach(function (k) {
        idbGet(k, function (v) {
          pending--;
          if (v && v.save && v.t && v.t > latestT) { latest = v; latestT = v.t; }
          if (pending > 0) return;
          if (!latest) return;
          if (restoreFromSnapshot(latest)) {
            restoredFrom = 'idb';
            try { persist(); } catch (e) {}          // 写回主档闭环
            if (typeof refreshAll === 'function') refreshAll(); // 重建界面
            if (typeof toast === 'function') toast('🔁 检测到缓存被清理，已自动恢复学习进度');
          }
        });
      });
    });
  }

  /* 立即同步一次备份（导入/还原成功后调用） */
  function syncBackupNow() {
    try { autoBackupTick(true); } catch (e) {}
  }

  /* ===================== 关闭前：静默保存 + 埋标记 + 确认框 ===================== */
  function onLeaving() {
    try { persist(); } catch (e) {}
    if (!isForceBackup()) return;
    var lastDlDay = getLS(LAST_DL_KEY) || '';
    if (lastDlDay !== todayKey()) markPending(); // 今天没自动下载过 → 埋标记
  }
  function bindBeforeUnload() {
    window.addEventListener('beforeunload', function (e) {
      try { onLeaving(); } catch (e2) {}
      if (!isForceBackup()) return;
      var lastDlDay = getLS(LAST_DL_KEY) || '';
      if (lastDlDay === todayKey()) return; // 今天已备份，不打扰
      e.preventDefault();
      e.returnValue = ''; // Chrome 69: 设置 returnValue 触发系统确认框
    });
    /* visibilitychange hidden：切后台/关闭前置一次静默保存（不弹窗） */
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        try { persist(); } catch (e) {}
      }
    });
  }

  /* ===================== 强制备份门槛（下次打开时） ===================== */
  function isForceBackup() {
    var v = getLS(FORCE_KEY);
    if (v === null) return true;   // 默认开
    return v !== '0';
  }
  var pendingBackupFlag = getLS(PENDING_KEY) === '1';
  var gateTimer = null;
  /* 标记操作：localStorage + 内存变量双同步，杜绝状态不一致 */
  function clearPending() {
    pendingBackupFlag = false;
    delLS(PENDING_KEY);
  }
  function markPending() {
    pendingBackupFlag = true;
    setLS(PENDING_KEY, '1');
  }
  function checkBackupGate() {
    if (!isForceBackup()) return;
    var lastDlDay = getLS(LAST_DL_KEY) || '';
    if (lastDlDay === todayKey()) { clearPending(); return; } // 今天已自动备份
    if (!pendingBackupFlag) return; // 上次关闭时已备份/无标记
    /* 若签到弹窗正在显示，等它处理完再弹备份（避免两个全屏弹窗叠加） */
    var sm = bk$('signModal');
    if (sm && sm.className.indexOf('show') !== -1) {
      if (!gateTimer) gateTimer = setTimeout(function () { gateTimer = null; checkBackupGate(); }, 2000);
      return;
    }
    var el = bk$('backupModal');
    if (!el) return;
    el.className = 'modal-mask show';
    try { setTimeout(function () { var b = bk$('backupNowBtn'); if (b) b.focus(); }, 50); } catch (e) {}
  }
  function backupNowFromModal() {
    doAutoDownload();
    clearPending();
    delLS(SKIP_KEY);
    var el = bk$('backupModal');
    if (el) el.className = 'modal-mask';
    if (typeof toast === 'function') toast('✅ 已备份，进度安全了！');
  }
  function backupSkipFromModal() {
    var n = parseInt(getLS(SKIP_KEY) || '0', 10) || 0;
    n++;
    setLS(SKIP_KEY, String(n));
    var el = bk$('backupModal');
    if (el) el.className = 'modal-mask';
    if (typeof toast === 'function') toast('将在下次打开时再次提醒备份');
  }
  function bindModalBtns() {
    var b1 = bk$('backupNowBtn');
    if (b1) b1.addEventListener('click', backupNowFromModal);
    var b2 = bk$('backupSkipBtn');
    if (b2) b2.addEventListener('click', backupSkipFromModal);
  }

  /* ===================== 对外接口（挂到 window，供 04-pet.js 等调用） ===================== */
  window.__BACKUP__ = {
    tick: autoBackupTick,
    syncNow: syncBackupNow,
    recover: recoverSave,
    loadLSSlot: loadLSSlot,
    gate: checkBackupGate,
    onLeaving: onLeaving,
    isForceBackup: isForceBackup,
    setForceBackup: function (on) { setLS(FORCE_KEY, on ? '1' : '0'); },
    /* 本次启动是否发生过自动恢复及来源（'idb'=IndexedDB / 'ls'=备份槽，供界面提示/家长调试） */
    restored: function () { return restoredFrom; },
    lastBackupTime: function () {
      var t = 0;
      var ls = lsBackupLoad();
      if (ls && ls.t) t = ls.t;
      if (memSnapshot && memSnapshot.t && memSnapshot.t > t) t = memSnapshot.t;
      return t || 0;
    }
  };

  /* ===================== 初始化（不依赖 04-pet 全局，全部安全） ===================== */
  idbInit();
  bindBeforeUnload();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindModalBtns);
  } else {
    bindModalBtns();
  }
  /* 启动 1.5s 后检查强制备份门槛（等界面渲染完成） */
  setTimeout(function () {
    try { checkBackupGate(); } catch (e) {}
  }, 1500);
})();