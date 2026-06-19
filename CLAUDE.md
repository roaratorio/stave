# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

There is no build step. Serve the directory over HTTP — browsers block Web Audio API on `file://`:

```bash
python3 -m http.server 8080 --directory /Users/robcasey/Downloads/Undersong
# then open http://localhost:8080
```

The user must click **Start Audio** to trigger the microphone permission prompt before any audio analysis runs. After starting audio, **Calibrate** runs a 4-phase setup sequence (see Calibration below).

## Architecture

**Stave** is a browser-based generative music score that reacts to live microphone input. It has no build system, no modules, and no package manager — all files are plain JS loaded via `<script>` tags in `index.html`. Libraries are loaded from CDN; any local `p5.js` / `p5.sound.min.js` / `matter.min.js` files in the repo are unused.

### Files

| File | Role |
|---|---|
| `sketch.js` | p5.js sketch — `setup()`, `draw()`, all globals, audio analysis pipeline, wind system, calibration |
| `staveLine.js` | `staveLine` class — creates a chain of `Particle` nodes at a given y-position |
| `circle.js` | `Particle` class — a single Matter.js circle body; nodes in each stave line chain |
| `box.js` | `Box` class — musical note head; spawned on audio input, fades and falls under physics |
| `boundary.js` | `Boundary` class — static floor at the bottom of the physics world |

### Audio analysis pipeline (runs every frame in `draw()`)

`fft.analyze()` is called **once per frame** and the result stored in `currentSpectrum`. `fft.getCentroid()` is also called once and cached as `frameCentroid` — do not call either again inside helper functions.

The pipeline:
1. `calculateSpectralFlux(currentSpectrum, previousSpectrum)` → per-frame change → `fluxHistory`
2. Onset detection: sudden flux spike → `transientEnergy` (decays ×0.9/frame)
3. `normalizeVarianceLogarithmic()` → `scaledVariance`
4. `assessStability()` → debounced (5 consecutive frames) → `isStable` flag
5. `updateWindMultiplierBasedOnStability()` → **owns `windMulti`** — nothing else should write to it
6. `evaluateHarmonicContent(currentSpectrum)` → `combinedFactorGlobal` (spread × peaks)
7. `evaluateAudioProperties(currentSpectrum)` → raw `noisinessScore`

### Noisiness scoring and timbral calibration

`noisinessScore` is a weighted composite designed to order sounds as: pure tone < rich harmonics < white noise / breath:

```js
// flatness (Wiener entropy) is the primary noise discriminator (0=tonal, 1=white noise)
// peaks separate pure (few) from rich harmonics (many) within tonal content
// flatness range is 0–1 by definition; no remapping needed
let noisinessScore = 0.55 * normalizedFlatness + 0.25 * normalizedPeaks + 0.20 * normalizedSpread;
```

Peak counting uses a **mean-relative threshold** (`mean(spectrum) × peakAmpThreshold`) so peak count is independent of overall loudness. The "Harmonic Sensitivity" slider maps to a multiplier of mean energy (0.5–8), not an absolute amplitude.

`noisinessScore` is remapped to `scaledNoisiness` before driving `staticVector.y`. If timbral calibration has been done, the calibrated instrument-specific range is used:

```js
if (calNoisyScore > calPureScore + 0.05) {
  scaledNoisiness = constrain(map(noisiness, calPureScore, calNoisyScore, 0, 1), 0, 1);
} else {
  scaledNoisiness = scaleNoisiness(noisiness, 1); // generic fallback
}
```

`calNoisyScore` and `calPureScore` are set during calibration and saved in localStorage.

### Wind system

`calculateWind()` is called **once per frame** and returns `{ originalWind, scaledWind }`. The result is stored in `frameWind` and passed to all apply functions — do not call `calculateWind()` inside `applyForcesAndShowParticles` or `applyForcesAndTorqueToBoxes`.

- `originalWind` (×0.075) → stave line particles, further scaled by per-line frequency band gain
- `scaledWind` (×2) → note head boxes

Wind magnitude uses `tension²` for a sharp sweet-spot response — near-zero when far from target, dramatic when close. The outro fades this to zero over 30 seconds:

