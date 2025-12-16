import React from 'react';
import { Deck } from '../types';
import { BarChart3, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StudyOverviewProps {
  decks: Deck[];
}

export const StudyOverview: React.FC<StudyOverviewProps> = ({ decks }) => {
  const { t } = useLanguage();
  const totalCards = decks.reduce((acc, d) => acc + (d.card_count || 0), 0);
  const totalDue = decks.reduce((acc, d) => acc + (d.due_count || 0), 0);
  const totalNew = decks.reduce((acc, d) => acc + (d.new_count || 0), 0);
  const totalLearned = decks.reduce((acc, d) => acc + (d.learned_count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('stats.title')}</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <Clock size={16} className="mr-2 text-amber-500" />
            <span className="text-sm font-medium">{t('stats.due')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{totalDue}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('stats.due_desc')}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <CheckCircle2 size={16} className="mr-2 text-green-500" />
            <span className="text-sm font-medium">{t('stats.learned')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{totalLearned}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('stats.learned_desc')}</div>
        </div>

         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <Circle size={16} className="mr-2 text-blue-500" />
            <span className="text-sm font-medium">{t('stats.new')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{totalNew}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('stats.new_desc')}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <BarChart3 size={16} className="mr-2 text-purple-500" />
            <span className="text-sm font-medium">{t('stats.total')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{totalCards}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('stats.total_desc')}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('stats.progress')}</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {decks.map(deck => {
            const count = deck.card_count || 0;
            const learned = deck.learned_count || 0;
            const percentage = count > 0 ? Math.round((learned / count) * 100) : 0;
            
            return (
              <div key={deck.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{deck.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className={deck.due_count ? "text-amber-600 dark:text-amber-500 font-medium" : ""}>
                    {deck.due_count || 0} {t('deck.due')}
                  </span>
                  <span>{deck.new_count || 0} {t('stats.new')}</span>
                  <span>{deck.learned_count || 0} {t('stats.learned')}</span>
                </div>
              </div>
            );
          })}
          {decks.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              {t('deck.no_cards')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};