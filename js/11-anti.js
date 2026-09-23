'use strict';

/* ===================== 防沉迷模块（运行时长提醒 + 强制休息 + 家长配置/密码） ===================== */
// 配置项存 localStorage：anti-work-min（分钟）、anti-rest-sec（秒）、anti-parent-pwd（家长密码）
// 运行状态存 localStorage：anti-accum-ms（累计活跃毫秒）、anti-rest-until（休息结束时间戳）
var ANTI_WORK_MIN = 30;
var ANTI_REST_SEC = 300;
var ANTI_ACCUM_KEY = 'anti-accum-ms';
var ANTI_REST_UNTIL_KEY = 'anti-rest-until';
var antiAccumMs = 0; // 累计活跃运行毫秒数（跨刷新持久化）
try { antiAccumMs = parseInt(localStorage.getItem(ANTI_ACCUM_KEY), 10) || 0; } catch (e) {}
var antiResting = false;                 // 是否正在休息
var antiRestRemain = ANTI_REST_SEC;      // 休息剩余秒数
var antiRestTimer = null;                // 休息倒计时定时器
var antiRestMusicTimer = null;           // 休息音乐定时器
var antiRestStep = 0;
var antiMusicWasOn = false;              // 进休息前全局背景乐状态（退出恢复用）

// 舒缓休息音乐：五声音阶，慢节奏，低音量（摇篮曲式）
var REST_MELODY = [523, 587, 659, 587, 523, 440, 523, 659, 587, 523, 392, 440, 523, 587, 659, 587];

function antiLoadConfig() {
  try { ANTI_WORK_MIN = parseInt(localStorage.getItem('anti-work-min'), 10) || 30; } catch (e) {}
  try { ANTI_REST_SEC = parseInt(localStorage.getItem('anti-rest-sec'), 10) || 300; } catch (e) {}
}
function antiGetPwd() {
  try { return localStorage.getItem('anti-parent-pwd') || ''; } catch (e) { return ''; }
}
// 密码验证弹窗用途：'parent'=进入家长设置，'rest'=休息时间未到提前退出
var antiPwdMode = 'parent';
function antiOpenPwd(mode) {
  antiPwdMode = mode;
  $('pwdInput').value = '';
  $('pwdTip').textContent = (mode === 'rest')
    ? '休息时间还没到，输入家长密码才能提前退出'
    : '请输入家长密码后进入设置';
  $('pwdModal').className = 'modal-mask show';
  setTimeout(function () { $('pwdInput').focus(); }, 60);
}

// 让位机制：休息期间静音全局背景乐，结束后按原状态恢复（不改用户音乐偏好）
function antiDuckGlobalMusic(muted) {
  if (muted) {
    clearTimeout(musicTimer); musicTimer = null;
    if (musicGain) musicGain.gain.value = 0;
  } else if (musicOn) {
    if (ensureMusic()) {
      musicGain.gain.value = 0.05;
      if (!musicTimer) scheduleBar();
    }
  }
}
function antiRestMusicStop() { clearTimeout(antiRestMusicTimer); antiRestMusicTimer = null; }
function antiRestMusicStart() {
  antiRestMusicStop();
  ensureAudio();
  var step = function () {
    if (!antiResting) { antiRestMusicStop(); return; }
    var f = REST_MELODY[antiRestStep % REST_MELODY.length];
    tone(f, 0.6, 'sine', 0.045);
    if (antiRestStep % 4 === 0) tone(f * 2, 0.4, 'sine', 0.02);
    antiRestStep++;
    antiRestMusicTimer = setTimeout(step, 620);
  };
  step();
}
function antiRenderRestCount() {
  var m = Math.floor(antiRestRemain / 60), s = antiRestRemain % 60;
  $('restCount').textContent = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}
function antiRestTick() {
  if (!antiResting) return;
  antiRestRemain--;
  if (antiRestRemain <= 0) { antiEndRest(); return; }
  antiRenderRestCount();
}
function antiStartRest() {
  if (antiResting) return;
  antiResting = true;
  antiRestRemain = ANTI_REST_SEC;
  try { localStorage.setItem(ANTI_REST_UNTIL_KEY, String(Date.now() + ANTI_REST_SEC * 1000)); } catch (e) {}
  antiMusicWasOn = musicOn;
  antiDuckGlobalMusic(true);   // 关闭全局背景音乐
  antiRestMusicStart();        // 播放舒缓休息音乐
  antiRenderRestCount();
  $('restModal').className = 'modal-mask rest-mask show';
  clearInterval(antiRestTimer);
  antiRestTimer = setInterval(antiRestTick, 1000);
}
function antiEndRest() {
  if (!antiResting) return;
  antiResting = false;
  clearInterval(antiRestTimer); antiRestTimer = null;
  antiRestMusicStop();
  antiDuckGlobalMusic(false);  // 按原状态恢复背景音乐
  $('restModal').className = 'modal-mask rest-mask';
  antiAccumMs = 0;             // 重置累计运行时长
  try { localStorage.setItem(ANTI_ACCUM_KEY, '0'); localStorage.removeItem(ANTI_REST_UNTIL_KEY); } catch (e) {}
  antiRestStep = 0;
  SFX.levelup();
}

