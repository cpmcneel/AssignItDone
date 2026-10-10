const stopWords = new Set([
  'about', 'after', 'again', 'also', 'because', 'been', 'before', 'being', 'between', 'both',
  'could', 'does', 'each', 'from', 'have', 'into', 'more', 'most', 'other', 'over', 'same',
  'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'under', 'very', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your', 'and', 'are', 'for', 'the', 'was', 'were', 'will', 'can', 'may', 'not',
  'you', 'its', 'has', 'had', 'his', 'her', 'our', 'out', 'use', 'using', 'used', 'one',
  'how', 'should', 'does', 'did', 'all', 'any', 'who', 'why', 'its', 'their',
]);

function cleanPhrase(value) {
  // Normalize note text so the card generator works consistently across files, markdown, and plain text.
  return value
    .replace(/^[-*#>\s]+/, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, (link) => link.match(/\[([^\]]*)\]/)?.[1] || '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;,]+$/, '');
}

function normalizeTerm(value) {
  return cleanPhrase(value).replace(/\s+/g, ' ').toLowerCase();
}

function makeCard(front, back, source, index) {
  const question = cleanPhrase(front).replace(/[?!.]+$/, '');
  const answer = cleanPhrase(back);
  if (!question || !answer || question.toLowerCase() === answer.toLowerCase()) return null;
  return { id: `card-${index}-${question.slice(0, 24)}`, front: `${question}?`, back: answer, source };
}

function questionForStatement(statement) {
  // Turn a sentence from notes into a quiz question instead of dumping the raw text into a card.
  const about = statement.match(/^([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*){0,3})\s+(?:is|are|means|refers to|describes|represents|consists of)\s+(.+)$/i);
  if (about) return { front: `What is ${about[1]}?`, back: about[2] };

  const hasColon = statement.match(/^([\w][^:]{1,70}):\s*(.{12,})$/);
  if (hasColon) return { front: `What should you know about ${hasColon[1]}?`, back: hasColon[2] };

  const relation = statement.match(/^(.{3,65}?)\s+(?:includes|requires|causes|supports|allows|uses|contains)\s+(.{12,})$/i);
  if (relation) return { front: `How does ${relation[1]} work?`, back: `${statement}` };

  return null;
}

export function generateFlashcards(noteText) {
  // Build a study deck from note text by scanning headings and sentences, then keeping only
  // useful candidate facts that can be turned into question/answer cards.
  const text = String(noteText || '').replace(/\r/g, '').trim();
  if (!text) return [];

  const lines = text.split('\n').map((line) => {
    const heading = /^\s*#{1,6}\s/.test(line);
    return { heading, text: cleanPhrase(line.replace(/^\s*#{1,6}\s*/, '')) };
  }).filter(({ text: line }) => Boolean(line));

  const candidateSentences = [];
  let currentHeading = '';
  for (const line of lines) {
    if (line.heading) {
      currentHeading = line.text;
      continue;
    }
    const sentences = line.text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/);
    for (const sentence of sentences) {
      const cleaned = cleanPhrase(sentence);
      if (cleaned.length >= 24) candidateSentences.push({ text: cleaned, heading: currentHeading });
    }
  }

  const cards = [];
  const seen = new Set();
  for (const { text: sentence, heading } of candidateSentences) {
    let candidate = questionForStatement(sentence);
    if (!candidate && heading) candidate = { front: `What is important about ${heading}?`, back: sentence };
    if (!candidate) continue;
    const key = normalizeTerm(candidate.front);
    if (seen.has(key)) continue;
    seen.add(key);
    const card = makeCard(candidate.front, candidate.back, sentence, cards.length);
    if (card) cards.push(card);
    if (cards.length >= 40) break;
  }

  if (!cards.length) {
    const firstUseful = candidateSentences.find(({ text: sentence }) => sentence.length >= 35);
    if (firstUseful) {
      const subject = firstUseful.text.split(/\s+/).slice(0, 5).join(' ');
      const card = makeCard(`Explain this idea: ${subject}`, firstUseful.text, firstUseful.text, 0);
      if (card) cards.push(card);
    }
  }

  return cards;
}

export function gradeAnswer(response, expectedAnswer) {
  // Compare the student’s answer against the note keywords. This lets the app tell the user
  // whether they got the core concept, only part of it, or need more review.
  const responseWords = new Set(normalizeTerm(response).match(/[a-z0-9]+/g) || []);
  const expectedWords = [...new Set(normalizeTerm(expectedAnswer).match(/[a-z0-9]+/g) || [])]
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const matched = expectedWords.filter((word) => responseWords.has(word));
  const missing = expectedWords.filter((word) => !responseWords.has(word));
  const coverage = expectedWords.length ? matched.length / expectedWords.length : 0;
  const status = coverage >= 0.62 ? 'correct' : coverage >= 0.28 ? 'partial' : 'review';

  const feedback = status === 'correct'
    ? 'You covered the main ideas from your notes.'
    : status === 'partial'
      ? 'You have part of it. Compare the missing ideas with the explanation.'
      : 'That is okay. Read the explanation, then try saying it back in your own words.';

  return { status, coverage, matched, missing, feedback, explanation: cleanPhrase(expectedAnswer) };
}

export function createFolder(name) {
  return { id: globalThis.crypto?.randomUUID?.() || `folder-${Date.now()}`, name: cleanPhrase(name), createdAt: new Date().toISOString() };
}

export function createDeck({ title, folderId, sourceName, cards }) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `deck-${Date.now()}`,
    title: cleanPhrase(title) || sourceName,
    folderId,
    sourceName,
    cards,
    createdAt: new Date().toISOString(),
  };
}
