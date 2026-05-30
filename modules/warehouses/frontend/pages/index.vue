<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const auth = useAuthStore()
const route = useRoute()

const warehouses = ref<any[]>([])
const organizations = ref<{ id: string; name: string }[]>([])
const search = ref(route.query.search as string || '')
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')

const form = ref({
  name: '',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  area: null as number | null,
  type: 'closed',
  status: 'active',
  lat: null as number | null,
  lng: null as number | null,
  notes: '',
  organizationId: '',
})

const canEdit = computed(() => auth.hasRole('admin') || auth.hasPermission('warehouses:edit'))
const isNew = computed(() => route.query.new !== undefined)
const editId = computed(() => route.query.id as string | undefined)
const isForm = computed(() => isNew.value || editId.value)

const typeLabels: Record<string, string> = {
  closed: 'Закрытый',
  open: 'Открытый',
  fridge: 'Рефрижератор',
  freezer: 'Морозильник',
  hazardous: 'Опасные грузы',
}

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return warehouses.value
  return warehouses.value.filter((w) =>
    w.name.toLowerCase().includes(q) ||
    (w.address || '').toLowerCase().includes(q),
  )
})

watch(search, (val) => {
  if (!isForm.value) {
    const q = val ? { search: val } : {}
    navigateTo({ path: '/modules/warehouses', query: q }, { replace: true })
  }
})

watch(editId, (id) => {
  if (id) {
    form.value = { name: '', address: '', contactPerson: '', phone: '', email: '', area: null, type: 'closed', status: 'active', notes: '', organizationId: '' }
    errorMsg.value = ''
    loadWarehouse(id)
  }
}, { immediate: true })

watch(isNew, (val) => {
  if (val) {
    form.value = { name: '', address: '', contactPerson: '', phone: '', email: '', area: null, type: 'closed', status: 'active', notes: '', organizationId: '' }
    errorMsg.value = ''
  }
}, { immediate: true })

async function load() {
  loading.value = true
  try {
    const [{ data: whData }, { data: orgsData }] = await Promise.all([
      $api.get('/warehouses'),
      $api.get('/organizations'),
    ])
    warehouses.value = whData
    organizations.value = orgsData
  } finally {
    loading.value = false
  }
}

async function loadWarehouse(id: string) {
  try {
    const { data } = await $api.get('/warehouses')
    const w = data.find((x: any) => x.id === id)
    if (!w) return
    form.value = { ...w }
  } catch {
    errorMsg.value = 'Ошибка загрузки'
  }
}

function goToList() {
  const q = search.value ? { search: search.value } : {}
  navigateTo({ path: '/modules/warehouses', query: q }, { replace: true })
}

function goToNew() {
  navigateTo('/modules/warehouses?new', { replace: true })
}

function goToEdit(id: string) {
  navigateTo(`/modules/warehouses?id=${id}`, { replace: true })
}

async function save() {
  errorMsg.value = ''
  saving.value = true
  try {
    if (editId.value) {
      await $api.put(`/warehouses/${editId.value}`, form.value)
    } else {
      await $api.post('/warehouses', form.value)
    }
    await load()
    goToList()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка сохранения'
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!editId.value) return
  if (!confirm('Удалить склад?')) return
  try {
    await $api.delete(`/warehouses/${editId.value}`)
    await load()
    goToList()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка удаления'
  }
}

const showAddressMap = ref(false)
const addressMapSearch = ref('')
const addressMapLoading = ref(false)
const addressSuggestions = ref<any[]>([])
const showAddressSuggestions = ref(false)
let addressSearchTimer: any = null
let addressMap: any = null
let addressMarker: any = null

