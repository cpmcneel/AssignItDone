package com.assignitdone.backend.controller;

import com.assignitdone.backend.api.ChatApi;
import com.assignitdone.backend.api.model.ChatRequest;
import com.assignitdone.backend.api.model.ChatResponse;
import com.assignitdone.backend.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatController implements ChatApi {

	private final ChatService service;

	public ChatController(ChatService service) {
		this.service = service;
	}

	@Override
	public ResponseEntity<ChatResponse> askChat(ChatRequest request) {
		return ResponseEntity.ok(new ChatResponse(service.reply(request.getQuestion(), request.getDeckId())));
	}

}
