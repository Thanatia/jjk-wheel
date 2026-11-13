/* =========================================================
 * 咒术回战 · 高辨识度角色矢量头像生成与 Canvas 缓存引擎
 * 完全离线矢量绘制，不依赖外部图片，支持 Canvas 安全导出 PNG 海报
 * ========================================================= */
(function (global) {
  'use strict';

  const AVATAR_SPECS = {
    gojo: {
      name: '五条悟',
      bg1: '#0ea5e9', bg2: '#1e1b4b',
      skin: '#fde6d8', hair: '#f8fafc', hairStyle: 'spikyUp',
      eyes: 'blindfold', collar: '#1e293b', accent: '#38bdf8',
      badge: '六眼'
    },
    gojo25: {
      name: '2.5条悟',
      bg1: '#64748b', bg2: '#0f172a',
      skin: '#fde6d8', hair: '#f1f5f9', hairStyle: 'spikyUp',
      eyes: 'sixeyes', collar: '#1e293b', accent: '#94a3b8',
      extra: 'cut25', badge: '机场'
    },
    sukuna: {
      name: '两面宿傩',
      bg1: '#dc2626', bg2: '#3b0712',
      skin: '#fbd8c8', hair: '#fb7185', hairStyle: 'slickBack',
      eyes: 'sukuna4', collar: '#f8fafc', accent: '#ef4444',
      extra: 'tattoos', badge: '傩王'
    },
    toji: {
      name: '伏黑甚尔',
      bg1: '#059669', bg2: '#06281e',
      skin: '#f5d2be', hair: '#18181b', hairStyle: 'messyShort',
      eyes: 'sharpGreen', collar: '#18181b', accent: '#10b981',
      extra: 'lipScar', badge: '天与'
    },
    yuji: {
      name: '虎杖悠仁',
      bg1: '#f43f5e', bg2: '#3b0a1e',
      skin: '#fbd8c8', hair: '#fda4af', hairStyle: 'undercut',
      eyes: 'warmAmber', collar: '#dc2626', accent: '#fb7185',
      extra: 'eyeSlits', badge: '黑闪'
    },
    megumi: {
      name: '伏黑惠',
      bg1: '#2563eb', bg2: '#0b1938',
      skin: '#fce4d6', hair: '#0f172a', hairStyle: 'urchin',
      eyes: 'coolTeal', collar: '#1e293b', accent: '#3b82f6',
      badge: '十影'
    },
    yuta: {
      name: '乙骨忧太',
      bg1: '#9333ea', bg2: '#1f0b38',
      skin: '#fef0e6', hair: '#18181b', hairStyle: 'parted',
      eyes: 'eyebags', collar: '#f8fafc', accent: '#a855f7',
      badge: '纯爱'
    },
    nobara: {
      name: '钉崎野蔷薇',
      bg1: '#ea580c', bg2: '#3b1507',
      skin: '#fde6d8', hair: '#fb923c', hairStyle: 'bob',
      eyes: 'warmBrown', collar: '#1e293b', accent: '#f97316',
      badge: '刍灵'
    },
    maki: {
      name: '禅院真希',
      bg1: '#0d9488', bg2: '#072a27',
      skin: '#f7d8c4', hair: '#064e3b', hairStyle: 'ponytail',
      eyes: 'glassesRed', collar: '#1e293b', accent: '#14b8a6',
      badge: '暴君'
    },
    todo: {
      name: '东堂葵',
      bg1: '#ca8a04', bg2: '#2e1d04',
      skin: '#eab896', hair: '#18181b', hairStyle: 'topknot',
      eyes: 'fierce', collar: '#3f2e21', accent: '#eab308',
      extra: 'faceScar', badge: '53万'
    },
    nanami: {
      name: '七海建人',
      bg1: '#d97706', bg2: '#2b1b05',
      skin: '#fae0ce', hair: '#fde047', hairStyle: 'sevenThree',
      eyes: 'goggles', collar: '#cbd5e1', accent: '#f59e0b',
      extra: 'tie', badge: '7:3'
    },
    geto: {
      name: '夏油杰',
      bg1: '#4f46e5', bg2: '#141236',
      skin: '#fce4d6', hair: '#111827', hairStyle: 'bunStrand',
      eyes: 'narrowPurple', collar: '#7e22ce', accent: '#6366f1',
      badge: '操术'
    },
    kenjaku: {
      name: '羂索',
      bg1: '#7e22ce', bg2: '#220938',
      skin: '#fce4d6', hair: '#111827', hairStyle: 'bunStrand',
      eyes: 'narrowPurple', collar: '#7e22ce', accent: '#c084fc',
      extra: 'foreheadStitches', badge: '脑花'
    },
    choso: {
      name: '胀相',
      bg1: '#991b1b', bg2: '#29070a',
      skin: '#f5ddd0', hair: '#18181b', hairStyle: 'twinBuns',
      eyes: 'tiredDark', collar: '#4c1d95', accent: '#ef4444',
      extra: 'noseStripe', badge: '大哥'
    },
    hakari: {
      name: '秤金次',
      bg1: '#db2777', bg2: '#360920',
      skin: '#f2cbb5', hair: '#ca8a04', hairStyle: 'sideSweep',
      eyes: 'smirkAmber', collar: '#581c87', accent: '#ec4899',
      extra: 'goatee', badge: '777'
    },
    kashimo: {
      name: '鹿紫云一',
      bg1: '#0891b2', bg2: '#082532',
      skin: '#fde8dc', hair: '#67e8f9', hairStyle: 'doubleBuns',
      eyes: 'cyanSharp', collar: '#f1f5f9', accent: '#06b6d4',
      extra: 'thunderCheeks', badge: '雷神'
    },
    higuruma: {
      name: '日车宽见',
      bg1: '#475569', bg2: '#0f172a',
      skin: '#f5d8c8', hair: '#1e293b', hairStyle: 'wavyShort',
      eyes: 'tiredDark', collar: '#0f172a', accent: '#94a3b8',
      extra: 'suitTie', badge: '处刑'
    },
    takaba: {
      name: '高羽史彦',
      bg1: '#eab308', bg2: '#312505',
      skin: '#f6d4be', hair: '#18181b', hairStyle: 'parted',
      eyes: 'comedy', collar: '#f8fafc', accent: '#facc15',
      extra: 'halfSuit', badge: '超人'
    },
    mahito: {
      name: '真人',
      bg1: '#3b82f6', bg2: '#171c3d',
      skin: '#e2e8f0', hair: '#93c5fd', hairStyle: 'longStraight',
      eyes: 'heterochromia', collar: '#1e293b', accent: '#60a5fa',
      extra: 'mahitoStitches', badge: '灵魂'
    },
    jogo: {
      name: '漏瑚',
      bg1: '#c2410c', bg2: '#330e04',
      skin: '#94a3b8', hair: '#ea580c', hairStyle: 'volcano',
      eyes: 'cyclops', collar: '#713f12', accent: '#f97316',
      badge: '火山'
    },
    miwa: {
      name: '三轮霞',
      bg1: '#0284c7', bg2: '#0b2239',
      skin: '#fef0e6', hair: '#7dd3fc', hairStyle: 'slantBangs',
      eyes: 'kindBlue', collar: '#1e293b', accent: '#38bdf8',
      badge: '拔刀'
    },
    naoya: {
      name: '禅院直哉',
      bg1: '#b45309', bg2: '#291505',
      skin: '#fde6d8', hair: '#facc15', hairStyle: 'parted',
      eyes: 'smug', collar: '#334155', accent: '#fbbf24',
      badge: '24帧'
    },
    ijichi: {
      name: '伊地知',
      bg1: '#4b5563', bg2: '#111827',
      skin: '#fae0ce', hair: '#1f2937', hairStyle: 'neatShort',
      eyes: 'squareGlasses', collar: '#0f172a', accent: '#9ca3af',
      badge: '专车'
    }
  };

  function buildAvatarSvg(charKey) {
    const s = AVATAR_SPECS[charKey] || {
      name: String(charKey || '?'),
      bg1: '#7c3aed', bg2: '#1e1b4b',
      skin: '#fde6d8', hair: '#1e293b', hairStyle: 'messyShort',
      eyes: 'coolTeal', collar: '#1e293b', accent: '#a855f7'
    };

    const gradId = `g_${String(charKey).replace(/[^a-zA-Z0-9_]/g, '')}`;

    // Back hair / special silhouettes
    let backHair = '';
    if (s.hairStyle === 'longStraight') {
      backHair = `<path d="M22 46 Q20 96 26 118 L94 118 Q100 96 98 46 Z" fill="${s.hair}" />`;
    } else if (s.hairStyle === 'slantBangs' || s.hairStyle === 'bob') {
      backHair = `<path d="M26 48 Q22 86 30 98 L90 98 Q98 86 94 48 Z" fill="${s.hair}" />`;
    } else if (s.hairStyle === 'ponytail') {
      backHair = `<path d="M84 36 Q106 32 104 72 Q96 64 86 58 Z" fill="${s.hair}" />`;
    } else if (s.hairStyle === 'bunStrand') {
      backHair = `<circle cx="60" cy="20" r="11" fill="${s.hair}" /><path d="M26 48 Q22 88 29 102 L91 102 Q98 88 94 48 Z" fill="${s.hair}" />`;
    } else if (s.hairStyle === 'twinBuns') {
      backHair = `<circle cx="30" cy="28" r="10" fill="${s.hair}" /><circle cx="90" cy="28" r="10" fill="${s.hair}" /><path d="M26 48 Q24 90 31 104 L89 104 Q96 90 94 48 Z" fill="${s.hair}" />`;
    } else if (s.hairStyle === 'doubleBuns') {
      backHair = `<circle cx="32" cy="25" r="9" fill="${s.hair}" /><circle cx="88" cy="25" r="9" fill="${s.hair}" /><path d="M24 46 Q22 92 28 112 L92 112 Q98 92 96 46 Z" fill="${s.hair}" />`;
    } else if (s.hairStyle === 'topknot') {
      backHair = `<path d="M52 10 L68 10 L65 26 L55 26 Z" fill="${s.hair}" />`;
    }

    // Shoulders & collar
    let torso = `<path d="M22 120 Q28 90 60 90 Q92 90 98 120 Z" fill="${s.collar}" />`;
    if (s.extra === 'halfSuit') {
      torso = `<path d="M22 120 Q28 90 60 90 L60 120 Z" fill="#18181b" /><path d="M60 90 Q92 90 98 120 L60 120 Z" fill="#f8fafc" />`;
    } else if (s.extra === 'tie') {
      torso += `<polygon points="56,92 64,92 62,118 58,118" fill="#facc15" />`;
    } else if (s.extra === 'suitTie') {
      torso += `<polygon points="56,92 64,92 62,118 58,118" fill="#f8fafc" />`;
    }

    // Head base
    const head = `
      <rect x="51" y="76" width="18" height="20" rx="6" fill="${s.skin}" />
      <ellipse cx="60" cy="56" rx="28" ry="30" fill="${s.skin}" />
    `;

    // Front Hair
    let frontHair = '';
    switch (s.hairStyle) {
      case 'spikyUp':
        frontHair = `<path d="M30 48 L24 28 L38 32 L42 14 L56 26 L66 10 L74 26 L88 18 L84 34 L96 32 L88 48 Q74 36 60 37 Q44 36 30 48 Z" fill="${s.hair}" />`;
        break;
      case 'slickBack':
        frontHair = `<path d="M31 46 L26 24 L42 30 L50 14 L60 26 L72 14 L78 30 L94 24 L89 46 Q74 32 60 33 Q46 32 31 46 Z" fill="${s.hair}" />`;
        break;
      case 'urchin':
        frontHair = `<path d="M28 52 L16 38 L32 36 L26 16 L46 26 L58 8 L70 26 L90 14 L84 36 L102 38 L88 52 L74 38 L62 48 L52 38 L40 48 Z" fill="${s.hair}" />`;
        break;
      case 'undercut':
        frontHair = `<path d="M30 48 Q32 22 60 22 Q88 22 90 48 L82 44 L76 34 L66 44 L60 32 L52 44 L44 34 L36 44 Z" fill="${s.hair}" />`;
        break;
      case 'parted':
        frontHair = `<path d="M30 50 Q32 22 60 22 Q88 22 90 50 Q78 34 62 42 Q46 34 30 50 Z" fill="${s.hair}" />`;
        break;
      case 'sevenThree':
        frontHair = `<path d="M30 48 Q32 22 62 22 Q88 24 90 48 Q70 30 34 46 Z" fill="${s.hair}" />`;
        break;
      case 'bunStrand':
        frontHair = `<path d="M32 48 Q34 24 60 24 Q86 24 88 48 Q74 32 60 34 Q46 32 32 48 Z" fill="${s.hair}" /><path d="M58 28 Q64 46 56 54" stroke="${s.hair}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        break;
      case 'slantBangs':
        frontHair = `<path d="M31 50 Q32 22 60 22 Q88 22 89 50 L80 42 L70 38 L58 44 L46 46 L36 48 Z" fill="${s.hair}" />`;
        break;
      case 'volcano':
        frontHair = `<path d="M34 34 L44 12 L76 12 L86 34 Z" fill="#475569" /><ellipse cx="60" cy="12" rx="16" ry="5" fill="#ea580c" /><circle cx="54" cy="7" r="4" fill="#fb923c" /><circle cx="67" cy="8" r="3.5" fill="#facc15" />`;
        break;
      default:
        frontHair = `<path d="M30 48 Q32 22 60 22 Q88 22 90 48 L82 40 L70 36 L60 44 L48 36 L38 42 Z" fill="${s.hair}" />`;
    }

    // Eyes
    let eyes = '';
    if (s.eyes === 'blindfold') {
      eyes = `<rect x="31" y="44" width="58" height="16" rx="4" fill="#0f172a" />
              <circle cx="47" cy="52" r="4" fill="#38bdf8" opacity="0.55" />
              <circle cx="73" cy="52" r="4" fill="#38bdf8" opacity="0.55" />`;
    } else if (s.eyes === 'sixeyes') {
      eyes = `<circle cx="47" cy="54" r="5" fill="#38bdf8" /><circle cx="47" cy="54" r="2.2" fill="#e0f2fe" />
              <circle cx="73" cy="54" r="5" fill="#38bdf8" /><circle cx="73" cy="54" r="2.2" fill="#e0f2fe" />`;
    } else if (s.eyes === 'sukuna4') {
      eyes = `<ellipse cx="47" cy="53" rx="5" ry="3.5" fill="#ef4444" /><circle cx="47" cy="53" r="1.8" fill="#000" />
              <ellipse cx="73" cy="53" rx="5" ry="3.5" fill="#ef4444" /><circle cx="73" cy="53" r="1.8" fill="#000" />
              <ellipse cx="44" cy="61" rx="3.5" ry="2" fill="#ef4444" /><ellipse cx="76" cy="61" rx="3.5" ry="2" fill="#ef4444" />`;
    } else if (s.eyes === 'cyclops') {
      eyes = `<circle cx="60" cy="52" r="12" fill="#fef3c7" stroke="#0f172a" stroke-width="2" />
              <circle cx="60" cy="52" r="5.5" fill="#0f172a" />`;
    } else if (s.eyes === 'goggles') {
      eyes = `<circle cx="47" cy="54" r="7.5" fill="#14532d" stroke="#1e293b" stroke-width="2.5" />
              <circle cx="73" cy="54" r="7.5" fill="#14532d" stroke="#1e293b" stroke-width="2.5" />
              <line x1="54.5" y1="54" x2="65.5" y2="54" stroke="#1e293b" stroke-width="2.5" />`;
    } else if (s.eyes === 'glassesRed') {
      eyes = `<ellipse cx="47" cy="54" rx="8" ry="5.5" fill="#0f766e" fill-opacity="0.3" stroke="#ef4444" stroke-width="2" />
              <ellipse cx="73" cy="54" rx="8" ry="5.5" fill="#0f766e" fill-opacity="0.3" stroke="#ef4444" stroke-width="2" />
              <line x1="55" y1="54" x2="65" y2="54" stroke="#ef4444" stroke-width="2" />
              <circle cx="47" cy="54" r="2.2" fill="#0f172a" /><circle cx="73" cy="54" r="2.2" fill="#0f172a" />`;
    } else if (s.eyes === 'squareGlasses') {
      eyes = `<rect x="38" y="49" width="16" height="10" rx="2" fill="none" stroke="#0f172a" stroke-width="2" />
              <rect x="66" y="49" width="16" height="10" rx="2" fill="none" stroke="#0f172a" stroke-width="2" />
              <line x1="54" y1="54" x2="66" y2="54" stroke="#0f172a" stroke-width="2" />
              <circle cx="46" cy="54" r="2" fill="#0f172a" /><circle cx="74" cy="54" r="2" fill="#0f172a" />`;
    } else if (s.eyes === 'heterochromia') {
      eyes = `<circle cx="47" cy="54" r="4.2" fill="#3b82f6" /><circle cx="47" cy="54" r="1.8" fill="#0f172a" />
              <circle cx="73" cy="54" r="4.2" fill="#94a3b8" /><circle cx="73" cy="54" r="1.8" fill="#0f172a" />`;
    } else {
      const eyeColor = s.eyes === 'warmAmber' ? '#d97706'
        : s.eyes === 'sharpGreen' ? '#10b981'
        : s.eyes === 'coolTeal' ? '#0284c7'
        : s.eyes === 'cyanSharp' ? '#06b6d4'
        : s.eyes === 'kindBlue' ? '#38bdf8'
        : '#334155';
      eyes = `<circle cx="47" cy="54" r="4.2" fill="${eyeColor}" /><circle cx="47" cy="54" r="1.8" fill="#0f172a" />
              <circle cx="73" cy="54" r="4.2" fill="${eyeColor}" /><circle cx="73" cy="54" r="1.8" fill="#0f172a" />`;
      if (s.eyes === 'eyebags') {
        eyes += `<path d="M41 59 Q47 62 53 59" stroke="#64748b" stroke-width="1.5" fill="none" />
                 <path d="M67 59 Q73 62 79 59" stroke="#64748b" stroke-width="1.5" fill="none" />`;
      }
    }

    // Extra markings & expressions
    let markings = `<path d="M53 71 Q60 75 67 71" stroke="#7c2d12" stroke-width="2" fill="none" stroke-linecap="round" />`;
    if (s.extra === 'tattoos') {
      markings += `
        <path d="M36 44 Q44 40 48 44 M72 44 Q76 40 84 44" stroke="#18181b" stroke-width="2.5" fill="none" />
        <path d="M40 66 L48 70 M80 66 L72 70" stroke="#18181b" stroke-width="2.2" />
      `;
    } else if (s.extra === 'lipScar') {
      markings += `<path d="M68 68 L74 75" stroke="#9f1239" stroke-width="2.2" stroke-linecap="round" />`;
    } else if (s.extra === 'eyeSlits') {
      markings += `<path d="M44 60 L50 62 M76 60 L70 62" stroke="#18181b" stroke-width="2" stroke-linecap="round" />`;
    } else if (s.extra === 'faceScar') {
      markings += `<path d="M39 48 L43 72" stroke="#9f1239" stroke-width="2.2" stroke-linecap="round" />`;
    } else if (s.extra === 'foreheadStitches') {
      markings += `<path d="M36 39 Q60 37 84 39" stroke="#18181b" stroke-width="2" fill="none" />
                   <path d="M44 35 V43 M54 35 V43 M66 35 V43 M76 35 V43" stroke="#18181b" stroke-width="1.8" />`;
    } else if (s.extra === 'noseStripe') {
      markings += `<rect x="44" y="61" width="32" height="5" rx="2" fill="#18181b" />`;
    } else if (s.extra === 'thunderCheeks') {
      markings += `<path d="M38 61 L44 64 L41 68 M82 61 L76 64 L79 68" stroke="#9333ea" stroke-width="2" fill="none" />`;
    } else if (s.extra === 'mahitoStitches') {
      markings += `<path d="M38 56 Q60 66 82 56" stroke="#334155" stroke-width="1.6" stroke-dasharray="3 3" fill="none" />
                   <path d="M60 34 V82" stroke="#334155" stroke-width="1.4" stroke-dasharray="3 3" />`;
    } else if (s.extra === 'cut25') {
      markings += `<line x1="20" y1="92" x2="100" y2="92" stroke="#f43f5e" stroke-width="3" stroke-dasharray="6 4" />`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${s.bg1}"/>
          <stop offset="100%" stop-color="${s.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="url(#${gradId})"/>
      <circle cx="60" cy="60" r="52" fill="none" stroke="${s.accent}" stroke-width="2.5" stroke-opacity="0.45"/>
      ${backHair}
      ${torso}
      ${head}
      ${eyes}
      ${markings}
      ${frontHair}
    </svg>`;
  }

  const imageCache = {};

  function getAvatarDataUrl(charKey) {
    const svg = buildAvatarSvg(charKey);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function preloadAllAvatars(onAllLoaded) {
    const keys = Object.keys(AVATAR_SPECS);
    let remaining = keys.length;
    keys.forEach(key => {
      const img = new Image();
      img.onload = img.onerror = () => {
        remaining--;
        if (remaining <= 0 && typeof onAllLoaded === 'function') onAllLoaded();
      };
      img.src = getAvatarDataUrl(key);
      imageCache[key] = img;
    });
  }

  function getAvatarImage(charKey) {
    if (imageCache[charKey]) return imageCache[charKey];
    const img = new Image();
    img.src = getAvatarDataUrl(charKey);
    imageCache[charKey] = img;
    return img;
  }

  global.JJK_AVATARS = {
    AVATAR_SPECS,
    buildAvatarSvg,
    getAvatarDataUrl,
    getAvatarImage,
    preloadAllAvatars
  };
})(window);
