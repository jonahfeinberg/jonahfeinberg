import { useState, useEffect, useCallback } from 'react';
import { Deck, Flashcard } from '@/types';
import { StudyFlashcard } from '@/components/StudyFlashcard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, Shuffle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface StudyViewProps {
  decks: (Deck & { cardCount?: number })[];
  getCardsForDecks: (deckIds: string[]) => Flashcard[];
  onBack: () => void;
  initialDeckId?: string;
}

export function StudyView({ decks, getCardsForDecks, onBack, initialDeckId }: StudyViewProps) {
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(
    initialDeckId ? [initialDeckId] : []
  );
  const [isStudying, setIsStudying] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const startStudy = useCallback(() => {
    let studyCards = getCardsForDecks(selectedDeckIds);
    if (shuffle) {
      studyCards = [...studyCards].sort(() => Math.random() - 0.5);
    }
    setCards(studyCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
  }, [selectedDeckIds, shuffle, getCardsForDecks]);

  const handleFlip = useCallback(() => setIsFlipped((f) => !f), []);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isStudying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight' || e.key === 'j') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudying, handleFlip, handleNext, handlePrev]);

  const toggleDeck = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId)
        ? prev.filter((id) => id !== deckId)
        : [...prev, deckId]
    );
  };

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const isComplete = currentIndex === cards.length - 1 && isFlipped;

  // Deck selection view
  if (!isStudying) {
    const availableDecks = decks.filter((d) => (d.cardCount ?? 0) > 0);
    const selectedCardCount = getCardsForDecks(selectedDeckIds).length;

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Study Mode</h1>
            <p className="text-sm text-muted-foreground">Select decks to study</p>
          </div>
        </div>

        {availableDecks.length > 0 ? (
          <>
            <div className="space-y-3">
              {availableDecks.map((deck) => (
                <label
                  key={deck.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
                    selectedDeckIds.includes(deck.id)
                      ? "card-elevated shadow-elevated"
                      : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <Checkbox
                    checked={selectedDeckIds.includes(deck.id)}
                    onCheckedChange={() => toggleDeck(deck.id)}
                  />
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${deck.color}20` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: deck.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{deck.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {deck.cardCount} cards
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={shuffle} onCheckedChange={(c) => setShuffle(!!c)} />
                <Shuffle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Shuffle cards</span>
              </label>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={selectedDeckIds.length === 0}
              onClick={startStudy}
            >
              Start Studying ({selectedCardCount} cards)
            </Button>
          </>
        ) : (
          <div className="text-center py-16 card-elevated rounded-2xl">
            <h3 className="font-display text-lg font-semibold mb-2">No cards to study</h3>
            <p className="text-muted-foreground mb-4">
              Add some cards to your decks first
            </p>
            <Button variant="gradient" onClick={onBack}>
              Go Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Study view
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setIsStudying(false)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            Card {currentIndex + 1} of {cards.length}
          </div>
          <Progress value={progress} className="w-48 h-2" />
        </div>
        <Button variant="ghost" size="icon" onClick={handleRestart}>
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center py-8">
        <StudyFlashcard
          card={cards[currentIndex]}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Previous
        </Button>

        {isComplete ? (
          <Button variant="gradient" size="lg" onClick={() => setIsStudying(false)}>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Done!
          </Button>
        ) : (
          <Button
            variant="gradient"
            size="lg"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
          >
            Next
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Use arrow keys or J/K to navigate • Space to flip
      </p>
    </div>
  );
}
