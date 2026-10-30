package com.assignitdone.backend.repository;

import com.assignitdone.backend.entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeckRepository extends JpaRepository<Deck, Long> {
}
