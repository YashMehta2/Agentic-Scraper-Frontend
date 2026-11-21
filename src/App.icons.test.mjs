import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const lucide = require('lucide-react')
const lucidePackage = require('lucide-react/package.json')

test('App uses icon exports available in lucide-react >= 1.74.0', async () => {
    const [major, minor] = lucidePackage.version.split('.').map(Number)
    assert.ok(
        major > 1 || (major === 1 && minor >= 74),
        `expected lucide-react >= 1.74.0, found ${lucidePackage.version}`,
    )

    const source = await readFile(new URL('./App.jsx', import.meta.url), 'utf8')
    const importStatement = source.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/)
    assert.ok(importStatement, 'App.jsx should import icons from lucide-react')

    const importedIcons = importStatement[1]
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)

    assert.ok(importedIcons.length > 0, 'App.jsx should import at least one icon')

    for (const iconName of importedIcons) {
        assert.ok(lucide[iconName], `lucide-react does not export ${iconName}`)
    }

    const deprecatedAliases = ['Loader2', 'CheckCircle2', 'XCircle', 'Trash2']
    for (const alias of deprecatedAliases) {
        assert.ok(
            !importedIcons.includes(alias),
            `App.jsx should use the current icon name instead of the deprecated ${alias} alias`,
        )
    }
})
