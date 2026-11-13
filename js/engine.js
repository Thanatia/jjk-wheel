(function (global) {
  'use strict';

  var DATA = global.JJK_OMEGA_DATA;

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function cloneState(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getRankMeta(level) {
    var safeLevel = clamp(Math.round(level), 0, DATA.RANK_SCALE.length - 1);
    return DATA.RANK_SCALE[safeLevel];
  }

  function getAttrDesc(key) {
    for (var i = 0; i < DATA.ATTRIBUTE_DEFS.length; i++) {
      if (DATA.ATTRIBUTE_DEFS[i].key === key) {
        return DATA.ATTRIBUTE_DEFS[i];
      }
    }
    return { key: key, name: key, desc: '' };
  }

  function getSliceColors(slices) {
    return slices.map(function (slice, idx) {
      return Object.assign({}, slice, {
        color: slice.color || DATA.SLICE_COLORS[idx % DATA.SLICE_COLORS.length]
      });
    });
  }

  function getPowerBreakdown(char) {
    var a = char.attrs;
    var baseAttrs = a.taijutsu * 2.2 + a.body * 2.0 + a.ceTotal * 2.1 + a.ceControl * 2.0 + a.ceEfficiency * 1.9 + a.iq * 0.9;
    var skillBonus = char.skills.length * 3.5 + (char.techniquePower || 6);
    var domainBonus = char.domain !== '尚未掌握领域展开' ? 11 : 0;
    var toolBonus = char.tools.length * 3;
    var supplyMult = char.masterSupplyMult || 1;
    var injuryPenalty = char.hpStatus === '重伤' ? 9 : char.hpStatus === '轻伤' ? 3 : 0;
    var total = Math.round((baseAttrs * 0.48 + skillBonus + domainBonus + toolBonus + (char.gradeBonus || 4)) * supplyMult - injuryPenalty);
    return clamp(total, 1, 150);
  }

  function createRun(modeId) {
    var mode = DATA.MODES[modeId] || DATA.MODES.normal;
    var state = {
      modeId: mode.id,
      stepCount: 0,
      finished: false,
      currentView: 'wheel', // 'wheel' | 'radar' | 'settlement'
      pendingRadar: null,
      lastResultText: '准备就绪',
      lastEffectText: '点击下方「点击旋转」决定你在咒术界的起点',
      canRerollLast: false,
      prevSnapshot: null,
      stepQueue: [{ type: 'identity' }],
      char: {
        identityId: 'sorcerer',
        identityName: '未定身份',
        faction: 'neutral',
        birthEraId: 'canonStart',
        birthEraLabel: '剧情开始时',
        currentEraId: 'canonStart',
        currentEraLabel: '出生设定',
        birthplace: '日本',
        lineage: '待定',
        technique: '尚未抽取',
        techniquePower: 0,
        officialGrade: '未评级',
        gradeBonus: 2,
        master: null,
        masterSupplyMult: 1,
        masterSupplyLabel: '',
        masterBondLabel: '',
        shikigamiDesc: '',
        hpStatus: '健康',
        attrs: {
          taijutsu: 4,
          body: 4,
          ceTotal: 4,
          ceControl: 4,
          ceEfficiency: 4,
          iq: 4,
          talent: 4,
          looks: 4,
          morality: 5,
          reputation: 4
        },
        skills: [],
        domain: '尚未掌握领域展开',
        tools: [],
        statsLog: {
          wins: 0,
          losses: 0,
          blackFlashes: 0,
          growthCount: 0,
          heavyInjuries: 0,
          survivedDeath: 0,
          beatStronger: false,
          lostToWeaker: false,
          defeatedEnemies: []
        },
        flags: {
          gojoSealed: null,
          sukunaVessel: null,
          preservedToFuture: false,
          nanamiDead: false,
          killedInAction: false
        },
        timeline: []
      }
    };
    return state;
  }

  function buildEraQueue(startEraId, modeId) {
    var startIdx = 0;
    for (var i = 0; i < DATA.ERAS.length; i++) {
      if (DATA.ERAS[i].id === startEraId) {
        startIdx = i;
        break;
      }
    }
    var queue = [];
    if (startEraId === 'heian' || startEraId === 'edo400') {
      queue.push({ type: 'era_pick', eraId: startEraId });
      queue.push({ type: 'cross_era' });
      startIdx = 2; // 跨越后在怀玉/现代线苏醒
      if (modeId === 'normal' || modeId === 'duel') {
        startIdx = 4; // 主流剧情起跑更快进入涩谷事变
      }
    } else if (startEraId === 'shinjuku') {
      queue.push({ type: 'era_pick', eraId: 'shinjuku' });
      queue.push({ type: 'era_pick', eraId: 'future68' });
      queue.push({ type: 'final_reputation' });
      queue.push({ type: 'radar', stage: 'final', title: '最终能力面板' });
      queue.push({ type: 'settlement' });
      return queue;
    }

    for (var idx = startIdx; idx < DATA.ERAS.length; idx++) {
      var era = DATA.ERAS[idx];
      if (era.id === 'shibuya') {
        queue.push({ type: 'shibuya_gojo_seal' });
        queue.push({ type: 'era_pick', eraId: 'shibuya' });
      } else if (era.id === 'culling') {
        queue.push({ type: 'era_pick', eraId: 'culling' });
        queue.push({ type: 'sukuna_vessel' });
        queue.push({ type: 'radar', stage: 'mid', title: '中期能力面板' });
      } else {
        queue.push({ type: 'era_pick', eraId: era.id });
      }
    }

    queue.push({ type: 'final_reputation' });
    queue.push({ type: 'radar', stage: 'final', title: '最终能力面板' });
    queue.push({ type: 'settlement' });
    return queue;
  }

  function getActiveStep(state) {
    if (!state.stepQueue || state.stepQueue.length === 0) {
      return { type: 'settlement' };
    }
    return state.stepQueue[0];
  }

  function buildFightSlices(state, enemyPower) {
    var mode = DATA.MODES[state.modeId] || DATA.MODES.normal;
    var myPower = getPowerBreakdown(state.char);
    var diff = myPower - enemyPower + mode.battleBonus;
    if (state.modeId === 'fun') {
      diff += 4;
    }
    var prob = Math.round(100 / (1 + Math.exp(-diff / 13)));
    var winPct = clamp(prob, 8, 94);
    var lossPct = 100 - winPct;
    return [
      { id: 'win', label: '胜', weight: winPct, color: '#2ac19a' },
      { id: 'loss', label: '负', weight: lossPct, color: '#ef5d58' }
    ];
  }

  function buildInjurySlices(state, won, canDie) {
    var bodyLv = state.char.attrs.body;
    if (won) {
      var noInjury = clamp(32 + bodyLv * 4, 25, 78);
      var light = clamp(100 - noInjury - 8, 18, 60);
      var heavy = Math.max(4, 100 - noInjury - light);
      return [
        { id: 'none', label: '无伤', weight: noInjury, color: '#8fd14f' },
        { id: 'light', label: '轻伤', weight: light, color: '#ffa500' },
        { id: 'heavy', label: '重伤', weight: heavy, color: '#ef5d58' }
      ];
    }

    var deathRisk = canDie ? clamp(22 - Math.floor(bodyLv * 1.4), 4, 24) : 0;
    if (state.char.hpStatus === '重伤' && canDie) {
      deathRisk = clamp(deathRisk + 8, 6, 30);
    }
    var heavyLoss = clamp(44 - bodyLv * 2, 16, 48);
    var lightLoss = Math.max(20, 100 - heavyLoss - deathRisk);
    var slices = [
      { id: 'light', label: '轻伤', weight: lightLoss, color: '#ffa500' },
      { id: 'heavy', label: '重伤', weight: heavyLoss, color: '#ef5d58' }
    ];
    if (deathRisk > 0) {
      slices.push({ id: 'dead', label: '死亡', weight: deathRisk, color: '#64748b' });
    }
    return slices;
  }

  function buildGrowthSlices(state) {
    var mode = DATA.MODES[state.modeId] || DATA.MODES.normal;
    var talent = state.char.attrs.talent;
    var yesPct = clamp(24 + talent * 6 + mode.growthBonus, 18, 94);
    return [
      { id: 'yes', label: '是', weight: yesPct, color: '#2ac19a' },
      { id: 'no', label: '否', weight: 100 - yesPct, color: '#64748b' }
    ];
  }

  function describeWheelForStep(state) {
    var step = getActiveStep(state);
    var char = state.char;

    if (step.type === 'identity') {
      return {
        title: '穿越后的初始身份',
        subtag: '初始降生 · 第 ' + (state.stepCount + 1) + ' 轮',
        explain: '决定你穿越进咒术世界时的根源身份与初始阵营。',
        slices: getSliceColors(DATA.IDENTITIES)
      };
    }

    if (step.type === 'shikigami_auto') {
      return {
        title: DATA.SHIKIGAMI_SUB_BRANCHES.autonomous.title,
        subtag: '式神特性 · 意识判定',
        explain: '决定式神是否具有自我意识与独立判断能力。',
        slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.autonomous.slices)
      };
    }

    if (step.type === 'birth_era') {
      return {
        title: char.identityId === 'shikigami' ? '从什么时期开始活跃' : '出生 / 活跃时期',
        subtag: '时代坐标 · 决定后续剧情线',
        explain: '选中平安或江户时代可在古代历练后再跨越至现代正传。',
        slices: getSliceColors(DATA.BIRTH_ERA_SLICES)
      };
    }

    if (step.type === 'birthplace') {
      return {
        title: '出生地点',
        subtag: char.birthEraLabel,
        explain: '日本本土更容易卷入御三家与高专核心事件。',
        slices: getSliceColors(DATA.BIRTHPLACE_SLICES)
      };
    }

    if (step.type === 'lineage') {
      return {
        title: '出身家世 / 背景',
        subtag: char.identityName,
        explain: '御三家血脉将附带初始属性微调与家传术法倾向。',
        slices: getSliceColors(DATA.SORCERER_LINEAGES)
      };
    }

    if (step.type === 'shikigami_body') {
      return {
        title: DATA.SHIKIGAMI_SUB_BRANCHES.bodyType.title,
        subtag: '式神形态构建',
        explain: '决定你的式神外在形态大类。',
        slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.bodyType.slices)
      };
    }

    if (step.type === 'shikigami_subform') {
      var list = DATA.SHIKIGAMI_SUB_BRANCHES.subForm[step.bodyTypeId] || DATA.SHIKIGAMI_SUB_BRANCHES.subForm.avian;
      return {
        title: '式神·细分形态',
        subtag: '式神姿态微调',
        explain: '进一步固定式神的具体外形特征。',
        slices: getSliceColors(list)
      };
    }

    if (step.type === 'technique') {
      var pool = DATA.TECHNIQUES_BY_IDENTITY[char.identityId] || DATA.TECHNIQUES_BY_IDENTITY.sorcerer;
      return {
        title: char.identityId === 'shikigami' ? '式神·特殊机制' : '生得术式 / 核心天赋',
        subtag: char.identityName + ' · 核心机制',
        explain: '核心术式与机制会直接提升你的基础战力与剧情分支表现。',
        slices: getSliceColors(pool)
      };
    }

    if (step.type === 'shikigami_master') {
      var isAncient = char.birthEraId === 'heian' || char.birthEraId === 'edo400';
      var masters = isAncient ? DATA.SHIKIGAMI_SUB_BRANCHES.mastersAncient : DATA.SHIKIGAMI_SUB_BRANCHES.mastersModern;
      return {
        title: char.birthEraLabel + '·式神御主',
        subtag: '主从契约缔结',
        explain: '式神在故事早期追随的御主决定了你的阵营起点。',
        slices: getSliceColors(masters)
      };
    }

    if (step.type === 'shikigami_supply') {
      return {
        title: '御主供能·' + (char.master || '御主'),
        subtag: '契约出力倍率',
        explain: '供能比例越高，你实战中的综合战力倍率越强。',
        slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.supplyRates)
      };
    }

    if (step.type === 'shikigami_bond') {
      return {
        title: '与' + (char.master || '御主') + '的关系',
        subtag: '契约信任度',
        explain: '影响双方的配合度及遭遇危局时的态度。',
        slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.bonds)
      };
    }

    if (step.type === 'grade') {
      var gradePool = char.identityId === 'civilian' && char.techniquePower === 0
        ? DATA.GRADE_WHEELS.civilian
        : DATA.GRADE_WHEELS.standard;
      return {
        title: char.identityName + '·官方评级',
        subtag: '实力定阶',
        explain: '咒术界或高层给出的正式危险/实力等级评估。',
        slices: getSliceColors(gradePool)
      };
    }

    if (step.type === 'attr') {
      var wheelDef = DATA.ATTRIBUTE_WHEELS[step.index];
      return {
        title: wheelDef.title,
        subtag: '十项核心属性 (' + (step.index + 1) + ' / 9)',
        explain: getAttrDesc(wheelDef.attr).desc,
        slices: getSliceColors(wheelDef.slices)
      };
    }

    if (step.type === 'cross_era') {
      return {
        title: char.identityName + '·' + DATA.CROSS_ERA_WHEEL.title,
        subtag: '跨越千百年的存续',
        explain: '决定你如何从古代熬过漫长岁月进入现代主线。',
        slices: getSliceColors(DATA.CROSS_ERA_WHEEL.slices)
      };
    }

    if (step.type === 'shibuya_gojo_seal') {
      return {
        title: '涩谷事变·五条是否被封印',
        subtag: '世界线核心分歧点',
        explain: '原著高概率世界线（96% 被封印，4% 突发改写避免封印）。',
        slices: [
          { id: true, label: '是（狱门疆封印）', weight: 96, color: '#ef5d58' },
          { id: false, label: '否（未被封印！）', weight: 4, color: '#29bce8' }
        ]
      };
    }

    if (step.type === 'sukuna_vessel') {
      return {
        title: '宿傩选择的新容器',
        subtag: '死灭回游转折点',
        explain: '决定终局前宿傩霸占的肉身容器。',
        slices: [
          { label: '伏黑惠', weight: 78, color: '#3d7ae8' },
          { label: '虎杖悠仁（未转移）', weight: 14, color: '#ef5d58' },
          { label: '未知黑马容器', weight: 8, color: '#7b4ce2' }
        ]
      };
    }

    if (step.type === 'era_pick') {
      var eventPool = step.eraId === 'shibuya'
        ? (char.faction === 'evil' ? DATA.ERA_EVENTS.shibuya_evil : DATA.ERA_EVENTS.shibuya_good)
        : DATA.ERA_EVENTS[step.eraId];
      if (!step.chosenEvent) {
        var evIdx = Math.floor(Math.random() * eventPool.length);
        step.chosenEvent = eventPool[evIdx];
      }
      var chosenEvent = step.chosenEvent;
      return {
        title: chosenEvent.choiceTitle,
        subtag: chosenEvent.title,
        explain: chosenEvent.intro,
        slices: getSliceColors(chosenEvent.choices),
        eventMeta: chosenEvent
      };
    }

    if (step.type === 'fight_outcome') {
      return {
        title: '对战 ' + step.encounter.enemyName + ' · 胜负',
        subtag: step.eraLabel + ' · 动态战力判定',
        explain: '根据你当前战力（' + getPowerBreakdown(char) + '）与对手实力（' + step.encounter.enemyPower + '）实时计算胜率。',
        slices: buildFightSlices(state, step.encounter.enemyPower)
      };
    }

    if (step.type === 'fight_injury') {
      return {
        title: '战后伤势判定',
        subtag: '对战 ' + step.encounter.enemyName + (step.won ? ' 获胜' : ' 失利'),
        explain: '你的体质（' + getRankMeta(char.attrs.body).code + '）显著降低重伤与死亡概率。',
        slices: buildInjurySlices(state, step.won, step.canDie)
      };
    }

    if (step.type === 'heavy_impact') {
      return {
        title: '重伤影响判定',
        subtag: '身体创伤后续',
        explain: '重伤可能导致部分核心属性下滑，或靠顽强斗志撑住。',
        slices: [
          { id: 'ceTotal', label: '咒力总量受损（-1）', weight: 32, color: '#ef5d58' },
          { id: 'body', label: '体质暗伤残留（-1）', weight: 28, color: '#ffa500' },
          { id: 'hold', label: '咬牙挺过未留暗伤', weight: 40, color: '#2ac19a' }
        ]
      };
    }

    if (step.type === 'growth_check') {
      var talentCode = getRankMeta(char.attrs.talent).code;
      return {
        title: '是否成长 · ' + talentCode + '天赋',
        subtag: '战后突破判定',
        explain: '天赋等级越高，历战后实现突破提升的概率越高。',
        slices: buildGrowthSlices(state)
      };
    }

    if (step.type === 'growth_focus') {
      return {
        title: '本次淬炼与突破方向',
        subtag: '战力蜕变',
        explain: '随机强化体质、咒核或领悟「反转术式」「黑闪」「领域展开」。',
        slices: [
          { id: 'bodyTrain', label: '躯体淬炼（体质/体术+1）', weight: 30, color: '#ef5d58' },
          { id: 'ceCondense', label: '咒核凝实（总量/效率+1）', weight: 28, color: '#29bce8' },
          { id: 'techniqueDeep', label: '术式精研（反转/控制+1）', weight: 26, color: '#7b4ce2' },
          { id: 'domainAwake', label: '极限悟道（领域或咒具突破）', weight: 16, color: '#ffa500' }
        ]
      };
    }

    if (step.type === 'final_reputation') {
      var repList = DATA.REPUTATION_BY_FACTION[char.faction] || DATA.REPUTATION_BY_FACTION.neutral;
      return {
        title: '最终声望定格',
        subtag: '世人对这一生的评价',
        explain: '根据你生前所属立场与行迹揭晓最终名声。',
        slices: getSliceColors(repList)
      };
    }

    return {
      title: '命运分支',
      subtag: '旅程推进',
      explain: '',
      slices: [{ label: '继续', weight: 100, color: '#2ac19a' }]
    };
  }

  function applyStatDelta(char, key, delta) {
    var next = clamp((char.attrs[key] || 0) + delta, 0, DATA.RANK_SCALE.length - 1);
    char.attrs[key] = next;
    return getRankMeta(next).code;
  }

  function pushTimeline(state, wheelTitle, resultLabel, effectText) {
    state.char.timeline.push({
      step: state.stepCount,
      era: state.char.currentEraLabel,
      wheelTitle: wheelTitle,
      result: resultLabel,
      effect: effectText || ''
    });
  }

  function applySpinOutcome(state, slice) {
    state.prevSnapshot = cloneState({
      stepCount: state.stepCount,
      stepQueue: state.stepQueue,
      char: state.char,
      currentView: state.currentView,
      lastResultText: state.lastResultText,
      lastEffectText: state.lastEffectText
    });
    state.canRerollLast = true;

    var wheelInfo = describeWheelForStep(state);
    var step = state.stepQueue.shift();
    var char = state.char;
    state.stepCount += 1;
    var effectText = '';

    if (step.type === 'identity') {
      char.identityId = slice.id;
      char.identityName = slice.label;
      char.faction = slice.faction;
      effectText = slice.desc;

      var setup = [];
      if (slice.id === 'shikigami') {
        setup.push(
          { type: 'shikigami_auto' },
          { type: 'birth_era' },
          { type: 'birthplace' },
          { type: 'shikigami_body' },
          { type: 'technique' },
          { type: 'shikigami_master' },
          { type: 'shikigami_supply' },
          { type: 'shikigami_bond' },
          { type: 'grade' }
        );
      } else if (slice.id === 'sorcerer') {
        setup.push(
          { type: 'birth_era' },
          { type: 'birthplace' },
          { type: 'lineage' },
          { type: 'technique' },
          { type: 'grade' }
        );
      } else {
        setup.push(
          { type: 'birth_era' },
          { type: 'birthplace' },
          { type: 'technique' },
          { type: 'grade' }
        );
      }
      for (var i = 0; i < DATA.ATTRIBUTE_WHEELS.length; i++) {
        setup.push({ type: 'attr', index: i });
      }
      setup.push({ type: 'radar', stage: 'initial', title: '初始能力面板' });
      state.stepQueue = setup.concat(state.stepQueue);

    } else if (step.type === 'shikigami_auto') {
      effectText = slice.id ? '式神具备独立自我判断能力' : '严格听令于御主号令行动';
      char.shikigamiDesc = slice.id ? '自律式神' : '受命式神';

    } else if (step.type === 'birth_era') {
      char.birthEraId = slice.id;
      char.birthEraLabel = slice.label;
      char.currentEraId = slice.id;
      char.currentEraLabel = slice.label;
      effectText = '即将从「' + slice.label + '」展开你的人生';
      var eraSteps = buildEraQueue(slice.id, state.modeId);
      state.stepQueue = state.stepQueue.concat(eraSteps);

    } else if (step.type === 'birthplace') {
      char.birthplace = slice.label;
      effectText = slice.note;

    } else if (step.type === 'lineage') {
      char.lineage = slice.label;
      if (slice.skill && char.skills.indexOf(slice.skill) === -1) {
        char.skills.push(slice.skill);
      }
      if (slice.buff) {
        if (slice.buff.taijutsu) applyStatDelta(char, 'taijutsu', slice.buff.taijutsu);
        if (slice.buff.ceControl) applyStatDelta(char, 'ceControl', slice.buff.ceControl);
        if (slice.buff.ceEfficiency) applyStatDelta(char, 'ceEfficiency', slice.buff.ceEfficiency);
        if (slice.buff.talent) applyStatDelta(char, 'talent', slice.buff.talent);
        if (slice.buff.iq) applyStatDelta(char, 'iq', slice.buff.iq);
      }
      effectText = '获得家族底蕴：' + (slice.skill || slice.label);

    } else if (step.type === 'shikigami_body') {
      char.shikigamiDesc = slice.label;
      effectText = '选定形态大类，接下来细化具体形象';
      state.stepQueue.unshift({ type: 'shikigami_subform', bodyTypeId: slice.id });

    } else if (step.type === 'shikigami_subform') {
      char.shikigamiDesc = (char.shikigamiDesc || '式神') + ' · ' + slice.label;
      effectText = '确定具体式神外观：' + char.shikigamiDesc;

    } else if (step.type === 'technique') {
      char.technique = slice.label;
      char.techniquePower = slice.power || 6;
      if (slice.label && slice.id !== 'none' && char.skills.indexOf(slice.label) === -1) {
        char.skills.push(slice.label);
      }
      effectText = slice.desc || '生得术式已锁定';

    } else if (step.type === 'shikigami_master') {
      char.master = slice.id;
      char.faction = slice.faction || char.faction;
      effectText = '你的初始御主是 ' + slice.label;

    } else if (step.type === 'shikigami_supply') {
      char.masterSupplyMult = slice.mult || 1;
      char.masterSupplyLabel = slice.label;
      effectText = '供能系数调整为 ×' + char.masterSupplyMult.toFixed(2);

    } else if (step.type === 'shikigami_bond') {
      char.masterBondLabel = slice.label;
      effectText = '与御主羁绊确立：' + slice.label;

    } else if (step.type === 'grade') {
      char.officialGrade = slice.id;
      char.gradeBonus = slice.bonus;
      effectText = '当前官方评定等级：' + slice.id;

    } else if (step.type === 'attr') {
      var wDef = DATA.ATTRIBUTE_WHEELS[step.index];
      char.attrs[wDef.attr] = slice.level;
      if (wDef.attr === 'morality' && char.identityId !== 'shikigami') {
        if (slice.level >= 6) char.faction = 'good';
        else if (slice.level <= 3) char.faction = 'evil';
      }
      effectText = wDef.title + ' 定级为 ' + getRankMeta(slice.level).code;

    } else if (step.type === 'cross_era') {
      if (slice.preserved) {
        char.flags.preservedToFuture = true;
      }
      if (char.identityId === 'shikigami' && slice.id === 'sealSleep') {
        char.master = '羂索（现代受契）';
        char.faction = 'evil';
      }
      char.currentEraLabel = '跨越时代苏醒';
      effectText = slice.effect;

    } else if (step.type === 'shibuya_gojo_seal') {
      char.flags.gojoSealed = Boolean(slice.id);
      char.currentEraId = 'shibuya';
      char.currentEraLabel = '涩谷事变';
      if (char.flags.gojoSealed) {
        char.flags.nanamiDead = true;
        effectText = '狱门疆开启，最强被封印，涩谷陷入全面混战！';
      } else {
        effectText = '奇迹发生！五条悟未被封印，涩谷危机提前大幅改写！';
      }

    } else if (step.type === 'sukuna_vessel') {
      char.flags.sukunaVessel = slice.label;
      char.currentEraId = 'culling';
      char.currentEraLabel = '死灭回游';
      effectText = '宿傩最新受肉容器锁定为：' + slice.label;

    } else if (step.type === 'era_pick') {
      var eraObj = DATA.ERAS.find(function (e) { return e.id === step.eraId; });
      if (eraObj) {
        char.currentEraId = eraObj.id;
        char.currentEraLabel = eraObj.short;
      }
      if (slice.action === 'fight') {
        effectText = '爆发冲突！即将对战「' + slice.enemyName + '」';
        state.stepQueue.unshift({
          type: 'fight_outcome',
          eraLabel: char.currentEraLabel,
          encounter: slice
        });
      } else {
        if (slice.statUp) {
          applyStatDelta(char, slice.statUp, 1);
        }
        effectText = slice.effectText || '平安度过当前事件';
      }

    } else if (step.type === 'fight_outcome') {
      var won = slice.id === 'win';
      var myPower = getPowerBreakdown(char);
      var enemyPower = step.encounter.enemyPower;
      var bfChance = clamp(0.12 + char.attrs.ceControl * 0.025 + (char.skills.indexOf('黑闪领悟') >= 0 ? 0.14 : 0), 0.1, 0.55);
      var hitBF = Math.random() < bfChance;

      if (won) {
        char.statsLog.wins += 1;
        if (enemyPower - myPower >= 6) {
          char.statsLog.beatStronger = true;
        }
        char.statsLog.defeatedEnemies.push(step.encounter.defeatsKey || step.encounter.enemyName);
        if (step.encounter.savesNanami) {
          char.flags.nanamiDead = false;
        }
        if (step.encounter.rewardSkill && char.skills.indexOf(step.encounter.rewardSkill) === -1) {
          char.skills.push(step.encounter.rewardSkill);
        }
        if (step.encounter.rewardTool && char.tools.indexOf(step.encounter.rewardTool) === -1) {
          char.tools.push(step.encounter.rewardTool);
        }
      } else {
        char.statsLog.losses += 1;
        if (myPower - enemyPower >= 6) {
          char.statsLog.lostToWeaker = true;
        }
      }

      if (hitBF) {
        char.statsLog.blackFlashes += 1;
        if (char.skills.indexOf('黑闪领悟') === -1) {
          char.skills.push('黑闪领悟');
        }
      }

      effectText = (won ? '击败 ' + step.encounter.enemyName : '不敌 ' + step.encounter.enemyName) +
        (hitBF ? ' · 本战打出「黑闪」！（经验大涨）' : '');

      state.stepQueue.unshift({
        type: 'fight_injury',
        won: won,
        canDie: Boolean(step.encounter.canDie || step.eraLabel === '新宿决战'),
        encounter: step.encounter
      });

    } else if (step.type === 'fight_injury') {
      if (slice.id === 'dead') {
        char.hpStatus = '已故';
        char.flags.killedInAction = true;
        effectText = '你在这一战力竭战死，人生提前迎来终局结算。';
        state.stepQueue = [
          { type: 'final_reputation' },
          { type: 'radar', stage: 'final', title: '最终能力面板' },
          { type: 'settlement' }
        ];
      } else {
        if (!step.won && step.canDie) {
          char.statsLog.survivedDeath += 1;
        }
        if (slice.id === 'heavy') {
          char.hpStatus = '重伤';
          char.statsLog.heavyInjuries += 1;
          effectText = '身负重伤，需判定是否留下暗伤影响';
          state.stepQueue.unshift({ type: 'growth_check' });
          state.stepQueue.unshift({ type: 'heavy_impact' });
        } else if (slice.id === 'light') {
          char.hpStatus = '轻伤';
          effectText = '仅受轻伤无碍大局，进入战后天赋成长判定';
          state.stepQueue.unshift({ type: 'growth_check' });
        } else {
          char.hpStatus = '健康';
          effectText = '毫发无伤大胜归来，进入战后天赋成长判定';
          state.stepQueue.unshift({ type: 'growth_check' });
        }
      }

    } else if (step.type === 'heavy_impact') {
      if (slice.id === 'ceTotal' || slice.id === 'body') {
        var newLv = applyStatDelta(char, slice.id, -1);
        effectText = (slice.id === 'ceTotal' ? '咒力总量受损降至 ' : '体质暗伤降至 ') + newLv;
      } else {
        effectText = '伤势逐渐愈合，未留下永久战力折损';
      }

    } else if (step.type === 'growth_check') {
      if (slice.id === 'yes') {
        effectText = '触发战后成长！即将抽取具体淬炼提升方向';
        state.stepQueue.unshift({ type: 'growth_focus' });
      } else {
        effectText = '本战暂未触及极限突破，继续前行';
      }

    } else if (step.type === 'growth_focus') {
      char.statsLog.growthCount += 1;
      if (slice.id === 'bodyTrain') {
        var r1 = applyStatDelta(char, 'body', 1);
        var r2 = applyStatDelta(char, 'taijutsu', 1);
        effectText = '体质升至 ' + r1 + '，体术升至 ' + r2 + '！';
      } else if (slice.id === 'ceCondense') {
        var c1 = applyStatDelta(char, 'ceTotal', 1);
        var c2 = applyStatDelta(char, 'ceEfficiency', 1);
        effectText = '咒力总量升至 ' + c1 + '，效率升至 ' + c2 + '！';
      } else if (slice.id === 'techniqueDeep') {
        var c3 = applyStatDelta(char, 'ceControl', 1);
        if (char.skills.indexOf('反转术式') === -1) {
          char.skills.push('反转术式');
          char.hpStatus = '健康';
          effectText = '领悟「反转术式」并恢复伤势！咒力操纵升至 ' + c3;
        } else {
          effectText = '术式运用更加炉火纯青，咒力操纵升至 ' + c3;
        }
      } else {
        if (char.domain === '尚未掌握领域展开') {
          char.domain = DATA.DOMAIN_NAMES[Math.floor(Math.random() * DATA.DOMAIN_NAMES.length)];
          effectText = '顿悟境界！成功开启「' + char.domain + '」';
        } else {
          var tool = DATA.CURSED_TOOLS[Math.floor(Math.random() * DATA.CURSED_TOOLS.length)];
          if (char.tools.indexOf(tool) === -1) {
            char.tools.push(tool);
          }
          applyStatDelta(char, 'talent', 1);
          effectText = '获得高阶咒具「' + tool + '」，天赋进一步升华！';
        }
      }

    } else if (step.type === 'final_reputation') {
      char.attrs.reputation = slice.level;
      char.currentEraLabel = '尘埃落定';
      effectText = '终局声望确立为：' + slice.label;
    }

    pushTimeline(state, wheelInfo.title, slice.label, effectText);
    state.lastResultText = slice.label;
    state.lastEffectText = effectText;

    // 检查下一步是不是非转盘节点（雷达图或结算）
    var nextStep = state.stepQueue[0];
    if (nextStep && nextStep.type === 'radar') {
      state.stepQueue.shift();
      state.currentView = 'radar';
      state.pendingRadar = nextStep;
      state.canRerollLast = false;
    } else if (nextStep && nextStep.type === 'settlement') {
      state.stepQueue.shift();
      state.currentView = 'settlement';
      state.finished = true;
      state.canRerollLast = false;
    } else {
      state.currentView = 'wheel';
    }

    return {
      resultLabel: slice.label,
      effectText: effectText
    };
  }

  function continueAfterRadar(state) {
    state.pendingRadar = null;
    var nextStep = state.stepQueue[0];
    if (nextStep && nextStep.type === 'settlement') {
      state.stepQueue.shift();
      state.currentView = 'settlement';
      state.finished = true;
    } else {
      state.currentView = 'wheel';
      state.lastResultText = '准备就绪';
      state.lastEffectText = '点击下方按钮继续转动命运转盘';
    }
  }

  function rerollLastSpin(state) {
    if (!state.prevSnapshot || !state.canRerollLast) {
      return false;
    }
    var snap = state.prevSnapshot;
    state.stepCount = snap.stepCount;
    state.stepQueue = snap.stepQueue;
    state.char = snap.char;
    state.currentView = snap.currentView;
    state.lastResultText = snap.lastResultText;
    state.lastEffectText = '已使用 1 命运点改命！请重新转动当前轮盘';
    state.canRerollLast = false;
    state.prevSnapshot = null;
    return true;
  }

  function evaluateSettlement(state) {
    var char = state.char;
    var attrs = char.attrs;
    var log = char.statsLog;
    var flags = char.flags;
    var traits = [];

    function addTrait(name, score, desc) {
      traits.push({ name: name, score: score, desc: desc });
    }

    // 统计属性结构
    var attrKeys = ['taijutsu', 'body', 'ceTotal', 'ceControl', 'ceEfficiency', 'iq', 'talent', 'looks', 'morality'];
    var exCount = 0;
    var combatVals = [attrs.taijutsu, attrs.body, attrs.ceTotal, attrs.ceControl, attrs.ceEfficiency];
    var maxC = Math.max.apply(null, combatVals);
    var minC = Math.min.apply(null, combatVals);
    for (var i = 0; i < attrKeys.length; i++) {
      if (attrs[attrKeys[i]] >= 10) exCount++;
    }

    if (log.beatStronger) {
      addTrait('以下克上', +5, '战胜至少一名强于自己的敌人');
    }
    if ((char.birthEraId === 'heian' || char.birthEraId === 'edo400') && !flags.killedInAction) {
      addTrait('活化石', +8, '从千年前或四百年前开始活动，并一路抵达六十八年后');
    }
    if (flags.preservedToFuture) {
      addTrait('封存到未来', +5, '经封存、沉睡或咒物化跨越时代，并在后世苏醒');
    }
    if (char.faction === 'evil' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('乱世枭雄', +6, '保持恶方立场、赢下至少四场战斗并活到结算');
    }
    if (char.faction === 'good' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('正道脊梁', +6, '坚守正道立场、赢下至少四场强敌并护世到最后');
    }
    if (log.wins >= 5) {
      addTrait('旗开得胜', +4, '累计胜场达到 5 场以上（总胜 ' + log.wins + '）');
    } else if (log.wins >= 3) {
      addTrait('身经百战', +2, '在多个时代留下傲人胜绩');
    }
    if (exCount >= 2) {
      addTrait('双绝以上', +5, '最终达到 EX 级别的核心属性数量 ≥ 2');
    }
    if (attrs.ceEfficiency >= 10) {
      addTrait('滴水不漏', +4, '咒力效率抵达 EX 级规格之外水准');
    }
    if (attrs.body >= 10) {
      addTrait('金刚不坏', +4, '体质淬炼至 EX 级，生死线上屹立不倒');
    }
    if (char.domain !== '尚未掌握领域展开') {
      addTrait('领域主宰', +5, '成功在实战淬炼中掌握高阶「' + char.domain + '」');
    }
    if (log.defeatedEnemies.indexOf('choso') >= 0) {
      addTrait('赤血断流', +6, '在涩谷或激战中成功击败胀相');
    }
    if (log.defeatedEnemies.indexOf('dabura') >= 0) {
      addTrait('超光速之外', +8, '在六十八年后的对决中击败传说强敌达布拉');
    }
    if (log.blackFlashes >= 2) {
      addTrait('黑闪眷顾', +5, '全生涯至少两次触发灵魂共振的黑闪一击');
    }
    if (log.survivedDeath > 0 && !flags.killedInAction) {
      addTrait('大难不死', +4, '曾正面经历濒死战败判定却成功苟活下来');
    }
    if (flags.gojoSealed === false) {
      addTrait('世界线观测者', +7, '亲历 4% 奇迹世界线：五条悟在涩谷未被封印');
    }

    // 负面/整活词条
    if (log.lostToWeaker) {
      addTrait('区', -4, '至少一次被综合战力弱于自己的对手击倒');
    }
    if ((log.wins + log.losses) >= 5 && log.blackFlashes === 0) {
      addTrait('黑闪绝缘体', -3, '经历至少五场以上激烈战斗却一次黑闪都没打出');
    }
    if (maxC - minC >= 7) {
      addTrait('极端加点', -5, '五维战斗属性存在至少 7 阶的巨大短板与落差');
    }
    if (flags.nanamiDead && !flags.killedInAction) {
      addTrait('最后的加班', -3, '见证涩谷事变惨烈牺牲，七海建人未能幸免');
    }
    if (flags.killedInAction) {
      addTrait('英年早逝 / 半途折戟', -6, '未能跨越终局战线，中途战死于命运转盘之上');
    }
    if (attrs.ceControl === 0 || attrs.iq === 0) {
      addTrait('幽默属性', -3, '带着「E-」级别离谱短板闯荡整个咒术世界');
    }

    if (traits.length === 0) {
      addTrait('平平淡淡才是真', +2, '在风云变幻的咒术时代安稳走完人生全程');
    }

    var baseBonus = Math.round(getPowerBreakdown(char) * 0.16);
    var traitsSum = traits.reduce(function (sum, t) { return sum + t.score; }, 0);
    var totalScore = baseBonus + traitsSum;

    var posCount = traits.filter(function (t) { return t.score >= 0; }).length;
    var negCount = traits.filter(function (t) { return t.score < 0; }).length;

    var quality = '平庸';
    if (totalScore >= 52) quality = '传说神迹';
    else if (totalScore >= 40) quality = '史诗绝伦';
    else if (totalScore >= 26) quality = '精良';
    else if (totalScore >= 12) quality = '尚可';
    else if (totalScore >= 0) quality = '惨淡';
    else quality = '极其幽默';

    var fateReward = Math.max(1, Math.floor(Math.max(0, totalScore) / 10) + 1);

    return {
      totalScore: totalScore,
      quality: quality,
      posCount: posCount,
      negCount: negCount,
      wins: log.wins,
      losses: log.losses,
      blackFlashes: log.blackFlashes,
      fateReward: fateReward,
      traits: traits,
      summaryLine: char.identityName + ' · ' + char.officialGrade + ' · ' + char.technique + '（综合战力 ' + getPowerBreakdown(char) + '）'
    };
  }

  global.JJK_OMEGA_ENGINE = {
    createRun: createRun,
    describeWheelForStep: describeWheelForStep,
    applySpinOutcome: applySpinOutcome,
    continueAfterRadar: continueAfterRadar,
    rerollLastSpin: rerollLastSpin,
    evaluateSettlement: evaluateSettlement,
    getRankMeta: getRankMeta,
    getPowerBreakdown: getPowerBreakdown
  };
})(window);
