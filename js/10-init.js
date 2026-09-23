'use strict';
  function init() {
    initBg();
    adaptTV();
    curGrade = 1;
    renderGrades();
    renderSubjects();
    updateTopbar();
    updateUserBtn();
    applyCosmetics(); // 应用已购主题/头像框
    applyHash(); // 直接按 hash 渲染目标页，避免先显示首页再闪切
    setTimeout(checkDailySign, 600);
  }
  init();
