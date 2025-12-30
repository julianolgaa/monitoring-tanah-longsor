// Nama File: src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- PASTE KODE 'const firebaseConfig' DARI BROWSER DI BAWAH INI ---
// (Timpa/Ganti bagian ini dengan hasil copy Anda)

const firebaseConfig = {
  apiKey: "AIzaSyDUg_V-iOvYfDQDSzXHxHJmVxsebXkshvE",
  authDomain: "monitoring-tanah-longsor.firebaseapp.com",
  databaseURL: "https://monitoring-tanah-longsor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monitoring-tanah-longsor",
  storageBucket: "monitoring-tanah-longsor.firebasestorage.app",
  messagingSenderId: "106029345682",
  appId: "1:106029345682:web:e41a4cf215928a267fef4b"
};

// ------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // Kita butuh ini untuk fitur realtime

export { db };