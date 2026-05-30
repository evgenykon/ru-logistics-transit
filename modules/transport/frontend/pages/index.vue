<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const auth = useAuthStore()
const route = useRoute()

const vehicles = ref<any[]>([])
const organizations = ref<{ id: string; name: string }[]>([])
const search = ref(route.query.search as string || '')
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')
const locSearch = ref('')
const locMapContainer = ref<HTMLElement>()
const bodyCanvas = ref<HTMLCanvasElement>()
let bodyCanvasResize: any = null

function drawBodyScheme() {
  const c = bodyCanvas.value
  if (!c) return
  const rect = c.getBoundingClientRect()
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  if (!w || !h) return
  const dpr = window.devicePixelRatio || 1
  c.width = w * dpr
  c.height = h * dpr
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)

  const bt = form.value.bodyType
  if (!bt) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Выберите тип кузова', w / 2, h / 2)
    return
  }

  const len = form.value.bodyLength || 13.6
  const wid = form.value.bodyWidth || 2.45
  const hei = form.value.bodyHeight || 2.7
  const axles = form.value.axles || 3
  const isTent = bt === 'tent' || bt === 'ref' || bt === 'iso'
  const tentH = isTent ? (form.value.tentHeight || 0) : 0

  const gap = 28
  const padX = 30
  const padY = 30
  const mainW = (w - padX * 2 - gap) * 0.67
  const rearW = (w - padX * 2 - gap) * 0.33
  const cellH = (h - padY * 2 - gap) / 2

  const fitIn = (bw: number, bh: number, mw: number, mh: number) => {
    const s = Math.min(mw / bw, mh / bh)
    return { s, fw: bw * s, fh: bh * s }
  }

  // Layout: [  Top  ][      ]
  //         [ Side  ][ Rear ]

  // Calculate height scale from side view (shared for rear view)
  const sideMaxW = mainW - 20, sideMaxH = cellH - 40
  const { s: sideS, fw: sideFw, fh: bodyFh } = fitIn(len, hei, sideMaxW, sideMaxH)

  // Top view (length × width) — top-left, same length as side view, no cab
  {
    const topH = Math.min(wid * (sideFw / len), cellH - 30)
    const bx = padX + (mainW - sideFw) / 2, by = padY + (cellH - topH) / 2
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(bx, by, sideFw, topH)
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, sideFw, topH)
    ctx.fillStyle = '#dbeafe'; ctx.fillRect(bx + 4, by + 4, sideFw - 8, topH - 8)
    if (showCargo.value) {
      const pLen = 1.2, pWid = 0.8 // euro pallet 1200×800mm
      const cols = Math.min(Math.floor(len / pLen), 10)
      const rows = Math.min(Math.floor(wid / pWid), 3)
      const ppw = sideFw / len * pLen // pallet pixel width along length
      const pph = topH / wid * pWid // pallet pixel height along width
      const gapRow = (topH - rows * pph) / (rows + 1)
      const gapCol = (sideFw - cols * ppw) / (cols + 1)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#fbbf24' : '#f59e0b'
          ctx.fillRect(bx + gapCol + c * (ppw + gapCol), by + gapRow + r * (pph + gapRow), ppw, pph)
          ctx.strokeStyle = '#d97706'
          ctx.lineWidth = 0.5
          ctx.strokeRect(bx + gapCol + c * (ppw + gapCol), by + gapRow + r * (pph + gapRow), ppw, pph)
        }
      }
    }
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`${len}м × ${wid}м`, bx + sideFw / 2, by - 8)
    ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Сверху', padX + mainW / 2, padY - 6)
  }

  // Side view (length × height) — bottom-left
  {
    const bx = padX + (mainW - sideFw) / 2, by = padY + cellH + gap + (cellH - bodyFh) / 2
    const floor = by + bodyFh

    // Tractor cab — simple square
    const cabSize = bodyFh * 0.55
    const cabX = bx - cabSize
    const cabY = floor - cabSize

    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(cabX, cabY, cabSize, cabSize)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cabX, cabY, cabSize, cabSize)

    // Chassis frame (from cab to fifth wheel)
    ctx.fillStyle = '#94a3b8'
    const frameEnd = bx + sideFw * 0.05
    ctx.fillRect(cabX + cabSize * 0.6, floor - 5, frameEnd - (cabX + cabSize * 0.6), 5)

    // Fifth wheel / hitch connection point
    ctx.fillStyle = '#475569'
    ctx.beginPath()
    ctx.arc(bx + sideFw * 0.05, floor - 2, 4, 0, Math.PI * 2)
    ctx.fill()

    // Body-type specific drawing
    if (bt === 'tent' || bt === 'ref' || bt === 'iso') {
      // Box body with internal space (tent/ref/iso)
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(bx, by, sideFw, bodyFh)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, by, sideFw, bodyFh)
      ctx.fillStyle = '#dbeafe'
      ctx.fillRect(bx + 4, by + 4, sideFw - 8, bodyFh - 8)
      if (showCargo.value) {
        const pLen = 1.2, pH = 1.0
        const cols = Math.min(Math.floor(len / pLen), 12)
        const rows = Math.min(Math.floor(hei / pH), 3)
        const ppw = sideFw / len * pLen
        const pph = bodyFh / hei * pH
        const gapCol = (sideFw - cols * ppw) / (cols + 1)
        const gapRow = (bodyFh - rows * pph) / (rows + 1)
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#fbbf24' : '#f59e0b'
            ctx.fillRect(bx + gapCol + c * (ppw + gapCol), by + gapRow + r * (pph + gapRow), ppw, pph)
            ctx.strokeStyle = '#d97706'
            ctx.lineWidth = 0.5
            ctx.strokeRect(bx + gapCol + c * (ppw + gapCol), by + gapRow + r * (pph + gapRow), ppw, pph)
          }
        }
      }
    } else if (bt === 'tank') {
      // Tank — oval/tube shape
      const midY = by + bodyFh / 2
      ctx.beginPath()
      ctx.ellipse(bx + sideFw / 2, midY, sideFw / 2, bodyFh * 0.7, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#93c5fd'
      ctx.fill()
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.stroke()
      // Tank manhole
      ctx.fillStyle = '#64748b'
      ctx.fillRect(bx + sideFw * 0.15, midY - 4, 8, 8)
      ctx.fillRect(bx + sideFw * 0.35, midY - 4, 8, 8)
      ctx.fillRect(bx + sideFw * 0.55, midY - 4, 8, 8)
      ctx.fillRect(bx + sideFw * 0.75, midY - 4, 8, 8)
    } else if (bt === 'dump') {
      // Tipper — angled trapezoid
      const tipX = bx + sideFw * 0.05
      const tipY = by - bodyFh * 0.2
      ctx.beginPath()
      ctx.moveTo(bx, floor)
      ctx.lineTo(tipX, tipY)
      ctx.lineTo(bx + sideFw * 0.9, tipY)
      ctx.lineTo(bx + sideFw, floor)
      ctx.closePath()
      ctx.fillStyle = '#fef3c7'
      ctx.fill()
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.stroke()
      // Hydraulic cylinder
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx + sideFw * 0.45, floor)
      ctx.lineTo(bx + sideFw * 0.1, tipY + 6)
      ctx.stroke()
    } else if (bt === 'flatbed') {
      // Flatbed with stakes
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(bx, by + bodyFh * 0.5, sideFw, bodyFh * 0.5)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, by + bodyFh * 0.5, sideFw, bodyFh * 0.5)
      // Stakes
      for (let i = 0; i < 5; i++) {
        const sx = bx + sideFw * (0.1 + i * 0.2)
        ctx.fillStyle = '#94a3b8'
        ctx.fillRect(sx - 2, by, 4, bodyFh * 0.5)
      }
      // Cargo on flatbed
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(bx + 10, by + 4, sideFw - 20, bodyFh * 0.4)
    } else if (bt === 'container') {
      // Container on flatbed — box with ribbed walls
      ctx.fillStyle = '#fed7aa'
      ctx.fillRect(bx, by, sideFw, bodyFh)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, by, sideFw, bodyFh)
      // Container ribs
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = '#c2410c'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(bx + sideFw * (0.05 + i * 0.12), by + 2)
        ctx.lineTo(bx + sideFw * (0.05 + i * 0.12), by + bodyFh - 2)
        ctx.stroke()
      }
      // Twist locks at corners
      ctx.fillStyle = '#64748b'
      ctx.fillRect(bx + 2, by + 2, 4, 4)
      ctx.fillRect(bx + sideFw - 6, by + 2, 4, 4)
      ctx.fillRect(bx + 2, by + bodyFh - 6, 4, 4)
      ctx.fillRect(bx + sideFw - 6, by + bodyFh - 6, 4, 4)
    } else if (bt === 'timber') {
      // Timber — stakes with logs
      // Stakes
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(bx, by, 4, bodyFh)
      ctx.fillRect(bx + sideFw - 4, by, 4, bodyFh)
      // Logs
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          const lx = bx + 8 + c * (sideFw - 16) / 5
          const ly = by + 6 + r * (bodyFh - 12) / 3
          ctx.beginPath()
          ctx.arc(lx, ly, 4, 0, Math.PI * 2)
          ctx.fillStyle = r % 2 === 0 ? '#d97706' : '#b45309'
          ctx.fill()
          ctx.strokeStyle = '#78350f'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    } else if (bt === 'lowbed') {
      // Lowbed — low platform with gooseneck
      const neckH = bodyFh * 0.4
      const bedY = floor - neckH
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(bx, bedY, sideFw, neckH)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, bedY, sideFw, neckH)
      // Gooseneck
      ctx.fillStyle = '#64748b'
      ctx.beginPath()
      ctx.moveTo(bx - sideFw * 0.05, floor)
      ctx.lineTo(bx - sideFw * 0.05, floor - bodyFh * 0.3)
      ctx.lineTo(bx, bedY)
      ctx.lineTo(bx, floor)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Cargo on lowbed (e.g., excavator)
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(bx + 10, bedY - 8, sideFw * 0.25, 8)
      ctx.fillRect(bx + sideFw * 0.4, bedY - 12, sideFw * 0.2, 12)
    } else {
      // Default: van or others — solid box
      ctx.fillStyle = '#e2e8f0'
      ctx.fillRect(bx, by, sideFw, bodyFh)
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(bx, by, sideFw, bodyFh)
    }

    // Floor line
    ctx.beginPath()
    ctx.moveTo(cabX, floor)
    ctx.lineTo(bx + sideFw, floor)
    ctx.stroke()

    if (axles > 0) {
      // Separate tractor and trailer axles
      const tractorAxles: number[] = []
      const trailerAxles: number[] = []
      if (axles <= 3) {
        tractorAxles.push(sideFw * -0.08)  // tractor front axle (before cab)
        for (let i = 0; i < axles - 1; i++) trailerAxles.push(sideFw * (0.7 + i * 0.12))
      } else {
        tractorAxles.push(sideFw * -0.08, sideFw * 0.04)  // tractor front + rear axles
        const rest = axles - 2
        for (let i = 0; i < rest; i++) trailerAxles.push(sideFw * (0.65 + i * 0.1))
      }
      const wheelR = 8
      const drawAxle = (x: number) => {
        const axPos = bx + x
        ctx.beginPath()
        ctx.arc(axPos, floor + wheelR, wheelR, 0, Math.PI * 2)
        ctx.fillStyle = '#334155'
        ctx.fill()
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      for (const ax of tractorAxles) drawAxle(ax)
      for (const ax of trailerAxles) drawAxle(ax)
    }
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(`${len}м × ${hei}м`, bx + sideFw / 2, by - 8)
    ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Слева', padX + mainW / 2, padY + cellH + gap + cellH + 8)
  }

  // Rear view (width × height) — bottom-right — use same bodyFh as side view
  {
    const rearFw = Math.max(Math.min(wid * sideS, rearW - 20), 30)
    const bx = padX + mainW + gap + (rearW - rearFw) / 2
    const by = padY + cellH + gap + (cellH - bodyFh) / 2
    const floor = by + bodyFh

    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(bx, by, rearFw, bodyFh)
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1.5
    ctx.strokeRect(bx, by, rearFw, bodyFh)
    ctx.fillStyle = '#dbeafe'
    ctx.fillRect(bx + 4, by + 4, rearFw - 8, bodyFh - 8)

    if (showCargo.value) {
      const pWid = 0.8, pH = 1.0
      const cols = Math.min(Math.floor(wid / pWid), 3)
      const rows = Math.min(Math.floor(hei / pH), 3)
      const ppw = rearFw / wid * pWid
      const pph = bodyFh / hei * pH
      const gapCol = (rearFw - cols * ppw) / (cols + 1)
      const gapRow = (bodyFh - rows * pph) / (rows + 1)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#fbbf24' : '#f59e0b'
          ctx.fillRect(bx + gapCol + c * (ppw + gapCol), by + gapRow + r * (pph + gapRow), ppw, pph)
          ctx.strokeStyle = '#d97706'
          ctx.lineWidth = 0.5
          ctx.strokeRect(bx + gapCol + c * (ppw + gapCol), by + gapRow + r * (pph + gapRow), ppw, pph)
        }
      }
    }

    // Wheel positions
    const leftWx = bx + 16
    const rightWx = bx + rearFw - 16

    ctx.beginPath()
    ctx.arc(leftWx, floor + 8, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#334155'
    ctx.fill()
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(rightWx, floor + 8, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#334155'
    ctx.fill()
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#0f172a'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${wid}м × ${hei}м`, bx + rearFw / 2, by - 8)
    ctx.fillStyle = '#64748b'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Сзади', padX + mainW + gap + rearW / 2, padY + cellH + gap + cellH + 8)
  }
}
let locMap: any = null
let locMarker: any = null