```js
let safeWindMulti = lerp(0.0002, MAX_WIND_MULTI, tension * tension) * (1 - outroFactor);
```

### The two tracking vectors

- `movingVector` — travels an **exponential decay curve** over 480 seconds (8 minutes). Starts top-left (noisy zone), decays toward bottom-right (pure/stable zone). Computed from elapsed time each frame — no animation parameter.
- `staticVector` — x driven by `stabilityAccumulator` (leaky integrator); y driven by smoothed `scaledNoisiness`
- Their distance drives `tension` (0–1); `tension` is a **global** computed each frame in `draw()` before `calculateWind()` is called
- `rectWidth` (progress bar) tracks the 8-minute arc

The decay curve formula: `movingVector.y = height - (a * exp(-b * (x - startX) / 10))` where `a=400`, `b=0.03`, `startX=100`, `endX=1050`.

#### staticVector X — leaky integrator

`stabilityAccumulator` (0–1 global) drives `staticVector.x`. It fills when `isStable` is true and drains when false:

```js
if (isStable) {
  stabilityAccumulator = Math.min(1, stabilityAccumulator + 0.0017); // ~10s to reach right
} else {
  stabilityAccumulator = Math.max(0, stabilityAccumulator - 0.004);  // ~4s to drain back left
}
```

This gives the "balloon/breath" feel: sustained stable playing is required to move the dot rightward; once playing stops, it drifts back within a few seconds rather than snapping or lingering.

### Note head spawning (dandelion effect)

Notes spawn when volume exceeds `_spawnThreshold` (adaptive). Spawn rate and initial velocity scale with `tensionBonus` — when near the sweet spot, notes burst off the stave like dandelion spores:

- Max 4 boxes at any time (capped at 0 during outro)
- All note heads render at a consistent size (`this.r = 12`)
- `tensionBonus = pow(max(0, tension - 0.5) * 2, 1.5)` — rises sharply above tension 0.5
- At high tension: shorter spawn interval, initial scatter velocity applied via `Body.setVelocity()`
- Spawn x-position is log-mapped from spectral centroid (low pitch = left, high = right)
- Note head grey level is set from spectral flatness at spawn time (pure tone = dark, noisy = lighter)

### Calibration

Each phase has a **2.5-second lead-in countdown** before sampling begins, giving the performer time to settle. Four phases total:

| Phase | Sample duration | What is measured |
|---|---|---|
| Silence | 3s | Amplitude noise floor → `noiseFloor` |
| Play normally | 5s | Amplitude peak → `calibratedPeak` |
| Noisy texture | 5s | `noisinessScore` at max complexity → `calNoisyScore` |
| Pure tone | 5s | `noisinessScore` at max purity → `calPureScore` |

After calibration, adaptive thresholds are set on `window._spawnThreshold`, `window._onsetThreshold`, `window._stabilityAmpMin`. All values are saved in localStorage and restored on next load. Slider positions are also saved automatically.

Default thresholds are seeded at startup (before localStorage restores) so uncalibrated runs behave consistently.

If the noisy/pure phases don't produce enough contrast (`calNoisyScore ≤ calPureScore + 0.05`), a message is shown for 4 seconds explaining the issue; amplitude calibration still applies.

### Outro

When `transitionFactor` reaches 1 (8 minutes), `outroStarted = true` and `outroFactor` ramps from 0→1 over 30 seconds. This fades wind to zero and stops note spawning. Existing notes fall and fade naturally under gravity.

### Physics world

Five stave lines, each a chain of `Particle` bodies connected by Matter.js `Constraint` objects (stiffness `0.55` — elastic enough to ripple visibly under wind without being floppy). Lines are differentiated by frequency band: line 1 (top) responds to high frequencies via `getBandEnergy(currentSpectrum, 4)`, line 5 (bottom) to low via `getBandEnergy(currentSpectrum, 0)`. All lines render at **1.5px stroke weight** (uniform).

`Box` note heads spawn at x derived from spectral centroid. When boxes are removed from `boxes[]`, `Composite.remove(world, box.body)` must also be called to clean up the physics world.

### Bass clef pendulum

