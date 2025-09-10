<template>
  <div>
    <h3>Enum Test Component</h3>
    <p>Color: {{ color }}</p>
    <p>Size: {{ size }}</p>
    <p>Variant: {{ variant }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /**
   * The color of the component
   * @defaultValue 'primary'
   */
  color?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
  
  /**
   * The size of the component
   * @defaultValue 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  /**
   * The variant of the component
   * @defaultValue 'solid'
   */
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  
  /**
   * Whether the component is disabled
   */
  disabled?: boolean
  
  /**
   * The label text
   */
  label?: string
}

defineProps<Props>()
</script>
