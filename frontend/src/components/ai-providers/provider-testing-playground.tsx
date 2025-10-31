'use client';

import React, { useState } from 'react';
import { Play, Trash2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { ModelConfiguration } from '@/types/ai-provider';

interface TestResult {
  id: string;
  providerId: string;
  providerName: string;
  prompt: string;
  response: string;
  responseTime: number;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
  error?: string;
}

export function ProviderTestingPlayground() {
  const [prompt, setPrompt] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const providers = useAIProviderStore((state) => state.providers.filter((p) => p.isEnabled));
  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  
  const [modelConfig, setModelConfig] = useState<ModelConfiguration>({
    modelId: '',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 1000,
    responseFormat: 'text',
  });
  
  React.useEffect(() => {
    if (selectedProvider) {
      setModelConfig((prev) => ({
        ...prev,
        modelId: selectedProvider.defaultModelId || selectedProvider.models[0]?.id || '',
      }));
    }
  }, [selectedProvider]);
  
  const handleRunTest = async () => {
    if (!prompt.trim() || !selectedProviderId) return;
    
    setIsRunning(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const result: TestResult = {
        id: crypto.randomUUID(),
        providerId: selectedProviderId,
        providerName: selectedProvider?.name || 'Unknown',
        prompt,
        response: 'This is a simulated response from the AI provider. In production, this would be the actual response from the AI model.',
        responseTime: Math.random() * 2000 + 500,
        tokensUsed: Math.floor(Math.random() * 500 + 100),
        cost: Math.random() * 0.01,
        timestamp: new Date(),
      };
      
      setTestResults((prev) => [result, ...prev]);
    } catch (error) {
      const errorResult: TestResult = {
        id: crypto.randomUUID(),
        providerId: selectedProviderId,
        providerName: selectedProvider?.name || 'Unknown',
        prompt,
        response: '',
        responseTime: 0,
        tokensUsed: 0,
        cost: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      
      setTestResults((prev) => [errorResult, ...prev]);
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleCopyResponse = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  const handleClearResults = () => {
    setTestResults([]);
  };
  
  const promptTemplates = [
    {
      name: 'Code Generation',
      prompt: 'Write a function in TypeScript that validates an email address using regex.',
    },
    {
      name: 'Data Analysis',
      prompt: 'Analyze the following data and provide insights: [Your data here]',
    },
    {
      name: 'Content Writing',
      prompt: 'Write a professional email to a client explaining a project delay.',
    },
    {
      name: 'Problem Solving',
      prompt: 'Explain how to optimize database queries for better performance.',
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Playground</CardTitle>
          <CardDescription>
            Test AI providers with custom prompts and compare responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProvider && (
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={modelConfig.modelId}
                  onValueChange={(value) => setModelConfig({ ...modelConfig, modelId: value })}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider.models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Prompt</Label>
              <Select onValueChange={(value) => setPrompt(promptTemplates[parseInt(value)].prompt)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Load template..." />
                </SelectTrigger>
                <SelectContent>
                  {promptTemplates.map((template, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={6}
            />
          </div>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    Temperature: {modelConfig.temperature}
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    value={modelConfig.temperature}
                    onChange={(e) =>
                      setModelConfig({
                        ...modelConfig,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens: {modelConfig.maxTokens}</Label>
                  <input
                    id="maxTokens"
                    type="range"
                    value={modelConfig.maxTokens}
                    onChange={(e) =>
                      setModelConfig({
                        ...modelConfig,
                        maxTokens: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    max={4096}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topP">Top P: {modelConfig.topP}</Label>
                  <input
                    id="topP"
                    type="range"
                    value={modelConfig.topP}
                    onChange={(e) =>
                      setModelConfig({ ...modelConfig, topP: parseFloat(e.target.value) })
                    }
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="responseFormat">Response Format</Label>
                  <Select
                    value={modelConfig.responseFormat}
                    onValueChange={(value) =>
                      setModelConfig({
                        ...modelConfig,
                        responseFormat: value as ModelConfiguration['responseFormat'],
                      })
                    }
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
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPrompt('');
                setTestResults([]);
              }}
            >
              Clear All
            </Button>
            <Button
              onClick={handleRunTest}
              disabled={isRunning || !prompt.trim() || !selectedProviderId}
            >
              <Play className="mr-2 h-4 w-4" />
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>{testResults.length} test(s) completed</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearResults}>
                <Trash2 className="mr-2 h-3 w-3" />
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{result.providerName}</CardTitle>
                        {result.error ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : (
                          <Badge variant="default">Success</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {new Date(result.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm space-y-1">
                      <div className="text-muted-foreground">
                        Response Time: <span className="font-medium">{result.responseTime.toFixed(0)}ms</span>
                      </div>
                      <div className="text-muted-foreground">
                        Tokens: <span className="font-medium">{result.tokensUsed}</span>
                      </div>
                      <div className="text-muted-foreground">
                        Cost: <span className="font-medium">${result.cost.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Prompt:</Label>
                    <div className="mt-1 rounded-md bg-muted p-3 text-sm">
                      {result.prompt}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-muted-foreground">Response:</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyResponse(result.id, result.response || result.error || '')}
                      >
                        {copiedId === result.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    {result.error ? (
                      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {result.error}
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                        {result.response}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
