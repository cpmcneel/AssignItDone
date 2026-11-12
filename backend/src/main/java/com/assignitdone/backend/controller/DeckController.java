package com.assignitdone.backend.controller;

import com.assignitdone.backend.api.DecksApi;
import com.assignitdone.backend.api.model.CreateDeckRequest;
import com.assignitdone.backend.api.model.DeckResponse;
import com.assignitdone.backend.api.model.FlashcardResponse;
import com.assignitdone.backend.service.DeckService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DeckController implements DecksApi {

	private final DeckService service;

	public DeckController(DeckService service) {
		this.service = service;
	}

	@Override
	public ResponseEntity<List<DeckResponse>> listDecks() {
		return ResponseEntity.ok(service.listDecks());
	}

	@Override
	public ResponseEntity<DeckResponse> createDeck(CreateDeckRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(service.createDeck(request));
	}

	@Override
	public ResponseEntity<List<FlashcardResponse>> listDeckFlashcards(Long id) {
		return ResponseEntity.ok(service.listDeckFlashcards(id));
	}

}
