// Mengimpor fungsi Firebase langsung melalui CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// =====================================================================
// 1. KONFIGURASI FIREBASE
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC-dHBibhhC5nPHwGcFay2gSYa0Yrr4OjA",
  authDomain: "jlc-cat-2026.firebaseapp.com",
  projectId: "jlc-cat-2026",
  storageBucket: "jlc-cat-2026.firebasestorage.app",
  messagingSenderId: "1012795910879",
  appId: "1:1012795910879:web:18bee42b3f1b820cf0576a",
  measurementId: "G-DMYZ02L220"
};

// Koleksi khusus Latihan TKP (terpisah dari koleksi "hasil_ujian" milik simulasi CAT)
const NAMA_KOLEKSI = "hasil_latihan_tkp";

// Opsional: isi dengan URL Web App Google Apps Script untuk pengiriman ganda ke Google Sheets.
// Kosongkan ("") jika tidak dipakai.
const GOOGLE_SHEETS_URL = "";

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { /* Analytics tidak wajib */ }
const db = getFirestore(app);

// =====================================================================
// 2. DEVICE ID & HITUNGAN PERCOBAAN (disimpan di perangkat peserta)
// =====================================================================
function getDeviceID() {
  let did = localStorage.getItem("jlc_device_id");
  if (!did) {
    did = "JLC-DEV-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    localStorage.setItem("jlc_device_id", did);
  }
  return did;
}

// Percobaan ke-berapa untuk perangkat ini. Dihitung lokal supaya aturan Firestore
// cukup mengizinkan "create" saja (tanpa membuka akses baca data peserta lain).
function ambilPercobaanKe() {
  const kunci = "jlc_tkp_percobaan";
  let n = parseInt(localStorage.getItem(kunci), 10);
  n = (isNaN(n) || n < 0 ? 0 : n) + 1;
  localStorage.setItem(kunci, String(n));
  return n;
}

// =====================================================================
// 3. PENGIRIMAN DATA HASIL LATIHAN
//    hasil = { nama, no_peserta, durasi_waktu, sisa_waktu, total_skor }
// =====================================================================
window.simpanKeDatabaseBackground = async function (hasil) {
  try {
    const data = {
      device_id: getDeviceID(),
      nama: String(hasil.nama || ""),
      no_peserta: String(hasil.no_peserta || ""),
      percobaan_ke: ambilPercobaanKe(),
      durasi_waktu: String(hasil.durasi_waktu || ""),
      sisa_waktu: String(hasil.sisa_waktu || ""),
      total_skor: Number(hasil.total_skor) || 0
    };

    // TAHAP A: Firebase
    await addDoc(collection(db, NAMA_KOLEKSI), { ...data, waktu_selesai: serverTimestamp() });
    console.log("Data berhasil masuk Firebase! Percobaan ke-" + data.percobaan_ke);

    // TAHAP B: Google Sheets (opsional)
    if (GOOGLE_SHEETS_URL) {
      fetch(GOOGLE_SHEETS_URL, { method: "POST", body: JSON.stringify(data) })
        .then(() => console.log("Sinyal pengiriman ke Google Sheets telah diluncurkan."))
        .catch(err => console.error("Gagal mengirim ke Sheets:", err));
    }
  } catch (e) {
    console.error("Gagal menyimpan data: ", e);
  }
};
