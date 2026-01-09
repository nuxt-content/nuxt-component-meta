<template>
  <div>
    <div>
      <TestComponent foo="test" name="test" />
      <TestGlobalComponent />
      <TestTyped :hello="`test`" />
    </div>

    <h2>Components from <code>useComponentMeta('{{ specificComponentName }}')</code></h2>

    <pre>{{ specificComponentMeta }}</pre>

    <h2>Components from <code>useComponentMeta</code></h2>

    <pre>{{ composableData }}</pre>

    <hr>
  </div>
</template>

<script lang="ts" setup>
import TestComponent from '../components/TestComponent.vue'
import TestTyped from '../components/testTyped.vue'
import type { NuxtComponentMetaNames } from '#nuxt-component-meta/types'

const specificComponentName = ref<NuxtComponentMetaNames>('TestContent')

const specificComponentMeta = await useComponentMeta(specificComponentName)

const composableData = await useComponentMeta()
</script>

<style lang="postcss">
body {
  font-size: 12px;
}
</style>
