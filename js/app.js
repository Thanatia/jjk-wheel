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
  var STORAGE_TRAITS = 'jjk_omega_traits_v2';

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
    nightMode: false,
    showFormula: false,
    pointerCount: 1,
    fatePoints: 30,
    savedCards: [],
    arenaLogs: [],
    unlockedTraits: [],
    activeCardsTab: 'dream',
    run: null,
    currentWheelDesc: null,
    settlementEvaluated: null,
    settlementSaved: false,
    autoTimerId: null,
    replayState: { card: null, stepIdx: 0, timerId: null, showAll: false }
  };

  function clearAutoTimer() {
    if (appState.autoTimerId !== null) {
      clearTimeout(appState.autoTimerId);
      appState.autoTimerId = null;
    }
  }

  function clearReplayTimer() {
    if (appState.replayState && appState.replayState.timerId !== null) {
      clearInterval(appState.replayState.timerId);
      appState.replayState.timerId = null;
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
        appState.nightMode = Boolean(p.nightMode);
        appState.showFormula = Boolean(p.showFormula);
        if (p.pointerCount === 1 || p.pointerCount === 2 || p.pointerCount === 3) {
          appState.pointerCount = p.pointerCount;
        }
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

      var traitsRaw = localStorage.getItem(STORAGE_TRAITS);
      if (traitsRaw) {
        var parsedTraits = JSON.parse(traitsRaw);
        if (Array.isArray(parsedTraits)) appState.unlockedTraits = parsedTraits;
      }
    } catch (err) { /* ignore storage errors */ }
  }

  function saveUnlockedTraits() {
    try { localStorage.setItem(STORAGE_TRAITS, JSON.stringify(appState.unlockedTraits)); } catch (err) { /* ignore */ }
  }

  function recordUnlockedTraits(ids) {
    if (!Array.isArray(ids) || !ids.length) return;
    var changed = false;
    ids.forEach(function (id) {
      if (appState.unlockedTraits.indexOf(id) === -1) {
        appState.unlockedTraits.push(id);
        changed = true;
      }
    });
    if (changed) saveUnlockedTraits();
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_PREFS, JSON.stringify({
        runType: appState.runType,
        spinDuration: appState.spinDuration,
        autoInterval: appState.autoInterval,
        autoSpin: appState.autoSpin,
        nightMode: appState.nightMode,
        showFormula: appState.showFormula,
        pointerCount: appState.pointerCount
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
    function onFinish(landedRawSlice, allLandedSlices) {
      handleSpinComplete(allLandedSlices || [landedRawSlice]);
    }
  );

  function updateFormulaBanner() {
    var el = $('formulaBanner');
    if (!el) return;
    var run = appState.run;
    if (!appState.showFormula || !run || run.currentView === 'settlement') {
      el.classList.add('is-hidden');
      return;
    }
    el.classList.remove('is-hidden');
    el.textContent = ENGINE.getCombatFormulaSummary(run);
  }

  function syncSpeedAndPrefsUI() {
    var durStr = appState.spinDuration.toFixed(1) + 's';
    var autoStr = appState.autoInterval.toFixed(1) + 's';

    document.body.classList.toggle('dark-theme', appState.nightMode);
    if ($('chkNightMode')) $('chkNightMode').checked = appState.nightMode;
    if ($('chkShowFormula')) $('chkShowFormula').checked = appState.showFormula;

    document.querySelectorAll('#pointerModeRow .preset-chip').forEach(function (chip) {
      var p = parseInt(chip.getAttribute('data-pointers'), 10);
      chip.classList.toggle('is-active', p === appState.pointerCount);
    });

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

    if (appState.run && appState.run.currentView === 'wheel') {
      var pCount = ENGINE.getStepPointerCount(appState.run, appState.pointerCount);
      wheelCtrl.setPointerCount(pCount);
    } else {
      wheelCtrl.setPointerCount(appState.pointerCount);
    }
    updateFormulaBanner();
  }

  function updateGlobalCounters() {
    $('startCardCount').textContent = String(appState.savedCards.length);
    var totalTraits = (DATA.ACHIEVEMENT_CATALOG || []).length;
    var unlockedCount = appState.unlockedTraits.length;
    $('startTraitCount').textContent = unlockedCount + '/' + totalTraits;
    $('traitsUnlockCount').textContent = String(unlockedCount);
    $('traitsTotalCount').textContent = String(totalTraits);
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
    var char = run.char;
    hud.classList.remove('is-hidden');
    $('hudPlayerName').textContent = '我方 · ' + char.identityName + '（' + char.hpStatus + '）';
    $('hudPlayerStat').textContent = '战值 ' + b.playerRoundPower + ' · 胜场 ' + b.playerWins;
    $('hudRoundBadge').textContent = '第 ' + b.round + '/' + b.maxRounds + ' 回合';
    $('hudEnemyName').textContent = b.enemyTitle;
    $('hudEnemyStat').textContent = '战值 ' + b.enemyRoundPower + ' · 胜场 ' + b.enemyWins;

    var tags = [];
    if ((b.playerChantStacks || 0) > 0) {
      tags.push('<span class="hud-tag is-good">完整咏唱×' + Math.pow(2, b.playerChantStacks) + '待用</span>');
    }
    if ((b.heavyDebuffStacks || 0) > 0) {
      tags.push('<span class="hud-tag is-warn">重创减益×' + b.heavyDebuffStacks + '(-' + Math.round((1 - Math.pow(0.7, b.heavyDebuffStacks)) * 100) + '%)</span>');
    }
    var activeTools = (char.tools || []).filter(function (t) { return !t.destroyed; });
    if (activeTools.length > 0) {
      tags.push('<span class="hud-tag is-good">参战咒具：' + escapeHtml(activeTools.map(function (t) { return t.shape; }).join('、')) + '</span>');
    }
    if ((char.cursedCorpses || []).length > 0) {
      tags.push('<span class="hud-tag is-good">自律咒骸×' + char.cursedCorpses.length + '助战</span>');
    }
    if (b.isSukunaPlayer) {
      if (b.enemyHasGojo) {
        tags.push('<span class="hud-tag is-warn">敌五条悟 · 不可侵 ' + (b.enemyInfinityBlocks || 0) + ' 层</span>');
      }
      tags.push('<span class="hud-tag is-good">' + (b.hasTenShadows ? '宿傩持有十影 · 魔虚罗可破盾' : '四臂真身完全体') + '</span>');
      tags.push('<span class="hud-tag">' + (b.playerDomainActive ? '伏魔御厨子展开（透穿不可侵）' : '御厨子领域待展') + '</span>');
    } else {
      if (char.canonCharId === 'gojo' && (b.infinityBlocks || 0) > 0) {
        tags.push('<span class="hud-tag is-good">本尊无下限 · 不可侵 ' + b.infinityBlocks + ' 次</span>');
      } else if (b.gojoJoined) {
        tags.push('<span class="hud-tag is-good">五条悟助战 · 不可侵 ' + b.infinityBlocks + ' 次 · 领域×' + (b.gojoDomainCount || 0) + '</span>');
      }
      if ((b.sukunaStun || 0) + (b.sukunaNextPenalty || 0) > 0) {
        tags.push('<span class="hud-tag is-good">宿傩下轮受限 -' + ((b.sukunaStun || 0) + (b.sukunaNextPenalty || 0)) + ' 招</span>');
      }
      tags.push('<span class="hud-tag">' + (b.agitoAlive ? '嵌合兽·颚吐存活' : '颚吐已破') + '</span>');
      tags.push('<span class="hud-tag">' + (b.mahoragaAlive ? '魔虚罗在场 (' + (b.totalAdaptations || 0) + '/13)' : '魔虚罗已灭') + '</span>');

      Object.keys(b.adaptations || {}).forEach(function (moveName) {
        var lv = b.adaptations[moveName];
        var pct = Math.min(100, lv * 30);
        tags.push('<span class="hud-tag is-warn">魔虚罗适应[' + escapeHtml(moveName.slice(0, 6)) + '] -' + pct + '%</span>');
      });
    }

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
      var activePtrs = ENGINE.getStepPointerCount(run, appState.pointerCount);
      appState.currentWheelDesc = desc;
      $('wheelTitleText').textContent = desc.title;
      $('wheelSubtag').textContent = (run.runType === 'custom' ? '天命自定 · ' : '浮生若梦 · ') + desc.subtag +
        (activePtrs > 1 ? '【' + activePtrs + '指针并行】' : '') + '（第 ' + (run.stepCount + 1) + ' 轮）';
      $('resultMainText').textContent = run.lastResultText || '准备就绪';
      $('resultEffectText').textContent = run.lastEffectText || '';
      wheelCtrl.setPointerCount(activePtrs);
      wheelCtrl.setSlices(desc.slices);
      updateFormulaBanner();

      mainBtn.textContent = '点击旋转';
      mainBtn.classList.remove('is-continue', 'is-spinning');
      mainBtn.disabled = false;

      var canReroll = run.canRerollLast && appState.fatePoints >= 1;
      rerollBtn.disabled = !canReroll;
      scheduleAutoSpinIfNeeded();

    } else if (run.currentView === 'radar') {
      clearAutoTimer();
      updateFormulaBanner();
      rerollBtn.disabled = true;
      var rMeta = run.pendingRadar || { stage: 'initial', title: '能力面板' };
      $('wheelTitleText').textContent = rMeta.title;
      $('wheelSubtag').textContent = run.char.identityName + ' · ' + run.char.currentEraLabel;
      $('resultMainText').textContent = rMeta.title;
      $('resultEffectText').textContent = '综合战力指数：' + ENGINE.getPowerBreakdown(run.char) +
        (run.char.identityId === 'canon' && run.char.canonTitle ? ' ｜ 时期定位：' + run.char.canonTitle + '（' + run.char.officialGrade + '）' : '');

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
        recordUnlockedTraits(appState.settlementEvaluated.unlockedIds || []);
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

  function handleSpinComplete(landedSlices) {
    var run = appState.run;
    if (!run) return;
    var slicesArr = Array.isArray(landedSlices) ? landedSlices : [landedSlices];
    var prevResult = ENGINE.applyMultiSpinOutcome
      ? ENGINE.applyMultiSpinOutcome(run, slicesArr)
      : ENGINE.applySpinOutcome(run, slicesArr[0]);
    saveActiveRun();

    if (run.currentView === 'wheel') {
      var nextDesc = ENGINE.describeWheelForStep(run);
      var activePtrs = ENGINE.getStepPointerCount(run, appState.pointerCount);
      appState.currentWheelDesc = nextDesc;
      $('wheelTitleText').textContent = nextDesc.title;
      $('wheelSubtag').textContent = (run.runType === 'custom' ? '天命自定 · ' : '浮生若梦 · ') + nextDesc.subtag +
        (activePtrs > 1 ? '【' + activePtrs + '指针并行】' : '') + '（第 ' + (run.stepCount + 1) + ' 轮）';
      $('resultMainText').textContent = prevResult.resultLabel;
      $('resultEffectText').textContent = prevResult.effectText;
      wheelCtrl.setPointerCount(activePtrs);
      wheelCtrl.setSlices(nextDesc.slices);
      renderBattleHud();
      updateFormulaBanner();

      var mainBtn = $('btnMainAction');
      mainBtn.textContent = '点击旋转';
      mainBtn.classList.remove('is-continue', 'is-spinning');
      mainBtn.disabled = false;

      $('btnFateReroll').disabled = !(run.canRerollLast && appState.fatePoints >= 1);
      scheduleAutoSpinIfNeeded();
    } else {
      updateFormulaBanner();
      renderMainView();
    }
  }

  /* ==================== 弹窗管理 ==================== */
  function openModal(id) {
    clearAutoTimer();
    $(id).classList.remove('is-hidden');
  }

  function closeModal(id) {
    if (id === 'replayModal') clearReplayTimer();
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

    var isPendingCanon = char.identityId === 'canon' && !char.canonCharId;
    $('charModalTitle').textContent = isPendingCanon ? '魂穿原著角色（待抽取人物模板）' : char.identityName;
    var statusTag = $('charStatusTag');
    statusTag.textContent = char.hpStatus;
    statusTag.className = 'char-status-tag' + (char.hpStatus === '已故' ? ' is-dead' : char.hpStatus !== '健康' ? ' is-injured' : '');
    $('charGradeTag').textContent = isPendingCanon ? '待抽取人物' : char.officialGrade;

    var subParts = ['出生地：' + char.birthplace, '时期：' + char.currentEraLabel, '颜值：' + char.looksText];
    if (char.gender) subParts.unshift('性别：' + char.gender);
    if (char.canonTitle) subParts.unshift('原著定位：' + char.canonTitle);
    if (char.elderClan) subParts.push('门第：' + char.elderClan);
    if (char.master) subParts.push('御主：' + char.master);
    $('charSubline').textContent = isPendingCanon ? '请先旋转「魂穿原著角色」轮盘锁定原著人物，随后自动载入对应人物初始面板' : subParts.join(' · ');

    var hasDomain = (char.skills || []).indexOf('领域展开') >= 0;
    var quickPills = [
      '阵营：' + char.factionLabel,
      '声望：' + (char.reputationText || '渐露锋芒'),
      '领域：' + (hasDomain ? '已掌握生得领域' : '未觉醒'),
      '道德：' + char.moralityText,
      '好战：' + char.aggroText,
      '胜 ' + char.statsLog.wins + ' / 负 ' + char.statsLog.losses + ' / 黑闪 ' + char.statsLog.blackFlashes
    ];
    if (char.canonSyncLabel) quickPills.push('契合：' + char.canonSyncLabel.split('（')[0]);
    if (char.canonMemoryLabel) quickPills.push('先知：' + char.canonMemoryLabel.split('（')[0]);
    if (char.canonDivergenceLabel) quickPills.push('改命：' + char.canonDivergenceLabel.split('（')[0]);
    if (char.flags && char.flags.activeVowLabel) quickPills.push('束缚：' + char.flags.activeVowLabel.split('：')[0]);
    if (char.shikigamiDesc) quickPills.push('式神：' + char.shikigamiDesc);
    if (char.shikigamiAgeLabel) quickPills.push('现存年龄：' + char.shikigamiAgeLabel);
    if (char.shikigamiMechLabel) quickPills.push('式神机制：' + char.shikigamiMechLabel);
    if (char.partnerLabel) quickPills.push('伴侣：' + char.partnerLabel);
    $('charQuickPills').innerHTML = quickPills.map(function (t) {
      return '<span class="dark-mini-pill">' + escapeHtml(t) + '</span>';
    }).join('');

    $('charPowerScore').textContent = isPendingCanon ? '待定' : String(power);

    $('charAttrGrid').innerHTML = DATA.ATTRIBUTE_DEFS.map(function (def) {
      var val = char.attrs[def.key] || 0;
      var rank = ENGINE.getRankMeta(val);
      var baseDeltaText = '';
      if (!isPendingCanon && char.canonBaseAttrs && char.canonBaseAttrs[def.key] != null) {
        var bVal = char.canonBaseAttrs[def.key];
        if (bVal !== val) {
          var diff = val - bVal;
          baseDeltaText = '（原著 ' + ENGINE.getRankMeta(bVal).code + (diff > 0 ? '+' + diff : diff) + '）';
        }
      }
      return '<div class="attr-card">' +
        '<div class="attr-card-top">' +
        '<span class="attr-name">' + escapeHtml(def.name) + '</span>' +
        '<span class="attr-rank ' + (isPendingCanon ? 'rank-c' : rank.badgeClass) + '">' + (isPendingCanon ? '待抽取' : (rank.code + ' · ' + val + baseDeltaText)) + '</span>' +
        '</div>' +
        '<div class="attr-note">' + escapeHtml(def.desc) + '</div>' +
        '</div>';
    }).join('');

    $('charTechCard').textContent = char.technique + ' — ' + (char.techniqueDesc || '尚待摸索发挥上限');

    var detailBox = $('charSkillDetailBox');
    if (detailBox) {
      detailBox.classList.add('is-hidden');
      detailBox.textContent = '';
    }
    $('charSkillsList').innerHTML = char.skills.length
      ? char.skills.map(function (s) {
          return '<button type="button" class="dark-skill-tag is-clickable" data-explain-skill="' + escapeHtml(s) + '">' + escapeHtml(s) + ' ▾</button>';
        }).join('')
      : '<span class="dark-skill-tag">暂未习得额外高级技巧</span>';

    var gearHtml = [];
    (char.tools || []).forEach(function (t) {
      var stateNote = t.destroyed ? '【已损毁】' : '【可参战】';
      gearHtml.push('<div class="dark-info-card">' + stateNote + ' 【' + escapeHtml(t.shape) + '】· ' + escapeHtml(t.effect) + '（' + escapeHtml(t.tier || '常规') + '，加成 +' + (t.bonus || 3) + '）</div>');
    });
    (char.cursedCorpses || []).forEach(function (c, ci) {
      var autoStr = c.autonomous ? '完全自主行动' : '咒丝遥控协同';
      var coresStr = (c.cores && c.cores.length) ? c.cores.map(function (cr) { return cr.label; }).join('、') : '纯体格驱动';
      gearHtml.push('<div class="dark-info-card">【自律咒骸 #' + (ci + 1) + ' · ' + escapeHtml(c.form) + '】· ' + autoStr + ' · 破坏' + escapeHtml(c.atkRank || 'A') + '/防御' + escapeHtml(c.defRank || 'A') + '/生命' + escapeHtml(c.hpRank || 'A') + ' · 核心：' + escapeHtml(coresStr) + (c.decoyUsed ? '（替身核心已耗）' : '') + '</div>');
    });
    $('charToolsList').innerHTML = gearHtml.length
      ? gearHtml.join('')
      : '<div class="dark-info-card">暂未持有专属咒具或自律咒骸</div>';

    var a = char.attrs;
    var melee = Math.round(a.taijutsu * 2.4 + a.bodyResist * 1.5);
    var spell = Math.round(a.ceTotal * 2.1 + a.ceControl * 1.8 + (char.techniquePower || 4));
    $('charFormulaCard').textContent = '基础近战基准 ' + melee + ' · 术式爆发基准 ' + spell +
      ' · 结界/灵魂综合防御 ' + Math.round(a.barrier * 1.6 + a.soulResist * 1.6) + ' · 当前公式：' + ENGINE.getCombatFormulaSummary(run);

    openModal('charModal');
  }

  /* ==================== 自定义开局配置器 ==================== */
  var CUSTOM_SELECT_IDS = [
    'custIdentity', 'custCanonChar', 'custEra', 'custBirthplace', 'custGender',
    'custTech', 'custGrade', 'custTalent', 'custAttrTier', 'custPerk',
    'custExtraSkill', 'custToolCount', 'custToolEffect',
    'custLooks', 'custMorality', 'custAggro', 'custFaction', 'custShinjukuOrder'
  ];

  function populateCustomModalOptions() {
    function fillSelect(selId, opts) {
      var el = $(selId);
      if (!el) return;
      el.innerHTML = opts.map(function (o) {
        return '<option value="' + escapeHtml(o.value) + '" data-cost="' + (o.cost || 0) + '">' + escapeHtml(o.label) + '</option>';
      }).join('');
    }

    fillSelect('custIdentity', [{ value: 'random', label: '🎲 随机抽取身份 (0 点)', cost: 0 }].concat(
      DATA.IDENTITIES.map(function (x) { return { value: x.id, label: x.label + ' (' + x.cost + ' 点)', cost: x.cost }; })
    ));

    fillSelect('custCanonChar', [{ value: 'random', label: '🎲 随机抽取原著角色 (0 点)', cost: 0 }].concat(
      (DATA.CANON_CHARACTERS || []).map(function (c) {
        return { value: c.id, label: c.name + ' · ' + c.officialGrade + '·' + c.technique.split('（')[0] + ' (' + c.cost + ' 点)', cost: c.cost };
      })
    ));

    fillSelect('custEra', [{ value: 'random', label: '🎲 随机时期 (0 点)', cost: 0 }].concat(
      DATA.ERAS.filter(function (e) { return e.id !== 'future68'; }).map(function (e) {
        return { value: e.id, label: e.label + ' (' + e.cost + ' 点)', cost: e.cost };
      })
    ));

    fillSelect('custBirthplace', [{ value: 'random', label: '🎲 随机出生地点 (0 点)', cost: 0 }].concat(
      (DATA.BIRTHPLACE_SLICES || []).map(function (b) { return { value: b.id, label: b.label, cost: 0 }; })
    ));

    fillSelect('custGender', [{ value: 'random', label: '🎲 随机性别 (0 点)', cost: 0 }].concat(
      (DATA.GENDER_WHEEL || []).map(function (g) { return { value: g.id, label: g.label, cost: 0 }; })
    ));

    fillSelect('custTech', [{ value: 'random', label: '🎲 随机术式 (0 点)', cost: 0 }].concat(
      DATA.TECHNIQUES_ALL.map(function (t) {
        var tc = t.cost != null ? t.cost : 2;
        return { value: t.id, label: t.label + ' (' + tc + ' 点)', cost: tc };
      })
    ));

    fillSelect('custGrade', [{ value: 'random', label: '🎲 随机官方评级 (0 点)', cost: 0 }].concat(
      DATA.GRADE_WHEELS.standard.concat(DATA.GRADE_WHEELS.civilian || []).map(function (g) {
        var gc = g.cost != null ? g.cost : 0;
        return { value: g.id, label: g.id + ' (' + gc + ' 点)', cost: gc };
      })
    ));

    fillSelect('custTalent', [
      { value: 'random', label: '🎲 随机天赋 (0 点)', cost: 0 },
      { value: '7', label: 'S · 优秀天赋 (2 点)', cost: 2 },
      { value: '9', label: 'SSS · 罕见资质 (5 点)', cost: 5 },
      { value: '10', label: 'EX · 特级资质 (8 点)', cost: 8 }
    ]);

    fillSelect('custExtraSkill', [{ value: 'random', label: '🎲 不额外指定 (0 点)', cost: 0 }].concat(
      (DATA.HIGH_TECHNIQUES || []).map(function (ht) {
        return { value: ht.id, label: ht.label + ' (2 点)', cost: 2 };
      })
    ));

    fillSelect('custToolCount', [
      { value: 'random', label: '🎲 按转盘抽取 (0 点)', cost: 0 },
      { value: '0', label: '0 件（纯肉身/术式） (0 点)', cost: 0 },
      { value: '1', label: '1 件咒具 (1 点)', cost: 1 },
      { value: '2', label: '2 件咒具 (2 点)', cost: 2 },
      { value: '3', label: '3 件咒具 (3 点)', cost: 3 }
    ]);

    fillSelect('custToolEffect', [{ value: 'random', label: '🎲 随机咒具特效 (0 点)', cost: 0 }].concat(
      (DATA.TOOL_EFFECTS || []).map(function (te) {
        var c = te.tier === '特级' ? 2 : 1;
        return { value: te.id, label: te.label + ' (' + c + ' 点)', cost: c };
      })
    ));

    fillSelect('custLooks', [{ value: 'random', label: '🎲 随机外貌 (0 点)', cost: 0 }].concat(
      (DATA.LOOKS_WHEEL || []).map(function (l) { return { value: String(l.level), label: l.label, cost: 0 }; })
    ));

    fillSelect('custMorality', [{ value: 'random', label: '🎲 随机三观 (0 点)', cost: 0 }].concat(
      (DATA.MORALITY_WHEEL || []).map(function (m) { return { value: String(m.level), label: m.label, cost: 0 }; })
    ));

    fillSelect('custAggro', [{ value: 'random', label: '🎲 随机好战度 (0 点)', cost: 0 }].concat(
      (DATA.AGGRO_WHEEL || []).map(function (a) { return { value: String(a.level), label: a.label, cost: 0 }; })
    ));

    fillSelect('custFaction', [
      { value: 'random', label: '🎲 按转盘抽取 (0 点)', cost: 0 },
      { value: 'good', label: '高专 / 正道阵营 (0 点)', cost: 0 },
      { value: 'evil', label: '诅咒 / 暗面阵营 (0 点)', cost: 0 },
      { value: 'neutral', label: '中立游走阵营 (0 点)', cost: 0 }
    ]);

    fillSelect('custShinjukuOrder', [{ value: 'random', label: '🎲 届时转盘决定 (0 点)', cost: 0 }].concat(
      (DATA.SHINJUKU_SUKUNA_ORDERS || []).map(function (o) {
        return { value: o.id, label: o.label + ' (1 点)', cost: 1 };
      })
    ));

    var statGrid = $('custStatOverridesGrid');
    if (statGrid) {
      statGrid.innerHTML = DATA.ATTRIBUTE_DEFS.map(function (def) {
        return '<label class="custom-field">' +
          '<span>' + escapeHtml(def.name) + '</span>' +
          '<select id="custStat_' + escapeHtml(def.key) + '" class="select-input cust-stat-override" data-statkey="' + escapeHtml(def.key) + '">' +
          '<option value="random" data-cost="0">🎲 随机 (0)</option>' +
          '<option value="0" data-cost="1">E- · 0 (1点)</option>' +
          '<option value="2" data-cost="1">D · 2 (1点)</option>' +
          '<option value="4" data-cost="1">C · 4 (1点)</option>' +
          '<option value="6" data-cost="1">A · 6 (1点)</option>' +
          '<option value="8" data-cost="1">SS · 8 (1点)</option>' +
          '<option value="10" data-cost="1">EX · 10 (1点)</option>' +
          '</select></label>';
      }).join('');
    }
    syncCustomFieldVisibility();
  }

  function syncCustomFieldVisibility() {
    var idVal = $('custIdentity').value;
    var isCanon = idVal === 'canon';
    var isCivilian = idVal === 'civilian';
    var isShikigami = idVal === 'shikigami';
    var tcVal = $('custToolCount') ? $('custToolCount').value : 'random';
    var hasCustomTools = tcVal === '1' || tcVal === '2' || tcVal === '3';

    var techEl = $('custTech');
    if (techEl && techEl.options && techEl.options[0]) {
      techEl.options[0].textContent = isCivilian ? '🎲 默认无生得术式 (0 点)' : '🎲 随机术式 (0 点)';
    }
    var gradeEl = $('custGrade');
    if (gradeEl && gradeEl.options && gradeEl.options[0]) {
      gradeEl.options[0].textContent = isCivilian ? '🎲 按普通人阶层抽选 (0 点)' : '🎲 随机官方评级 (0 点)';
    }

    $('custCanonWrap').classList.toggle('is-hidden', !isCanon);
    $('custTechWrap').classList.toggle('is-hidden', isCanon);
    $('custGradeWrap').classList.toggle('is-hidden', isCanon);
    if ($('custGenderWrap')) $('custGenderWrap').classList.toggle('is-hidden', isCanon);
    if ($('custLooksWrap')) $('custLooksWrap').classList.toggle('is-hidden', isCanon);
    if ($('custMoralityWrap')) $('custMoralityWrap').classList.toggle('is-hidden', isCanon);
    if ($('custAggroWrap')) $('custAggroWrap').classList.toggle('is-hidden', isCanon);
    if ($('custFactionWrap')) $('custFactionWrap').classList.toggle('is-hidden', isCanon || isShikigami);
    if ($('custToolCountWrap')) $('custToolCountWrap').classList.toggle('is-hidden', isCanon);
    if ($('custToolEffectWrap')) $('custToolEffectWrap').classList.toggle('is-hidden', isCanon || !hasCustomTools);

    if (isCanon) {
      ['custTech', 'custGrade', 'custGender', 'custLooks', 'custMorality', 'custAggro', 'custFaction', 'custToolCount', 'custToolEffect'].forEach(function (id) {
        if ($(id)) $(id).value = 'random';
      });
    } else {
      $('custCanonChar').value = 'random';
      if (isShikigami && $('custFaction')) $('custFaction').value = 'random';
      if (!hasCustomTools && $('custToolEffect')) $('custToolEffect').value = 'random';
    }
  }

  function calcCustomCost() {
    syncCustomFieldVisibility();
    var isCanon = $('custIdentity').value === 'canon';
    var ids = isCanon
      ? ['custIdentity', 'custCanonChar', 'custEra', 'custBirthplace', 'custTalent', 'custAttrTier', 'custPerk', 'custExtraSkill', 'custShinjukuOrder']
      : ['custIdentity', 'custEra', 'custBirthplace', 'custGender', 'custTech', 'custGrade', 'custTalent', 'custAttrTier', 'custPerk', 'custExtraSkill', 'custToolCount', 'custToolEffect', 'custLooks', 'custMorality', 'custAggro', 'custFaction', 'custShinjukuOrder'];
    var total = 0;
    ids.forEach(function (id) {
      var sel = $(id);
      if (!sel || sel.selectedIndex < 0) return;
      var opt = sel.options[sel.selectedIndex];
      if (opt) total += parseInt(opt.getAttribute('data-cost') || '0', 10);
    });
    document.querySelectorAll('.cust-stat-override').forEach(function (sel) {
      var opt = sel.options[sel.selectedIndex];
      if (opt) total += parseInt(opt.getAttribute('data-cost') || '0', 10);
    });
    $('customFateCost').textContent = String(total);
    $('customFateRemain').textContent = String(appState.fatePoints);
    $('btnStartCustomRun').disabled = total > appState.fatePoints;
    $('btnStartCustomRun').textContent = total > appState.fatePoints
      ? '命运点不足（需 ' + total + ' 点）'
      : '消耗 ' + total + ' 命运点并开启人生';
    return total;
  }

  function resetAllCustomFields() {
    CUSTOM_SELECT_IDS.forEach(function (id) { if ($(id)) $(id).value = 'random'; });
    document.querySelectorAll('.cust-stat-override').forEach(function (sel) { sel.value = 'random'; });
  }

  function applyCustomPresetTemplate(presetName) {
    resetAllCustomFields();
    if (presetName === 'gojo_tpl') {
      $('custIdentity').value = 'sorcerer';
      $('custEra').value = 'canonStart';
      $('custTech').value = 'limitless';
      $('custGrade').value = '特级';
      $('custTalent').value = '9';
      $('custPerk').value = 'both';
    } else if (presetName === 'toji_tpl') {
      $('custIdentity').value = 'sorcerer';
      $('custTech').value = 'heavenZero';
      $('custGrade').value = '特级';
      $('custToolCount').value = '2';
      $('custToolEffect').value = 'nullify';
      $('custTalent').value = '7';
    } else if (presetName === 'shinjuku_test') {
      $('custIdentity').value = 'sorcerer';
      $('custEra').value = 'shinjuku';
      $('custTech').value = 'starRage';
      $('custGrade').value = '特级';
      $('custPerk').value = 'rct';
      $('custShinjukuOrder').value = 'with_gojo';
    }
    calcCustomCost();
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

  /* ==================== 排行榜与角色卡 / 成就词条 / 回放 ==================== */
  function openCardsModalOnTab(tabName) {
    appState.activeCardsTab = tabName || 'dream';
    document.querySelectorAll('#cardsTabStrip .tab-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-cardtab') === appState.activeCardsTab);
    });
    renderSavedCardsList();
    openModal('cardsModal');
  }

  function renderSavedCardsList() {
    var listEl = $('savedCardsList');
    var toolbarEl = $('cardsToolbar');

    if (appState.activeCardsTab === 'traits') {
      if (toolbarEl) toolbarEl.classList.add('is-hidden');
      var catalog = DATA.ACHIEVEMENT_CATALOG || [];
      var unlockedSet = appState.unlockedTraits || [];
      var sortedCatalog = catalog.slice().sort(function (a, b) {
        var ua = unlockedSet.indexOf(a.id) >= 0 ? 1 : 0;
        var ub = unlockedSet.indexOf(b.id) >= 0 ? 1 : 0;
        return ub - ua;
      });
      listEl.innerHTML =
        '<div class="trait-catalog-summary">总收集进度：<strong>' + unlockedSet.length + ' / ' + catalog.length + '</strong>（达成对应人生事件、魂穿结局或新宿战绩自动点亮词条）</div>' +
        sortedCatalog.map(function (item) {
          var unlocked = unlockedSet.indexOf(item.id) >= 0;
          var scoreStr = (item.points >= 0 ? '+' : '') + item.points + '分';
          return '<div class="trait-catalog-item' + (unlocked ? '' : ' is-locked') + '">' +
            '<div>' +
            '<div class="trait-catalog-head">' +
            '<span class="trait-tier-badge tier-' + escapeHtml(item.tier) + '">' + escapeHtml(item.tier.toUpperCase()) + '</span>' +
            '<strong>' + escapeHtml(item.title) + '</strong>' +
            '<span class="odds-explain" style="margin:0;">(' + escapeHtml(item.category) + ' · ' + scoreStr + ')</span>' +
            '</div>' +
            '<div class="trait-desc" style="margin-top:4px;">' + escapeHtml(item.desc) + '</div>' +
            '</div>' +
            '<span class="trait-lock-pill">' + (unlocked ? '✓ 已解锁' : '🔒 未解锁') + '</span>' +
            '</div>';
        }).join('');
      return;
    }

    if (toolbarEl) toolbarEl.classList.remove('is-hidden');
    var isLoserBoard = appState.activeCardsTab === 'loser';
    var filtered = appState.savedCards
      .map(function (card, rawIdx) { return { card: card, rawIdx: rawIdx }; })
      .filter(function (wrap) {
        if (isLoserBoard) return true;
        return (wrap.card.runType || 'dream') === appState.activeCardsTab;
      })
      .sort(function (a, b) {
        return isLoserBoard ? (a.card.score - b.card.score) : (b.card.score - a.card.score);
      });

    if (!filtered.length) {
      listEl.innerHTML = '<div class="odds-explain">该榜单暂无记录。走完一局对应模式的「人生结算」后即可收录冲击排名！</div>';
      return;
    }

    listEl.innerHTML = (isLoserBoard ? '<div class="odds-explain" style="margin-bottom:6px;">😈 区区榜按结算总分从低到高排序：专收“黑闪绝缘体/极端加点/被弱者击溃”搞笑存档！</div>' : '') +
      filtered.map(function (wrap, rank) {
        var c = wrap.card;
        return '<div class="saved-card-item">' +
          '<div class="saved-card-top">' +
          '<span class="saved-card-name">' + (isLoserBoard ? '区.' : 'No.') + (rank + 1) + ' ' + escapeHtml(c.name) + ' · ' + escapeHtml(c.identityName) + '</span>' +
          '<span class="saved-card-score">' + (c.score >= 0 ? '+' : '') + c.score + ' (' + escapeHtml(c.quality) + ')</span>' +
          '</div>' +
          '<div class="saved-card-meta">' + escapeHtml(c.officialGrade) + ' · ' + escapeHtml(c.technique) + ' · 胜' + c.wins + '/负' + c.losses + ' · ' + escapeHtml(c.createdAt) + '</div>' +
          '<div class="saved-card-actions">' +
          '<button type="button" class="pill-chip" data-replay-card="' + wrap.rawIdx + '">📖 逐盘回放人生与雷达</button>' +
          '<button type="button" class="pill-chip" data-del-card="' + wrap.rawIdx + '">🗑 删除</button>' +
          '</div>' +
          '</div>';
      }).join('');
  }

  function renderReplayBody() {
    var rs = appState.replayState;
    var c = rs.card;
    if (!c) return;
    var steps = c.timeline || [];
    var total = steps.length;
    if (rs.stepIdx >= total) rs.stepIdx = Math.max(0, total - 1);
    var cur = steps[rs.stepIdx];

    var radarHtml = c.attrs ? RADAR.buildRadarSvg(c) : '';
    var traitsHtml = (c.traits || []).map(function (t) {
      var isPos = t.score >= 0;
      return '<div class="trait-item"><div><div class="trait-title-row">' + escapeHtml(t.name) + '</div><div class="trait-desc">' + escapeHtml(t.desc) + '</div></div><span class="trait-score ' + (isPos ? 'is-pos' : 'is-neg') + '">' + (isPos ? '+' : '') + t.score + '</span></div>';
    }).join('');

    var spotlightHtml = '';
    if (total > 0 && cur) {
      spotlightHtml =
        '<div class="replay-step-controls">' +
        '<div class="replay-step-btns">' +
        '<button type="button" class="pill-chip" id="btnReplayPrev"' + (rs.stepIdx <= 0 ? ' disabled' : '') + '>⏮ 上一盘</button>' +
        '<button type="button" class="pill-chip" id="btnReplayTogglePlay">' + (rs.timerId !== null ? '⏸ 暂停' : '▶ 自动回放') + '</button>' +
        '<button type="button" class="pill-chip" id="btnReplayNext"' + (rs.stepIdx >= total - 1 ? ' disabled' : '') + '>⏭ 下一盘</button>' +
        '<button type="button" class="pill-chip" id="btnReplayToggleAll">' + (rs.showAll ? '收起完整日志' : '展开全部') + '</button>' +
        '</div>' +
        '<span class="replay-step-counter">第 ' + (rs.stepIdx + 1) + ' / ' + total + ' 盘</span>' +
        '</div>' +
        '<div class="replay-spotlight-card">' +
        '<div class="replay-spotlight-head"><span>第 ' + cur.step + ' 轮 · ' + escapeHtml(cur.wheelTitle) + '</span><span>' + escapeHtml(cur.era) + '</span></div>' +
        '<div class="replay-spotlight-result">' + escapeHtml(cur.result) + '</div>' +
        '<div class="replay-spotlight-effect">' + escapeHtml(cur.effect || '阶段推进') + '</div>' +
        '</div>';
    } else {
      spotlightHtml = '<div class="odds-explain">无保存的分步时间线日志。</div>';
    }

    var logsHtml = rs.showAll
      ? '<h3 class="setting-label">全部生平回放日志</h3><div class="timeline-list">' +
        steps.map(function (item, idx) {
          return '<div class="timeline-item" style="' + (idx === rs.stepIdx ? 'border-color:var(--crimson);' : '') + '"><div class="timeline-item-head"><span>第' + item.step + '轮 · ' + escapeHtml(item.wheelTitle) + '</span><span>' + escapeHtml(item.era) + '</span></div><div class="timeline-item-result">' + escapeHtml(item.result) + '</div><div class="timeline-item-effect">' + escapeHtml(item.effect) + '</div></div>';
        }).join('') + '</div>'
      : '';

    $('replayModalBody').innerHTML =
      '<div class="settlement-summary-line">' + escapeHtml(c.name) + ' · ' + escapeHtml(c.identityName) + ' · ' + escapeHtml(c.officialGrade) + ' · ' + escapeHtml(c.technique) + '</div>' +
      spotlightHtml +
      (radarHtml ? '<div class="radar-svg-wrap">' + radarHtml + '</div>' : '') +
      '<h3 class="setting-label">最终正负词条与成就</h3><div class="settlement-traits-list" style="margin-bottom:12px;">' + traitsHtml + '</div>' +
      logsHtml;
  }

  function openReplayModalForCard(cardIdx) {
    var c = appState.savedCards[cardIdx];
    if (!c) return;
    clearReplayTimer();
    appState.replayState = { card: c, stepIdx: 0, timerId: null, showAll: false };
    renderReplayBody();
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
    if ($('btnMenuChangelog')) {
      $('btnMenuChangelog').addEventListener('click', function () {
        closeModal('menuModal');
        openModal('noticeModal');
        var anchor = $('noticeChangelogAnchor');
        if (anchor && anchor.scrollIntoView) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    $('btnCloseNoticeModal').addEventListener('click', function () { closeModal('noticeModal'); });

    $('btnStartCards').addEventListener('click', function () { openCardsModalOnTab('dream'); });
    $('btnStartTraits').addEventListener('click', function () { openCardsModalOnTab('traits'); });
    $('btnHubBoards').addEventListener('click', function () { closeModal('menuModal'); openCardsModalOnTab(appState.activeCardsTab || 'dream'); });
    $('btnCloseCardsModal').addEventListener('click', function () { closeModal('cardsModal'); });
    $('btnCloseReplayModal').addEventListener('click', function () { clearReplayTimer(); closeModal('replayModal'); });

    $('charSkillsList').addEventListener('click', function (e) {
      var tag = e.target.closest('[data-explain-skill]');
      if (!tag) return;
      var sk = tag.getAttribute('data-explain-skill');
      var descMap = DATA.SKILL_DESCRIPTIONS || {};
      var text = descMap[sk] || ('「' + sk + '」：关键高阶秘技，在实战与新宿决战盘中有机会触发专属对抗或加权效应。');
      var box = $('charSkillDetailBox');
      document.querySelectorAll('#charSkillsList .dark-skill-tag').forEach(function (el) { el.classList.toggle('is-selected', el === tag); });
      box.textContent = text;
      box.classList.remove('is-hidden');
    });

    $('replayModalBody').addEventListener('click', function (e) {
      var rs = appState.replayState;
      if (!rs || !rs.card) return;
      var steps = rs.card.timeline || [];
      if (e.target.closest('#btnReplayPrev')) {
        if (rs.stepIdx > 0) { rs.stepIdx -= 1; renderReplayBody(); }
      } else if (e.target.closest('#btnReplayNext')) {
        if (rs.stepIdx < steps.length - 1) { rs.stepIdx += 1; renderReplayBody(); }
      } else if (e.target.closest('#btnReplayToggleAll')) {
        rs.showAll = !rs.showAll;
        renderReplayBody();
      } else if (e.target.closest('#btnReplayTogglePlay')) {
        if (rs.timerId !== null) {
          clearReplayTimer();
        } else {
          if (rs.stepIdx >= steps.length - 1) rs.stepIdx = 0;
          rs.timerId = setInterval(function () {
            if (rs.stepIdx < steps.length - 1) {
              rs.stepIdx += 1;
              renderReplayBody();
            } else {
              clearReplayTimer();
              renderReplayBody();
            }
          }, 900);
        }
        renderReplayBody();
      }
    });

    $('btnStartArena').addEventListener('click', openArenaModal);
    $('btnHubArena').addEventListener('click', function () { closeModal('menuModal'); openArenaModal(); });
    $('btnCloseArenaModal').addEventListener('click', function () { closeModal('arenaModal'); });

    $('btnHubCustom').addEventListener('click', function () { closeModal('menuModal'); openCustomModal(); });
    $('btnCloseCustomModal').addEventListener('click', function () { closeModal('customModal'); });

    // 自定义开局联动算点、一键预设与开局
    CUSTOM_SELECT_IDS.forEach(function (id) {
      if ($(id)) $(id).addEventListener('change', calcCustomCost);
    });
    if ($('custStatOverridesGrid')) {
      $('custStatOverridesGrid').addEventListener('change', calcCustomCost);
    }
    if ($('customPresetRow')) {
      $('customPresetRow').addEventListener('click', function (e) {
        var chip = e.target.closest('[data-preset]');
        if (!chip) return;
        applyCustomPresetTemplate(chip.getAttribute('data-preset'));
      });
    }
    $('btnResetCustomForm').addEventListener('click', function () {
      resetAllCustomFields();
      calcCustomCost();
    });
    $('btnStartCustomRun').addEventListener('click', function () {
      var cost = calcCustomCost();
      if (cost > appState.fatePoints) return;
      var statOverrides = {};
      document.querySelectorAll('.cust-stat-override').forEach(function (sel) {
        var k = sel.getAttribute('data-statkey');
        if (k && sel.value && sel.value !== 'random') statOverrides[k] = sel.value;
      });
      appState.fatePoints -= cost;
      saveFate();
      closeModal('customModal');
      startNewRunWithState(ENGINE.createRun('custom', {
        identityId: $('custIdentity').value,
        canonCharId: $('custCanonChar').value,
        eraId: $('custEra').value,
        birthplaceId: $('custBirthplace') ? $('custBirthplace').value : 'random',
        genderId: $('custGender') ? $('custGender').value : 'random',
        techId: $('custTech').value,
        gradeId: $('custGrade').value,
        talentLv: $('custTalent').value,
        attrTier: $('custAttrTier').value,
        perk: $('custPerk').value,
        extraHighTechId: $('custExtraSkill') ? $('custExtraSkill').value : 'random',
        toolCount: $('custToolCount') ? $('custToolCount').value : 'random',
        toolEffectId: $('custToolEffect') ? $('custToolEffect').value : 'random',
        looksLv: $('custLooks') ? $('custLooks').value : 'random',
        moralityLv: $('custMorality') ? $('custMorality').value : 'random',
        aggroLv: $('custAggro') ? $('custAggro').value : 'random',
        factionChoice: $('custFaction') ? $('custFaction').value : 'random',
        shinjukuOrderId: $('custShinjukuOrder') ? $('custShinjukuOrder').value : 'random',
        statOverrides: statOverrides
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

    if ($('chkNightMode')) {
      $('chkNightMode').addEventListener('change', function (e) {
        appState.nightMode = Boolean(e.target.checked);
        savePrefs();
        syncSpeedAndPrefsUI();
      });
    }

    if ($('chkShowFormula')) {
      $('chkShowFormula').addEventListener('change', function (e) {
        appState.showFormula = Boolean(e.target.checked);
        savePrefs();
        syncSpeedAndPrefsUI();
      });
    }

    if ($('pointerModeRow')) {
      $('pointerModeRow').addEventListener('click', function (e) {
        var chip = e.target.closest('[data-pointers]');
        if (!chip) return;
        appState.pointerCount = parseInt(chip.getAttribute('data-pointers'), 10) || 1;
        savePrefs();
        syncSpeedAndPrefsUI();
        renderMainView();
      });
    }

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
      appState.unlockedTraits = [];
      appState.fatePoints = 30;
      localStorage.removeItem(STORAGE_ACTIVE_RUN);
      saveCards();
      saveArenaLogs();
      saveUnlockedTraits();
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
      a.download = 'jjk-cards.json';
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
