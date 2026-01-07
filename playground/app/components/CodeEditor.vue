<template>
  <AmoAYunMonacoEditorVue3
    v-model="modelValue"
    :language="language"
    theme="vs-dark"
    style="height: 100%; width: 100%"
  />
</template>

<script setup>
import { AmoAYunMonacoEditorVue3 } from '@amoayun/monaco-editor-vue3';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';


self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    if (label === 'html' || label === 'vue') return new htmlWorker();
    return new editorWorker();
  }
};

defineProps({
  language: {
    type: String,
    default: 'javascript'
  }
});

const modelValue = defineModel();

</script>
