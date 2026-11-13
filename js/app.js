(function () {
  'use strict';

  var DATA = window.JJK_OMEGA_DATA;
  var ENGINE = window.JJK_OMEGA_ENGINE;
  var WHEEL_MOD = window.JJK_OMEGA_WHEEL;
  var RADAR = window.JJK_OMEGA_RADAR;

  var STORAGE_CARDS = 'jjk_omega_cards_v2';
  var STORAGE_FATE = 'jjk_omega_fate_v2';
  var STORAGE_PREFS = 'jjk_omega_prefs_v2';
  var STORAGE_ACTIVE_RUN = 'jjk_omega_active_run_v2';
  var STORAGE_ARENA_LOGS = 'jjk_omega_arena_logs_v2';

  var SPEED_CYCLE = [0.2, 0.5, 0.8, 1.5, 3.0, 5.0];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var appState = {
    runType: 'dream', // 'dream' | 'custom'
    spinDuration: 1.5,
    autoSpin: false,
    autoInterval: 0.8,
    fatePoints: 30,
    savedCards: [],
    arenaLogs: [],
    activeCardsTab: 'dream',
    run: null,
    currentWheelDesc: null,
    settlementEvaluated: null,
    settlementSaved: false,
    autoTimerId: null
  };

  function clearAutoTimer() {
    if (appState.autoTimerId !== null) {
      clearTimeout(appState.autoTimerId);
      appState.autoTimerId = null;
    }
  }

  function loadPersistence() {
    try {
      var prefsRaw = localStorage.getItem(STORAGE_PREFS);
      if (prefsRaw) {
        var p = JSON.parse(prefsRaw);
        if (p.runType === 'dream' || p.runType === 'custom') appState.runType = p.runType;
        if (p.spinDuration) appState.spinDuration = Math.max(0.2, Math.min(8.0, Number(p.spinDuration) || 1.5));
        if (p.autoInterval) appState.autoInterval = Math.max(0.2, Math.min(8.0, Number(p.autoInterval) || 0.8));
        appState.autoSpin = Boolean(p.autoSpin);
      }

      var fateRaw = localStorage.getItem(STORAGE_FATE);
      if (fateRaw === null) {
        appState.fatePoints = 30;
        localStorage.setItem(STORAGE_FATE, '30');
      } else {
        appState.fatePoints = Math.max(0, parseInt(fateRaw, 10) || 0);
      }

      var cardsRaw = localStorage.getItem(STORAGE_CARDS);
      if (cardsRaw) {
        var parsedCards = JSON.parse(cardsRaw);
        if (Array.isArray(parsedCards)) appState.savedCards = parsedCards;
      }

      var logsRaw = localStorage.getItem(STORAGE_ARENA_LOGS);
      if (logsRaw) {
        var parsedLogs = JSON.parse(logsRaw);
        if (Array.isArray(parsedLogs)) appState.arenaLogs = parsedLogs;
      }
    } catch (err) { /* ignore storage errors */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_PREFS, JSON.stringify({
        runType: appState.runType,
        spinDuration: appState.spinDuration,
        autoInterval: appState.autoInterval,
        autoSpin: appState.autoSpin
      }));
    } catch (err) { /* ignore */ }
  }

  function saveFate() {
    try { localStorage.setItem(STORAGE_FATE, String(appState.fatePoints)); } catch (err) { /* ignore */ }
  }

  function saveCards() {
    try { localStorage.setItem(STORAGE_CARDS, JSON.stringify(appState.savedCards)); } catch (err) { /* ignore */ }
  }

  function saveArenaLogs() {
    try { localStorage.setItem(STORAGE_ARENA_LOGS, JSON.stringify(appState.arenaLogs.slice(0, 100))); } catch (err) { /* ignore */ }
  }

  function saveActiveRun() {
    try {
      if (!appState.run || appState.run.finished) {
        localStorage.removeItem(STORAGE_ACTIVE_RUN);
      } else {
        localStorage.setItem(STORAGE_ACTIVE_RUN, JSON.stringify(appState.run));
      }
    } catch (err) { /* ignore */ }
  }

  function loadPausedRun() {
    try {
      var raw = localStorage.getItem(STORAGE_ACTIVE_RUN);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && !parsed.finished && parsed.char ? parsed : null;
    } catch (err) {
      return null;
    }
  }

  var wheelCtrl = WHEEL_MOD.createWheel(
    $('wheelCanvas'),
    function onTick(liveLabel) {
      $('resultMainText').textContent = liveLabel;
    },
    function onFinish(landedRawSlice) {
      handleSpinComplete(landedRawSlice);
    }
  );

  function syncSpeedAndPrefsUI() {
    var durStr = appState.spinDuration.toFixed(1) + 's';
    var autoStr = appState.autoInterval.toFixed(1) + 's';

    $('startSpeedBadge').textContent = durStr;
    $('quickSpeedLabel').textContent = durStr;
    $('spinDurationValue').textContent = durStr;
    $('spinDurationRange').value = String(appState.spinDuration);

    $('autoIntervalValue').textContent = autoStr;
    $('autoIntervalRange').value = String(appState.autoInterval);

    $('chkAutoSpin').checked = appState.autoSpin;
    $('quickAutoLabel').textContent = appState.autoSpin ? '开' : '关';
    $('btnToggleAutoSpin').classList.toggle('is-on', appState.autoSpin);

    document.querySelectorAll('#speedPresetRow .preset-chip').forEach(function (chip) {
      var v = parseFloat(chip.getAttribute('data-speed'));
      chip.classList.toggle('is-active', Math.abs(v - appState.spinDuration) < 0.05);
    });

    document.querySelectorAll('#startRunTypePick .mode-tag').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-runtype') === appState.runType);
    });
    document.querySelectorAll('#menuRunTypeGrid .mode-choice').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-runtype') === appState.runType);
    });
  }

  function updateGlobalCounters() {
    $('startCardCount').textContent = String(appState.savedCards.length);
    $('startFatePoints').textContent = String(appState.fatePoints);
    $('gameFatePoints').textContent = String(appState.fatePoints);
    $('customFateRemain').textContent = String(appState.fatePoints);
    $('arenaLogCount').textContent = String(appState.arenaLogs.length);

    var paused = loadPausedRun();
    var resumeBtn = $('btnResumeLife');
    if (paused) {
      resumeBtn.classList.remove('is-hidden');
      $('resumeStepNum').textContent = String((paused.stepCount || 0) + 1);
    } else {
      resumeBtn.classList.add('is-hidden');
    }

    syncSpeedAndPrefsUI();
  }

  function renderBattleHud() {
    var run = appState.run;
    var hud = $('battleHud');
    if (!run || !run.boss || !run.boss.active || run.currentView !== 'wheel') {
      hud.classList.add('is-hidden');
      return;
    }

    var b = run.boss;
    hud.classList.remove('is-hidden');
    $('hudPlayerName').textContent = '我方 · ' + run.char.identityName + '（' + run.char.hpStatus + '）';
    $('hudPlayerStat').textContent = '战值 ' + b.playerRoundPower + ' · 胜场 ' + b.playerWins;
    $('hudRoundBadge').textContent = '第 ' + b.round + '/' + b.maxRounds + ' 回合';
    $('hudEnemyName').textContent = b.enemyTitle;
    $('hudEnemyStat').textContent = '战值 ' + b.enemyRoundPower + ' · 胜场 ' + b.enemyWins;

    var tags = [];
    if (b.gojoJoined) {
      tags.push('<span class="hud-tag is-good">五条悟助战 · 不可侵剩 ' + b.infinityBlocks + ' 次</span>');
    }
    if (b.sukunaStun > 0) {
      tags.push('<span class="hud-tag is-good">无量空处眩晕 -' + b.sukunaStun + ' 招</span>');
    }
    tags.push('<span class="hud-tag">' + (b.agitoAlive ? '嵌合兽·颚吐存活' : '颚吐已破') + '</span>');
    tags.push('<span class="hud-tag">' + (b.mahoragaAlive ? '魔虚罗在场' : '魔虚罗已灭') + '</span>');

    Object.keys(b.adaptations || {}).forEach(function (moveName) {
      var lv = b.adaptations[moveName];
      var pct = Math.min(100, lv * 30);
      tags.push('<span class="hud-tag is-warn">魔虚罗适应[' + escapeHtml(moveName.slice(0, 6)) + '] -' + pct + '%</span>');
    });

    $('hudTagsRow').innerHTML = tags.join('');
  }

  function anyModalOpen() {
    return Array.prototype.some.call(
      document.querySelectorAll('.modal-backdrop'),
      function (m) { return !m.classList.contains('is-hidden'); }
    );
  }

  function scheduleAutoSpinIfNeeded() {
    clearAutoTimer();
    if (!appState.autoSpin || !appState.run || appState.run.finished) return;
    if (appState.run.currentView !== 'wheel' || anyModalOpen() || wheelCtrl.isSpinning()) return;
    if ($('gameScreen').classList.contains('is-hidden')) return;

    appState.autoTimerId = setTimeout(function () {
      appState.autoTimerId = null;
      if (appState.autoSpin && appState.run && appState.run.currentView === 'wheel' && !anyModalOpen() && !wheelCtrl.isSpinning()) {
        triggerMainAction();
      }
    }, Math.max(150, appState.autoInterval * 1000));
  }

  function renderMainView() {
    var run = appState.run;
    if (!run) return;

    var wheelStage = $('wheelStage');
    var radarStage = $('radarStage');
    var settlementStage = $('settlementStage');
    var mainBtn = $('btnMainAction');
    var rerollBtn = $('btnFateReroll');

    wheelStage.classList.toggle('is-hidden', run.currentView !== 'wheel');
    radarStage.classList.toggle('is-hidden', run.currentView !== 'radar');
    settlementStage.classList.toggle('is-hidden', run.currentView !== 'settlement');
    renderBattleHud();

    if (run.currentView === 'wheel') {
      var desc = ENGINE.describeWheelForStep(run);
      appState.currentWheelDesc = desc;
      $('wheelTitleText').textContent = desc.title;
      $('wheelSubtag').textContent = (run.runType === 'custom' ? '天命自定 · ' : '浮生若梦 · ') + desc.subtag + '（第 ' + (run.stepCount + 1) + ' 轮）';
      $('resultMainText').textContent = run.lastResultText || '准备就绪';
      $('resultEffectText').textContent = run.lastEffectText || '';
      wheelCtrl.setSlices(desc.slices);

      mainBtn.textContent = '点击旋转';
      mainBtn.classList.remove('is-continue', 'is-spinning');
      mainBtn.disabled = false;

      var canReroll = run.canRerollLast && appState.fatePoints >= 1;
      rerollBtn.disabled = !canReroll;
      scheduleAutoSpinIfNeeded();

    } else if (run.currentView === 'radar') {
      clearAutoTimer();
      rerollBtn.disabled = true;
      var rMeta = run.pendingRadar || { stage: 'initial', title: '能力面板' };
      $('wheelTitleText').textContent = rMeta.title;
      $('wheelSubtag').textContent = run.char.identityName + ' · ' + run.char.currentEraLabel;
      $('resultMainText').textContent = rMeta.title;
      $('resultEffectText').textContent = '综合战力指数：' + ENGINE.getPowerBreakdown(run.char);

      $('radarTitleBadge').textContent = rMeta.title;
      $('radarGradeChip').textContent = run.char.officialGrade + ' · ' + run.char.hpStatus;
      $('radarSvgWrap').innerHTML = RADAR.buildRadarSvg(run.char);
      $('radarStatsSummary').innerHTML = RADAR.renderRadarChips(run.char);

      mainBtn.textContent = '继续';
      mainBtn.classList.remove('is-spinning');
      mainBtn.classList.add('is-continue');
      mainBtn.disabled = false;

    } else if (run.currentView === 'settlement') {
      clearAutoTimer();
      rerollBtn.disabled = true;
      if (!appState.settlementEvaluated) {
        appState.settlementEvaluated = ENGINE.evaluateSettlement(run);
        if (appState.settlementEvaluated.fateReward > 0) {
          appState.fatePoints += appState.settlementEvaluated.fateReward;
          saveFate();
        }
        saveActiveRun();
        updateGlobalCounters();
        setTimeout(openSaveNameModal, 220);
      }

      var res = appState.settlementEvaluated;
      $('wheelTitleText').textContent = '人生结算完成';
      $('wheelSubtag').textContent = (run.runType === 'custom' ? '天命自定' : '浮生若梦') + ' · 总分 ' + (res.totalScore >= 0 ? '+' : '') + res.totalScore;
      $('resultMainText').textContent = res.quality;
      $('resultEffectText').textContent = res.fateReward > 0
        ? '浮生若梦奖励 +' + res.fateReward + ' 命运点（总余额 ' + appState.fatePoints + '）'
        : '天命自定局不产命运点 · 已自动记录本局档案';

      $('settlementQuality').textContent = '总分品质：' + res.quality;
      $('settlementScore').textContent = (res.totalScore >= 0 ? '+' : '') + res.totalScore;
      $('settlementPosCount').textContent = '正面 ' + res.posCount;
      $('settlementNegCount').textContent = '负面 ' + res.negCount;
      $('settlementRecord').textContent = '胜 ' + res.wins + ' · 负 ' + res.losses + ' · 黑闪 ' + res.blackFlashes;
      $('settlementSummaryLine').textContent = res.summaryLine;

      $('settlementTraitsList').innerHTML = res.traits.map(function (t) {
        var isPos = t.score >= 0;
        return '<div class="trait-item">' +
          '<div>' +
          '<div class="trait-title-row">' + escapeHtml(t.name) + '</div>' +
          '<div class="trait-desc">' + escapeHtml(t.desc) + '</div>' +
          '</div>' +
          '<span class="trait-score ' + (isPos ? 'is-pos' : 'is-neg') + '">' + (isPos ? '+' : '') + t.score + '</span>' +
          '</div>';
      }).join('');

      mainBtn.textContent = '开启新的人生';
      mainBtn.classList.remove('is-spinning');
      mainBtn.classList.add('is-continue');
      mainBtn.disabled = false;
    }
  }

  function startNewRunWithState(runState) {
    clearAutoTimer();
    wheelCtrl.cancel();
    appState.run = runState;
    appState.settlementEvaluated = null;
    appState.settlementSaved = false;
    saveActiveRun();
    $('startScreen').classList.add('is-hidden');
    $('gameScreen').classList.remove('is-hidden');
    updateGlobalCounters();
    renderMainView();
  }

  function beginSelectedGame() {
    if (appState.runType === 'custom') {
      openCustomModal();
    } else {
      startNewRunWithState(ENGINE.createRun('dream'));
    }
  }

  function triggerMainAction() {
    var run = appState.run;
    if (!run) return;

    if (wheelCtrl.isSpinning()) {
      // 点击即可瞬间急停出结果！
      wheelCtrl.snapToFinish();
      return;
    }

    if (run.currentView === 'wheel') {
      clearAutoTimer();
      var btn = $('btnMainAction');
      btn.textContent = '旋转中 · 点击立即停';
      btn.classList.add('is-spinning');
      $('btnFateReroll').disabled = true;
      wheelCtrl.spin(appState.spinDuration);
    } else if (run.currentView === 'radar') {
      ENGINE.continueAfterRadar(run);
      saveActiveRun();
      renderMainView();
    } else if (run.currentView === 'settlement') {
      beginSelectedGame();
    }
  }

  function handleSpinComplete(landedRawSlice) {
    var run = appState.run;
    if (!run) return;
    var prevResult = ENGINE.applySpinOutcome(run, landedRawSlice);
    saveActiveRun();

    if (run.currentView === 'wheel') {
      var nextDesc = ENGINE.describeWheelForStep(run);
      appState.currentWheelDesc = nextDesc;
      $('wheelTitleText').textContent = nextDesc.title;
      $('wheelSubtag').textContent = (run.runType === 'custom' ? '天命自定 · ' : '浮生若梦 · ') + nextDesc.subtag + '（第 ' + (run.stepCount + 1) + ' 轮）';
      $('resultMainText').textContent = prevResult.resultLabel;
      $('resultEffectText').textContent = prevResult.effectText;
      wheelCtrl.setSlices(nextDesc.slices);
      renderBattleHud();

      var mainBtn = $('btnMainAction');
      mainBtn.textContent = '点击旋转';
      mainBtn.classList.remove('is-continue', 'is-spinning');
      mainBtn.disabled = false;

      $('btnFateReroll').disabled = !(run.canRerollLast && appState.fatePoints >= 1);
      scheduleAutoSpinIfNeeded();
    } else {
      renderMainView();
    }
  }

  /* ==================== 弹窗管理 ==================== */
  function openModal(id) {
    clearAutoTimer();
    $(id).classList.remove('is-hidden');
  }

  function closeModal(id) {
    $(id).classList.add('is-hidden');
    if (appState.run && !$('gameScreen').classList.contains('is-hidden')) {
      scheduleAutoSpinIfNeeded();
    }
  }

  /* ==================== 暗色人物档案弹框 ==================== */
  function openCharacterModal() {
    var run = appState.run;
    if (!run) return;
    var char = run.char;
    var power = ENGINE.getPowerBreakdown(char);

    $('charModalTitle').textContent = char.identityName;
    var statusTag = $('charStatusTag');
    statusTag.textContent = char.hpStatus;
    statusTag.className = 'char-status-tag' + (char.hpStatus === '已故' ? ' is-dead' : char.hpStatus !== '健康' ? ' is-injured' : '');
    $('charGradeTag').textContent = char.officialGrade;

    var subParts = ['出生地：' + char.birthplace, '时期：' + char.currentEraLabel, '颜值：' + char.looksText];
    if (char.master) subParts.push('御主：' + char.master);
    $('charSubline').textContent = subParts.join(' · ');

    var quickPills = [
      '阵营：' + char.factionLabel,
      '道德：' + char.moralityText,
      '好战：' + char.aggroText,
      '胜 ' + char.statsLog.wins + ' / 负 ' + char.statsLog.losses + ' / 黑闪 ' + char.statsLog.blackFlashes
    ];
    if (char.shikigamiDesc) quickPills.push('式神：' + char.shikigamiDesc);
    $('charQuickPills').innerHTML = quickPills.map(function (t) {
      return '<span class="dark-mini-pill">' + escapeHtml(t) + '</span>';
    }).join('');

    $('charPowerScore').textContent = String(power);

    $('charAttrGrid').innerHTML = DATA.ATTRIBUTE_DEFS.map(function (def) {
      var val = char.attrs[def.key] || 0;
      var rank = ENGINE.getRankMeta(val);
      return '<div class="attr-card">' +
        '<div class="attr-card-top">' +
        '<span class="attr-name">' + escapeHtml(def.name) + '</span>' +
        '<span class="attr-rank ' + rank.badgeClass + '">' + rank.code + ' · ' + val + '</span>' +
        '</div>' +
        '<div class="attr-note">' + escapeHtml(def.desc) + '</div>' +
        '</div>';
    }).join('');

    $('charTechCard').textContent = char.technique + ' — ' + (char.techniqueDesc || '尚待摸索发挥上限');

    $('charSkillsList').innerHTML = char.skills.length
      ? char.skills.map(function (s) { return '<span class="dark-skill-tag">' + escapeHtml(s) + '</span>'; }).join('')
      : '<span class="dark-skill-tag">暂未习得额外高级技巧</span>';

    $('charToolsList').innerHTML = char.tools.length
      ? char.tools.map(function (t) {
          return '<div class="dark-info-card">【' + escapeHtml(t.shape) + '】· ' + escapeHtml(t.effect) + '（' + escapeHtml(t.tier || '常规') + '）</div>';
        }).join('')
      : '<div class="dark-info-card">暂未持有专属咒具</div>';

    var a = char.attrs;
    var melee = Math.round(a.taijutsu * 2.4 + a.bodyResist * 1.5);
    var spell = Math.round(a.ceTotal * 2.1 + a.ceControl * 1.8 + (char.techniquePower || 4));
    $('charFormulaCard').textContent = '基础近战基准 ' + melee + ' · 术式爆发基准 ' + spell +
      ' · 结界/灵魂综合防御 ' + Math.round(a.barrier * 1.6 + a.soulResist * 1.6);

    openModal('charModal');
  }

  /* ==================== 天命自定配置器 ==================== */
  function populateCustomModalOptions() {
    function fillSelect(selId, opts) {
      $(selId).innerHTML = opts.map(function (o) {
        return '<option value="' + escapeHtml(o.value) + '" data-cost="' + (o.cost || 0) + '">' + escapeHtml(o.label) + '</option>';
      }).join('');
    }

    fillSelect('custIdentity', [{ value: 'random', label: '🎲 随机抽取身份 (0 点)', cost: 0 }].concat(
      DATA.IDENTITIES.map(function (x) { return { value: x.id, label: x.label + ' (' + x.cost + ' 点)', cost: x.cost }; })
    ));

    fillSelect('custEra', [{ value: 'random', label: '🎲 随机时期 (0 点)', cost: 0 }].concat(
      DATA.ERAS.filter(function (e) { return e.id !== 'future68'; }).map(function (e) {
        return { value: e.id, label: e.label + ' (' + e.cost + ' 点)', cost: e.cost };
      })
    ));

    fillSelect('custTech', [{ value: 'random', label: '🎲 随机术式 (0 点)', cost: 0 }].concat(
      DATA.TECHNIQUES_ALL.map(function (t) { return { value: t.id, label: t.label + ' (' + (t.cost || 2) + ' 点)', cost: t.cost || 2 }; })
    ));

    fillSelect('custGrade', [{ value: 'random', label: '🎲 随机官方评级 (0 点)', cost: 0 }].concat(
      DATA.GRADE_WHEELS.standard.map(function (g) { return { value: g.id, label: g.id + ' (' + (g.cost || 0) + ' 点)', cost: g.cost || 0 }; })
    ));

    fillSelect('custTalent', [
      { value: 'random', label: '🎲 随机天赋 (0 点)', cost: 0 },
      { value: '7', label: 'S · 潜力惊人 (2 点)', cost: 2 },
      { value: '9', label: 'SSS · 天纵奇才 (5 点)', cost: 5 },
      { value: '10', label: 'EX · 百年奇观 (8 点)', cost: 8 }
    ]);
  }

  function calcCustomCost() {
    var ids = ['custIdentity', 'custEra', 'custTech', 'custGrade', 'custTalent', 'custPerk'];
    var total = 0;
    ids.forEach(function (id) {
      var sel = $(id);
      var opt = sel.options[sel.selectedIndex];
      if (opt) total += parseInt(opt.getAttribute('data-cost') || '0', 10);
    });
    $('customFateCost').textContent = String(total);
    $('customFateRemain').textContent = String(appState.fatePoints);
    $('btnStartCustomRun').disabled = total > appState.fatePoints;
    $('btnStartCustomRun').textContent = total > appState.fatePoints
      ? '命运点不足（需 ' + total + ' 点）'
      : '消耗 ' + total + ' 命运点并开启天命人生';
    return total;
  }

  function openCustomModal() {
    populateCustomModalOptions();
    calcCustomCost();
    openModal('customModal');
  }

  /* ==================== 咒术竞技场逻辑 ==================== */
  function getSelectableFighters() {
    var list = [];
    if (appState.run && appState.run.char) {
      list.push({
        id: '__current__',
        label: '[本局当前] ' + appState.run.char.identityName + ' · ' + appState.run.char.technique,
        fighter: {
          name: '本局当前主角',
          identityName: appState.run.char.identityName,
          officialGrade: appState.run.char.officialGrade,
          technique: appState.run.char.technique,
          skills: appState.run.char.skills,
          tools: appState.run.char.tools,
          attrs: appState.run.char.attrs
        }
      });
    }
    appState.savedCards.forEach(function (c, i) {
      if (c.attrs) {
        list.push({
          id: 'card_' + i,
          label: '[存档] ' + c.name + '（' + c.officialGrade + '·' + c.technique + '）',
          fighter: c
        });
      }
    });
    DATA.ARENA_CHAMPIONS.forEach(function (ch, idx) {
      list.push({ id: 'champ_' + idx, label: '[内置原型] ' + ch.name, fighter: ch });
    });
    return list;
  }

  function openArenaModal() {
    var selectEl = $('arenaPlayerSelect');
    var fighters = getSelectableFighters();
    selectEl.innerHTML = fighters.map(function (item) {
      return '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.label) + '</option>';
    }).join('');
    $('arenaCodeFeedback').textContent = '';
    $('arenaResultBox').classList.add('is-hidden');
    renderArenaHistory();
    openModal('arenaModal');
  }

  function getSelectedArenaFighter() {
    var fighters = getSelectableFighters();
    var targetId = $('arenaPlayerSelect').value;
    var hit = fighters.find(function (x) { return x.id === targetId; });
    return (hit || fighters[0]).fighter;
  }

  function renderArenaBattleResult(res) {
    appState.arenaLogs.unshift(res);
    appState.arenaLogs = appState.arenaLogs.slice(0, 100);
    saveArenaLogs();
    updateGlobalCounters();
    renderArenaHistory();

    var box = $('arenaResultBox');
    box.classList.remove('is-hidden');
    box.innerHTML = '<div class="arena-winner-banner">' + (res.playerWon ? '🏆 胜出：' : '💥 惜败于：') + escapeHtml(res.playerWon ? res.winner : res.opponent) + '</div>' +
      '<div class="odds-explain">综合评分对比：我方 ' + res.powerA + ' vs 敌方 ' + res.powerB + '（余血 ' + res.hpA + ' : ' + res.hpB + '）</div>' +
      res.logs.map(function (l) { return '<div class="timeline-item" style="margin-top:6px;">' + escapeHtml(l) + '</div>'; }).join('');
  }

  function renderArenaHistory() {
    var listEl = $('arenaHistoryList');
    if (!appState.arenaLogs.length) {
      listEl.innerHTML = '<div class="odds-explain">暂无对战记录，快去切磋一场吧（最多保存 100 场）！</div>';
      return;
    }
    listEl.innerHTML = appState.arenaLogs.map(function (log, idx) {
      return '<div class="timeline-item">' +
        '<div class="timeline-item-head"><span>#' + (idx + 1) + ' · ' + (log.playerWon ? '胜出' : '落败') + '</span><span>' + escapeHtml(log.time) + '</span></div>' +
        '<div class="timeline-item-result">对手：' + escapeHtml(log.opponent) + '</div>' +
        '<div class="timeline-item-effect">胜者：' + escapeHtml(log.winner) + '（战力 ' + log.powerA + ' vs ' + log.powerB + '）</div>' +
        '</div>';
    }).join('');
  }

  /* ==================== 排行榜与角色卡 / 回放 ==================== */
  function renderSavedCardsList() {
    var listEl = $('savedCardsList');
    var filtered = appState.savedCards
      .map(function (card, rawIdx) { return { card: card, rawIdx: rawIdx }; })
      .filter(function (wrap) {
        return (wrap.card.runType || 'dream') === appState.activeCardsTab;
      })
      .sort(function (a, b) { return b.card.score - a.card.score; });

    if (!filtered.length) {
      listEl.innerHTML = '<div class="odds-explain">该榜单暂无记录。走完一局对应模式的「人生结算」后即可收录冲击排名！</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function (wrap, rank) {
      var c = wrap.card;
      return '<div class="saved-card-item">' +
        '<div class="saved-card-top">' +
        '<span class="saved-card-name">No.' + (rank + 1) + ' ' + escapeHtml(c.name) + ' · ' + escapeHtml(c.identityName) + '</span>' +
        '<span class="saved-card-score">' + (c.score >= 0 ? '+' : '') + c.score + ' (' + escapeHtml(c.quality) + ')</span>' +
        '</div>' +
        '<div class="saved-card-meta">' + escapeHtml(c.officialGrade) + ' · ' + escapeHtml(c.technique) + ' · 胜' + c.wins + '/负' + c.losses + ' · ' + escapeHtml(c.createdAt) + '</div>' +
        '<div class="saved-card-actions">' +
        '<button type="button" class="pill-chip" data-replay-card="' + wrap.rawIdx + '">📖 回放人生与雷达</button>' +
        '<button type="button" class="pill-chip" data-del-card="' + wrap.rawIdx + '">🗑 删除</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  function openReplayModalForCard(cardIdx) {
    var c = appState.savedCards[cardIdx];
    if (!c) return;
    var radarHtml = c.attrs ? RADAR.buildRadarSvg(c) : '';
    var traitsHtml = (c.traits || []).map(function (t) {
      var isPos = t.score >= 0;
      return '<div class="trait-item"><div><div class="trait-title-row">' + escapeHtml(t.name) + '</div><div class="trait-desc">' + escapeHtml(t.desc) + '</div></div><span class="trait-score ' + (isPos ? 'is-pos' : 'is-neg') + '">' + (isPos ? '+' : '') + t.score + '</span></div>';
    }).join('');
    var logsHtml = (c.timeline || []).map(function (item) {
      return '<div class="timeline-item"><div class="timeline-item-head"><span>第' + item.step + '轮 · ' + escapeHtml(item.wheelTitle) + '</span><span>' + escapeHtml(item.era) + '</span></div><div class="timeline-item-result">' + escapeHtml(item.result) + '</div><div class="timeline-item-effect">' + escapeHtml(item.effect) + '</div></div>';
    }).join('');

    $('replayModalBody').innerHTML =
      '<div class="settlement-summary-line">' + escapeHtml(c.name) + ' · ' + escapeHtml(c.identityName) + ' · ' + escapeHtml(c.officialGrade) + ' · ' + escapeHtml(c.technique) + '</div>' +
      (radarHtml ? '<div class="radar-svg-wrap">' + radarHtml + '</div>' : '') +
      '<h3 class="setting-label">最终正负词条与成就</h3><div class="settlement-traits-list" style="margin-bottom:12px;">' + traitsHtml + '</div>' +
      '<h3 class="setting-label">全生平回放记录</h3><div class="timeline-list">' + logsHtml + '</div>';
    openModal('replayModal');
  }

  function openOddsModal() {
    var desc = appState.currentWheelDesc;
    if (!desc) return;
    $('oddsModalTitle').textContent = desc.title;
    $('oddsExplain').textContent = desc.explain || '当前扇区按实际权重划分：';
    var total = desc.slices.reduce(function (sum, s) { return sum + (Number(s.weight) || 1); }, 0);
    $('oddsList').innerHTML = desc.slices.map(function (s) {
      var pct = (((Number(s.weight) || 1) / total) * 100).toFixed(1);
      return '<div class="odds-row"><div class="odds-left"><span class="odds-dot" style="background:' + s.color + '"></span><span>' + escapeHtml(s.label) + '</span></div><span class="odds-pct">' + pct + '%</span></div>';
    }).join('');
    openModal('oddsModal');
  }

  function openTimelineModal() {
    var run = appState.run;
    var listEl = $('timelineList');
    if (!run || !run.char.timeline.length) {
      listEl.innerHTML = '<div class="odds-explain">尚未转动轮盘，快点击开始决定你的宿命吧！</div>';
    } else {
      listEl.innerHTML = run.char.timeline.slice().reverse().map(function (item) {
        return '<div class="timeline-item"><div class="timeline-item-head"><span>第 ' + item.step + ' 轮 · ' + escapeHtml(item.wheelTitle) + '</span><span>' + escapeHtml(item.era) + '</span></div><div class="timeline-item-result">' + escapeHtml(item.result) + '</div>' + (item.effect ? '<div class="timeline-item-effect">' + escapeHtml(item.effect) + '</div>' : '') + '</div>';
      }).join('');
    }
    openModal('timelineModal');
  }

  function openSaveNameModal() {
    if (!appState.run || !appState.run.finished || appState.settlementSaved || !appState.settlementEvaluated) return;
    var nextIndex = String(appState.savedCards.length + 1).padStart(3, '0');
    var res = appState.settlementEvaluated;
    $('saveNameDesc').textContent = '本次结算 ' + (res.totalScore >= 0 ? '+' : '') + res.totalScore + '（' + res.quality + '）' +
      (res.fateReward > 0 ? '，已入账 ' + res.fateReward + ' 命运点！' : '（天命自定榜不产命运点）。') +
      ' 取个名字归档纪念：';
    $('saveNameInput').value = nextIndex;
    openModal('saveNameModal');
  }

  function commitSaveCard() {
    if (!appState.run || !appState.settlementEvaluated || appState.settlementSaved) {
      closeModal('saveNameModal');
      return;
    }
    var name = $('saveNameInput').value.trim() || String(appState.savedCards.length + 1).padStart(3, '0');
    var char = appState.run.char;
    var res = appState.settlementEvaluated;
    appState.savedCards.unshift({
      id: 'card_' + Date.now(),
      runType: appState.run.runType || 'dream',
      name: name,
      createdAt: new Date().toLocaleString('zh-CN'),
      identityName: char.identityName,
      officialGrade: char.officialGrade,
      technique: char.technique,
      skills: char.skills.slice(),
      tools: char.tools.slice(),
      attrs: JSON.parse(JSON.stringify(char.attrs)),
      score: res.totalScore,
      quality: res.quality,
      wins: res.wins,
      losses: res.losses,
      blackFlashes: res.blackFlashes,
      traits: res.traits,
      timeline: char.timeline.slice()
    });
    saveCards();
    appState.settlementSaved = true;
    updateGlobalCounters();
    closeModal('saveNameModal');
  }

  /* ==================== 事件绑定 ==================== */
  function bindEvents() {
    $('btnEnterGame').addEventListener('click', beginSelectedGame);
    $('btnResumeLife').addEventListener('click', function () {
      var paused = loadPausedRun();
      if (paused) startNewRunWithState(paused);
    });

    $('btnMainAction').addEventListener('click', triggerMainAction);
    $('wheelTapZone').addEventListener('click', function () {
      if (wheelCtrl.isSpinning()) {
        wheelCtrl.snapToFinish();
      } else if (appState.run && appState.run.currentView === 'wheel') {
        triggerMainAction();
      }
    });

    $('btnRebirth').addEventListener('click', function () {
      beginSelectedGame();
    });

    $('btnFateReroll').addEventListener('click', function () {
      if (!appState.run || wheelCtrl.isSpinning() || appState.fatePoints < 1) return;
      if (ENGINE.rerollLastSpin(appState.run)) {
        appState.fatePoints -= 1;
        saveFate();
        saveActiveRun();
        updateGlobalCounters();
        renderMainView();
      }
    });

    // 即时顶部快捷调速 & 自动连抽
    $('btnCycleSpeed').addEventListener('click', function () {
      var idx = SPEED_CYCLE.findIndex(function (v) { return Math.abs(v - appState.spinDuration) < 0.05; });
      appState.spinDuration = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length];
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('btnToggleAutoSpin').addEventListener('click', function () {
      appState.autoSpin = !appState.autoSpin;
      savePrefs();
      syncSpeedAndPrefsUI();
      if (appState.autoSpin) scheduleAutoSpinIfNeeded();
      else clearAutoTimer();
    });

    // Ω 菜单与各子弹窗
    $('btnOpenCharacter').addEventListener('click', openCharacterModal);
    $('btnCloseCharModal').addEventListener('click', function () { closeModal('charModal'); });
    $('btnHubChar').addEventListener('click', function () {
      closeModal('menuModal');
      if (appState.run) openCharacterModal();
    });

    $('btnShowOdds').addEventListener('click', openOddsModal);
    $('btnCloseOddsModal').addEventListener('click', function () { closeModal('oddsModal'); });

    $('btnOpenTimeline').addEventListener('click', openTimelineModal);
    $('btnCloseTimelineModal').addEventListener('click', function () { closeModal('timelineModal'); });

    $('btnOpenMenu').addEventListener('click', function () { openModal('menuModal'); });
    $('btnStartSettings').addEventListener('click', function () { openModal('menuModal'); });
    $('btnCloseMenuModal').addEventListener('click', function () { closeModal('menuModal'); });

    $('btnStartNotice').addEventListener('click', function () { openModal('noticeModal'); });
    $('btnMenuNotice').addEventListener('click', function () { closeModal('menuModal'); openModal('noticeModal'); });
    $('btnCloseNoticeModal').addEventListener('click', function () { closeModal('noticeModal'); });

    $('btnStartCards').addEventListener('click', function () { renderSavedCardsList(); openModal('cardsModal'); });
    $('btnHubBoards').addEventListener('click', function () { closeModal('menuModal'); renderSavedCardsList(); openModal('cardsModal'); });
    $('btnCloseCardsModal').addEventListener('click', function () { closeModal('cardsModal'); });
    $('btnCloseReplayModal').addEventListener('click', function () { closeModal('replayModal'); });

    $('btnStartArena').addEventListener('click', openArenaModal);
    $('btnHubArena').addEventListener('click', function () { closeModal('menuModal'); openArenaModal(); });
    $('btnCloseArenaModal').addEventListener('click', function () { closeModal('arenaModal'); });

    $('btnHubCustom').addEventListener('click', function () { closeModal('menuModal'); openCustomModal(); });
    $('btnCloseCustomModal').addEventListener('click', function () { closeModal('customModal'); });

    // 天命自定联动算点与开局
    ['custIdentity', 'custEra', 'custTech', 'custGrade', 'custTalent', 'custPerk'].forEach(function (id) {
      $(id).addEventListener('change', calcCustomCost);
    });
    $('btnResetCustomForm').addEventListener('click', function () {
      ['custIdentity', 'custEra', 'custTech', 'custGrade', 'custTalent', 'custPerk'].forEach(function (id) { $(id).value = 'random'; });
      calcCustomCost();
    });
    $('btnStartCustomRun').addEventListener('click', function () {
      var cost = calcCustomCost();
      if (cost > appState.fatePoints) return;
      appState.fatePoints -= cost;
      saveFate();
      closeModal('customModal');
      startNewRunWithState(ENGINE.createRun('custom', {
        identityId: $('custIdentity').value,
        eraId: $('custEra').value,
        techId: $('custTech').value,
        gradeId: $('custGrade').value,
        talentLv: $('custTalent').value,
        perk: $('custPerk').value
      }));
    });

    // 竞技场 Tabs 与战斗
    $('arenaTabStrip').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-arenatab]');
      if (!btn) return;
      var t = btn.getAttribute('data-arenatab');
      document.querySelectorAll('#arenaTabStrip .tab-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      $('arenaTabFight').classList.toggle('is-hidden', t !== 'fight');
      $('arenaTabHistory').classList.toggle('is-hidden', t !== 'history');
      $('arenaTabRules').classList.toggle('is-hidden', t !== 'rules');
    });

    $('btnCopyMyCode').addEventListener('click', function () {
      var fighter = getSelectedArenaFighter();
      var code = ENGINE.encodeFighterCode(fighter);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(function () {});
      }
      $('arenaFriendCodeInput').value = code;
      $('arenaCodeFeedback').textContent = '已生成并填入下方文本框，可发给好友对战！';
    });

    $('btnArenaRandomFight').addEventListener('click', function () {
      var myFighter = getSelectedArenaFighter();
      var pool = DATA.ARENA_CHAMPIONS;
      var opp = pool[Math.floor(Math.random() * pool.length)];
      renderArenaBattleResult(ENGINE.simulateArenaBattle(myFighter, opp));
    });

    $('btnArenaCodeFight').addEventListener('click', function () {
      var myFighter = getSelectedArenaFighter();
      try {
        var opp = ENGINE.decodeFighterCode($('arenaFriendCodeInput').value);
        renderArenaBattleResult(ENGINE.simulateArenaBattle(myFighter, opp));
      } catch (err) {
        $('arenaCodeFeedback').textContent = '对战码格式无效，请检查是否完整复制';
      }
    });

    // 排行榜 Tabs / 删除 / 回放
    $('cardsTabStrip').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cardtab]');
      if (!btn) return;
      appState.activeCardsTab = btn.getAttribute('data-cardtab');
      document.querySelectorAll('#cardsTabStrip .tab-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      renderSavedCardsList();
    });

    $('savedCardsList').addEventListener('click', function (e) {
      var delBtn = e.target.closest('[data-del-card]');
      if (delBtn) {
        var idx = parseInt(delBtn.getAttribute('data-del-card'), 10);
        if (!isNaN(idx)) {
          appState.savedCards.splice(idx, 1);
          saveCards();
          updateGlobalCounters();
          renderSavedCardsList();
        }
        return;
      }
      var repBtn = e.target.closest('[data-replay-card]');
      if (repBtn) {
        var rIdx = parseInt(repBtn.getAttribute('data-replay-card'), 10);
        if (!isNaN(rIdx)) openReplayModalForCard(rIdx);
      }
    });

    $('btnConfirmSaveCard').addEventListener('click', commitSaveCard);
    $('btnSkipSaveCard').addEventListener('click', function () { appState.settlementSaved = true; closeModal('saveNameModal'); });
    $('btnCloseSaveNameModal').addEventListener('click', function () { appState.settlementSaved = true; closeModal('saveNameModal'); });

    $('startRunTypePick').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-runtype]');
      if (!btn) return;
      appState.runType = btn.getAttribute('data-runtype');
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('menuRunTypeGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-runtype]');
      if (!btn) return;
      appState.runType = btn.getAttribute('data-runtype');
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('spinDurationRange').addEventListener('input', function (e) {
      appState.spinDuration = Number(e.target.value) || 1.5;
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('speedPresetRow').addEventListener('click', function (e) {
      var chip = e.target.closest('[data-speed]');
      if (!chip) return;
      appState.spinDuration = parseFloat(chip.getAttribute('data-speed')) || 1.5;
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('autoIntervalRange').addEventListener('input', function (e) {
      appState.autoInterval = Number(e.target.value) || 0.8;
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('chkAutoSpin').addEventListener('change', function (e) {
      appState.autoSpin = Boolean(e.target.checked);
      savePrefs();
      syncSpeedAndPrefsUI();
    });

    $('btnMenuBackStart').addEventListener('click', function () {
      clearAutoTimer();
      wheelCtrl.cancel();
      saveActiveRun();
      closeModal('menuModal');
      $('gameScreen').classList.add('is-hidden');
      $('startScreen').classList.remove('is-hidden');
      updateGlobalCounters();
    });

    $('btnMenuResetAll').addEventListener('click', function () {
      clearAutoTimer();
      appState.savedCards = [];
      appState.arenaLogs = [];
      appState.fatePoints = 30;
      localStorage.removeItem(STORAGE_ACTIVE_RUN);
      saveCards();
      saveArenaLogs();
      saveFate();
      updateGlobalCounters();
      closeModal('menuModal');
    });

    $('btnExportCards').addEventListener('click', function () {
      var payload = JSON.stringify({ fatePoints: appState.fatePoints, cards: appState.savedCards }, null, 2);
      var blob = new Blob([payload], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'jjk-omega-cards.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    $('inputImportCards').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(String(reader.result));
          if (Array.isArray(parsed.cards)) {
            appState.savedCards = parsed.cards;
            if (typeof parsed.fatePoints === 'number') appState.fatePoints = Math.max(0, parsed.fatePoints);
            saveCards();
            saveFate();
            updateGlobalCounters();
            renderSavedCardsList();
          }
        } catch (err) { /* ignore invalid file */ }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) {
          if (backdrop.id === 'saveNameModal') appState.settlementSaved = true;
          closeModal(backdrop.id);
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (anyModalOpen()) return;
        if (!$('gameScreen').classList.contains('is-hidden')) {
          e.preventDefault();
          triggerMainAction();
        }
      }
    });
  }

  loadPersistence();
  updateGlobalCounters();
  bindEvents();
})();