function openAddressMap() {
  showAddressMap.value = true
  addressMapSearch.value = form.value.address || ''
  addressMapLoading.value = true
  nextTick(async () => {
    const el = document.getElementById('address-map')
    if (!el || addressMap) return
    const maplibregl = await import('maplibre-gl')
    await import('maplibre-gl/dist/maplibre-gl.css')

    let center: [number, number] = [37.618423, 55.751244]
    let zoom = 5
    const existingAddr = form.value.address?.trim()
    if (existingAddr) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(existingAddr)}&limit=3&accept-language=ru`)
        const data = await res.json()
        if (data.length) {
          center = [parseFloat(data[0].lon), parseFloat(data[0].lat)]
          zoom = 16
        }
      } catch {}
    }

    addressMap = new maplibregl.Map({
      container: el,
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
      center,
      zoom,
    })
    addressMap.addControl(new maplibregl.NavigationControl(), 'top-right')
    addressMap.getCanvas().style.cursor = 'crosshair'

    addressMap.on('load', () => {
      if (existingAddr && (center[0] !== 37.618423 || center[1] !== 55.751244)) {
        const el2 = document.createElement('div')
        el2.innerHTML = '📍'
        el2.style.cssText = 'font-size:24px;width:24px;height:24px;display:flex;align-items:center;justify-content:center'
        addressMarker = new maplibregl.Marker({ element: el2 }).setLngLat(center).addTo(addressMap)
      }
      addressMapLoading.value = false
    })

    addressMap.on('click', async (e: any) => {
      const { lng, lat } = e.lngLat
      if (addressMarker) addressMarker.remove()
      const el2 = document.createElement('div')
      el2.innerHTML = '📍'
      el2.style.cssText = 'font-size:24px;width:24px;height:24px;display:flex;align-items:center;justify-content:center'
      addressMarker = new maplibregl.Marker({ element: el2 }).setLngLat([lng, lat]).addTo(addressMap)
      form.value.lat = parseFloat(lat.toFixed(6))
      form.value.lng = parseFloat(lng.toFixed(6))
      addressMapLoading.value = true
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`)
        const data = await res.json()
        if (data?.display_name) {
          form.value.address = data.display_name
          closeAddressMap()
        }
      } catch {}
      addressMapLoading.value = false
    })
  })
}

function closeAddressMap() {
  showAddressMap.value = false
  if (addressMap) { addressMap.remove(); addressMap = null; addressMarker = null }
  addressSuggestions.value = []
  showAddressSuggestions.value = false
  addressMapSearch.value = ''
}

watch(addressMapSearch, (val) => {
  clearTimeout(addressSearchTimer)
  if (!val.trim() || val.length < 2) {
    addressSuggestions.value = []
    showAddressSuggestions.value = false
    return
  }
  addressSearchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&accept-language=ru`)
      addressSuggestions.value = await res.json()
      showAddressSuggestions.value = addressSuggestions.value.length > 0
    } catch { addressSuggestions.value = []; showAddressSuggestions.value = false }
  }, 300)
})

function selectAddressSuggestion(s: any) {
  if (!addressMap) return
  const lat = parseFloat(s.lat)
  const lon = parseFloat(s.lon)
  addressMap.flyTo({ center: [lon, lat], zoom: 16 })
  if (addressMarker) addressMarker.remove()
  form.value.address = s.display_name
  form.value.lat = parseFloat(lat.toFixed(6))
  form.value.lng = parseFloat(lon.toFixed(6))
  addressSuggestions.value = []
  showAddressSuggestions.value = false
}

async function searchAddressOnMap() {
  const q = addressMapSearch.value.trim()
  if (!q || !addressMap) return
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=ru`)
    const data = await res.json()
    if (data.length) {
      const { lat, lon, display_name } = data[0]
      addressMap.flyTo({ center: [parseFloat(lon), parseFloat(lat)], zoom: 16 })
      if (addressMarker) addressMarker.remove()
      form.value.address = display_name
      addressSuggestions.value = []
      showAddressSuggestions.value = false
    }
  } catch {}
}

onMounted(load)
</script>

