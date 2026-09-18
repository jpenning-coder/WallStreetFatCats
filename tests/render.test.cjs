const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { createSourceLoader } = require('./support/load-source.cjs');
const load = createSourceLoader();
const { ReportContent } = load('src/components/gordon/report-content.tsx');
const render = report => renderToStaticMarkup(React.createElement(ReportContent, { report }));

test('report renders headings, emphasis, lists, quotes, and code as semantic HTML', () => {
  const html = render('# Test report\n\n**Fixture** text.\n\n- One\n- Two\n\n3. Three\n4. Four\n\n> Risk\n\n```text\nhello\n```');
  for (const tag of ['<h3>', '<strong>', '<ul>', '<ol start="3">', '<blockquote>', '<pre>']) assert.ok(html.includes(tag));
  assert.ok(!html.includes('<h1>'));
});
test('report escapes raw HTML and does not create executable links or images', () => {
  const html = render('Fixture\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[javascript](javascript:alert(1))\n![track](https://example.invalid/pixel)');
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<img')); assert.ok(!html.includes('<a '));
  assert.ok(html.includes('&lt;script&gt;'));
});
test('report renders a accessible bounded-width table from supplied text', () => {
  const html = render('| Area | Note |\n| --- | --- |\n| Data | Test fixture |');
  assert.match(html, /<table>/); assert.match(html, /scope="col"/); assert.match(html, /tabindex="0"/); assert.match(html, /Test fixture/);
});
test('irregular tables keep every supplied cell rather than losing data', () => {
  const html = render('| A | B |\n| --- | --- |\n| one | two | third-value |');
  assert.match(html, /third-value/); assert.match(html, /<pre>/);
});
test('plain report formatting preserves line breaks and long words safely', () => {
  const text = 'Line one\nLine two\n\n' + 'A'.repeat(5000);
  const html = render(text); assert.match(html, /Line one\nLine two/); assert.ok(html.includes('A'.repeat(5000)));
});
