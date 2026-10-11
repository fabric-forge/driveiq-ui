import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

test('production build contains its application entry point', () => {
  const htmlPath = path.join(distDir, 'index.html');
  assert.ok(existsSync(htmlPath), 'build should emit dist/index.html');

  const html = readFileSync(htmlPath, 'utf8');
  const script = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"[^>]*>/);
  assert.ok(script, 'index.html should reference a JavaScript entry point');

  const assetPath = path.resolve(distDir, `.${new URL(script[1], 'http://localhost').pathname}`);
  assert.ok(assetPath.startsWith(`${path.resolve(distDir)}${path.sep}`), 'entry point should be inside dist');
  assert.ok(existsSync(assetPath), 'JavaScript entry point should exist');
  assert.ok(statSync(assetPath).size > 0, 'JavaScript entry point should not be empty');
});
