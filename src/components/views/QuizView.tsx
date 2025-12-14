import { useState, useMemo } from 'react';
import { Deck, Flashcard, QuizQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface QuizViewProps {
  decks: (Deck & { cardCount?: number })[];
  getCardsForDecks: (deckIds: string[]) => Flashcard[];
  onBack: () => void;
  initialDeckId?: string;
}

function generateQuizQuestions(cards: Flashcard[], allCards: Flashcard[]): QuizQuestion[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5).slice(0, 10);

  return shuffled.map((card) => {
    const isMultipleChoice = Math.random() > 0.3; // 70% multiple choice

    if (isMultipleChoice && allCards.length >= 4) {
      // Generate wrong options from other cards
      const wrongOptions = allCards
        .filter((c) => c.id !== card.id && c.back !== card.back)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.back);

      const options = [...wrongOptions, card.back].sort(() => Math.random() - 0.5);

      return {
        cardId: card.id,
        question: card.front,
        correctAnswer: card.back,
        options,
        type: 'multiple-choice' as const,
      };
    }

    return {
      cardId: card.id,
      question: card.front,
      correctAnswer: card.back,
      type: 'short-answer' as const,
    };
  });
}

export function QuizView({ decks, getCardsForDecks, onBack, initialDeckId }: QuizViewProps) {
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(
    initialDeckId ? [initialDeckId] : []
  );
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const allCards = useMemo(() => getCardsForDecks(decks.map((d) => d.id)), [decks, getCardsForDecks]);

  const startQuiz = () => {
    const cards = getCardsForDecks(selectedDeckIds);
    const quiz = generateQuizQuestions(cards, allCards);
    setQuestions(quiz);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowResult(false);
    setIsComplete(false);
    setIsTakingQuiz(true);
  };

  const handleAnswer = (answer: string) => {
    setUserAnswer(answer);
  };

  const checkAnswer = () => {
    const current = questions[currentIndex];
    const isCorrect =
      current.type === 'multiple-choice'
        ? userAnswer === current.correctAnswer
        : userAnswer.toLowerCase().trim() === current.correctAnswer.toLowerCase().trim();

    setQuestions((prev) =>
      prev.map((q, i) =>
        i === currentIndex ? { ...q, userAnswer, isCorrect } : q
      )
    );
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  const toggleDeck = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId]
    );
  };

  const score = questions.filter((q) => q.isCorrect).length;
  const progress = questions.length > 0 ? ((currentIndex + (showResult ? 1 : 0)) / questions.length) * 100 : 0;

  // Deck selection
  if (!isTakingQuiz) {
    const availableDecks = decks.filter((d) => (d.cardCount ?? 0) >= 4);
    const selectedCardCount = getCardsForDecks(selectedDeckIds).length;

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Quiz Mode</h1>
            <p className="text-sm text-muted-foreground">Test your knowledge</p>
          </div>
        </div>

        {availableDecks.length > 0 ? (
          <>
            <div className="space-y-3">
              {availableDecks.map((deck) => (
                <label
                  key={deck.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
                    selectedDeckIds.includes(deck.id)
                      ? "card-elevated shadow-elevated"
                      : "bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <Checkbox
                    checked={selectedDeckIds.includes(deck.id)}
                    onCheckedChange={() => toggleDeck(deck.id)}
                  />
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${deck.color}20` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{deck.name}</div>
                    <div className="text-sm text-muted-foreground">{deck.cardCount} cards</div>
                  </div>
                </label>
              ))}
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={selectedCardCount < 4}
              onClick={startQuiz}
            >
              Start Quiz ({Math.min(selectedCardCount, 10)} questions)
            </Button>
            {selectedCardCount > 0 && selectedCardCount < 4 && (
              <p className="text-center text-sm text-muted-foreground">
                Need at least 4 cards to generate a quiz
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-16 card-elevated rounded-2xl">
            <h3 className="font-display text-lg font-semibold mb-2">Not enough cards</h3>
            <p className="text-muted-foreground mb-4">
              Add at least 4 cards to a deck to take a quiz
            </p>
            <Button variant="gradient" onClick={onBack}>
              Go Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Quiz complete
  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto text-center py-12 space-y-6 animate-fade-up">
        <div className="w-20 h-20 mx-auto rounded-2xl [background:var(--gradient-primary)] flex items-center justify-center">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="font-display text-3xl font-bold">Quiz Complete!</h2>
        <div className="text-6xl font-display font-bold gradient-text">{percentage}%</div>
        <p className="text-lg text-muted-foreground">
          You got {score} out of {questions.length} correct
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="lg" onClick={() => { setIsTakingQuiz(false); setSelectedDeckIds([]); }}>
            Choose Decks
          </Button>
          <Button variant="gradient" size="lg" onClick={startQuiz}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Quiz question
  const current = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setIsTakingQuiz(false)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <Progress value={progress} className="w-48 mx-auto h-2" />
        </div>
        <div className="w-10" />
      </div>

      {/* Question */}
      <div className="card-elevated rounded-2xl p-8 text-center animate-scale-in">
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 inline-block">
          {current.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
        </span>
        <h2 className="font-display text-2xl font-semibold mt-4">{current.question}</h2>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {current.type === 'multiple-choice' ? (
          current.options?.map((option, i) => {
            const isSelected = userAnswer === option;
            const isCorrect = showResult && option === current.correctAnswer;
            const isWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={i}
                onClick={() => !showResult && handleAnswer(option)}
                disabled={showResult}
                className={cn(
                  "w-full p-4 rounded-xl text-left font-medium transition-all duration-200",
                  showResult
                    ? isCorrect
                      ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                      : isWrong
                      ? "bg-destructive/20 border-2 border-destructive text-destructive"
                      : "bg-secondary/50"
                    : isSelected
                    ? "card-elevated shadow-elevated"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                  {showResult && isWrong && <XCircle className="w-5 h-5" />}
                  {option}
                </div>
              </button>
            );
          })
        ) : (
          <div className="space-y-3">
            <Input
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={showResult}
              className="text-lg p-4 h-14"
              onKeyDown={(e) => e.key === 'Enter' && !showResult && userAnswer && checkAnswer()}
            />
            {showResult && (
              <div
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3",
                  current.isCorrect
                    ? "bg-green-500/20 text-green-400"
                    : "bg-destructive/20 text-destructive"
                )}
              >
                {current.isCorrect ? <CheckCircle2 /> : <XCircle />}
                <span>
                  {current.isCorrect ? 'Correct!' : `Correct answer: ${current.correctAnswer}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        {!showResult ? (
          <Button
            variant="gradient"
            size="lg"
            onClick={checkAnswer}
            disabled={!userAnswer}
          >
            Check Answer
          </Button>
        ) : (
          <Button variant="gradient" size="lg" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              'See Results'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
