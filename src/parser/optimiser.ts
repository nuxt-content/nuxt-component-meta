import { logger } from '@nuxt/kit'
import type { NuxtComponentMeta } from '../types/parser'
import { deduplicateJSON } from './json-dedup'

export function optimiseJSON(content: string): string {
  try {
    if (!content.startsWith('export default ')) {
      return content
    }

    let jsonString = content.substring('export default '.length)
    if (jsonString.endsWith(';')) {
      jsonString = jsonString.substring(0, jsonString.length - 1)
    }
    const data = JSON.parse(jsonString) as NuxtComponentMeta

    const result = deduplicateJSON(data)

    return result
  } catch (error) {
    logger.warn('Failed to optimize JSON:', error)
    return content
  }
}
