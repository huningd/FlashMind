import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Deck, Card } from './types';
import { DeckList } from './components/DeckList';
import { CardEditor } from './components/CardEditor';
import { StudySession } from './components/StudySession';
import { StudyOverview } from './components/StudyOverview';
import { AIGenerator } from './components/AIGenerator';
import { Settings } from './components/Settings';
import { Plus, Trash, ArrowLeft, RotateCw, Layers, BarChart3, Pencil, Sparkles, AlertTriangle, Moon, Sun, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

enum View {
  HOME,
  OVERVIEW,
  DECK_DETAIL,
  STUDY,
  SETTINGS
}

const App: React.FC = () => {
  const { t, language } = useLanguage();
  const [view, setView] = useState<View>(View.HOME);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        await refreshDecks();
      } catch (e: any) {
        console.error("DB Init error", e);
        setInitError(e.message || "Database failed to load");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refreshDecks = async () => {
    const d = await db.getDecks();
    setDecks(d);
  };

  const loadDeckDetails = async (deck: Deck) => {
    setSelectedDeck(deck);
    const c = await db.getCards(deck.id);
    setCards(c);
    setView(View.DECK_DETAIL);
  };

  const handleCardSaved = async () => {
    if (selectedDeck) {
      const c = await db.getCards(selectedDeck.id);
      setCards(c);
      await refreshDecks(); // Update counts
    }
  };

  const deleteCard = async (id: number) => {
    if (confirm(t('deck.delete_confirm'))) {
      await db.deleteCard(id);
      if (selectedDeck) {
        const c = await db.getCards(selectedDeck.id);
        setCards(c);
        await refreshDecks();
      }
    }
  };

  const openEditor = (card?: Card) => {
    if (card) {
      setEditingCard(card);
    } else {
      setEditingCard(null);
    }
    setIsEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
         <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('app.loading')}</p>
         </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-900/20 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('app.error.init')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('app.reload')}
          </button>
        </div>
      </div>
    );
  }

  // Study View (Fullscreen)
  if (view === View.STUDY && selectedDeck) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-2 sm:p-4">
        <StudySession 
          deckId={selectedDeck.id} 
          onFinish={() => {
            refreshDecks();
            setView(View.HOME);
          }} 
        />
      </div>
    );
  }

  // Main Layout for Home, Overview and Detail
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {(view === View.DECK_DETAIL || view === View.SETTINGS) && (
                 <button onClick={() => setView(View.HOME)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                    <ArrowLeft size={24} />
                 </button>
             )}
             <h1 className="text-xl font-bold text-primary">{t('app.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            {view === View.DECK_DETAIL && (
               <button onClick={() => setView(View.STUDY)} className="hidden sm:block text-primary font-medium hover:text-indigo-700 dark:hover:text-indigo-400 mr-2">
                  {t('deck.learn_now')}
               </button>
            )}
            <button 
              onClick={() => setView(View.SETTINGS)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors ${view === View.SETTINGS ? 'text-primary dark:text-primary bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
              title={t('nav.settings')}
            >
              <SettingsIcon size={20} />
            </button>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {view === View.HOME && (
          <DeckList 
            decks={decks} 
            onSelectDeck={loadDeckDetails} 
            onRefresh={refreshDecks} 
          />
        )}

        {view === View.OVERVIEW && (
          <StudyOverview decks={decks} />
        )}
        
        {view === View.SETTINGS && (
          <Settings onClose={() => setView(View.HOME)} />
        )}

        {view === View.DECK_DETAIL && selectedDeck && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">{selectedDeck.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{cards.length} {t('deck.count_cards')}</p>
              </div>
              <button 
                onClick={() => setView(View.STUDY)}
                className="w-full sm:w-auto bg-primary hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-md transition-colors flex items-center justify-center"
              >
                <RotateCw size={18} className="mr-2" /> {t('deck.learn_now')}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 gap-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('deck.list_title')}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAIGeneratorOpen(true)}
                    className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg transition-all flex items-center shadow-sm"
                  >
                    <Sparkles size={16} className="mr-1" /> {t('deck.ai_generator')}
                  </button>
                  <button 
                    onClick={() => openEditor()}
                    className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary text-gray-600 dark:text-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-sm"
                  >
                    <Plus size={16} className="mr-1" /> {t('deck.add_card')}
                  </button>
                </div>
              </div>
              
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {cards.map(card => (
                  <li key={card.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center group">
                    <div className="flex-1 pr-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">{card.front_text || `(${t('deck.image_label')})`}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{card.back_text || `(${t('deck.image_label')})`}</div>
                    </div>
                    <div className="flex items-center gap-1">
                         {card.front_image && <span className="text-xs bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded mr-2">{t('deck.image_label')}</span>}
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(card);
                            }}
                            className="text-gray-300 dark:text-gray-500 hover:text-primary dark:hover:text-primary p-2 transition-colors"
                        >
                            <Pencil size={16} />
                        </button>
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCard(card.id);
                            }}
                            className="text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors"
                        >
                            <Trash size={16} />
                        </button>
                    </div>
                  </li>
                ))}
                {cards.length === 0 && (
                    <li className="p-8 text-center text-gray-400 dark:text-gray-500">
                        {t('deck.no_cards')}
                    </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Top Level Views */}
      {(view === View.HOME || view === View.OVERVIEW) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 flex justify-around z-20 transition-colors">
          <button 
            onClick={() => setView(View.HOME)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${view === View.HOME ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Layers size={24} />
            <span className="text-xs font-medium mt-1">{t('nav.decks')}</span>
          </button>
          <button 
            onClick={() => setView(View.OVERVIEW)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${view === View.OVERVIEW ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <BarChart3 size={24} />
            <span className="text-xs font-medium mt-1">{t('nav.stats')}</span>
          </button>
        </div>
      )}

      {/* Card Editor Modal */}
      {isEditorOpen && selectedDeck && (
        <CardEditor 
          deckId={selectedDeck.id} 
          cardToEdit={editingCard}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingCard(null);
          }} 
          onSaved={handleCardSaved}
        />
      )}

      {/* AI Generator Modal */}
      {isAIGeneratorOpen && selectedDeck && (
        <AIGenerator
          deckId={selectedDeck.id}
          deckDescription={selectedDeck.description}
          onClose={() => setIsAIGeneratorOpen(false)}
          onSaved={handleCardSaved}
        />
      )}
    </div>
  );
};

export default App;