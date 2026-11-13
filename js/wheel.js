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
    var winnerIndex = null;

    function setSlices(rawSlices) {
      winnerIndex = null;
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

    function getSliceAtRotation(rot) {
      if (!layoutSlices.length) return null;
      var rel = normalizeAngle(POINTER_ANGLE - rot);
      for (var i = 0; i < layoutSlices.length; i++) {
        var s = layoutSlices[i];
        if (rel >= s.startAngle && rel < s.endAngle) {
          return s;
        }
      }
      return layoutSlices[layoutSlices.length - 1];
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      var cx = w / 2;
      var cy = h / 2;
      var radius = Math.min(cx, cy) - 4;
      var hubRadius = radius * 0.235;

      ctx.clearRect(0, 0, w, h);
      if (!layoutSlices.length) return;

      for (var i = 0; i < layoutSlices.length; i++) {
        var s = layoutSlices[i];
        var start = s.startAngle + currentRotation;
        var end = s.endAngle + currentRotation;
        var mid = (start + end) / 2;

        ctx.save();
        if (winnerIndex !== null && winnerIndex !== i) {
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

        // 径向文字绘制
        var textDist = (radius + hubRadius) * 0.54;
        var availLen = (radius - hubRadius) * 0.78;
        ctx.translate(cx, cy);
        var flipLeft = Math.cos(mid) < 0;
        ctx.rotate(flipLeft ? mid + Math.PI : mid);

        var arcPixels = Math.sin(Math.min(s.span, 1.2) / 2) * textDist * 2;
        var fontSize = Math.round(Math.max(15, Math.min(25, arcPixels * 0.55)));
        if (s.label.length >= 9) {
          fontSize = Math.min(fontSize, 19);
        }
        if (s.span < 0.2) {
          fontSize = Math.min(fontSize, 14);
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
        ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
        ctx.shadowBlur = 3;
        ctx.fillText(label, tx, 0);
        ctx.restore();
      }
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

    function spin(durationSec) {
      if (spinning || !layoutSlices.length) return false;
      spinning = true;
      winnerIndex = null;

      var targetIdx = pickWeightedSliceIndex();
      var slice = layoutSlices[targetIdx];
      var margin = Math.min(slice.span * 0.18, 0.08);
      var relTarget = slice.startAngle + margin + Math.random() * Math.max(0.01, slice.span - margin * 2);

      var baseNeeded = normalizeAngle(POINTER_ANGLE - relTarget);
      var curNorm = normalizeAngle(currentRotation);
      var deltaMod = normalizeAngle(baseNeeded - curNorm);
      var spins = durationSec >= 2.0 ? 7 : 5;
      var totalDelta = spins * TWO_PI + deltaMod;

      var startRot = currentRotation;
      var endRot = startRot + totalDelta;
      var durationMs = Math.max(450, (Number(durationSec) || 1.2) * 1000);
      var startTime = performance.now();
      var lastReportedLabel = '';

      function frame(now) {
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
          currentRotation = endRot;
          var landed = getSliceAtRotation(currentRotation) || slice;
          winnerIndex = landed.index;
          spinning = false;
          rafId = null;
          draw();
          if (typeof onSpinFinish === 'function') {
            onSpinFinish(landed.raw);
          }
        }
      }

      rafId = requestAnimationFrame(frame);
      return true;
    }

    function cancel() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      spinning = false;
      winnerIndex = null;
    }

    function isSpinning() {
      return spinning;
    }

    return {
      setSlices: setSlices,
      spin: spin,
      cancel: cancel,
      isSpinning: isSpinning,
      getSlices: function () { return layoutSlices; }
    };
  }

  global.JJK_OMEGA_WHEEL = {
    createWheel: createWheel
  };
})(window);