function initLocMap() {
  if (!locMapContainer.value || locMap) return
  import('maplibre-gl').then(async (maplibregl: any) => {
    await import('maplibre-gl/dist/maplibre-gl.css')
    const M = maplibregl.default || maplibregl

    const center: [number, number] = form.value.lat && form.value.lng
      ? [form.value.lng, form.value.lat]
      : [37.618423, 55.751244]

    locMap = new M.Map({
      container: locMapContainer.value,
      style: {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center,
      zoom: form.value.lat ? 14 : 5,
    })
    locMap.addControl(new M.NavigationControl(), 'top-right')
    locMap.getCanvas().style.cursor = 'crosshair'

    if (form.value.lat && form.value.lng) {
      placeLocMarker(form.value.lng, form.value.lat)
    }

    locMap.on('click', (e: any) => {
      const { lng, lat } = e.lngLat
      form.value.lat = parseFloat(lat.toFixed(6))
      form.value.lng = parseFloat(lng.toFixed(6))
      placeLocMarker(lng, lat)
    })
  })
}

function placeLocMarker(lng: number, lat: number) {
  if (!locMap) return
  if (locMarker) locMarker.remove()
  import('maplibre-gl').then((maplibregl: any) => {
    const M = maplibregl.default || maplibregl
    const el = document.createElement('div')
    el.innerHTML = '📍'
    el.style.cssText = 'font-size:24px'
    locMarker = new M.Marker({ element }).setLngLat([lng, lat]).addTo(locMap)
  })
}

async function locSearchAction() {
  const q = locSearch.value.trim()
  if (!q) return
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=ru`)
    const data = await res.json()
    if (data.length) {
      const { lat, lon, display_name } = data[0]
      form.value.lat = parseFloat(parseFloat(lat).toFixed(6))
      form.value.lng = parseFloat(parseFloat(lon).toFixed(6))
      locSearch.value = display_name
      if (locMap) locMap.flyTo({ center: [form.value.lng, form.value.lat], zoom: 14 })
      placeLocMarker(form.value.lng, form.value.lat)
    }
  } catch {}
}

function locUseCoords() {
  if (form.value.lat && form.value.lng && locMap) {
    locMap.flyTo({ center: [form.value.lng, form.value.lat], zoom: 14 })
    placeLocMarker(form.value.lng, form.value.lat)
  }
}

function svgRect(x: number, y: number, w: number, h: number, fill: string, stroke: string, sw: number = 1.5, dash?: string) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''} />`
}



const bodyTypes = [
  { key: 'tent', name: 'Тент', desc: 'Тентованный полуприцеп' },
  { key: 'ref', name: 'Рефрижератор', desc: 'Рефрижератор с температурным режимом' },
  { key: 'iso', name: 'Изотермический', desc: 'Изотермический фургон' },
  { key: 'flatbed', name: 'Бортовой', desc: 'Бортовой с откидными бортами' },
  { key: 'dump', name: 'Самосвал', desc: 'Самосвальный кузов' },
  { key: 'tank', name: 'Цистерна', desc: 'Цистерна для жидкостей' },
  { key: 'container', name: 'Контейнеровоз', desc: 'Платформа для контейнеров' },
  { key: 'timber', name: 'Лесовоз', desc: 'Для перевозки леса' },
  { key: 'lowbed', name: 'Низкорамный', desc: 'Низкорамный трал для спецтехники' },
  { key: 'van', name: 'Фургон', desc: 'Цельнометаллический фургон' },
]

const form = ref({
  brand: '',
  model: '',
  licensePlate: '',
  vin: '',
  year: null as number | null,
  capacity: null as number | null,
  volume: null as number | null,
  bodyType: 'tent',
  status: 'active',
  lat: null as number | null,
  lng: null as number | null,
  axles: 3,
  bodyLength: 13.6,
  bodyWidth: 2.45,
  bodyHeight: 2.6,
  tentHeight: 2.5,
  trailerType: '',
  notes: '',
  organizationId: '',
})

const showCargo = ref(true)
const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return vehicles.value
  return vehicles.value.filter((v) =>
    v.licensePlate.toLowerCase().includes(q) ||
    v.brand.toLowerCase().includes(q) ||
    v.model.toLowerCase().includes(q),
  )
})

