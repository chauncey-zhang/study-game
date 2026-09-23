/* ============================================================
   自动生成题库 —— 数学（全年级）
   规则生成，答案由程序计算保证正确；与手写题库合并。
   每次刷新页面随机生成 → 同一关卡每次题目不同（防背题）。
   ============================================================ */
(function () {
  'use strict';
  var BANK = window.__STUDY_BANK__ = window.__STUDY_BANK__ || {};

  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a || 1; }

  /* 数值选择题（干扰项 = 答案附近随机数，保证 4 个互不相同） */
  function numQ(q, ans, e, g, fixed) {
    var opts = [ans], guard = 0;
    while (opts.length < 4 && guard++ < 80) {
      var d = ans + rnd(1, 9) * (Math.random() < 0.5 ? -1 : 1);
      if (opts.indexOf(d) === -1) opts.push(d);
    }
    while (opts.length < 4) { var d2 = ans + opts.length + 2; if (opts.indexOf(d2) === -1) opts.push(d2); }
    opts = shuffle(opts);
    function f(x) { return fixed ? x.toFixed(fixed) : String(x); }
    return { q: q, o: opts.map(f), a: opts.indexOf(ans), e: e, g: [g] };
  }
  /* 字符串选择题 */
  function strQ(q, correct, wrongs, e, g) {
    var opts = [correct];
    for (var i = 0; i < wrongs.length && opts.length < 4; i++) {
      if (opts.indexOf(wrongs[i]) === -1) opts.push(wrongs[i]);
    }
    while (opts.length < 4) opts.push('以上都不对');
    opts = shuffle(opts);
    if (opts.length > 4) opts = opts.slice(0, 4);
    if (opts.indexOf(correct) === -1) opts[3] = correct;
    return { q: q, o: opts, a: opts.indexOf(correct), e: e, g: [g] };
  }
  /* 比较大小（符号选项） */
  function cmpQ(a, b, g) {
    var syms = ['>', '<', '='];
    var ans = a > b ? '>' : (a < b ? '<' : '=');
    return { q: a + ' ○ ' + b + '，○ 里应填？', o: syms, a: syms.indexOf(ans), e: a + (a > b ? ' 大于 ' : a < b ? ' 小于 ' : ' 等于 ') + b + '，填 ' + ans, g: [g] };
  }
  function fracStr(num, den) { var g = gcd(num, den); num /= g; den /= g; return den === 1 ? String(num) : num + '/' + den; }

  /* ============ 各年级题型生成器 ============ */
  var G = {};

  /* 一年级：20以内加减、比较、凑十、数的组成、连加 */
  G[1] = [
    function () { var a = rnd(1, 10), b = rnd(1, 10); return numQ(a + ' + ' + b + ' = ？', a + b, a + '+' + b + '=' + (a + b), 1); },
    function () { var a = rnd(5, 20), b = rnd(1, a - 1); return numQ(a + ' - ' + b + ' = ？', a - b, a + '-' + b + '=' + (a - b), 1); },
    function () { return cmpQ(rnd(1, 20), rnd(1, 20), 1); },
    function () { var b = rnd(1, 9); return numQ('（ ）+ ' + b + ' = 10，括号里填？', 10 - b, b + '+' + (10 - b) + '=10', 1); },
    function () { var t = rnd(1, 9), o = rnd(0, 9), ans = t * 10 + o; return numQ(t + ' 个十和 ' + o + ' 个一组成的数是？', ans, t + '个十是' + (t * 10) + '，再加 ' + o + ' 个一是 ' + ans, 1); },
    function () { var a = rnd(1, 5), b = rnd(1, 5), c = rnd(1, 5); return numQ(a + ' + ' + b + ' + ' + c + ' = ？', a + b + c, '先算 ' + (a + b) + '，再加 ' + c, 1); },
    function () { var s = rnd(2, 15), k = rnd(1, 4); return numQ('从 ' + s + ' 往后数 ' + k + ' 个数，是？', s + k, s + '+' + k + '=' + (s + k), 1); }
  ];

  /* 二年级：乘法口诀、表内除法、100内加减、余数、乘加混合 */
  G[2] = [
    function () { var a = rnd(2, 9), b = rnd(2, 9); return numQ(a + ' × ' + b + ' = ？', a * b, '口诀：' + a + ' 乘 ' + b + ' 得 ' + (a * b), 2); },
    function () { var b = rnd(2, 9), c = rnd(2, 9); return numQ((b * c) + ' ÷ ' + b + ' = ？', c, b + '×' + c + '=' + (b * c) + '，所以商是 ' + c, 2); },
    function () { var a = rnd(12, 55), b = rnd(12, 100 - a); return numQ(a + ' + ' + b + ' = ？', a + b, a + '+' + b + '=' + (a + b), 2); },
    function () { var a = rnd(30, 99), b = rnd(11, a - 10); return numQ(a + ' - ' + b + ' = ？', a - b, a + '-' + b + '=' + (a - b), 2); },
    function () { var b = rnd(3, 9), q2 = rnd(2, 9), r = rnd(1, b - 1), a = q2 * b + r;
      return Math.random() < 0.5
        ? numQ(a + ' ÷ ' + b + ' = ' + q2 + ' 余 ？', r, a + '=' + b + '×' + q2 + '+' + r + '，余数是 ' + r, 2)
        : numQ(a + ' ÷ ' + b + '，商是 ？', q2, a + '=' + b + '×' + q2 + '+' + r + '，商是 ' + q2, 2); },
    function () { var a = rnd(2, 9), b = rnd(2, 9), c = rnd(1, 20); return numQ(a + ' × ' + b + ' + ' + c + ' = ？', a * b + c, '先算 ' + a + '×' + b + '=' + (a * b) + '，再加 ' + c, 2); }
  ];

  /* 三年级：万以内加减、多位数乘除、时间换算、周长面积 */
  G[3] = [
    function () { var a = rnd(100, 880), b = rnd(100, 880); return numQ(a + ' + ' + b + ' = ？', a + b, a + '+' + b + '=' + (a + b), 3); },
    function () { var a = rnd(300, 999), b = rnd(100, a - 100); return numQ(a + ' - ' + b + ' = ？', a - b, a + '-' + b + '=' + (a - b), 3); },
    function () { var a = rnd(12, 99), b = rnd(2, 9); return numQ(a + ' × ' + b + ' = ？', a * b, a + '×' + b + '=' + (a * b), 3); },
    function () { var b = rnd(2, 9), c = rnd(12, 99); return numQ((b * c) + ' ÷ ' + b + ' = ？', c, b + '×' + c + '=' + (b * c) + '，所以商是 ' + c, 3); },
    function () { var x = rnd(2, 9); return numQ(x + ' 时 = ？分', x * 60, '1时=60分，' + x + '时=' + x + '×60=' + (x * 60) + '分', 3); },
    function () { var x = rnd(2, 9); return numQ(x + ' 分 = ？秒', x * 60, '1分=60秒，' + x + '分=' + (x * 60) + '秒', 3); },
    function () { var l = rnd(3, 20), w = rnd(2, 19); return numQ('长方形长 ' + l + ' 厘米、宽 ' + w + ' 厘米，周长是？', (l + w) * 2, '周长=(长+宽)×2=(' + l + '+' + w + ')×2=' + ((l + w) * 2), 3); },
    function () { var l = rnd(3, 20), w = rnd(2, 19); return numQ('长方形长 ' + l + ' 厘米、宽 ' + w + ' 厘米，面积是？', l * w, '面积=长×宽=' + l + '×' + w + '=' + (l * w), 3); },
    function () { var s = rnd(2, 15); return numQ('正方形边长 ' + s + ' 厘米，周长是？', s * 4, '周长=边长×4=' + s + '×4=' + (s * 4), 3); },
    function () { var s = rnd(2, 15); return numQ('正方形边长 ' + s + ' 厘米，面积是？', s * s, '面积=边长×边长=' + s + '×' + s + '=' + (s * s), 3); }
  ];

  /* 四年级：三位数乘一位/两位数、除数两位、角的计算、大数、简便运算 */
  G[4] = [
    function () { var a = rnd(102, 899), b = rnd(2, 9); return numQ(a + ' × ' + b + ' = ？', a * b, a + '×' + b + '=' + (a * b), 4); },
    function () { var b = rnd(11, 99), c = rnd(2, 99); return numQ((b * c) + ' ÷ ' + b + ' = ？', c, b + '×' + c + '=' + (b * c) + '，所以商是 ' + c, 4); },
    function () { var x = rnd(10, 80); return numQ('一个角是 ' + x + '°，与它拼成直角的角是？', 90 - x, '直角是90°，90-' + x + '=' + (90 - x), 4); },
    function () { var x = rnd(10, 170); return numQ('一个角是 ' + x + '°，与它拼成平角的角是？', 180 - x, '平角是180°，180-' + x + '=' + (180 - x), 4); },
    function () { var a = pick([25, 50, 125]), b = pick([2, 4, 8]); return numQ(a + ' × ' + b + ' = ？', a * b, '简便运算：' + a + '×' + b + '=' + (a * b), 4); },
    function () { var x = rnd(1, 999), y = rnd(1, 9999), ans = x * 10000 + y; return numQ(x + ' 个万和 ' + y + ' 个一组成的数是？', ans, x + '个万是' + (x * 10000) + '，加 ' + y + ' 是 ' + ans, 4); },
    function () { var a = rnd(12, 99), b = rnd(11, 99); return numQ(a + ' × ' + b + ' = ？', a * b, a + '×' + b + '=' + (a * b), 4); }
  ];

  /* 五年级：小数四则、简易方程、三角形面积、同分母分数加减 */
  G[5] = [
    function () { var a = rnd(2, 95), b = rnd(2, 95); return numQ((a / 10) + ' + ' + (b / 10) + ' = ？', (a + b) / 10, '小数加法，结果 ' + ((a + b) / 10).toFixed(1), 5, 1); },
    function () { var a = rnd(30, 99), b = rnd(2, a - 5); return numQ((a / 10) + ' - ' + (b / 10) + ' = ？', (a - b) / 10, '小数减法，结果 ' + ((a - b) / 10).toFixed(1), 5, 1); },
    function () { var a = rnd(11, 99), c = rnd(2, 9); return numQ((a / 10) + ' × ' + c + ' = ？', (a * c) / 10, '先算 ' + a + '×' + c + '=' + (a * c) + '，再点上小数点', 5, 1); },
    function () { var z = rnd(2, 9), w = rnd(21, 99); return numQ((z * w / 10).toFixed(1) + ' ÷ ' + z + ' = ？', w / 10, '商是 ' + (w / 10).toFixed(1) + '，验算：' + (w / 10).toFixed(1) + '×' + z + '=' + (z * w / 10).toFixed(1), 5, 1); },
    function () { var a = rnd(2, 9), x = rnd(2, 15); return numQ('解方程：' + a + 'x = ' + (a * x) + '，x = ？', x, 'x = ' + (a * x) + '÷' + a + '=' + x, 5); },
    function () { var d = rnd(2, 20), h = rnd(1, 10) * 2; return numQ('三角形底 ' + d + ' 厘米、高 ' + h + ' 厘米，面积是？', d * h / 2, '面积=底×高÷2=' + d + '×' + h + '÷2=' + (d * h / 2), 5); },
    function () { var c = rnd(3, 9), a = rnd(1, c - 1), b = rnd(1, c - 1); return strQ(a + '/' + c + ' + ' + b + '/' + c + ' = ？', fracStr(a + b, c), [(a + b + 1) + '/' + c, Math.max(1, a + b - 1) + '/' + c, (a * b) + '/' + c], '同分母相加：(' + a + '+' + b + ')/' + c + '=' + fracStr(a + b, c), 5); },
    function () { var c = rnd(3, 9), a = rnd(2, c - 1), b = rnd(1, a - 1); return strQ(a + '/' + c + ' - ' + b + '/' + c + ' = ？', fracStr(a - b, c), [Math.max(1, a - b + 1) + '/' + c, Math.max(1, a - b - 1) + '/' + c, (a - b) + '/' + (c + 1)], '同分母相减：(' + a + '-' + b + ')/' + c + '=' + fracStr(a - b, c), 5); }
  ];

  /* 六年级：分数乘除、百分数、圆、比、百分数应用 */
  G[6] = [
    function () { var b = rnd(2, 6), a = rnd(1, b), d = rnd(2, 6), c = rnd(1, d); var num = a * c, den = b * d;
      return strQ(a + '/' + b + ' × ' + c + '/' + d + ' = ？', fracStr(num, den), [num + '/' + den, (num + 1) + '/' + den, num + '/' + (den + 1)], '分子乘分子、分母乘分母，再约分：' + fracStr(num, den), 6); },
    function () { var b = rnd(2, 6), a = rnd(1, b), d = rnd(2, 6), c = rnd(1, d); var num = a * d, den = b * c;
      return strQ(a + '/' + b + ' ÷ ' + c + '/' + d + ' = ？', fracStr(num, den), [num + '/' + den, (num + 1) + '/' + den, num + '/' + (den + 1)], '除以一个数=乘它的倒数：' + a + '/' + b + '×' + d + '/' + c + '=' + fracStr(num, den), 6); },
    function () { var p = rnd(1, 19) * 5; return numQ(p + '% 化成小数是？', p / 100, p + '%=' + p + '÷100=' + (p / 100).toFixed(2), 6, 2); },
    function () { var p = rnd(1, 19) * 5; return numQ((p / 100) + ' 化成百分数是？', p, '小数点右移两位加%：' + p + '%', 6); },
    function () { var r = rnd(1, 12); return numQ('圆的半径 r = ' + r + '，周长是？（π取3.14）', 2 * 3.14 * r, 'C=2πr=2×3.14×' + r + '=' + (2 * 3.14 * r).toFixed(2), 6, 2); },
    function () { var r = rnd(1, 12); return numQ('圆的半径 r = ' + r + '，面积是？（π取3.14）', 3.14 * r * r, 'S=πr²=3.14×' + r + '×' + r + '=' + (3.14 * r * r).toFixed(2), 6, 2); },
    function () { var a = rnd(2, 30), b = rnd(2, 30), g = gcd(a, b); if (g === 1) return null;
      return strQ('把 ' + a + ' : ' + b + ' 化成最简整数比', (a / g) + ' : ' + (b / g), [a + ' : ' + (b / g), (a / g) + ' : ' + b, (a / g + 1) + ' : ' + (b / g)], '同时除以最大公因数 ' + g + '，得 ' + (a / g) + ':' + (b / g), 6); },
    function () { var p = pick([10, 20, 25, 50, 75]), x = rnd(1, 40) * 4; if ((x * p) % 100 !== 0) return null;
      return numQ(x + ' 的 ' + p + '% 是？', x * p / 100, x + '×' + p + '%=' + x + '×' + (p / 100) + '=' + (x * p / 100), 6); }
  ];

  /* 七年级：有理数运算、绝对值、一元一次方程、乘方 */
  G[7] = [
    function () { var a = rnd(-30, 30), b = rnd(-30, 30); return numQ('(-) 计算：(' + a + ') + (' + b + ') = ？', a + b, '同号相加取相同符号，异号相加取绝对值大的符号：结果 ' + (a + b), 7); },
    function () { var a = rnd(-30, 30), b = rnd(-30, 30); return numQ('计算：' + a + ' - (' + b + ') = ？', a - b, '减去一个数等于加上它的相反数：' + a + '+' + (-b) + '=' + (a - b), 7); },
    function () { var a = rnd(-9, 9) || 5, b = rnd(-9, 9) || -4; return numQ('计算：(' + a + ') × (' + b + ') = ？', a * b, '同号得正、异号得负：' + (a * b), 7); },
    function () { var b = rnd(-9, 9) || 3, c = rnd(-9, 9) || -6, x = rnd(-9, 9) || 2, a = rnd(2, 9); var aa = (c - b) / a; if (aa !== x) return null;
      return numQ('解方程：' + a + 'x ' + (b >= 0 ? '+ ' + b : '− ' + (-b)) + ' = ' + c + '，x = ？', x, 'x=(' + c + (b >= 0 ? '-' + b : '+' + (-b)) + ')÷' + a + '=' + x, 7); },
    function () { var a = rnd(-20, 20) || -7; return numQ('|' + a + '| = ？', Math.abs(a), '绝对值是数轴上到原点的距离，恒为非负：' + Math.abs(a), 7); },
    function () { var a = rnd(-9, 9) || -3, b = rnd(2, 9); return numQ('计算：(' + a + ') ÷ ' + b + ' = ？', a / b, '同号得正、异号得负：' + (a / b), 7); },
    function () { var a = rnd(4, 16); return numQ(a + '² = ？', a * a, a + '×' + a + '=' + (a * a), 7); }
  ];

  /* 八年级：平方根、勾股、立方、完全平方、二次根式化简 */
  G[8] = [
    function () { var a = rnd(2, 20); return numQ('√' + (a * a) + ' = ？', a, (a * a) + ' 的算术平方根是 ' + a, 8); },
    function () { var k = rnd(1, 7); return numQ('直角三角形两直角边为 ' + (3 * k) + ' 和 ' + (4 * k) + '，斜边长为？', 5 * k, '勾股定理：√(' + (3 * k) + '²+' + (4 * k) + '²)=√' + (25 * k * k) + '=' + (5 * k), 8); },
    function () { var k = rnd(1, 7); return numQ('直角三角形斜边为 ' + (5 * k) + '，一条直角边为 ' + (4 * k) + '，另一直角边为？', 3 * k, '勾股定理：√(' + (5 * k) + '²-' + (4 * k) + '²)=√' + (9 * k * k) + '=' + (3 * k), 8); },
    function () { var a = rnd(2, 7); return numQ(a + '³ = ？', a * a * a, a + '×' + a + '×' + a + '=' + (a * a * a), 8); },
    function () { var a = rnd(2, 20), b = rnd(2, 20); return numQ('(' + a + ' + ' + b + ')² = ？', (a + b) * (a + b), '完全平方公式：' + a + '²+2×' + a + '×' + b + '+' + b + '²=' + ((a + b) * (a + b)), 8); },
    function () { var k = rnd(2, 4), m = pick([2, 3, 5, 6, 7, 10]); return strQ('√' + (k * k * m) + ' = ？', k + '√' + m, [(k + 1) + '√' + m, k + '√' + (m + 1), (k * k) + '√' + m], '√' + (k * k * m) + '=√' + k + '²×√' + m + '=' + k + '√' + m, 8); },
    function () { var a = rnd(3, 20), b = rnd(2, a - 1); return numQ('计算：(' + a + ' + ' + b + ')(' + a + ' - ' + b + ') = ？', a * a - b * b, '平方差公式：' + a + '²-' + b + '²=' + (a * a - b * b), 8); },
    function () { var a = rnd(2, 5), m = rnd(2, 4); return numQ(a + ' 的 ' + m + ' 次方 = ？', Math.pow(a, m), a + '^' + m + '=' + Math.pow(a, m), 8); },
    function () { var k = rnd(2, 9) * (Math.random() < 0.5 ? -1 : 1), b = rnd(-9, 9), x = rnd(1, 9); return numQ('直线 y = ' + k + 'x ' + (b >= 0 ? '+ ' + b : '− ' + (-b)) + '，当 x = ' + x + ' 时，y = ？', k * x + b, 'y=' + k + '×' + x + (b >= 0 ? '+' + b : '-' + (-b)) + '=' + (k * x + b), 8); },
    function () { var a = rnd(2, 20), h = rnd(2, 20); return numQ('平行四边形底 ' + a + '、高 ' + h + '，面积是？', a * h, '面积=底×高=' + a + '×' + h + '=' + (a * h), 8); },
    function () { var a = rnd(1, 60), b = rnd(1, 60), c = rnd(1, 60); if ((a + b + c) % 3 !== 0) return null;
      return numQ('数据 ' + a + '、' + b + '、' + c + ' 的平均数是？', (a + b + c) / 3, '(' + a + '+' + b + '+' + c + ')÷3=' + ((a + b + c) / 3), 8); }
  ];

  /* 九年级：一元二次方程、判别式、特殊三角函数、概率、顶点、相似 */
  var TRIG = [
    ['sin30° = ？', '1/2', ['√3/2', '√2/2', '1']],
    ['cos60° = ？', '1/2', ['√3/2', '√2/2', '1']],
    ['sin45° = ？', '√2/2', ['1/2', '√3/2', '1']],
    ['cos45° = ？', '√2/2', ['1/2', '√3/2', '1']],
    ['sin60° = ？', '√3/2', ['1/2', '√2/2', '1']],
    ['cos30° = ？', '√3/2', ['1/2', '√2/2', '1']],
    ['tan45° = ？', '1', ['√3/3', '√3/2', '1/2']],
    ['tan30° = ？', '√3/3', ['1', '√3', '1/2']],
    ['tan60° = ？', '√3', ['√3/3', '1', '√2/2']]
  ];
  G[9] = [
    function () { var r1 = rnd(-9, 9), r2 = rnd(-9, 9); if (r1 === r2 || r1 * r2 === 0 || r1 + r2 === 0) return null;
      var p = r1 + r2, q = r1 * r2, lo = Math.min(r1, r2), hi = Math.max(r1, r2);
      var eq = 'x² ' + (p >= 0 ? '+ ' + p : '− ' + (-p)) + 'x ' + (q >= 0 ? '+ ' + q : '− ' + (-q)) + ' = 0';
      return strQ('方程 ' + eq + ' 的两根分别为？', lo + ' 和 ' + hi, [(lo + 1) + ' 和 ' + hi, lo + ' 和 ' + (hi + 1), (lo - 1) + ' 和 ' + (hi - 1)], '因式分解：(x' + (r1 >= 0 ? '−' + r1 : '+' + (-r1)) + ')(x' + (r2 >= 0 ? '−' + r2 : '+' + (-r2)) + ')=0，根为 ' + lo + ' 和 ' + hi, 9); },
    function () { var a = rnd(1, 3), b = rnd(-6, 6), c = rnd(-5, 5); var d = b * b - 4 * a * c;
      return numQ('方程 ' + a + 'x² ' + (b >= 0 ? '+ ' + b : '− ' + (-b)) + 'x ' + (c >= 0 ? '+ ' + c : '− ' + (-c)) + ' = 0 的判别式 Δ = ？', d, 'Δ=b²-4ac=(' + b + ')²-4×' + a + '×(' + c + ')=' + d, 9); },
    function () { var t = pick(TRIG); return strQ(t[0], t[1], t[2], '特殊角的三角函数值需要熟记', 9); },
    function () { var a = rnd(1, 9), b = rnd(1, 9); var g = gcd(a, a + b);
      return strQ('袋中有 ' + a + ' 个红球和 ' + b + ' 个白球（除颜色外相同），摸出红球的概率是？', (a / g) + '/' + ((a + b) / g), [(b / (a + b) % 1 === 0 ? '1/' + (a + b) : b + '/' + (a + b)), a + '/' + (a + b), (a + 1) + '/' + (a + b)], 'P(红)=红球数÷总球数=' + a + '/' + (a + b) + '=' + (a / g) + '/' + ((a + b) / g), 9); },
    function () { var h = rnd(-6, 6), k = rnd(-6, 6); if (h === 0 || k === 0) return null;
      return strQ('抛物线 y = (x ' + (h >= 0 ? '− ' + h : '+ ' + (-h)) + ')² ' + (k >= 0 ? '+ ' + k : '− ' + (-k)) + ' 的顶点坐标是？', '(' + h + ', ' + k + ')', ['(' + (-h) + ', ' + k + ')', '(' + h + ', ' + (-k) + ')', '(' + (-h) + ', ' + (-k) + ')'], 'y=a(x−h)²+k 的顶点是 (h, k)，即 (' + h + ', ' + k + ')', 9); },
    function () { var k = rnd(2, 5); return numQ('两个相似三角形的相似比为 ' + k + ' : 1，它们的面积比为？', k * k, '面积比 = 相似比的平方 = ' + k + '² = ' + (k * k), 9); },
    function () { var x = rnd(1, 12), y = rnd(1, 12); return numQ('点 (' + x + ', ' + y + ') 在反比例函数 y = k/x 的图象上，k = ？', x * y, 'k = x×y = ' + x + '×' + y + '=' + (x * y), 9); },
    function () { var k = rnd(1, 6), a = 3 * k, b = 4 * k, c = 5 * k; var g = gcd(a, c);
      return strQ('直角三角形中，角A的对边为 ' + a + '，斜边为 ' + c + '，则 sinA = ？', (a / g) + '/' + (c / g), [(b / gcd(b, c)) + '/' + (c / gcd(b, c)), a + '/' + c, (a / g + 1) + '/' + (c / g)], 'sinA = 对边÷斜边 = ' + a + '/' + c + '=' + (a / g) + '/' + (c / g), 9); },
    function () { var r = rnd(1, 9), x = rnd(2, 6); return numQ('圆的半径 r = ' + r + '，圆面积是？（π取3.14，结果保留两位小数）', 3.14 * r * r, 'S=πr²=3.14×' + r + '×' + r + '=' + (3.14 * r * r).toFixed(2), 9, 2); }
  ];

  /* ===================== 英语生成器（词表累积 + 规则变化，保证准确） ===================== */
  function parseEn(str) {
    return str.split('|').map(function (s) {
      var i = s.lastIndexOf(' '); // 中文无空格：以最后一个空格分割，兼容 'green beans 豆角'
      return { en: s.slice(0, i).trim(), cn: s.slice(i + 1).trim() };
    }).filter(function (x) { return x.en && x.cn; });
  }
  var EN_WORDS = {
    1: 'cat 猫|dog 狗|apple 苹果|book 书|pen 钢笔|bag 书包|bird 鸟|fish 鱼|egg 鸡蛋|milk 牛奶|sun 太阳|moon 月亮|star 星星|tree 树|flower 花|boy 男孩|girl 女孩|mother 妈妈|father 爸爸|red 红色|blue 蓝色|big 大的|small 小的|hello 你好|goodbye 再见|one 一|two 二|three 三|four 四|five 五|six 六|hand 手|nose 鼻子|eye 眼睛|ear 耳朵|mouth 嘴巴|face 脸|duck 鸭子|pig 猪|cow 奶牛|hen 母鸡|ship 轮船|ball 球|kite 风筝|toy 玩具|bus 公共汽车|sister 姐妹|brother 兄弟|grandmother 奶奶|grandfather 爷爷|baby 婴儿|orange 橙色|pink 粉色|purple 紫色|brown 棕色|pear 梨|noodle 面条|soup 汤|tea 茶|juice 果汁|bike 自行车|car 汽车|boat 小船|cap 帽子|shirt 衬衫|skirt 裙子|shoe 鞋|sock 袜子|coat 外套|sweater 毛衣|new 新的|old 旧的|happy 开心的|sad 悲伤的|hungry 饿的|thirsty 渴的|name 名字|pupil 小学生|son 儿子|daughter 女儿|grandma 奶奶|grandpa 爷爷|classmate 同学|frog 青蛙|snail 蜗牛|crab 螃蟹|shrimp 虾|tortoise 乌龟|hamster 仓鼠|corn 玉米|pea 豌豆|ham 火腿|gold 金色|silver 银色|zero 零|dress 连衣裙|trousers 裤子|jeans 牛仔裤|scarf 围巾|glove 手套|watch 手表|comb 梳子|brush 刷子|towel 毛巾|soap 肥皂|key 钥匙|lock 锁|lamp 灯|sofa 沙发|table 桌子|home 家|room 房间|shop 商店|little 小的|many 许多的|some 一些|good 好的|bad 坏的|nice 好看的|clean 干净的|dirty 脏的|fast 快的|slow 慢的|play 玩|read 读|write 写|draw 画|sing 唱歌|sleep 睡觉|cry 哭|laugh 笑|smile 微笑|listen 听|look 看|open 打开|close 关上|wash 洗',
    2: 'yellow 黄色|green 绿色|black 黑色|white 白色|seven 七|eight 八|nine 九|ten 十|long 长的|short 短的|tall 高的|fat 胖的|thin 瘦的|run 跑|jump 跳|walk 走路|eat 吃|drink 喝|zoo 动物园|park 公园|school 学校|classroom 教室|teacher 老师|student 学生|friend 朋友|water 水|rice 米饭|bread 面包|cake 蛋糕|bear 熊|panda 熊猫|monkey 猴子|elephant 大象|tiger 老虎|lion 狮子|rabbit 兔子|bed 床|clock 钟|door 门|wall 墙|window 窗户|chicken 鸡肉|goose 鹅|sheep 绵羊|horse 马|donkey 驴|deer 鹿|wolf 狼|bee 蜜蜂|ant 蚂蚁|butterfly 蝴蝶|dragonfly 蜻蜓|snake 蛇|mouse 老鼠|city 城市|village 村庄|road 马路|street 街道|river 河流|lake 湖|sea 大海|hill 小山|cloud 云|rain 雨|wind 风|snow 雪|fire 火|air 空气|game 游戏|song 歌曲|story 故事|film 电影|rooster 公鸡|turkey 火鸡|owl 猫头鹰|eagle 鹰|bat 蝙蝠|fly 飞|cook 做饭|plant 种植|wait 等待|help 帮助|love 爱|like 喜欢|hate 讨厌|want 想要|know 知道|think 思考|meet 遇见|busy 忙的|free 空闲的|easy 容易的|hard 困难的|early 早的|late 迟的|today 今天|tomorrow 明天|yesterday 昨天|now 现在|here 这里|there 那里|forest 森林|grass 草|leaf 树叶|rock 岩石|wood 木头|sky 天空|planet 行星|world 世界|country 国家|town 城镇|house 房子|path 小路|pond 池塘|stream 小溪|wave 浪|cave 洞穴',
    3: 'ruler 尺子|eraser 橡皮|pencil 铅笔|crayon 蜡笔|desk 课桌|chair 椅子|light 灯|picture 照片|computer 电脑|phone 电话|thirteen 十三|fourteen 十四|fifteen 十五|sixteen 十六|seventeen 十七|eighteen 十八|nineteen 十九|twenty 二十|thirty 三十|forty 四十|fifty 五十|breakfast 早餐|lunch 午餐|dinner 晚餐|kitchen 厨房|bedroom 卧室|bathroom 浴室|cold 冷的|warm 暖和的|cool 凉爽的|hot 热的|music 音乐|art 美术|science 科学|English 英语|Chinese 语文|maths 数学|PE 体育|garden 花园|farm 农场|playground 操场|office 办公室|lab 实验室|hall 大厅|gym 体育馆|canteen 食堂|bank 银行|hotel 旅馆|airport 机场|aunt 阿姨|cousin 表兄弟姐妹|family 家庭|people 人们|child 孩子|kid 小孩|sixty 六十|seventy 七十|eighty 八十|ninety 九十|sandwich 三明治|salad 沙拉|hamburger 汉堡|chips 薯条|candy 糖果|chocolate 巧克力|cookie 曲奇|jam 果酱|butter 黄油|cheese 奶酪|yogurt 酸奶|coffee 咖啡|honey 蜂蜜|sugar 糖|salt 盐|oil 油|flour 面粉|history 历史|geography 地理|biology 生物|chemistry 化学|physics 物理|politics 政治|weekday 工作日|week 周|month 月|year 年|hour 小时|minute 分钟|second 秒|century 世纪|wardrobe 衣柜|curtain 窗帘|carpet 地毯|bookshelf 书架|fridge 冰箱|microwave 微波炉|kettle 水壶|hero 英雄|host 主人|guest 客人|neighbour 邻居|stranger 陌生人',
    4: 'hospital 医院|cinema 电影院|restaurant 餐馆|supermarket 超市|library 图书馆|parking lot 停车场|train 火车|plane 飞机|subway 地铁|taxi 出租车|ship 大船|doctor 医生|nurse 护士|driver 司机|farmer 农民|worker 工人|policeman 警察|sunny 晴朗的|rainy 下雨的|windy 有风的|cloudy 多云的|snowy 下雪的|spring 春天|summer 夏天|autumn 秋天|winter 冬天|January 一月|February 二月|March 三月|April 四月|May 五月|June 六月|July 七月|August 八月|September 九月|October 十月|November 十一月|December 十二月|first 第一|second 第二|campus 校园|building 建筑|kangaroo 袋鼠|giraffe 长颈鹿|zebra 斑马|camel 骆驼|fox 狐狸|swan 天鹅|parrot 鹦鹉|pigeon 鸽子|peacock 孔雀|soldier 士兵|dentist 牙医|waiter 服务员|barber 理发师|postman 邮递员|fireman 消防员|umbrella 雨伞|wallet 钱包|glasses 眼镜|camera 照相机|radio 收音机|mirror 镜子|candle 蜡烛|box 盒子|basket 篮子|bottle 瓶子|cup 杯子|plate 盘子|bowl 碗|spoon 勺子|fork 叉子|knife 刀|ambulance 救护车|fire truck 消防车|helicopter 直升机|truck 卡车|gorilla 大猩猩|seal 海豹|dolphin 海豚|shark 鲨鱼|whale 鲸|penguin 企鹅|squirrel 松鼠|hedgehog 刺猬|harvest 收获|China 中国|America 美国|England 英国|France 法国|Germany 德国|Japan 日本|Korea 韩国|Russia 俄罗斯|India 印度|Canada 加拿大|Australia 澳大利亚|Egypt 埃及|French 法语|Japanese 日语|journey 旅程|picnic 野餐|sport 运动|match 比赛|team 队|player 运动员|winner 获胜者|race 赛跑|score 分数',
    5: 'Monday 星期一|Tuesday 星期二|Wednesday 星期三|Thursday 星期四|Friday 星期五|Saturday 星期六|Sunday 星期日|weekend 周末|morning 早晨|afternoon 下午|evening 傍晚|night 夜晚|third 第三|fourth 第四|fifth 第五|twelfth 第十二|twentieth 第二十|season 季节|weather 天气|favourite 最喜爱的|delicious 美味的|fresh 新鲜的|healthy 健康的|potato 土豆|tomato 西红柿|carrot 胡萝卜|green beans 豆角|cabbage 卷心菜|mutton 羊肉|pork 猪肉|grape 葡萄|strawberry 草莓|banana 香蕉|watermelon 西瓜|peach 桃子|head 头|hair 头发|arm 手臂|leg 腿|foot 脚|knee 膝盖|shoulder 肩膀|finger 手指|heart 心脏|stomach 胃|climb 爬|skate 滑冰|dance 跳舞|row 划船|hike 远足|taste 品尝|touch 触摸|catch 抓住|throw 扔|foggy 有雾的|ice 冰|steam 蒸汽|smoke 烟|noise 噪音|sound 声音|quiet 安静的|loud 大声的|empty 空的|full 满的|tooth 牙齿|bone 骨头|blood 血液|brain 大脑|lung 肺|muscle 肌肉|skin 皮肤|lemon 柠檬|mango 芒果|pineapple 菠萝|coconut 椰子|kiwi 猕猴桃|cherry 樱桃|lychee 荔枝|durian 榴莲|pumpkin 南瓜|cucumber 黄瓜|eggplant 茄子|mushroom 蘑菇|onion 洋葱|garlic 大蒜|lettuce 生菜|pepper 辣椒|ginger 生姜|jog 慢跑|stretch 伸展|breathe 呼吸|digest 消化|patient 病人|medicine 药|pill 药片|fever 发烧|cough 咳嗽|headache 头痛|toothache 牙痛|flu 流感|injury 受伤|rest 休息|recover 恢复',
    6: 'museum 博物馆|cinema 电影院|bookstore 书店|post office 邮局|science museum 科学博物馆|newspaper 报纸|magazine 杂志|dictionary 字典|comic book 连环画|writer 作家|singer 歌手|actor 演员|artist 画家|cleaner 清洁工|engineer 工程师|fisherman 渔民|scientist 科学家|pilot 飞行员|coach 教练|left 左边|right 右边|straight 直的|cross 穿过|near 近的|far 远的|visit 参观|travel 旅行|trip 旅行|holiday 假日|plan 计划|future 未来|dream 梦想|hobby 爱好|postcard 明信片|envelope 信封|stamp 邮票|letter 信件|address 地址|email 电子邮件|internet 互联网|message 消息|secret 秘密|surprise 惊喜|gift 礼物|birthday 生日|party 聚会|balloon 气球|space 太空|sunshine 阳光|shadow 影子|rainbow 彩虹|lightning 闪电|thunder 雷|attention 注意|advice 建议|problem 问题|question 问题|answer 回答|lucky 幸运的|clever 聪明的|silly 傻的|lazy 懒惰的|honest 诚实的|brave 勇敢的|polite 有礼貌的|harbor 港口|suitcase 手提箱|backpack 背包|souvenir 纪念品|guide 导游|tourist 游客|visa 签证|customs 海关|ticket 票|fare 车费|platform 站台|ferry 渡轮|cable car 缆车|theme park 主题公园|roller coaster 过山车|textbook 课本|notebook 笔记本|blackboard 黑板|chalk 粉笔|ink 墨水|glue 胶水|scissors 剪刀|compass 圆规|diligent 勤奋的|patient 耐心的|generous 慷慨的|modest 谦虚的|friendly 友好的|outgoing 外向的|cheerful 开朗的|humorous 幽默的|strict 严格的|gentle 温柔的|curious 好奇的|goal 目标|step 步骤|mistake 错误|improve 改进|practice 练习|review 复习|recite 背诵|translate 翻译|pronounce 发音|spell 拼写|grammar 语法|sentence 句子|paragraph 段落|essay 作文',
    7: 'subject 科目|because 因为|vacation 假期|countryside 乡村|experience 经历|memory 记忆|difficult 困难的|important 重要的|dangerous 危险的|healthy 健康的|environment 环境|protect 保护|recycle 回收利用|pollution 污染|temperature 温度|festival 节日|celebrate 庆祝|traditional 传统的|culture 文化|abroad 国外|passport 护照|luggage 行李|flight 航班|passenger 乘客|station 车站|bridge 桥|island 岛屿|beach 海滩|market 市场|customer 顾客|product 产品|price 价格|cheap 便宜的|expensive 昂贵的|quality 质量|service 服务|population 人口|province 省|capital 首都|direction 方向|position 位置|distance 距离|measure 测量|weight 重量|height 高度|strength 力气|amount 数量|double 两倍|half 一半|quarter 四分之一|description 描述|purpose 目的|choice 选择|debate 辩论|lecture 讲座|graduation 毕业|diploma 文凭|scholarship 奖学金|tuition 学费|dormitory 宿舍|cuisine 烹饪|recipe 食谱|ingredient 食材|nutrition 营养|vegetarian 素食者|barbecue 烧烤|boil 煮沸|fry 油炸|bake 烘烤|roast 烤|stew 炖|chop 剁|slice 切片|peel 削皮|earthquake 地震|typhoon 台风|flood 洪水|drought 干旱|tsunami 海啸|volcano 火山|desert 沙漠|jungle 丛林|wetland 湿地|prairie 草原|glacier 冰川|continent 大洲|peninsula 半岛|plateau 高原|basin 盆地|plain 平原|valley 山谷|insurance 保险|budget 预算|salary 薪水|income 收入|expense 支出|profit 利润|investment 投资|account 账户|deposit 存款|currency 货币',
    8: 'invention 发明|technology 技术|astronaut 宇航员|satellite 卫星|television 电视|website 网站|robot 机器人|education 教育|knowledge 知识|habit 习惯|decision 决定|encourage 鼓励|succeed 成功|opportunity 机会|challenge 挑战|imagine 想象|achieve 实现|volunteer 志愿者|community 社区|responsibility 责任|independence 独立|communicate 交流|ancient 古代的|modern 现代的|international 国际的|develop 发展|industry 工业|research 研究|experiment 实验|theory 理论|gravity 重力|force 力|magnet 磁铁|circuit 电路|battery 电池|signal 信号|digital 数字的|screen 屏幕|keyboard 键盘|device 设备|data 数据|network 网络|program 程序|organization 组织|campaign 运动|material 材料|structure 结构|feature 特征|pattern 模式|process 过程|method 方法|solution 解决方案|attitude 态度|behavior 行为|telescope 望远镜|microscope 显微镜|spaceship 宇宙飞船|rocket 火箭|launch 发射|orbit 轨道|landing 着陆|Mars 火星|meteor 流星|comet 彗星|eclipse 日食|universe 宇宙|galaxy 星系|atmosphere 大气层|radiation 辐射|particle 粒子|molecule 分子|atom 原子|electron 电子|nucleus 原子核|chemical 化学的|reaction 反应|element 元素|compound 化合物|welfare 福利|policy 政策|authority 当局|regulation 规章|license 执照|permit 许可|tax 税|contract 合同|agreement 协议|negotiation 谈判|conflict 冲突|peace 和平|war 战争|army 军队|navy 海军|defence 防御|security 安全',
    9: 'graduate 毕业|achievement 成就|wisdom 智慧|attempt 尝试|reward 回报|effort 努力|progress 进步|society 社会|government 政府|economy 经济|resources 资源|energy 能源|climate 气候|gallery 画廊|exhibition 展览|philosophy 哲学|literature 文学|generation 一代人|announcement 通知|ceremony 典礼|sincerely 真诚地|grateful 感激的|precious 珍贵的|enormous 巨大的|frequently 频繁地|eventually 最终|consequence 结果|influence 影响|appointment 约定|competition 竞争|congratulation 祝贺|consideration 考虑|construction 建设|contribution 贡献|cooperation 合作|creation 创造|expectation 期待|explanation 解释|expression 表达|invitation 邀请|operation 操作|preparation 准备|recommendation 推荐|situation 情况|suggestion 建议|tradition 传统|translation 翻译|imagination 想象力|motivation 动力|phenomenon 现象|priority 优先|aesthetics 美学|sociology 社会学|psychology 心理学|anthropology 人类学|archaeology 考古学|astronomy 天文学|geology 地质学|linguistics 语言学|architecture 建筑学|agriculture 农业|commerce 商业|finance 金融|logistics 物流|accounting 会计|statistics 统计学|journalism 新闻学|publishing 出版|editing 编辑|criticism 评论|biography 传记|autobiography 自传|fiction 小说|poetry 诗歌|prose 散文|drama 戏剧|comedy 喜剧|tragedy 悲剧|documentary 纪录片|happiness 幸福|sadness 悲伤|anger 愤怒|jealousy 嫉妒|envy 羡慕|pride 骄傲|shame 羞耻|guilt 内疚|fear 恐惧|courage 勇气|patience 耐心|kindness 善良|honesty 诚实|loyalty 忠诚|tolerance 包容|empathy 同理心|humility 谦逊|integrity 正直|diligence 勤奋|perseverance 毅力'
  };
  var VERB_3S = 'go goes|do does|have has|watch watches|wash washes|pass passes|fly flies|study studies|carry carries|play plays|read reads|like likes|make makes|take takes|come comes|ride rides|write writes|dance dances|live lives|swim swims|run runs|sit sits|eat eats|see sees|get gets|teach teaches|fix fixes|guess guesses';
  var VERB_PAST = 'go went|do did|have had|eat ate|see saw|take took|make made|come came|get got|give gave|find found|buy bought|teach taught|read read|write wrote|is was|are were|swim swam|sing sang|run ran|tell told|speak spoke|meet met|fall fell|drink drank|fly flew|drive drove|begin began';
  var VERB_ING = 'make making|take taking|write writing|dance dancing|close closing|run running|swim swimming|sit sitting|get getting|play playing|read reading|watch watching|do doing|eat eating|sing singing|draw drawing|listen listening|clean cleaning|cut cutting|put putting';
  var PRONOUNS = [['I', 'me', 'my'], ['you', 'you', 'your'], ['he', 'him', 'his'], ['she', 'her', 'her'], ['it', 'it', 'its'], ['we', 'us', 'our'], ['they', 'them', 'their']];
  function parsePairs2(str) { return str.split('|').map(function (s) { var p = s.trim().split(' '); return { a: p[0], b: p[1] }; }).filter(function (x) { return x.a && x.b; }); }
  function enPool(g) { var pool = []; for (var i = 1; i <= g; i++) { if (EN_WORDS[i]) pool = pool.concat(parseEn(EN_WORDS[i])); } return pool; }
  function pick3(pool, not, key) {
    var wrongs = [], guard = 0;
    while (wrongs.length < 3 && guard++ < 80) {
      var o = pick(pool);
      var v = key ? o[key] : o;
      if (v !== not && wrongs.indexOf(v) === -1) wrongs.push(v);
    }
    return wrongs;
  }
  function en2cn(g) { var pool = enPool(g); var w = pick(pool); return strQ('“' + w.en + '” 的意思是？', w.cn, pick3(pool, w.cn, 'cn'), w.en + ' = ' + w.cn, g); }
  function cn2en(g) { var pool = enPool(g); var w = pick(pool); return strQ('“' + w.cn + '” 的英文是？', w.en, pick3(pool, w.en, 'en'), w.cn + ' = ' + w.en, g); }
  function unscramble(g) {
    var pool = enPool(g);
    var w = pick(pool);
    var letters = w.en.replace(/ /g, '').split('');
    if (letters.length < 3) return null;
    var shuffled = letters.join('');
    var guard = 0;
    while (shuffled === w.en && guard++ < 10) shuffled = shuffle(letters).join('');
    if (shuffled === w.en) return null;
    return strQ('打乱的字母：' + shuffled + ' ，组成哪个单词？', w.en, pick3(pool, w.en, 'en'), '重组后是 ' + w.en + '（' + w.cn + '）', g);
  }
  function letterNext(g) { var i = rnd(0, 24), n = rnd(1, 3); var t = String.fromCharCode(65 + ((i + n) % 26)); return strQ('字母表中，' + String.fromCharCode(65 + i) + ' 后面第 ' + n + ' 个字母（大写）是？', t, [String.fromCharCode(65 + ((i + n + 1) % 26)), String.fromCharCode(65 + ((i + n + 25) % 26)), String.fromCharCode(97 + ((i + n) % 26))], '按字母表数过去是 ' + t, g); }
  function letterCase(g) { var i = rnd(0, 25); var up = String.fromCharCode(65 + i), lo = String.fromCharCode(97 + i);
    return Math.random() < 0.5
      ? strQ('字母 ' + lo + ' 的大写形式是？', up, [String.fromCharCode(65 + ((i + 1) % 26)), String.fromCharCode(65 + ((i + 25) % 26)), String.fromCharCode(65 + ((i + 2) % 26))], lo + ' 的大写是 ' + up, g)
      : strQ('字母 ' + up + ' 的小写形式是？', lo, [String.fromCharCode(97 + ((i + 1) % 26)), String.fromCharCode(97 + ((i + 25) % 26)), String.fromCharCode(97 + ((i + 2) % 26))], up + ' 的小写是 ' + lo, g); }
  function verb3s(g) { var p = pick(parsePairs2(VERB_3S)); return strQ('“' + p.a + '” 的第三人称单数形式是？', p.b, [p.a + 's', p.a + 'es', p.a + 'ing'].filter(function (x) { return x !== p.b; }), p.a + ' → ' + p.b, g); }
  function pastQ(g) { var p = pick(parsePairs2(VERB_PAST)); return strQ('“' + p.a + '” 的过去式是？', p.b, [p.a + 'ed', p.a + 'd', p.a].filter(function (x) { return x !== p.b; }), p.a + ' → ' + p.b + '（过去式）', g); }
  function ingQ(g) { var p = pick(parsePairs2(VERB_ING)); return strQ('“' + p.a + '” 的现在分词（-ing 形式）是？', p.b, [p.a + 'ing', p.a + 'eing', p.a + 'ting'].filter(function (x) { return x !== p.b; }), p.a + ' → ' + p.b, g); }
  function pronounQ(g) { var p = pick(PRONOUNS);
    return Math.random() < 0.5
      ? strQ('“' + p[0] + '” 的宾格形式是？', p[1], [p[2], p[0], p[0] + 's'].filter(function (x) { return x !== p[1]; }), p[0] + ' 的宾格是 ' + p[1], g)
      : strQ('“' + p[0] + '” 的形容词性物主代词是？', p[2], [p[1], p[0], p[0] + 's'].filter(function (x) { return x !== p[2]; }), p[0] + ' → ' + p[2], g); }
  function monthQ(g) { var p = pick(parsePairs2('January 一月|February 二月|March 三月|April 四月|May 五月|June 六月|July 七月|August 八月|September 九月|October 十月|November 十一月|December 十二月'));
    return Math.random() < 0.5
      ? strQ('“' + p.a + '” 的中文意思是？', p.b, ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'].filter(function (x) { return x !== p.b; }), p.a + ' = ' + p.b, g)
      : strQ('“' + p.b + '” 的英文是？', p.a, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'].filter(function (x) { return x !== p.a; }), p.b + ' = ' + p.a, g); }
  function weekQ(g) { var p = pick(parsePairs2('Monday 星期一|Tuesday 星期二|Wednesday 星期三|Thursday 星期四|Friday 星期五|Saturday 星期六|Sunday 星期日'));
    return Math.random() < 0.5
      ? strQ('“' + p.a + '” 的中文意思是？', p.b, ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].filter(function (x) { return x !== p.b; }), p.a + ' = ' + p.b, g)
      : strQ('“' + p.b + '” 的英文是？', p.a, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter(function (x) { return x !== p.a; }), p.b + ' = ' + p.a, g); }
  var EN_GENS = {
    1: [en2cn, cn2en, unscramble, letterNext, letterCase],
    2: [en2cn, cn2en, unscramble, letterNext, letterCase],
    3: [en2cn, cn2en, unscramble, verb3s],
    4: [en2cn, cn2en, unscramble, verb3s, monthQ],
    5: [en2cn, cn2en, unscramble, verb3s, monthQ, weekQ],
    6: [en2cn, cn2en, unscramble, verb3s, ingQ, monthQ, weekQ],
    7: [en2cn, cn2en, unscramble, pastQ, ingQ, pronounQ],
    8: [en2cn, cn2en, unscramble, pastQ, ingQ, pronounQ],
    9: [en2cn, cn2en, unscramble, pastQ, pronounQ]
  };

  /* ===================== 语文生成器（诗句/作者/近反义/成语/量词） ===================== */
  var POEMS = '锄禾日当午|汗滴禾下土|2;谁知盘中餐|粒粒皆辛苦|3;床前明月光|疑是地上霜|2;举头望明月|低头思故乡|2;春眠不觉晓|处处闻啼鸟|2;夜来风雨声|花落知多少|2;白日依山尽|黄河入海流|3;欲穷千里目|更上一层楼|3;飞流直下三千尺|疑是银河落九天|3;日照香炉生紫烟|遥看瀑布挂前川|3;两个黄鹂鸣翠柳|一行白鹭上青天|3;碧玉妆成一树高|万条垂下绿丝绦|3;不知细叶谁裁出|二月春风似剪刀|3;小荷才露尖尖角|早有蜻蜓立上头|4;春色满园关不住|一枝红杏出墙来|4;横看成岭侧成峰|远近高低各不同|4;李白乘舟将欲行|忽闻岸上踏歌声|4;桃花潭水深千尺|不及汪伦送我情|4;儿童散学归来早|忙趁东风放纸鸢|4;草长莺飞二月天|拂堤杨柳醉春烟|4;独在异乡为异客|每逢佳节倍思亲|4;窗含西岭千秋雪|门泊东吴万里船|4;两岸猿声啼不住|轻舟已过万重山|4;朝辞白帝彩云间|千里江陵一日还|4;少壮不努力|老大徒伤悲|4;危楼高百尺|手可摘星辰|4;泉眼无声惜细流|树阴照水爱晴柔|5;毕竟西湖六月中|风光不与四时同|5;接天莲叶无穷碧|映日荷花别样红|5;好雨知时节|当春乃发生|5;随风潜入夜|润物细无声|5;月落乌啼霜满天|江枫渔火对愁眠|5;姑苏城外寒山寺|夜半钟声到客船|5;遥知兄弟登高处|遍插茱萸少一人|5;不识庐山真面目|只缘身在此山中|5;竹外桃花三两枝|春江水暖鸭先知|5;故人西辞黄鹤楼|烟花三月下扬州|5;王师北定中原日|家祭无忘告乃翁|7;死去元知万事空|但悲不见九州同|7;京口瓜洲一水间|钟山只隔数重山|7;春风又绿江南岸|明月何时照我还|7;胜日寻芳泗水滨|无边光景一时新|7;等闲识得东风面|万紫千红总是春|7;生当作人杰|死亦为鬼雄|7;粉骨碎身浑不怕|要留清白在人间|7;千锤万凿出深山|烈火焚烧若等闲|7;湖光秋月两相和|潭面无风镜未磨|6;遥望洞庭山水翠|白银盘里一青螺|6;水光潋滟晴方好|山色空蒙雨亦奇|6;欲把西湖比西子|淡妆浓抹总相宜|6;昼出耘田夜绩麻|村庄儿女各当家|6;童孙未解供耕织|也傍桑阴学种瓜|6;绿遍山原白满川|子规声里雨如烟|6;乡村四月闲人少|才了蚕桑又插田|6;少小离家老大回|乡音无改鬓毛衰|6;煮豆燃豆萁|豆在釜中泣|6;百川东到海|何时复西归|6;茅檐长扫净无苔|花木成畦手自栽|8;一水护田将绿绕|两山排闼送青来|8;黑云翻墨未遮山|白雨跳珠乱入船|8;卷地风来忽吹散|望湖楼下水如天|8;梅子黄时日日晴|小溪泛尽却山行|8;绿阴不减来时路|添得黄鹂四五声|8;咬定青山不放松|立根原在破岩中|8;千磨万击还坚劲|任尔东西南北风|8;不要人夸好颜色|只留清气满乾坤|9;我家洗砚池头树|朵朵花开淡墨痕|9;采菊东篱下|悠然见南山|8;大漠孤烟直|长河落日圆|8;明月松间照|清泉石上流|8;空山新雨后|天气晚来秋|8;海内存知己|天涯若比邻|7;潮平两岸阔|风正一帆悬|7;海日生残夜|江春入旧年|7;造化钟神秀|阴阳割昏晓|8;会当凌绝顶|一览众山小|8;感时花溅泪|恨别鸟惊心|8;烽火连三月|家书抵万金|8;露从今夜白|月是故乡明|8;无边落木萧萧下|不尽长江滚滚来|9;安得广厦千万间|大庇天下寒士俱欢颜|9;忽如一夜春风来|千树万树梨花开|8;山回路转不见君|雪上空留马行处|8;天街小雨润如酥|草色遥看近却无|8;沉舟侧畔千帆过|病树前头万木春|8;东风不与周郎便|铜雀春深锁二乔|8;商女不知亡国恨|隔江犹唱后庭花|9;停车坐爱枫林晚|霜叶红于二月花|4;二十四桥明月夜|玉人何处教吹箫|9;夕阳无限好|只是近黄昏|7;春蚕到死丝方尽|蜡炬成灰泪始干|9;身无彩凤双飞翼|心有灵犀一点通|9;抽刀断水水更流|举杯消愁愁更愁|9;长风破浪会有时|直挂云帆济沧海|9;天生我材必有用|千金散尽还复来|9;两岸青山相对出|孤帆一片日边来|6;莫愁前路无知己|天下谁人不识君|4;黄河远上白云间|一片孤城万仞山|6;羌笛何须怨杨柳|春风不度玉门关|6;葡萄美酒夜光杯|欲饮琵琶马上催|7;秦时明月汉时关|万里长征人未还|6;但使龙城飞将在|不教胡马度阴山|6;黄沙百战穿金甲|不破楼兰终不还|7;大漠沙如雪|燕山月似钩|6;何当金络脑|快走踏清秋|6;九曲黄河万里沙|浪淘风簸自天涯|7;不畏浮云遮望眼|自缘身在最高层|7;小楼一夜听春雨|深巷明朝卖杏花|9;山重水复疑无路|柳暗花明又一村|7;夜阑卧听风吹雨|铁马冰河入梦来|8;纸上得来终觉浅|绝知此事要躬行|8;物是人非事事休|欲语泪先流|9;山外青山楼外楼|西湖歌舞几时休|7;青山遮不住|毕竟东流去|9;春花秋月何时了|往事知多少|9;问君能有几多愁|恰似一江春水向东流|9;无可奈何花落去|似曾相识燕归来|8;枯藤老树昏鸦|小桥流水人家|8;日暮乡关何处是|烟波江上使人愁|8;晴川历历汉阳树|芳草萋萋鹦鹉洲|8;气蒸云梦泽|波撼岳阳城|8;一年好景君须记|最是橙黄橘绿时|8;荷尽已无擎雨盖|菊残犹有傲霜枝|8;半亩方塘一鉴开|天光云影共徘徊|7;问渠那得清如许|为有源头活水来|7;一道残阳铺水中|半江瑟瑟半江红|5;可怜九月初三夜|露似真珠月似弓|5;乱花渐欲迷人眼|浅草才能没马蹄|7;几处早莺争暖树|谁家新燕啄春泥|7;绿蚁新醅酒|红泥小火炉|6;离离原上草|一岁一枯荣|3;野火烧不尽|春风吹又生|3;日出江花红胜火|春来江水绿如蓝|4;千山鸟飞绝|万径人踪灭|5;孤舟蓑笠翁|独钓寒江雪|5;迟日江山丽|春风花草香|3;泥融飞燕子|沙暖睡鸳鸯|5;正是江南好风景|落花时节又逢君|6;白日放歌须纵酒|青春作伴好还乡|8;明月几时有|把酒问青天|9;但愿人长久|千里共婵娟|9'.split(';').map(function (s) { var p = s.split('|'); return { prev: p[0], next: p[1], g: parseInt(p[2], 10) }; });
  var AUTHORS = '李白|望庐山瀑布|3;李白|赠汪伦|4;李白|静夜思|2;李白|早发白帝城|4;李白|望天门山|4;骆宾王|咏鹅|1;孟浩然|春晓|2;王之涣|登鹳雀楼|3;苏轼|题西林壁|4;苏轼|饮湖上初晴后雨|6;杜甫|绝句|3;白居易|赋得古原草送别|4;白居易|忆江南|5;王维|九月九日忆山东兄弟|4;王昌龄|出塞|5;贺知章|咏柳|3;贺知章|回乡偶书|6;李绅|悯农|2;杨万里|小池|4;杨万里|晓出净慈寺送林子方|5;叶绍翁|游园不值|4;朱熹|观书有感|7;陆游|游山西村|7;龚自珍|己亥杂诗|6;于谦|石灰吟|7;王冕|墨梅|9;郑燮|竹石|8;杜牧|山行|3;杜牧|清明|3;李商隐|夜雨寄北|8;张继|枫桥夜泊|5;孟郊|游子吟|4;王安石|泊船瓜洲|7;王安石|元日|3;刘禹锡|望洞庭|6;范仲淹|江上渔者|5;李白|黄鹤楼送孟浩然之广陵|5;王勃|送杜少府之任蜀州|8;岑参|白雪歌送武判官归京|8;韩愈|早春呈水部张十八员外|8;刘禹锡|酬乐天扬州初逢席上见赠|8;杜牧|江南春|4;李贺|雁门太守行|8;卢纶|塞下曲|6;罗隐|蜂|6;林升|题临安邸|7;辛弃疾|西江月·夜行黄沙道中|8;辛弃疾|破阵子·为陈同甫赋壮词以寄之|9;李清照|夏日绝句|7;苏轼|惠崇春江晚景|5;苏轼|水调歌头|9;柳宗元|江雪|5;王安石|书湖阴先生壁|8;晏殊|浣溪沙|8;白居易|暮江吟|5;白居易|钱塘湖春行|7;崔颢|黄鹤楼|8;孟浩然|过故人庄|8;孟浩然|望洞庭湖赠张丞相|8;张若虚|春江花月夜|9;马致远|天净沙·秋思|8;李煜|虞美人|9'.split(';').map(function (s) { var p = s.split('|'); return { author: p[0], work: p[1], g: parseInt(p[2], 10) }; });
  var ANTONYMS = '大 小|多 少|上 下|左 右|前 后|高 低|长 短|快 慢|黑 白|开 关|来 去|好 坏|冷 热|哭 笑|远 近|买 卖|东 西|南 北|深 浅|厚 薄|粗 细|宽 窄|明 暗|真 假|有 无|苦 甜|干 湿|难 易|曲 直|细 粗'.split('|').map(function (s) { var p = s.trim().split(' '); return { w: p[0], ant: p[1], g: 1 }; });
  var SYNONYMS = '美丽 漂亮|高兴 开心|立刻 马上|帮助 帮忙|著名 有名|非常 十分|突然 忽然|保护 爱护|希望 盼望|温暖 暖和|安静 宁静|赶快 赶紧|佩服 敬佩|惊讶 吃惊|牢固 结实|节约 节省|珍贵 宝贵|焦急 着急|渐渐 逐渐|依然 仍然|果然 果真|惊奇 惊讶|赞许 赞赏|顽强 坚强|特别 特殊|平凡 平常|繁忙 忙碌|舒适 舒服|雄伟 宏伟|茂密 茂盛|完毕 结束|吩咐 嘱咐|照顾 照料|隐蔽 隐藏|充沛 充足|幽静 清静|清楚 清晰|详细 详尽'.split('|').map(function (s) { var p = s.trim().split(' '); return { w: p[0], syn: p[1], g: 4 }; });
  var IDIOMS = '守株待兔 守朱待兔|拔苗助长 拨苗助长|刻舟求剑 刻舟求箭|掩耳盗铃 掩耳盗玲|自相矛盾 自相予盾|滥竽充数 烂竽充数|买椟还珠 买犊还珠|南辕北辙 南辕北彻|惊弓之鸟 惊弓之乌|画龙点睛 画龙点晴|胸有成竹 胸有成足|井底之蛙 井底之哇|画饼充饥 画饼充肌|望梅止渴 忘梅止渴|对牛弹琴 对牛谈琴|杯水车薪 杯水车新|雪中送炭 雪中送碳|锦上添花 绵上添花|全神贯注 全神惯注|一丝不苟 一丝不句|持之以恒 持之已恒|专心致志 专心至志|废寝忘食 费寝忘食|目不转睛 目不转晴|舍己为人 舍已为人|见义勇为 见意勇为|亡羊补牢 亡羊补劳|狐假虎威 狐借虎威|鹤立鸡群 喝立鸡群|画蛇添足 画蛇添竹|爱不释手 爱不释收|不假思索 不加思索|不计其数 不记其数|垂头丧气 捶头丧气|奋不顾身 愤不顾身|高瞻远瞩 高瞻远嘱|耿耿于怀 耿耿于坏|和颜悦色 合颜悦色|绘声绘色 会声会色|戒骄戒躁 戒骄戒燥|筋疲力尽 筋疲力劲|举世闻名 举世文名|居高临下 居高临夏|聚精会神 聚精汇神|刻不容缓 克不容缓|理直气壮 礼直气壮|连绵不断 连棉不断|眉清目秀 眉青目秀|弄虚作假 弄虚作加|迫在眉睫 迫在眉捷|千钧一发 千均一发|情不自禁 情不自尽|人才辈出 人才倍出|三顾茅庐 三顾茅芦|深思熟虑 深思熟虚|神机妙算 神机妙蒜|心花怒放 心花怒芳|心惊胆战 心惊胆站|兴高采烈 兴高采列|栩栩如生 诩诩如生|扬眉吐气 扬眉吐汽|一望无际 一望无迹|以理服人 以礼服人|异口同声 一口同声|意气风发 义气风发|引狼入室 引浪入室|饮水思源 饮水思原|应接不暇 应接不瑕|缘木求鱼 沿木求鱼|再接再厉 再接再励|张冠李戴 张冠李带|朝气蓬勃 朝气逢勃|争分夺秒 争分夺妙|趾高气扬 指高气扬|孜孜不倦 孜孜不卷|自暴自弃 自抱自弃|走投无路 走头无路|足智多谋 足智多某|坐井观天 座井观天'.split('|').map(function (s) { var p = s.trim().split(' '); return { ok: p[0], bad: p[1], g: 3 }; });
  var MEASURES = '鸟 只|河 条|牛 头|马 匹|山 座|树 棵|花 朵|伞 把|书 本|车 辆|飞机 架|船 艘|画 幅|歌 首|灯 盏|大象 头|鲸 头|蛇 条|草地 片|太阳 个|星星 颗|珍珠 颗|桥 座|井 口|戏 台|牙膏 支|枪 支|帽子 顶|床 张|钢琴 架'.split('|').map(function (s) { var p = s.trim().split(' '); return { n: p[0], m: p[1], g: 1 }; });
  function cnPoolBy(arr, g, key) { return arr.filter(function (x) { return x.g <= g; }); }
  function poemQ(g) { var pool = cnPoolBy(POEMS, g); var p = pick(pool);
    return Math.random() < 0.5
      ? strQ('「' + p.prev + '」的下一句是？', p.next, pick3(pool, p.next, 'next'), '「' + p.prev + '」的下一句是「' + p.next + '」', g)
      : strQ('「' + p.next + '」的上一句是？', p.prev, pick3(pool, p.prev, 'prev'), '「' + p.next + '」的上一句是「' + p.prev + '」', g); }
  function authorQ(g) { var pool = cnPoolBy(AUTHORS, g); var a = pick(pool);
    return strQ('《' + a.work + '》的作者是？', a.author, pick3(pool, a.author, 'author'), '《' + a.work + '》的作者是 ' + a.author, g); }
  function antQ(g) { var pool = cnPoolBy(ANTONYMS, g); var a = pick(pool);
    return strQ('「' + a.w + '」的反义词是？', a.ant, pick3(pool, a.ant, 'ant'), a.w + ' 的反义词是 ' + a.ant, g); }
  function synQ(g) { var pool = cnPoolBy(SYNONYMS, g); var a = pick(pool);
    return strQ('「' + a.w + '」的近义词是？', a.syn, pick3(pool, a.syn, 'syn'), a.w + ' 的近义词是 ' + a.syn, g); }
  function idiomQ(g) { var pool = cnPoolBy(IDIOMS, g);
    var ok = pick(pool);
    var wrongs = [], guard = 0;
    while (wrongs.length < 3 && guard++ < 60) { var o = pick(pool); if (o.bad !== ok.bad && wrongs.indexOf(o.bad) === -1) wrongs.push(o.bad); }
    return strQ('下面词语书写完全正确的是？', ok.ok, wrongs, '正确写法是「' + ok.ok + '」', g); }
  function measureQ(g) { var pool = MEASURES; var m = pick(pool);
    return strQ('一（ ）' + m.n + '，括号里应填的量词是？', m.m, pick3(pool, m.m, 'm'), '一' + m.m + m.n, g); }
  var CH_GENS = {
    1: [measureQ],
    2: [poemQ, authorQ, measureQ],
    3: [poemQ, authorQ, idiomQ, antQ, measureQ],
    4: [poemQ, authorQ, idiomQ, antQ, synQ],
    5: [poemQ, authorQ, idiomQ, antQ, synQ],
    6: [poemQ, authorQ, idiomQ, antQ, synQ],
    7: [poemQ, authorQ, idiomQ, antQ, synQ],
    8: [poemQ, authorQ, idiomQ, antQ, synQ],
    9: [poemQ, authorQ, idiomQ, antQ, synQ]
  };

  /* ============ 批量生成并合并进 math 题库 ============ */
  var TARGET_PER_GRADE = 950;
  Object.keys(G).forEach(function (key) {
    var g = parseInt(key, 10);
    var gens = G[key];
    var list = [];
    var seen = {};
    var guard = 0;
    var maxGuard = TARGET_PER_GRADE * 60;
    while (list.length < TARGET_PER_GRADE && guard++ < maxGuard) {
      var q = gens[Math.floor(Math.random() * gens.length)]();
      if (!q || !q.q || seen[q.q]) continue;
      seen[q.q] = 1;
      list.push(q);
    }
    BANK.math = (BANK.math || []).concat(list);
  });

  /* ===================== 物理生成器（计算类，八年级力学 / 九年级电学） ===================== */
  var PHY_GENS = {
    8: [
      function () { var x = rnd(1, 99); return numQ(x + ' 米 = ？厘米', x * 100, '1米=100厘米，' + x + '×100=' + (x * 100), 8); },
      function () { var x = rnd(1, 99); return numQ(x * 100 + ' 厘米 = ？米', x, (x * 100) + '÷100=' + x, 8); },
      function () { var x = rnd(1, 99); return numQ(x + ' 千米 = ？米', x * 1000, '1千米=1000米，' + x + '×1000=' + (x * 1000), 8); },
      function () { var x = rnd(1, 99); return numQ(x + ' 千克 = ？克', x * 1000, '1千克=1000克，' + x + '×1000=' + (x * 1000), 8); },
      function () { var x = rnd(1, 50); return numQ(x + ' 吨 = ？千克', x * 1000, '1吨=1000千克，' + x + '×1000=' + (x * 1000), 8); },
      function () { var x = rnd(1, 99); return numQ(x + ' 时 = ？分', x * 60, '1时=60分，' + x + '×60=' + (x * 60), 8); },
      function () { var x = rnd(1, 99); return numQ(x + ' 分 = ？秒', x * 60, '1分=60秒，' + x + '×60=' + (x * 60), 8); },
      function () { var v = rnd(2, 30), t = rnd(2, 30); return numQ('某物体 ' + t + ' 秒内通过 ' + (v * t) + ' 米，它的速度是？', v, 'v=s/t=' + (v * t) + '/' + t + '=' + v + ' m/s', 8); },
      function () { var v = rnd(2, 30), t = rnd(2, 30); return numQ('速度为 ' + v + ' m/s 的物体运动 ' + t + ' 秒，通过的路程是？', v * t, 's=vt=' + v + '×' + t + '=' + (v * t) + ' 米', 8); },
      function () { var v = rnd(2, 20), s = rnd(2, 40) * v; return numQ('物体以 ' + v + ' m/s 的速度通过 ' + s + ' 米，需要多少秒？', s / v, 't=s/v=' + s + '/' + v + '=' + (s / v) + ' 秒', 8); },
      function () { var p = rnd(2, 20), v = rnd(2, 50); return numQ('质量 ' + (p * v) + ' g 的物体体积为 ' + v + ' cm³，密度是？', p, 'ρ=m/V=' + (p * v) + '/' + v + '=' + p + ' g/cm³', 8); },
      function () { var p = rnd(2, 20), v = rnd(2, 50); return numQ('密度为 ' + p + ' g/cm³ 的物体，体积 ' + v + ' cm³，质量是？', p * v, 'm=ρV=' + p + '×' + v + '=' + (p * v) + ' g', 8); },
      function () { var p = rnd(2, 20), v = rnd(2, 50); return numQ('密度为 ' + p + ' g/cm³ 的物体，质量 ' + (p * v) + ' g，体积是？', v, 'V=m/ρ=' + (p * v) + '/' + p + '=' + v + ' cm³', 8); },
      function () { var m = rnd(2, 90); return numQ('质量 ' + m + ' kg 的物体，受到的重力约是？（g取10N/kg）', m * 10, 'G=mg=' + m + '×10=' + (m * 10) + ' N', 8); },
      function () { var p = rnd(1, 40) * 100, s = rnd(1, 5); return numQ('压力 ' + (p * s) + ' N 作用在 ' + s + ' m² 的面积上，压强是？', p, 'p=F/S=' + (p * s) + '/' + s + '=' + p + ' Pa', 8); },
      function () { var f = rnd(2, 50), s = rnd(2, 50); return numQ('力 ' + f + ' N 推动物体沿力的方向移动 ' + s + ' 米，做的功是？', f * s, 'W=Fs=' + f + '×' + s + '=' + (f * s) + ' J', 8); },
      function () { var pw = rnd(2, 50), t = rnd(2, 30); return numQ('功率 ' + pw + ' W 的机器工作 ' + t + ' 秒，做的功是？', pw * t, 'W=Pt=' + pw + '×' + t + '=' + (pw * t) + ' J', 8); },
      function () { var w = rnd(2, 60) * 10, t = rnd(2, 20); return numQ('做功 ' + w + ' J 用时 ' + t + ' 秒，功率是？', w / t, 'P=W/t=' + w + '/' + t + '=' + (w / t) + ' W', 8); },
      function () { var k = rnd(1, 9), s = rnd(2, 20); return numQ('杠杆动力臂是阻力臂的 ' + k + ' 倍，阻力 ' + s + ' N，动力是？', s / k, 'F₁L₁=F₂L₂，动力=' + s + '/' + k + '=' + (s / k) + ' N', 8); }
    ],
    9: [
      function () { var i = rnd(1, 9), r = rnd(2, 50); return numQ('电压 ' + (i * r) + ' V、电阻 ' + r + ' Ω，电流是？', i, 'I=U/R=' + (i * r) + '/' + r + '=' + i + ' A', 9); },
      function () { var i = rnd(1, 9), r = rnd(2, 50); return numQ('电流 ' + i + ' A、电阻 ' + r + ' Ω，电压是？', i * r, 'U=IR=' + i + '×' + r + '=' + (i * r) + ' V', 9); },
      function () { var i = rnd(1, 9), r = rnd(2, 50); return numQ('电压 ' + (i * r) + ' V、电流 ' + i + ' A，电阻是？', r, 'R=U/I=' + (i * r) + '/' + i + '=' + r + ' Ω', 9); },
      function () { var u = rnd(2, 60), i = rnd(1, 9); return numQ('电压 ' + u + ' V、电流 ' + i + ' A，电功率是？', u * i, 'P=UI=' + u + '×' + i + '=' + (u * i) + ' W', 9); },
      function () { var u = rnd(2, 40), i = rnd(1, 5), t = rnd(2, 30); return numQ('用电器两端电压 ' + u + ' V、电流 ' + i + ' A，工作 ' + t + ' 秒消耗电能？', u * i * t, 'W=UIt=' + u + '×' + i + '×' + t + '=' + (u * i * t) + ' J', 9); },
      function () { var i = rnd(1, 5), r = rnd(2, 20), t = rnd(2, 20); return numQ('电流 ' + i + ' A 通过 ' + r + ' Ω 的电阻，通电 ' + t + ' 秒产生热量？', i * i * r * t, 'Q=I²Rt=' + i + '²×' + r + '×' + t + '=' + (i * i * r * t) + ' J', 9); },
      function () { var i = rnd(1, 9); return numQ('串联电路中电流为 ' + i + ' A，则电路中各处电流均为？', i, '串联电路电流处处相等，均为 ' + i + ' A', 9); },
      function () { var u = rnd(2, 30); return numQ('并联电路某支路电压为 ' + u + ' V，电源电压为？', u, '并联电路各支路电压相等，电源电压等于支路电压 ' + u + ' V', 9); },
      function () { var p = rnd(2, 30), t = rnd(2, 60) * 60; return numQ('功率 ' + p + ' W 的用电器工作 1 分钟，消耗电能？', p * t / 60, 'W=Pt=' + p + '×60=' + (p * 60) + ' J', 9); },
      function () { var p = rnd(1, 20) * 100; return numQ(p + ' W = ？ kW', p / 1000, '1kW=1000W，' + p + '÷1000=' + (p / 1000) + ' kW', 9); },
      function () { var x = rnd(1, 20); return numQ(x / 1000 + ' kW = ？ W', x, (x / 1000) + 'kW=' + x + '×1000=' + x + ' W', 9); }
    ]
  };

  /* ===================== 化学生成器（元素/化学式/化合价，九年级） ===================== */
  var ELEMS = '氢 H 1|氦 He 2|锂 Li 3|铍 Be 4|硼 B 5|碳 C 6|氮 N 7|氧 O 8|氟 F 9|氖 Ne 10|钠 Na 11|镁 Mg 12|铝 Al 13|硅 Si 14|磷 P 15|硫 S 16|氯 Cl 17|氩 Ar 18|钾 K 19|钙 Ca 20|锰 Mn 25|铁 Fe 26|铜 Cu 29|锌 Zn 30'.split('|').map(function (s) { var p = s.trim().split(' '); return { cn: p[0], sym: p[1], z: parseInt(p[2], 10) }; });
  var FORMULAS = '水 H₂O 18|二氧化碳 CO₂ 44|氧气 O₂ 32|氢气 H₂ 2|氮气 N₂ 28|氯化钠 NaCl 58.5|一氧化碳 CO 28|盐酸 HCl 36.5|硫酸 H₂SO₄ 98|氢氧化钠 NaOH 40|碳酸钙 CaCO₃ 100|碳酸钠 Na₂CO₃ 106|甲烷 CH₄ 16|氨气 NH₃ 17|二氧化硫 SO₂ 64|五氧化二磷 P₂O₅ 142|氧化铜 CuO 80|氧化镁 MgO 40|氧化铝 Al₂O₃ 102|四氧化三铁 Fe₃O₄ 232|氧化铁 Fe₂O₃ 160|硝酸 HNO₃ 63|氢氧化钙 Ca(OH)₂ 74|氢氧化钾 KOH 56|硫酸铜 CuSO₄ 160|硫酸钠 Na₂SO₄ 142|硝酸银 AgNO₃ 170|碳酸氢钠 NaHCO₃ 84|乙醇 C₂H₅OH 46|醋酸 CH₃COOH 60|葡萄糖 C₆H₁₂O₆ 180|硝酸钾 KNO₃ 101|氯化钾 KCl 74.5|氯化镁 MgCl₂ 95|氯化钙 CaCl₂ 111|二氧化氮 NO₂ 46|一氧化氮 NO 30|二氧化锰 MnO₂ 87|高锰酸钾 KMnO₄ 158|磷酸 H₃PO₄ 98'.split('|').map(function (s) { var p = s.trim().split(' '); return { cn: p[0], f: p[1], m: parseFloat(p[2]) }; });
  var VALENCES = '氢 +1|氧 -2|钠 +1|钾 +1|镁 +2|钙 +2|铝 +3|锌 +2|银 +1|碳 +4|硅 +4|氯 -1'.split('|').map(function (s) { var p = s.trim().split(' '); return { cn: p[0], v: p[1] }; });
  var CHEM_GENS = {
    9: [
      function () { var e = pick(ELEMS); return strQ('元素“' + e.cn + '”的元素符号是？', e.sym, pick3(ELEMS, e.sym, 'sym'), e.cn + ' 的元素符号是 ' + e.sym, 9); },
      function () { var e = pick(ELEMS); return strQ('元素符号 “' + e.sym + '” 表示的元素是？', e.cn, pick3(ELEMS, e.cn, 'cn'), e.sym + ' 是 ' + e.cn + ' 元素', 9); },
      function () { var e = pick(ELEMS); return strQ('原子序数为 ' + e.z + ' 的元素是？', e.cn, pick3(ELEMS, e.cn, 'cn'), '第 ' + e.z + ' 号元素是 ' + e.cn + '（' + e.sym + '）', 9); },
      function () { var f = pick(FORMULAS); return numQ(f.f + ' 的相对分子质量是？', f.m, f.cn + '（' + f.f + '）的相对分子质量 = ' + f.m, 9, 1); },
      function () { var f = pick(FORMULAS); return strQ('“' + f.cn + '”的化学式是？', f.f, pick3(FORMULAS, f.f, 'f'), f.cn + ' 的化学式是 ' + f.f, 9); },
      function () { var f = pick(FORMULAS); return strQ('化学式 “' + f.f + '” 表示的物质是？', f.cn, pick3(FORMULAS, f.cn, 'cn'), f.f + ' 是 ' + f.cn, 9); },
      function () { var v = pick(VALENCES); return strQ('“' + v.cn + '”元素在化合物中通常显的化合价是？', v.v, ['+1', '+2', '+3', '-1', '-2', '+4'].filter(function (x) { return x !== v.v; }), v.cn + ' 通常显 ' + v.v + ' 价', 9); },
      function () { var e = pick(ELEMS); return numQ('元素 “' + e.cn + '” 的原子序数是？', e.z, e.cn + ' 的原子序数是 ' + e.z, 9); }
    ]
  };

  /* ===================== 各科合并 ===================== */
  function mergeByGrade(subject, gensByGrade, target) {
    Object.keys(gensByGrade).forEach(function (key) {
      var g = parseInt(key, 10);
      var gens = gensByGrade[key];
      if (!gens || !gens.length) return;
      var list = [], seen = {}, guard = 0;
      while (list.length < target && guard++ < target * 60) {
        var q = gens[Math.floor(Math.random() * gens.length)](g);
        if (!q || !q.q || seen[q.q]) continue;
        seen[q.q] = 1;
        list.push(q);
      }
      BANK[subject] = (BANK[subject] || []).concat(list);
    });
  }
  mergeByGrade('english', EN_GENS, 1100);
  mergeByGrade('chinese', CH_GENS, 500);
  mergeByGrade('physics', PHY_GENS, 900);
  mergeByGrade('chemistry', CHEM_GENS, 300);
  /* 暴露词表给词库闯关模块使用 */
  window.__EN_WORDS__ = EN_WORDS;
})();
