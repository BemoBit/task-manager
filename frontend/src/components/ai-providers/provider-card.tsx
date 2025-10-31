'use client';

import React from 'react';
import { Edit, Trash2, Power, RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { AIProvider } from '@/types/ai-provider';
import { cn } from '@/lib/utils';

interface ProviderCardProps {
  provider: AIProvider;
  onEdit: () => void;
}

const statusConfig = {
  active: {
    label: 'Active',
    icon: Check,
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  inactive: {
    label: 'Inactive',
    icon: X,
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
  },
  testing: {
    label: 'Testing',
    icon: RefreshCw,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
};

const providerTypeLabels = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  custom: 'Custom',
};

export function ProviderCard({ provider, onEdit }: ProviderCardProps) {
  const deleteProvider = useAIProviderStore((state) => state.deleteProvider);
  const toggleProviderStatus = useAIProviderStore((state) => state.toggleProviderStatus);
  const testProviderConnection = useAIProviderStore((state) => state.testProviderConnection);
  const isTestingProvider = useAIProviderStore((state) => state.isTestingProvider);
  
  const statusInfo = statusConfig[provider.status];
  const StatusIcon = statusInfo.icon;
  
  const handleTest = async () => {
    await testProviderConnection(provider.id);
  };
  
  const handleToggle = () => {
    toggleProviderStatus(provider.id);
  };
  
  const handleDelete = () => {
    deleteProvider(provider.id);
  };
  
  return (
    <Card className={cn('transition-all', !provider.isEnabled && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{provider.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {providerTypeLabels[provider.type]}
              </Badge>
            </div>
            {provider.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {provider.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn('ml-2', statusInfo.className)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Models:</span>
            <span className="font-medium">{provider.models.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Endpoint:</span>
            <span className="font-mono text-xs truncate max-w-[150px]" title={provider.endpoint}>
              {provider.endpoint}
            </span>
          </div>
          {provider.lastTestedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Tested:</span>
              <span className="text-xs">
                {new Date(provider.lastTestedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {provider.testResult && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Response Time:</span>
              <span className="text-xs font-medium">
                {provider.testResult.responseTime}ms
              </span>
            </div>
          )}
        </div>
        
        {provider.testResult?.error && (
          <div className="rounded-md bg-red-500/10 p-2">
            <p className="text-xs text-red-500">{provider.testResult.error}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={isTestingProvider || !provider.isEnabled}
          className="flex-1"
        >
          <RefreshCw className={cn('mr-2 h-3 w-3', isTestingProvider && 'animate-spin')} />
          Test
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          className="flex-1"
        >
          <Power className="mr-2 h-3 w-3" />
          {provider.isEnabled ? 'Disable' : 'Enable'}
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Provider</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{provider.name}</strong>? This action cannot be undone and will remove all associated configurations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
