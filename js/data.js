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
    { id: 'sorcerer', label: '咒术师', weight: 19, cost: 3, faction: 'good', desc: '正统入世的咒术行使者，行走于明暗交界' },
    { id: 'curseUser', label: '诅咒师', weight: 11, cost: 3, faction: 'evil', desc: '以咒术行私欲或暗杀之事的法外之人' },
    { id: 'civilian', label: '普通人', weight: 22, cost: 0, faction: 'neutral', desc: '看似平凡的常人，命运也可能卷入咒力漩涡' },
    { id: 'canon', label: '魂穿原著角色', weight: 16, cost: 4, faction: 'neutral', desc: '灵魂穿越附身或降临为《咒术回战》原著人物，改写命运线' },
    { id: 'higherUp', label: '咒术高层', weight: 9, cost: 2, faction: 'neutral', desc: '端坐屏风之后制定规矩与处刑令的掌权者' },
    { id: 'curse', label: '咒灵', weight: 8, cost: 4, faction: 'evil', desc: '人类负面情绪凝结诞生的诅咒具现' },
    { id: 'shikigami', label: '式神', weight: 8, cost: 3, faction: 'neutral', desc: '依附术式或御主显化的异界灵体战力' },
    { id: 'corpse', label: '咒骸', weight: 7, cost: 3, faction: 'good', desc: '灌注咒核、具备自我意识的人造傀儡存在' }
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
    { label: '！？磁场颠佬？！（逢敌必死斗）', level: 10, weight: 5 },
    { label: '200%（鹿紫云一/石流龙）', level: 9, weight: 9 },
    { label: '100%（强孤爱）', level: 8, weight: 13 },
    { label: '75%（主动求战）', level: 7, weight: 17 },
    { label: '50%（视局势而定）', level: 5, weight: 22 },
    { label: '25%（冷静克制）', level: 3, weight: 20 },
    { label: '0%（乙骨型温柔理智）', level: 1, weight: 14 }
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
          { label: '拦截特级诅咒师夏油杰本阵', weight: 40, action: 'fight', enemyName: '夏油杰（百鬼夜行）', enemyPower: 55 },
          { label: '阻击非洲术师·米格尔与黑绳阵线', weight: 24, action: 'fight', enemyName: '米格尔（黑绳）', enemyPower: 45 },
          { label: '清扫新宿街头百鬼咒灵大军', weight: 22, action: 'fight', enemyName: '百鬼夜行特级咒灵', enemyPower: 40 },
          { label: '抢救伤员并构筑大范围「帐」', weight: 14, action: 'safe', effectText: '稳妥护下后方，结界术 +1', statUp: 'barrier' }
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
        intro: '五条悟拼出0.2秒无量空处斩灭上千改造人，随后胀相、漏瑚、真人接连逼近！',
        choiceTitle: '涩谷夜晚你切入哪处战场',
        choices: [
          { label: '独自拖住灾害极炎·漏瑚', weight: 30, action: 'fight', enemyName: '漏瑚', enemyPower: 54 },
          { label: '在地铁厕所血战九相图大哥·胀相', weight: 34, action: 'fight', enemyName: '胀相', enemyPower: 44, defeatsKey: 'choso' },
          { label: '冲向涉谷站台死保七海建人！', weight: 24, action: 'fight', enemyName: '真人', enemyPower: 52, savesNanami: true },
          { label: '抢在狱门疆闭合前接应B5F散兵', weight: 12, action: 'safe', effectText: '及时稳住B5F战线避免大规模伤亡，咒力操纵 +1', statUp: 'ceControl' }
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
          { label: '正面硬撼仙台强敌·石流龙＆乌鹭', weight: 42, action: 'fight', enemyName: '仙台巅峰双强', enemyPower: 54 },
          { label: '挑战刚入场的特级·乙骨忧太', weight: 28, action: 'fight', enemyName: '乙骨忧太（死灭回游）', enemyPower: 60 },
          { label: '在岩手/樱岛迎战直哉暴走咒灵态', weight: 16, action: 'fight', enemyName: '咒灵化·禅院直哉', enemyPower: 50 },
          { label: '暗中收割泳者积分完善结界术', weight: 14, action: 'safe', effectText: '斩获足量总则分数，结界术 +1', statUp: 'barrier' }
        ]
      },
      {
        id: 'cg_tokyo',
        title: '死灭回游·东京结界与搞笑异变',
        intro: '日车宽见、秤金次与高羽史彦接连引爆规则对局，随后突破薨星宫防线',
        choiceTitle: '在东京与岩手结界的关键一战',
        choices: [
          { label: '对决天才律师·日车宽见', weight: 28, action: 'fight', enemyName: '日车宽见', enemyPower: 46 },
          { label: '迎战坐杀博徒·秤金次（不死狂热态）', weight: 30, action: 'fight', enemyName: '秤金次', enemyPower: 54 },
          { label: '误入高羽「超人」搞笑现实演出舞台', weight: 18, action: 'safe', effectText: '被迫配合演出脱力胜出，术式泛用 +1、灵魂抗性 +1', statUp: 'versatility' },
          { label: '随阵营突击薨星宫天元防线', weight: 24, action: 'fight', enemyName: '薨星宫守护防线', enemyPower: 52 }
        ]
      }
    ],
    future68: [
      {
        id: 'f68_opponent',
        title: '68年后·跨越半个世纪的传闻',
        intro: '宿傩落幕六十八年后，外星遗迹调和者与远古残影在次世代舞台交汇',
        choiceTitle: '68年后·你的战斗对手',
        choices: [
          { label: '友好切磋·挑战星外来客达布拉', weight: 22, action: 'fight', enemyName: '达布拉', enemyPower: 58, defeatsKey: 'dabura', canDie: false },
          { label: '生死决斗·八握剑异戒神将魔虚罗', weight: 18, action: 'fight', enemyName: '完全体魔虚罗', enemyPower: 66, canDie: true },
          { label: '切磋高寿传说·68虎杖', weight: 18, action: 'fight', enemyName: '68虎杖', enemyPower: 56, canDie: false },
          { label: '对峙「里梅附身真剑」与混沌调和·马鲁', weight: 14, action: 'fight', enemyName: '附身真剑＆马鲁', enemyPower: 60, canDie: false },
          { label: '降伏卷土重来·灵魂形态真人', weight: 14, action: 'fight', enemyName: '灵魂形态·真人', enemyPower: 54, canDie: true },
          { label: '隐居传道静观后世（平顺养老）', weight: 14, action: 'safe', effectText: '德高望重安度余生，智力 +1', statUp: 'iq' }
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

  // ==================== 魂穿原著角色全池（22位核心人物） ====================
  var CANON_CHARACTERS = [
    {
      id: 'gojo', name: '五条悟', title: '现代最强 · 六眼无下限', weight: 4, cost: 6,
      faction: 'good', eraId: 'hiddenInv', techniqueId: 'limitless', technique: '无下限咒术',
      officialGrade: '特级', gradeBonus: 15, looks: 10, morality: 2, aggro: 9,
      skills: ['反转术式', '领域展开', '黑闪', '简易领域', '落之雪（落花之情）'],
      tools: [],
      attrs: { ceTotal: 8, ceControl: 10, ceEfficiency: 12, taijutsu: 10, bodyResist: 9, soulResist: 8, barrier: 10, versatility: 10, iq: 9, talent: 11 },
      canonNote: '天生六眼与无下限并立，唯需戒备狱门疆与世界斩'
    },
    {
      id: 'sukuna', name: '两面宿傩', title: '诅咒之王 · 堕天御厨子', weight: 3, cost: 6,
      faction: 'evil', eraId: 'heian', techniqueId: 'shrine', technique: '御厨子',
      officialGrade: '特级', gradeBonus: 15, looks: 6, morality: -5, aggro: 10,
      skills: ['完整咏唱', '反转术式', '领域展开', '黑闪', '领域展延', '弥虚葛笼'],
      tools: [{ shape: '降魔杵', effect: '咒力传导增幅（输出+20%）', bonus: 6 }],
      attrs: { ceTotal: 12, ceControl: 10, ceEfficiency: 10, taijutsu: 10, bodyResist: 10, soulResist: 10, barrier: 11, versatility: 10, iq: 10, talent: 11 },
      canonNote: '史上最强术师与开放式领域宗师，一切生灵俯首'
    },
    {
      id: 'itadori', name: '虎杖悠仁', title: '黑闪宠儿 · 宿傩受肉体', weight: 7, cost: 2,
      faction: 'good', eraId: 'canonStart', techniqueId: 'bloodManip', technique: '赤血操术 / 宿傩残影（解）',
      officialGrade: '一级', gradeBonus: 8, looks: 7, morality: 4, aggro: 5,
      skills: ['黑闪', '反转术式', '简易领域'],
      tools: [],
      attrs: { ceTotal: 6, ceControl: 7, ceEfficiency: 7, taijutsu: 10, bodyResist: 10, soulResist: 10, barrier: 5, versatility: 6, iq: 6, talent: 9 },
      canonNote: '超常肉体耐受与近乎百发百中的黑闪直觉，专克灵魂防线'
    },
    {
      id: 'megumi', name: '伏黑惠', title: '禅院血脉 · 十种影法术师', weight: 6, cost: 3,
      faction: 'good', eraId: 'canonStart', techniqueId: 'tenShadows', technique: '十种影法术',
      officialGrade: '一级', gradeBonus: 8, looks: 8, morality: 2, aggro: 4,
      skills: ['领域展开', '简易领域'],
      tools: [{ shape: '打刀', effect: '纯白板高硬度物理咒具', bonus: 3 }],
      attrs: { ceTotal: 7, ceControl: 7, ceEfficiency: 6, taijutsu: 7, bodyResist: 6, soulResist: 7, barrier: 7, versatility: 9, iq: 8, talent: 9 },
      canonNote: '坐拥魔虚罗潜力与嵌合暗翳庭，关键在于守住灵魂不被宿傩夺舍'
    },
    {
      id: 'yuta', name: '乙骨忧太', title: '纯爱特级 · 诅咒女王之主', weight: 5, cost: 5,
      faction: 'good', eraId: 'vol0', techniqueId: 'copy', technique: '模倣·术式拷贝',
      officialGrade: '特级', gradeBonus: 15, looks: 7, morality: 4, aggro: 5,
      skills: ['反转术式', '领域展开', '黑闪'],
      tools: [{ shape: '打刀', effect: '咒力传导增幅（输出+20%）', bonus: 5 }],
      attrs: { ceTotal: 11, ceControl: 8, ceEfficiency: 7, taijutsu: 8, bodyResist: 8, soulResist: 8, barrier: 9, versatility: 10, iq: 8, talent: 10 },
      canonNote: '底蕴深不见底的第二位现代特级，真赝相爱拥有无限可能'
    },
    {
      id: 'geto', name: '夏油杰', title: '咒灵操使 · 极之番漩涡', weight: 5, cost: 4,
      faction: 'evil', eraId: 'hiddenInv', techniqueId: 'curseManip', technique: '咒灵操术',
      officialGrade: '特级', gradeBonus: 15, looks: 8, morality: -2, aggro: 7,
      skills: ['完整咏唱'],
      tools: [{ shape: '三节棍', effect: '沉重刚烈叠加破坏力（游云系）', bonus: 7 }],
      attrs: { ceTotal: 8, ceControl: 8, ceEfficiency: 7, taijutsu: 8, bodyResist: 7, soulResist: 7, barrier: 7, versatility: 9, iq: 9, talent: 8 },
      canonNote: '苦夏的歧途站在眼前，若带着后世记忆或许能逆转分道扬镳'
    },
    {
      id: 'toji', name: '伏黑甚尔', title: '天与暴君 · 术师杀手', weight: 4, cost: 5,
      faction: 'neutral', eraId: 'hiddenInv', techniqueId: 'heavenZero', technique: '天与咒缚（零咒力）',
      officialGrade: '特级', gradeBonus: 14, looks: 8, morality: -2, aggro: 6,
      skills: ['百兵演武'],
      tools: [
        { shape: '短匕', effect: '强制解除敌方术式特攻（天逆系）', bonus: 8 },
        { shape: '打刀', effect: '直切灵魂忽略防御（释魂系）', bonus: 8 }
      ],
      attrs: { ceTotal: 0, ceControl: 0, ceEfficiency: 0, taijutsu: 12, bodyResist: 11, soulResist: 9, barrier: 0, versatility: 8, iq: 8, talent: 7 },
      canonNote: '彻底挣脱因果与领域必中的零咒力怪胎，全靠肉体与特级咒具横推'
    },
    {
      id: 'nanami', name: '七海建人', title: '七三战神 · 加班社畜一级', weight: 7, cost: 2,
      faction: 'good', eraId: 'canonStart', techniqueId: 'ratio', technique: '十划咒法',
      officialGrade: '一级', gradeBonus: 8, looks: 7, morality: 3, aggro: 3,
      skills: ['黑闪'],
      tools: [{ shape: '短匕', effect: '咒力传导增幅（输出+20%）', bonus: 4 }],
      attrs: { ceTotal: 6, ceControl: 8, ceEfficiency: 7, taijutsu: 8, bodyResist: 8, soulResist: 7, barrier: 5, versatility: 6, iq: 9, talent: 6 },
      canonNote: '最可靠的成年人护盾，绝不让涩谷站台成为遗憾终点'
    },
    {
      id: 'maki', name: '禅院真希', title: '鬼人觉醒 · 天与全盛体', weight: 6, cost: 4,
      faction: 'good', eraId: 'canonStart', techniqueId: 'heavenZero', technique: '天与咒缚（零咒力）',
      officialGrade: '特级', gradeBonus: 14, looks: 8, morality: 2, aggro: 5,
      skills: ['百兵演武'],
      tools: [{ shape: '大太刀', effect: '直切灵魂忽略防御（释魂系）', bonus: 8 }],
      attrs: { ceTotal: 0, ceControl: 0, ceEfficiency: 0, taijutsu: 11, bodyResist: 11, soulResist: 9, barrier: 0, versatility: 8, iq: 7, talent: 8 },
      canonNote: '比肩甚尔的鬼神体魄，一刀释魂令御宅术师战栗'
    },
    {
      id: 'nobara', name: '钉崎野蔷薇', title: '共鸣直击 · 狂气高专少女', weight: 6, cost: 1,
      faction: 'good', eraId: 'canonStart', techniqueId: 'strawDoll', technique: '刍灵咒法',
      officialGrade: '三级', gradeBonus: 3, looks: 7, morality: 3, aggro: 5,
      skills: ['黑闪'],
      tools: [{ shape: '重锤', effect: '命中附带诅咒侵蚀与灼伤', bonus: 4 }],
      attrs: { ceTotal: 5, ceControl: 7, ceEfficiency: 6, taijutsu: 5, bodyResist: 5, soulResist: 8, barrier: 4, versatility: 7, iq: 7, talent: 7 },
      canonNote: '灵魂共鸣在最终战能直接跨过千里锁死宿傩最后一根手指'
    },
    {
      id: 'todo', name: '东堂葵', title: '五十万智力 · 不义游戏挚友', weight: 6, cost: 2,
      faction: 'good', eraId: 'canonStart', techniqueId: 'boogieWoogie', technique: '不义游戏',
      officialGrade: '一级', gradeBonus: 8, looks: 6, morality: 2, aggro: 4,
      skills: ['黑闪', '简易领域'],
      tools: [{ shape: '手摇铁片（Vibraslap型）', effect: '可抵消敌方招式减伤护盾', bonus: 5 }],
      attrs: { ceTotal: 7, ceControl: 8, ceEfficiency: 7, taijutsu: 9, bodyResist: 8, soulResist: 7, barrier: 6, versatility: 8, iq: 10, talent: 8 },
      canonNote: '只要有搭档便能把任何绝境化为狂风骤雨的双打舞台'
    },
    {
      id: 'hakari', name: '秤金次', title: '停学赌徒 · 四分十一秒不死', weight: 5, cost: 4,
      faction: 'good', eraId: 'culling', techniqueId: 'gamble', technique: '坐杀博徒',
      officialGrade: '一级', gradeBonus: 9, looks: 7, morality: 1, aggro: 5,
      skills: ['领域展开', '反转术式'],
      tools: [],
      attrs: { ceTotal: 8, ceControl: 7, ceEfficiency: 9, taijutsu: 9, bodyResist: 9, soulResist: 7, barrier: 8, versatility: 7, iq: 7, talent: 8 },
      canonNote: '热切豪运下溢出全身的全自动反转术式，拖战能力天下无双'
    },
    {
      id: 'kashimo', name: '鹿紫云一', title: '江户雷神 · 幻兽琥珀', weight: 4, cost: 4,
      faction: 'neutral', eraId: 'edo400', techniqueId: 'mythBeast', technique: '幻兽琥珀（电气属性）',
      officialGrade: '特级', gradeBonus: 13, looks: 7, morality: 0, aggro: 8,
      skills: ['弥虚葛笼'],
      tools: [{ shape: '手杖', effect: '命中附带诅咒侵蚀与灼伤', bonus: 5 }],
      attrs: { ceTotal: 7, ceControl: 8, ceEfficiency: 8, taijutsu: 9, bodyResist: 8, soulResist: 7, barrier: 6, versatility: 7, iq: 7, talent: 8 },
      canonNote: '四百年最纯粹的求道者，带电咒力与必定命中之雷令万物失色'
    },
    {
      id: 'choso', name: '胀相', title: '九相图长兄 · 穿血赤血操', weight: 6, cost: 2,
      faction: 'good', eraId: 'canonStart', techniqueId: 'bloodManip', technique: '赤血操术',
      officialGrade: '准特级', gradeBonus: 11, looks: 7, morality: 2, aggro: 4,
      skills: ['反转术式', '简易领域'],
      tools: [],
      attrs: { ceTotal: 7, ceControl: 8, ceEfficiency: 8, taijutsu: 8, bodyResist: 8, soulResist: 7, barrier: 5, versatility: 8, iq: 7, talent: 7 },
      canonNote: '受肉特殊体质使他能够源源不断用咒力造血，只为守护弟弟们而战'
    },
    {
      id: 'higuruma', name: '日车宽见', title: '十二天修成领域 · 鬼才律师', weight: 5, cost: 4,
      faction: 'good', eraId: 'culling', techniqueId: 'higurumaLaw', technique: '诛伏赐死（审判领域）',
      officialGrade: '一级', gradeBonus: 10, looks: 8, morality: 2, aggro: 4,
      skills: ['领域展开', '领域展延', '反转术式'],
      tools: [{ shape: '重锤', effect: '可抵消敌方招式减伤护盾', bonus: 6 }],
      attrs: { ceTotal: 6, ceControl: 8, ceEfficiency: 8, taijutsu: 6, bodyResist: 6, soulResist: 7, barrier: 9, versatility: 7, iq: 10, talent: 11 },
      canonNote: '天赋直逼五条悟的超级天才，战场现学反转术式与领域展延'
    },
    {
      id: 'yuki', name: '九十九由基', title: '星之怒 · 游历四海的特级', weight: 4, cost: 5,
      faction: 'good', eraId: 'hiddenInv', techniqueId: 'starRage', technique: '星之怒（质量赋予）',
      officialGrade: '特级', gradeBonus: 15, looks: 9, morality: 2, aggro: 6,
      skills: ['反转术式', '领域展开', '简易领域'],
      tools: [{ shape: '凰轮式神环', effect: '沉重刚烈叠加破坏力（游云系）', bonus: 6 }],
      attrs: { ceTotal: 8, ceControl: 8, ceEfficiency: 8, taijutsu: 10, bodyResist: 8, soulResist: 9, barrier: 8, versatility: 8, iq: 9, talent: 9 },
      canonNote: '掌握灵魂之书且一拳可轰碎特级概念的存在，若能改写薨星宫死局不可估量'
    },
    {
      id: 'kenjaku', name: '羂索', title: '千年棋手 · 万千结界宗师', weight: 3, cost: 5,
      faction: 'evil', eraId: 'heian', techniqueId: 'curseManip', technique: '咒灵操术 / 百年换脑',
      officialGrade: '特级', gradeBonus: 15, looks: 7, morality: -5, aggro: 9,
      skills: ['完整咏唱', '反转术式', '领域展开', '领域展延'],
      tools: [],
      attrs: { ceTotal: 9, ceControl: 9, ceEfficiency: 9, taijutsu: 8, bodyResist: 7, soulResist: 9, barrier: 12, versatility: 11, iq: 11, talent: 9 },
      canonNote: '除天元外结界术造诣冠绝古今的百年幕后黑手，深谙无数冷门术式'
    },
    {
      id: 'mahito', name: '真人', title: '镜面人类恶意 · 无为转变', weight: 4, cost: 4,
      faction: 'evil', eraId: 'canonStart', techniqueId: 'idleTransfig', technique: '无为转变',
      officialGrade: '特级', gradeBonus: 14, looks: 7, morality: -5, aggro: 8,
      skills: ['领域展开', '黑闪'],
      tools: [],
      attrs: { ceTotal: 8, ceControl: 8, ceEfficiency: 8, taijutsu: 7, bodyResist: 8, soulResist: 11, barrier: 8, versatility: 10, iq: 8, talent: 10 },
      canonNote: '不损伤灵魂便几乎不灭的成长型噩梦，灵魂抗性与塑性站在咒灵顶点'
    },
    {
      id: 'jogo', name: '漏瑚', title: '大地畏惧 · 陨石灾炎', weight: 4, cost: 3,
      faction: 'evil', eraId: 'canonStart', techniqueId: 'disasterFlames', technique: '大地灼炎',
      officialGrade: '特级', gradeBonus: 13, looks: 2, morality: -4, aggro: 7,
      skills: ['领域展开', '领域展延'],
      tools: [],
      attrs: { ceTotal: 9, ceControl: 7, ceEfficiency: 7, taijutsu: 7, bodyResist: 6, soulResist: 6, barrier: 8, versatility: 8, iq: 7, talent: 8 },
      canonNote: '纸面战力媲美八九指宿傩的自然灾厄，只是时运不佳专挑最强碰撞'
    },
    {
      id: 'uraume', name: '里梅', title: '千年冰星 · 宿傩忠臣兼厨师', weight: 4, cost: 3,
      faction: 'evil', eraId: 'heian', techniqueId: 'iceForm', technique: '冰凝咒法',
      officialGrade: '准特级', gradeBonus: 12, looks: 7, morality: -3, aggro: 6,
      skills: ['反转术式', '弥虚葛笼'],
      tools: [],
      attrs: { ceTotal: 7, ceControl: 8, ceEfficiency: 8, taijutsu: 7, bodyResist: 7, soulResist: 7, barrier: 7, versatility: 8, iq: 8, talent: 8 },
      canonNote: '一招大范围霜凪即可冰封群雄千年老怪，忠心贯穿平安时代至68年后'
    },
    {
      id: 'yorozu', name: '万', title: '疯狂真爱 · 构筑真球虫铠', weight: 4, cost: 4,
      faction: 'neutral', eraId: 'heian', techniqueId: 'construct', technique: '构筑术式',
      officialGrade: '特级', gradeBonus: 13, looks: 8, morality: -1, aggro: 6,
      skills: ['领域展开', '弥虚葛笼'],
      tools: [{ shape: '液态金属（构筑神武解模板）', effect: '咒力传导增幅（输出+20%）', bonus: 6 }],
      attrs: { ceTotal: 8, ceControl: 8, ceEfficiency: 7, taijutsu: 8, bodyResist: 7, soulResist: 7, barrier: 8, versatility: 9, iq: 7, talent: 8 },
      canonNote: '开发出昆虫铠与零接触压力无限大「真球」的天才，只败于魔虚罗相性'
    },
    {
      id: 'takaba', name: '高羽史彦', title: '半吊子搞笑艺人 · 超人术式', weight: 4, cost: 4,
      faction: 'good', eraId: 'culling', techniqueId: 'comedian', technique: '超人（喜剧人现实改写）',
      officialGrade: '一级', gradeBonus: 11, looks: 6, morality: 4, aggro: 2,
      skills: [],
      tools: [],
      attrs: { ceTotal: 6, ceControl: 4, ceEfficiency: 6, taijutsu: 5, bodyResist: 8, soulResist: 8, barrier: 3, versatility: 12, iq: 5, talent: 8 },
      canonNote: '只要我觉得好笑就能压制甚至拖垮千年羂索的因果律外挂，唯一死穴是不杀人'
    }
  ];

  // 魂穿入场时间节点盘
  var CANON_TIMEPOINTS = [
    { id: 'native', label: '原主本命登场时期（忠于设定）', weight: 38, note: '严格降临在原著该角色正式活跃的时代节点' },
    { id: 'hiddenInv', label: '怀玉·玉折时期提前苏醒', eraId: 'hiddenInv', weight: 18, note: '提早截停伏黑甚尔刺杀与夏油苦夏的分水岭' },
    { id: 'vol0', label: '0卷·百鬼夜行前夕切入', eraId: 'vol0', weight: 14, note: '恰逢夏油杰宣战，正面改变百鬼夜行战局' },
    { id: 'canonStart', label: '虎杖吞指开篇夜苏醒', eraId: 'canonStart', weight: 18, note: '与宿傩复活同步醒来，手握完整时间窗部署' },
    { id: 'shibuya', label: '空降10月31日涩谷事变中心', eraId: 'shibuya', weight: 12, note: '直面狱门疆封印与群魔乱舞，一战定乾坤' }
  ];

  // 魂穿灵魂契合度盘
  var CANON_SYNC_SLICES = [
    { id: 'perfect', label: '100% 灵魂共振超越原主（核心三维+1，黑闪率+8%）', weight: 18, delta: 1, mode: 'perfect' },
    { id: 'high', label: '85% 高度契合如臂使指（主力两维+1，稳定驾驭术式）', weight: 32, delta: 1, mode: 'high' },
    { id: 'normal', label: '65% 顺利融合水到渠成（完全继承原主巅峰面板）', weight: 34, delta: 0, mode: 'normal' },
    { id: 'reject', label: '40% 灵魂排异略微生疏（核心维-1，需战后慢慢磨合）', weight: 16, delta: -1, mode: 'reject' }
  ];

  // 魂穿剧本先知记忆盘
  var CANON_MEMORY_SLICES = [
    { id: 'fullScript', label: '全知全卷剧本先知（智力+2，避险/识破伏笔概率大增）', weight: 20, iqBoost: 2, scriptLevel: 2 },
    { id: 'keyNodes', label: '牢记关键大事件与弱点（智力+1，先知提前防备伏击）', weight: 38, iqBoost: 1, scriptLevel: 1 },
    { id: 'fragment', label: '碎片化模煳记忆（仅存直觉印象，全靠个人临场操作）', weight: 28, iqBoost: 0, scriptLevel: 0 },
    { id: 'blind', label: '失去外挂记忆纯土著融入（彻底活出原主本心人生）', weight: 14, iqBoost: 0, scriptLevel: -1 }
  ];

  // 魂穿关键改命抉择盘
  var CANON_DIVERGENCE_SLICES = [
    { id: 'rewriteFate', label: '彻底改写原著意难平便当线（全书关键救援触发率↑）', weight: 32, tag: '改命破局', effect: 'save_all' },
    { id: 'breakCeiling', label: '趁先知期狂卷悟道破格（天赋+1，额外抽取1项高级技巧）', weight: 28, tag: '超越极限', effect: 'extra_tech' },
    { id: 'secretAlliance', label: '暗中与跨阵营强者结盟（决战额外获得强力协防增益）', weight: 24, tag: '合纵连横', effect: 'ally_shield' },
    { id: 'lowKey', label: '隐忍藏拙不轻动大势（体术/结界+1，保留隐藏杀手锏）', weight: 16, tag: '深藏不露', effect: 'stat_hidden' }
  ];

  // 束缚契约转盘（大战前立誓机制）
  var BINDING_VOWS = [
    { id: 'vow_reveal', label: '「公开术式」束缚：坦白术式情报换取全输出 +18%', weight: 32, atkMult: 1.18, dangerDelta: 0, desc: '正统稳赚的束缚策略，向对手披露机制以推高咒力释放上限' },
    { id: 'vow_limit', label: '「限定时刻」束缚：平时压制换决战双维临时 +1（输出+12%）', weight: 28, atkMult: 1.12, statBoost: 1, dangerDelta: 0, desc: '类似七海时间外加班的限制型束缚，决战全面增幅' },
    { id: 'vow_life', label: '「死地舍命」束缚：输出飙升 +36%，重伤与战死惩罚加深', weight: 16, atkMult: 1.36, dangerDelta: 12, desc: '赌上性命或术式废止的高危死契，弱者逆伐强敌的最后底牌' },
    { id: 'vow_none', label: '拒绝一切束缚：保留自由临场空间，稳扎稳打迎战', weight: 24, atkMult: 1.0, dangerDelta: 0, desc: '不以自由作为筹码，依靠自身纯粹修为应对万变战局' }
  ];

  // 非原著身份的细分拓展盘（补全咒骸/高层/普通人/咒灵的特有流程）
  var IDENTITY_EXTRA_WHEELS = {
    corpse_cores: {
      title: '咒骸 · 咒核结构形态',
      slices: [
        { label: '完全自律三核互辅体（灵魂抗性+1、身体抗性+1）', weight: 30, up1: 'soulResist', up2: 'bodyResist', note: '如熊猫般的复核共鸣，切核亦不致立刻覆灭' },
        { label: '战斗特化高输出单核体（体术+1、咒力效率+1）', weight: 42, up1: 'taijutsu', up2: 'ceEfficiency', note: '舍弃冗余核数，集中供能打造钢铁肉搏机器' },
        { label: '常规测试型自律咒骸（稳妥积累，常规生长）', weight: 28, note: '按普通觉醒咒骸路径踏入现代风波' }
      ]
    },
    higherUp_scheme: {
      title: '咒术高层 · 实际门第与权柄',
      slices: [
        { label: '御三家首席元老握死刑令（智力+2，声望基数+15）', weight: 34, up1: 'iq', iqDouble: true, repBonus: 15, note: '一言即可定夺特级咒术师通缉与封印决策' },
        { label: '隐秘忌库与结界监理长官（结界术+1、术式泛用+1）', weight: 38, up1: 'barrier', up2: 'versatility', repBonus: 8, note: '暗中掌握特级咒具库藏与薨星宫往来通道' },
        { label: '高专改革暗线协调长老（柔和积淀，少结死仇）', weight: 28, repBonus: 10, note: '尝试在老派规则与新生代间保留一丝缓冲' }
      ]
    },
    civilian_awakening: {
      title: '普通人 · 异变潜力与觉醒机缘',
      slices: [
        { label: '死灭回游前夕突遭术式脑改觉醒！（直抽1门生得术式）', weight: 16, awakenTech: true, note: '命运巨轮猛转，平凡市民瞬间踏入术师厮杀榜！' },
        { label: '天生极限硬核凡胎（体术+2、身体抗性+1）', weight: 22, up1: 'taijutsu', up2: 'bodyResist', note: '无术式却凭借非人健身与危机直觉死里逃生' },
        { label: '微弱灵感转入高专辅助监督（咒力+1、结界+1）', weight: 28, up1: 'ceTotal', up2: 'barrier', note: '学会放「帐」并成为前线术师最信赖的调度后盾' },
        { label: '彻底远离漩涡安稳过一生（稳妥低调生存率↑）', weight: 34, note: '在东京霓虹灯下平安度过所有风暴夜晚' }
      ]
    },
    curse_origin: {
      title: '咒灵 · 诞生畏惧与本体性质',
      slices: [
        { label: '山川烈焰等自然畏惧诞生的特级灾厄（咒力总量+1、泛用+1）', weight: 32, up1: 'ceTotal', up2: 'versatility', note: '天灾具现，咒力澎湃如泉涌' },
        { label: '人类相互憎恶孕育的黑泥恶意（灵魂抗性+1、操纵+1）', weight: 36, up1: 'soulResist', up2: 'ceControl', note: '精擅灵魂干涉与心理洞悉，极难被常规攻击彻底消灭' },
        { label: '都市怪谈假想怨灵（体术+1，稳健成长）', weight: 32, up1: 'taijutsu', note: '凭借恐怖传说快速聚合畸形战力' }
      ]
    }
  };

  // ==================== 成就词条图鉴目录 ====================
  var ACHIEVEMENT_CATALOG = [
    { id: 't_omega', title: '千古唯一 · 超越诅咒之王', category: '巅峰成就', tier: 'ssr', points: 40, desc: '在新宿决战中亲手击败两面宿傩本尊，改写终末之战' },
    { id: 't_six_eyes', title: '最强共鸣 · 并肩六眼', category: '巅峰成就', tier: 'ssr', points: 25, desc: '在新宿双打局协助五条悟共抗强敌或独挑大梁' },
    { id: 't_save_gojo', title: '逆转封印 · 守护最强', category: '改命奇迹', tier: 'sr', points: 25, desc: '涩谷事变打破4%极低概率，当场阻断狱门疆闭合' },
    { id: 't_save_nanami', title: '涩谷之救赎 · 护住七海建人', category: '改命奇迹', tier: 'sr', points: 20, desc: '涩谷站台血战真人并硬生生救下七海前辈' },
    { id: 't_canon_soul', title: '魂穿入局 · 逆天改命', category: '魂穿专属', tier: 'sr', points: 18, desc: '以「魂穿原著角色」身份完成一次完整命运线并活到结局' },
    { id: 't_canon_perfect', title: '百分百契合 · 超越原主', category: '魂穿专属', tier: 'ssr', points: 24, desc: '魂穿抽取到100%灵魂共鸣并让战力凌驾原著设定之上' },
    { id: 't_canon_prophet', title: '手握剧本的全知棋手', category: '魂穿专属', tier: 'r', points: 15, desc: '带着完整/关键剧本记忆步步为营布局天下' },
    { id: 't_vow_breaker', title: '舍命死契的逆伐狂徒', category: '束缚系统', tier: 'sr', points: 18, desc: '大战前立下「死地舍命」束缚却依旧活着站到终点' },
    { id: 't_binding_vow', title: '善用束缚的算计宗师', category: '束缚系统', tier: 'r', points: 10, desc: '通过公开术式或限时加班等束缚放大战力收获胜果' },
    { id: 't_maho', title: '调伏八握剑异戒神将魔虚罗', category: '特殊奇遇', tier: 'ssr', points: 35, desc: '凭借十种影法术或硬实力亲手突破魔虚罗适应轮盘' },
    { id: 't_awakened_civilian', title: '从凡夫俗子到术式觉醒', category: '逆袭剧本', tier: 'sr', points: 18, desc: '以普通人开局却在时代剧变中意外觉醒生得术式' },
    { id: 't_heaven', title: '挣脱因果的天与零咒力之巅', category: '战斗流派', tier: 'sr', points: 20, desc: '以零咒力天与咒缚立于战力最前线' },
    { id: 't_domain', title: '生得领域掌控者', category: '高级技巧', tier: 'r', points: 12, desc: '习得高专最顶尖的领域展开技巧' },
    { id: 't_double_kill', title: '斩灭强敌战神', category: '战绩评价', tier: 'r', points: 15, desc: '生涯正面斩杀过5位以上知名强者' },
    { id: 't_multi_era', title: '跨越千年的时代见证者', category: '历史长河', tier: 'r', points: 15, desc: '活过并深度参与4个以上核心历史时代' },
    { id: 't_legend_68', title: '68年后依旧健在的传奇', category: '历史长河', tier: 'sr', points: 20, desc: '一路见证到宿傩落幕六十八年后的全新时代' },
    { id: 't_special_grade', title: '评定为「特级」的存在', category: '实力认证', tier: 'r', points: 16, desc: '实力被官方评定为规格之外的特级存在' },
    { id: 't_immortal_star', title: '四高专全明星人气王', category: '人物魅力', tier: 'r', points: 10, desc: '兼具顶尖颜值、高道德感与极高阵营声望' },
    { id: 't_toji_slayer', title: '击破伏黑甚尔', category: '击败强敌', tier: 'r', points: 15, desc: '正面击溃天与暴君伏黑甚尔' },
    { id: 't_choso_slayer', title: '击破九相图·胀相', category: '击败强敌', tier: 'r', points: 12, desc: '涩谷事变正面迎战并胜过赤血操使胀相' },
    { id: 't_dabura_clear', title: '68年后·切磋压制达布拉', category: '击败强敌', tier: 'r', points: 14, desc: '在六十八年后的世界与神秘星外来客达布拉分出高下' },
    { id: 't_true_love', title: '天命伴侣相守一生', category: '情感线', tier: 'r', points: 10, desc: '在乱世咒术界收获值得托付生死的伴侣羁绊' },
    { id: 't_civilian_peace', title: '平平安安是福（普通人安稳度日）', category: '佛系结局', tier: 'n', points: 10, desc: '远离绝大部分致命厮杀平顺走完一世' },
    { id: 't_shibuya_fall', title: '陨落于10月31日的无名英魂', category: '悲壮遗憾', tier: 'n', points: -6, desc: '未能走出百鬼横行与群魔围攻的涩谷地狱夜' },
    { id: 't_sukuna_slain', title: '倒在宿傩「解」与「世界斩」下', category: '悲壮遗憾', tier: 'n', points: -8, desc: '虽挺进新宿终局却还是饮恨在诅咒之王刀锋下' },
    { id: 't_glass_cannon', title: '魂穿水土不服 · 逆境陨落', category: '遗憾结局', tier: 'n', points: -5, desc: '灵魂排异未稳便仓促赴死，空留外挂面板' },
    { id: 't_overcome', title: '以下克上', category: '战绩评价', tier: 'sr', points: 5, desc: '正面击败战力明显强于自己的劲敌' },
    { id: 't_fossil', title: '活化石 · 古今跨代见证', category: '历史长河', tier: 'sr', points: 8, desc: '生于平安或江户时期却跨越时代活至宿傩落后世代' },
    { id: 't_warlord', title: '乱世枭雄', category: '阵营之路', tier: 'sr', points: 6, desc: '坚守暗面诅咒阵营立场连战四胜并站到终局' },
    { id: 't_first_win', title: '旗开得胜', category: '战绩评价', tier: 'n', points: 1, desc: '在漫长人生中斩获属于自己的首场胜利' },
    { id: 't_dual_ex', title: '双绝以上', category: '实力认证', tier: 'r', points: 5, desc: '最终十维面板至少两项属性登临 EX 规格外' },
    { id: 't_sealed_future', title: '封存到未来', category: '历史长河', tier: 'r', points: 5, desc: '经封印沉睡或肉体受肉契约苏醒于未来现代' },
    { id: 't_adamant', title: '金刚不坏', category: '实力认证', tier: 'r', points: 4, desc: '身体抗性达到 EX 境界稳若磐石' },
    { id: 't_drip_less', title: '滴水不漏', category: '实力认证', tier: 'r', points: 4, desc: '咒力效率达到 EX 级别比肩六眼微操' },
    { id: 't_corpse_master', title: '百鬼造骸大匠', category: '傀儡咒术', tier: 'r', points: 10, desc: '习得傀儡咒术学并在实战前完成自律咒骸编队' },
    { id: 't_neg_no_bf', title: '黑闪绝缘体', category: '搞笑词条', tier: 'n', points: -3, desc: '打满五场以上高强度死斗却未打出一记黑闪' },
    { id: 't_neg_extreme', title: '极端加点', category: '搞笑词条', tier: 'n', points: -5, desc: '十维属性最高与最低跨度达到 8 个阶级以上' },
    { id: 't_neg_overtime', title: '最后的加班', category: '悲壮遗憾', tier: 'n', points: -3, desc: '目睹涩谷七海建人告别一线壮烈牺牲' }
  ];

  // 原版精确 9 大咒具特效体系 + 新增傀儡咒术学
  TOOL_EFFECTS = [
    { id: 'storage_ce', label: '储存咒力（里香戒指）', tier: '特级', bonus: 7, extraCe: true, weight: 10 },
    { id: 'dmg_amp', label: '伤害增幅（游云）', tier: '特级', bonus: 8, damageMult: 1.25, weight: 11 },
    { id: 'flight', label: '飞天（飞天）', tier: '一级', bonus: 5, canCancelMove: true, weight: 11 },
    { id: 'extend', label: '无限延长（万里锁）', tier: '一级', bonus: 5, weight: 12 },
    { id: 'nullify', label: '无效化术式（黑绳/天逆鉾）', tier: '特级', bonus: 9, canCancelMove: true, nullify: true, weight: 9 },
    { id: 'dmg_store', label: '伤害储存（龙骨）', tier: '一级', bonus: 6, weight: 11 },
    { id: 'cast_tech', label: '释放咒术（神武解）', tier: '特级', bonus: 8, thunderCast: true, weight: 10 },
    { id: 'unbreakable', label: '无坚不摧（绝对刚体绝对锋利）', tier: '特级', bonus: 9, indestructible: true, weight: 10 },
    { id: 'plain_weapon', label: '纯武器（精钢白板）', tier: '二级', bonus: 3, weight: 16 }
  ];

  if (!TECHNIQUES_ALL.some(function (t) { return t.id === 'puppetMaster'; })) {
    TECHNIQUES_ALL.push({ id: 'puppetMaster', label: '傀儡咒术学（咒骸制作）', weight: 6, power: 14, cost: 4, desc: '可自主研发核心自律咒骸并率领傀儡群协同作战' });
  }
  ['傀儡咒术学（咒骸制作）', '术式多重启动', '自动迎击术式', '咒术科学'].forEach(function (htName) {
    if (!HIGH_TECHNIQUES.some(function (x) { return x.label === htName; })) {
      HIGH_TECHNIQUES.push({ id: 'ht_' + htName, label: htName, weight: 9 });
    }
  });

  var GENDER_WHEEL = [
    { id: 'male', label: '男', weight: 42 },
    { id: 'female', label: '女', weight: 42 },
    { id: 'heli', label: '武装直升机', weight: 8 },
    { id: 'nb', label: '不男不女', weight: 8 }
  ];

  var ELDER_CLAN_DECIDE = [
    { id: true, label: '出身御三家嫡系元老', weight: 68 },
    { id: false, label: '寒门实权元老派系', weight: 32 }
  ];

  var ELDER_CLANS = [
    { id: 'gojo_clan', label: '五条家（相传：无下限咒术）', techId: 'limitless', techLabel: '无下限咒术', power: 18, weight: 34 },
    { id: 'zenin_clan', label: '禅院家（相传：十种影法术）', techId: 'tenShadows', techLabel: '十种影法术', power: 16, weight: 34 },
    { id: 'kamo_clan', label: '加茂家（相传：赤血操术）', techId: 'bloodManip', techLabel: '赤血操术', power: 12, weight: 32 }
  ];

  var INHERIT_CLAN_TECH = [
    { id: true, label: '成功继承本家祖传术式！', weight: 65 },
    { id: false, label: '未觉醒祖传术式（另行抽选命运）', weight: 35 }
  ];

  var CORPSE_CRAFT_DATA = {
    decide: [
      { id: true, label: '是！立即注入咒核制作咒骸', weight: 74 },
      { id: false, label: '否（暂不新建咒骸）', weight: 26 }
    ],
    counts: [
      { id: 1, count: 1, label: '精工制作 1 具自律咒骸', weight: 64 },
      { id: 2, count: 2, label: '双核并行制作 2 具咒骸', weight: 36 }
    ],
    bodyTypes: [
      { id: 'animal', label: '动物咒骸', weight: 48 },
      { id: 'humanoid', label: '人形咒骸', weight: 30 },
      { id: 'phantom', label: '幻兽咒骸', weight: 22 }
    ],
    animalForms: [
      '熊猫', '棕熊', '猛虎', '雄狮', '雪豹', '灰狼', '鬣狗', '狐狸',
      '大猩猩', '狒狒', '野猪', '犀牛', '野牛', '大象', '驼鹿', '袋鼠',
      '鳄鱼', '巨蟒', '眼镜蛇', '巨蜥', '陆龟', '巨蛙', '蝾螈', '变色龙',
      '雄鹰', '猫头鹰', '乌鸦', '鹤', '螳螂', '独角仙', '蝎子', '蜘蛛'
    ],
    humanoidForms: ['钢铁武者咒骸', '阴阳光翼侍童', '隐秘影卫傀儡', '多臂机关禅师'],
    phantomForms: ['麒麟咒骸', '饕餮咒骸', '白泽咒骸', '重明鸟咒骸', '夜叉咒骸'],
    autonomy: [
      { id: true, label: '可完全自主行动（独立战力+4，灵活协防）', weight: 65 },
      { id: false, label: '需咒丝远程操纵（同步主身输出+2）', weight: 35 }
    ],
    statRanks: [
      { label: 'EX（规格外超绝造物）', val: 10, weight: 6 },
      { label: 'SSS（特级核心巅峰）', val: 9, weight: 10 },
      { label: 'SS（准特级王牌）', val: 8, weight: 15 },
      { label: 'S（一级主力水准）', val: 7, weight: 22 },
      { label: 'A（精良实用）', val: 6, weight: 25 },
      { label: 'B（稳妥基础）', val: 5, weight: 15 },
      { label: 'C（常规试作型）', val: 4, weight: 7 }
    ],
    coreCounts: [
      { id: 0, count: 0, label: '0 个特殊核心（纯粹体格驱动）', weight: 18 },
      { id: 1, count: 1, label: '1 个核心能力', weight: 40 },
      { id: 2, count: 2, label: '2 个核心能力', weight: 28 },
      { id: 3, count: 3, label: '3 个三核互辅巅峰构造！', weight: 14 }
    ],
    coreAbilities: [
      { id: 'echo_cannon', label: '回响炮（隔山打牛贯穿轰击）', atkBonus: 4, weight: 16 },
      { id: 'puppet_silk', label: '傀儡丝（缠绕封锁敌方先手）', cancelBonus: 1, weight: 15 },
      { id: 'mirror_armor', label: '镜面装甲（偏折术式伤害）', defBonus: 4, weight: 14 },
      { id: 'shock_core', label: '震荡核心（冲击震碎敌方防御）', atkBonus: 3, weight: 14 },
      { id: 'charge_core', label: '蓄能核心（每轮额外储存战值）', atkBonus: 3, weight: 14 },
      { id: 'drain_core', label: '噬能核心（削弱敌方持续出力）', defBonus: 3, weight: 14 },
      { id: 'decoy_remnant', label: '替身残骸（抵挡一次致命伤势）', decoy: true, weight: 13 }
    ]
  };

  var EXORCISM_COMMISSIONS = [
    { id: 'comm_hospital', label: '祓除委托：医院二级灵害异常（悬赏酬劳）', enemyName: '医院集合体二级咒灵', enemyPower: 22, statUp: 'ceEfficiency', weight: 32 },
    { id: 'comm_factory', label: '祓除委托：废厂一级狂暴咒灵（高危单刷）', enemyName: '废厂金属怨灵', enemyPower: 38, statUp: 'barrier', weight: 32 },
    { id: 'comm_bounty', label: '祓除委托：特级假想怨灵联合悬赏（重金回报）', enemyName: '都市怪谈假想特级咒灵', enemyPower: 54, statUp: 'versatility', weight: 20 },
    { id: 'comm_rest', label: '暂未接取常规委托（整备调息休养）', skip: true, weight: 16 }
  ];

  var SEANCE_MATERIAL_POOL = [
    { id: 'bone_ash', label: '古剑豪骨灰媒质', weight: 28 },
    { id: 'toji_dna', label: '天与暴君残留肉体信息', weight: 24 },
    { id: 'cursed_womb', label: '高纯度咒胎残骸核心', weight: 24 },
    { id: 'talisman_seal', label: '古老神道降灵符录', weight: 24 }
  ];

  var SEANCE_SUMMON_RESULTS = [
    { id: 'seance_toji', label: '降灵成功！！唤出全盛·伏黑甚尔肉身（战前助战+16，持续压制）', powerBonus: 16, statUp: 'taijutsu', weight: 35 },
    { id: 'seance_sword', label: '降灵成功：唤出古代特级剑客助战（战前助战+10，效率+1）', powerBonus: 10, statUp: 'ceEfficiency', weight: 45 },
    { id: 'seance_rebel', label: '降灵暴走反噬！被受肉灵魂抢占主动（战力损伤但魂抗+1）', powerBonus: 0, statUp: 'soulResist', weight: 20 }
  ];

  // 新宿决战参战动机与宿傩顺序表
  SHINJUKU_MOTIVES = [
    { id: 'prove_self', label: '证明自己，独自挑战宿傩', buffNote: '孤狼死战信念：战斗首轮额外伤害 +8，独立决战气息拉满', firstRoundBonus: 8, weight: 34 },
    { id: 'bounty', label: '接受政府悬赏，参与讨伐宿傩', buffNote: '悬赏小队军备支援：开战自带 1 层战术备品与效率加成', firstRoundBonus: 5, weight: 30 },
    { id: 'protect', label: '为保护他人/阻止更大伤亡', buffNote: '守护信念共鸣：重伤兜底抗压 +10%，全军配合度↑', protectBonus: 10, firstRoundBonus: 6, weight: 36 }
  ];

  SHINJUKU_SUKUNA_ORDERS = [
    { id: 'before_gojo', label: '五条前挑战完整十影宿傩', enemyTitle: '完全体·十影两面宿傩', baseAtk: 42, agito: true, mahoraga: true, startWithGojo: false, canGojoJoin: true, weight: 26 },
    { id: 'with_gojo', label: '与五条悟共同迎战宿傩', enemyTitle: '全盛·十影两面宿傩', baseAtk: 44, agito: true, mahoraga: true, startWithGojo: true, canGojoJoin: false, weight: 28 },
    { id: 'after_gojo', label: '五条战后挑战残血十影宿傩', enemyTitle: '残血·十影宿傩（无魔虚罗/颚吐）', baseAtk: 31, agito: false, mahoraga: false, startWithGojo: false, canGojoJoin: false, weight: 26 },
    { id: 'higuruma_squad', label: '鹿紫云之后与日车宽见、虎杖悠仁、胀相对战一削原身宿傩', enemyTitle: '四臂完全体·原身宿傩（围攻篇）', baseAtk: 36, agito: false, mahoraga: false, startWithGojo: false, canGojoJoin: false, squadAlly: true, weight: 20 }
  ];

  var BOSS_COUNT_SLICES = {
    player: [
      { id: 3, count: 3, label: '本轮出招数：3 招', weight: 24 },
      { id: 4, count: 4, label: '本轮出招数：4 招', weight: 36 },
      { id: 5, count: 5, label: '本轮出招数：5 招', weight: 26 },
      { id: 6, count: 6, label: '本轮出招数：6 招！！', weight: 14 }
    ],
    gojo: [
      { id: 3, count: 3, label: '五条悟本轮出招：3 次', weight: 20 },
      { id: 4, count: 4, label: '五条悟本轮出招：4 次', weight: 32 },
      { id: 5, count: 5, label: '五条悟本轮出招：5 次', weight: 26 },
      { id: 6, count: 6, label: '五条悟本轮出招：6 次！', weight: 14 },
      { id: 9, count: 9, label: '五条悟全力暴走：9 次！！', weight: 8 }
    ],
    sukuna: [
      { id: 3, count: 3, label: '宿傩本轮出招：3 招', weight: 22 },
      { id: 4, count: 4, label: '宿傩本轮出招：4 招', weight: 36 },
      { id: 5, count: 5, label: '宿傩本轮出招：5 招', weight: 28 },
      { id: 6, count: 6, label: '宿傩狂攻：6 招！', weight: 14 }
    ]
  };

  var SIGNATURE_MOVES_BY_TECH = {
    starRage: [
      { id: 'star_max', label: '星之怒·极之番（黑洞压迫雏形）', power: 12, weight: 18 },
      { id: 'star_punch', label: '虚拟质量重击（特级崩毁铁拳）', power: 21, weight: 24 },
      { id: 'garuda_kick', label: '凰轮·足球踢（超质量炮弹）', power: 18, weight: 22 },
      { id: 'garuda_whip', label: '凰轮·质量鞭（+15，抵消敌方1次攻击）', power: 15, cancels: 1, weight: 18 },
      { id: 'star_suppress', label: '虚拟质量压制（+3，抵消敌方1次攻击）', power: 3, cancels: 1, weight: 16 }
    ],
    limitless: [
      { id: 'lim_blue', label: '术式顺转·最大输出「苍」（抵消1次攻击）', power: 18, cancels: 1, weight: 24 },
      { id: 'lim_red', label: '术式反转·猛烈贯穿「赫」', power: 22, weight: 24 },
      { id: 'lim_purple', label: '虚式「茈」·空间抹除炮击', power: 28, weight: 18 },
      { id: 'lim_tp', label: '苍拳·瞬移压制连打（抵消1次攻击）', power: 15, cancels: 1, weight: 22 }
    ],
    tenShadows: [
      { id: 'ts_dogs', label: '玉犬·浑与嵌合黑影高速突袭', power: 15, weight: 24 },
      { id: 'ts_bull', label: '贯牛·极限直线爆冲破甲', power: 19, weight: 22 },
      { id: 'ts_elephant', label: '满象倾瀑重压（抵消敌方1次攻击）', power: 14, cancels: 1, weight: 20 },
      { id: 'ts_deer', label: '圆鹿反转场（治疗伤势，抵消1次攻击）', power: 6, isHeal: true, cancels: 1, weight: 18 },
      { id: 'ts_maho', label: '魔虚罗协同冲阵狂劈', power: 23, weight: 16 }
    ],
    shrine: [
      { id: 'sh_dismantle', label: '高速「解」斩击风暴', power: 18, weight: 26 },
      { id: 'sh_cleave', label: '零距离「捌」贴身切裂', power: 21, weight: 24 },
      { id: 'sh_net', label: '网格斩大范围覆灭', power: 23, weight: 20 },
      { id: 'sh_fuga', label: '■「开」·灶之烈焰极速贯通', power: 28, weight: 14 }
    ],
    curseManip: [
      { id: 'cm_uzumaki', label: '极之番「漩涡」·咒灵超压轰击', power: 26, weight: 22 },
      { id: 'cm_swarm', label: '百鬼合围掩杀（抵消敌方1次攻击）', power: 14, cancels: 1, weight: 26 },
      { id: 'cm_special', label: '特级假想咒灵直击爆破', power: 19, weight: 24 }
    ],
    copy: [
      { id: 'cp_love', label: '里香完全显现·纯爱光炮', power: 26, weight: 22 },
      { id: 'cp_speech', label: '模倣·咒言「停止」（抵消1次攻击）', power: 13, cancels: 1, weight: 24 },
      { id: 'cp_jacob', label: '模倣·天使「邪去侮之梯」（抵消1次攻击）', power: 21, cancels: 1, weight: 22 },
      { id: 'cp_thin_ice', label: '模倣·宇瑞斯「薄冰破碎」', power: 18, weight: 22 }
    ],
    bloodManip: [
      { id: 'bm_pierce', label: '穿血·音速赤血射线', power: 20, weight: 28 },
      { id: 'bm_nova', label: '超新星·压缩血爆', power: 17, weight: 26 },
      { id: 'bm_scale', label: '赤鳞跃动·极速护体（抵消1次攻击）', power: 13, cancels: 1, weight: 24 }
    ],
    boogieWoogie: [
      { id: 'bw_swap', label: '不义游戏·超频换位拆招（抵消1次攻击）', power: 14, cancels: 1, weight: 30 },
      { id: 'bw_combo', label: '幻影双打极速铁拳', power: 20, weight: 28 },
      { id: 'bw_vibraslap', label: '高周波手摇铁片连换突袭', power: 17, weight: 24 }
    ],
    gamble: [
      { id: 'gm_jackpot', label: '大当！4分11秒无限咒力猛攻（顺便治疗）', power: 24, isHeal: true, weight: 26 },
      { id: 'gm_train', label: '坐杀博徒·列车连环撞击', power: 18, weight: 28 },
      { id: 'gm_door', label: '咒力铁门夹锁（抵消敌方1次攻击）', power: 14, cancels: 1, weight: 24 }
    ],
    higurumaLaw: [
      { id: 'hg_sword', label: '死刑执行·处刑人之剑必杀劈砍', power: 26, weight: 24 },
      { id: 'hg_hammer', label: '法槌巨型延展横扫', power: 18, weight: 28 },
      { id: 'hg_block', label: '审判规则封锁（抵消敌方1次攻击）', power: 13, cancels: 1, weight: 26 }
    ],
    idleTransfig: [
      { id: 'it_instant', label: '遍杀即灵体·自闭完美形态狂殴', power: 24, weight: 26 },
      { id: 'it_body', label: '多重魂拨体冲击波', power: 19, weight: 26 },
      { id: 'it_decoy', label: '灵魂分身替死规避（抵消1次攻击）', power: 11, cancels: 1, weight: 26 }
    ],
    ratio: [
      { id: 'rt_73', label: '十划·七三强制弱点一刀两断', power: 20, weight: 30 },
      { id: 'rt_collapse', label: '瓦拉拉·坍塌碎岩轰爆', power: 21, weight: 24 },
      { id: 'rt_guard', label: '钝刀切线架格（抵消1次攻击）', power: 14, cancels: 1, weight: 24 }
    ],
    mythBeast: [
      { id: 'mb_lightning', label: '幻兽琥珀·必中之雷轰穿！', power: 25, weight: 26 },
      { id: 'mb_em', label: '电磁波汽化连射', power: 21, weight: 26 },
      { id: 'mb_sonic', label: '高频音波震荡（抵消敌方1次攻击）', power: 14, cancels: 1, weight: 24 }
    ],
    projection: [
      { id: 'pj_24fps', label: '24帧超高速切入连踢', power: 19, weight: 28 },
      { id: 'pj_freeze', label: '触摸定帧一秒冻结（抵消1次攻击）', power: 15, cancels: 1, weight: 26 },
      { id: 'pj_mach', label: '音速冲撞粉碎铁拳', power: 22, weight: 24 }
    ],
    iceForm: [
      { id: 'if_frost', label: '霜凪·极寒大范围冰封（抵消1次攻击）', power: 19, cancels: 1, weight: 28 },
      { id: 'if_fall', label: '冰瀑直泻贯穿冰柱', power: 21, weight: 26 },
      { id: 'if_lance', label: '绝对零度冰枪连刺', power: 16, weight: 24 }
    ],
    construct: [
      { id: 'cn_sphere', label: '真球构筑·无限压力碾碎', power: 26, weight: 24 },
      { id: 'cn_armor', label: '昆虫铠高速俯冲撞击', power: 20, weight: 28 },
      { id: 'cn_liquid', label: '液态金属墙防反（抵消1次攻击）', power: 15, cancels: 1, weight: 26 }
    ],
    disasterFlames: [
      { id: 'df_meteor', label: '极之番·陨石坠落天火！', power: 25, weight: 24 },
      { id: 'df_bugs', label: '火砾虫音爆自爆阵', power: 18, weight: 28 },
      { id: 'df_flame', label: '地核熔炎直射喷涌', power: 20, weight: 26 }
    ],
    comedian: [
      { id: 'cm_truck', label: '超人·泥头车突然撞飞！', power: 22, weight: 28 },
      { id: 'cm_gag', label: '无厘头冷笑话消解攻击（抵消1次攻击）', power: 13, cancels: 1, weight: 28 },
      { id: 'cm_stage', label: '强制拉入二人转爆笑剧场', power: 19, weight: 24 }
    ],
    heavenZero: [
      { id: 'hz_blitz', label: '天与零帧消失·瞬步超速痛击', power: 22, weight: 30 },
      { id: 'hz_arsenal', label: '多咒具轮切连斩', power: 24, weight: 26 },
      { id: 'hz_parry', label: '凭超常动态视力架开术式（抵消1次攻击）', power: 15, cancels: 1, weight: 26 }
    ],
    puppetMaster: [
      { id: 'pm_cannon', label: '究极机械丸·多年库存炮轰击', power: 25, weight: 26 },
      { id: 'pm_swarm', label: '多具咒骸协同冲阵（抵消1次攻击）', power: 16, cancels: 1, weight: 28 },
      { id: 'pm_blade', label: '傀儡管炮·超频近身穿刺', power: 19, weight: 24 }
    ],
    default: [
      { id: 'def_innate', label: '生得术式·全力出力猛攻', power: 17, weight: 34 },
      { id: 'def_rush', label: '贴身连携压迫打击', power: 14, weight: 34 },
      { id: 'def_guard', label: '术式凝盾急防反（抵消敌方1次攻击）', power: 11, cancels: 1, weight: 24 }
    ]
  };

  GOJO_BOSS_MOVES = [
    { id: 'blackFlash', label: '黑闪！！！（五条悟进入无我境界，额外行动2次！）', power: 24, isBlackFlash: true, extraActions: 2, weight: 10 },
    { id: 'unlimited_purple', label: '无限制·虚式「茈」！！', power: 38, weight: 8 },
    { id: 'purple', label: '虚式「茈」·全境崩毁', power: 32, weight: 12 },
    { id: 'uv', label: '领域展开·无量空处！', power: 24, isUnlimitedVoid: true, isDomain: true, weight: 14 },
    { id: 'blue_fist', label: '苍拳重击（抵消对手1次有效攻击）', power: 16, cancels: 1, weight: 12 },
    { id: 'blue_tp', label: '苍·瞬移奇袭（抵消对手1次有效攻击）', power: 12, cancels: 1, weight: 11 },
    { id: 'point_red', label: '零距离「赫」·贴脸引爆', power: 25, weight: 11 },
    { id: 'blue', label: '术式顺转·「苍」（抵消敌方1次有效攻击）', power: 18, cancels: 1, weight: 10 },
    { id: 'red', label: '术式反转·「赫」', power: 22, weight: 8 },
    { id: 'elbow', label: '肘击（六眼精准贴打）', power: 10, weight: 4 }
  ];

  SUKUNA_MOVES = [
    { id: 'blackFlash', label: '黑闪！！！（宿傩额外行动2次，后续×1.2！）', dmg: 22, isBlackFlash: true, extraActions: 2, weight: 8 },
    { id: 'malevolentShrine', label: '领域展开·伏魔御厨子', dmg: 28, isDomain: true, weight: 8 },
    { id: 'dismantle', label: '「解」·高速斩击', dmg: 14, weight: 16 },
    { id: 'cleave', label: '「捌」·零距离贴身切裂', dmg: 18, weight: 14 },
    { id: 'netSlash', label: '网格斩·全方位切割阵', dmg: 22, weight: 10 },
    { id: 'elbow', label: '肘击（领域展延近身突击）', dmg: 11, weight: 9 },
    { id: 'loan', label: '贷款（下一次有效攻击×2，下回合出招-1，再抽1次）', dmg: 0, isLoan: true, extraActions: 1, weight: 9 },
    { id: 'agitoHit', label: '嵌合兽颚吐（战值+0，恢复伤势，再抽1次）', dmg: 0, requiresAgito: true, isAgitoHeal: true, extraActions: 1, weight: 8 },
    { id: 'summonMahoraga', label: '召唤魔虚罗（额外行动1次，轮末存活判定适应）', dmg: 5, canSummonMahoraga: true, isSummonMahoraga: true, extraActions: 1, weight: 7 },
    { id: 'mahoragaSword', label: '魔虚罗·退魔之剑顺劈', dmg: 17, requiresMahoraga: true, weight: 8 },
    { id: 'mahoragaActiveAdapt', label: '魔虚罗·主动旋转适应（轮末额外适应1次）', dmg: 0, requiresMahoraga: true, isActiveAdapt: true, weight: 6 },
    { id: 'fuga', label: '■「灶·开」·炽焰龙卷贯穿', dmg: 26, weight: 6 },
    { id: 'worldSlash', label: '扩展目标·断界「世界斩」', dmg: 35, weight: 5 }
  ];

  var MAHORAGA_ADAPT_COUNTS = [
    { id: 1, count: 1, label: '本轮适应 1 次', weight: 36 },
    { id: 2, count: 2, label: '本轮适应 2 次', weight: 28 },
    { id: 3, count: 3, label: '本轮适应 3 次！', weight: 18 },
    { id: 4, count: 4, label: '本轮适应 4 次！！', weight: 10 },
    { id: 5, count: 5, label: '本轮适应 5 次！！！', weight: 5 },
    { id: 6, count: 6, label: '法轮飞转 · 适应 6 次！！！！', weight: 3 }
  ];

  var SKILL_DESCRIPTIONS = {
    '完整咏唱': '决战中触发后使「下一次有效术式攻击伤害 ×2」（可叠加并跨轮保留；治疗、领域展开、肘击不消耗咏唱）。',
    '反转术式': '用正能量修复自身肉体创伤；新宿决战伤势盘亦有概率靠「抓准咒力核心」当场觉醒。',
    '领域展开': '展开必中生得领域压制战场，与伏魔御厨子同时展开时爆发领域对决。',
    '简易领域': '张开中和必中效果的小型结界，极大提高抵消敌方招式的概率。',
    '领域展延': '以水膜般的领域包裹全身，强行中和对方术式并在近身战占据优势。',
    '弥虚葛笼': '古代对抗领域必中的秘传结界，稳定提高危局生存率。',
    '黑闪': '击中前 0.000001 秒内凝聚咒力的空间扭曲；决战触发额外行动 2 次，进入本轮数值 ×1.2 的无我境界。',
    '百兵演武': '引爆手中咒具释放绝杀输出，需承受咒具破碎风险换取破局伤害。',
    '术式多重启动': '同时并联激活多重术式回路，攻击小幅加值并额外行动 1 次。',
    '自动迎击术式': '预先设定的护身反击模块，出招时附带 1 次敌方招式抵消。',
    '咒术科学': '通过精密逻辑拆解对手术式机理，出招同时可抵消敌方 1 次有效攻击。',
    '傀儡咒术学（咒骸制作）': '可亲手制作具备独立核心能力的自律咒骸协同上阵助战。'
  };

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
    GENDER_WHEEL: GENDER_WHEEL,
    ELDER_CLAN_DECIDE: ELDER_CLAN_DECIDE,
    ELDER_CLANS: ELDER_CLANS,
    INHERIT_CLAN_TECH: INHERIT_CLAN_TECH,
    CORPSE_CRAFT_DATA: CORPSE_CRAFT_DATA,
    EXORCISM_COMMISSIONS: EXORCISM_COMMISSIONS,
    SEANCE_MATERIAL_POOL: SEANCE_MATERIAL_POOL,
    SEANCE_SUMMON_RESULTS: SEANCE_SUMMON_RESULTS,
    ATTRIBUTE_WHEELS: ATTRIBUTE_WHEELS,
    SHIKIGAMI_SUB_BRANCHES: SHIKIGAMI_SUB_BRANCHES,
    GRADE_WHEELS: GRADE_WHEELS,
    ERA_EVENTS: ERA_EVENTS,
    SHINJUKU_PREP_GROWTH: SHINJUKU_PREP_GROWTH,
    SHINJUKU_MOTIVES: SHINJUKU_MOTIVES,
    SHINJUKU_SUKUNA_ORDERS: SHINJUKU_SUKUNA_ORDERS,
    BOSS_COUNT_SLICES: BOSS_COUNT_SLICES,
    SIGNATURE_MOVES_BY_TECH: SIGNATURE_MOVES_BY_TECH,
    PLAYER_BOSS_MOVES: PLAYER_BOSS_MOVES,
    SUKUNA_MOVES: SUKUNA_MOVES,
    GOJO_BOSS_MOVES: GOJO_BOSS_MOVES,
    GOJO_UV_EFFECTS: GOJO_UV_EFFECTS,
    MAHORAGA_ADAPT_COUNTS: MAHORAGA_ADAPT_COUNTS,
    SKILL_DESCRIPTIONS: SKILL_DESCRIPTIONS,
    CROSS_ERA_WHEEL: CROSS_ERA_WHEEL,
    REPUTATION_BY_FACTION: REPUTATION_BY_FACTION,
    ARENA_CHAMPIONS: ARENA_CHAMPIONS,
    CANON_CHARACTERS: CANON_CHARACTERS,
    CANON_TIMEPOINTS: CANON_TIMEPOINTS,
    CANON_SYNC_SLICES: CANON_SYNC_SLICES,
    CANON_MEMORY_SLICES: CANON_MEMORY_SLICES,
    CANON_DIVERGENCE_SLICES: CANON_DIVERGENCE_SLICES,
    BINDING_VOWS: BINDING_VOWS,
    IDENTITY_EXTRA_WHEELS: IDENTITY_EXTRA_WHEELS,
    ACHIEVEMENT_CATALOG: ACHIEVEMENT_CATALOG
  };
})(window);
