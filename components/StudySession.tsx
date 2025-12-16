import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { db } from '../services/db';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StudySessionProps {
  deckId: number;
  onFinish: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ deckId, onFinish }) => {
  const { t } = useLanguage();
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
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <RotateCw className="animate-spin mb-2" size={32} />
        <p>{t('study.loading')}</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-full mb-4">
          <RotateCw size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('study.done.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
          {t('study.done.desc')}
        </p>
        <button 
          onClick={onFinish}
          className="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-md transition-colors"
        >
          {t('study.back_overview')}
        </button>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('study.finish.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('study.finish.desc')}</p>
        <button 
          onClick={onFinish}
          className="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-md transition-colors"
        >
          {t('study.finish_btn')}
        </button>
      </div>
    );
  }

  const currentCard = queue[currentIndex];
  const progress = ((currentIndex) / queue.length) * 100;

  return (
    <div className="max-w-xl mx-auto h-full flex flex-col justify-between pb-safe">
      {/* Header with Progress */}
      <div className="mb-4 flex items-center justify-between shrink-0 pt-2">
        <button onClick={onFinish} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* The Flashcard */}
      <div className="flex-1 perspective-1000 relative min-h-[300px] flex flex-col">
        <div 
            onClick={() => !isFlipped && setIsFlipped(true)}
            className={`w-full flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${!isFlipped ? 'hover:shadow-2xl' : ''}`}
        >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 self-center">
                    {isFlipped ? t('study.answer') : t('study.question')}
                </p>
                
                {/* Content */}
                <div className="text-center w-full space-y-4 sm:space-y-6">
                    {imageUrl && (
                        <img 
                            src={imageUrl} 
                            alt="Card visual" 
                            className="max-h-48 sm:max-h-64 max-w-full mx-auto rounded-lg shadow-sm object-contain bg-gray-50 dark:bg-gray-900"
                        />
                    )}
                    <p className="text-xl sm:text-3xl font-medium text-gray-800 dark:text-gray-100 break-words px-2 sm:px-4">
                        {isFlipped ? currentCard.back_text : currentCard.front_text}
                    </p>
                </div>
            </div>
            
            {!isFlipped && (
                <div className="mt-8 text-gray-400 dark:text-gray-600 text-sm animate-pulse text-center">
                    {t('study.flip')}
                </div>
            )}
        </div>
      </div>

      {/* Controls */}
      <div className="h-auto min-h-[5rem] mt-4 shrink-0">
        {isFlipped ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 h-full pb-2">
                <button 
                    onClick={() => handleRate(1)}
                    className="flex flex-col items-center justify-center bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl transition-colors py-2 sm:py-0"
                >
                    <span className="font-bold text-sm sm:text-lg">{t('study.again')}</span>
                    <span className="text-[10px] sm:text-xs opacity-75">&lt; 10m</span>
                </button>
                <button 
                    onClick={() => handleRate(2)}
                    className="flex flex-col items-center justify-center bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-xl transition-colors py-2 sm:py-0"
                >
                    <span className="font-bold text-sm sm:text-lg">{t('study.hard')}</span>
                    <span className="text-[10px] sm:text-xs opacity-75">2d</span>
                </button>
                <button 
                    onClick={() => handleRate(3)}
                    className="flex flex-col items-center justify-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl transition-colors py-2 sm:py-0"
                >
                    <span className="font-bold text-sm sm:text-lg">{t('study.good')}</span>
                    <span className="text-[10px] sm:text-xs opacity-75">4d</span>
                </button>
                <button 
                    onClick={() => handleRate(4)}
                    className="flex flex-col items-center justify-center bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-xl transition-colors py-2 sm:py-0"
                >
                    <span className="font-bold text-sm sm:text-lg">{t('study.easy')}</span>
                    <span className="text-[10px] sm:text-xs opacity-75">7d</span>
                </button>
            </div>
        ) : (
             <div className="h-full"></div>
        )}
      </div>
    </div>
  );
};