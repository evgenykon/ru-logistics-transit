<script setup lang="ts">
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const props = withDefaults(defineProps<{
  center?: [number, number];
  zoom?: number;
  markers?: Array<{ lng: number; lat: number; label?: string }>;
  style?: string;
  height?: number;
}>(), {
  center: () => [37.6173, 55.7558] as [number, number],
  zoom: 10,
  height: 400,
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
});

const container = ref<HTMLElement>();

onMounted(() => {
  if (!container.value) return;

  const map = new maplibregl.Map({
    container: container.value,
    style: props.style,
    center: props.center,
    zoom: props.zoom,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  for (const m of props.markers || []) {
    const popup = m.label
      ? new maplibregl.Popup({ offset: 25 }).setText(m.label)
      : undefined;

    new maplibregl.Marker()
      .setLngLat([m.lng, m.lat])
      .setPopup(popup)
      .addTo(map);
  }

  onUnmounted(() => map.remove());
});
</script>

<template>
  <div ref="container" class="map-container" :style="{ height: height + 'px' }" />
</template>

<style scoped lang="scss">
.map-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}
</style>
