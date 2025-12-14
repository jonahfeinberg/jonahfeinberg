import { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '@/types';
import { cn } from '@/lib/utils';

interface StudyFlashcardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function StudyFlashcard({ card, isFlipped, onFlip }: StudyFlashcardProps) {
  return (
    <div
      className="flashcard-container w-full max-w-2xl aspect-[4/3] cursor-pointer select-none"
      onClick={onFlip}
    >
      <div className={cn("flashcard w-full h-full relative", isFlipped && "flipped")}>
        {/* Front */}
        <div className="flashcard-face absolute inset-0 card-elevated rounded-2xl p-8 flex flex-col items-center justify-center">
          <span className="absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
            Question
          </span>
          <p className="text-2xl md:text-3xl font-display font-semibold text-center text-foreground leading-relaxed">
            {card.front}
          </p>
          <span className="absolute bottom-4 text-sm text-muted-foreground">
            Click or press Space to flip
          </span>
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back absolute inset-0 card-elevated rounded-2xl p-8 flex flex-col items-center justify-center [background:linear-gradient(145deg,hsl(var(--secondary)),hsl(var(--card)))]">
          <span className="absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full bg-primary/20 text-primary">
            Answer
          </span>
          <p className="text-2xl md:text-3xl font-display font-semibold text-center text-foreground leading-relaxed">
            {card.back}
          </p>
          <span className="absolute bottom-4 text-sm text-muted-foreground">
            Click or press Space to flip back
          </span>
        </div>
      </div>
    </div>
  );
}
