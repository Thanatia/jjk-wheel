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

  // 原版十维核心属性
  var ATTRIBUTE_DEFS = [
    { key: 'ceTotal', name: '咒力总量', desc: '决定持久战能力、大招释放次数与咏唱爆发上限' },
    { key: 'ceControl', name: '咒力操纵', desc: '影响精确微操、黑闪爆发率与招式稳定性' },
    { key: 'ceEfficiency', name: '咒力效率', desc: '影响咒力消耗比率与战局续航表现' },
    { key: 'taijutsu', name: '体术水平', desc: '决定近战搏杀输出、连击倍率与贴身优势' },
    { key: 'bodyResist', name: '身体抗性', desc: '直接降低战后重伤/死亡概率，提升存活率' },
    { key: 'soulResist', name: '灵魂抗性', desc: '抵抗无为转变、释魂刀与灵魂夺舍的防线' },
    { key: 'barrier', name: '结界术', desc: '强化简易领域/弥虚葛笼/领域展开对抗压制力' },
    { key: 'versatility', name: '术式泛用', desc: '影响不同地形/对手适应力与招式抵消概率' },
    { key: 'iq', name: '智力水平', desc: '影响战术权重修正、规避陷阱与临场拆招' },
    { key: 'talent', name: '天赋潜力', desc: '决定高级技巧抽取总数与每次战后突破成长率' }
  ];

  var IDENTITIES = [
    { id: 'sorcerer', label: '咒术师', weight: 22, cost: 3, faction: 'good', desc: '正统入世的咒术行使者，行走于明暗交界' },
    { id: 'curseUser', label: '诅咒师', weight: 13, cost: 3, faction: 'evil', desc: '以咒术行私欲或暗杀之事的法外之人' },
    { id: 'civilian', label: '普通人', weight: 28, cost: 0, faction: 'neutral', desc: '看似平凡的常人，命运也可能卷入咒力漩涡' },
    { id: 'higherUp', label: '咒术高层', weight: 11, cost: 2, faction: 'neutral', desc: '端坐屏风之后制定规矩与处刑令的掌权者' },
    { id: 'curse', label: '咒灵', weight: 9, cost: 4, faction: 'evil', desc: '人类负面情绪凝结诞生的诅咒具现' },
    { id: 'shikigami', label: '式神', weight: 9, cost: 3, faction: 'neutral', desc: '依附术式或御主显化的异界灵体战力' },
    { id: 'corpse', label: '咒骸', weight: 8, cost: 3, faction: 'good', desc: '灌注咒核、具备自我意识的人造傀儡存在' }
  ];

  var ERAS = [
    { id: 'heian', label: '千年前平安时代', short: '平安时代', cost: 4, order: 0 },
    { id: 'edo400', label: '400年前', short: '江户初年', cost: 3, order: 1 },
    { id: 'hiddenInv', label: '怀玉时期', short: '怀玉·玉折', cost: 2, order: 2 },
    { id: 'vol0', label: '0卷时期', short: '百鬼夜行', cost: 2, order: 3 },
    { id: 'canonStart', label: '剧情开始时期', short: '开篇时期', cost: 1, order: 4 },
    { id: 'shibuya', label: '涩谷事变时期', short: '涩谷事变', cost: 2, order: 5 },
    { id: 'culling', label: '死灭回游时期', short: '死灭回游', cost: 2, order: 6 },
    { id: 'shinjuku', label: '新宿决战时期', short: '新宿决战', cost: 4, order: 7 },
    { id: 'future68', label: '68年后后世', short: '六十八年后', cost: 0, order: 8 }
  ];

  var BIRTH_ERA_SLICES = [
    { id: 'heian', label: '千年前平安时代', weight: 11 },
    { id: 'edo400', label: '400年前', weight: 9 },
    { id: 'hiddenInv', label: '怀玉时期', weight: 13 },
    { id: 'vol0', label: '0卷时期', weight: 12 },
    { id: 'canonStart', label: '剧情开始时期', weight: 21 },
    { id: 'shibuya', label: '涩谷事变时期', weight: 14 },
    { id: 'culling', label: '死灭回游时期', weight: 11 },
    { id: 'shinjuku', label: '新宿决战时期', weight: 9 }
  ];

  var BIRTHPLACE_SLICES = [
    { id: 'tokyo', label: '东京都市圈', weight: 40, note: '身处现代咒术高专与大结界中心' },
    { id: 'kyoto', label: '京都古老世家圈', weight: 28, note: '底蕴深厚的御三家辐射带' },
    { id: 'japanOther', label: '日本地方/乡野', weight: 14, note: '远离都市但怪谈咒灵频生之地' },
    { id: 'overseas', label: '海外异域', weight: 12, note: '罕有同类的特殊外域（如米格尔故乡等）' },
    { id: 'barrier', label: '特异结界内', weight: 6, note: '直接诞生于特殊生得结界或薨星宫余波' }
  ];

  var FACTION_WHEELS = {
    sorcerer: [
      { id: 'good', label: '咒术高专', weight: 46, note: '加入高专体系，守护同伴与非术师' },
      { id: 'good', label: '御三家', weight: 26, note: '背负五条/禅院/加茂古老家门立场' },
      { id: 'neutral', label: '自由人/独行', weight: 20, note: '不站死队、靠实力行走灰界' },
      { id: 'evil', label: '盘星教残党关联', weight: 8, note: '心向激进变革或暗中观望高专崩塌' }
    ],
    curseUser: [
      { id: 'evil', label: '诅咒师集团（Q/盘星余党）', weight: 52, note: '活跃于悬赏、暗杀与暗黑交易' },
      { id: 'neutral', label: '赏金自由人', weight: 30, note: '给钱就办事，随时可能跳反' },
      { id: 'evil', label: '追随羂索阵线', weight: 18, note: '被卷入死灭回游与天元融合大计' }
    ],
    higherUp: [
      { id: 'neutral', label: '稳健元老守序派', weight: 46, note: '优先维持高专框架与社会秩序' },
      { id: 'evil', label: '极端死刑保守派', weight: 32, note: '倾向压制异端特级与宿傩容器' },
      { id: 'good', label: '隐秘高专改革协力者', weight: 22, note: '暗中支持五条悟与年轻一辈成长' }
    ],
    curse: [
      { id: 'evil', label: '自然灾害特级盟友', weight: 50, note: '与漏瑚、花御、真人同列咒灵本位' },
      { id: 'evil', label: '独立野生大咒灵', weight: 34, note: '盘踞灵地割据一方' },
      { id: 'neutral', label: '契约共生变异咒灵', weight: 16, note: '效忠特定术师或守护执念对象' }
    ],
    civilian: [
      { id: 'neutral', label: '一般平民秩序圈', weight: 65, note: '按日常视角见证咒术风波' },
      { id: 'good', label: '高专辅助监督后备', weight: 22, note: '负责放「帐」或辅助术师调度' },
      { id: 'evil', label: '被诅咒师拉拢目标', weight: 13, note: '因特殊体质或执念被卷入暗面' }
    ],
    corpse: [
      { id: 'good', label: '夜蛾系咒骸守护派', weight: 65, note: '受高专同伴庇护与认可' },
      { id: 'neutral', label: '流浪独立咒骸', weight: 35, note: '追寻自身咒核存在的意义' }
    ]
  };

  // 30+ 生得术式总池
  var TECHNIQUES_ALL = [
    { id: 'limitless', label: '无下限咒术', weight: 4, power: 18, cost: 8, desc: '支配收敛与排斥，附带苍/赫/茈至高上限' },
    { id: 'tenShadows', label: '十种影法术', weight: 6, power: 16, cost: 6, desc: '以影召十式神，潜藏调伏魔虚罗之可能' },
    { id: 'shrine', label: '御厨子', weight: 4, power: 18, cost: 8, desc: '解、捌与灶开斩碎万物的诅咒之王招牌' },
    { id: 'curseManip', label: '咒灵操术', weight: 5, power: 16, cost: 6, desc: '降伏并驱使成百上千咒灵化为极之番漩涡' },
    { id: 'copy', label: '模倣·术式拷贝', weight: 5, power: 16, cost: 6, desc: '复刻见过与吞噬过的多元高阶术式' },
    { id: 'starRage', label: '星之怒（质量赋予）', weight: 5, power: 15, cost: 5, desc: '无限附加假想质量实现一拳崩山威力' },
    { id: 'gamble', label: '坐杀博徒', weight: 6, power: 14, cost: 5, desc: '赌中概率即刻进入4分11秒不死无限咒力态' },
    { id: 'heavenZero', label: '天与咒缚（零咒力）', weight: 5, power: 17, cost: 6, desc: '零咒力换取超越极限五感与免疫领域必中' },
    { id: 'boogieWoogie', label: '不义游戏', weight: 7, power: 12, cost: 3, desc: '拍手瞬时调换所有带咒力目标坐标' },
    { id: 'bloodManip', label: '赤血操术', weight: 8, power: 12, cost: 3, desc: '穿血与赤鳞跃动兼顾爆发与肉体超强化' },
    { id: 'projection', label: '投射咒法', weight: 7, power: 12, cost: 3, desc: '二十四帧高速移动与冻结对方一秒僵直' },
    { id: 'construct', label: '构筑术式', weight: 6, power: 12, cost: 3, desc: '用自身咒力直接从零实体构筑任何物质' },
    { id: 'iceForm', label: '冰凝咒法', weight: 6, power: 13, cost: 4, desc: '大范围霜凪凝结极寒冰壁与直瀑' },
    { id: 'cursedSpeech', label: '咒言', weight: 7, power: 11, cost: 3, desc: '高浓度诅咒直接凭言语强制压制目标' },
    { id: 'ratio', label: '十划咒法', weight: 8, power: 12, cost: 3, desc: '锁定七三比例弱点造成必定瓦解重击' },
    { id: 'strawDoll', label: '刍灵咒法', weight: 8, power: 10, cost: 2, desc: '共鸣直击对手灵魂本质' },
    { id: 'lazy', label: '惰性咒术 / 结界重压', weight: 7, power: 10, cost: 2, desc: '制造黏滞与沉重迟缓场域压制动作' },
    { id: 'seance', label: '降灵术', weight: 6, power: 11, cost: 2, desc: '召唤强敌肉身信息降临替代战斗' },
    { id: 'inverse', label: '逆转术法', weight: 7, power: 11, cost: 2, desc: '把过强或过弱的打击直接翻转判定无效' },
    { id: 'miracle', label: '奇迹存储', weight: 7, power: 10, cost: 2, desc: '以微末幸运化作多次免死替伤护符' },
    { id: 'receipt', label: '收据再现术式', weight: 8, power: 10, cost: 2, desc: '点燃契约收据具现对应物资与载具猛攻' },
    { id: 'higurumaLaw', label: '诛伏赐死（审判领域）', weight: 5, power: 14, cost: 5, desc: '展开必中法庭强行没收对方术式或判死刑剑' },
    { id: 'comedian', label: '超人（喜剧人现实改写）', weight: 4, power: 16, cost: 6, desc: '只要自己觉得好笑就能强行改写局部物理现实' },
    { id: 'mythBeast', label: '幻兽琥珀（电气属性）', weight: 5, power: 14, cost: 4, desc: '天然带电特质加身并爆发一次性的巅峰超频' },
    { id: 'idleTransfig', label: '无为转变', weight: 5, power: 16, cost: 6, desc: '随意改造自身与碰触者的灵魂轮廓' },
    { id: 'disasterFlames', label: '大地灼炎', weight: 6, power: 14, cost: 4, desc: '火山火砾虫与极之番陨的焦土焚灭' },
    { id: 'disasterPlants', label: '灾厄森罗', weight: 6, power: 13, cost: 3, desc: '吸取植物生机凝成供弹大咒花与树海' },
    { id: 'disasterTides', label: '陀艮潮汐', weight: 6, power: 13, cost: 3, desc: '深海累卵式神无休止撕咬敌手' },
    { id: 'deadSwarm', label: '死累累涌军', weight: 7, power: 12, cost: 3, desc: '狂涌魔虫与结界封锁干扰战场视线' },
    { id: 'newShadow', label: '新阴流·无生得术式', weight: 9, power: 9, cost: 0, desc: '专注刀术拔刀与简易领域反制一切复杂术式' }
  ];

  // 高级技巧全池
  var HIGH_TECHNIQUES = [
    { id: 'chant', label: '完整咏唱', weight: 14, power: 5, note: '释放术式时可补全词句大幅拔高咒力输出' },
    { id: 'simpleDomain', label: '简易领域', weight: 15, power: 6, note: '展开护身结界中和必中术式与削弱敌方攻击' },
    { id: 'domainAmp', label: '领域展延', weight: 11, power: 7, note: '如同贴身水膜包覆躯体强行中和无下限等棘手术式' },
    { id: 'rct', label: '反转术式', weight: 12, power: 9, note: '负负得正强力治疗创伤，决战极大幅提高容错率' },
    { id: 'domainExpansion', label: '领域展开', weight: 9, power: 13, note: '施展生得领域获得绝对必中与 120% 增幅' },
    { id: 'blackFlash', label: '黑闪', weight: 12, power: 7, note: '打击瞬间 0.000001 秒咒力共振，爆发 2.5 次方猛击' },
    { id: 'hollowWicker', label: '弥虚葛笼', weight: 10, power: 5, note: '古老结界术抵御一切领域必中效果' },
    { id: 'fallingBlossom', label: '落之雪（落花之情）', weight: 9, power: 5, note: '御三家秘传自动反击触摸到身体的必中打击' },
    { id: 'hundredWeapons', label: '百兵演武', weight: 8, power: 7, note: '危急时刻故意粉碎所持咒具引爆远超上限的奇袭一击' }
  ];

  // 26 种咒具器形
  var TOOL_SHAPES = [
    '打刀', '长剑', '长枪', '方匣', '关刀', '拳套', '蛇鞭', '重弓',
    '巨盾', '铁扇', '金刚杵', '锁链', '长戟', '战斧', '三节棍', '短匕',
    '双拐', '大太刀', '双爪', '苦无组', '重锤', '手杖', '古琴弦', '咒伞',
    '长镰', '护腕'
  ];

  // 咒具效果词条
  var TOOL_EFFECTS = [
    { label: '纯白板高硬度物理咒具', tier: '普通', bonus: 2, tag: '纯武' },
    { label: '咒力传导增幅（输出+20%）', tier: '二级/一级', bonus: 4, tag: '增幅' },
    { label: '强制解除敌方术式特攻（天逆系）', tier: '特级', bonus: 8, tag: '解术' },
    { label: '直切灵魂忽略防御（释魂系）', tier: '特级', bonus: 8, tag: '魂伤' },
    { label: '沉重刚烈叠加破坏力（游云系）', tier: '特级', bonus: 7, tag: '重击' },
    { label: '命中附带诅咒侵蚀与灼伤', tier: '一级', bonus: 5, tag: '附魔' },
    { label: '可抵消敌方招式减伤护盾', tier: '一级', bonus: 5, tag: '御守' },
    { label: '吸取对手残留咒力反哺自身', tier: '准特级', bonus: 6, tag: '续航' }
  ];

  var LOOKS_WHEEL = [
    { label: 'EX（美神降临·令人失神）', level: 10, weight: 6 },
    { label: 'SSS（绝代风华·五条级神颜）', level: 9, weight: 10 },
    { label: 'SS（气质出众·众人瞩目）', level: 8, weight: 14 },
    { label: 'S（英俊飒爽 / 清冷惊艳）', level: 7, weight: 18 },
    { label: 'A（眉目俊秀）', level: 6, weight: 20 },
    { label: 'B（清秀耐看）', level: 5, weight: 17 },
    { label: 'C（平平无奇路人）', level: 4, weight: 10 },
    { label: 'E-（咒灵看到都要退让三分）', level: 0, weight: 5 }
  ];

  var MORALITY_WHEEL = [
    { label: 'SS（高风亮节·以身护人）', level: 8, weight: 15 },
    { label: 'S（坚守正道底线）', level: 7, weight: 18 },
    { label: 'A（心怀善念）', level: 6, weight: 20 },
    { label: 'B（随性顺心）', level: 5, weight: 18 },
    { label: 'C（利益至上）', level: 4, weight: 14 },
    { label: 'D（心狠手辣）', level: 2, weight: 9 },
    { label: 'E-（纯粹混乱邪恶）', level: 0, weight: 6 }
  ];

  var AGGRO_WHEEL = [
    { label: '！？磁场颠佬？！（逢敌必死斗）', level: 10, weight: 8 },
    { label: 'SS（好战狂热分子）', level: 8, weight: 16 },
    { label: 'A（遇到挑衅绝不退缩）', level: 6, weight: 28 },
    { label: 'B（看性价比与胜算再动手）', level: 5, weight: 28 },
    { label: 'D（厌战摸鱼保命第一）', level: 2, weight: 20 }
  ];

  // 十维属性轮盘配置
  var ATTRIBUTE_WHEELS = ATTRIBUTE_DEFS.map(function (def) {
    return {
      attr: def.key,
      title: def.name,
      desc: def.desc,
      slices: [
        { label: 'EX（规格之外）', level: 10, weight: 4 },
        { label: 'SSS（传世巅峰）', level: 9, weight: 7 },
        { label: 'SS（顶尖强者）', level: 8, weight: 11 },
        { label: 'S（特级水准）', level: 7, weight: 15 },
        { label: 'A（一级主力）', level: 6, weight: 22 },
        { label: 'B（二级常规）', level: 5, weight: 21 },
        { label: 'C（三级 / 常人）', level: 4, weight: 12 },
        { label: 'D（四级薄弱）', level: 2, weight: 5 },
        { label: 'E-（搞笑级别短板）', level: 0, weight: 3 }
      ]
    };
  });

  var SHIKIGAMI_SUB_BRANCHES = {
    autonomous: {
      title: '式神·是否能自主行动',
      slices: [
        { id: true, label: '是（独立判断自主战斗）', weight: 68 },
        { id: false, label: '否（严格听从御主指令）', weight: 32 }
      ]
    },
    bodyType: {
      title: '式神·身躯形态',
      slices: [
        { id: 'humanoid', label: '类人型', weight: 26 },
        { id: 'avian', label: '飞禽型', weight: 25 },
        { id: 'beast', label: '走兽型', weight: 29 },
        { id: 'aberration', label: '异形法轮体', weight: 20 }
      ]
    },
    subForm: {
      humanoid: [{ label: '剑士拟态', weight: 30 }, { label: '八握剑武士', weight: 26 }, { label: '神官虚影', weight: 24 }, { label: '双面式偶', weight: 20 }],
      avian: [{ label: '鸦形', weight: 32 }, { label: '雕形', weight: 26 }, { label: '鵺·巨翼', weight: 24 }, { label: '枭形', weight: 18 }],
      beast: [{ label: '玉犬狼形', weight: 34 }, { label: '满象', weight: 22 }, { label: '贯牛', weight: 24 }, { label: '脱兔群', weight: 20 }],
      aberration: [{ label: '背生法轮态', weight: 32 }, { label: '百目结界球', weight: 28 }, { label: '镜面灵匣', weight: 20 }, { label: '墨影团', weight: 20 }]
    },
    mastersAncient: [
      { id: '两面宿傩', label: '两面宿傩', weight: 24, faction: 'evil' },
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
      { label: '+3（生死羁绊绝对死忠）', score: 3, weight: 10 },
      { label: '+2（高度信任搭档）', score: 2, weight: 18 },
      { label: '+1（可靠配合）', score: 1, weight: 26 },
      { label: '0（契约利用）', score: 0, weight: 24 },
      { label: '-1（彼此戒备）', score: -1, weight: 12 },
      { label: '-2（暗藏反噬）', score: -2, weight: 10 }
    ]
  };

  var GRADE_WHEELS = {
    standard: [
      { id: '特级', label: '特级（规格外破坏力）', weight: 11, bonus: 15, cost: 5 },
      { id: '准特级', label: '准特级（危险边界）', weight: 13, bonus: 12, cost: 4 },
      { id: '一级', label: '一级（术师中流砥柱）', weight: 26, bonus: 8, cost: 2 },
      { id: '准一级', label: '准一级（资深骨干）', weight: 21, bonus: 6, cost: 1 },
      { id: '二级', label: '二级（常规中坚）', weight: 17, bonus: 4, cost: 0 },
      { id: '三级', label: '三级（新人起步）', weight: 12, bonus: 2, cost: 0 }
    ],
    civilian: [
      { id: '潜力体（高抗性常人）', label: '潜力体（异常耐受）', weight: 26, bonus: 3 },
      { id: '四级（普通人限界）', label: '四级（普通市民）', weight: 74, bonus: 0 }
    ]
  };

  // 各时代丰富随机事件池（配合重大事件数量盘多次抽出不重复组合）
  var ERA_EVENTS = {
    heian: [
      {
        id: 'heian_yorozu',
        title: '千年前·遇见万',
        intro: '平安京边缘遇到为宿傩疯魔的构筑术师·万，正打算强行验证真爱',
        choiceTitle: '面对执着宿傩的万，你的应对',
        choices: [
          { label: '迎战并阻拦她', weight: 46, action: 'fight', enemyName: '万', enemyPower: 54, rewardSkill: '真球防御心法' },
          { label: '切磋验证彼此术式', weight: 34, action: 'fight', enemyName: '万', enemyPower: 48, statUp: 'versatility' },
          { label: '避战观察构筑原理', weight: 20, action: 'safe', effectText: '暗中掌握构筑微操，术式泛用 +1', statUp: 'versatility' }
        ]
      },
      {
        id: 'heian_sukuna_feast',
        title: '千年前·宿傩平安京威压',
        intro: '藤原氏祭典遭遇两面宿傩与里梅联袂降临，百里皆为斩击余波',
        choiceTitle: '堕天威压当前你的行动',
        choices: [
          { label: '硬顶压迫与里梅交锋', weight: 42, action: 'fight', enemyName: '平安时代·里梅', enemyPower: 52 },
          { label: '趁乱镇压暴走安倍式神众', weight: 38, action: 'fight', enemyName: '安倍阴术式神群', enemyPower: 40, statUp: 'barrier' },
          { label: '收敛气息暗中参悟', weight: 20, action: 'safe', effectText: '稳固神魂，灵魂抗性 +1', statUp: 'soulResist' }
        ]
      }
    ],
    edo400: [
      {
        id: 'edo_kashimo',
        title: '400年前·鹿紫云一登门寻战',
        intro: '神雷缠身的老人鹿紫云一踏破门槛，只问一句：你要来一战吗？',
        choiceTitle: '面对鹿紫云一的决斗邀约',
        choices: [
          { label: '痛快死战一场！', weight: 52, action: 'fight', enemyName: '鹿紫云一', enemyPower: 56 },
          { label: '以结界巧招试探雷电特性', weight: 30, action: 'fight', enemyName: '鹿紫云一', enemyPower: 49, statUp: 'barrier' },
          { label: '劝其等待四百年后宿傩现世', weight: 18, action: 'safe', effectText: '巧妙说服避免消耗，智力 +1', statUp: 'iq' }
        ]
      },
      {
        id: 'edo_御三家死斗',
        title: '400年前·六眼与十影御前死斗余波',
        intro: '五条家与禅院家前代家主同归于尽引发全境结界震荡',
        choiceTitle: '卷入家主死斗余波的选择',
        choices: [
          { label: '接手清扫失控残余咒灵', weight: 50, action: 'fight', enemyName: '江户特级暴走咒灵', enemyPower: 44 },
          { label: '抄录两大家传禁术残卷', weight: 50, action: 'safe', effectText: '参悟先代心法，结界术 +1、咒力效率 +1', statUp: 'ceEfficiency' }
        ]
      }
    ],
    hiddenInv: [
      {
        id: 'hi_star_vessel',
        title: '怀玉·玉折 · 星浆体护卫夜袭',
        intro: '薨星宫在即，术师杀手伏黑甚尔带着天逆鉾与释魂刀踏入战线',
        choiceTitle: '怀玉关键夜晚的行动选择',
        choices: [
          { label: '正面对决术师杀手伏黑甚尔', weight: 42, action: 'fight', enemyName: '伏黑甚尔', enemyPower: 60, defeatsKey: 'toji' },
          { label: '截杀暗杀悬赏外围诅咒师', weight: 40, action: 'fight', enemyName: '盘星教雇佣暗杀团', enemyPower: 35 },
          { label: '护送星浆体后翼迅速撤离', weight: 18, action: 'safe', effectText: '临危不乱，智力 +1、身体抗性 +1', statUp: 'bodyResist' }
        ]
      },
      {
        id: 'hi_geto_rain',
        title: '怀玉之后 · 五条悟觉醒与夏油雨夜',
        intro: '年轻的最强领悟反转术式苍茈，另一人却在苦夏中陷入深渊',
        choiceTitle: '在苦夏节点上你的举动',
        choices: [
          { label: '找刚觉醒的五条悟切磋一局', weight: 45, action: 'fight', enemyName: '觉醒五条悟（切磋）', enemyPower: 64, canDie: false },
          { label: '在雨夜替夏油杰分担繁重拔除任务', weight: 55, action: 'safe', effectText: '高强度连战磨砺，咒力操纵 +1', statUp: 'ceControl' }
        ]
      }
    ],
    vol0: [
      {
        id: 'vol0_night_parade',
        title: '0卷·百鬼夜行新宿与京都战线',
        intro: '夏油杰放出千余咒灵掀起百鬼夜行，祈本里香与乙骨忧太迎来巅峰交锋',
        choiceTitle: '百鬼夜行中你镇守的方向',
        choices: [
          { label: '拦截特级诅咒师夏油杰本阵', weight: 44, action: 'fight', enemyName: '夏油杰（百鬼夜行）', enemyPower: 55 },
          { label: '清扫新宿街头百鬼咒灵大军', weight: 38, action: 'fight', enemyName: '百鬼夜行特级咒灵', enemyPower: 40 },
          { label: '抢救伤员并构筑大范围「帐」', weight: 18, action: 'safe', effectText: '稳妥护下后方，结界术 +1', statUp: 'barrier' }
        ]
      }
    ],
    canonStart: [
      {
        id: 'cs_exchange',
        title: '姐妹校交流会·花御奇袭',
        intro: '东京都立与京都校交流会进行时，特级咒灵花御配合帐强行突入',
        choiceTitle: '交流会现场面对突袭的选择',
        choices: [
          { label: '正面对抗特级咒灵·花御', weight: 48, action: 'fight', enemyName: '花御', enemyPower: 48 },
          { label: '借黑闪节奏碾压场内对手', weight: 34, action: 'fight', enemyName: '交流会顶尖战力', enemyPower: 36, statUp: 'taijutsu' },
          { label: '破解外侧禁入五条悟的特殊「帐」', weight: 18, action: 'safe', effectText: '成功撕裂结界一角，结界术 +1', statUp: 'barrier' }
        ]
      },
      {
        id: 'cs_bridge',
        title: '八十八桥·特级咒胎九相图苏醒',
        intro: '宿傩手指共鸣引发八十八桥咒胎异动，坏相与血涂现身',
        choiceTitle: '八十八桥遭遇九相图的行动',
        choices: [
          { label: '斩杀受肉特级·坏相与血涂', weight: 70, action: 'fight', enemyName: '坏相＆血涂', enemyPower: 39 },
          { label: '回收手指并及时退场汇报', weight: 30, action: 'safe', effectText: '平稳完成回收，智力 +1', statUp: 'iq' }
        ]
      }
    ],
    shibuya_good: [
      {
        id: 'shi_g_frontline',
        title: '涩谷事变·B5F 至站台乱战',
        intro: '胀相、漏瑚、真人接连现身，七海建人也正身陷绝境边缘！',
        choiceTitle: '涩谷夜晚你切入哪处战场',
        choices: [
          { label: '独自拖住灾害极炎·漏瑚', weight: 34, action: 'fight', enemyName: '漏瑚', enemyPower: 54 },
          { label: '在地铁厕所血战九相图大哥·胀相', weight: 40, action: 'fight', enemyName: '胀相', enemyPower: 44, defeatsKey: 'choso' },
          { label: '冲向涉谷站台死保七海建人！', weight: 26, action: 'fight', enemyName: '真人', enemyPower: 52, savesNanami: true }
        ]
      },
      {
        id: 'shi_g_dagon',
        title: '涩谷事变·陀艮领域展开死局',
        intro: '被卷入「荡蕴平线」无穷式神咬杀，此时天与暴君降灵破门而入',
        choiceTitle: '面对海啸般涌来的死累累涌军',
        choices: [
          { label: '与队友死扛到结界被破', weight: 52, action: 'fight', enemyName: '陀艮', enemyPower: 48 },
          { label: '联手禅院直毘人抢攻本体', weight: 48, action: 'fight', enemyName: '降灵·伏黑甚尔 / 陀艮', enemyPower: 55 }
        ]
      }
    ],
    shibuya_evil: [
      {
        id: 'shi_e_late',
        title: '涩谷事变·敌方追击迎战',
        intro: '虎杖与东堂联手爆发连续黑闪，随后特级九十九由基压轴挡路！',
        choiceTitle: '敌方阵营在涩谷夜战的抉择',
        choices: [
          { label: '联手迎战虎杖、东堂等追击者', weight: 44, action: 'fight', enemyName: '虎杖与东堂', enemyPower: 48 },
          { label: '掩护羂索撤离并对峙九十九由基', weight: 34, action: 'fight', enemyName: '九十九由基', enemyPower: 58 },
          { label: '趁乱伏击独自脱队的胀相', weight: 22, action: 'fight', enemyName: '胀相', enemyPower: 44, defeatsKey: 'choso' }
        ]
      },
      {
        id: 'shi_e_front',
        title: '涩谷事变·截击高专一级主力',
        intro: '七海建人、禅院直毘人与日下部在站内突进阻拦封印推进',
        choiceTitle: '面对赶来拆帐的高专主力小队',
        choices: [
          { label: '正面斩断七海与直毘人突围', weight: 52, action: 'fight', enemyName: '七海＆禅院直毘人', enemyPower: 46 },
          { label: '避让降灵失控的伏黑甚尔并清剿外围', weight: 48, action: 'safe', effectText: '稳守外围战线避免无谓损伤，智力 +1', statUp: 'iq' }
        ]
      }
    ],
    culling: [
      {
        id: 'cg_sendai',
        title: '死灭回游·仙台四天王混战',
        intro: '乌鹭亨子、石流龙、黑沐死与杜鲁夫互相牵制，乙骨忧太独自压场',
        choiceTitle: '在仙台结界内选择交手对象',
        choices: [
          { label: '正面硬撼仙台强敌·石流龙＆乌鹭', weight: 44, action: 'fight', enemyName: '仙台巅峰双强', enemyPower: 54 },
          { label: '挑战刚入场的特级·乙骨忧太', weight: 30, action: 'fight', enemyName: '乙骨忧太（死灭回游）', enemyPower: 60 },
          { label: '暗中收割泳者积分完善结界术', weight: 26, action: 'safe', effectText: '斩获足量总则分数，结界术 +1', statUp: 'barrier' }
        ]
      },
      {
        id: 'cg_tokyo',
        title: '死灭回游·东京第1与第2结界',
        intro: '日车宽见与秤金次、鹿紫云一打出令人窒息的极限对局，随后突破薨星宫防线',
        choiceTitle: '在东京结界的关键一战',
        choices: [
          { label: '对决天才律师·日车宽见', weight: 34, action: 'fight', enemyName: '日车宽见', enemyPower: 46 },
          { label: '迎战坐杀博徒·秤金次（不死狂热态）', weight: 36, action: 'fight', enemyName: '秤金次', enemyPower: 54 },
          { label: '随阵营突击薨星宫天元防线', weight: 30, action: 'fight', enemyName: '薨星宫守护防线', enemyPower: 52 }
        ]
      }
    ],
    future68: [
      {
        id: 'f68_opponent',
        title: '68年后·跨越半个世纪的传闻',
        intro: '宿傩落幕六十八年后，新生的传闻与远古残影再次回响世间',
        choiceTitle: '68年后·你的战斗对手',
        choices: [
          { label: '友好切磋·挑战达布拉', weight: 24, action: 'fight', enemyName: '达布拉', enemyPower: 58, defeatsKey: 'dabura', canDie: false },
          { label: '生死决斗·八握剑异戒神将魔虚罗', weight: 20, action: 'fight', enemyName: '完全体魔虚罗', enemyPower: 66, canDie: true },
          { label: '切磋高寿传说·68虎杖', weight: 20, action: 'fight', enemyName: '68虎杖', enemyPower: 56, canDie: false },
          { label: '降伏卷土重来·灵魂形态真人', weight: 18, action: 'fight', enemyName: '灵魂形态·真人', enemyPower: 54, canDie: true },
          { label: '隐居传道静观后世（平顺养老）', weight: 18, action: 'safe', effectText: '德高望重安度余生，智力 +1', statUp: 'iq' }
        ]
      }
    ]
  };

  // ==================== 新宿决战 · 原作回合制博弈数据 ====================
  var SHINJUKU_PREP_GROWTH = [
    { id: 'taiBody', label: '一个月魔鬼体术特训（体术+1，抗性+1）', weight: 26 },
    { id: 'soulLearn', label: '通透灵魂边界合练（灵魂抗性+1，结界术+1）', weight: 24 },
    { id: 'ceUpgrade', label: '咒力极限压缩爆发（总量+1，效率+1）', weight: 25 },
    { id: 'techniqueNew', label: '战前顿悟一项新高级技巧！', weight: 25 }
  ];

  var SHINJUKU_MOTIVES = [
    { label: '为守护普通人阻止终极伤亡', weight: 40, buffNote: '信念坚定，关键时刻更易抵消暴击' },
    { label: '挑战巅峰证明自身生平极限', weight: 36, buffNote: '斗志高燃，黑闪共振概率小幅上升' },
    { label: '受高专重金/高层契约委任入场', weight: 24, buffNote: '战术稳健，后手保命判断更冷静' }
  ];

  var SHINJUKU_SUKUNA_ORDERS = [
    { id: 'beforeGojo', label: '五条战前·独自先挑战全盛十影宿傩', weight: 22, enemyTitle: '全盛·十影宿傩', baseAtk: 42, canGojoJoin: true },
    { id: 'withGojo', label: '与五条悟协同·双人共同迎战十影宿傩', weight: 24, enemyTitle: '十影宿傩（双人迎战）', baseAtk: 39, startWithGojo: true, canGojoJoin: true },
    { id: 'afterGojoTen', label: '五条战后·迎战残血负伤十影宿傩', weight: 30, enemyTitle: '残血·十影宿傩', baseAtk: 34, canGojoJoin: false },
    { id: 'trueForm', label: '鹿紫云后·迎战四手二口完全体宿傩', weight: 24, enemyTitle: '完全体·两面宿傩', baseAtk: 44, canGojoJoin: false }
  ];

  // 主角在新宿决战的出招转盘选项
  var PLAYER_BOSS_MOVES = [
    { id: 'innate', label: '生得术式全开重击', weight: 30, mult: 1.25 },
    { id: 'taijutsuCombo', label: '近身高速体术连打', weight: 24, mult: 1.0 },
    { id: 'toolSlash', label: '持咒具斩击突袭', weight: 18, mult: 1.15, requiresTool: true },
    { id: 'chantBurst', label: '完整咏唱超规格爆发', weight: 14, mult: 1.55, requiresSkill: '完整咏唱' },
    { id: 'blackFlashHit', label: '黑闪！0.000001秒共振', weight: 10, mult: 1.85, isBlackFlash: true },
    { id: 'domainClash', label: '展开生得领域强压阵线', weight: 8, mult: 2.0, requiresSkill: '领域展开' },
    { id: 'hundredBreak', label: '百兵演武（爆碎咒具猛攻）', weight: 6, mult: 2.25, requiresSkill: '百兵演武', breaksTool: true }
  ];

  // 宿傩出招转盘
  var SUKUNA_MOVES = [
    { id: 'dismantle', label: '术式顺转「解」斩击连发', weight: 30, dmg: 14 },
    { id: 'cleave', label: '零距离「捌」贴身必切', weight: 24, dmg: 18 },
    { id: 'agitoHit', label: '嵌合兽·颚吐强袭（带反转续航）', weight: 15, dmg: 13, requiresAgito: true },
    { id: 'mahoragaSword', label: '魔虚罗·退魔之剑顺劈', weight: 15, dmg: 16, requiresMahoraga: true },
    { id: 'fuga', label: '■「开」灶之烈焰极速贯穿', weight: 8, dmg: 24 },
    { id: 'malevolentShrine', label: '开放式领域·伏魔御厨子', weight: 5, dmg: 28 },
    { id: 'worldSlash', label: '扩大目标·断界「世界斩」', weight: 3, dmg: 34 }
  ];

  // 五条悟协同出招盘
  var GOJO_BOSS_MOVES = [
    { id: 'blue', label: '术式顺转·最大输出「苍」', weight: 32, power: 18 },
    { id: 'red', label: '术式反转·猛烈贯穿「赫」', weight: 26, power: 22 },
    { id: 'purple', label: '虚式「茈」·全境崩毁炮击', weight: 18, power: 34 },
    { id: 'uv', label: '领域展开·无量空处！', weight: 24, power: 24, isUnlimitedVoid: true }
  ];

  var GOJO_UV_EFFECTS = [
    { label: '短暂失神（宿傩下轮减少 1 次出招）', stun: 1, weight: 46 },
    { label: '脑叶过载（宿傩下轮减少 2 次出招！）', stun: 2, weight: 38 },
    { label: '接近彻底停摆（宿傩下轮减少 3 次出招！！）', stun: 3, weight: 16 }
  ];

  var CROSS_ERA_WHEEL = {
    title: '如何跨越时代延续至今',
    slices: [
      { id: 'sealSleep', label: '封存沉睡待后世苏醒', weight: 40, preserved: true, effect: '化身媒介或被封印，在现代重新苏醒！' },
      { id: 'curseObject', label: '化为特级咒物等待受肉', weight: 35, preserved: true, effect: '以特级咒物形式跨过百年寻找容器！' },
      { id: 'bloodline', label: '随血脉与术式秘传延续', weight: 25, preserved: false, effect: '术式与意志在后世传承苏醒！' }
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

  // 竞技场内置强敌预设卡（无网可随时切磋）
  var ARENA_CHAMPIONS = [
    {
      name: '最强 · 五条悟（模板）',
      identityName: '咒术师',
      officialGrade: '特级',
      technique: '无下限咒术',
      skills: ['反转术式', '领域展开', '黑闪', '简易领域'],
      tools: [],
      attrs: { ceTotal: 8, ceControl: 10, ceEfficiency: 12, taijutsu: 10, bodyResist: 9, soulResist: 8, barrier: 10, versatility: 10, iq: 9, talent: 11 }
    },
    {
      name: '诅咒之王 · 两面宿傩（模板）',
      identityName: '诅咒师',
      officialGrade: '特级',
      technique: '御厨子',
      skills: ['完整咏唱', '反转术式', '领域展开', '黑闪', '领域展延'],
      tools: [{ shape: '降魔杵', effect: '咒力传导增幅（输出+20%）', bonus: 6 }],
      attrs: { ceTotal: 12, ceControl: 10, ceEfficiency: 10, taijutsu: 10, bodyResist: 10, soulResist: 10, barrier: 11, versatility: 10, iq: 10, talent: 11 }
    },
    {
      name: '天与暴君 · 伏黑甚尔（模板）',
      identityName: '诅咒师',
      officialGrade: '特级',
      technique: '天与咒缚（零咒力）',
      skills: ['百兵演武'],
      tools: [
        { shape: '短匕', effect: '强制解除敌方术式特攻（天逆系）', bonus: 8 },
        { shape: '打刀', effect: '直切灵魂忽略防御（释魂系）', bonus: 8 }
      ],
      attrs: { ceTotal: 0, ceControl: 0, ceEfficiency: 0, taijutsu: 12, bodyResist: 11, soulResist: 9, barrier: 0, versatility: 8, iq: 8, talent: 7 }
    },
    {
      name: '特级后辈 · 乙骨忧太（模板）',
      identityName: '咒术师',
      officialGrade: '特级',
      technique: '模倣·术式拷贝',
      skills: ['反转术式', '领域展开', '黑闪'],
      tools: [{ shape: '打刀', effect: '咒力传导增幅（输出+20%）', bonus: 5 }],
      attrs: { ceTotal: 11, ceControl: 8, ceEfficiency: 7, taijutsu: 8, bodyResist: 8, soulResist: 8, barrier: 9, versatility: 10, iq: 8, talent: 10 }
    },
    {
      name: '雷神 · 鹿紫云一（模板）',
      identityName: '诅咒师',
      officialGrade: '特级',
      technique: '幻兽琥珀（电气属性）',
      skills: ['弥虚葛笼'],
      tools: [{ shape: '手杖', effect: '命中附带诅咒侵蚀与灼伤', bonus: 5 }],
      attrs: { ceTotal: 7, ceControl: 8, ceEfficiency: 8, taijutsu: 9, bodyResist: 8, soulResist: 7, barrier: 6, versatility: 7, iq: 7, talent: 8 }
    }
  ];

  global.JJK_OMEGA_DATA = {
    SLICE_COLORS: SLICE_COLORS,
    RANK_SCALE: RANK_SCALE,
    ATTRIBUTE_DEFS: ATTRIBUTE_DEFS,
    IDENTITIES: IDENTITIES,
    ERAS: ERAS,
    BIRTH_ERA_SLICES: BIRTH_ERA_SLICES,
    BIRTHPLACE_SLICES: BIRTHPLACE_SLICES,
    FACTION_WHEELS: FACTION_WHEELS,
    TECHNIQUES_ALL: TECHNIQUES_ALL,
    HIGH_TECHNIQUES: HIGH_TECHNIQUES,
    TOOL_SHAPES: TOOL_SHAPES,
    TOOL_EFFECTS: TOOL_EFFECTS,
    LOOKS_WHEEL: LOOKS_WHEEL,
    MORALITY_WHEEL: MORALITY_WHEEL,
    AGGRO_WHEEL: AGGRO_WHEEL,
    ATTRIBUTE_WHEELS: ATTRIBUTE_WHEELS,
    SHIKIGAMI_SUB_BRANCHES: SHIKIGAMI_SUB_BRANCHES,
    GRADE_WHEELS: GRADE_WHEELS,
    ERA_EVENTS: ERA_EVENTS,
    SHINJUKU_PREP_GROWTH: SHINJUKU_PREP_GROWTH,
    SHINJUKU_MOTIVES: SHINJUKU_MOTIVES,
    SHINJUKU_SUKUNA_ORDERS: SHINJUKU_SUKUNA_ORDERS,
    PLAYER_BOSS_MOVES: PLAYER_BOSS_MOVES,
    SUKUNA_MOVES: SUKUNA_MOVES,
    GOJO_BOSS_MOVES: GOJO_BOSS_MOVES,
    GOJO_UV_EFFECTS: GOJO_UV_EFFECTS,
    CROSS_ERA_WHEEL: CROSS_ERA_WHEEL,
    REPUTATION_BY_FACTION: REPUTATION_BY_FACTION,
    ARENA_CHAMPIONS: ARENA_CHAMPIONS
  };
})(window);
