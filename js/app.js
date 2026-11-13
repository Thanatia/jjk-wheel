(function () {
  'use strict';

  var DATA = window.JJK_OMEGA_DATA;
  var ENGINE = window.JJK_OMEGA_ENGINE;
  var WHEEL_MOD = window.JJK_OMEGA_WHEEL;
  var RADAR = window.JJK_OMEGA_RADAR;

  var STORAGE_CARDS = 'jjk_omega_cards_v1';
  var STORAGE_FATE = 'jjk_omega_fate_v1';
  var STORAGE_PREFS = 'jjk_omega_prefs_v1';

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var appState = {
    modeId: 'normal',
    spinDuration: 1.2,
    fatePoints: 0,
    savedCards: [],
    run: null,
    currentWheelDesc: null,
    settlementEvaluated: null,
    settlementSaved: false
  };

  function loadPersistence() {
    try {
      var prefsRaw = localStorage.getItem(STORAGE_PREFS);
      if (prefsRaw) {
        var prefs = JSON.parse(prefsRaw);
        if (prefs.modeId && DATA.MODES[prefs.modeId]) appState.modeId = prefs.modeId;
        if (prefs.spinDuration) appState.spinDuration = Number(prefs.spinDuration) || 1.2;
      }
      var fateRaw = localStorage.getItem(STORAGE_FATE);
      appState.fatePoints = Math.max(0, parseInt(fateRaw || '0', 10) || 0);

      var cardsRaw = localStorage.getItem(STORAGE_CARDS);
      if (cardsRaw) {
        var parsed = JSON.parse(cardsRaw);
        if (Array.isArray(parsed)) appState.savedCards = parsed;
      }
    } catch (err) {
      appState.savedCards = [];
    }
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_PREFS, JSON.stringify({
        modeId: appState.modeId,
        spinDuration: appState.spinDuration
      }));
    } catch (err) { /* ignore quota errors */ }
  }

  function saveFate() {
    try {
      localStorage.setItem(STORAGE_FATE, String(appState.fatePoints));
    } catch (err) { /* ignore quota errors */ }
  }

  function saveCards() {
    try {
      localStorage.setItem(STORAGE_CARDS, JSON.stringify(appState.savedCards));
    } catch (err) { /* ignore quota errors */ }
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

  function syncModeButtons() {
    var modeTags = document.querySelectorAll('#startModeQuickPick .mode-tag');
    modeTags.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === appState.modeId);
    });
    var menuBtns = document.querySelectorAll('#menuModeGrid .mode-choice');
    menuBtns.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === appState.modeId);
    });
  }

  function updateGlobalCounters() {
    $('startCardCount').textContent = String(appState.savedCards.length);
    $('menuCardCount').textContent = String(appState.savedCards.length);
    $('startFatePoints').textContent = String(appState.fatePoints);
    $('menuFatePoints').textContent = appState.fatePoints + ' 点';
    $('rerollCostCount').textContent = String(appState.fatePoints);
    $('spinDurationRange').value = String(appState.spinDuration);
    $('spinDurationValue').textContent = appState.spinDuration.toFixed(1) + 's';
    syncModeButtons();
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

    if (run.currentView === 'wheel') {
      var desc = ENGINE.describeWheelForStep(run);
      appState.currentWheelDesc = desc;
      $('wheelTitleText').textContent = desc.title;
      $('wheelSubtag').textContent = desc.subtag;
      $('resultMainText').textContent = run.lastResultText || '准备就绪';
      $('resultEffectText').textContent = run.lastEffectText || '';
      wheelCtrl.setSlices(desc.slices);

      mainBtn.textContent = '点击旋转';
      mainBtn.classList.remove('is-continue');
      mainBtn.disabled = false;

      var canReroll = run.canRerollLast && appState.fatePoints >= 1;
      rerollBtn.classList.toggle('is-hidden', !canReroll);
      $('rerollCostCount').textContent = String(appState.fatePoints);

    } else if (run.currentView === 'radar') {
      rerollBtn.classList.add('is-hidden');
      var rMeta = run.pendingRadar || { stage: 'initial', title: '能力面板' };
      var isFinal = rMeta.stage === 'final';
      $('wheelTitleText').textContent = rMeta.title;
      $('wheelSubtag').textContent = run.char.identityName + ' · ' + run.char.currentEraLabel;
      $('resultMainText').textContent = rMeta.title;
      $('resultEffectText').textContent = '综合战力指数：' + ENGINE.getPowerBreakdown(run.char);

      $('radarTitleBadge').textContent = rMeta.title;
      $('radarGradeChip').textContent = run.char.officialGrade + ' · ' + run.char.hpStatus;
      $('radarSvgWrap').innerHTML = RADAR.buildRadarSvg(run.char, isFinal);
      $('radarStatsSummary').innerHTML = RADAR.renderRadarChips(run.char, isFinal);

      mainBtn.textContent = '继续';
      mainBtn.classList.add('is-continue');
      mainBtn.disabled = false;

    } else if (run.currentView === 'settlement') {
      rerollBtn.classList.add('is-hidden');
      if (!appState.settlementEvaluated) {
        appState.settlementEvaluated = ENGINE.evaluateSettlement(run);
        appState.fatePoints += appState.settlementEvaluated.fateReward;
        saveFate();
        updateGlobalCounters();
        setTimeout(openSaveNameModal, 240);
      }
      var res = appState.settlementEvaluated;
      $('wheelTitleText').textContent = '人生结算完成';
      $('wheelSubtag').textContent = run.char.identityName + ' · 总分 ' + (res.totalScore >= 0 ? '+' : '') + res.totalScore;
      $('resultMainText').textContent = res.quality;
      $('resultEffectText').textContent = '本次收获 ' + res.fateReward + ' 命运点（总余额 ' + appState.fatePoints + '）';

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
      mainBtn.classList.add('is-continue');
      mainBtn.disabled = false;
    }
  }

  function startNewLife() {
    wheelCtrl.cancel();
    appState.run = ENGINE.createRun(appState.modeId);
    appState.settlementEvaluated = null;
    appState.settlementSaved = false;
    $('startScreen').classList.add('is-hidden');
    $('gameScreen').classList.remove('is-hidden');
    renderMainView();
  }

  function triggerMainAction() {
    var run = appState.run;
    if (!run || wheelCtrl.isSpinning()) return;

    if (run.currentView === 'wheel') {
      var btn = $('btnMainAction');
      btn.textContent = '转盘进行中';
      btn.disabled = true;
      $('btnFateReroll').classList.add('is-hidden');
      wheelCtrl.spin(appState.spinDuration);
    } else if (run.currentView === 'radar') {
      ENGINE.continueAfterRadar(run);
      renderMainView();
    } else if (run.currentView === 'settlement') {
      startNewLife();
    }
  }

  function handleSpinComplete(landedRawSlice) {
    var run = appState.run;
    if (!run) return;
    var prevResult = ENGINE.applySpinOutcome(run, landedRawSlice);

    if (run.currentView === 'wheel') {
      // 展示刚落定的文字与效果，然后加载下一轮转盘
      var nextDesc = ENGINE.describeWheelForStep(run);
      appState.currentWheelDesc = nextDesc;
      $('wheelTitleText').textContent = nextDesc.title;
      $('wheelSubtag').textContent = nextDesc.subtag;
      $('resultMainText').textContent = prevResult.resultLabel;
      $('resultEffectText').textContent = prevResult.effectText;
      wheelCtrl.setSlices(nextDesc.slices);

      var mainBtn = $('btnMainAction');
      mainBtn.textContent = '点击旋转';
      mainBtn.classList.remove('is-continue');
      mainBtn.disabled = false;

      var canReroll = run.canRerollLast && appState.fatePoints >= 1;
      $('btnFateReroll').classList.toggle('is-hidden', !canReroll);
      $('rerollCostCount').textContent = String(appState.fatePoints);
    } else {
      renderMainView();
    }
  }

  /* ==================== 弹窗渲染逻辑 ==================== */
  function openModal(id) {
    $(id).classList.remove('is-hidden');
  }

  function closeModal(id) {
    $(id).classList.add('is-hidden');
  }

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

    var subParts = ['出生地：' + char.birthplace, '出身：' + char.lineage, '时期：' + char.currentEraLabel];
    if (char.master) subParts.push('御主：' + char.master);
    $('charSubline').textContent = subParts.join(' · ');

    var quickPills = [
      '立场：' + (char.faction === 'good' ? '高专/正道' : char.faction === 'evil' ? '暗面/诅咒方' : '中立/观望'),
      '胜 ' + char.statsLog.wins + ' / 负 ' + char.statsLog.losses,
      '黑闪 ' + char.statsLog.blackFlashes + ' 次'
    ];
    if (char.shikigamiDesc) quickPills.push('形态：' + char.shikigamiDesc);
    if (char.masterSupplyLabel) quickPills.push('供能：' + char.masterSupplyLabel);
    $('charQuickPills').innerHTML = quickPills.map(function (t) {
      return '<span class="dark-mini-pill">' + escapeHtml(t) + '</span>';
    }).join('');

    $('charPowerScore').textContent = String(power);

    $('charAttrGrid').innerHTML = DATA.ATTRIBUTE_DEFS.map(function (def) {
      var val = char.attrs[def.key];
      var rank = ENGINE.getRankMeta(val);
      return '<div class="attr-card">' +
        '<div class="attr-card-top">' +
        '<span class="attr-name">' + escapeHtml(def.name) + '</span>' +
        '<span class="attr-rank ' + rank.badgeClass + '">' + rank.code + ' · ' + val + '</span>' +
        '</div>' +
        '<div class="attr-note">' + escapeHtml(def.desc) + '</div>' +
        '</div>';
    }).join('');

    var a = char.attrs;
    var melee = Math.round(a.taijutsu * 2.5 + a.body * 1.8);
    var burst = Math.round(a.ceTotal * 2.4 + a.ceControl * 2.0 + (char.techniquePower || 4));
    $('charFormulaCard').textContent = '近战体术打击基准 ' + melee + ' · 术式高出力爆发基准 ' + burst +
      (char.masterSupplyMult !== 1 ? '（御主供能系数 ×' + char.masterSupplyMult.toFixed(2) + '）' : '');

    $('charSkillsList').innerHTML = char.skills.length
      ? char.skills.map(function (s) { return '<span class="dark-skill-tag">' + escapeHtml(s) + '</span>'; }).join('')
      : '<span class="dark-skill-tag">' + escapeHtml(char.technique) + '</span>';

    $('charDomainCard').textContent = char.domain;
    $('charToolsList').innerHTML = char.tools.length
      ? char.tools.map(function (t) { return '<span class="dark-skill-tag">' + escapeHtml(t) + '</span>'; }).join('')
      : '<span class="dark-skill-tag">暂未持有特殊咒具</span>';

    openModal('charModal');
  }

  function openOddsModal() {
    var desc = appState.currentWheelDesc;
    if (!desc) return;
    $('oddsModalTitle').textContent = desc.title;
    $('oddsExplain').textContent = desc.explain || '各扇区按当前实时属性动态加权占比如下：';
    var total = desc.slices.reduce(function (sum, s) { return sum + (Number(s.weight) || 1); }, 0);
    $('oddsList').innerHTML = desc.slices.map(function (s) {
      var pct = (((Number(s.weight) || 1) / total) * 100).toFixed(1);
      return '<div class="odds-row">' +
        '<div class="odds-left">' +
        '<span class="odds-dot" style="background:' + s.color + '"></span>' +
        '<span>' + escapeHtml(s.label) + '</span>' +
        '</div>' +
        '<span class="odds-pct">' + pct + '%</span>' +
        '</div>';
    }).join('');
    openModal('oddsModal');
  }

  function openTimelineModal() {
    var run = appState.run;
    var listEl = $('timelineList');
    if (!run || !run.char.timeline.length) {
      listEl.innerHTML = '<div class="odds-explain">尚未留下经历记录，请先点击旋转开启人生！</div>';
    } else {
      listEl.innerHTML = run.char.timeline.slice().reverse().map(function (item) {
        return '<div class="timeline-item">' +
          '<div class="timeline-item-head"><span>第 ' + item.step + ' 轮 · ' + escapeHtml(item.wheelTitle) + '</span><span>' + escapeHtml(item.era) + '</span></div>' +
          '<div class="timeline-item-result">' + escapeHtml(item.result) + '</div>' +
          (item.effect ? '<div class="timeline-item-effect">' + escapeHtml(item.effect) + '</div>' : '') +
          '</div>';
      }).join('');
    }
    openModal('timelineModal');
  }

  function openSaveNameModal() {
    if (appState.settlementSaved || !appState.settlementEvaluated) return;
    var nextIndex = String(appState.savedCards.length + 1).padStart(3, '0');
    var res = appState.settlementEvaluated;
    $('saveNameDesc').textContent = '结算总分 ' + (res.totalScore >= 0 ? '+' : '') + res.totalScore + '（' + res.quality + '），已入账 ' + res.fateReward + ' 命运点。为这张角色卡取个名字留作纪念吧！';
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
      name: name,
      createdAt: new Date().toLocaleString('zh-CN'),
      identityName: char.identityName,
      officialGrade: char.officialGrade,
      technique: char.technique,
      domain: char.domain,
      score: res.totalScore,
      quality: res.quality,
      wins: res.wins,
      losses: res.losses,
      blackFlashes: res.blackFlashes,
      traits: res.traits,
      timeline: char.timeline.slice(0, 40)
    });
    saveCards();
    appState.settlementSaved = true;
    updateGlobalCounters();
    closeModal('saveNameModal');
  }

  function renderSavedCardsList() {
    var listEl = $('savedCardsList');
    if (!appState.savedCards.length) {
      listEl.innerHTML = '<div class="odds-explain">暂无已保存角色卡。走完一局「人生结算」后即可命名收录！</div>';
      return;
    }
    listEl.innerHTML = appState.savedCards.map(function (c, idx) {
      return '<div class="saved-card-item">' +
        '<div class="saved-card-top">' +
        '<span class="saved-card-name">' + escapeHtml(c.name) + ' · ' + escapeHtml(c.identityName) + '</span>' +
        '<span class="saved-card-score">' + (c.score >= 0 ? '+' : '') + c.score + ' (' + escapeHtml(c.quality) + ')</span>' +
        '</div>' +
        '<div class="saved-card-meta">' + escapeHtml(c.officialGrade) + ' · ' + escapeHtml(c.technique) + ' · 胜' + c.wins + '/负' + c.losses + ' · ' + escapeHtml(c.createdAt) + '</div>' +
        '<div class="saved-card-actions">' +
        '<button type="button" class="pill-chip" data-del-card="' + idx + '">删除此卡</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  /* ==================== 事件绑定 ==================== */
  function bindEvents() {
    $('btnEnterGame').addEventListener('click', startNewLife);
    $('btnMainAction').addEventListener('click', triggerMainAction);
    $('wheelCenterHub').addEventListener('click', function () {
      if (appState.run && appState.run.currentView === 'wheel') {
        triggerMainAction();
      }
    });

    $('btnRebirth').addEventListener('click', function () {
      startNewLife();
    });

    $('btnFateReroll').addEventListener('click', function () {
      if (!appState.run || wheelCtrl.isSpinning() || appState.fatePoints < 1) return;
      if (ENGINE.rerollLastSpin(appState.run)) {
        appState.fatePoints -= 1;
        saveFate();
        updateGlobalCounters();
        renderMainView();
      }
    });

    $('btnOpenCharacter').addEventListener('click', openCharacterModal);
    $('btnCloseCharModal').addEventListener('click', function () { closeModal('charModal'); });

    $('btnShowOdds').addEventListener('click', openOddsModal);
    $('btnCloseOddsModal').addEventListener('click', function () { closeModal('oddsModal'); });

    $('btnOpenTimeline').addEventListener('click', openTimelineModal);
    $('btnMenuViewTimeline').addEventListener('click', function () {
      closeModal('menuModal');
      openTimelineModal();
    });
    $('btnCloseTimelineModal').addEventListener('click', function () { closeModal('timelineModal'); });

    $('btnOpenMenu').addEventListener('click', function () { openModal('menuModal'); });
    $('btnStartSettings').addEventListener('click', function () { openModal('menuModal'); });
    $('btnCloseMenuModal').addEventListener('click', function () { closeModal('menuModal'); });

    $('btnStartNotice').addEventListener('click', function () { openModal('noticeModal'); });
    $('btnCloseNoticeModal').addEventListener('click', function () { closeModal('noticeModal'); });

    $('btnStartCards').addEventListener('click', function () {
      renderSavedCardsList();
      openModal('cardsModal');
    });
    $('btnMenuViewCards').addEventListener('click', function () {
      closeModal('menuModal');
      renderSavedCardsList();
      openModal('cardsModal');
    });
    $('btnCloseCardsModal').addEventListener('click', function () { closeModal('cardsModal'); });

    $('savedCardsList').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del-card]');
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-del-card'), 10);
      if (!isNaN(idx)) {
        appState.savedCards.splice(idx, 1);
        saveCards();
        updateGlobalCounters();
        renderSavedCardsList();
      }
    });

    $('btnConfirmSaveCard').addEventListener('click', commitSaveCard);
    $('btnSkipSaveCard').addEventListener('click', function () {
      appState.settlementSaved = true;
      closeModal('saveNameModal');
    });
    $('btnCloseSaveNameModal').addEventListener('click', function () {
      appState.settlementSaved = true;
      closeModal('saveNameModal');
    });

    $('startModeQuickPick').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mode]');
      if (!btn) return;
      appState.modeId = btn.getAttribute('data-mode');
      savePrefs();
      updateGlobalCounters();
    });

    $('menuModeGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mode]');
      if (!btn) return;
      appState.modeId = btn.getAttribute('data-mode');
      if (appState.run && !appState.run.finished) {
        appState.run.modeId = appState.modeId;
      }
      savePrefs();
      updateGlobalCounters();
    });

    $('spinDurationRange').addEventListener('input', function (e) {
      appState.spinDuration = Number(e.target.value) || 1.2;
      $('spinDurationValue').textContent = appState.spinDuration.toFixed(1) + 's';
      savePrefs();
    });

    $('btnMenuBackStart').addEventListener('click', function () {
      wheelCtrl.cancel();
      closeModal('menuModal');
      $('gameScreen').classList.add('is-hidden');
      $('startScreen').classList.remove('is-hidden');
      updateGlobalCounters();
    });

    $('btnMenuResetAll').addEventListener('click', function () {
      appState.savedCards = [];
      appState.fatePoints = 0;
      saveCards();
      saveFate();
      updateGlobalCounters();
      closeModal('menuModal');
    });

    $('btnExportCards').addEventListener('click', function () {
      var payload = JSON.stringify({
        fatePoints: appState.fatePoints,
        cards: appState.savedCards
      }, null, 2);
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
            if (typeof parsed.fatePoints === 'number') {
              appState.fatePoints = Math.max(0, parsed.fatePoints);
            }
            saveCards();
            saveFate();
            updateGlobalCounters();
            renderSavedCardsList();
          }
        } catch (err) { /* ignore invalid JSON */ }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // 点击蒙层空白关闭弹窗
    document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) {
          if (backdrop.id === 'saveNameModal') {
            appState.settlementSaved = true;
          }
          backdrop.classList.add('is-hidden');
        }
      });
    });

    // 空格键快捷操作
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        var anyModalOpen = Array.prototype.some.call(
          document.querySelectorAll('.modal-backdrop'),
          function (m) { return !m.classList.contains('is-hidden'); }
        );
        if (anyModalOpen) return;
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
