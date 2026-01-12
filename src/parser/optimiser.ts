import { logger } from '@nuxt/kit'
import type { NuxtComponentMeta } from '../types/parser'
import { deduplicateJSON } from './json-dedup'

export function optimiseJSON(content: string): string {
  try {
    if (!content.startsWith('export default ')) {
      return content
    }

    const jsonString = content.substring('export default '.length)
    const data = JSON.parse(jsonString) as NuxtComponentMeta

    const result = deduplicateJSON(data)

    return result
  } catch (error) {
    logger.warn('Failed to optimize JSON:', error)
    return content
  }
}
