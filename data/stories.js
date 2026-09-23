/* ===================== 故事乐园数据（结构） =====================
 * 结构：window.__STORIES__ = { cats:[分类], list:[{ id, cat, title, text }] }
 * 说明：故事正文已扩充至每篇 500~550 字（舒缓语速朗读约 3 分钟），
 *      按分类拆分到 stories-*.js 文件，通过 window.__STORIES__.list.push 追加
 */
window.__STORIES__ = (function () {
  var cats = [
    { id: 'bedtime', icon: '🛏️', name: '睡前故事' },
    { id: 'fairy',   icon: '🧚', name: '经典童话' },
    { id: 'fable',   icon: '🦊', name: '寓言故事' },
    { id: 'idiom',   icon: '📜', name: '成语故事' },
    { id: 'myth',    icon: '🐉', name: '神话传说' },
    { id: 'folk',    icon: '🏮', name: '民间故事' },
    { id: 'science', icon: '🔬', name: '科普故事' },
    { id: 'english', icon: '🗣️', name: '英语故事' }
  ];
  return { cats: cats, list: [] };
})();