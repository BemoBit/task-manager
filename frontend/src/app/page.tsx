'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Layers, Code, TestTube, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Template Editor
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create sophisticated templates with drag-and-drop sections, rich text editing,
            variables, and conditional logic
          </p>
          <Link href="/editor">
            <Button size="lg" className="text-lg px-8">
              <Sparkles className="mr-2 h-5 w-5" />
              Open Editor
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Layers className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Drag & Drop Sections</CardTitle>
              <CardDescription>
                Build templates with default sections: Data Model, Services, HTTP/API, Tests
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Rich Text Editor</CardTitle>
              <CardDescription>
                Markdown support, code highlighting, tables, images, and variable insertion
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Variable System</CardTitle>
              <CardDescription>
                Define typed variables with validation, defaults, and {`{{variable}}`} syntax
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TestTube className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Conditional Logic</CardTitle>
              <CardDescription>
                Visual rule builder for IF-THEN-ELSE conditions and section visibility
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Feature Details */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl">Powerful Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Template Management</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Version control with history</li>
                  <li>✓ Auto-save functionality</li>
                  <li>✓ Import/Export (JSON, YAML)</li>
                  <li>✓ Template categorization and tagging</li>
                  <li>✓ Search and filter capabilities</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Editor Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Undo/Redo support</li>
                  <li>✓ Preview mode</li>
                  <li>✓ Responsive design</li>
                  <li>✓ Dark mode support</li>
                  <li>✓ Keyboard shortcuts</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Section Builder</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Drag-and-drop reordering</li>
                  <li>✓ Nested subsections</li>
                  <li>✓ Custom section creation</li>
                  <li>✓ Section templates</li>
                  <li>✓ Collapsible sections</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Variables</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Type specification (string, number, etc.)</li>
                  <li>✓ Validation rules and constraints</li>
                  <li>✓ Default values</li>
                  <li>✓ Global and section scope</li>
                  <li>✓ Autocomplete support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>Get started in 3 simple steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Create Sections</h4>
                  <p className="text-sm text-muted-foreground">
                    Add default sections (Data Model, Services, etc.) or create custom ones
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Define Variables</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up variables for dynamic content with {`{{variableName}}`} syntax
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Write Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the rich text editor to create your template content with formatting
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link href="/editor">
                <Button size="lg">Start Creating</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
