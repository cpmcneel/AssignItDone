import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCanvasCalendar } from './canvasCalendar.js';

const calendarFixture = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:proposal-123
DTSTART;VALUE=DATE:20261004
DTEND;VALUE=DATE:20261005
SUMMARY:Assignment Due: HCI proposal
LOCATION:Human Computer Interaction
DESCRIPTION:Write a draft\\, then share it with the team.
END:VEVENT
BEGIN:VEVENT
UID:event-without-date
SUMMARY:Missing due date
END:VEVENT
END:VCALENDAR`;

test('converts Canvas calendar events to editable assignments', () => {
  const assignments = parseCanvasCalendar(calendarFixture);

  assert.equal(assignments.length, 1);
  assert.deepEqual(assignments[0], {
    sourceUid: 'proposal-123',
    title: 'HCI proposal',
    course: 'Human Computer Interaction',
    dueDate: '2026-10-04',
    minutes: 30,
    priority: 'Medium',
    details: 'Write a draft, then share it with the team.',
    completed: false,
  });
});

test('returns an empty list when the calendar has no usable assignment events', () => {
  assert.deepEqual(parseCanvasCalendar('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR'), []);
});
