import { Flashcard } from '@/types';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FlashcardItemProps {
  card: Flashcard;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashcardItem({ card, onEdit, onDelete }: FlashcardItemProps) {
  return (
    <div className="group card-elevated rounded-lg p-4 transition-all duration-200 hover:shadow-elevated animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
              Front
            </span>
          </div>
          <p className="text-foreground font-medium mb-3 line-clamp-2">{card.front}</p>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Back
            </span>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">{card.back}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
