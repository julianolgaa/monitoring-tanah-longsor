<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from './firebaseconfig';
import { ref as dbRef, onValue } from 'firebase/database';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- DATA SENSOR ---
const sensorData = ref({
  hujan: 0,           // 0 = Cerah, 1 = Hujan
  tanah: 0, 
  genangan_permukaan: 0,      // Genangan Permukaan
  getaran: 0, 
  kemiringan: 0,
  gps: { lat: 0, lng: 0 }
});

const lastUpdate = ref(new Date().toLocaleTimeString());

// --- LOGIKA STATUS GLOBAL ---
const statusGlobal = computed(() => {
  // 1. BAHAYA: Getaran (1) ATAU Miring (>20)
  if (sensorData.value.getaran == 1 || Math.abs(sensorData.value.kemiringan) > 20) {
    return { text: 'BAHAYA EVAKUASI!', class: 'status-danger', icon: '🚨' };
  }

  // 2. SIAGA: Hujan (1) DAN Tanah Basah (<2500)
  if (sensorData.value.hujan == 1 && sensorData.value.tanah < 2500) {
    return { text: 'SIAGA / WASPADA', class: 'status-warning', icon: '⚠️' };
  }
  
  // 3. AMAN
  return { text: 'KONDISI AMAN', class: 'status-safe', icon: '🛡️' };
});

// --- LOGIKA LABEL SENSOR ---
// Label Hujan tidak dipakai di script karena langsung di template, tapi dibiarkan aman
const labelHujan = computed(() => sensorData.value.hujan == 1 ? 'Hujan Turun' : 'Cerah / Kering');
const classHujan = computed(() => sensorData.value.hujan == 1 ? 'pill-danger' : 'pill-safe');

const labelTanah = computed(() => {
  const nilai = sensorData.value.tanah;
  if (nilai > 2900) return 'Kering';
  if (nilai >= 2500) return 'Lembab';
  return 'Basah';
});
const classTanah = computed(() => {
  const nilai = sensorData.value.tanah;
  if (nilai > 2900) return 'pill-safe';
  if (nilai >= 2500) return 'pill-warning';
  return 'pill-danger';
});

const labelAir = computed(() => sensorData.value.genangan_permukaan > 400 ? 'Ada Genangan' : 'Kering');

let map = null;
let marker = null;

onMounted(() => {
  map = L.map('mapContainer', { zoomControl: false }).setView([-6.200000, 106.816666], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  const icon = L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color:#FF3333; width:15px; height:15px; border-radius:50%; border:3px solid white; box-shadow: 0 0 10px rgba(255,0,0,0.5); animation: pulse-pin 1s infinite;"></div>`
  });
  marker = L.marker([0, 0], {icon: icon}).addTo(map);

  const dataRef = dbRef(db, 'monitoring');
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      sensorData.value = data;
      lastUpdate.value = new Date().toLocaleTimeString();
      
      if (data.gps && data.gps.lat) {
        const pos = [data.gps.lat, data.gps.lng];
        marker.setLatLng(pos);
        map.panTo(pos);
      }
    }
  });
});
</script>

