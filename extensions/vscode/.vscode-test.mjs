import path from 'path'
import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
  workspaceFolder: path.resolve('./tests-workspace'),
  files: ['./tests-dist/bootstrap.js', 'tests-dist/**/*.test.js'],
})
