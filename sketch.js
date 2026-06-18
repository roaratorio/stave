const {
    Engine,
    World,
    Bodies,
    Body,
    Composite,
    Constraint,
    Mouse,
    MouseConstraint
} = Matter;

let engine;
let world;
//create snow..........

let snow = [];
let gravity;
let windSlider;
let peakSlider; //how high to set threshold for counting harmonic peaks
let forceSlider;
let stabilitySlider;
let customSlider; //styled in css file



//............
let particles = [];
//let particles2 = [];
let boundaries = [];
let mConstraint;
let ball;
//let gravity = 0.001; //don't need this
let stringLength;
let increment;
let bounceFactor = -0.5;
let ballForceScale = 0.02;
let windScale = 0.001;
let windXoff = 0;
let windYoff = 0;
let windMulti = 0; //use this global variable to pass fft values (smoothedflatness) into the force calculator
let combinedFactorGlobal = 0; // Initial value for calculation of combined Peak Count and Centroid Spread

let mass;
let incrementalMass = 0.3; // Starting mass
const massIncreaseRate = 0.001; // How much to increase the mass each time
let lastMassUpdateTime = 0; // Last time the mass was updated
const massUpdateInterval = 5000; // Interval to update the mass, e.g., every 5 seconds




let boxes = [];
let lastBoxTime = 0; // Initialize a variable to keep track of the last box creation time
let minBoxInterval = 3000; // Minimum time interval (3 seconds) in milliseconds
let maxBoxInterval = 5000; // Maximum time interval (5 seconds) in milliseconds

//Add a scaling factor to instability readings that go over a certain value. 
let MAX_WIND_MULTI = 0.0060; // Maximum acceptable value for windMulti
const WIND_MULTI_SCALING_FACTOR = 10; // Factor to divide by when exceeding MAX_WIND
let peakAmpThreshold = 5; //This sets the amplituded threshold for counting the harmonic peaks. Controlled with the peakSlider. High value or threshold means less peaks will be counted. 

let stabilityThreshold = 500;

//transition weighting from purer to favouring noisier tones over time
let transitionFactor = 0; // Ranges from 0 (purer tones dominate) to 1 (noisier tones dominate)
let transitionStartTime // Track when the transition starts
let transitionDuration; // Duration of transition from pure to noisy in milliseconds (e.g., 1 minute)


let streetlight;

//part of the clef function
let bassclef;
let clefAngle = 0.08;         // initial small displacement to start it swinging
let clefAngularVelocity = 0;
let size = 70;

//Audio..........................................




let audioIn;
let currentSourceIndex = 0;
let audioInputSources = [];
let isAudioStarted = false;
let fft;
let previousSpectrum = [];
let currentSpectrum = [];
let circleDiameter = 0;

let fluxHistory = []; // To store recent flux values
let maxFluxWindow = 0; // Maximum flux in the current window
let windowDuration = 1500; // Window duration in milliseconds to match varianceCalcInterval
let lastUpdateTime = 0; // Last time the window was updated

let lastVarianceCalcTime = 0; // Last time we calculated variance
let varianceCalcInterval = 1500; // Calculate variance every 1000 milliseconds

let isStable = false; // Global flag indicating stability

let minVariance = Infinity; // Initialize to a high value for min variance tracking
let maxVariance = -Infinity; 
let lastNormalizedVariance = 0; // To store the last calculated normalized variance
let observedMinVariance = Infinity; // To track the minimum observed variance for scaling
let observedMaxVariance = 0; // To track the maximum observed variance for scaling
let scaledVariance = 0;
let rectWidth = 0;

//let stabilityThreshold = 600;
//let peakAmpThreshold = 5;


let stabilityRecords = [];
let avgStability = 0;
let lastStableTime = 0;

let transientEnergy = 0;   // decaying spike triggered by sudden onset
let prevFlux = 0;          // previous frame flux for onset detection
let stableFrameCount = 0;  // consecutive frames below stability threshold

let smoothStaticVectorX = 200; // Initial smoothed value, assuming staticVector starts at x = 200
const smoothingFactor = 0.1; // Smoothing factor, adjust between 0 (no smoothing) and 1 (no change)

let smoothStaticVectorY = 50; // Initial smoothed y-value, adjust if necessary
const smoothingFactorY = 0.1; // Smoothing factor for y, adjust for desired responsiveness

let normalizedDistance;


//................VECTORS.........................

// Constants for the decay function
const a = 400;
const b = 0.03;

// let a = 1;
// let b = 0.05; // Adjust this value to change the curvature of the convex curve
// let movingVector = createVector(50, height - a); // Initialize at the start point of the curve
// let staticVector = createVector(50, height - a); // Same start point

let movingVector;
let staticVector;
let distance;

//toggle visibility of vectors on and off
let showVectors = false;
let toggleVectorsButton;

let startX = 100; //starting and end points for vectors
let startY = 50;
let endX = 1050;
let endY = 50;

let tension = 0;       // 0–1, computed each frame: 1 = vectors close (sweet spot), 0 = far apart
let isPerformanceMode = false;

// Adaptive calibration thresholds
let calibrationState = 'idle'; // 'idle' | 'silence' | 'playing' | 'noisy' | 'pure' | 'done'
let calibrationStartTime = 0;
let noiseFloor = 0.005;
let calibratedPeak = 0.12;
let silenceSamples = [];
let playingSamples = [];
const SILENCE_DURATION = 3000;
const PLAYING_DURATION = 5000;

// Timbral calibration — instrument-specific noise-pure range
let calNoisyScore = 0;    // noisinessScore at max noise during calibration
let calPureScore  = 0;    // noisinessScore at max purity during calibration
let noisySamples  = [];
let pureSamples   = [];
const NOISY_DURATION = 5000;
const PURE_DURATION  = 5000;

// Outro — gradual rest after 8-minute arc completes
let outroStarted = false;
const OUTRO_DURATION = 30000;
let outroStartTime = 0;
let outroFactor = 0; // 0 = normal, 1 = fully at rest

//Create the lines for the stave.................

let line1;
let line2;
let line3;
let line4;
let line5;

let line1Particles = []; // Array to store line1 particles
let line2Particles = []; // Array to store line2 particles
let line3Particles = []; // Array to store line3 particles
let line4Particles = []; // Array to store line4 particles
let line5Particles = []; // Array to store line5 particles

//............................................................


function preload(){
  bassclef = loadImage('bassclef.png');
  // streetlight = loadImage('streetlight.png');
  // streetlight2 = loadImage('streetlight.png');
  // streetlight3 = loadImage('streetlight.png');
  // bassclef.resize(0, 40);
}

