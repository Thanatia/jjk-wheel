/* =========================================================
 * 咒术回战 · 人物转盘模拟器 - 主控逻辑（B站短视频头像轮盘版，纯静音）
 * ========================================================= */
(function (global) {
  'use strict';

  const {
    TIER_META,
    SPEED_CONFIG,
    CHARACTERS,
    PUZZLE_SLOTS,
    RELATION_SLOTS,
    DUEL_ARENAS,
    BOSSES
  } = global.JJK_DATA;

  const {
    getAvatarDataUrl,
    getAvatarImage,
    preloadAllAvatars
  } = global.JJK_AVATARS;

  const STORAGE_HISTORY_KEY = 'jjk_wheel_history_v2';
  const STORAGE_ROSTER_KEY = 'jjk_wheel_roster_v2';
  const STORAGE_THEME_KEY = 'jjk_wheel_theme_v2';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadRoster() {
    try {
      const raw = localStorage.getItem(STORAGE_ROSTER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      }
    } catch (_) {}
    return Object.values(clone(CHARACTERS));
  }

  function saveRoster() {
    try {
      localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(state.roster));
    } catch (_) {}
  }

  const state = {
    mode: 'puzzle',        // 'puzzle' | 'relation' | 'duel'
    speed: 'normal',
    spinStyle: 'auto',     // 'auto' | 'manual'
    revealEnabled: true,
    memePoolEnabled: true,
    theme: 'dark',

    isSpinning: false,
    manualPhase: 'idle',   // 'idle' | 'cruising' | 'braking'
    manualRafId: null,
    currentRotation: 0,
    lastSliceIdx: -1,

    roster: loadRoster(),
    arenas: clone(DUEL_ARENAS),

    puzzleActiveSlotIdx: 0,
    puzzleBuild: {},       // { slotId: charObj }

    relationActiveSlotIdx: 0,
    relationBuild: {},     // { slotId: charObj }

    duelTargetSide: 'red', // 'red' | 'blue' | 'arena'
    duelPoolFilter: 'all',
    duelRed: null,
    duelBlue: null,
    duelArena: DUEL_ARENAS[0],

    pendingReveal: null,
    battleAbort: false,
    lastBattleContext: null,
    history: []
  };

  try {
    const savedHist = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (savedHist) state.history = JSON.parse(savedHist);
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') state.theme = savedTheme;
  } catch (_) {}

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg) {
    const box = $('toastBox');
    box.textContent = msg;
    box.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => box.classList.add('hidden'), 2400);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(successMsg); } catch (_) { showToast('复制失败'); }
    document.body.removeChild(ta);
  }

  function applyTheme(theme) {
    state.theme = theme;
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      $('themeBtn').textContent = '🌙 暗色模式';
    } else {
      document.documentElement.removeAttribute('data-theme');
      $('themeBtn').textContent = '☀️ 亮色模式';
    }
    try { localStorage.setItem(STORAGE_THEME_KEY, theme); } catch (_) {}
    drawWheel();
    renderPuzzlePanel();
  }

  function getActiveWheelItems() {
    let list = [];
    let title = '';
    if (state.mode === 'puzzle') {
      const slot = PUZZLE_SLOTS[state.puzzleActiveSlotIdx];
      title = `${slot.icon} ${slot.title}`;
      list = state.roster;
    } else if (state.mode === 'relation') {
      const slot = RELATION_SLOTS[state.relationActiveSlotIdx];
      title = `${slot.icon} ${slot.title}`;
      list = state.roster;
    } else {
      if (state.duelTargetSide === 'arena') {
        title = '🏟️ 决战场地与特殊规则';
        list = state.arenas;
      } else {
        title = state.duelTargetSide === 'red' ? '🔴 红方选手抽取' : '🔵 蓝方选手抽取';
        list = state.roster.filter(ch => {
          if (state.duelPoolFilter === 'top') return ch.tier === 'SSR' || ch.tier === 'SR';
          if (state.duelPoolFilter === 'low') return ch.tier === 'R' || ch.tier === 'MEME';
          return true;
        });
      }
    }

    const filtered = state.memePoolEnabled
      ? list
      : list.filter(it => !it.isMeme && it.tier !== 'MEME');

    return {
      title,
      items: filtered.length >= 2 ? filtered : list
    };
  }

  function computeUniformSlices(items) {
    const n = Math.max(1, items.length);
    const sweep = (Math.PI * 2) / n;
    return items.map((item, idx) => ({
      item,
      idx,
      start: idx * sweep,
      end: (idx + 1) * sweep,
      mid: (idx + 0.5) * sweep,
      sweep
    }));
  }

  // =========================================================
  // CANVAS WHEEL WITH CHARACTER PORTRAITS ON EVERY SLICE
  // =========================================================
  const wheelCanvas = $('wheelCanvas');
  const wheelCtx = wheelCanvas.getContext('2d');

  function getSliceIndexAtPointer(slices, rotation) {
    const twoPi = Math.PI * 2;
    const pointerLocal = (((-Math.PI / 2 - rotation) % twoPi) + twoPi) % twoPi;
    for (let i = 0; i < slices.length; i++) {
      if (pointerLocal >= slices[i].start && pointerLocal < slices[i].end) return i;
    }
    return 0;
  }

  function updateLivePointerHud(item) {
    if (!item) return;
    const avatarEl = $('livePointerAvatar');
    const url = getAvatarDataUrl(item.key || 'gojo');
    avatarEl.innerHTML = `<img src="${url}" alt="${escapeHtml(item.name)}" style="width:100%;height:100%;display:block" />`;

    let extra = '';
    if (state.mode === 'puzzle') {
      const slot = PUZZLE_SLOTS[state.puzzleActiveSlotIdx];
      extra = item.abilities?.[slot.id] ? ` · ${item.abilities[slot.id]}` : '';
    }
    $('livePointerText').textContent = `${item.name}${extra}`;
  }

  function drawWheel() {
    const rect = wheelCanvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const pxSize = Math.round(rect.width * dpr);
    if (wheelCanvas.width !== pxSize || wheelCanvas.height !== pxSize) {
      wheelCanvas.width = pxSize;
      wheelCanvas.height = pxSize;
    }

    const ctx = wheelCtx;
    const size = pxSize;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.465;
    const isLight = state.theme === 'light';

    ctx.clearRect(0, 0, size, size);

    const { items } = getActiveWheelItems();
    const slices = computeUniformSlices(items);
    const hoveredIdx = getSliceIndexAtPointer(slices, state.currentRotation);
    updateLivePointerHud(slices[hoveredIdx]?.item);

    // Outer metallic ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + size * 0.024, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#dbe3f2' : '#1b2236';
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.006);
    ctx.strokeStyle = isLight ? '#94a3b8' : '#4c1d95';
    ctx.stroke();
    ctx.restore();

    const rAvatar = radius * 0.82;
    const avatarSize = Math.min(radius * 0.21, rAvatar * (slices[0]?.sweep || 0.4) * 0.84);

    slices.forEach((sl, idx) => {
      const startA = sl.start + state.currentRotation;
      const endA = sl.end + state.currentRotation;
      const midA = (startA + endA) / 2;
      const isHovered = idx === hoveredIdx;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.closePath();

      ctx.fillStyle = sl.item.color || (idx % 2 === 0 ? '#6d28d9' : '#1d4ed8');
      ctx.fill();

      if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fill();
      }

      ctx.lineWidth = Math.max(1.5, size * 0.004);
      ctx.strokeStyle = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(8,10,18,0.85)';
      ctx.stroke();
      ctx.restore();

      // Draw circular character avatar near outer rim (upright when at top pointer!)
      const ax = cx + Math.cos(midA) * rAvatar;
      const ay = cy + Math.sin(midA) * rAvatar;
      const img = getAvatarImage(sl.item.key || 'gojo');

      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(midA + Math.PI / 2);

      ctx.beginPath();
      ctx.arc(0, 0, avatarSize / 2, 0, Math.PI * 2);
      ctx.save();
      ctx.clip();
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
      }
      ctx.restore();

      ctx.lineWidth = Math.max(1.5, size * 0.004);
      ctx.strokeStyle = isHovered ? '#fde047' : 'rgba(255,255,255,0.88)';
      ctx.stroke();
      ctx.restore();

      // Draw character name radially inside the wedge
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midA);

      const rawName = sl.item.name.replace(/（.*?）/g, '');
      const label = rawName.length > 5 ? rawName.slice(0, 5) : rawName;
      const fontPx = Math.max(12 * dpr, Math.min(14.5 * dpr, radius * 0.08));
      ctx.font = `800 ${fontPx}px system-ui, -apple-system, "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const textR = rAvatar - avatarSize / 2 - radius * 0.04;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.fillText(label, textR + 1, 1);

      ctx.fillStyle = sl.item.tier === 'SSR' ? '#fef08a' : '#ffffff';
      ctx.fillText(label, textR, 0);
      ctx.restore();
    });

    // Rim pegs
    slices.forEach(sl => {
      const angle = sl.start + state.currentRotation;
      const px = cx + Math.cos(angle) * (radius + size * 0.012);
      const py = cy + Math.sin(angle) * (radius + size * 0.012);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2, size * 0.005), 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#475569' : '#e2e8f0';
      ctx.fill();
    });

    // Inner collar
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#ffffff' : '#0b0e19';
    ctx.fill();
    ctx.lineWidth = Math.max(2.5, size * 0.006);
    ctx.strokeStyle = '#8b5cf6';
    ctx.stroke();
  }

  function bumpTicker() {
    const tickerEl = $('wheelTicker');
    tickerEl.classList.remove('ticker-active');
    void tickerEl.offsetWidth;
    tickerEl.classList.add('ticker-active');
  }

  // Auto damped spin
  function spinAuto(overrideSpeedKey = null) {
    if (state.isSpinning || state.manualPhase !== 'idle') return Promise.resolve(null);
    state.isSpinning = true;
    updateSpinButtonsUI();

    const { items } = getActiveWheelItems();
    const slices = computeUniformSlices(items);
    const targetSlice = slices[Math.floor(Math.random() * slices.length)];

    const targetLocalAngle = targetSlice.start + targetSlice.sweep * (0.2 + Math.random() * 0.6);
    const twoPi = Math.PI * 2;
    const desiredMod = (((-Math.PI / 2 - targetLocalAngle) % twoPi) + twoPi) % twoPi;
    const currentMod = ((state.currentRotation % twoPi) + twoPi) % twoPi;
    const delta = (desiredMod - currentMod + twoPi) % twoPi;

    const spd = SPEED_CONFIG[overrideSpeedKey || state.speed] || SPEED_CONFIG.normal;
    const startRot = state.currentRotation;
    const endRot = startRot + spd.extraSpins * twoPi + delta;

    return new Promise(resolve => {
      const startTime = performance.now();
      function step(now) {
        const t = Math.min(1, (now - startTime) / spd.duration);
        const eased = 1 - Math.pow(1 - t, 4.2);
        state.currentRotation = startRot + (endRot - startRot) * eased;

        const curIdx = getSliceIndexAtPointer(slices, state.currentRotation);
        if (curIdx !== state.lastSliceIdx) {
          state.lastSliceIdx = curIdx;
          bumpTicker();
        }
        drawWheel();

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          state.currentRotation = endRot % twoPi;
          state.isSpinning = false;
          updateSpinButtonsUI();
          drawWheel();
          onWheelLanded(targetSlice.item, true);
          resolve(targetSlice.item);
        }
      }
      requestAnimationFrame(step);
    });
  }

  // Manual Bilibili-style fast spin + instant Spacebar brake!
  function toggleManualSpin() {
    const { items } = getActiveWheelItems();
    const slices = computeUniformSlices(items);
    const twoPi = Math.PI * 2;

    if (state.manualPhase === 'idle') {
      if (state.isSpinning) return;
      state.manualPhase = 'cruising';
      state.isSpinning = true;
      updateSpinButtonsUI();

      let lastT = performance.now();
      function cruise(now) {
        if (state.manualPhase !== 'cruising') return;
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        state.currentRotation = (state.currentRotation + 16.5 * dt) % twoPi;
        const curIdx = getSliceIndexAtPointer(slices, state.currentRotation);
        if (curIdx !== state.lastSliceIdx) {
          state.lastSliceIdx = curIdx;
          bumpTicker();
        }
        drawWheel();
        state.manualRafId = requestAnimationFrame(cruise);
      }
      state.manualRafId = requestAnimationFrame(cruise);
    } else if (state.manualPhase === 'cruising') {
      state.manualPhase = 'braking';
      cancelAnimationFrame(state.manualRafId);
      updateSpinButtonsUI();

      const startRot = state.currentRotation;
      const brakeDelta = 1.6 + Math.random() * 1.1;
      const endRot = startRot + brakeDelta;
      const startTime = performance.now();
      const brakeMs = 460;

      function brake(now) {
        const t = Math.min(1, (now - startTime) / brakeMs);
        const eased = 1 - Math.pow(1 - t, 3);
        state.currentRotation = startRot + (endRot - startRot) * eased;
        const curIdx = getSliceIndexAtPointer(slices, state.currentRotation);
        if (curIdx !== state.lastSliceIdx) {
          state.lastSliceIdx = curIdx;
          bumpTicker();
        }
        drawWheel();

        if (t < 1) {
          requestAnimationFrame(brake);
        } else {
          state.currentRotation = endRot % twoPi;
          state.manualPhase = 'idle';
          state.isSpinning = false;
          updateSpinButtonsUI();
          drawWheel();
          const finalIdx = getSliceIndexAtPointer(slices, state.currentRotation);
          onWheelLanded(slices[finalIdx].item, true);
        }
      }
      requestAnimationFrame(brake);
    }
  }

  function updateSpinButtonsUI() {
    const spinBtn = $('spinBtn');
    const lbl = $('spinBtnLabel');
    const sub = $('spinBtnSub');

    if (state.manualPhase === 'cruising') {
      spinBtn.disabled = false;
      spinBtn.classList.add('hold-stop');
      lbl.textContent = '急停！';
      sub.textContent = 'SPACE';
    } else if (state.manualPhase === 'braking' || state.isSpinning) {
      spinBtn.disabled = true;
      spinBtn.classList.remove('hold-stop');
      lbl.textContent = '抽取中';
      sub.textContent = '...';
    } else {
      spinBtn.disabled = false;
      spinBtn.classList.remove('hold-stop');
      lbl.textContent = state.spinStyle === 'manual' ? '狂转' : '转动';
      sub.textContent = state.spinStyle === 'manual' ? 'START' : 'SPIN';
    }
    $('autoAllBtn').disabled = state.isSpinning;
  }

  // =========================================================
  // LANDING, FREEZE-FRAME REVEAL MODAL & APPLYING SLOTS
  // =========================================================
  function onWheelLanded(item, allowRevealModal) {
    if (allowRevealModal && state.revealEnabled) {
      showRevealModal(item);
    } else {
      commitLandedItem(item);
    }
  }

  function showRevealModal(item) {
    state.pendingReveal = item;
    let slotTag = '抽取结果';
    let subText = item.signature || item.desc || '';

    if (state.mode === 'puzzle') {
      const slot = PUZZLE_SLOTS[state.puzzleActiveSlotIdx];
      slotTag = `${slot.icon} ${slot.title}`;
      subText = item.abilities?.[slot.id] || item.desc || '能力继承';
    } else if (state.mode === 'relation') {
      const slot = RELATION_SLOTS[state.relationActiveSlotIdx];
      slotTag = `${slot.icon} ${slot.title}`;
      subText = slot.desc;
    } else {
      slotTag = state.duelTargetSide === 'red' ? '🔴 红方出战' : state.duelTargetSide === 'blue' ? '🔵 蓝方出战' : '🏟️ 决战场地';
      subText = item.abilities?.technique || item.desc || '';
    }

    $('revealSlotTag').textContent = slotTag;
    $('revealAvatarBox').innerHTML = `<img src="${getAvatarDataUrl(item.key || 'gojo')}" alt="${escapeHtml(item.name)}" />`;
    $('revealCharName').textContent = item.name;
    $('revealSubText').textContent = subText;
    $('revealQuoteText').textContent = item.quote || item.desc || '';
    $('revealModal').classList.remove('hidden');
  }

  function confirmRevealModal() {
    if (!state.pendingReveal) return;
    const item = state.pendingReveal;
    state.pendingReveal = null;
    $('revealModal').classList.add('hidden');
    commitLandedItem(item);
  }

  function rerollRevealModal() {
    state.pendingReveal = null;
    $('revealModal').classList.add('hidden');
    if (state.spinStyle === 'manual') toggleManualSpin();
    else spinAuto();
  }

  function commitLandedItem(item) {
    if (state.mode === 'puzzle') {
      const slot = PUZZLE_SLOTS[state.puzzleActiveSlotIdx];
      state.puzzleBuild[slot.id] = item;
      const nextEmpty = PUZZLE_SLOTS.findIndex(s => !state.puzzleBuild[s.id]);
      if (nextEmpty !== -1) state.puzzleActiveSlotIdx = nextEmpty;
      renderPuzzlePanel();
      refreshWheelHeader();
      drawWheel();
    } else if (state.mode === 'relation') {
      const slot = RELATION_SLOTS[state.relationActiveSlotIdx];
      state.relationBuild[slot.id] = item;
      const nextEmpty = RELATION_SLOTS.findIndex(s => !state.relationBuild[s.id]);
      if (nextEmpty !== -1) state.relationActiveSlotIdx = nextEmpty;
      renderRelationPanel();
      refreshWheelHeader();
      drawWheel();
    } else if (state.mode === 'duel') {
      if (state.duelTargetSide === 'red') {
        state.duelRed = item;
        if (!state.duelBlue) state.duelTargetSide = 'blue';
      } else if (state.duelTargetSide === 'blue') {
        state.duelBlue = item;
      } else {
        state.duelArena = item;
      }
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
    }
  }

  // =========================================================
  // EVALUATIONS (PUZZLE & RELATIONSHIPS)
  // =========================================================
  function evaluatePuzzleBuild() {
    const pickedEntries = PUZZLE_SLOTS.map(s => ({ slot: s, ch: state.puzzleBuild[s.id] })).filter(x => Boolean(x.ch));
    if (pickedEntries.length === 0) {
      return {
        radar: [0, 0, 0, 0, 0],
        power: 0,
        synergies: [],
        rank: '尚未成型',
        rankTier: 'R',
        comment: '转动左侧人物转盘抽取7大能力部件，集齐后可导出B站同款晒图海报或直接去新宿打宿傩！'
      };
    }

    const getVal = (slotId, fallback = 65) => state.puzzleBuild[slotId]?.stats?.[slotId] ?? fallback;

    const phy = getVal('physique', 50);
    const spd = getVal('speed', 50);
    const iq  = getVal('iq', 50);
    const ce  = getVal('ce', 50);
    const wpn = getVal('weapon', 50);
    const tech = getVal('technique', 50);
    const dom = getVal('domain', 50);

    const synergies = [];
    let bonus = 0;

    const ceChar = state.puzzleBuild.ce;
    const techChar = state.puzzleBuild.technique;
    const phyChar = state.puzzleBuild.physique;
    const domChar = state.puzzleBuild.domain;

    // Classic Bilibili JJK rules
    if (techChar?.key === 'gojo' && ceChar && ceChar.key !== 'gojo' && ceChar.key !== 'hakari') {
      synergies.push({ title: '⚠️ 无六眼硬开无下限', type: 'debuff', desc: '没有六眼耗蓝爆炸，用三秒就虚脱！' });
      bonus -= 12;
    } else if (techChar?.key === 'gojo' && ceChar?.key === 'gojo') {
      synergies.push({ title: '♾️ 六眼+无下限原装神力', type: 'buff', desc: '完美适配，24小时无限开无下限！' });
      bonus += 14;
    }

    if (ceChar && (ceChar.key === 'toji' || ceChar.key === 'maki')) {
      if (techChar && techChar.key !== 'toji' && techChar.key !== 'maki' && techChar.key !== 'takaba') {
        synergies.push({ title: '⚡ 0咒力悖论卡Bug', type: 'debuff', desc: '抽了0咒力还带耗蓝术式？主打一个纯物理硬砍！' });
      } else {
        synergies.push({ title: '🗡️ 极意天与暴君', type: 'buff', desc: '0咒力免疫必中领域，肉身直接乱杀术师！' });
        bonus += 18;
      }
    }

    if ([phyChar, ceChar, techChar, domChar].some(c => c?.key === 'gojo25')) {
      synergies.push({ title: '✈️ 2.5条机场预警', type: 'meme', desc: '含金量打折，打着打着可能会突然瞬移到机场候机室！' });
      bonus -= 10;
    }

    if (techChar?.key === 'megumi') {
      synergies.push({ title: '☸️ 魔虚罗垫背按钮', type: 'buff', desc: '打不过直接大喊布都御魂，拉全场一起陪葬！' });
      bonus += 8;
    }

    if (techChar?.key === 'takaba') {
      synergies.push({ title: '🤡 搞笑必中因果律', type: 'meme', desc: '只要宿主觉得好笑，宿傩的斩击也会变成水枪！' });
      bonus += 10;
    }

    const miwaCount = pickedEntries.filter(x => x.ch.key === 'miwa').length;
    if (miwaCount >= 2) {
      synergies.push({ title: '🗡️ 三轮霞护体传说', type: 'meme', desc: `连抽 ${miwaCount} 格三轮霞！触发神秘粉丝力量！` });
      bonus += miwaCount >= 3 ? 16 : -4;
    }

    const radar = [
      ce === 0 ? 15 : ce,
      Math.round((phy + spd) / 2),
      tech,
      iq,
      Math.round((wpn + dom) / 2)
    ];

    const avg = (phy + spd + iq + (ce === 0 ? 88 : ce) + wpn + tech + dom) / 7;
    const power = Math.max(15, Math.min(120, Math.round(avg + bonus)));

    let rank = '二级咒术师';
    let rankTier = 'R';
    let comment = '中规中矩的高专战力，建议继续调整短板部件。';

    if (pickedEntries.length < PUZZLE_SLOTS.length) {
      rank = `拼装中 (${pickedEntries.length}/${PUZZLE_SLOTS.length})`;
      rankTier = 'SR';
      comment = `已抽到 ${pickedEntries.length} 格，抽完所有 7 格即可查看完整战神评级并生成晒图海报！`;
    } else if (power >= 94) {
      rank = '神话·超越五宿';
      rankTier = 'SSR';
      comment = `【${phyChar.name}体格 + ${techChar.name}术式 + ${domChar.name}领域】这什么逆天缝合战神？！宿傩连夜买站票跑路！`;
    } else if (power >= 84) {
      rank = '特级天花板';
      rankTier = 'SSR';
      comment = '妥妥的特级大魔王！只要不中途突然犯机场综合征，足以和完全体宿傩大战三十回合！';
    } else if (power >= 72) {
      rank = '准特级 / 一级巅峰';
      rankTier = 'SR';
      comment = `面板相当扎实，打漏瑚真人完全游刃有余；打宿傩建议靠 ${techChar.name} 术式秀操作！`;
    } else if (power >= 60) {
      rank = '一级中坚力量';
      rankTier = 'R';
      comment = '典型的新宿车轮战第二梯队，主要负责拖住Boss给主角团争取时间。';
    } else {
      rank = '机场VIP候机员';
      rankTier = 'MEME';
      comment = '这阵容过于抽象了！建议直接联系家入硝子预定病床，或者提前去机场占座。';
    }

    return { radar, power, synergies, rank, rankTier, comment };
  }

  function evaluateRelations() {
    const picked = RELATION_SLOTS.map(s => ({ slot: s, ch: state.relationBuild[s.id] })).filter(x => Boolean(x.ch));
    const userName = $('relationUserName').value.trim() || '我';
    if (picked.length < RELATION_SLOTS.length) {
      return {
        title: `正在抽取关系网 (${picked.length}/${RELATION_SLOTS.length})`,
        comment: '抽满全部7个关系格子后，自动解锁属于你的咒术界抓马人生剧本！'
      };
    }

    const r = state.relationBuild;
    const notes = [];
    if (r.self.key === r.crush.key) {
      notes.push(`水仙结局！你就是【${r.self.name}】，结果结婚对象也是【${r.crush.name}】，这波属于自己跟自己领证！`);
    } else if (['sukuna', 'mahito', 'jogo', 'kenjaku'].includes(r.crush.key)) {
      notes.push(`高能预警！你的结婚对象居然是【${r.crush.name}】，建议洞房花烛夜全程开简易领域防身！`);
    } else if (['gojo', 'yuta', 'nanami', 'toji', 'megumi'].includes(r.crush.key)) {
      notes.push(`颜值/纯爱赢麻了！你的结婚对象是【${r.crush.name}】，全弹幕都在刷“羡慕哭了”！`);
    } else {
      notes.push(`你顶着【${r.self.name}】的脸，和【${r.crush.name}】甜蜜领证！`);
    }

    if (r.nemesis.key === 'sukuna' || r.nemesis.key === 'gojo') {
      notes.push(`但最要命的是追杀你的宿敌是【${r.nemesis.name}】——好在关键时刻【${r.savior.name}】会冲过来救场（能不能救下来另说）！`);
    } else {
      notes.push(`日常被【${r.nemesis.name}】追着砍，每次都是死党【${r.bestie.name}】和老师【${r.mentor.name}】帮忙擦屁股，危急关头还有【${r.savior.name}】救场！`);
    }

    notes.push(`最终大结局：你和【${r.airport.name}】并肩坐在南下机场候机厅，感叹这一生真是太精彩了！`);

    return {
      title: `${userName} 的咒术抓马人生剧本`,
      comment: notes.join(' ')
    };
  }

  // =========================================================
  // SVG RADAR & PANEL RENDERERS
  // =========================================================
  function renderRadar(svgId, stats, accentHex) {
    const svg = $(svgId);
    const isLight = state.theme === 'light';
    const gridStroke = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.16)';
    const labelColor = isLight ? '#334155' : '#cbd5e1';

    const cx = 120, cy = 112, maxR = 72;
    const labels = ['咒力', '体速', '术式', '智谋', '域具'];
    const n = 5;

    const pt = (idx, ratio) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / n;
      return [cx + Math.cos(angle) * maxR * ratio, cy + Math.sin(angle) * maxR * ratio];
    };

    let html = '';
    [0.25, 0.5, 0.75, 1].forEach(r => {
      const pts = labels.map((_, i) => pt(i, r).join(',')).join(' ');
      html += `<polygon points="${pts}" fill="none" stroke="${gridStroke}" stroke-width="1"/>`;
    });

    labels.forEach((lbl, i) => {
      const [x, y] = pt(i, 1);
      const [lx, ly] = pt(i, 1.25);
      html += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${gridStroke}" stroke-width="1"/>`;
      html += `<text x="${lx}" y="${ly}" fill="${labelColor}" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="middle">${lbl} ${stats[i]}</text>`;
    });

    const dataPts = stats.map((v, i) => pt(i, Math.max(0.08, v / 100)).join(',')).join(' ');
    html += `<polygon points="${dataPts}" fill="${accentHex}38" stroke="${accentHex}" stroke-width="2.5"/>`;
    stats.forEach((v, i) => {
      const [dx, dy] = pt(i, Math.max(0.08, v / 100));
      html += `<circle cx="${dx}" cy="${dy}" r="3.5" fill="${accentHex}" stroke="#ffffff" stroke-width="1.2"/>`;
    });
    svg.innerHTML = html;
  }

  function renderPuzzlePanel() {
    const grid = $('puzzleSlotsGrid');
    let filledCount = 0;

    grid.innerHTML = PUZZLE_SLOTS.map((slot, idx) => {
      const picked = state.puzzleBuild[slot.id];
      if (picked) filledCount++;
      const isActive = state.puzzleActiveSlotIdx === idx;
      const tier = picked ? (TIER_META[picked.tier] || TIER_META.R) : null;
      const abilityText = picked ? (picked.abilities?.[slot.id] || picked.desc || '') : '选中此格后转动左侧转盘';

      return `
        <button data-slot-idx="${idx}" class="char-slot-card ${isActive ? 'active' : ''}">
          <div class="slot-avatar-box" style="border-color:${picked ? picked.color : 'var(--border)'}">
            ${picked
              ? `<img src="${getAvatarDataUrl(picked.key)}" alt="${escapeHtml(picked.name)}" />`
              : `<span>${slot.icon}</span>`}
          </div>
          <div class="slot-info">
            <div class="slot-info-top">
              <span>${slot.icon} ${slot.title}</span>
              ${picked
                ? `<span class="tier-badge tier-${picked.tier}">${tier.label}</span>`
                : `<span>${isActive ? '● 锁定中' : '待抽'}</span>`}
            </div>
            <div class="slot-char-name">${picked ? escapeHtml(picked.name) : '点击锁定此属性'}</div>
            <div class="slot-ability-text" title="${escapeHtml(abilityText)}">${escapeHtml(abilityText)}</div>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.char-slot-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.puzzleActiveSlotIdx = Number(btn.dataset.slotIdx);
        renderPuzzlePanel();
        refreshWheelHeader();
        drawWheel();
      });
    });

    $('puzzleProgressBadge').textContent = `进度 ${filledCount} / ${PUZZLE_SLOTS.length}`;
    const evalRes = evaluatePuzzleBuild();
    $('puzzlePowerScore').textContent = evalRes.power;
    const rankEl = $('puzzleRankTag');
    rankEl.textContent = evalRes.rank;
    rankEl.className = `tier-badge tier-${evalRes.rankTier}`;
    $('puzzleMemeComment').textContent = evalRes.comment;

    const synBox = $('puzzleSynergyBox');
    const synList = $('puzzleSynergyList');
    if (evalRes.synergies.length > 0) {
      synBox.classList.remove('hidden');
      synList.innerHTML = evalRes.synergies.map(s => `
        <div class="synergy-chip ${s.type}"><strong>${escapeHtml(s.title)}</strong>：${escapeHtml(s.desc)}</div>
      `).join('');
    } else {
      synBox.classList.add('hidden');
    }

    renderRadar('puzzleRadarSvg', evalRes.radar, '#a855f7');
    $('startPuzzleBattleBtn').disabled = filledCount === 0;
  }

  function renderRelationPanel() {
    const grid = $('relationSlotsGrid');
    let filledCount = 0;

    grid.innerHTML = RELATION_SLOTS.map((slot, idx) => {
      const picked = state.relationBuild[slot.id];
      if (picked) filledCount++;
      const isActive = state.relationActiveSlotIdx === idx;
      const tier = picked ? (TIER_META[picked.tier] || TIER_META.R) : null;

      return `
        <button data-rel-idx="${idx}" class="char-slot-card ${isActive ? 'active' : ''}">
          <div class="slot-avatar-box" style="border-color:${picked ? picked.color : 'var(--border)'}">
            ${picked
              ? `<img src="${getAvatarDataUrl(picked.key)}" alt="${escapeHtml(picked.name)}" />`
              : `<span>${slot.icon}</span>`}
          </div>
          <div class="slot-info">
            <div class="slot-info-top">
              <span>${slot.icon} ${slot.title}</span>
              ${picked
                ? `<span class="tier-badge tier-${picked.tier}">${tier.label}</span>`
                : `<span>${isActive ? '● 锁定中' : '待抽'}</span>`}
            </div>
            <div class="slot-char-name">${picked ? escapeHtml(picked.name) : '点击锁定此格'}</div>
            <div class="slot-ability-text">${picked ? escapeHtml(picked.quote || slot.desc) : escapeHtml(slot.desc)}</div>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.char-slot-card').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.relationActiveSlotIdx = Number(btn.dataset.relIdx);
        renderRelationPanel();
        refreshWheelHeader();
        drawWheel();
      });
    });

    $('relationProgressBadge').textContent = `进度 ${filledCount} / ${RELATION_SLOTS.length}`;
    const evalRel = evaluateRelations();
    $('relationTitleTag').textContent = evalRel.title;
    $('relationSummaryBox').textContent = evalRel.comment;
  }

  function renderDuelPanel() {
    $('duelRedCard').classList.toggle('selected', state.duelTargetSide === 'red');
    $('duelBlueCard').classList.toggle('selected', state.duelTargetSide === 'blue');
    $('duelArenaBar').classList.toggle('selected', state.duelTargetSide === 'arena');

    const renderSide = (elId, ch) => {
      const el = $(elId);
      if (!ch) {
        el.innerHTML = `<div style="font-size:15px;font-weight:800">待抽取...</div><div style="font-size:12px;color:var(--muted);margin-top:4px">选中此框后转动左侧头像转盘</div>`;
        return;
      }
      const pwr = Math.round((ch.stats.physique + ch.stats.speed + ch.stats.technique + ch.stats.domain) / 4);
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <div class="slot-avatar-box" style="width:46px;height:46px;border-color:${ch.color}">
            <img src="${getAvatarDataUrl(ch.key)}" alt="${escapeHtml(ch.name)}" />
          </div>
          <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
              <strong style="font-size:15px">${escapeHtml(ch.name)}</strong>
              <span class="tier-badge tier-${ch.tier}">战力 ${pwr}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(ch.abilities.technique)}</div>
          </div>
        </div>
      `;
    };

    renderSide('duelRedBody', state.duelRed);
    renderSide('duelBlueBody', state.duelBlue);

    $('duelArenaName').textContent = `${state.duelArena.name} — ${state.duelArena.desc}`;
    document.querySelectorAll('.duel-pool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.duelpool === state.duelPoolFilter);
    });
    $('startDuelBattleBtn').disabled = !(state.duelRed && state.duelBlue);
  }

  function refreshWheelHeader() {
    const ctx = getActiveWheelItems();
    $('wheelTitle').textContent = ctx.title;
    $('wheelPoolBadge').textContent = `共 ${ctx.items.length} 项`;
  }

  // =========================================================
  // PNG POSTER EXPORTER (B站晒图长图海报)
  // =========================================================
  function exportPosterPng(modeKind) {
    const isPuzzle = modeKind === 'puzzle';
    const slots = isPuzzle ? PUZZLE_SLOTS : RELATION_SLOTS;
    const map = isPuzzle ? state.puzzleBuild : state.relationBuild;
    const filled = slots.filter(s => Boolean(map[s.id])).length;
    if (filled === 0) {
      showToast('请先至少抽取 1 个格子再生成海报！');
      return;
    }

    const canvas = document.createElement('canvas');
    const W = 960;
    const H = 1140;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Deep cursed night gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#090b14');
    bgGrad.addColorStop(0.55, '#13162a');
    bgGrad.addColorStop(1, '#1b0f26');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Header banner
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
    const headerTitle = isPuzzle
      ? '咒术回战 · 我的能力拼图战神卡片'
      : `咒术回战 · ${( $('relationUserName').value.trim() || '我' )} 的关系命运图鉴`;
    ctx.fillText(headerTitle, 48, 72);

    ctx.fillStyle = '#a78bfa';
    ctx.font = '700 18px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
    ctx.fillText('咒术回战人物转盘模拟器 · https://thanatia.github.io/jjk-wheel/', 48, 106);

    // Draw 7 cards (2 columns, last full width or centered)
    const cardW = 418;
    const cardH = 180;
    slots.forEach((slot, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 48 + col * (cardW + 28);
      const y = 136 + row * (cardH + 18);
      const w = idx === 6 ? (cardW * 2 + 28) : cardW;

      const ch = map[slot.id];

      // Card container
      ctx.fillStyle = '#192036';
      ctx.strokeStyle = ch ? ch.color : '#2a3454';
      ctx.lineWidth = 3;
      roundRect(ctx, x, y, w, cardH, 18);
      ctx.fill();
      ctx.stroke();

      // Avatar
      const avSize = 118;
      const avX = x + 20;
      const avY = y + (cardH - avSize) / 2;
      if (ch) {
        const img = getAvatarImage(ch.key);
        ctx.save();
        roundRect(ctx, avX, avY, avSize, avSize, 20);
        ctx.clip();
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, avX, avY, avSize, avSize);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = '#111524';
        roundRect(ctx, avX, avY, avSize, avSize, 20);
        ctx.fill();
      }

      // Text
      const tx = avX + avSize + 20;
      ctx.fillStyle = '#9aa7c7';
      ctx.font = '700 18px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      ctx.fillText(`${slot.icon} ${slot.title}`, tx, y + 46);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      ctx.fillText(ch ? ch.name : '未抽取', tx, y + 88);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 17px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      const sub = ch
        ? (isPuzzle ? (ch.abilities?.[slot.id] || ch.desc) : (ch.quote || slot.desc))
        : '虚位以待';
      drawWrappedText(ctx, sub, tx, y + 124, w - (tx - x) - 20, 22, 2);
    });

    // Footer Verdict Box
    const footY = 935;
    ctx.fillStyle = '#111524';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2.5;
    roundRect(ctx, 48, footY, W - 96, 165, 18);
    ctx.fill();
    ctx.stroke();

    if (isPuzzle) {
      const ev = evaluatePuzzleBuild();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 26px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      ctx.fillText(`综合战力：${ev.power}   ｜   评级：${ev.rank}`, 74, footY + 46);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 18px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      drawWrappedText(ctx, ev.comment, 74, footY + 86, W - 148, 26, 3);
    } else {
      const ev = evaluateRelations();
      ctx.fillStyle = '#f472b6';
      ctx.font = '900 24px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      ctx.fillText(ev.title, 74, footY + 42);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 17px system-ui, -apple-system, "Microsoft YaHei", sans-serif';
      drawWrappedText(ctx, ev.comment, 74, footY + 78, W - 148, 24, 3);
    }

    const link = document.createElement('a');
    link.download = isPuzzle ? 'jjk-puzzle-poster.png' : 'jjk-relation-poster.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('已生成并下载 PNG 晒图海报！');
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawWrappedText(ctx, text, x, y, maxW, lineH, maxLines) {
    let line = '';
    let lines = 0;
    for (let i = 0; i < text.length; i++) {
      const test = line + text[i];
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        lines++;
        if (lines >= maxLines) {
          ctx.fillText(line.slice(0, -1) + '…', x, y);
          return;
        }
        ctx.fillText(line, x, y);
        line = text[i];
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, y);
  }

  // =========================================================
  // SILENT TEXT BATTLE SIMULATOR
  // =========================================================
  async function runBattleSimulation(fighterA, fighterB, arenaMod = 'normal', metaText = '') {
    state.battleAbort = true;
    await new Promise(r => setTimeout(r, 30));
    state.battleAbort = false;

    const studio = $('battleStudio');
    const logFeed = $('battleLogFeed');
    const banner = $('battleResultBanner');
    studio.classList.remove('hidden');
    banner.classList.add('hidden');
    logFeed.innerHTML = '';

    let hpA = fighterA.maxHp;
    let hpB = fighterB.maxHp;
    const maxA = fighterA.maxHp;
    const maxB = fighterB.maxHp;

    $('fighterAName').textContent = fighterA.name;
    $('fighterBName').textContent = fighterB.name;

    const updateBars = () => {
      $('fighterAHpText').textContent = `${Math.max(0, Math.round(hpA))} / ${maxA}`;
      $('fighterBHpText').textContent = `${Math.max(0, Math.round(hpB))} / ${maxB}`;
      $('fighterAHpBar').style.width = `${Math.max(0, Math.round((hpA / maxA) * 100))}%`;
      $('fighterBHpBar').style.width = `${Math.max(0, Math.round((hpB / maxB) * 100))}%`;
    };
    updateBars();

    let skipMode = false;
    $('skipBattleBtn').onclick = () => { skipMode = true; };

    const waitStep = async ms => { if (!skipMode) await new Promise(r => setTimeout(r, ms)); };
    const appendLog = (html, cls = '') => {
      const div = document.createElement('div');
      div.className = `log-item ${cls}`;
      div.innerHTML = html;
      logFeed.appendChild(div);
      logFeed.scrollTop = logFeed.scrollHeight;
    };

    appendLog(`📢 <strong>开战宣言：</strong>${escapeHtml(fighterB.intro)}`, 'event');
    await waitStep(380);

    let round = 1;
    while (hpA > 0 && hpB > 0 && round <= 10) {
      if (state.battleAbort) return;

      if (arenaMod === 'mahoraga_drop' && round === 3) {
        appendLog('☸️ <strong>场地突发事故！</strong>天降【魔虚罗】无差别横扫全场，双方各扣 28 HP！', 'event');
        hpA -= 28; hpB -= 28;
        updateBars();
        await waitStep(420);
        if (hpA <= 0 || hpB <= 0) break;
      }

      let dmgA = fighterA.atk * (0.82 + Math.random() * 0.42) - fighterB.def * 0.25;
      if (arenaMod === 'no_tai' && fighterA.isTaiOnly) dmgA *= 0.6;
      if (arenaMod === 'all_boost') dmgA *= 1.15;
      dmgA = Math.max(8, Math.round(dmgA));

      const bfA = Math.random() < (arenaMod === 'black_flash' ? 0.34 : (fighterA.bfBonus ? 0.28 : 0.14));
      if (arenaMod === 'airport' && Math.random() < 0.2) {
        appendLog(`✈️ <strong>第${round}回合 [我方]：</strong>${escapeHtml(fighterA.name)} 突然在候机厅发呆夸对手强，跳过本回合！`, 'event');
      } else {
        if (bfA) {
          dmgA = Math.round(dmgA * 1.75);
          studio.classList.remove('anim-black-flash');
          void studio.offsetWidth;
          studio.classList.add('anim-black-flash');
          appendLog(`⚡ <strong>第${round}回合 [黑闪暴击！]：</strong>${escapeHtml(fighterA.name)} 施展「${escapeHtml(fighterA.skill)}」打出黑闪，造成 <strong>${dmgA}</strong> 伤害！`, 'bf');
        } else {
          const sk = fighterA.skills[(round - 1) % fighterA.skills.length];
          appendLog(`⚔️ <strong>第${round}回合 [我方进攻]：</strong>${escapeHtml(fighterA.name)} 发动【${escapeHtml(sk)}】，造成 <strong>${dmgA}</strong> 伤害！`);
        }
        hpB -= dmgA;
      }

      if (fighterA.hasRct && hpA > 0 && hpA < maxA * 0.65 && Math.random() < 0.4) {
        const heal = Math.round(maxA * 0.14);
        hpA = Math.min(maxA, hpA + heal);
        appendLog(`💚 <strong>反转术式再生：</strong>${escapeHtml(fighterA.name)} 回复 <strong>+${heal} HP</strong>！`, 'rct');
      }

      updateBars();
      await waitStep(400);
      if (hpB <= 0) break;

      if (arenaMod === 'airport' && Math.random() < 0.18) {
        appendLog(`✈️ <strong>第${round}回合 [敌方]：</strong>${escapeHtml(fighterB.name)} 突然在候机厅点咖啡发呆，跳过进攻！`, 'event');
      } else {
        let dmgB = fighterB.atk * (0.82 + Math.random() * 0.42) - fighterA.def * 0.25;
        if (arenaMod === 'no_tai' && fighterB.isTaiOnly) dmgB *= 0.6;
        if (arenaMod === 'all_boost') dmgB *= 1.15;
        dmgB = Math.max(8, Math.round(dmgB));

        const bfB = Math.random() < (arenaMod === 'black_flash' ? 0.32 : (fighterB.bfBonus ? 0.26 : 0.14));
        const bSk = fighterB.skills[(round - 1) % fighterB.skills.length];
        if (bfB) {
          dmgB = Math.round(dmgB * 1.65);
          appendLog(`💥 <strong>第${round}回合 [敌方暴击！]：</strong>${escapeHtml(fighterB.name)} 发动【${escapeHtml(bSk)}】打出 <strong>${dmgB}</strong> 点伤害！`, 'event');
        } else {
          appendLog(`🩸 <strong>第${round}回合 [敌方反击]：</strong>${escapeHtml(fighterB.name)} 挥出【${escapeHtml(bSk)}】，造成 <strong>${dmgB}</strong> 伤害！`);
        }
        hpA -= dmgB;
      }

      if (fighterB.hasRct && hpB > 0 && hpB < maxB * 0.6 && Math.random() < 0.35) {
        const healB = Math.round(maxB * 0.12);
        hpB = Math.min(maxB, hpB + healB);
        appendLog(`🩹 <strong>敌方反转再生：</strong>${escapeHtml(fighterB.name)} 回复 <strong>+${healB} HP</strong>！`, 'rct');
      }

      updateBars();
      await waitStep(420);
      round++;
    }

    const aWon = hpB <= 0 || (hpA > hpB && hpA > 0);
    banner.classList.remove('hidden');
    banner.className = `result-banner ${aWon ? 'win' : 'lose'}`;
    $('battleResultTitle').textContent = aWon ? `🏆 胜者：${fighterA.name}！` : `💀 败北：${fighterB.name} 笑到了最后…`;
    const badgeEl = $('battleResultBadge');
    badgeEl.textContent = aWon ? '讨伐成功 · 新宿留名' : '机场南下 · 下次再战';
    badgeEl.className = `tier-badge ${aWon ? 'tier-SSR' : 'tier-MEME'}`;
    $('battleResultComment').textContent = aWon ? fighterB.winMeme : fighterB.loseMeme;

    const report = `【咒术回战人物转盘战报】${fighterA.name} VS ${fighterB.name}｜结果：${aWon ? '胜利！' : '惜败南下…'}｜${aWon ? fighterB.winMeme : fighterB.loseMeme}`;
    $('copyBattleReportBtn').onclick = () => copyText(report, '战报已复制！');

    saveHistoryEntry({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      title: `${fighterA.name} VS ${fighterB.name}`,
      result: aWon ? '胜' : '败',
      detail: metaText || report
    });
    studio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function launchPuzzleBossBattle() {
    const ev = evaluatePuzzleBuild();
    const bossKey = $('puzzleBossSelect').value;
    const boss = BOSSES[bossKey];
    const skills = PUZZLE_SLOTS
      .map(s => state.puzzleBuild[s.id] ? `${state.puzzleBuild[s.id].name}的${state.puzzleBuild[s.id].abilities[s.id]}` : null)
      .filter(Boolean);

    const hasRct = ['gojo', 'sukuna', 'yuta', 'hakari', 'yuji', 'choso', 'higuruma'].includes(state.puzzleBuild.ce?.key);
    const bfBonus = ['yuji', 'nanami', 'nobara'].includes(state.puzzleBuild.physique?.key);
    const isTaiOnly = ['toji', 'maki'].includes(state.puzzleBuild.ce?.key);

    const player = {
      name: '拼图缝合怪（你）',
      maxHp: Math.round(145 + ev.power * 1.15),
      atk: Math.round(22 + ev.power * 0.44),
      def: Math.round(14 + ev.radar[1] * 0.22),
      skill: skills[0] || '基础咒力拳',
      skills: skills.length ? skills : ['基础咒力拳'],
      hasRct, bfBonus, isTaiOnly
    };
    const enemy = {
      name: boss.name, maxHp: boss.hp, atk: boss.atk, def: boss.def,
      intro: boss.intro, skills: boss.skills,
      hasRct: ['gojo', 'sukuna', 'kenjaku'].includes(bossKey),
      bfBonus: ['mahito', 'sukuna'].includes(bossKey),
      winMeme: boss.winMeme, loseMeme: boss.loseMeme
    };

    $('battleTitle').textContent = `⚔️ 新宿决战：拼图构筑 vs ${boss.name}`;
    state.lastBattleContext = () => launchPuzzleBossBattle();
    runBattleSimulation(player, enemy, 'normal', `战力 ${ev.power}｜${ev.rank}`);
  }

  function launchDuelBattle() {
    const r = state.duelRed;
    const b = state.duelBlue;
    if (!r || !b) return;
    const pA = Math.round((r.stats.physique + r.stats.speed + r.stats.technique + r.stats.domain) / 4);
    const pB = Math.round((b.stats.physique + b.stats.speed + b.stats.technique + b.stats.domain) / 4);

    const fA = {
      name: `🔴 ${r.name}`,
      maxHp: Math.round(140 + r.stats.physique * 0.8),
      atk: Math.round(18 + pA * 0.42),
      def: Math.round(r.stats.physique * 0.25),
      skill: r.abilities.technique,
      skills: [r.abilities.technique, r.abilities.weapon, r.abilities.domain],
      hasRct: pA >= 85,
      bfBonus: r.key === 'yuji' || r.key === 'nanami',
      isTaiOnly: r.stats.ce === 0
    };
    const fB = {
      name: `🔵 ${b.name}`,
      maxHp: Math.round(140 + b.stats.physique * 0.8),
      atk: Math.round(18 + pB * 0.42),
      def: Math.round(b.stats.physique * 0.25),
      intro: `${b.name} 摆出架势：${b.quote}`,
      skill: b.abilities.technique,
      skills: [b.abilities.technique, b.abilities.weapon, b.abilities.domain],
      hasRct: pB >= 85,
      bfBonus: b.key === 'yuji' || b.key === 'nanami',
      winMeme: `战果定格：【${r.name}】力克【${b.name}】，弹幕刷屏“含金量还在上升！”`,
      loseMeme: `大逆转还是实力碾压？！【${b.name}】拿下了【${r.name}】，弹幕直呼“小丑竟是我自己”！`,
      isTaiOnly: b.stats.ce === 0
    };

    $('battleTitle').textContent = `⚔️ 1v1 斗蛐蛐（${state.duelArena.name}）`;
    state.lastBattleContext = () => launchDuelBattle();
    runBattleSimulation(fA, fB, state.duelArena.mod, `场地：${state.duelArena.name}`);
  }

  // =========================================================
  // AUTO-ALL SEQUENCE
  // =========================================================
  async function runAutoAll() {
    if (state.isSpinning) return;
    const prevReveal = state.revealEnabled;
    state.revealEnabled = false;
    const spd = state.speed === 'slow' ? 'normal' : 'fast';

    try {
      if (state.mode === 'puzzle') {
        if (Object.keys(state.puzzleBuild).length >= PUZZLE_SLOTS.length) {
          state.puzzleBuild = {};
          state.puzzleActiveSlotIdx = 0;
          renderPuzzlePanel();
        }
        for (let i = 0; i < PUZZLE_SLOTS.length; i++) {
          if (!state.puzzleBuild[PUZZLE_SLOTS[i].id]) {
            state.puzzleActiveSlotIdx = i;
            renderPuzzlePanel();
            refreshWheelHeader();
            drawWheel();
            await spinAuto(spd);
            await new Promise(r => setTimeout(r, 160));
          }
        }
      } else if (state.mode === 'relation') {
        if (Object.keys(state.relationBuild).length >= RELATION_SLOTS.length) {
          state.relationBuild = {};
          state.relationActiveSlotIdx = 0;
          renderRelationPanel();
        }
        for (let i = 0; i < RELATION_SLOTS.length; i++) {
          if (!state.relationBuild[RELATION_SLOTS[i].id]) {
            state.relationActiveSlotIdx = i;
            renderRelationPanel();
            refreshWheelHeader();
            drawWheel();
            await spinAuto(spd);
            await new Promise(r => setTimeout(r, 160));
          }
        }
      } else {
        state.duelTargetSide = 'red';
        renderDuelPanel(); refreshWheelHeader(); drawWheel();
        await spinAuto(spd);
        await new Promise(r => setTimeout(r, 150));

        state.duelTargetSide = 'blue';
        renderDuelPanel(); refreshWheelHeader(); drawWheel();
        await spinAuto(spd);
        await new Promise(r => setTimeout(r, 150));

        state.duelTargetSide = 'arena';
        renderDuelPanel(); refreshWheelHeader(); drawWheel();
        await spinAuto(spd);
      }
    } finally {
      state.revealEnabled = prevReveal;
    }
  }

  // =========================================================
  // CUSTOM ROSTER & HISTORY
  // =========================================================
  function renderCustomItemsList() {
    const container = $('customItemsList');
    container.innerHTML = state.roster.map((ch, idx) => {
      const t = TIER_META[ch.tier] || TIER_META.R;
      return `
        <div class="custom-row">
          <div style="display:flex;align-items:center;gap:8px;min-width:0">
            <img src="${getAvatarDataUrl(ch.key)}" alt="" style="width:28px;height:28px;border-radius:7px;flex-shrink:0" />
            <span class="tier-badge tier-${ch.tier}">${t.label}</span>
            <strong>${escapeHtml(ch.name)}</strong>
            <span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(ch.abilities?.technique || ch.quote || '')}</span>
          </div>
          <button data-del-idx="${idx}" class="del-custom-btn tool-btn" style="color:#fb7185">删除</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.del-custom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.roster.length <= 2) {
          showToast('转盘上至少保留 2 位角色！');
          return;
        }
        state.roster.splice(Number(btn.dataset.delIdx), 1);
        saveRoster();
        renderCustomItemsList();
        refreshWheelHeader();
        drawWheel();
      });
    });
  }

  function saveHistoryEntry(entry) {
    state.history.unshift(entry);
    if (state.history.length > 30) state.history.pop();
    try { localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(state.history)); } catch (_) {}
    $('historyCount').textContent = state.history.length;
  }

  function renderHistoryModal() {
    const list = $('historyList');
    if (state.history.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:28px;color:var(--muted)">暂无记录，先转两圈试试吧！</div>';
      return;
    }
    list.innerHTML = state.history.map(h => `
      <div class="story-entry">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <strong>${escapeHtml(h.title)}</strong>
          <span class="tier-badge ${h.result === '胜' ? 'tier-SSR' : 'tier-MEME'}">${h.result} · ${escapeHtml(h.time)}</span>
        </div>
        <div style="color:var(--muted);margin-top:4px">${escapeHtml(h.detail)}</div>
      </div>
    `).join('');
  }

  // =========================================================
  // SWITCHERS & INIT
  // =========================================================
  function switchMode(newMode) {
    if (state.isSpinning) return;
    state.mode = newMode;
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.add('hidden'));
    $(`panel-${newMode}`).classList.remove('hidden');
    document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === newMode));
    $('battleStudio').classList.add('hidden');
    refreshWheelHeader();
    drawWheel();
  }

  function resetCurrentMode() {
    if (state.isSpinning) return;
    if (state.mode === 'puzzle') {
      state.puzzleBuild = {};
      state.puzzleActiveSlotIdx = 0;
      renderPuzzlePanel();
    } else if (state.mode === 'relation') {
      state.relationBuild = {};
      state.relationActiveSlotIdx = 0;
      renderRelationPanel();
    } else {
      state.duelRed = null;
      state.duelBlue = null;
      state.duelArena = state.arenas[0];
      state.duelTargetSide = 'red';
      renderDuelPanel();
    }
    $('battleStudio').classList.add('hidden');
    refreshWheelHeader();
    drawWheel();
    showToast('本局已重置');
  }

  function init() {
    $('brandAvatarBox').innerHTML = `<img src="${getAvatarDataUrl('gojo')}" alt="五条悟" style="width:100%;height:100%;display:block" />`;

    preloadAllAvatars(() => drawWheel());

    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.speed = btn.dataset.speed;
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === state.speed));
      });
    });

    document.querySelectorAll('.spinstyle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.spinStyle = btn.dataset.spinstyle;
        document.querySelectorAll('.spinstyle-btn').forEach(b => b.classList.toggle('active', b.dataset.spinstyle === state.spinStyle));
        $('spinModeTag').textContent = state.spinStyle === 'manual' ? '空格急停' : '自动阻尼';
        updateSpinButtonsUI();
      });
    });

    $('toggleMemePoolBtn').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.memePoolEnabled = !state.memePoolEnabled;
      $('memeStateLabel').textContent = state.memePoolEnabled ? '开启' : '关闭';
      $('memeDot').classList.toggle('off', !state.memePoolEnabled);
      refreshWheelHeader();
      drawWheel();
    });

    $('toggleRevealBtn').addEventListener('click', () => {
      state.revealEnabled = !state.revealEnabled;
      $('revealStateLabel').textContent = state.revealEnabled ? '开启' : '关闭';
    });

    $('themeBtn').addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));

    $('spinBtn').addEventListener('click', () => {
      if (state.spinStyle === 'manual') toggleManualSpin();
      else spinAuto();
    });

    // Keyboard Spacebar shortcut for Bilibili-style spin & freeze!
    window.addEventListener('keydown', e => {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (!$('revealModal').classList.contains('hidden')) {
        e.preventDefault();
        confirmRevealModal();
        return;
      }
      if (e.code === 'Space' && $('customModal').classList.contains('hidden') && $('historyModal').classList.contains('hidden')) {
        e.preventDefault();
        if (state.spinStyle === 'manual') toggleManualSpin();
        else if (!state.isSpinning) spinAuto();
      }
    });

    $('revealConfirmBtn').addEventListener('click', confirmRevealModal);
    $('revealRerollBtn').addEventListener('click', rerollRevealModal);

    $('autoAllBtn').addEventListener('click', runAutoAll);
    $('resetModeBtn').addEventListener('click', resetCurrentMode);

    $('relationUserName').addEventListener('input', () => renderRelationPanel());

    $('duelRedCard').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.duelTargetSide = 'red'; renderDuelPanel(); refreshWheelHeader(); drawWheel();
    });
    $('duelBlueCard').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.duelTargetSide = 'blue'; renderDuelPanel(); refreshWheelHeader(); drawWheel();
    });
    $('duelArenaBar').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.duelTargetSide = 'arena'; renderDuelPanel(); refreshWheelHeader(); drawWheel();
    });
    document.querySelectorAll('.duel-pool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.duelPoolFilter = btn.dataset.duelpool;
        if (state.duelTargetSide === 'arena') state.duelTargetSide = 'red';
        renderDuelPanel(); refreshWheelHeader(); drawWheel();
      });
    });

    $('startPuzzleBattleBtn').addEventListener('click', launchPuzzleBossBattle);
    $('startDuelBattleBtn').addEventListener('click', launchDuelBattle);
    $('closeBattleBtn').addEventListener('click', () => { state.battleAbort = true; $('battleStudio').classList.add('hidden'); });
    $('rematchBtn').addEventListener('click', () => { if (state.lastBattleContext) state.lastBattleContext(); });

    $('exportPuzzlePosterBtn').addEventListener('click', () => exportPosterPng('puzzle'));
    $('exportRelationPosterBtn').addEventListener('click', () => exportPosterPng('relation'));

    $('copyBuildBtn').addEventListener('click', () => {
      const ev = evaluatePuzzleBuild();
      const lines = PUZZLE_SLOTS.map(s => `${s.title}:${state.puzzleBuild[s.id]?.name || '未抽'}`);
      copyText(`【我的咒术拼图战神】${lines.join('｜')}｜战力:${ev.power}(${ev.rank})｜${ev.comment}`, '已复制拼图文字战报！');
    });

    $('copyRelationBtn').addEventListener('click', () => {
      const ev = evaluateRelations();
      const lines = RELATION_SLOTS.map(s => `${s.title}:${state.relationBuild[s.id]?.name || '未抽'}`);
      copyText(`【${ev.title}】${lines.join('｜')}｜${ev.comment}`, '已复制关系网文案！');
    });

    // Custom Roster Modal
    $('openCustomModalBtn').addEventListener('click', () => {
      if (state.isSpinning) return;
      $('customModal').classList.remove('hidden');
      renderCustomItemsList();
    });
    $('closeCustomModalBtn').addEventListener('click', () => $('customModal').classList.add('hidden'));
    $('saveCustomDoneBtn').addEventListener('click', () => $('customModal').classList.add('hidden'));

    $('addCustomCharBtn').addEventListener('click', () => {
      const name = $('customCharName').value.trim();
      if (!name) { showToast('请输入人物名称！'); return; }
      const tier = $('customCharTier').value;
      const ab = $('customCharAbility').value.trim() || '自定义神秘能力';
      const base = tier === 'SSR' ? 92 : tier === 'SR' ? 82 : tier === 'MEME' ? 50 : 70;
      const color = tier === 'SSR' ? '#d97706' : tier === 'SR' ? '#7e22ce' : tier === 'MEME' ? '#be123c' : '#0284c7';

      state.roster.unshift({
        key: `custom_${Date.now()}`,
        name,
        color,
        tier,
        isMeme: tier === 'MEME',
        quote: `“这就是 ${name} 的全力！”`,
        abilities: {
          physique: ab, speed: ab, iq: ab, ce: ab, weapon: ab, technique: ab, domain: ab
        },
        stats: { physique: base, speed: base, iq: base, ce: base, weapon: base, technique: base, domain: base }
      });

      $('customCharName').value = '';
      $('customCharAbility').value = '';
      saveRoster();
      renderCustomItemsList();
      refreshWheelHeader();
      drawWheel();
      showToast(`已将「${name}」加入转盘！`);
    });

    $('exportPoolBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state.roster, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'jjk-roster.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('已导出角色池 JSON');
    });

    $('importPoolInput').addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (Array.isArray(parsed) && parsed.length >= 2) {
            state.roster = parsed;
            saveRoster();
            renderCustomItemsList();
            refreshWheelHeader();
            drawWheel();
            showToast('角色池导入成功！');
          } else {
            showToast('JSON 格式不正确');
          }
        } catch (_) {
          showToast('文件解析失败');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('resetPoolDefaultBtn').addEventListener('click', () => {
      state.roster = Object.values(clone(CHARACTERS));
      saveRoster();
      renderCustomItemsList();
      refreshWheelHeader();
      drawWheel();
      showToast('已恢复默认原作人物池');
    });

    // History Modal
    $('historyCount').textContent = state.history.length;
    $('openHistoryModalBtn').addEventListener('click', () => {
      renderHistoryModal();
      $('historyModal').classList.remove('hidden');
    });
    $('closeHistoryModalBtn').addEventListener('click', () => $('historyModal').classList.add('hidden'));
    $('closeHistoryDoneBtn').addEventListener('click', () => $('historyModal').classList.add('hidden'));
    $('clearHistoryBtn').addEventListener('click', () => {
      state.history = [];
      try { localStorage.removeItem(STORAGE_HISTORY_KEY); } catch (_) {}
      $('historyCount').textContent = '0';
      renderHistoryModal();
    });

    if (window.ResizeObserver) {
      new ResizeObserver(() => drawWheel()).observe(wheelCanvas);
    } else {
      window.addEventListener('resize', drawWheel);
    }

    applyTheme(state.theme);
    renderPuzzlePanel();
    renderRelationPanel();
    renderDuelPanel();
    updateSpinButtonsUI();
    switchMode('puzzle');
  }

  init();
})(window);
