import assert from 'node:assert/strict';
import test from 'node:test';
import { askStudyAssistant, buildChatMessages, buildStudyPrompt, parseAssistantResponse } from './studyAssistant.js';

test('buildStudyPrompt includes the deck context and the student question', () => {
  const prompt = buildStudyPrompt({
    deck: {
      cards: [
        { front: 'What is photosynthesis?', back: 'Plants make food from sunlight.' },
      ],
    },
    prompt: 'Can you explain it in simple words?',
  });

  assert.match(prompt, /Study deck context:/);
  assert.match(prompt, /What is photosynthesis\?/);
  assert.match(prompt, /Can you explain it in simple words\?/);
});

test('parses Ollama and OpenAI-style responses', () => {
  assert.match(parseAssistantResponse({ message: { content: 'hello' } }), /hello/);
  assert.match(parseAssistantResponse({ choices: [{ message: { content: 'hi there' } }] }), /hi there/);
});

test('buildStudyPrompt still works when there is no deck so it behaves like a normal AI assistant', () => {
  const prompt = buildStudyPrompt({
    prompt: 'What is the moon made of?',
  });

  assert.equal(prompt, 'What is the moon made of?');
});

test('buildChatMessages sends prior turns before the new question', () => {
  const messages = buildChatMessages({
    prompt: 'Can you explain that again?',
    history: [
      { role: 'user', content: 'What is gravity?' },
      { role: 'assistant', content: 'Gravity pulls objects together.' },
    ],
  });

  assert.deepEqual(messages.map(({ role }) => role), ['system', 'user', 'assistant', 'user']);
  assert.match(messages[0].content, /helpful AI assistant/i);
  assert.equal(messages[1].content, 'What is gravity?');
  assert.equal(messages[2].content, 'Gravity pulls objects together.');
  assert.equal(messages[3].content, 'Can you explain that again?');
});

test('study coach grounds answer reasoning and question help in the deck', () => {
  const messages = buildChatMessages({
    deck: { cards: [{ front: 'What is gravity?', back: 'A force that attracts objects with mass.' }] },
    prompt: 'Why is that the answer?',
  });

  assert.match(messages[0].content, /source of truth/i);
  assert.match(messages[0].content, /do not invent facts beyond the notes/i);
  assert.match(messages[0].content, /unpack a question/i);
});

test('askStudyAssistant sends chat to the same-origin API without a client key', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, ...options };
    return { ok: true, json: async () => ({ message: { content: 'A helpful answer.' } }) };
  };

  try {
    const answer = await askStudyAssistant({ prompt: 'Hello' });
    assert.equal(answer, 'A helpful answer.');
    assert.equal(request.url, '/api/chat');
    assert.equal(request.headers.Authorization, undefined);
    assert.deepEqual(Object.keys(JSON.parse(request.body)), ['messages']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
