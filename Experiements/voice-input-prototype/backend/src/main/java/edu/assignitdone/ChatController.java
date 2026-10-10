package edu.assignitdone;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ChatController {
    private final ChatService service;
    public ChatController(ChatService service) { this.service = service; }
    public record ChatRequest(String text) {}

    @PostMapping("/api/chat")
    public ChatService.Reply chat(@RequestBody ChatRequest request) {
        return service.chat(request.text());
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> failure(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
            .body(Map.of("error", exception.getReason() == null ? "Request failed." : exception.getReason()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, String>> invalidJson() {
        return ResponseEntity.badRequest().body(Map.of("error", "Send JSON with a text field."));
    }
}
