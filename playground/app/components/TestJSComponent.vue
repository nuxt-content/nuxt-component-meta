<script>
export default {
  name: 'TestJSComponent',
  props: {
    message: {
      type: String,
      default: 'Hello from JS'
    },
    count: {
      type: Number,
      required: true
    }
  }
}
</script>

<template>
  <div>
    <p>{{ message }}</p>
    <p>Count: {{ count }}</p>
  </div>
</template>

