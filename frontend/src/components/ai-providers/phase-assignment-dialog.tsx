'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { PhaseProviderAssignment, AIProvider } from '@/types/ai-provider';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface PhaseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: PhaseProviderAssignment | null;
  availablePhases: { id: string; name: string; description: string }[];
  providers: AIProvider[];
}

const getInitialFormData = (assignment: PhaseProviderAssignment | null) => ({
  phaseId: assignment?.phaseId || '',
  phaseName: assignment?.phaseName || '',
  primaryProviderId: assignment?.primaryProviderId || '',
  fallbackProviderIds: assignment?.fallbackProviderIds || [],
  systemPrompt: assignment?.systemPrompt || '',
  maxRetries: assignment?.maxRetries || 3,
  timeoutMs: assignment?.timeoutMs || 30000,
  modelConfiguration: assignment?.modelConfiguration || {
    modelId: '',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2048,
    responseFormat: 'text' as const,
  },
});

export function PhaseAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  availablePhases,
  providers,
}: PhaseAssignmentDialogProps) {
  const [formData, setFormData] = useState(getInitialFormData(assignment));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const assignProviderToPhase = useAIProviderStore((state) => state.assignProviderToPhase);
  const updatePhaseAssignment = useAIProviderStore((state) => state.updatePhaseAssignment);
  
  React.useEffect(() => {
    if (!open) return;
    setFormData(getInitialFormData(assignment));
    setErrors({});
  }, [open, assignment?.phaseId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const activeProviders = providers.filter((p) => p.isEnabled);
  const selectedProvider = activeProviders.find((p) => p.id === formData.primaryProviderId);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.phaseId) {
      newErrors.phaseId = 'Please select a phase';
    }
    
    if (!formData.primaryProviderId) {
      newErrors.primaryProviderId = 'Please select a primary provider';
    }
    
    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required';
    }
    
    if (!formData.modelConfiguration.modelId && selectedProvider) {
      newErrors.modelId = 'Please select a model';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const assignmentData: PhaseProviderAssignment = {
      phaseId: formData.phaseId,
      phaseName: formData.phaseName || availablePhases.find((p) => p.id === formData.phaseId)?.name || '',
      primaryProviderId: formData.primaryProviderId,
      fallbackProviderIds: formData.fallbackProviderIds,
      systemPrompt: formData.systemPrompt,
      maxRetries: formData.maxRetries,
      timeoutMs: formData.timeoutMs,
      modelConfiguration: formData.modelConfiguration,
    };
    
    if (assignment) {
      updatePhaseAssignment(assignment.phaseId, assignmentData);
    } else {
      assignProviderToPhase(assignmentData);
    }
    
    onOpenChange(false);
  };
  
  const handleAddFallback = (providerId: string) => {
    if (!formData.fallbackProviderIds.includes(providerId)) {
      setFormData((prev) => ({
        ...prev,
        fallbackProviderIds: [...prev.fallbackProviderIds, providerId],
      }));
    }
  };
  
  const handleRemoveFallback = (providerId: string) => {
    setFormData((prev) => ({
      ...prev,
      fallbackProviderIds: prev.fallbackProviderIds.filter((id) => id !== providerId),
    }));
  };
  
  const handleProviderChange = (providerId: string) => {
    const provider = activeProviders.find((p) => p.id === providerId);
    setFormData((prev) => ({
      ...prev,
      primaryProviderId: providerId,
      modelConfiguration: {
        ...prev.modelConfiguration,
        modelId: provider?.defaultModelId || provider?.models[0]?.id || '',
      },
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Edit Phase Assignment' : 'Assign Provider to Phase'}
          </DialogTitle>
          <DialogDescription>
            Configure AI provider settings for task processing phase
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="provider" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="model">Model Config</TabsTrigger>
              <TabsTrigger value="prompt">Prompts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="provider" className="space-y-4">
              {!assignment && (
                <div className="space-y-2">
                  <Label htmlFor="phase">
                    Phase <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.phaseId} onValueChange={(value) => {
                    const phase = availablePhases.find((p) => p.id === value);
                    setFormData({ ...formData, phaseId: value, phaseName: phase?.name || '' });
                  }}>
                    <SelectTrigger id="phase" className={errors.phaseId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select a phase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePhases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          <div>
                            <div className="font-medium">{phase.name}</div>
                            <div className="text-xs text-muted-foreground">{phase.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.phaseId && (
                    <p className="text-xs text-destructive">{errors.phaseId}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="primaryProvider">
                  Primary Provider <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.primaryProviderId}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger
                    id="primaryProvider"
                    className={errors.primaryProviderId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select primary provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.primaryProviderId && (
                  <p className="text-xs text-destructive">{errors.primaryProviderId}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fallbackProvider">Fallback Providers (Optional)</Label>
                <Select onValueChange={handleAddFallback}>
                  <SelectTrigger id="fallbackProvider">
                    <SelectValue placeholder="Add fallback provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProviders
                      .filter(
                        (p) =>
                          p.id !== formData.primaryProviderId &&
                          !formData.fallbackProviderIds.includes(p.id)
                      )
                      .map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                {formData.fallbackProviderIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.fallbackProviderIds.map((id) => {
                      const provider = activeProviders.find((p) => p.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {provider?.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveFallback(id)}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={formData.maxRetries}
                    onChange={(e) =>
                      setFormData({ ...formData, maxRetries: parseInt(e.target.value) })
                    }
                    min={0}
                    max={10}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeoutMs}
                    onChange={(e) =>
                      setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })
                    }
                    min={1000}
                    step={1000}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="model" className="space-y-4">
              {selectedProvider ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="model">
                      Model <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.modelConfiguration.modelId}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          modelConfiguration: { ...formData.modelConfiguration, modelId: value },
                        })
                      }
                    >
                      <SelectTrigger id="model" className={errors.modelId ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvider.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.modelId && (
                      <p className="text-xs text-destructive">{errors.modelId}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature: {formData.modelConfiguration.temperature}</Label>
                      <Input
                        id="temperature"
                        type="range"
                        value={formData.modelConfiguration.temperature}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            modelConfiguration: {
                              ...formData.modelConfiguration,
                              temperature: parseFloat(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={formData.modelConfiguration.maxTokens}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            modelConfiguration: {
                              ...formData.modelConfiguration,
                              maxTokens: parseInt(e.target.value),
                            },
                          })
                        }
                        min={1}
                        max={selectedProvider.models.find((m) => m.id === formData.modelConfiguration.modelId)?.maxTokens || 4096}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Please select a primary provider first
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="prompt" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">
                  System Prompt <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="Enter the system prompt for this phase..."
                  rows={10}
                  className={errors.systemPrompt ? 'border-destructive' : ''}
                />
                {errors.systemPrompt && (
                  <p className="text-xs text-destructive">{errors.systemPrompt}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This prompt will be sent to the AI provider for every request in this phase.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {assignment ? 'Update Assignment' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
