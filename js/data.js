/* =========================================================
 * 咒术回战 · 全能转盘模拟器 - 角色与事件卡池数据
 * 仅使用全局命名空间，支持本地双击 file:// 直接运行
 * ========================================================= */
(function (global) {
  'use strict';

  const TIER_META = {
    SSR:  { label: '特级', color: '#f59e0b' },
    SR:   { label: '一级', color: '#a855f7' },
    R:    { label: '常规', color: '#0ea5e9' },
    MEME: { label: '整活', color: '#f43f5e' }
  };

  const SLICE_PALETTE = {
    SSR:  ['#b45309', '#d97706', '#ca8a04'],
    SR:   ['#6b21a8', '#7e22ce', '#5b21b6'],
    R:    ['#0369a1', '#0284c7', '#1d4ed8'],
    MEME: ['#9f1239', '#be123c', '#881337']
  };

  const SPEED_CONFIG = {
    slow:   { duration: 3600, extraSpins: 7 },
    normal: { duration: 1850, extraSpins: 5 },
    fast:   { duration: 700,  extraSpins: 3 }
  };

  const DEFAULT_PUZZLE_SLOTS = [
    {
      id: 'physique',
      title: '体格 / 肉体',
      icon: '💪',
      items: [
        { id: 'toji_body', char: '伏黑甚尔', name: '完全体天与暴君', tier: 'SSR', weight: 7, stats: [-40, 100, 0, 75, 65], desc: '零咒力换取人类巅峰肉体，五感拉满免疫必中结界', tags: ['toji', 'zero_ce'] },
        { id: 'sukuna_body', char: '两面宿傩', name: '四手两嘴受肉体', tier: 'SSR', weight: 6, stats: [85, 96, 80, 95, 70], desc: '打架兼结印吟唱两不误，咒术界最完美的战斗躯壳', tags: ['sukuna'] },
        { id: 'yuji_body', char: '虎杖悠仁', name: '宿傩人造容器', tier: 'SR', weight: 9, stats: [65, 92, 55, 65, 85], desc: '天生怪力堪比不带咒力的甚尔，抗毒抗诅咒拉满', tags: ['yuji'] },
        { id: 'maki_body', char: '禅院真希', name: '觉醒天与肉体', tier: 'SSR', weight: 7, stats: [-40, 98, 0, 78, 70], desc: '摆脱双生子束缚，肉身硬抗超音速直哉', tags: ['maki', 'zero_ce'] },
        { id: 'todo_body', char: '东堂葵', name: '铁血肌肉猛男', tier: 'SR', weight: 10, stats: [70, 86, 60, 95, 80], desc: '高大威猛抗揍王，关键时刻断手也能拍掌', tags: ['todo'] },
        { id: 'choso_body', char: '胀相', name: '咒胎九相图混血', tier: 'SR', weight: 10, stats: [78, 76, 75, 75, 72], desc: '咒力直接转化为血液，不怕常规失血过多', tags: ['choso'] },
        { id: 'gojo_body', char: '五条悟', name: '190cm大长腿', tier: 'SR', weight: 9, stats: [82, 88, 82, 85, 75], desc: '颜值天花板兼顶级体格，可惜某话被切了腰', tags: ['gojo'] },
        { id: 'nanami_body', char: '七海建人', name: '社畜猛男体魄', tier: 'R', weight: 11, stats: [68, 82, 65, 80, 55], desc: '西装暴徒，即便半边烧伤也能砍完剩余咒灵', tags: ['nanami'] },
        { id: 'panda_body', char: '熊猫', name: '三核突击咒骸', tier: 'R', weight: 11, stats: [66, 78, 50, 70, 65], desc: '自带大猩猩模式与姐姐核，三条命容错率高', tags: [] },
        { id: 'miwa_body', char: '三轮霞', name: '女高中生体格', tier: 'R', weight: 12, stats: [45, 52, 45, 60, 75], desc: '平平无奇可爱JK，被宿傩看一眼就汗流浃背', tags: ['miwa'] },
        { id: '25gojo_body', char: '2.5条悟', name: '可拆卸拼图身躯', tier: 'MEME', weight: 6, isMeme: true, stats: [60, 40, 60, 50, 15], desc: '上半身在机场聊天，下半身原地站立', tags: ['gojo', 'meme_cut'] },
        { id: 'muta_body', char: '究极机械丸', name: '病弱天与缺氧体', tier: 'MEME', weight: 6, isMeme: true, stats: [95, 15, 75, 85, 30], desc: '月光一照就皮肤溃烂，只能躺在浴缸里开高达', tags: [] }
      ]
    },
    {
      id: 'ce',
      title: '咒力 / 蓝量',
      icon: '🔵',
      items: [
        { id: 'gojo_ce', char: '五条悟', name: '六眼·几乎零消耗', tier: 'SSR', weight: 6, stats: [98, 70, 95, 98, 80], desc: '单次消耗趋近于零，能24小时自动刷新大脑术式', tags: ['gojo', 'six_eyes'] },
        { id: 'sukuna_ce', char: '两面宿傩', name: '双倍乙骨海啸蓝量', tier: 'SSR', weight: 6, stats: [100, 80, 92, 95, 70], desc: '咒力深不见底且精密控制力堪比神明', tags: ['sukuna'] },
        { id: 'yuta_ce', char: '乙骨忧太', name: '深渊级纯爱咒力', tier: 'SSR', weight: 7, stats: [97, 75, 85, 80, 88], desc: '随手溢出吓哭虎杖，连接里香后无限五分钟补蓝', tags: ['yuta'] },
        { id: 'hakari_ce', char: '秤金次', name: '4分11秒无限溢出', tier: 'SSR', weight: 7, stats: [95, 82, 75, 72, 100], desc: '摇出777后咒力无限满溢，状态期间直接无敌', tags: ['hakari'] },
        { id: 'kashimo_ce', char: '鹿紫云一', name: '雷电特性化咒力', tier: 'SR', weight: 9, stats: [85, 80, 78, 72, 45], desc: '普攻自带必中雷击，可惜在新宿两话被切碎', tags: ['kashimo'] },
        { id: 'ishigori_ce', char: '石流龙', name: '最高咒力输出炮', tier: 'SR', weight: 9, stats: [88, 74, 76, 68, 60], desc: '炮击输出全作顶尖，甜点爱好者', tags: [] },
        { id: 'geto_ce', char: '夏油杰', name: '特级标准咒力量', tier: 'SR', weight: 10, stats: [84, 78, 80, 82, 40], desc: '足够养活六千只咒灵，就是脑子里总想起苦夏', tags: ['geto'] },
        { id: 'megumi_ce', char: '伏黑惠', name: '影法术中坚蓝条', tier: 'R', weight: 11, stats: [70, 68, 75, 80, 45], desc: '开完不完全领域基本见底，习惯性比出布都御魂', tags: ['megumi'] },
        { id: 'nanami_ce', char: '七海建人', name: '精准控制加班蓝', tier: 'R', weight: 11, stats: [74, 78, 70, 82, 55], desc: '准点下班束缚开启后咒力暴涨120%', tags: ['nanami'] },
        { id: 'ijichi_ce', char: '伊地知洁高', name: '纯正账辅助蓝量', tier: 'R', weight: 11, stats: [42, 40, 45, 78, 82], desc: '拉账一级棒，实战输出基本全靠开车撞人', tags: [] },
        { id: 'toji_ce', char: '伏黑甚尔', name: '完全 0 咒力黑洞', tier: 'MEME', weight: 7, isMeme: true, stats: [0, 95, 0, 80, 60], desc: '一滴蓝都没有！如果抽到耗蓝术式当场卡死', tags: ['toji', 'zero_ce'] },
        { id: 'junpei_ce', char: '吉野顺平', name: '刚觉醒微弱蓝量', tier: 'MEME', weight: 6, isMeme: true, stats: [28, 30, 42, 55, 10], desc: '连淀月水母都勉强召唤，建议远离蓝发缝合怪', tags: [] }
      ]
    },
    {
      id: 'technique',
      title: '生得术式',
      icon: '🔮',
      items: [
        { id: 'limitless', char: '五条悟', name: '无下限术式', tier: 'SSR', weight: 6, stats: [75, 70, 100, 90, 75], desc: '绝对防御+苍赫+虚式·茈！无六眼会瞬间烧干蓝条', tags: ['gojo', 'needs_six_eyes'] },
        { id: 'shrine', char: '两面宿傩', name: '御厨子（斩与灶）', tier: 'SSR', weight: 6, stats: [80, 75, 99, 92, 70], desc: '解、捌、灶·开！简单粗暴但强到能斩断空间', tags: ['sukuna'] },
        { id: 'ten_shadows', char: '伏黑惠', name: '十种影法术', tier: 'SSR', weight: 7, stats: [75, 72, 95, 85, 60], desc: '万象、鵺加最终底牌【魔虚罗】，打不过就拉垫背', tags: ['megumi', 'mahoraga'] },
        { id: 'copy', char: '乙骨忧太', name: '模仿（Copy）', tier: 'SSR', weight: 7, stats: [85, 72, 94, 82, 85], desc: '吞噬部位即可无限盗版别人术式，咒言天逆鉾随便用', tags: ['yuta'] },
        { id: 'comedian', char: '高羽史彦', name: '超人（搞笑必中）', tier: 'SSR', weight: 6, stats: [70, 65, 98, 50, 100], desc: '只要我觉得好笑就能扭曲现实，甚至能跟脑花演小品', tags: ['takaba', 'meme_op'] },
        { id: 'boogie', char: '东堂葵', name: '不义游戏（拍手）', tier: 'SR', weight: 9, stats: [68, 80, 88, 99, 85], desc: '53万智商配合0帧拍掌，让宿傩都头皮发麻的团队神技', tags: ['todo'] },
        { id: 'csm', char: '夏油杰/羂索', name: '咒灵操术', tier: 'SR', weight: 9, stats: [82, 72, 89, 88, 55], desc: '一人成军大召唤师，可惜吃咒灵味道像抹布擦呕吐物', tags: ['geto', 'kenjaku'] },
        { id: 'idle_trans', char: '真人', name: '无为转变', tier: 'SR', weight: 9, stats: [78, 74, 91, 84, 55], desc: '直接捏爆灵魂，常规物理攻击无效（天敌：虎杖）', tags: ['mahito'] },
        { id: 'blood', char: '胀相', name: '赤血操术', tier: 'SR', weight: 9, stats: [75, 78, 82, 78, 70], desc: '赤鳞跃动+超新星+百敛穿血，水陆空全能老大哥', tags: ['choso'] },
        { id: 'ratio', char: '七海建人', name: '十划咒法（7:3）', tier: 'R', weight: 11, stats: [65, 82, 78, 80, 65], desc: '强制制造弱点暴击，砍谁都能7比3开瓢', tags: ['nanami'] },
        { id: 'straw', char: '钉崎野蔷薇', name: '刍灵咒法', tier: 'R', weight: 11, stats: [62, 65, 80, 75, 65], desc: '共鸣直击灵魂本体，专治分身怪与最后一根手指', tags: ['nobara'] },
        { id: 'no_tech', char: '三轮霞', name: '无生得术式（新阴流）', tier: 'MEME', weight: 7, isMeme: true, stats: [40, 60, 25, 65, 70], desc: '全靠一把普通刀和简易领域撑场面，真·平民战神', tags: ['miwa'] },
        { id: 'miracle', char: '重面春太', name: '奇迹积累', tier: 'MEME', weight: 6, isMeme: true, stats: [35, 35, 58, 20, 99], desc: '每天看准时间点就能存一条命，但战力约等于零', tags: [] }
      ]
    },
    {
      id: 'taijutsu',
      title: '体术 / 黑闪',
      icon: '👊',
      items: [
        { id: 'yuji_tai', char: '虎杖悠仁', name: '黑闪之子·连打8发', tier: 'SSR', weight: 7, stats: [75, 98, 70, 72, 96], desc: '想打就打的黑闪体质，径庭拳+黑闪连发把宿傩打出痛苦面具', tags: ['yuji', 'black_flash'] },
        { id: 'gojo_tai', char: '五条悟', name: '苍之体术天花板', tier: 'SSR', weight: 6, stats: [85, 99, 85, 92, 80], desc: '每拳附带苍的吸引重力，在1v3中游刃有余暴打宿傩', tags: ['gojo'] },
        { id: 'toji_tai', char: '伏黑甚尔', name: '咒具大师·零秒近身', tier: 'SSR', weight: 7, stats: [40, 100, 65, 85, 75], desc: '游云+天逆鉾+释魂刀随意切换，纯体术踩爆特级咒灵', tags: ['toji'] },
        { id: 'sukuna_tai', char: '两面宿傩', name: '四臂合击体术', tier: 'SSR', weight: 6, stats: [85, 97, 82, 94, 70], desc: '四只手同时殴打+抓腕，物理压制力拉满', tags: ['sukuna'] },
        { id: 'yuta_tai', char: '乙骨忧太', name: '刀剑+里香混合双打', tier: 'SR', weight: 9, stats: [85, 86, 80, 82, 84], desc: '表面柔弱实则一刀劈断特级，旁边还站着纯爱巨兽', tags: ['yuta'] },
        { id: 'maki_tai', char: '禅院真希', name: '空中踏步体术流', tier: 'SR', weight: 9, stats: [45, 96, 65, 80, 72], desc: '踩空气二段跳，一刀释魂直斩灵魂', tags: ['maki'] },
        { id: 'nanami_tai', char: '七海建人', name: '曾4连黑闪纪录王', tier: 'SR', weight: 10, stats: [70, 86, 72, 82, 74], desc: '钝刀砍出斩首威力，连续黑闪手感极佳', tags: ['nanami', 'black_flash'] },
        { id: 'kusakabe_tai', char: '日下部笃也', name: '新阴流拔刀神速', tier: 'SR', weight: 10, stats: [65, 88, 60, 90, 78], desc: '最强一级，靠拔刀术直接迎击宿傩全自动格挡', tags: [] },
        { id: 'kugisaki_tai', char: '钉崎野蔷薇', name: '铁锤敲钉近战', tier: 'R', weight: 11, stats: [60, 68, 72, 72, 65], desc: '近战拿小锤子硬刚特级咒灵，狠人一个', tags: ['nobara'] },
        { id: 'ino_tai', char: '猪野琢真', name: '来访瑞兽莽夫拳', tier: 'R', weight: 11, stats: [62, 74, 68, 68, 70], desc: '带上头套全属性小幅增强，新宿战表现顽强', tags: [] },
        { id: 'miwa_tai', char: '三轮霞', name: '拔刀必断之刃', tier: 'MEME', weight: 7, isMeme: true, stats: [45, 50, 40, 60, 30], desc: '“没用的三轮”全力一刀，结果刀直接被绢索空手掰断', tags: ['miwa'] },
        { id: 'fence_tai', char: '宿傩同款', name: '防盗网限定体术', tier: 'MEME', weight: 6, isMeme: true, stats: [50, 42, 60, 45, 25], desc: '头卡在防盗网里出不来，只能靠嘴硬输出', tags: ['sukuna', 'meme_cut'] }
      ]
    },
    {
      id: 'rct',
      title: '反转术式',
      icon: '💚',
      items: [
        { id: 'hakari_rct', char: '秤金次', name: '全自动无限再生', tier: 'SSR', weight: 7, stats: [90, 82, 78, 75, 99], desc: '连脑子被炸碎都能边吐电边自动修好，超越五条宿傩的再生速度', tags: ['hakari', 'rct_god'] },
        { id: 'gojo_rct', char: '五条悟', name: '双核再生+术式熔断刷新', tier: 'SSR', weight: 6, stats: [94, 85, 95, 96, 78], desc: '能一边硬扛伏魔御厨子一边用反转轰破术式熔断', tags: ['gojo', 'rct_god'] },
        { id: 'sukuna_rct', char: '两面宿傩', name: '全能再生+外放奶人', tier: 'SSR', weight: 6, stats: [95, 85, 92, 95, 70], desc: '能用反转给自己接手臂，还能靠束缚恢复出力', tags: ['sukuna', 'rct_god'] },
        { id: 'yuta_rct', char: '乙骨忧太', name: '纯爱正能量剑/奶全队', tier: 'SR', weight: 9, stats: [90, 78, 86, 82, 85], desc: '正能量输出直接秒杀特级咒灵，还能同时治疗队友', tags: ['yuta', 'rct_god'] },
        { id: 'shoko_rct', char: '家入硝子', name: '咒术界唯一指定奶妈', tier: 'SR', weight: 9, stats: [72, 45, 88, 86, 80], desc: '救死扶伤专业户，可惜2.5条悟拼回去也有心无力', tags: ['rct_god'] },
        { id: 'yuji_rct', char: '虎杖悠仁', name: '血涂经济型反转', tier: 'SR', weight: 10, stats: [75, 88, 76, 70, 82], desc: '配合赤血操术造血，大幅降低反转蓝耗，越打越肉', tags: ['yuji'] },
        { id: 'choso_rct', char: '胀相', name: '大哥血统低耗再生', tier: 'SR', weight: 10, stats: [74, 78, 74, 75, 75], desc: '咒力直接变血补损伤，性价比极高', tags: ['choso'] },
        { id: 'higuruma_rct', char: '日车宽见', name: '临阵顿悟式反转', tier: 'R', weight: 11, stats: [70, 68, 82, 90, 70], desc: '被打到断手才现学现卖长出新手臂，天赋异禀', tags: [] },
        { id: 'uraume_rct', char: '里梅', name: '古代冰系常规反转', tier: 'R', weight: 11, stats: [78, 65, 80, 78, 65], desc: '能解剧毒，但遇到茈还是得疼几天', tags: [] },
        { id: 'no_rct', char: '伏黑惠/娜娜明', name: '完全不会反转术式', tier: 'MEME', weight: 8, isMeme: true, stats: [60, 72, 70, 75, 45], desc: '受伤只能靠硬扛和绑绷带，吃一发大招直接下线', tags: ['no_rct'] },
        { id: 'kashimo_rct', char: '鹿紫云一', name: '一次性自爆不带奶', tier: 'MEME', weight: 6, isMeme: true, stats: [78, 80, 82, 65, 25], desc: '开大后肉体直接崩解，赢了也要进骨灰盒', tags: ['kashimo', 'no_rct'] }
      ]
    },
    {
      id: 'domain',
      title: '领域展开',
      icon: '⛩️',
      items: [
        { id: 'uv_domain', char: '五条悟', name: '无量空处（0.2秒）', tier: 'SSR', weight: 6, stats: [85, 75, 100, 95, 80], desc: '强制塞入无限情报大脑过载！中招0.01秒直接变植物人', tags: ['gojo', 'domain_top'] },
        { id: 'ms_domain', char: '两面宿傩', name: '伏魔御厨子（无结界）', tier: 'SSR', weight: 6, stats: [92, 82, 100, 96, 75], desc: '半径200米无结界必中斩击，从外部直接轰碎别人领域外壳', tags: ['sukuna', 'domain_top'] },
        { id: 'yuta_domain', char: '乙骨忧太', name: '真赝相爱（无限剑制）', tier: 'SSR', weight: 7, stats: [90, 78, 94, 86, 86], desc: '满地插满随机术式武士刀，还能指定单人必中不误伤队友', tags: ['yuta', 'domain_top'] },
        { id: 'kenjaku_domain', char: '羂索', name: '胎藏遍野（开放领域）', tier: 'SSR', weight: 6, stats: [88, 72, 95, 96, 65], desc: '同样无结界开放式领域，瞬间压碎九十九的简易领域', tags: ['kenjaku', 'domain_top'] },
        { id: 'hakari_domain', char: '秤金次', name: '坐杀博徒（光速展开）', tier: 'SR', weight: 9, stats: [85, 80, 88, 78, 100], desc: '比0.2秒还快的展开速度，拉着对手看恋爱漫画摇老虎机', tags: ['hakari'] },
        { id: 'higuruma_domain', char: '日车宽见', name: '诛伏赐死（法院没收）', tier: 'SR', weight: 9, stats: [78, 72, 90, 94, 72], desc: '领域内禁止暴力！定罪直接没收术式并给处刑人之剑', tags: [] },
        { id: 'mahito_domain', char: '真人', name: '自闭圆顿裹', tier: 'SR', weight: 9, stats: [80, 74, 92, 84, 55], desc: '一开即处于掌心之中，碰一下灵魂直接炸裂', tags: ['mahito'] },
        { id: 'jogo_domain', char: '漏瑚', name: '盖棺铁围山', tier: 'SR', weight: 9, stats: [82, 70, 88, 72, 35], desc: '火山内部灼热必中，可惜这辈子碰到的都是俩挂壁', tags: [] },
        { id: 'megumi_domain', char: '伏黑惠', name: '嵌合暗翳庭（未完成）', tier: 'R', weight: 10, stats: [68, 72, 82, 82, 55], desc: '没有必中但能无限分身淹死对面，需要找室内墙角开', tags: ['megumi'] },
        { id: 'miwa_domain', char: '三轮霞', name: '新阴流·简易领域', tier: 'R', weight: 11, stats: [55, 68, 65, 75, 78], desc: '脚一离地就失效的保命圈，能抵消必中但输出随缘', tags: ['miwa'] },
        { id: 'no_domain', char: '纯爱路人', name: '无领域（纯靠手搓）', tier: 'MEME', weight: 8, isMeme: true, stats: [50, 65, 45, 70, 40], desc: '对面一喊“领域展开”，你只能原地祈祷自己会简易领域', tags: ['no_domain'] },
        { id: 'airport_domain', char: '机场VIP', name: '领域展开·南下候机厅', tier: 'MEME', weight: 6, isMeme: true, stats: [60, 40, 60, 40, 10], desc: '开局直接把双方拉进机场休息室，疯狂称赞对面还没出全力', tags: ['gojo', 'meme_cut'] }
      ]
    }
  ];

  const DEFAULT_OC_STAGES = [
    {
      id: 'origin',
      title: '第1步：出身身份',
      icon: '🏯',
      items: [
        { id: 'o_gojo', name: '五条家嫡系神子', tier: 'SSR', weight: 7, stats: [25, 15, 25, 20, 15], story: '你降生在御三家五条氏，刚哭出声就震动了整个咒术界平衡。' },
        { id: 'o_zenin_exile', name: '禅院家被逐弃子', tier: 'SR', weight: 10, stats: [5, 28, 10, 15, 12], story: '因为嫌弃家里那帮封建老头太恶心，你提着包连夜跑路去东京高专。' },
        { id: 'o_heian', name: '千年前受肉术师', tier: 'SSR', weight: 7, stats: [24, 18, 24, 22, 10], story: '与羂索签下契约化作咒物，在现代死灭回游醒来准备大闹一场。' },
        { id: 'o_kamo', name: '加茂家旁系天才', tier: 'SR', weight: 10, stats: [18, 16, 20, 18, 14], story: '掌握家传血脉秘术，顶着家族期待走上既孤独又稳健的道路。' },
        { id: 'o_curse_spirit', name: '特级假想怨灵', tier: 'SSR', weight: 7, stats: [26, 20, 22, 16, 12], story: '由人类对“周一早八”和“调休”的集体恐惧凝聚而成的特级咒灵！' },
        { id: 'o_student', name: '东京高专插班生', tier: 'R', weight: 14, stats: [14, 15, 14, 15, 18], story: '被夜蛾正道亲自面试招入，同期还有两个超级能打的问题儿童。' },
        { id: 'o_civilian', name: '社畜意外觉醒者', tier: 'R', weight: 13, stats: [12, 12, 14, 20, 15], story: '在涩谷加班到凌晨后突然能看见咒灵，当场决定转行赚外快。' },
        { id: 'o_clown', name: '盘星教跑龙套', tier: 'MEME', weight: 8, isMeme: true, stats: [8, 8, 8, 10, 5], story: '刚准备发表反派宣言就被路过的五条悟顺手弹了个脑瓜崩。' }
      ]
    },
    {
      id: 'talent',
      title: '第2步：身体天赋',
      icon: '🧬',
      items: [
        { id: 't_sixeyes', name: '六眼·无限解析', tier: 'SSR', weight: 6, stats: [30, 12, 26, 30, 15], story: '戴着墨镜也能看清原子级别咒力流动，蓝耗直接约等于0！' },
        { id: 't_heian_body', name: '四臂双面畸变体', tier: 'SSR', weight: 7, stats: [24, 28, 22, 18, 12], story: '比常人多出两只手与一张嘴，边肉搏边念咒词完全不带喘气。' },
        { id: 't_heavenly', name: '天与咒缚（零咒力）', tier: 'SSR', weight: 7, stats: [-50, 38, -20, 20, 15], story: '放弃全部咒力换取物理法则级肉体，能脚踩空气硬刚特级。' },
        { id: 't_vessel', name: '特级咒物容器体质', tier: 'SR', weight: 11, stats: [20, 26, 15, 12, 20], story: '吞下宿傩手指非但没暴毙，反而顺便吸收了其中的部分经验。' },
        { id: 't_sponge', name: '深渊咒力海绵', tier: 'SR', weight: 11, stats: [28, 14, 18, 14, 16], story: '咒力总量堪比乙骨忧太，站着不动就能让二级咒灵腿软。' },
        { id: 't_normal', name: '扎实的体能底子', tier: 'R', weight: 15, stats: [14, 18, 12, 14, 16], story: '每天坚持5公里与俯卧撑，虽然没有外挂但胜在抗造。' },
        { id: 't_glass', name: '高攻脆皮战五渣', tier: 'MEME', weight: 8, isMeme: true, stats: [22, 4, 22, 15, 8], story: '输出全靠大招，只要被风吹一下就可能当场进入ICU。' }
      ]
    },
    {
      id: 'innate',
      title: '第3步：觉醒术式',
      icon: '✨',
      items: [
        { id: 'i_limitless', name: '无下限术式', tier: 'SSR', weight: 6, stats: [18, 12, 34, 22, 14], story: '将“无限”带入现实！对手打不到你，而你一发茈能铲平半座城。' },
        { id: 'i_shrine', name: '御厨子（空间斩路线）', tier: 'SSR', weight: 6, stats: [20, 16, 33, 22, 12], story: '从常规解捌开始修炼，隐隐摸到了“世界斩”的门槛。' },
        { id: 'i_shadows', name: '十种影法术', tier: 'SSR', weight: 7, stats: [18, 16, 30, 20, 14], story: '手里握着全咒术界最强底牌【魔虚罗】，从此拥有核威慑权。' },
        { id: 'i_copy', name: '纯爱模仿（Copy）', tier: 'SSR', weight: 7, stats: [22, 14, 29, 20, 18], story: '遇到强敌别慌，先打招呼顺便把他术式也抄过来一起用。' },
        { id: 'i_comedy', name: '超人（搞笑必中）', tier: 'SSR', weight: 6, stats: [15, 14, 32, 8, 35], story: '只要你觉得好笑，宿傩的斩击也会变成喷水塑料花。' },
        { id: 'i_boogie', name: '不义游戏（拍手置换）', tier: 'SR', weight: 10, stats: [14, 18, 24, 28, 18], story: '战场上最烦人的辅助兼干扰神技，拍一下就能让敌人自相残杀。' },
        { id: 'i_projection', name: '投射咒法（24帧率）', tier: 'SR', weight: 10, stats: [15, 24, 24, 18, 12], story: '每秒24帧加速冲锋，只要不碰到女真希就是陆地超音速。' },
        { id: 'i_ratio', name: '十划咒法（7:3暴击）', tier: 'R', weight: 13, stats: [12, 20, 20, 18, 15], story: '朴实无华的必杀线切割，配合社畜怨气威力翻倍。' },
        { id: 'i_truck', name: '召唤异世界泥头车', tier: 'MEME', weight: 7, isMeme: true, stats: [10, 12, 24, 12, 30], story: 'B站整活术式：消耗一半咒力召唤高速泥头车创飞面前一切敌人！' },
        { id: 'i_none', name: '无术式（全靠新阴流）', tier: 'MEME', weight: 7, isMeme: true, stats: [10, 22, 6, 20, 16], story: '没有任何花里胡哨的超能力，全凭一把铁刀硬砍！' }
      ]
    },
    {
      id: 'event',
      title: '第4步：高专/回游奇遇',
      icon: '🎭',
      items: [
        { id: 'e_blackflash', name: '连环黑闪进入Zone', tier: 'SSR', weight: 8, stats: [15, 22, 20, 12, 22], story: '战斗中突然打出一发黑闪并连续暴击！你对咒力核心的理解提升到了120%！' },
        { id: 'e_yuki', name: '九十九由基特训', tier: 'SR', weight: 11, stats: [14, 16, 18, 18, 14], story: '她问你“喜欢什么类型的异性”后，传授了你灵魂笔记与简易领域。' },
        { id: 'e_finger', name: '吞吃宿傩手指幸存', tier: 'SSR', weight: 7, stats: [22, 18, 16, 10, 20], story: '你一口闷了三根手指居然没被夺舍，反而把宿傩的咒力白嫖了过来！' },
        { id: 'e_summer', name: '夏油杰的“苦夏”问候', tier: 'SR', weight: 11, stats: [12, 12, 14, 16, 10], story: '他在KFC门口看着消瘦的你：“你变强了，还是只是习惯了加班？”' },
        { id: 'e_binding', name: '立下阴间“束缚”', tier: 'SR', weight: 11, stats: [16, 10, 24, 18, 12], story: '效仿宿傩立下“每周二不喝奶茶”的苛刻束缚，换来大招输出翻倍！' },
        { id: 'e_shibuya', name: '涩谷B5F奇迹逃生', tier: 'R', weight: 13, stats: [10, 14, 10, 15, 22], story: '五条悟刚被关进狱门疆你就趁乱溜出了涩谷，主打一个保命大师。' },
        { id: 'e_naoya', name: '被禅院直哉嘲讽跟不上', tier: 'MEME', weight: 8, isMeme: true, stats: [6, 12, 8, 8, 8], story: '“连我的背影都追不上，不配叫咒术师！”你气得原地加速了10%。' }
      ]
    },
    {
      id: 'mastery',
      title: '第5步：高阶奥义',
      icon: '🔥',
      items: [
        { id: 'm_rct_plus', name: '反转术式 + 术式熔断重置', tier: 'SSR', weight: 7, stats: [18, 12, 22, 20, 15], story: '学会破坏再修复大脑前额叶，连续开两次领域都不是梦！' },
        { id: 'm_max', name: '极之番 · 大招觉醒', tier: 'SSR', weight: 8, stats: [15, 12, 24, 14, 14], story: '将生得术式推向极致，挥手间陨石或漩涡铺天盖地！' },
        { id: 'm_rct', name: '精通反转术式（自奶）', tier: 'SR', weight: 12, stats: [12, 10, 16, 14, 16], story: '断手断脚三秒长好，只要没被一刀砍掉脑袋就能继续打。' },
        { id: 'm_simple', name: '新阴流·简易领域大师', tier: 'SR', weight: 12, stats: [10, 14, 12, 18, 16], story: '没有必中领域也不怕，开圈强行抵消一切敌方领域效果！' },
        { id: 'm_cursed_tool', name: '捡到特级咒具【游云】', tier: 'R', weight: 13, stats: [6, 20, 8, 10, 18], story: '挥舞三节棍的威力全看物理爆发力，打人特别清脆响亮。' },
        { id: 'm_none', name: '临阵卡壳啥也没学会', tier: 'MEME', weight: 8, isMeme: true, stats: [4, 6, 4, 8, 10], story: '理论课睡着了，实战时全靠热血精神硬撑。' }
      ]
    },
    {
      id: 'domain',
      title: '第6步：领域展开',
      icon: '⛩️',
      items: [
        { id: 'd_open', name: '无结界·开放式领域', tier: 'SSR', weight: 6, stats: [22, 12, 32, 24, 15], story: '不封闭生得领域，直接在现实画布上绘画！可以从外部拆碎所有人的结界！' },
        { id: 'd_02', name: '0.2秒极限必中领域', tier: 'SSR', weight: 7, stats: [20, 14, 30, 22, 16], story: '展开与解除同时完成，对面刚反应过来就已经中了必中效果！' },
        { id: 'd_rule', name: '旧式规则系必中领域', tier: 'SR', weight: 11, stats: [16, 10, 25, 22, 16], story: '进入领域强制禁止暴力并开启小游戏或庭审，克制一切数值怪！' },
        { id: 'd_lethal', name: '经典必杀型封闭领域', tier: 'SR', weight: 11, stats: [18, 12, 26, 16, 12], story: '结界拉起后全体属性提升至120%，必中术式如暴雨般倾泻。' },
        { id: 'd_half', name: '不完全领域（无必中）', tier: 'R', weight: 13, stats: [10, 10, 16, 14, 12], story: '需要在地下室或废弃体育馆里借助墙壁强行展开，拼的是胆量！' },
        { id: 'd_fail', name: '未觉醒领域（机场见）', tier: 'MEME', weight: 8, isMeme: true, stats: [4, 6, 6, 8, 8], story: '手指比出了帅气结印，结果什么都没发生……场面一度十分尴尬。' }
      ]
    }
  ];

  const DUEL_ROSTER = [
    { id: 'd_gojo', name: '五条悟（巅峰态）', tier: 'SSR', group: 'top', weight: 6, power: 98, hp: 130, ce: 99, tai: 97, tech: 100, iq: 96, signature: '虚式·茈 / 无量空处', quote: '“会赢的。”' },
    { id: 'd_sukuna', name: '两面宿傩（四手完全体）', tier: 'SSR', group: 'top', weight: 6, power: 99, hp: 135, ce: 100, tai: 97, tech: 99, iq: 97, signature: '世界斩 / 伏魔御厨子', quote: '“你很强，但我甚至还没拿出全力。”' },
    { id: 'd_yuta', name: '乙骨忧太（完全体里香）', tier: 'SSR', group: 'top', weight: 7, power: 91, hp: 120, ce: 97, tai: 86, tech: 93, iq: 88, signature: '真赝相爱 / 纯爱炮', quote: '“这就是纯爱啊！”' },
    { id: 'd_kenjaku', name: '羂索（千年脑花）', tier: 'SSR', group: 'top', weight: 7, power: 90, hp: 118, ce: 89, tai: 82, tech: 94, iq: 99, signature: '胎藏遍野 / 反重力机构', quote: '“呵呵，这可真有意思。”' },
    { id: 'd_toji', name: '伏黑甚尔（全套咒具）', tier: 'SSR', group: 'top', weight: 7, power: 89, hp: 115, ce: 0, tai: 100, tech: 75, iq: 90, signature: '天逆鉾 / 释魂刀突刺', quote: '“怎么会是免费打手呢？”' },
    { id: 'd_yuji', name: '虎杖悠仁（终战觉醒）', tier: 'SSR', group: 'top', weight: 7, power: 88, hp: 124, ce: 84, tai: 98, tech: 84, iq: 78, signature: '8连黑闪 / 魂之解', quote: '“我就是你啊！”' },
    { id: 'd_hakari', name: '秤金次（大当たり中）', tier: 'SR', group: 'top', weight: 8, power: 86, hp: 125, ce: 96, tai: 88, tech: 84, iq: 80, signature: '坐杀博徒 · 无限反转', quote: '“现在是4分11秒的无敌时间！”' },
    { id: 'd_takaba', name: '高羽史彦（状态拉满）', tier: 'SSR', group: 'top', weight: 6, power: 92, hp: 115, ce: 80, tai: 70, tech: 99, iq: 55, signature: '超人 · 只要我觉得好笑', quote: '“这可不好笑啊！”' },
    { id: 'd_maki', name: '禅院真希（天与暴君）', tier: 'SR', group: 'top', weight: 8, power: 87, hp: 116, ce: 0, tai: 98, tech: 74, iq: 85, signature: '释魂刀空中斩', quote: '“全都破坏掉就行了。”' },
    { id: 'd_kashimo', name: '鹿紫云一（幻兽琥珀）', tier: 'SR', group: 'top', weight: 8, power: 85, hp: 105, ce: 88, tai: 86, tech: 86, iq: 72, signature: '必中落雷 / 电磁波', quote: '“这是弱者的葬礼！”' },
    { id: 'd_todo', name: '东堂葵（改·单手乐器）', tier: 'SR', group: 'mid', weight: 9, power: 81, hp: 112, ce: 76, tai: 88, tech: 90, iq: 99, signature: '一秒50次不义游戏', quote: '“我的挚友啊！”' },
    { id: 'd_mahito', name: '真人（遍杀即灵体）', tier: 'SR', group: 'mid', weight: 9, power: 84, hp: 115, ce: 84, tai: 84, tech: 92, iq: 84, signature: '自闭圆顿裹 / 无为转变', quote: '“灵魂的形状，就由我来改写！”' },
    { id: 'd_jogo', name: '漏瑚（全盛期）', tier: 'SR', group: 'mid', weight: 9, power: 83, hp: 108, ce: 86, tai: 74, tech: 88, iq: 74, signature: '极之番·陨 / 盖棺铁围山', quote: '“可恶，又是领域压制吗！”' },
    { id: 'd_higuruma', name: '日车宽见（处刑人之剑）', tier: 'SR', group: 'mid', weight: 9, power: 82, hp: 104, ce: 78, tai: 75, tech: 90, iq: 95, signature: '诛伏赐死 · 没收死刑', quote: '“有罪！判处没收加死刑！”' },
    { id: 'd_megumi', name: '伏黑惠（魔虚罗底牌）', tier: 'SR', group: 'mid', weight: 9, power: 80, hp: 102, ce: 75, tai: 76, tech: 88, iq: 86, signature: '布都御魂·魔虚罗同归', quote: '“布都御魂，要死一起死！”' },
    { id: 'd_nanami', name: '七海建人（加班束缚）', tier: 'R', group: 'low', weight: 10, power: 75, hp: 106, ce: 74, tai: 84, tech: 78, iq: 84, signature: '7:3十划连击', quote: '“现在起进入加班时间。”' },
    { id: 'd_nobara', name: '钉崎野蔷薇', tier: 'R', group: 'low', weight: 11, power: 68, hp: 92, ce: 65, tai: 68, tech: 80, iq: 75, signature: '共鸣直击灵魂', quote: '“少瞧不起老娘啊！”' },
    { id: 'd_miwa', name: '三轮霞（没用的三轮）', tier: 'MEME', group: 'low', weight: 10, power: 54, hp: 85, ce: 50, tai: 56, tech: 45, iq: 68, signature: '拔刀（然后刀断了）', quote: '“大家好，我是没用的三轮！”' },
    { id: 'd_ijichi', name: '伊地知洁高（车神形态）', tier: 'MEME', group: 'low', weight: 9, power: 58, hp: 84, ce: 45, tai: 42, tech: 60, iq: 82, signature: '辅助监督专车撞击', quote: '“安全带请系好，我要加速了！”' },
    { id: 'd_25gojo', name: '2.5条悟（半身残血版）', tier: 'MEME', group: 'low', weight: 8, power: 64, hp: 70, ce: 75, tai: 45, tech: 78, iq: 60, signature: '机场口头吹捧', quote: '“即使这样…宿傩也还没用全力吧。”' }
  ];

  const DUEL_ARENAS = [
    { id: 'a_shinjuku', name: '新宿废墟（全员出力+15%）', tier: 'SR', weight: 12, mod: 'all_boost', desc: '全员解除限制，开局直接互扔大招！' },
    { id: 'a_shibuya', name: '涩谷B5F车站（0.2秒领域特化）', tier: 'SSR', weight: 9, mod: 'fast_domain', desc: '空间狭小人群密集，体术与极速领域伤害提升！' },
    { id: 'a_airport', name: '南下机场候机厅（B站名场面）', tier: 'MEME', weight: 8, mod: 'airport', desc: '每回合有概率陷入“夸赞对手”发呆状态！' },
    { id: 'a_court', name: '日车法庭（禁止物理殴打）', tier: 'SR', weight: 9, mod: 'no_tai', desc: '术式与智谋权重暴增，纯物理天与暴君伤害减半！' },
    { id: 'a_rain', name: '京都暴雨夜（全员黑闪概率翻倍）', tier: 'SSR', weight: 9, mod: 'black_flash', desc: '狂风骤雨中咒力火花四溅，极易出现连续黑闪翻盘！' },
    { id: 'a_mahoraga', name: '魔虚罗观战台（第3回合随机介入）', tier: 'MEME', weight: 8, mod: 'mahoraga_drop', desc: '打到第3回合，天上随机掉下一只魔虚罗无差别砍人！' }
  ];

  const BOSSES = {
    jogo: {
      name: '特级咒灵 · 漏瑚',
      hp: 150,
      atk: 26,
      def: 16,
      intro: '火山头傲然登场：“区区人类，也敢直视大地之怒？”',
      skills: ['火砾虫群爆', '火山喷射火柱', '极之番·陨', '领域展开·盖棺铁围山'],
      winMeme: '漏瑚倒在焦土上：“真可惜……你只是生在了有我的时代（才怪）。”',
      loseMeme: '你被漏瑚当场烤成焦炭，喜提“九分熟高专烤肉”称号！'
    },
    mahito: {
      name: '完全体 · 真人',
      hp: 190,
      atk: 31,
      def: 24,
      intro: '真人咧嘴冷笑：“让我看看你的灵魂是什么形状吧~”',
      skills: ['无为转变·灵魂触碰', '改造人齐射', '遍杀即灵体冲锋', '0.2秒自闭圆顿裹'],
      winMeme: '真人像兔子一样在雪地里逃窜，你赢下了灵魂死斗！',
      loseMeme: '灵魂防线被真人摸穿，直接被捏成了一只可怜的茶壶。'
    },
    kenjaku: {
      name: '千年老阴比 · 羂索',
      hp: 235,
      atk: 35,
      def: 28,
      intro: '脑花掀开额头缝合线：“千年的计划，就拿你来试刀吧。”',
      skills: ['万只咒灵漩涡', '反重力机构重力碾压', '无结界·胎藏遍野', '阴险偷袭补刀'],
      winMeme: '你用绝妙的节奏配合斩击送脑花上路，终结了他千年的布局！',
      loseMeme: '你被反重力死死摁在地上，脑花顺手给你讲了半小时人类进化哲学。'
    },
    gojo: {
      name: '现代最强 · 五条悟',
      hp: 285,
      atk: 42,
      def: 36,
      intro: '五条悟拉下眼罩：“别眨眼哦，一不小心可能会直接输掉~”',
      skills: ['术式顺转·苍', '术式反转·赫', '虚式·茈', '0.2秒无量空处'],
      winMeme: '不可思议！你居然强行突破了无下限，把五条悟打进了机场候机厅！',
      loseMeme: '被塞进0.2秒【无量空处】信息过载，你当场变成只会夸人强的好人。'
    },
    sukuna: {
      name: '完全体 · 两面宿傩',
      hp: 340,
      atk: 46,
      def: 35,
      intro: '新宿废墟之上，四手两嘴的诅咒之王睁开四瞳：“小鬼，让我看看你拿什么取悦我？”',
      skills: ['不可视之解', '四手连打压制', '伏魔御厨子·灶开', '空间世界斩（束缚发动）'],
      winMeme: '奇迹诞生！新宿车轮战终结！宿傩被你打出防盗网并化作一滩黑泥！弹幕刷爆：【真正的新宿战神】！',
      loseMeme: '恭喜成为第18位“2.5条体验卡”持有者！你已在南下机场落地，正和五条悟讨论“宿傩其实还没出全力”。'
    }
  };

  global.JJK_DATA = {
    TIER_META,
    SLICE_PALETTE,
    SPEED_CONFIG,
    DEFAULT_PUZZLE_SLOTS,
    DEFAULT_OC_STAGES,
    DUEL_ROSTER,
    DUEL_ARENAS,
    BOSSES
  };
})(window);
