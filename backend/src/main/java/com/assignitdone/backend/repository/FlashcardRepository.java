package com.assignitdone.backend.repository;

import com.assignitdone.backend.entity.Flashcard;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

	List<Flashcard> findByDeckIdOrderByPositionAsc(Long deckId);

}