<template>
  <div class="page">
    <template v-if="!isForm">
      <div class="page-header">
        <h1 class="page-title">Склады</h1>
        <button v-if="canEdit" class="btn-primary" @click="goToNew">+ Добавить склад</button>
      </div>

      <div class="search-bar">
        <input v-model="search" type="text" placeholder="Поиск по названию или адресу..." class="search-input" />
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>

      <table v-else-if="filtered.length" class="data-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Тип</th>
            <th>Площадь</th>
            <th>Адрес</th>
            <th>Контакты</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in filtered" :key="w.id" class="clickable" @click="goToEdit(w.id)">
            <td class="cell-name">{{ w.name }}</td>
            <td><span class="type-badge">{{ typeLabels[w.type] || w.type }}</span></td>
            <td>{{ w.area ? w.area + ' м²' : '—' }}</td>
            <td class="cell-addr">{{ w.address || '—' }}</td>
            <td>
              <div v-if="w.phone" class="contact-line">{{ w.phone }}</div>
              <div v-if="w.contactPerson" class="contact-line">{{ w.contactPerson }}</div>
            </td>
            <td class="col-actions" @click.stop>
              <button class="btn-icon" @click="goToEdit(w.id)" title="Редактировать">✎</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty">{{ search ? 'Нет складов по запросу' : 'Нет складов' }}</p>
    </template>

    <template v-else>
      <div class="page-header">
        <button class="btn-back" @click="goToList">← Назад к списку</button>
        <h1 class="page-title">{{ editId ? 'Редактировать склад' : 'Новый склад' }}</h1>
        <div />
      </div>

      <div class="form-card">
        <form @submit.prevent="save" @keydown.enter.prevent class="order-form">
          <div class="form-row">
            <div class="field flex-1">
              <label>Название</label>
              <input v-model="form.name" placeholder="Склад №1" />
            </div>
            <div class="field field-type">
              <label>Тип</label>
              <select v-model="form.type" class="input-select">
                <option value="closed">Закрытый</option>
                <option value="open">Открытый</option>
                <option value="fridge">Рефрижератор</option>
                <option value="freezer">Морозильник</option>
                <option value="hazardous">Опасные грузы</option>
              </select>
            </div>
            <div class="field field-area">
              <label>Площадь (м²)</label>
              <input v-model.number="form.area" type="number" placeholder="1000" />
            </div>
          </div>

          <div class="field">
            <label>Адрес</label>
            <div class="input-with-btn">
              <input v-model="form.address" placeholder="г. Москва, ул. Логистическая, д. 1" />
              <button type="button" class="btn-map" @click="openAddressMap">🗺</button>
            </div>
          </div>

          <div class="form-row">
            <div class="field flex-1">
              <label>Контактное лицо</label>
              <input v-model="form.contactPerson" placeholder="Иванов Иван" />
            </div>
            <div class="field flex-1">
              <label>Телефон</label>
              <input v-model="form.phone" placeholder="+7 495 000-00-00" />
            </div>
          </div>

          <div class="form-row">
            <div class="field flex-1">
              <label>Email</label>
              <input v-model="form.email" placeholder="warehouse@example.com" />
            </div>
            <div class="field field-status-w">
              <label>Статус</label>
              <select v-model="form.status" class="input-select">
                <option value="active">Активен</option>
                <option value="inactive">Не активен</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Организация</label>
            <select v-model="form.organizationId" class="input-select">
              <option value="">Без организации</option>
              <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </div>

          <div v-if="form.lat && form.lng" class="field">
            <label>Координаты</label>
            <div class="coords-display">{{ form.lat }}, {{ form.lng }}</div>
          </div>

          <div class="field">
            <label>Примечание</label>
            <textarea v-model="form.notes" class="input-textarea" rows="2" />
          </div>

          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

          <div class="form-actions">
            <button v-if="editId" type="button" class="btn-danger" @click="remove">Удалить склад</button>
            <div class="form-actions-right">
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
              <button type="button" class="btn-ghost" @click="goToList">Отмена</button>
            </div>
          </div>
        </form>
      </div>

      <div v-if="showAddressMap" class="overlay" @click.self="closeAddressMap">
        <div class="map-modal">
          <div class="map-modal-header">
            <h3>Выбрать адрес на карте</h3>
            <button class="btn-close" @click="closeAddressMap">✕</button>
          </div>
          <div class="map-modal-search">
            <div class="search-wrap">
              <input v-model="addressMapSearch" type="text" placeholder="Поиск места..." @keyup.enter="searchAddressOnMap" @focus="showAddressSuggestions = addressSuggestions.length > 0" @blur="setTimeout(() => showAddressSuggestions = false, 200)" />
              <div v-if="showAddressSuggestions && addressSuggestions.length" class="suggestions">
                <div v-for="s in addressSuggestions" :key="s.place_id" class="suggestion-item" @mousedown.prevent="selectAddressSuggestion(s)">{{ s.display_name }}</div>
              </div>
            </div>
            <button class="btn-search" @click="searchAddressOnMap">🔍</button>
          </div>
          <div id="address-map" class="address-map" />
          <div v-if="addressMapLoading" class="map-loading">Загрузка карты...</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 12px; }
