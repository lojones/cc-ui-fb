import { Zap } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="w-full py-6">
      <div className="container mx-auto flex items-center justify-center sm:justify-start">
        <Zap className="h-8 w-8 text-primary mr-2" />
        <h1 className="text-3xl font-bold text-foreground font-headline">
          Rookie Card Maker
        </h1>
      </div>
    </header>
  );
}