const canEdit = computed(() => auth.hasRole('admin') || auth.hasPermission('transport:edit'))
const isNew = computed(() => route.query.new !== undefined)
const activeTab = ref('main')
const editId = computed(() => route.query.id as string | undefined)
const isForm = computed(() => isNew.value || editId.value)

watch(activeTab, (tab) => {
  if (tab === 'location') setTimeout(initLocMap, 100)
  if (tab === 'config') setTimeout(() => {
    drawBodyScheme()
    if (!bodyCanvasResize) {
      bodyCanvasResize = new ResizeObserver(drawBodyScheme)
      if (bodyCanvas.value) bodyCanvasResize.observe(bodyCanvas.value)
    }
  }, 100)
})

watch(() => [form.value.bodyType, form.value.bodyLength, form.value.bodyWidth, form.value.bodyHeight, form.value.axles, form.value.tentHeight, showCargo.value], () => {
  if (activeTab.value === 'config') drawBodyScheme()
})

watch(editId, (id) => {
  if (id) {
    const defaults = { brand: '', model: '', licensePlate: '', vin: '', year: null, capacity: null, volume: null, bodyType: 'tent', status: 'active', lat: null, lng: null, axles: 3, bodyLength: 13.6, bodyWidth: 2.45, bodyHeight: 2.6, tentHeight: 2.5, trailerType: '', notes: '', organizationId: '' }
    form.value = { ...defaults }
    errorMsg.value = ''
    loadVehicle(id)
  }
}, { immediate: true })

