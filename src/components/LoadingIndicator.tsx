import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
}

export function LoadingIndicator({ message = "Generating your rookie cards..." }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-lg font-medium text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">This might take a few moments. Please wait.</p>
    </div>
  );
}
