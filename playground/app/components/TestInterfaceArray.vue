<script setup lang="ts">
interface Author {
  name: string
  email: string
  role?: 'admin' | 'user' | 'guest'
}

interface Book {
  title: string
  isbn: string
  publishedYear: number
}

defineProps<{
  // Test Interface[] syntax
  authors?: Author[]
  books: Book[]
  // Test inline array types
  tags?: string[]
  ratings?: number[]
}>()
</script>

<template>
  <div>
    <h2>Authors</h2>
    <div v-for="author in authors" :key="author.email">
      {{ author.name }} - {{ author.role }}
    </div>
    
    <h2>Books</h2>
    <div v-for="book in books" :key="book.isbn">
      {{ book.title }} ({{ book.publishedYear }})
    </div>
  </div>
</template>

