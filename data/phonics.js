/* ===================== 英语音标学习数据 =====================
 * 结构：
 *   window.__PHONICS__ = {
 *     vowels:   [ { sym:音标, hint:拼音近似, mouth:口型要领, tip:口诀/形象, group:分组,
 *                   spells:常见拼写(如 'ee, ea, e'), words:[{w:单词, ph:音标}...] } ],
 *     consonants: [...同上],
 *     pairs:    [ { voiceless:清音对象引用key, voiced:浊音, note:成对说明 } ]
 *   }
 * 说明：
 *   - sym 为国际音标字符（含长音符号 ː）；朗读用 speakEn 逐个朗读
 *   - words 每个给出 1~2 个例词及完整音标，ph 列用方括号样式在前端渲染
 */
window.__PHONICS__ = (function () {
  var vowels = [
    { sym:'iː', hint:'衣(长)', group:'单元音', mouth:'嘴角向两边咧开，像微笑，舌头前部抬高，发长音「衣」，声音拉长', tip:'微笑长衣 /iː/（像咧嘴笑）', spells:'ee, ea, e, ie', words:[{w:'sheep', ph:'/ʃiːp/'},{w:'tea', ph:'/tiː/'}] },
    { sym:'ɪ',  hint:'衣(短)', group:'单元音', mouth:'比 /iː/ 短促放松，嘴微张，下巴略低，发短音「衣」', tip:'短促小衣 /ɪ/（发一下就行）', spells:'i, y', words:[{w:'sit', ph:'/sɪt/'},{w:'fish', ph:'/fɪʃ/'}] },
    { sym:'e',  hint:'诶',   group:'单元音', mouth:'嘴半开，舌头放平，像说「诶」但更短，舌尖抵下齿', tip:'咧嘴小诶 /e/（发短促）', spells:'e, ea', words:[{w:'bed', ph:'/bed/'},{w:'head', ph:'/hed/'}] },
    { sym:'æ',  hint:'啊(咧嘴)', group:'单元音', mouth:'嘴巴张大，嘴角向两边拉，发「啊」但更扁，下巴用力向下', tip:'张大嘴啊 /æ/（像看牙医）', spells:'a', words:[{w:'cat', ph:'/kæt/'},{w:'bag', ph:'/bæg/'}] },
    { sym:'ɜː', hint:'呃(长)', group:'单元音', mouth:'舌中部抬高，嘴唇放松，发「呃」长音，像犹豫时说"呃……"', tip:'卷舌长呃 /ɜː/（想事情）', spells:'ir, er, ur', words:[{w:'bird', ph:'/bɜːd/'},{w:'girl', ph:'/ɡɜːl/'}] },
    { sym:'ə',  hint:'呃(轻)', group:'单元音', mouth:'嘴巴放松微张，发很轻很短的「呃」，几乎不张嘴', tip:'轻轻小呃 /ə/（发一下就过）', spells:'a, er, o', words:[{w:'banana', ph:'/bəˈnɑːnə/'},{w:'water', ph:'/ˈwɔːtə/'}] },
    { sym:'ʌ',  hint:'啊(短)', group:'单元音', mouth:'嘴半开，舌后部抬起，发短而有力的「啊」，像被人拍一下', tip:'短促啊 /ʌ/（吓了一跳）', spells:'u, o', words:[{w:'bus', ph:'/bʌs/'},{w:'cup', ph:'/kʌp/'}] },
    { sym:'ɑː',  hint:'啊(张大)', group:'单元音', mouth:'嘴巴张到最大，舌放平压低，发长音「啊」，像医生检查喉咙', tip:'张大长啊 /ɑː/（看医生）', spells:'ar, a', words:[{w:'car', ph:'/kɑː/'},{w:'fast', ph:'/fɑːst/'}] },
    { sym:'ɒ',  hint:'奥(短)', group:'单元音', mouth:'嘴张大，嘴唇略圆，发短音「奥」，声音低沉', tip:'短促奥 /ɒ/（有点惊讶）', spells:'o', words:[{w:'dog', ph:'/dɒɡ/'},{w:'box', ph:'/bɒks/'}] },
    { sym:'ɔː',  hint:'喔(长)', group:'单元音', mouth:'嘴唇收圆并向前突出，发长音「喔」', tip:'圆唇长喔 /ɔː/（像吹口哨）', spells:'or, al, aw', words:[{w:'door', ph:'/dɔː/'},{w:'ball', ph:'/bɔːl/'}] },
    { sym:'ʊ',  hint:'乌(短)', group:'单元音', mouth:'嘴唇微圆，舌后部抬高，发短促的「乌」，肌肉放松', tip:'短促乌 /ʊ/（很轻松）', spells:'o, oo, u', words:[{w:'book', ph:'/bʊk/'},{w:'look', ph:'/lʊk/'}] },
    { sym:'uː',  hint:'乌(长)', group:'单元音', mouth:'嘴唇收圆凸出，舌后部高高抬起，发长音「乌」，像火车鸣笛', tip:'圆唇长乌 /uː/（火车来啦）', spells:'oo, ue, u, ew', words:[{w:'moon', ph:'/muːn/'},{w:'blue', ph:'/bluː/'}] },
    { sym:'eɪ',  hint:'诶衣', group:'双元音', mouth:'由 /e/ 滑向 /ɪ/，口型从半开到微合，发「诶衣」，声音圆滑连贯', tip:'滑音诶衣 /eɪ/（一个音滑动）', spells:'a, ai, ay, ea', words:[{w:'cake', ph:'/keɪk/'},{w:'rain', ph:'/reɪn/'}] },
    { sym:'aɪ',  hint:'啊衣', group:'双元音', mouth:'由 /ɑː/ 滑向 /ɪ/，嘴巴从张大滑到微合，发「啊衣」', tip:'滑音啊衣 /aɪ/（哇，好亮）', spells:'i, ie, y, igh', words:[{w:'kite', ph:'/kaɪt/'},{w:'like', ph:'/laɪk/'}] },
    { sym:'ɔɪ',  hint:'喔衣', group:'双元音', mouth:'由 /ɔː/ 滑向 /ɪ/，从圆唇滑到扁唇，发「喔衣」', tip:'滑音喔衣 /ɔɪ/（发现宝贝）', spells:'oi, oy', words:[{w:'boy', ph:'/bɔɪ/'},{w:'coin', ph:'/kɔɪn/'}] },
    { sym:'aʊ',  hint:'啊乌', group:'双元音', mouth:'由 /ɑː/ 滑向 /ʊ/，嘴巴从大张滑到圆收，发「啊乌」', tip:'滑音啊乌 /aʊ/（哎呀好疼）', spells:'ou, ow', words:[{w:'house', ph:'/haʊs/'},{w:'cow', ph:'/kaʊ/'}] },
    { sym:'əʊ',  hint:'欧',   group:'双元音', mouth:'由 /ə/ 滑向 /ʊ/，从放松到圆唇，发「欧」，像说 Oh', tip:'滑音欧 /əʊ/（哦，原来如此）', spells:'o, oa, ow, oe', words:[{w:'go', ph:'/ɡəʊ/'},{w:'boat', ph:'/bəʊt/'}] },
    { sym:'ɪə',  hint:'衣呃', group:'双元音', mouth:'由 /ɪ/ 滑向 /ə/，口型从微张滑到放松，发「衣呃」', tip:'滑音衣呃 /ɪə/（耳朵 near）', spells:'ear, eer, ere', words:[{w:'ear', ph:'/ɪə/'},{w:'here', ph:'/hɪə/'}] },
    { sym:'eə',  hint:'诶呃', group:'双元音', mouth:'由 /e/ 滑向 /ə/，发「诶呃」，舌头向后滑动', tip:'滑音诶呃 /eə/（空气 air）', spells:'air, are, ear', words:[{w:'chair', ph:'/tʃeə/'},{w:'hair', ph:'/heə/'}] },
    { sym:'ʊə',  hint:'乌呃', group:'双元音', mouth:'由 /ʊ/ 滑向 /ə/，从圆唇滑到放松，发「乌呃」', tip:'滑音乌呃 /ʊə/（很少用的音）', spells:'ure, oor', words:[{w:'tour', ph:'/tʊə/'},{w:'poor', ph:'/pʊə/'}] }
  ];

  var consonants = [
    { sym:'p',  hint:'泼(清)', group:'爆破音', mouth:'双唇紧闭，憋气后突然放开，气流冲出，声带不振动（清音）', tip:'双唇爆破 /p/（不振动声带）', spells:'p, pp', words:[{w:'pen', ph:'/pen/'},{w:'apple', ph:'/ˈæpl/'}] },
    { sym:'b',  hint:'波(浊)', group:'爆破音', mouth:'和 /p/ 一样双唇爆破，但声带振动（浊音），像说「伯」', tip:'双唇爆破 /b/（声带振动）', spells:'b, bb', words:[{w:'book', ph:'/bʊk/'},{w:'baby', ph:'/ˈbeɪbi/'}] },
    { sym:'t',  hint:'特(清)', group:'爆破音', mouth:'舌尖抵上齿龈，憋气后弹开，气流冲出，声带不振动', tip:'舌尖爆破 /t/（不振动）', spells:'t, tt', words:[{w:'ten', ph:'/ten/'},{w:'cat', ph:'/kæt/'}] },
    { sym:'d',  hint:'德(浊)', group:'爆破音', mouth:'和 /t/ 位置相同，舌尖弹开时声带振动，像说「得」', tip:'舌尖爆破 /d/（声带振动）', spells:'d, dd', words:[{w:'dog', ph:'/dɒɡ/'},{w:'red', ph:'/red/'}] },
    { sym:'k',  hint:'科(清)', group:'爆破音', mouth:'舌后部抵软腭，憋气后突然放开，气流冲出，声带不振动', tip:'舌根爆破 /k/（不振动）', spells:'k, c, ck, ch', words:[{w:'kite', ph:'/kaɪt/'},{w:'cake', ph:'/keɪk/'}] },
    { sym:'ɡ',  hint:'哥(浊)', group:'爆破音', mouth:'和 /k/ 位置相同，但声带振动，像说「哥」', tip:'舌根爆破 /ɡ/（声带振动）', spells:'g, gg, gu', words:[{w:'go', ph:'/ɡəʊ/'},{w:'egg', ph:'/eɡ/'}] },
    { sym:'f',  hint:'夫(清)', group:'摩擦音', mouth:'下唇轻触上齿，气流从缝隙挤出摩擦，声带不振动', tip:'上齿咬唇 /f/（不振动）', spells:'f, ff, ph', words:[{w:'fish', ph:'/fɪʃ/'},{w:'phone', ph:'/fəʊn/'}] },
    { sym:'v',  hint:'夫(浊)', group:'摩擦音', mouth:'和 /f/ 位置相同，但声带振动，像说「乌」的浊化', tip:'上齿咬唇 /v/（声带振动）', spells:'v, ve', words:[{w:'van', ph:'/væn/'},{w:'five', ph:'/faɪv/'}] },
    { sym:'θ',  hint:'咬舌丝(清)', group:'摩擦音', mouth:'舌尖轻放在上下齿之间，气流从齿缝挤出，声带不振动', tip:'舌尖咬齿 /θ/（吐舌头）', spells:'th', words:[{w:'three', ph:'/θriː/'},{w:'mouth', ph:'/maʊθ/'}] },
    { sym:'ð',  hint:'咬舌得(浊)', group:'摩擦音', mouth:'和 /θ/ 位置相同，但声带振动，像含舌说「的」', tip:'舌尖咬齿 /ð/（振动）', spells:'th', words:[{w:'this', ph:'/ðɪs/'},{w:'mother', ph:'/ˈmʌðə/'}] },
    { sym:'s',  hint:'丝(清)', group:'摩擦音', mouth:'舌尖靠近上齿龈，气流从窄缝挤出，像蛇吐信「嘶」，声带不振动', tip:'蛇吐信 /s/（嘶嘶声）', spells:'s, ss, c, ce', words:[{w:'six', ph:'/sɪks/'},{w:'bus', ph:'/bʌs/'}] },
    { sym:'z',  hint:'兹(浊)', group:'摩擦音', mouth:'和 /s/ 位置相同，但声带振动，像蜜蜂嗡嗡', tip:'蜜蜂嗡嗡 /z/（声带振动）', spells:'z, s, ss', words:[{w:'zoo', ph:'/zuː/'},{w:'nose', ph:'/nəʊz/'}] },
    { sym:'ʃ',  hint:'湿(清)', group:'摩擦音', mouth:'舌头卷向上齿龈后部，双唇前伸，气流摩擦，发「嘘」让小朋友安静', tip:'嘘……安静 /ʃ/（不振动）', spells:'sh, ch, tion', words:[{w:'ship', ph:'/ʃɪp/'},{w:'fish', ph:'/fɪʃ/'}] },
    { sym:'ʒ',  hint:'日(浊)', group:'摩擦音', mouth:'和 /ʃ/ 位置相同，但声带振动，发「日」的半浊', tip:'振动之日 /ʒ/（很少见）', spells:'s, si, ge', words:[{w:'television', ph:'/ˈtelɪvɪʒn/'},{w:'usually', ph:'/ˈjuːʒuəli/'}] },
    { sym:'h',  hint:'喝(清)', group:'摩擦音', mouth:'喉咙发出轻轻的气流摩擦声，像哈气取暖，声带不振动', tip:'哈气 /h/（给手哈气）', spells:'h, wh', words:[{w:'hat', ph:'/hæt/'},{w:'house', ph:'/haʊs/'}] },
    { sym:'r',  hint:'若(浊)', group:'流音',   mouth:'舌尖卷向上齿龈后部但不接触，嘴唇微圆，声带振动', tip:'卷舌若 /r/（舌头打卷）', spells:'r, rr, wr', words:[{w:'red', ph:'/red/'},{w:'write', ph:'/raɪt/'}] },
    { sym:'l',  hint:'勒(浊)', group:'流音',   mouth:'舌尖抵上齿龈，气流从舌头两侧流出，声带振动', tip:'舌尖两侧 /l/（嘴巴咧开）', spells:'l, ll', words:[{w:'leg', ph:'/leɡ/'},{w:'apple', ph:'/ˈæpl/'}] },
    { sym:'m',  hint:'姆(浊)', group:'鼻音',   mouth:'双唇闭紧，气流从鼻子出来，声带振动', tip:'闭嘴哼 /m/（从鼻子出气）', spells:'m, mm', words:[{w:'mum', ph:'/mʌm/'},{w:'moon', ph:'/muːn/'}] },
    { sym:'n',  hint:'恩(浊)', group:'鼻音',   mouth:'舌尖抵上齿龈，气流从鼻子出来，声带振动', tip:'舌尖哼 /n/（鼻子出气）', spells:'n, nn, kn', words:[{w:'nose', ph:'/nəʊz/'},{w:'knife', ph:'/naɪf/'}] },
    { sym:'ŋ',  hint:'嗯(浊)', group:'鼻音',   mouth:'舌后部抵软腭，气流从鼻子出来，声带振动，像「嗯」的鼻音', tip:'舌根哼 /ŋ/（鼻子后部）', spells:'ng, n', words:[{w:'king', ph:'/kɪŋ/'},{w:'sing', ph:'/sɪŋ/'}] },
    { sym:'w',  hint:'乌(浊)', group:'半元音', mouth:'双唇收圆突出，像发 /uː/ 但极短，立即滑到后面的元音', tip:'圆唇乌 /w/（快速划过）', spells:'w, wh', words:[{w:'we', ph:'/wiː/'},{w:'water', ph:'/ˈwɔːtə/'}] },
    { sym:'j',  hint:'耶(浊)', group:'半元音', mouth:'舌前部抬近硬腭，像发 /iː/ 但极短，立即滑到后面的元音', tip:'滑音耶 /j/（一滑而过）', spells:'y, i', words:[{w:'yes', ph:'/jes/'},{w:'yellow', ph:'/ˈjeləʊ/'}] },
    { sym:'tʃ', hint:'取(清)', group:'破擦音', mouth:'先发 /t/ 再立刻滑向 /ʃ/，两音连成一个音，声带不振动', tip:'先爆破后摩擦 /tʃ/', spells:'ch, tch', words:[{w:'chair', ph:'/tʃeə/'},{w:'watch', ph:'/wɒtʃ/'}] },
    { sym:'dʒ', hint:'知(浊)', group:'破擦音', mouth:'先发 /d/ 再立刻滑向 /ʒ/，连成一个音，声带振动', tip:'先爆破后摩擦 /dʒ/（声带振动）', spells:'j, g, dge', words:[{w:'jeep', ph:'/dʒiːp/'},{w:'orange', ph:'/ˈɒrɪndʒ/'}] },
    { sym:'tr', hint:'戳(清)', group:'破擦音', mouth:'先发 /t/ 再滑向 /r/，唇微圆，连成一个音，声带不振动', tip:'先爆破后卷舌 /tr/', spells:'tr', words:[{w:'tree', ph:'/triː/'},{w:'train', ph:'/treɪn/'}] },
    { sym:'dr', hint:'捉(浊)', group:'破擦音', mouth:'先发 /d/ 再滑向 /r/，唇微圆，连成一个音，声带振动', tip:'先爆破后卷舌 /dr/（振动）', spells:'dr', words:[{w:'dress', ph:'/dres/'},{w:'driver', ph:'/ˈdraɪvə/'}] },
    { sym:'ts', hint:'次(清)', group:'破擦音', mouth:'先发 /t/ 再滑向 /s/，连成一个音，声带不振动', tip:'先爆破后丝 /ts/', spells:'ts, tes', words:[{w:'cats', ph:'/kæts/'},{w:'hats', ph:'/hæts/'}] },
    { sym:'dz', hint:'自(浊)', group:'破擦音', mouth:'先发 /d/ 再滑向 /z/，连成一个音，声带振动', tip:'先爆破后嗡 /dz/（振动）', spells:'ds, des', words:[{w:'hands', ph:'/hændz/'},{w:'birds', ph:'/bɜːdz/'}] }
  ];

  /* 清浊成对（用于详情页对比展示） */
  var pairs = [
    { voiceless:'p', voiced:'b', note:'双唇爆破，清音 p 声带不振动，浊音 b 声带振动' },
    { voiceless:'t', voiced:'d', note:'舌尖爆破，清音 t 不振动，浊音 d 振动' },
    { voiceless:'k', voiced:'ɡ', note:'舌根爆破，清音 k 不振动，浊音 g 振动' },
    { voiceless:'f', voiced:'v', note:'上齿咬下唇，清音 f 不振动，浊音 v 振动' },
    { voiceless:'θ', voiced:'ð', note:'舌尖放齿间，清音 th 不振动（mouth），浊音 th 振动（mother）' },
    { voiceless:'s', voiced:'z', note:'都是"嘶嘶"气流音，清音 s 不振动，浊音 z 振动' },
    { voiceless:'ʃ', voiced:'ʒ', note:'像"嘘"的摩擦音，清音 sh 不振动，浊音 zh 振动' },
    { voiceless:'tʃ', voiced:'dʒ', note:'破擦音，先 t/d 再摩擦，清音 ch 不振动，浊音 j 振动' },
    { voiceless:'tr', voiced:'dr', note:'先爆破再卷舌，清音 tr 不振动，浊音 dr 振动' },
    { voiceless:'ts', voiced:'dz', note:'复数名词尾音，清音 ts（cats），浊音 dz（hands）' }
  ];

  return { vowels: vowels, consonants: consonants, pairs: pairs };
})();