import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateHealthResponse,
  shouldDisplayHealthAlert,
  getNextPollInterval,
  formatLastCheckedTime,
} from './health.ts';

test('Health evaluation - evaluates healthy responses correctly', () => {
  const result = evaluateHealthResponse(true, { status: 'UP', version: '1.0.0' }, 120);
  assert.equal(result.status, 'healthy');
  assert.equal(result.errorMessage, null);

  const okResult = evaluateHealthResponse(true, { status: 'OK' }, 50);
  assert.equal(okResult.status, 'healthy');
});

test('Health evaluation - detects high latency as degraded', () => {
  const result = evaluateHealthResponse(true, { status: 'UP' }, 3500);
  assert.equal(result.status, 'degraded');
  assert.match(result.errorMessage || '', /High API latency/);
});

test('Health evaluation - detects offline and non-200 responses', () => {
  const offlineResult = evaluateHealthResponse(false, null, 0);
  assert.equal(offlineResult.status, 'offline');
  assert.ok(offlineResult.errorMessage);

  const unexpectedStatus = evaluateHealthResponse(true, { status: 'DOWN' }, 100);
  assert.equal(unexpectedStatus.status, 'offline');
});

test('Alert visibility logic', () => {
  assert.equal(shouldDisplayHealthAlert('healthy', 0), false);
  assert.equal(shouldDisplayHealthAlert('offline', 0), true);
  assert.equal(shouldDisplayHealthAlert('degraded', 0), true);
  assert.equal(shouldDisplayHealthAlert('healthy', 1), true);
});

test('Polling interval adjustments', () => {
  assert.equal(getNextPollInterval('healthy', 30000), 30000);
  assert.equal(getNextPollInterval('offline', 30000), 10000);
});

test('Last checked time formatting in EN and RW', () => {
  const now = new Date();
  assert.equal(formatLastCheckedTime(null, 'en'), 'Never');
  assert.equal(formatLastCheckedTime(null, 'rw'), 'Ntabwo barafatanya');

  assert.equal(formatLastCheckedTime(now, 'en'), 'Just now');
  assert.equal(formatLastCheckedTime(now, 'rw'), 'Nonaha');

  const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
  assert.match(formatLastCheckedTime(thirtySecsAgo, 'en'), /30s ago/);
  assert.match(formatLastCheckedTime(thirtySecsAgo, 'rw'), /amasegonda 30 ashize/);
});
