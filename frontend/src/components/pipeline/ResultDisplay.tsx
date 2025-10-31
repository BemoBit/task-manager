'use client';

import React, { useState } from 'react';
import { GeneratedPrompt } from '@/types/pipeline';
import { usePipelineStore } from '@/store/pipelineStore';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FaCopy,
  FaFilePdf,
  FaFileCode,
  FaCheck,
  FaFileAlt,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ResultDisplay() {
  const { pipeline } = usePipelineStore();
  const result = pipeline?.result;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No results yet. Complete a pipeline execution to see generated prompts.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = async (prompt: GeneratedPrompt) => {
    await navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportMarkdown = () => {
    const markdown = result.generatedPrompts
      .map(
        (prompt) =>
          `# ${prompt.title}\n\n**Type:** ${prompt.type}\n\n\`\`\`${prompt.language || 'text'}\n${prompt.content}\n\`\`\`\n\n---\n\n`
      )
      .join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(18);
    doc.text('Generated Prompts', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(result.createdAt).toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total Duration: ${formatDuration(result.metadata.totalDuration)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Phases Executed: ${result.metadata.phasesExecuted}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Tokens Used: ${result.metadata.tokensUsed.toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Cost: $${result.metadata.cost.toFixed(4)}`, 20, yPosition);
    yPosition += 15;

    result.generatedPrompts.forEach((prompt, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`${index + 1}. ${prompt.title}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Type: ${prompt.type}`, 25, yPosition);
      yPosition += 8;

      doc.setTextColor(0);
      const lines = doc.splitTextToSize(prompt.content, 170);
      lines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
    });

    doc.save(`prompts-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const groupedPrompts = result.generatedPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.type]) {
      acc[prompt.type] = [];
    }
    acc[prompt.type].push(prompt);
    return acc;
  }, {} as Record<string, GeneratedPrompt[]>);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Generated Results</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
              <FaFileAlt className="mr-2 h-4 w-4" />
              Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FaFileCode className="mr-2 h-4 w-4" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FaFilePdf className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Total Prompts</p>
              <p className="text-2xl font-bold">{result.generatedPrompts.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Duration</p>
              <p className="text-2xl font-bold">
                {formatDuration(result.metadata.totalDuration)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tokens Used</p>
              <p className="text-2xl font-bold">
                {result.metadata.tokensUsed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Total Cost</p>
              <p className="text-2xl font-bold">${result.metadata.cost.toFixed(4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompts Display */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Generated Prompts</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '☀️' : '🌙'} Theme
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(groupedPrompts)[0] || 'all'}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({result.generatedPrompts.length})</TabsTrigger>
              {Object.entries(groupedPrompts).map(([type, prompts]) => (
                <TabsTrigger key={type} value={type}>
                  {type.replace(/-/g, ' ')} ({prompts.length})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <PromptList
                prompts={result.generatedPrompts}
                theme={theme}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </TabsContent>

            {Object.entries(groupedPrompts).map(([type, prompts]) => (
              <TabsContent key={type} value={type}>
                <PromptList
                  prompts={prompts}
                  theme={theme}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface PromptListProps {
  prompts: GeneratedPrompt[];
  theme: 'light' | 'dark';
  copiedId: string | null;
  onCopy: (prompt: GeneratedPrompt) => void;
}

function PromptList({ prompts, theme, copiedId, onCopy }: PromptListProps) {
  return (
    <div className="space-y-4">
      {prompts.map((prompt, index) => (
        <motion.div
          key={prompt.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <PromptCard
            prompt={prompt}
            theme={theme}
            isCopied={copiedId === prompt.id}
            onCopy={() => onCopy(prompt)}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface PromptCardProps {
  prompt: GeneratedPrompt;
  theme: 'light' | 'dark';
  isCopied: boolean;
  onCopy: () => void;
}

function PromptCard({ prompt, theme, isCopied, onCopy }: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{prompt.title}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{prompt.type}</Badge>
              {prompt.language && <Badge variant="secondary">{prompt.language}</Badge>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="flex-shrink-0"
          >
            {isCopied ? (
              <>
                <FaCheck className="mr-2 h-4 w-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <FaCopy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            className={`max-h-96 overflow-y-auto rounded-lg ${!isExpanded ? 'max-h-60' : ''}`}
          >
            <SyntaxHighlighter
              language={prompt.language || 'text'}
              style={theme === 'dark' ? vscDarkPlus : vs}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {prompt.content}
            </SyntaxHighlighter>
          </div>
          {prompt.content.split('\n').length > 15 && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent flex items-end justify-center pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
              >
                Show More
              </Button>
            </div>
          )}
          {isExpanded && (
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                Show Less
              </Button>
            </div>
          )}
        </div>

        {Object.keys(prompt.metadata).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Metadata:</p>
            <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono">
              <pre>{JSON.stringify(prompt.metadata, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
