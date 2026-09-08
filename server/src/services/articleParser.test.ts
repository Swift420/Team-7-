import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ArticleValidationError, parseMarkdown, parseNzzJson } from './articleParser.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(currentDir, '../../..');

test('parses every supplied NZZ JSON article and preserves ordered element ids', () => {
  const directory = path.join(root, 'VisualVelocity/input/articles');
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.json'));
  assert.equal(files.length, 20);
  for (const file of files) {
    const article = parseNzzJson(fs.readFileSync(path.join(directory, file), 'utf8'));
    assert.ok(article.nzzId);
    assert.ok(article.headline);
    assert.ok(article.body.length > 0);
    assert.equal(article.body[0].id, 'element-0001');
    assert.equal(article.body.at(-1)?.id, `element-${String(article.body.length).padStart(4, '0')}`);
  }
});

test('extracts Markdown front matter and typed body elements', () => {
  const markdown = fs.readFileSync(path.join(root, 'server/test-fixtures/manual-article.md'), 'utf8');
  const article = parseMarkdown(markdown);
  assert.equal(article.headline, "Namibia's renewable energy transition");
  assert.equal(article.authorLine, 'Visual Velocity Editor');
  assert.equal(article.sourceFormat, 'MARKDOWN');
  assert.ok(article.body.some((element) => element.type === 'heading'));
  assert.ok(article.body.some((element) => element.type === 'q_tool_embed'));
});

test('returns useful validation for malformed NZZ JSON', () => {
  assert.throws(() => parseNzzJson('{"headline":"Missing body"}'), ArticleValidationError);
});
