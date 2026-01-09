<template>
  <div>
    <h1>Title</h1>
    <p>
      <slot />
    </p>
  </div>
</template>

<script lang="ts">
import type { PropType, SlotsType } from 'vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TextDefine',
  props: {
    title: {
      type: String,
      default: 'Title'
    },
    canvas: {
      type: Object as PropType<HTMLCanvasElement>,
      required: true
    }
  },
  slots: Object as SlotsType<{
    default: any
  }>,
})
</script>