<template>
  <div :class="['main-wrapper', { 'panic-mode': statusGlobal.class === 'status-danger' }]">
    
    <div class="bg-shape"></div>

    <div class="container">
      
      <header :class="['main-header', statusGlobal.class]">
        <div class="header-content">
          <div class="status-icon">{{ statusGlobal.icon }}</div>
          <div>
            <h1>SISTEM MONITORING LONGSOR</h1>
            <div class="status-text">{{ statusGlobal.text }}</div>
          </div>
        </div>
        <div class="time-badge">Update: {{ lastUpdate }}</div>
      </header>

      <div class="sensor-group-main">
        
        <div class="card sensor-card" :class="{'blink-animation': sensorData.hujan == 1}">
          <div class="card-icon">🌧️</div>
          <div class="card-info">
            <h3>Sensor Hujan</h3>
            <div class="value-text" :style="{color: sensorData.hujan == 1 ? 'red' : '#2c3e50', fontSize: '2rem'}">
              {{ sensorData.hujan == 1 ? 'HUJAN TURUN' : 'CERAH' }}
            </div>
            <small v-if="sensorData.hujan == 1" style="color:red; font-weight:bold;">TANAH BASAH!</small>
          </div>
        </div>

        <div class="card sensor-card">
          <div class="card-icon">🌱</div>
          <div class="card-info">
            <h3>Kelembaban Tanah</h3>
            <div class="value-text">{{ sensorData.tanah }}</div>
            <div class="status-pill" :class="classTanah">
              {{ labelTanah }}
            </div>
             <div class="progress-bg">
              <div class="progress-fill" :style="{ width: (100 - (sensorData.tanah/4095)*100) + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="card sensor-card">
          <div class="card-icon">🌊</div>
          <div class="card-info">
            <h3>Genangan Permukaan</h3>
            <div class="value-text">{{ sensorData.genangan_permukaan }}</div>
            <div class="status-pill" :class="sensorData.genangan_permukaan > 400 ? 'pill-danger' : 'pill-safe'">
              {{ labelAir }}
            </div>
          </div>
        </div>

      </div> 
      
      <div class="sensor-group-structural">

        <div class="card sensor-card" :class="{'blink-animation': sensorData.getaran == 1}">
          <div class="card-icon">⚠️</div>
          <div class="card-info">
            <h3>Sensor Getaran</h3>
            <div class="value-text" :style="{color: sensorData.getaran == 1 ? 'red' : '#2c3e50'}">
              {{ sensorData.getaran == 1 ? 'TERDETEKSI' : 'AMAN' }}
            </div>
            <small v-if="sensorData.getaran == 1" style="color:red; font-weight:bold;">TANAH BERGERAK!</small>
          </div>
        </div>

        <div class="card sensor-card">
          <div class="card-info">
            <h3>Kemiringan (Tilt)</h3>
            <div class="value-text">{{ sensorData.kemiringan }}°</div>
          </div>
          <div class="tilt-visual">
            <div class="ground-line"></div>
            <div class="box-visual" :style="{ transform: `rotate(${sensorData.kemiringan}deg)` }">
              <span class="arrow">⬆</span>
            </div>
          </div>
        </div>
        
      </div> 
      
      <div class="card map-card">
        <div class="map-header">
          <h3>📍 Lokasi GPS Real-time</h3>
          <p>Lat: {{ sensorData.gps.lat }} | Lng: {{ sensorData.gps.lng }}</p>
        </div>
        <div id="mapContainer"></div>
      </div>

    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap');
</style>

<style scoped>
/* --- BASE STYLES --- */
.main-wrapper {
  min-height: 100vh;
  background-color: #f0f2f5;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  padding: 20px;
  transition: background-color 0.5s ease;
}

