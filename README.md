# AssignItDone

Put this in `backend/.env` using your key from [Groq](https://console.groq.com/keys). The variable names still say Ollama but Ollama no longer allows free cloud access.

```properties
SPRING_PROFILES_ACTIVE=ai
OLLAMA_BASE_URL=https://api.groq.com/openai/v1
OLLAMA_MODEL=openai/gpt-oss-120b
OLLAMA_API_KEY=your-groq-key
```

Backend (Java 25):

```bash
cd backend
./mvnw spring-boot:run -Dmaven.test.skip=true
```

Frontend, in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. Data resets when the backend restarts.
