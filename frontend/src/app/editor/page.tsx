/**
 * Template Editor Page
 * Main template editor with layout and all components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useTemplateStore, setupAutoSave } from '@/store/templateStore';
import { TemplateTreeView } from '@/components/template-editor/TemplateTreeView';
import { PropertiesPanel } from '@/components/template-editor/PropertiesPanel';
import { SectionBuilder } from '@/components/template-editor/SectionBuilder';
import { RichTextEditor } from '@/components/template-editor/RichTextEditor';
import { VariableManager } from '@/components/template-editor/VariableManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  EyeOff,
  Save,
  Undo,
  Redo,
  Settings,
  Variable,
  Download,
  Upload,
  Clock,
} from 'lucide-react';

export default function TemplateEditorPage() {
  const [showVariableManager, setShowVariableManager] = useState(false);
  const [sidebarCollapsed] = useState(false);

  // Split selectors to avoid creating new objects on every render
  const template = useTemplateStore((state) => state.history.present);
  const selectedSectionId = useTemplateStore((state) => state.editorState.selectedSectionId);
  const isPreviewMode = useTemplateStore((state) => state.editorState.isPreviewMode);
  const isDirty = useTemplateStore((state) => state.editorState.isDirty);
  const lastSaved = useTemplateStore((state) => state.editorState.lastSaved);
  const canUndo = useTemplateStore((state) => state.canUndo());
  const canRedo = useTemplateStore((state) => state.canRedo());
  
  // Actions
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const updateSection = useTemplateStore((state) => state.updateSection);
  const togglePreviewMode = useTemplateStore((state) => state.togglePreviewMode);
  const undo = useTemplateStore((state) => state.undo);
  const redo = useTemplateStore((state) => state.redo);
  const triggerAutoSave = useTemplateStore((state) => state.triggerAutoSave);

  // Derive selected section from template and selectedSectionId
  const selectedSection = template.sections.find((s) => s.id === selectedSectionId);

  // Setup auto-save
  useEffect(() => {
    const cleanup = setupAutoSave(30000); // Auto-save every 30 seconds
    return cleanup;
  }, []);

  const handleSave = async () => {
    await triggerAutoSave();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedTemplate = JSON.parse(event.target?.result as string);
            // TODO: Implement template import validation
            console.log('Imported template:', importedTemplate);
            alert('Template import functionality coming soon!');
          } catch {
            alert('Invalid template file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Top Toolbar */}
        <header className="border-b bg-card">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-xl font-bold">Template Editor</h1>
              <Separator orientation="vertical" className="h-6" />
              <Input
                value={template.name}
                onChange={(e) =>
                updateTemplate((draft) => {
                  draft.name = e.target.value;
                })
              }
              className="max-w-md"
              placeholder="Template name"
            />
            {isDirty && <Badge variant="secondary">Unsaved</Badge>}
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo">
              <Redo className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVariableManager(true)}
              title="Variables"
            >
              <Variable className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePreviewMode} title="Preview">
              {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="icon" onClick={handleImport} title="Import">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExport} title="Export">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Template Structure */}
        {!sidebarCollapsed && (
          <aside className="w-64 border-r bg-card overflow-hidden flex flex-col">
            <TemplateTreeView />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="builder" className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="builder">Builder</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="builder" className="flex-1 overflow-auto m-0">
              <SectionBuilder />
            </TabsContent>

            <TabsContent value="editor" className="flex-1 overflow-auto p-4 m-0">
              {selectedSection ? (
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl font-bold mb-4">{selectedSection.title}</h2>
                  <RichTextEditor
                    content={selectedSection.content}
                    onChange={(content) =>
                      updateSection(selectedSection.id, (draft) => {
                        draft.content = content;
                      })
                    }
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <p className="text-lg mb-2">No section selected</p>
                    <p className="text-sm">Select a section from the sidebar to start editing</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-auto p-4 m-0">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-sm max-w-none">
                  <h1>{template.name}</h1>
                  <p className="lead">{template.description}</p>

                  {template.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <div key={section.id} className="mt-8">
                        <h2>{section.title}</h2>
                        <div dangerouslySetInnerHTML={{ __html: section.content }} />
                        {section.subsections && section.subsections.length > 0 && (
                          <div className="ml-4">
                            {section.subsections.map((subsection) => (
                              <div key={subsection.id} className="mt-4">
                                <h3>{subsection.title}</h3>
                                <div dangerouslySetInnerHTML={{ __html: subsection.content }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l bg-card overflow-hidden">
          <PropertiesPanel />
        </aside>
      </div>

      {/* Variable Manager Modal */}
      <VariableManager open={showVariableManager} onOpenChange={setShowVariableManager} />
      </div>
    </DashboardLayout>
  );
}
