// src/utils/richTextColor.js
const injected = new Set()

export function ensureRichTextColorStylesFromHtml (html) {
    if (!html) return

    const matches = html.match(/rt-(?:c|bg)-[0-9a-fA-F]{6}/g)
    if (!matches || matches.length === 0) return

    let styleEl = document.getElementById('rt-dynamic-color-style')
    if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = 'rt-dynamic-color-style'
        document.head.appendChild(styleEl)
    }
    const sheet = styleEl.sheet
    if (!sheet) return

    for (const cls of matches) {
        if (injected.has(cls)) continue
        const hex = cls.slice(-6).toLowerCase()

        try {
            if (cls.startsWith('rt-c-')) {
                sheet.insertRule(`.${cls}{color:#${hex};}`, sheet.cssRules.length)
            } else {
                sheet.insertRule(`.${cls}{background-color:#${hex};}`, sheet.cssRules.length)
            }
            injected.add(cls)
        } catch (e) {
            // ignore
        }
    }
}