function setup() {
    let canvas = createCanvas(1150, 500);
    canvas.parent('canvasContainer');
    //song = loadSound("judith.mp3", loaded);
  
    // Initialize the moving vector further along the x-axis
    // let initialX = 100; // Starting x-coordinate, adjusted to 100 for further along
    // let initialY = a * exp(-b * initialX / 10); // Calculate corresponding y using the decay formula
    // movingVector = createVector(initialX, height - initialY); // Set the correct initial y-position on the canvas
  
//   let initialX = 100; // Starting x-coordinate, adjusted to 100 for further along
//     let initialY = a * pow((initialX - 100), 2) * b; // Calculate corresponding y using the convex function
//     movingVector = createVector(initialX, height - initialY); // Set the correc

//   staticVector = createVector(200, 50); // Static vector position
  
  movingVector = createVector(startX, startY);

    staticVector = createVector(200, 50); // Static vector position
  
     //slider = createSlider(0, 1, 0.5, 0.01);
    audioIn = new p5.AudioIn();
    //audioIn.getSources(gotSources);
    //getAudioInputSources();
  let startAudioButton = select('#startAudioButton');
  startAudioButton.mousePressed(startAudio);
//   let startAudioButton = select('#startAudioButton');
// startAudioButton.mousePressed(getAudioInputSources);
  
    fft = new p5.FFT(0.9, 1024); // FFT(smoothing, size)
    fft.setInput(audioIn);
    w = width / 1024;
  
    transitionStartTime = millis();
    transitionDuration = 480000; //8 minutes

  // Create a button and add an event listener for cycling through sources
  // let button = createButton('Cycle Audio Input');
  // button.parent('controls');
  // button.mousePressed(cycleAudioSource);
  
    let button = select('#cycleAudioButton');
  button.mousePressed(cycleAudioSource);
  
  let toggleButton = select('#toggleControlsButton');
  toggleButton.mousePressed(toggleControls);

  let fsButton = select('#fullscreenButton');
  fsButton.mousePressed(() => {
    let fs = fullscreen();
    fullscreen(!fs);
  });

  let calibrateBtn = select('#calibrateButton');
  if (calibrateBtn) calibrateBtn.mousePressed(startCalibration);


    //windSlider = createSlider(0, 0.0005, 0.0001, 0.0001);
    //windSlider.position(10, height + 10);
  
  
    customSlider = select('#windSlider');
    forceSlider  = select('#forceSlider');
    peakSlider  = select('#peakSlider'); 
    stabilitySlider = select('#stabilitySlider');
    toggleVectorsButton = select('#toggleVectorsButton');
    toggleVectorsButton.mousePressed(toggleVectors);
  
    
    // Listen for the input event on the slider and call a function when it changes
    forceSlider.changed(updateForceValue);
    customSlider.changed(updateSliderValue);
    peakSlider.changed(updatePeakValue);
    stabilitySlider.changed(updateStabilityValue);

    
    // Onboarding overlay — injected into the canvas container, dismissed on audio start
    let container = document.getElementById('canvasContainer');
    let overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.innerHTML = '<p><strong>Stave</strong><br><br>Press <em>Start Audio</em> below<br>and allow microphone access.</p>';
    container.appendChild(overlay);

    lastBoxTime = millis();

    bassclef.resize(0, 83);
    // streetlight.resize(0, 150);
    // streetlight2.resize(0, 120);
    // streetlight3.resize(0, 75);

    engine = Engine.create();

    stringLength = 1206;
    increment = 18; // the increment must be a divisor of stringLength
    world = engine.world;
    mass = 1;
  
  
  //arguments for line are: (y position, length, stiffness, radius)
//     line1 = new staveLine(100, 0, 0.85, 7);
//     line1.createParticlesAndConstraints(line1Particles);
  
//     line2 = new staveLine(115, 0, 0.85, 7);
//     line2.createParticlesAndConstraints(line2Particles);
  
//     line3 = new staveLine(130, 0, 0.85, 7);
//     line3.createParticlesAndConstraints(line3Particles);
  
//     line4 = new staveLine(145, 0, 0.85, 7);
//     line4.createParticlesAndConstraints(line4Particles);
  
//     line5 = new staveLine(160, 0, 0.85, 7);
//     line5.createParticlesAndConstraints(line5Particles);
  
  
    line1 = new staveLine(116, 0, 0.85, 10);
    line1.createParticlesAndConstraints(line1Particles);
  
    line2 = new staveLine(141, 0, 0.85, 10);
    line2.createParticlesAndConstraints(line2Particles);
  
    line3 = new staveLine(166, 0, 0.85, 10);
    line3.createParticlesAndConstraints(line3Particles);
  
    line4 = new staveLine(191, 0, 0.85, 10);
    line4.createParticlesAndConstraints(line4Particles);
  
    line5 = new staveLine(216, 0, 0.85, 10);
    line5.createParticlesAndConstraints(line5Particles);
    
  
  
    boundaries.push(new Boundary(width / 2, 500, width, 20, 0));

    let canvasMouse = Mouse.create(canvas.elt);
    let options = {
        mouse: canvasMouse,
    }

    canvasMouse.pixelRatio = pixelDensity();
    mConstraint = MouseConstraint.create(engine, options);
    World.add(world, mConstraint);
  
  //     for (let flake of snow) {
  //   World.add(world, flake.body);
  // }
  engine.gravity.y = 0.4;

  // Restore slider positions and calibration from previous session
  restoreSavedSliders();
  let savedFloor = parseFloat(localStorage.getItem('stave_noiseFloor'));
  let savedPeak  = parseFloat(localStorage.getItem('stave_calibratedPeak'));
  if (!isNaN(savedFloor) && !isNaN(savedPeak)) {
    noiseFloor = savedFloor;
    calibratedPeak = savedPeak;
    applyCalibration();
  }
  let savedNoisy = parseFloat(localStorage.getItem('stave_calNoisyScore'));
  let savedPure  = parseFloat(localStorage.getItem('stave_calPureScore'));
  if (!isNaN(savedNoisy) && !isNaN(savedPure) && savedNoisy > savedPure + 0.05) {
    calNoisyScore = savedNoisy;
    calPureScore  = savedPure;
  }
}

// function loaded() {
//   song.play();
// }

function toggleVectors() {
    showVectors = !showVectors;
    let toggleVectorsButton = select('#toggleVectorsButton');
    if (showVectors) {
        toggleVectorsButton.removeClass('toggled');
    } else {
        toggleVectorsButton.addClass('toggled');
    }
}

// function toggleControls() {
//     let slidersColumn1 = select('#slidersColumn1');
//     let slidersColumn2 = select('#slidersColumn2');
//     let buttonsColumn = select('#buttonsColumn');
//     let toggleColumn = select('#toggleColumn');
//     let toggleButton = select('#toggleControlsButton');

//     if (slidersColumn1.style('visibility') === 'hidden') {
//         slidersColumn1.style('visibility', 'visible');
//         slidersColumn2.style('visibility', 'visible');
//         buttonsColumn.style('visibility', 'visible');
//         toggleColumn.style('visibility', 'visible');
//         toggleButton.removeClass('toggled');
//     } else {
//         slidersColumn1.style('visibility', 'hidden');
//         slidersColumn2.style('visibility', 'hidden');
//         buttonsColumn.style('visibility', 'hidden');
//         toggleColumn.style('visibility', 'hidden');
//         toggleButton.addClass('toggled');
//     }
// }

