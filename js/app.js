/* =========================================================
 * 咒术回战 · 全能转盘模拟器 - 主逻辑（纯静音视觉版，无语音/无音效）
 * ========================================================= */
(function (global) {
  'use strict';

  const {
    TIER_META,
    SLICE_PALETTE,
    SPEED_CONFIG,
    DEFAULT_PUZZLE_SLOTS,
    DEFAULT_OC_STAGES,
    DUEL_ROSTER,
    DUEL_ARENAS,
    BOSSES
  } = global.JJK_DATA;

  const STORAGE_HISTORY_KEY = 'jjk_wheel_history_local_v1';
  const STORAGE_POOLS_KEY = 'jjk_wheel_pools_local_v1';
  const STORAGE_THEME_KEY = 'jjk_wheel_theme_local_v1';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadCustomPools() {
    try {
      const raw = localStorage.getItem(STORAGE_POOLS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.puzzleSlots && parsed.ocStages && parsed.duelRoster && parsed.duelArenas) {
          return parsed;
        }
      }
    } catch (_) {}
    return {
      puzzleSlots: clone(DEFAULT_PUZZLE_SLOTS),
      ocStages: clone(DEFAULT_OC_STAGES),
      duelRoster: clone(DUEL_ROSTER),
      duelArenas: clone(DUEL_ARENAS)
    };
  }

  function saveCustomPools() {
    try {
      localStorage.setItem(STORAGE_POOLS_KEY, JSON.stringify({
        puzzleSlots: state.puzzleSlots,
        ocStages: state.ocStages,
        duelRoster: state.duelRoster,
        duelArenas: state.duelArenas
      }));
    } catch (_) {}
  }

  const initialPools = loadCustomPools();

  const state = {
    mode: 'puzzle', // 'puzzle' | 'oc' | 'duel'
    speed: 'normal',
    theme: 'dark',
    memePoolEnabled: true,
    isSpinning: false,
    currentRotation: 0,
    lastSliceIdx: -1,

    puzzleSlots: initialPools.puzzleSlots,
    ocStages: initialPools.ocStages,
    duelRoster: initialPools.duelRoster,
    duelArenas: initialPools.duelArenas,

    puzzleActiveSlotIdx: 0,
    puzzleBuild: {},

    ocActiveStageIdx: 0,
    ocBuild: {},

    duelTargetSide: 'red',
    duelPoolFilter: 'all',
    duelRed: null,
    duelBlue: null,
    duelArena: initialPools.duelArenas[0] || DUEL_ARENAS[0],

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

  // =========================================================
  // HELPERS
  // =========================================================
  function $(id) {
    return document.getElementById(id);
  }

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
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => box.classList.add('hidden'), 2400);
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
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (_) {
      showToast('复制失败，请手动选中复制');
    }
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
    renderOcPanel();
  }

  function getCurrentWheelContext() {
    let rawList = [];
    let title = '';
    if (state.mode === 'puzzle') {
      const slot = state.puzzleSlots[state.puzzleActiveSlotIdx];
      title = `${slot.icon} ${slot.title}`;
      rawList = slot.items;
    } else if (state.mode === 'oc') {
      const stage = state.ocStages[state.ocActiveStageIdx];
      title = `${stage.icon} ${stage.title}`;
      rawList = stage.items;
    } else {
      if (state.duelTargetSide === 'arena') {
        title = '🏟️ 决战场地与特殊规则';
        rawList = state.duelArenas;
      } else {
        title = state.duelTargetSide === 'red' ? '🔴 红方选手抽取' : '🔵 蓝方选手抽取';
        rawList = state.duelRoster.filter(item => {
          if (state.duelPoolFilter === 'top') return item.group === 'top';
          if (state.duelPoolFilter === 'low') return item.group === 'low' || item.group === 'mid';
          return true;
        });
      }
    }

    const filtered = state.memePoolEnabled
      ? rawList
      : rawList.filter(item => !item.isMeme && item.tier !== 'MEME');

    return {
      title,
      items: filtered.length > 0 ? filtered : rawList
    };
  }

  function computeSliceGeometry(items) {
    const totalWeight = items.reduce((acc, it) => acc + Math.max(1, Number(it.weight) || 8), 0);
    let cursor = 0;
    return items.map((item, idx) => {
      const w = Math.max(1, Number(item.weight) || 8);
      const sweep = (w / totalWeight) * Math.PI * 2;
      const start = cursor;
      const end = cursor + sweep;
      cursor = end;
      return { item, idx, start, end, mid: (start + end) / 2, sweep };
    });
  }

  // =========================================================
  // HIGH-DPI CANVAS ROULETTE WHEEL (100% SILENT)
  // =========================================================
  const wheelCanvas = $('wheelCanvas');
  const wheelCtx = wheelCanvas.getContext('2d');

  function getSliceIndexAtPointer(slices, rotation) {
    const twoPi = Math.PI * 2;
    const pointerLocal = (((-Math.PI / 2 - rotation) % twoPi) + twoPi) % twoPi;
    for (let i = 0; i < slices.length; i++) {
      if (pointerLocal >= slices[i].start && pointerLocal < slices[i].end) {
        return i;
      }
    }
    return 0;
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
    const radius = size * 0.46;
    const isLight = state.theme === 'light';

    ctx.clearRect(0, 0, size, size);

    const { items } = getCurrentWheelContext();
    const slices = computeSliceGeometry(items);
    const hoveredIdx = getSliceIndexAtPointer(slices, state.currentRotation);

    const hoveredItem = slices[hoveredIdx]?.item;
    if (hoveredItem) {
      const prefix = hoveredItem.char ? `${hoveredItem.char} · ` : '';
      $('livePointerText').textContent = `${prefix}${hoveredItem.name}`;
    }

    // Outer rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + size * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#dce3f1' : '#1e2538';
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.006);
    ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
    ctx.stroke();
    ctx.restore();

    // Slices
    slices.forEach((sl, idx) => {
      const startA = sl.start + state.currentRotation;
      const endA = sl.end + state.currentRotation;
      const palette = SLICE_PALETTE[sl.item.tier] || SLICE_PALETTE.R;
      const baseColor = palette[idx % palette.length];
      const isHovered = idx === hoveredIdx;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.closePath();

      ctx.fillStyle = baseColor;
      ctx.fill();

      if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fill();
      }

      ctx.lineWidth = Math.max(1.5, size * 0.004);
      ctx.strokeStyle = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(11, 13, 20, 0.85)';
      ctx.stroke();

      const midA = (startA + endA) / 2;
      ctx.translate(cx, cy);
      ctx.rotate(midA);

      const labelRaw = sl.item.char
        ? `${sl.item.char}`
        : sl.item.name.replace(/（.*?）/g, '');
      const label = labelRaw.length > 8 ? labelRaw.slice(0, 7) + '…' : labelRaw;

      const fontPx = Math.max(12 * dpr, Math.min(14.5 * dpr, radius * 0.088));
      ctx.font = `700 ${fontPx}px system-ui, -apple-system, "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillText(label, radius * 0.90 + 1, 1);

      ctx.fillStyle = sl.item.tier === 'SSR' ? '#fef08a' : '#ffffff';
      ctx.fillText(label, radius * 0.90, 0);

      ctx.beginPath();
      ctx.arc(radius * 0.95, 0, Math.max(2.5, size * 0.007), 0, Math.PI * 2);
      ctx.fillStyle = (TIER_META[sl.item.tier] || TIER_META.R).color;
      ctx.fill();

      ctx.restore();
    });

    // Rim pegs
    slices.forEach(sl => {
      const angle = sl.start + state.currentRotation;
      const px = cx + Math.cos(angle) * (radius + size * 0.012);
      const py = cy + Math.sin(angle) * (radius + size * 0.012);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2, size * 0.006), 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#475569' : '#e2e8f0';
      ctx.fill();
    });

    // Center collar
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#ffffff' : '#0f1320';
    ctx.fill();
    ctx.lineWidth = Math.max(2, size * 0.006);
    ctx.strokeStyle = '#8b5cf6';
    ctx.stroke();
  }

  function spinWheel(overrideSpeedKey = null) {
    if (state.isSpinning) return Promise.resolve(null);
    state.isSpinning = true;
    updateSpinControlsState();
    $('wheelFlashOverlay').classList.add('hidden');

    const { items } = getCurrentWheelContext();
    const slices = computeSliceGeometry(items);

    const totalWeight = slices.reduce((s, sl) => s + Math.max(1, Number(sl.item.weight) || 8), 0);
    let rand = Math.random() * totalWeight;
    let targetSlice = slices[0];
    for (const sl of slices) {
      rand -= Math.max(1, Number(sl.item.weight) || 8);
      if (rand <= 0) {
        targetSlice = sl;
        break;
      }
    }

    const targetLocalAngle = targetSlice.start + targetSlice.sweep * (0.18 + Math.random() * 0.64);
    const twoPi = Math.PI * 2;
    const desiredMod = (((-Math.PI / 2 - targetLocalAngle) % twoPi) + twoPi) % twoPi;
    const currentMod = ((state.currentRotation % twoPi) + twoPi) % twoPi;
    const delta = (desiredMod - currentMod + twoPi) % twoPi;

    const spd = SPEED_CONFIG[overrideSpeedKey || state.speed] || SPEED_CONFIG.normal;
    const startRot = state.currentRotation;
    const endRot = startRot + spd.extraSpins * twoPi + delta;

    return new Promise(resolve => {
      const startTime = performance.now();
      const tickerEl = $('wheelTicker');

      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / spd.duration);
        const eased = 1 - Math.pow(1 - t, 4.2);
        state.currentRotation = startRot + (endRot - startRot) * eased;

        const curIdx = getSliceIndexAtPointer(slices, state.currentRotation);
        if (curIdx !== state.lastSliceIdx) {
          state.lastSliceIdx = curIdx;
          tickerEl.classList.remove('ticker-active');
          void tickerEl.offsetWidth;
          tickerEl.classList.add('ticker-active');
        }

        drawWheel();

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          state.currentRotation = endRot % twoPi;
          state.isSpinning = false;
          drawWheel();
          updateSpinControlsState();

          const wonItem = targetSlice.item;
          triggerWinFlash(wonItem);
          applySpinResult(wonItem);
          resolve(wonItem);
        }
      }

      requestAnimationFrame(step);
    });
  }

  function triggerWinFlash(item) {
    if (item.tier !== 'SSR' && item.tier !== 'MEME') return;
    const overlay = $('wheelFlashOverlay');
    const badge = $('wheelFlashBadge');
    const tierEl = $('wheelFlashTier');
    const nameEl = $('wheelFlashName');

    tierEl.textContent = item.tier === 'SSR' ? '⚡ 特级降临 · 黑闪级欧气' : '🤡 地狱整活 · 节目效果拉满';
    badge.className = item.tier === 'SSR' ? 'wheel-flash-badge' : 'wheel-flash-badge meme';
    nameEl.textContent = item.char ? `${item.char} · ${item.name}` : item.name;

    overlay.classList.remove('hidden');
    clearTimeout(triggerWinFlash._t);
    triggerWinFlash._t = setTimeout(() => overlay.classList.add('hidden'), 1350);
  }

  // =========================================================
  // RESULT APPLICATION & EVALUATIONS
  // =========================================================
  function applySpinResult(item) {
    if (state.mode === 'puzzle') {
      const slot = state.puzzleSlots[state.puzzleActiveSlotIdx];
      state.puzzleBuild[slot.id] = item;
      const nextEmpty = state.puzzleSlots.findIndex(s => !state.puzzleBuild[s.id]);
      if (nextEmpty !== -1) state.puzzleActiveSlotIdx = nextEmpty;
      renderPuzzlePanel();
      refreshWheelHeader();
      drawWheel();
    } else if (state.mode === 'oc') {
      const stage = state.ocStages[state.ocActiveStageIdx];
      state.ocBuild[stage.id] = item;
      const nextEmpty = state.ocStages.findIndex(s => !state.ocBuild[s.id]);
      if (nextEmpty !== -1) state.ocActiveStageIdx = nextEmpty;
      renderOcPanel();
      refreshWheelHeader();
      drawWheel();
    } else if (state.mode === 'duel') {
      if (state.duelTargetSide === 'red') {
        state.duelRed = item;
        if (!state.duelBlue) state.duelTargetSide = 'blue';
      } else if (state.duelTargetSide === 'blue') {
        state.duelBlue = item;
      } else if (state.duelTargetSide === 'arena') {
        state.duelArena = item;
      }
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
    }
  }

  function evaluatePuzzleBuild() {
    const slots = state.puzzleSlots;
    const picked = slots.map(s => state.puzzleBuild[s.id]).filter(Boolean);
    if (picked.length === 0) {
      return {
        stats: [0, 0, 0, 0, 0],
        power: 0,
        synergies: [],
        rank: '尚未成型',
        rankTier: 'R',
        comment: '请先转动左侧转盘抽取6项能力部件。抽齐后将自动评估强度并解锁新宿Boss挑战！'
      };
    }

    const sums = [0, 0, 0, 0, 0];
    picked.forEach(item => {
      const st = item.stats || [60, 60, 60, 60, 60];
      for (let i = 0; i < 5; i++) sums[i] += st[i];
    });
    const stats = sums.map(v => Math.max(5, Math.min(100, Math.round(v / picked.length))));

    const synergies = [];
    const allTags = new Set();
    picked.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));

    const tech = state.puzzleBuild.technique;
    const ce = state.puzzleBuild.ce;
    const phy = state.puzzleBuild.physique;
    const dom = state.puzzleBuild.domain;
    let bonus = 0;

    if (tech?.id === 'limitless' && !allTags.has('six_eyes') && ce?.id !== 'hakari_ce') {
      synergies.push({ title: '⚠️ 无六眼硬开无下限', type: 'debuff', desc: '蓝条3秒蒸发！术式发挥大幅缩水' });
      bonus -= 14;
      stats[0] = Math.max(10, stats[0] - 25);
    } else if (tech?.id === 'limitless' && allTags.has('six_eyes')) {
      synergies.push({ title: '♾️ 六眼+无下限完全体', type: 'buff', desc: '真正的现代最强公式启动！' });
      bonus += 16;
    }

    if (allTags.has('zero_ce')) {
      if (tech && !allTags.has('meme_op') && tech.id !== 'no_tech') {
        synergies.push({ title: '⚡ 0咒力悖论卡Bug', type: 'debuff', desc: '抽了0蓝条却想开术式/领域？属于强行硬卡机制！' });
        bonus -= 4;
      } else {
        synergies.push({ title: '🗡️ 纯物理天与暴君', type: 'buff', desc: '免疫必中结界，纯肉体碾压高阶术师！' });
        bonus += 22;
      }
    }

    if (allTags.has('meme_cut')) {
      synergies.push({ title: '✈️ 机场南下预备役', type: 'meme', desc: '战力先打对折，随时准备夸对手还没拿出全力' });
      bonus -= 12;
    }

    if (tech?.id === 'ten_shadows') {
      synergies.push({ title: '☸️ 魔虚罗垫背警告', type: 'buff', desc: '打不过直接比出“布都御魂”，拉全场一起下水！' });
      bonus += 9;
    }

    if (allTags.has('black_flash') && allTags.has('todo')) {
      synergies.push({ title: '👏 东堂+黑闪究极合击', type: 'buff', desc: '拍手换位接黑闪连打，直接把Boss打到怀疑人生！' });
      bonus += 12;
    }

    if (tech?.id === 'comedian') {
      synergies.push({ title: '🤡 搞笑艺人因果律', type: 'meme', desc: '只要你笑得出来，宿傩也只能陪你演小品！' });
      bonus += 11;
    }

    const miwaCount = picked.filter(p => p.char === '三轮霞').length;
    if (miwaCount >= 2) {
      synergies.push({ title: '🗡️ 真·最强三轮传说', type: 'meme', desc: `抽到${miwaCount}个三轮部件！触发神秘粉丝护体！` });
      bonus += miwaCount >= 3 ? 18 : -4;
    }

    const ssrCount = picked.filter(p => p.tier === 'SSR').length;
    if (ssrCount >= 5) {
      synergies.push({ title: '👑 天花板缝合战神', type: 'buff', desc: '全身特级配置，宿傩来了都得先写遗书！' });
      bonus += 10;
    }

    const basePower = Math.round(stats[0] * 0.22 + stats[1] * 0.22 + stats[2] * 0.26 + stats[3] * 0.18 + stats[4] * 0.12);
    const power = Math.max(10, Math.min(125, basePower + bonus));

    let rank = '二级咒术师';
    let rankTier = 'R';
    let comment = '中规中矩的高专主力水平，打打二级一级咒灵没问题，去新宿建议自带担架。';

    if (picked.length < 6) {
      rank = `拼装中 (${picked.length}/6)`;
      rankTier = 'SR';
      comment = `当前已抽取 ${picked.length} 项能力，继续抽完剩余槽位即可解锁完整连携评价与Boss战！`;
    } else if (power >= 95) {
      rank = '神话·超越五宿';
      rankTier = 'SSR';
      comment = `【${phy.char}体格 + ${tech.char}术式 + ${dom.char}领域】这什么绝世缝合怪？！宿傩在新宿连夜买机票逃跑了！`;
    } else if (power >= 84) {
      rank = '特级天花板';
      rankTier = 'SSR';
      comment = '标准特级大魔王！只要不自己浪到机场南下，基本能跟完全体宿傩有来有回大战二十回合！';
    } else if (power >= 72) {
      rank = '准特级 / 一级巅峰';
      rankTier = 'SR';
      comment = `战力十分扎实，遇到漏瑚真人基本乱杀；如果面对宿傩，建议把${tech.char}术式打法练到极致再考虑偷袭。`;
    } else if (power >= 58) {
      rank = '一级中坚力量';
      rankTier = 'R';
      comment = `典型“车轮战第二梯队”，上场负责给Boss刮痧+打气，或者靠${dom.name}拖延十秒。`;
    } else {
      rank = '机场VIP候机员';
      rankTier = 'MEME';
      comment = '这配置简直抽象到家了！建议立刻联系家入硝子准备病床，或者直接和五条悟一起在机场喝咖啡。';
    }

    return { stats, power, synergies, rank, rankTier, comment };
  }

  function evaluateOcBuild() {
    const picked = state.ocStages.map(s => state.ocBuild[s.id]).filter(Boolean);
    if (picked.length === 0) {
      return { stats: [0, 0, 0, 0, 0], power: 0, rank: '未入局', comment: '完成全部6阶段命运转盘后，可带入新宿决战或死灭回游检验成色！' };
    }
    const sums = [25, 25, 25, 25, 25];
    picked.forEach(it => {
      const st = it.stats || [12, 12, 12, 12, 12];
      for (let i = 0; i < 5; i++) sums[i] += st[i];
    });
    const stats = sums.map(v => Math.max(5, Math.min(100, Math.round(v * 0.72))));
    const isHeavenly = state.ocBuild.talent?.id === 't_heavenly';
    const basePower = Math.round(stats[0] * 0.22 + stats[1] * 0.22 + stats[2] * 0.28 + stats[3] * 0.16 + stats[4] * 0.12);
    const power = isHeavenly ? Math.min(115, basePower + 22) : basePower;

    let rank = '死灭回游参与者';
    let comment = '还在成长中的咒术师，继续完成剩余阶段看看能否觉醒领域展开！';
    if (picked.length === 6) {
      const name = $('ocNameInput').value.trim() || '无名高专生';
      if (power >= 88) {
        rank = '特级怪物';
        comment = `${name} 绝对是足以改变咒术界势力版图的特级怪物！不仅能硬刚两面宿傩，甚至有资格坐上“最强”的宝座。`;
      } else if (power >= 74) {
        rank = '一级顶梁柱';
        comment = `${name} 拥有极高的战术价值，在死灭回游各结界都能杀出100分以上的战绩。`;
      } else if (power >= 58) {
        rank = '潜力高专生';
        comment = `${name} 属于稳扎稳打的团队核心，只要别单独撞上完全体宿傩就能活到大结局！`;
      } else {
        rank = '一集领盒饭路人';
        comment = `${name} 的经历简直惨不忍睹……建议立刻转向后勤辅助，远离涩谷和新宿方圆五十公里！`;
      }
    }
    return { stats, power, rank, comment };
  }

  // =========================================================
  // SVG RADAR CHART
  // =========================================================
  function renderRadar(svgId, stats, accentHex) {
    const svg = $(svgId);
    const isLight = state.theme === 'light';
    const gridStroke = isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.16)';
    const labelColor = isLight ? '#334155' : '#cbd5e1';

    const cx = 120;
    const cy = 112;
    const maxR = 72;
    const labels = ['咒力', '体术', '术式', '智谋', '气运'];
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
      const [lx, ly] = pt(i, 1.24);
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

  // =========================================================
  // RENDERERS
  // =========================================================
  function renderPuzzlePanel() {
    const grid = $('puzzleSlotsGrid');
    let filledCount = 0;

    grid.innerHTML = state.puzzleSlots.map((slot, idx) => {
      const picked = state.puzzleBuild[slot.id];
      if (picked) filledCount++;
      const isActive = state.puzzleActiveSlotIdx === idx;
      const tier = picked ? (TIER_META[picked.tier] || TIER_META.R) : null;

      return `
        <button data-slot-idx="${idx}" class="slot-btn ${isActive ? 'active' : ''}">
          <div class="slot-top">
            <span>${slot.icon} ${slot.title}</span>
            ${picked
              ? `<span class="tier-badge tier-${picked.tier}">${tier.label}</span>`
              : `<span>${isActive ? '● 锁定中' : '待抽取'}</span>`}
          </div>
          <div class="slot-name">${picked ? `${escapeHtml(picked.char)} · ${escapeHtml(picked.name)}` : '点击选中此转盘'}</div>
          <div class="slot-desc">${picked ? escapeHtml(picked.desc) : '切换转盘后点击 SPIN 抽取'}</div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.puzzleActiveSlotIdx = Number(btn.dataset.slotIdx);
        renderPuzzlePanel();
        refreshWheelHeader();
        drawWheel();
      });
    });

    $('puzzleProgressBadge').textContent = `进度 ${filledCount} / ${state.puzzleSlots.length}`;

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
        <div class="synergy-chip ${s.type}">
          <strong>${escapeHtml(s.title)}</strong>：${escapeHtml(s.desc)}
        </div>
      `).join('');
    } else {
      synBox.classList.add('hidden');
    }

    renderRadar('puzzleRadarSvg', evalRes.stats, '#a855f7');
    $('startPuzzleBattleBtn').disabled = filledCount === 0;
  }

  function renderOcPanel() {
    const grid = $('ocStagesGrid');
    let filledCount = 0;

    grid.innerHTML = state.ocStages.map((stg, idx) => {
      const picked = state.ocBuild[stg.id];
      if (picked) filledCount++;
      const isActive = state.ocActiveStageIdx === idx;
      const tier = picked ? (TIER_META[picked.tier] || TIER_META.R) : null;

      return `
        <button data-stage-idx="${idx}" class="slot-btn ${isActive ? 'active' : ''}">
          <div class="slot-top">
            <span>${stg.icon} ${stg.title.replace(/第\d步：/, '')}</span>
            ${picked ? `<span class="tier-badge tier-${picked.tier}">${tier.label}</span>` : ''}
          </div>
          <div class="slot-name">${picked ? escapeHtml(picked.name) : (isActive ? '● 待抽取' : '点击切换')}</div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.ocActiveStageIdx = Number(btn.dataset.stageIdx);
        renderOcPanel();
        refreshWheelHeader();
        drawWheel();
      });
    });

    $('ocProgressBadge').textContent = `阶段 ${filledCount} / ${state.ocStages.length}`;

    const feed = $('ocStoryFeed');
    const ocName = escapeHtml($('ocNameInput').value.trim() || '无名高专生');
    const entries = state.ocStages
      .map(stg => ({ stg, item: state.ocBuild[stg.id] }))
      .filter(x => Boolean(x.item));

    if (entries.length === 0) {
      feed.innerHTML = `<div style="color:var(--muted)">点击「出身身份」或直接转动左侧转盘，开启 ${ocName} 的咒术人生！</div>`;
    } else {
      feed.innerHTML = entries.map(({ stg, item }) => {
        const tier = TIER_META[item.tier] || TIER_META.R;
        return `
          <div class="story-entry">
            <strong style="color:${tier.color}">[${stg.title}] ${escapeHtml(item.name)}：</strong>
            <span>${escapeHtml(item.story)}</span>
          </div>
        `;
      }).join('');
      feed.scrollTop = feed.scrollHeight;
    }

    const evalOc = evaluateOcBuild();
    $('ocPowerScore').textContent = evalOc.power;
    $('ocRankTag').textContent = evalOc.rank;
    $('ocSummaryComment').textContent = evalOc.comment;
    renderRadar('ocRadarSvg', evalOc.stats, '#0ea5e9');
    $('startOcBattleBtn').disabled = filledCount === 0;
  }

  function renderDuelPanel() {
    const redCard = $('duelRedCard');
    const blueCard = $('duelBlueCard');
    const arenaBar = $('duelArenaBar');

    redCard.classList.toggle('selected', state.duelTargetSide === 'red');
    blueCard.classList.toggle('selected', state.duelTargetSide === 'blue');
    arenaBar.classList.toggle('selected', state.duelTargetSide === 'arena');

    const renderSide = (elId, fighter) => {
      const el = $(elId);
      if (!fighter) {
        el.innerHTML = `<div style="font-size:15px;font-weight:800">待抽取...</div><div style="font-size:12px;color:var(--muted);margin-top:4px">选中此框后点击左侧 SPIN</div>`;
        return;
      }
      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <span style="font-size:15px;font-weight:800">${escapeHtml(fighter.name)}</span>
          <span class="tier-badge tier-${fighter.tier}">战力 ${fighter.power}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">招牌：${escapeHtml(fighter.signature)}</div>
        <div style="font-size:12px;color:var(--muted);font-style:italic;margin-top:2px">${escapeHtml(fighter.quote)}</div>
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
    const ctx = getCurrentWheelContext();
    $('wheelTitle').textContent = ctx.title;
    $('wheelPoolBadge').textContent = `共 ${ctx.items.length} 项`;
  }

  function updateSpinControlsState() {
    $('spinBtn').disabled = state.isSpinning;
    $('autoAllBtn').disabled = state.isSpinning;
  }

  // =========================================================
  // SILENT TEXT BATTLE ENGINE
  // =========================================================
  async function runBattleSimulation(fighterA, fighterB, arenaMod = 'normal', onFinishMeta = null) {
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
      const pA = Math.max(0, Math.round((hpA / maxA) * 100));
      const pB = Math.max(0, Math.round((hpB / maxB) * 100));
      $('fighterAHpText').textContent = `${Math.max(0, Math.round(hpA))} / ${maxA}`;
      $('fighterBHpText').textContent = `${Math.max(0, Math.round(hpB))} / ${maxB}`;
      $('fighterAHpBar').style.width = `${pA}%`;
      $('fighterBHpBar').style.width = `${pB}%`;
    };
    updateBars();

    let skipMode = false;
    $('skipBattleBtn').onclick = () => { skipMode = true; };

    const waitStep = async ms => {
      if (skipMode) return;
      await new Promise(r => setTimeout(r, ms));
    };

    const appendLog = (html, extraCls = '') => {
      const div = document.createElement('div');
      div.className = `log-item ${extraCls}`;
      div.innerHTML = html;
      logFeed.appendChild(div);
      logFeed.scrollTop = logFeed.scrollHeight;
    };

    appendLog(`📢 <strong>开战宣言：</strong>${escapeHtml(fighterB.intro)}`, 'event');
    await waitStep(420);

    let round = 1;
    while (hpA > 0 && hpB > 0 && round <= 10) {
      if (state.battleAbort) return;

      if (arenaMod === 'mahoraga_drop' && round === 3) {
        appendLog('☸️ <strong>场地突发事故！</strong>天降【八握剑异戒神将魔虚罗】！它一巴掌把双方各自抽掉 28 点HP！', 'event');
        hpA -= 28;
        hpB -= 28;
        updateBars();
        await waitStep(450);
        if (hpA <= 0 || hpB <= 0) break;
      }

      // Turn A
      let dmgA = fighterA.atk * (0.82 + Math.random() * 0.42) - fighterB.def * 0.25;
      if (arenaMod === 'no_tai' && fighterA.isTaiOnly) dmgA *= 0.6;
      if (arenaMod === 'all_boost') dmgA *= 1.15;
      dmgA = Math.max(8, Math.round(dmgA));

      const bfChanceA = arenaMod === 'black_flash' ? 0.34 : (fighterA.bfBonus ? 0.28 : 0.14);
      const isBlackFlashA = Math.random() < bfChanceA;
      const isAirportA = arenaMod === 'airport' && Math.random() < 0.2;

      if (isAirportA) {
        appendLog(`✈️ <strong>第${round}回合 [我方]：</strong>${escapeHtml(fighterA.name)} 突然犯了机场综合征，愣在原地夸对面强，跳过本回合！`, 'event');
      } else {
        if (isBlackFlashA) {
          dmgA = Math.round(dmgA * 1.75);
          studio.classList.remove('anim-black-flash');
          void studio.offsetWidth;
          studio.classList.add('anim-black-flash');
          appendLog(`⚡ <strong>第${round}回合 [黑闪暴击！]：</strong>${escapeHtml(fighterA.name)} 施展「${escapeHtml(fighterA.skill)}」打出<strong>黑闪</strong>，狂轰 <strong>${dmgA}</strong> 点伤害！`, 'bf');
        } else {
          const skillText = fighterA.skills ? fighterA.skills[(round - 1) % fighterA.skills.length] : fighterA.skill;
          appendLog(`⚔️ <strong>第${round}回合 [我方进攻]：</strong>${escapeHtml(fighterA.name)} 发动【${escapeHtml(skillText)}】，造成 <strong>${dmgA}</strong> 点伤害！`);
        }
        hpB -= dmgA;
      }

      if (fighterA.hasRct && hpA > 0 && hpA < maxA * 0.65 && Math.random() < 0.4) {
        const heal = Math.round(maxA * 0.14);
        hpA = Math.min(maxA, hpA + heal);
        appendLog(`💚 <strong>反转术式再生：</strong>${escapeHtml(fighterA.name)} 冒出白烟修复伤口，回复 <strong>+${heal} HP</strong>！`, 'rct');
      }

      updateBars();
      await waitStep(440);
      if (hpB <= 0) break;

      // Turn B
      const isAirportB = arenaMod === 'airport' && Math.random() < 0.18;
      if (isAirportB) {
        appendLog(`✈️ <strong>第${round}回合 [敌方]：</strong>${escapeHtml(fighterB.name)} 突然在候机厅感慨人生，跳过本回合进攻！`, 'event');
      } else {
        let dmgB = fighterB.atk * (0.82 + Math.random() * 0.42) - fighterA.def * 0.25;
        if (arenaMod === 'no_tai' && fighterB.isTaiOnly) dmgB *= 0.6;
        if (arenaMod === 'all_boost') dmgB *= 1.15;
        dmgB = Math.max(8, Math.round(dmgB));

        const bfChanceB = arenaMod === 'black_flash' ? 0.32 : (fighterB.bfBonus ? 0.26 : 0.14);
        const isBlackFlashB = Math.random() < bfChanceB;
        const bSkill = fighterB.skills ? fighterB.skills[(round - 1) % fighterB.skills.length] : fighterB.skill;

        if (isBlackFlashB) {
          dmgB = Math.round(dmgB * 1.65);
          appendLog(`💥 <strong>第${round}回合 [敌方爆发！]：</strong>${escapeHtml(fighterB.name)} 强行发动【${escapeHtml(bSkill)}】伴随暴击，打出 <strong>${dmgB}</strong> 点伤害！`, 'event');
        } else {
          appendLog(`🩸 <strong>第${round}回合 [敌方反击]：</strong>${escapeHtml(fighterB.name)} 挥出【${escapeHtml(bSkill)}】，对你造成 <strong>${dmgB}</strong> 点伤害！`);
        }
        hpA -= dmgB;
      }

      if (fighterB.hasRct && hpB > 0 && hpB < maxB * 0.6 && Math.random() < 0.35) {
        const healB = Math.round(maxB * 0.12);
        hpB = Math.min(maxB, hpB + healB);
        appendLog(`🩹 <strong>敌方反转再生：</strong>${escapeHtml(fighterB.name)} 启动反转术式强行续命，回复 <strong>+${healB} HP</strong>！`, 'rct');
      }

      updateBars();
      await waitStep(460);
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

    const reportSummary = `【咒术回战转盘战报】${fighterA.name} VS ${fighterB.name}｜结果：${aWon ? '大获全胜！' : '惜败南下…'}｜评语：${aWon ? fighterB.winMeme : fighterB.loseMeme}`;
    $('copyBattleReportBtn').onclick = () => copyText(reportSummary, '战报已复制！');

    saveHistoryEntry({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      mode: state.mode,
      title: `${fighterA.name} VS ${fighterB.name}`,
      result: aWon ? '胜' : '败',
      detail: onFinishMeta || reportSummary
    });

    studio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function launchPuzzleBossBattle() {
    const evalRes = evaluatePuzzleBuild();
    const bossKey = $('puzzleBossSelect').value;
    const boss = BOSSES[bossKey];
    const parts = state.puzzleSlots.map(s => state.puzzleBuild[s.id]).filter(Boolean);
    const skills = parts.map(p => `${p.char}的${p.name}`);

    const playerFighter = {
      name: '拼图缝合怪（你）',
      maxHp: Math.round(145 + evalRes.stats[1] * 0.85 + evalRes.power * 0.55),
      atk: Math.round(22 + evalRes.power * 0.42),
      def: Math.round(14 + evalRes.stats[1] * 0.25),
      skill: skills[0] || '基础咒力拳',
      skills: skills.length ? skills : ['基础咒力拳'],
      hasRct: Boolean(state.puzzleBuild.rct && !state.puzzleBuild.rct.tags?.includes('no_rct')),
      bfBonus: parts.some(p => p.tags?.includes('black_flash')),
      isTaiOnly: Boolean(state.puzzleBuild.ce?.tags?.includes('zero_ce'))
    };

    const enemyFighter = {
      name: boss.name,
      maxHp: boss.hp,
      atk: boss.atk,
      def: boss.def,
      intro: boss.intro,
      skills: boss.skills,
      hasRct: bossKey === 'gojo' || bossKey === 'sukuna' || bossKey === 'kenjaku',
      bfBonus: bossKey === 'mahito' || bossKey === 'sukuna',
      winMeme: boss.winMeme,
      loseMeme: boss.loseMeme
    };

    $('battleTitle').textContent = `⚔️ 新宿/涩谷决战：拼图构筑 vs ${boss.name}`;
    state.lastBattleContext = () => launchPuzzleBossBattle();
    runBattleSimulation(playerFighter, enemyFighter, 'normal', `战力${evalRes.power}｜${evalRes.rank}`);
  }

  function launchOcBossBattle() {
    const evalOc = evaluateOcBuild();
    const ocName = $('ocNameInput').value.trim() || '无名高专生';
    const bossKey = $('ocBossSelect').value;
    const boss = BOSSES[bossKey];
    const picked = state.ocStages.map(s => state.ocBuild[s.id]).filter(Boolean);
    const skills = picked.map(p => p.name);

    const playerFighter = {
      name: `${ocName}（OC）`,
      maxHp: Math.round(135 + evalOc.power * 1.15),
      atk: Math.round(20 + evalOc.power * 0.45),
      def: Math.round(14 + evalOc.stats[1] * 0.24),
      skill: skills[0] || '高专基础术式',
      skills: skills.length ? skills : ['高专基础术式'],
      hasRct: state.ocBuild.mastery?.id?.includes('rct') || false,
      bfBonus: state.ocBuild.event?.id === 'e_blackflash',
      isTaiOnly: state.ocBuild.talent?.id === 't_heavenly'
    };

    const enemyFighter = {
      name: boss.name,
      maxHp: boss.hp,
      atk: boss.atk,
      def: boss.def,
      intro: boss.intro,
      skills: boss.skills,
      hasRct: bossKey === 'gojo' || bossKey === 'sukuna' || bossKey === 'kenjaku',
      bfBonus: bossKey === 'mahito' || bossKey === 'sukuna',
      winMeme: boss.winMeme,
      loseMeme: boss.loseMeme
    };

    $('battleTitle').textContent = `🌀 死灭回游决战：${ocName} vs ${boss.name}`;
    state.lastBattleContext = () => launchOcBossBattle();
    runBattleSimulation(playerFighter, enemyFighter, 'normal', `OC战力${evalOc.power}｜${evalOc.rank}`);
  }

  function launchDuelBattle() {
    const r = state.duelRed;
    const b = state.duelBlue;
    if (!r || !b) return;

    const fA = {
      name: `🔴 ${r.name}`,
      maxHp: Math.round(r.hp * 1.6),
      atk: Math.round(r.power * 0.56),
      def: Math.round(r.tai * 0.28),
      skill: r.signature,
      skills: [r.signature, '咒力强化猛击', '极限闪避反打'],
      hasRct: r.power >= 86,
      bfBonus: r.id === 'd_yuji' || r.id === 'd_nanami',
      isTaiOnly: r.ce === 0
    };

    const fB = {
      name: `🔵 ${b.name}`,
      maxHp: Math.round(b.hp * 1.6),
      atk: Math.round(b.power * 0.56),
      def: Math.round(b.tai * 0.28),
      intro: `${b.name} 摆出架势：${b.quote}`,
      skill: b.signature,
      skills: [b.signature, '近身试探压制', '全力拼招轰击'],
      hasRct: b.power >= 86,
      bfBonus: b.id === 'd_yuji' || b.id === 'd_nanami',
      winMeme: `战果定格：【${r.name}】力克【${b.name}】，弹幕刷屏“含金量还在上升！”`,
      loseMeme: `大逆转还是实力碾压？！【${b.name}】拿下了【${r.name}】，弹幕直呼“小丑竟是我自己”！`,
      isTaiOnly: b.ce === 0
    };

    $('battleTitle').textContent = `⚔️ 1v1 斗蛐蛐（${state.duelArena.name}）`;
    state.lastBattleContext = () => launchDuelBattle();
    runBattleSimulation(fA, fB, state.duelArena.mod, `场地：${state.duelArena.name}`);
  }

  // =========================================================
  // AUTO-SPIN ALL
  // =========================================================
  async function runAutoAll() {
    if (state.isSpinning) return;
    const fastOverride = state.speed === 'slow' ? 'normal' : 'fast';

    if (state.mode === 'puzzle') {
      if (Object.keys(state.puzzleBuild).length >= state.puzzleSlots.length) {
        state.puzzleBuild = {};
        state.puzzleActiveSlotIdx = 0;
        renderPuzzlePanel();
        showToast('已重置拼图，开启新一轮6连抽！');
      }
      for (let i = 0; i < state.puzzleSlots.length; i++) {
        if (!state.puzzleBuild[state.puzzleSlots[i].id]) {
          state.puzzleActiveSlotIdx = i;
          renderPuzzlePanel();
          refreshWheelHeader();
          drawWheel();
          await spinWheel(fastOverride);
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } else if (state.mode === 'oc') {
      if (Object.keys(state.ocBuild).length >= state.ocStages.length) {
        state.ocBuild = {};
        state.ocActiveStageIdx = 0;
        renderOcPanel();
        showToast('已开启新一轮咒术师人生！');
      }
      for (let i = 0; i < state.ocStages.length; i++) {
        if (!state.ocBuild[state.ocStages[i].id]) {
          state.ocActiveStageIdx = i;
          renderOcPanel();
          refreshWheelHeader();
          drawWheel();
          await spinWheel(fastOverride);
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } else if (state.mode === 'duel') {
      state.duelTargetSide = 'red';
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
      await spinWheel(fastOverride);
      await new Promise(r => setTimeout(r, 180));

      state.duelTargetSide = 'blue';
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
      await spinWheel(fastOverride);
      await new Promise(r => setTimeout(r, 180));

      state.duelTargetSide = 'arena';
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
      await spinWheel(fastOverride);
    }
  }

  // =========================================================
  // CUSTOM WHEEL EDITOR & HISTORY
  // =========================================================
  function getMutableCurrentArray() {
    if (state.mode === 'puzzle') return state.puzzleSlots[state.puzzleActiveSlotIdx].items;
    if (state.mode === 'oc') return state.ocStages[state.ocActiveStageIdx].items;
    if (state.duelTargetSide === 'arena') return state.duelArenas;
    return state.duelRoster;
  }

  function renderCustomItemsList() {
    const arr = getMutableCurrentArray();
    const container = $('customItemsList');
    container.innerHTML = arr.map((it, idx) => {
      const t = TIER_META[it.tier] || TIER_META.R;
      return `
        <div class="custom-row">
          <div style="display:flex;align-items:center;gap:8px;min-width:0">
            <span class="tier-badge tier-${it.tier}">${t.label}</span>
            <strong style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.char ? `${escapeHtml(it.char)} · ` : ''}${escapeHtml(it.name)}</strong>
            <span style="color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(it.desc || it.story || it.signature || '')}</span>
          </div>
          <button data-del-idx="${idx}" class="del-custom-btn tool-btn" style="color:#fb7185">删除</button>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.del-custom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (arr.length <= 2) {
          showToast('每个轮盘至少保留 2 个选项！');
          return;
        }
        arr.splice(Number(btn.dataset.delIdx), 1);
        saveCustomPools();
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
      list.innerHTML = '<div style="text-align:center;padding:28px;color:var(--muted)">暂无历史记录，先去转盘打一局吧！</div>';
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
  // MODE & BINDINGS
  // =========================================================
  function switchMode(newMode) {
    if (state.isSpinning) return;
    state.mode = newMode;
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.add('hidden'));
    $(`panel-${newMode}`).classList.remove('hidden');

    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === newMode);
    });

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
    } else if (state.mode === 'oc') {
      state.ocBuild = {};
      state.ocActiveStageIdx = 0;
      renderOcPanel();
    } else {
      state.duelRed = null;
      state.duelBlue = null;
      state.duelArena = state.duelArenas[0] || DUEL_ARENAS[0];
      state.duelTargetSide = 'red';
      renderDuelPanel();
    }
    $('battleStudio').classList.add('hidden');
    refreshWheelHeader();
    drawWheel();
    showToast('本局转盘已重置');
  }

  function init() {
    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    const refreshSpeedBtns = () => {
      document.querySelectorAll('.speed-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.speed === state.speed);
      });
    };
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.speed = btn.dataset.speed;
        refreshSpeedBtns();
      });
    });
    refreshSpeedBtns();

    $('themeBtn').addEventListener('click', () => {
      applyTheme(state.theme === 'light' ? 'dark' : 'light');
    });

    $('toggleMemePoolBtn').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.memePoolEnabled = !state.memePoolEnabled;
      $('memeStateLabel').textContent = state.memePoolEnabled ? '开启' : '关闭';
      $('memeDot').classList.toggle('off', !state.memePoolEnabled);
      refreshWheelHeader();
      drawWheel();
      showToast(state.memePoolEnabled ? '已开启B站整活池' : '已切换为严肃正统战斗池');
    });

    $('spinBtn').addEventListener('click', () => spinWheel());
    $('autoAllBtn').addEventListener('click', runAutoAll);
    $('resetModeBtn').addEventListener('click', resetCurrentMode);

    $('duelRedCard').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.duelTargetSide = 'red';
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
    });
    $('duelBlueCard').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.duelTargetSide = 'blue';
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
    });
    $('duelArenaBar').addEventListener('click', () => {
      if (state.isSpinning) return;
      state.duelTargetSide = 'arena';
      renderDuelPanel();
      refreshWheelHeader();
      drawWheel();
    });
    document.querySelectorAll('.duel-pool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.isSpinning) return;
        state.duelPoolFilter = btn.dataset.duelpool;
        if (state.duelTargetSide === 'arena') state.duelTargetSide = 'red';
        renderDuelPanel();
        refreshWheelHeader();
        drawWheel();
      });
    });

    $('startPuzzleBattleBtn').addEventListener('click', launchPuzzleBossBattle);
    $('startOcBattleBtn').addEventListener('click', launchOcBossBattle);
    $('startDuelBattleBtn').addEventListener('click', launchDuelBattle);
    $('closeBattleBtn').addEventListener('click', () => {
      state.battleAbort = true;
      $('battleStudio').classList.add('hidden');
    });
    $('rematchBtn').addEventListener('click', () => {
      if (state.lastBattleContext) state.lastBattleContext();
    });

    $('copyBuildBtn').addEventListener('click', () => {
      const evalRes = evaluatePuzzleBuild();
      const lines = state.puzzleSlots.map(s => {
        const p = state.puzzleBuild[s.id];
        return `${s.title}:${p ? `${p.char}(${p.name})` : '未抽'}`;
      });
      copyText(`【我的咒术拼图战神】${lines.join('｜')}｜战力:${evalRes.power}(${evalRes.rank})｜评语:${evalRes.comment}`, '已复制拼图配置！');
    });

    $('copyOcBtn').addEventListener('click', () => {
      const evalOc = evaluateOcBuild();
      const name = $('ocNameInput').value.trim() || '无名高专生';
      const lines = state.ocStages.map(s => `${s.title.replace(/第\d步：/, '')}:${state.ocBuild[s.id]?.name || '未抽'}`);
      copyText(`【咒术OC档案：${name}】${lines.join('｜')}｜战力:${evalOc.power}(${evalOc.rank})`, '已复制OC人设档案！');
    });

    // Custom Modal
    $('openCustomModalBtn').addEventListener('click', () => {
      if (state.isSpinning) return;
      $('customModal').classList.remove('hidden');
      renderCustomItemsList();
    });
    $('closeCustomModalBtn').addEventListener('click', () => $('customModal').classList.add('hidden'));
    $('saveCustomDoneBtn').addEventListener('click', () => $('customModal').classList.add('hidden'));

    $('addCustomItemBtn').addEventListener('click', () => {
      const name = $('customItemName').value.trim();
      if (!name) {
        showToast('请先输入条目名称！');
        return;
      }
      const tier = $('customItemTier').value;
      const desc = $('customItemDesc').value.trim() || '玩家自定义整活词条';
      const arr = getMutableCurrentArray();
      const tierStats = tier === 'SSR' ? [92, 90, 95, 90, 85] : tier === 'SR' ? [78, 80, 82, 78, 75] : tier === 'MEME' ? [45, 45, 55, 40, 95] : [65, 65, 65, 65, 65];

      arr.unshift({
        id: `custom_${Date.now()}`,
        char: state.mode === 'puzzle' ? name : undefined,
        name,
        tier,
        weight: tier === 'SSR' ? 7 : 10,
        power: tier === 'SSR' ? 92 : tier === 'SR' ? 82 : 65,
        hp: 115,
        ce: tierStats[0],
        tai: tierStats[1],
        tech: tierStats[2],
        iq: tierStats[3],
        stats: state.mode === 'oc' ? [18, 18, 18, 18, 18] : tierStats,
        desc,
        story: `${name} 携带【${desc}】强势杀入咒术界！`,
        signature: desc,
        quote: `“这就是 ${name} 的全力！”`,
        group: tier === 'SSR' ? 'top' : 'mid'
      });

      $('customItemName').value = '';
      $('customItemDesc').value = '';
      saveCustomPools();
      renderCustomItemsList();
      refreshWheelHeader();
      drawWheel();
      showToast(`已将「${name}」添加到当前转盘！`);
    });

    $('exportPoolBtn').addEventListener('click', () => {
      const payload = JSON.stringify({
        puzzleSlots: state.puzzleSlots,
        ocStages: state.ocStages,
        duelRoster: state.duelRoster,
        duelArenas: state.duelArenas
      }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jjk-wheel-pools.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('已导出当前自定义卡池 JSON');
    });

    $('importPoolInput').addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (parsed.puzzleSlots && parsed.ocStages && parsed.duelRoster && parsed.duelArenas) {
            state.puzzleSlots = parsed.puzzleSlots;
            state.ocStages = parsed.ocStages;
            state.duelRoster = parsed.duelRoster;
            state.duelArenas = parsed.duelArenas;
            saveCustomPools();
            renderCustomItemsList();
            refreshWheelHeader();
            drawWheel();
            showToast('卡池配置导入成功！');
          } else {
            showToast('JSON 格式不匹配');
          }
        } catch (_) {
          showToast('文件解析失败，请确认是有效的 JSON 文件');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('resetPoolDefaultBtn').addEventListener('click', () => {
      state.puzzleSlots = clone(DEFAULT_PUZZLE_SLOTS);
      state.ocStages = clone(DEFAULT_OC_STAGES);
      state.duelRoster = clone(DUEL_ROSTER);
      state.duelArenas = clone(DUEL_ARENAS);
      saveCustomPools();
      renderCustomItemsList();
      refreshWheelHeader();
      drawWheel();
      showToast('已恢复所有默认角色与能力卡池');
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
    switchMode('puzzle');
  }

  init();
})(window);
