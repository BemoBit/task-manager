/**
 * Properties Panel Component
 * Displays and allows editing properties for selected elements
 */

'use client';

import React from 'react';
import { useTemplateStore } from '@/store/templateStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings2, Tag } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  // Split selectors to avoid creating new objects
  const selectedSectionId = useTemplateStore((state) => state.editorState.selectedSectionId);
  const template = useTemplateStore((state) => state.history.present);
  const updateSection = useTemplateStore((state) => state.updateSection);

  const selectedSection = template.sections.find((s) => s.id === selectedSectionId);

  if (!selectedSection) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b">
          <Settings2 className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a section to view its properties
          </p>
        </div>
      </div>
    );
  }

  const handleTitleChange = (value: string) => {
    updateSection(selectedSection.id, (draft) => {
      draft.title = value;
    });
  };

  const handleContentChange = (value: string) => {
    updateSection(selectedSection.id, (draft) => {
      draft.content = value;
    });
  };

  const handleTypeChange = (value: string) => {
    updateSection(selectedSection.id, (draft) => {
      draft.type = value as typeof draft.type;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <Settings2 className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Properties</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">Title</Label>
              <Input
                id="section-title"
                value={selectedSection.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter section title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-type">Type</Label>
              <Select value={selectedSection.type || 'custom'} onValueChange={handleTypeChange}>
                <SelectTrigger id="section-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="data-model">Data Model Definition</SelectItem>
                  <SelectItem value="services">Services Architecture</SelectItem>
                  <SelectItem value="http-api">HTTP/API Requests</SelectItem>
                  <SelectItem value="tests">Test Scenarios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-content">Description</Label>
              <Textarea
                id="section-content"
                value={selectedSection.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Enter section description"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subsections</span>
              <Badge variant="secondary">
                {selectedSection.subsections?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Variables</span>
              <Badge variant="secondary">
                {selectedSection.variables?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conditional Rules</span>
              <Badge variant="secondary">
                {selectedSection.conditionalLogic?.length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Advanced</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" size="sm" className="w-full">
              <Tag className="h-4 w-4 mr-2" />
              Manage Conditional Logic
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              Add Custom Field
            </Button>
            <Separator />
            <Button variant="destructive" size="sm" className="w-full">
              Delete Section
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
