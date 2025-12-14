import { useState, useEffect } from 'react';
import { Deck, DECK_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface CreateDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description: string, color: string) => void;
  editingDeck?: Deck | null;
}

export function CreateDeckDialog({
  open,
  onOpenChange,
  onSubmit,
  editingDeck,
}: CreateDeckDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(DECK_COLORS[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#14b8a6');

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || '');
      setColor(editingDeck.color);
      // Check if the color is a custom one (not in presets)
      const isCustom = !DECK_COLORS.includes(editingDeck.color as typeof DECK_COLORS[number]);
      setShowCustomPicker(isCustom);
      if (isCustom) {
        setCustomColor(editingDeck.color);
      }
    } else {
      setName('');
      setDescription('');
      setColor(DECK_COLORS[0]);
      setShowCustomPicker(false);
      setCustomColor('#14b8a6');
    }
  }, [editingDeck, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const finalColor = showCustomPicker ? customColor : color;
      onSubmit(name.trim(), description.trim(), finalColor);
      onOpenChange(false);
    }
  };

  const handleColorSelect = (c: string) => {
    setColor(c);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    setColor(e.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editingDeck ? 'Edit Deck' : 'Create New Deck'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spanish Vocabulary"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this deck about?"
              className="bg-background resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all duration-200 hover:scale-110",
                    color === c && !showCustomPicker && "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              {/* Custom color button */}
              <button
                type="button"
                onClick={() => setShowCustomPicker(true)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 flex items-center justify-center border-2 border-dashed border-muted-foreground/50",
                  showCustomPicker && "ring-2 ring-offset-2 ring-offset-card ring-foreground"
                )}
                style={showCustomPicker ? { backgroundColor: customColor, borderStyle: 'solid', borderColor: customColor } : {}}
              >
                {!showCustomPicker && <Plus className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>

            {/* Custom color picker */}
            {showCustomPicker && (
              <div className="flex items-center gap-3 pt-2 animate-fade-in">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <Input
                  value={customColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setCustomColor(val);
                      if (val.length === 7) setColor(val);
                    }
                  }}
                  placeholder="#14b8a6"
                  className="bg-background w-28 font-mono text-sm"
                  maxLength={7}
                />
                <span className="text-sm text-muted-foreground">Custom color</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={!name.trim()}>
              {editingDeck ? 'Save Changes' : 'Create Deck'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
