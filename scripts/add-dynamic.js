const fs = require('fs')
const path = require('path')

function walk(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(full))
    } else if (entry.name === 'route.ts') {
      files.push(full)
    }
  }
  return files
}

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api')
const files = walk(apiDir)

const DECL = "export const dynamic = 'force-dynamic'\n\n"

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  if (content.includes('force-dynamic')) {
    console.log(`SKIP: ${file}`)
    continue
  }
  fs.writeFileSync(file, DECL + content, 'utf8')
  console.log(`UPDATED: ${file}`)
}
