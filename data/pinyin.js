/* ===================== 拼音学习数据 =====================
 * 结构：
 *   window.__PINYIN__ = { shengmu:[], yunmu:[], zhengti:[], strokes:{字母:[[笔画点]]} }
 * 每项：{ ch:字符, name:谐音读法, jingle:口诀, word:例词, wordPinyin:例词拼音 }
 * 笔画：归一化坐标 0~100，y 向下；多笔画是数组的数组
 * 说明：
 *   - 描红模板 / 判分模板：用系统字体实时渲染（100% 标准字形）
 *   - 笔顺动画：用下方 strokes 路径（逐笔描边）
 * 坐标系：x-height 顶部 y=42，baseline y=78，ascender y=18，descender y=90
 */
window.__PINYIN__ = (function () {
  /* ===== 几何辅助：生成平滑曲线采样点 ===== */
  function arcPts(cx, cy, rx, ry, a0, a1, n) {
    // 椭圆弧采样：a0→a1 度（y 向下，0°=右，90°=下，180°=左，270°=上）
    // 上凸拱：180→360（经 270° 上）；下凸碗底：180→0（经 90° 下）
    var pts = [], i, a, rad;
    n = n || 40;
    for (i = 0; i <= n; i++) {
      a = a0 + (a1 - a0) * i / n;
      rad = a * Math.PI / 180;
      pts.push([cx + rx * Math.cos(rad), cy + ry * Math.sin(rad)]);
    }
    return pts;
  }
  function cubicPts(p0, c1, c2, p1, n) {
    var pts = [], i, t, u;
    n = n || 32;
    for (i = 0; i <= n; i++) {
      t = i / n; u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]
      ]);
    }
    return pts;
  }
  function concat() {
    var out = [], i, j, seg, p;
    for (i = 0; i < arguments.length; i++) {
      seg = arguments[i];
      for (j = 0; j < seg.length; j++) {
        p = seg[j];
        if (out.length && out[out.length - 1][0] === p[0] && out[out.length - 1][1] === p[1]) continue;
        out.push(p);
      }
    }
    return out;
  }
  function line(x1, y1, x2, y2) { return [[x1, y1], [x2, y2]]; }

  var strokes = {
    /* 坐标基准：x-height y=42~78（高36）、ascender 顶 y=30、descender 底 y=91
     * 圆/半圆半径 16（= 字形中心线半径，中心线 + 笔画线宽 = 字形外径）
     * 圆/半圆方向：逆时针（-90→-450 整圆，-90→-270 左半圆，-90→90 右半圆，180→360 上凸拱，180→0 下凹碗底） */
    o: [ arcPts(50, 60, 16, 16, -90, -450, 48) ],
    a: [ arcPts(46, 60, 16, 16, -90, -270, 40), line(62, 42, 62, 78) ],
    b: [ line(28, 30, 28, 78), arcPts(28, 60, 16, 16, -90, 90, 40) ],
    c: [ arcPts(50, 60, 16, 16, -45, -315, 48) ],
    d: [ arcPts(54, 60, 16, 16, -90, -270, 40), line(70, 30, 70, 78) ],
    e: [ concat(line(36, 58, 60, 58), arcPts(48, 58, 12, 14, 0, -330, 44)) ],
    f: [
      concat(arcPts(48, 30, 6, 6, -90, 90, 12), line(48, 36, 48, 78)),
      line(30, 58, 66, 58)
    ],
    g: [
      arcPts(46, 60, 16, 16, -90, -270, 40),
      concat(line(62, 56, 62, 86), arcPts(54, 86, 8, 5, 0, 180, 14))
    ],
    h: [ line(28, 30, 28, 78), concat(arcPts(39, 42, 11, 12, 180, 360, 26), line(50, 42, 50, 78)) ],
    i: [ line(50, 42, 50, 78), arcPts(50, 30, 2.5, 2.5, 0, 360, 12) ],
    j: [
      concat(line(52, 42, 52, 82), arcPts(44, 82, 8, 5, 0, 180, 12)),
      arcPts(52, 30, 2.5, 2.5, 0, 360, 12)
    ],
    k: [ line(28, 30, 28, 78), concat(line(58, 44, 34, 58), line(34, 58, 58, 78)) ],
    l: [ line(50, 30, 50, 78) ],
    m: [
      line(24, 42, 24, 78),
      concat(arcPts(33, 42, 9, 12, 180, 360, 20), line(42, 42, 42, 78)),
      concat(arcPts(51, 42, 9, 12, 180, 360, 20), line(60, 42, 60, 78))
    ],
    n: [ line(28, 42, 28, 78), concat(arcPts(39, 42, 11, 12, 180, 360, 26), line(50, 42, 50, 78)) ],
    p: [ line(30, 42, 30, 91), arcPts(30, 60, 16, 16, -90, 90, 40) ],
    q: [ arcPts(46, 60, 16, 16, -90, -270, 40), line(62, 42, 62, 91) ],
    r: [ line(32, 42, 32, 78), arcPts(42, 48, 10, 12, 180, 360, 16) ],
    s: [
      concat(
        cubicPts([56, 46], [48, 34], [34, 50], [42, 60], 20),
        cubicPts([42, 60], [50, 70], [60, 54], [44, 78], 20)
      )
    ],
    t: [ concat(line(46, 34, 46, 74), arcPts(50, 74, 5, 3, 180, 0, 10)), line(30, 58, 62, 58) ],
    u: [
      concat(line(30, 42, 30, 66), arcPts(40, 66, 10, 12, 180, 0, 20), line(50, 66, 50, 42)),
      line(50, 42, 50, 78)
    ],
    v: [ [ [30, 42], [50, 78], [70, 42] ] ],
    w: [
      [ [26, 42], [38, 78], [50, 42] ],
      [ [50, 42], [62, 78], [74, 42] ]
    ],
    x: [ line(30, 42, 66, 78), line(66, 42, 30, 78) ],
    y: [ line(30, 42, 52, 62), concat(line(66, 42, 52, 62), cubicPts([52, 64], [52, 80], [42, 90], [30, 86], 16)) ],
    z: [ [ [32, 42], [64, 42], [32, 78], [64, 78] ] ],
    'ü': [
      concat(line(30, 42, 30, 66), arcPts(40, 66, 10, 12, 180, 0, 20), line(50, 66, 50, 42)),
      line(50, 42, 50, 78),
      arcPts(40, 30, 2.5, 2.5, 0, 360, 12),
      arcPts(56, 30, 2.5, 2.5, 0, 360, 12)
    ]
  };

  var shengmu = [
    { ch:'b', name:'波', jingle:'右下半圆 b b b，像个 6 字 b b b', word:'爸爸', wordPinyin:'bà ba' },
    { ch:'p', name:'坡', jingle:'右上半圆 p p p，像面小旗 p p p', word:'皮球', wordPinyin:'pí qiú' },
    { ch:'m', name:'摸', jingle:'两个门洞 m m m', word:'妈妈', wordPinyin:'mā ma' },
    { ch:'f', name:'佛', jingle:'一根拐棍 f f f', word:'飞机', wordPinyin:'fēi jī' },
    { ch:'d', name:'得', jingle:'左下半圆 d d d，像个小鼓 d d d', word:'大象', wordPinyin:'dà xiàng' },
    { ch:'t', name:'特', jingle:'一把伞柄 t t t', word:'太阳', wordPinyin:'tài yáng' },
    { ch:'n', name:'讷', jingle:'一个门洞 n n n', word:'牛奶', wordPinyin:'niú nǎi' },
    { ch:'l', name:'勒', jingle:'一根小棍 l l l', word:'蓝天', wordPinyin:'lán tiān' },
    { ch:'g', name:'哥', jingle:'9 字加钩 g g g', word:'哥哥', wordPinyin:'gē ge' },
    { ch:'k', name:'科', jingle:'像挺机枪 k k k', word:'蝌蚪', wordPinyin:'kē dǒu' },
    { ch:'h', name:'喝', jingle:'像把椅子 h h h', word:'喝水', wordPinyin:'hē shuǐ' },
    { ch:'j', name:'基', jingle:'竖弯加点 j j j', word:'小鸡', wordPinyin:'xiǎo jī' },
    { ch:'q', name:'欺', jingle:'像个 9 字 q q q', word:'气球', wordPinyin:'qì qiú' },
    { ch:'x', name:'希', jingle:'像把剪刀 x x x', word:'西瓜', wordPinyin:'xī guā' },
    { ch:'zh', name:'知', jingle:'织毛衣 zh zh zh', word:'竹子', wordPinyin:'zhú zi' },
    { ch:'ch', name:'吃', jingle:'吃饭 ch ch ch', word:'吃饭', wordPinyin:'chī fàn' },
    { ch:'sh', name:'诗', jingle:'老师 sh sh sh', word:'狮子', wordPinyin:'shī zi' },
    { ch:'r', name:'日', jingle:'日出 r r r', word:'日出', wordPinyin:'rì chū' },
    { ch:'z', name:'资', jingle:'写字 z z z', word:'写字', wordPinyin:'xiě zì' },
    { ch:'c', name:'雌', jingle:'刺猬 c c c', word:'刺猬', wordPinyin:'cì wei' },
    { ch:'s', name:'思', jingle:'蚕吐丝 s s s', word:'蚕丝', wordPinyin:'cán sī' },
    { ch:'y', name:'衣', jingle:'像根树杈 y y y', word:'衣服', wordPinyin:'yī fu' },
    { ch:'w', name:'乌', jingle:'像座小屋 w w w', word:'乌鸦', wordPinyin:'wū yā' }
  ];

  var yunmu = [
    { ch:'a', name:'啊', jingle:'张大嘴巴 a a a', word:'阿姨', wordPinyin:'ā yí' },
    { ch:'o', name:'喔', jingle:'公鸡打鸣 o o o', word:'公鸡', wordPinyin:'gōng jī' },
    { ch:'e', name:'鹅', jingle:'白鹅唱歌 e e e', word:'白鹅', wordPinyin:'bái é' },
    { ch:'i', name:'衣', jingle:'牙齿对齐 i i i', word:'衣服', wordPinyin:'yī fu' },
    { ch:'u', name:'乌', jingle:'乌鸦做窝 u u u', word:'乌鸦', wordPinyin:'wū yā' },
    { ch:'ü', name:'迂', jingle:'小鱼吐泡 ü ü ü', word:'金鱼', wordPinyin:'jīn yú' },
    { ch:'ai', name:'哀', jingle:'挨在一起 ai ai ai', word:'爱心', wordPinyin:'ài xīn' },
    { ch:'ei', name:'诶', jingle:'用力拔河 ei ei ei', word:'背包', wordPinyin:'bēi bāo' },
    { ch:'ui', name:'威', jingle:'微笑 ui ui ui', word:'围巾', wordPinyin:'wéi jīn' },
    { ch:'ao', name:'熬', jingle:'棉袄 ao ao ao', word:'棉袄', wordPinyin:'mián ǎo' },
    { ch:'ou', name:'欧', jingle:'海鸥 ou ou ou', word:'海鸥', wordPinyin:'hǎi ōu' },
    { ch:'iu', name:'优', jingle:'邮票 iu iu iu', word:'邮票', wordPinyin:'yóu piào' },
    { ch:'ie', name:'耶', jingle:'椰树 ie ie ie', word:'椰子', wordPinyin:'yē zi' },
    { ch:'üe', name:'约', jingle:'月亮 üe üe üe', word:'月亮', wordPinyin:'yuè liang' },
    { ch:'er', name:'儿', jingle:'耳朵 er er er', word:'耳朵', wordPinyin:'ěr duo' },
    { ch:'an', name:'安', jingle:'天安门 an an an', word:'安全', wordPinyin:'ān quán' },
    { ch:'en', name:'恩', jingle:'恩人 en en en', word:'门铃', wordPinyin:'mén líng' },
    { ch:'in', name:'因', jingle:'树荫 in in in', word:'树荫', wordPinyin:'shù yīn' },
    { ch:'un', name:'温', jingle:'温暖 un un un', word:'温暖', wordPinyin:'wēn nuǎn' },
    { ch:'ün', name:'晕', jingle:'白云 ün ün ün', word:'白云', wordPinyin:'bái yún' },
    { ch:'ang', name:'昂', jingle:'昂头 ang ang ang', word:'太阳', wordPinyin:'tài yáng' },
    { ch:'eng', name:'鞥', jingle:'台灯 eng eng eng', word:'台灯', wordPinyin:'tái dēng' },
    { ch:'ing', name:'英', jingle:'老鹰 ing ing ing', word:'老鹰', wordPinyin:'lǎo yīng' },
    { ch:'ong', name:'翁', jingle:'闹钟 ong ong ong', word:'闹钟', wordPinyin:'nào zhōng' }
  ];

  var zhengti = [
    { ch:'zhi', name:'知', jingle:'整体认读 zhi，直接读"知"', word:'蜘蛛', wordPinyin:'zhī zhū' },
    { ch:'chi', name:'吃', jingle:'整体认读 chi，直接读"吃"', word:'吃饭', wordPinyin:'chī fàn' },
    { ch:'shi', name:'诗', jingle:'整体认读 shi，直接读"诗"', word:'老师', wordPinyin:'lǎo shī' },
    { ch:'ri', name:'日', jingle:'整体认读 ri，直接读"日"', word:'日出', wordPinyin:'rì chū' },
    { ch:'zi', name:'资', jingle:'整体认读 zi，直接读"资"', word:'写字', wordPinyin:'xiě zì' },
    { ch:'ci', name:'雌', jingle:'整体认读 ci，直接读"雌"', word:'刺猬', wordPinyin:'cì wei' },
    { ch:'si', name:'思', jingle:'整体认读 si，直接读"思"', word:'蚕丝', wordPinyin:'cán sī' },
    { ch:'yi', name:'衣', jingle:'整体认读 yi，直接读"衣"', word:'衣服', wordPinyin:'yī fu' },
    { ch:'wu', name:'乌', jingle:'整体认读 wu，直接读"乌"', word:'乌鸦', wordPinyin:'wū yā' },
    { ch:'yu', name:'迂', jingle:'整体认读 yu，直接读"迂"', word:'金鱼', wordPinyin:'jīn yú' },
    { ch:'ye', name:'耶', jingle:'整体认读 ye，直接读"耶"', word:'树叶', wordPinyin:'shù yè' },
    { ch:'yue', name:'约', jingle:'整体认读 yue，直接读"约"', word:'月亮', wordPinyin:'yuè liang' },
    { ch:'yuan', name:'冤', jingle:'整体认读 yuan，直接读"冤"', word:'圆圈', wordPinyin:'yuán quān' },
    { ch:'yin', name:'因', jingle:'整体认读 yin，直接读"因"', word:'树荫', wordPinyin:'shù yīn' },
    { ch:'yun', name:'晕', jingle:'整体认读 yun，直接读"晕"', word:'白云', wordPinyin:'bái yún' },
    { ch:'ying', name:'英', jingle:'整体认读 ying，直接读"英"', word:'老鹰', wordPinyin:'lǎo yīng' }
  ];

  return { shengmu: shengmu, yunmu: yunmu, zhengti: zhengti, strokes: strokes };
})();
