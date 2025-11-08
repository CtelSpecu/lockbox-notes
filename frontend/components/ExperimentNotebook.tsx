"use client";

import { useState } from 'react';
import { Plus, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ExperimentStep } from './ExperimentStep';
import { toast } from 'sonner';

interface Step {
  id: string;
  title: string;
  content: string;
  isEncrypted: boolean;
}

interface Experiment {
  id: string;
  name: string;
  date: string;
  steps: Step[];
}

export function ExperimentNotebook() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [newExperimentName, setNewExperimentName] = useState('');
  const [showNewExperimentForm, setShowNewExperimentForm] = useState(false);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepContent, setNewStepContent] = useState('');

  const createExperiment = () => {
    if (!newExperimentName.trim()) {
      toast.error('Please enter an experiment name');
      return;
    }

    const newExperiment: Experiment = {
      id: Date.now().toString(),
      name: newExperimentName,
      date: new Date().toISOString().split('T')[0],
      steps: [],
    };

    setExperiments([...experiments, newExperiment]);
    setActiveExperimentId(newExperiment.id);
    setNewExperimentName('');
    setShowNewExperimentForm(false);
    toast.success('Experiment created successfully');
  };

  const addStep = () => {
    if (!activeExperimentId) {
      toast.error('Please select an experiment first');
      return;
    }

    if (!newStepTitle.trim() || !newStepContent.trim()) {
      toast.error('Please fill in both step title and content');
      return;
    }

    const newStep: Step = {
      id: Date.now().toString(),
      title: newStepTitle,
      content: newStepContent,
      isEncrypted: false,
    };

    setExperiments(
      experiments.map((exp) =>
        exp.id === activeExperimentId
          ? { ...exp, steps: [...exp.steps, newStep] }
          : exp
      )
    );

    setNewStepTitle('');
    setNewStepContent('');
    toast.success('Step added successfully');
  };

  const toggleEncryption = (stepId: string) => {
    setExperiments(
      experiments.map((exp) =>
        exp.id === activeExperimentId
          ? {
              ...exp,
              steps: exp.steps.map((step) =>
                step.id === stepId
                  ? { ...step, isEncrypted: !step.isEncrypted }
                  : step
              ),
            }
          : exp
      )
    );
    toast.success('Encryption toggled');
  };

  const deleteStep = (stepId: string) => {
    setExperiments(
      experiments.map((exp) =>
        exp.id === activeExperimentId
          ? { ...exp, steps: exp.steps.filter((step) => step.id !== stepId) }
          : exp
      )
    );
    toast.success('Step deleted');
  };

  const updateStep = (stepId: string, title: string, content: string) => {
    setExperiments(
      experiments.map((exp) =>
        exp.id === activeExperimentId
          ? {
              ...exp,
              steps: exp.steps.map((step) =>
                step.id === stepId ? { ...step, title, content } : step
              ),
            }
          : exp
      )
    );
    toast.success('Step updated');
  };

  const activeExperiment = experiments.find((exp) => exp.id === activeExperimentId);

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
                    {exp.steps.length} steps
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
                {activeExperiment.steps.length > 0 ? (
                  activeExperiment.steps.map((step) => (
                    <ExperimentStep
                      key={step.id}
                      {...step}
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
