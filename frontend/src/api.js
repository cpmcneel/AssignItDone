// AI used to connect frontend and backend - changes made after to fit project
// Prompt using codex: Connect the frontend to the existing backend 
// endpoints for classes, tasks, decks, flashcards, and AI chat. 
// Replace browser storage with API calls, keep the current UI, 
// and add basic loading and error messages. Keep the changes simple.


export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Could not reach the backend. Check that it is running and try again.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const fallback = response.status >= 500
      ? 'The backend is unavailable or could not complete the request. Please try again.'
      : `Request failed (${response.status}).`;
    const error = new Error(data?.message || data?.error || fallback);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}
