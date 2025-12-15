import React from 'react';
import { Deck } from '../types';
import { BarChart3, CheckCircle2, Circle, Clock } from 'lucide-react';

interface StudyOverviewProps {
  decks: Deck[];
}

export const StudyOverview: React.FC<StudyOverviewProps> = ({ decks }) => {
  const totalCards = decks.reduce((acc, d) => acc + (d.card_count || 0), 0);
  const totalDue = decks.reduce((acc, d) => acc + (d.due_count || 0), 0);
  const totalNew = decks.reduce((acc, d) => acc + (d.new_count || 0), 0);
  const totalLearned = decks.reduce((acc, d) => acc + (d.learned_count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <h2 className="text-2xl font-bold text-gray-800">Studienübersicht</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <Clock size={16} className="mr-2 text-amber-500" />
            <span className="text-sm font-medium">Fällig</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalDue}</div>
          <div className="text-xs text-gray-400 mt-1">Karten warten auf dich</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <CheckCircle2 size={16} className="mr-2 text-green-500" />
            <span className="text-sm font-medium">Gelernt</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalLearned}</div>
          <div className="text-xs text-gray-400 mt-1">Bereits bearbeitete Karten</div>
        </div>

         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <Circle size={16} className="mr-2 text-blue-500" />
            <span className="text-sm font-medium">Neu</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalNew}</div>
          <div className="text-xs text-gray-400 mt-1">Noch ungesehen</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center text-gray-500 mb-2">
            <BarChart3 size={16} className="mr-2 text-purple-500" />
            <span className="text-sm font-medium">Gesamt</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{totalCards}</div>
          <div className="text-xs text-gray-400 mt-1">Karten in allen Stapeln</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">Fortschritt pro Stapel</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {decks.map(deck => {
            const count = deck.card_count || 0;
            const learned = deck.learned_count || 0;
            const percentage = count > 0 ? Math.round((learned / count) * 100) : 0;
            
            return (
              <div key={deck.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{deck.name}</span>
                  <span className="text-sm text-gray-500">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className={deck.due_count ? "text-amber-600 font-medium" : ""}>
                    {deck.due_count || 0} fällig
                  </span>
                  <span>{deck.new_count || 0} neu</span>
                  <span>{deck.learned_count || 0} gelernt</span>
                </div>
              </div>
            );
          })}
          {decks.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">
              Keine Stapel vorhanden.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};