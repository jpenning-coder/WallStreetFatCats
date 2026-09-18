// Test-only TypeScript loader; uses the project's existing compiler, not a new runner.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

function createSourceLoader(overrides = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const code = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(code, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }, fileName: filename }).outputText;
    const compiledModule = new Module(filename);
    compiledModule.filename = filename;
    compiledModule.paths = Module._nodeModulePaths(path.dirname(filename));
    cache.set(filename, compiledModule);
    const nativeRequire = compiledModule.require.bind(compiledModule);
    compiledModule.require = (specifier) => {
      if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
      // Next enforces the marker at build time; tests intentionally run server code.
      if (specifier === 'server-only') return {};
      if (specifier.endsWith('.css')) return {};
      if (specifier.startsWith('@/') || specifier.startsWith('.')) {
        const base = specifier.startsWith('@/') ? path.join(root, 'src', specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
        for (const candidate of [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts')]) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && /\.tsx?$/.test(candidate)) return load(candidate);
        }
      }
      return nativeRequire(specifier);
    };
    compiledModule._compile(output, filename);
    return compiledModule.exports;
  }
  return load;
}
module.exports = { createSourceLoader, root };
