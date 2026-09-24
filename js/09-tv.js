'use strict';
  /* ===================== 智能电视检测与字号适配 ===================== */
  function detectTV() {
    var ua = navigator.userAgent || '';
    // 1. UA 特征：主流电视系统/浏览器
    var uaHit = /SmartTV|Smart-TV|MiTV|XiaoMi|AppleTV|Roku|Android TV|WebTV|NETTV|Tizen|WebOS|Vestel|VIDAA|Opera TV|Fire TV|Chrome\/.*Mobile.*TV|\(TV/i.test(ua);
    // 2. 物理分辨率兜底：1080p 及以上且非手机（用 screen 物理像素 × DPR）
    var physW = (screen.width || 0) * (window.devicePixelRatio || 1);
    var physH = (screen.height || 0) * (window.devicePixelRatio || 1);
    var bigScreen = physW >= 1920 && physH >= 1080;
    return uaHit || bigScreen;
  }
  function adaptTV() {
    if (!detectTV()) return;
    document.body.classList.add('is-tv');
    var root = document.documentElement;
    var physW = (screen.width || 0) * (window.devicePixelRatio || 1);
    var base;
    if (physW >= 3840) base = 40;      // 4K 电视（小米 4K 等）
    else if (physW >= 2560) base = 36; // 2.5K/2K
    else if (physW >= 1920) base = 32; // 1080p 电视（小米电视主流）
    else base = 26;                    // 其它大屏
    // viewport 安全约束：电视浏览器可能把 viewport 缩到 1280，
    // 若字号过大导致 62rem 超过 viewport 太多，按比例收紧，避免溢出。
    var vw = window.innerWidth || 0;
    if (vw > 0 && vw < 1600) {
      var maxByVw = Math.round(vw / 40); // 保证 62rem 上限约 1.55 倍 viewport
      if (base > maxByVw) base = maxByVw;
    }
    root.style.fontSize = base + 'px';
  }

  /* ===================== 用户中心 UI + 备份迁移 ===================== */
  function renderUserModal() {
    var cu = getCurrentUser();
    $('userNow').innerHTML = cu
      ? '👋 当前用户：<span class="un">' + cu + '</span> <span class="ulv">Lv.' + level() + ' · ⭐' + save.stars + ' · 🐾' + save.pets.length + '</span>' +
        '<button class="btn user-logout" id="userLogoutBtn">退出登录</button>'
      : '👋 当前模式：<b>游客</b>（数据只存在本浏览器）· 注册后进度绑定用户';
    var lb = $('userLogoutBtn');
    if (lb) lb.addEventListener('click', function () {
      logoutUser();
      toast('已退出，回到游客模式');
      renderUserModal();
    });
    var wrap = $('userListWrap');
    var users = loadUsers();
    var names = Object.keys(users);
    wrap.innerHTML = names.length ? '' : '';
    if (names.length) {
      var label = document.createElement('div');
      label.style.cssText = 'font-size:.72rem;color:var(--muted);width:100%';
      label.textContent = '已有用户（点击填入用户名）：';
      wrap.appendChild(label);
      names.forEach(function (n) {
        var c = document.createElement('button');
        c.className = 'user-chip' + (n === cu ? ' cur' : '');
        c.textContent = n;
        c.addEventListener('click', function () {
          $('userNameInput').value = n;
          $('userPassInput').focus();
        });
        wrap.appendChild(c);
      });
    }
  }
  function exportBackupCode() {
    var payload = { app: 'study-adventure', v: 2, user: getCurrentUser() || '游客', save: save, t: Date.now() };
    var code;
    try { code = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); } catch (e) { toast('导出失败'); return; }
    $('backupCode').value = code;
    $('backupCode').select();
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (e) {}
    toast(copied ? '📋 备份码已复制，请保存到微信/备忘录' : '备份码已生成，请手动复制保存');
  }
  function exportBackupFile() {
    try {
      var payload = { app: 'study-adventure', v: 2, user: getCurrentUser() || '游客', save: save, t: Date.now() };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'study-adventure-backup-' + todayStr(0) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); }, 1000);
      toast('📁 备份文件已下载，妥善保存');
    } catch (e) { toast('导出失败'); }
  }
  function importBackupText(text, isFile) {
    try {
      var payload = JSON.parse(isFile ? text : decodeURIComponent(escape(atob((text || '').trim()))));
      if (!payload || !payload.save) { toast('❌ 备份内容无效'); return; }
      var d = defaultSave();
      var s = payload.save;
      for (var k in d) { if (!(k in s)) s[k] = d[k]; }
      save = s;
      /* 备份文件若携带多用户档案（自动备份 v1+ 格式），一并恢复，避免丢用户数据 */
      if (payload.users && typeof payload.users === 'object' && Object.keys(payload.users).length) {
        try { localStorage.setItem(USERS_KEY, JSON.stringify(payload.users)); } catch (e) {}
      }
      if (payload.currentUser) {
        try { localStorage.setItem(CURRENT_KEY, payload.currentUser); } catch (e) {}
      }
      persist();
      /* 恢复成功后立即同步一次备份（写入备份槽 + 今日快照），形成闭环；
         传 true 表示不自动下载文件——刚导入的备份就是恢复源，无需再下一份 */
      try { if (window.__BACKUP__) window.__BACKUP__.syncNow(true); } catch (e) {}
      refreshAll();
      SFX.levelup();
      toast('✅ 恢复成功！' + (payload.user && payload.user !== '游客' ? '用户：' + payload.user : ''));
      TTS.speak('存档恢复成功！', 0.9);
    } catch (e) { toast('❌ 备份码无效或已损坏'); }
  }

  /* ===================== 每日签到 ===================== */
  function todayStr(offsetDays) {
    var d = new Date(Date.now() + (offsetDays || 0) * 86400000);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function checkDailySign() {
    if (save.lastSignDate === todayStr(0)) return; // 今天已签
    var streak = (save.lastSignDate === todayStr(-1)) ? (save.signStreak || 0) + 1 : 1;
    var stars = 2 + Math.min(streak, 3);
    var eggs = 1 + (streak >= 3 ? 1 : 0);
    var food = streak >= 3 ? 4 : 2;
    $('signStreakNum').textContent = streak;
    $('signStars').textContent = '⭐' + stars;
    $('signEggs').textContent = '🥚' + eggs;
    $('signFood').textContent = '🍖' + food;
    $('signModal').className = 'modal-mask show';
    $('signClaimBtn').focus();
    $('signClaimBtn').onclick = function () {
      save.lastSignDate = todayStr(0);
      save.signStreak = streak;
      save.stars += stars;
      save.eggs += eggs;
      save.food = (save.food || 0) + food;
      SFX.levelup();
      burst(window.innerWidth / 2, window.innerHeight / 2, ['🎁', '⭐', '🥚', '✨', '💖']);
      TTS.speak('签到成功！获得' + stars + '颗星星、' + eggs + '颗宠物蛋和' + food + '份食物！', 0.9);
      toast('🎁 签到成功：⭐' + stars + ' + 🥚' + eggs + ' + 🍖' + food);
      persist();
      updateTopbar();
      $('signModal').className = 'modal-mask';
      focusFirstNav($('homeScreen'));
    };
  }

