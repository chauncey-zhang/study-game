/* ===================== 英语语法课堂数据（结构） =====================
 * 结构：window.__GRAMMAR__ = { cats:[分类], list:[语法点] }
 * 每个语法点：
 *   { id, cat, title, grade:[适用年级], mnemonic:记忆口诀, origin:来源/为什么,
 *     keyPoints:[要点], rule:规则详解, examples:[{en,cn}], tips:避坑, questions:[{q,o,a,e}] }
 * 语法点按分类拆分到 grammar-*.js 文件，通过 window.__GRAMMAR__.list.push 追加
 */
window.__GRAMMAR__ = (function () {
  var cats = [
    { id: 'word',      icon: '🧩', name: '词类' },
    { id: 'tense',     icon: '⏰', name: '时态' },
    { id: 'voice',     icon: '🔁', name: '语态' },
    { id: 'sentence',  icon: '🏗️', name: '句型结构' },
    { id: 'clause',    icon: '🧬', name: '从句' },
    { id: 'nonfinite', icon: '🎯', name: '非谓语动词' },
    { id: 'rule',      icon: '⚖️', name: '语法规则' }
  ];
  return { cats: cats, list: [] };
})();