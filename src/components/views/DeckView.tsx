import { Deck, Flashcard, View } from '@/types';
import { FlashcardItem } from '@/components/FlashcardItem';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, BookOpen, Sparkles } from 'lucide-react';

interface DeckViewProps {
  deck: Deck;
  cards: Flashcard[];
  onBack: () => void;
  onCreateCard: () => void;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (id: string) => void;
  onStudy: () => void;
  onQuiz: () => void;
}

export function DeckView({
  deck,
  cards,
  onBack,
  onCreateCard,
  onEditCard,
  onDeleteCard,
  onStudy,
  onQuiz,
}: DeckViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${deck.color}20` }}
            >
              <BookOpen className="w-5 h-5" style={{ color: deck.color }} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{deck.name}</h1>
              {deck.description && (
                <p className="text-sm text-muted-foreground">{deck.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="gradient" onClick={onCreateCard}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
        {cards.length > 0 && (
          <>
            <Button variant="secondary" onClick={onStudy}>
              <BookOpen className="w-4 h-4 mr-2" />
              Study
            </Button>
            <Button variant="outline" onClick={onQuiz}>
              <Sparkles className="w-4 h-4 mr-2" />
              Quiz
            </Button>
          </>
        )}
      </div>

      {/* Cards */}
      {cards.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">{cards.length} cards</div>
          {cards.map((card) => (
            <FlashcardItem
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-elevated rounded-2xl">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${deck.color}20` }}
          >
            <Plus className="w-6 h-6" style={{ color: deck.color }} />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">No cards yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            Start adding flashcards to this deck
          </p>
          <Button variant="gradient" onClick={onCreateCard}>
            Add Your First Card
          </Button>
        </div>
      )}
    </div>
  );
}
