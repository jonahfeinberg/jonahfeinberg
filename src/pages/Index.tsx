import { useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardView } from '@/components/views/DashboardView';
import { DeckView } from '@/components/views/DeckView';
import { DecksListView } from '@/components/views/DecksListView';
import { StudyView } from '@/components/views/StudyView';
import { QuizView } from '@/components/views/QuizView';
import { CreateDeckDialog } from '@/components/CreateDeckDialog';
import { CreateCardDialog } from '@/components/CreateCardDialog';
import { DataManagerDialog } from '@/components/DataManagerDialog';
import { useStore } from '@/hooks/useStore';
import { View, Deck, Flashcard } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Index = () => {
  const {
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
  } = useStore();

  const { toast } = useToast();

  // Dialogs
  const [deckDialogOpen, setDeckDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const [dataManagerOpen, setDataManagerOpen] = useState(false);

  // Navigation
  const handleNavigate = useCallback((view: View, deckId?: string) => {
    if (deckId) {
      setSelectedDeckId(deckId);
    }
    setCurrentView(view);
  }, [setCurrentView, setSelectedDeckId]);

  // Deck actions
  const handleCreateDeck = () => {
    setEditingDeck(null);
    setDeckDialogOpen(true);
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setDeckDialogOpen(true);
  };

  const handleDeckSubmit = (name: string, description: string, color: string) => {
    if (editingDeck) {
      updateDeck(editingDeck.id, { name, description, color });
      toast({ title: 'Deck updated', description: `"${name}" has been updated.` });
    } else {
      createDeck(name, description, color);
      toast({ title: 'Deck created', description: `"${name}" is ready for cards.` });
    }
  };

  const handleDeleteDeck = (id: string) => {
    setDeletingDeckId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDeck = () => {
    if (deletingDeckId) {
      const deck = getDeck(deletingDeckId);
      deleteDeck(deletingDeckId);
      toast({ title: 'Deck deleted', description: `"${deck?.name}" has been removed.` });
      if (selectedDeckId === deletingDeckId) {
        setCurrentView('dashboard');
        setSelectedDeckId(null);
      }
    }
    setDeleteDialogOpen(false);
    setDeletingDeckId(null);
  };

  // Card actions
  const handleCreateCard = () => {
    setEditingCard(null);
    setCardDialogOpen(true);
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setCardDialogOpen(true);
  };

  const handleCardSubmit = (front: string, back: string, deckId: string) => {
    if (editingCard) {
      updateCard(editingCard.id, { front, back, deckId });
      toast({ title: 'Card updated' });
    } else {
      createCard(front, back, deckId);
      toast({ title: 'Card created', description: 'Your flashcard has been added.' });
    }
  };

  const handleDeleteCard = (id: string) => {
    deleteCard(id);
    toast({ title: 'Card deleted' });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const decksWithCount = getDecksWithCount();
  const selectedDeck = selectedDeckId ? getDeck(selectedDeckId) : null;
  const deckCards = selectedDeckId ? getCardsForDeck(selectedDeckId) : [];

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate} onOpenDataManager={() => setDataManagerOpen(true)}>
      {currentView === 'dashboard' && (
        <DashboardView
          decks={decksWithCount}
          totalCards={cards.length}
          onNavigate={handleNavigate}
          onEditDeck={handleEditDeck}
          onDeleteDeck={handleDeleteDeck}
          onCreateDeck={handleCreateDeck}
        />
      )}

      {currentView === 'deck' && selectedDeck && (
        <DeckView
          deck={selectedDeck}
          cards={deckCards}
          onBack={() => handleNavigate('dashboard')}
          onCreateCard={handleCreateCard}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          onStudy={() => handleNavigate('study', selectedDeck.id)}
          onQuiz={() => handleNavigate('quiz', selectedDeck.id)}
        />
      )}

      {(currentView === 'deck' && !selectedDeck) && (
        <DecksListView
          decks={decksWithCount}
          onNavigate={handleNavigate}
          onEditDeck={handleEditDeck}
          onDeleteDeck={handleDeleteDeck}
          onCreateDeck={handleCreateDeck}
        />
      )}


      {currentView === 'study' && (
        <StudyView
          decks={decksWithCount}
          getCardsForDecks={getCardsForDecks}
          onBack={() => handleNavigate('dashboard')}
          initialDeckId={selectedDeckId ?? undefined}
        />
      )}

      {currentView === 'quiz' && (
        <QuizView
          decks={decksWithCount}
          getCardsForDecks={getCardsForDecks}
          onBack={() => handleNavigate('dashboard')}
          initialDeckId={selectedDeckId ?? undefined}
        />
      )}

      {/* Dialogs */}
      <CreateDeckDialog
        open={deckDialogOpen}
        onOpenChange={setDeckDialogOpen}
        onSubmit={handleDeckSubmit}
        editingDeck={editingDeck}
      />

      <CreateCardDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        onSubmit={handleCardSubmit}
        decks={decks}
        editingCard={editingCard}
        defaultDeckId={selectedDeckId ?? undefined}
      />

      <DataManagerDialog
        open={dataManagerOpen}
        onOpenChange={setDataManagerOpen}
        decks={decks}
        cards={cards}
        onImport={importData}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this deck and all its cards. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDeck}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Index;
