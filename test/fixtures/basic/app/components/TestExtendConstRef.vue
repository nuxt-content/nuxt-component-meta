<template>
  <div />
</template>

<script setup>
import { InputType } from '../utils/InputType'
extendComponentMeta({ inputType: InputType.FILE })
defineProps({ title: String })
</script>
