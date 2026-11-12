import ICAL from 'ical.js';

function toLocalDate(value) {
  if (!value || !Number.isInteger(value.year) || !Number.isInteger(value.month) || !Number.isInteger(value.day)) return '';
  const year = String(value.year).padStart(4, '0');
  const month = String(value.month).padStart(2, '0');
  const day = String(value.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eventToAssignment(component) {
  const due = component.getFirstPropertyValue('due')
    || component.getFirstPropertyValue('dtstart')
    || component.getFirstPropertyValue('dtend');
  const dueDate = toLocalDate(due);
  const rawTitle = component.getFirstPropertyValue('summary');
  const title = String(rawTitle || '').trim().replace(/^assignment due:\s*/i, '');

  if (!title || !dueDate) return null;

  const uid = component.getFirstPropertyValue('uid');
  const description = component.getFirstPropertyValue('description');
  const location = component.getFirstPropertyValue('location');

  return {
    sourceUid: String(uid || `${title}-${dueDate}`),
    title,
    course: String(location || 'Canvas'),
    dueDate,
    minutes: 30,
    priority: 'Medium',
    details: String(description || '').replace(/\s+/g, ' ').trim().slice(0, 240),
    completed: false,
  };
}

export function parseCanvasCalendar(contents) {
  const calendar = new ICAL.Component(ICAL.parse(contents));
  const components = [
    ...calendar.getAllSubcomponents('vevent'),
    ...calendar.getAllSubcomponents('vtodo'),
  ];
  return components.map(eventToAssignment).filter(Boolean);
}
