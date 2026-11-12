package com.assignitdone.backend.controller;

import com.assignitdone.backend.api.FlashcardsApi;
import com.assignitdone.backend.api.model.FlashcardInput;
import com.assignitdone.backend.api.model.GenerateFlashcardsRequest;
import com.assignitdone.backend.service.FlashcardGenerationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FlashcardGenerationController implements FlashcardsApi {

	private final FlashcardGenerationService service;

	public FlashcardGenerationController(FlashcardGenerationService service) {
		this.service = service;
	}

	@Override
	public ResponseEntity<List<FlashcardInput>> generateFlashcards(GenerateFlashcardsRequest request) {
		return ResponseEntity.ok(service.generate(request.getText()));
	}

}
