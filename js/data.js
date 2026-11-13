/* =========================================================
 * 咒术回战 · 全能转盘模拟器 - 角色与能力数据（B站短视频同款）
 * ========================================================= */
(function (global) {
  'use strict';

  const TIER_META = {
    SSR:  { label: '特级', color: '#f59e0b' },
    SR:   { label: '一级', color: '#a855f7' },
    R:    { label: '常规', color: '#0ea5e9' },
    MEME: { label: '整活', color: '#f43f5e' }
  };

  const SPEED_CONFIG = {
    slow:   { duration: 3400, extraSpins: 7 },
    normal: { duration: 1700, extraSpins: 5 },
    fast:   { duration: 700,  extraSpins: 3 }
  };

  // 核心原作人物库（用于转盘绘制头像 + 角色配色 + 台词）
  const CHARACTERS = {
    gojo: {
      key: 'gojo', name: '五条悟', color: '#0284c7', tier: 'SSR',
      quote: '“天上天下，唯我独尊。会赢的！”',
      abilities: {
        physique: '190cm修长战神体格（90）',
        speed:    '苍之瞬移·全作天花板（99）',
        iq:       '六眼超算级战场直觉（95）',
        ce:       '六眼·无限近零消耗（99）',
        weapon:   '无咒具（全靠无下限手撕）',
        technique:'无下限术式（苍·赫·虚式茈）',
        domain:   '无量空处（0.2秒极限展开）'
      },
      stats: { physique: 90, speed: 99, iq: 95, ce: 99, weapon: 76, technique: 100, domain: 100 }
    },
    sukuna: {
      key: 'sukuna', name: '两面宿傩', color: '#b91c1c', tier: 'SSR',
      quote: '“小鬼，让我看看你拿什么取悦我？”',
      abilities: {
        physique: '四手两嘴完美战斗躯壳（98）',
        speed:    '超音速突袭+四臂格挡（97）',
        iq:       '千年战斗老祖·即时学世界斩（98）',
        ce:       '双倍乙骨海啸级蓝量（100）',
        weapon:   '神武解 + 飞天双神器',
        technique:'御厨子（解·捌·灶开·世界斩）',
        domain:   '伏魔御厨子（200米无结界）'
      },
      stats: { physique: 98, speed: 97, iq: 98, ce: 100, weapon: 92, technique: 99, domain: 100 }
    },
    toji: {
      key: 'toji', name: '伏黑甚尔', color: '#047857', tier: 'SSR',
      quote: '“怎么会是免费打手呢？”',
      abilities: {
        physique: '完全体天与暴君肉身（100）',
        speed:    '人类肉体极限·鬼魅闪现（98）',
        iq:       '咒术师杀手·精密伏击流（92）',
        ce:       '完全 0 咒力黑洞（免疫必中）',
        weapon:   '游云 + 天逆鉾 + 释魂刀',
        technique:'无术式（全靠天与咒缚物理破防）',
        domain:   '无视一切封闭领域结界'
      },
      stats: { physique: 100, speed: 98, iq: 92, ce: 0, weapon: 100, technique: 40, domain: 68 }
    },
    yuji: {
      key: 'yuji', name: '虎杖悠仁', color: '#e11d48', tier: 'SSR',
      quote: '“我就是你啊，真人！”',
      abilities: {
        physique: '堪比天与的怪力容器体（95）',
        speed:    '50米3秒怪兽级爆发力（91）',
        iq:       '纯正热血直觉+灵魂共鸣（76）',
        ce:       '黑闪连打8发·咒力沸腾（86）',
        weapon:   '屠坐魔 / 咒力双拳硬刚',
        technique:'赤血操术 + 魂之御厨子',
        domain:   '灵魂车站必中领域'
      },
      stats: { physique: 95, speed: 91, iq: 76, ce: 86, weapon: 72, technique: 86, domain: 84 }
    },
    megumi: {
      key: 'megumi', name: '伏黑惠', color: '#1d4ed8', tier: 'SR',
      quote: '“布都御魂，要死一起死！”',
      abilities: {
        physique: '高专主力均衡体格（74）',
        speed:    '影潜机动+玉犬突袭（80）',
        iq:       '冷静派战术分析师（88）',
        ce:       '十影召唤耗蓝中等（76）',
        weapon:   '影子武器库（含游云备品）',
        technique:'十种影法术（底牌：魔虚罗）',
        domain:   '嵌合暗翳庭（未完成室内特化）'
      },
      stats: { physique: 74, speed: 80, iq: 88, ce: 76, weapon: 80, technique: 94, domain: 78 }
    },
    yuta: {
      key: 'yuta', name: '乙骨忧太', color: '#7e22ce', tier: 'SSR',
      quote: '“这就是纯爱啊！”',
      abilities: {
        physique: '看似瘦弱实则咒力护体极肉（86）',
        speed:    '里香联动超高速突进（90）',
        iq:       '新宿总策划军师级别（92）',
        ce:       '深渊级溢出蓝量+5分钟外挂（98）',
        weapon:   '武士刀 + 里香兵器库',
        technique:'模仿 Copy（想抄谁就抄谁）',
        domain:   '真赝相爱（满地无限剑制）'
      },
      stats: { physique: 86, speed: 90, iq: 92, ce: 98, weapon: 90, technique: 95, domain: 95 }
    },
    maki: {
      key: 'maki', name: '禅院真希', color: '#0f766e', tier: 'SSR',
      quote: '“全都破坏掉就行了。”',
      abilities: {
        physique: '完全觉醒天与肉体（98）',
        speed:    '踩空气二段跳追打3马赫（96）',
        iq:       '实战派兵器宗师（86）',
        ce:       '0咒力·透明隐身流',
        weapon:   '释魂刀（无视防御直斩灵魂）',
        technique:'纯物理暴君（不吃常规术式判定）',
        domain:   '无视常规结界必中'
      },
      stats: { physique: 98, speed: 96, iq: 86, ce: 0, weapon: 98, technique: 42, domain: 66 }
    },
    todo: {
      key: 'todo', name: '东堂葵', color: '#b45309', tier: 'SR',
      quote: '“你喜欢什么类型的女人？！”',
      abilities: {
        physique: '铁血肌肉猛男（88）',
        speed:    '0帧拍掌换位·神鬼莫测（89）',
        iq:       '自称 53 万超绝智商（99）',
        ce:       '扎实一级咒力+曾打黑闪（78）',
        weapon:   '改·乐器手（1秒50次置换）',
        technique:'不义游戏（团战最恶心神技）',
        domain:   '曾开过简易领域硬扛真人'
      },
      stats: { physique: 88, speed: 89, iq: 99, ce: 78, weapon: 75, technique: 90, domain: 66 }
    },
    nanami: {
      key: 'nanami', name: '七海建人', color: '#a16207', tier: 'R',
      quote: '“现在起进入加班时间！”',
      abilities: {
        physique: '西装暴徒健壮体格（84）',
        speed:    '稳健格斗步法（78）',
        iq:       '冷静成熟的社畜逻辑（88）',
        ce:       '下班时间束缚·咒力120%（78）',
        weapon:   '七三缠布钝刀（斩首级威力）',
        technique:'十划咒法（7:3强行造弱点暴击）',
        domain:   '不会领域（全靠硬实力砍）'
      },
      stats: { physique: 84, speed: 78, iq: 88, ce: 78, weapon: 84, technique: 82, domain: 42 }
    },
    geto: {
      key: 'geto', name: '夏油杰', color: '#4338ca', tier: 'SR',
      quote: '“这可是大义啊，悟。”',
      abilities: {
        physique: '体术顶级·单挑一打二（82）',
        speed:    '咒灵掩护高速近身（82）',
        iq:       '曾经清醒但陷入苦夏（82）',
        ce:       '特级标准庞大咒力（86）',
        weapon:   '特级三节棍【游云】',
        technique:'咒灵操术（6461只咒灵军团）',
        domain:   '借用特级咒灵展开简易/自带领域'
      },
      stats: { physique: 82, speed: 82, iq: 82, ce: 86, weapon: 88, technique: 90, domain: 74 }
    },
    kenjaku: {
      key: 'kenjaku', name: '羂索', color: '#6b21a8', tier: 'SSR',
      quote: '“呵呵，千年老阴比笑而不语。”',
      abilities: {
        physique: '换身获得的特级肉体（82）',
        speed:    '老练闪避·反重力控场（84）',
        iq:       '活了一千年的幕后黑手（100）',
        ce:       '千年精炼级咒力操控（90）',
        weapon:   '万只咒灵 + 狱门疆',
        technique:'大脑换身 + 咒灵操术 + 反重力',
        domain:   '胎藏遍野（开放式无结界领域）'
      },
      stats: { physique: 82, speed: 84, iq: 100, ce: 90, weapon: 76, technique: 95, domain: 96 }
    },
    hakari: {
      key: 'hakari', name: '秤金次', color: '#be185d', tier: 'SSR',
      quote: '“先让我的主题曲响起来！”',
      abilities: {
        physique: '街头恶霸铁拳体魄（86）',
        speed:    '大当たり期间全程疯狗冲锋（88）',
        iq:       '赌徒直觉拉满（80）',
        ce:       '4分11秒无限咒力溢出（99）',
        weapon:   '柏青哥列车门板+双拳',
        technique:'坐杀博徒（全自动无限反转）',
        domain:   '光速展开（比0.2秒还快！）'
      },
      stats: { physique: 86, speed: 88, iq: 80, ce: 99, weapon: 74, technique: 88, domain: 90 }
    },
    kashimo: {
      key: 'kashimo', name: '鹿紫云一', color: '#0e7490', tier: 'SR',
      quote: '“这是弱者的葬礼！”',
      abilities: {
        physique: '江户武痴狂战士肉体（84）',
        speed:    '电磁化肉体·近乎光速（92）',
        iq:       '只懂干架的战斗脑（74）',
        ce:       '自带麻痹落雷特性咒力（88）',
        weapon:   '如意雷电铁棒',
        technique:'幻兽琥珀（一次性自爆神级大招）',
        domain:   '没有领域（靠硬核体术与落雷）'
      },
      stats: { physique: 84, speed: 92, iq: 74, ce: 88, weapon: 82, technique: 88, domain: 48 }
    },
    choso: {
      key: 'choso', name: '胀相', color: '#991b1b', tier: 'SR',
      quote: '“大哥我是来保护弟弟的！”',
      abilities: {
        physique: '咒胎九相图半人半咒灵（82）',
        speed:    '赤鳞跃动大幅提速（82）',
        iq:       '150年修炼的老哥经验（82）',
        ce:       '咒力直接造血·续航神技（82）',
        weapon:   '超新星血刃 + 穿血水枪',
        technique:'赤血操术·百敛穿血',
        domain:   '不会领域（曾撑起简易领域）'
      },
      stats: { physique: 82, speed: 82, iq: 82, ce: 82, weapon: 76, technique: 84, domain: 58 }
    },
    higuruma: {
      key: 'higuruma', name: '日车宽见', color: '#475569', tier: 'SR',
      quote: '“有罪！判处没收加死刑！”',
      abilities: {
        physique: '文弱律师硬靠天赋现学（74）',
        speed:    '临阵突破·躲避斩击（78）',
        iq:       '律政学霸·十二天学会领域与反转（96）',
        ce:       '高效率术师蓝量（78）',
        weapon:   '处刑人之剑（一击必杀！）',
        technique:'司法裁判官（先定罪后砍人）',
        domain:   '诛伏赐死（禁止暴力+没收术式）'
      },
      stats: { physique: 74, speed: 78, iq: 96, ce: 78, weapon: 98, technique: 90, domain: 92 }
    },
    takaba: {
      key: 'takaba', name: '高羽史彦', color: '#ca8a04', tier: 'SSR',
      quote: '“哈哈哈哈这不挺好笑的吗！”',
      abilities: {
        physique: '搞笑艺人迷之抗揍（80）',
        speed:    '漫画式瞬间切换场景（85）',
        iq:       '脑回路异于常人（55）',
        ce:       '靠笑点驱动的因果律蓝条（85）',
        weapon:   '塑料扇子 + 泥头车场景道具',
        technique:'超人（只要我觉得好笑就成真）',
        domain:   '自带现实强制拉入小品剧场'
      },
      stats: { physique: 80, speed: 85, iq: 55, ce: 85, weapon: 80, technique: 99, domain: 88 }
    },
    nobara: {
      key: 'nobara', name: '钉崎野蔷薇', color: '#ea580c', tier: 'R',
      quote: '“少瞧不起老娘啊！”',
      abilities: {
        physique: '钢铁心态狠人女高（70）',
        speed:    '灵活走位+快速拔钉（74）',
        iq:       '直爽果断不拖泥带水（76）',
        ce:       '中等术师咒力量（68）',
        weapon:   '铁锤 + 钢钉 + 草人偶',
        technique:'刍灵咒法（共鸣直击灵魂）',
        domain:   '未觉醒领域（黑闪高手）'
      },
      stats: { physique: 70, speed: 74, iq: 76, ce: 68, weapon: 78, technique: 82, domain: 45 }
    },
    mahito: {
      key: 'mahito', name: '真人', color: '#2563eb', tier: 'SR',
      quote: '“让我摸摸你的灵魂是什么形状！”',
      abilities: {
        physique: '遍杀即灵体·肉身变形硬扛（88）',
        speed:    '变成鸟/豹任意高速变形（86）',
        iq:       '成长速度堪比怪物的恶童（86）',
        ce:       '特级灾厄诅咒储备（86）',
        weapon:   '手刀变刃 + 改造人炸弹',
        technique:'无为转变（非灵魂攻击打不死）',
        domain:   '自闭圆顿裹（0.2秒手心绝杀）'
      },
      stats: { physique: 88, speed: 86, iq: 86, ce: 86, weapon: 80, technique: 94, domain: 90 }
    },
    jogo: {
      key: 'jogo', name: '漏瑚', color: '#c2410c', tier: 'SR',
      quote: '“真可惜，你只是生在了没有我的时代。”',
      abilities: {
        physique: '脆皮火山法师（68）',
        speed:    '极速喷火闪避（84）',
        iq:       '容易上头挑战天花板（70）',
        ce:       '约8~9根宿傩手指级（88）',
        weapon:   '火砾虫 + 岩浆爆发',
        technique:'大地火焰 + 极之番·陨石',
        domain:   '盖棺铁围山（可惜总撞挂壁）'
      },
      stats: { physique: 68, speed: 84, iq: 70, ce: 88, weapon: 76, technique: 88, domain: 86 }
    },
    miwa: {
      key: 'miwa', name: '三轮霞', color: '#0284c7', tier: 'MEME', isMeme: true,
      quote: '“大家好，我是没用的三轮！”',
      abilities: {
        physique: '普通可爱女高中生（52）',
        speed:    '脚一动就会散架的拔刀（56）',
        iq:       '老实人乖乖女（66）',
        ce:       '勉强够拉简易领域（48）',
        weapon:   '一砍就断的普通武士刀',
        technique:'无生得术式（全靠新阴流）',
        domain:   '新阴流·简易领域（不能挪步）'
      },
      stats: { physique: 52, speed: 56, iq: 66, ce: 48, weapon: 42, technique: 30, domain: 55 }
    },
    naoya: {
      key: 'naoya', name: '禅院直哉', color: '#d97706', tier: 'MEME', isMeme: true,
      quote: '“连我背影都追不上，怎么配叫男人！”',
      abilities: {
        physique: '咒灵化后超音速甲壳（82）',
        speed:    '三马赫超音速冲撞（95）',
        iq:       '嘴臭度远超战术智商（60）',
        ce:       '御三家精锐级别（78）',
        weapon:   '偷偷藏在袖子里的短刀',
        technique:'投射咒法（每秒24帧定格）',
        domain:   '时胞月宫殿（切细胞领域）'
      },
      stats: { physique: 82, speed: 95, iq: 60, ce: 78, weapon: 64, technique: 86, domain: 86 }
    },
    gojo25: {
      key: 'gojo25', name: '2.5条悟', color: '#64748b', tier: 'MEME', isMeme: true,
      quote: '“好强…宿傩甚至还没拿出全力！”',
      abilities: {
        physique: '上下分离可拆卸拼图（45）',
        speed:    '直飞南下候机厅头等舱（55）',
        iq:       '机场强行吹捧对手（50）',
        ce:       '残血但嘴硬续航（65）',
        weapon:   '只剩半截的高专制服',
        technique:'残缺无下限（防不住空间斩）',
        domain:   '领域展开·机场候机室'
      },
      stats: { physique: 45, speed: 55, iq: 50, ce: 65, weapon: 40, technique: 72, domain: 40 }
    },
    ijichi: {
      key: 'ijichi', name: '伊地知', color: '#4b5563', tier: 'MEME', isMeme: true,
      quote: '“请系好安全带，辅助监督要撞人了！”',
      abilities: {
        physique: '常年被夹在中间受气的社畜（46）',
        speed:    '百公里加速的黑色轿车（72）',
        iq:       '最强后勤调度员（84）',
        ce:       '专精拉【账】封印结界（45）',
        weapon:   '1.5吨高专公车直接创飞',
        technique:'召唤专车与高级拉账',
        domain:   '超级无敌大黑【账】'
      },
      stats: { physique: 46, speed: 72, iq: 84, ce: 45, weapon: 70, technique: 55, domain: 45 }
    }
  };

  // 模式1：B站经典「战力拼图」7大属性槽位
  const PUZZLE_SLOTS = [
    { id: 'physique',  title: '体格 / 肉身',  icon: '💪' },
    { id: 'speed',     title: '速度 / 反应',  icon: '⚡' },
    { id: 'iq',        title: '智商 / 战术',  icon: '🧠' },
    { id: 'ce',        title: '咒力 / 蓝量',  icon: '🔵' },
    { id: 'weapon',    title: '武器 / 咒具',  icon: '🗡️' },
    { id: 'technique', title: '生得术式',     icon: '🔮' },
    { id: 'domain',    title: '领域展开',     icon: '⛩️' }
  ];

  // 模式2：B站/抖音爆火「人物关系命运转盘」7大格
  const RELATION_SLOTS = [
    { id: 'self',    title: '我的本体/长相', icon: '🪪', desc: '你在咒术界将以谁的身体与颜值登场' },
    { id: 'bestie',  title: '我的挚友/死党', icon: '🤝', desc: '整天跟你一起吃拉面/闯祸的好兄弟' },
    { id: 'crush',   title: '结婚/恋爱对象', icon: '💘', desc: '转盘停在谁头上，今晚就和谁领证！' },
    { id: 'mentor',  title: '我的高专老师',  icon: '🎓', desc: '负责教你咒力操控与实战的引路人' },
    { id: 'nemesis', title: '追杀我的宿敌',  icon: '💢', desc: '一见面就开大招往死里砍你的冤家' },
    { id: 'savior',  title: '濒死谁来救我',  icon: '🛡️', desc: '血条见底时从天而降救场的援军' },
    { id: 'airport', title: '陪我去机场的人',icon: '✈️', desc: '大结局陪你坐在候机室聊天的搭档' }
  ];

  // 斗蛐蛐随机场地
  const DUEL_ARENAS = [
    { id: 'a_shinjuku', key: 'sukuna', name: '新宿废墟（全员出力+15%）', color: '#991b1b', tier: 'SR', mod: 'all_boost', desc: '全员解除限制，开局直接互扔大招！' },
    { id: 'a_shibuya',  key: 'gojo',   name: '涩谷B5F车站（0.2秒领域特化）', color: '#1d4ed8', tier: 'SSR', mod: 'fast_domain', desc: '空间狭小人群密集，体术与极速领域伤害提升！' },
    { id: 'a_airport',  key: 'gojo25', name: '南下机场候机厅（B站名场面）', color: '#475569', tier: 'MEME', mod: 'airport', desc: '每回合有概率陷入“夸赞对手”发呆状态！' },
    { id: 'a_court',    key: 'higuruma',name: '日车法庭（禁止物理殴打）', color: '#334155', tier: 'SR', mod: 'no_tai', desc: '术式与智谋权重暴增，纯物理天与暴君伤害减半！' },
    { id: 'a_rain',     key: 'yuji',   name: '京都暴雨夜（黑闪概率翻倍）', color: '#be123c', tier: 'SSR', mod: 'black_flash', desc: '咒力火花四溅，极易出现连续黑闪翻盘！' },
    { id: 'a_maho',     key: 'megumi', name: '魔虚罗观战台（第3回合介入）', color: '#b45309', tier: 'MEME', mod: 'mahoraga_drop', desc: '打到第3回合，天降魔虚罗无差别抽人！' }
  ];

  const BOSSES = {
    jogo: {
      name: '特级咒灵 · 漏瑚',
      hp: 165, atk: 27, def: 16,
      intro: '火山头傲然登场：“区区人类，也敢直视大地之怒？”',
      skills: ['火砾虫群爆', '火山喷射火柱', '极之番·陨', '领域展开·盖棺铁围山'],
      winMeme: '漏瑚倒在焦土上：“真可惜……你只是生在了有我的时代（才怪）。”',
      loseMeme: '你被漏瑚当场烤成焦炭，喜提“九分熟高专烤肉”称号！'
    },
    mahito: {
      name: '完全体 · 真人',
      hp: 205, atk: 32, def: 24,
      intro: '真人咧嘴冷笑：“让我看看你的灵魂是什么形状吧~”',
      skills: ['无为转变·灵魂触碰', '改造人齐射', '遍杀即灵体冲锋', '0.2秒自闭圆顿裹'],
      winMeme: '真人像兔子一样在雪地里逃窜，你赢下了灵魂死斗！',
      loseMeme: '灵魂防线被真人摸穿，直接被捏成了一只可怜的茶壶。'
    },
    kenjaku: {
      name: '千年老阴比 · 羂索',
      hp: 245, atk: 36, def: 28,
      intro: '脑花掀开额头缝合线：“千年的计划，就拿你来试刀吧。”',
      skills: ['万只咒灵漩涡', '反重力机构重力碾压', '无结界·胎藏遍野', '阴险偷袭补刀'],
      winMeme: '你用绝妙的节奏配合斩击送脑花上路，终结了他千年的布局！',
      loseMeme: '你被反重力死死摁在地上，脑花顺手给你讲了半小时人类进化哲学。'
    },
    gojo: {
      name: '现代最强 · 五条悟',
      hp: 295, atk: 43, def: 36,
      intro: '五条悟拉下眼罩：“别眨眼哦，一不小心可能会直接输掉~”',
      skills: ['术式顺转·苍', '术式反转·赫', '虚式·茈', '0.2秒无量空处'],
      winMeme: '不可思议！你居然强行突破了无下限，把五条悟打进了机场候机厅！',
      loseMeme: '被塞进0.2秒【无量空处】信息过载，你当场变成只会夸人强的好人。'
    },
    sukuna: {
      name: '完全体 · 两面宿傩',
      hp: 350, atk: 47, def: 35,
      intro: '新宿废墟之上，四手两嘴的诅咒之王睁开四瞳：“小鬼，让我看看你拿什么取悦我？”',
      skills: ['不可视之解', '四手连打压制', '伏魔御厨子·灶开', '空间世界斩（束缚发动）'],
      winMeme: '奇迹诞生！新宿车轮战终结！宿傩被你打出防盗网并化作一滩黑泥！弹幕刷爆：【真正的新宿战神】！',
      loseMeme: '恭喜成为第18位“2.5条体验卡”持有者！你已在南下机场落地，正和五条悟讨论“宿傩其实还没出全力”。'
    }
  };

  global.JJK_DATA = {
    TIER_META,
    SPEED_CONFIG,
    CHARACTERS,
    PUZZLE_SLOTS,
    RELATION_SLOTS,
    DUEL_ARENAS,
    BOSSES
  };
})(window);
