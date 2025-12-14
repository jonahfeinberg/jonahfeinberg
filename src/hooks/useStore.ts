import { useState, useEffect, useCallback } from 'react';
import { Deck, Flashcard, View } from '@/types';

const STORAGE_KEYS = {
  decks: 'recall_decks',
  cards: 'recall_cards',
};

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export function useStore() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const storedDecks = localStorage.getItem(STORAGE_KEYS.decks);
    const storedCards = localStorage.getItem(STORAGE_KEYS.cards);

    if (storedDecks) setDecks(JSON.parse(storedDecks));
    if (storedCards) setCards(JSON.parse(storedCards));
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(decks));
    }
  }, [decks, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
    }
  }, [cards, isLoaded]);

  // Deck operations
  const createDeck = useCallback((name: string, description: string, color: string) => {
    const newDeck: Deck = {
      id: generateId(),
      name,
      description,
      color,
      createdAt: Date.now(),
    };
    setDecks(prev => [...prev, newDeck]);
    return newDeck;
  }, []);

  const updateDeck = useCallback((id: string, updates: Partial<Deck>) => {
    setDecks(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDeck = useCallback((id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    setCards(prev => prev.filter(c => c.deckId !== id));
  }, []);

  // Card operations
  const createCard = useCallback((front: string, back: string, deckId: string) => {
    const newCard: Flashcard = {
      id: generateId(),
      front,
      back,
      deckId,
      createdAt: Date.now(),
    };
    setCards(prev => [...prev, newCard]);
    return newCard;
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<Flashcard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  // Get cards for deck(s)
  const getCardsForDeck = useCallback((deckId: string) => {
    return cards.filter(c => c.deckId === deckId);
  }, [cards]);

  const getCardsForDecks = useCallback((deckIds: string[]) => {
    return cards.filter(c => deckIds.includes(c.deckId));
  }, [cards]);

  // Get deck with card count
  const getDecksWithCount = useCallback(() => {
    return decks.map(deck => ({
      ...deck,
      cardCount: cards.filter(c => c.deckId === deck.id).length,
    }));
  }, [decks, cards]);

  const getDeck = useCallback((id: string) => {
    return decks.find(d => d.id === id);
  }, [decks]);

  // Import data (replace all)
  const importData = useCallback((newDecks: Deck[], newCards: Flashcard[]) => {
    setDecks(newDecks);
    setCards(newCards);
  }, []);

  return {
    decks,
    cards,
    isLoaded,
    currentView,
    setCurrentView,
    selectedDeckId,
    setSelectedDeckId,
    createDeck,
    updateDeck,
    deleteDeck,
    createCard,
    updateCard,
    deleteCard,
    getCardsForDeck,
    getCardsForDecks,
    getDecksWithCount,
    getDeck,
    importData,
  };
}
