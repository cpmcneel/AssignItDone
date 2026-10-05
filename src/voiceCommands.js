const weekdays = new Map([
  ['sunday', 0], ['monday', 1], ['tuesday', 2], ['wednesday', 3],
  ['thursday', 4], ['friday', 5], ['saturday', 6],
]);

function localDateString(date) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseSpokenDate(transcript, referenceDate) {
  const match = transcript.match(/\b(?:make it due|due(?: date)?(?: is)?)\s+(?:on\s+)?(today|tomorrow|(?:(?:next|this)\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)/i);
  if (!match) return '';

  const phrase = match[1].toLowerCase().replace(/^(next|this)\s+/, '');
  const date = new Date(referenceDate);
  date.setHours(12, 0, 0, 0);
  if (phrase === 'tomorrow') date.setDate(date.getDate() + 1);
  else if (phrase === 'today') return localDateString(date);
  else if (weekdays.has(phrase)) {
    const offset = (weekdays.get(phrase) - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + offset + (match[1].toLowerCase().startsWith('next ') && offset === 0 ? 7 : 0));
  } else if (phrase.includes('/')) {
    const [month, day, year] = phrase.split(/[/-]/).map(Number);
    date.setFullYear(year ? (year < 100 ? 2000 + year : year) : date.getFullYear(), month - 1, day);
    if (!year && date < referenceDate) date.setFullYear(date.getFullYear() + 1);
  } else {
    const parsed = new Date(`${phrase}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return '';
    return localDateString(parsed);
  }
  return localDateString(date);
}

export function parseVoiceAssignment(transcript, referenceDate = new Date()) {
  const original = transcript.trim();
  let titleAndCourse = original
    .replace(/^(?:please\s+)?(?:add|create|remind me about)\s+(?:my\s+)?/i, '')
    .replace(/\s+(?:and\s+)?(?:make it\s+)?due(?:\s+date)?(?:\s+is)?\s+(?:on\s+)?(?:today|tomorrow|(?:(?:next|this)\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?).*$/i, '')
    .trim();

  const courseMatch = titleAndCourse.match(/\s+(?:for|in)\s+(.+)$/i);
  const course = courseMatch ? courseMatch[1].replace(/^(?:my\s+)?/i, '').replace(/\s+(?:class|course)$/i, '').trim() : '';
  if (courseMatch) titleAndCourse = titleAndCourse.slice(0, courseMatch.index).trim();

  return {
    title: titleAndCourse || original,
    course,
    dueDate: parseSpokenDate(original, referenceDate),
    minutes: 30,
  };
}
