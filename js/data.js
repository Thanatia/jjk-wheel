(function (global) {
  'use strict';

  var SLICE_COLORS = [
    '#ef5d58', // 珊瑚红
    '#ffa500', // 琥珀橙
    '#8fd14f', // 青柠绿
    '#2ac19a', // 翡翠青
    '#29bce8', // 晴空蓝
    '#3d7ae8', // 钴蓝
    '#7b4ce2', // 罗兰紫
    '#ec4899', // 桃红
    '#eab308', // 金黄
    '#14b8a6', // 青绿
    '#6366f1', // 靛蓝
    '#64748b'  // 岩灰
  ];

  var RANK_SCALE = [
    { level: 0, code: 'E-', badgeClass: 'rank-low', label: '笑死级' },
    { level: 1, code: 'E', badgeClass: 'rank-low', label: '垫底' },
    { level: 2, code: 'D', badgeClass: 'rank-low', label: '四级' },
    { level: 3, code: 'C-', badgeClass: 'rank-low', label: '准三级' },
    { level: 4, code: 'C', badgeClass: 'rank-low', label: '三级 / 常人' },
    { level: 5, code: 'B', badgeClass: 'rank-b', label: '二级' },
    { level: 6, code: 'A', badgeClass: 'rank-a', label: '一级' },
    { level: 7, code: 'S', badgeClass: 'rank-s', label: '特级门槛' },
    { level: 8, code: 'SS', badgeClass: 'rank-ss', label: '顶尖强者' },
    { level: 9, code: 'SSS', badgeClass: 'rank-ex', label: '传世巅峰' },
    { level: 10, code: 'EX', badgeClass: 'rank-ex', label: '规格之外' },
    { level: 11, code: 'EX+', badgeClass: 'rank-ex', label: '破格极限' },
    { level: 12, code: 'EX++', badgeClass: 'rank-omega', label: '神域领域' },
    { level: 13, code: 'Ω', badgeClass: 'rank-omega', label: '终极奇点' }
  ];

  var ATTRIBUTE_DEFS = [
    { key: 'taijutsu', name: '体术', desc: '影响近战交锋输出与招式上限' },
    { key: 'body', name: '体质', desc: '影响生存率，大幅降低重伤与死亡概率' },
    { key: 'ceTotal', name: '咒力总量', desc: '决定持久战能力与大招释放底气' },
    { key: 'ceControl', name: '咒力操纵', desc: '影响精确度、黑闪触发率与对抗稳定性' },
    { key: 'ceEfficiency', name: '咒力效率', desc: '影响续航与极限战中的翻盘能力' },
    { key: 'iq', name: '智力', desc: '影响战术应对、战斗权重修正与避险能力' },
    { key: 'talent', name: '天赋', desc: '影响每次事件后是否成长的概率' },
    { key: 'looks', name: '颜值', desc: '影响部分事件权重及 NPC 初见态度' },
    { key: 'morality', name: '道德', desc: '影响后续事件的选项与阵营倾向' },
    { key: 'reputation', name: '声望', desc: '人生终点定格时揭晓的世间评价' }
  ];

  var IDENTITIES = [
    { id: 'sorcerer', label: '咒术师', weight: 22, faction: 'good', desc: '正统入世的咒术行使者，行走于明暗交界' },
    { id: 'curseUser', label: '诅咒师', weight: 13, faction: 'evil', desc: '以咒术行私欲或暗杀之事的法外之人' },
    { id: 'civilian', label: '普通人', weight: 28, faction: 'neutral', desc: '看似平凡的常人，命运也可能卷入咒力漩涡' },
    { id: 'higherUp', label: '咒术高层', weight: 11, faction: 'neutral', desc: '端坐屏风之后制定规矩与处刑令的掌权者' },
    { id: 'curse', label: '咒灵', weight: 9, faction: 'evil', desc: '人类负面情绪凝结诞生的诅咒具现' },
    { id: 'shikigami', label: '式神', weight: 9, faction: 'neutral', desc: '依附术式或御主显化的异界灵体战力' },
    { id: 'corpse', label: '咒骸', weight: 8, faction: 'good', desc: '灌注咒核、具备自我意识的人造傀儡存在' }
  ];

  var ERAS = [
    { id: 'heian', label: '千年前平安时代', short: '平安时代', order: 0 },
    { id: 'edo400', label: '400年前', short: '江户初年', order: 1 },
    { id: 'hiddenInv', label: '怀玉时期', short: '怀玉篇', order: 2 },
    { id: 'vol0', label: '0卷时期', short: '百鬼夜行', order: 3 },
    { id: 'canonStart', label: '剧情开始时', short: '开篇时期', order: 4 },
    { id: 'shibuya', label: '涩谷事变时期', short: '涩谷事变', order: 5 },
    { id: 'culling', label: '死灭回游时期', short: '死灭回游', order: 6 },
    { id: 'shinjuku', label: '新宿决战时期', short: '新宿决战', order: 7 },
    { id: 'future68', label: '68年后', short: '六十八年后', order: 8 }
  ];

  var BIRTH_ERA_SLICES = [
    { id: 'heian', label: '千年前平安时代', weight: 12 },
    { id: 'edo400', label: '400年前', weight: 10 },
    { id: 'hiddenInv', label: '怀玉时期', weight: 13 },
    { id: 'vol0', label: '0卷时期', weight: 12 },
    { id: 'canonStart', label: '剧情开始时', weight: 21 },
    { id: 'shibuya', label: '涩谷事变时期', weight: 14 },
    { id: 'culling', label: '死灭回游时期', weight: 10 },
    { id: 'shinjuku', label: '新宿决战时期', weight: 8 }
  ];

  var BIRTHPLACE_SLICES = [
    { id: 'jp', label: '日本', weight: 76, note: '身处咒力最浓厚的漩涡中心' },
    { id: 'overseas', label: '海外', weight: 16, note: '异域魔境成长，罕为人知' },
    { id: 'barrier', label: '特异结界内', weight: 8, note: '诞生于特殊术式回响之中' }
  ];

  var SORCERER_LINEAGES = [
    { id: 'gojo', label: '御三家·五条家', weight: 9, buff: { ceEfficiency: 1, talent: 1 }, skill: '六眼血脉余晖' },
    { id: 'zenin', label: '御三家·禅院家', weight: 15, buff: { taijutsu: 1 }, skill: '御三家实战体术秘传' },
    { id: 'kamo', label: '御三家·加茂家', weight: 14, buff: { ceControl: 1 }, skill: '名门咒力控流家传' },
    { id: 'minorClan', label: '传统术师旁支', weight: 22, buff: { iq: 1 }, skill: '家族简易结界心法' },
    { id: 'ordinaryFamily', label: '普通家庭偶然觉醒', weight: 28, buff: { moraleTag: '草根' }, skill: '野生战斗直觉' },
    { id: 'orphan', label: '孤儿 / 高专特招', weight: 12, buff: { talent: 1 }, skill: '高专特训适应力' }
  ];

  var TECHNIQUES_BY_IDENTITY = {
    sorcerer: [
      { id: 'limitless', label: '无下限咒术', weight: 5, power: 16, desc: '支配无限收敛与排斥的至高术式' },
      { id: 'tenShadows', label: '十种影法术', weight: 8, power: 14, desc: '以影为媒介调伏十种式神' },
      { id: 'bloodManip', label: '赤血操术', weight: 12, power: 10, desc: '操纵自身血液强化攻防' },
      { id: 'boogieWoogie', label: '不义游戏', weight: 11, power: 11, desc: '拍手瞬间调换含咒力物体位置' },
      { id: 'projection', label: '投射咒法', weight: 10, power: 11, desc: '将一秒拆为二十四帧高速移动' },
      { id: 'cursedSpeech', label: '咒言', weight: 10, power: 10, desc: '以喉舌承载诅咒强制生效' },
      { id: 'ratio', label: '十划咒法', weight: 13, power: 11, desc: '强行制造七比三的绝对弱点' },
      { id: 'strawDoll', label: '刍灵咒法', weight: 14, power: 9, desc: '通过共鸣直接打击对方灵魂本体' },
      { id: 'newShadow', label: '新阴流·无生得术式', weight: 17, power: 8, desc: '专精体术、刀法与简易领域' }
    ],
    curseUser: [
      { id: 'curseManip', label: '咒灵操术', weight: 8, power: 15, desc: '吸收调伏无数咒灵为己用' },
      { id: 'inverse', label: '逆转术法', weight: 14, power: 10, desc: '将适度攻击伤害翻转成无效' },
      { id: 'clone', label: '分身术式', weight: 16, power: 9, desc: '制造本体与分身随意切换' },
      { id: 'seance', label: '降灵术', weight: 14, power: 10, desc: '召唤死者肉体与情报降临战场' },
      { id: 'miracle', label: '奇迹存储', weight: 14, power: 9, desc: '积攒微不足道的小幸运抵消致命伤' },
      { id: 'shrineShard', label: '暗杀斩击流', weight: 17, power: 11, desc: '隐匿咒力气息的一击毙命刺杀' },
      { id: 'contract', label: '收据再现术式', weight: 17, power: 9, desc: '以燃烧纸契兑现契约物体' }
    ],
    curse: [
      { id: 'disasterFlames', label: '大地灼炎', weight: 14, power: 14, desc: '足以焚尽都市的熔岩烈焰' },
      { id: 'idleTransfig', label: '无为转变', weight: 10, power: 16, desc: '触碰即可捏塑改变灵魂形状' },
      { id: 'disasterPlants', label: '灾厄森罗', weight: 15, power: 12, desc: '吸收植物生命转化的诅咒之木' },
      { id: 'disasterTides', label: '陀艮潮汐', weight: 15, power: 12, desc: '无穷无尽的海域式神奔流' },
      { id: 'rottingBlood', label: '蚀烂腐血', weight: 20, power: 10, desc: '带有猛毒腐朽效果的特化咒血' },
      { id: 'miasma', label: '幽暗怨念拟态', weight: 26, power: 8, desc: '依托黑夜伏击猎物的普通诅咒' }
    ],
    shikigami: [
      { id: 'extermSword', label: '退魔之剑', weight: 9, power: 15, desc: '专门克制诅咒与灵体的神圣锋刃' },
      { id: 'adaptWheel', label: '法阵适应回路', weight: 6, power: 17, desc: '承伤后逐步解析并免疫一切现象' },
      { id: 'frostWing', label: '极寒羽织', weight: 16, power: 11, desc: '振翅散播冻结空间的冰霜咒力' },
      { id: 'thunderBeak', label: '高空雷鸣', weight: 17, power: 11, desc: '如电光俯冲贯穿敌人防线' },
      { id: 'jadeFang', label: '浑影利爪', weight: 22, power: 10, desc: '专司撕裂防线的近身突袭牙爪' },
      { id: 'scoutLink', label: '千里共视术', weight: 30, power: 7, desc: '将视觉信息即时回传御主' }
    ],
    corpse: [
      { id: 'threeCores', label: '三核相互支撑', weight: 15, power: 14, desc: '三颗核心协同切换战力模式' },
      { id: 'heavyArmor', label: '重装傀儡核', weight: 22, power: 11, desc: '强硬接下特级正面冲击' },
      { id: 'bladePuppet', label: '机关暗器枢', weight: 25, power: 10, desc: '周身隐藏高出力咒具机关' },
      { id: 'autoGuard', label: '自律守护回路', weight: 38, power: 8, desc: '专为护卫造物主而生的坚韧躯体' }
    ],
    higherUp: [
      { id: 'wardSecret', label: '秘传结界守护', weight: 30, power: 8, desc: '借助高专结界中枢隔空防御' },
      { id: 'shikigamiGuard', label: '家传护卫式神', weight: 28, power: 9, desc: '祖辈流传下来的契约守卫灵' },
      { id: 'politicalVeto', label: '秘密束缚令', weight: 24, power: 7, desc: '以体制规则与筹码牵制对手' },
      { id: 'retiredBlade', label: '退隐老牌剑术', weight: 18, power: 10, desc: '年轻时曾走过一线战场的底牌' }
    ],
    civilian: [
      { id: 'none', label: '无生得术式（常人）', weight: 52, power: 0, desc: '没有任何咒术才能的普通居民' },
      { id: 'heavenZero', label: '天与咒缚（零咒力）', weight: 12, power: 15, desc: '彻底舍弃咒力换取超神级肉体' },
      { id: 'vesselAwake', label: '受肉体质觉醒', weight: 16, power: 9, desc: '灵魂意外承载远古残响，睁开术师之眼' },
      { id: 'mahitoPoke', label: '大脑微改（开眼）', weight: 20, power: 7, desc: '在异变中被唤醒潜藏的初级术式' }
    ]
  };

  var ATTRIBUTE_WHEELS = [
    {
      attr: 'ceTotal',
      title: '咒力总量',
      slices: [
        { label: 'EX（深不见底）', level: 10, weight: 4 },
        { label: 'SSS（乙骨/宿傩阶）', level: 9, weight: 6 },
        { label: 'SS（庞大）', level: 8, weight: 10 },
        { label: 'S（特级水准）', level: 7, weight: 14 },
        { label: 'A（一级）', level: 6, weight: 20 },
        { label: 'B（二级）', level: 5, weight: 22 },
        { label: 'C（三级）', level: 4, weight: 14 },
        { label: 'D（四级）', level: 2, weight: 10 }
      ]
    },
    {
      attr: 'ceControl',
      title: '咒力操纵',
      slices: [
        { label: 'EX（神之微操）', level: 10, weight: 5 },
        { label: 'SSS（大师级）', level: 9, weight: 8 },
        { label: 'SS（收放自如）', level: 8, weight: 12 },
        { label: 'S（特级水准）', level: 7, weight: 15 },
        { label: 'A（一级）', level: 6, weight: 22 },
        { label: 'B（二级）', level: 5, weight: 20 },
        { label: 'C（勉强成形）', level: 4, weight: 12 },
        { label: 'E-（根本控制不了）', level: 0, weight: 6 }
      ]
    },
    {
      attr: 'ceEfficiency',
      title: '咒力效率',
      slices: [
        { label: 'EX（比肩六眼）', level: 10, weight: 4 },
        { label: 'SSS（接近无限）', level: 9, weight: 7 },
        { label: 'SS（极省耗）', level: 8, weight: 11 },
        { label: 'S（精打细算）', level: 7, weight: 16 },
        { label: 'A（一级标准）', level: 6, weight: 22 },
        { label: 'B（正常损耗）', level: 5, weight: 22 },
        { label: 'C（略微浪费）', level: 4, weight: 12 },
        { label: 'D（漏气严重）', level: 2, weight: 6 }
      ]
    },
    {
      attr: 'body',
      title: '体质',
      slices: [
        { label: 'EX（天与暴君级）', level: 10, weight: 5 },
        { label: 'SSS（怪物身躯）', level: 9, weight: 8 },
        { label: 'SS（入学虎）', level: 8, weight: 12 },
        { label: 'S（顽强耐打）', level: 7, weight: 16 },
        { label: 'A（强健体魄）', level: 6, weight: 22 },
        { label: 'B（健康青年）', level: 5, weight: 21 },
        { label: 'C（普通人）', level: 4, weight: 11 },
        { label: 'D（体弱多病）', level: 2, weight: 5 }
      ]
    },
    {
      attr: 'taijutsu',
      title: '体术水平',
      slices: [
        { label: 'EX（格斗宗师）', level: 10, weight: 4 },
        { label: 'SSS（贴身碾压）', level: 9, weight: 8 },
        { label: 'SS（顶尖近战）', level: 8, weight: 12 },
        { label: 'S（特级体术）', level: 7, weight: 15 },
        { label: 'A（一级）', level: 6, weight: 23 },
        { label: 'B（二级）', level: 5, weight: 22 },
        { label: 'C（打架水平）', level: 4, weight: 11 },
        { label: 'D（体育不及格）', level: 2, weight: 5 }
      ]
    },
    {
      attr: 'iq',
      title: '智力水平',
      slices: [
        { label: 'EX（超越五十三万）', level: 10, weight: 5 },
        { label: 'SSS（绝对谋士）', level: 9, weight: 8 },
        { label: 'SS（战术鬼才）', level: 8, weight: 12 },
        { label: 'S（冷静通透）', level: 7, weight: 16 },
        { label: 'A（敏锐细致）', level: 6, weight: 20 },
        { label: 'B（机灵靠谱）', level: 5, weight: 20 },
        { label: 'C（普通人）', level: 4, weight: 14 },
        { label: 'E-（只有脑花没脑子）', level: 0, weight: 5 }
      ]
    },
    {
      attr: 'talent',
      title: '成长天赋',
      slices: [
        { label: 'EX（百年一遇）', level: 10, weight: 5 },
        { label: 'SSS（天纵奇才）', level: 9, weight: 8 },
        { label: 'SS（极快蜕变）', level: 8, weight: 13 },
        { label: 'S（潜力惊人）', level: 7, weight: 17 },
        { label: 'A（悟性极佳）', level: 6, weight: 22 },
        { label: 'B（稳步提升）', level: 5, weight: 20 },
        { label: 'C（努力派）', level: 4, weight: 10 },
        { label: 'D（开窍极慢）', level: 2, weight: 5 }
      ]
    },
    {
      attr: 'looks',
      title: '外貌颜值',
      slices: [
        { label: 'EX（美神之貌）', level: 10, weight: 6 },
        { label: 'SSS（盛世绝颜）', level: 9, weight: 10 },
        { label: 'SS（出众美型）', level: 8, weight: 14 },
        { label: 'S（俊美凌厉）', level: 7, weight: 18 },
        { label: 'A（清秀耐看）', level: 6, weight: 20 },
        { label: 'B（端正顺眼）', level: 5, weight: 18 },
        { label: 'C（路人长相）', level: 4, weight: 10 },
        { label: 'E（抽象长相）', level: 1, weight: 4 }
      ]
    },
    {
      attr: 'morality',
      title: '道德水平',
      slices: [
        { label: 'SS（高风亮节）', level: 8, weight: 15 },
        { label: 'S（坚守底线）', level: 7, weight: 18 },
        { label: 'A（善良正义）', level: 6, weight: 20 },
        { label: 'B（随心不逾矩）', level: 5, weight: 18 },
        { label: 'C（利己主义）', level: 4, weight: 14 },
        { label: 'D（心狠手辣）', level: 2, weight: 9 },
        { label: 'E-（纯正混乱恶）', level: 0, weight: 6 }
      ]
    }
  ];

  var SHIKIGAMI_SUB_BRANCHES = {
    autonomous: {
      title: '式神·是否能自主行动',
      slices: [
        { id: true, label: '是（可独立判断行动）', weight: 68 },
        { id: false, label: '否（完全听命于御主指令）', weight: 32 }
      ]
    },
    bodyType: {
      title: '式神·身躯形态',
      slices: [
        { id: 'humanoid', label: '类人型', weight: 26 },
        { id: 'avian', label: '飞禽型', weight: 25 },
        { id: 'beast', label: '走兽型', weight: 29 },
        { id: 'aberration', label: '异形结界体', weight: 20 }
      ]
    },
    subForm: {
      humanoid: [
        { label: '剑士拟态', weight: 30 },
        { label: '神官虚影', weight: 25 },
        { label: '鬼武者躯', weight: 25 },
        { label: '双面人偶', weight: 20 }
      ],
      avian: [
        { label: '鸦形', weight: 32 },
        { label: '雕形', weight: 26 },
        { label: '燕形', weight: 22 },
        { label: '枭形', weight: 20 }
      ],
      beast: [
        { label: '玉犬狼形', weight: 34 },
        { label: '巨象形', weight: 22 },
        { label: '虎煞形', weight: 24 },
        { label: '大蛇形', weight: 20 }
      ],
      aberration: [
        { label: '百目球体', weight: 30 },
        { label: '浮空法轮', weight: 30 },
        { label: '镜面幻匣', weight: 20 },
        { label: '雾化影团', weight: 20 }
      ]
    },
    mastersAncient: [
      { id: '宿傩', label: '两面宿傩', weight: 24, faction: 'evil' },
      { id: '里梅', label: '里梅', weight: 24, faction: 'evil' },
      { id: '羂索', label: '羂索', weight: 22, faction: 'evil' },
      { id: '万', label: '万', weight: 16, faction: 'neutral' },
      { id: '天元', label: '天元', weight: 14, faction: 'good' }
    ],
    mastersModern: [
      { id: '五条悟', label: '五条悟', weight: 15, faction: 'good' },
      { id: '伏黑惠', label: '伏黑惠', weight: 25, faction: 'good' },
      { id: '乙骨忧太', label: '乙骨忧太', weight: 20, faction: 'good' },
      { id: '夏油杰', label: '夏油杰', weight: 18, faction: 'evil' },
      { id: '羂索', label: '羂索', weight: 22, faction: 'evil' }
    ],
    supplyRates: [
      { label: '100% 全额供能（×1.32）', mult: 1.32, weight: 14 },
      { label: '80% 充沛供能（×1.22）', mult: 1.22, weight: 26 },
      { label: '60% 标准供能（×1.10）', mult: 1.10, weight: 34 },
      { label: '40% 节流供能（×0.95）', mult: 0.95, weight: 18 },
      { label: '20% 勉强维持（×0.82）', mult: 0.82, weight: 8 }
    ],
    bonds: [
      { label: '+3（绝对死忠与共鸣）', score: 3, weight: 10 },
      { label: '+2（生死与共的搭档）', score: 2, weight: 18 },
      { label: '+1（值得信赖）', score: 1, weight: 26 },
      { label: '0（纯粹契约工具关系）', score: 0, weight: 24 },
      { label: '-1（彼此提防猜忌）', score: -1, weight: 12 },
      { label: '-2（暗藏反噬之心）', score: -2, weight: 7 },
      { label: '-3（不死不休的厌恶）', score: -3, weight: 3 }
    ]
  };

  var GRADE_WHEELS = {
    standard: [
      { id: '特级', label: '特级（可覆灭一国）', weight: 10, bonus: 14 },
      { id: '准特级', label: '准特级（规格外边缘）', weight: 12, bonus: 11 },
      { id: '一级', label: '一级（术师中流砥柱）', weight: 26, bonus: 8 },
      { id: '准一级', label: '准一级（精锐骨干）', weight: 22, bonus: 6 },
      { id: '二级', label: '二级（独当一面）', weight: 18, bonus: 4 },
      { id: '三级', label: '三级（常规战力）', weight: 12, bonus: 2 }
    ],
    civilian: [
      { id: '未评级·潜力体', label: '未评级·隐性潜力', weight: 25, bonus: 3 },
      { id: '四级（普通人限界）', label: '四级（一般路人）', weight: 75, bonus: 0 }
    ]
  };

  var CURSED_TOOLS = [
    '游云（特级三节棍）',
    '释魂刀（直击灵魂）',
    '天逆鉾（强制解除术式）',
    '屠坐魔（附带诅咒短刀）',
    '黑绳（干扰术式织物）',
    '精制一级咒刀'
  ];

  var DOMAIN_NAMES = [
    '领域展开·无量天穹',
    '领域展开·伏魔幻界',
    '领域展开·暗翳影庭',
    '领域展开·极寒寂灭',
    '领域展开·万象裁决'
  ];

  // 各时代核心剧情池
  var ERA_EVENTS = {
    heian: [
      {
        id: 'heian_yorozu',
        title: '千年前·遇见万',
        intro: '你在平安京边缘碰见了对宿傩执着入魔的术师·万',
        choiceTitle: '面对执着于宿傩的万，你的行动',
        choices: [
          { label: '阻拦她', weight: 45, action: 'fight', enemyName: '万', enemyPower: 52, rewardSkill: '真球见闻录' },
          { label: '顺势搭话切磋', weight: 35, action: 'fight', enemyName: '万', enemyPower: 48, rewardSkill: '构筑术式心得' },
          { label: '悄悄绕道避开', weight: 20, action: 'safe', effectText: '稳健蛰伏，避开无谓消耗（智力 +1）', statUp: 'iq' }
        ]
      },
      {
        id: 'heian_sukuna_feast',
        title: '千年前·平安京夜宴异变',
        intro: '平安京贵族祭坛爆发浓重诅咒，两面宿傩的威压笼罩百里',
        choiceTitle: '宿傩阴影迫近时的抉择',
        choices: [
          { label: '正面硬撼堕天压迫', weight: 34, action: 'fight', enemyName: '两面宿傩（千年前）', enemyPower: 68 },
          { label: '协助镇压外围诅咒潮', weight: 44, action: 'fight', enemyName: '平安京百鬼残党', enemyPower: 38, statUp: 'ceControl' },
          { label: '蛰伏观战偷师古法', weight: 22, action: 'safe', effectText: '暗中领悟平安古法（咒力操纵 +1）', statUp: 'ceControl' }
        ]
      }
    ],
    edo400: [
      {
        id: 'edo_kashimo',
        title: '400年前·鹿紫云一邀战',
        intro: '电光缠身的强者鹿紫云一听闻你的名号，提棍登门寻战',
        choiceTitle: '面对鹿紫云一的决斗邀请',
        choices: [
          { label: '爽快接战！痛快一战', weight: 52, action: 'fight', enemyName: '鹿紫云一', enemyPower: 54 },
          { label: '设局试探雷电特性', weight: 30, action: 'fight', enemyName: '鹿紫云一', enemyPower: 48, statUp: 'iq' },
          { label: '婉拒比试闭门参悟', weight: 18, action: 'safe', effectText: '避其锋芒，静心凝炼（咒力效率 +1）', statUp: 'ceEfficiency' }
        ]
      }
    ],
    hiddenInv: [
      {
        id: 'hi_star_vessel',
        title: '怀玉篇·星浆体护卫波澜',
        intro: '咒术界暗流涌动，伏黑甚尔接受悬赏悄然入场',
        choiceTitle: '怀玉风波中你的行动',
        choices: [
          { label: '突入薨星宫正面对抗', weight: 46, action: 'fight', enemyName: '伏黑甚尔', enemyPower: 58, rewardTool: '天逆鉾碎片' },
          { label: '截击Q与盘星教外围暗杀组', weight: 36, action: 'fight', enemyName: '盘星教刺客团', enemyPower: 34 },
          { label: '远观局势谨守自身', weight: 18, action: 'safe', effectText: '看清「天与束缚」实质（体术 +1）', statUp: 'taijutsu' }
        ]
      }
    ],
    vol0: [
      {
        id: 'vol0_night_parade',
        title: '百鬼夜行·新宿与京都战线',
        intro: '夏油杰号令千余咒灵掀起百鬼夜行，全咒术界总动员！',
        choiceTitle: '百鬼夜行中你的去向',
        choices: [
          { label: '奔赴最前线迎战特级威胁', weight: 46, action: 'fight', enemyName: '夏油杰（百鬼夜行）', enemyPower: 54 },
          { label: '清剿新宿街头百鬼咒灵', weight: 38, action: 'fight', enemyName: '新宿特级咒灵群', enemyPower: 38 },
          { label: '后方结界支援救助伤员', weight: 16, action: 'safe', effectText: '救治多名同伴积累声望（道德 +1）', statUp: 'morality' }
        ]
      }
    ],
    canonStart: [
      {
        id: 'cs_exchange',
        title: '姐妹校交流会·特级咒灵突袭',
        intro: '原本热闹的校际对抗中途被特级花御与黑闪觉醒打断！',
        choiceTitle: '交流会突发异变时的应对',
        choices: [
          { label: '迎击特级自然咒灵花御', weight: 48, action: 'fight', enemyName: '花御', enemyPower: 46 },
          { label: '全力比拼黑闪手感与体术', weight: 36, action: 'fight', enemyName: '交流会精英对决', enemyPower: 34, statUp: 'taijutsu' },
          { label: '布下「帐」疏散其余学员', weight: 16, action: 'safe', effectText: '顺利完成全员掩护（智力 +1）', statUp: 'iq' }
        ]
      }
    ],
    shibuya_good: [
      {
        id: 'shi_g_frontline',
        title: '涩谷事变·地铁B5F激战',
        intro: '胀相、漏瑚与改造人铺天盖地，七海建人陷入苦战危险！',
        choiceTitle: '涩谷地铁深处的紧急行动',
        choices: [
          { label: '迎战灼热灾害·漏瑚', weight: 36, action: 'fight', enemyName: '漏瑚', enemyPower: 52 },
          { label: '死战胀相并尝试解救同伴', weight: 42, action: 'fight', enemyName: '胀相', enemyPower: 42, defeatsKey: 'choso' },
          { label: '突入涉谷站台救下七海前辈', weight: 22, action: 'fight', enemyName: '真人', enemyPower: 50, savesNanami: true }
        ]
      }
    ],
    shibuya_evil: [
      {
        id: 'shi_e_late',
        title: '涩谷事变·敌方追击迎战',
        intro: '虎杖悠仁与东堂葵强行联手突破，九十九由基压轴现身！',
        choiceTitle: '涩谷夜战中御主/同伙指示的行动',
        choices: [
          { label: '联手迎战虎杖、东堂等追击者', weight: 44, action: 'fight', enemyName: '虎杖与东堂', enemyPower: 46 },
          { label: '掩护羂索撤离并对峙九十九', weight: 34, action: 'fight', enemyName: '九十九由基', enemyPower: 56 },
          { label: '趁乱收割游离战场的胀相', weight: 22, action: 'fight', enemyName: '胀相', enemyPower: 42, defeatsKey: 'choso' }
        ]
      }
    ],
    culling: [
      {
        id: 'cg_colony',
        title: '死灭回游·仙台/东京结界激战',
        intro: '死灭回游泳者大混战全面打响，突破薨星宫防线成为关键！',
        choiceTitle: '死灭回游结界内的关键行动',
        choices: [
          { label: '闯入结界单挑顶尖泳者日车宽见', weight: 34, action: 'fight', enemyName: '日车宽见', enemyPower: 44 },
          { label: '正面交锋不死赌徒·秤金次', weight: 34, action: 'fight', enemyName: '秤金次', enemyPower: 52 },
          { label: '随大部队强突薨星宫结界阵地', weight: 32, action: 'fight', enemyName: '薨星宫守护阵线', enemyPower: 50 }
        ]
      }
    ],
    shinjuku: [
      {
        id: 'sj_showdown',
        title: '新宿决战·人外魔境终局',
        intro: '最强术师与诅咒之王震撼天地，全员轮番切入绝境决斗！',
        choiceTitle: '新宿终局战场中的站位',
        choices: [
          { label: '切入一线正面迎击最强宿傩', weight: 44, action: 'fight', enemyName: '完全体宿傩', enemyPower: 68 },
          { label: '牵制里梅寒冰结界支援主战场', weight: 36, action: 'fight', enemyName: '里梅', enemyPower: 50 },
          { label: '抢救濒死战友维持医疗后防', weight: 20, action: 'safe', effectText: '成功保下主力战力（体质 +1，声望加分）', statUp: 'body' }
        ]
      }
    ],
    future68: [
      {
        id: 'f68_opponent',
        title: '68年后·跨时代强者传闻',
        intro: '六十八年过去，新的强者传说仍在延续，宿命余波再次敲门',
        choiceTitle: '68年后·你的战斗对手',
        choices: [
          { label: '友好切磋·挑战达布拉', weight: 26, action: 'fight', enemyName: '达布拉', enemyPower: 56, defeatsKey: 'dabura', canDie: false },
          { label: '生死决斗·直面八握剑异戒神将魔虚罗', weight: 22, action: 'fight', enemyName: '魔虚罗', enemyPower: 64, canDie: true },
          { label: '切磋迟暮传说·68虎杖', weight: 20, action: 'fight', enemyName: '68虎杖', enemyPower: 54, canDie: false },
          { label: '镇压卷土重来·灵魂形态真人', weight: 18, action: 'fight', enemyName: '灵魂形态·真人', enemyPower: 52, canDie: true },
          { label: '归隐讲学安度余生', weight: 14, action: 'safe', effectText: '成为跨越时代的前辈传说（智力 +1）', statUp: 'iq' }
        ]
      }
    ]
  };

  var CROSS_ERA_WHEEL = {
    title: '如何跨越时代延续至今',
    slices: [
      { id: 'sealSleep', label: '封存沉睡待后世苏醒', weight: 40, preserved: true, effect: '化身媒介或被封印，在现代重新苏醒！' },
      { id: 'curseObject', label: '化为特级咒物等待受肉', weight: 35, preserved: true, effect: '以手指或咒核形式跨越数百年寻找容器！' },
      { id: 'bloodline', label: '随血脉与术式秘传延续', weight: 25, preserved: false, effect: '术式与意志在后代身上重现风华！' }
    ]
  };

  var REPUTATION_BY_FACTION = {
    good: [
      { label: 'EX·传奇救世支柱', level: 10, weight: 8 },
      { label: 'SS·受人敬仰的名宿', level: 8, weight: 18 },
      { label: 'S·功绩卓著的英雄', level: 7, weight: 24 },
      { label: 'A·可靠的资深前辈', level: 6, weight: 24 },
      { label: 'B·小有名气的术师', level: 5, weight: 16 },
      { label: 'C·默默无闻', level: 4, weight: 10 }
    ],
    neutral: [
      { label: 'SS·超然世外的传说', level: 8, weight: 12 },
      { label: 'A·令人捉摸不透', level: 6, weight: 26 },
      { label: 'B·业界略有耳闻', level: 5, weight: 28 },
      { label: 'C·平凡过客', level: 4, weight: 22 },
      { label: 'D·无人理会', level: 2, weight: 12 }
    ],
    evil: [
      { label: 'SS·令人闻风丧胆', level: 8, weight: 14 },
      { label: 'A·令人忌惮', level: 6, weight: 22 },
      { label: 'B·小有凶名', level: 5, weight: 26 },
      { label: 'C·偶有恶名', level: 4, weight: 18 },
      { label: 'D·无人理会', level: 2, weight: 12 },
      { label: 'E-·遭到唾弃', level: 0, weight: 8 }
    ]
  };

  var MODES = {
    normal: { id: 'normal', name: '正常模式', battleBonus: 0, growthBonus: 0 },
    story: { id: 'story', name: '剧情模式', battleBonus: 4, growthBonus: 10 },
    duel: { id: 'duel', name: '对决模式', battleBonus: 0, growthBonus: 8 },
    fun: { id: 'fun', name: '娱乐模式', battleBonus: 8, growthBonus: 18 }
  };

  global.JJK_OMEGA_DATA = {
    SLICE_COLORS: SLICE_COLORS,
    RANK_SCALE: RANK_SCALE,
    ATTRIBUTE_DEFS: ATTRIBUTE_DEFS,
    IDENTITIES: IDENTITIES,
    ERAS: ERAS,
    BIRTH_ERA_SLICES: BIRTH_ERA_SLICES,
    BIRTHPLACE_SLICES: BIRTHPLACE_SLICES,
    SORCERER_LINEAGES: SORCERER_LINEAGES,
    TECHNIQUES_BY_IDENTITY: TECHNIQUES_BY_IDENTITY,
    ATTRIBUTE_WHEELS: ATTRIBUTE_WHEELS,
    SHIKIGAMI_SUB_BRANCHES: SHIKIGAMI_SUB_BRANCHES,
    GRADE_WHEELS: GRADE_WHEELS,
    CURSED_TOOLS: CURSED_TOOLS,
    DOMAIN_NAMES: DOMAIN_NAMES,
    ERA_EVENTS: ERA_EVENTS,
    CROSS_ERA_WHEEL: CROSS_ERA_WHEEL,
    REPUTATION_BY_FACTION: REPUTATION_BY_FACTION,
    MODES: MODES
  };
})(window);
