'use client';

import React, { useState } from 'react';
import { Settings, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIProvider, ModelConfiguration } from '@/types/ai-provider';

interface ModelConfigurationPanelProps {
  provider: AIProvider;
  initialConfig?: ModelConfiguration;
  onSave: (config: ModelConfiguration) => void;
}

export function ModelConfigurationPanel({
  provider,
  initialConfig,
  onSave,
}: ModelConfigurationPanelProps) {
  const [selectedModelId, setSelectedModelId] = useState(
    initialConfig?.modelId || provider.defaultModelId || provider.models[0]?.id || ''
  );
  const [config, setConfig] = useState<ModelConfiguration>(
    initialConfig || {
      modelId: selectedModelId,
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 2048,
      responseFormat: 'text',
    }
  );
  
  const selectedModel = provider.models.find((m) => m.id === selectedModelId);
  
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setConfig((prev) => ({ ...prev, modelId }));
  };
  
  const handleParameterChange = (key: keyof ModelConfiguration, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleSave = () => {
    onSave(config);
  };
  
  const estimatedCost = selectedModel
    ? ((config.maxTokens / 1000) * (selectedModel.costPer1kInputTokens + selectedModel.costPer1kOutputTokens) / 2)
    : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Model Configuration
        </CardTitle>
        <CardDescription>
          Configure model parameters and token limits for {provider.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="model" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="model" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model">Select Model</Label>
              <Select value={selectedModelId} onValueChange={handleModelChange}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Choose a model..." />
                </SelectTrigger>
                <SelectContent>
                  {provider.models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedModel && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{selectedModel.displayName}</h4>
                  {selectedModel.description && (
                    <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Context Window:</span>
                    <span className="ml-2 font-medium">
                      {selectedModel.contextWindow.toLocaleString()} tokens
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Tokens:</span>
                    <span className="ml-2 font-medium">
                      {selectedModel.maxTokens.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Input Cost:</span>
                    <span className="ml-2 font-medium">
                      ${selectedModel.costPer1kInputTokens}/1k
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output Cost:</span>
                    <span className="ml-2 font-medium">
                      ${selectedModel.costPer1kOutputTokens}/1k
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  {selectedModel.supportsStreaming && (
                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-500">
                      Streaming
                    </span>
                  )}
                  {selectedModel.supportsFunctionCalling && (
                    <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs text-purple-500">
                      Functions
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Token Limit</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="maxTokens"
                  value={[config.maxTokens]}
                  onValueChange={([value]: number[]) => handleParameterChange('maxTokens', value)}
                  min={1}
                  max={selectedModel?.maxTokens || 4096}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                  className="w-24"
                  min={1}
                  max={selectedModel?.maxTokens || 4096}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens to generate
              </p>
            </div>
            
            <div className="rounded-lg border border-dashed p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Estimated Cost per Request:</span>
              </div>
              <span className="text-lg font-bold">
                ${estimatedCost.toFixed(4)}
              </span>
            </div>
          </TabsContent>
          
          <TabsContent value="parameters" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature</Label>
                <span className="text-sm text-muted-foreground">{config.temperature}</span>
              </div>
              <Slider
                id="temperature"
                value={[config.temperature]}
                onValueChange={([value]: number[]) => handleParameterChange('temperature', value)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness: Lower is more focused, higher is more creative
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="topP">Top P</Label>
                <span className="text-sm text-muted-foreground">{config.topP}</span>
              </div>
              <Slider
                id="topP"
                value={[config.topP]}
                onValueChange={([value]: number[]) => handleParameterChange('topP', value)}
                min={0}
                max={1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Nucleus sampling: Consider tokens with top_p probability mass
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                <span className="text-sm text-muted-foreground">
                  {config.frequencyPenalty || 0}
                </span>
              </div>
              <Slider
                id="frequencyPenalty"
                value={[config.frequencyPenalty || 0]}
                onValueChange={([value]: number[]) => handleParameterChange('frequencyPenalty', value)}
                min={-2}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Penalize repeated tokens based on frequency
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="presencePenalty">Presence Penalty</Label>
                <span className="text-sm text-muted-foreground">
                  {config.presencePenalty || 0}
                </span>
              </div>
              <Slider
                id="presencePenalty"
                value={[config.presencePenalty || 0]}
                onValueChange={([value]: number[]) => handleParameterChange('presencePenalty', value)}
                min={-2}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Penalize new tokens based on whether they appear in the text
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responseFormat">Response Format</Label>
              <Select
                value={config.responseFormat}
                onValueChange={(value) => handleParameterChange('responseFormat', value)}
              >
                <SelectTrigger id="responseFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="json_object">JSON Object</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stopSequences">Stop Sequences</Label>
              <Input
                id="stopSequences"
                value={config.stopSequences?.join(', ') || ''}
                onChange={(e) =>
                  handleParameterChange(
                    'stopSequences',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Enter sequences separated by commas"
              />
              <p className="text-xs text-muted-foreground">
                Stop generation when these sequences are encountered
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfig(initialConfig || config)}>
            Reset
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
