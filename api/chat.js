const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 12_000;

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  const chunks = [];
  let byteLength = 0;
  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > MAX_BODY_BYTES) {
      const error = new Error('Chat request is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Chat request must contain valid JSON.');
    error.status = 400;
    throw error;
  }
}

function cleanMessages(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    throw new Error(`Send between 1 and ${MAX_MESSAGES} chat messages.`);
  }

  let totalLength = 0;
  const messages = value.map((message) => {
    if (!['system', 'user', 'assistant'].includes(message?.role) || typeof message.content !== 'string') {
      throw new Error('Chat messages must have a role and text.');
    }

    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      throw new Error('A chat message is empty or too long.');
    }
    totalLength += content.length;
    return { role: message.role, content };
  });

  if (totalLength > MAX_BODY_BYTES) {
    throw new Error('Chat history is too long. Start a new chat and try again.');
  }

  return messages;
}

function getEndpoint(baseUrl) {
  const normalizedUrl = baseUrl.trim().replace(/\/+$/, '');
  if (/\/v1\/chat\/completions$|\/chat\/completions$|\/api\/chat$/i.test(normalizedUrl)) {
    return normalizedUrl;
  }
  return `${normalizedUrl}/api/chat`;
}

export async function handleChatRequest(request, response, { env = process.env, fetchImpl = fetch } = {}) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Use POST to send a chat message.' });
  }

  const baseUrl = env.OLLAMA_BASE_URL?.trim();
  const model = env.OLLAMA_MODEL?.trim();
  if (!baseUrl || !model) {
    return sendJson(response, 503, { error: 'The AI assistant has not been set up by the site owner yet.' });
  }

  let body;
  let messages;
  try {
    body = await readBody(request);
    messages = cleanMessages(body.messages);
  } catch (error) {
    return sendJson(response, error.status || 400, { error: error.message });
  }

  let endpoint;
  try {
    endpoint = getEndpoint(baseUrl);
    const parsedUrl = new URL(endpoint);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol');
  } catch {
    return sendJson(response, 500, { error: 'The site owner configured an invalid AI server URL.' });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (env.OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${env.OLLAMA_API_KEY}`;
    headers['x-api-key'] = env.OLLAMA_API_KEY;
  }

  try {
    const upstream = await fetchImpl(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, stream: false, temperature: 0.4 }),
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 2000);
      return sendJson(response, upstream.status, { error: detail || 'The AI service could not answer.' });
    }

    const payload = await upstream.json();
    return sendJson(response, 200, payload);
  } catch {
    return sendJson(response, 502, { error: 'The AI service could not be reached. Check the server URL and try again.' });
  }
}

export default async function handler(request, response) {
  return handleChatRequest(request, response);
}