function toggleControls() {
    let controls = select('#controls');
    isPerformanceMode = !isPerformanceMode;
    controls.style('display', isPerformanceMode ? 'none' : 'flex');
}



function startAudio() {
  if (!isAudioStarted) {
    getAudioInputSources();
    isAudioStarted = true;
    let overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.style.display = 'none';
    let calBtn = document.getElementById('calibrateButton');
    if (calBtn) calBtn.style.display = 'block';
  }
}

function getAudioInputSources() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Stop the manual stream immediately — it was only needed to trigger
      // the browser permission prompt. p5.sound opens its own stream in start().
      stream.getTracks().forEach(t => t.stop());
      audioIn.getSources(gotSources);
    })
    .catch(err => {
      console.error('Error accessing audio input:', err);
      alert('Please allow microphone access to use this feature.');
    });
}

function gotSources(deviceList){
  audioInputSources = deviceList;

  let sel = document.getElementById('audioSourceSelect');
  if (sel) {
    sel.innerHTML = '';
    deviceList.forEach((device, i) => {
      let opt = document.createElement('option');
      opt.value = i;
      opt.textContent = device.label || ('Input ' + (i + 1));
      sel.appendChild(opt);
    });
    sel.onchange = () => setAudioSource(parseInt(sel.value));
  }

  if (audioInputSources.length > 0) {
    setAudioSource(0);
  }
}

function setAudioSource(index) {
  try { audioIn.stop(); } catch(e) {}

  audioIn.setSource(index);
  audioIn.start();

  // Ensure the Web Audio context is running — browsers suspend it until a gesture
  let ctx = getAudioContext();
  if (ctx && ctx.state !== 'running') {
    ctx.resume();
  }

  fft.setInput(audioIn);
  audioIn.amp(0.5);
}

function cycleAudioSource() {
  if (audioInputSources.length > 1) {
    currentSourceIndex = (currentSourceIndex + 1) % audioInputSources.length;
    setAudioSource(currentSourceIndex);
    updateAudioSourceIndex();
  }
}

function updateAudioSourceIndex() {
  let indexSpan = select('#audioSourceIndex');
  indexSpan.html(currentSourceIndex);
}

// ── Calibration ──────────────────────────────────────────────────────────────

function startCalibration() {
  calibrationState = 'silence';
  calibrationStartTime = millis();
  silenceSamples = [];
  playingSamples = [];
  showCalibrationOverlay('Stay quiet — measuring room noise...', 0);
}

function tickCalibration() {
  if (calibrationState === 'idle' || calibrationState === 'done') return;
  let level = audioIn.getLevel();
  let elapsed = millis() - calibrationStartTime;

  if (calibrationState === 'silence') {
    silenceSamples.push(level);
    updateCalibrationProgress(elapsed / SILENCE_DURATION);
    if (elapsed >= SILENCE_DURATION) {
      let avg = silenceSamples.reduce((a, b) => a + b, 0) / silenceSamples.length;
      noiseFloor = avg * 1.5;
      calibrationState = 'playing';
      calibrationStartTime = millis();
      playingSamples = [];
      showCalibrationOverlay('Now play at your normal performance level...', 0);
    }
  } else if (calibrationState === 'playing') {
    playingSamples.push(level);
    updateCalibrationProgress(elapsed / PLAYING_DURATION);
    if (elapsed >= PLAYING_DURATION) {
      calibratedPeak = Math.max(...playingSamples) * 0.9;
      if (calibratedPeak <= noiseFloor) calibratedPeak = noiseFloor * 4;
      applyCalibration();
      calibrationState = 'noisy';
      calibrationStartTime = millis();
      noisySamples = [];
      showCalibrationOverlay('Play your most complex, irregular texture...', 0);
    }
  } else if (calibrationState === 'noisy') {
    let score = evaluateAudioProperties(currentSpectrum).noisinessScore;
    noisySamples.push(score);
    updateCalibrationProgress(elapsed / NOISY_DURATION);
    if (elapsed >= NOISY_DURATION) {
      calNoisyScore = noisySamples.reduce((a, b) => a + b, 0) / noisySamples.length;
      calibrationState = 'pure';
      calibrationStartTime = millis();
      pureSamples = [];
      showCalibrationOverlay('Now sustain your purest, cleanest tone...', 0);
    }
  } else if (calibrationState === 'pure') {
    let score = evaluateAudioProperties(currentSpectrum).noisinessScore;
    pureSamples.push(score);
    updateCalibrationProgress(elapsed / PURE_DURATION);
    if (elapsed >= PURE_DURATION) {
      calPureScore = pureSamples.reduce((a, b) => a + b, 0) / pureSamples.length;
      if (calNoisyScore > calPureScore + 0.05) applyTimbreCalibration();
      calibrationState = 'done';
      hideCalibrationOverlay();
    }
  }
}

function applyCalibration() {
  let range = Math.max(calibratedPeak - noiseFloor, 0.01);
  window._spawnThreshold  = noiseFloor + range * 0.15;
  window._onsetThreshold  = noiseFloor + range * 0.08;
  window._stabilityAmpMin = noiseFloor + range * 0.05;
  localStorage.setItem('stave_noiseFloor', noiseFloor);
  localStorage.setItem('stave_calibratedPeak', calibratedPeak);
}

function applyTimbreCalibration() {
  localStorage.setItem('stave_calNoisyScore', calNoisyScore);
  localStorage.setItem('stave_calPureScore',  calPureScore);
}

function showCalibrationOverlay(message, progress) {
  let overlay = document.getElementById('calibration-overlay');
  if (!overlay) return;
  document.getElementById('cal-message').textContent = message;
  document.getElementById('cal-bar-fill').style.width = (progress * 100) + '%';
  overlay.style.display = 'flex';
}

function updateCalibrationProgress(progress) {
  let fill = document.getElementById('cal-bar-fill');
  if (fill) fill.style.width = (constrain(progress, 0, 1) * 100) + '%';
}

