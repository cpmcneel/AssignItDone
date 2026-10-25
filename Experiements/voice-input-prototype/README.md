# AssignItDone — voice + study buddy experiment

A small React Compiler / TypeScript / Vite page and Java / Spring Boot / Maven backend.
This experiment tests the input → backend → response → speech loop. It does not save
assignments, query due dates, upload files, or integrate Canvas/calendars. Paste short
fictional notes into the text box to try study guides or quizzes.

## Run in mock mode first

Requires Node compatible with the existing Vite 8 template, Java 17+, and Maven.
From this folder, use two terminals:

```sh
# Terminal 1
cd backend
mvn spring-boot:run
```

```sh
# Terminal 2 (project root)
npm install
npm run dev
```

Open the localhost URL printed by Vite. Mock mode is the default: Send returns a
clearly labeled echo through the backend, without contacting Ollama. The backend
listens only on 127.0.0.1:8080. Vite proxies `/api` there, so browser code uses a
relative URL and needs no CORS configuration. This proxy is for the dev server;
`vite preview` alone is not a deployment of the full stack.

## One small cloud experiment

Stop the mock backend. In the backend terminal, set these environment variables
and restart it. Read the key silently to avoid putting its literal value in shell
history (zsh):

```sh
read -s 'OLLAMA_API_KEY?Ollama API key: '
export OLLAMA_API_KEY
export AI_MOCK=false
export OLLAMA_MODEL=gemma4:31b
mvn spring-boot:run
```

Create the key in [Ollama settings](https://ollama.com/settings/keys).
CLI sign-in is separate from this backend's direct API authentication.
[Ollama cloud documentation](https://docs.ollama.com/cloud) distinguishes the CLI
name `gemma4:cloud` from direct API names such as `gemma4:31b`. If the model changes,
check the cloud catalog or `https://ollama.com/api/tags` and set `OLLAMA_MODEL`.
Never put the key in a `VITE_*` variable, frontend source, or Git. `.env` files are
ignored, but this backend does not load them automatically: use environment variables.
Switch back with `export AI_MOCK=true` and restart the backend.

Send a single short prompt first. Each click sends one independent request: there
is no conversation memory or automatic retry. Text is limited to 4000 characters;
output requests use `num_predict: 512` to keep experiments small (long outputs may
be cut off). This is not a guarantee of cloud quota usage. The backend has a
60-second read timeout; the browser aborts after 70 seconds. A browser timeout does
not guarantee that provider processing stopped. Quota and authentication errors
show safe messages, without forwarding provider bodies or keys.

## Understand the code

- `src/speech.ts`: small TypeScript interfaces for the browser speech recognition API,
  including the prefixed constructor used by some browsers.
- `src/App.tsx`: microphone sessions report interim text separately, append final text
  to your draft, and allow review before sending. Stop waits for recognition to end.
  Typed input remains available when recognition is unsupported or denied. Speech
  output happens only on Speak, with Stop speaking available.
- `vite.config.ts`: development proxy between the React page and backend.
- `backend/.../ChatController.java`: accepts `{ "text": "..." }` at `POST /api/chat`
  and maps validation/errors to JSON.
- `backend/.../ChatService.java`: mock echo or one direct HTTP call to Ollama with a
  backend-only Bearer key. Returns `{ response, mode, model }`. Direct HTTP keeps the
  request visible while learning; Spring AI can be evaluated later. The system prompt
  asks for grounded answers, but factual correctness still requires evaluation.

There is no need for routing, TanStack Query, H2, or JPA in this single-page loop.
Add persistence separately when assignment CRUD becomes the next experiment.

## Checks

```sh
npm run build
npm run lint
cd backend
mvn test
```

Backend tests replace HTTP with a mock server: they check validation, missing keys,
mock mode, cloud payload/response mapping, quota errors, and malformed responses.
They use no cloud allowance. See `CHECKS.md` for what was actually executed.

## Manual browser checklist

1. Start both servers in mock mode. Type a request, send it, and verify a MOCK echo.
2. On localhost in a browser supporting recognition, allow microphone access. Speak
   a short assignment sentence, stop, and verify final words reach the editable box.
   Interim transcript should remain visible; nothing sends automatically.
3. Repeat with an existing typed draft; final dictation should append to it. Edit the
   result before Send. Test natural recognition end, repeat sessions, and no speech.
4. Deny microphone access and verify the error and typed fallback. Try an unsupported
   browser. Recognition support varies; see [MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
   Browser recognition may use a remote audio service even when AI mock mode is on.
5. Speak a response; stop playback. Start the microphone during playback and confirm
   playback stops. Verify keyboard controls, focus indicators, and a narrow window.
6. Stop the backend and send: verify an error and recovery when it returns.
7. With cloud mode enabled, send one small request and verify the CLOUD model label.
   Actual microphone, browser speech playback, and real cloud access require manual
   checks; a successful build does not demonstrate them.

## Small AI evaluation

Use fictional notes: “Luma has a 40-unit buffer. Transfers take 2 seconds each.
A new transfer can begin only after the previous buffer is emptied. No other
performance facts are specified.” Ask for two reasoning questions and a checked
answer key. For moving 50 units, a valid answer needs at least two transfers;
total elapsed time cannot be calculated without an emptying time. Record whether
it respects capacity, identifies missing information, asks reasoning questions,
and agrees with its answer key. Try a correction in a new prompt that includes the
full corrected notes, since this experiment has no conversation memory.

Use `EVALUATION.md` to record results for the October 21 milestone.

## Transcript typo correction

In cloud mode, the same Ollama request interprets obvious typos and speech-to-text
errors before answering. Obvious wording corrections are applied
silently so the response stays natural. Ambiguous names, course
codes, dates, and quantities should trigger a clarification instead of a guess.
This is a model instruction, not guaranteed correction or a rewrite of the input
box. Mock mode still echoes the original input. Restart the backend after changing
the prompt. Try `my asignment is dew October 21` and verify that it corrects spelling
without inventing a course or year. Then try an ambiguous date and check that it asks.
