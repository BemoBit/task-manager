'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIProviderStore } from '@/store/aiProviderStore';
import { ProviderCard } from './provider-card';
import { ProviderFormDialog } from './provider-form-dialog';
import { AIProvider } from '@/types/ai-provider';

export function ProviderList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  
  const providers = useAIProviderStore((state) => state.providers);
  
  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider);
    setIsFormOpen(true);
  };
  
  const handleAdd = () => {
    setEditingProvider(null);
    setIsFormOpen(true);
  };
  
  const handleClose = () => {
    setIsFormOpen(false);
    setEditingProvider(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>
      
      {filteredProviders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto max-w-sm space-y-2">
            <h3 className="text-lg font-semibold">No providers found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Get started by adding your first AI provider.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAdd} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={() => handleEdit(provider)}
            />
          ))}
        </div>
      )}
      
      <ProviderFormDialog
        open={isFormOpen}
        onOpenChange={handleClose}
        provider={editingProvider}
      />
    </div>
  );
}