function hideCalibrationOverlay() {
  let overlay = document.getElementById('calibration-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── Slider persistence ────────────────────────────────────────────────────────

function restoreSavedSliders() {
  let saved = {
    windSlider:      localStorage.getItem('stave_windSlider'),
    forceSlider:     localStorage.getItem('stave_forceSlider'),
    peakSlider:      localStorage.getItem('stave_peakSlider'),
    stabilitySlider: localStorage.getItem('stave_stabilitySlider'),
  };
  if (saved.windSlider !== null)      customSlider.value(saved.windSlider);
  if (saved.forceSlider !== null)     forceSlider.value(saved.forceSlider);
  if (saved.peakSlider !== null)      peakSlider.value(saved.peakSlider);
  if (saved.stabilitySlider !== null) stabilitySlider.value(saved.stabilitySlider);
  updateSliderValue();
  updateForceValue();
  updatePeakValue();
  updateStabilityValue();
}



// Returns energy (0..1) for a log-spaced frequency band within the spectrum.
// bandIndex 0 = lowest, 4 = highest (maps to stave line 5 down to line 1).
function getBandEnergy(spectrum, bandIndex) {
    const totalBands = 5;
    let n = spectrum.length;
    // Log-spaced bin ranges across 0-22050 Hz
    let logMin = Math.log10(20);
    let logMax = Math.log10(22050);
    let logStep = (logMax - logMin) / totalBands;
    let freqLow  = Math.pow(10, logMin + bandIndex * logStep);
    let freqHigh = Math.pow(10, logMin + (bandIndex + 1) * logStep);
    let binLow  = Math.floor(map(freqLow,  0, 22050, 0, n));
    let binHigh = Math.ceil(map(freqHigh, 0, 22050, 0, n));
    binLow  = constrain(binLow,  0, n - 1);
    binHigh = constrain(binHigh, 0, n - 1);
    let sum = 0;
    for (let i = binLow; i <= binHigh; i++) sum += spectrum[i];
    let avg = sum / Math.max(binHigh - binLow + 1, 1);
    return constrain(avg / 255, 0, 1);
}

function normalizeVariance(variance) {
  if (variance < minVariance) minVariance = variance;
  if (variance > maxVariance) maxVariance = variance;
  if (minVariance === maxVariance) return 0;
  return (variance - minVariance) / (maxVariance - minVariance);
}

function calculateSpectralFlux(current, previous) {
  if (previous.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < current.length; i++) {
    let value = (current[i] - previous[i]) ** 2;
    sum += value;
  }
  return sum;
}

function calculateVariance(values) {
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / values.length;
  return variance;
}

function updateObservedRange(variance) {
  observedMinVariance = Math.min(observedMinVariance, variance);
  observedMaxVariance = Math.max(observedMaxVariance, variance);
}

function scaleVariance(value) {
  let range = observedMaxVariance - observedMinVariance;
  if (range === 0) return 0;
  return (value - observedMinVariance) / range;
}

function amplifyVariance(value) {
    // Adjust the scaling factor to make smaller values more distinguishable
    // This is just an example and might need tuning
    // let adjustedValue = (value - observedMinVariance) / (observedMaxVariance - observedMinVariance);
    // return adjustedValue * 2; // Example: stretching the scale by a factor of 2
  return Math.pow(value, 0.5);
}


function normalizeVarianceLogarithmic(variance) {
  // Pre-scaling adjustment (optional, can be tuned or removed based on actual data)
  let preScaledVariance = variance; // Example: could use variance directly or apply pre-scaling
  
  // Apply a logarithmic transformation to the variance, consider changing the base or scaling
  let logVariance = Math.log10(preScaledVariance + 1); // Using base 10 for a different scaling effect

  // Update observed min/max with log-transformed values
  observedMinVariance = Math.min(observedMinVariance, logVariance);
  observedMaxVariance = Math.max(observedMaxVariance, logVariance);

  // Normalize the log-transformed variance between 0 and 1
  let normalizedLogVariance = (logVariance - observedMinVariance) / (observedMaxVariance - observedMinVariance);
  
  // Post-logarithmic scaling to adjust the range to 0.1 - 0.8/0.9
  // This scales and shifts the normalized value into the desired range
  scaledVariance = normalizedLogVariance * 0.9 + 0.0; // Adjust the multiplication and addition factors as needed

  return scaledVariance;
}


function calculateSpectralSpread(spectrum, centroid) {
  let num = 0; // Numerator for the weighted variance
  let den = 0; // Denominator for the weighted variance
  let n = spectrum.length; // Total number of frequency bins
  
  for (let i = 0; i < n; i++) {
    let freq = map(i, 0, n, 0, 22050); // Assuming a sample rate of 44100Hz, map bin index to frequency
    let amplitude = spectrum[i];
    num += amplitude * ((freq - centroid) ** 2); // Weighted sum of squared differences from the centroid
    den += amplitude; // Sum of amplitudes
  }
  //console.log("Spread", den);
  return den > 0 ? sqrt(num / den) : 0; // Return the square root of the weighted variance
}

function calculateSpectralFlatness(spectrum) {
  //changed this to calculate the geometric mean using logarithms to avoid underflow. geoMean was always returning a value of 0 previously
    let sumLog = 0;  // Sum of logarithms for geometric mean calculation
    let sum = 0;     // Sum for arithmetic mean
    let count = spectrum.length;

    const epsilon = 1e-9; // Small constant to prevent log(0)

    // Accumulate the sum of logs and the arithmetic sum
    for (let i = 0; i < count; i++) {
        let value = spectrum[i] + epsilon; // Add epsilon to ensure no zero values in log calculation
        sumLog += Math.log(value); // Log of spectrum value for geometric mean
        sum += value; // Direct sum for arithmetic mean
    }

    // Calculate geometric mean using exponent of the average log
    let geoMean = Math.exp(sumLog / count);
    //console.log("geoMean", geoMean);  // Check the geometric mean value

    // Calculate arithmetic mean
    let arithMean = sum / count;
    //console.log("arithMean", arithMean);  // Check the arithmetic mean value

    // Calculate spectral flatness
    if (arithMean <= epsilon) {
        return 0; // Avoid division by zero or very small denominator
    }
    let spectralFlatness = geoMean / arithMean;
    //console.log("Spectral Flatness", spectralFlatness);  // Log the final spectral flatness value

    return spectralFlatness;
}




function countProminentPeaks(spectrum, threshold) {
    let peaks = 0;
    for (let i = 1; i < spectrum.length - 1; i++) {
        if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1] && spectrum[i] > threshold) {
            peaks++;
        }
    }
    //console.log("Peaks", peaks);
    return peaks;
}



function evaluateHarmonicContent(spectrum) {
    let flatness = calculateSpectralFlatness(spectrum);
    let peakCount = countProminentPeaks(spectrum, peakAmpThreshold);
    //console.log("Flatness", flatness);
    let message;
    if (flatness < 0.2 && peakCount <= 3) {
        message = "The tone is likely playing purer individual harmonics.";
    } else if (flatness >= 0.2 && peakCount > 3) {
        message = "The tone is rich in harmonics.";
    } else {
        message = "The tone has a mixed or unclear harmonic profile.";
    }
  
  //console.log(message);

    // Return both the message and peakCount for external use
    return { message, peakCount };
}

function calculateSpreadAndPeaksFactor(spread, peakCount) {
  // Define the desired ranges for spread and peakCount
  const minSpread = 1; // Minimum expected spread value
  const maxSpread = 2000; // Maximum expected spread value
  const minPeakCount = 1; // Minimum expected peak count
  const maxPeakCount = 15; // Maximum expected peak count

  // Normalize spread and peakCount to the range [0, 1]
  let normalizedSpread = constrain(map(spread, minSpread, maxSpread, 0, 1), 0, 1);
  let normalizedPeakCount = constrain(map(peakCount, minPeakCount, maxPeakCount, 0, 1), 0, 1);

  // Combine the normalized values using a weighted sum
  let spreadWeight = 0.6; // Adjust this value to control the relative weight of spread
  let peakWeight = 0.4; // Adjust this value to control the relative weight of peak count
  let combinedFactor = (spreadWeight * normalizedSpread) + (peakWeight * normalizedPeakCount);

  // Optionally, you can apply additional scaling or transformations to the combinedFactor
  combinedFactor = pow(combinedFactor, 2); // Square the factor to emphasize smaller values
  
  //console.log("Combined Peak and Spread", combinedFactor)

  return combinedFactor;
}


