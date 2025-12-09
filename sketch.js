// import Firebase functions from global window
const storage = window.storage;
const db = window.db;
const collection = window.collection;
const addDoc = window.addDoc;

const ref = window.ref;
const uploadBytes = window.uploadBytes;  // ✔️ now defined
const getDownloadURL = window.getDownloadURL; // ✔️ now defined



// sketch.js — Firebase v12 fixed version

// sketch.js — replace your current file with this

let video;
let capturedImage;   // p5.Image used for the saved/captured photo
let qrCanvas;        // p5.Graphics for the fake QR
let saved = false;

let captureBtn, saveBtn, nameInput;

let qrSize = 29;
let moduleSize = 12;

function setup() {
  createCanvas(400, 400).parent(document.body);
  pixelDensity(1);
  background(220);

  // DON'T force a square video size here — let the video have its natural aspect
  video = createCapture(VIDEO);
  video.hide();

  captureBtn = select("#captureBtn");
  saveBtn = select("#saveBtn");
  nameInput = select("#nameInput");

  captureBtn.mousePressed(capturePhoto);
  saveBtn.mousePressed(saveToFirebase);
  saveBtn.hide();
}

function draw() {
  background(0);

  // if video not ready yet, bail
  if (!video || video.width === 0) {
    fill(255);
    textAlign(CENTER, CENTER);
    text("Waiting for camera...", width/2, height/2);
    return;
  }

  // center-square crop parameters from the source video
  let camW = video.width;
  let camH = video.height;
  let s = min(camW, camH);
  let sx = (camW - s) / 2;
  let sy = (camH - s) / 2;

  if (!saved) {
    // draw a single mirrored preview (only once)
    push();
    translate(width, 0);
    scale(-1, 1); // mirror for webcam-like preview
    // Draw the centered square from the video scaled to fill the canvas
    image(video, 0, 0, width, height, sx, sy, s, s);
    pop();
  } else if (capturedImage && qrCanvas) {
    // show the captured (already-flipped) image exactly filling canvas
    imageMode(CORNER);
    image(capturedImage, 0, 0, width, height);
    // draw QR overlay in front
    image(qrCanvas, width * 0.3, height * 0.3, width * 0.4, height * 0.4);
  }
}

/* ---------------- Capturing and ensuring preview==capture ----------------
   Important: we draw the video into a graphics buffer with the SAME transform
   (mirrored + the center-square crop) and then extract that buffer as the
   capturedImage. That guarantees the captured image looks exactly like the preview.
-------------------------------------------------------------------------- */
function capturePhoto() {
  saved = true;

  // ensure video is ready
  if (!video || video.width === 0) return;

  // center-square crop parameters (same as draw)
  let camW = video.width;
  let camH = video.height;
  let s = min(camW, camH);
  let sx = (camW - s) / 2;
  let sy = (camH - s) / 2;

  // draw the exact preview into a graphics buffer
  let buf = createGraphics(width, height);
  buf.push();
  // apply same mirror transform used in draw()
  buf.translate(width, 0);
  buf.scale(-1, 1);
  buf.image(video, 0, 0, width, height, sx, sy, s, s);
  buf.pop();

  // get a p5.Image from the buffer (capturedImage will be used later and saved)
  capturedImage = buf.get(); // gets the pixels of the buffer as a p5.Image

  // build the fake QR using the captured image
  qrCanvas = createGraphics(qrSize * moduleSize, qrSize * moduleSize);
  generateFakeQR(qrCanvas, capturedImage);

  captureBtn.hide();
  saveBtn.show();
}

/* ----------------- QR generation (unchanged logic, same as yours) ----------------- */
function generateFakeQR(pg, img) {
  pg.image(img, 0, 0, pg.width, pg.height);
  pg.loadPixels();

  let qr = Array.from({ length: qrSize }, () => Array(qrSize).fill(null));

  placeFinder(qr, 0, 0);
  placeFinder(qr, qrSize - 7, 0);
  placeFinder(qr, 0, qrSize - 7);
  placeTimingPatterns(qr);
  placeAlignment(qr, 22, 22);
  fillDataFromImage(qr, pg);
  fillRemainingLight(qr);

  for (let x = 0; x < qrSize; x++) {
    for (let y = 0; y < qrSize; y++) {
      pg.noStroke();
      pg.fill(qr[x][y] ? 0 : 255);
      pg.square(x * moduleSize, y * moduleSize, moduleSize);
    }
  }
}

function placeFinder(qr, gx, gy) {
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      let isOuter = x === 0 || x === 6 || y === 0 || y === 6;
      let isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      qr[gx + x][gy + y] = (isOuter || isInner) ? 1 : 0;
    }
  }
}

function placeTimingPatterns(qr) {
  for (let i = 8; i < qrSize - 8; i++) {
    qr[i][6] = i % 2;
    qr[6][i] = i % 2;
  }
}

function placeAlignment(qr, cx, cy) {
  for (let x = -2; x <= 2; x++) {
    for (let y = -2; y <= 2; y++) {
      let absx = Math.abs(x);
      let absy = Math.abs(y);
      qr[cx + x][cy + y] =
        absx === 2 || absy === 2 || (x === 0 && y === 0) ? 1 : 0;
    }
  }
}

function fillDataFromImage(qr, pg) {
  pg.loadPixels();
  for (let gx = 0; gx < qrSize; gx++) {
    for (let gy = 0; gy < qrSize; gy++) {
      if (qr[gx][gy] !== null) continue;

      let px = Math.floor(gx * moduleSize);
      let py = Math.floor(gy * moduleSize);
      let i = (px + py * pg.width) * 4;

      let r = pg.pixels[i] || 0;
      let g = pg.pixels[i + 1] || 0;
      let b = pg.pixels[i + 2] || 0;

      let brightness = (r + g + b) / 3;
      let jitter = random(-25, 40);
      qr[gx][gy] = brightness + jitter < 110 ? 1 : 0;
    }
  }
}

function fillRemainingLight(qr) {
  for (let gx = 0; gx < qrSize; gx++) {
    for (let gy = 0; gy < qrSize; gy++) {
      if (qr[gx][gy] === null) {
        qr[gx][gy] = random() < 0.15 ? 1 : 0;
      }
    }
  }
}

/* ----------------- saveToFirebase (keep your original logic, unchanged) ----------------- */
async function saveToFirebase() {
  const name = nameInput.value();
  if (!name || !capturedImage || !qrCanvas) {
    alert("Enter a name and capture a photo first!");
    return;
  }

  let combined = createGraphics(width, height);
  combined.image(capturedImage, 0, 0, width, height);
  combined.image(qrCanvas, width * 0.3, height * 0.3, width * 0.4, height * 0.4);

  combined.canvas.toBlob(async (blob) => {
    try {
      const fileRef = window.ref(window.storage, `images/${Date.now()}.png`);
      await window.uploadBytes(fileRef, blob);
      const url = await window.getDownloadURL(fileRef);

      await window.addDoc(window.collection(window.db, "gallery"), {
        name,
        url,
        timestamp: window.Date.now()
      });

      //alert("Saved to Firebase!");//
      saveBtn.hide();
      window.location.href = "gallery.html";
    } catch (err) {
      console.error(err);
      alert("Error saving to Firebase.");
    }
  });
}
