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

  function getAttrDef(key) {
    for (var i = 0; i < DATA.ATTRIBUTE_DEFS.length; i++) {
      if (DATA.ATTRIBUTE_DEFS[i].key === key) return DATA.ATTRIBUTE_DEFS[i];
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
    var sumTen = a.ceTotal + a.ceControl + a.ceEfficiency + a.taijutsu + a.bodyResist +
      a.soulResist + a.barrier + a.versatility + a.iq + a.talent * 0.6;
    var hasDomain = char.skills.indexOf('领域展开') >= 0;
    var hasRct = char.skills.indexOf('反转术式') >= 0;
    var skillBonus = char.skills.length * 2.8 + (char.techniquePower || 4) + (hasDomain ? 9 : 0) + (hasRct ? 5 : 0);
    var toolBonus = (char.tools || []).reduce(function (sum, t) { return sum + (t.bonus || 3); }, 0);
    var supplyMult = char.masterSupplyMult || 1;
    var injuryPenalty = char.hpStatus === '重伤' ? 9 : char.hpStatus === '轻伤' ? 3 : 0;
    var raw = (sumTen * 0.56 + skillBonus + toolBonus + (char.gradeBonus || 2)) * supplyMult - injuryPenalty;
    return clamp(Math.round(raw), 1, 180);
  }

  function buildEraQueue(startEraId) {
    var startIdx = 0;
    for (var i = 0; i < DATA.ERAS.length; i++) {
      if (DATA.ERAS[i].id === startEraId) {
        startIdx = i;
        break;
      }
    }
    var queue = [];
    if (startEraId === 'heian' || startEraId === 'edo400') {
      queue.push({ type: 'era_count', eraId: startEraId });
      queue.push({ type: 'cross_era' });
      startIdx = 4; // 跨越后直连剧情开篇 -> 涩谷 -> 死灭回游 -> 新宿 -> 68年后
    } else if (startEraId === 'shinjuku') {
      queue.push(
        { type: 'shinjuku_prep_growth' },
        { type: 'radar', stage: 'shinjuku_prep', title: '新宿决战前能力面板' },
        { type: 'shinjuku_motive' },
        { type: 'shinjuku_sukuna_order' },
        { type: 'era_pick', eraId: 'future68' },
        { type: 'final_reputation' },
        { type: 'radar', stage: 'final', title: '最终能力面板' },
        { type: 'settlement' }
      );
      return queue;
    }

    for (var idx = startIdx; idx < DATA.ERAS.length; idx++) {
      var era = DATA.ERAS[idx];
      if (era.id === 'shibuya') {
        queue.push({ type: 'shibuya_gojo_seal' });
        queue.push({ type: 'era_count', eraId: 'shibuya' });
      } else if (era.id === 'culling') {
        queue.push({ type: 'era_count', eraId: 'culling' });
        queue.push({ type: 'sukuna_vessel' });
        queue.push({ type: 'radar', stage: 'mid', title: '死灭回游后能力面板' });
      } else if (era.id === 'shinjuku') {
        queue.push(
          { type: 'shinjuku_prep_growth' },
          { type: 'radar', stage: 'shinjuku_prep', title: '新宿决战前能力面板' },
          { type: 'shinjuku_motive' },
          { type: 'shinjuku_sukuna_order' }
        );
      } else if (era.id === 'future68') {
        queue.push({ type: 'era_pick', eraId: 'future68' });
      } else {
        queue.push({ type: 'era_pick', eraId: era.id });
      }
    }

    queue.push({ type: 'final_reputation' });
    queue.push({ type: 'radar', stage: 'final', title: '最终能力面板' });
    queue.push({ type: 'settlement' });
    return queue;
  }

  function buildInitialSetupSteps(char, preset) {
    var setup = [];
    if (char.identityId === 'shikigami') {
      setup.push({ type: 'shikigami_auto' });
      if (!preset || preset.eraId === 'random') setup.push({ type: 'birth_era' });
      setup.push({ type: 'birthplace' });
      setup.push({ type: 'shikigami_body' });
      if (!preset || preset.techId === 'random') setup.push({ type: 'technique' });
      setup.push({ type: 'shikigami_master' });
      setup.push({ type: 'shikigami_supply' });
      setup.push({ type: 'shikigami_bond' });
    } else {
      if (!preset || preset.eraId === 'random') setup.push({ type: 'birth_era' });
      setup.push({ type: 'birthplace' });
      if (!preset || preset.techId === 'random') setup.push({ type: 'technique' });
    }

    setup.push({ type: 'looks' }, { type: 'morality' }, { type: 'aggro' });

    for (var i = 0; i < DATA.ATTRIBUTE_WHEELS.length; i++) {
      var attrKey = DATA.ATTRIBUTE_WHEELS[i].attr;
      if (attrKey === 'talent' && preset && preset.talentLv !== 'random') {
        continue;
      }
      setup.push({ type: 'attr', index: i });
    }

    setup.push({ type: 'high_tech_count' });
    setup.push({ type: 'tool_count' });

    if (!preset || preset.gradeId === 'random') {
      setup.push({ type: 'grade' });
    }
    if (char.identityId !== 'shikigami') {
      setup.push({ type: 'faction' });
    }
    setup.push({ type: 'radar', stage: 'initial', title: '初始能力面板' });

    if (preset && preset.eraId !== 'random') {
      setup = setup.concat(buildEraQueue(char.birthEraId));
    }
    return setup;
  }

  function createRun(runType, customPreset) {
    var preset = runType === 'custom' ? (customPreset || {}) : null;
    var state = {
      runType: runType === 'custom' ? 'custom' : 'dream',
      stepCount: 0,
      finished: false,
      currentView: 'wheel',
      pendingRadar: null,
      lastResultText: '准备就绪',
      lastEffectText: '点击转盘或下方按钮旋转；旋转中点击任意位置可急停',
      canRerollLast: false,
      prevSnapshot: null,
      usedEventIds: [],
      boss: { active: false },
      stepQueue: [],
      char: {
        identityId: 'sorcerer',
        identityName: '未定身份',
        faction: 'neutral',
        factionLabel: '未定阵营',
        birthEraId: 'canonStart',
        birthEraLabel: '剧情开始时期',
        currentEraId: 'canonStart',
        currentEraLabel: '降生阶段',
        birthplace: '东京都市圈',
        technique: '尚未抽取',
        techniquePower: 4,
        techniqueDesc: '暂未觉醒生得术式',
        officialGrade: '未评级',
        gradeBonus: 2,
        master: null,
        masterSupplyMult: 1,
        masterSupplyLabel: '',
        masterBondLabel: '',
        shikigamiDesc: '',
        looksText: '未评定',
        moralityText: '未评定',
        aggroText: '正常',
        reputationText: '尚待结局揭晓',
        hpStatus: '健康',
        attrs: {
          ceTotal: 4,
          ceControl: 4,
          ceEfficiency: 4,
          taijutsu: 4,
          bodyResist: 4,
          soulResist: 4,
          barrier: 4,
          versatility: 4,
          iq: 4,
          talent: 4
        },
        reputationLevel: 4,
        skills: [],
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
          killedInAction: false,
          beatSukunaShinjuku: false,
          awakenedRCTInBattle: false
        },
        timeline: []
      }
    };

    if (preset && preset.identityId && preset.identityId !== 'random') {
      var idObj = DATA.IDENTITIES.find(function (x) { return x.id === preset.identityId; }) || DATA.IDENTITIES[0];
      state.char.identityId = idObj.id;
      state.char.identityName = idObj.label;
      state.char.faction = idObj.faction;
    }
    if (preset && preset.eraId && preset.eraId !== 'random') {
      var eraObj = DATA.ERAS.find(function (e) { return e.id === preset.eraId; });
      if (eraObj) {
        state.char.birthEraId = eraObj.id;
        state.char.birthEraLabel = eraObj.label;
        state.char.currentEraId = eraObj.id;
        state.char.currentEraLabel = eraObj.short;
      }
    }
    if (preset && preset.techId && preset.techId !== 'random') {
      var techObj = DATA.TECHNIQUES_ALL.find(function (t) { return t.id === preset.techId; });
      if (techObj) {
        state.char.technique = techObj.label;
        state.char.techniquePower = techObj.power;
        state.char.techniqueDesc = techObj.desc;
      }
    }
    if (preset && preset.gradeId && preset.gradeId !== 'random') {
      var grObj = DATA.GRADE_WHEELS.standard.find(function (g) { return g.id === preset.gradeId; });
      if (grObj) {
        state.char.officialGrade = grObj.id;
        state.char.gradeBonus = grObj.bonus;
      }
    }
    if (preset && preset.talentLv && preset.talentLv !== 'random') {
      state.char.attrs.talent = parseInt(preset.talentLv, 10) || 8;
    }
    if (preset && preset.perk && preset.perk !== 'random') {
      if (preset.perk === 'rct') state.char.skills.push('反转术式');
      else if (preset.perk === 'domain') state.char.skills.push('领域展开');
      else if (preset.perk === 'both') state.char.skills.push('反转术式', '领域展开', '黑闪');
    }

    if (preset && preset.identityId && preset.identityId !== 'random') {
      state.stepQueue = buildInitialSetupSteps(state.char, preset);
      state.lastResultText = '天命自定开局';
      state.lastEffectText = '已锁定自选词条（' + state.char.identityName + '），继续抽取其余属性';
    } else {
      state.customPresetPending = preset;
      state.stepQueue = [{ type: 'identity' }];
    }

    return state;
  }

  function getActiveStep(state) {
    if (!state.stepQueue || state.stepQueue.length === 0) {
      return { type: 'settlement' };
    }
    return state.stepQueue[0];
  }

  function buildFightSlices(state, enemyPower) {
    var myPower = getPowerBreakdown(state.char);
    var diff = myPower - enemyPower + (state.char.statsLog.wins > 0 ? 1 : 0);
    var prob = Math.round(100 / (1 + Math.exp(-diff / 14)));
    var winPct = clamp(prob, 8, 94);
    return [
      { id: 'win', label: '胜', weight: winPct, color: '#2ac19a' },
      { id: 'loss', label: '负', weight: 100 - winPct, color: '#ef5d58' }
    ];
  }

  function buildInjurySlices(state, won, canDie) {
    var bodyLv = state.char.attrs.bodyResist;
    var hasRct = state.char.skills.indexOf('反转术式') >= 0;
    if (won) {
      var noInj = clamp(34 + bodyLv * 4 + (hasRct ? 12 : 0), 28, 84);
      var light = clamp(100 - noInj - 6, 12, 60);
      var heavy = Math.max(4, 100 - noInj - light);
      return [
        { id: 'none', label: '毫发无伤', weight: noInj, color: '#8fd14f' },
        { id: 'light', label: '轻伤无碍', weight: light, color: '#ffa500' },
        { id: 'heavy', label: '力战重伤', weight: heavy, color: '#ef5d58' }
      ];
    }

    var deathRisk = canDie ? clamp(22 - Math.floor(bodyLv * 1.3) - (hasRct ? 6 : 0), 4, 24) : 0;
    if (state.char.hpStatus === '重伤' && canDie) deathRisk = clamp(deathRisk + 8, 6, 30);
    var rctBreakChance = !hasRct ? clamp(6 + state.char.attrs.talent + state.char.attrs.ceControl, 8, 24) : 0;
    var heavyLoss = clamp(42 - bodyLv * 2, 16, 46);
    var lightLoss = Math.max(18, 100 - heavyLoss - deathRisk - rctBreakChance);

    var slices = [
      { id: 'light', label: '轻伤突围', weight: lightLoss, color: '#ffa500' },
      { id: 'heavy', label: '重伤退避', weight: heavyLoss, color: '#ef5d58' }
    ];
    if (rctBreakChance > 0) {
      slices.push({ id: 'core_rct', label: '抓准了咒力核心！（逆转突破）', weight: rctBreakChance, color: '#29bce8' });
    }
    if (deathRisk > 0) {
      slices.push({ id: 'dead', label: '力竭战死', weight: deathRisk, color: '#64748b' });
    }
    return slices;
  }

  function buildGrowthSlices(state) {
    var talent = state.char.attrs.talent;
    var yesPct = clamp(24 + talent * 6, 20, 92);
    return [
      { id: 'yes', label: '是（触发成长突破）', weight: yesPct, color: '#2ac19a' },
      { id: 'no', label: '否（稳定消化）', weight: 100 - yesPct, color: '#64748b' }
    ];
  }

  function getAvailableHighTechSlices(char) {
    var remaining = DATA.HIGH_TECHNIQUES.filter(function (ht) {
      return char.skills.indexOf(ht.label) === -1;
    });
    if (!remaining.length) {
      return [{ id: 'mastery', label: '技巧全面圆满（全属性精进）', weight: 100 }];
    }
    return remaining;
  }

  function getPlayerBossMovesSlices(state) {
    var char = state.char;
    var list = DATA.PLAYER_BOSS_MOVES.filter(function (m) {
      if (m.requiresTool && char.tools.length === 0) return false;
      if (m.requiresSkill && char.skills.indexOf(m.requiresSkill) === -1) return false;
      return true;
    }).map(function (m) {
      var bonus = m.id === 'blackFlashHit' ? char.attrs.ceControl : 0;
      return Object.assign({}, m, { weight: m.weight + bonus });
    });
    return list;
  }

  function getSukunaBossMovesSlices(boss) {
    return DATA.SUKUNA_MOVES.filter(function (m) {
      if (m.requiresAgito && !boss.agitoAlive) return false;
      if (m.requiresMahoraga && !boss.mahoragaAlive) return false;
      return true;
    });
  }

  function describeWheelForStep(state) {
    var step = getActiveStep(state);
    var char = state.char;

    if (step.type === 'identity') {
      return { title: '穿越后的初始身份', subtag: '浮生若梦 · 第 ' + (state.stepCount + 1) + ' 轮', explain: '决定你在咒术世界降生时的根本存在形式。', slices: getSliceColors(DATA.IDENTITIES) };
    }
    if (step.type === 'shikigami_auto') {
      return { title: DATA.SHIKIGAMI_SUB_BRANCHES.autonomous.title, subtag: '式神意识设定', explain: '是否可独立脱离御主精细遥控。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.autonomous.slices) };
    }
    if (step.type === 'birth_era') {
      return { title: char.identityId === 'shikigami' ? '从什么时期开始活跃' : '活跃 / 出生时期', subtag: '时代起点坐标', explain: '决定你将跨越哪些核心原著篇章。', slices: getSliceColors(DATA.BIRTH_ERA_SLICES) };
    }
    if (step.type === 'birthplace') {
      return { title: '出生地点', subtag: char.birthEraLabel, explain: '东京/京都世家圈更易接触御三家与高专资源。', slices: getSliceColors(DATA.BIRTHPLACE_SLICES) };
    }
    if (step.type === 'shikigami_body') {
      return { title: DATA.SHIKIGAMI_SUB_BRANCHES.bodyType.title, subtag: '式神形态大类', explain: '决定式神的轮廓类别。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.bodyType.slices) };
    }
    if (step.type === 'shikigami_subform') {
      var forms = DATA.SHIKIGAMI_SUB_BRANCHES.subForm[step.bodyTypeId] || DATA.SHIKIGAMI_SUB_BRANCHES.subForm.avian;
      return { title: '式神·具体形态', subtag: char.shikigamiDesc, explain: '细化具体召唤外观。', slices: getSliceColors(forms) };
    }
    if (step.type === 'technique') {
      return { title: '生得术式 / 特殊机制（30种）', subtag: char.identityName + ' · 核心命门', explain: '决定你的招牌术式体系或天与咒缚。', slices: getSliceColors(DATA.TECHNIQUES_ALL) };
    }
    if (step.type === 'shikigami_master') {
      var masters = (char.birthEraId === 'heian' || char.birthEraId === 'edo400') ? DATA.SHIKIGAMI_SUB_BRANCHES.mastersAncient : DATA.SHIKIGAMI_SUB_BRANCHES.mastersModern;
      return { title: char.birthEraLabel + '·式神御主', subtag: '主从契约缔结', explain: '早期追随哪一位御主征战。', slices: getSliceColors(masters) };
    }
    if (step.type === 'shikigami_supply') {
      return { title: '御主供能·' + (char.master || '御主'), subtag: '咒力供应倍率', explain: '影响最终战斗数值倍率。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.supplyRates) };
    }
    if (step.type === 'shikigami_bond') {
      return { title: '与' + (char.master || '御主') + '的关系', subtag: '契约羁绊评价', explain: '决定彼此默契度。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.bonds) };
    }
    if (step.type === 'looks') {
      return { title: '穿越颜值评级', subtag: '基础外貌档案', explain: '影响部分角色互动权重。', slices: getSliceColors(DATA.LOOKS_WHEEL) };
    }
    if (step.type === 'morality') {
      return { title: '道德底线与三观', subtag: '性格倾向档案', explain: '潜移默化影响阵营偏向与事件选择。', slices: getSliceColors(DATA.MORALITY_WHEEL) };
    }
    if (step.type === 'aggro') {
      return { title: '好战程度判定', subtag: '战斗性格档案', explain: '从摸鱼厌战到“磁场颠佬”级别。', slices: getSliceColors(DATA.AGGRO_WHEEL) };
    }
    if (step.type === 'attr') {
      var aw = DATA.ATTRIBUTE_WHEELS[step.index];
      return { title: aw.title, subtag: '十维核心属性 (' + (step.index + 1) + ' / 10)', explain: aw.desc, slices: getSliceColors(aw.slices) };
    }
    if (step.type === 'high_tech_count') {
      var tLv = char.attrs.talent;
      var slices = tLv >= 8
        ? [{ label: '2项', count: 2, weight: 20 }, { label: '3项', count: 3, weight: 32 }, { label: '4项', count: 4, weight: 30 }, { label: '5项', count: 5, weight: 18 }]
        : tLv >= 5
          ? [{ label: '1项', count: 1, weight: 30 }, { label: '2项', count: 2, weight: 40 }, { label: '3项', count: 3, weight: 22 }, { label: '4项', count: 4, weight: 8 }]
          : [{ label: '0项（无高级技）', count: 0, weight: 35 }, { label: '1项', count: 1, weight: 45 }, { label: '2项', count: 2, weight: 20 }];
      return { title: '高级技巧数量 · ' + getRankMeta(tLv).code + '天赋加成', subtag: '决定能掌握几项核心秘技', explain: '天赋越高可抽中的高级技巧（领域展开/反转术式/黑闪/简易领域等）越多！', slices: getSliceColors(slices) };
    }
    if (step.type === 'high_tech_pick') {
      return { title: '第 ' + step.nth + ' 项 · 会哪个高级技巧', subtag: '共抽 ' + step.total + ' 项高级技巧', explain: '抽中领域展开或反转术式将在战局中带来压倒性优势。', slices: getSliceColors(getAvailableHighTechSlices(char)) };
    }
    if (step.type === 'tool_count') {
      var cSlices = char.techniquePower <= 4
        ? [{ label: '0件', count: 0, weight: 55 }, { label: '1件', count: 1, weight: 35 }, { label: '2件', count: 2, weight: 10 }]
        : [{ label: '0件', count: 0, weight: 22 }, { label: '1件', count: 1, weight: 44 }, { label: '2件', count: 2, weight: 24 }, { label: '3件', count: 3, weight: 10 }];
      return { title: '所持咒具数量', subtag: '武装配置', explain: '决定开局最多携带有几件专属咒具。', slices: getSliceColors(cSlices) };
    }
    if (step.type === 'tool_shape') {
      var pickedShapes = [];
      for (var sIdx = 0; sIdx < 8; sIdx++) {
        pickedShapes.push({ label: DATA.TOOL_SHAPES[(step.seed + sIdx * 3) % DATA.TOOL_SHAPES.length], weight: 12.5 });
      }
      return { title: '第 ' + step.nth + ' 件 · 咒具器形（26选抽池）', subtag: '共 ' + step.total + ' 件咒具', explain: '随机确定这件咒具的兵器外观形制。', slices: getSliceColors(pickedShapes) };
    }
    if (step.type === 'tool_effect') {
      return { title: '第 ' + step.nth + ' 件 · 「' + step.shape + '」专属特效', subtag: '咒具品质定级', explain: '抽中特级天逆系/释魂系或游云系词条威力惊人！', slices: getSliceColors(DATA.TOOL_EFFECTS) };
    }
    if (step.type === 'grade') {
      var gp = char.identityId === 'civilian' && char.techniquePower <= 2 ? DATA.GRADE_WHEELS.civilian : DATA.GRADE_WHEELS.standard;
      return { title: char.identityName + ' · 官方评级', subtag: '咒术界阶级评定', explain: '高阶官方评级直接提升临战气势与基础加权。', slices: getSliceColors(gp) };
    }
    if (step.type === 'faction') {
      var fPool = DATA.FACTION_WHEELS[char.identityId] || DATA.FACTION_WHEELS.sorcerer;
      return { title: '初始所属阵营', subtag: char.identityName + ' 立场确立', explain: '决定你在涩谷事变等重大战役中的归属站位。', slices: getSliceColors(fPool) };
    }
    if (step.type === 'era_count') {
      var eObj = DATA.ERAS.find(function (e) { return e.id === step.eraId; });
      return {
        title: (eObj ? eObj.short : step.eraId) + ' · 重大事件数量',
        subtag: '决定本时期将遭遇多少事件',
        explain: '抽取 1~2 场不重复的核心时代事件。',
        slices: getSliceColors([{ label: '1 场重大事件', count: 1, weight: 62 }, { label: '2 场连环事件', count: 2, weight: 38 }])
      };
    }
    if (step.type === 'era_pick') {
      var pool = step.eraId === 'shibuya'
        ? (char.faction === 'evil' ? DATA.ERA_EVENTS.shibuya_evil : DATA.ERA_EVENTS.shibuya_good)
        : DATA.ERA_EVENTS[step.eraId];
      if (!step.chosenEvent) {
        var unused = pool.filter(function (ev) { return state.usedEventIds.indexOf(ev.id) === -1; });
        var cand = unused.length ? unused : pool;
        step.chosenEvent = cand[Math.floor(Math.random() * cand.length)];
        state.usedEventIds.push(step.chosenEvent.id);
      }
      var ev = step.chosenEvent;
      return { title: ev.choiceTitle, subtag: ev.title, explain: ev.intro, slices: getSliceColors(ev.choices), eventMeta: ev };
    }
    if (step.type === 'cross_era') {
      return { title: char.identityName + ' · ' + DATA.CROSS_ERA_WHEEL.title, subtag: '跨越漫长岁月进入现代', explain: '古代人物跨越千百年苏醒的方式。', slices: getSliceColors(DATA.CROSS_ERA_WHEEL.slices) };
    }
    if (step.type === 'shibuya_gojo_seal') {
      return {
        title: '涩谷事变 · 五条悟是否被封印',
        subtag: '96% 原著收束 vs 4% 世界线奇迹',
        explain: '狱门疆开启瞬间决定整个现代咒术界的后续命运！',
        slices: [{ id: true, label: '是（狱门疆封印）', weight: 96, color: '#ef5d58' }, { id: false, label: '否（未被封印！）', weight: 4, color: '#29bce8' }]
      };
    }
    if (step.type === 'sukuna_vessel') {
      return {
        title: '宿傩选择的新容器',
        subtag: '死灭回游终局转折',
        explain: '决定新宿决战面对的到底是十影宿傩还是其他形态。',
        slices: [{ label: '伏黑惠', weight: 78, color: '#3d7ae8' }, { label: '虎杖悠仁（硬抗未夺舍）', weight: 14, color: '#ef5d58' }, { label: '未知黑马高天资容器', weight: 8, color: '#7b4ce2' }]
      };
    }
    if (step.type === 'fight_outcome') {
      return {
        title: '对战 ' + step.encounter.enemyName + ' · 胜负',
        subtag: step.eraLabel + ' · 实时战力判定',
        explain: '当前我方战力 ' + getPowerBreakdown(char) + ' 对手实力 ' + step.encounter.enemyPower,
        slices: buildFightSlices(state, step.encounter.enemyPower)
      };
    }
    if (step.type === 'fight_injury') {
      return { title: '战斗盘 · 战后伤势判定', subtag: step.won ? '凯旋余波' : '险境重创或突破', explain: '身体抗性决定存活与免伤概率；未习得反转时重压有几率悟出咒力核心！', slices: buildInjurySlices(state, step.won, step.canDie) };
    }
    if (step.type === 'heavy_impact') {
      return {
        title: '重伤影响判定',
        subtag: '身体创伤后续',
        explain: '是否因剧创导致基础属性暂时滑落。',
        slices: [
          { id: 'ceTotal', label: '咒力总量受损（-1）', weight: 30, color: '#ef5d58' },
          { id: 'bodyResist', label: '身体抗性受损（-1）', weight: 28, color: '#ffa500' },
          { id: 'hold', label: '意志硬抗未留永久暗伤', weight: 42, color: '#2ac19a' }
        ]
      };
    }
    if (step.type === 'growth_check') {
      return { title: '战后是否成长 · ' + getRankMeta(char.attrs.talent).code + '天赋', subtag: '实战历练突破判定', explain: '天赋越强，战斗后进化升级越频繁！', slices: buildGrowthSlices(state) };
    }
    if (step.type === 'growth_focus') {
      return {
        title: '本次淬炼方向',
        subtag: '战力蜕变强化',
        explain: '增强身体、咒核，或顺势领悟反转术式 / 领域展开！',
        slices: [
          { id: 'bodyTrain', label: '躯体淬炼（体术/身抗 +1）', weight: 30, color: '#ef5d58' },
          { id: 'ceCondense', label: '咒核凝实（总量/效率 +1）', weight: 28, color: '#29bce8' },
          { id: 'soulBarrier', label: '结界神魂（灵魂抗性/结界 +1）', weight: 24, color: '#7b4ce2' },
          { id: 'skillAwake', label: '绝境悟道（领悟新高级技巧！）', weight: 18, color: '#ffa500' }
        ]
      };
    }

    // ==================== 新宿决战 · 宿傩回合制专属轮盘 ====================
    if (step.type === 'shinjuku_prep_growth') {
      return { title: '决战准备期 · 战前特训成长', subtag: '人外魔境新宿决战前夕', explain: '一个月准备期内再获得一次全盘强化或新技巧。', slices: getSliceColors(DATA.SHINJUKU_PREP_GROWTH) };
    }
    if (step.type === 'shinjuku_motive') {
      return { title: '新宿决战 · 为何参战', subtag: '决战出征宣言', explain: '你的信念决定关键回合的爆发倾斜。', slices: getSliceColors(DATA.SHINJUKU_MOTIVES) };
    }
    if (step.type === 'shinjuku_sukuna_order') {
      return { title: '决战对战宿傩顺序', subtag: '决定交锋宿傩哪一阶段形态', explain: '五条前全盛十影、协同五条双打、五条后残血或原身完全体！', slices: getSliceColors(DATA.SHINJUKU_SUKUNA_ORDERS) };
    }
    if (step.type === 'boss_player_count') {
      var bonusMoves = char.attrs.taijutsu >= 8 ? 1 : 0;
      return {
        title: '战斗盘 · 出招数 · 主角（第 ' + state.boss.round + ' 回合）',
        subtag: '决定本回合你能抢出几记猛攻',
        explain: '体术/速度越高出招次数上限越高，累积我方总战斗值。',
        slices: getSliceColors([
          { label: (2 + bonusMoves) + ' 招', count: 2 + bonusMoves, weight: 24 },
          { label: (3 + bonusMoves) + ' 招', count: 3 + bonusMoves, weight: 40 },
          { label: (4 + bonusMoves) + ' 招', count: 4 + bonusMoves, weight: 26 },
          { label: (5 + bonusMoves) + ' 招（全力压上！）', count: 5 + bonusMoves, weight: 10 }
        ])
      };
    }
    if (step.type === 'boss_player_move') {
      return {
        title: '战斗盘 · 主角出招（第 ' + step.nth + '/' + step.total + ' 招）',
        subtag: state.boss.enemyTitle + ' · 战值累积中',
        explain: '注意！已被魔虚罗适应的招式会遭 -30% ~ -100% 减伤削弱！',
        slices: getSliceColors(getPlayerBossMovesSlices(state))
      };
    }
    if (step.type === 'boss_gojo_move') {
      return {
        title: '战斗盘 · 五条悟协同出招',
        subtag: '不可侵护盾剩 ' + state.boss.infinityBlocks + ' 次',
        explain: '若五条悟顺利展开【无量空处】，将直接强行削减宿傩本回合行动次数！',
        slices: getSliceColors(DATA.GOJO_BOSS_MOVES)
      };
    }
    if (step.type === 'boss_uv_effect') {
      return {
        title: '无量空处 · 信息灌入程度',
        subtag: '五条悟领域必中控制判定',
        explain: '直接削减宿傩即将打出的行动轮次！',
        slices: getSliceColors(DATA.GOJO_UV_EFFECTS)
      };
    }
    if (step.type === 'boss_enemy_count') {
      return {
        title: '战斗盘 · 出招数 · ' + state.boss.enemyTitle,
        subtag: state.boss.sukunaStun > 0 ? '无量空处眩晕：宿傩减少 ' + state.boss.sukunaStun + ' 招！' : '敌方反扑攻势次数判定',
        explain: '包含宿傩本体斩击、嵌合兽颚吐与魔虚罗退魔之剑。',
        slices: getSliceColors([
          { label: '2 招（喘息间隙）', count: 2, weight: 22 },
          { label: '3 招（稳步反攻）', count: 3, weight: 38 },
          { label: '4 招（猛烈压迫）', count: 4, weight: 28 },
          { label: '5 招（全火力狂轰）', count: 5, weight: 12 }
        ])
      };
    }
    if (step.type === 'boss_enemy_move') {
      return {
        title: '战斗盘 · ' + state.boss.enemyTitle + ' 出招（第 ' + step.nth + '/' + step.total + ' 招）',
        subtag: '防备「解/捌/开/伏魔御厨子/世界斩」',
        explain: '若有五条悟【不可侵】保护将自动挡下直击；无则累积敌方战斗总值。',
        slices: getSliceColors(getSukunaBossMovesSlices(state.boss))
      };
    }
    if (step.type === 'boss_counter_check') {
      var barBonus = char.attrs.barrier + (char.skills.indexOf('简易领域') >= 0 ? 3 : 0) + (char.skills.indexOf('领域展延') >= 0 ? 3 : 0);
      var bigPct = clamp(15 + barBonus * 2, 16, 48);
      var midPct = clamp(36, 20, 48);
      var failPct = Math.max(12, 100 - bigPct - midPct);
      return {
        title: '战斗盘 · 主角抵消敌方招式',
        subtag: '以简易领域 / 展延 / 咒具硬吃消解',
        explain: '成功抵消可大幅削减本回合宿傩累积战斗总值！',
        slices: [
          { id: 'big', label: '完美抵消（敌方战值 -45%）', pct: 0.45, weight: bigPct, color: '#2ac19a' },
          { id: 'mid', label: '部分格挡（敌方战值 -22%）', pct: 0.22, weight: midPct, color: '#29bce8' },
          { id: 'none', label: '未挡住全额承受', pct: 0, weight: failPct, color: '#ef5d58' }
        ]
      };
    }
    if (step.type === 'boss_round_result') {
      var pVal = Math.max(10, Math.round(state.boss.playerRoundPower));
      var eVal = Math.max(10, Math.round(state.boss.enemyRoundPower));
      var winPct = clamp(Math.round((pVal / (pVal + eVal)) * 100), 12, 92);
      return {
        title: '战斗盘 · 本回合胜负（我 ' + pVal + ' vs 敌 ' + eVal + '）',
        subtag: '新宿第 ' + state.boss.round + ' 回合总值比拼',
        explain: '扇区面积严格按照双方本轮累积实战总值动态生成！',
        slices: [
          { id: 'win', label: '我方压制胜出！', weight: winPct, color: '#2ac19a' },
          { id: 'loss', label: '遭到宿傩反压击溃', weight: 100 - winPct, color: '#ef5d58' }
        ]
      };
    }
    if (step.type === 'boss_agito_survive') {
      return {
        title: '嵌合兽·颚吐 本轮能否存活',
        subtag: '十影召唤兽清理判定',
        explain: '解决颚吐可断掉宿傩身旁的高速牵制与反转补给。',
        slices: [{ id: false, label: '被当场轰碎退场！', weight: state.boss.roundWon ? 68 : 28, color: '#2ac19a' }, { id: true, label: '顽强存活继续骚扰', weight: state.boss.roundWon ? 32 : 72, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_survive') {
      return {
        title: '魔虚罗 · 本轮能否存活',
        subtag: '八握剑异戒神将清除判定',
        explain: '越早秒杀魔虚罗，越不会让核心主力招式被无限适应免疫！',
        slices: [{ id: false, label: '彻底消灭魔虚罗！！', weight: state.boss.roundWon ? 54 : 18, color: '#2ac19a' }, { id: true, label: '法轮旋转仍在场上存活', weight: state.boss.roundWon ? 46 : 82, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_adapt') {
      var used = state.boss.usedMovesThisRound.length ? state.boss.usedMovesThisRound : ['生得术式全开重击'];
      var uniqueMoves = used.filter(function (v, i, a) { return a.indexOf(v) === i; });
      return {
        title: '魔虚罗 · 本轮适应了哪一招',
        subtag: '永久叠加适应减伤层数！',
        explain: '同一招式被适应 1/2/3/4 次将永久减伤 30%/60%/90%/100%！',
        slices: getSliceColors(uniqueMoves.map(function (mLabel) { return { label: mLabel, weight: Math.round(100 / uniqueMoves.length) }; }))
      };
    }
    if (step.type === 'boss_tool_survive') {
      var curTool = char.tools[0];
      return {
        title: '咒具「' + curTool.shape + '」· 本轮能否存留',
        subtag: '高烈度兵刃损耗判定',
        explain: '激烈斩击对抗下，咒具也可能断裂损毁。',
        slices: [{ id: true, label: '完好存留可继续出战', weight: 76, color: '#2ac19a' }, { id: false, label: '当场崩裂损毁！', weight: 24, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_gojo_join') {
      return {
        title: '强援 · 五条悟是否此时入场助战',
        subtag: '局势逆转关键节点',
        explain: '五条悟加入可立刻获得【不可侵挡招】并助你施放无量空处！',
        slices: [{ id: true, label: '是！最强赶到加入战斗！', weight: 62, color: '#29bce8' }, { id: false, label: '否（继续孤身死磕）', weight: 38, color: '#64748b' }]
      };
    }

    if (step.type === 'final_reputation') {
      var repList = DATA.REPUTATION_BY_FACTION[char.faction] || DATA.REPUTATION_BY_FACTION.neutral;
      return { title: '最终声望定格', subtag: '世人对这一生的盖棺定论', explain: '按你的生前阵营与功过揭晓最终世间评价。', slices: getSliceColors(repList) };
    }

    return { title: '命运轮盘', subtag: '阶段推进', explain: '', slices: [{ label: '继续', weight: 100, color: '#2ac19a' }] };
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
      boss: state.boss,
      usedEventIds: state.usedEventIds,
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
      var setupSteps = buildInitialSetupSteps(char, state.customPresetPending || null);
      state.customPresetPending = null;
      state.stepQueue = setupSteps.concat(state.stepQueue);

    } else if (step.type === 'shikigami_auto') {
      char.shikigamiDesc = slice.id ? '自律式神' : '受命式神';
      effectText = slice.id ? '具备独立战局判断能力' : '完全执行御主契约指令';

    } else if (step.type === 'birth_era') {
      char.birthEraId = slice.id;
      char.birthEraLabel = slice.label;
      char.currentEraId = slice.id;
      char.currentEraLabel = slice.label;
      effectText = '即将于「' + slice.label + '」展开生涯';
      state.stepQueue = state.stepQueue.concat(buildEraQueue(slice.id));

    } else if (step.type === 'birthplace') {
      char.birthplace = slice.label;
      effectText = slice.note;

    } else if (step.type === 'shikigami_body') {
      char.shikigamiDesc = slice.label;
      effectText = '确定式神外观大类，细化形态';
      state.stepQueue.unshift({ type: 'shikigami_subform', bodyTypeId: slice.id });

    } else if (step.type === 'shikigami_subform') {
      char.shikigamiDesc = (char.shikigamiDesc || '式神') + ' · ' + slice.label;
      effectText = '式神形态确立：' + char.shikigamiDesc;

    } else if (step.type === 'technique') {
      char.technique = slice.label;
      char.techniquePower = slice.power || 6;
      char.techniqueDesc = slice.desc || '';
      effectText = slice.desc || '核心生得术式锁定';

    } else if (step.type === 'shikigami_master') {
      char.master = slice.id;
      char.faction = slice.faction || char.faction;
      effectText = '缔结初始御主：' + slice.label;

    } else if (step.type === 'shikigami_supply') {
      char.masterSupplyMult = slice.mult || 1;
      char.masterSupplyLabel = slice.label;
      effectText = '输出系数 ×' + char.masterSupplyMult.toFixed(2);

    } else if (step.type === 'shikigami_bond') {
      char.masterBondLabel = slice.label;
      effectText = '御主关系确立为：' + slice.label;

    } else if (step.type === 'looks') {
      char.looksText = slice.label;
      effectText = '颜值档位记录：' + slice.label;

    } else if (step.type === 'morality') {
      char.moralityText = slice.label;
      effectText = '三观底线确立：' + slice.label;

    } else if (step.type === 'aggro') {
      char.aggroText = slice.label;
      effectText = '战斗态度：' + slice.label;

    } else if (step.type === 'attr') {
      var aw = DATA.ATTRIBUTE_WHEELS[step.index];
      char.attrs[aw.attr] = slice.level;
      effectText = aw.title + ' 评定为 ' + getRankMeta(slice.level).code;

    } else if (step.type === 'high_tech_count') {
      var cnt = slice.count || 0;
      effectText = cnt === 0 ? '可惜开局暂未习得额外高级技巧' : '开启连续抽取 ' + cnt + ' 项高级战斗技巧！';
      for (var h = cnt; h >= 1; h--) {
        state.stepQueue.unshift({ type: 'high_tech_pick', nth: h, total: cnt });
      }

    } else if (step.type === 'high_tech_pick') {
      if (slice.id === 'mastery') {
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'barrier', 1);
        effectText = '技巧全满！改为精进操控与结界术 +1';
      } else {
        if (char.skills.indexOf(slice.label) === -1) char.skills.push(slice.label);
        effectText = slice.note || ('成功掌握高阶秘技「' + slice.label + '」');
      }

    } else if (step.type === 'tool_count') {
      var tCnt = slice.count || 0;
      effectText = tCnt === 0 ? '身无长物，仅靠自身肉体与术式搏杀' : '将连续抽取 ' + tCnt + ' 件专属咒具的器形与效果！';
      for (var tc = tCnt; tc >= 1; tc--) {
        state.stepQueue.unshift({ type: 'tool_shape', nth: tc, total: tCnt, seed: Math.floor(Math.random() * 50) });
      }

    } else if (step.type === 'tool_shape') {
      effectText = '第 ' + step.nth + ' 件咒具器形锁定为【' + slice.label + '】，接下来抽取它的附带能力！';
      state.stepQueue.unshift({ type: 'tool_effect', nth: step.nth, shape: slice.label });

    } else if (step.type === 'tool_effect') {
      char.tools.push({
        shape: step.shape,
        effect: slice.label,
        tier: slice.tier,
        bonus: slice.bonus || 3
      });
      effectText = '获得「' + step.shape + '」· ' + slice.label;

    } else if (step.type === 'grade') {
      char.officialGrade = slice.id;
      char.gradeBonus = slice.bonus;
      effectText = '高专正式评定阶级：' + slice.id;

    } else if (step.type === 'faction') {
      char.faction = slice.id;
      char.factionLabel = slice.label;
      effectText = slice.note;

    } else if (step.type === 'era_count') {
      var eCount = slice.count || 1;
      effectText = '本时代共爆发 ' + eCount + ' 场重大历史节点';
      for (var ec = 0; ec < eCount; ec++) {
        state.stepQueue.unshift({ type: 'era_pick', eraId: step.eraId });
      }

    } else if (step.type === 'era_pick') {
      var eraMeta = DATA.ERAS.find(function (e) { return e.id === step.eraId; });
      if (eraMeta) {
        char.currentEraId = eraMeta.id;
        char.currentEraLabel = eraMeta.short;
      }
      if (slice.action === 'fight') {
        effectText = '强敌现身！即将交手「' + slice.enemyName + '」';
        state.stepQueue.unshift({ type: 'fight_outcome', eraLabel: char.currentEraLabel, encounter: slice });
      } else {
        if (slice.statUp) applyStatDelta(char, slice.statUp, 1);
        effectText = slice.effectText || '平稳度过时代节点';
      }

    } else if (step.type === 'cross_era') {
      if (slice.preserved) char.flags.preservedToFuture = true;
      if (char.identityId === 'shikigami' && slice.id === 'sealSleep') {
        char.master = '羂索（现代接契）';
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
        effectText = '96% 收束！五条悟被狱门疆封印，涩谷陷入全面大混乱！';
      } else {
        effectText = '4% 奇迹降临！五条悟未被封印，直接击溃百鬼核心防线！';
      }

    } else if (step.type === 'sukuna_vessel') {
      char.flags.sukunaVessel = slice.label;
      char.currentEraId = 'culling';
      char.currentEraLabel = '死灭回游';
      effectText = '宿傩转移受肉至：' + slice.label;

    } else if (step.type === 'fight_outcome') {
      var won = slice.id === 'win';
      var myP = getPowerBreakdown(char);
      var hitBF = Math.random() < clamp(0.14 + char.attrs.ceControl * 0.025 + (char.skills.indexOf('黑闪') >= 0 ? 0.14 : 0), 0.1, 0.58);
      if (won) {
        char.statsLog.wins += 1;
        if (step.encounter.enemyPower - myP >= 6) char.statsLog.beatStronger = true;
        char.statsLog.defeatedEnemies.push(step.encounter.defeatsKey || step.encounter.enemyName);
        if (step.encounter.savesNanami) char.flags.nanamiDead = false;
        if (step.encounter.rewardSkill && char.skills.indexOf(step.encounter.rewardSkill) === -1) {
          char.skills.push(step.encounter.rewardSkill);
        }
      } else {
        char.statsLog.losses += 1;
        if (myP - step.encounter.enemyPower >= 6) char.statsLog.lostToWeaker = true;
      }
      if (hitBF) {
        char.statsLog.blackFlashes += 1;
        if (char.skills.indexOf('黑闪') === -1) char.skills.push('黑闪');
      }
      effectText = (won ? '击败 ' : '不敌 ') + step.encounter.enemyName + (hitBF ? ' · 本战打出「黑闪」！！' : '');
      state.stepQueue.unshift({
        type: 'fight_injury',
        won: won,
        canDie: Boolean(step.encounter.canDie),
        encounter: step.encounter
      });

    } else if (step.type === 'fight_injury') {
      if (slice.id === 'dead') {
        char.hpStatus = '已故';
        char.flags.killedInAction = true;
        state.boss.active = false;
        effectText = '你在激战中力竭陨落，人生提前走向终局结算！';
        state.stepQueue = [
          { type: 'final_reputation' },
          { type: 'radar', stage: 'final', title: '最终能力面板' },
          { type: 'settlement' }
        ];
      } else if (slice.id === 'core_rct') {
        if (char.skills.indexOf('反转术式') === -1) char.skills.push('反转术式');
        char.flags.awakenedRCTInBattle = true;
        char.hpStatus = '健康';
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'ceEfficiency', 1);
        effectText = '抓准了咒力核心！！绝境觉醒「反转术式」，操纵与效率各 +1！';
        state.stepQueue.unshift({ type: 'growth_check' });
      } else {
        if (!step.won && step.canDie) char.statsLog.survivedDeath += 1;
        if (slice.id === 'heavy') {
          char.hpStatus = '重伤';
          char.statsLog.heavyInjuries += 1;
          effectText = '力战重伤，需判定是否落下暗伤影响';
          state.stepQueue.unshift({ type: 'growth_check' });
          state.stepQueue.unshift({ type: 'heavy_impact' });
        } else {
          char.hpStatus = slice.id === 'light' ? '轻伤' : '健康';
          effectText = slice.id === 'light' ? '仅受轻伤，进入战后成长判定' : '完美凯旋毫发无损，进入战后成长判定';
          state.stepQueue.unshift({ type: 'growth_check' });
        }
      }

    } else if (step.type === 'heavy_impact') {
      if (slice.id === 'ceTotal' || slice.id === 'bodyResist') {
        var downLv = applyStatDelta(char, slice.id, -1);
        effectText = (slice.id === 'ceTotal' ? '咒力总量受损降至 ' : '身体抗性暗伤降至 ') + downLv;
      } else {
        effectText = '凭顽强意志扛住暗伤，未出现属性永久掉档';
      }

    } else if (step.type === 'growth_check') {
      if (slice.id === 'yes') {
        effectText = '触发战后突破！准备抽取具体淬炼提升项目';
        state.stepQueue.unshift({ type: 'growth_focus' });
      } else {
        effectText = '稳步消化本战经验，继续奔赴下一纪元';
      }

    } else if (step.type === 'growth_focus') {
      char.statsLog.growthCount += 1;
      if (slice.id === 'bodyTrain') {
        effectText = '体术升至 ' + applyStatDelta(char, 'taijutsu', 1) + '，身体抗性升至 ' + applyStatDelta(char, 'bodyResist', 1);
      } else if (slice.id === 'ceCondense') {
        effectText = '咒力总量升至 ' + applyStatDelta(char, 'ceTotal', 1) + '，效率升至 ' + applyStatDelta(char, 'ceEfficiency', 1);
      } else if (slice.id === 'soulBarrier') {
        effectText = '灵魂抗性升至 ' + applyStatDelta(char, 'soulResist', 1) + '，结界术升至 ' + applyStatDelta(char, 'barrier', 1);
      } else {
        var avail = getAvailableHighTechSlices(char);
        var learned = avail[Math.floor(Math.random() * avail.length)];
        if (learned && learned.id !== 'mastery' && char.skills.indexOf(learned.label) === -1) {
          char.skills.push(learned.label);
          effectText = '绝境悟道！成功领悟高阶技巧「' + learned.label + '」！';
        } else {
          applyStatDelta(char, 'talent', 1);
          effectText = '全能境界再进一阶，天赋升至 ' + getRankMeta(char.attrs.talent).code;
        }
      }

    // ==================== 新宿决战 · 宿傩多回合系统状态机 ====================
    } else if (step.type === 'shinjuku_prep_growth') {
      char.currentEraId = 'shinjuku';
      char.currentEraLabel = '新宿决战';
      char.statsLog.growthCount += 1;
      if (slice.id === 'taiBody') {
        effectText = '体术 -> ' + applyStatDelta(char, 'taijutsu', 1) + '，身体抗性 -> ' + applyStatDelta(char, 'bodyResist', 1);
      } else if (slice.id === 'soulLearn') {
        effectText = '灵魂抗性 -> ' + applyStatDelta(char, 'soulResist', 1) + '，结界术 -> ' + applyStatDelta(char, 'barrier', 1);
      } else if (slice.id === 'ceUpgrade') {
        effectText = '咒力总量 -> ' + applyStatDelta(char, 'ceTotal', 1) + '，效率 -> ' + applyStatDelta(char, 'ceEfficiency', 1);
      } else {
        var newT = getAvailableHighTechSlices(char)[0];
        if (newT && newT.id !== 'mastery' && char.skills.indexOf(newT.label) === -1) {
          char.skills.push(newT.label);
          effectText = '战前合练顺利领悟新技巧「' + newT.label + '」！';
        } else {
          applyStatDelta(char, 'iq', 1);
          effectText = '实战思路彻底贯通，智力 +1';
        }
      }

    } else if (step.type === 'shinjuku_motive') {
      effectText = slice.buffNote;

    } else if (step.type === 'shinjuku_sukuna_order') {
      var isTrueForm = slice.id === 'trueForm';
      state.boss = {
        active: true,
        round: 1,
        maxRounds: 3,
        playerWins: 0,
        enemyWins: 0,
        enemyTitle: slice.enemyTitle,
        enemyBaseAtk: slice.baseAtk,
        agitoAlive: !isTrueForm,
        mahoragaAlive: !isTrueForm,
        adaptations: {},
        gojoJoined: Boolean(slice.startWithGojo),
        canGojoJoin: Boolean(slice.canGojoJoin),
        infinityBlocks: slice.startWithGojo ? 4 : 0,
        sukunaStun: 0,
        playerRoundPower: 0,
        enemyRoundPower: 0,
        usedMovesThisRound: [],
        playerMovesLeft: 0,
        enemyMovesLeft: 0,
        roundWon: false
      };
      effectText = '正式踏入新宿人外魔境！即将对战「' + slice.enemyTitle + '」';
      state.stepQueue.unshift({ type: 'boss_player_count' });

    } else if (step.type === 'boss_player_count') {
      var pCnt = slice.count || 3;
      state.boss.playerRoundPower = Math.round(getPowerBreakdown(char) * 0.35);
      state.boss.enemyRoundPower = 0;
      state.boss.usedMovesThisRound = [];
      state.boss.playerMovesLeft = pCnt;
      effectText = '我方本回合共获 ' + pCnt + ' 次出手契机！';
      for (var pm = pCnt; pm >= 1; pm--) {
        state.stepQueue.unshift({ type: 'boss_player_move', nth: pm, total: pCnt });
      }

    } else if (step.type === 'boss_player_move') {
      state.boss.playerMovesLeft = Math.max(0, state.boss.playerMovesLeft - 1);
      var myBase = Math.max(12, Math.round(getPowerBreakdown(char) * 0.28));
      var rawAtk = Math.round(myBase * (slice.mult || 1.1));
      var adaptCount = state.boss.adaptations[slice.label] || 0;
      var adaptMult = adaptCount >= 4 ? 0 : adaptCount === 3 ? 0.1 : adaptCount === 2 ? 0.4 : adaptCount === 1 ? 0.7 : 1;
      var finalAtk = Math.round(rawAtk * adaptMult);

      state.boss.playerRoundPower += finalAtk;
      state.boss.usedMovesThisRound.push(slice.label);

      if (slice.isBlackFlash) {
        char.statsLog.blackFlashes += 1;
        if (char.skills.indexOf('黑闪') === -1) char.skills.push('黑闪');
      }
      if (slice.breaksTool && char.tools.length > 0) {
        var broken = char.tools.shift();
        effectText = '「百兵演武」粉碎了【' + broken.shape + '】，爆轰 +' + finalAtk + ' 战值！';
      } else if (adaptCount > 0) {
        effectText = '魔虚罗已适应 ' + adaptCount + ' 层！伤害缩减，本招仅 +' + finalAtk + ' 战值';
      } else {
        effectText = '打出「' + slice.label + '」，我方战斗总值 +' + finalAtk + '（当前 ' + state.boss.playerRoundPower + '）';
      }

      if (step.nth === step.total) {
        if (state.boss.gojoJoined) {
          state.stepQueue.unshift({ type: 'boss_gojo_move' });
        } else {
          state.stepQueue.unshift({ type: 'boss_enemy_count' });
        }
      }

    } else if (step.type === 'boss_gojo_move') {
      state.boss.playerRoundPower += (slice.power || 20);
      if (slice.isUnlimitedVoid) {
        effectText = '五条悟展开「无量空处」！强光淹没领域，判定宿傩被信息过载几轮！';
        state.stepQueue.unshift({ type: 'boss_uv_effect' });
      } else {
        effectText = '五条悟协同释放「' + slice.label + '」，我方战值暴涨 +' + slice.power + '！';
        state.stepQueue.unshift({ type: 'boss_enemy_count' });
      }

    } else if (step.type === 'boss_uv_effect') {
      state.boss.sukunaStun += slice.stun || 1;
      effectText = slice.label;
      state.stepQueue.unshift({ type: 'boss_enemy_count' });

    } else if (step.type === 'boss_enemy_count') {
      var rawECount = slice.count || 3;
      var realECount = Math.max(1, rawECount - state.boss.sukunaStun);
      state.boss.sukunaStun = 0;
      state.boss.enemyMovesLeft = realECount;
      state.boss.enemyRoundPower = Math.round(state.boss.enemyBaseAtk * 0.45);
      effectText = realECount < rawECount
        ? '受无量空处信息停摆影响，宿傩本轮行动被压减至仅 ' + realECount + ' 招！'
        : state.boss.enemyTitle + ' 本轮准备发起 ' + realECount + ' 连攻！';
      for (var em = realECount; em >= 1; em--) {
        state.stepQueue.unshift({ type: 'boss_enemy_move', nth: em, total: realECount });
      }

    } else if (step.type === 'boss_enemy_move') {
      state.boss.enemyMovesLeft = Math.max(0, state.boss.enemyMovesLeft - 1);
      if (state.boss.gojoJoined && state.boss.infinityBlocks > 0) {
        state.boss.infinityBlocks -= 1;
        effectText = '五条悟【无下限·不可侵】展开！完全挡下「' + slice.label + '」（剩 ' + state.boss.infinityBlocks + ' 次挡招）';
      } else {
        var hitVal = Math.round((slice.dmg || 16) * (state.boss.enemyBaseAtk / 38));
        state.boss.enemyRoundPower += hitVal;
        effectText = state.boss.enemyTitle + ' 轰出「' + slice.label + '」，敌方累积战值 +' + hitVal + '！';
      }
      if (step.nth === step.total) {
        var canCounter = char.skills.indexOf('简易领域') >= 0 || char.skills.indexOf('领域展延') >= 0 ||
          char.skills.indexOf('弥虚葛笼') >= 0 || char.attrs.versatility >= 6;
        if (canCounter) {
          state.stepQueue.unshift({ type: 'boss_counter_check' });
        } else {
          state.stepQueue.unshift({ type: 'boss_round_result' });
        }
      }

    } else if (step.type === 'boss_counter_check') {
      var cut = Math.round(state.boss.enemyRoundPower * (slice.pct || 0));
      state.boss.enemyRoundPower = Math.max(8, state.boss.enemyRoundPower - cut);
      effectText = cut > 0 ? '凭借护身结界/招式硬吃，成功削减敌方 ' + cut + ' 战值！' : '宿傩攻势太过迅猛，未能成功抵消！';
      state.stepQueue.unshift({ type: 'boss_round_result' });

    } else if (step.type === 'boss_round_result') {
      var rWon = slice.id === 'win';
      state.boss.roundWon = rWon;
      if (rWon) {
        state.boss.playerWins += 1;
        char.statsLog.wins += 1;
        effectText = '第 ' + state.boss.round + ' 回合我方力压宿傩夺得上风！';
      } else {
        state.boss.enemyWins += 1;
        char.statsLog.losses += 1;
        effectText = '第 ' + state.boss.round + ' 回合宿傩斩击压过一头，进入致命伤势判定！';
      }
      state.stepQueue.unshift({
        type: 'fight_injury',
        won: rWon,
        canDie: !rWon,
        encounter: { enemyName: state.boss.enemyTitle, enemyPower: 68, canDie: !rWon },
        fromBoss: true
      });
      // 如果未死，后续在 boss生态演化里安排下一回合
      if (state.boss.round < state.boss.maxRounds) {
        var evoSteps = [];
        if (state.boss.agitoAlive) evoSteps.push({ type: 'boss_agito_survive' });
        if (state.boss.mahoragaAlive) {
          evoSteps.push({ type: 'boss_mahoraga_survive' });
          evoSteps.push({ type: 'boss_mahoraga_adapt' });
        }
        if (char.tools.length > 0) evoSteps.push({ type: 'boss_tool_survive' });
        if (!state.boss.gojoJoined && state.boss.canGojoJoin && state.boss.round === 1) {
          evoSteps.push({ type: 'boss_gojo_join' });
        }
        evoSteps.push({ type: 'boss_next_round' });
        // 注意：growth_check 会在 fight_injury 后自动插入，把演化步骤放到 growth 之后、 future68 之前
        var futureIdx = state.stepQueue.findIndex(function (q) { return q.type === 'era_pick' && q.eraId === 'future68'; });
        if (futureIdx === -1) futureIdx = state.stepQueue.length;
        Array.prototype.splice.apply(state.stepQueue, [futureIdx, 0].concat(evoSteps));
      } else {
        // 3回合大战收官
        if (state.boss.playerWins >= state.boss.enemyWins) {
          char.flags.beatSukunaShinjuku = true;
          char.statsLog.beatStronger = true;
          char.statsLog.defeatedEnemies.push('宿傩（新宿决战）');
        }
        state.boss.active = false;
      }

    } else if (step.type === 'boss_agito_survive') {
      state.boss.agitoAlive = Boolean(slice.id);
      effectText = state.boss.agitoAlive ? '嵌合兽·颚吐仍在游走牵制' : '嵌合兽·颚吐被干净利落摧毁！';

    } else if (step.type === 'boss_mahoraga_survive') {
      state.boss.mahoragaAlive = Boolean(slice.id);
      if (!state.boss.mahoragaAlive) {
        // 删掉紧随其后的 adapt 步骤
        if (state.stepQueue[0] && state.stepQueue[0].type === 'boss_mahoraga_adapt') {
          state.stepQueue.shift();
        }
        effectText = '魔虚罗彻底化为灰烬！宿傩失去最强适应杀器！';
      } else {
        effectText = '魔虚罗背后法轮轰然一转，即将完成针对性适应！';
      }

    } else if (step.type === 'boss_mahoraga_adapt') {
      var curCount = state.boss.adaptations[slice.label] || 0;
      state.boss.adaptations[slice.label] = curCount + 1;
      var lvAfter = state.boss.adaptations[slice.label];
      var pctMap = { 1: '30%', 2: '60%', 3: '90%', 4: '100%完全免疫！' };
      effectText = '警告！魔虚罗对「' + slice.label + '」适应升至第 ' + lvAfter + ' 层（减伤 ' + (pctMap[lvAfter] || '100%') + '）';

    } else if (step.type === 'boss_tool_survive') {
      if (!slice.id && char.tools.length > 0) {
        var lost = char.tools.shift();
        effectText = '激战硬拼中，咒具【' + lost.shape + '】不堪重负当场断裂！';
      } else {
        effectText = '手持咒具经受住了宿傩斩击考验！';
      }

    } else if (step.type === 'boss_gojo_join') {
      if (slice.id) {
        state.boss.gojoJoined = true;
        state.boss.infinityBlocks = 4;
        effectText = '强援五条悟强势切入战场！不可侵护盾（4次）与无量空处解锁！';
      } else {
        effectText = '五条悟暂无暇抽身，继续孤身正面硬扛！';
      }

    } else if (step.type === 'final_reputation') {
      char.reputationLevel = slice.level;
      char.reputationText = slice.label;
      char.currentEraLabel = '尘埃落定';
      effectText = '终局声望确立为：' + slice.label;
    }

    // 自动展开内部控制节点（如 boss_next_round）
    function flushControlNodes() {
      var guard = 0;
      while (state.stepQueue.length && guard++ < 8) {
        var top = state.stepQueue[0];
        if (top.type === 'boss_next_round') {
          state.stepQueue.shift();
          state.boss.round += 1;
          state.stepQueue.unshift({ type: 'boss_player_count' });
        } else {
          break;
        }
      }
    }

    pushTimeline(state, wheelInfo.title, slice.label, effectText);
    state.lastResultText = slice.label;
    state.lastEffectText = effectText;
    flushControlNodes();

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
      state.boss.active = false;
      state.canRerollLast = false;
    } else {
      state.currentView = 'wheel';
    }

    return { resultLabel: slice.label, effectText: effectText };
  }

  function continueAfterRadar(state) {
    state.pendingRadar = null;
    var nextStep = state.stepQueue[0];
    if (nextStep && nextStep.type === 'settlement') {
      state.stepQueue.shift();
      state.currentView = 'settlement';
      state.finished = true;
      state.boss.active = false;
    } else {
      state.currentView = 'wheel';
      state.lastResultText = '准备就绪';
      state.lastEffectText = '点击转盘或下方按钮继续推进剧情';
    }
  }

  function rerollLastSpin(state) {
    if (!state.prevSnapshot || !state.canRerollLast) return false;
    var snap = state.prevSnapshot;
    state.stepCount = snap.stepCount;
    state.stepQueue = snap.stepQueue;
    state.char = snap.char;
    state.boss = snap.boss;
    state.usedEventIds = snap.usedEventIds;
    state.currentView = snap.currentView;
    state.lastResultText = snap.lastResultText;
    state.lastEffectText = '已消耗 1 命运点改命重抽！请重新旋转当前轮盘';
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

    var attrVals = DATA.ATTRIBUTE_DEFS.map(function (d) { return attrs[d.key] || 0; });
    var exCount = attrVals.filter(function (v) { return v >= 10; }).length;
    var maxV = Math.max.apply(null, attrVals);
    var minV = Math.min.apply(null, attrVals);

    if (flags.beatSukunaShinjuku) {
      addTrait('新宿弑王者', +10, '在新宿多回合决战中压制并战胜宿傩！');
    }
    if (log.beatStronger) {
      addTrait('以下克上', +5, '战胜至少一名综合战力强于自己的敌人');
    }
    if ((char.birthEraId === 'heian' || char.birthEraId === 'edo400') && !flags.killedInAction) {
      addTrait('活化石', +8, '从千年前或四百年前一路活跃至六十八年后');
    }
    if (flags.preservedToFuture) {
      addTrait('封存到未来', +5, '经封存沉睡或咒物化跨越时代在现代苏醒');
    }
    if (char.faction === 'evil' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('乱世枭雄', +6, '保持暗面阵营立场并赢下四场以上激战活到结局');
    }
    if (char.faction === 'good' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('咒术界支柱', +6, '正道立场奋战四胜以上并护卫世间直至终局');
    }
    if (log.wins >= 5) {
      addTrait('旗开得胜', +4, '全生涯累计胜场 ≥ 5 场（实际 ' + log.wins + ' 胜）');
    }
    if (exCount >= 2) {
      addTrait('双绝以上', +5, '最终十维属性达到 EX 及以上数量 ≥ 2');
    }
    if (attrs.ceEfficiency >= 10) {
      addTrait('滴水不漏', +4, '咒力效率达到 EX 级别比肩六眼');
    }
    if (attrs.bodyResist >= 10) {
      addTrait('金刚不坏', +4, '身体抗性达到 EX 级别屹立不倒');
    }
    if (char.skills.indexOf('领域展开') >= 0) {
      addTrait('领域主宰', +5, '成功掌握咒术最高境界「领域展开」');
    }
    if (flags.awakenedRCTInBattle) {
      addTrait('绝境抓核', +6, '在濒危败局伤势转盘中当场抓准咒力核心领悟反转术式！');
    }
    if (log.defeatedEnemies.indexOf('choso') >= 0) {
      addTrait('赤血断流', +5, '在实战交锋中击败九相图·胀相');
    }
    if (log.defeatedEnemies.indexOf('dabura') >= 0) {
      addTrait('超光速之外', +8, '在六十八年后的切磋中击败达布拉');
    }
    if (log.blackFlashes >= 2) {
      addTrait('黑闪的宠儿', +5, '生涯多次爆发灵魂共振的黑闪一击（共 ' + log.blackFlashes + ' 次）');
    }
    if (log.survivedDeath > 0 && !flags.killedInAction) {
      addTrait('大难不死', +4, '多次熬过死亡风险判定绝地翻盘');
    }
    if (flags.gojoSealed === false) {
      addTrait('4% 奇迹见证者', +7, '涉谷见证五条悟未被封印的神级改写世界线');
    }

    if (log.lostToWeaker) {
      addTrait('区', -4, '曾被基础战力弱于自己的对手击败');
    }
    if ((log.wins + log.losses) >= 5 && log.blackFlashes === 0) {
      addTrait('黑闪绝缘体', -3, '打满五场以上高强度对决却一次黑闪未出');
    }
    if (maxV - minV >= 8) {
      addTrait('极端加点', -5, '核心属性最大阶级落差达 8 级以上');
    }
    if (flags.nanamiDead && !flags.killedInAction) {
      addTrait('最后的加班', -3, '见证涩谷事变七海建人壮烈谢幕');
    }
    if (flags.killedInAction) {
      addTrait('半途折戟', -6, '战死于残酷时代或新宿决战之中');
    }

    if (!traits.length) {
      addTrait('平平淡淡才是真', +2, '平稳度过时代浪潮留下档案');
    }

    var baseBonus = Math.round(getPowerBreakdown(char) * 0.14);
    var traitsSum = traits.reduce(function (sum, t) { return sum + t.score; }, 0);
    var totalScore = baseBonus + traitsSum;

    var posCount = traits.filter(function (t) { return t.score >= 0; }).length;
    var negCount = traits.filter(function (t) { return t.score < 0; }).length;

    var quality = '平庸';
    if (totalScore >= 55) quality = '神明奇点';
    else if (totalScore >= 42) quality = '史诗传说';
    else if (totalScore >= 26) quality = '精良';
    else if (totalScore >= 12) quality = '尚可';
    else if (totalScore >= 0) quality = '惨淡';
    else quality = '幽默搞笑';

    // 严格遵守原版规则：仅浮生若梦模式产生命运点（每满10分奖1点，保底+1）
    var fateReward = state.runType === 'dream' ? Math.max(1, Math.floor(Math.max(0, totalScore) / 10)) : 0;

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
      summaryLine: char.identityName + ' · ' + char.officialGrade + ' · ' + char.technique + ' · 声望「' + char.reputationText + '」（战力 ' + getPowerBreakdown(char) + '）'
    };
  }

  /* ==================== 咒术竞技场 1v1 模拟与好友对战码 ==================== */
  function encodeFighterCode(fighter) {
    var minimal = {
      n: fighter.name || '无名氏',
      i: fighter.identityName || '咒术师',
      g: fighter.officialGrade || '一级',
      t: fighter.technique || '无生得术式',
      s: (fighter.skills || []).slice(0, 8),
      w: (fighter.tools || []).map(function (x) { return { shape: x.shape, bonus: x.bonus || 4 }; }).slice(0, 3),
      a: fighter.attrs
    };
    var json = JSON.stringify(minimal);
    var bytes = unescape(encodeURIComponent(json));
    return 'JJK1:' + btoa(bytes);
  }

  function decodeFighterCode(code) {
    var trimmed = String(code || '').trim();
    if (trimmed.indexOf('JJK1:') === 0) trimmed = trimmed.slice(5);
    var decoded = decodeURIComponent(escape(atob(trimmed)));
    var p = JSON.parse(decoded);
    if (!p || !p.a) throw new Error('Invalid code');
    return {
      name: String(p.n || '好友角色'),
      identityName: String(p.i || '咒术师'),
      officialGrade: String(p.g || '一级'),
      technique: String(p.t || '秘传术式'),
      skills: Array.isArray(p.s) ? p.s : [],
      tools: Array.isArray(p.w) ? p.w : [],
      attrs: p.a
    };
  }

  function arenaPowerScore(f) {
    var a = f.attrs || {};
    var base = (a.ceTotal || 4) + (a.ceControl || 4) + (a.ceEfficiency || 4) + (a.taijutsu || 4) * 1.2 +
      (a.bodyResist || 4) + (a.soulResist || 4) * 0.7 + (a.barrier || 4) * 0.8 + (a.versatility || 4) * 0.8 + (a.iq || 4) * 0.7;
    var hasD = (f.skills || []).indexOf('领域展开') >= 0;
    var hasR = (f.skills || []).indexOf('反转术式') >= 0;
    var toolPts = (f.tools || []).reduce(function (s, x) { return s + (x.bonus || 3); }, 0);
    return Math.round(base * 1.15 + (f.skills || []).length * 3 + (hasD ? 10 : 0) + (hasR ? 6 : 0) + toolPts);
  }

  function simulateArenaBattle(fA, fB) {
    var hpA = 100 + (fA.attrs.bodyResist || 4) * 8;
    var hpB = 100 + (fB.attrs.bodyResist || 4) * 8;
    var pA = arenaPowerScore(fA);
    var pB = arenaPowerScore(fB);
    var hasDomainA = (fA.skills || []).indexOf('领域展开') >= 0;
    var hasDomainB = (fB.skills || []).indexOf('领域展开') >= 0;
    var hasRctA = (fA.skills || []).indexOf('反转术式') >= 0;
    var hasRctB = (fB.skills || []).indexOf('反转术式') >= 0;

    var logs = [];
    for (var round = 1; round <= 5 && hpA > 0 && hpB > 0; round++) {
      var bfA = Math.random() < (0.12 + (fA.attrs.ceControl || 4) * 0.02);
      var bfB = Math.random() < (0.12 + (fB.attrs.ceControl || 4) * 0.02);
      var domBoostA = hasDomainA && !hasDomainB && round <= 2 ? 1.25 : 1.0;
      var domBoostB = hasDomainB && !hasDomainA && round <= 2 ? 1.25 : 1.0;

      var dmgA = Math.round((14 + pA * 0.32 + Math.random() * 14) * domBoostA * (bfA ? 1.6 : 1));
      var dmgB = Math.round((14 + pB * 0.32 + Math.random() * 14) * domBoostB * (bfB ? 1.6 : 1));
      hpB = Math.max(0, hpB - dmgA);
      hpA = Math.max(0, hpA - dmgB);

      var rctTxt = '';
      if (hasRctA && hpA > 0 && hpA < 85) { hpA += 12; rctTxt += fA.name + '反转回复+12；'; }
      if (hasRctB && hpB > 0 && hpB < 85) { hpB += 12; rctTxt += fB.name + '反转回复+12；'; }

      logs.push('第' + round + '回合：' + fA.name + '【' + fA.technique + '】造成 ' + dmgA + (bfA ? '(黑闪!)' : '') +
        '｜' + fB.name + '回击 ' + dmgB + (bfB ? '(黑闪!)' : '') + (rctTxt ? '｜' + rctTxt : '') +
        '（余血 ' + hpA + ' vs ' + hpB + '）');
    }

    var winner = hpA >= hpB ? fA.name : fB.name;
    return {
      winner: winner,
      playerWon: hpA >= hpB,
      hpA: hpA,
      hpB: hpB,
      powerA: pA,
      powerB: pB,
      opponent: fB.name + '（' + fB.officialGrade + '·' + fB.technique + '）',
      logs: logs,
      time: new Date().toLocaleString('zh-CN')
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
    getPowerBreakdown: getPowerBreakdown,
    encodeFighterCode: encodeFighterCode,
    decodeFighterCode: decodeFighterCode,
    simulateArenaBattle: simulateArenaBattle
  };
})(window);