function evaluateAudioProperties(spectrum) {
    let flatness = calculateSpectralFlatness(spectrum);
    let peaks = countProminentPeaks(spectrum, peakAmpThreshold);
    let spread = calculateSpectralSpread(spectrum, fft.getCentroid());

    // Normalize the audio properties based on observed or expected maximum values
  
  let normalizedFlatness = constrain(map(flatness, 0, 3, 0, 1), 0, 1); // Assuming flatness ranges from 0 to 3
    let normalizedPeaks = constrain(map(peaks, 0, 30, 0, 1), 0, 1); // Assuming peak counts range from 0 to 30
    let normalizedSpread = constrain(map(spread, 0, 4000, 0, 1), 0, 1); // Assuming spread ranges from 0 to 4000

    // Calculate a composite noisiness score
    let noisinessScore = (normalizedFlatness + normalizedPeaks + normalizedSpread) / 3;

    return {
        flatness,
        peaks,
        spread,
        noisinessScore
    };
}

function scaleNoisiness(noisiness, power) {
  // Apply a power function to the noisiness value
  const scaledNoisiness = Math.pow(noisiness, power);

  // Adjust the scaling logic to prevent negative outputs
  //the minNoisiness suppresses values below that value. Values above that figure are amplified.
  const minNoisiness = 0.1; // Minimum observed noisiness for purer tones
  const maxNoisiness = 0.50; // Maximum observed noisiness for noisier tones

  // Normalize the powered noisiness within the range of [0, 1]
  const normalizedNoisiness = (scaledNoisiness - Math.pow(minNoisiness, power)) / (Math.pow(maxNoisiness, power) - Math.pow(minNoisiness, power));

  // Rescale to ensure minimum is at zero, preventing negatives
  const scaledRange = Math.max(0, normalizedNoisiness * (1 - minNoisiness) + minNoisiness);

  return scaledRange;
}


