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
let wobble = 0;
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
let showVectors = true;
let toggleVectorsButton;

let startX = 100; //starting and end points for vectors
let startY = 50;
let endX = 1050;
let endY = 50;

let t = 0; // Parameter t for Bézier curve

let controlX = (startX + endX) / 2; // Control point x-coordinate
let controlY = startY + 550; // Control point y-coordinate, adjust for curve "gentleness"

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
    audioIn.amp(0.5);
    w = width / 1024;
  
    transitionStartTime = millis();
    transitionDuration = 120000; //the time it takes for rectangle to move across the screen

  // Create a button and add an event listener for cycling through sources
  // let button = createButton('Cycle Audio Input');
  // button.parent('controls');
  // button.mousePressed(cycleAudioSource);
  
    let button = select('#cycleAudioButton');
  button.mousePressed(cycleAudioSource);
  
  let toggleButton = select('#toggleControlsButton');
    toggleButton.mousePressed(toggleControls);


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
    let slidersColumn1 = select('#slidersColumn1');
    let slidersColumn2 = select('#slidersColumn2');
    let buttonsColumn = select('#buttonsColumn');
    let toggleColumn = select ('#vectorsColumn');
    let toggleButton = select('#toggleControlsButton');

    if (slidersColumn1.style('visibility') === 'hidden') {
        slidersColumn1.style('visibility', 'visible');
        slidersColumn2.style('visibility', 'visible');
        buttonsColumn.style('visibility', 'visible');
        toggleColumn.style('visibility', 'visible');
        toggleButton.removeClass('toggled');
    } else {
        slidersColumn1.style('visibility', 'hidden');
        slidersColumn2.style('visibility', 'hidden');
        buttonsColumn.style('visibility', 'hidden');
        toggleColumn.style('visibility', 'hidden');
        toggleButton.addClass('toggled');
    }
}



function startAudio() {
  if (!isAudioStarted) {
    getAudioInputSources();
    isAudioStarted = true;
  }
}

function getAudioInputSources() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      audioIn.getSources(gotSources);
    })
    .catch(err => {
      console.error('Error accessing audio input:', err);
      alert('Please allow microphone access to use this feature.');
    });
}

function gotSources(deviceList){
  // Store the list of audio input sources
  audioInputSources = deviceList;

  if (audioInputSources.length > 0) {
    setAudioSource(0); // Start with the first audio input source
  }
}

function setAudioSource(index) {
  if (audioIn) {
    audioIn.stop();
  }

  audioIn.setSource(index);
  console.log(index);
  audioIn.start();
  fft.setInput(audioIn);
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

function calculateSpectralFlatness() {
  //changed this to calculate the geometric mean using logarithms to avoid underflow. geoMean was always returning a value of 0 previously
    let spectrum = fft.analyze();
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




function countProminentPeaks(threshold) {
    let spectrum = fft.analyze();
    let peaks = 0;
    for (let i = 1; i < spectrum.length - 1; i++) {
        if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1] && spectrum[i] > threshold) {
            peaks++;
        }
    }
    //console.log("Peaks", peaks);
    return peaks;
}



