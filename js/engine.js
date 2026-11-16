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

  function getEraIndex(eraId) {
    for (var i = 0; i < DATA.ERAS.length; i++) {
      if (DATA.ERAS[i].id === eraId) return i;
    }
    return 4;
  }

  function ensureCharSkill(char, sk) {
    if (!char.skills) char.skills = [];
    if (char.skills.indexOf(sk) === -1) char.skills.push(sk);
  }

  function ensureCharTool(char, toolObj) {
    if (!char.tools) char.tools = [];
    var exists = char.tools.some(function (t) { return t.shape === toolObj.shape; });
    if (!exists) char.tools.unshift(cloneState(toolObj));
  }

  function syncCanonProgressionForEra(char, eraId, isInit) {
    if (!char || char.identityId !== 'canon' || !char.canonCharId) return '';
    var id = char.canonCharId;
    var eraIdx = getEraIndex(eraId || char.currentEraId || 'canonStart');
    var note = '';

    if (id === 'gojo') {
      if (eraId === 'hiddenInv' && isInit) {
        char.canonTitle = '高专二年级 · 六眼无下限';
        char.gradeBonus = 15;
        char.skills = ['反转术式', '黑闪', '落之雪（落花之情）'];
        char.attrs.ceTotal = 8;
        char.attrs.ceControl = 10;
        char.attrs.ceEfficiency = 12;
        char.attrs.taijutsu = 9;
        char.attrs.bodyResist = 9;
        char.attrs.soulResist = 8;
        char.attrs.barrier = 8;
        char.attrs.versatility = 9;
        char.attrs.iq = 9;
        char.attrs.talent = 11;
      } else if (eraIdx >= 3 || eraIdx <= 1) {
        char.canonTitle = '现代最强 · 六眼无下限';
        char.gradeBonus = Math.max(char.gradeBonus || 15, 19);
        ['反转术式', '领域展开', '黑闪', '简易领域', '落之雪（落花之情）'].forEach(function (s) { ensureCharSkill(char, s); });
        char.attrs.ceTotal = Math.max(char.attrs.ceTotal || 0, 9);
        char.attrs.ceControl = Math.max(char.attrs.ceControl || 0, 12);
        char.attrs.ceEfficiency = Math.max(char.attrs.ceEfficiency || 0, 13);
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 11);
        char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 10);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 11);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 11);
        char.attrs.iq = Math.max(char.attrs.iq || 0, 10);
        char.attrs.talent = Math.max(char.attrs.talent || 0, 12);
        if (!isInit) note = '五条悟步入全盛期：无量空处与全套高阶技巧完备';
      }
    } else if (id === 'geto') {
      if (eraId === 'hiddenInv' && isInit) {
        char.canonTitle = '高专双璧 · 咒灵操使';
        char.faction = 'good';
        char.factionLabel = '高专/正道阵营（怀玉时期）';
        char.moralityLevel = 7;
        char.moralityText = '守护弱者正道（苦夏前）';
        char.tools = [];
      } else if (eraIdx >= 3) {
        char.canonTitle = '盘星教主 · 极之番漩涡';
        if (isInit) {
          char.faction = 'evil';
          char.factionLabel = '诅咒/暗面阵营（百鬼夜行）';
          char.moralityLevel = 3;
          char.moralityText = '大义叛离高专';
        }
        ensureCharTool(char, { shape: '三节棍（游云）', effect: '伤害增幅（游云）', bonus: 7, damageMult: 1.25, tier: '特级' });
        char.attrs.ceTotal = Math.max(char.attrs.ceTotal || 0, 9);
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 9);
      }
    } else if (id === 'yuta') {
      if (eraId === 'vol0' && isInit) {
        char.canonTitle = '特级被咒者 · 祈本里香之主';
        char.skills = ['反转术式', '黑闪'];
        char.attrs.ceControl = 7;
        char.attrs.barrier = 7;
        char.attrs.versatility = 9;
      } else if (eraIdx >= 4) {
        char.canonTitle = '现代特级 · 模倣术式与里香外置术式库';
        ['反转术式', '领域展开', '黑闪'].forEach(function (s) { ensureCharSkill(char, s); });
        char.attrs.ceControl = Math.max(char.attrs.ceControl || 0, 8);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 9);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 10);
        if (!isInit) note = '乙骨忧太完全掌握领域展开「真赝相爱」';
      }
    } else if (id === 'itadori') {
      if (eraIdx >= 5) {
        char.officialGrade = '一级';
        char.gradeBonus = Math.max(char.gradeBonus || 4, 8);
        char.technique = '黑闪连打 / 宿傩受肉体';
        char.attrs.ceControl = Math.max(char.attrs.ceControl || 0, 7);
        char.attrs.ceEfficiency = Math.max(char.attrs.ceEfficiency || 0, 7);
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 10);
        char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 10);
        char.attrs.soulResist = Math.max(char.attrs.soulResist || 0, 10);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 6);
      }
      if (eraIdx >= 6) {
        ensureCharSkill(char, '简易领域');
        char.attrs.ceTotal = Math.max(char.attrs.ceTotal || 0, 7);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 5);
      }
      if (eraIdx >= 7) {
        char.canonTitle = '人外魔境 · 觉醒黑闪与双术式';
        char.officialGrade = '特级战力（一级评定）';
        char.gradeBonus = Math.max(char.gradeBonus || 8, 13);
        char.technique = '赤血操术 / 御厨子（现代式）';
        ['黑闪', '反转术式', '简易领域', '领域展开'].forEach(function (s) { ensureCharSkill(char, s); });
        ensureCharTool(char, { shape: '刚笼手（咒具臂铠）', effect: '伤害增幅（游云系）', bonus: 6, damageMult: 1.25, tier: '特级' });
        char.attrs.ceTotal = Math.max(char.attrs.ceTotal || 0, 8);
        char.attrs.ceControl = Math.max(char.attrs.ceControl || 0, 9);
        char.attrs.ceEfficiency = Math.max(char.attrs.ceEfficiency || 0, 8);
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 11);
        char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 11);
        char.attrs.soulResist = Math.max(char.attrs.soulResist || 0, 11);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 7);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 8);
        if (!isInit) note = '虎杖悠仁觉醒赤血操术、现代御厨子、反转术式与领域展开';
      }
    } else if (id === 'megumi') {
      if (eraIdx >= 5) {
        char.officialGrade = '一级';
        char.gradeBonus = Math.max(char.gradeBonus || 5, 8);
        ensureCharSkill(char, '领域展开');
        char.attrs.ceTotal = Math.max(char.attrs.ceTotal || 0, 7);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 7);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 9);
        if (!isInit) note = '伏黑惠习得领域展开「嵌合暗翳庭」并升至一级水准';
      }
    } else if (id === 'maki') {
      if (eraIdx === 5) {
        char.officialGrade = '二级（一级战力）';
        char.gradeBonus = Math.max(char.gradeBonus || 6, 8);
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 9);
        char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 9);
      } else if (eraIdx >= 6 || eraIdx <= 1) {
        char.canonTitle = '鬼人觉醒 · 天与全盛体';
        char.officialGrade = '特级';
        char.gradeBonus = 14;
        char.technique = '天与咒缚（零咒力）';
        char.attrs.ceTotal = 0;
        char.attrs.ceControl = 0;
        char.attrs.ceEfficiency = 0;
        char.attrs.barrier = 0;
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 12);
        char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 11);
        char.attrs.soulResist = Math.max(char.attrs.soulResist || 0, 9);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 8);
        char.attrs.iq = Math.max(char.attrs.iq || 0, 8);
        ensureCharTool(char, { shape: '释魂刀（大太刀）', effect: '无坚不摧（释魂刀）', bonus: 8, indestructible: true, damageMult: 1.25, tier: '特级' });
        if (!isInit) note = '禅院真希完全体觉醒为零咒力天与暴君，执掌释魂刀';
      }
    } else if (id === 'higuruma') {
      if (eraIdx >= 7) {
        char.canonTitle = '新宿决战 · 法庭天才临战突破';
        char.gradeBonus = Math.max(char.gradeBonus || 8, 12);
        ['领域展开', '领域展延', '反转术式'].forEach(function (s) { ensureCharSkill(char, s); });
        ensureCharTool(char, { shape: '处刑人之剑（审判重塑）', effect: '无坚不摧（处刑人之剑）与无效化术式', bonus: 7, nullify: true, canCancelMove: true, indestructible: true, damageMult: 1.25, tier: '特级' });
        char.attrs.ceControl = Math.max(char.attrs.ceControl || 0, 9);
        char.attrs.ceEfficiency = Math.max(char.attrs.ceEfficiency || 0, 8);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 10);
        char.attrs.talent = Math.max(char.attrs.talent || 0, 11);
        if (!isInit) note = '日车宽见在绝境交锋中学会领域展延与反转术式，并亮出处刑人之剑';
      }
    } else if (id === 'nobara') {
      if (eraIdx >= 5) {
        char.officialGrade = '二级（一级候补）';
        char.gradeBonus = Math.max(char.gradeBonus || 3, 6);
        char.attrs.ceControl = Math.max(char.attrs.ceControl || 0, 7);
        char.attrs.soulResist = Math.max(char.attrs.soulResist || 0, 8);
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 7);
      }
    } else if (id === 'todo') {
      if (eraIdx >= 6) {
        ensureCharTool(char, { shape: '手摇铁片（Vibraslap义手）', effect: '可抵消敌方招式减伤护盾（不义游戏·改）', bonus: 6, canCancelMove: true, tier: '一级' });
        char.attrs.versatility = Math.max(char.attrs.versatility || 0, 9);
      }
    } else if (id === 'naoya') {
      if (eraIdx >= 6) {
        char.canonTitle = '亚音速受胎进化 · 时胞月宫殿';
        char.officialGrade = '准特级';
        char.gradeBonus = Math.max(char.gradeBonus || 9, 12);
        ensureCharSkill(char, '领域展开');
        char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 10);
        char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 9);
        char.attrs.barrier = Math.max(char.attrs.barrier || 0, 8);
        if (!isInit) note = '禅院直哉进入死灭回游阶段，高速冲刺进化并展开领域「时胞月宫殿」';
      }
    }
    if (isHeavenZeroChar(char) && (char.attrs.ceTotal || 0) === 0) {
      char.ceTrait = { id: 'zero_ce', label: '零咒力天与肉体', bonus: 0 };
      char.domainProfile = null;
    } else if (char.skills && char.skills.indexOf('领域展开') >= 0 && DATA.CANON_DOMAIN_PROFILES && DATA.CANON_DOMAIN_PROFILES[id]) {
      char.domainProfile = cloneState(DATA.CANON_DOMAIN_PROFILES[id]);
    } else if (char.skills && char.skills.indexOf('领域展开') === -1) {
      char.domainProfile = null;
    }
    return note;
  }

  function resolveCeTraitById(traitId) {
    var list = DATA.CE_TRAIT_WHEEL || [];
    var hit = list.find(function (t) { return t.id === traitId; });
    return hit ? cloneState(hit) : { id: 'standard', label: '常规标准咒力', bonus: 0 };
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
    var targetEraId = (preset && preset.eraId && preset.eraId !== 'random') ? preset.eraId : canonObj.eraId;
    var eraMeta = DATA.ERAS.find(function (e) { return e.id === targetEraId; }) || DATA.ERAS[4];
    char.birthEraId = eraMeta.id;
    char.birthEraLabel = eraMeta.label;
    char.currentEraId = eraMeta.id;
    char.currentEraLabel = eraMeta.short;
    var techMeta = DATA.TECHNIQUES_ALL.find(function (t) { return t.id === canonObj.techniqueId; });
    char.techniqueId = canonObj.techniqueId || null;
    char.technique = canonObj.technique;
    char.techniquePower = techMeta ? techMeta.power : 14;
    char.techniqueDesc = canonObj.canonNote;
    char.officialGrade = canonObj.officialGrade;
    char.gradeBonus = canonObj.gradeBonus || 10;
    char.attrs = cloneState(canonObj.attrs);
    char.skills = canonObj.skills.slice();
    char.tools = cloneState(canonObj.tools || []);
    char.gender = (canonObj.id === 'nobara' || canonObj.id === 'maki' || canonObj.id === 'yuki' || canonObj.id === 'yorozu' || canonObj.id === 'uraume' || canonObj.id === 'uro' || canonObj.id === 'hana') ? '女' : '男';
    var canonTraitMap = DATA.CANON_CE_TRAITS || {};
    char.ceTrait = resolveCeTraitById((preset && preset.ceTraitId && preset.ceTraitId !== 'random') ? preset.ceTraitId : (canonTraitMap[canonObj.id] || 'standard'));
    if (canonObj.id === 'kashimo' || canonObj.id === 'higuruma') char.cullingPoints = 100;
    else if (canonObj.id === 'ryu') char.cullingPoints = 77;
    else if (canonObj.id === 'uro') char.cullingPoints = 70;
    else if (canonObj.id === 'hakari') char.cullingPoints = 60;
    if (canonObj.id === 'mechamaru') {
      if (!char.flags) char.flags = {};
      char.flags.corpseCraftAsked = true;
      char.cursedCorpses = [{
        name: '绝对形态·二号傀儡',
        form: '钢铁武者咒骸',
        bodyType: '人形咒骸',
        autonomous: true,
        atk: 8, def: 7, hp: 7,
        atkRank: 'SS', defRank: 'S', hpRank: 'S',
        cores: [{ id: 'echo_cannon', label: '回响炮（隔山打牛贯穿轰击）', atkBonus: 4 }]
      }];
    }
    char.looksLevel = canonObj.looks || 7;
    char.looksText = getRankMeta(char.looksLevel).code + '（原著容姿）';
    char.moralityLevel = canonObj.morality >= 3 ? 8 : canonObj.morality <= -3 ? 2 : 6;
    char.moralityText = canonObj.morality >= 3 ? '坚守良知正道' : canonObj.morality <= -3 ? '冷酷反派立场' : '亦正亦邪果决';
    char.aggroText = canonObj.aggro >= 8 ? '主动求战型' : canonObj.aggro >= 5 ? '积极迎战型' : '冷静克制务实';
    syncCanonProgressionForEra(char, eraMeta.id, true);
    char.canonBaseAttrs = cloneState(char.attrs);
    if (preset && preset.talentLv && preset.talentLv !== 'random') {
      char.attrs.talent = Math.max(char.attrs.talent || 4, parseInt(preset.talentLv, 10) || 8);
    }
    if (preset && preset.statOverrides && typeof preset.statOverrides === 'object') {
      Object.keys(preset.statOverrides).forEach(function (k) {
        var valStr = preset.statOverrides[k];
        if (valStr && valStr !== 'random' && char.attrs.hasOwnProperty(k)) {
          char.attrs[k] = clamp(parseInt(valStr, 10) || 4, 0, DATA.RANK_SCALE.length - 1);
        }
      });
    }
    if (preset && preset.perk && preset.perk !== 'random') {
      if (preset.perk === 'rct') ensureCharSkill(char, '反转术式');
      else if (preset.perk === 'domain') ensureCharSkill(char, '领域展开');
      else if (preset.perk === 'both') {
        ['反转术式', '领域展开', '黑闪'].forEach(function (sk) { ensureCharSkill(char, sk); });
      }
    }
    if (preset && preset.extraHighTechId && preset.extraHighTechId !== 'random') {
      var htObj = DATA.HIGH_TECHNIQUES.find(function (h) { return h.id === preset.extraHighTechId || h.label === preset.extraHighTechId; });
      if (htObj) ensureCharSkill(char, htObj.label);
    }
    if (!char.visitedEras) char.visitedEras = [];
    if (char.birthEraId && char.visitedEras.indexOf(char.birthEraId) === -1) {
      char.visitedEras.push(char.birthEraId);
    }
  }

  function markVisitedEra(char, eraId) {
    if (!char || !eraId) return;
    if (!char.visitedEras) char.visitedEras = [];
    if (char.visitedEras.indexOf(eraId) === -1) char.visitedEras.push(eraId);
  }

  var ZERO_CE_FORBIDDEN_SKILLS = {
    '反转术式': true,
    '咒力高速再生': true,
    '领域展开': true,
    '完整咏唱': true,
    '简易领域': true,
    '领域展延': true,
    '弥虚葛笼': true,
    '术式多重启动': true,
    '自动迎击术式': true,
    '落之雪（落花之情）': true
  };

  function isHeavenZeroChar(char) {
    return Boolean(char && (char.techniqueId === 'heavenZero' || char.technique === '天与咒缚（零咒力）'));
  }

  function hasHealingSkill(char) {
    var skills = (char && char.skills) || [];
    return skills.indexOf('反转术式') >= 0 || skills.indexOf('咒力高速再生') >= 0;
  }

  function isCurseEnemyName(name) {
    return Boolean(name && /咒灵|怨灵|假想|灾厄|漏瑚|真人|花御|陀艮|黑沐死|疱疮|宿傩/.test(String(name)));
  }

  function enforceIdentityStatFloors(char) {
    if (!char || !char.attrs || char.identityId === 'canon') return;
    if (isHeavenZeroChar(char)) {
      char.attrs.ceTotal = 0;
      char.attrs.ceControl = 0;
      char.attrs.ceEfficiency = 0;
      char.attrs.barrier = 0;
      char.attrs.taijutsu = Math.max(char.attrs.taijutsu || 0, 9);
      char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 8);
      char.attrs.soulResist = Math.max(char.attrs.soulResist || 0, 7);
      char.skills = (char.skills || []).filter(function (s) { return !ZERO_CE_FORBIDDEN_SKILLS[s]; });
      return;
    }
    if (char.identityId === 'curse') {
      if (char.skills && char.skills.indexOf('反转术式') >= 0) {
        char.skills = char.skills.filter(function (s) { return s !== '反转术式'; });
        if (char.skills.indexOf('咒力高速再生') === -1) char.skills.push('咒力高速再生');
      }
      char.attrs.ceTotal = Math.max(char.attrs.ceTotal || 0, 6);
      char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 5);
    } else if (char.identityId === 'corpse') {
      char.attrs.bodyResist = Math.max(char.attrs.bodyResist || 0, 5);
      char.attrs.soulResist = Math.max(char.attrs.soulResist || 0, 5);
    } else if (char.identityId === 'higherUp') {
      char.attrs.iq = Math.max(char.attrs.iq || 0, 6);
      char.attrs.barrier = Math.max(char.attrs.barrier || 0, 5);
    }
  }

  function enforceIdentityAndTechConstraints(char, stepQueue) {
    enforceIdentityStatFloors(char);
    if (isHeavenZeroChar(char)) {
      if ((char.attrs.ceTotal || 0) === 0) {
        char.ceTrait = { id: 'zero_ce', label: '零咒力天与肉体', bonus: 0 };
      }
      char.domainProfile = null;
      if (Array.isArray(stepQueue)) {
        for (var i = stepQueue.length - 1; i >= 0; i--) {
          var st = stepQueue[i];
          if (!st) continue;
          if (st.type === 'ce_trait' || st.type === 'domain_form') {
            stepQueue.splice(i, 1);
          } else if (st.type === 'attr' && DATA.ATTRIBUTE_WHEELS[st.index]) {
            var ak = DATA.ATTRIBUTE_WHEELS[st.index].attr;
            if (ak === 'ceTotal' || ak === 'ceControl' || ak === 'ceEfficiency' || ak === 'barrier') {
              stepQueue.splice(i, 1);
            }
          }
        }
      }
    }
  }

  function applyAttrTierFloor(char, attrTier) {
    if (!attrTier || attrTier === 'random') return;
    var minLv = attrTier === 'ex' ? 10 : attrTier === 's' ? 7 : attrTier === 'b' ? 5 : 0;
    if (!minLv) return;
    DATA.ATTRIBUTE_DEFS.forEach(function (d) {
      if (isHeavenZeroChar(char) && (d.key === 'ceTotal' || d.key === 'ceControl' || d.key === 'ceEfficiency' || d.key === 'barrier')) {
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

  function getPowerBreakdown(char, enemyName) {
    var a = char.attrs;
    var sumTen = a.ceTotal + a.ceControl + a.ceEfficiency + a.taijutsu + a.bodyResist +
      a.soulResist + a.barrier + a.versatility + a.iq + a.talent * 0.6;
    var hasDomain = char.skills.indexOf('领域展开') >= 0;
    var hasRct = hasHealingSkill(char);
    var skillBonus = char.skills.length * 2.8 + (char.techniquePower || 4) + (hasDomain ? 9 : 0) + (hasRct ? 5 : 0);
    var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
    var toolBonus = activeTools.reduce(function (sum, t) { return sum + (t.bonus || 3) + (t.extraCe ? 2 : 0); }, 0);
    var corpseBonus = getCorpsePowerBonus(char);
    var shikigamiExtra = (char.shikigamiAgeBonus || 0) + (char.shikigamiMechBonus || 0);
    var bondBonus = (char.identityId === 'shikigami' && char.flags && typeof char.flags.masterBondScore === 'number')
      ? char.flags.masterBondScore * 2
      : 0;
    var trueZeroCe = isHeavenZeroChar(char) && (a.ceTotal || 0) === 0;
    var heavenZeroBonus = trueZeroCe ? (a.taijutsu >= 11 ? 14 : a.taijutsu >= 9 ? 10 : a.taijutsu >= 7 ? 6 : 0) : 0;
    var antiCurseBonus = (char.shikigamiMechId === 'sword_exorcism' && isCurseEnemyName(enemyName)) ? 8 : 0;
    var seanceBonus = (char.flags && char.flags.seanceAllyBonus) ? char.flags.seanceAllyBonus : 0;
    var flagPowerBonus = (char.flags && char.flags.powerBonusAcc) ? char.flags.powerBonusAcc : 0;
    var ceTraitBonus = (!trueZeroCe && char.ceTrait && char.ceTrait.bonus) ? Math.round(char.ceTrait.bonus * 0.6) : 0;
    var domainFormBonus = (!trueZeroCe && hasDomain && char.domainProfile)
      ? (char.domainProfile.id === 'open_divine' ? 4 : char.domainProfile.id === 'rule_court' ? 1 : 0)
      : 0;
    var supplyMult = char.masterSupplyMult || 1;
    var vowMult = (char.flags && char.flags.vowAtkMult) ? char.flags.vowAtkMult : 1;
    var scriptBonus = (char.flags && char.flags.scriptLevel > 0) ? char.flags.scriptLevel * 2 : 0;
    var injuryPenalty = char.hpStatus === '重伤' ? 9 : char.hpStatus === '轻伤' ? 3 : 0;
    var raw = ((sumTen * 0.56 + skillBonus + toolBonus + corpseBonus + shikigamiExtra + bondBonus + heavenZeroBonus + antiCurseBonus + seanceBonus + flagPowerBonus + ceTraitBonus + domainFormBonus + (char.gradeBonus || 2)) * supplyMult * vowMult) + scriptBonus - injuryPenalty;
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
        { type: 'future68_decide' },
        { type: 'partner_bond' },
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
        queue.push({ type: 'culling_rule' });
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
        queue.push({ type: 'future68_decide' });
      } else {
        queue.push({ type: 'era_pick', eraId: era.id });
      }
    }

    queue.push({ type: 'partner_bond' });
    queue.push({ type: 'final_reputation' });
    queue.push({ type: 'radar', stage: 'final', title: '最终能力面板' });
    queue.push({ type: 'settlement' });
    return queue;
  }

  function buildInitialSetupSteps(char, preset) {
    var setup = [];
    var statOverrides = (preset && preset.statOverrides) || {};
    if (char.identityId === 'canon') {
      if (!char.canonCharId) {
        setup.push({ type: 'canon_character' });
      }
      var fixedSingleTp = Boolean(char.canonCharId) && (!preset || !preset.eraId || preset.eraId === 'random') && getCanonTimepointSlices(char).length <= 1;
      if ((!preset || !preset.eraId || preset.eraId === 'random') && !fixedSingleTp) {
        setup.push({ type: 'canon_timepoint' });
      }
      setup.push({ type: 'canon_sync' });
      setup.push({ type: 'canon_memory' });
      setup.push({ type: 'canon_divergence' });
      setup.push({ type: 'radar', stage: 'initial', title: '魂穿原著初始面板' });
      if ((preset && preset.eraId && preset.eraId !== 'random') || fixedSingleTp) {
        setup = setup.concat(buildEraQueue(char.birthEraId));
      }
      return setup;
    }

    if (!preset || !preset.genderId || preset.genderId === 'random') {
      setup.push({ type: 'gender' });
    }
    if (char.identityId === 'higherUp' && (!char.flags || !char.flags.askedElderClan)) {
      if (!char.flags) char.flags = {};
      char.flags.askedElderClan = true;
      setup.push({ type: 'elder_clan_decide' });
    }

    var hasExplicitTech = Boolean(preset && preset.techId && preset.techId !== 'random');
    var hasExplicitCeTrait = Boolean(preset && preset.ceTraitId && preset.ceTraitId !== 'random');
    var hasExplicitTools = Boolean(preset && preset.toolCount && preset.toolCount !== 'random');
    var isCivilianDefault = char.identityId === 'civilian' && !hasExplicitTech;
    if (isCivilianDefault) {
      char.techniqueId = 'civilian_none';
      char.technique = '无生得术式（常人）';
      char.techniquePower = 1;
      char.techniqueDesc = '生于平凡世俗，暂未觉醒生得术式';
      char.ceTrait = { id: 'standard', label: '微弱常人咒力', bonus: 0 };
    }

    if (char.identityId === 'shikigami') {
      setup.push({ type: 'shikigami_auto' });
      if (!preset || !preset.eraId || preset.eraId === 'random') setup.push({ type: 'birth_era' });
      if (!preset || !preset.birthplaceId || preset.birthplaceId === 'random') setup.push({ type: 'birthplace' });
      setup.push({ type: 'shikigami_body' });
      setup.push({ type: 'shikigami_age' });
      setup.push({ type: 'shikigami_mechanism' });
      if (!hasExplicitTech) setup.push({ type: 'technique' });
      if (!hasExplicitCeTrait && !isHeavenZeroChar(char)) setup.push({ type: 'ce_trait' });
      setup.push({ type: 'shikigami_master' });
      setup.push({ type: 'shikigami_supply' });
      setup.push({ type: 'shikigami_bond' });
    } else {
      if (!preset || !preset.eraId || preset.eraId === 'random') setup.push({ type: 'birth_era' });
      if (!preset || !preset.birthplaceId || preset.birthplaceId === 'random') setup.push({ type: 'birthplace' });
      if (!hasExplicitTech && !isCivilianDefault) setup.push({ type: 'technique' });
      if (!hasExplicitCeTrait && !isCivilianDefault && !isHeavenZeroChar(char)) setup.push({ type: 'ce_trait' });
    }

    if (!preset || !preset.looksLv || preset.looksLv === 'random') setup.push({ type: 'looks' });
    if (!preset || !preset.moralityLv || preset.moralityLv === 'random') setup.push({ type: 'morality' });
    if (!preset || !preset.aggroLv || preset.aggroLv === 'random') setup.push({ type: 'aggro' });

    for (var i = 0; i < DATA.ATTRIBUTE_WHEELS.length; i++) {
      var attrKey = DATA.ATTRIBUTE_WHEELS[i].attr;
      if (isHeavenZeroChar(char) && (attrKey === 'ceTotal' || attrKey === 'ceControl' || attrKey === 'ceEfficiency' || attrKey === 'barrier')) {
        continue;
      }
      if (attrKey === 'talent' && preset && preset.talentLv && preset.talentLv !== 'random') {
        continue;
      }
      if (statOverrides[attrKey] && statOverrides[attrKey] !== 'random') {
        continue;
      }
      setup.push({ type: 'attr', index: i });
    }

    if (!isCivilianDefault) {
      setup.push({ type: 'high_tech_count' });
    }

    if (hasExplicitTools) {
      var fixedToolCnt = clamp(parseInt(preset.toolCount, 10) || 0, 0, 3);
      for (var ftc = 1; ftc <= fixedToolCnt; ftc++) {
        setup.push({ type: 'tool_shape', nth: ftc, total: fixedToolCnt, seed: Math.floor(Math.random() * 50) });
      }
    } else if (!isCivilianDefault) {
      setup.push({ type: 'tool_count' });
    }

    if (!preset || !preset.gradeId || preset.gradeId === 'random') {
      setup.push({ type: 'grade' });
    }
    if (char.identityId !== 'shikigami' && (!preset || !preset.factionChoice || preset.factionChoice === 'random')) {
      setup.push({ type: 'faction' });
    }
    if (char.identityId === 'corpse') {
      setup.push({ type: 'identity_extra', key: 'corpse_cores' });
      setup.push({ type: 'identity_extra', key: 'corpse_maker' });
    } else if (char.identityId === 'higherUp') {
      setup.push({ type: 'identity_extra', key: 'higherUp_scheme' });
    } else if (char.identityId === 'civilian') {
      setup.push({ type: 'identity_extra', key: 'civilian_awakening' });
    } else if (char.identityId === 'curse') {
      setup.push({ type: 'identity_extra', key: 'curse_origin' });
    } else if (char.identityId === 'curseUser') {
      setup.push({ type: 'identity_extra', key: 'curseUser_bounty' });
    }

    if (char.skills && char.skills.indexOf('领域展开') >= 0 && !isHeavenZeroChar(char) && !char.domainProfile) {
      if (!char.flags) char.flags = {};
      char.flags.domainFormAsked = true;
      setup.push({ type: 'domain_form' });
    }

    enforceIdentityAndTechConstraints(char, setup);
    setup.push({ type: 'radar', stage: 'initial', title: '初始能力面板' });

    if (preset && preset.eraId && preset.eraId !== 'random') {
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
      customPreset: preset,
      customAttrTier: preset && preset.attrTier ? preset.attrTier : 'random',
      presetToolEffectId: preset && preset.toolEffectId ? preset.toolEffectId : 'random',
      presetShinjukuOrderId: preset && preset.shinjukuOrderId ? preset.shinjukuOrderId : 'random',
      boss: { active: false },
      stepQueue: [],
      char: {
        identityId: 'sorcerer',
        identityName: '未定身份',
        gender: '',
        elderClan: '',
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
        visitedEras: [],
        birthplace: '东京都市圈',
        techniqueId: null,
        technique: '尚未抽取',
        techniquePower: 4,
        techniqueDesc: '暂未觉醒生得术式',
        ceTrait: { id: 'standard', label: '常规标准咒力', bonus: 0 },
        domainProfile: null,
        cullingPoints: 0,
        officialGrade: '未评级',
        gradeBonus: 2,
        master: null,
        masterSupplyMult: 1,
        masterSupplyLabel: '',
        masterBondLabel: '',
        shikigamiDesc: '',
        shikigamiAgeLabel: '',
        shikigamiMechLabel: '',
        shikigamiMechId: '',
        shikigamiAgeBonus: 0,
        shikigamiMechBonus: 0,
        looksLevel: 5,
        looksText: '未评定',
        moralityLevel: 5,
        moralityText: '未评定',
        aggroText: '正常',
        partnerLabel: '',
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
          bindingVowPicked: false,
          powerBonusAcc: 0,
          repBonusAcc: 0,
          masterBondScore: 0,
          corpseMultiCoreSave: false,
          corpseMultiCoreUsed: false,
          rabbitDecoyAvailable: false,
          rabbitDecoyUsed: false,
          firstRoundBossBonus: 0,
          shinjukuProtectBonus: 0
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
        markVisitedEra(state.char, eraObj.id);
      }
    }
    if (preset && preset.birthplaceId && preset.birthplaceId !== 'random') {
      var bpObj = DATA.BIRTHPLACE_SLICES.find(function (b) { return b.id === preset.birthplaceId || b.label === preset.birthplaceId; });
      if (bpObj) state.char.birthplace = bpObj.label;
    }
    if (preset && preset.genderId && preset.genderId !== 'random' && state.char.identityId !== 'canon') {
      var gdObj = DATA.GENDER_WHEEL.find(function (g) { return g.id === preset.genderId || g.label === preset.genderId; });
      if (gdObj) state.char.gender = gdObj.label;
    }
    if (preset && preset.looksLv && preset.looksLv !== 'random' && state.char.identityId !== 'canon') {
      var lkLv = parseInt(preset.looksLv, 10);
      var lkObj = DATA.LOOKS_WHEEL.find(function (l) { return l.level === lkLv; });
      if (lkObj) {
        state.char.looksLevel = lkObj.level;
        state.char.looksText = lkObj.label;
      }
    }
    if (preset && preset.moralityLv && preset.moralityLv !== 'random' && state.char.identityId !== 'canon') {
      var mrLv = parseInt(preset.moralityLv, 10);
      var mrObj = DATA.MORALITY_WHEEL.find(function (m) { return m.level === mrLv; });
      if (mrObj) {
        state.char.moralityLevel = mrObj.level;
        state.char.moralityText = mrObj.label;
      }
    }
    if (preset && preset.aggroLv && preset.aggroLv !== 'random' && state.char.identityId !== 'canon') {
      var agLv = parseInt(preset.aggroLv, 10);
      var agObj = DATA.AGGRO_WHEEL.find(function (a) { return a.level === agLv; });
      if (agObj) state.char.aggroText = agObj.label;
    }
    if (preset && preset.factionChoice && preset.factionChoice !== 'random' && state.char.identityId !== 'canon' && state.char.identityId !== 'shikigami') {
      var fMap = {
        good: '高专/正道阵营（自选）',
        evil: '诅咒/暗面阵营（自选）',
        neutral: '中立游走阵营（自选）'
      };
      state.char.faction = preset.factionChoice;
      state.char.factionLabel = fMap[preset.factionChoice] || '中立阵营';
    }
    if (preset && preset.techId && preset.techId !== 'random' && state.char.identityId !== 'canon') {
      var techObj = DATA.TECHNIQUES_ALL.find(function (t) { return t.id === preset.techId; });
      if (techObj) {
        state.char.techniqueId = techObj.id;
        state.char.technique = techObj.label;
        state.char.techniquePower = techObj.power;
        state.char.techniqueDesc = techObj.desc;
      }
    }
    if (preset && preset.ceTraitId && preset.ceTraitId !== 'random' && state.char.identityId !== 'canon') {
      state.char.ceTrait = resolveCeTraitById(preset.ceTraitId);
    }
    if (preset && preset.gradeId && preset.gradeId !== 'random' && state.char.identityId !== 'canon') {
      var allGrades = DATA.GRADE_WHEELS.standard.concat(DATA.GRADE_WHEELS.civilian || []);
      var grObj = allGrades.find(function (g) { return g.id === preset.gradeId; });
      if (grObj) {
        state.char.officialGrade = grObj.id;
        state.char.gradeBonus = grObj.bonus;
      }
    }
    if (preset && preset.talentLv && preset.talentLv !== 'random') {
      state.char.attrs.talent = Math.max(state.char.attrs.talent, parseInt(preset.talentLv, 10) || 8);
    }
    if (preset && preset.statOverrides && typeof preset.statOverrides === 'object') {
      Object.keys(preset.statOverrides).forEach(function (k) {
        var valStr = preset.statOverrides[k];
        if (valStr && valStr !== 'random' && state.char.attrs.hasOwnProperty(k)) {
          state.char.attrs[k] = clamp(parseInt(valStr, 10) || 4, 0, DATA.RANK_SCALE.length - 1);
        }
      });
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
    if (preset && preset.extraHighTechId && preset.extraHighTechId !== 'random') {
      var htObj = DATA.HIGH_TECHNIQUES.find(function (h) { return h.id === preset.extraHighTechId || h.label === preset.extraHighTechId; });
      if (htObj && state.char.skills.indexOf(htObj.label) === -1) {
        state.char.skills.push(htObj.label);
      }
    }
    if (preset && preset.attrTier && preset.attrTier !== 'random') {
      applyAttrTierFloor(state.char, preset.attrTier);
    }

    if (preset && preset.identityId && preset.identityId !== 'random') {
      enforceIdentityStatFloors(state.char);
      state.stepQueue = buildInitialSetupSteps(state.char, preset);
      state.lastResultText = '自选设定开局';
      state.lastEffectText = '已应用自选预设（' + state.char.identityName + '），继续抽取其余阶段';
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

  function buildFightSlices(state, enemyPower, enemyName) {
    var myPower = getPowerBreakdown(state.char, enemyName);
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
    var char = state.char;
    var bodyLv = char.attrs.bodyResist;
    var hasRct = hasHealingSkill(char);
    var zeroCe = isHeavenZeroChar(char);
    var isCurse = char.identityId === 'curse';
    var dangerDelta = char.flags.vowDangerDelta || 0;
    if (won) {
      var noInj = clamp(34 + bodyLv * 4 + (hasRct ? 12 : 0) + (zeroCe ? 8 : 0) - Math.round(dangerDelta * 0.5), 24, 86);
      var light = clamp(100 - noInj - 6, 12, 60);
      var heavy = Math.max(4, 100 - noInj - light);
      return [
        { id: 'none', label: '毫发无伤', weight: noInj, color: '#8fd14f' },
        { id: 'light', label: '轻伤无碍', weight: light, color: '#ffa500' },
        { id: 'heavy', label: '力战重伤', weight: heavy, color: '#ef5d58' }
      ];
    }

    var rewriteReduce = char.flags.rewroteFate ? 7 : 0;
    var hasMultiCore = Boolean(char.flags && char.flags.corpseMultiCoreSave && !char.flags.corpseMultiCoreUsed);
    var hasRabbitDecoy = Boolean(char.flags && char.flags.rabbitDecoyAvailable && !char.flags.rabbitDecoyUsed);
    var deathRisk = canDie ? clamp(22 - Math.floor(bodyLv * 1.3) - (hasRct ? 6 : 0) + Math.round(dangerDelta * 0.6) - rewriteReduce, 3, 28) : 0;
    if (char.hpStatus === '重伤' && canDie) deathRisk = clamp(deathRisk + 8, 5, 34);
    var rctBreakChance = (!hasRct && !zeroCe) ? clamp(6 + char.attrs.talent + char.attrs.ceControl, 8, 24) : 0;
    var decoyWeight = (hasMultiCore || hasRabbitDecoy) ? 22 : 0;
    var heavyLoss = clamp(42 - bodyLv * 2 + Math.round(dangerDelta * 0.4) - (decoyWeight ? 8 : 0), 14, 52);
    var lightLoss = Math.max(14, 100 - heavyLoss - deathRisk - rctBreakChance - decoyWeight);

    var slices = [];
    if (hasMultiCore) {
      slices.push({ id: 'core_decoy', decoyKind: 'multiCore', label: '切换备用咒核！免除此次重伤与致死判定', weight: decoyWeight, color: '#2ac19a' });
    } else if (hasRabbitDecoy) {
      slices.push({ id: 'core_decoy', decoyKind: 'rabbitDecoy', label: '脱兔分身替死！安全撤出重伤区', weight: decoyWeight, color: '#2ac19a' });
    }
    slices.push(
      { id: 'light', label: '轻伤突围', weight: lightLoss, color: '#ffa500' },
      { id: 'heavy', label: '重伤退避', weight: heavyLoss, color: '#ef5d58' }
    );
    if (rctBreakChance > 0) {
      slices.push({
        id: 'core_rct',
        label: isCurse ? '抓准了咒核极境！（咒力高速再生）' : '抓准了咒力核心！（逆转突破）',
        weight: rctBreakChance,
        color: '#29bce8'
      });
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
    var zeroCe = isHeavenZeroChar(char);
    var isCurse = char.identityId === 'curse';
    var pool = DATA.HIGH_TECHNIQUES;
    if (zeroCe) {
      pool = pool.filter(function (ht) { return ht.id === 'hundredWeapons'; });
    } else if (isCurse) {
      pool = pool.map(function (ht) {
        if (ht.id !== 'rct') return ht;
        return {
          id: 'curse_regen',
          label: '咒力高速再生',
          weight: ht.weight,
          power: ht.power,
          note: '咒灵以自身负能量高速修复受损躯体（同等于反转术式之再生效力）'
        };
      });
    }
    var remaining = pool.filter(function (ht) {
      return char.skills.indexOf(ht.label) === -1;
    });
    if (!remaining.length) {
      return zeroCe
        ? [{ id: 'heaven_peak', label: '天与体术极境（体术与身体抗性精进）', weight: 100 }]
        : [{ id: 'mastery', label: '技巧全面圆满（全属性精进）', weight: 100 }];
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
    var zeroCe = isHeavenZeroChar(char);
    var bfWeightMult = Math.pow(1.5, boss.playerBfStacks || 0);

    if (char.skills.indexOf('完整咏唱') >= 0) {
      list.push({ id: 'chant', label: '完整咏唱（下一次有效术式攻击×2，可叠加、跨轮）', power: 0, isChant: true, weight: 15 });
    }

    var elbowLabel = firstTool
      ? '肘击（附着咒具·' + firstTool.shape + '，不耗咏唱）'
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
    } else if (char.skills.indexOf('咒力高速再生') >= 0) {
      list.push({ id: 'heal', label: '咒力高速再生·重塑受损躯体（不耗咏唱）', power: 0, isHeal: true, weight: 11 });
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

    // 所有未损毁咒具专属特效招式（覆盖全部 9 大咒具特效，不再只读取第 1 件）
    var addedToolIds = {};
    activeTools.forEach(function (tool, idx) {
      if ((tool.nullify || tool.canCancelMove || (tool.effect && (tool.effect.indexOf('无效化') >= 0 || tool.effect.indexOf('飞天') >= 0))) && !addedToolIds.cancel) {
        addedToolIds.cancel = true;
        list.push({
          id: 'tool_special_hit_' + idx,
          label: '催动「' + tool.shape + '」· ' + tool.effect.split('（')[0] + '（抵消敌方1次攻击）',
          power: 16 + (tool.bonus || 5),
          cancels: 1,
          isTechAttack: true,
          weight: 13
        });
      } else if ((tool.extendRange || (tool.effect && tool.effect.indexOf('无限延长') >= 0)) && !addedToolIds.extend) {
        addedToolIds.extend = true;
        list.push({
          id: 'tool_extend_' + idx,
          label: '延伸「' + tool.shape + '」· 超距奇袭牵制（抵消敌方1次攻击）',
          power: 17 + (tool.bonus || 5),
          cancels: 1,
          isTechAttack: true,
          weight: 12
        });
      }
      if ((tool.extraCe || (tool.effect && tool.effect.indexOf('储存咒力') >= 0)) && !addedToolIds.extraCe) {
        addedToolIds.extraCe = true;
        list.push({
          id: 'tool_extra_ce_' + idx,
          label: '释放「' + tool.shape + '」外置储存咒力 · 高密度冲击（+21，减轻状态压力）',
          power: 21,
          cancels: 1,
          isTechAttack: true,
          weight: 13
        });
      }
      if ((tool.thunderCast || (tool.effect && tool.effect.indexOf('神武解') >= 0)) && !addedToolIds.thunder) {
        addedToolIds.thunder = true;
        list.push({
          id: 'tool_thunder_' + idx,
          label: '引动「' + tool.shape + '」内藏落雷咒术（+24 爆发出力）',
          power: 24,
          isTechAttack: true,
          weight: 13
        });
      }
      if ((tool.dmgStore || (tool.effect && tool.effect.indexOf('伤害储存') >= 0)) && !addedToolIds.dmgStore) {
        addedToolIds.dmgStore = true;
        var storeGain = 16 + (boss.heavyDebuffStacks || 0) * 8;
        list.push({
          id: 'tool_dmg_store_' + idx,
          label: '解放「' + tool.shape + '」储存伤害蓄能斩击（+' + storeGain + '）',
          power: storeGain,
          isTechAttack: true,
          weight: 12
        });
      }
    });

    if (char.shikigamiMechId === 'sword_exorcism') {
      list.push({
        id: 'shikigami_exorcism_sword',
        label: '退魔之剑 · 正能量破咒重劈（+22）',
        power: 22,
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

    if (!zeroCe) {
      list.push({
        id: 'blackFlash',
        label: '黑闪！！！（额外行动2次，本轮后续×1.2，黑闪率↑）',
        power: 22,
        isBlackFlash: true,
        isTechAttack: true,
        extraActions: 2,
        weight: Math.round((10 + (char.attrs.ceControl || 0) * 1.1) * bfWeightMult)
      });
    } else {
      list.push({
        id: 'heaven_blitz',
        label: '天与极致体感追击（额外行动1次，高速压迫连打）',
        power: 23,
        isTechAttack: true,
        extraActions: 1,
        weight: 15
      });
    }

    if (!zeroCe && char.ceTrait && char.ceTrait.moveLabel) {
      list.push({
        id: 'ce_trait_strike',
        label: char.ceTrait.moveLabel,
        power: char.ceTrait.movePower || 19,
        cancels: char.ceTrait.cancels || 0,
        piercesInfinity: Boolean(char.ceTrait.piercesInfinity),
        isTechAttack: true,
        weight: 12
      });
    }

    if (!zeroCe && char.skills.indexOf('领域展开') >= 0) {
      if (boss.isSukunaPlayer) {
        list.push({ id: 'domain', label: '领域展开·伏魔御厨子（开放式必破无量空处，不耗咏唱）', power: 26, isDomain: true, piercesInfinity: true, weight: 14 });
      } else if (char.domainProfile) {
        var dp = char.domainProfile;
        var domLbl = dp.name
          ? ('领域展开·「' + dp.name + '」（不耗咏唱）')
          : ('领域展开·' + dp.label.split(' · ')[0] + '（不耗咏唱）');
        list.push({
          id: 'domain',
          label: domLbl,
          power: dp.power || 20,
          cancels: dp.cancels || 0,
          extraActions: dp.extraActions || 0,
          piercesInfinity: Boolean(dp.piercesInfinity),
          isDomain: true,
          weight: 13
        });
      } else {
        list.push({ id: 'domain', label: '领域展开·生得领域强压（不耗咏唱）', power: 19, isDomain: true, weight: 12 });
      }
    }
    if (boss.isSukunaPlayer) {
      list.push({ id: 'sukuna_domain_amp', label: '领域展延体术 · 强破不可侵近身连击', power: 20, piercesInfinity: true, isTechAttack: true, cancels: 1, weight: 15 });
      list.push({ id: 'sukuna_world_slash', label: '扩展目标 ·「世界斩」（无视不可侵破界一刀）', power: 34, piercesInfinity: true, bypassInfinityShield: true, isTechAttack: true, weight: 12 });
      if (boss.hasTenShadows) {
        list.push({ id: 'sukuna_maho_breach', label: '十影调伏 · 魔虚罗法轮强破无下限', power: 22, piercesInfinity: true, breaksInfinityLayers: 2, isTechAttack: true, weight: 12 });
      }
    }
    if (char.skills.indexOf('百兵演武') >= 0 && activeTools.length > 0) {
      list.push({ id: 'hundredBreak', label: '百兵演武·碎刃一击（引爆咒具输出）', power: 29, isTechAttack: true, breaksTool: true, weight: 9 });
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
      if (m.canSummonMahoraga && (boss.mahoragaAlive || boss.isTrueForm || boss.forbidMahoSummon || boss.mahoragaDestroyed)) return false;
      return true;
    }).map(function (m) {
      var w = m.isBlackFlash ? Math.round(m.weight * bfMult) : m.weight;
      return Object.assign({}, m, { weight: w });
    });
  }

  /** Filter enemy Coalition + Gojo moves when playing Shinjuku from Sukuna's Curse-King POV. */
  function getAntiSukunaBossMovesSlices(boss) {
    var bfMult = Math.pow(1.5, (boss && boss.sukunaBfStacks) || 0);
    return (DATA.ANTI_SUKUNA_MOVES || []).filter(function (m) {
      if (m.requiresGojo && !boss.enemyHasGojo) return false;
      if (m.requiresCoalition && !boss.enemyHasCoalition) return false;
      return true;
    }).map(function (m) {
      var w = m.isBlackFlash ? Math.round(m.weight * bfMult) : m.weight;
      return Object.assign({}, m, { weight: w });
    });
  }

  /** Map Shinjuku order presets onto Sukuna's anti-coalition POV table when playing Sukuna. */
  function resolveShinjukuOrderForChar(char, slice) {
    if (!slice || !char || char.canonCharId !== 'sukuna') return slice;
    var list = DATA.SUKUNA_SHINJUKU_ORDERS || [];
    return list.find(function (o) { return o.id === slice.id || o.mapsFrom === slice.id; }) || slice;
  }

  /** Filter slices/choices whose excludeIds or onlyIds conflict with the active canon character. */
  function filterByCanonId(list, canonId) {
    if (!Array.isArray(list)) return [];
    if (!canonId) return list.filter(function (item) { return !item.onlyIds; });
    return list.filter(function (item) {
      if (item.onlyIds && item.onlyIds.indexOf(canonId) === -1) return false;
      if (item.excludeIds && item.excludeIds.indexOf(canonId) >= 0) return false;
      return true;
    });
  }

  /** Resolve era event perspective overrides (povByChar) and self-conflict choice filters. */
  function resolveCanonEventForChar(char, ev) {
    if (!ev) return ev;
    var cid = char && char.identityId === 'canon' ? char.canonCharId : '';
    var active = (cid && ev.povByChar && ev.povByChar[cid])
      ? Object.assign({ id: ev.id }, ev.povByChar[cid])
      : ev;
    var filtered = filterByCanonId(active.choices, cid);
    return Object.assign({}, active, { choices: filtered.length ? filtered : active.choices });
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
      return { title: '魂穿对象 · 选择原著角色', subtag: '收录22位原著核心角色', explain: '继承原主十维面板、生得术式、技巧与专属咒具。', slices: getSliceColors(cSlices) };
    }
    if (step.type === 'canon_timepoint') {
      return { title: '魂穿「' + (char.canonCharName || '原著人物') + '」· 苏醒时间线', subtag: '切入原著节点的时刻', explain: '仅列出该角色在原著中已登场且具备战力的时期；越早苏醒越有机会改变怀玉或涩谷关键事件。', slices: getSliceColors(getCanonTimepointSlices(char)) };
    }
    if (step.type === 'canon_sync') {
      return { title: '灵魂契合度判定', subtag: char.canonCharName + ' · 契合度测试', explain: '100%共鸣可使核心属性小幅突破原著上限；排异低契则需逐步磨合。', slices: getSliceColors(DATA.CANON_SYNC_SLICES) };
    }
    if (step.type === 'canon_memory') {
      return { title: '前世原著剧本记忆保留度', subtag: '先知信息保留', explain: '记忆越完整，智力与关键节点避险判定越占优势。', slices: getSliceColors(DATA.CANON_MEMORY_SLICES) };
    }
    if (step.type === 'canon_divergence') {
      return { title: '「' + (char.canonCharName || '原著角色') + '」行动方针', subtag: '决定改写后续剧情的路线', explain: '可选择营救同伴、提前修习技巧或暗中结盟。', slices: getSliceColors(DATA.CANON_DIVERGENCE_SLICES) };
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
      var techPool = DATA.TECHNIQUES_ALL.filter(function (t) {
        if ((char.identityId === 'curse' || char.identityId === 'shikigami') && (t.id === 'heavenZero' || t.id === 'newShadow')) {
          return false;
        }
        if (char.identityId === 'corpse' && t.id === 'heavenZero') {
          return false;
        }
        return true;
      });
      return { title: '生得术式 / 特殊机制（' + techPool.length + '种）', subtag: char.identityName + ' · 核心命门', explain: '决定你的招牌术式体系或对应身躯能力。', slices: getSliceColors(techPool) };
    }
    if (step.type === 'shikigami_master') {
      var masters = (char.birthEraId === 'heian' || char.birthEraId === 'edo400') ? DATA.SHIKIGAMI_SUB_BRANCHES.mastersAncient : DATA.SHIKIGAMI_SUB_BRANCHES.mastersModern;
      return { title: char.birthEraLabel + '·式神御主', subtag: '主从契约缔结', explain: '早期追随哪一位御主征战。', slices: getSliceColors(masters) };
    }
    if (step.type === 'shikigami_supply') {
      return { title: '御主供能·' + (char.master || '御主'), subtag: '咒力供应倍率', explain: '影响最终战斗数值倍率。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.supplyRates) };
    }
    if (step.type === 'shikigami_bond') {
      return { title: '与' + (char.master || '御主') + '的关系', subtag: '契约羁绊评价', explain: '影响默契配合与实战临敌修正。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.bonds) };
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
      var isLowCivilianAttr = char.identityId === 'civilian' && (!char.flags || !char.flags.civilianAwakened) &&
        char.techniqueId === 'civilian_none' &&
        (aw.attr === 'ceTotal' || aw.attr === 'ceControl' || aw.attr === 'ceEfficiency' || aw.attr === 'barrier' || aw.attr === 'versatility');
      return {
        title: aw.title,
        subtag: isLowCivilianAttr ? '普通人未觉醒常态盘 (' + (step.index + 1) + ' / 10)' : '十维核心属性 (' + (step.index + 1) + ' / 10)',
        explain: aw.desc,
        slices: getSliceColors(isLowCivilianAttr ? DATA.CIVILIAN_LOW_ATTR_SLICES : aw.slices)
      };
    }
    if (step.type === 'high_tech_count') {
      var tLv = char.attrs.talent;
      var slices = isHeavenZeroChar(char)
        ? [{ label: '0项（专精白兵体术）', count: 0, weight: 45 }, { label: '1项（百兵演武）', count: 1, weight: 55 }]
        : tLv >= 8
          ? [{ label: '2项', count: 2, weight: 20 }, { label: '3项', count: 3, weight: 32 }, { label: '4项', count: 4, weight: 30 }, { label: '5项', count: 5, weight: 18 }]
          : tLv >= 5
            ? [{ label: '1项', count: 1, weight: 30 }, { label: '2项', count: 2, weight: 40 }, { label: '3项', count: 3, weight: 22 }, { label: '4项', count: 4, weight: 8 }]
            : [{ label: '0项（无高级技）', count: 0, weight: 35 }, { label: '1项', count: 1, weight: 45 }, { label: '2项', count: 2, weight: 20 }];
      return { title: '高级技巧数量 · ' + getRankMeta(tLv).code + '天赋加成', subtag: '决定能掌握几项核心秘技', explain: '天赋越高可抽中的高级技巧越多；零咒力体仅抽选兵器与肉搏类秘技。', slices: getSliceColors(slices) };
    }
    if (step.type === 'high_tech_pick') {
      return { title: '第 ' + step.nth + ' 项 · 会哪个高级技巧', subtag: '共抽 ' + step.total + ' 项高级技巧', explain: '抽中领域展开、再生或黑闪将在战局中带来明显优势。', slices: getSliceColors(getAvailableHighTechSlices(char)) };
    }
    if (step.type === 'tool_count') {
      var cSlices = isHeavenZeroChar(char)
        ? [{ label: '1件（天与标配咒具）', count: 1, weight: 46 }, { label: '2件（双持切换咒具）', count: 2, weight: 38 }, { label: '3件（移动军火库）', count: 3, weight: 16 }]
        : char.techniquePower <= 4
          ? [{ label: '0件', count: 0, weight: 55 }, { label: '1件', count: 1, weight: 35 }, { label: '2件', count: 2, weight: 10 }]
          : [{ label: '0件', count: 0, weight: 22 }, { label: '1件', count: 1, weight: 44 }, { label: '2件', count: 2, weight: 24 }, { label: '3件', count: 3, weight: 10 }];
      return { title: '所持咒具数量', subtag: '武装配置', explain: isHeavenZeroChar(char) ? '零咒力天与咒缚必携咒具弥补对咒灵打击手段。' : '决定开局最多携带有几件专属咒具。', slices: getSliceColors(cSlices) };
    }
    if (step.type === 'tool_shape') {
      var pickedShapes = [];
      for (var sIdx = 0; sIdx < 8; sIdx++) {
        pickedShapes.push({ label: DATA.TOOL_SHAPES[(step.seed + sIdx * 3) % DATA.TOOL_SHAPES.length], weight: 12.5 });
      }
      return { title: '第 ' + step.nth + ' 件 · 咒具器形（26选抽池）', subtag: '共 ' + step.total + ' 件咒具', explain: '随机确定这件咒具的兵器外观形制。', slices: getSliceColors(pickedShapes) };
    }
    if (step.type === 'tool_effect') {
      return { title: '第 ' + step.nth + ' 件 · 「' + step.shape + '」专属特效', subtag: '咒具品质定级', explain: '特级天逆系、释魂系或游云系词条可显著提升实战能力。', slices: getSliceColors(DATA.TOOL_EFFECTS) };
    }
    if (step.type === 'grade') {
      var gp = (char.identityId === 'civilian' && (!char.flags || !char.flags.civilianAwakened) && char.techniqueId === 'civilian_none')
        ? DATA.GRADE_WHEELS.civilian
        : DATA.GRADE_WHEELS.standard;
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
      return { title: '决战前夕 · 立下「束缚」契约', subtag: '咒术的等价交换原则', explain: '可选择公开术式稳定增伤，或以高风险换取更高输出。', slices: getSliceColors(DATA.BINDING_VOWS) };
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
        var pickedEv = cand[Math.floor(Math.random() * cand.length)];
        step.chosenEvent = resolveCanonEventForChar(char, pickedEv);
        state.usedEventIds.push(pickedEv.id);
      }
      var ev = step.chosenEvent;
      return { title: ev.choiceTitle, subtag: ev.title, explain: ev.intro, slices: getSliceColors(ev.choices), eventMeta: ev };
    }
    if (step.type === 'cross_era') {
      return { title: char.identityName + ' · ' + DATA.CROSS_ERA_WHEEL.title, subtag: '跨越漫长岁月进入现代', explain: '古代人物跨越千百年苏醒的方式。', slices: getSliceColors(DATA.CROSS_ERA_WHEEL.slices) };
    }
    if (step.type === 'shibuya_gojo_seal') {
      if (char.canonCharId === 'gojo') {
        return {
          title: '涩谷事变 · 本尊直面狱门疆闭锁瞬间',
          subtag: '96% 原著收束 vs 4% 强行破局',
          explain: '「脑内一分钟」流逝，全凭你当下能否看穿假体算计！',
          slices: [{ id: true, label: '遭「一分钟」算计封入狱门疆（96%）', weight: 96, color: '#ef5d58' }, { id: false, label: '提前看破羂索强破突围！（4%）', weight: 4, color: '#29bce8' }]
        };
      }
      if (char.canonCharId === 'sukuna') {
        return {
          title: '涩谷事变 · 狱门疆封印五条悟节点',
          subtag: '诅咒阵营布局检验',
          explain: '五条悟一旦入匣，你在现代再无掣肘直至新宿决战。',
          slices: [{ id: true, label: '狱门疆成功封住五条悟（96%）', weight: 96, color: '#2ac19a' }, { id: false, label: '五条悟强破狱门疆脱身（4%）', weight: 4, color: '#ef5d58' }]
        };
      }
      return {
        title: '涩谷事变 · 五条悟是否被封印',
        subtag: '96% 原著收束 vs 4% 世界线奇迹',
        explain: '狱门疆开启瞬间决定整个现代咒术界的后续命运！',
        slices: [{ id: true, label: '是（狱门疆封印）', weight: 96, color: '#ef5d58' }, { id: false, label: '否（未被封印！）', weight: 4, color: '#29bce8' }]
      };
    }
    if (step.type === 'sukuna_vessel') {
      if (char.canonCharId === 'sukuna') {
        return {
          title: '宿傩 · 新宿前选择受肉躯壳',
          subtag: '诅咒之王 · 死灭终局容器抉择',
          explain: '亲自决定夺舍伏黑惠解锁十影法术，抑或以原身四臂四眼全盛迎敌！',
          slices: [
            { id: 'megumi', label: '夺舍伏黑惠（解锁十种影法术）', weight: 78, color: '#3d7ae8' },
            { id: 'itadori', label: '维持原身复原四臂四眼完全体', weight: 14, color: '#ef5d58' },
            { id: 'darkhorse', label: '择取高天资稀有宿体重塑躯壳', weight: 8, color: '#7b4ce2' }
          ]
        };
      }
      if (char.canonCharId === 'megumi') {
        return {
          title: '死灭转折 · 宿傩强夺十影躯壳危机',
          subtag: '灵魂控制权争夺战',
          explain: '决定你能否抵抗夺舍保住身体，抑或身陷黑暗由宿傩暂管肉身！',
          slices: [
            { id: 'megumi', label: '不幸失守遭宿傩夺舍伏黑身躯', weight: 78, color: '#ef5d58' },
            { id: 'itadori', label: '强守神魂未失！宿傩维持原体受肉', weight: 14, color: '#29bce8' },
            { id: 'darkhorse', label: '险避致命契阔，宿傩改择别体', weight: 8, color: '#2ac19a' }
          ]
        };
      }
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
        explain: '当前我方战力 ' + getPowerBreakdown(char, step.encounter.enemyName) + ' 对手实力 ' + step.encounter.enemyPower,
        slices: buildFightSlices(state, step.encounter.enemyPower, step.encounter.enemyName)
      };
    }
    if (step.type === 'fight_injury') {
      return { title: '战斗盘 · 战后伤势判定', subtag: step.won ? '凯旋余波' : '险境重创或突破', explain: '身体抗性决定存活与免伤概率；未习得再生技时重压有几率悟出咒力核心！', slices: buildInjurySlices(state, step.won, step.canDie) };
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
      if (char.canonCharId === 'sukuna') {
        return {
          title: '新宿决战 · 诅咒之王的心境与姿态',
          subtag: '坐镇人外魔境 · 迎战五条悟与高专讨伐阵',
          explain: '决定你在新宿防卫战中的开局战意与余力分配。',
          slices: getSliceColors(DATA.SUKUNA_SHINJUKU_MOTIVES || DATA.SHINJUKU_MOTIVES)
        };
      }
      return { title: '新宿决战 · 为何参战', subtag: '决战出征宣言', explain: '你的信念决定关键回合的爆发倾斜。', slices: getSliceColors(DATA.SHINJUKU_MOTIVES) };
    }
    if (step.type === 'shinjuku_sukuna_order') {
      if (char.canonCharId === 'sukuna') {
        return {
          title: '新宿决战 · 诅咒之王迎战哪波讨伐阵',
          subtag: '两面宿傩主视角 · 人外魔境总决战',
          explain: '挑选直面全盛五条悟、五条＋高专总阵或四臂真身车轮战！',
          slices: getSliceColors(DATA.SUKUNA_SHINJUKU_ORDERS || DATA.SHINJUKU_SUKUNA_ORDERS)
        };
      }
      var orders = DATA.SHINJUKU_SUKUNA_ORDERS.map(function (o) {
        if (char.canonCharId === 'gojo') {
          var gojoLabel = o.id === 'with_gojo'
            ? '新宿揭幕战 · 本尊独斗全盛十影宿傩'
            : o.id === 'before_gojo'
              ? '提前压上 · 正面迎战十影两面宿傩'
              : o.id === 'after_gojo'
                ? '消耗战后续 · 再战残血十影宿傩'
                : '群殴围猎 · 联合日车/虎杖等包围宿傩';
          return Object.assign({}, o, { label: gojoLabel });
        }
        return o;
      });
      return { title: '决战对战宿傩顺序', subtag: '决定交锋宿傩哪一阶段形态', explain: '五条前全盛十影、协同五条双打、五条后残血或原身完全体！', slices: getSliceColors(orders) };
    }
    if (step.type === 'boss_player_count') {
      var bonusMoves = char.attrs.taijutsu >= 8 ? 1 : 0;
      return {
        title: '战斗盘 · 出招数 · 主角（第 ' + state.boss.round + ' 回合）',
        subtag: '决定本回合可打出的招式次数',
        explain: '体术越高，出招次数上限越高，用以累积本回合总战斗值。',
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
          { id: 'big', label: '大幅抵消（敌方战值 -45%）', pct: 0.45, weight: bigPct, color: '#2ac19a' },
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
        slices: [{ id: false, label: '被消灭退场！', weight: state.boss.roundWon ? 68 : 28, color: '#2ac19a' }, { id: true, label: '继续存活在场', weight: state.boss.roundWon ? 32 : 72, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_survive') {
      return {
        title: '魔虚罗 · 本轮能否存活',
        subtag: '八握剑异戒神将清除判定',
        explain: '尽早清除魔虚罗，可避免核心主力招式被反复适应。',
        slices: [{ id: false, label: '消灭魔虚罗！', weight: state.boss.roundWon ? 54 : 18, color: '#2ac19a' }, { id: true, label: '法轮旋转仍在场上存活', weight: state.boss.roundWon ? 46 : 82, color: '#ef5d58' }]
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
        subtag: '兵刃耐久判定',
        explain: '高烈度对抗下，普通咒具存在断裂损毁风险。',
        slices: [{ id: true, label: '完好存留可继续出战', weight: 76, color: '#2ac19a' }, { id: false, label: '战斗中损毁！', weight: 24, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_gojo_join') {
      return {
        title: '强援 · 五条悟是否此时入场助战',
        subtag: '局势变化节点',
        explain: '五条悟加入可获得【不可侵挡招】并协助施放无量空处。',
        slices: [{ id: true, label: '是！五条悟加入战斗', weight: 62, color: '#29bce8' }, { id: false, label: '否（继续独自迎战）', weight: 38, color: '#64748b' }]
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

  function getCanonTimepointSlices(char) {
    var nativeId = (char && char.nativeEraId) || 'canonStart';
    var nativeEra = DATA.ERAS.find(function (e) { return e.id === nativeId; }) || DATA.ERAS[4];
    var avail = (DATA.CANON_TIMEPOINT_AVAIL && char && DATA.CANON_TIMEPOINT_AVAIL[char.canonCharId]) || null;
    var list = DATA.CANON_TIMEPOINTS.filter(function (tp) {
      if (tp.id === 'native') return true;
      if (tp.eraId === nativeId) return false; // 与原主登场时期重复
      return !avail || avail.indexOf(tp.id) >= 0;
    });
    return list.map(function (tp) {
      if (tp.id !== 'native') return tp;
      return Object.assign({}, tp, { eraId: nativeId, label: '原主登场时期（' + nativeEra.short + '）' });
    });
  }

  function applyCanonTimepoint(state, eraId, noteText) {
    var char = state.char;
    var cEraObj = DATA.ERAS.find(function (e) { return e.id === eraId; }) || DATA.ERAS[4];
    var baseCanonObj = DATA.CANON_CHARACTERS.find(function (c) { return c.id === char.canonCharId; });
    if (baseCanonObj) {
      var mergedPreset = Object.assign({}, state.customPreset || {}, { eraId: cEraObj.id });
      applyCanonTemplate(char, baseCanonObj, mergedPreset);
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }
    } else {
      char.birthEraId = cEraObj.id;
      char.birthEraLabel = cEraObj.label;
      char.currentEraId = cEraObj.id;
      char.currentEraLabel = cEraObj.short;
    }
    markVisitedEra(char, cEraObj.id);
    state.stepQueue = state.stepQueue.concat(buildEraQueue(cEraObj.id));
    return (noteText ? noteText + ' → ' : '') + '从「' + cEraObj.label + '」切入（当前状态：' + char.canonTitle + ' · ' + char.officialGrade + '）';
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
      applyCanonTemplate(char, targetCanon, state.customPreset || null);
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }
      effectText = '已选定魂穿对象：【' + targetCanon.name + '】（' + char.canonTitle + ' · ' + char.officialGrade + '）';
      var tpIdx = -1;
      for (var tpi = 0; tpi < state.stepQueue.length; tpi++) {
        if (state.stepQueue[tpi].type === 'canon_timepoint') { tpIdx = tpi; break; }
      }
      if (tpIdx >= 0 && getCanonTimepointSlices(char).length <= 1) {
        state.stepQueue.splice(tpIdx, 1);
        effectText += '｜该角色仅在原著登场时期具备战力，' + applyCanonTimepoint(state, char.nativeEraId || 'canonStart', '');
      }

    } else if (step.type === 'canon_timepoint') {
      var chosenEraId = slice.id === 'native' ? (char.nativeEraId || char.birthEraId || 'canonStart') : slice.eraId;
      effectText = applyCanonTimepoint(state, chosenEraId, slice.note);

    } else if (step.type === 'canon_sync') {
      char.canonSyncLabel = slice.label;
      char.flags.canonSyncMode = slice.mode;
      var isZeroCe = (char.technique || '').indexOf('零咒力') >= 0;
      var maxCanonRank = DATA.RANK_SCALE.length - 1;
      var capCanonStat = function (k, delta, allowPeak) {
        if (isZeroCe && (k === 'ceTotal' || k === 'ceControl' || k === 'ceEfficiency' || k === 'barrier')) return;
        var baseV = (char.canonBaseAttrs && char.canonBaseAttrs[k] != null) ? char.canonBaseAttrs[k] : (char.attrs[k] || 0);
        var maxV = delta > 0 ? Math.min(maxCanonRank, Math.max(10, allowPeak ? baseV + 1 : baseV)) : maxCanonRank;
        char.attrs[k] = clamp((char.attrs[k] || 0) + delta, 0, maxV);
      };
      if (slice.mode === 'perfect') {
        ['ceTotal', 'ceControl', 'taijutsu', 'talent', 'bodyResist'].forEach(function (k) {
          capCanonStat(k, 1, true);
        });
        effectText = '灵魂100%共鸣，核心能力突破 +1';
      } else if (slice.mode === 'high') {
        var boostKeys = isZeroCe ? ['taijutsu', 'bodyResist'] : ['ceControl', 'versatility'];
        boostKeys.forEach(function (k) { capCanonStat(k, 1, false); });
        effectText = '85% 高度融魂，操纵与适应性提升 +1';
      } else if (slice.mode === 'reject') {
        var nerfs = isZeroCe ? ['taijutsu', 'versatility'] : ['ceControl', 'barrier'];
        nerfs.forEach(function (k) { capCanonStat(k, -1, false); });
        effectText = '灵魂产生短暂排异，部分发挥微降 -1，需在后续战斗磨合弥补';
      } else {
        effectText = '顺利融合原著躯壳，完整继承原主当前时期面板与术式';
      }
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

    } else if (step.type === 'canon_memory') {
      char.canonMemoryLabel = slice.label;
      char.flags.scriptLevel = slice.scriptLevel;
      if (slice.iqBoost) {
        var maxMemRank = DATA.RANK_SCALE.length - 1;
        var baseIq = (char.canonBaseAttrs && char.canonBaseAttrs.iq != null) ? char.canonBaseAttrs.iq : (char.attrs.iq || 0);
        var maxIq = Math.min(maxMemRank, Math.max(10, slice.scriptLevel >= 2 ? baseIq + 1 : baseIq));
        char.attrs.iq = clamp((char.attrs.iq || 0) + slice.iqBoost, 0, maxIq);
      }
      effectText = slice.scriptLevel >= 2
        ? '完整先知剧本在握！智力提升（最高可触及特级上限），临场避险与战力判断占据先手'
        : slice.scriptLevel === 1
          ? '保留关键剧情节点记忆，智力 +1，足以避开多数阴谋伏击'
          : slice.scriptLevel === -1
            ? '忘却全部穿书外挂，完全融入咒术世界人物本心'
            : '零星碎片印象隐约浮现，胜负全靠当下操作';

    } else if (step.type === 'canon_divergence') {
      char.canonDivergenceLabel = slice.label;
      char.flags.canonDivergence = slice.effect;
      var isZeroCeDiv = (char.technique || '').indexOf('零咒力') >= 0;
      var maxDivRank = DATA.RANK_SCALE.length - 1;
      if (slice.effect === 'save_all') {
        char.flags.rewroteFate = true;
        effectText = '立下救人改命宏愿！大战死局回避率与攻坚胜率提升！';
      } else if (slice.effect === 'extra_tech') {
        var baseTal = (char.canonBaseAttrs && char.canonBaseAttrs.talent != null) ? char.canonBaseAttrs.talent : (char.attrs.talent || 0);
        char.attrs.talent = clamp((char.attrs.talent || 0) + 1, 0, Math.min(maxDivRank, Math.max(10, baseTal + 1)));
        effectText = '借先知优势提前深研咒术！天赋提升，即将额外抽取 1 项高级技巧！';
        state.stepQueue.unshift({ type: 'high_tech_pick', nth: 1, total: 1 });
      } else if (slice.effect === 'ally_shield') {
        char.flags.hasSecretAlly = true;
        effectText = '秘密缔结跨阵营盟约！决战每回合将获得隐藏盟友支援战值！';
      } else {
        var baseTai = (char.canonBaseAttrs && char.canonBaseAttrs.taijutsu != null) ? char.canonBaseAttrs.taijutsu : (char.attrs.taijutsu || 0);
        char.attrs.taijutsu = clamp((char.attrs.taijutsu || 0) + 1, 0, Math.min(maxDivRank, Math.max(10, baseTai + 1)));
        if (!isZeroCeDiv) {
          var baseBar = (char.canonBaseAttrs && char.canonBaseAttrs.barrier != null) ? char.canonBaseAttrs.barrier : (char.attrs.barrier || 0);
          char.attrs.barrier = clamp((char.attrs.barrier || 0) + 1, 0, Math.min(maxDivRank, Math.max(10, baseBar + 1)));
        } else {
          var baseBody = (char.canonBaseAttrs && char.canonBaseAttrs.bodyResist != null) ? char.canonBaseAttrs.bodyResist : (char.attrs.bodyResist || 0);
          char.attrs.bodyResist = clamp((char.attrs.bodyResist || 0) + 1, 0, Math.min(maxDivRank, Math.max(10, baseBody + 1)));
        }
        effectText = isZeroCeDiv ? '低调隐忍潜修肉体：体术与身体抗性提升！' : '低调隐忍潜修基本功：体术与结界术提升！';
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
      markVisitedEra(char, slice.id);
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
      char.techniqueId = slice.id || null;
      char.technique = slice.label;
      char.techniquePower = slice.power || 6;
      char.techniqueDesc = slice.desc || '';
      effectText = slice.desc || '核心生得术式锁定';
      if (isHeavenZeroChar(char)) {
        enforceIdentityAndTechConstraints(char, state.stepQueue);
        effectText += '｜零咒力特化：已自动清零并跳过咒力四维，体魄底线拉升';
      }

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
      if (!char.flags) char.flags = {};
      char.flags.masterBondScore = slice.score || 0;
      effectText = '御主关系确立为：' + slice.label + (slice.score ? '（羁绊战力修正 ' + (slice.score > 0 ? '+' : '') + (slice.score * 2) + '）' : '');

    } else if (step.type === 'looks') {
      char.looksLevel = slice.level != null ? slice.level : 5;
      char.looksText = slice.label;
      effectText = '外貌档位记录：' + slice.label;

    } else if (step.type === 'morality') {
      char.moralityLevel = slice.level != null ? slice.level : 5;
      char.moralityText = slice.label;
      effectText = '道德立场确立：' + slice.label;

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
      if (slice.id === 'heaven_peak') {
        applyStatDelta(char, 'taijutsu', 1);
        applyStatDelta(char, 'bodyResist', 1);
        effectText = '天与体魄进一步突破！体术与身体抗性 +1';
      } else if (slice.id === 'mastery') {
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
      if (state.presetToolEffectId && state.presetToolEffectId !== 'random') {
        var lockedEff = DATA.TOOL_EFFECTS.find(function (te) { return te.id === state.presetToolEffectId; });
        if (lockedEff) {
          char.tools.push({
            shape: slice.label,
            effect: lockedEff.label,
            tier: lockedEff.tier,
            bonus: lockedEff.bonus || 3,
            indestructible: Boolean(lockedEff.indestructible),
            nullify: Boolean(lockedEff.nullify),
            canCancelMove: Boolean(lockedEff.canCancelMove),
            extendRange: Boolean(lockedEff.extendRange),
            dmgStore: Boolean(lockedEff.dmgStore),
            damageMult: lockedEff.damageMult,
            extraCe: Boolean(lockedEff.extraCe),
            thunderCast: Boolean(lockedEff.thunderCast)
          });
          effectText = '第 ' + step.nth + ' 件咒具「' + slice.label + '」直接赋予自选特效：' + lockedEff.label;
          state.presetToolEffectId = 'random';
        } else {
          effectText = '第 ' + step.nth + ' 件咒具器形锁定为【' + slice.label + '】，接下来抽取它的附带能力！';
          state.stepQueue.unshift({ type: 'tool_effect', nth: step.nth, shape: slice.label });
        }
      } else {
        effectText = '第 ' + step.nth + ' 件咒具器形锁定为【' + slice.label + '】，接下来抽取它的附带能力！';
        state.stepQueue.unshift({ type: 'tool_effect', nth: step.nth, shape: slice.label });
      }

    } else if (step.type === 'tool_effect') {
      char.tools.push({
        shape: step.shape,
        effect: slice.label,
        tier: slice.tier,
        bonus: slice.bonus || 3,
        indestructible: Boolean(slice.indestructible),
        nullify: Boolean(slice.nullify),
        canCancelMove: Boolean(slice.canCancelMove),
        extendRange: Boolean(slice.extendRange),
        dmgStore: Boolean(slice.dmgStore),
        damageMult: slice.damageMult,
        extraCe: Boolean(slice.extraCe),
        thunderCast: Boolean(slice.thunderCast)
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
      enforceIdentityStatFloors(char);
      if (state.customAttrTier && state.customAttrTier !== 'random') {
        applyAttrTierFloor(char, state.customAttrTier);
      }

    } else if (step.type === 'identity_extra') {
      if (!char.flags) char.flags = {};
      if (slice.up1) applyStatDelta(char, slice.up1, (slice.iqDouble || slice.up1Double) ? 2 : 1);
      if (slice.up2) applyStatDelta(char, slice.up2, 1);
      if (slice.powerBonus) {
        char.flags.powerBonusAcc = (char.flags.powerBonusAcc || 0) + slice.powerBonus;
      }
      if (slice.multiCore) {
        char.flags.corpseMultiCoreSave = true;
      }
      if (slice.repBonus) {
        char.flags.repBonusAcc = (char.flags.repBonusAcc || 0) + slice.repBonus;
        char.reputationLevel = clamp((char.reputationLevel || 4) + Math.round(slice.repBonus / 5), 0, 10);
      }
      if (slice.awakenTech) {
        char.flags.civilianAwakened = true;
        ['ceTotal', 'ceControl', 'ceEfficiency', 'barrier', 'versatility'].forEach(function (k) {
          if ((char.attrs[k] || 0) < 5) char.attrs[k] = 5;
        });
        if (char.officialGrade.indexOf('四级') >= 0 || char.officialGrade === '潜力体（高抗性常人）') {
          char.officialGrade = '准一级';
          char.gradeBonus = 6;
        }
        effectText = '原本沉睡的术式获得觉醒！咒力与结界基准同步打通，接下来补抽生得术式与高级技巧。';
        state.stepQueue.unshift({ type: 'high_tech_pick', nth: 1, total: 1 });
        state.stepQueue.unshift({ type: 'ce_trait' });
        state.stepQueue.unshift({ type: 'technique' });
      } else {
        effectText = slice.note || slice.label;
      }
      enforceIdentityStatFloors(char);
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
      var eraProgNote = '';
      if (eraMeta) {
        char.currentEraId = eraMeta.id;
        char.currentEraLabel = eraMeta.short;
        markVisitedEra(char, eraMeta.id);
        eraProgNote = syncCanonProgressionForEra(char, eraMeta.id, false);
      }
      if (slice.action === 'fight') {
        effectText = '强敌现身！即将交手「' + slice.enemyName + '」' + (eraProgNote ? '｜' + eraProgNote : '');
        state.stepQueue.unshift({ type: 'fight_outcome', eraLabel: char.currentEraLabel, encounter: slice });
      } else {
        if (slice.statUp) applyStatDelta(char, slice.statUp, 1);
        var safeCullTxt = '';
        if (char.currentEraId === 'culling') {
          char.cullingPoints = (char.cullingPoints || 0) + 30;
          safeCullTxt = '｜小金虫积分 +30（累计 ' + char.cullingPoints + ' 分）';
        }
        effectText = (slice.effectText || '平稳度过时代节点') + safeCullTxt + (eraProgNote ? '｜' + eraProgNote : '');
      }

    } else if (step.type === 'cross_era') {
      if (slice.preserved) char.flags.preservedToFuture = true;
      char.currentEraLabel = '跨越时代苏醒';
      effectText = slice.effect;
      if (char.identityId === 'shikigami' && slice.preserved) {
        effectText += '｜式神进入现代，即将重新抽选现代御主与供能契约';
        state.stepQueue.unshift({ type: 'shikigami_modern_bond' });
        state.stepQueue.unshift({ type: 'shikigami_modern_supply' });
        state.stepQueue.unshift({ type: 'shikigami_modern_master' });
      }

    } else if (step.type === 'shibuya_gojo_seal') {
      char.flags.gojoSealed = Boolean(slice.id);
      char.currentEraId = 'shibuya';
      char.currentEraLabel = '涩谷事变';
      markVisitedEra(char, 'shibuya');
      var shibuyaProgNote = syncCanonProgressionForEra(char, 'shibuya', false);
      if (char.flags.gojoSealed) {
        char.flags.nanamiDead = true;
        effectText = char.canonCharId === 'gojo'
          ? '96% 收束！你因「脑内一分钟」遭狱门疆封印，涩谷陷入混乱！'
          : char.canonCharId === 'sukuna'
            ? '96% 收束！狱门疆成功锁住五条悟，诅咒阵营全面掌握涉谷后续节奏！'
            : '96% 收束！五条悟被狱门疆封印，涩谷陷入混乱！';
      } else {
        effectText = char.canonCharId === 'gojo'
          ? '4% 奇迹破局！你看穿假体并击碎狱门疆，正面压制涉谷诅咒阵营！'
          : char.canonCharId === 'sukuna'
            ? '4% 意外变数！五条悟强破狱门疆防线并击溃涉谷伏兵，现世强敌依然在列！'
            : '4% 低概率事件！五条悟未被封印，正面击溃诅咒阵营防线！';
      }
      if (shibuyaProgNote) effectText += '｜' + shibuyaProgNote;

    } else if (step.type === 'sukuna_vessel') {
      char.flags.sukunaVessel = slice.label;
      char.currentEraId = 'culling';
      char.currentEraLabel = '死灭回游';
      markVisitedEra(char, 'culling');
      var cullingProgNote = syncCanonProgressionForEra(char, 'culling', false);
      if (slice.id === 'darkhorse' && char.canonCharId === 'sukuna') {
        applyStatDelta(char, 'versatility', 1);
      }
      effectText = (char.canonCharId === 'sukuna' ? '诅咒之王选定新宿容器形态：' : '宿傩转移受肉至：') +
        slice.label + (cullingProgNote ? '｜' + cullingProgNote : '');

    } else if (step.type === 'fight_outcome') {
      var won = slice.id === 'win';
      var myP = getPowerBreakdown(char, step.encounter.enemyName);
      var zeroCeFight = isHeavenZeroChar(char);
      var hitBF = !zeroCeFight && Math.random() < clamp(0.14 + char.attrs.ceControl * 0.025 + (char.skills.indexOf('黑闪') >= 0 ? 0.14 : 0), 0.1, 0.58);
      if (won) {
        char.statsLog.wins += 1;
        if (step.encounter.enemyPower - myP >= 6) char.statsLog.beatStronger = true;
        char.statsLog.defeatedEnemies.push(step.encounter.defeatsKey || step.encounter.enemyName);
        if (step.encounter.savesNanami) {
          char.flags.nanamiDead = false;
          char.statsLog.savedNanami = true;
        }
        if (step.encounter.rewardSkill) {
          var rewardSk = (char.identityId === 'curse' && step.encounter.rewardSkill === '反转术式')
            ? '咒力高速再生'
            : step.encounter.rewardSkill;
          if ((!zeroCeFight || !ZERO_CE_FORBIDDEN_SKILLS[rewardSk]) && char.skills.indexOf(rewardSk) === -1) {
            char.skills.push(rewardSk);
          }
        }
      } else {
        char.statsLog.losses += 1;
        if (myP - step.encounter.enemyPower >= 6) char.statsLog.lostToWeaker = true;
      }
      if (hitBF) {
        char.statsLog.blackFlashes += 1;
        if (char.skills.indexOf('黑闪') === -1) char.skills.push('黑闪');
      }
      var cullBattleNote = '';
      if (won && char.currentEraId === 'culling') {
        var ep = (step.encounter && step.encounter.enemyPower) || 45;
        var addPts = (ep >= 56 ? 60 : 45) + ((char.flags && char.flags.scriptLevel >= 1) || (char.attrs && char.attrs.iq >= 9) ? 15 : 0);
        char.cullingPoints = (char.cullingPoints || 0) + addPts;
        cullBattleNote = ' · 小金虫积分 +' + addPts + '（共 ' + char.cullingPoints + ' 分）';
      }
      effectText = (won ? '击败 ' : '不敌 ') + step.encounter.enemyName + (hitBF ? ' · 本战打出「黑闪」！！' : '') + cullBattleNote;
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
      } else if (slice.id === 'core_decoy') {
        if (slice.decoyKind === 'multiCore') {
          char.flags.corpseMultiCoreUsed = true;
          effectText = '三核共鸣切核成功！顺利化解致命重创并稳住战线！';
        } else {
          char.flags.rabbitDecoyUsed = true;
          effectText = '脱兔分身替死脱身！规避本次重伤代价！';
        }
        char.hpStatus = '健康';
        state.stepQueue.unshift({ type: 'growth_check' });
      } else if (slice.id === 'core_rct') {
        var rctLabel = char.identityId === 'curse' ? '咒力高速再生' : '反转术式';
        if (!isHeavenZeroChar(char) && char.skills.indexOf(rctLabel) === -1) char.skills.push(rctLabel);
        char.flags.awakenedRCTInBattle = true;
        char.hpStatus = '健康';
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'ceEfficiency', 1);
        effectText = '抓准了咒力核心！！绝境觉醒「' + rctLabel + '」，操纵与效率各 +1！';
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
          effectText = slice.id === 'light' ? '仅受轻伤，进入战后成长判定' : '毫发无损，进入战后成长判定';
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
      var zeroCeG = isHeavenZeroChar(char);
      if (slice.id === 'bodyTrain') {
        effectText = '体术升至 ' + applyStatDelta(char, 'taijutsu', 1) + '，身体抗性升至 ' + applyStatDelta(char, 'bodyResist', 1);
      } else if (slice.id === 'ceCondense') {
        effectText = zeroCeG
          ? '天与体感愈发敏锐！体术升至 ' + applyStatDelta(char, 'taijutsu', 1) + '，战术泛用升至 ' + applyStatDelta(char, 'versatility', 1)
          : '咒力总量升至 ' + applyStatDelta(char, 'ceTotal', 1) + '，效率升至 ' + applyStatDelta(char, 'ceEfficiency', 1);
      } else if (slice.id === 'soulBarrier') {
        effectText = zeroCeG
          ? '天与心神凝练！灵魂抗性升至 ' + applyStatDelta(char, 'soulResist', 1) + '，智力升至 ' + applyStatDelta(char, 'iq', 1)
          : '灵魂抗性升至 ' + applyStatDelta(char, 'soulResist', 1) + '，结界术升至 ' + applyStatDelta(char, 'barrier', 1);
      } else {
        var avail = getAvailableHighTechSlices(char);
        var learned = avail[Math.floor(Math.random() * avail.length)];
        if (learned && learned.id !== 'mastery' && learned.id !== 'heaven_peak' && char.skills.indexOf(learned.label) === -1) {
          char.skills.push(learned.label);
          effectText = '绝境悟道！成功领悟高阶技巧「' + learned.label + '」！';
        } else {
          applyStatDelta(char, 'talent', 1);
          if (zeroCeG) applyStatDelta(char, 'taijutsu', 1);
          effectText = '实战经验进一步提升，天赋升至 ' + getRankMeta(char.attrs.talent).code;
        }
      }

    // ==================== 新宿决战 · 宿傩多回合系统状态机 ====================
    } else if (step.type === 'shinjuku_prep_growth') {
      char.currentEraId = 'shinjuku';
      char.currentEraLabel = '新宿决战';
      markVisitedEra(char, 'shinjuku');
      var shinjukuProgNote = syncCanonProgressionForEra(char, 'shinjuku', false);
      var zeroCePrep = isHeavenZeroChar(char);
      char.statsLog.growthCount += 1;
      if (slice.id === 'taiBody') {
        effectText = '体术 -> ' + applyStatDelta(char, 'taijutsu', 1) + '，身体抗性 -> ' + applyStatDelta(char, 'bodyResist', 1);
      } else if (slice.id === 'soulLearn') {
        effectText = zeroCePrep
          ? '灵魂抗性 -> ' + applyStatDelta(char, 'soulResist', 1) + '，战术观察 -> ' + applyStatDelta(char, 'iq', 1)
          : '灵魂抗性 -> ' + applyStatDelta(char, 'soulResist', 1) + '，结界术 -> ' + applyStatDelta(char, 'barrier', 1);
      } else if (slice.id === 'ceUpgrade') {
        effectText = zeroCePrep
          ? '身体抗性 -> ' + applyStatDelta(char, 'bodyResist', 1) + '，战术泛用 -> ' + applyStatDelta(char, 'versatility', 1)
          : '咒力总量 -> ' + applyStatDelta(char, 'ceTotal', 1) + '，效率 -> ' + applyStatDelta(char, 'ceEfficiency', 1);
      } else {
        var availPrep = getAvailableHighTechSlices(char);
        var newT = availPrep[Math.floor(Math.random() * availPrep.length)];
        if (newT && newT.id !== 'mastery' && newT.id !== 'heaven_peak' && char.skills.indexOf(newT.label) === -1) {
          char.skills.push(newT.label);
          effectText = '战前合练顺利领悟新技巧「' + newT.label + '」！';
        } else {
          applyStatDelta(char, 'iq', 1);
          if (zeroCePrep) applyStatDelta(char, 'taijutsu', 1);
          effectText = '实战思路彻底贯通，智力 +1';
        }
      }
      if (shinjukuProgNote) effectText += '｜' + shinjukuProgNote;

    } else if (step.type === 'shinjuku_motive') {
      if (!char.flags) char.flags = {};
      char.flags.firstRoundBossBonus = slice.firstRoundBonus || 0;
      char.flags.shinjukuProtectBonus = slice.protectBonus || 0;
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
        effectText = '「百兵演武」引爆了【' + broken.shape + '】，造成 +' + finalAtk + ' 战值！';
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
        effectText = '五条悟协同释放「' + slice.label + '」，我方战值 +' + slice.power + '！';
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
        effectText = '高强度交锋中，咒具【' + lost.shape + '】在战斗中断裂损毁！';
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
      var repShift = (char.flags && char.flags.repBonusAcc) ? Math.round(char.flags.repBonusAcc / 5) : 0;
      char.reputationLevel = clamp((slice.level != null ? slice.level : 5) + repShift, 0, 10);
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
    if (flags.beatCoalitionShinjuku) {
      addTrait('新宿独尊 · 诅咒之王全胜', +12, '坐镇新宿魔境正面击败五条悟与高专讨伐联军！', 't_warlord');
    }
    if (char.identityId === 'canon' && !flags.killedInAction) {
      addTrait('魂穿入局 · 改写剧情', +7, '魂穿原著「' + (char.canonCharName || '主角') + '」完整走完命运线并活到终点', 't_canon_soul');
    }
    if (char.identityId === 'canon' && flags.canonSyncMode === 'perfect') {
      addTrait('百分百共鸣 · 超越原主', +8, '灵魂100%共鸣突破原主原有上限', 't_canon_perfect');
    }
    if (char.identityId === 'canon' && flags.scriptLevel >= 1) {
      addTrait('剧本先知棋手', +5, '手握原著关键节点先知布局规避阴谋', 't_canon_prophet');
    }
    if (flags.canonSyncMode === 'reject' && flags.killedInAction) {
      addTrait('魂穿水土不服 · 逆境陨落', -4, '灵魂排异未磨合彻底便遗憾倒在战场', 't_glass_cannon');
    }
    if (flags.activeVowId === 'vow_life' && !flags.killedInAction) {
      addTrait('舍命死契的赌徒', +8, '立下赌命束缚决战宿傩且依然存活', 't_vow_breaker');
    } else if (flags.activeVowId && flags.activeVowId !== 'vow_none' && !flags.killedInAction) {
      addTrait('善用束缚的行家', +4, '以精准束缚等价交换推高决战上限', 't_binding_vow');
    }
    if (flags.civilianAwakened) {
      addTrait('凡胎觉醒生得术式', +6, '以普通人开局意外觉醒生得术式踏入主舞台', 't_awakened_civilian');
    }
    if ((char.technique === '天与咒缚（零咒力）' || char.techniqueId === 'heavenZero') && log.wins >= 2) {
      addTrait('零咒力体术家', +7, '凭零咒力肉体与咒具击溃诸多强敌', 't_heaven');
    }
    if (log.wins >= 1) {
      addTrait('旗开得胜', +1, '生涯至少赢下一场正式对决', 't_first_win');
    }
    if ((char.cursedCorpses || []).length > 0) {
      addTrait('百鬼造骸大匠', +8, '成功亲手制造并率领 ' + char.cursedCorpses.length + ' 具自律咒骸参战', 't_corpse_master');
    }
    if (char.domainProfile && char.domainProfile.id === 'open_divine') {
      addTrait('虚空作画 · 开放式领域', +6, '踏入不在现实分隔空间的无结界生得领域境界', 't_domain');
    }
    if (flags.addedCullingRule) {
      addTrait('死灭总则制定者', +6, '在死灭回游斩获百点积分并成功追加新总则改写结界格局');
    }
    if (log.beatStronger) {
      addTrait('以下克上', +5, '战胜至少一名综合战力强于自己的敌人', 't_overcome');
    }
    if ((char.visitedEras || []).length >= 4) {
      addTrait('多时代亲历者', +5, '跨越并参与 ' + char.visitedEras.length + ' 个以上历史时代事件', 't_multi_era');
    }
    if ((char.birthEraId === 'heian' || char.birthEraId === 'edo400') && !flags.killedInAction) {
      addTrait('活化石 · 时代见证者', +8, '从千年前或四百年前一路活跃至六十八年后', 't_fossil');
    }
    if (char.currentEraId === 'future68' && !flags.killedInAction) {
      addTrait('68年后依旧健在', +6, '平稳跨入并活跃于宿傩落幕六十八年后的世界', 't_legend_68');
    }
    if (flags.preservedToFuture) {
      addTrait('封存到未来', +5, '经封存沉睡或咒物化跨越时代在现代苏醒', 't_sealed_future');
    }
    if (char.officialGrade === '特级') {
      addTrait('特级评定认证', +6, '站上咒术界「特级」规格外宝座', 't_special_grade');
    }
    if ((char.looksLevel || 0) >= 7 && (char.moralityLevel || 0) >= 7 && (char.reputationLevel || 0) >= 6) {
      addTrait('高人气前辈', +5, '兼具出众外貌、高道德感与高阵营声望', 't_immortal_star');
    }
    if (char.faction === 'evil' && log.wins >= 4 && !flags.killedInAction) {
      addTrait('乱世枭雄', +6, '保持暗面阵营立场并赢下四场以上激战活到结局', 't_warlord');
    }
    if (flags.gojoJoinedInShinjuku || (char.faction === 'good' && log.wins >= 4 && !flags.killedInAction)) {
      addTrait('并肩六眼 · 咒术界支柱', +6, '与五条悟并肩作战或以正道立场四胜以上直到终局', 't_six_eyes');
    }
    if (log.wins >= 5) {
      addTrait('连克五名强敌', +5, '全生涯累计胜场 ≥ 5 场（实际 ' + log.wins + ' 胜）', 't_double_kill');
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
      addTrait('领域掌控者', +5, '成功掌握高阶结界技巧「领域展开」', 't_domain');
    }
    if (flags.awakenedRCTInBattle) {
      addTrait('绝境抓核', +6, '在伤势转盘中抓准咒力核心领悟反转术式');
    }
    if (log.defeatedEnemies.indexOf('魔虚罗') >= 0 || log.defeatedEnemies.indexOf('完全体魔虚罗') >= 0 || char.techniqueId === 'tenShadows') {
      addTrait('破除/调伏魔虚罗', +7, '击败宿傩召出的魔虚罗或掌握十种影法术体系', 't_maho');
    }
    if (log.defeatedEnemies.indexOf('choso') >= 0 || log.defeatedEnemies.indexOf('胀相') >= 0) {
      addTrait('胜过胀相', +5, '在实战交锋中击败九相图·胀相', 't_choso_slayer');
    }
    if (log.defeatedEnemies.indexOf('toji') >= 0 || log.defeatedEnemies.indexOf('伏黑甚尔') >= 0) {
      addTrait('击败伏黑甚尔', +6, '在怀玉夜或降灵战中胜过伏黑甚尔', 't_toji_slayer');
    }
    if (log.defeatedEnemies.indexOf('dabura') >= 0 || log.defeatedEnemies.indexOf('达布拉') >= 0) {
      addTrait('68年后切磋达布拉', +8, '在六十八年后的切磋中击败达布拉', 't_dabura_clear');
    }
    if (flags.hasPartner) {
      addTrait('收获伴侣羁绊', +4, '在人生漫长节点收获并肩同伴：' + (char.partnerLabel || '挚爱伴侣'), 't_true_love');
    }
    if (log.blackFlashes >= 2) {
      addTrait('黑闪的宠儿', +5, '生涯多次爆发灵魂共振的黑闪一击（共 ' + log.blackFlashes + ' 次）');
    }
    if (log.survivedDeath > 0 && !flags.killedInAction) {
      addTrait('大难不死', +4, '多次熬过死亡风险判定绝地翻盘');
    }
    if (flags.gojoSealed === false) {
      addTrait('阻断狱门疆', +7, '涩谷事变触发 4% 低概率路线，五条悟未被封印', 't_save_gojo');
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
      var isSukunaShinjukuFall = char.canonCharId === 'sukuna' && char.currentEraId === 'shinjuku';
      var deathId = char.currentEraId === 'shibuya' ? 't_shibuya_fall' : (char.currentEraId === 'shinjuku' && !isSukunaShinjukuFall) ? 't_sukuna_slain' : '';
      addTrait(isSukunaShinjukuFall ? '堕天陨落 · 终局落幕' : '半途折戟', -6,
        isSukunaShinjukuFall ? '在新宿车轮决战中被高专联军合力讨伐落幕' : '战死于残酷时代或新宿决战之中', deathId);
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
    if (totalScore >= 55) quality = '特级评定';
    else if (totalScore >= 42) quality = '极佳';
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
      ti: fighter.techniqueId || '',
      ct: fighter.ceTrait ? { id: fighter.ceTrait.id, label: fighter.ceTrait.label, bonus: fighter.ceTrait.bonus || 0 } : null,
      dp: fighter.domainProfile ? { id: fighter.domainProfile.id, name: fighter.domainProfile.name || '', label: fighter.domainProfile.label || '' } : null,
      s: (fighter.skills || []).slice(0, 10),
      w: (fighter.tools || []).filter(function (x) { return !x.destroyed; }).map(function (x) {
        return {
          shape: x.shape,
          effect: x.effect || '',
          bonus: x.bonus || 4,
          damageMult: x.damageMult,
          nullify: Boolean(x.nullify),
          canCancelMove: Boolean(x.canCancelMove),
          indestructible: Boolean(x.indestructible),
          thunderCast: Boolean(x.thunderCast),
          dmgStore: Boolean(x.dmgStore),
          extraCe: Boolean(x.extraCe)
        };
      }).slice(0, 4),
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
      techniqueId: String(p.ti || ''),
      ceTrait: p.ct || null,
      domainProfile: p.dp || null,
      skills: Array.isArray(p.s) ? p.s : [],
      tools: Array.isArray(p.w) ? p.w : [],
      attrs: p.a
    };
  }

  function arenaPowerScore(f) {
    var a = f.attrs || {};
    var base = (a.ceTotal || 0) + (a.ceControl || 0) + (a.ceEfficiency || 0) + (a.taijutsu || 4) * 1.2 +
      (a.bodyResist || 4) + (a.soulResist || 4) * 0.7 + (a.barrier || 0) * 0.8 + (a.versatility || 4) * 0.8 + (a.iq || 4) * 0.7;
    var hasD = (f.skills || []).indexOf('领域展开') >= 0;
    var isOpenD = Boolean(hasD && ((f.domainProfile && f.domainProfile.id === 'open_divine') || (f.technique || '').indexOf('御厨子') >= 0 || (f.name || '').indexOf('宿傩') >= 0 || (f.name || '').indexOf('羂索') >= 0));
    var hasR = hasHealingSkill(f);
    var activeTools = (f.tools || []).filter(function (t) { return !t.destroyed; });
    var toolPts = activeTools.reduce(function (s, x) { return s + (x.bonus || 3) + (x.extraCe ? 2 : 0); }, 0);
    var ceBonus = (f.ceTrait && f.ceTrait.bonus) ? Math.round(f.ceTrait.bonus * 0.8) : 0;
    return Math.round(base * 1.15 + (f.skills || []).length * 3 + (hasD ? 10 : 0) + (isOpenD ? 5 : 0) + (hasR ? 6 : 0) + toolPts + ceBonus);
  }

  function getArenaFighterMods(f) {
    var skills = f.skills || [];
    var tools = (f.tools || []).filter(function (t) { return !t.destroyed; });
    var zeroCe = isHeavenZeroChar(f);
    var techStr = String(f.technique || '');
    var ampMult = 1;
    var hasNullify = false;
    var hasThunder = false;
    var hasIndest = false;
    tools.forEach(function (t) {
      var eff = t.effect || '';
      if (t.damageMult && t.damageMult > ampMult) ampMult = t.damageMult;
      else if (eff.indexOf('伤害增幅') >= 0 && ampMult < 1.25) ampMult = 1.25;
      if (t.nullify || t.canCancelMove || t.extendRange || eff.indexOf('无效化') >= 0 || eff.indexOf('天逆') >= 0 || eff.indexOf('飞天') >= 0) {
        hasNullify = true;
      }
      if (t.thunderCast || t.dmgStore || eff.indexOf('神武解') >= 0 || eff.indexOf('伤害储存') >= 0) {
        hasThunder = true;
      }
      if (t.indestructible || eff.indexOf('无坚不摧') >= 0 || eff.indexOf('释魂') >= 0) {
        hasIndest = true;
      }
    });
    var hasDomain = !zeroCe && skills.indexOf('领域展开') >= 0;
    var isOpenDomain = Boolean(hasDomain && ((f.domainProfile && f.domainProfile.id === 'open_divine') || (techStr.indexOf('御厨子') >= 0 && (f.attrs && f.attrs.barrier >= 11)) || (f.name || '').indexOf('羂索') >= 0));
    var hasLimitless = !zeroCe && (f.techniqueId === 'limitless' || techStr.indexOf('无下限') >= 0);
    var canBypassInfinity = hasDomain || hasNullify || skills.indexOf('领域展延') >= 0 ||
      f.techniqueId === 'angelicExt' || techStr.indexOf('术式灭绝') >= 0 || techStr.indexOf('天空操纵') >= 0 ||
      (techStr.indexOf('御厨子') >= 0 && ((f.attrs && f.attrs.iq >= 10) || (f.name || '').indexOf('宿傩') >= 0));
    var traitId = (f.ceTrait && f.ceTrait.id) || (techStr.indexOf('幻兽琥珀') >= 0 ? 'electric' : techStr.indexOf('冰凝') >= 0 ? 'frost' : '');
    return {
      zeroCe: zeroCe,
      hasDomain: hasDomain,
      isOpenDomain: isOpenDomain,
      hasLimitless: hasLimitless,
      canBypassInfinity: canBypassInfinity,
      traitId: traitId,
      hasAntiDomain: zeroCe || skills.indexOf('简易领域') >= 0 || skills.indexOf('弥虚葛笼') >= 0 || skills.indexOf('领域展延') >= 0,
      hasHeal: hasHealingSkill(f),
      healLabel: skills.indexOf('咒力高速再生') >= 0 ? '高速再生+12' : '反转回复+12',
      ampMult: ampMult > 1 ? 1 + (ampMult - 1) * 0.55 : 1,
      hasNullify: hasNullify,
      extraDmg: (hasThunder ? 4 : 0) + (hasIndest ? 3 : 0) + (traitId === 'electric' || traitId === 'rough' || traitId === 'blazing' ? 4 : 0),
      frostSlow: traitId === 'frost' ? 0.93 : 1.0,
      soulGuard: Math.round(((f.attrs && f.attrs.soulResist) || 4) * 0.6)
    };
  }

  function simulateArenaBattle(fA, fB) {
    var mA = getArenaFighterMods(fA);
    var mB = getArenaFighterMods(fB);
    var hpA = 100 + ((fA.attrs && fA.attrs.bodyResist) || 4) * 8 + mA.soulGuard * 2;
    var hpB = 100 + ((fB.attrs && fB.attrs.bodyResist) || 4) * 8 + mB.soulGuard * 2;
    var pA = arenaPowerScore(fA);
    var pB = arenaPowerScore(fB);

    var logs = [];
    for (var round = 1; round <= 5 && hpA > 0 && hpB > 0; round++) {
      var bfA = !mA.zeroCe && Math.random() < (0.12 + ((fA.attrs && fA.attrs.ceControl) || 0) * 0.02);
      var bfB = !mB.zeroCe && Math.random() < (0.12 + ((fB.attrs && fB.attrs.ceControl) || 0) * 0.02);
      var domBoostA = 1.0;
      var domBoostB = 1.0;
      var clashNote = '';
      if (round <= 2) {
        if (mA.hasDomain && mB.hasDomain) {
          var barA = ((fA.attrs && fA.attrs.barrier) || 6) + (mA.isOpenDomain ? 3.5 : 0);
          var barB = ((fB.attrs && fB.attrs.barrier) || 6) + (mB.isOpenDomain ? 3.5 : 0);
          if (barA > barB + 0.5) {
            domBoostA = 1.18;
            clashNote = '｜' + fA.name + (mA.isOpenDomain ? '【开放式领域击破外壳】' : '【领域博弈占优】');
          } else if (barB > barA + 0.5) {
            domBoostB = 1.18;
            clashNote = '｜' + fB.name + (mB.isOpenDomain ? '【开放式领域击破外壳】' : '【领域博弈占优】');
          } else if (round === 1) {
            clashNote = '｜双方生得领域互角抵消必中';
          }
        } else if (mA.hasDomain && !mB.hasAntiDomain) {
          domBoostA = mB.hasNullify ? 1.12 : 1.24;
        } else if (mB.hasDomain && !mA.hasAntiDomain) {
          domBoostB = mA.hasNullify ? 1.12 : 1.24;
        }
      }
      var infMultVsB = (mB.hasLimitless && !mA.canBypassInfinity) ? 0.58 : 1.0;
      var infMultVsA = (mA.hasLimitless && !mB.canBypassInfinity) ? 0.58 : 1.0;
      if (round === 1) {
        if (mB.hasLimitless) clashNote += mA.canBypassInfinity ? '｜我方手段贯穿无下限' : '｜受敌方无下限不可侵减伤';
        if (mA.hasLimitless) clashNote += mB.canBypassInfinity ? '｜敌方手段穿透无下限' : '｜我方无下限不可侵生效';
      }
      var mitigateA = (mA.hasNullify ? 0.92 : 1.0) * mA.frostSlow;
      var mitigateB = (mB.hasNullify ? 0.92 : 1.0) * mB.frostSlow;

      var dmgA = Math.round(((14 + pA * 0.32 + mA.extraDmg + Math.random() * 14) * mA.ampMult * domBoostA * infMultVsB * (bfA ? 1.55 : 1)) * mitigateB);
      var dmgB = Math.round(((14 + pB * 0.32 + mB.extraDmg + Math.random() * 14) * mB.ampMult * domBoostB * infMultVsA * (bfB ? 1.55 : 1)) * mitigateA);
      hpB = Math.max(0, hpB - dmgA);
      hpA = Math.max(0, hpA - dmgB);

      var rctTxt = '';
      if (mA.hasHeal && hpA > 0 && hpA < 85) { hpA += 12; rctTxt += fA.name + mA.healLabel + '；'; }
      if (mB.hasHeal && hpB > 0 && hpB < 85) { hpB += 12; rctTxt += fB.name + mB.healLabel + '；'; }

      logs.push('第' + round + '回合：' + fA.name + '【' + fA.technique + '】造成 ' + dmgA + (bfA ? '(黑闪!)' : '') +
        '｜' + fB.name + '回击 ' + dmgB + (bfB ? '(黑闪!)' : '') + clashNote + (rctTxt ? '｜' + rctTxt : '') +
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
    ce_trait: true,
    domain_form: true,
    culling_rule: true,
    elder_clan_decide: true,
    elder_clan_pick: true,
    elder_clan_inherit: true,
    shikigami_age: true,
    shikigami_mechanism: true,
    shikigami_modern_master: true,
    shikigami_modern_supply: true,
    shikigami_modern_bond: true,
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
    future68_decide: true,
    future68_opponent: true,
    future68_motive: true,
    partner_bond: true,
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

  function maybeQueueDomainForm(state) {
    var char = state.char;
    initExtensionFields(char);
    if (isHeavenZeroChar(char)) {
      char.domainProfile = null;
      return;
    }
    if ((char.skills || []).indexOf('领域展开') >= 0 && !char.domainProfile) {
      if (char.canonCharId && DATA.CANON_DOMAIN_PROFILES && DATA.CANON_DOMAIN_PROFILES[char.canonCharId]) {
        char.domainProfile = cloneState(DATA.CANON_DOMAIN_PROFILES[char.canonCharId]);
        return;
      }
      if (!char.flags.domainFormAsked && !(state.boss && state.boss.active)) {
        char.flags.domainFormAsked = true;
        state.stepQueue.unshift({ type: 'domain_form' });
      }
    }
  }

  function initUpgradedBossState(state, rawSlice) {
    var char = state.char;
    initExtensionFields(char);
    var isPlayerGojo = char.canonCharId === 'gojo';
    var isPlayerSukuna = char.canonCharId === 'sukuna';
    var slice = resolveShinjukuOrderForChar(char, rawSlice);
    var isTrueForm = slice.id === 'higuruma_squad';
    var gojoAlly = !isPlayerGojo && !isPlayerSukuna && Boolean(slice.startWithGojo);
    var gojoCanJoin = !isPlayerGojo && !isPlayerSukuna && Boolean(slice.canGojoJoin);
    if (gojoAlly) char.flags.gojoJoinedInShinjuku = true;
    var nativeInfinity = isPlayerGojo ? (4 + (char.flags.hasSecretAlly ? 1 : 0)) : 0;
    var keptYujiBody = Boolean(char.flags && char.flags.sukunaVessel && char.flags.sukunaVessel.indexOf('四臂四眼') >= 0);
    state.boss = {
      active: true,
      round: 1,
      maxRounds: 3,
      orderId: slice.id,
      isTrueForm: isTrueForm,
      isSukunaPlayer: isPlayerSukuna,
      forbidMahoSummon: isPlayerSukuna || Boolean(slice.forbidMahoSummon),
      mahoragaDestroyed: isPlayerSukuna || Boolean(slice.forbidMahoSummon),
      playerWins: 0,
      enemyWins: 0,
      enemyTitle: slice.enemyTitle,
      enemyBaseAtk: slice.baseAtk,
      agitoAlive: isPlayerSukuna ? false : Boolean(slice.agito),
      mahoragaAlive: isPlayerSukuna ? false : Boolean(slice.mahoraga),
      adaptations: {},
      totalAdaptations: 0,
      gojoJoined: gojoAlly,
      canGojoJoin: gojoCanJoin,
      infinityBlocks: gojoAlly ? (4 + (char.flags.hasSecretAlly ? 1 : 0)) : nativeInfinity,
      enemyHasGojo: isPlayerSukuna ? Boolean(slice.enemyHasGojo) : false,
      enemyHasCoalition: isPlayerSukuna ? Boolean(slice.enemyHasCoalition) : false,
      enemyInfinityBlocks: (isPlayerSukuna && slice.enemyHasGojo) ? (slice.enemyInfinity || 4) : 0,
      hasTenShadows: isPlayerSukuna ? (Boolean(slice.hasTenShadows) && !keptYujiBody) : false,
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
      squadAllyBonus: (!isPlayerSukuna && slice.squadAlly) ? 14 : 0,
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
    if (step.type === 'ce_trait') {
      return {
        title: '咒力特性 · 先天咒力质感判定',
        subtag: '常规流动 / 带电 / 粗糙锯刃 / 极寒 / 爆燃 / 浓稠',
        explain: '罕见术师天生携带特殊咒力性质（如鹿紫云雷电、秤金次锯齿咒力），不仅提升战力，还可在新宿决战解锁专属特性招式！',
        slices: getSliceColors(DATA.CE_TRAIT_WHEEL)
      };
    }
    if (step.type === 'domain_form') {
      return {
        title: '生得领域 · 结界形态与必中法则',
        subtag: '封闭必杀 / 规则契约 / 依托地形 / 无结界开放式',
        explain: '决定你所修成生得领域的结界构造与必中特性，直接影响新宿决战与竞技场领域博弈！',
        slices: getSliceColors(DATA.DOMAIN_FORM_WHEEL)
      };
    }
    if (step.type === 'culling_rule') {
      var curPts = char.cullingPoints || 0;
      var hasHundred = curPts >= 100;
      return {
        title: hasHundred ? '死灭回游 · 满百积分追加总则' : '死灭回游 · 小金虫积分与结界结算',
        subtag: '当前累计积分：' + curPts + ' 分' + (hasHundred ? '（已达 100 分总则门槛！）' : '（十九日规则存续判定）'),
        explain: hasHundred
          ? '你在死灭回游已积满 100 分以上，可向小金虫消耗 100 分追加全新总则，或保留高分威慑全结界！'
          : '死灭回游临近尾声，需妥善处理积分变动条款以规避「术式剥夺」惩罚并备战新宿。',
        slices: getSliceColors(hasHundred ? DATA.CULLING_RULE_SLICES.hundredPlus : DATA.CULLING_RULE_SLICES.underHundred)
      };
    }
    if (step.type === 'elder_clan_decide') {
      return { title: '咒术高层 · 是否出身御三家', subtag: '高层门阀血脉判定', explain: '出身五条/禅院/加茂御三家有机会直接继承祖传相传术式！', slices: getSliceColors(DATA.ELDER_CLAN_DECIDE) };
    }
    if (step.type === 'elder_clan_pick') {
      return { title: '御三家门第归属', subtag: '五条 · 禅院 · 加茂', explain: '决定你的姓氏门第与候选祖传术式。', slices: getSliceColors(DATA.ELDER_CLANS) };
    }
    if (step.type === 'elder_clan_inherit') {
      return { title: '本家相传术式继承判定', subtag: step.clan ? step.clan.label.split('（')[0] : '御三家血脉', explain: '成功继承可省去随缘抽术式直接获得相传术式。', slices: getSliceColors(DATA.INHERIT_CLAN_TECH) };
    }

    if (step.type === 'shikigami_age') {
      return { title: '式神 · 现存年龄资质', subtag: char.shikigamiDesc || '式神档案', explain: '决定式神已存在并服役的时间长短与底蕴加成。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.ages) };
    }
    if (step.type === 'shikigami_mechanism') {
      return { title: '式神 · 特殊机制', subtag: '特有能力配置', explain: '如退魔之剑、影中穿行、脱兔替死或雏形法轮等特殊特性。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.mechanisms) };
    }
    if (step.type === 'shikigami_modern_master') {
      return { title: '跨越时代 · 现代新御主', subtag: '现代契约重结', explain: '进入现代篇章后重新缔结契约的现代御主。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.mastersModern) };
    }
    if (step.type === 'shikigami_modern_supply') {
      return { title: '现代御主供能 · ' + (char.master || '御主'), subtag: '现代咒力供应倍率', explain: '影响进入现代篇后的实战数值倍率。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.supplyRates) };
    }
    if (step.type === 'shikigami_modern_bond') {
      return { title: '与现代御主「' + (char.master || '御主') + '」的关系', subtag: '现代契约羁绊评价', explain: '决定在现代战线与新御主的默契程度。', slices: getSliceColors(DATA.SHIKIGAMI_SUB_BRANCHES.bonds) };
    }

    if (step.type === 'future68_decide') {
      return { title: '宿傩落幕 68 年后 · 是否出面参战', subtag: '68年后的新时代篇章', explain: '选择重返一线应对星外来客/次世代战力，或安静退隐。', slices: getSliceColors(DATA.FUTURE68_DATA.decide) };
    }
    if (step.type === 'future68_opponent') {
      var cid68 = char.identityId === 'canon' ? char.canonCharId : '';
      return {
        title: '68年后 · 遭遇哪位对手',
        subtag: '挑选或遭遇次世代人物',
        explain: '包含达布拉、完全体魔虚罗、68岁虎杖、马鲁等角色。',
        slices: getSliceColors(filterByCanonId(DATA.FUTURE68_DATA.opponents, cid68))
      };
    }
    if (step.type === 'future68_motive') {
      var oppLabel = step.opponent ? step.opponent.enemyName : '对手';
      return { title: '与「' + oppLabel + '」交手的契机', subtag: '切磋 / 生死决斗 / 理念冲突', explain: '决定交锋烈度与是否存在阵亡风险。', slices: getSliceColors(DATA.FUTURE68_DATA.motives) };
    }
    if (step.type === 'partner_bond') {
      return { title: '人生终局前 · 伴侣关系归宿', subtag: '情感与羁绊线', explain: '决定是否在终章收获并肩同行的人生伴侣。', slices: getSliceColors(DATA.PARTNER_BOND_WHEEL) };
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
      return { title: '降灵术 · 降灵契约仪式', subtag: '已集齐：' + (char.seanceMaterials || []).join(' + '), explain: '唤出过往强者肉身或灵体协同助阵。', slices: getSliceColors(DATA.SEANCE_SUMMON_RESULTS) };
    }

    // 新宿决战 · 完全体回合制轮盘
    var isSP = Boolean(boss.isSukunaPlayer);
    if (step.type === 'boss_player_count') {
      return {
        title: '第 ' + boss.round + ' 回合 · 我方出招次数',
        subtag: boss.enemyTitle + ' · 准备开战',
        explain: isSP ? '决定诅咒之王本回合可转动几次攻击转盘。' : '决定本回合主角可以转动几次出招转盘。',
        slices: getSliceColors(isSP ? DATA.BOSS_COUNT_SLICES.sukunaPlayer : DATA.BOSS_COUNT_SLICES.player)
      };
    }
    if (step.type === 'boss_player_move') {
      var chantTag = boss.playerChantStacks > 0 ? ' [完整咏唱×' + Math.pow(2, boss.playerChantStacks) + '待发]' : '';
      var bfTag = boss.playerBfStacks > 0 ? ' [黑闪无我×' + Math.pow(1.2, boss.playerBfStacks).toFixed(2) + ']' : '';
      var shieldTag = (isSP && boss.enemyInfinityBlocks > 0) ? ' [五条不可侵剩' + boss.enemyInfinityBlocks + '层]' : '';
      return {
        title: '战斗盘 · ' + (isSP ? '诅咒之王' : '主角') + '第 ' + step.nth + '/' + step.total + ' 招',
        subtag: (isSP ? '御厨子与破界底牌池' : '已习得术式专属池') + chantTag + bfTag + shieldTag,
        explain: isSP
          ? '领域展开/领域展延/世界斩/魔虚罗均可透穿或打破五条悟「不可侵」护盾！'
          : '完整咏唱×2（不耗于治疗/领域/肘击），黑闪触发额外行动 2 次！',
        slices: getSliceColors(getPlayerBossMovesSlices(state))
      };
    }
    if (step.type === 'boss_gojo_count') {
      return { title: '战斗盘 · 五条悟本轮出招数', subtag: '五条悟协战出手次数', explain: '五条悟每轮可打出 3/4/5/6 或 9 次连招。', slices: getSliceColors(DATA.BOSS_COUNT_SLICES.gojo) };
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
        subtag: isSP ? '五条悟＆高专联军回合展开' : (stunInfo > 0 ? '受无量空处/贷款减益 -' + stunInfo + ' 招' : '诅咒之王回合展开'),
        explain: isSP ? '判定敌方本回合向宿傩发动的围攻出招次数。' : '宿傩抽取出招次数后再扣减受控/贷款惩罚。',
        slices: getSliceColors(isSP ? DATA.BOSS_COUNT_SLICES.antiSukuna : DATA.BOSS_COUNT_SLICES.sukuna)
      };
    }
    if (step.type === 'boss_enemy_move') {
      return {
        title: '战斗盘 · ' + boss.enemyTitle + '第 ' + step.nth + '/' + step.total + ' 招',
        subtag: isSP
          ? ((boss.enemyInfinityBlocks > 0 ? '敌不可侵剩' + boss.enemyInfinityBlocks + '层 · ' : '') + '联军合围反扑')
          : ((boss.mahoragaAlive ? '魔虚罗在场 · ' : '') + (boss.sukunaLoanStacks > 0 ? '宿傩贷款×2待发' : '压迫性攻势')),
        explain: isSP
          ? '留意敌方五条悟「无量空处」「茈」与乙骨邪去侮之梯、日车处刑剑的高额反击！'
          : '注意「贷款」下击×2但下轮减招、以及魔虚罗「主动适应」与「世界斩」！',
        slices: getSliceColors(isSP ? getAntiSukunaBossMovesSlices(boss) : getSukunaBossMovesSlices(boss))
      };
    }
    if (step.type === 'boss_player_counter_check') {
      var barBonus = (char.attrs.barrier || 0) + (char.skills.indexOf('简易领域') >= 0 ? 3 : 0) + (char.skills.indexOf('领域展延') >= 0 ? 3 : 0);
      var stackN = Math.max(1, Math.min(3, step.count || 1));
      var bigCut = stackN >= 3 ? 0.68 : stackN === 2 ? 0.56 : 0.38;
      var midCut = stackN >= 3 ? 0.42 : stackN === 2 ? 0.33 : 0.20;
      var bigPct = clamp(18 + barBonus * 2 + (stackN - 1) * 6, 18, 62);
      var midPct = 34;
      return {
        title: '战斗盘 · ' + (isSP ? '诅咒之王' : '主角') + '抵消敌方招式' + (stackN > 1 ? '（×' + stackN + '叠加）' : ''),
        subtag: '累积抵消层数 ' + (step.count || 1) + ' 层',
        explain: '多层反制与领域展延将成倍提高对敌方累计输出的削减幅度！',
        slices: [
          { id: 'big', label: '大幅抵消！（敌方总战值 -' + Math.round(bigCut * 100) + '%）', pct: bigCut, weight: bigPct, color: '#2ac19a' },
          { id: 'mid', label: '成功格挡消解（敌方战值 -' + Math.round(midCut * 100) + '%）', pct: midCut, weight: midPct, color: '#29bce8' },
          { id: 'none', label: '未能完全化解', pct: 0, weight: Math.max(8, 100 - bigPct - midPct), color: '#ef5d58' }
        ]
      };
    }
    if (step.type === 'boss_gojo_counter_check') {
      return {
        title: '战斗盘 · 五条悟抵消敌方招式',
        subtag: '苍拳 / 瞬移反制拦截',
        explain: '以六眼微操强行抵消宿傩部分输出！',
        slices: [
          { id: 'big', label: '大幅抹消（敌方战值 -40%）', pct: 0.40, weight: 46, color: '#2ac19a' },
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
      var hasMultiCore = Boolean(char.flags && char.flags.corpseMultiCoreSave && !char.flags.corpseMultiCoreUsed);
      var hasRabbitDecoy = Boolean(char.flags && char.flags.rabbitDecoyAvailable && !char.flags.rabbitDecoyUsed);
      var hasRCT = hasHealingSkill(char);
      var zeroCeBoss = isHeavenZeroChar(char);
      var isCurseBoss = char.identityId === 'curse';
      var bodyR = (char.attrs.bodyResist || 4);
      var protectBonus = (char.flags && char.flags.shinjukuProtectBonus) || 0;
      var vowDanger = (char.flags && char.flags.vowDangerDelta) || 0;
      var deathW = clamp(12 + stacks * 16 + Math.round(vowDanger * 0.5) - Math.floor(bodyR * 0.8) - Math.round(protectBonus * 0.4), 5, 60);
      var coreW = zeroCeBoss ? 0 : (hasRCT ? 8 : 16);
      var decoyTotal = hasDecoy ? 26 : (hasMultiCore || hasRabbitDecoy) ? 22 : 0;
      var slices = [];
      if (hasDecoy) {
        slices.push({ id: 'decoy', decoyKind: 'corpse', label: '替身残骸核心挡刀！（免疫本轮重创）', weight: decoyTotal, color: '#2ac19a' });
      } else if (hasMultiCore) {
        slices.push({ id: 'decoy', decoyKind: 'multiCore', label: '三核互辅切换备用核心！（免疫本轮重创）', weight: decoyTotal, color: '#2ac19a' });
      } else if (hasRabbitDecoy) {
        slices.push({ id: 'decoy', decoyKind: 'rabbitDecoy', label: '式神脱兔分身替死！（免疫本轮重创）', weight: decoyTotal, color: '#2ac19a' });
      }
      if (coreW > 0) {
        slices.push({
          id: 'core_rct',
          label: isCurseBoss ? '抓准了咒核极境！！领悟咒力高速再生' : '抓准了咒力核心！！领悟反转术式',
          weight: coreW,
          color: '#29bce8'
        });
      }
      slices.push({ id: 'heavy', label: '重伤咬牙再战（重创减益+1层：输出-30%）', weight: Math.max(22, 100 - deathW - coreW - decoyTotal), color: '#f59e0b' });
      slices.push({ id: 'dead', label: '力量耗尽战死退场！', weight: deathW, color: '#ef5d58' });
      return {
        title: '战斗盘 · 伤势 · 主角',
        subtag: stacks > 0 ? '当前重创减益×' + stacks + '（死斗边缘）' : '败北伤势判定',
        explain: zeroCeBoss ? '天与肉体硬抗创伤，死斗中靠自身体魄熬过重创判定。' : '绝境有概率抓准咒力核心领悟再生；重伤叠层会扣 30% 输出并拉高死亡率！',
        slices: slices
      };
    }
    if (step.type === 'boss_agito_survive') {
      return {
        title: '召唤兽 · 嵌合兽颚吐 · 本轮能否存活',
        subtag: '十影兽退场判定',
        explain: '清除颚吐可切断宿傩顺手回血抽招。',
        slices: [{ id: false, label: '已被清除退场', weight: boss.roundWon ? 68 : 30, color: '#2ac19a' }, { id: true, label: '仍在场上存活', weight: boss.roundWon ? 32 : 70, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_survive') {
      return {
        title: '召唤兽 · 魔虚罗 · 本轮能否存活',
        subtag: '八握剑异戒神将清除判定',
        explain: '魔虚罗存活将在轮末旋转法轮永久适应招式。',
        slices: [{ id: false, label: '清除魔虚罗！', weight: boss.roundWon ? 54 : 20, color: '#2ac19a' }, { id: true, label: '法轮依然存活在场', weight: boss.roundWon ? 46 : 80, color: '#ef5d58' }]
      };
    }
    if (step.type === 'boss_mahoraga_adapt_count') {
      return {
        title: '魔虚罗 · 本轮适应次数（' + (boss.totalAdaptations || 0) + '/13）',
        subtag: boss.sukunaActiveAdaptBonus > 0 ? '含主动适应 +' + boss.sukunaActiveAdaptBonus + ' 次' : '法轮转动计数',
        explain: '转动越快，越快让你常用核心技进入完全免疫状态。',
        slices: getSliceColors(DATA.MAHORAGA_ADAPT_COUNTS)
      };
    }
    if (step.type === 'boss_mahoraga_adapt') {
      var used = (boss.usedMovesThisRound && boss.usedMovesThisRound.length) ? boss.usedMovesThisRound : ['生得术式·全力出力攻击'];
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
      var fragileT = activeT.find(function (t) { return !(t.indestructible || (t.effect && t.effect.indexOf('无坚不摧') >= 0)); });
      var tTarget = fragileT || activeT[0] || { shape: '咒具', indestructible: false };
      var allIndest = !fragileT && activeT.length > 0;
      return {
        title: '咒具「' + tTarget.shape + '」· 本轮能否存留',
        subtag: allIndest ? '所持咒具均具无坚不摧特效护体！' : '高烈度对抗耐久检验',
        explain: allIndest ? '无坚不摧特效不会在对拼中折断。' : '高强度碰撞中，非刚体咒具存在损毁风险。',
        slices: allIndest
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

    } else if (step.type === 'ce_trait') {
      char.ceTrait = cloneState(slice);
      effectText = '觉醒咒力特性【' + slice.label + '】：' + (slice.note || '咒力性质确立');

    } else if (step.type === 'domain_form') {
      char.domainProfile = {
        id: slice.id,
        name: '',
        label: slice.label,
        bonus: slice.bonus || 3,
        power: slice.power || 20,
        cancels: slice.cancels || 0,
        extraActions: slice.extraActions || 0,
        piercesInfinity: Boolean(slice.piercesInfinity)
      };
      if (slice.barrierUp) {
        applyStatDelta(char, 'barrier', slice.barrierUp);
      }
      effectText = '确立领域形态【' + slice.label + '】：' + (slice.note || '生得领域成形');

    } else if (step.type === 'culling_rule') {
      if ((char.cullingPoints || 0) >= 100 && (slice.id === 'rule_transfer' || slice.id === 'rule_intel')) {
        char.cullingPoints = Math.max(0, (char.cullingPoints || 0) - 100);
        char.flags.addedCullingRule = true;
      }
      if (slice.addPts) char.cullingPoints = (char.cullingPoints || 0) + slice.addPts;
      if (slice.statUp) applyStatDelta(char, slice.statUp, 1);
      if (slice.statUp2) applyStatDelta(char, slice.statUp2, 1);
      if (slice.allySupport) char.flags.cullingAllySupport = true;
      if (slice.powerBonus) char.flags.powerBonusAcc = (char.flags.powerBonusAcc || 0) + slice.powerBonus;
      if (slice.repDelta) char.reputationLevel = clamp((char.reputationLevel || 4) + slice.repDelta, 0, 10);
      effectText = slice.note || slice.label;

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
      var hasCustomTechId = Boolean(state.customPreset && state.customPreset.techId && state.customPreset.techId !== 'random');
      if (slice.id === true && step.clan && !hasCustomTechId) {
        char.techniqueId = step.clan.techId;
        char.technique = step.clan.techLabel;
        char.techniquePower = step.clan.power || 14;
        char.flags.inheritedClanTech = true;
        // 若后续队列还排着泛用随机术式轮盘，则替换跳过之
        state.stepQueue = state.stepQueue.filter(function (s) { return s.type !== 'technique'; });
        effectText = '直接觉醒祖传术式「' + char.technique + '」！';
      } else if (slice.id === true && hasCustomTechId) {
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'barrier', 1);
        char.flags.inheritedClanTech = true;
        effectText = '保留自选术式「' + char.technique + '」，额外获得本家秘传加持：操控与结界 +1！';
      } else {
        effectText = hasCustomTechId ? '保留自选术式「' + char.technique + '」，靠自身手腕踏入高层' : '未直接觉醒祖传相传术式，继续交由命运分派术式';
      }

    } else if (step.type === 'shikigami_age') {
      char.shikigamiAgeLabel = slice.ageLabel || slice.label;
      char.shikigamiAgeBonus = slice.powerDelta || 0;
      if (slice.statUp) applyStatDelta(char, slice.statUp, 1);
      effectText = '式神现存年龄：' + slice.label + (slice.powerDelta ? '（战力 +' + slice.powerDelta + '）' : '');

    } else if (step.type === 'shikigami_mechanism') {
      char.shikigamiMechId = slice.id;
      char.shikigamiMechLabel = slice.label.split('（')[0];
      char.shikigamiMechBonus = slice.powerDelta || 0;
      if (slice.id === 'rabbit_decoy') {
        char.flags.rabbitDecoyAvailable = true;
      }
      if (slice.statUp) applyStatDelta(char, slice.statUp, 1);
      if (slice.rewardSkill && char.skills.indexOf(slice.rewardSkill) === -1) {
        char.skills.push(slice.rewardSkill);
      }
      effectText = '式神特殊机制锁定：' + slice.label + (slice.id === 'sword_exorcism' ? '（对咒灵与负极能量额外压制）' : '');

    } else if (step.type === 'shikigami_modern_master') {
      char.master = slice.id;
      char.faction = slice.faction || char.faction;
      effectText = '跨越时代后重结现代御主：' + slice.label;

    } else if (step.type === 'shikigami_modern_supply') {
      char.masterSupplyMult = slice.mult || 1;
      char.masterSupplyLabel = slice.label;
      effectText = '现代御主供能系数调整为 ×' + char.masterSupplyMult.toFixed(2);

    } else if (step.type === 'shikigami_modern_bond') {
      char.masterBondLabel = slice.label;
      char.flags.masterBondScore = slice.score || 0;
      effectText = '与现代御主关系确立：' + slice.label + (slice.score ? '（羁绊战力修正 ' + (slice.score > 0 ? '+' : '') + (slice.score * 2) + '）' : '');

    } else if (step.type === 'future68_decide') {
      char.currentEraId = 'future68';
      char.currentEraLabel = '68年后';
      markVisitedEra(char, 'future68');
      if (slice.id === true) {
        effectText = '决定于宿傩落幕 68 年后再度现身，应对次世代变局';
        state.stepQueue.unshift({ type: 'future68_opponent' });
      } else {
        effectText = '选择远离纷争，在 68 年后的和平时代安静退隐';
      }

    } else if (step.type === 'future68_opponent') {
      effectText = '在 68 年后遭遇了「' + slice.label + '」，准备判定交锋性质';
      state.stepQueue.unshift({ type: 'future68_motive', opponent: slice });

    } else if (step.type === 'future68_motive') {
      var fOpp = step.opponent || { enemyName: '达布拉', enemyPower: 56, defeatsKey: 'dabura', defaultCanDie: false };
      var adjPower = Math.max(18, (fOpp.enemyPower || 54) + (slice.powerDelta || 0));
      var fightCanDie = typeof slice.canDie === 'boolean' ? slice.canDie : Boolean(fOpp.defaultCanDie);
      effectText = '以「' + slice.label.split('（')[0] + '」展开对阵：' + (slice.note || fOpp.enemyName);
      state.stepQueue.unshift({
        type: 'fight_outcome',
        eraLabel: '68年后',
        encounter: {
          enemyName: fOpp.enemyName,
          enemyPower: adjPower,
          defeatsKey: fOpp.defeatsKey || fOpp.enemyName,
          canDie: fightCanDie
        }
      });

    } else if (step.type === 'partner_bond') {
      char.flags.hasPartner = Boolean(slice.hasPartner);
      char.partnerLabel = slice.partnerLabel || slice.label;
      effectText = slice.hasPartner ? ('收获伴侣羁绊：' + char.partnerLabel) : '选择独身修行，专注于自身道路';

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
      var motiveR1Bonus = (boss.round === 1 && char.flags && char.flags.firstRoundBossBonus) ? char.flags.firstRoundBossBonus : 0;
      var secretAllyBonus = (char.flags && char.flags.hasSecretAlly) ? 5 : 0;
      var cullingAllyBonus = (boss.round === 1 && char.flags && char.flags.cullingAllySupport) ? 8 : 0;
      var basePow = Math.round(getPowerBreakdown(char, boss.enemyTitle) * 0.34 * debuffMult) +
        (boss.round === 1 && char.flags.scriptLevel > 0 ? 5 : 0) +
        motiveR1Bonus +
        secretAllyBonus +
        cullingAllyBonus +
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
      boss.playerCancelPending = char.shikigamiMechId === 'adapt_wheel_lite' ? 1 : 0;
      boss.gojoCancelPending = 0;
      boss.gojoUvTriggered = false;
      boss.sukunaLastUvPower = 0;
      boss.sukunaActiveAdaptBonus = 0;

      var toolNote = activeTools.length ? '｜参战咒具：' + activeTools.map(function (t) { return t.shape; }).join('、') : '';
      var corpseNote = char.cursedCorpses.length ? '｜咒骸助战+' + corpseAssist : '';
      var extraNote = (motiveR1Bonus ? '｜动机首轮+' + motiveR1Bonus : '') + (secretAllyBonus ? '｜暗盟支援+' + secretAllyBonus : '');
      effectText = '第 ' + boss.round + ' 回合我方共 ' + cnt + ' 次出招！基础战值 ' + boss.playerRoundPower + toolNote + corpseNote + extraNote;
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
        var healName = char.skills.indexOf('咒力高速再生') >= 0 && char.skills.indexOf('反转术式') === -1 ? '咒力高速再生' : '反转术式';
        effectText = healName + '修复创伤！伤势清零、减益层数 -1，且保留完整咏唱×' + Math.pow(2, boss.playerChantStacks || 0);
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
        if (move.cancels) boss.playerCancelPending += move.cancels;
        if (move.extraActions && step.total < 15) {
          var addDomAct = Math.min(2, move.extraActions);
          boss.playerMovesLeft += addDomAct;
          step.total += addDomAct;
        }
        if (boss.isSukunaPlayer) {
          var domStrip = boss.enemyInfinityBlocks > 0 ? Math.min(boss.enemyInfinityBlocks, 2) : 0;
          if (domStrip > 0) boss.enemyInfinityBlocks -= domStrip;
          effectText = '展开「伏魔御厨子」强压领域！战斗值 +' + domGain +
            (domStrip > 0 ? ' · 必中砍穿五条无下限 ' + domStrip + ' 层（剩 ' + boss.enemyInfinityBlocks + ' 层）' : '（不消耗完整咏唱）');
        } else {
          effectText = '展开' + (char.domainProfile && char.domainProfile.name ? '「' + char.domainProfile.name + '」' : '生得领域') +
            '！领域强压 +' + domGain +
            (move.cancels ? '｜必中规则封锁敌方 1 招' : '') +
            (move.extraActions ? '｜地形连携追加行动' : '') +
            '（不消耗完整咏唱）';
        }
      } else {
        // 常规有效术式攻击 / 黑闪 / 咒具秘技 / 咒术科学 / 多重启动 / 百兵演武
        var rawPower = move.power || 16;
        var chantUsedText = '';
        if ((boss.playerChantStacks || 0) > 0 && move.isTechAttack) {
          var cMult = Math.pow(2, boss.playerChantStacks);
          rawPower *= cMult;
          chantUsedText = ' · 触发完整咏唱×' + cMult + '！！';
          boss.playerChantStacks = 0;
        }

        // 所有在手咒具取最高伤害增幅倍率（如游云/释魂刀）
        var ampTools = (char.tools || []).filter(function (t) {
          return !t.destroyed && (t.damageMult > 1 || (t.effect && t.effect.indexOf('伤害增幅') >= 0));
        });
        if (ampTools.length > 0 && move.isTechAttack) {
          var maxAmp = ampTools.reduce(function (mx, t) { return Math.max(mx, t.damageMult || 1.25); }, 1.25);
          rawPower = Math.round(rawPower * maxAmp);
        }

        if (move.breaksTool) {
          var fragileIdx = (char.tools || []).findIndex(function (t) {
            return !t.destroyed && !(t.indestructible || (t.effect && t.effect.indexOf('无坚不摧') >= 0));
          });
          var targetIdx = fragileIdx >= 0 ? fragileIdx : (char.tools || []).findIndex(function (t) { return !t.destroyed; });
          if (targetIdx >= 0) {
            var curToolRef = char.tools[targetIdx];
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

        var adaptLv = !boss.isSukunaPlayer && boss.adaptations ? (boss.adaptations[move.label] || 0) : 0;
        var adaptReduction = Math.min(1.0, adaptLv * 0.30);
        var finalGain = Math.round(rawPower * debuffMult2 * bfMult2 * (1 - adaptReduction));

        var infNote = '';
        if (boss.isSukunaPlayer) {
          if (move.breaksInfinityLayers && boss.enemyInfinityBlocks > 0) {
            var broken = Math.min(boss.enemyInfinityBlocks, move.breaksInfinityLayers);
            boss.enemyInfinityBlocks -= broken;
            infNote = '｜魔虚罗调律劈穿不可侵 ' + broken + ' 层（剩 ' + boss.enemyInfinityBlocks + ' 层）';
          } else if (boss.enemyInfinityBlocks > 0 && !boss.playerDomainActive) {
            boss.enemyInfinityBlocks = Math.max(0, boss.enemyInfinityBlocks - 1);
            if (move.bypassInfinityShield) {
              infNote = '｜「世界斩」劈开空间无视不可侵，同时削落 1 层（剩 ' + boss.enemyInfinityBlocks + ' 层）';
            } else if (move.piercesInfinity) {
              infNote = '｜穿破「不可侵」直击五条，削落 1 层（剩 ' + boss.enemyInfinityBlocks + ' 层）';
            } else {
              finalGain = Math.max(6, Math.round(finalGain * 0.4));
              infNote = '｜受五条无下限「不可侵」减伤，仍强磨 1 层（剩 ' + boss.enemyInfinityBlocks + ' 层）';
            }
          }
        }

        boss.playerRoundPower += finalGain;
        boss.usedMovesThisRound.push(move.label);

        if (move.isBlackFlash) {
          char.statsLog.blackFlashes += 1;
          if (char.skills.indexOf('黑闪') === -1) char.skills.push('黑闪');
          boss.playerBfStacks += 1;
          var addBF = step.total < 15 ? Math.min(4, move.extraActions || 2) : 0;
          boss.playerMovesLeft += addBF;
          step.total += addBF;
        } else if (move.extraActions) {
          var addE = step.total < 15 ? Math.min(2, move.extraActions) : 0;
          boss.playerMovesLeft += addE;
          step.total += addE;
        }
        if (move.cancels) {
          boss.playerCancelPending += move.cancels;
        }

        effectText = move.label + '：+' + finalGain + chantUsedText +
          (adaptLv > 0 ? '（魔虚罗已适应-' + Math.round(adaptReduction * 100) + '%）' : '') +
          infNote +
          (move.isBlackFlash ? '｜无我境界已激活，后续×1.2 & 黑闪概率飙升！' : '') +
          (move.cancels ? (boss.isSukunaPlayer ? '｜排入反制联军判定' : '｜排入抵消宿傩判定') : '');
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
      effectText = '五条悟投入战局！本回合将打出 ' + gCnt + ' 次连续攻势';
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
        var gAdd = step.total < 15 ? Math.min(3, gm.extraActions || 2) : 0;
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
      var penalty = boss.isSukunaPlayer ? 0 : ((boss.sukunaStun || 0) + (boss.sukunaNextPenalty || 0));
      boss.sukunaStun = 0;
      boss.sukunaNextPenalty = 0;
      var actualECnt = Math.max(1, rawECnt - penalty);
      boss.sukunaMovesTotal = actualECnt;
      boss.sukunaMovesLeft = actualECnt;
      effectText = boss.isSukunaPlayer
        ? (boss.enemyTitle + ' 本轮发起 ' + actualECnt + ' 次协同合击！')
        : ('宿傩原本出招 ' + rawECnt + ' 次' +
          (penalty > 0 ? '，被无量空处/贷款扣除 ' + penalty + ' 次 -> 实际 ' + actualECnt + ' 次！' : '，实际 ' + actualECnt + ' 次！'));
      state.stepQueue.unshift({ type: 'boss_enemy_move', nth: 1, total: actualECnt });

    } else if (step.type === 'boss_enemy_move') {
      boss.sukunaMovesLeft = Math.max(0, boss.sukunaMovesLeft - 1);
      var sm = slice;
      var sBfMult = Math.pow(1.2, boss.sukunaBfStacks || 0);

      if (boss.isSukunaPlayer) {
        var antiDmg = sm.dmg || 18;
        var antiNote = '';
        if (sm.isGojoUv && (boss.playerDomainActive || (char.skills && char.skills.indexOf('领域展开') >= 0 && Math.random() < 0.65))) {
          antiDmg = Math.round(antiDmg * 0.5);
          antiNote = '（遭我方「伏魔御厨子」从外部强破无量空处结界！）';
        }
        var totalAntiDmg = Math.round(antiDmg * sBfMult);
        boss.enemyRoundPower += totalAntiDmg;
        if (sm.isBlackFlash) {
          boss.sukunaBfStacks += 1;
          var aAdd = step.total < 15 ? Math.min(2, sm.extraActions || 1) : 0;
          boss.sukunaMovesLeft += aAdd;
          step.total += aAdd;
          antiNote += '（黑闪爆发！额外行动+' + aAdd + '，敌方后续×1.2）';
        }
        effectText = sm.label.split('（')[0] + '：敌方战值 +' + totalAntiDmg + antiNote;
      } else if (sm.isLoan) {
        boss.sukunaLoanStacks = (boss.sukunaLoanStacks || 0) + 1;
        boss.sukunaNextPenalty = (boss.sukunaNextPenalty || 0) + 1;
        if (step.total < 15) {
          boss.sukunaMovesLeft += 1;
          step.total += 1;
        }
        effectText = '宿傩发动「贷款」：下一次有效攻击伤害 ×2，下回合出招数 -1（可跨轮），再抽 1 次！';
      } else if (sm.isAgitoHeal) {
        boss.enemyBaseAtk = Math.max(25, boss.enemyBaseAtk + 2);
        if (step.total < 15) {
          boss.sukunaMovesLeft += 1;
          step.total += 1;
        }
        effectText = '嵌合兽·颚吐反转恢复宿傩伤势（战值 +0，再抽 1 次）！';
      } else if (sm.isSummonMahoraga) {
        boss.mahoragaAlive = true;
        boss.enemyRoundPower += 5;
        if (step.total < 15) {
          boss.sukunaMovesLeft += 1;
          step.total += 1;
        }
        effectText = '十影·魔虚罗登场参战！宿傩额外行动 1 次，轮末若魔虚罗存活将开始适应！';
      } else if (sm.isActiveAdapt) {
        boss.sukunaActiveAdaptBonus = (boss.sukunaActiveAdaptBonus || 0) + 1;
        effectText = '魔虚罗主动旋转背后法轮（战值 +0，轮末若存活适应次数再 +1）！';
      } else {
        var blocked = boss.infinityBlocks > 0 && sm.id !== 'worldSlash' && sm.id !== 'malevolentShrine';
        if (blocked) {
          boss.infinityBlocks -= 1;
          var infLabel = char.canonCharId === 'gojo' ? '无下限·不可侵' : '五条悟不可侵';
          effectText = '【不可侵】完全弹开宿傩「' + sm.label.split('（')[0] + '」！' + infLabel + '剩 ' + boss.infinityBlocks + ' 次';
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
            var sAdd = step.total < 15 ? Math.min(3, sm.extraActions || 2) : 0;
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
      var oppShort = boss.isSukunaPlayer ? boss.enemyTitle : '宿傩';
      effectText = won
        ? '我方第 ' + boss.round + ' 回合正面压制胜出！（大比分 ' + boss.playerWins + ':' + boss.enemyWins + '）'
        : '本回合未能压住' + oppShort + '，进入伤势与减益检验！（大比分 ' + boss.playerWins + ':' + boss.enemyWins + '）';

      var evoSteps = [];
      if (!won) evoSteps.push({ type: 'boss_injury' });
      if (!boss.isSukunaPlayer && boss.agitoAlive) evoSteps.push({ type: 'boss_agito_survive' });
      if (!boss.isSukunaPlayer && boss.mahoragaAlive) evoSteps.push({ type: 'boss_mahoraga_survive' });
      if ((char.tools || []).some(function (t) { return !t.destroyed; })) evoSteps.push({ type: 'boss_tool_survive' });
      if (!boss.isSukunaPlayer && !boss.gojoJoined && boss.canGojoJoin) evoSteps.push({ type: 'boss_gojo_join' });
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
        if (slice.decoyKind === 'multiCore') {
          char.flags.corpseMultiCoreUsed = true;
          effectText = '三核共鸣切核成功！以备用咒核抵消本轮重创！';
        } else if (slice.decoyKind === 'rabbitDecoy') {
          char.flags.rabbitDecoyUsed = true;
          effectText = '脱兔分身替死脱身！免除本轮重创与死亡代价！';
        } else {
          var decoyCorpse = (char.cursedCorpses || []).find(function (c) {
            return !c.decoyUsed && (c.cores || []).some(function (cr) { return cr.id === 'decoy_remnant'; });
          });
          if (decoyCorpse) decoyCorpse.decoyUsed = true;
          effectText = '咒骸「' + (decoyCorpse ? decoyCorpse.form : '替身') + '」引爆【替身残骸】，代替本体挡下重伤！';
        }
      } else if (slice.id === 'core_rct') {
        var bossRctLabel = char.identityId === 'curse' ? '咒力高速再生' : '反转术式';
        if (!isHeavenZeroChar(char) && char.skills.indexOf(bossRctLabel) === -1) char.skills.push(bossRctLabel);
        char.flags.awakenedRCTInBattle = true;
        boss.heavyDebuffStacks = 0;
        char.hpStatus = '健康';
        applyStatDelta(char, 'ceControl', 1);
        applyStatDelta(char, 'ceEfficiency', 1);
        effectText = '【抓准了咒力核心！！】绝境觉醒「' + bossRctLabel + '」并清空重创减益！操纵与效率 +1';
      } else {
        boss.heavyDebuffStacks = (boss.heavyDebuffStacks || 0) + 1;
        char.hpStatus = '重伤';
        char.statsLog.heavyInjuries += 1;
        effectText = '咬牙硬扛继续死斗！获得「重创减益×' + boss.heavyDebuffStacks + '」（出力 -30%/层）';
      }

    } else if (step.type === 'boss_agito_survive') {
      boss.agitoAlive = Boolean(slice.id);
      effectText = boss.agitoAlive ? '嵌合兽·颚吐存活在场继续牵制！' : '嵌合兽·颚吐已被清除退场！';

    } else if (step.type === 'boss_mahoraga_survive') {
      boss.mahoragaAlive = Boolean(slice.id);
      if (boss.mahoragaAlive) {
        if ((boss.totalAdaptations || 0) < 13) {
          effectText = '魔虚罗存活！背后八握剑法轮开始转动！';
          state.stepQueue.unshift({ type: 'boss_mahoraga_adapt_count' });
        } else {
          effectText = '魔虚罗存活且适应度已达上限 13/13！';
        }
      } else {
        boss.mahoragaDestroyed = true;
        if (char.statsLog.defeatedEnemies.indexOf('魔虚罗') === -1) {
          char.statsLog.defeatedEnemies.push('魔虚罗');
        }
        effectText = '成功消灭魔虚罗！本场已将其彻底清除出战局。';
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
      var fragileTool = activeTList.find(function (t) {
        return !(t.indestructible || (t.effect && t.effect.indexOf('无坚不摧') >= 0));
      });
      var targetT = fragileTool || activeTList[0];
      if (!slice.id && fragileTool) {
        fragileTool.destroyed = true;
        effectText = '高强度交锋中，咒具「' + fragileTool.shape + '」断裂损毁！';
      } else {
        effectText = targetT ? '咒具「' + targetT.shape + '」完好存留，下一轮继续参战！' : '无损存留';
      }

    } else if (step.type === 'boss_gojo_join') {
      if (slice.id) {
        boss.gojoJoined = true;
        char.flags.gojoJoinedInShinjuku = true;
        boss.infinityBlocks = (boss.infinityBlocks || 0) + 4 + (char.flags.hasSecretAlly ? 1 : 0);
        effectText = '五条悟加入当前战局！获得【不可侵挡招】并解锁无量空处！';
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
            char.statsLog.wins += 1;
            if (b.isSukunaPlayer) {
              char.flags.beatCoalitionShinjuku = true;
              if (b.enemyHasGojo && char.statsLog.defeatedEnemies.indexOf('五条悟') === -1) {
                char.statsLog.defeatedEnemies.push('五条悟');
              }
              if (b.enemyHasCoalition && char.statsLog.defeatedEnemies.indexOf('高专讨伐联军') === -1) {
                char.statsLog.defeatedEnemies.push('高专讨伐联军');
              }
              state.lastEffectText += '｜新宿魔境大获全胜！诅咒之王正面击败「' + b.enemyTitle + '」！！';
            } else {
              char.flags.beatSukunaShinjuku = true;
              char.statsLog.defeatedEnemies.push('两面宿傩');
              state.lastEffectText += '｜🎉 新宿决战大获全胜！正面击败两面宿傩！！';
            }
          } else if (b.round >= b.maxRounds) {
            b.active = false;
            char.statsLog.losses += 1;
            if (b.isSukunaPlayer) {
              char.flags.foughtCoalitionSurvived = true;
              state.lastEffectText += '｜与「' + b.enemyTitle + '」激战三回合打成相持，历史车轮继续向前！';
            } else {
              char.flags.foughtSukunaSurvived = true;
              state.lastEffectText += '｜鏖战宿傩三回合全身而退，历史车轮继续向前！';
            }
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
        if (char.identityId === 'higherUp' && !char.flags.askedElderClan && !state.stepQueue.some(function (s) { return s.type === 'elder_clan_decide'; })) {
          char.flags.askedElderClan = true;
          state.stepQueue.unshift({ type: 'elder_clan_decide' });
        }
        if (char.identityId !== 'canon' && !char.gender && !state.stepQueue.some(function (s) { return s.type === 'gender'; })) {
          state.stepQueue.unshift({ type: 'gender' });
        }
      }

      if (preType === 'tool_effect' && char.tools && char.tools.length > 0 && slice) {
        var lastT = char.tools[char.tools.length - 1];
        if (slice.indestructible) lastT.indestructible = true;
        if (slice.nullify) lastT.nullify = true;
        if (slice.canCancelMove) lastT.canCancelMove = true;
        if (slice.extendRange) lastT.extendRange = true;
        if (slice.dmgStore) lastT.dmgStore = true;
        if (slice.damageMult) lastT.damageMult = slice.damageMult;
        if (slice.extraCe) lastT.extraCe = true;
        if (slice.thunderCast) lastT.thunderCast = true;
      }

      maybeQueueCorpseCraft(state);
      maybeQueueDomainForm(state);

      if (preType === 'shinjuku_motive' && state.presetShinjukuOrderId && state.presetShinjukuOrderId !== 'random') {
        var presetOrder = DATA.SHINJUKU_SUKUNA_ORDERS.find(function (o) { return o.id === state.presetShinjukuOrderId; });
        if (presetOrder) {
          state.stepQueue = state.stepQueue.filter(function (s) { return s.type !== 'shinjuku_sukuna_order'; });
          initUpgradedBossState(state, presetOrder);
          if (char.canonCharId === 'sukuna' && state.boss) {
            var sPresetNote = '诅咒之王坐镇新宿魔境！正式迎战「' + state.boss.enemyTitle + '」';
            origOut.effectText = sPresetNote;
            state.lastEffectText = sPresetNote;
            if (char.timeline.length > 0) char.timeline[char.timeline.length - 1].effect = sPresetNote;
          }
        }
      }

      if (preType === 'shinjuku_sukuna_order') {
        initUpgradedBossState(state, slice);
        if (char.canonCharId === 'sukuna' && state.boss) {
          var sOrdNote = '诅咒之王坐镇新宿魔境！正式迎战「' + state.boss.enemyTitle + '」';
          origOut.effectText = sOrdNote;
          state.lastEffectText = sOrdNote;
          if (char.timeline.length > 0) char.timeline[char.timeline.length - 1].effect = sOrdNote;
        }
      }

      if (preType === 'shibuya_gojo_seal' && !char.flags.seanceEventDone && (char.techniqueId === 'seance' || Math.random() < 0.55)) {
        char.flags.seanceEventDone = true;
        char.seanceMaterials = []; // 每轮事件干净重置素材状态
        state.stepQueue.unshift({ type: 'seance_collect', round: 1, total: 2 });
      }

      if (preType === 'sukuna_vessel' && !char.flags.commCullingDone && !char.flags.killedInAction) {
        char.flags.commCullingDone = true;
        state.stepQueue.unshift({ type: 'exorcism_commission' });
      }

      if (preType === 'era_pick') {
        var nextTop = state.stepQueue[0];
        var notBlocked = !nextTop || (nextTop.type !== 'radar' && nextTop.type !== 'settlement');
        if (notBlocked) {
          var insertAt = nextTop && nextTop.type === 'fight_outcome' ? 1 : 0;
          if (char.currentEraId === 'canonStart' && !char.flags.commModernDone) {
            char.flags.commModernDone = true;
            state.stepQueue.splice(insertAt, 0, { type: 'exorcism_commission' });
          } else if (char.currentEraId === 'shibuya' && !char.flags.seanceEventDone && (char.techniqueId === 'seance' || Math.random() < 0.55)) {
            char.flags.seanceEventDone = true;
            char.seanceMaterials = []; // 每轮事件干净重置素材状态
            state.stepQueue.splice(insertAt, 0, { type: 'seance_collect', round: 1, total: 2 });
          } else if (char.currentEraId === 'culling' && !char.flags.commCullingDone) {
            char.flags.commCullingDone = true;
            state.stepQueue.splice(insertAt, 0, { type: 'exorcism_commission' });
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
