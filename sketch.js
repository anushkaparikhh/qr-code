// import Firebase functions from global window
const storage = window.storage;
const db = window.db;
const collection = window.collection;
const addDoc = window.addDoc;

const ref = window.ref;
const uploadBytes = window.uploadBytes;  // ✔️ now defined
const getDownloadURL = window.getDownloadURL; // ✔️ now defined



// sketch.js — Firebase v12 fixed version

let video;
let capturedImage;
let qrCanvas;
let saved = false;

let captureBtn, saveBtn, nameInput;

let qrSize = 29;
let moduleSize = 12;

function setup() {
  createCanvas(400, 400).parent(document.body);
  pixelDensity(1);
  background(220);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();


  captureBtn = select("#captureBtn");
  saveBtn = select("#saveBtn");
  nameInput = select("#nameInput");

  captureBtn.mousePressed(capturePhoto);
  saveBtn.mousePressed(saveToFirebase);
}

function draw() {
  if (!saved) {
  push();
    // Flip horizontally to un-mirror the webcam
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  } else if (capturedImage && qrCanvas) {
    image(capturedImage, 0, 0, width, height);
    image(qrCanvas, width * 0.3, height * 0.3, width * 0.4, height * 0.4);
  }
}

function capturePhoto() {
  saved = true;

  capturedImage = createImage(width, height);
  capturedImage.copy(video, 0, 0, width, height, 0, 0, width, height);

  qrCanvas = createGraphics(qrSize * moduleSize, qrSize * moduleSize);
  generateFakeQR(qrCanvas, capturedImage);

  saveBtn.show();
}

// -------- QR GENERATION --------

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

      let px = gx * moduleSize;
      let py = gy * moduleSize;
      let i = (px + py * pg.width) * 4;

      let r = pg.pixels[i];
      let g = pg.pixels[i + 1];
      let b = pg.pixels[i + 2];

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

// -------- SAVE TO FIREBASE (v12) --------

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


      // Save record in Firestore (use window.db to ensure Firestore is initialized)
      await window.addDoc(window.collection(window.db, "gallery"), {
        name,
        url,
        timestamp: window.Date.now()
      });

      alert("Saved to Firebase!");
      saveBtn.hide();

      window.location.href = "gallery.html";

    } catch (err) {
      console.error(err);
      alert("Error saving to Firebase.");
    }
  });
}


//button transition
// button transition
function capturePhoto() {
  saved = true;

  capturedImage = createImage(width, height);
  capturedImage.copy(video, 0, 0, width, height, 0, 0, width, height);

  qrCanvas = createGraphics(qrSize * moduleSize, qrSize * moduleSize);
  generateFakeQR(qrCanvas, capturedImage);

  // Hide capture button, show save button
  captureBtn.hide();
  saveBtn.show();
}




