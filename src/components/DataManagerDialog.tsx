import { useState } from 'react';
import { Deck, Flashcard } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decks: Deck[];
  cards: Flashcard[];
  onImport: (decks: Deck[], cards: Flashcard[]) => void;
}

export function DataManagerDialog({
  open,
  onOpenChange,
  decks,
  cards,
  onImport,
}: DataManagerDialogProps) {
  const { toast } = useToast();
  const [importData, setImportData] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const exportData = JSON.stringify({ decks, cards, version: 1, exportedAt: new Date().toISOString() }, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Save data copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', description: 'Please select and copy manually.', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recall-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: 'Backup file saved.' });
  };

  const handleImport = () => {
    setImportError(null);
    
    if (!importData.trim()) {
      setImportError('Please paste your save data first.');
      return;
    }

    try {
      const parsed = JSON.parse(importData);
      
      // Validate structure
      if (!parsed.decks || !Array.isArray(parsed.decks)) {
        throw new Error('Invalid format: missing decks array');
      }
      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error('Invalid format: missing cards array');
      }

      // Basic validation of deck structure
      for (const deck of parsed.decks) {
        if (!deck.id || !deck.name || !deck.color) {
          throw new Error('Invalid deck format');
        }
      }

      // Basic validation of card structure
      for (const card of parsed.cards) {
        if (!card.id || !card.front || !card.back || !card.deckId) {
          throw new Error('Invalid card format');
        }
      }

      onImport(parsed.decks, parsed.cards);
      toast({ 
        title: 'Import successful!', 
        description: `Loaded ${parsed.decks.length} decks and ${parsed.cards.length} cards.` 
      });
      setImportData('');
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON format';
      setImportError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Backup & Restore</DialogTitle>
          <DialogDescription>
            Export your data to save it, or import a previous backup.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Your Save Data</Label>
              <div className="relative">
                <Textarea
                  value={exportData}
                  readOnly
                  className="bg-background font-mono text-xs h-48 resize-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {decks.length} decks, {cards.length} cards
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="gradient" className="flex-1" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Paste Save Data</Label>
              <Textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setImportError(null);
                }}
                placeholder='Paste your exported JSON data here...'
                className="bg-background font-mono text-xs h-48 resize-none"
              />
              {importError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {importError}
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Warning: Importing will replace all your current data.
              </p>
            </div>

            <Button 
              variant="gradient" 
              className="w-full" 
              onClick={handleImport}
              disabled={!importData.trim()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import & Replace Data
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
