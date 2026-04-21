import fs from 'fs/promises'
import path from 'path'
import { describe, expect, it } from 'vitest'
import plugin from '../src'

describe('index', () => {

  it('should include all rules', async () => {
    const sourceDir = path.resolve(import.meta.dirname, '../src')
    const rules = (
      await Promise.all(
        ['rules', 'typescript', 'vue'].map(async dir => {
          const files = await fs.readdir(path.join(sourceDir, dir))
          return files.filter(file => path.extname(file) === '.ts')
            .map(file => path.basename(file, '.ts'))
        }),
      )
    ).flat()
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const registeredRules = Object.keys(plugin.rules!)
    for (const rule of rules) {
      expect(registeredRules).toContain(rule)
    }
  })

})
