"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExperimentNotebook } from "@/components/ExperimentNotebook";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Database, Users } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-4xl w-full text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-lab-blue to-lab-teal bg-clip-text text-transparent">
                Your Findings, Encrypted by Default.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Store experiment notes, datasets, and research parameters with field-level encryption.
                Collaborate securely with selective decryption.
              </p>
            </div>

            <div className="flex justify-center">
              <ConnectButton />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Shield className="h-8 w-8 mx-auto mb-3 text-lab-blue" />
                <h3 className="font-semibold text-foreground mb-2">Field-Level Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Encrypt sensitive data fields individually
                </p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Lock className="h-8 w-8 mx-auto mb-3 text-encrypted" />
                <h3 className="font-semibold text-foreground mb-2">Wallet-Based Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Your wallet manages all encryption keys
                </p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Database className="h-8 w-8 mx-auto mb-3 text-lab-teal" />
                <h3 className="font-semibold text-foreground mb-2">Research Notebooks</h3>
                <p className="text-sm text-muted-foreground">
                  Organize experiments and findings
                </p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Users className="h-8 w-8 mx-auto mb-3 text-lab-amber" />
                <h3 className="font-semibold text-foreground mb-2">Selective Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Control who sees what data
                </p>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ExperimentNotebook />
      </main>
      <Footer />
    </div>
  );
}
