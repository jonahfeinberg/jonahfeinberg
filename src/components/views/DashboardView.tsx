import { Deck, View } from '@/types';
import { DeckCard } from '@/components/DeckCard';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  decks: (Deck & { cardCount?: number })[];
  totalCards: number;
  onNavigate: (view: View, deckId?: string) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  onCreateDeck: () => void;
}

export function DashboardView({
  decks,
  totalCards,
  onNavigate,
  onEditDeck,
  onDeleteDeck,
  onCreateDeck,
}: DashboardViewProps) {
  const hasCards = totalCards > 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8 animate-fade-up">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Welcome to <span className="gradient-text">re:call</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Master any subject with smart flashcards and quizzes. Create, organize, and study your way to success.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {hasCards ? (
            <>
              <Button variant="gradient" size="lg" onClick={() => onNavigate('study')}>
                <BookOpen className="w-5 h-5 mr-2" />
                Start Studying
              </Button>
              <Button variant="outline" size="lg" onClick={() => onNavigate('quiz')}>
                <Sparkles className="w-5 h-5 mr-2" />
                Take a Quiz
              </Button>
            </>
          ) : (
            <Button variant="gradient" size="lg" onClick={onCreateDeck}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Deck
            </Button>
          )}
        </div>
      </section>

      {/* Stats */}
      {(decks.length > 0 || totalCards > 0) && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="card-elevated rounded-xl p-5 text-center">
            <div className="text-3xl font-display font-bold gradient-text">{decks.length}</div>
            <div className="text-sm text-muted-foreground">Decks</div>
          </div>
          <div className="card-elevated rounded-xl p-5 text-center">
            <div className="text-3xl font-display font-bold gradient-text">{totalCards}</div>
            <div className="text-sm text-muted-foreground">Cards</div>
          </div>
          <div className="card-elevated rounded-xl p-5 text-center hidden md:block">
            <div className="text-3xl font-display font-bold gradient-text">∞</div>
            <div className="text-sm text-muted-foreground">Possibilities</div>
          </div>
        </section>
      )}

      {/* Decks Grid */}
      {decks.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Your Decks</h2>
            <Button variant="subtle" size="sm" onClick={onCreateDeck}>
              <Plus className="w-4 h-4 mr-1" />
              New Deck
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck, i) => (
              <div key={deck.id} style={{ animationDelay: `${(i + 2) * 50}ms` }}>
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
        </section>
      ) : (
        <section className="text-center py-12 card-elevated rounded-2xl animate-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl [background:var(--gradient-primary)] flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">No decks yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            Create your first deck to start building your flashcard collection
          </p>
          <Button variant="gradient" onClick={onCreateDeck}>
            Create Deck
          </Button>
        </section>
      )}
    </div>
  );
}
