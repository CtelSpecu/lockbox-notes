"use client";

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

export function Footer() {
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Randomly show progress indicator
    const shouldShow = Math.random() > 0.5;
    setShowProgress(shouldShow);

    if (shouldShow) {
      // Simulate experiment progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, []);

  if (!showProgress) {
    return (
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Secured with field-level encryption
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Experiment Progress</span>
          <Progress value={progress} className="flex-1" />
          <span className="text-sm font-medium text-foreground">{Math.round(progress)}%</span>
        </div>
      </div>
    </footer>
  );
}
