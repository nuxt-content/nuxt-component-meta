<script setup lang="ts">
const data = ref(`{
  "name": "Farnabaz"
}`)
const component = ref(``)
const strict = ref(true)

const result = ref({
  validation: {},
  error: undefined,
  zodString: ''
})

const validate = async () => {
  await $fetch('/api/validate', {
    method: 'POST',
    body: {
      component: component.value,
      data: JSON.parse(data.value),
      strict: strict.value
    }
  }).then(res => {
    result.value = res
  }).catch(err => {
    result.value = {
      validation: {},
      error: err.data.message,
      zodString: ''
    }
  })

}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex justify-between items-center px-2 py-1">
      <div>
        <USwitch v-model="strict" label="Strict Mode" />
      </div>
      <UButton @click="validate">
        Validate
      </UButton>
    </div>
    <!-- two columns -->
    <div class="grid grid-cols-2 gap-1 h-screen">
      <div class="grid grid-rows-2 gap-1">
        <div>
          <client-only>
            <CodeEditor v-model="component" language="html" />
          </client-only>
        </div>
        <div>
          <client-only>
            <CodeEditor v-model="data" language="json" />
          </client-only>
        </div>
      </div>
      <div class="grid grid-rows-2 gap-1">
        <client-only>
          <CodeEditor v-model="result.zodString" />
          <CodeEditor v-if="result.error" :model-value="JSON.stringify(result.error, null, 2)" language="json" class="text-red-500"/>
          <CodeEditor v-else :model-value="JSON.stringify(result.validation, null, 2)" language="json" />
        </client-only>
      </div>
    </div>
  </div>
</template>
