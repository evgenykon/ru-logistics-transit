<script setup lang="ts">
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{ orderId: string }>()
const { $api } = useNuxtApp()

const tileStyle = ref('osm:')
const points = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const mapContainer = ref<HTMLElement>()
const searchInput = ref('')
const suggestions = ref<any[]>([])
const showSuggestions = ref(false)
let searchTimer: any = null
const showManual = ref(false)
const manualMode = ref(false)
const manualLat = ref(55.751244)
const manualLng = ref(37.618423)
const errorMsg = ref('')

let map: any = null
let marker: any = null

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активен',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

onMounted(async () => {
  try {
    const [{ data: pointsData }, { data: modules }] = await Promise.all([
      $api.get(`/tracking/order/${props.orderId}`),
      $api.get('/modules'),
    ])
    points.value = pointsData
    const trackingMod = modules.find((m: any) => m.key === 'tracking')
    if (trackingMod?.config?.tileStyle) {
      tileStyle.value = trackingMod.config.tileStyle
    }
  } catch {
    points.value = []
  } finally {
    loading.value = false
  }
  initMap()
})

onUnmounted(() => {
  if (map) map.remove()
})

watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  if (!val.trim() || val.length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&accept-language=ru`)
      suggestions.value = await res.json()
      showSuggestions.value = suggestions.value.length > 0
    } catch { suggestions.value = []; showSuggestions.value = false }
  }, 300)
})

function selectSuggestion(s: any) {
  manualLat.value = parseFloat(parseFloat(s.lat).toFixed(6))
  manualLng.value = parseFloat(parseFloat(s.lon).toFixed(6))
  searchInput.value = s.display_name
  suggestions.value = []
  showSuggestions.value = false
  if (map) {
    map.flyTo({ center: [manualLng.value, manualLat.value], zoom: 14 })
    updateMarker(manualLng.value, manualLat.value)
    showManual.value = true
  }
}

function initMap() {
  if (!mapContainer.value) return

  const lastPoint = points.value[points.value.length - 1]
  const center: [number, number] = lastPoint ? [lastPoint.lng, lastPoint.lat] : [manualLng.value, manualLat.value]

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: tileStyle.value === 'osm:'
      ? {
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
        }
      : tileStyle.value.startsWith('raster:')
        ? {
            version: 8,
            sources: {
              r: {
                type: 'raster',
                tiles: [tileStyle.value.replace('raster:', '')],
                tileSize: 256,
              },
            },
            layers: [{ id: 'r', type: 'raster', source: 'r' }],
          }
        : tileStyle.value,
    center,
    zoom: lastPoint ? 12 : 5,
  })

  map.addControl(new maplibregl.NavigationControl(), 'top-right')

  map.on('load', () => {
    if (points.value.length) {
      const coords = points.value.map((p: any) => [p.lng, p.lat])

      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        },
      })

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#3b82f6', 'line-width': 3 },
      })

      for (const p of points.value) {
        const el = document.createElement('div')
        el.className = 'map-dot'
        new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .addTo(map)
      }
    }

    map.on('click', (e: any) => {
      if (!manualMode.value) return
      const { lng, lat } = e.lngLat
      manualLat.value = parseFloat(lat.toFixed(6))
      manualLng.value = parseFloat(lng.toFixed(6))
      showManual.value = true
      manualMode.value = false
      map.getCanvas().style.cursor = ''
      updateMarker(lng, lat)
    })
    if (manualMode.value) {
      map.getCanvas().style.cursor = 'crosshair'
    }
  })
}

function updateMarker(lng: number, lat: number) {
  if (!map) return
  if (marker) marker.remove()
  const el = document.createElement('div')
  el.className = 'map-marker'
  el.innerHTML = '📍'
  marker = new maplibregl.Marker({ element })
    .setLngLat([lng, lat])
    .addTo(map)
}

function toggleManualMode() {
  manualMode.value = !manualMode.value
  if (map) {
    map.getCanvas().style.cursor = manualMode.value ? 'crosshair' : ''
  }
}

function onMapClick() {
  showManual.value = true
}

async function savePoint() {
  errorMsg.value = ''
  saving.value = true
  try {
    await $api.post('/tracking', {
      orderId: props.orderId,
      lat: manualLat.value,
      lng: manualLng.value,
      source: 'manual',
    })
    const { data } = await $api.get(`/tracking/order/${props.orderId}`)
    points.value = data
    showManual.value = false
    if (map) {
      map.remove()
      map = null
    }
    initMap()
  } catch {
    errorMsg.value = 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="search-wrapper">
      <div class="search-bar">
        <input v-model="searchInput" type="text" placeholder="Поиск города или адреса..." class="search-input" @focus="showSuggestions = suggestions.length > 0" @blur="setTimeout(() => showSuggestions = false, 200)" />
      </div>
      <div v-if="showSuggestions && suggestions.length" class="suggestions">
        <div v-for="s in suggestions" :key="s.place_id" class="suggestion-item" @mousedown.prevent="selectSuggestion(s)">
          <span class="sug-name">{{ s.display_name }}</span>
        </div>
      </div>
    </div>
    <div ref="mapContainer" class="track-map" @dblclick="onMapClick" />

    <div class="map-toolbar">
      <button class="btn-outline" :class="{ active: manualMode }" @click="toggleManualMode">
        {{ manualMode ? '✕ Отмена' : '🎯 Указать на карте' }}
      </button>
      <span v-if="manualMode" class="manual-hint">Кликните по карте чтобы указать координаты</span>
    </div>

    <div v-if="showManual" class="manual-panel">
      <div class="manual-row">
        <div class="field field-lat">
          <label>Широта</label>
          <input v-model.number="manualLat" type="number" step="0.000001" class="input-sm" />
        </div>
        <div class="field field-lng">
          <label>Долгота</label>
          <input v-model.number="manualLng" type="number" step="0.000001" class="input-sm" />
        </div>
        <button class="btn-primary btn-sm" :disabled="saving" @click="savePoint">
          {{ saving ? '...' : 'Сохранить точку' }}
        </button>
      </div>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div class="hint">Кликните на карте чтобы указать координаты</div>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <table v-else-if="points.length" class="track-table">
      <thead>
        <tr>
          <th>Время</th>
          <th>Координаты</th>
          <th>Скорость</th>
          <th>Источник</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in points" :key="p.id">
          <td class="cell-date">{{ new Date(p.recordedAt).toLocaleString('ru-RU') }}</td>
          <td class="cell-coords">{{ p.lat.toFixed(4) }}, {{ p.lng.toFixed(4) }}</td>
          <td>{{ p.speed ? p.speed + ' км/ч' : '—' }}</td>
          <td>{{ p.source === 'manual' ? 'Вручную' : 'Авто' }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else-if="!loading" class="empty">Нет точек трекинга. Укажите расположение на карте.</p>
  </div>
</template>

<style scoped lang="scss">
.search-wrapper {
  position: relative;
  margin-bottom: 8px;
}

.search-bar {
  display: flex;
}

.search-input {
  width: 100%;
  padding: 7px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #0f172a;
  outline: none;
  &:focus { border-color: #3b82f6; }
  &::placeholder { color: #94a3b8; }
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  font-size: 12px;
  color: #0f172a;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  &:hover { background: #f8fafc; }
  &:last-child { border-bottom: none; }
}

.sug-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-map {
  width: 100%;
  height: 350px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
}

:deep(.map-dot) {
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border-radius: 50%;
  border: 2px solid #fff;
  cursor: pointer;
}

:deep(.map-marker) {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
}

.map-toolbar {
  margin-bottom: 12px;
}

.btn-outline {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #f8fafc; border-color: #cbd5e1; }
  &.active { background: #dbeafe; border-color: #3b82f6; color: #1d4ed8; }
}

.manual-hint {
  font-size: 11px;
  color: #ef4444;
  margin-left: 8px;
}

.manual-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.manual-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 2px;

  label {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
  }
}

.field-lat { width: 140px; }
.field-lng { width: 140px; }

.input-sm {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  color: #0f172a;
  outline: none;
  font-family: monospace;
  &:focus { border-color: #3b82f6; }
}

.btn-sm {
  padding: 6px 14px;
  font-size: 12px;
}

.btn-primary {
  border-radius: 6px;
  border: none;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #2563eb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}

.error-msg { color: #ef4444; font-size: 12px; margin-top: 6px; }

.loading { color: #64748b; font-size: 14px; padding: 16px 0; }

.track-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th {
    text-align: left;
    padding: 8px 12px;
    font-weight: 600;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  td {
    padding: 8px 12px;
    color: #0f172a;
    border-bottom: 1px solid #f1f5f9;
  }

  tr:last-child td { border-bottom: none; }
}

.cell-date { white-space: nowrap; }
.cell-coords { font-family: monospace; font-size: 11px; }
.empty { color: #94a3b8; font-size: 13px; text-align: center; padding: 24px; }
</style>