/* Animasi Background Berkedip saat Bahaya Global */
@keyframes bg-panic {
  0% { background-color: #f0f2f5; }
  50% { background-color: #ffcccc; }
  100% { background-color: #f0f2f5; }
}
.panic-mode {
  animation: bg-panic 1s infinite;
}

.container { max-width: 95%; margin: 0 auto; }

/* HEADER */
.main-header {
  border-radius: 12px;
  padding: 20px 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.5s;
}
.header-content { display: flex; align-items: center; gap: 20px; }
.status-icon { font-size: 2.5rem; }
.main-header h1 { margin: 0; font-size: 1.2rem; opacity: 0.9; letter-spacing: 1px; }
.status-text { font-size: 1.8rem; font-weight: 800; margin-top: 5px; }
.time-badge { background: rgba(255,255,255,0.25); padding: 5px 15px; border-radius: 20px; font-weight: bold;}

.status-safe { background: linear-gradient(135deg, #11998e, #38ef7d); }
.status-warning { background: linear-gradient(135deg, #f2994a, #f2c94c); color: #333; }
.status-danger { background: linear-gradient(135deg, #cb2d3e, #ef473a); animation: pulse-danger 1.5s infinite; }

/* --- LAYOUT GRID --- */

/* Grup 1: 3 Sensor Atas (Layout Flexible) */
.sensor-group-main {
  display: grid;
  /* Minimal lebar 300px, sisanya dibagi rata */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 25px;
  margin-bottom: 25px;
}

/* Grup 2: 2 Sensor Bawah (Getaran & Kemiringan - Memanjang Sama Besar) */
.sensor-group-structural {
  display: grid;
  /* Memaksa tepat 2 kolom dengan ukuran sama rata (1 fraction each) */
  grid-template-columns: 1fr 1fr; 
  gap: 25px;
  margin-bottom: 25px;
}

/* Responsif untuk HP: Grup bawah jadi tumpuk 1 kolom */
@media (max-width: 768px) {
  .sensor-group-structural {
    grid-template-columns: 1fr; 
  }
}

/* CARD DESIGN */
.card {
  background: white;
  border-radius: 12px;
  padding: 25px; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.3s, background-color 0.3s, border-color 0.3s;
  border: 2px solid transparent; 
}
.card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.sensor-card { display: flex; align-items: center; justify-content: space-between; }

.card-icon {
  font-size: 3rem; 
  background: #f8f9fa;
  width: 80px; height: 80px; 
  display: flex; align-items: center; justify-content: center;
  border-radius: 15px; margin-right: 20px;
}
.card-info { flex-grow: 1; }
.card-info h3 { margin: 0; font-size: 1rem; color: #7f8c8d; text-transform: uppercase; font-weight: 600; }

/* Font Digital untuk Angka */
.value-text { 
  font-family: 'Chakra Petch', sans-serif;
  font-size: 2.8rem;
  font-weight: 700; 
  color: #2c3e50; 
  margin: 5px 0;
  letter-spacing: 1px;
}

/* STATUS PILL */
.status-pill { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; font-family: 'Segoe UI', sans-serif;}
.pill-safe { background: #d4edda; color: #155724; }
.pill-warning { background: #fff3cd; color: #856404; }
.pill-danger { background: #f8d7da; color: #721c24; }

.progress-bg { width: 100%; height: 8px; background: #eee; border-radius: 4px; margin-top: 10px; overflow: hidden; }
.progress-fill { height: 100%; background: #3498db; transition: width 0.5s ease; }

/* --- ANIMASI BARU (BLINK) --- */
@keyframes blink-alert-card {
  0%, 100% { background-color: white; border-color: transparent; }
  50% { background-color: #fff0f0; border-color: red; } /* Merah sangat muda & border merah */
}

/* Class untuk animasi blink */
.blink-animation {
  animation: blink-alert-card 1s infinite;
}

/* VISUAL KEMIRINGAN */
.tilt-visual { width: 70px; height: 70px; background: #eef2f3; border-radius: 50%; position: relative; display: flex; align-items: center; justify-content: center; border: 2px solid #bdc3c7; }
.box-visual { width: 4px; height: 45px; background: #e74c3c; position: absolute; transition: transform 0.5s; }
.box-visual .arrow { position: absolute; top: -15px; left: -5px; color: #e74c3c; }
.ground-line { position: absolute; width: 100%; height: 1px; background: #95a5a6; }

/* MAP */
#mapContainer { height: 400px; width: 100%; border-radius: 12px; z-index: 1; }
.map-header { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: bold; }

/* Keyframes lain */
@keyframes pulse-danger { 0% { box-shadow: 0 0 0 0 rgba(239, 71, 58, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(239, 71, 58, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 71, 58, 0); } }
@keyframes pulse-pin { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
</style>