function evaluateHarmonicContent() {
    let flatness = calculateSpectralFlatness();
    let peakCount = countProminentPeaks(peakAmpThreshold);
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


function evaluateAudioProperties() {
    let flatness = calculateSpectralFlatness();
    let peaks = countProminentPeaks(peakAmpThreshold);
    let spread = calculateSpectralSpread(currentSpectrum, fft.getCentroid());

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
   // background(255, 253, 253);
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
  
  if (frameCount < 5 || frameCount % 2 == 0) {
        t += 0.0001; // Increment t by a small value each frame
        t = constrain(t, 0, 0.99); // Constrain t between 0 and 1
        let newX = bezierPoint(startX, controlX, controlX, endX, t);
        let newY = bezierPoint(startY, controlY, controlY, endY, t);
        movingVector.set(newX, newY); // Update moving vector position
    }

    if (showVectors) {
        // Plot the convex Bézier curve
        beginShape();
        noFill();
        stroke(0, 50);
        strokeWeight(2);
        for (let i = 0; i <= 1; i += 0.01) { // Increment t from 0 to 1
            let x = bezierPoint(startX, controlX, controlX, endX, i);
            let y = bezierPoint(startY, controlY, controlY, endY, i);
            vertex(x, y);
        }
        endShape();

        // Draw moving vector
        fill(255, 0, 0, 80);
        circle(movingVector.x, movingVector.y, 10); // Draw the moving circle

        // Draw static vector
        fill(0, 255, 0, 80);
        circle(staticVector.x, staticVector.y, 10); // Draw the static circle
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
    let harmonicContent = evaluateHarmonicContent();
    //console.log(harmonicContent.message);  // Log the message here
    //console.log("Centroid Spread:", spread, "Peak Count:", harmonicContent.peakCount);

    // Use spread and peakCount for the combined factor calculation
    // combinedFactor = calculateSpreadAndPeaksFactor(spread, harmonicContent.peakCount);
  
        combinedFactorGlobal = calculateSpreadAndPeaksFactor(spread, harmonicContent.peakCount);
    //console.log("Combined Peak and Spread Factor:", combinedFactorGlobal);
  
  let audioProperties = evaluateAudioProperties();
  //console.log("Audio Properties", audioProperties);
  
  let noisiness = audioProperties.noisinessScore;
  
  // Scale the noisiness using the power function
  let scaledNoisiness = scaleNoisiness(noisiness, 1); // Adjust the power parameter as needed
  
    // Draw static vector
  fill(0, 255, 0, 80);
  //console.log(avgStability);
  staticVector.x = avgStability*0.1;
  //circle(staticVector.x, staticVector.y, 10); // Draw the static circle
  
  // Apply exponential moving average to smooth the x position of staticVector
  smoothStaticVectorX += smoothingFactor * (avgStability * 0.15 -   smoothStaticVectorX);
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

  
  
    if (elapsedTime >= minBoxInterval && boxes.length < 4 && checkVolume > 0.01) {
        // Create a new box
        boxes.push(new Box(random(70, width-20), random(-30, 50), 8));

        // Reset the lastBoxTime and generate a new random interval
        lastBoxTime = currentTime;
        minBoxInterval = random(3000, 8000); // Randomize the interval for the next box
    }
  
  
  for (let i = boxes.length - 1; i >= 0; i--) {
        boxes[i].updateMass(); // Update the mass based on box age
        boxes[i].show();
        boxes[i].fadeOut();

        if (boxes[i].body.position.y > 400 && boxes[i].fade <= 0) {
            boxes.splice(i, 1);
        }
    }
  
  // Set the Air Friction value of notes
    //let dynamicFriction = map(mouseX, 0, width, 0, 1); // Replace with desired friction value
  let dynamicFriction = random(0.05, 0.1);
  //let dynamicFriction = random(0.01, 0.02);
  //print(dynamicFriction);

    // Loop through the boxes and update their friction
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].setFriction(dynamicFriction);
    }
  


  
  applyForcesAndTorqueToBoxes(boxes);
// for (let box of boxes) {
//         box.applyTorque();
//         box.show(); // Show the box, which will now be spinning
//     }
  
  for (let box of boxes){
    box.show();
    
  }
  

  
  windMulti = (scaledVariance/100);
  //console.log('scaledVariance:', scaledVariance, 'windMulti', windMulti);
  
  applyForcesAndShowParticles(line1Particles);
  applyForcesAndShowParticles(line2Particles);
  applyForcesAndShowParticles(line3Particles);
  applyForcesAndShowParticles(line4Particles);
  applyForcesAndShowParticles(line5Particles);
  
  //console.log('scaledVariance:', scaledVariance, 'windMulti', windMulti);
  //applyForcesToBoxes(boxes);
  
  
  

    for (let i = 0; i < boundaries.length; i++) {
        boundaries[i].show();
    }
  
  //pass line1Particles array to drawLine function to draw the lines of the stave
  
//   bgGradient.show();
  drawLine(line1Particles);
  drawLine(line2Particles);
  drawLine(line3Particles);
  drawLine(line4Particles);
  drawLine(line5Particles);
  //drawLine2();
  clef();
  
  


  //stroke(100);
  strokeWeight(1);
  //noFill();
  fill(100);
  //rect(50, 20, smoothedFlatness*1.5, 20);
  //text('spectrum flatness - lower value, purer tone', 50, 55);
  
  
 if(isStable){
   fill(50);
 }
  else{
    fill(255);
  }
  noStroke();
 //ellipse(width-50, height-50, 20);
  
  fill(100);
  strokeWeight(1);
  textSize(16);
  //text(stabilityThreshold, width-65, height-70);
  
  if(frameCount %10 == 0){
    rectWidth++;
  }
  rect(0, height-15, rectWidth, 10);
}

// Function to draw axes
function drawAxes() {
  stroke(0);
  strokeWeight(2);
  //line(0, height, width, height); // X-axis
  //line(0, 0, 0, height); // Y-axis
}


