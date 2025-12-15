import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { db } from '../services/db';
import { ArrowLeft, RotateCw } from 'lucide-react';

interface StudySessionProps {
  deckId: number;
  onFinish: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ deckId, onFinish }) => {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      const cards = await db.getDueCards(deckId);
      setQueue(cards);
      setLoading(false);
    };
    loadCards();
  }, [deckId]);

  // Convert BLOB to URL when card changes or side changes
  useEffect(() => {
    if (queue.length === 0 || currentIndex >= queue.length) return;
    
    const card = queue[currentIndex];
    const imageBlob = isFlipped ? card.back_image : card.front_image;
    
    if (imageBlob) {
      const blob = new Blob([imageBlob]);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [currentIndex, isFlipped, queue]);

  const handleRate = async (rating: number) => {
    if (currentIndex >= queue.length) return;
    
    const card = queue[currentIndex];
    await db.reviewCard(card.id, rating);
    
    // Move to next card
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <RotateCw className="animate-spin mb-2" size={32} />
        <p>Lade Karten...</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
          <RotateCw size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Alles erledigt!</h2>
        <p className="text-gray-600 mb-8 max-w-sm">
          Du hast alle fälligen Karten für diesen Stapel gelernt. Komm später wieder zurück!
        </p>
        <button 
          onClick={onFinish}
          className="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-md transition-colors"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🎉 Sitzung beendet!</h2>
        <p className="text-gray-600 mb-8">Gute Arbeit.</p>
        <button 
          onClick={onFinish}
          className="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-md transition-colors"
        >
          Fertig
        </button>
      </div>
    );
  }

  const currentCard = queue[currentIndex];
  const progress = ((currentIndex) / queue.length) * 100;

  return (
    <div className="max-w-xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      {/* Header with Progress */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onFinish} className="text-gray-500 hover:text-gray-800 p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* The Flashcard */}
      <div className="flex-1 perspective-1000 relative">
        <div 
            onClick={() => !isFlipped && setIsFlipped(true)}
            className={`w-full h-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${!isFlipped ? 'hover:shadow-2xl' : ''}`}
            style={{ minHeight: '400px' }}
        >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                    {isFlipped ? 'Antwort' : 'Frage'}
                </p>
                
                {/* Content */}
                <div className="text-center w-full space-y-6">
                    {imageUrl && (
                        <img 
                            src={imageUrl} 
                            alt="Card visual" 
                            className="max-h-48 max-w-full mx-auto rounded-lg shadow-sm object-contain"
                        />
                    )}
                    <p className="text-2xl sm:text-3xl font-medium text-gray-800 break-words px-4">
                        {isFlipped ? currentCard.back_text : currentCard.front_text}
                    </p>
                </div>
            </div>
            
            {!isFlipped && (
                <div className="mt-8 text-gray-400 text-sm animate-pulse">
                    Tippen zum Umdrehen
                </div>
            )}
        </div>
      </div>

      {/* Controls */}
      <div className="h-24 mt-6">
        {isFlipped ? (
            <div className="grid grid-cols-4 gap-3 h-full pb-2">
                <button 
                    onClick={() => handleRate(1)}
                    className="flex flex-col items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
                >
                    <span className="font-bold text-lg">Nochmal</span>
                    <span className="text-xs opacity-75">&lt; 10m</span>
                </button>
                <button 
                    onClick={() => handleRate(2)}
                    className="flex flex-col items-center justify-center bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl transition-colors"
                >
                    <span className="font-bold text-lg">Schwer</span>
                    <span className="text-xs opacity-75">2 Tage</span>
                </button>
                <button 
                    onClick={() => handleRate(3)}
                    className="flex flex-col items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                >
                    <span className="font-bold text-lg">Gut</span>
                    <span className="text-xs opacity-75">4 Tage</span>
                </button>
                <button 
                    onClick={() => handleRate(4)}
                    className="flex flex-col items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors"
                >
                    <span className="font-bold text-lg">Einfach</span>
                    <span className="text-xs opacity-75">7 Tage</span>
                </button>
            </div>
        ) : (
             <div className="h-full"></div>
        )}
      </div>
    </div>
  );
};