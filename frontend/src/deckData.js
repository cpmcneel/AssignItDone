export function toStudyCard(card) {
  return {
    id: card.id,
    front: card.question,
    back: card.answer,
  };
}

export function toDeckRequest(deck) {
  return {
    classId: deck.classId,
    title: deck.title,
    cards: deck.cards.map((card) => ({ question: card.front, answer: card.back })),
  };
}
