"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ExperimentStep } from './ExperimentStep';
import { toast } from 'sonner';
import { useMetaMaskEthersSigner } from '@/hooks/metamask/useMetaMaskEthersSigner';
import { useExperimentLog, ExperimentType, StepType } from '@/hooks/useExperimentLog';

export function ExperimentNotebook() {
  const {
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = useMetaMaskEthersSigner();

  const experimentLog = useExperimentLog({
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [experiments, setExperiments] = useState<ExperimentType[]>([]);
  const [experimentSteps, setExperimentSteps] = useState<Record<string, StepType[]>>({});
  const [newExperimentName, setNewExperimentName] = useState('');
  const [showNewExperimentForm, setShowNewExperimentForm] = useState(false);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepContent, setNewStepContent] = useState('');
  const loadedExperimentsRef = useRef<Set<string>>(new Set());

  const createExperiment = async () => {
    if (!newExperimentName.trim()) {
      toast.error('Please enter an experiment name');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const experimentId = await experimentLog.createExperiment(newExperimentName);
    
    if (experimentId) {
      const newExperiment: ExperimentType = {
        id: experimentId,
        name: newExperimentName,
        date: new Date().toISOString().split('T')[0],
        owner: ethersSigner?.address || '',
      };

      setExperiments([...experiments, newExperiment]);
      setActiveExperimentId(experimentId);
      setNewExperimentName('');
      setShowNewExperimentForm(false);
      toast.success('Experiment created successfully');
    } else {
      toast.error('Failed to create experiment');
    }
  };

  const addStep = async () => {
    if (!activeExperimentId) {
      toast.error('Please select an experiment first');
      return;
    }

    if (!newStepTitle.trim() || !newStepContent.trim()) {
      toast.error('Please fill in both step title and content');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const stepId = await experimentLog.addStep(
      activeExperimentId,
      newStepTitle,
      newStepContent,
      true
    );

    if (stepId) {
      const newStep: StepType = {
        id: stepId,
        experimentId: activeExperimentId,
        title: newStepTitle,
        content: newStepContent,
        isEncrypted: true,
      };

      setExperimentSteps({
        ...experimentSteps,
        [activeExperimentId]: [...(experimentSteps[activeExperimentId] || []), newStep],
      });

      setNewStepTitle('');
      setNewStepContent('');
      toast.success('Step added successfully');
    } else {
      toast.error('Failed to add step');
    }
  };

  const toggleEncryption = async (stepId: string) => {
    if (!activeExperimentId || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const currentSteps = experimentSteps[activeExperimentId] || [];
    const step = currentSteps.find((s) => s.id === stepId);
    
    if (!step) return;

    const success = await experimentLog.updateStep(
      stepId,
      step.title,
      step.content,
      !step.isEncrypted
    );

    if (success) {
      setExperimentSteps({
        ...experimentSteps,
        [activeExperimentId]: currentSteps.map((s) =>
          s.id === stepId ? { ...s, isEncrypted: !s.isEncrypted } : s
        ),
      });
      toast.success('Encryption toggled');
    } else {
      toast.error('Failed to toggle encryption');
    }
  };

  const deleteStep = async (stepId: string) => {
    if (!activeExperimentId || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const success = await experimentLog.deleteStep(stepId);

    if (success) {
      const currentSteps = experimentSteps[activeExperimentId] || [];
      setExperimentSteps({
        ...experimentSteps,
        [activeExperimentId]: currentSteps.filter((step) => step.id !== stepId),
      });
      toast.success('Step deleted');
    } else {
      toast.error('Failed to delete step');
    }
  };

  const updateStep = async (stepId: string, title: string, content: string) => {
    if (!activeExperimentId || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    const currentSteps = experimentSteps[activeExperimentId] || [];
    const step = currentSteps.find((s) => s.id === stepId);
    
    if (!step) return;

    const success = await experimentLog.updateStep(
      stepId,
      title,
      content,
      step.isEncrypted
    );

    if (success) {
      setExperimentSteps({
        ...experimentSteps,
        [activeExperimentId]: currentSteps.map((s) =>
          s.id === stepId ? { ...s, title, content } : s
        ),
      });
      toast.success('Step updated');
    } else {
      toast.error('Failed to update step');
    }
  };

  // Load steps when active experiment changes
  useEffect(() => {
    if (!activeExperimentId || !experimentLog.isDeployed) {
      return;
    }

    // Prevent loading the same experiment multiple times
    if (loadedExperimentsRef.current.has(activeExperimentId)) {
      return;
    }

    loadedExperimentsRef.current.add(activeExperimentId);

    experimentLog.loadExperimentSteps(activeExperimentId).then((steps) => {
      setExperimentSteps((prev) => ({
        ...prev,
        [activeExperimentId]: steps,
      }));
    }).catch((error) => {
      console.error('Failed to load experiment steps:', error);
      // Remove from loaded set on error so it can be retried
      loadedExperimentsRef.current.delete(activeExperimentId);
    });
  }, [activeExperimentId, experimentLog.isDeployed, experimentLog]);

  const activeExperiment = experiments.find((exp) => exp.id === activeExperimentId);
  const activeSteps = activeExperimentId ? experimentSteps[activeExperimentId] || [] : [];

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-12 text-center">
          <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to create and manage experiments.
          </p>
          <Button onClick={connect}>Connect Wallet</Button>
        </Card>
      </div>
    );
  }

  if (experimentLog.isDeployed === false) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Contract Not Deployed
          </h3>
          <p className="text-muted-foreground">
            ExperimentLog contract is not deployed on this network (chainId={chainId}).
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Experiments List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-lab-blue" />
                Experiments
              </h2>
              <Button
                size="sm"
                onClick={() => setShowNewExperimentForm(!showNewExperimentForm)}
                variant="default"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showNewExperimentForm && (
              <div className="space-y-2 mb-4 p-3 bg-muted rounded-lg">
                <Input
                  placeholder="Experiment name"
                  value={newExperimentName}
                  onChange={(e) => setNewExperimentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createExperiment()}
                />
                <div className="flex gap-2">
                  <Button onClick={createExperiment} size="sm" className="flex-1">
                    Create
                  </Button>
                  <Button
                    onClick={() => setShowNewExperimentForm(false)}
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {experiments.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setActiveExperimentId(exp.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeExperimentId === exp.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <div className="font-medium text-sm">{exp.name}</div>
                  <div className="text-xs opacity-70">{exp.date}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {(experimentSteps[exp.id] || []).length} steps
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content - Experiment Steps */}
        <div className="lg:col-span-3">
          {activeExperiment ? (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-lab-blue/5 to-lab-teal/5">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {activeExperiment.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Started on {activeExperiment.date}
                </p>
              </Card>

              {/* Add New Step Form */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Add New Step</h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Step title (e.g., 'Initial Hypothesis', 'Dataset Collection')"
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Step details, parameters, observations, data..."
                    value={newStepContent}
                    onChange={(e) => setNewStepContent(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={addStep} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              </Card>

              {/* Experiment Steps */}
              <div className="space-y-4">
                {activeSteps.length > 0 ? (
                  activeSteps.map((step) => (
                    <ExperimentStep
                      key={step.id}
                      id={step.id}
                      title={step.title}
                      content={step.content}
                      isEncrypted={step.isEncrypted}
                      onToggleEncryption={toggleEncryption}
                      onDelete={deleteStep}
                      onUpdate={updateStep}
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No steps yet. Add your first experiment step above.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FlaskConical className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Experiment Selected
              </h3>
              <p className="text-muted-foreground">
                Create a new experiment or select one from the sidebar to get started.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
