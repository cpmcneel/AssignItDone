package com.assignitdone.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "flashcards", uniqueConstraints = @UniqueConstraint(
	name = "uk_flashcards_deck_position", columnNames = {"deck_id", "position"}))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Flashcard {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Setter(AccessLevel.NONE)
	private Long id;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deck_id", nullable = false)
	private Deck deck;

	@NotNull
	@Lob
	@Column(name = "question", nullable = false)
	private String question;

	@NotNull
	@Lob
	@Column(name = "answer", nullable = false)
	private String answer;

	@NotNull
	@Column(name = "position", nullable = false)
	private Integer position;

	public Flashcard(Deck deck, String question, String answer, Integer position) {
		this.deck = deck;
		this.question = question;
		this.answer = answer;
		this.position = position;
	}

}
