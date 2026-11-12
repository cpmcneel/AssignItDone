import { apiRequest } from './api.js';

export async function askStudyAssistant({ deck, prompt, signal }) {
  if (deck && !deck.id) throw new Error('Save this deck before asking the AI about it.');
  const question = prompt.trim();
  if (!question) throw new Error('Enter a question first.');
  if (question.length > 12000) throw new Error('Keep your question under 12,000 characters.');
  try {
    const response = await apiRequest('/chat', {
      method: 'POST',
      body: { question, deckId: deck?.id },
      signal,
    });
    const answer = response.answer?.trim();
    if (!answer) throw new Error('The AI assistant returned an empty answer.');
    return answer;
  } catch (error) {
    if (error.status === 503) throw new Error('The AI assistant is unavailable right now. Try again when the AI service is enabled.');
    if (error.status === 502) throw new Error('The AI service could not answer. Please try again.');
    if (error.status === 404) throw new Error('This deck is no longer available. Refresh the library.');
    if (error.status === 400) throw new Error('The question or deck is too large or invalid. Try a shorter question or a smaller deck.');
    throw error;
  }
}