/* ---- 家长配置入口（带密码保护）与设置界面 ---- */
function openParentModal() {
  $('parentWorkMin').value = ANTI_WORK_MIN;
  $('parentRestMin').value = Math.round(ANTI_REST_SEC / 60);
  $('parentPwd').value = '';
  /* 强制备份开关回显 */
  var fb = $('parentForceBk');
  if (fb && window.__BACKUP__) { try { fb.checked = window.__BACKUP__.isForceBackup(); } catch (e) {} }
  $('parentModal').className = 'modal-mask show';
}
function saveParentConfig() {
  var w = parseInt($('parentWorkMin').value, 10);
  var r = parseInt($('parentRestMin').value, 10);
  if (!w || w < 5 || w > 180) { toast('请输入 5 ~ 180 分钟的学习时长'); return; }
  if (!r || r < 1 || r > 60) { toast('请输入 1 ~ 60 分钟的休息时长'); return; }
  var pwd = $('parentPwd').value.trim();
  var pwdMsg = '';
  if (pwd) {
    if (pwd.length < 4) { toast('家长密码至少 4 位'); return; }
    try { localStorage.setItem('anti-parent-pwd', pwd); } catch (e) {}
    pwdMsg = '，家长密码已更新';
  }
  try {
    localStorage.setItem('anti-work-min', String(w));
    localStorage.setItem('anti-rest-sec', String(r * 60));
  } catch (e) {}
  antiLoadConfig();
  antiAccumMs = 0; // 修改配置后重新开始计时
  try { localStorage.setItem(ANTI_ACCUM_KEY, '0'); } catch (e) {}
  /* 强制备份开关保存 */
  var fb = $('parentForceBk');
  if (fb && window.__BACKUP__) { try { window.__BACKUP__.setForceBackup(fb.checked); } catch (e) {} }
  $('parentModal').className = 'modal-mask';
  toast('✅ 已保存：学习 ' + w + ' 分钟 / 休息 ' + r + ' 分钟' + pwdMsg);
}
function verifyPwd() {
  var v = $('pwdInput').value;
  if (!v) { toast('请输入密码'); return; }
  if (v !== antiGetPwd()) { toast('❌ 密码错误'); $('pwdInput').value = ''; return; }
  $('pwdModal').className = 'modal-mask';
  if (antiPwdMode === 'rest') { antiEndRest(); }
  else { openParentModal(); }
}

// 工作计时：按真实时间差累计（即使 setInterval 被节流也不偏慢、不停止）；休息中暂停；累计跨刷新持久化
var antiLastTick = Date.now();
var ANTI_AWAY_MS = 3 * 60 * 1000; // 长时间切后台/休眠判定阈值：单次间隔超过 3 分钟，这段时间不计入学习时长
setInterval(function () {
  var now = Date.now();
  var delta = now - antiLastTick;
  antiLastTick = now;
  if (antiResting) return;
  if (delta < 0) delta = 0; // 防御系统时钟回拨
  // 长时间离开（切后台/休眠，间隔超过阈值）不计入，恢复后从当前时刻重新累计
  if (delta > ANTI_AWAY_MS) delta = 0;
  antiAccumMs += delta;
  try { localStorage.setItem(ANTI_ACCUM_KEY, String(antiAccumMs)); } catch (e) {}
  if (antiAccumMs >= ANTI_WORK_MIN * 60000) antiStartRest();
}, 1000);

// 事件绑定
$('restDoneBtn').addEventListener('click', function () {
  SFX.click();
  if (antiRestRemain <= 0) { antiEndRest(); return; } // 时间已到，直接关闭（防御分支，正常由倒计时自动关闭）
  if (antiGetPwd()) { antiOpenPwd('rest'); }          // 时间没到，需家长密码才能提前退出
  else { antiEndRest(); }                              // 未设置家长密码，直接关闭
});
$('parentEntryBtn').addEventListener('click', function () {
  SFX.click();
  if (antiGetPwd()) {
    antiOpenPwd('parent');
  } else {
    openParentModal();
  }
});
$('pwdOkBtn').addEventListener('click', function () { SFX.click(); verifyPwd(); });
$('pwdCancelBtn').addEventListener('click', function () { SFX.click(); $('pwdModal').className = 'modal-mask'; });
$('pwdInput').addEventListener('keyup', function (e) { if (e.key === 'Enter') verifyPwd(); });
$('parentClose').addEventListener('click', function () { SFX.click(); $('parentModal').className = 'modal-mask'; });
$('parentSaveBtn').addEventListener('click', function () { SFX.click(); saveParentConfig(); });

antiLoadConfig(); // 初始化：读取家长配置

// 恢复休息状态：刷新后若仍处于休息时段，继续休息（防止刷新跳过休息）
(function () {
  var until = 0;
  try { until = parseInt(localStorage.getItem(ANTI_REST_UNTIL_KEY), 10) || 0; } catch (e) {}
  if (until <= Date.now()) return;
  antiResting = true;
  antiRestRemain = Math.ceil((until - Date.now()) / 1000);
  antiMusicWasOn = musicOn;
  antiDuckGlobalMusic(true);
  antiRestMusicStart();
  antiRenderRestCount();
  $('restModal').className = 'modal-mask rest-mask show';
  clearInterval(antiRestTimer);
  antiRestTimer = setInterval(antiRestTick, 1000);
})();
