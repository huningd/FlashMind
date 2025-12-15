import React, { useState } from 'react';
import { Deck } from '../types';
import { db } from '../services/db';
import { Plus, Trash2, BookOpen, Layers } from 'lucide-react';

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  onRefresh: () => void;
}

export const DeckList: React.FC<DeckListProps> = ({ decks, onSelectDeck, onRefresh }) => {
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    await db.createDeck(newDeckName);
    setNewDeckName('');
    setIsCreating(false);
    onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Bist du sicher? Alle Karten in diesem Stapel werden gelöscht.')) {
      await db.deleteDeck(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Deine Stapel</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-colors"
        >
          <Plus size={20} className="mr-1" /> Neu
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name des Stapels</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="z.B. Spanisch Vokabeln"
              autoFocus
            />
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Speichern
            </button>
            <button 
              type="button" 
              onClick={() => setIsCreating(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <div
            key={deck.id}
            onClick={() => onSelectDeck(deck)}
            className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 group relative"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{deck.name}</h3>
                <div className="flex items-center text-sm text-gray-500 gap-3">
                  <span className="flex items-center"><Layers size={14} className="mr-1"/> {deck.card_count || 0} Karten</span>
                </div>
              </div>
              <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <BookOpen size={20} />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              {deck.due_count !== undefined && deck.due_count > 0 ? (
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  {deck.due_count} fällig
                </span>
              ) : (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Alles erledigt</span>
              )}
              
              <button
                onClick={(e) => handleDelete(e, deck.id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="Löschen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {decks.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Layers size={48} className="mx-auto mb-3 opacity-20" />
            <p>Noch keine Stapel vorhanden. Erstelle einen!</p>
          </div>
        )}
      </div>
    </div>
  );
};