function drawLine(particles){
  
    beginShape();
    noFill();
    stroke(50);
    strokeWeight(2);
  
  //must connnect the first particle
    curveVertex(particles[0].body.position.x, particles[0].body.position.y);

    for (let p of particles) {
        curveVertex(p.body.position.x, p.body.position.y);
    }
   curveVertex(particles[particles.length - 1].body.position.x, particles[particles.length - 1].body.position.y);

    endShape();
}

  function applyForcesAndTorqueToBoxes(boxes) {
    let wind = calculateWind();
    

    for (let i = 0; i < boxes.length; i++) {
        let box = boxes[i];
        // Apply wind force to the box
        Body.applyForce(box.body, box.body.position, wind);

        // Additionally, update the box's torque based on wind
        box.updateTorque(wind);
    }
}



function applyForcesAndShowParticles(particles) {
    let winds = calculateWind();
    let wind = winds.originalWind; // This is correct, using the original wind for particles. I am using the scaledParticleForce value from the calculateWind function.
    //let wind = winds.scaledParticleForce;

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



function applyForcesAndTorqueToBoxes(boxes) {
    let winds = calculateWind();
  
    //use scaled up wind to apply to notes
    let scaledWindForce = { x: winds.scaledWind.x, y: winds.scaledWind.y }; // Ensure proper structure
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

  let minInfluence = 0.01; // Minimum influence factor
  let maxInfluence = 0.9; // Maximum influence factor
  let baseMultiplier = 0.001; // Adjusted base multiplier
  let scalingFactor = 10; // Scaling factor for baseWindMulti before applying MAX_WIND_MULTI

  let adjustedBaseWindMulti = (Number.isFinite(windMulti) ? windMulti : 0.001) * scalingFactor;

  let currentAmplitude = audioIn.getLevel();
  let amplitudeThreshold = 0.001;

  // Calculate the elapsed time since the transition started
  let elapsedTime = millis() - transitionStartTime;

  // Compute the transition factor based on the elapsed time and transition duration
  let transitionFactor = constrain(elapsedTime / transitionDuration, 0, 1);

  let influenceFactor = 0.001; // Default value for low amplitudes

  if (isStable && currentAmplitude > amplitudeThreshold) {
    // Interpolate between the two states based on the transition factor
    let adjustedInfluence = lerp(combinedFactorGlobal, 1 - combinedFactorGlobal, transitionFactor);

    // For purer tones, we want the influence factor to be higher initially
    // and decrease over time
    influenceFactor = lerp(maxInfluence, minInfluence, adjustedInfluence);
  }

  let modifyFactor = adjustedBaseWindMulti * MAX_WIND_MULTI * influenceFactor * 100;
  let dynamicWindMultiplier = Math.max(modifyFactor, baseMultiplier);
  dynamicWindMultiplier = parseFloat(dynamicWindMultiplier.toFixed(4));
  
  //console.log(normalizedDistance);
  //divide normalizedDistance by 100 to fit within the MAX_WIND_MULTI range, between 0.001 and 0.004. Take normalizedDistance/1000 away from MAX_WIND_MULTI in order to have high wind multiplier when the distance is small between the two vectors. 
  let adjustDistance = MAX_WIND_MULTI - (normalizedDistance/100);
  //console.log(adjustDistance);

  let safeWindMulti = constrain(adjustDistance, 0.001, MAX_WIND_MULTI);

  wind.mult(safeWindMulti);

  let scaledWind = wind.copy().mult(2); // Scaled for note heads
  let scaledParticleWind = wind.copy().mult(0.075); // Scaled for stave lines

  windXoff += 0.04;
  windYoff += 0.04;

  return { originalWind: { x: scaledParticleWind.x, y: scaledParticleWind.y }, scaledWind: { x: scaledWind.x, y: scaledWind.y } };
}


//.........................................


function updateWindMultiplierBasedOnStability(stabilityAssessment) {
    let baseMultiplierIncrement = 0.0001; // Base increment for the multiplier
    let varianceInfluenceFactor = 0.005; // Determines how much scaledVariance influences the increment
    let maxMultiplier = 0.009; // Maximum multiplier value

    if (stabilityAssessment.isStable) {
        //console.log("IS STABLE");
        // Calculate the additional increment based on scaledVariance, ensuring it's positive
        isStable = true;
        let varianceBasedIncrement = Math.max(scaledVariance * varianceInfluenceFactor, 0);
        // Combine base increment with variance-based increment
        let combinedIncrement = baseMultiplierIncrement + varianceBasedIncrement;
        // Calculate the new duration multiplier, incorporating both stability duration and scaledVariance
        let durationMultiplier = Math.min(maxMultiplier, windMulti + (stabilityAssessment.stableDuration / 10000) * combinedIncrement);
        // Update windMulti only if it's increasing, and consider the scaledVariance influence
        windMulti = Math.max(windMulti, durationMultiplier);
    } else {
        //console.log("UNSTABLE");
        isStable = false;
        // Optionally reset to a small value or adjust based on scaledVariance
        windMulti = Math.min(0.0001 + scaledVariance * varianceInfluenceFactor, maxMultiplier); // Reset with a slight increase based on variance
    }
    //console.log("WINDMULTI", windMulti);
}




  
function clef(){
  let pos = createVector(58, 160);
  rectMode(CENTER);
  imageMode(CENTER);
  push()
  translate(pos.x, pos.y-size/2)
  rotate(map(sin(wobble), -1, 1, -QUARTER_PI/5, QUARTER_PI/5));
  translate(0, size/2)
  image(bassclef, 0, 0);
  //rect(0, 0, size, size);
  pop()
  wobble += 0.05
  
  
  
}
  

function mousePressed() {
    boxes.push(new Box(mouseX, mouseY, 12));
}


function keyPressed() {
  
}

//.......................SLIDERS...............................

function updateSliderValue(){
  let volume = parseFloat(customSlider.value()); // Convert the slider's value to a float
  console.log("Volume", volume);
  audioIn.amp(volume);// Apply the volume to the microphone's amplitude
 
  
}



function updateForceValue(){
  // Slider value ranges from 0 to 1
  let sliderValue = forceSlider.value(); // Get the current value of the slider
  
  // Map the slider value (0 to 1) directly to the MAX_WIND_MULTI range (0.001 to 0.009)
  MAX_WIND_MULTI = map(sliderValue, 0, 1, 0.001, 0.009);
  console.log("Force Value", sliderValue);
  
  // Optionally, log the updated MAX_WIND_MULTI value to the console for verification
  //console.log('Updated MAX_WIND_MULTI:', MAX_WIND_MULTI);
  //console.log(sliderValue);
}

//function for evaluating the number of high peaks in the spectrum
function updatePeakValue(){
  // Slider value ranges from 0 to 1
  let PeakSliderValue = peakSlider.value(); // Get the current value of the slider
  
  // Map the slider value (0 to 1) directly to the MAX_WIND_MULTI range (0.001 to 0.009)
  // MAX_WIND_MULTI = map(sliderValue, 0, 1, 0.001, 0.009);
  
  // Optionally, log the updated MAX_WIND_MULTI value to the console for verification
  peakAmpThreshold = map(PeakSliderValue, 0, 1, 5, 150); //don't want a 0 value for peak amplitudes so set the minimum to 10
  console.log("Peak Slider", peakAmpThreshold);
}

function updateStabilityValue(){
  // Slider value ranges from 0 to 1
  let sliderValue = stabilitySlider.value(); // Get the current value of the slider
  
  stabilityThreshold = sliderValue;
  console.log("StabilityThreshold", stabilityThreshold)
  //console.log("Stability Threshold", stabilityThreshold)
  // Map the slider value (0 to 1) directly to the MAX_WIND_MULTI range (0.001 to 0.009)
  //MAX_WIND_MULTI = map(sliderValue, 0, 1, 0.001, 0.009);
  
  // Optionally, log the updated MAX_WIND_MULTI value to the console for verification
  //console.log('Updated MAX_WIND_MULTI:', MAX_WIND_MULTI);
  //console.log(sliderValue);
}


function assessStability(fluxHistory, maxFluxWindow, currentTime) {
    let stabilityDurationThreshold = 1000; // Example threshold
    let stabilityMinimum = stabilityThreshold;
    let amplitudeThreshold = 0.002;

    let currentStability = fluxHistory.length > 0 ? fluxHistory[fluxHistory.length - 1].value : 0;
    let currentAmplitude = audioIn.getLevel();

    //console.log("Stability Check - Amplitude:", currentAmplitude, "Stability:", currentStability);

    if (currentAmplitude > amplitudeThreshold && currentStability < stabilityMinimum) {
        if (lastStableTime === 0) lastStableTime = currentTime;
        stabilityRecords.push({ time: currentTime, duration: currentTime - lastStableTime });
        //console.log("Updated Stability Records:", stabilityRecords);
        return {
            isStable: true,
            stableDuration: currentTime - lastStableTime
        };
    } else {
        lastStableTime = 0;
        return {
            isStable: false,
            stableDuration: 0
        };
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