.page-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
.btn-back { background: none; border: none; color: #3b82f6; font-size: 13px; cursor: pointer; padding: 4px 0; white-space: nowrap; &:hover { color: #2563eb; } }
.search-bar { margin-bottom: 16px; }
.search-input { width: 100%; max-width: 320px; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #0f172a; outline: none; &:focus { border-color: #3b82f6; } &::placeholder { color: #94a3b8; } }
.loading { color: #64748b; font-size: 14px; }

.data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
  th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 16px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
  tr.clickable { cursor: pointer; }
}

.cell-name { font-weight: 600; }
.cell-addr { color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #1d4ed8; background: #dbeafe; }
.contact-line { font-size: 12px; color: #64748b; }
.col-actions { width: 1%; white-space: nowrap; }
.btn-icon { padding: 4px 8px; border: none; background: none; color: #64748b; cursor: pointer; font-size: 14px; &:hover { color: #3b82f6; } }
.empty { color: #94a3b8; font-size: 14px; text-align: center; padding: 32px; }

.form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.order-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 12px; }
.form-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
.form-actions-right { display: flex; gap: 8px; }

.field { display: flex; flex-direction: column; gap: 4px;
  label { font-size: 12px; font-weight: 500; color: #475569; }
  input, .input-select, .input-textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; background: #fff; &:focus { border-color: #3b82f6; } }
  .input-textarea { resize: vertical; min-height: 48px; }
}

.flex-1 { flex: 1; }
.field-type { width: 160px; }
.field-area { width: 130px; }
.field-status-w { width: 130px; }

.btn-primary { padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #2563eb; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-danger { padding: 8px 16px; border-radius: 6px; border: none; background: #ef4444; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #dc2626; } }
.btn-ghost { padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 13px; cursor: pointer; &:hover { background: #f8fafc; } }
.error-msg { color: #ef4444; font-size: 13px; }

.coords-display { font-size: 12px; color: #64748b; font-family: monospace; }

.input-with-btn { display: flex; gap: 4px;
  input { flex: 1; }
}

.btn-map { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 16px; line-height: 1; &:hover { background: #f8fafc; } }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; }

.map-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 640px; overflow: hidden; display: flex; flex-direction: column; }

.map-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
  h3 { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0; }
}

.btn-close { padding: 4px 8px; border: none; background: none; color: #64748b; cursor: pointer; font-size: 16px; &:hover { color: #0f172a; } }

.map-modal-search { display: flex; gap: 4px; padding: 12px 20px; position: relative;
  input { flex: 1; padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; outline: none; &:focus { border-color: #3b82f6; } }
}

.search-wrap { flex: 1; position: relative; }

.suggestions { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; max-height: 200px; overflow-y: auto; }

.suggestion-item { padding: 8px 12px; font-size: 12px; color: #0f172a; cursor: pointer; border-bottom: 1px solid #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; &:hover { background: #f8fafc; } &:last-child { border-bottom: none; } }

.btn-search { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; &:hover { background: #f8fafc; } }

.address-map { width: 100%; height: 350px; }

.map-loading { padding: 8px 20px 12px; font-size: 12px; color: #64748b; }
</style>