function draw() {
  background(234, 225, 207);
  drawAxes();
    //background(100, 253, 253);
    // bgGradient.show();
    Engine.update(engine);
  
 //use the slider to control the mic input level. 
    let sliderValue = customSlider.value();
    
    //console.log(sliderValue);
    //let wind = calculateWind(sliderValue);
 
    //      for (let i = 0; i < boxes.length; i++) {
    //     boxes[i].show();
    // }
  
  // Service any active calibration phase
  if (isAudioStarted) tickCalibration();

  // Move the sweet-spot target along an exponential decay curve:
  // early piece rewards noisy/unstable sounds (top of canvas),
  // progressively rewards stable/pure sounds (bottom of canvas) over 8 minutes.
  {
    let tf = constrain((millis() - transitionStartTime) / transitionDuration, 0, 1);

    // Outro: once the 8-minute arc is complete, gradually return to rest
    if (tf >= 1 && !outroStarted) {
      outroStarted = true;
      outroStartTime = millis();
    }
    if (outroStarted) {
      outroFactor = constrain((millis() - outroStartTime) / OUTRO_DURATION, 0, 1);
    }

    let mx = map(tf, 0, 1, startX, endX);
    let my = height - (a * Math.exp(-b * (mx - startX) / 10));
    movingVector.set(mx, my);
  }

    if (showVectors) {
        // Draw the decay curve path
        beginShape();
        noFill();
        stroke(0, 50);
        strokeWeight(2);
        for (let x = startX; x <= endX; x += 5) {
            let y = height - (a * Math.exp(-b * (x - startX) / 10));
            vertex(x, y);
        }
        endShape();

        // Draw moving vector (sweet-spot target)
        fill(255, 0, 0, 80);
        noStroke();
        circle(movingVector.x, movingVector.y, 10);

        // Draw static vector (performer's current state)
        fill(0, 255, 0, 80);
        circle(staticVector.x, staticVector.y, 10);
    }
  
  
  // Update moving vector position. Set if statement to get the moving vector on the curve if frameCount is less than 5 and every twenty frames from there
//     if (frameCount < 5 || frameCount % 20 == 0) {
//         movingVector.x += 1; // Increment x by 1 each frame
//         movingVector.x = constrain(movingVector.x, 0, width);
//         movingVector.y = height - (a * pow((movingVector.x - 100), 2) * b); // Adjust x to account for the shift
//     }

//     if (showVectors) {
//         // Plot the convex curve
//         beginShape();
//         noFill();
//         stroke(0, 50);
//         strokeWeight(2);
//         for (let x = 50; x < width; x++) { // Start x from 50 instead of 0
//             let y = a * pow((x - 100), 2) * b; // Adjust x to account for the shift
//             vertex(x, height - y);
//         }
//         endShape();

//         // Draw moving vector
//         fill(255, 0, 0, 80);
//         circle(movingVector.x, movingVector.y, 10); // Draw the moving circle

//         // Draw static vector
//         fill(0, 255, 0, 80);
//         circle(staticVector.x, staticVector.y, 10); // Draw the static circle
//     }

  
  // Update moving vector position. Set if statement to get the moving vector on the curve if frameCount is less than 5 and every twenty frames from there
//   if(frameCount <5 || frameCount % 20 == 0){
//   movingVector.x += 1; // Increment x by 1 each frame
//   movingVector.x = constrain(movingVector.x, 0, width);
//   movingVector.y = height - (a * exp(-b * (movingVector.x - 100) / 10)); // Adjust x to account for the shift
//   }
  
//   if(showVectors) {
//         // Plot the decay curve
//         beginShape();
//         noFill();
//         stroke(0, 50);
//         strokeWeight(2);
//         for (let x = 50; x < width; x++) { // Start x from 100 instead of 0
//             let y = a * exp(-b * (x - 100) / 10); // Adjust x to account for the shift
//             vertex(x, height - y);
//         }
//         endShape();

//         // Draw moving vector
//         fill(255, 0, 0, 80);
//         circle(movingVector.x, movingVector.y, 10); // Draw the moving circle

//         // Draw static vector
//         fill(0, 255, 0, 80);
//         circle(staticVector.x, staticVector.y, 10); // Draw the static circle
//     }

  // Plot the decay curve
//   beginShape();
//   noFill();
//   stroke(0, 50);
//   strokeWeight(2);
//   for (let x = 50; x < width; x++) { // Start x from 100 instead of 0
//     let y = a * exp(-b * (x - 100) / 10); // Adjust x to account for the shift
//     vertex(x, height - y);
//   }
//   endShape();
  
 

  
//   // Draw moving vector
//   fill(255, 0, 0, 80);
//   circle(movingVector.x, movingVector.y, 10); // Draw the moving circle

   stroke(0);
  
  
    let currentTime = millis();
    let spectrum = fft.analyze();
    let centroid = fft.getCentroid();
    //let level = audioIn.getLevel();
    //console.log("Volume", level);
    let spread = calculateSpectralSpread(spectrum, centroid)
    //console.log("Centroid Spead", spread);
    currentSpectrum = spectrum;
    let elapsedTime = currentTime - lastBoxTime;
  
    //use getLevel() to trigger actions when amp level of the audioIn reaches a threshold level.
    let checkVolume = audioIn.getLevel(); 
    //console.log("Volume", checkVolume);
  
//...................FFT calculations............
  let flux = calculateSpectralFlux(currentSpectrum, previousSpectrum);
  fluxHistory.push({time: currentTime, value: flux});

  if (flux > maxFluxWindow) {
    maxFluxWindow = flux;
  }

  while (fluxHistory.length > 0 && currentTime - fluxHistory[0].time > windowDuration) {
    fluxHistory.shift();
  }

  // Detect fast onsets: sudden spike in flux triggers a decaying transientEnergy
  if (prevFlux > 0 && flux > prevFlux * 1.5 && checkVolume > (window._onsetThreshold || 0.005)) {
    transientEnergy = constrain(flux / (prevFlux * 1.5), 1, 3);
  }
  transientEnergy *= 0.9; // decay each frame
  prevFlux = flux;

  previousSpectrum = currentSpectrum.slice();

  if (currentTime - lastVarianceCalcTime > varianceCalcInterval) {
    let recentFluxValues = fluxHistory.filter(f => currentTime - f.time <= windowDuration).map(f => f.value);
    if (recentFluxValues.length > 0) {
      let variance = calculateVariance(recentFluxValues);
      let normalizedLogVariance = normalizeVarianceLogarithmic(variance);

      // Visualization: Update the meter based on normalizedLogVariance
      //drawVarianceMeter(normalizedLogVariance);

     //console.log("Normalized Log Variance in Spectral Flux: ", normalizedLogVariance);
    }
    lastVarianceCalcTime = currentTime;
  }
  
  let stabilityAssessment = assessStability(fluxHistory, maxFluxWindow, currentTime);
  //console.log("Stability Assessment", stabilityAssessment);
  
  let assessmentTime = millis(); 
  
    avgStability = averageStabilityLast5Seconds(assessmentTime);
    //console.log("Average Stability Last 5 Seconds:", avgStability);
  //console.log("AvStable", avgStability);
//updateWindMultiplierBasedOnStability(stabilityAssessment);
  
updateWindMultiplierBasedOnStability(stabilityAssessment);
  
  //evaluateHarmonicContent();
  // Capture returned values from evaluateHarmonicContent
    let harmonicContent = evaluateHarmonicContent(currentSpectrum);
    //console.log(harmonicContent.message);  // Log the message here
    //console.log("Centroid Spread:", spread, "Peak Count:", harmonicContent.peakCount);

    // Use spread and peakCount for the combined factor calculation
    // combinedFactor = calculateSpreadAndPeaksFactor(spread, harmonicContent.peakCount);
  
        combinedFactorGlobal = calculateSpreadAndPeaksFactor(spread, harmonicContent.peakCount);
    //console.log("Combined Peak and Spread Factor:", combinedFactorGlobal);
  
  let audioProperties = evaluateAudioProperties(currentSpectrum);
  //console.log("Audio Properties", audioProperties);
  
  let noisiness = audioProperties.noisinessScore;

  let scaledNoisiness;
  if (calNoisyScore > calPureScore + 0.05) {
    // Instrument-calibrated: map performer's actual timbral range to 0..1
    scaledNoisiness = constrain(map(noisiness, calPureScore, calNoisyScore, 0, 1), 0, 1);
  } else {
    // Fallback to generic scaling before timbral calibration has been done
    scaledNoisiness = scaleNoisiness(noisiness, 1);
  }
  
  // Apply exponential moving average to smooth the x position of staticVector
  smoothStaticVectorX += smoothingFactor * (avgStability * 0.2 - smoothStaticVectorX);
  staticVector.x = constrain(smoothStaticVectorX, 0, width);
  
  let targetY = height - (scaledNoisiness * height);
  smoothStaticVectorY += smoothingFactorY * (targetY - smoothStaticVectorY);
  staticVector.y = constrain(smoothStaticVectorY, 0, height);
  
  // Invert mapping for noisiness to y-value and apply smoothing
  // let targetY = height - (audioProperties.noisinessScore * (height));
  // smoothStaticVectorY += smoothingFactorY * (targetY - smoothStaticVectorY);
  // staticVector.y = smoothStaticVectorY;
  
  stroke(0, 50);
  //circle(staticVector.x, staticVector.y, 10); // Draw the static circle
  
  stroke(0);


  // Calculate distance between vectors
  distance = movingVector.dist(staticVector);
  normalizedDistance = distance / 750;
  tension = constrain(1 - normalizedDistance, 0, 1);
  
  // Ensure the normalized distance does not exceed 1
    normalizedDistance = constrain(normalizedDistance, 0, 1);
  
      // Display distance
  fill(0);
  noStroke();
  textSize(16);
  //text(`Distance: ${distance.toFixed(2)}`, 440, 20);
  //text(`Normalized Distance: ${normalizedDistance.toFixed(2)}`, 440, 45);
  //text('Sound Source', 220, 80);
  //text(`Noisiness: ${noisiness.toFixed(2)}`, 440, 70);
  //text(`Scaled Noisiness: ${scaledNoisiness.toFixed(2)}`, 440, 95);
  // let amplitude = new p5.Amplitude();
  // let level = audioIn.getLevel();
  // console.log("Amplitude", level);
  


  

  
  
  
//............................................... 
  
  let setTime = millis();

  
  
  // Dandelion spawning: near the sweet spot, notes burst off the stave like spores.
  // tensionBonus rises from 0 (tension ≤ 0.5) to 1 (max tension).
  let tensionBonus = pow(max(0, tension - 0.5) * 2, 1.5);
  let spawnInterval = tensionBonus > 0.3 ? max(180, minBoxInterval * (1 - tensionBonus * 0.9)) : minBoxInterval;
  let maxBoxes = outroFactor > 0 ? 0 : 4;
  let spawnThreshold = window._spawnThreshold || 0.01;

    if (elapsedTime >= spawnInterval && boxes.length < maxBoxes && checkVolume > spawnThreshold) {
        let centroidHz = fft.getCentroid();
        let spawnX = constrain(map(Math.log(centroidHz + 1), Math.log(21), Math.log(20001), 70, width - 20), 70, width - 20);
        let spawnFlatness = calculateSpectralFlatness(currentSpectrum);
        let newBox = new Box(spawnX, random(-30, 50), 8, spawnFlatness);
        boxes.push(newBox);

        // At high tension, scatter spores with initial burst velocity
        if (tensionBonus > 0.2) {
            let scatter = tensionBonus * 4;
            Body.setVelocity(newBox.body, { x: random(-scatter, scatter), y: -tensionBonus * 2.5 });
            Body.setAngularVelocity(newBox.body, random(-tensionBonus * 0.3, tensionBonus * 0.3));
        }

        lastBoxTime = currentTime;
        minBoxInterval = random(3000, 8000);
    }
  
  
  for (let i = boxes.length - 1; i >= 0; i--) {
        boxes[i].updateMass(); // Update the mass based on box age
        boxes[i].show();
        boxes[i].fadeOut();

        if (boxes[i].body.position.y > 400 && boxes[i].fade <= 0) {
            Composite.remove(world, boxes[i].body);
            boxes.splice(i, 1);
        }
    }
  


  
  let frameWind = calculateWind();

  applyForcesAndTorqueToBoxes(boxes, frameWind);

  // windMulti is owned by updateWindMultiplierBasedOnStability — do not overwrite here

  // line1 = top of stave = highest frequency band; line5 = bottom = lowest
  applyForcesAndShowParticles(line1Particles, frameWind, 0.5 + getBandEnergy(currentSpectrum, 4) * 2);
  applyForcesAndShowParticles(line2Particles, frameWind, 0.5 + getBandEnergy(currentSpectrum, 3) * 2);
  applyForcesAndShowParticles(line3Particles, frameWind, 0.5 + getBandEnergy(currentSpectrum, 2) * 2);
  applyForcesAndShowParticles(line4Particles, frameWind, 0.5 + getBandEnergy(currentSpectrum, 1) * 2);
  applyForcesAndShowParticles(line5Particles, frameWind, 0.5 + getBandEnergy(currentSpectrum, 0) * 2);
  
  //console.log('scaledVariance:', scaledVariance, 'windMulti', windMulti);
  //applyForcesToBoxes(boxes);
  
  
  

    for (let i = 0; i < boundaries.length; i++) {
        boundaries[i].show();
    }
  
  //pass line1Particles array to drawLine function to draw the lines of the stave
  
//   bgGradient.show();
  drawLine(line1Particles, 1.0);
  drawLine(line2Particles, 1.25);
  drawLine(line3Particles, 1.5);
  drawLine(line4Particles, 1.75);
  drawLine(line5Particles, 2.0);
  //drawLine2();
  clef();
  
  


  //stroke(100);
  strokeWeight(1);
  //noFill();
  fill(100);
  //rect(50, 20, smoothedFlatness*1.5, 20);
  //text('spectrum flatness - lower value, purer tone', 50, 55);
  
  
  // Practice HUD — hidden in performance mode
  if (!isPerformanceMode) {
    if (isAudioStarted) {
      let micLevel = audioIn.getLevel();
      let meterH = 60;
      let meterX = width - 14;
      let meterY = height - 80;
      noStroke();
      fill(200, 190, 170);
      rect(meterX, meterY, 8, meterH);
      fill(isStable ? 60 : 140);
      let fillH = constrain(map(micLevel, 0, 0.15, 0, meterH), 0, meterH);
      rect(meterX, meterY + meterH - fillH, 8, fillH);
      stroke(180, 60, 60);
      strokeWeight(1);
      let markerY = meterY + meterH - constrain(map(0.01, 0, 0.15, 0, meterH), 0, meterH);
      line(meterX - 2, markerY, meterX + 10, markerY);
    }
    noStroke();
    if (isStable) { fill(50); } else { fill(210, 200, 185); }
    ellipse(width - 10, height - 90, 8);
  }
  
  fill(100);
  strokeWeight(1);
  textSize(16);
  //text(stabilityThreshold, width-65, height-70);
  
  rectWidth = map(constrain(millis() - transitionStartTime, 0, transitionDuration), 0, transitionDuration, 0, width);
  rect(0, height-15, rectWidth, 10);
}

