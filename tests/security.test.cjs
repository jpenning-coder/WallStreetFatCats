const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { root } = require('./support/load-source.cjs');

test('client runtime dependency graph contains no server integration or private environment reads', () => {
  const seen = new Set();
  function visit(filename) {
    if (seen.has(filename)) return;
    seen.add(filename);
    const source = fs.readFileSync(filename, 'utf8');
    assert.ok(!filename.endsWith('.server.ts'), `Server module in client graph: ${filename}`);
    assert.ok(!/GORDON_N8N_|GORDON_TIMEOUT_MS|process\.env/.test(source), `Private config in ${filename}`);
    const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) continue;
      const spec = node.moduleSpecifier.text;
      if (!spec.startsWith('@/')) continue;
      const base = path.join(root, 'src', spec.slice(2));
      const target = [base + '.ts', base + '.tsx'].find(fs.existsSync);
      if (target && !target.includes('/types/')) visit(target);
    }
  }
  visit(path.join(root, 'src/components/gordon/analysis-workspace.tsx'));
  assert.ok(seen.size >= 8);
});
test('server configuration modules carry the Next server-only boundary', () => {
  for (const file of ['config.server.ts', 'upstream.server.ts']) assert.match(fs.readFileSync(path.join(root, 'src/lib/gordon', file), 'utf8'), /import "server-only"/);
});
test('no private credentials or quantitative calculations are placed in public configuration', () => {
  const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.equal((env.match(/^NEXT_PUBLIC_/gm) || []).length, 1);
  for (const name of ['GORDON_N8N_WEBHOOK_URL', 'GORDON_N8N_WEBHOOK_SECRET']) assert.match(env, new RegExp('^' + name + '=$', 'm'));
  assert.ok(!env.includes('NEXT_PUBLIC_GORDON'));
});
