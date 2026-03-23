import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { db } from '../services/db';
import { ArrowLeft, RotateCw, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale === 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleEnd = () => setIsDragging(false);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center overflow-hidden touch-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={24} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={24} />
        </button>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          title="Close"
        >
          <X size={24} />
        </button>
      </div>

      <div 
        className={`relative ${!isDragging ? 'transition-transform duration-200 ease-out' : ''} ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'}`}
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img 
          src={url} 
          alt="Full screen" 
          className="max-w-[90vw] max-h-[90vh] object-contain select-none"
          draggable={false}
        />
      </div>
      
      {scale > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          Drag to pan • {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

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
    
    if (isFlipped) {
      if (card.back_image) {
        const blob = new Blob([card.back_image]);
        const url = URL.createObjectURL(blob);
        setImageUrls([url]);
        setCurrentImageIdx(0);
        return () => URL.revokeObjectURL(url);
      } else {
        setImageUrls([]);
      }
    } else {
      if (card.front_images && card.front_images.length > 0) {
        const urls = card.front_images.map(img => {
          const blob = new Blob([img]);
          return URL.createObjectURL(blob);
        });
        setImageUrls(urls);
        setCurrentImageIdx(0);
        return () => urls.forEach(url => URL.revokeObjectURL(url));
      } else {
        setImageUrls([]);
      }
    }
  }, [currentIndex, isFlipped, queue]);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx(prev => (prev + 1) % imageUrls.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleRate = async (rating: number) => {
    if (currentIndex >= queue.length) return;
    
    const card = queue[currentIndex];
    await db.reviewCard(card.id, rating);
    
    // Move to next card
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalUrl) return; // Disable shortcuts when modal is open

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(!isFlipped);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, queue, modalUrl]);

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
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${!isFlipped ? 'hover:shadow-2xl' : ''}`}
        >
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 self-center">
                    {isFlipped ? t('study.answer') : t('study.question')}
                </p>
                
                {/* Content */}
                <div className="text-center w-full space-y-4 sm:space-y-6 relative">
                    {imageUrls.length > 0 && (
                        <div className="relative group">
                            <div className="relative inline-block">
                                <img 
                                    src={imageUrls[currentImageIdx]} 
                                    alt="Card visual" 
                                    className="max-h-48 sm:max-h-64 max-w-full mx-auto rounded-lg shadow-sm object-contain bg-gray-50 dark:bg-gray-900 cursor-zoom-in"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModalUrl(imageUrls[currentImageIdx]);
                                    }}
                                />
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModalUrl(imageUrls[currentImageIdx]);
                                    }}
                                    className="absolute bottom-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                    title="Enlarge"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                            
                            {imageUrls.length > 1 && !isFlipped && (
                                <>
                                    <button 
                                        onClick={handlePrevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button 
                                        onClick={handleNextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                        {imageUrls.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIdx ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <p className="text-xl sm:text-3xl font-medium text-gray-800 dark:text-gray-100 break-words px-2 sm:px-4 whitespace-pre-wrap">
                        {isFlipped ? currentCard.back_text : currentCard.front_text}
                    </p>
                </div>
            </div>
            
            <div className="mt-8 text-gray-400 dark:text-gray-600 text-sm animate-pulse text-center">
                {t('study.flip')}
            </div>
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

      {modalUrl && (
        <ImageModal 
          url={modalUrl} 
          onClose={() => setModalUrl(null)} 
        />
      )}
    </div>
  );
};