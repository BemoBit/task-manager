'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { PhaseProviderAssignment, AIProvider } from '@/types/ai-provider';

interface PhaseAssignmentCardProps {
  assignment: PhaseProviderAssignment;
  providers: AIProvider[];
  onEdit: () => void;
}

export function PhaseAssignmentCard({
  assignment,
  providers,
  onEdit,
}: PhaseAssignmentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.phaseId });
  
  const removePhaseAssignment = useAIProviderStore((state) => state.removePhaseAssignment);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const primaryProvider = providers.find((p) => p.id === assignment.primaryProviderId);
  const fallbackProviders = providers.filter((p) =>
    assignment.fallbackProviderIds.includes(p.id)
  );
  
  const handleDelete = () => {
    removePhaseAssignment(assignment.phaseId);
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <button
              className="cursor-grab active:cursor-grabbing touch-none mt-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{assignment.phaseName}</h3>
                <Badge variant="secondary" className="text-xs">
                  Phase {assignment.phaseId}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Primary:</span>
                {primaryProvider ? (
                  <Badge variant="default">{primaryProvider.name}</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Not configured
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-1">
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
                    <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove the provider assignment for{' '}
                      <strong>{assignment.phaseName}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {fallbackProviders.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Fallback:</span>
              <div className="flex flex-wrap gap-1">
                {fallbackProviders.map((provider) => (
                  <Badge key={provider.id} variant="outline">
                    {provider.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Model:</span>
              <span className="ml-2 font-medium">
                {assignment.modelConfiguration.modelId || 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Tokens:</span>
              <span className="ml-2 font-medium">
                {assignment.modelConfiguration.maxTokens.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Temperature:</span>
              <span className="ml-2 font-medium">
                {assignment.modelConfiguration.temperature}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Retries:</span>
              <span className="ml-2 font-medium">{assignment.maxRetries}</span>
            </div>
          </div>
          
          {assignment.systemPrompt && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">System Prompt:</p>
              <p className="text-sm line-clamp-2">{assignment.systemPrompt}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
