import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePdfJsModule } from './noteFiles.js';

test('resolves PDF.js modules whether they use default export or namespace export', () => {
  const moduleObject = { GlobalWorkerOptions: { workerSrc: '/worker.js' } };

  assert.equal(resolvePdfJsModule(moduleObject), moduleObject);
  assert.equal(resolvePdfJsModule({ default: moduleObject }), moduleObject);
});
