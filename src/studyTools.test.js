import assert from 'node:assert/strict';
import test from 'node:test';
import { generateFlashcards, gradeAnswer } from './studyTools.js';

test('generates a definition flashcard from uploaded-style notes', () => {
  const cards = generateFlashcards('## Memory\nWorking memory is a limited system that temporarily stores and manipulates information.');

  assert.equal(cards.length, 1);
  assert.equal(cards[0].front, 'What is Working memory?');
  assert.match(cards[0].back, /temporarily stores and manipulates information/);
});

test('uses the section heading to create a card for prose notes', () => {
  const cards = generateFlashcards('# Classical conditioning\nA neutral stimulus becomes associated with an unconditioned stimulus after repeated pairings.');

  assert.equal(cards.length, 1);
  assert.equal(cards[0].front, 'What is important about Classical conditioning?');
});

test('grades a complete response and identifies missing note keywords', () => {
  const result = gradeAnswer('A limited system temporarily stores and manipulates information', 'A limited system that temporarily stores and manipulates information');

  assert.equal(result.status, 'correct');
  assert.equal(result.missing.length, 0);
});

test('marks an unknown response for review without hiding the explanation', () => {
  const result = gradeAnswer('I do not know', 'A limited system temporarily stores information');

  assert.equal(result.status, 'review');
  assert.match(result.explanation, /stores information/);
  assert.ok(result.missing.length > 0);
});

test('does not report grammatical filler as a missing study concept', () => {
  const result = gradeAnswer('a clue about how an object should be used', 'a clue about how an object should be used');

  assert.equal(result.status, 'correct');
  assert.ok(!result.missing.includes('how'));
  assert.ok(!result.missing.includes('should'));
});
