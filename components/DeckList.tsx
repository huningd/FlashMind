import React, { useState, useRef } from 'react';
import { Deck } from '../types';
import { db } from '../services/db';
import { Plus, Trash2, BookOpen, Layers, Download, Upload, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  onRefresh: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({ decks, onSelectDeck, onRefresh }) => {
  const { t } = useLanguage();
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    await db.createDeck(newDeckName, newDeckDescription);
    setNewDeckName('');
    setNewDeckDescription('');
    setIsCreating(false);
    onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm(t('deck.delete_confirm'))) {
      await db.deleteDeck(id);
      onRefresh();
    }
  };

  const handleExport = async (e: React.MouseEvent, deck: Deck) => {
    e.stopPropagation();
    try {
      const jsonStr = await db.exportDeck(deck.id);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        await db.importDeck(content);
        onRefresh();
        alert(t('deck.import.success'));
      } catch (err) {
        console.error(err);
        alert(t('deck.import.error'));
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('deck.your_decks')}</h2>
        <div className="flex gap-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          <button
            onClick={handleImportClick}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-primary hover:border-primary px-3 py-2 rounded-lg flex items-center shadow-sm transition-colors"
            title={t('deck.import')}
          >
            <Upload size={20} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
          >
            <Plus size={20} className="mr-2" /> {t('deck.new')}
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deck.new.name')}</label>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder={t('deck.new.placeholder_name')}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deck.new.desc')}</label>
              <input
                type="text"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder={t('deck.new.placeholder_desc')}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                {t('deck.cancel')}
              </button>
              <button
                type="submit"
                disabled={!newDeckName.trim()}
                className="bg-primary hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg shadow-sm transition-colors"
              >
                {t('deck.created')}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {decks.map(deck => (
          <div 
            key={deck.id}
            onClick={() => onSelectDeck(deck)}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{deck.name}</h3>
                  {deck.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{deck.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {deck.card_count || 0} {t('deck.count_cards')}
                    </span>
                    {deck.due_count ? (
                       <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium">
                        <Info size={14} />
                        {deck.due_count} {t('deck.due')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                        <Info size={14} />
                        {t('deck.done')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleExport(e, deck)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, deck.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {decks.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <Layers className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('deck.empty_title')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('deck.empty_desc')}</p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 bg-indigo-50 dark:bg-indigo-900/30 text-primary px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              {t('deck.create_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};