// Function to draw axes
function drawAxes() {
  stroke(0);
  strokeWeight(2);
  //line(0, height, width, height); // X-axis
  //line(0, 0, 0, height); // Y-axis
}


function drawLine(particles, weight = 2){

    beginShape();
    noFill();
    stroke(50);
    strokeWeight(weight);
  
  //must connnect the first particle
    curveVertex(particles[0].body.position.x, particles[0].body.position.y);

    for (let p of particles) {
        curveVertex(p.body.position.x, p.body.position.y);
    }
   curveVertex(particles[particles.length - 1].body.position.x, particles[particles.length - 1].body.position.y);

    endShape();
}

function applyForcesAndShowParticles(particles, winds, bandGain) {
    let g = (bandGain !== undefined) ? bandGain : 1.0;
    let wind = { x: winds.originalWind.x * g, y: winds.originalWind.y * g };

    // Ensure you're passing the force correctly to Body.applyForce
    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i];
        // Make sure the force object is correctly structured as { x: value, y: value }
        Body.applyForce(particle.body, { x: particle.body.position.x, y: particle.body.position.y }, { x: wind.x, y: wind.y });

        // Assuming you have a show method to render your particles
        if (particle.show) {
            particle.show();
        }
    }
}



function applyForcesAndTorqueToBoxes(boxes, winds) {
    let scaledWindForce = { x: winds.scaledWind.x, y: winds.scaledWind.y };
  //let originalWindForce = { x: winds.wind.x, y: winds.wind.y}

    for (let box of boxes) {
        Body.applyForce(box.body, { x: box.body.position.x, y: box.body.position.y }, scaledWindForce);
        // If using updateTorque based on wind, ensure it's correctly implemented
       box.updateTorque(scaledWindForce); // Example - this needs to be defined based on your code
    }
}


function calculateWind() {
  let windX = map(noise(windXoff), 0, 1, -0.02, 0.03);
  let windY = map(noise(windYoff), 0, 1, -0.05, 0.02);
  let wind = createVector(windX, windY);

  // tension² creates a sharp sweet-spot: near-zero when far from target, dramatic when close.
  // outroFactor fades wind to silence as the piece ends.
  let safeWindMulti = lerp(0.0002, MAX_WIND_MULTI, tension * tension) * (1 - outroFactor);

  wind.mult(safeWindMulti);

  let scaledWind = wind.copy().mult(2); // Scaled for note heads
  let scaledParticleWind = wind.copy().mult(0.075); // Scaled for stave lines

  windXoff += 0.04;
  windYoff += 0.04;

  return { originalWind: { x: scaledParticleWind.x, y: scaledParticleWind.y }, scaledWind: { x: scaledWind.x, y: scaledWind.y } };
}


//.........................................


