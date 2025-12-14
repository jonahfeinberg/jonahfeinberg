import { Deck, View } from '@/types';
import { DeckCard } from '@/components/DeckCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DecksListViewProps {
  decks: (Deck & { cardCount?: number })[];
  onNavigate: (view: View, deckId?: string) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  onCreateDeck: () => void;
}

export function DecksListView({
  decks,
  onNavigate,
  onEditDeck,
  onDeleteDeck,
  onCreateDeck,
}: DecksListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Your Decks</h1>
          <p className="text-sm text-muted-foreground">Manage your flashcard collections</p>
        </div>
        <Button variant="gradient" onClick={onCreateDeck}>
          <Plus className="w-4 h-4 mr-2" />
          New Deck
        </Button>
      </div>

      {decks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck, i) => (
            <div key={deck.id} style={{ animationDelay: `${i * 50}ms` }}>
              <DeckCard
                deck={deck}
                onEdit={() => onEditDeck(deck)}
                onDelete={() => onDeleteDeck(deck.id)}
                onStudy={() => onNavigate('study', deck.id)}
                onClick={() => onNavigate('deck', deck.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-elevated rounded-2xl animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl [background:var(--gradient-primary)] flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">No decks yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            Create your first deck to start organizing your flashcards
          </p>
          <Button variant="gradient" onClick={onCreateDeck}>
            Create Your First Deck
          </Button>
        </div>
      )}
    </div>
  );
}
