'use strict';

/* ===================== 休闲游戏模块 · 数据清单（32 款，6 大类） =====================
 * 仅含元信息（id/name/icon/cat/desc/type），玩法逻辑在 js/games/*.js 通过 regGame() 注册
 * type: 'canvas'（Canvas 2D 实时绘制）| 'dom'（DOM 网格/按钮）
 * bestMode: 'max'（越大越好，分数/胜局）| 'min'（越小越好，步数/时间）
 */
window.GAME_CATS = [
  { id: 'strategy', icon: '♟️', name: '棋牌策略' },
  { id: 'number', icon: '🔢', name: '数字烧脑' },
  { id: 'eliminate', icon: '🍬', name: '消除排列' },
  { id: 'react', icon: '⚡', name: '反应操作' },
  { id: 'path', icon: '🌀', name: '路径解谜' },
  { id: 'observe', icon: '🔍', name: '观察创意' }
];

window.GAMES = [
  /* 一、棋牌策略 */
  { id: 'tictactoe', name: '井字棋', icon: '⭕', cat: 'strategy', type: 'dom', bestMode: 'max', desc: '三子连成一线即胜，人机对战' },
  { id: 'gomoku', name: '五子棋', icon: '🎯', cat: 'strategy', type: 'dom', bestMode: 'max', desc: '五子连珠，人机对战' },
  { id: 'reversi', name: '翻转棋', icon: '⚫', cat: 'strategy', type: 'dom', bestMode: 'max', desc: '黑白棋夹子翻转，抢占棋盘' },
  { id: 'rps', name: '石头剪刀布', icon: '✊', cat: 'strategy', type: 'dom', bestMode: 'max', desc: '和 AI 猜拳，看谁连胜更多' },
  { id: 'bulls', name: '猜数字', icon: '🔢', cat: 'strategy', type: 'dom', bestMode: 'min', desc: '逻辑推理猜出 4 位数字' },
  { id: 'memory', name: '记忆翻牌', icon: '🃏', cat: 'strategy', type: 'dom', bestMode: 'min', desc: '翻开配对的卡片，考验记忆力' },
  { id: 'math24', name: '24 点', icon: '➕', cat: 'strategy', type: 'dom', bestMode: 'max', desc: '四张牌加减乘除凑出 24' },

  /* 二、数字烧脑 */
  { id: 'game2048', name: '2048', icon: '🧩', cat: 'number', type: 'dom', bestMode: 'max', desc: '滑动合成，向 2048 冲刺' },
  { id: 'sudoku', name: '数独', icon: '🔲', cat: 'number', type: 'dom', bestMode: 'max', desc: '每行每列每宫 1-9 不重复' },
  { id: 'fifteen', name: '数字华容道', icon: '🔟', cat: 'number', type: 'dom', bestMode: 'min', desc: '1-15 顺序排列，空格移动' },
  { id: 'klotski', name: '经典华容道', icon: '🧱', cat: 'number', type: 'dom', bestMode: 'min', desc: '移动木块，救出曹操' },
  { id: 'minesweeper', name: '扫雷', icon: '💣', cat: 'number', type: 'dom', bestMode: 'max', desc: '排除地雷，找出所有安全格' },
  { id: 'fastcalc', name: '算得快', icon: '⚡', cat: 'number', type: 'dom', bestMode: 'max', desc: '限时口算，越快越高分' },

  /* 三、消除排列 */
  { id: 'linkup', name: '连连看', icon: '🍬', cat: 'eliminate', type: 'dom', bestMode: 'max', desc: '相同图案两两连线消除' },
  { id: 'bubble', name: '泡泡龙', icon: '🫧', cat: 'eliminate', type: 'canvas', bestMode: 'max', desc: '发射泡泡，三个同色消除' },
  { id: 'tetris', name: '俄罗斯方块', icon: '🧱', cat: 'eliminate', type: 'canvas', bestMode: 'max', desc: '叠满一行消一行' },
  { id: 'breakout', name: '打砖块', icon: '🏓', cat: 'eliminate', type: 'canvas', bestMode: 'max', desc: '反弹小球击碎全部砖块' },

  /* 四、反应操作 */
  { id: 'whackamole', name: '打地鼠', icon: '🔨', cat: 'react', type: 'dom', bestMode: 'max', desc: '限时点地鼠，看谁手快' },
  { id: 'catchfruit', name: '接水果', icon: '🍎', cat: 'react', type: 'canvas', bestMode: 'max', desc: '移动篮子接住掉落的水果' },
  { id: 'snake', name: '贪吃蛇', icon: '🐍', cat: 'react', type: 'canvas', bestMode: 'max', desc: '吃食物变长，别撞墙撞自己' },
  { id: 'plane', name: '飞机大战', icon: '🚀', cat: 'react', type: 'canvas', bestMode: 'max', desc: '操控战机击落敌机' },
  { id: 'simon', name: '记忆序列', icon: '🎵', cat: 'react', type: 'dom', bestMode: 'max', desc: '记住并重复亮灯顺序' },
  { id: 'jump', name: '跳一跳', icon: '⬆️', cat: 'react', type: 'canvas', bestMode: 'max', desc: '蓄力跳跃到下一个平台' },

  /* 五、路径解谜 */
  { id: 'maze', name: '迷宫', icon: '🌀', cat: 'path', type: 'canvas', bestMode: 'min', desc: '方向键走出随机迷宫' },
  { id: 'sokoban', name: '推箱子', icon: '📦', cat: 'path', type: 'dom', bestMode: 'min', desc: '把箱子推到目标点' },
  { id: 'onestroke', name: '一笔画', icon: '✏️', cat: 'path', type: 'canvas', bestMode: 'max', desc: '一笔连完所有线段不重复' },
  { id: 'pipes', name: '水管连通', icon: '🔧', cat: 'path', type: 'dom', bestMode: 'max', desc: '旋转水管让水流接通' },

  /* 六、观察创意 */
  { id: 'finddiff', name: '找不同', icon: '🔍', cat: 'observe', type: 'dom', bestMode: 'max', desc: '两图对比找出所有不同' },
  { id: 'jigsaw', name: '拼图', icon: '🖼️', cat: 'observe', type: 'dom', bestMode: 'min', desc: '打乱的图片拼回原样' },
  { id: 'colorby', name: '数字涂色', icon: '🎨', cat: 'observe', type: 'dom', bestMode: 'max', desc: '按数字提示给格子涂色' },
  { id: 'rhythm', name: '节奏大师', icon: '🥁', cat: 'observe', type: 'canvas', bestMode: 'max', desc: '音符落到判定线时点击' },
  { id: 'reaction', name: '反应测试', icon: '⚡', cat: 'observe', type: 'dom', bestMode: 'min', desc: '灯变绿立刻点，测反应速度' }
];
