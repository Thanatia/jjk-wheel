(function (global) {
  'use strict';

  var DATA = global.JJK_OMEGA_DATA;
  var ENGINE = global.JJK_OMEGA_ENGINE;

  function buildRadarSvg(char, includeReputation) {
    var keys = [
      { key: 'taijutsu', label: '体术' },
      { key: 'body', label: '体质' },
      { key: 'ceTotal', label: '咒力' },
      { key: 'ceControl', label: '操纵' },
      { key: 'ceEfficiency', label: '效率' },
      { key: 'iq', label: '智力' },
      { key: 'talent', label: '天赋' },
      { key: 'looks', label: '颜值' },
      { key: 'morality', label: '道德' }
    ];
    if (includeReputation) {
      keys.push({ key: 'reputation', label: '声望' });
    }

    var n = keys.length;
    var size = 310;
    var cx = size / 2;
    var cy = size / 2;
    var maxR = 96;
    var maxScale = 12;

    var gridHtml = '';
    var rings = [0.25, 0.5, 0.75, 1];
    for (var r = 0; r < rings.length; r++) {
      var ringPts = [];
      for (var i = 0; i < n; i++) {
        var ang = -Math.PI / 2 + (i * Math.PI * 2) / n;
        var rad = maxR * rings[r];
        ringPts.push((cx + rad * Math.cos(ang)).toFixed(1) + ',' + (cy + rad * Math.sin(ang)).toFixed(1));
      }
      gridHtml += '<polygon points="' + ringPts.join(' ') + '" fill="none" stroke="#e5e7eb" stroke-width="1.2" />';
    }

    var axisHtml = '';
    var dataPts = [];
    var dotsHtml = '';
    var labelHtml = '';

    for (var k = 0; k < n; k++) {
      var angle = -Math.PI / 2 + (k * Math.PI * 2) / n;
      var cosA = Math.cos(angle);
      var sinA = Math.sin(angle);
      var xEnd = cx + maxR * cosA;
      var yEnd = cy + maxR * sinA;
      axisHtml += '<line x1="' + cx + '" y1="' + cy + '" x2="' + xEnd.toFixed(1) + '" y2="' + yEnd.toFixed(1) + '" stroke="#e5e7eb" stroke-width="1" />';

      var val = Math.min(maxScale, Math.max(0.5, Number(char.attrs[keys[k].key]) || 0));
      var rVal = (val / maxScale) * maxR;
      var px = cx + rVal * cosA;
      var py = cy + rVal * sinA;
      dataPts.push(px.toFixed(1) + ',' + py.toFixed(1));
      dotsHtml += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="3.6" fill="#b91c1c" stroke="#ffffff" stroke-width="1.2" />';

      var lx = cx + (maxR + 24) * cosA;
      var ly = cy + (maxR + 22) * sinA;
      var anchor = cosA > 0.25 ? 'start' : cosA < -0.25 ? 'end' : 'middle';
      var rankCode = ENGINE.getRankMeta(char.attrs[keys[k].key]).code;
      labelHtml += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="' + anchor + '" font-size="11.5" font-weight="700" fill="#374151">' + keys[k].label + ' ' + rankCode + '</text>';
    }

    var polyHtml = '<polygon points="' + dataPts.join(' ') + '" fill="rgba(185, 28, 28, 0.22)" stroke="#b91c1c" stroke-width="2.2" />';

    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="290" height="290" role="img" aria-label="人物能力雷达图">' +
      gridHtml + axisHtml + polyHtml + dotsHtml + labelHtml +
      '</svg>';
  }

  function renderRadarChips(char, includeReputation) {
    var keys = ['taijutsu', 'body', 'ceTotal', 'ceControl', 'ceEfficiency', 'iq', 'talent', 'looks', 'morality'];
    if (includeReputation) keys.push('reputation');
    var html = '';
    for (var i = 0; i < DATA.ATTRIBUTE_DEFS.length; i++) {
      var def = DATA.ATTRIBUTE_DEFS[i];
      if (keys.indexOf(def.key) === -1) continue;
      var lv = char.attrs[def.key];
      html += '<span class="radar-stat-chip">' + def.name + ' ' + ENGINE.getRankMeta(lv).code + '(' + lv + ')</span>';
    }
    return html;
  }

  global.JJK_OMEGA_RADAR = {
    buildRadarSvg: buildRadarSvg,
    renderRadarChips: renderRadarChips
  };
})(window);
