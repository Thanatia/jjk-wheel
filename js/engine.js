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

  function applyCanonTemplate(char, canonObj, preset) {
    char.canonCharId = canonObj.id;
    char.canonCharName = canonObj.name;
    char.canonTitle = canonObj.title;
    char.canonNote = canonObj.canonNote;
    char.identityId = 'canon';
    char.identityName = '魂穿 · ' + canonObj.name;
    char.faction = canonObj.faction;
    char.factionLabel = canonObj.faction === 'good' ? '高专/正道阵营（原著）' : canonObj.faction === 'evil' ? '诅咒/暗面阵营（原著）' : '自由独行派（原著）';
    char.nativeEraId = canonObj.eraId;
    var eraMeta = DATA.ERAS.find(function (e) { return e.id === canonObj.eraId; }) || DATA.ERAS[4];
    if (!preset || !preset.eraId || preset.eraId === 'random') {
      char.birthEraId = eraMeta.id;
      char.birthEraLabel = eraMeta.label;
      char.currentEraId = eraMeta.id;
      char.currentEraLabel = eraMeta.short;
    }
    var techMeta = DATA.TECHNIQUES_ALL.find(function (t) { return t.id === canonObj.techniqueId; });
    char.technique = canonObj.technique;
    char.techniquePower = techMeta ? techMeta.power : 14;
    char.techniqueDesc = canonObj.canonNote;
    char.officialGrade = canonObj.officialGrade;
    char.gradeBonus = canonObj.gradeBonus || 10;
    char.attrs = cloneState(canonObj.attrs);
    if (preset && preset.talentLv && preset.talentLv !== 'random') {
      char.attrs.talent = Math.max(char.attrs.talent || 4, parseInt(preset.talentLv, 10) || 8);
    }
    var mergedSkills = canonObj.skills.slice();
    (char.skills || []).forEach(function (s) {
      if (mergedSkills.indexOf(s) === -1) mergedSkills.push(s);
    });
    char.skills = mergedSkills;
    char.tools = cloneState(canonObj.tools || []);
    char.gender = (canonObj.id === 'nobara' || canonObj.id === 'maki' || canonObj.id === 'yuki' || canonObj.id === 'yorozu' || canonObj.id === 'uraume') ? '女' : '男';
    char.looksText = getRankMeta(canonObj.looks || 7).code + '（原著容姿）';
    char.moralityText = canonObj.morality >= 3 ? '坚守良知正道' : canonObj.morality <= -3 ? '冷酷反派本性' : '亦正亦邪果决';
    char.aggroText = canonObj.aggro >= 8 ? '极高好战狂气' : canonObj.aggro >= 5 ? '敏锐战意昂扬' : '冷静克制务实';
  }

  function applyAttrTierFloor(char, attrTier) {
    if (!attrTier || attrTier === 'random') return;
    var minLv = attrTier === 'ex' ? 10 : attrTier === 's' ? 7 : attrTier === 'b' ? 5 : 0;
    if (!minLv) return;
    DATA.ATTRIBUTE_DEFS.forEach(function (d) {
      if (char.technique === '天与咒缚（零咒力）' && (d.key === 'ceTotal' || d.key === 'ceControl' || d.key === 'ceEfficiency' || d.key === 'barrier')) {
        return;
      }
      if ((char.attrs[d.key] || 0) < minLv) {
        char.attrs[d.key] = minLv;
      }
    });
  }

  function getCorpsePowerBonus(char) {
    return (char.cursedCorpses || []).reduce(function (sum, c) {
      var corePts = Array.isArray(c.cores) ? c.cores.length * 2.5 : 0;
      var autoPts = c.autonomous ? 4 : 2;
      return sum + Math.round(((c.atk || 5) + (c.def || 5) + (c.hp || 5)) * 0.42 + autoPts + corePts);
    }, 0);
  }

  function getPowerBreakdown(char) {
    var a = char.attrs;
    var sumTen = a.ceTotal + a.ceControl + a.ceEfficiency + a.taijutsu + a.bodyResist +
      a.soulResist + a.barrier + a.versatility + a.iq + a.talent * 0.6;
    var hasDomain = char.skills.indexOf('领域展开') >= 0;
    var hasRct = char.skills.indexOf('反转术式') >= 0;
    var skillBonus = char.skills.length * 2.8 + (char.techniquePower || 4) + (hasDomain ? 9 : 0) + (hasRct ? 5 : 0);
    var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
    var toolBonus = activeTools.reduce(function (sum, t) { return sum + (t.bonus || 3); }, 0);
    var corpseBonus = getCorpsePowerBonus(char);
    var seanceBonus = (char.flags && char.flags.seanceAllyBonus) ? char.flags.seanceAllyBonus : 0;
    var supplyMult = char.masterSupplyMult || 1;
    var vowMult = (char.flags && char.flags.vowAtkMult) ? char.flags.vowAtkMult : 1;
    var scriptBonus = (char.flags && char.flags.scriptLevel > 0) ? char.flags.scriptLevel * 2 : 0;
    var injuryPenalty = char.hpStatus === '重伤' ? 9 : char.hpStatus === '轻伤' ? 3 : 0;
    var raw = ((sumTen * 0.56 + skillBonus + toolBonus + corpseBonus + seanceBonus + (char.gradeBonus || 2)) * supplyMult * vowMult) + scriptBonus - injuryPenalty;
    return clamp(Math.round(raw), 1, 210);
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
    if (char.identityId === 'canon') {
      if (!char.canonCharId) {
        setup.push({ type: 'canon_character' });
      }
      if (!preset || preset.eraId === 'random') {
        setup.push({ type: 'canon_timepoint' });
      }
      setup.push({ type: 'canon_sync' });
      setup.push({ type: 'canon_memory' });
      setup.push({ type: 'canon_divergence' });
      setup.push({ type: 'radar', stage: 'initial', title: '魂穿原著初始面板' });
      if (preset && preset.eraId !== 'random') {
        setup = setup.concat(buildEraQueue(char.birthEraId));
      }
      return setup;
    }

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
    if (char.identityId === 'corpse') setup.push({ type: 'identity_extra', key: 'corpse_cores' });
    else if (char.identityId === 'higherUp') setup.push({ type: 'identity_extra', key: 'higherUp_scheme' });
    else if (char.identityId === 'civilian') setup.push({ type: 'identity_extra', key: 'civilian_awakening' });
    else if (char.identityId === 'curse') setup.push({ type: 'identity_extra', key: 'curse_origin' });

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
      customAttrTier: preset && preset.attrTier ? preset.attrTier : 'random',
      boss: { active: false },
      stepQueue: [],
      char: {
        identityId: 'sorcerer',
        identityName: '未定身份',
        canonCharId: null,
        canonCharName: null,
        canonTitle: '',
        canonNote: '',
        nativeEraId: null,
        canonSyncLabel: '',
        canonMemoryLabel: '',
        canonDivergenceLabel: '',
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
          awakenedRCTInBattle: false,
          canonSyncMode: '',
          scriptLevel: 0,
          canonDivergence: '',
          rewroteFate: false,
          hasSecretAlly: false,
          civilianAwakened: false,
          activeVowId: '',
          activeVowLabel: '',
          vowAtkMult: 1,
          vowDangerDelta: 0,
          bindingVowPicked: false
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
    if (preset && preset.canonCharId && preset.canonCharId !== 'random' && state.char.identityId === 'canon') {
      var cObj = DATA.CANON_CHARACTERS.find(function (c) { return c.id === preset.canonCharId; });
      if (cObj) {
        applyCanonTemplate(state.char, cObj, preset);
      }
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
    if (preset && preset.techId && preset.techId !== 'random' && state.char.identityId !== 'canon') {
      var techObj = DATA.TECHNIQUES_ALL.find(function (t) { return t.id === preset.techId; });
      if (techObj) {
        state.char.technique = techObj.label;
        state.char.techniquePower = techObj.power;
        state.char.techniqueDesc = techObj.desc;
      }
    }
    if (preset && preset.gradeId && preset.gradeId !== 'random' && state.char.identityId !== 'canon') {
      var grObj = DATA.GRADE_WHEELS.standard.find(function (g) { return g.id === preset.gradeId; });
      if (grObj) {
        state.char.officialGrade = grObj.id;
        state.char.gradeBonus = grObj.bonus;
      }
    }
    if (preset && preset.talentLv && preset.talentLv !== 'random') {
      state.char.attrs.talent = Math.max(state.char.attrs.talent, parseInt(preset.talentLv, 10) || 8);
    }
    if (preset && preset.perk && preset.perk !== 'random') {
      if (preset.perk === 'rct' && state.char.skills.indexOf('反转术式') === -1) state.char.skills.push('反转术式');
      else if (preset.perk === 'domain' && state.char.skills.indexOf('领域展开') === -1) state.char.skills.push('领域展开');
      else if (preset.perk === 'both') {
        ['反转术式', '领域展开', '黑闪'].forEach(function (sk) {
          if (state.char.skills.indexOf(sk) === -1) state.char.skills.push(sk);
        });
      }
    }
    if (preset && preset.attrTier && preset.attrTier !== 'random') {
      applyAttrTierFloor(state.char, preset.attrTier);
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
    var rewriteBonus = state.char.flags.rewroteFate ? 4 : 0;
    var diff = myPower + rewriteBonus - enemyPower + (state.char.statsLog.wins > 0 ? 1 : 0);
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
    var dangerDelta = state.char.flags.vowDangerDelta || 0;
    if (won) {
      var noInj = clamp(34 + bodyLv * 4 + (hasRct ? 12 : 0) - Math.round(dangerDelta * 0.5), 24, 84);
      var light = clamp(100 - noInj - 6, 12, 60);
      var heavy = Math.max(4, 100 - noInj - light);
      return [
        { id: 'none', label: '毫发无伤', weight: noInj, color: '#8fd14f' },
        { id: 'light', label: '轻伤无碍', weight: light, color: '#ffa500' },
        { id: 'heavy', label: '力战重伤', weight: heavy, color: '#ef5d58' }
      ];
    }

    var rewriteReduce = state.char.flags.rewroteFate ? 7 : 0;
    var deathRisk = canDie ? clamp(22 - Math.floor(bodyLv * 1.3) - (hasRct ? 6 : 0) + Math.round(dangerDelta * 0.6) - rewriteReduce, 3, 28) : 0;
    if (state.char.hpStatus === '重伤' && canDie) deathRisk = clamp(deathRisk + 8, 5, 34);
    var rctBreakChance = !hasRct ? clamp(6 + state.char.attrs.talent + state.char.attrs.ceControl, 8, 24) : 0;
    var heavyLoss = clamp(42 - bodyLv * 2 + Math.round(dangerDelta * 0.4), 16, 52);
    var lightLoss = Math.max(16, 100 - heavyLoss - deathRisk - rctBreakChance);

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
    var boss = state.boss || {};
    var sigPool = (DATA.SIGNATURE_MOVES_BY_TECH && DATA.SIGNATURE_MOVES_BY_TECH[char.techniqueId])
      || (DATA.SIGNATURE_MOVES_BY_TECH && DATA.SIGNATURE_MOVES_BY_TECH.default)
      || [];
    var list = sigPool.map(function (m) {
      return Object.assign({ isTechAttack: true }, m);
    });

    var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
    var firstTool = activeTools[0] || null;
    var bfWeightMult = Math.pow(1.5, boss.playerBfStacks || 0);

    if (char.skills.indexOf('完整咏唱') >= 0) {
      list.push({ id: 'chant', label: '完整咏唱（下一次有效术式攻击×2，可叠加、跨轮）', power: 0, isChant: true, weight: 15 });
    }

    var elbowLabel = firstTool
      ? '肘击（附着咒具1·' + firstTool.shape + '，不耗咏唱）'
      : '肘击（高速体术贴靠，不耗咏唱）';
    list.push({
      id: 'elbow',
      label: elbowLabel,
      power: 9 + (firstTool ? Math.round((firstTool.bonus || 4) * 0.8) : 0),
      isElbow: true,
      weight: 13
    });

    if (char.skills.indexOf('反转术式') >= 0) {
      list.push({ id: 'heal', label: '反转术式·即时治疗修复伤势（不耗咏唱）', power: 0, isHeal: true, weight: 11 });
    }
    if (char.skills.indexOf('咒术科学') >= 0 || (char.attrs.iq || 0) >= 8) {
      list.push({ id: 'ce_science', label: '咒术科学·原理反制（+3，抵消敌方1次攻击）', power: 3, cancels: 1, weight: 10 });
    }
    if (char.skills.indexOf('术式多重启动') >= 0) {
      list.push({ id: 'multi_cast', label: '术式多重启动（+3，额外行动 1 次！）', power: 3, extraActions: 1, weight: 11 });
    }
    if (char.skills.indexOf('自动迎击术式') >= 0) {
      list.push({ id: 'auto_counter', label: '自动迎击术式（+3，抵消敌方1次攻击）', power: 3, cancels: 1, weight: 11 });
    }
    if (firstTool && (firstTool.nullify || firstTool.canCancelMove || (firstTool.effect && (firstTool.effect.indexOf('无效化') >= 0 || firstTool.effect.indexOf('飞天') >= 0)))) {
      list.push({
        id: 'tool_special_hit',
        label: '催动「' + firstTool.shape + '」· ' + firstTool.effect.split('（')[0] + '（抵消敌方1次攻击）',
        power: 15 + (firstTool.bonus || 5),
        cancels: 1,
        isTechAttack: true,
        weight: 13
      });
    }
    if ((char.cursedCorpses || []).length > 0) {
      list.push({
        id: 'corpse_combo',
        label: '自律咒骸阵列联动轰击（+' + (8 + char.cursedCorpses.length * 4) + '）',
        power: 8 + char.cursedCorpses.length * 4,
        isTechAttack: true,
        weight: 12
      });
    }

    list.push({
      id: 'blackFlash',
      label: '黑闪！！！（额外行动2次，本轮后续×1.2，黑闪率↑）',
      power: 22,
      isBlackFlash: true,
      isTechAttack: true,
      extraActions: 2,
      weight: Math.round((10 + (char.attrs.ceControl || 0) * 1.1) * bfWeightMult)
    });

    if (char.skills.indexOf('领域展开') >= 0) {
      list.push({ id: 'domain', label: '领域展开·生得领域强压（不耗咏唱）', power: 19, isDomain: true, weight: 12 });
    }
    if (char.skills.indexOf('百兵演武') >= 0 && activeTools.length > 0) {
      list.push({ id: 'hundredBreak', label: '百兵演武·碎刃绝杀（爆碎咒具狂攻！）', power: 29, isTechAttack: true, breaksTool: true, weight: 9 });
    }
    return list;
  }

  function getGojoBossMovesSlices(boss) {
    var bfMult = Math.pow(1.5, (boss && boss.gojoBfStacks) || 0);
    return (DATA.GOJO_BOSS_MOVES || []).map(function (m) {
      var w = m.isBlackFlash ? Math.round(m.weight * bfMult) : m.weight;
      return Object.assign({}, m, { weight: w });
    });
  }

  function getSukunaBossMovesSlices(boss) {
    var bfMult = Math.pow(1.5, (boss && boss.sukunaBfStacks) || 0);
    return DATA.SUKUNA_MOVES.filter(function (m) {
      if (m.requiresAgito && !boss.agitoAlive) return false;
      if (m.requiresMahoraga && !boss.mahoragaAlive) return false;
      if (m.canSummonMahoraga && (boss.mahoragaAlive || boss.isTrueForm)) return false;
      return true;
    }).map(function (m) {
      var w = m.isBlackFlash ? Math.round(m.weight * bfMult) : m.weight;
      return Object.assign({}, m, { weight: w });
    });
  }

  function getCombatFormulaSummary(state) {
    if (!state || !state.char) return '';
    var char = state.char;
    var power = getPowerBreakdown(char);
    if (state.boss && state.boss.active) {
      var b = state.boss;
      var pVal = Math.max(10, Math.round(b.playerRoundPower));
      var eVal = Math.max(10, Math.round(b.enemyRoundPower));
      var winPct = clamp(Math.round((pVal / (pVal + eVal)) * 100), 12, 92);
      var debuffPct = Math.round(Math.pow(0.7, b.heavyDebuffStacks || 0) * 100);
      var chantMult = Math.pow(2, b.playerChantStacks || 0);
      var bfMult = Math.pow(1.2, b.playerBfStacks || 0).toFixed(2);
      return '当前公式：战力' + power + ' · 减益系数' + debuffPct + '% · 咏唱待发×' + chantMult +
        ' · 黑闪×' + bfMult + ' · 实算比 ' + pVal + ':' + eVal + '（胜率≈' + winPct + '%）';
    }
    var step = state.stepQueue && state.stepQueue[0];
    if (step && step.encounter) {
      var ePow = step.encounter.enemyPower || 40;
      var fPct = clamp(Math.round((power / (power + ePow)) * 100), 15, 92);
      return '战斗公式：我方战力 ' + power + ' / (我方 ' + power + ' + 敌方 ' + ePow + ') = 胜率 ' + fPct + '% · 黑闪基率≈' +
        Math.round(clamp(0.14 + char.attrs.ceControl * 0.025 + (char.skills.indexOf('黑闪') >= 0 ? 0.14 : 0), 0.1, 0.58) * 100) + '%';
    }
    var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
    var tPts = activeTools.reduce(function (s, t) { return s + (t.bonus || 3); }, 0);
    var cPts = getCorpsePowerBonus(char);
    var vowMult = (char.flags && char.flags.vowAtkMult) ? char.flags.vowAtkMult : 1;
    return '数值公式：综合战力=' + power + '（咒具+' + tPts + ' / 咒骸+' + cPts + ' / 束缚×' + vowMult + '）';
  }

  function describeWheelForStep(state) {
    var step = getActiveStep(state);
    var char = state.char;

    if (step.type === 'identity') {
      return { title: '穿越后的初始身份', subtag: '浮生若梦 · 第 ' + (state.stepCount + 1) + ' 轮', explain: '决定你在咒术世界降生时的根本存在形式（包含魂穿22位原著角色！）。', slices: getSliceColors(DATA.IDENTITIES) };
    }
    if (step.type === 'canon_character') {
      var cSlices = DATA.CANON_CHARACTERS.map(function (c) {
        return { id: c.id, label: c.name, weight: c.weight, canonObj: c };
      });
      return { title: '魂穿对象 · 降临哪位原著角色', subtag: '22位原作核心人物全收录', explain: '继承原主十维面板、生得术式、绝技与专属咒具，开启改命剧本！', slices: getSliceColors(cSlices) };
    }
    if (step.type === 'canon_timepoint') {
      return { title: '魂穿「' + (char.canonCharName || '原著人物') + '」· 苏醒时间线', subtag: '挑选或随机切入原著节点的时刻', explain: '越早苏醒越有充足时间篡改怀玉/涩谷关键悲剧。', slices: getSliceColors(DATA.CANON_TIMEPOINTS) };
    }
    if (step.type === 'canon_sync') {
      return { title: '灵魂契合度判定', subtag: char.canonCharName + ' · 夺舍融魂测试', explain: '100%共鸣可突破原著面板天花板；排异低契则需要后天磨合。', slices: getSliceColors(DATA.CANON_SYNC_SLICES) };
    }
    if (step.type === 'canon_memory') {
      return { title: '前世原著剧本记忆保留度', subtag: '上帝视角先知权限', explain: '记忆越完整，智力与关键战避险判定越占绝对主动！', slices: getSliceColors(DATA.CANON_MEMORY_SLICES) };
    }
    if (step.type === 'canon_divergence') {
      return { title: '「' + (char.canonCharName || '原著角色') + '」核心改命方针', subtag: '决定你打破原著宿命的道路', explain: '或抢救便当同伴、或借先知狂卷悟道额外技巧、或与强援暗中结盟！', slices: getSliceColors(DATA.CANON_DIVERGENCE_SLICES) };
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
    if (step.type === 'identity_extra') {
      var extMeta = DATA.IDENTITY_EXTRA_WHEELS[step.key];
      return { title: extMeta ? extMeta.title : '身份专属特化分支', subtag: char.identityName + ' · 独特机缘', explain: '依据当前出身展开的独家分支机缘判定（普通人亦有机会脑改觉醒术式！）。', slices: getSliceColors(extMeta ? extMeta.slices : [{ label: '常态平稳过渡', weight: 100 }]) };
    }
    if (step.type === 'binding_vow') {
      return { title: '决战前夕 · 立下「束缚」契约', subtag: '咒术最核心的等价交换原则', explain: '可立誓公开术式稳健增伤，或赌上性命换取暴涨输出！', slices: getSliceColors(DATA.BINDING_VOWS) };
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

    } else if (step.type === 'canon_character') {
      var targetCanon = slice.canonObj || DATA.CANON_CHARACTERS.find(function (c) { return c.id === slice.id; }) || DATA.CANON_CHARACTERS[0];
      applyCanonTemplate(char, targetCanon, null);
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }
      effectText = '已夺舍降临为【' + targetCanon.name + '】（' + targetCanon.title + ' · ' + targetCanon.officialGrade + '）';

    } else if (step.type === 'canon_timepoint') {
      var chosenEraId = slice.id === 'native' ? (char.nativeEraId || char.birthEraId || 'canonStart') : slice.eraId;
      var cEraObj = DATA.ERAS.find(function (e) { return e.id === chosenEraId; }) || DATA.ERAS[4];
      char.birthEraId = cEraObj.id;
      char.birthEraLabel = cEraObj.label;
      char.currentEraId = cEraObj.id;
      char.currentEraLabel = cEraObj.short;
      effectText = slice.note + ' → 将于「' + cEraObj.label + '」开启原著改命！';
      state.stepQueue = state.stepQueue.concat(buildEraQueue(chosenEraId));

    } else if (step.type === 'canon_sync') {
      char.canonSyncLabel = slice.label;
      char.flags.canonSyncMode = slice.mode;
      if (slice.mode === 'perfect') {
        ['ceTotal', 'ceControl', 'taijutsu', 'talent'].forEach(function (k) {
          if (char.technique !== '天与咒缚（零咒力）' || k === 'taijutsu' || k === 'talent') {
            applyStatDelta(char, k, 1);
          }
        });
        char.attrs.bodyResist = clamp(char.attrs.bodyResist + 1, 0, 13);
        effectText = '灵魂100%共鸣超越原主！多项核心能力突破 +1，黑闪契合感暴涨！';
      } else if (slice.mode === 'high') {
        var boostKeys = char.technique === '天与咒缚（零咒力）' ? ['taijutsu', 'bodyResist'] : ['ceControl', 'versatility'];
        boostKeys.forEach(function (k) { applyStatDelta(char, k, 1); });
        effectText = '85%高度融魂，操纵与适应性提升 +1！';
      } else if (slice.mode === 'reject') {
        var nerfs = char.technique === '天与咒缚（零咒力）' ? ['taijutsu', 'versatility'] : ['ceControl', 'barrier'];
        nerfs.forEach(function (k) { applyStatDelta(char, k, -1); });
        effectText = '灵魂产生短暂排异，部分发挥微降 -1，需在后续战斗磨合弥补';
      } else {
        effectText = '顺利融合原著躯壳，完整继承原主巅峰属性与术式';
      }
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

    } else if (step.type === 'canon_memory') {
      char.canonMemoryLabel = slice.label;
      char.flags.scriptLevel = slice.scriptLevel;
      if (slice.iqBoost) applyStatDelta(char, 'iq', slice.iqBoost);
      effectText = slice.scriptLevel >= 2
        ? '完整全知剧本在握！智力 +' + slice.iqBoost + '，临场避险与战力判断全方面占据先手'
        : slice.scriptLevel === 1
          ? '保留关键剧情节点记忆，智力 +1，足以避开多数阴谋伏击'
          : slice.scriptLevel === -1
            ? '忘却全部穿书外挂，完全融入咒术世界人物本心'
            : '零星碎片印象隐约浮现，胜负全靠当下操作';

    } else if (step.type === 'canon_divergence') {
      char.canonDivergenceLabel = slice.label;
      char.flags.canonDivergence = slice.effect;
      if (slice.effect === 'save_all') {
        char.flags.rewroteFate = true;
        effectText = '立下救人改命宏愿！大战死局回避率与攻坚胜率提升！';
      } else if (slice.effect === 'extra_tech') {
        applyStatDelta(char, 'talent', 1);
        effectText = '借先知优势提前深研咒术极限！天赋 +1，即将额外抽取 1 项高级技巧！';
        state.stepQueue.unshift({ type: 'high_tech_pick', nth: 1, total: 1 });
      } else if (slice.effect === 'ally_shield') {
        char.flags.hasSecretAlly = true;
        effectText = '秘密缔结跨阵营盟约！决战每回合将获得隐藏盟友支援战值！';
      } else {
        applyStatDelta(char, 'taijutsu', 1);
        applyStatDelta(char, 'barrier', 1);
        effectText = '低调隐忍潜修基本功：体术 +1、结界术 +1！';
      }
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

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
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

    } else if (step.type === 'faction') {
      char.faction = slice.id;
      char.factionLabel = slice.label;
      effectText = slice.note;
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

    } else if (step.type === 'identity_extra') {
      if (slice.up1) applyStatDelta(char, slice.up1, slice.iqDouble ? 2 : 1);
      if (slice.up2) applyStatDelta(char, slice.up2, 1);
      if (slice.repBonus) char.reputationLevel += Math.round(slice.repBonus / 5);
      if (slice.awakenTech) {
        char.flags.civilianAwakened = true;
        if (char.officialGrade.indexOf('四级') >= 0 || char.officialGrade === '潜力体（高抗性常人）') {
          char.officialGrade = '准一级';
          char.gradeBonus = 6;
        }
        effectText = '奇迹发生！脑中沉睡的术式遭唤醒！即将当场补抽一门生得术式与高级技巧！';
        state.stepQueue.unshift({ type: 'high_tech_pick', nth: 1, total: 1 });
        state.stepQueue.unshift({ type: 'technique' });
      } else {
        effectText = slice.note || slice.label;
      }
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

    } else if (step.type === 'binding_vow') {
      char.flags.bindingVowPicked = true;
      char.flags.activeVowId = slice.id;
      char.flags.activeVowLabel = slice.label;
      char.flags.vowAtkMult = slice.atkMult || 1.0;
      char.flags.vowDangerDelta = slice.dangerDelta || 0;
      if (slice.statBoost) {
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'ceEfficiency', 1);
      }
      effectText = slice.desc;

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
      if (!char.flags.bindingVowPicked) {
        state.stepQueue.unshift({ type: 'binding_vow' });
      }

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
        infinityBlocks: (slice.startWithGojo ? 4 : 0) + (slice.startWithGojo && char.flags.hasSecretAlly ? 1 : 0),
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
      var allySupport = char.flags.hasSecretAlly ? 12 : 0;
      state.boss.playerRoundPower = Math.round(getPowerBreakdown(char) * 0.35) + allySupport;
      state.boss.enemyRoundPower = 0;
      state.boss.usedMovesThisRound = [];
      state.boss.playerMovesLeft = pCnt;
      effectText = '我方本回合共获 ' + pCnt + ' 次出手契机！' + (allySupport ? '（含秘密盟友援护 +' + allySupport + ' 战值）' : '');
      for (var pm = pCnt; pm >= 1; pm--) {
        state.stepQueue.unshift({ type: 'boss_player_move', nth: pm, total: pCnt });
      }

    } else if (step.type === 'boss_player_move') {
      state.boss.playerMovesLeft = Math.max(0, state.boss.playerMovesLeft - 1);
      var myBase = Math.max(12, Math.round(getPowerBreakdown(char) * 0.28));
      var vowMultMove = char.flags.vowAtkMult || 1;
      var rawAtk = Math.round(myBase * (slice.mult || 1.1) * vowMultMove);
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
    var unlockedIds = [];

    function unlock(id) {
      if (id && unlockedIds.indexOf(id) === -1) unlockedIds.push(id);
    }

    function addTrait(name, score, desc, catalogId) {
      traits.push({ name: name, score: score, desc: desc });
      if (catalogId) unlock(catalogId);
    }

    var attrVals = DATA.ATTRIBUTE_DEFS.map(function (d) { return attrs[d.key] || 0; });
    var exCount = attrVals.filter(function (v) { return v >= 10; }).length;
    var maxV = Math.max.apply(null, attrVals);
    var minV = Math.min.apply(null, attrVals);

    if (flags.beatSukunaShinjuku) {
      addTrait('新宿弑王者', +10, '在新宿多回合决战中压制并战胜宿傩！', 't_omega');
    }
    if (char.identityId === 'canon' && !flags.killedInAction) {
      addTrait('魂穿入局 · 逆天改命', +7, '魂穿原著「' + (char.canonCharName || '主角') + '」完整走完命运线并活到终点', 't_canon_soul');
    }
    if (char.identityId === 'canon' && flags.canonSyncMode === 'perfect') {
      addTrait('百分百共鸣 · 超越原主', +8, '灵魂100%共鸣突破原著天花板上限', 't_canon_perfect');
    }
    if (char.identityId === 'canon' && flags.scriptLevel >= 1) {
      addTrait('剧本先知棋手', +5, '手握原著关键节点先知布局规避阴谋', 't_canon_prophet');
    }
    if (flags.canonSyncMode === 'reject' && flags.killedInAction) {
      addTrait('魂穿水土不服 · 逆境陨落', -4, '灵魂排异未磨合彻底便遗憾倒在战场', 't_glass_cannon');
    }
    if (flags.activeVowId === 'vow_life' && !flags.killedInAction) {
      addTrait('舍命死契的狂徒', +8, '立下赌命束缚决战宿傩且依然存活', 't_vow_breaker');
    } else if (flags.activeVowId && flags.activeVowId !== 'vow_none' && !flags.killedInAction) {
      addTrait('善用束缚的宗师', +4, '以精准束缚等价交换推高决战上限', 't_binding_vow');
    }
    if (flags.civilianAwakened) {
      addTrait('凡胎觉醒生得术式', +6, '以普通人开局意外觉醒生得术式踏入主舞台', 't_awakened_civilian');
    }
    if (char.technique === '天与咒缚（零咒力）' && log.wins >= 2) {
      addTrait('天与暴君（零咒力之巅）', +7, '凭零咒力肉体与咒具击溃诸多强敌', 't_heaven');
    }
    if (log.wins >= 1) {
      addTrait('旗开得胜', +1, '生涯至少赢下一场正式对决', 't_first_win');
    }
    if ((char.cursedCorpses || []).length > 0) {
      addTrait('百鬼造骸大匠', +8, '成功亲手制造并率领 ' + char.cursedCorpses.length + ' 具自律咒骸参战', 't_corpse_master');
    }
    if (log.beatStronger) {
      addTrait('以下克上', +5, '战胜至少一名综合战力强于自己的敌人', 't_overcome');
    }
    if ((char.birthEraId === 'heian' || char.birthEraId === 'edo400') && !flags.killedInAction) {
      addTrait('活化石 · 时代见证者', +8, '从千年前或四百年前一路活跃至六十八年后', 't_fossil');
    }
    if (char.currentEraId === 'future68' && !flags.killedInAction) {
      addTrait('68年后依旧健在的传奇', +6, '平稳跨入并活跃于宿傩落幕六十八年后的世界', 't_legend_68');
    }
    if (flags.preservedToFuture) {
      addTrait('封存到未来', +5, '经封存沉睡或咒物化跨越时代在现代苏醒', 't_sealed_future');
    }
    if (char.officialGrade === '特级') {
      addTrait('特级评定认证', +6, '站上咒术界「特级」规格外宝座', 't_special_grade');
    }
    if (char.faction === 'evil' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('乱世枭雄', +6, '保持暗面阵营立场并赢下四场以上激战活到结局', 't_warlord');
    }
    if (char.faction === 'good' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('咒术界支柱', +6, '正道立场奋战四胜以上并护卫世间直至终局', 't_six_eyes');
    }
    if (log.wins >= 5) {
      addTrait('连战连捷战神', +5, '全生涯累计胜场 ≥ 5 场（实际 ' + log.wins + ' 胜）', 't_double_kill');
    }
    if (exCount >= 2) {
      addTrait('双绝以上', +5, '最终十维属性达到 EX 及以上数量 ≥ 2', 't_dual_ex');
    }
    if (attrs.ceEfficiency >= 10) {
      addTrait('滴水不漏', +4, '咒力效率达到 EX 级别比肩六眼', 't_drip_less');
    }
    if (attrs.bodyResist >= 10) {
      addTrait('金刚不坏', +4, '身体抗性达到 EX 级别屹立不倒', 't_adamant');
    }
    if (char.skills.indexOf('领域展开') >= 0) {
      addTrait('领域主宰', +5, '成功掌握咒术最高境界「领域展开」', 't_domain');
    }
    if (flags.awakenedRCTInBattle) {
      addTrait('绝境抓核', +6, '在濒危败局伤势转盘中当场抓准咒力核心领悟反转术式！');
    }
    if (log.defeatedEnemies.indexOf('choso') >= 0) {
      addTrait('赤血断流', +5, '在实战交锋中击败九相图·胀相', 't_choso_slayer');
    }
    if (log.defeatedEnemies.indexOf('toji') >= 0) {
      addTrait('破灭术师杀手', +6, '在怀玉夜正面对决击败天与暴君伏黑甚尔', 't_toji_slayer');
    }
    if (log.defeatedEnemies.indexOf('dabura') >= 0) {
      addTrait('超光速之外', +8, '在六十八年后的切磋中击败达布拉', 't_dabura_clear');
    }
    if (log.blackFlashes >= 2) {
      addTrait('黑闪的宠儿', +5, '生涯多次爆发灵魂共振的黑闪一击（共 ' + log.blackFlashes + ' 次）');
    }
    if (log.survivedDeath > 0 && !flags.killedInAction) {
      addTrait('大难不死', +4, '多次熬过死亡风险判定绝地翻盘');
    }
    if (flags.gojoSealed === false) {
      addTrait('4% 奇迹见证者', +7, '涉谷见证五条悟未被封印的神级改写世界线', 't_save_gojo');
    }
    if (char.flags.nanamiDead === false && (log.defeatedEnemies.indexOf('真人') >= 0 || (char.statsLog && char.statsLog.savedNanami))) {
      addTrait('涉谷站台救下七海建人', +7, '于涉谷站台死保七海前辈改写遗憾', 't_save_nanami');
    }
    if (char.identityId === 'civilian' && !flags.killedInAction && log.wins + log.losses <= 2) {
      addTrait('平平安安是福', +4, '普通人视角稳健远离致命冲突平安走完一生', 't_civilian_peace');
    }

    if (log.lostToWeaker) {
      addTrait('区', -4, '曾被基础战力弱于自己的对手击败');
    }
    if ((log.wins + log.losses) >= 5 && log.blackFlashes === 0) {
      addTrait('黑闪绝缘体', -3, '打满五场以上高强度对决却一次黑闪未出', 't_neg_no_bf');
    }
    if (maxV - minV >= 8) {
      addTrait('极端加点', -5, '核心属性最大阶级落差达 8 级以上', 't_neg_extreme');
    }
    if (flags.nanamiDead && !flags.killedInAction) {
      addTrait('最后的加班', -3, '见证涩谷事变七海建人壮烈谢幕', 't_neg_overtime');
    }
    if (flags.killedInAction) {
      var deathId = char.currentEraId === 'shibuya' ? 't_shibuya_fall' : char.currentEraId === 'shinjuku' ? 't_sukuna_slain' : '';
      addTrait('半途折戟', -6, '战死于残酷时代或新宿决战之中', deathId);
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
      unlockedIds: unlockedIds,
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

  /* ==================== 扩展引擎：性别/御三家/咒骸/委托/降灵/新宿完全体/多指针 ==================== */
  var EXT_STEP_MAP = {
    gender: true,
    elder_clan_decide: true,
    elder_clan_pick: true,
    elder_clan_inherit: true,
    corpse_decide: true,
    corpse_count: true,
    corpse_body_type: true,
    corpse_subform: true,
    corpse_autonomy: true,
    corpse_atk: true,
    corpse_def: true,
    corpse_hp: true,
    corpse_core_count: true,
    corpse_core_ability: true,
    exorcism_commission: true,
    seance_collect: true,
    seance_summon: true,
    boss_player_count: true,
    boss_player_move: true,
    boss_gojo_count: true,
    boss_gojo_move: true,
    boss_uv_effect: true,
    boss_enemy_count: true,
    boss_enemy_move: true,
    boss_player_counter_check: true,
    boss_gojo_counter_check: true,
    boss_uv_cancel_check: true,
    boss_round_result: true,
    boss_injury: true,
    boss_agito_survive: true,
    boss_mahoraga_survive: true,
    boss_mahoraga_adapt_count: true,
    boss_mahoraga_adapt: true,
    boss_tool_survive: true,
    boss_gojo_join: true
  };

  var _pendingExtStep = null;

  function initExtensionFields(char) {
    if (!char.cursedCorpses) char.cursedCorpses = [];
    if (!char.seanceMaterials) char.seanceMaterials = [];
    if (!char.flags) char.flags = {};
    if (!char.statsLog) {
      char.statsLog = { wins: 0, losses: 0, blackFlashes: 0, heavyInjuries: 0, growthCount: 0, survivedDeath: 0, defeatedEnemies: [] };
    }
  }

  function hasPuppetCraftSkill(char) {
    return char.techniqueId === 'puppetMaster' ||
      (char.skills || []).indexOf('傀儡咒术学（咒骸制作）') >= 0;
  }

  function canSoloExorciseCommission(char) {
    var ce = (char.attrs && char.attrs.ceTotal) || 0;
    var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
    var corpses = char.cursedCorpses || [];
    return ce > 0 || activeTools.length > 0 || corpses.length > 0;
  }

  function maybeQueueCorpseCraft(state) {
    var char = state.char;
    initExtensionFields(char);
    if (hasPuppetCraftSkill(char) && !char.flags.corpseCraftAsked) {
      char.flags.corpseCraftAsked = true;
      state.stepQueue.unshift({ type: 'corpse_decide' });
    }
  }

  function initUpgradedBossState(state, slice) {
    var char = state.char;
    initExtensionFields(char);
    var isTrueForm = slice.id === 'higuruma_squad';
    state.boss = {
      active: true,
      round: 1,
      maxRounds: 3,
      orderId: slice.id,
      isTrueForm: isTrueForm,
      playerWins: 0,
      enemyWins: 0,
      enemyTitle: slice.enemyTitle,
      enemyBaseAtk: slice.baseAtk,
      agitoAlive: Boolean(slice.agito),
      mahoragaAlive: Boolean(slice.mahoraga),
      adaptations: {},
      totalAdaptations: 0,
      gojoJoined: Boolean(slice.startWithGojo),
      canGojoJoin: Boolean(slice.canGojoJoin),
      infinityBlocks: (slice.startWithGojo ? 4 : 0) + (slice.startWithGojo && char.flags.hasSecretAlly ? 1 : 0),
      gojoDomainCount: 0,
      gojoMovesTotal: 0,
      gojoMovesLeft: 0,
      gojoBfStacks: 0,
      gojoCancelPending: 0,
      gojoUvTriggered: false,
      playerMovesTotal: 0,
      playerMovesLeft: 0,
      playerChantStacks: 0,
      playerBfStacks: 0,
      playerDomainActive: false,
      playerCancelPending: 0,
      heavyDebuffStacks: 0,
      sukunaStun: 0,
      sukunaLastUvPower: 0,
      sukunaLoanStacks: 0,
      sukunaNextPenalty: 0,
      sukunaBfStacks: 0,
      sukunaDomainActive: false,
      sukunaActiveAdaptBonus: 0,
      sukunaMovesTotal: 0,
      sukunaMovesLeft: 0,
      playerRoundPower: 0,
      enemyRoundPower: 0,
      usedMovesThisRound: [],
      roundWon: false,
      squadAllyBonus: slice.squadAlly ? 14 : 0,
      lastAdaptPickCount: 1
    };
    state.stepQueue = state.stepQueue.filter(function (s) {
      return !s || !s.type || s.type.indexOf('boss_') !== 0;
    });
    state.stepQueue.unshift({ type: 'boss_player_count' });
  }

  function buildOneCorpseQueue(indexNum, totalNum) {
    return [
      { type: 'corpse_body_type', nth: indexNum, total: totalNum, draft: { name: '咒骸' + indexNum + '号', bodyType: '动物咒骸', atk: 5, def: 5, hp: 5, autonomous: true, cores: [] } }
    ];
  }

  function describeExtensionWheel(state, step) {
    var char = state.char;
    initExtensionFields(char);
    var boss = state.boss || {};

    if (step.type === 'gender') {
      return { title: '穿越后的性别判定', subtag: '重塑新生肉身轮廓', explain: '决定你在咒术界的初始性别特征。', slices: getSliceColors(DATA.GENDER_WHEEL) };
    }
    if (step.type === 'elder_clan_decide') {
      return { title: '咒术高层 · 是否出身御三家', subtag: '高层门阀血脉判定', explain: '出身五条/禅院/加茂御三家有机会直接继承祖传相传术式！', slices: getSliceColors(DATA.ELDER_CLAN_DECIDE) };
    }
    if (step.type === 'elder_clan_pick') {
      return { title: '御三家门第归属', subtag: '五条 · 禅院 · 加茂', explain: '决定你的姓氏门第与候选祖传术式。', slices: getSliceColors(DATA.ELDER_CLANS) };
    }
    if (step.type === 'elder_clan_inherit') {
      return { title: '本家相传术式继承判定', subtag: step.clan ? step.clan.label.split('（')[0] : '御三家血脉', explain: '成功继承可省去随缘抽术式直接拿祖传王牌！', slices: getSliceColors(DATA.INHERIT_CLAN_TECH) };
    }

    // 傀儡咒术学 · 造骸全链路
    if (step.type === 'corpse_decide') {
      return { title: '咒术傀儡学 · 是否制造咒骸', subtag: '核心编队构建', explain: '制造自律咒骸可大幅提升综合战力并在新宿决战协同迎敌！', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.decide) };
    }
    if (step.type === 'corpse_count') {
      return { title: '咒骸制作数量判定', subtag: '双核并造抑或精工一具', explain: '同时制造最多 2 具自律战斗咒骸。', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.counts) };
    }
    if (step.type === 'corpse_body_type') {
      return { title: '第 ' + step.nth + '/' + step.total + ' 具咒骸 · 身体类型', subtag: '傀儡形态基底', explain: '选择人形、32种动物形态或幻兽构型。', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.bodyTypes) };
    }
    if (step.type === 'corpse_subform') {
      var btId = step.draft && step.draft.bodyTypeId;
      var pool = btId === 'humanoid'
        ? DATA.CORPSE_CRAFT_DATA.humanoidForms
        : btId === 'phantom'
          ? DATA.CORPSE_CRAFT_DATA.phantomForms
          : DATA.CORPSE_CRAFT_DATA.animalForms.slice(0, 12);
      if (btId === 'animal') {
        // 随机抽12种动物呈现在清晰可读的转盘扇面上，保证32种全覆盖可轮换
        var allA = DATA.CORPSE_CRAFT_DATA.animalForms.slice();
        for (var k = allA.length - 1; k > 0; k--) {
          var r = Math.floor(Math.random() * (k + 1));
          var tmp = allA[k]; allA[k] = allA[r]; allA[r] = tmp;
        }
        pool = allA.slice(0, 12);
      }
      return {
        title: '咒骸 · 具体外形物种（' + (step.draft ? step.draft.bodyType : '动物咒骸') + '）',
        subtag: '第 ' + step.nth + ' 具外观拟态',
        explain: '涵盖熊猫、猛虎、巨蟒、螳螂、蝎子等32种拟态与幻兽模板。',
        slices: getSliceColors(pool.map(function (name) { return { id: name, label: name, weight: Math.round(100 / pool.length) }; }))
      };
    }
    if (step.type === 'corpse_autonomy') {
      return { title: '咒骸 · 是否可以自主行动', subtag: '人工灵核驱动模式', explain: '完全自主行动的咒骸战力更高！', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.autonomy) };
    }
    if (step.type === 'corpse_atk' || step.type === 'corpse_def' || step.type === 'corpse_hp') {
      var attrTitle = step.type === 'corpse_atk' ? '破坏力' : step.type === 'corpse_def' ? '防御力' : '生命力';
      return { title: '咒骸面板 · ' + attrTitle + '评级', subtag: step.draft ? step.draft.form : '咒骸', explain: '决定此具咒骸在实战中的攻防贡献值。', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.statRanks) };
    }
    if (step.type === 'corpse_core_count') {
      return { title: '咒骸 · 核心特殊能力数量', subtag: step.draft ? step.draft.form : '咒骸', explain: '最多可搭载 3 个互补特化咒核能力！', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.coreCounts) };
    }
    if (step.type === 'corpse_core_ability') {
      return { title: '咒骸第 ' + step.coreIdx + ' 个核心特殊能力', subtag: '回响炮 / 傀儡丝 / 替身残骸等', explain: '替身残骸可在濒危重创时替本体挡下一劫！', slices: getSliceColors(DATA.CORPSE_CRAFT_DATA.coreAbilities) };
    }

    // 祓除委托 & 降灵素材
    if (step.type === 'exorcism_commission') {
      if (!canSoloExorciseCommission(char)) {
        return {
          title: '高专 · 祓除委托接取校验',
          subtag: '零咒力/无咒具受限拦截',
          explain: '你当前咒力为 0 且身上没有可用咒具或咒骸，按规则无法独自接取祓除委托！',
          slices: [{ id: 'blocked', label: '零咒力无咒具·委托退回整备', weight: 100, color: '#64748b' }]
        };
      }
      return { title: '咒术高专 · 常规祓除委托', subtag: '历练刷战绩与属性奖励', explain: '接取悬赏消灭区域咒灵，提升熟练度与生涯胜场！', slices: getSliceColors(DATA.EXORCISM_COMMISSIONS) };
    }
    if (step.type === 'seance_collect') {
      return { title: '降灵术 · 降灵素材收集（' + step.round + '/' + step.total + '）', subtag: '仪式触媒准备阶段', explain: '每段事件独立重置素材池，集齐后发动降灵召唤！', slices: getSliceColors(DATA.SEANCE_MATERIAL_POOL) };
    }
    if (step.type === 'seance_summon') {
      return { title: '降灵术 · 降灵降临仪式！', subtag: '已集齐：' + (char.seanceMaterials || []).join(' + '), explain: '呼唤过往强者肉身或灵体协同助阵！', slices: getSliceColors(DATA.SEANCE_SUMMON_RESULTS) };
    }

    // 新宿决战 · 完全体回合制轮盘
    if (step.type === 'boss_player_count') {
      return { title: '第 ' + boss.round + ' 回合 · 我方出招次数', subtag: boss.enemyTitle + ' · 准备开战', explain: '决定本回合主角可以转动几次出招转盘。', slices: getSliceColors(DATA.BOSS_COUNT_SLICES.player) };
    }
    if (step.type === 'boss_player_move') {
      var chantTag = boss.playerChantStacks > 0 ? ' [完整咏唱×' + Math.pow(2, boss.playerChantStacks) + '待发]' : '';
      var bfTag = boss.playerBfStacks > 0 ? ' [黑闪无我×' + Math.pow(1.2, boss.playerBfStacks).toFixed(2) + ']' : '';
      return {
        title: '战斗盘 · 主角第 ' + step.nth + '/' + step.total + ' 招',
        subtag: '已习得术式专属池' + chantTag + bfTag,
        explain: '完整咏唱×2（不耗于治疗/领域/肘击），黑闪触发额外行动 2 次！',
        slices: getSliceColors(getPlayerBossMovesSlices(state))
      };
    }
    if (step.type === 'boss_gojo_count') {
      return { title: '战斗盘 · 五条悟本轮出招数', subtag: '最强协战爆发力', explain: '五条悟每轮可打出 3/4/5/6 乃至 9 次逆天攻势！', slices: getSliceColors(DATA.BOSS_COUNT_SLICES.gojo) };
    }
    if (step.type === 'boss_gojo_move') {
      return {
        title: '战斗盘 · 五条悟出招（' + step.nth + '/' + step.total + '）',
        subtag: '不可侵剩 ' + boss.infinityBlocks + ' 次 · 领域×' + (boss.gojoDomainCount || 0),
        explain: '黑闪额外行动 2 次，无量空处可封印宿傩下轮行动次数！',
        slices: getSliceColors(getGojoBossMovesSlices(boss))
      };
    }
    if (step.type === 'boss_uv_effect') {
      return { title: '无量空处 · 信息灌入程度', subtag: '宿傩受创削弱判定', explain: '将按比例消除十影宿傩接下来的出招次数！', slices: getSliceColors(DATA.GOJO_UV_EFFECTS) };
    }
    if (step.type === 'boss_enemy_count') {
      var stunInfo = (boss.sukunaStun || 0) + (boss.sukunaNextPenalty || 0);
      return {
        title: '战斗盘 · ' + boss.enemyTitle + '出招数',
        subtag: stunInfo > 0 ? '受无量空处/贷款减益 -' + stunInfo + ' 招' : '诅咒之王回合展开',
        explain: '宿傩抽取出招次数后再扣减受控/贷款惩罚。',
        slices: getSliceColors(DATA.BOSS_COUNT_SLICES.sukuna)
      };
    }
    if (step.type === 'boss_enemy_move') {
      return {
        title: '战斗盘 · ' + boss.enemyTitle + '第 ' + step.nth + '/' + step.total + ' 招',
        subtag: (boss.mahoragaAlive ? '魔虚罗在场 · ' : '') + (boss.sukunaLoanStacks > 0 ? '宿傩贷款×2待发' : '压迫性攻势'),
        explain: '注意「贷款」下击×2但下轮减招、以及魔虚罗「主动适应」与「世界斩」！',
        slices: getSliceColors(getSukunaBossMovesSlices(boss))
      };
    }
    if (step.type === 'boss_player_counter_check') {
      var barBonus = (char.attrs.barrier || 4) + (char.skills.indexOf('简易领域') >= 0 ? 3 : 0) + (char.skills.indexOf('领域展延') >= 0 ? 3 : 0);
      var bigPct = clamp(18 + barBonus * 2, 18, 52);
      var midPct = 36;
      return {
        title: '战斗盘 · 主角抵消敌方招式',
        subtag: '剩余待抵消 ' + (step.count || 1) + ' 次判定',
        explain: '削减宿傩本回合累积压制总值！',
        slices: [
          { id: 'big', label: '完美抵消！（敌方总战值 -38%）', pct: 0.38, weight: bigPct, color: '#2ac19a' },
          { id: 'mid', label: '成功格挡消解（敌方战值 -20%）', pct: 0.20, weight: midPct, color: '#29bce8' },
          { id: 'none', label: '未能完全化解', pct: 0, weight: Math.max(12, 100 - bigPct - midPct), color: '#ef5d58' }
        ]
      };
    }
    if (step.type === 'boss_gojo_counter_check') {
      return {
        title: '战斗盘 · 五条悟抵消敌方招式',
        subtag: '苍拳 / 瞬移反制拦截',
        explain: '以六眼微操硬生生抹消宿傩部分输出！',
        slices: [
          { id: 'big', label: '六眼完美抹消（敌方战值 -40%）', pct: 0.40, weight: 46, color: '#2ac19a' },
          { id: 'mid', label: '干扰偏折（敌方战值 -22%）', pct: 0.22, weight: 38, color: '#29bce8' },
          { id: 'none', label: '遭高速斩击擦过', pct: 0, weight: 16, color: '#ef5d58' }
        ]
      };
    }
    if (step.type === 'boss_uv_cancel_check') {
      return {
        title: '战斗盘 · 无量空处压制消招',
        subtag: '宿傩信息过载后续影响',
        explain: '无量空处余波削弱宿傩本轮攻势！',
        slices: [
          { id: 'big', label: '无量空处震荡压制（敌战值 -32%）', pct: 0.32, weight: 65, color: '#29bce8' },
          { id: 'mid', label: '轻微停滞（敌战值 -16%）', pct: 0.16, weight: 35, color: '#2ac19a' }
        ]
      };
    }
    if (step.type === 'boss_round_result') {
      var pVal = Math.max(10, Math.round(boss.playerRoundPower));
      var eVal = Math.max(10, Math.round(boss.enemyRoundPower));
      var winPct = clamp(Math.round((pVal / (pVal + eVal)) * 100), 12, 92);
      return {
        title: '战斗盘 · 胜负结算（我 ' + pVal + ' vs 敌 ' + eVal + '）',
        subtag: '新宿第 ' + boss.round + '/' + boss.maxRounds + ' 回合决断',
        explain: '胜率扇区严格依据双方真实累计战斗数值！',
        slices: [
          { id: 'win', label: '本轮压制胜出！', weight: winPct, color: '#2ac19a' },
          { id: 'loss', label: '本轮不敌受创', weight: 100 - winPct, color: '#ef5d58' }
        ]
      };
    }
    if (step.type === 'boss_injury') {
      var stacks = boss.heavyDebuffStacks || 0;
      var hasDecoy = (char.cursedCorpses || []).some(function (c) {
        return !c.decoyUsed && (c.cores || []).some(function (core) { return core.id === 'decoy_remnant'; });
      });
      var hasRCT = char.skills.indexOf('反转术式') >= 0;
      var bodyR = (char.attrs.bodyResist || 4);
      var deathW = clamp(12 + stacks * 16 - Math.floor(bodyR * 0.8), 6, 56);
      var coreW = hasRCT ? 8 : 16;
      var slices = [];
      if (hasDecoy) {
        slices.push({ id: 'decoy', label: '替身残骸核心挡刀！（免疫本轮重创）', weight: 28, color: '#2ac19a' });
      }
      slices.push({ id: 'core_rct', label: '抓准了咒力核心！！领悟反转术式', weight: coreW, color: '#29bce8' });
      slices.push({ id: 'heavy', label: '重伤咬牙再战（重创减益+1层：输出-30%）', weight: Math.max(25, 100 - deathW - coreW - (hasDecoy ? 28 : 0)), color: '#f59e0b' });
      slices.push({ id: 'dead', label: '力量耗尽当场战死！', weight: deathW, color: '#ef5d58' });
      return {
        title: '战斗盘 · 伤势 · 主角',
        subtag: stacks > 0 ? '当前重创减益×' + stacks + '（死斗边缘）' : '败北伤势判定',
        explain: '绝境有概率抓准咒力核心领悟反转术式；重伤叠层会扣 30% 输出并拉高死亡率！',
        slices: slices
      };
    }
    if (step.type === 'boss_agito_survive') {
      return {
        title: '召唤兽 · 嵌合兽颚吐 · 本轮能否存活',
        subtag: '十影兽退场判定',
        explain: '粉碎颚吐可切断宿傩顺手回血抽招！',
        slices: [{ id: false, label: '被彻底摧毁退场！', weight: boss.roundWon ? 68 : 30, color: '#2ac19a' }, { id: true, label: '顽强存活', weight: boss.roundWon ? 32 : 70, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_survive') {
      return {
        title: '召唤兽 · 魔虚罗 · 本轮能否存活',
        subtag: '八握剑异戒神将清除判定',
        explain: '魔虚罗存活将在轮末旋转法轮永久适应招式！',
        slices: [{ id: false, label: '彻底秒杀销毁魔虚罗！！', weight: boss.roundWon ? 54 : 20, color: '#2ac19a' }, { id: true, label: '法轮依然存活在场', weight: boss.roundWon ? 46 : 80, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_adapt_count') {
      return {
        title: '魔虚罗 · 本轮适应次数（' + (boss.totalAdaptations || 0) + '/13）',
        subtag: boss.sukunaActiveAdaptBonus > 0 ? '含主动适应 +' + boss.sukunaActiveAdaptBonus + ' 次' : '法轮转动计数',
        explain: '转动越快，越快让你常用核心技直接免疫 -100%！',
        slices: getSliceColors(DATA.MAHORAGA_ADAPT_COUNTS)
      };
    }
    if (step.type === 'boss_mahoraga_adapt') {
      var used = (boss.usedMovesThisRound && boss.usedMovesThisRound.length) ? boss.usedMovesThisRound : ['生得术式·全力出力猛攻'];
      var unique = used.filter(function (v, i, a) { return a.indexOf(v) === i; });
      return {
        title: '魔虚罗 · 本轮适应了哪一招（+' + (step.addCount || 1) + '层）',
        subtag: '当前适应总数 ' + (boss.totalAdaptations || 0) + '/13',
        explain: '同一招式被适应 1/2/3/4 次将永久减伤 30%/60%/90%/100%！',
        slices: getSliceColors(unique.map(function (mLabel) { return { id: mLabel, label: mLabel, weight: Math.round(100 / unique.length) }; }))
      };
    }
    if (step.type === 'boss_tool_survive') {
      var activeT = (char.tools || []).filter(function (t) { return !t.destroyed; });
      var t0 = activeT[0] || { shape: '咒具', indestructible: false };
      var t0Indest = Boolean(t0.indestructible || (t0.effect && t0.effect.indexOf('无坚不摧') >= 0));
      return {
        title: '咒具「' + t0.shape + '」· 本轮能否存留',
        subtag: t0Indest ? '无坚不摧特效护体！' : '高烈度对抗耐久检验',
        explain: t0Indest ? '绝对刚体绝对锋利永不折断！' : '惨烈碰撞中普通咒具可能当场崩毁。',
        slices: t0Indest
          ? [{ id: true, label: '无坚不摧完好存留！', weight: 100, color: '#2ac19a' }]
          : [{ id: true, label: '存留继续参战', weight: 74, color: '#2ac19a' }, { id: false, label: '本轮战斗损毁', weight: 26, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_gojo_join') {
      return {
        title: '强援 · 五条悟是否加入战斗',
        subtag: '最强入场奇兵判定',
        explain: '五条悟加入可获得【不可侵挡招】并助你施展无量空处！',
        slices: [{ id: true, label: '是！五条悟加入战团！', weight: 62, color: '#29bce8' }, { id: false, label: '否（继续孤战硬扛）', weight: 38, color: '#64748b' }]
      };
    }
    return { title: '命运轮盘', subtag: '阶段推进', explain: '', slices: [{ label: '继续', weight: 100, color: '#2ac19a' }] };
  }

  function applyExtensionOutcome(state, step, slice) {
    var char = state.char;
    initExtensionFields(char);
    var boss = state.boss;
    var effectText = '';

    if (step.type === 'gender') {
      char.gender = slice.label;
      effectText = '性别设定：' + slice.label;

    } else if (step.type === 'elder_clan_decide') {
      if (slice.id === true) {
        effectText = '身份为御三家嫡系出身！准备抽选所属名门';
        state.stepQueue.unshift({ type: 'elder_clan_pick' });
      } else {
        char.elderClan = '寒门元老';
        effectText = '出身寒门实权元老派系，全靠手腕稳坐高层';
      }

    } else if (step.type === 'elder_clan_pick') {
      char.elderClan = slice.label.split('（')[0];
      effectText = '确立门第：' + char.elderClan + '！准备判定是否继承祖传术式';
      state.stepQueue.unshift({ type: 'elder_clan_inherit', clan: slice });

    } else if (step.type === 'elder_clan_inherit') {
      if (slice.id === true && step.clan) {
        char.techniqueId = step.clan.techId;
        char.technique = step.clan.techLabel;
        char.techniquePower = step.clan.power || 14;
        char.flags.inheritedClanTech = true;
        // 若后续队列还排着泛用随机术式轮盘，则替换跳过之
        state.stepQueue = state.stepQueue.filter(function (s) { return s.type !== 'technique'; });
        effectText = '直接觉醒祖传术式「' + char.technique + '」！';
      } else {
        effectText = '未直接觉醒祖传相传术式，继续交由命运分派术式';
      }

    } else if (step.type === 'corpse_decide') {
      if (slice.id === true) {
        effectText = '决定亲手炼成自律咒骸协同战斗！';
        state.stepQueue.unshift({ type: 'corpse_count' });
      } else {
        effectText = '本次暂缓制造咒骸，专注自身打磨';
      }

    } else if (step.type === 'corpse_count') {
      var cCnt = slice.count || 1;
      effectText = '准备并线构建 ' + cCnt + ' 具咒骸！';
      for (var ci = cCnt; ci >= 1; ci--) {
        state.stepQueue.unshift({
          type: 'corpse_body_type',
          nth: ci,
          total: cCnt,
          draft: { name: '咒骸' + ci + '号', bodyType: '动物咒骸', bodyTypeId: 'animal', form: '熊猫', atk: 5, def: 5, hp: 5, autonomous: true, cores: [] }
        });
      }

    } else if (step.type === 'corpse_body_type') {
      var dr = Object.assign({}, step.draft, { bodyTypeId: slice.id, bodyType: slice.label });
      effectText = '第 ' + step.nth + ' 具定为：' + slice.label;
      state.stepQueue.unshift({ type: 'corpse_subform', nth: step.nth, total: step.total, draft: dr });

    } else if (step.type === 'corpse_subform') {
      var dr2 = Object.assign({}, step.draft, { form: slice.label, name: slice.label + '咒骸' });
      effectText = '具体拟态造型：' + slice.label;
      state.stepQueue.unshift({ type: 'corpse_autonomy', nth: step.nth, total: step.total, draft: dr2 });

    } else if (step.type === 'corpse_autonomy') {
      var dr3 = Object.assign({}, step.draft, { autonomous: Boolean(slice.id) });
      effectText = slice.id ? '达成完全自律核心！无需操丝实时遥控' : '采用咒丝高精度协同操纵';
      state.stepQueue.unshift({ type: 'corpse_atk', nth: step.nth, total: step.total, draft: dr3 });

    } else if (step.type === 'corpse_atk') {
      var dr4 = Object.assign({}, step.draft, { atk: slice.val || 5, atkRank: slice.label.split('（')[0] });
      effectText = dr4.form + ' 破坏力定格：' + dr4.atkRank;
      state.stepQueue.unshift({ type: 'corpse_def', nth: step.nth, total: step.total, draft: dr4 });

    } else if (step.type === 'corpse_def') {
      var dr5 = Object.assign({}, step.draft, { def: slice.val || 5, defRank: slice.label.split('（')[0] });
      effectText = dr5.form + ' 防御力定格：' + dr5.defRank;
      state.stepQueue.unshift({ type: 'corpse_hp', nth: step.nth, total: step.total, draft: dr5 });

    } else if (step.type === 'corpse_hp') {
      var dr6 = Object.assign({}, step.draft, { hp: slice.val || 5, hpRank: slice.label.split('（')[0] });
      effectText = dr6.form + ' 生命力定格：' + dr6.hpRank;
      state.stepQueue.unshift({ type: 'corpse_core_count', nth: step.nth, total: step.total, draft: dr6 });

    } else if (step.type === 'corpse_core_count') {
      var cn = slice.count || 0;
      if (cn <= 0) {
        char.cursedCorpses.push(step.draft);
        effectText = '完成无特殊核心体格咒骸「' + step.draft.form + '」制作！（共 ' + char.cursedCorpses.length + ' 具）';
      } else {
        effectText = '为「' + step.draft.form + '」装配 ' + cn + ' 个特殊能力咒核！';
        state.stepQueue.unshift({ type: 'corpse_core_ability', coreIdx: 1, totalCores: cn, nth: step.nth, total: step.total, draft: step.draft });
      }

    } else if (step.type === 'corpse_core_ability') {
      var dr7 = Object.assign({}, step.draft, { cores: (step.draft.cores || []).concat([{ id: slice.id, label: slice.label.split('（')[0] }]) });
      if (step.coreIdx < step.totalCores) {
        effectText = '已嵌入核心 #' + step.coreIdx + '：' + slice.label.split('（')[0];
        state.stepQueue.unshift({ type: 'corpse_core_ability', coreIdx: step.coreIdx + 1, totalCores: step.totalCores, nth: step.nth, total: step.total, draft: dr7 });
      } else {
        char.cursedCorpses.push(dr7);
        effectText = '自律咒骸「' + dr7.form + '」制作竣工入队！核心：' + dr7.cores.map(function (c) { return c.label; }).join(' / ');
      }

    } else if (step.type === 'exorcism_commission') {
      if (slice.id === 'blocked' || slice.skip) {
        effectText = slice.id === 'blocked'
          ? '零咒力无咒具校验拦截：无法独自接单，全队退回休整'
          : '放弃接取多余委托，保留体能迎战核心事件';
      } else {
        effectText = '接下高专委托！正面迎战「' + slice.enemyName + '」';
        state.stepQueue.unshift({
          type: 'fight_outcome',
          eraLabel: char.currentEraLabel,
          encounter: { enemyName: slice.enemyName, enemyPower: slice.enemyPower, statUp: slice.statUp, rewardStat: slice.statUp }
        });
      }

    } else if (step.type === 'seance_collect') {
      char.seanceMaterials.push(slice.label);
      if (step.round < step.total) {
        effectText = '收集到第 ' + step.round + ' 份降灵素材「' + slice.label + '」';
        state.stepQueue.unshift({ type: 'seance_collect', round: step.round + 1, total: step.total });
      } else {
        effectText = '素材全部集齐（' + char.seanceMaterials.join(' + ') + '），立刻发动降灵！';
        state.stepQueue.unshift({ type: 'seance_summon' });
      }

    } else if (step.type === 'seance_summon') {
      char.flags.seanceAllyBonus = (char.flags.seanceAllyBonus || 0) + (slice.powerBonus || 0);
      if (slice.statUp) applyStatDelta(char, slice.statUp, 1);
      effectText = slice.label;

    // ==================== 新宿决战 · 精细化Boss系统 ====================
    } else if (step.type === 'boss_player_count') {
      var cnt = slice.count || 4;
      var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
      var corpseAssist = getCorpsePowerBonus(char);
      var debuffMult = Math.pow(0.7, boss.heavyDebuffStacks || 0);
      var basePow = Math.round(getPowerBreakdown(char) * 0.34 * debuffMult) +
        (boss.round === 1 && char.flags.scriptLevel > 0 ? 5 : 0) +
        (boss.squadAllyBonus || 0) +
        Math.round(corpseAssist * 0.45);
      boss.playerRoundPower = Math.max(8, basePow);
      boss.enemyRoundPower = boss.enemyBaseAtk + (boss.round - 1) * 5 + (boss.agitoAlive ? 6 : 0) + (boss.mahoragaAlive ? 8 : 0);
      boss.playerMovesTotal = cnt;
      boss.playerMovesLeft = cnt;
      boss.usedMovesThisRound = [];
      boss.playerBfStacks = 0;
      boss.gojoBfStacks = 0;
      boss.sukunaBfStacks = 0;
      boss.playerDomainActive = false;
      boss.sukunaDomainActive = false;
      boss.playerCancelPending = 0;
      boss.gojoCancelPending = 0;
      boss.gojoUvTriggered = false;
      boss.sukunaLastUvPower = 0;
      boss.sukunaActiveAdaptBonus = 0;

      var toolNote = activeTools.length ? '｜参战咒具：' + activeTools.map(function (t) { return t.shape; }).join('、') : '';
      var corpseNote = char.cursedCorpses.length ? '｜咒骸助战+' + corpseAssist : '';
      effectText = '第 ' + boss.round + ' 回合我方共 ' + cnt + ' 次出招！基础战值 ' + boss.playerRoundPower + toolNote + corpseNote;
      state.stepQueue.unshift({ type: 'boss_player_move', nth: 1, total: cnt });

    } else if (step.type === 'boss_player_move') {
      boss.playerMovesLeft = Math.max(0, boss.playerMovesLeft - 1);
      var move = slice;
      var debuffMult2 = Math.pow(0.7, boss.heavyDebuffStacks || 0);
      var bfMult2 = Math.pow(1.2, boss.playerBfStacks || 0);

      if (move.isChant) {
        boss.playerChantStacks = (boss.playerChantStacks || 0) + 1;
        effectText = '完整咏唱完成！下一次有效术式攻击伤害 ×' + Math.pow(2, boss.playerChantStacks) + '（不耗于治疗/领域/肘击，可跨轮）';
      } else if (move.isHeal) {
        if ((boss.heavyDebuffStacks || 0) > 0) boss.heavyDebuffStacks -= 1;
        char.hpStatus = '健康';
        boss.playerRoundPower += 6;
        effectText = '反转术式修复创伤！伤势清零、减益层数 -1，且保留完整咏唱×' + Math.pow(2, boss.playerChantStacks || 0);
      } else if (move.isElbow) {
        var elbowGain = Math.round((move.power || 10) * debuffMult2 * bfMult2);
        boss.playerRoundPower += elbowGain;
        boss.usedMovesThisRound.push(move.label);
        effectText = move.label + '！战斗值 +' + elbowGain + '（完整咏唱安全保留）';
      } else if (move.isDomain) {
        boss.playerDomainActive = true;
        var domGain = Math.round(((move.power || 19) + (char.attrs.barrier || 5) * 0.9) * debuffMult2 * bfMult2);
        boss.playerRoundPower += domGain;
        boss.usedMovesThisRound.push(move.label);
        effectText = '展开生得领域！领域强压 +' + domGain + '（不消耗完整咏唱）';
      } else {
        // 常规有效术式攻击 / 黑闪 / 咒术科学 / 多重启动 / 百兵演武
        var rawPower = move.power || 16;
        var chantUsedText = '';
        if ((boss.playerChantStacks || 0) > 0 && move.isTechAttack) {
          var cMult = Math.pow(2, boss.playerChantStacks);
          rawPower *= cMult;
          chantUsedText = ' · 触发完整咏唱×' + cMult + '！！';
          boss.playerChantStacks = 0;
        }

        // 游云等咒具伤害增幅
        var ampTools = (char.tools || []).filter(function (t) { return !t.destroyed && t.effect && t.effect.indexOf('伤害增幅') >= 0; });
        if (ampTools.length > 0 && move.isTechAttack) {
          rawPower = Math.round(rawPower * 1.25);
        }

        if (move.breaksTool) {
          var intactIdx = (char.tools || []).findIndex(function (t) { return !t.destroyed; });
          if (intactIdx >= 0) {
            var curToolRef = char.tools[intactIdx];
            var curIndest = Boolean(curToolRef.indestructible || (curToolRef.effect && curToolRef.effect.indexOf('无坚不摧') >= 0));
            if (curIndest) {
              rawPower += 12;
              chantUsedText += ' · 无坚不摧咒具免于破碎！';
            } else {
              curToolRef.destroyed = true;
              rawPower += 10;
              chantUsedText += ' · 咒具「' + curToolRef.shape + '」碎裂爆发！';
            }
          }
        }

        var adaptLv = (boss.adaptations && boss.adaptations[move.label]) || 0;
        var adaptReduction = Math.min(1.0, adaptLv * 0.30);
        var finalGain = Math.round(rawPower * debuffMult2 * bfMult2 * (1 - adaptReduction));

        boss.playerRoundPower += finalGain;
        boss.usedMovesThisRound.push(move.label);

        if (move.isBlackFlash) {
          char.statsLog.blackFlashes += 1;
          if (char.skills.indexOf('黑闪') === -1) char.skills.push('黑闪');
          boss.playerBfStacks += 1;
          var addBF = Math.min(4, move.extraActions || 2);
          boss.playerMovesLeft += addBF;
          step.total += addBF;
        } else if (move.extraActions) {
          var addE = Math.min(2, move.extraActions);
          boss.playerMovesLeft += addE;
          step.total += addE;
        }
        if (move.cancels) {
          boss.playerCancelPending += move.cancels;
        }

        effectText = move.label + '：+' + finalGain + chantUsedText +
          (adaptLv > 0 ? '（魔虚罗已适应-' + Math.round(adaptReduction * 100) + '%）' : '') +
          (move.isBlackFlash ? '｜无我境界已激活，后续×1.2 & 黑闪概率飙升！' : '') +
          (move.cancels ? '｜排入抵消宿傩判定' : '');
      }

      if (boss.playerMovesLeft > 0) {
        state.stepQueue.unshift({ type: 'boss_player_move', nth: step.nth + 1, total: step.total });
      } else if (boss.gojoJoined) {
        state.stepQueue.unshift({ type: 'boss_gojo_count' });
      } else {
        state.stepQueue.unshift({ type: 'boss_enemy_count' });
      }

    } else if (step.type === 'boss_gojo_count') {
      var gCnt = slice.count || 4;
      boss.gojoMovesTotal = gCnt;
      boss.gojoMovesLeft = gCnt;
      effectText = '五条悟投入全力！本回合将释放 ' + gCnt + ' 次逆天攻势！';
      state.stepQueue.unshift({ type: 'boss_gojo_move', nth: 1, total: gCnt });

    } else if (step.type === 'boss_gojo_move') {
      boss.gojoMovesLeft = Math.max(0, boss.gojoMovesLeft - 1);
      var gm = slice;
      var gBfMult = Math.pow(1.2, boss.gojoBfStacks || 0);
      var gAdaptLv = (boss.adaptations && boss.adaptations[gm.label]) || 0;
      var gAdaptRed = Math.min(1.0, gAdaptLv * 0.30);
      var gPow = Math.round((gm.power || 18) * gBfMult * (1 - gAdaptRed));

      boss.playerRoundPower += gPow;
      boss.usedMovesThisRound.push(gm.label);

      if (gm.isUnlimitedVoid) {
        boss.gojoDomainCount = (boss.gojoDomainCount || 0) + 1;
        boss.gojoUvTriggered = true;
      }
      if (gm.isBlackFlash) {
        boss.gojoBfStacks += 1;
        var gAdd = Math.min(3, gm.extraActions || 2);
        boss.gojoMovesLeft += gAdd;
        step.total += gAdd;
      }
      if (gm.cancels) {
        boss.gojoCancelPending += gm.cancels;
      }

      effectText = '五条悟施展「' + gm.label.split('（')[0] + '」：我方 +' + gPow +
        (gm.isBlackFlash ? '（额外行动+2，无我×1.2！）' : '') +
        (gm.isUnlimitedVoid ? '（触发无量空处信息灌注！）' : '');

      if (boss.gojoMovesLeft > 0) {
        state.stepQueue.unshift({ type: 'boss_gojo_move', nth: step.nth + 1, total: step.total });
      } else if (boss.gojoUvTriggered) {
        state.stepQueue.unshift({ type: 'boss_uv_effect' });
      } else {
        state.stepQueue.unshift({ type: 'boss_enemy_count' });
      }

    } else if (step.type === 'boss_uv_effect') {
      boss.sukunaStun = (boss.sukunaStun || 0) + (slice.stun || 1);
      boss.sukunaLastUvPower = slice.stun || 1;
      effectText = '无量空处生效！宿傩下回合强制减少 ' + slice.stun + ' 次出招';
      state.stepQueue.unshift({ type: 'boss_enemy_count' });

    } else if (step.type === 'boss_enemy_count') {
      var rawECnt = slice.count || 4;
      var penalty = (boss.sukunaStun || 0) + (boss.sukunaNextPenalty || 0);
      boss.sukunaStun = 0;
      boss.sukunaNextPenalty = 0;
      var actualECnt = Math.max(1, rawECnt - penalty);
      boss.sukunaMovesTotal = actualECnt;
      boss.sukunaMovesLeft = actualECnt;
      effectText = '宿傩原本出招 ' + rawECnt + ' 次' +
        (penalty > 0 ? '，被无量空处/贷款扣除 ' + penalty + ' 次 -> 实际 ' + actualECnt + ' 次！' : '，实际 ' + actualECnt + ' 次！');
      state.stepQueue.unshift({ type: 'boss_enemy_move', nth: 1, total: actualECnt });

    } else if (step.type === 'boss_enemy_move') {
      boss.sukunaMovesLeft = Math.max(0, boss.sukunaMovesLeft - 1);
      var sm = slice;
      var sBfMult = Math.pow(1.2, boss.sukunaBfStacks || 0);

      if (sm.isLoan) {
        boss.sukunaLoanStacks = (boss.sukunaLoanStacks || 0) + 1;
        boss.sukunaNextPenalty = (boss.sukunaNextPenalty || 0) + 1;
        boss.sukunaMovesLeft += 1;
        step.total += 1;
        effectText = '宿傩发动「贷款」：下一次有效攻击伤害 ×2，下回合出招数 -1（可跨轮），再抽 1 次！';
      } else if (sm.isAgitoHeal) {
        boss.enemyBaseAtk = Math.max(25, boss.enemyBaseAtk + 2);
        boss.sukunaMovesLeft += 1;
        step.total += 1;
        effectText = '嵌合兽·颚吐反转恢复宿傩伤势（战值 +0，再抽 1 次）！';
      } else if (sm.isSummonMahoraga) {
        boss.mahoragaAlive = true;
        boss.enemyRoundPower += 5;
        boss.sukunaMovesLeft += 1;
        step.total += 1;
        effectText = '十影·魔虚罗破影降临！！宿傩额外行动 1 次，轮末魔虚罗存活将开始适应！';
      } else if (sm.isActiveAdapt) {
        boss.sukunaActiveAdaptBonus = (boss.sukunaActiveAdaptBonus || 0) + 1;
        effectText = '魔虚罗主动旋转背后法轮（战值 +0，轮末若存活适应次数再 +1）！';
      } else {
        var blocked = boss.infinityBlocks > 0 && sm.id !== 'worldSlash' && sm.id !== 'malevolentShrine';
        if (blocked) {
          boss.infinityBlocks -= 1;
          effectText = '【不可侵】完全弹开宿傩「' + sm.label.split('（')[0] + '」！五条悟不可侵剩 ' + boss.infinityBlocks + ' 次';
        } else {
          var dmg = sm.dmg || 15;
          var loanText = '';
          if ((boss.sukunaLoanStacks || 0) > 0) {
            var sLMult = Math.pow(2, boss.sukunaLoanStacks);
            dmg *= sLMult;
            loanText = ' · 触发宿傩贷款×' + sLMult + '！！';
            boss.sukunaLoanStacks = 0;
          }
          if (sm.id === 'malevolentShrine') {
            boss.sukunaDomainActive = true;
            if (boss.playerDomainActive) {
              dmg = Math.round(dmg * 0.55);
              loanText += '（生得领域与伏魔御厨子猛烈对冲抵消！）';
            }
          }
          var totalDmg = Math.round(dmg * sBfMult);
          boss.enemyRoundPower += totalDmg;

          if (sm.isBlackFlash) {
            boss.sukunaBfStacks += 1;
            var sAdd = Math.min(3, sm.extraActions || 2);
            boss.sukunaMovesLeft += sAdd;
            step.total += sAdd;
          }
          effectText = '宿傩「' + sm.label.split('（')[0] + '」：敌方战值 +' + totalDmg + loanText +
            (sm.isBlackFlash ? '（宿傩黑闪！额外行动+2，后续×1.2）' : '');
        }
      }

      if (boss.sukunaMovesLeft > 0) {
        state.stepQueue.unshift({ type: 'boss_enemy_move', nth: step.nth + 1, total: step.total });
      } else {
        var queueAfterEnemy = [{ type: 'boss_round_result' }];
        if (boss.sukunaLastUvPower > 0) queueAfterEnemy.unshift({ type: 'boss_uv_cancel_check' });
        if ((boss.gojoCancelPending || 0) > 0) queueAfterEnemy.unshift({ type: 'boss_gojo_counter_check', count: boss.gojoCancelPending });
        if ((boss.playerCancelPending || 0) > 0) queueAfterEnemy.unshift({ type: 'boss_player_counter_check', count: boss.playerCancelPending });
        for (var qi = queueAfterEnemy.length - 1; qi >= 0; qi--) {
          state.stepQueue.unshift(queueAfterEnemy[qi]);
        }
      }

    } else if (step.type === 'boss_player_counter_check' || step.type === 'boss_gojo_counter_check' || step.type === 'boss_uv_cancel_check') {
      var cutPct = slice.pct || 0;
      if (cutPct > 0) {
        var cutVal = Math.round(boss.enemyRoundPower * cutPct);
        boss.enemyRoundPower = Math.max(8, boss.enemyRoundPower - cutVal);
        effectText = slice.label + '！敌方总战值削减 -' + cutVal + '（现为 ' + boss.enemyRoundPower + '）';
      } else {
        effectText = '抵消未能命中核心，敌方维持 ' + boss.enemyRoundPower + ' 压制战值';
      }

    } else if (step.type === 'boss_round_result') {
      var won = slice.id === 'win';
      boss.roundWon = won;
      if (won) boss.playerWins += 1;
      else boss.enemyWins += 1;
      effectText = won
        ? '我方第 ' + boss.round + ' 回合正面压制胜出！（大比分 ' + boss.playerWins + ':' + boss.enemyWins + '）'
        : '本回合未能压住宿傩，进入伤势与减益检验！（大比分 ' + boss.playerWins + ':' + boss.enemyWins + '）';

      var evoSteps = [];
      if (!won) evoSteps.push({ type: 'boss_injury' });
      if (boss.agitoAlive) evoSteps.push({ type: 'boss_agito_survive' });
      if (boss.mahoragaAlive) evoSteps.push({ type: 'boss_mahoraga_survive' });
      if ((char.tools || []).some(function (t) { return !t.destroyed; })) evoSteps.push({ type: 'boss_tool_survive' });
      if (!boss.gojoJoined && boss.canGojoJoin) evoSteps.push({ type: 'boss_gojo_join' });
      evoSteps.push({ type: 'boss_next_round' });

      for (var ei = evoSteps.length - 1; ei >= 0; ei--) {
        state.stepQueue.unshift(evoSteps[ei]);
      }

    } else if (step.type === 'boss_injury') {
      if (slice.id === 'dead') {
        char.hpStatus = '已故';
        char.flags.killedInAction = true;
        boss.active = false;
        effectText = '新宿决战壮烈陨落！停步第 ' + boss.round + ' 回合，直转终局人生结算';
        state.stepQueue = [
          { type: 'final_reputation' },
          { type: 'radar', stage: 'final', title: '最终能力面板' },
          { type: 'settlement' }
        ];
      } else if (slice.id === 'decoy') {
        var decoyCorpse = (char.cursedCorpses || []).find(function (c) {
          return !c.decoyUsed && (c.cores || []).some(function (cr) { return cr.id === 'decoy_remnant'; });
        });
        if (decoyCorpse) decoyCorpse.decoyUsed = true;
        effectText = '咒骸「' + (decoyCorpse ? decoyCorpse.form : '替身') + '」引爆【替身残骸】，完美挡下致命重伤！！';
      } else if (slice.id === 'core_rct') {
        if (char.skills.indexOf('反转术式') === -1) char.skills.push('反转术式');
        char.flags.awakenedRCTInBattle = true;
        boss.heavyDebuffStacks = 0;
        char.hpStatus = '健康';
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'ceEfficiency', 1);
        effectText = '【抓准了咒力核心！！】绝境觉醒「反转术式」并清空重创减益！操纵与效率 +1';
      } else {
        boss.heavyDebuffStacks = (boss.heavyDebuffStacks || 0) + 1;
        char.hpStatus = '重伤';
        char.statsLog.heavyInjuries += 1;
        effectText = '咬牙硬扛继续死斗！获得「重创减益×' + boss.heavyDebuffStacks + '」（出力 -30%/层）';
      }

    } else if (step.type === 'boss_agito_survive') {
      boss.agitoAlive = Boolean(slice.id);
      effectText = boss.agitoAlive ? '嵌合兽·颚吐存活在场继续干扰！' : '嵌合兽·颚吐被当场消灭退场！';

    } else if (step.type === 'boss_mahoraga_survive') {
      boss.mahoragaAlive = Boolean(slice.id);
      if (boss.mahoragaAlive) {
        if ((boss.totalAdaptations || 0) < 13) {
          effectText = '魔虚罗存活！背后八握剑法轮开始咔哒旋转！';
          state.stepQueue.unshift({ type: 'boss_mahoraga_adapt_count' });
        } else {
          effectText = '魔虚罗存活且适应度已达上限 13/13！';
        }
      } else {
        effectText = '【高光时刻！！】魔虚罗已被当场完全轰碎！！';
      }

    } else if (step.type === 'boss_mahoraga_adapt_count') {
      var rawAdaptCnt = (slice.count || 1) + (boss.sukunaActiveAdaptBonus || 0);
      var addLv = rawAdaptCnt >= 5 ? 2 : 1;
      effectText = '法轮旋转累计判定 ' + rawAdaptCnt + ' 次！锁定下轮即将适应我方招式（+' + addLv + ' 层）';
      state.stepQueue.unshift({ type: 'boss_mahoraga_adapt', addCount: addLv });

    } else if (step.type === 'boss_mahoraga_adapt') {
      var mLabel = slice.label;
      var inc = Math.max(1, step.addCount || 1);
      var remainCap = Math.max(0, 13 - (boss.totalAdaptations || 0));
      var realInc = Math.min(remainCap, inc);
      boss.adaptations[mLabel] = (boss.adaptations[mLabel] || 0) + realInc;
      boss.totalAdaptations = Math.min(13, (boss.totalAdaptations || 0) + realInc);
      var redPct = Math.min(100, boss.adaptations[mLabel] * 30);
      effectText = '魔虚罗完成适应「' + mLabel.split('（')[0] + '」！该招永久减伤 ' + redPct + '%（总适应 ' + boss.totalAdaptations + '/13）';

    } else if (step.type === 'boss_tool_survive') {
      var activeTList = (char.tools || []).filter(function (t) { return !t.destroyed; });
      var firstT = activeTList[0];
      var isIndest = firstT && (firstT.indestructible || (firstT.effect && firstT.effect.indexOf('无坚不摧') >= 0));
      if (!slice.id && firstT && !isIndest) {
        firstT.destroyed = true;
        effectText = '惨烈对抗下，咒具「' + firstT.shape + '」当场断裂损毁！';
      } else {
        effectText = firstT ? '咒具「' + firstT.shape + '」完好存留，下一轮继续参战！' : '无损存留';
      }

    } else if (step.type === 'boss_gojo_join') {
      if (slice.id) {
        boss.gojoJoined = true;
        boss.infinityBlocks = (boss.infinityBlocks || 0) + 4 + (char.flags.hasSecretAlly ? 1 : 0);
        effectText = '最强的苍蓝瞳孔降临！五条悟加入战局，获得不可侵挡招！';
      } else {
        effectText = '五条悟仍在另一侧牵制，本局暂未并肩';
      }
    }

    return effectText;
  }

  var _origDescribeWheelForStep = describeWheelForStep;
  describeWheelForStep = function (state) {
    var top = state && state.stepQueue && state.stepQueue[0];
    if (top && top.type === '__ext_handled' && _pendingExtStep) {
      return describeExtensionWheel(state, _pendingExtStep);
    }
    if (top && EXT_STEP_MAP[top.type]) {
      return describeExtensionWheel(state, top);
    }
    return _origDescribeWheelForStep(state);
  };

  var _origApplySpinOutcome = applySpinOutcome;
  applySpinOutcome = function (state, slice) {
    var char = state.char;
    initExtensionFields(char);
    var peekStep = state.stepQueue && state.stepQueue[0];

    // 拦截并执行扩展流程 & 升级版 Boss 战流程（沿用原 snapshot / stepCount / timeline 日志）
    if (peekStep && EXT_STEP_MAP[peekStep.type]) {
      var realStep = cloneState(peekStep);
      _pendingExtStep = realStep;
      peekStep.type = '__ext_handled';
      state.stepQueue.splice(1, 0, { type: '__ext_hold' });

      var out = _origApplySpinOutcome(state, slice);
      _pendingExtStep = null;
      state.stepQueue = state.stepQueue.filter(function (s) { return s && s.type !== '__ext_hold'; });

      var extEffect = applyExtensionOutcome(state, realStep, slice);
      state.lastEffectText = extEffect;
      if (char.timeline.length > 0) {
        char.timeline[char.timeline.length - 1].effect = extEffect;
      }

      // 处理 Boss 跨回合流转或 Boss 完结退出
      while (state.stepQueue.length && state.stepQueue[0].type === 'boss_next_round') {
        state.stepQueue.shift();
        var b = state.boss;
        if (b && b.active) {
          if (b.playerWins >= 2 || (b.round >= b.maxRounds && b.playerWins >= b.enemyWins)) {
            b.active = false;
            char.flags.beatSukunaShinjuku = true;
            char.statsLog.wins += 1;
            char.statsLog.defeatedEnemies.push('两面宿傩');
            state.lastEffectText += '｜🎉 新宿决战大获全胜！正面击败两面宿傩！！';
          } else if (b.round >= b.maxRounds) {
            b.active = false;
            char.flags.foughtSukunaSurvived = true;
            char.statsLog.losses += 1;
            state.lastEffectText += '｜鏖战宿傩三回合全身而退，历史车轮继续向前！';
          } else {
            b.round += 1;
            b.playerRoundPower = 0;
            b.enemyRoundPower = 0;
            state.stepQueue.unshift({ type: 'boss_player_count' });
          }
          if (char.timeline.length > 0) char.timeline[char.timeline.length - 1].effect = state.lastEffectText;
        }
      }

      var topAfter = state.stepQueue[0];
      if (!topAfter && !state.finished) {
        state.stepQueue.push({ type: 'final_reputation' });
        state.stepQueue.push({ type: 'radar', stage: 'final', title: '最终能力面板' });
        state.stepQueue.push({ type: 'settlement' });
        topAfter = state.stepQueue[0];
      }
      if (topAfter && topAfter.type === 'radar') {
        state.stepQueue.shift();
        state.pendingRadar = topAfter;
        state.currentView = 'radar';
      } else if (topAfter && topAfter.type === 'settlement') {
        state.stepQueue.shift();
        state.currentView = 'settlement';
        state.finished = true;
        if (state.boss) state.boss.active = false;
      }

      return { resultLabel: out.resultLabel, effectText: state.lastEffectText };
    }

    // 针对原本流程节点的无痛前置/后置钩子
    var preType = peekStep ? peekStep.type : '';
    var hadFinishedInAction = Boolean(char.flags.killedInAction);
    var origOut = _origApplySpinOutcome(state, slice);

    if (!char.flags.killedInAction && !hadFinishedInAction) {
      if (preType === 'identity') {
        if (char.identityId === 'higherUp' && !char.flags.askedElderClan) {
          char.flags.askedElderClan = true;
          state.stepQueue.unshift({ type: 'elder_clan_decide' });
        }
        if (char.identityId !== 'canon' && !char.gender) {
          state.stepQueue.unshift({ type: 'gender' });
        }
      }

      if (preType === 'tool_effect' && char.tools && char.tools.length > 0 && slice) {
        var lastT = char.tools[char.tools.length - 1];
        if (slice.indestructible) lastT.indestructible = true;
        if (slice.nullify) lastT.nullify = true;
        if (slice.canCancelMove) lastT.canCancelMove = true;
        if (slice.damageMult) lastT.damageMult = slice.damageMult;
        if (slice.extraCe) lastT.extraCe = true;
        if (slice.thunderCast) lastT.thunderCast = true;
      }

      maybeQueueCorpseCraft(state);

      if (preType === 'shinjuku_sukuna_order') {
        initUpgradedBossState(state, slice);
      }

      if (preType === 'era_event') {
        var nextTop = state.stepQueue[0];
        var notInImmediateFight = !nextTop || (nextTop.type !== 'fight_outcome' && nextTop.type !== 'radar' && nextTop.type !== 'settlement');
        if (notInImmediateFight) {
          if (char.currentEraId === 'canonStart' && !char.flags.commModernDone) {
            char.flags.commModernDone = true;
            state.stepQueue.unshift({ type: 'exorcism_commission' });
          } else if (char.currentEraId === 'shibuya' && !char.flags.seanceEventDone && (char.techniqueId === 'seance' || Math.random() < 0.55)) {
            char.flags.seanceEventDone = true;
            char.seanceMaterials = []; // 每轮事件干净重置素材状态
            state.stepQueue.unshift({ type: 'seance_collect', round: 1, total: 2 });
          } else if (char.currentEraId === 'culling' && !char.flags.commCullingDone) {
            char.flags.commCullingDone = true;
            state.stepQueue.unshift({ type: 'exorcism_commission' });
          }
        }
      }
    }

    return origOut;
  };

  function getStepPointerCount(state, preferredCount) {
    if (!state || !preferredCount || preferredCount <= 1) return 1;
    var top = state.stepQueue && state.stepQueue[0];
    if (!top) return 1;
    var allowed = {
      attr: true,
      skill: true,
      high_tech: true,
      growth_focus: true,
      shinjuku_prep_growth: true,
      boss_player_move: true,
      boss_gojo_move: true,
      seance_collect: true,
      corpse_core_ability: true,
      tool_effect: true
    };
    if (!allowed[top.type]) return 1;
    var desc = describeWheelForStep(state);
    if (!desc || !desc.slices || desc.slices.length < 3) return 1;
    return Math.min(preferredCount, desc.slices.length >= 6 ? 3 : 2);
  }

  function applyMultiSpinOutcome(state, allSlices) {
    if (!Array.isArray(allSlices) || allSlices.length <= 1) {
      return applySpinOutcome(state, Array.isArray(allSlices) ? allSlices[0] : allSlices);
    }
    var top = state.stepQueue && state.stepQueue[0];
    if (!top) return applySpinOutcome(state, allSlices[0]);

    // 十维属性轮盘与咒具特效：取多指针命中最高档作为主体结果
    if (top.type === 'attr' || top.type === 'tool_effect') {
      var best = allSlices.reduce(function (a, b) {
        var va = (a.level != null ? a.level : (a.bonus || 0));
        var vb = (b.level != null ? b.level : (b.bonus || 0));
        return vb > va ? b : a;
      }, allSlices[0]);
      var resBest = applySpinOutcome(state, best);
      resBest.effectText = resBest.effectText + '（多指针并发保底取最优：' + best.label.split('（')[0] + '）';
      state.lastEffectText = resBest.effectText;
      if (state.char.timeline.length > 0) state.char.timeline[state.char.timeline.length - 1].effect = resBest.effectText;
      return resBest;
    }

    // 战斗出招与复合奖励：主指针正常推进 + 副指针追加连携爆发
    var primary = allSlices[0];
    var res = applySpinOutcome(state, primary);
    var extra = allSlices[1];
    if (extra && extra.label && extra.label !== primary.label) {
      if ((top.type === 'boss_player_move' || top.type === 'boss_gojo_move') && state.boss) {
        var bonusPow = Math.max(4, Math.round((extra.power || 12) * 0.55));
        state.boss.playerRoundPower += bonusPow;
        res.effectText += ' ＋【多指针连携：' + extra.label.split('（')[0] + ' +' + bonusPow + '】';
      } else if (top.type === 'skill' && extra.label && state.char.skills.indexOf(extra.label) === -1 && extra.label !== '无额外技巧') {
        state.char.skills.push(extra.label);
        res.effectText += ' ＋【多指针双获：' + extra.label + '】';
      } else if (top.type === 'seance_collect') {
        state.char.seanceMaterials.push(extra.label);
        res.effectText += ' ＋【双指针采集：' + extra.label + '】';
      }
      state.lastEffectText = res.effectText;
      if (state.char.timeline.length > 0) state.char.timeline[state.char.timeline.length - 1].effect = res.effectText;
    }
    return res;
  }

  global.JJK_OMEGA_ENGINE = {
    createRun: createRun,
    describeWheelForStep: describeWheelForStep,
    applySpinOutcome: applySpinOutcome,
    applyMultiSpinOutcome: applyMultiSpinOutcome,
    getStepPointerCount: getStepPointerCount,
    continueAfterRadar: continueAfterRadar,
    rerollLastSpin: rerollLastSpin,
    evaluateSettlement: evaluateSettlement,
    getRankMeta: getRankMeta,
    getPowerBreakdown: getPowerBreakdown,
    getCombatFormulaSummary: getCombatFormulaSummary,
    encodeFighterCode: encodeFighterCode,
    decodeFighterCode: decodeFighterCode,
    simulateArenaBattle: simulateArenaBattle
  };
})(window);
