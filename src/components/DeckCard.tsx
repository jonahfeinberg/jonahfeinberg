import { Deck } from '@/types';
import { MoreVertical, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeckCardProps {
  deck: Deck & { cardCount?: number };
  onEdit: () => void;
  onDelete: () => void;
  onStudy: () => void;
  onClick: () => void;
}

export function DeckCard({ deck, onEdit, onDelete, onStudy, onClick }: DeckCardProps) {
  return (
    <div
      className="group relative card-elevated rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-up"
      onClick={onClick}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-5 right-5 h-1 rounded-b-full opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: deck.color }}
      />

      <div className="flex items-start justify-between mb-3 pt-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${deck.color}20` }}
        >
          <BookOpen className="w-5 h-5" style={{ color: deck.color }} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStudy(); }}>
              <BookOpen className="w-4 h-4 mr-2" />
              Study
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="font-display font-semibold text-lg text-foreground mb-1 line-clamp-1">
        {deck.name}
      </h3>
      
      {deck.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {deck.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className="px-2 py-0.5 rounded-md text-xs font-medium"
          style={{ backgroundColor: `${deck.color}20`, color: deck.color }}
        >
          {deck.cardCount ?? 0} cards
        </span>
      </div>
    </div>
  );
}
