const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/authLink.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {}, URLSearchParams };
vm.runInNewContext(compiled, context);
const { getAuthLinkDestination } = context.exports;

function location(value) {
  const { pathname, search, hash } = new URL(value, 'https://prism.example');
  return { pathname, search, hash };
}

for (const [name, input] of [
  ['dashboard invitation at home', '/#access_token=fixture&refresh_token=fixture&type=invite'],
  ['recovery at home', '/#access_token=fixture&refresh_token=fixture&type=recovery'],
  ['callback landing on login', '/login#access_token=fixture&refresh_token=fixture&type=invite'],
  ['callback landing on install', '/install#type=invite&access_token=fixture&refresh_token=fixture'],
  ['PKCE verification', '/?code=fixture%2Bcode&type=invite'],
  ['token hash verification', '/?token_hash=fixture&type=recovery'],
  ['expired invitation', '/#error=access_denied&error_code=otp_expired&error_description=Link+expired'],
  ['query authentication error', '/?error=access_denied&error_description=Invalid+link'],
  ['callback on unknown path', '/unexpected?code=fixture'],
]) {
  test(name + ' reaches setup without losing callback parameters', () => {
    const original = location(input);
    const result = getAuthLinkDestination(original);
    assert.equal(result.pathname, '/invite');
    assert.equal(result.search, original.search);
    assert.equal(result.hash, original.hash);
  });
}

for (const input of [
  '/', '/login', '/alerts', '/install', '/connect?requestId=fixture',
  '/patient/fixture/scans', '/?next=/alerts#ordinary-section',
  '/invite#access_token=fixture&refresh_token=fixture&type=invite',
  '/auth/callback?code=fixture',
]) {
  test(input.split('#')[0] + ' keeps its existing routing', () => {
    assert.equal(getAuthLinkDestination(location(input)), null);
  });
}