`clef()` in `sketch.js` is a physics pendulum. `clefAngle`/`clefAngularVelocity` are global state. Mic level shifts the equilibrium angle; `transientEnergy` provides onset kicks. The pivot is at the top of the image (`pos.y - size/2`).

### Performance mode

`isPerformanceMode` (global) hides the entire `#controls` div and the practice HUD (mic meter, stability dot) when true. The progress bar remains visible. Toggled by the "Performance Mode (H)" button or the `H` key.

### Vector display (V key)

When `showVectors` is true, the exponential decay curve path is drawn, plus:
- **Tension line** — connects the two dots; alpha (20→200) and stroke weight (0.75→3) scale with `tension`, so it thickens and darkens as the vectors converge. Drawn before the dots so they sit on top. Uses the previous frame's `tension` (computed later in `draw()`) — imperceptible lag.
- **Red dot** (10px, black outline) — `movingVector`, the 8-minute sweet-spot target
- **Green dot** (16px, black outline) — `staticVector`, the performer's current state

### Ambient UI cues

- **Sweet-spot glow** — when `tension > 0.5`, a warm radial vignette (drawn via `drawingContext.createRadialGradient`) gathers at the canvas edges, fading in with tension. Transparent center keeps note heads readable. Drawn in `draw()` regardless of mode, so it rewards the performer in performance mode where the HUD and vectors are hidden.
- **Progress bar** — a thin 5px bar at the bottom; `rectWidth` tracks the 8-minute arc. Over the final ~10% (`arcProgress` 0.9→1.0) it deepens from neutral grey toward a warm tone to telegraph the approaching ending.
- **Scene fade-in** — on Start Audio, `audioStartTime` is set; the scene emerges from the parchment as a fading overlay rect over `SCENE_FADE_IN` (1500ms), drawn last in `draw()`.
- **Practice HUD** — the mic meter and stability dot are grouped: the stability dot sits centered just above the meter top, with a small "MIC" label below.

### Fullscreen

The canvas is a fixed `1150×500` buffer. `updateFullscreenScale()` (bound to `fullscreenchange` / `webkitfullscreenchange`, and called from `windowResized()`) handles fullscreen presentation:

- **Scale to fill** — applies a CSS `transform: scale(min(screenW/1150, screenH/500))` to the canvas element (`canvasEl`), so it fills the screen letterboxed while preserving aspect ratio. The drawing buffer is untouched, so **physics bodies don't move** and p5 maps mouse input correctly through the scaled bounding rect. The transform is cleared on exit. Never call `resizeCanvas()` — it would reposition all physics bodies.
- **Warm dark mat** — the stark white surround (the `<html>`/viewport default) is replaced with a warm dark mat (`#2a2520`) only in fullscreen, so the letterbox bands recede. Applied three ways for robustness: a `.fs-active` class toggled on `<html>`/`<body>`, the `:fullscreen` / `:-webkit-full-screen` + `::backdrop` rules in `style.css` (with `!important` to beat the UA background), and inline `backgroundColor` set from JS on `<html>`/`<body>`/canvas container. The windowed view keeps its white background so the dark control labels stay readable.

### Key globals and ownership rules

- `windMulti` — owned exclusively by `updateWindMultiplierBasedOnStability()`; never assign elsewhere
- `tension` — owned by `draw()`; computed from `normalizedDistance` each frame before `calculateWind()`
- `outroFactor` — owned by `draw()`; read by `calculateWind()`; do not compute elsewhere
- `transientEnergy` — set by onset detection in `draw()`, decays each frame; used by wind and clef
- `isStable` — debounced stability flag; requires 5 consecutive stable frames to enter stable state
- `stabilityAccumulator` — owned by `draw()`; drives `staticVector.x`; do not write elsewhere
- `frameCentroid` — cached by `draw()` after `fft.getCentroid()`; used by all analysis functions
- `scaledVariance` — set as a side-effect inside `normalizeVarianceLogarithmic()`
- `combinedFactorGlobal` — spread + peak count combined factor; used elsewhere in wind logic
- `isPerformanceMode` — toggled by `toggleControls()`; gates HUD drawing in `draw()`
