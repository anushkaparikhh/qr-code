// gallery.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD9Oj4pG2hQOrRC6kQHzYLaoYfclYqrkC4",
  authDomain: "qr-code-storage-cafbd.firebaseapp.com",
  projectId: "qr-code-storage-cafbd",
  storageBucket: "qr-code-storage-cafbd.appspot.com",
  messagingSenderId: "331142708016",
  appId: "1:331142708016:web:eacbda8f3ea08b87df66f5",
  measurementId: "G-BMQ5BXCJL4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Target the gallery container
const galleryDiv = document.getElementById("gallery");

// Load gallery entries from Firestore
async function loadGallery() {
  const q = query(
    collection(db, "gallery"),
    orderBy("timestamp", "desc") // Most recent first
  );
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    // Create gallery item
    const item = document.createElement("div");
    item.className = "grid-item";

    // Main captured photo
    const img = document.createElement("img");
    img.src = data.url; // full image with QR already
    item.appendChild(img);

    // Name caption below the image
    const nameDiv = document.createElement("div");
    nameDiv.className = "name";
    nameDiv.textContent = data.name;
    item.appendChild(nameDiv);

    if (nameText.length > 20) {
  nameDiv.classList.add("name-long");
} else {
  nameDiv.classList.add("name-short");
}


    // Append to gallery
    galleryDiv.appendChild(item);
  });
}

// Load gallery on page load
loadGallery();
