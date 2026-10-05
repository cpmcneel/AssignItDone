import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVoiceAssignment } from './voiceCommands.js';

const referenceDate = new Date('2026-10-01T12:00:00');

test('extracts an assignment title and weekday due date from speech', () => {
  assert.deepEqual(parseVoiceAssignment('Add my HCI proposal and make it due Sunday', referenceDate), {
    title: 'HCI proposal',
    course: '',
    dueDate: '2026-10-04',
    minutes: 30,
  });
});

test('extracts course and numeric due date from speech', () => {
  assert.deepEqual(parseVoiceAssignment('Add lab report for my Biology course due 10/8', referenceDate), {
    title: 'lab report',
    course: 'Biology',
    dueDate: '2026-10-08',
    minutes: 30,
  });
});
