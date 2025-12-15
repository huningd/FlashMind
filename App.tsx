import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Deck, Card } from './types';
import { DeckList } from './components/DeckList';
import { CardEditor } from './components/CardEditor';
import { StudySession } from './components/StudySession';
import { StudyOverview } from './components/StudyOverview';
import { Plus, Trash, ArrowLeft, RotateCw, Layers, BarChart3, Pencil } from 'lucide-react';

enum View {
  HOME,
  OVERVIEW,
  DECK_DETAIL,
  STUDY
}

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.HOME);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        await refreshDecks();
      } catch (e) {
        console.error("DB Init error", e);
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
    if (confirm("Karte löschen?")) {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
         <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Lade Datenbank...</p>
         </div>
      </div>
    );
  }

  // Study View (Fullscreen)
  if (view === View.STUDY && selectedDeck) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
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
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {view === View.DECK_DETAIL && (
                 <button onClick={() => setView(View.HOME)} className="p-1 rounded-full hover:bg-gray-100 text-gray-600">
                    <ArrowLeft size={24} />
                 </button>
             )}
             <h1 className="text-xl font-bold text-primary">FlashMind</h1>
          </div>
          {view === View.DECK_DETAIL && (
             <button onClick={() => setView(View.STUDY)} className="text-primary font-medium hover:text-indigo-700">
                Jetzt lernen
             </button>
          )}
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

        {view === View.DECK_DETAIL && selectedDeck && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{selectedDeck.name}</h2>
                <p className="text-gray-500 mt-1">{cards.length} Karten gesamt</p>
              </div>
              <button 
                onClick={() => setView(View.STUDY)}
                className="bg-primary hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-md transition-colors flex items-center"
              >
                <RotateCw size={18} className="mr-2" /> Lernen
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-700">Kartenliste</h3>
                <button 
                  onClick={() => openEditor()}
                  className="text-sm bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-600 px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-sm"
                >
                  <Plus size={16} className="mr-1" /> Karte hinzufügen
                </button>
              </div>
              
              <ul className="divide-y divide-gray-100">
                {cards.map(card => (
                  <li key={card.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                    <div className="flex-1 pr-4">
                      <div className="font-medium text-gray-800 mb-1 line-clamp-1">{card.front_text || '(Bild)'}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{card.back_text || '(Bild)'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                         {card.front_image && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded mr-2">Bild</span>}
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(card);
                            }}
                            className="text-gray-300 hover:text-primary p-2 transition-colors"
                            title="Bearbeiten"
                        >
                            <Pencil size={16} />
                        </button>
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCard(card.id);
                            }}
                            className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                            title="Löschen"
                        >
                            <Trash size={16} />
                        </button>
                    </div>
                  </li>
                ))}
                {cards.length === 0 && (
                    <li className="p-8 text-center text-gray-400">
                        Noch keine Karten in diesem Stapel.
                    </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Top Level Views */}
      {(view === View.HOME || view === View.OVERVIEW) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-around z-20">
          <button 
            onClick={() => setView(View.HOME)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${view === View.HOME ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Layers size={24} />
            <span className="text-xs font-medium mt-1">Stapel</span>
          </button>
          <button 
            onClick={() => setView(View.OVERVIEW)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors w-20 ${view === View.OVERVIEW ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BarChart3 size={24} />
            <span className="text-xs font-medium mt-1">Statistik</span>
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
    </div>
  );
};

export default App;