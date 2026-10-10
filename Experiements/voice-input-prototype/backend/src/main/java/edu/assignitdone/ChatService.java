package edu.assignitdone;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class ChatService {
    private final boolean mock;
    private final String key;
    private final String model;
    private final RestClient client;

    @org.springframework.beans.factory.annotation.Autowired
    public ChatService(@Value("${experiment.mock}") boolean mock,
                       @Value("${ollama.api-key}") String key,
                       @Value("${ollama.model}") String model) {
        this(mock, key, model, cloudClient());
    }

    // A separate constructor lets tests replace the HTTP client without a real key or cloud call.
    ChatService(boolean mock, String key, String model, RestClient client) {
        this.mock = mock;
        this.key = key;
        this.model = model;
        this.client = client;
    }

    private static RestClient cloudClient() {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(60));
        return RestClient.builder().baseUrl("https://ollama.com").requestFactory(factory).build();
    }

    public record Reply(String response, String mode, String model) {}

    public Reply chat(String text) {
        if (text == null || text.isBlank() || text.length() > 4000) {
            throw new ResponseStatusException(BAD_REQUEST, "Text must contain 1–4000 characters.");
        }
        if (mock) {
            return new Reply("Mock study buddy received: " + text.strip()
                + "\n\nThis is an echo for testing the voice/text pipeline. No assignment was saved and no AI analysis was performed.", "mock", "none");
        }
        if (key.isBlank()) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Set OLLAMA_API_KEY in the backend terminal or use AI_MOCK=true.");
        }
        try {
            // No conversation history, streaming, or retries: one button click, one small request.
            Map<?, ?> body = client.post().uri("/api/chat")
                .header("Authorization", "Bearer " + key)
                .body(Map.of("model", model, "stream", false,
                    "options", Map.of("num_predict", 512),
                    "messages", List.of(
                        Map.of("role", "system", "content", """
                            You are AssignItDone's study buddy in an experimental prototype.
                            Respond concisely using only the user's provided information.
                            User input may be a speech-to-text transcript or typed text containing typos.
                            Correct obvious spelling, punctuation, and speech recognition mistakes when context
                            makes the intended wording clear, then answer the intended request.
                            Apply obvious corrections silently. Answer naturally without announcing
                            corrections or repeating the transcript unless the user asks.
                            Preserve the user's meaning, negations, course codes, names, dates, numbers,
                            units, and fictional technical terms. Do not silently replace unfamiliar terms.
                            If a correction would require guessing an important detail or choosing between
                            plausible meanings, ask a short clarification question instead of assuming.
                            Example: 'my asignment is dew October 21' becomes
                            'My assignment is due October 21.'; answer the request without a correction preface.
                            This spelling correction does not resolve the missing year or course.
                            Example: an unclear 'October twenty won or twenty too' requires asking
                            whether the user means October 21 or October 22.
                            Treat pasted course material as source facts; do not change its technical facts
                            or constraints while correcting the wording of a request.
                            Never claim to save or update assignments, access Canvas, or know what is due.
                            For assignment details, extract only stated fields and flag missing or ambiguous dates.
                            For study guides and quizzes, do not invent facts. State missing information.
                            Quiz scenarios must respect all stated capacities and constraints; include a checked answer key.
                            """),
                        Map.of("role", "user", "content", text.strip()))))
                .retrieve().body(Map.class);
            if (body == null || !(body.get("message") instanceof Map<?, ?> message)
                    || !(message.get("content") instanceof String content) || content.isBlank()) {
                throw new ResponseStatusException(BAD_GATEWAY, "Ollama returned an empty or unexpected response.");
            }
            return new Reply(content, "cloud", model);
        } catch (RestClientResponseException exception) {
            String detail = switch (exception.getStatusCode().value()) {
                case 401, 403 -> "Ollama rejected the API key. Check backend configuration.";
                case 429 -> "Ollama usage limit reached. Switch to mock mode or try later.";
                case 404 -> "Ollama model was not found. Check OLLAMA_MODEL against the cloud model list.";
                default -> "Ollama request failed. Try later or switch to mock mode.";
            };
            // Never forward provider bodies, headers, or exception messages to the browser.
            throw new ResponseStatusException(BAD_GATEWAY, detail);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(BAD_GATEWAY, "Could not reach Ollama within the request timeout.");
        }
    }
}
