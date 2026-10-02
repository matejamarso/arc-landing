/*
  Interface sounds, synthesised with the Web Audio API so there are no audio files to load.
  Every sound is one or two short, quiet sine blips.

  Browsers only allow sound after the visitor has clicked, tapped or pressed a key once,
  so nothing plays (and nothing is created) before that first interaction.
*/
(function () {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var master = null;
  var lastPlayed = {};

  // A short pitched blip: quick attack, pitch glides from `from` to `to`, exponential fade.
  function tone(audio, out, t, o) {
    var osc = audio.createOscillator();
    var gain = audio.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.from, t);
    osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack || 0.004));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + o.dur + 0.02);
  }

  // A few percent of random pitch so repeated sounds do not feel mechanical.
  function vary(hz) {
    return hz * (0.97 + Math.random() * 0.06);
  }

  var voices = {
    // Side menu hover: a barely-there high tick.
    "nav-hover": function (audio, out, t) {
      tone(audio, out, t, { from: vary(2100), to: 1700, dur: 0.03, gain: 0.022 });
    },
    // Button hover: a small upward blip, a little warmer than the menu tick.
    "cta-hover": function (audio, out, t) {
      tone(audio, out, t, { from: vary(1180), to: 1420, dur: 0.045, gain: 0.028 });
    },

    // The three below are built from the same light sine blips as the hovers: no low thumps, no noise.

    // Side menu select: the hover tick's answer, a step lower and a touch longer.
    "nav-select": function (audio, out, t) {
      tone(audio, out, t, { from: vary(1650), to: 1240, dur: 0.05, gain: 0.034 });
    },
    // Button select: the hover blip, then a second one a step up. A quick "ti-dip".
    "cta-select": function (audio, out, t) {
      var base = vary(1180);
      tone(audio, out, t, { from: base, to: base * 1.12, dur: 0.038, gain: 0.03 });
      tone(audio, out, t + 0.048, { from: base * 1.33, to: base * 1.6, dur: 0.06, gain: 0.034 });
    },
    // Works row: one soft tick as a new cover takes the frame.
    "work-change": function (audio, out, t) {
      tone(audio, out, t, { from: vary(1520), to: 1180, dur: 0.036, gain: 0.03 });
    },
  };

  function unlock() {
    if (!AudioCtx) return;
    if (!ctx) {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  function play(name, minGapMs) {
    var voice = voices[name];
    if (!voice || !ctx) return; // no interaction yet, so the browser would block it anyway
    var now = performance.now();
    if (now - (lastPlayed[name] || 0) < (minGapMs || 35)) return;
    lastPlayed[name] = now;
    if (ctx.state === "running") {
      voice(ctx, master, ctx.currentTime);
    } else {
      ctx.resume().then(function () {
        voice(ctx, master, ctx.currentTime);
      });
    }
  }

  ["pointerdown", "keydown", "touchstart"].forEach(function (type) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  });

  window.arcSound = { play: play, voices: voices };
})();
