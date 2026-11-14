(function (global) {
  'use strict';

  var TWO_PI = Math.PI * 2;
  var POINTER_ANGLE = -Math.PI / 2; // 12点钟方向

  function normalizeAngle(rad) {
    var r = rad % TWO_PI;
    return r < 0 ? r + TWO_PI : r;
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function createWheel(canvas, onTickLabel, onSpinFinish) {
    var ctx = canvas.getContext('2d');
    var layoutSlices = [];
    var currentRotation = 0;
    var spinning = false;
    var rafId = null;
    var winnerIndices = [];
    var activeSpinState = null;
    var pointerCount = 1;

    function getPointerAngles(count) {
      var n = Math.max(1, Math.min(3, count || 1));
      var res = [POINTER_ANGLE];
      for (var i = 1; i < n; i++) {
        res.push(POINTER_ANGLE + (i * TWO_PI) / n);
      }
      return res;
    }

    function setPointerCount(n) {
      pointerCount = Math.max(1, Math.min(3, parseInt(n, 10) || 1));
      draw();
    }

    function setSlices(rawSlices) {
      winnerIndices = [];
      var totalWeight = rawSlices.reduce(function (sum, s) {
        return sum + Math.max(0.5, Number(s.weight) || 1);
      }, 0);

      var acc = 0;
      layoutSlices = rawSlices.map(function (s, idx) {
        var w = Math.max(0.5, Number(s.weight) || 1);
        var span = (w / totalWeight) * TWO_PI;
        var item = {
          index: idx,
          raw: s,
          label: String(s.label || ''),
          color: s.color || '#ef5d58',
          weight: w,
          pct: (w / totalWeight) * 100,
          startAngle: acc,
          endAngle: acc + span,
          span: span
        };
        acc += span;
        return item;
      });
      draw();
    }

    function getSliceAtAngle(rot, angle) {
      if (!layoutSlices.length) return null;
      var rel = normalizeAngle(angle - rot);
      for (var i = 0; i < layoutSlices.length; i++) {
        var s = layoutSlices[i];
        if (rel >= s.startAngle && rel < s.endAngle) {
          return s;
        }
      }
      return layoutSlices[layoutSlices.length - 1];
    }

    function getSliceAtRotation(rot) {
      return getSliceAtAngle(rot, POINTER_ANGLE);
    }

    function getAllSlicesAtRotation(rot) {
      var angles = getPointerAngles(pointerCount);
      return angles.map(function (ang) { return getSliceAtAngle(rot, ang); }).filter(Boolean);
    }

    function drawExtraPointers(cx, cy, hubRadius) {
      if (pointerCount <= 1) return;
      var angles = getPointerAngles(pointerCount);
      for (var k = 1; k < angles.length; k++) {
        var ang = angles[k];
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -(hubRadius + 16));
        ctx.lineTo(-9, -(hubRadius - 2));
        ctx.lineTo(9, -(hubRadius - 2));
        ctx.closePath();
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      var cx = w / 2;
      var cy = h / 2;
      var radius = Math.min(cx, cy) - 4;
      var hubRadius = radius * 0.23;

      ctx.clearRect(0, 0, w, h);
      if (!layoutSlices.length) return;

      for (var i = 0; i < layoutSlices.length; i++) {
        var s = layoutSlices[i];
        var start = s.startAngle + currentRotation;
        var end = s.endAngle + currentRotation;
        var mid = (start + end) / 2;

        ctx.save();
        if (winnerIndices.length > 0 && winnerIndices.indexOf(i) === -1) {
          ctx.globalAlpha = 0.36;
        }
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();

        // 径向文字
        var textDist = (radius + hubRadius) * 0.54;
        var availLen = (radius - hubRadius) * 0.78;
        ctx.translate(cx, cy);
        var flipLeft = Math.cos(mid) < 0;
        ctx.rotate(flipLeft ? mid + Math.PI : mid);

        var arcPixels = Math.sin(Math.min(s.span, 1.2) / 2) * textDist * 2;
        var fontSize = Math.round(Math.max(14, Math.min(24, arcPixels * 0.54)));
        if (s.label.length >= 8) {
          fontSize = Math.min(fontSize, 18);
        }
        if (s.span < 0.22) {
          fontSize = Math.min(fontSize, 13);
        }

        ctx.font = '700 ' + fontSize + 'px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var label = s.label;
        while (label.length > 2 && ctx.measureText(label).width > availLen) {
          label = label.slice(0, -1);
        }
        if (label !== s.label && label.length >= 2) {
          label = label.slice(0, -1) + '…';
        }

        var tx = flipLeft ? -textDist : textDist;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 3;
        ctx.fillText(label, tx, 0);
        ctx.restore();
      }

      drawExtraPointers(cx, cy, hubRadius);
    }

    function pickWeightedSliceIndex() {
      var total = layoutSlices.reduce(function (sum, s) { return sum + s.weight; }, 0);
      var r = Math.random() * total;
      var acc = 0;
      for (var i = 0; i < layoutSlices.length; i++) {
        acc += layoutSlices[i].weight;
        if (r <= acc) return i;
      }
      return layoutSlices.length - 1;
    }

    function finalizeActiveSpin() {
      if (!activeSpinState) return;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      currentRotation = activeSpinState.endRot;
      var landedAll = getAllSlicesAtRotation(currentRotation);
      var primary = landedAll[0] || activeSpinState.targetSlice;
      winnerIndices = landedAll.map(function (s) { return s.index; });
      spinning = false;
      activeSpinState = null;
      draw();
      if (typeof onTickLabel === 'function') {
        onTickLabel(landedAll.length > 1
          ? landedAll.map(function (x) { return x.label; }).join(' ＋ ')
          : primary.label);
      }
      if (typeof onSpinFinish === 'function') {
        onSpinFinish(primary.raw, landedAll.map(function (x) { return x.raw; }));
      }
    }

    function spin(durationSec) {
      if (spinning || !layoutSlices.length) return false;
      spinning = true;
      winnerIndices = [];

      var sec = Math.max(0.1, Number(durationSec) || 1.5);
      var targetIdx = pickWeightedSliceIndex();
      var slice = layoutSlices[targetIdx];
      var margin = Math.min(slice.span * 0.18, 0.08);
      var relTarget = slice.startAngle + margin + Math.random() * Math.max(0.01, slice.span - margin * 2);

      var baseNeeded = normalizeAngle(POINTER_ANGLE - relTarget);
      var curNorm = normalizeAngle(currentRotation);
      var deltaMod = normalizeAngle(baseNeeded - curNorm);

      // 旋转圈数按时长等比例自然变化（0.2s ~ 8.0s）
      var spins = Math.max(1, Math.min(16, Math.round(sec * 2.2)));
      var totalDelta = spins * TWO_PI + deltaMod;

      var startRot = currentRotation;
      var endRot = startRot + totalDelta;
      var durationMs = Math.max(100, sec * 1000);
      var startTime = performance.now();
      var lastReportedLabel = '';

      activeSpinState = {
        endRot: endRot,
        targetSlice: slice
      };

      function frame(now) {
        if (!spinning) return;
        var elapsed = now - startTime;
        var t = Math.min(1, elapsed / durationMs);
        var eased = easeOutQuart(t);
        currentRotation = startRot + totalDelta * eased;

        var curSlice = getSliceAtRotation(currentRotation);
        if (curSlice && curSlice.label !== lastReportedLabel) {
          lastReportedLabel = curSlice.label;
          if (typeof onTickLabel === 'function') {
            onTickLabel(curSlice.label);
          }
        }

        draw();

        if (t < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          finalizeActiveSpin();
        }
      }

      rafId = requestAnimationFrame(frame);
      return true;
    }

    function snapToFinish() {
      if (!spinning || !activeSpinState) return false;
      finalizeActiveSpin();
      return true;
    }

    function cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      spinning = false;
      activeSpinState = null;
      winnerIndices = [];
    }

    function isSpinning() {
      return spinning;
    }

    return {
      setSlices: setSlices,
      setPointerCount: setPointerCount,
      spin: spin,
      snapToFinish: snapToFinish,
      cancel: cancel,
      isSpinning: isSpinning,
      getSlices: function () { return layoutSlices; }
    };
  }

  global.JJK_OMEGA_WHEEL = {
    createWheel: createWheel
  };
})(window);