watch(isNew, (val) => {
  if (val) {
    const defaults = { brand: '', model: '', licensePlate: '', vin: '', year: null, capacity: null, volume: null, bodyType: 'tent', status: 'active', lat: null, lng: null, axles: 3, bodyLength: 13.6, bodyWidth: 2.45, bodyHeight: 2.6, tentHeight: 2.5, trailerType: '', notes: '', organizationId: '' }
    form.value = { ...defaults }
    errorMsg.value = ''
  }
}, { immediate: true })

async function load() {
  loading.value = true
  try {
    const res = await Promise.all([
      $api.get('/vehicles'),
      $api.get('/organizations'),
    ])
    vehicles.value = res[0].data
    organizations.value = res[1].data
  } catch (e) {
    console.warn('Transport load error:', e)
  } finally {
    loading.value = false
  }
}

async function loadVehicle(id: string) {
  try {
    const { data } = await $api.get('/vehicles')
    const v = data.find((x: any) => x.id === id)
    if (!v) return
    form.value = { ...v }
  } catch {
    errorMsg.value = 'Ошибка загрузки'
  }
}

function goToList() {
  const q = search.value ? { search: search.value } : {}
  navigateTo({ path: '/modules/transport', query: q }, { replace: true })
}

function goToNew() {
  navigateTo('/modules/transport?new', { replace: true })
}

