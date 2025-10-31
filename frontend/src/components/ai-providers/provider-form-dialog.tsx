'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { AIProvider, AIProviderType } from '@/types/ai-provider';

interface ProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: AIProvider | null;
}

const getInitialFormData = (provider: AIProvider | null | undefined) => ({
  name: provider?.name || '',
  type: (provider?.type || 'openai') as AIProviderType,
  endpoint: provider?.endpoint || '',
  apiKey: provider?.apiKey || '',
  description: provider?.description || '',
});

export function ProviderFormDialog({ open, onOpenChange, provider }: ProviderFormDialogProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData(provider));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const addProvider = useAIProviderStore((state) => state.addProvider);
  const updateProvider = useAIProviderStore((state) => state.updateProvider);
  
  // Reset form when dialog opens/closes or provider changes
  React.useEffect(() => {
    setFormData(getInitialFormData(provider));
    setErrors({});
  }, [open, provider?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'Endpoint is required';
    } else {
      try {
        new URL(formData.endpoint);
      } catch {
        newErrors.endpoint = 'Invalid URL format';
      }
    }
    
    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (provider) {
      updateProvider(provider.id, {
        ...formData,
        updatedAt: new Date(),
      });
    } else {
      const newProvider: AIProvider = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'inactive',
        models: [],
        isEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addProvider(newProvider);
    }
    
    onOpenChange(false);
  };
  
  const defaultEndpoints: Record<AIProviderType, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    google: 'https://generativelanguage.googleapis.com/v1',
    custom: '',
  };
  
  const handleTypeChange = (type: AIProviderType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      endpoint: defaultEndpoints[type] || prev.endpoint,
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit Provider' : 'Add New Provider'}</DialogTitle>
          <DialogDescription>
            {provider
              ? 'Update the provider configuration and settings.'
              : 'Configure a new AI provider to use in your workflows.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Provider Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My OpenAI Provider"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">
                Provider Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endpoint">
              API Endpoint <span className="text-destructive">*</span>
            </Label>
            <Input
              id="endpoint"
              type="url"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className={errors.endpoint ? 'border-destructive' : ''}
            />
            {errors.endpoint && (
              <p className="text-xs text-destructive">{errors.endpoint}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
                className={errors.apiKey ? 'border-destructive pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.apiKey && (
              <p className="text-xs text-destructive">{errors.apiKey}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Your API key will be encrypted and stored securely.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for this provider..."
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {provider ? 'Update Provider' : 'Add Provider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
