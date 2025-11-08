import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Encrypted Research Notebook" width={40} height={40} className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Encrypted Research Notebook</h1>
            <p className="text-sm text-muted-foreground">Your Findings, Encrypted by Default.</p>
          </div>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