function goToEdit(id: string) {
  navigateTo(`/modules/transport?id=${id}`, { replace: true })
}

async function save() {
  errorMsg.value = ''
  saving.value = true
  try {
    if (editId.value) {
      await $api.put(`/vehicles/${editId.value}`, form.value)
    } else {
      await $api.post('/vehicles', form.value)
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
  if (!confirm('Удалить ТС?')) return
  try {
    await $api.delete(`/vehicles/${editId.value}`)
    await load()
    goToList()
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Ошибка удаления'
  }
}

onUnmounted(() => {
  if (bodyCanvasResize) { bodyCanvasResize.disconnect(); bodyCanvasResize = null }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <template v-if="!isForm">
      <div class="page-header">
        <h1 class="page-title">Транспортные средства</h1>
        <button v-if="canEdit" class="btn-primary" @click="goToNew">+ Добавить ТС</button>
      </div>

      <div class="search-bar">
        <input v-model="search" type="text" placeholder="Поиск по госномеру, марке или модели..." class="search-input" />
      </div>

      <div v-if="loading" class="loading">Загрузка...</div>

      <table v-else-if="filtered.length" class="data-table">
        <thead>
          <tr>
            <th>Госномер</th>
            <th>Марка/Модель</th>
            <th>Год</th>
            <th>Грузопод.</th>
            <th>Объём</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filtered" :key="v.id" class="clickable" @click="goToEdit(v.id)">
            <td class="cell-name">{{ v.licensePlate }}</td>
            <td>{{ v.brand }} {{ v.model }}</td>
            <td>{{ v.year || '—' }}</td>
            <td>{{ v.capacity ? v.capacity + ' кг' : '—' }}</td>
            <td>{{ v.volume ? v.volume + ' м³' : '—' }}</td>
            <td>
              <span class="status-badge" :class="v.status === 'active' ? 'status-ok' : 'status-off'">
                {{ v.status === 'active' ? 'Активно' : 'Не активно' }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <button class="btn-icon" @click="goToEdit(v.id)" title="Редактировать">✎</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="empty">{{ search ? 'Нет ТС по запросу' : 'Нет транспортных средств' }}</p>
    </template>

    <template v-else>
      <div class="page-header">
        <button class="btn-back" @click="goToList">← Назад к списку</button>
        <h1 class="page-title">{{ editId ? 'Редактировать ТС' : 'Новое ТС' }}</h1>
        <div />
      </div>

      <div class="form-card">
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab === 'main' }" @click="activeTab = 'main'">Основное</button>
          <button class="tab" :class="{ active: activeTab === 'location' }" @click="activeTab = 'location'">Местоположение</button>
          <button class="tab" :class="{ active: activeTab === 'config' }" @click="activeTab = 'config'">Конфигурация кузова/прицепа</button>
        </div>

        <form @submit.prevent="save" @keydown.enter.prevent class="order-form">
          <template v-if="activeTab === 'main'">
            <div class="form-row">
              <div class="field flex-1">
                <label>Марка</label>
                <input v-model="form.brand" placeholder="Volvo" />
              </div>
              <div class="field flex-1">
                <label>Модель</label>
                <input v-model="form.model" placeholder="FH 460" />
              </div>
            </div>
            <div class="form-row">
              <div class="field flex-1">
                <label>Госномер</label>
                <input v-model="form.licensePlate" placeholder="А123ВВ77" />
              </div>
              <div class="field flex-1">
                <label>VIN</label>
                <input v-model="form.vin" placeholder="XWERTY..." />
              </div>
            </div>
            <div class="form-row">
              <div class="field field-year">
                <label>Год выпуска</label>
                <input v-model.number="form.year" type="number" placeholder="2020" />
              </div>
              <div class="field field-status-s">
                <label>Статус</label>
                <select v-model="form.status" class="input-select">
                  <option value="active">Активно</option>
                  <option value="inactive">Не активно</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field field-sm">
                <label>Грузоподъёмность (кг)</label>
                <input v-model.number="form.capacity" type="number" placeholder="20000" />
              </div>
              <div class="field field-sm">
                <label>Объём (м³)</label>
                <input v-model.number="form.volume" type="number" placeholder="90" />
              </div>
            </div>
            <div class="field">
              <label>Организация</label>
              <select v-model="form.organizationId" class="input-select">
                <option value="">Без организации</option>
                <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Примечание</label>
              <textarea v-model="form.notes" class="input-textarea" rows="2" />
            </div>
          </template>

          <template v-if="activeTab === 'location'">
            <div class="field">
              <div class="loc-search">
                <input v-model="locSearch" type="text" placeholder="Поиск места..." class="search-input" @keyup.enter="locSearchAction" />
                <button type="button" class="btn-loc-search" @click="locSearchAction">🔍</button>
              </div>
            </div>
            <div ref="locMapContainer" class="loc-map" />
            <div class="form-row">
              <div class="field field-coord">
                <label>Широта</label>
                <input v-model.number="form.lat" type="number" step="0.000001" placeholder="55.75" />
              </div>
              <div class="field field-coord">
                <label>Долгота</label>
                <input v-model.number="form.lng" type="number" step="0.000001" placeholder="37.62" />
              </div>
              <div class="field flex-1" style="justify-content:flex-end">
                <button type="button" class="btn-primary btn-sm" @click="locUseCoords">Установить на карте</button>
              </div>
            </div>
          </template>

          <template v-if="activeTab === 'config'">
            <div class="field">
              <label>Тип кузова</label>
              <select v-model="form.bodyType" class="input-select">
                <option value="">Не выбран</option>
                <option v-for="bt in bodyTypes" :key="bt.key" :value="bt.key">{{ bt.name }}</option>
              </select>
            </div>
            <div class="config-grid">
              <div class="cfg-item">
                <label>Кол-во осей</label>
                <select v-model.number="form.axles" class="input-select">
                  <option :value="2">1+1 (тягач + полуприцеп)</option>
                  <option :value="3">1+2 (тягач + сдвоенные)</option>
                  <option :value="4">2+2 (тягач + сдвоенные)</option>
                  <option :value="5">2+3 (тягач + строенные)</option>
                </select>
              </div>
              <div class="cfg-item">
                <label>Длина (м)</label>
                <input v-model.number="form.bodyLength" type="number" step="0.1" placeholder="13.6" />
              </div>
              <div class="cfg-item">
                <label>Ширина (м)</label>
                <input v-model.number="form.bodyWidth" type="number" step="0.1" placeholder="2.45" />
              </div>
              <div class="cfg-item">
                <label>Высота (м)</label>
                <input v-model.number="form.bodyHeight" type="number" step="0.1" placeholder="2.7" />
              </div>
              <div v-if="form.bodyType === 'tent' || form.bodyType === 'ref' || form.bodyType === 'iso'" class="cfg-item">
                <label>Высота тента (м)</label>
                <input v-model.number="form.tentHeight" type="number" step="0.1" placeholder="2.5" />
              </div>
              <div class="cfg-item cfg-check">
                <label class="check-label">
                  <input v-model="showCargo" type="checkbox" />
                  <span>Отобразить машино-места</span>
                </label>
              </div>
            </div>
            <canvas ref="bodyCanvas" class="body-canvas" />
          </template>

          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

          <div class="form-actions">
            <button v-if="editId" type="button" class="btn-danger" @click="remove">Удалить ТС</button>
            <div class="form-actions-right">
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Сохранение...' : 'Сохранить' }}</button>
              <button type="button" class="btn-ghost" @click="goToList">Отмена</button>
            </div>
          </div>
        </form>
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

.cell-name { font-weight: 600; font-family: monospace; }
.status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.status-ok { color: #15803d; background: #dcfce7; }
.status-off { color: #64748b; background: #f1f5f9; }
.col-actions { width: 1%; white-space: nowrap; }
.btn-icon { padding: 4px 8px; border: none; background: none; color: #64748b; cursor: pointer; font-size: 14px; &:hover { color: #3b82f6; } }
.empty { color: #94a3b8; font-size: 14px; text-align: center; padding: 32px; }

.form-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }

.tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.tab { padding: 12px 20px; font-size: 13px; font-weight: 500; color: #64748b; background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; white-space: nowrap; &:hover { color: #0f172a; } &.active { color: #3b82f6; border-bottom-color: #3b82f6; } }

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
.field-year { width: 120px; }
.field-sm { width: 160px; }
.field-status-s { width: 130px; }
.field-coord { width: 130px; }

.loc-search { display: flex; gap: 4px; }
.btn-loc-search { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 14px; &:hover { background: #f8fafc; } }
.loc-map { width: 100%; height: 300px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 12px; }

.btn-primary { padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #2563eb; } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-danger { padding: 8px 16px; border-radius: 6px; border: none; background: #ef4444; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:hover { background: #dc2626; } }
.btn-ghost { padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 13px; cursor: pointer; &:hover { background: #f8fafc; } }
.error-msg { color: #ef4444; font-size: 13px; }

.input-with-btn { display: flex; gap: 4px;
  select { flex: 1; }
}
.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.body-canvas { width: 100%; min-width: 800px; max-width: 100%; aspect-ratio: 2.5 / 1; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 12px; display: block; }
.cfg-item { display: flex; flex-direction: column; gap: 3px;
  label { font-size: 11px; font-weight: 500; color: #64748b; }
  input, select { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #0f172a; outline: none; background: #fff; font-family: inherit; &:focus { border-color: #3b82f6; } }
}
.cfg-check { grid-column: 1 / -1; display: flex; align-items: center; padding: 4px 0; }
.check-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #475569; cursor: pointer; input { margin: 0; width: auto; } }

</style>
