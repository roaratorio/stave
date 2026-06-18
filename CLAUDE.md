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

`fft.analyze()` is called **once per frame** and the result stored in `currentSpectrum`. This single array is passed as an argument to all analysis functions — do not call `fft.analyze()` again inside helper functions.

The pipeline:
1. `calculateSpectralFlux(currentSpectrum, previousSpectrum)` → per-frame change → `fluxHistory`
2. Onset detection: sudden flux spike → `transientEnergy` (decays ×0.9/frame)
3. `normalizeVarianceLogarithmic()` → `scaledVariance`
4. `assessStability()` → debounced (5 consecutive frames) → `isStable` flag
5. `updateWindMultiplierBasedOnStability()` → **owns `windMulti`** — nothing else should write to it
6. `evaluateHarmonicContent(currentSpectrum)` → `combinedFactorGlobal` (spread × peaks)
7. `evaluateAudioProperties(currentSpectrum)` → raw `noisinessScore`

### Noisiness scaling and timbral calibration

`noisinessScore` (0–1 composite of flatness, peak count, spread) is remapped to `scaledNoisiness` before driving `staticVector.y`. If timbral calibration has been done, the calibrated instrument-specific range is used:

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
- `staticVector` — x driven by smoothed audio stability; y driven by smoothed `scaledNoisiness`
- Their distance drives `tension` (0–1); `tension` is a **global** computed each frame in `draw()` before `calculateWind()` is called
- `rectWidth` (progress bar) tracks the 8-minute arc

The decay curve formula: `movingVector.y = height - (a * exp(-b * (x - startX) / 10))` where `a=400`, `b=0.03`, `startX=100`, `endX=1050`.

### Note head spawning (dandelion effect)

Notes spawn when volume exceeds `_spawnThreshold` (adaptive). Spawn rate and initial velocity scale with `tensionBonus` — when near the sweet spot, notes burst off the stave like dandelion spores:

- Max 4 boxes at any time (capped at 0 during outro)
- `tensionBonus = pow(max(0, tension - 0.5) * 2, 1.5)` — rises sharply above tension 0.5
- At high tension: shorter spawn interval, initial scatter velocity applied via `Body.setVelocity()`
- Spawn x-position is log-mapped from spectral centroid (low pitch = left, high = right)

### Calibration

Four-phase sequence, triggered by the Calibrate button (visible after Start Audio):

| Phase | Duration | What is measured |
|---|---|---|
| Silence | 3s | Amplitude noise floor → `noiseFloor` |
| Play normally | 5s | Amplitude peak → `calibratedPeak` |
| Noisy texture | 5s | `noisinessScore` at max complexity → `calNoisyScore` |
| Pure tone | 5s | `noisinessScore` at max purity → `calPureScore` |

After calibration, adaptive thresholds are set on `window._spawnThreshold`, `window._onsetThreshold`, `window._stabilityAmpMin`. All values are saved in localStorage and restored on next load. Slider positions are also saved automatically.

### Outro

When `transitionFactor` reaches 1 (8 minutes), `outroStarted = true` and `outroFactor` ramps from 0→1 over 30 seconds. This fades wind to zero and stops note spawning. Existing notes fall and fade naturally under gravity.

### Physics world

Five stave lines, each a chain of `Particle` bodies connected by Matter.js `Constraint` objects. Lines are differentiated by frequency band: line 1 (top) responds to high frequencies via `getBandEnergy(currentSpectrum, 4)`, line 5 (bottom) to low via `getBandEnergy(currentSpectrum, 0)`. Line stroke weights taper from 1.0px (top) to 2.0px (bottom).

`Box` note heads spawn at x derived from spectral centroid. When boxes are removed from `boxes[]`, `Composite.remove(world, box.body)` must also be called to clean up the physics world.

### Bass clef pendulum

`clef()` in `sketch.js` is a physics pendulum. `clefAngle`/`clefAngularVelocity` are global state. Mic level shifts the equilibrium angle; `transientEnergy` provides onset kicks. The pivot is at the top of the image (`pos.y - size/2`).

### Performance mode

`isPerformanceMode` (global) hides the entire `#controls` div and the practice HUD (mic meter, stability dot) when true. The progress bar remains visible. Toggled by the "Performance Mode (H)" button or the `H` key.

### Key globals and ownership rules

- `windMulti` — owned exclusively by `updateWindMultiplierBasedOnStability()`; never assign elsewhere
- `tension` — owned by `draw()`; computed from `normalizedDistance` each frame before `calculateWind()`
- `outroFactor` — owned by `draw()`; read by `calculateWind()`; do not compute elsewhere
- `transientEnergy` — set by onset detection in `draw()`, decays each frame; used by wind and clef
- `isStable` — debounced stability flag; requires 5 consecutive stable frames to enter stable state
- `scaledVariance` — set as a side-effect inside `normalizeVarianceLogarithmic()`
- `combinedFactorGlobal` — spread + peak count combined factor; used elsewhere in wind logic
- `isPerformanceMode` — toggled by `toggleControls()`; gates HUD drawing in `draw()`
