<script setup lang="ts">
import markdownit from 'markdown-it';

const props = withDefaults(defineProps<{
  content?: string;
  html?: boolean;
}>(), {
  content: '',
  html: false,
});

const md = markdownit({ html: props.html });

const rendered = computed(() => md.render(props.content));
</script>

<template>
  <div class="markdown-body" v-html="rendered" />
</template>

<style scoped lang="scss">
.markdown-body {
  line-height: 1.6;
  color: #334155;

  :deep(h1), :deep(h2), :deep(h3) {
    margin: 16px 0 8px;
    color: #0f172a;
  }

  :deep(p) {
    margin: 8px 0;
  }

  :deep(code) {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  :deep(pre) {
    background: #0f172a;
    color: #e2e8f0;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;

    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: #f8fafc;
      font-weight: 600;
    }
  }
}
</style>
