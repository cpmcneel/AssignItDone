package com.assignitdone.backend.service;

import com.assignitdone.backend.api.model.CreateDeckRequest;
import com.assignitdone.backend.api.model.DeckResponse;
import com.assignitdone.backend.api.model.FlashcardInput;
import com.assignitdone.backend.api.model.FlashcardResponse;
import com.assignitdone.backend.entity.CourseClass;
import com.assignitdone.backend.entity.Deck;
import com.assignitdone.backend.entity.Flashcard;
import com.assignitdone.backend.repository.CourseClassRepository;
import com.assignitdone.backend.repository.DeckRepository;
import com.assignitdone.backend.repository.FlashcardRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DeckService {

	private final DeckRepository deckRepository;
	private final FlashcardRepository flashcardRepository;
	private final CourseClassRepository classRepository;

	public DeckService(DeckRepository deckRepository, FlashcardRepository flashcardRepository,
			CourseClassRepository classRepository) {
		this.deckRepository = deckRepository;
		this.flashcardRepository = flashcardRepository;
		this.classRepository = classRepository;
	}

	@Transactional(readOnly = true)
	public List<DeckResponse> listDecks() {
		return deckRepository.findAll(Sort.by("id")).stream()
			.map(this::toDeckResponse)
			.toList();
	}

	@Transactional
	public DeckResponse createDeck(CreateDeckRequest request) {
		CourseClass courseClass = classRepository.findById(request.getClassId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
		Deck deck = deckRepository.save(new Deck(courseClass, request.getTitle()));
		for (int position = 0; position < request.getCards().size(); position++) {
			FlashcardInput card = request.getCards().get(position);
			if (card == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cards must not be null");
			}
			flashcardRepository.save(new Flashcard(deck, card.getQuestion(), card.getAnswer(), position));
		}
		return toDeckResponse(deck);
	}

	@Transactional(readOnly = true)
	public List<FlashcardResponse> listDeckFlashcards(Long id) {
		if (!deckRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Deck not found");
		}
		return flashcardRepository.findByDeckIdOrderByPositionAsc(id).stream()
			.map(this::toFlashcardResponse)
			.toList();
	}

	private DeckResponse toDeckResponse(Deck deck) {
		return new DeckResponse(deck.getId(), deck.getCourseClass().getId(),
			deck.getCourseClass().getName(), deck.getTitle(), flashcardRepository.countByDeckId(deck.getId()));
	}

	private FlashcardResponse toFlashcardResponse(Flashcard card) {
		return new FlashcardResponse(card.getId(), card.getDeck().getId(),
			card.getQuestion(), card.getAnswer(), card.getPosition());
	}

}
