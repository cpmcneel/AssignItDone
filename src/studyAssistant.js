export function buildStudyPrompt({ deck, prompt }) {
  const context = deck?.cards?.map((card) => `Question: ${card.front}\nAnswer: ${card.back}`).join('\n\n') || '';

  if (!context.trim()) {
    return prompt;
  }

  return `Study deck context:
${context}

Student question:
${prompt}
`;
}

export function buildChatMessages({ deck, prompt, history = [] }) {
  const systemPrompt = deck?.cards?.length
    ? 'You are a friendly study companion. Use the study deck as your source of truth. Keep answers clear and concise, explain how evidence in the notes supports an answer, and do not invent facts beyond the notes. When asked to unpack a question, clarify what it asks without giving away the answer unless requested.'
    : 'You are a helpful AI assistant. Answer naturally, clearly, and in plain English. Be friendly, brief when possible, and useful for everyday questions.';

  return [
    { role: 'system', content: systemPrompt },
    ...history.filter((entry) => entry?.content).map((entry) => ({ role: entry.role === 'assistant' ? 'assistant' : 'user', content: String(entry.content) })),
    { role: 'user', content: buildStudyPrompt({ deck, prompt }) },
  ];
}

export function parseAssistantResponse(payload) {
  if (typeof payload?.message?.content === 'string') {
    return payload.message.content.trim();
  }

  if (Array.isArray(payload?.choices) && payload.choices[0]?.message?.content) {
    return String(payload.choices[0].message.content).trim();
  }

  if (typeof payload?.content === 'string') {
    return payload.content.trim();
  }

  return '';
}

export async function askStudyAssistant({ deck, prompt, signal, history = [] }) {
  const messages = buildChatMessages({ deck, prompt, history });

  let response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new Error('The app could not reach its AI service. Check the connection and try again.');
  }

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    throw new Error(payload.error || 'The study assistant could not answer right now.');
  }

  const payload = await response.json();
  const answer = parseAssistantResponse(payload);

  if (!answer) {
    throw new Error('The study assistant returned an empty answer.');
  }

  return answer;
}
