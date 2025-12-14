import { ReactNode } from 'react';
import { View } from '@/types';
import { LayoutDashboard, Layers, BookOpen, HelpCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Upload } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  onOpenDataManager?: () => void;
}

const navItems: { view: View; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'deck', label: 'Decks', icon: Layers },
  { view: 'study', label: 'Study', icon: BookOpen },
  { view: 'quiz', label: 'Quiz', icon: HelpCircle },
];

export function Layout({ children, currentView, onNavigate, onOpenDataManager }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Glow effect at top */}
      <div className="fixed inset-x-0 top-0 h-[400px] pointer-events-none" style={{ background: 'var(--gradient-glow)' }} />
      
      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 transition-smooth hover:opacity-80"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg [background:var(--gradient-primary)]">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              re:<span className="gradient-text">call</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth",
                  currentView === view
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onOpenDataManager}>
                  <Download className="w-4 h-4 mr-2" />
                  Backup & Restore
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Settings Button */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onOpenDataManager}>
                  <Download className="w-4 h-4 mr-2" />
                  Backup & Restore
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ view, label, icon: Icon }) => (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-smooth",
                currentView === view
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