function updateWindMultiplierBasedOnStability(stabilityAssessment) {
    let baseMultiplierIncrement = 0.0001;
    let varianceInfluenceFactor = 0.005;
    let maxMultiplier = 0.009;

    if (stabilityAssessment.isStable) {
        isStable = true;
        let varianceBasedIncrement = Math.max(scaledVariance * varianceInfluenceFactor, 0);
        let combinedIncrement = baseMultiplierIncrement + varianceBasedIncrement;
        let durationMultiplier = Math.min(maxMultiplier, windMulti + (stabilityAssessment.stableDuration / 10000) * combinedIncrement);
        windMulti = Math.max(windMulti, durationMultiplier);
    } else {
        isStable = false;
        windMulti = Math.min(0.0001 + scaledVariance * varianceInfluenceFactor, maxMultiplier);
    }

    // Layer transient spike on top of the stability ramp
    windMulti = Math.min(windMulti + transientEnergy * 0.002, maxMultiplier);
}




  
function clef(){
  let pos = createVector(58, 160);
  rectMode(CENTER);
  imageMode(CENTER);
  push();
  translate(pos.x, pos.y - size/2);  // pivot at top of clef (anchor point)
  rotate(clefAngle);
  translate(0, size/2);
  image(bassclef, 0, 0);
  pop();

  // Mic level shifts the equilibrium angle — louder playing = pendulum hangs at a wider angle
  let micLevel = isAudioStarted ? audioIn.getLevel() : 0;
  let equilibrium = map(constrain(micLevel, 0, 0.12), 0, 0.12, 0, QUARTER_PI / 3.5);

  // Pendulum: gravity restores toward equilibrium; transient onsets give a kick
  let angularAcceleration = -0.004 * (clefAngle - equilibrium);
  angularAcceleration += transientEnergy * 0.001;

  clefAngularVelocity = (clefAngularVelocity + angularAcceleration) * 0.995;
  clefAngle += clefAngularVelocity;
  
  
  
}
  

function windowResized() {
  // Intentionally empty — the browser scales the canvas element to fill the
  // screen when fullscreen is active. Calling resizeCanvas() here would move
  // all physics objects out of position.
}

function mousePressed() {
  boxes.push(new Box(mouseX, mouseY, 12));
}


function keyPressed() {
  if (key === 'h' || key === 'H') toggleControls();
  if (key === 'v' || key === 'V') toggleVectors();
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}

//.......................SLIDERS...............................

function updateSliderValue(){
  let volume = parseFloat(customSlider.value());
  audioIn.amp(volume);
  localStorage.setItem('stave_windSlider', customSlider.value());
}



function updateForceValue(){
  let sliderValue = forceSlider.value();
  MAX_WIND_MULTI = map(sliderValue, 0, 1, 0.001, 0.009);
  localStorage.setItem('stave_forceSlider', sliderValue);
}

function updatePeakValue(){
  let PeakSliderValue = peakSlider.value();
  peakAmpThreshold = map(PeakSliderValue, 0, 1, 5, 150);
  localStorage.setItem('stave_peakSlider', PeakSliderValue);
}

function updateStabilityValue(){
  let sliderValue = stabilitySlider.value();
  stabilityThreshold = sliderValue;
  localStorage.setItem('stave_stabilitySlider', sliderValue);
}


function assessStability(fluxHistory, maxFluxWindow, currentTime) {
    const STABLE_FRAMES_REQUIRED = 5;  // must hold for N frames to enter stable state
    const UNSTABLE_FRAMES_REQUIRED = 3; // must be noisy for N frames to exit stable state
    let stabilityMinimum = stabilityThreshold;
    let amplitudeThreshold = window._stabilityAmpMin || 0.002;

    let currentStability = fluxHistory.length > 0 ? fluxHistory[fluxHistory.length - 1].value : 0;
    let currentAmplitude = audioIn.getLevel();

    let conditionMet = currentAmplitude > amplitudeThreshold && currentStability < stabilityMinimum;

    if (conditionMet) {
        stableFrameCount = Math.min(stableFrameCount + 1, STABLE_FRAMES_REQUIRED);
    } else {
        stableFrameCount = Math.max(stableFrameCount - 1, 0);
    }

    if (stableFrameCount >= STABLE_FRAMES_REQUIRED) {
        if (lastStableTime === 0) lastStableTime = currentTime;
        stabilityRecords.push({ time: currentTime, duration: currentTime - lastStableTime });
        return { isStable: true, stableDuration: currentTime - lastStableTime };
    } else if (stableFrameCount === 0) {
        lastStableTime = 0;
        return { isStable: false, stableDuration: 0 };
    } else {
        // hysteresis zone — keep previous state
        return { isStable: isStable, stableDuration: isStable ? (currentTime - lastStableTime) : 0 };
    }
}


// function assessStability(fluxHistory, maxFluxWindow, currentTime) {
//     let stabilityDurationThreshold = 5000; // 5 seconds, for example
//     let stabilityMinimum = stabilityThreshold; // Adjust based on your spectral flux range setting the threshold low means the input must be very stable, a higher threshold means less stability required.
//     let amplitudeThreshold = 0.001; // Adjust based on expected amplitude levels
//   //console.log("Stability Min", stabilityMinimum);
//     let currentStability = fluxHistory.length > 0 ? fluxHistory[fluxHistory.length - 1].value : 0;
//   //console.log("Current Stability", currentStability);
//     let currentAmplitude = audioIn.getLevel(); // Ensure this is capturing the current amplitude accurately
//   //console.log("Current Amplitude", currentAmplitude);

//     // Check if currently stable and loud enough
//     if (currentAmplitude > amplitudeThreshold && currentStability < stabilityMinimum) {
//         if (lastStableTime === 0) lastStableTime = currentTime; // Mark start of stability
//         return {
//             isStable: true,
//             stableDuration: currentTime - lastStableTime
//         };
//     } else {
//         lastStableTime = 0; // Important: Reset when conditions not met
//         return {
//             isStable: false,
//             stableDuration: 0 // Reset stable duration since it's not currently stable
//         };
//     }
// }


function averageStabilityLast5Seconds(currentTime) {
    const fiveSecondsAgo = currentTime - 5000;
    //console.log("Current Time:", currentTime);
    //console.log("Calculating from:", fiveSecondsAgo);
    const recentRecords = stabilityRecords.filter(record => record.time > fiveSecondsAgo);
    //console.log("Records Length", recentRecords.length);
    if (recentRecords.length === 0) return 0;
    const totalDuration = recentRecords.reduce((acc, record) => acc + record.duration, 0);
    return totalDuration / recentRecords.length;
}


// function averageStabilityLast5Seconds(currentTime) {
//     const fiveSecondsAgo = currentTime - 5000;
//     console.log("Current Time:", currentTime);
//     console.log("Calculating from:", fiveSecondsAgo);

//     const recentRecords = stabilityRecords.filter(record => {
//         console.log("Record Time:", record.time);
//         return record.time > fiveSecondsAgo;
//     });

//     console.log("Recent Records:", recentRecords);

//     if (recentRecords.length === 0) return 0;
//     const totalDuration = recentRecords.reduce((acc, record) => acc + record.duration, 0);
//     console.log("Total Duration:", totalDuration);
//     return totalDuration / recentRecords.length;
// }




