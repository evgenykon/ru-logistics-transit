<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const { $api } = useNuxtApp()

const mapContainer = ref<HTMLElement>()
const showWarehouses = ref(false)
const showVehicles = ref(false)
const allWarehouses = ref<any[]>([])
const allVehicles = ref<any[]>([])
let map: any = null
let whMarkers: any[] = []
let vehMarkers: any[] = []

onMounted(() => initMap())
onUnmounted(() => { if (map) map.remove() })

function initMap() {
  if (!mapContainer.value) return
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center: [37.618423, 55.751244],
    zoom: 5,
  })
  map.addControl(new maplibregl.NavigationControl(), 'top-right')
}

function clearMarkers(arr: any[]) {
  for (const m of arr) m.remove()
  arr.length = 0
}

function buildMarkerEl(label: string, bg: string) {
  const el = document.createElement('div')
  el.style.cssText = `width:24px;height:24px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)`
  el.textContent = label
  return el
}

async function toggleWarehouses() {
  showWarehouses.value = !showWarehouses.value
  clearMarkers(whMarkers)
  if (showWarehouses.value) {
    if (!allWarehouses.value.length) {
      try { const { data } = await $api.get('/warehouses'); allWarehouses.value = data } catch {}
    }
    for (const w of allWarehouses.value) {
      if (!w.lat || !w.lng) continue
      const el = buildMarkerEl('С', '#3b82f6')
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([w.lng, w.lat])
        .setPopup(new maplibregl.Popup().setText(w.name))
        .addTo(map)
      whMarkers.push(m)
    }
  }
}

async function toggleVehicles() {
  showVehicles.value = !showVehicles.value
  clearMarkers(vehMarkers)
  if (showVehicles.value) {
    if (!allVehicles.value.length) {
      try { const { data } = await $api.get('/vehicles'); allVehicles.value = data } catch {}
    }
    let trackPoints: any[] = []
    try { const { data } = await $api.get('/tracking'); trackPoints = data } catch {}

    let orders: any[] = []
    try { const { data } = await $api.get('/orders'); orders = data } catch {}
    const orderVehicleMap = new Map<string, string>()
    for (const o of orders) {
      if (o.vehicleId) orderVehicleMap.set(o.id, o.vehicleId)
    }

    const vehicleTrackMap = new Map<string, any>()
    for (const tp of trackPoints) {
      const vehId = tp.vehicleId || (tp.orderId ? orderVehicleMap.get(tp.orderId) : null)
      if (vehId) {
        const existing = vehicleTrackMap.get(vehId)
        if (!existing || new Date(tp.recordedAt) > new Date(existing.recordedAt)) {
          vehicleTrackMap.set(vehId, tp)
        }
      }
    }

    for (const v of allVehicles.value) {
      const latest = vehicleTrackMap.get(v.id)
      const lat = latest?.lat ?? v.lat
      const lng = latest?.lng ?? v.lng
      if (!lat || !lng) continue

      const el = buildMarkerEl('Т', '#ef4444')
      const popupText = `${v.licensePlate} — ${v.brand} ${v.model}${latest ? '\n' + new Date(latest.recordedAt).toLocaleString('ru-RU') : ''}`
      const m = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setText(popupText))
        .addTo(map)
      vehMarkers.push(m)
    }
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Трекинг</h1>
    </div>

    <div class="map-toolbar">
      <label class="check-label">
        <input :checked="showWarehouses" type="checkbox" @change="toggleWarehouses" />
        <span>Склады</span>
      </label>
      <label class="check-label">
        <input :checked="showVehicles" type="checkbox" @change="toggleVehicles" />
        <span>Транспортные средства</span>
      </label>
    </div>

    <div ref="mapContainer" class="track-map" />
  </div>
</template>

<style scoped lang="scss">
.page-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px; }

.map-toolbar {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #0f172a;
  cursor: pointer;
  input { margin: 0; }
}

.track-map {
  width: 100%;
  height: calc(100vh - 220px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
</style>
