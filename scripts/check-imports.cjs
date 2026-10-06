const fs = require('fs');
const path = require('path');
const ts = require('typescript');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : /\.[jt]sx?$/.test(file) ? [file] : [];
  });
}
const files = walk('src');
let count = 0;
const missing = [];
for (const file of files) {
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier;
    if (specifier && ts.isStringLiteral(specifier) && (specifier.text.startsWith('@/') || specifier.text.startsWith('.'))) {
      count++;
      const target = specifier.text.startsWith('@/') ? path.join('src', specifier.text.slice(2)) : path.resolve(path.dirname(file), specifier.text);
      const candidates = [target, ...['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'].map(ext => target + ext)];
      if (!candidates.some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())) missing.push(`${file}: ${specifier.text}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
if (missing.length) { console.error(missing.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${count} local imports and re-exports in ${files.length} source files.`);
