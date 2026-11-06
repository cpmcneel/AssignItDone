import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import { handleChatRequest } from './chat.js';

function makeResponse() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = JSON.parse(body);
    },
  };
}

function makeRequest(body, method = 'POST') {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.method = method;
  return request;
}

test('chat endpoint sends model credentials from server config, not the request', async () => {
  const response = makeResponse();
  let upstreamRequest;

  await handleChatRequest(makeRequest({
    messages: [{ role: 'user', content: 'Explain photosynthesis.' }],
    apiKey: 'ignore-client-key',
    model: 'ignore-client-model',
  }), response, {
    env: {
      OLLAMA_BASE_URL: 'https://ai.example.test',
      OLLAMA_MODEL: 'server-model',
      OLLAMA_API_KEY: 'server-key',
    },
    fetchImpl: async (url, options) => {
      upstreamRequest = { url, ...options };
      return { ok: true, json: async () => ({ message: { content: 'Plants use sunlight.' } }) };
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(upstreamRequest.url, 'https://ai.example.test/api/chat');
  assert.equal(upstreamRequest.headers.Authorization, 'Bearer server-key');
  assert.equal(JSON.parse(upstreamRequest.body).model, 'server-model');
  assert.equal(response.body.message.content, 'Plants use sunlight.');
});

test('chat endpoint explains missing server configuration without contacting a provider', async () => {
  const response = makeResponse();
  let contactedProvider = false;

  await handleChatRequest(makeRequest({ messages: [{ role: 'user', content: 'Hello' }] }), response, {
    env: {},
    fetchImpl: async () => { contactedProvider = true; },
  });

  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /not been set up/i);
  assert.equal(contactedProvider, false);
});