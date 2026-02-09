export type ComponentMetaTransformer = (
  component: any,
  code: string
) => { component: any; code: string }

const slotReplacer = (_: unknown, _before: string, slotName: string, _rest: unknown) =>
  `<slot ${_before || ''}${slotName === 'default' ? '' : `name="${slotName}"`}`

/**
 * Default code transformers used by the Nuxt module (and by `getComponentMeta()`).
 */
export const defaultTransformers: ComponentMetaTransformer[] = [
  // @nuxt/content support
  (component, code) => {
    // MDCSlot
    if (code.includes('MDCSlot')) {
      code = code.replace(/<MDCSlot\s*([^>]*)?:use="\$slots\.([a-zA-Z0-9_]+)"/gm, slotReplacer)
      code = code.replace(/<MDCSlot\s*([^>]*)?name="([a-zA-Z0-9_]+)"/gm, slotReplacer)
      code = code.replace(/<\/MDCSlot>/gm, '</slot>')
    }
    // ContentSlot
    if (code.includes('ContentSlot')) {
      code = code.replace(/<ContentSlot\s*([^>]*)?:use="\$slots\.([a-zA-Z0-9_]+)"/gm, slotReplacer)
      code = code.replace(/<ContentSlot\s*([^>]*)?name="([a-zA-Z0-9_]+)"/gm, slotReplacer)
      code = code.replace(/<\/ContentSlot>/gm, '</slot>')
    }

    // Handle `(const|let|var) slots = useSlots()`
    const name = code.match(/(const|let|var) ([a-zA-Z][a-zA-Z-_0-9]*) = useSlots\(\)/)?.[2] || '$slots'
    const _slots = code.match(new RegExp(`${name}\\.[a-zA-Z]+`, 'gm'))
    if (_slots) {
      const slots = _slots
        .map(s => s.replace(name + '.', ''))
        .map(s => `<slot name="${s}" />`)
      code = code.replace(/<template>/, `<template>\n${slots.join('\n')}\n`)
    }

    // Handle `(const|let|var) { title, default: defaultSlot } = useSlots()`
    const slotNames = code.match(/(const|let|var) {([^}]+)}\s*=\s*useSlots\(\)/)?.[2]
    if (slotNames) {
      const slots = slotNames
        .trim()
        .split(',')
        .map(s => s.trim().split(':')[0]?.trim())
        .map(s => `<slot name="${s}" />`)
      code = code.replace(/<template>/, `<template>\n${slots.join('\n')}\n`)
    }

    if (/declare const __VLS_export/.test(code)) {
      const matchWithSlots = code.match(/__VLS_WithSlots<\s*import\("vue"\)\.DefineComponent<([\s\S]*?)>,\s*([A-Za-z0-9_]+)\s*>/m)
      const matchDefineOnly = matchWithSlots ? null : code.match(/import\("vue"\)\.DefineComponent<([\s\S]*?)>/m)
      const generic = (matchWithSlots?.[1] || matchDefineOnly?.[1] || 'any')
      const head = code.split(/declare const __VLS_export/)[0] || ''
      const extend = matchWithSlots ? ` & { new (): { $slots: ${matchWithSlots?.[2]} } }` : ''

      code = [
        `${head}`,
        `export default {} as (import("vue").DefineComponent<${generic}>${extend});`
      ].join('\n').replace('export default _default;', '')
    }

    return { component, code }
  }
]

