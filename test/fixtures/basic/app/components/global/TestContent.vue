<template>
  <div>
    <h1><ContentSlot :use="$slots.title" unwrap="p" /></h1>
    <ContentSlot :use="$slots.default" />
  </div>
</template>
