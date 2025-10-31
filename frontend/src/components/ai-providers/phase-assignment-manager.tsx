'use client';

import React, { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { PhaseAssignmentCard } from './phase-assignment-card';
import { PhaseAssignmentDialog } from './phase-assignment-dialog';
import { PhaseProviderAssignment } from '@/types/ai-provider';

// Mock phases - in real app, this would come from the backend
const mockPhases = [
  { id: '1', name: 'Task Decomposition', description: 'Break down main task into subtasks' },
  { id: '2', name: 'Task Enrichment', description: 'Enrich subtasks with project-specific rules' },
  { id: '3', name: 'Prompt Generation', description: 'Generate implementation-ready prompts' },
];

export function PhaseAssignmentManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PhaseProviderAssignment | null>(null);
  
  const phaseAssignments = useAIProviderStore((state) => state.phaseAssignments);
  const providers = useAIProviderStore((state) => state.providers);
  
  const unassignedPhases = mockPhases.filter(
    (phase) => !phaseAssignments.find((a) => a.phaseId === phase.id)
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Handle reordering if needed
    console.log('Drag end:', active.id, 'to', over.id);
  };
  
  const handleEdit = (assignment: PhaseProviderAssignment) => {
    setEditingAssignment(assignment);
    setIsDialogOpen(true);
  };
  
  const handleAdd = () => {
    setEditingAssignment(null);
    setIsDialogOpen(true);
  };
  
  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingAssignment(null);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Phase Provider Assignments</CardTitle>
              <CardDescription>
                Assign AI providers to different phases of task processing
              </CardDescription>
            </div>
            <Button onClick={handleAdd} disabled={unassignedPhases.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Phase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {phaseAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <div className="mx-auto max-w-sm space-y-2">
                <h3 className="text-lg font-semibold">No phase assignments</h3>
                <p className="text-sm text-muted-foreground">
                  Assign providers to phases to enable AI-powered task processing.
                </p>
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assignment
                </Button>
              </div>
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={phaseAssignments.map((a) => a.phaseId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {phaseAssignments.map((assignment) => (
                    <PhaseAssignmentCard
                      key={assignment.phaseId}
                      assignment={assignment}
                      providers={providers}
                      onEdit={() => handleEdit(assignment)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
      
      {unassignedPhases.length > 0 && phaseAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Phases</CardTitle>
            <CardDescription>
              These phases don&apos;t have provider assignments yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedPhases.map((phase) => (
                <div
                  key={phase.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h4 className="font-medium">{phase.name}</h4>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingAssignment({
                        phaseId: phase.id,
                        phaseName: phase.name,
                        primaryProviderId: '',
                        fallbackProviderIds: [],
                        modelConfiguration: {
                          modelId: '',
                          temperature: 0.7,
                          topP: 1.0,
                          maxTokens: 2048,
                          responseFormat: 'text',
                        },
                        systemPrompt: '',
                        maxRetries: 3,
                        timeoutMs: 30000,
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    Assign Provider
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <PhaseAssignmentDialog
        open={isDialogOpen}
        onOpenChange={handleClose}
        assignment={editingAssignment}
        availablePhases={unassignedPhases}
        providers={providers}
      />
    </div>
  );
}
