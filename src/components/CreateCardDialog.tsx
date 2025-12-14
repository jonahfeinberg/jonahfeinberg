import { useState, useEffect } from 'react';
import { Flashcard, Deck } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (front: string, back: string, deckId: string) => void;
  decks: Deck[];
  editingCard?: Flashcard | null;
  defaultDeckId?: string;
}

export function CreateCardDialog({
  open,
  onOpenChange,
  onSubmit,
  decks,
  editingCard,
  defaultDeckId,
}: CreateCardDialogProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deckId, setDeckId] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front);
      setBack(editingCard.back);
      setDeckId(editingCard.deckId);
    } else {
      setFront('');
      setBack('');
      setDeckId(defaultDeckId || decks[0]?.id || '');
    }
  }, [editingCard, defaultDeckId, decks, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim() && deckId) {
      onSubmit(front.trim(), back.trim(), deckId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editingCard ? 'Edit Card' : 'Create New Card'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deck">Deck</Label>
            <Select value={deckId} onValueChange={setDeckId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: deck.color }}
                      />
                      {deck.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="front">Front (Question)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="What's on the front of the card?"
              className="bg-background resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="back">Back (Answer)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="What's the answer?"
              className="bg-background resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={!front.trim() || !back.trim() || !deckId}
            >
              {editingCard ? 'Save Changes' : 'Create Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
