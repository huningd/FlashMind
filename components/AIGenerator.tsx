import React, { useState } from 'react';
import { generateFlashcardsFromImage, generateFlashcardsFromText, AI_Flashcard } from '../services/ai';
import { db } from '../services/db';
import { X, Upload, Sparkles, Check, Loader2, AlertCircle, Type, ImageIcon, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AIGeneratorProps {
  deckId: number;
  deckDescription?: string;
  onClose: () => void;
  onSaved: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ deckId, deckDescription, onClose, onSaved }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [mode, setMode] = useState<'text' | 'image'>('text');
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  
  // Text State
  const [textPrompt, setTextPrompt] = useState('');
  
  // Shared State
  const [generatedCards, setGeneratedCards] = useState<AI_Flashcard[]>([]);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setMimeType(file.type);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setStep('generating');
    setError(null);
    
    try {
      let cards: AI_Flashcard[] = [];
      
      if (mode === 'image') {
        if (!imageBase64) throw new Error(t('ai.error.no_image'));
        cards = await generateFlashcardsFromImage(imageBase64, mimeType, imagePrompt);
      } else {
        if (!textPrompt.trim()) throw new Error(t('ai.error.no_text'));
        cards = await generateFlashcardsFromText(textPrompt, deckDescription);
      }

      setGeneratedCards(cards);
      setSelectedCards(new Set(cards.map((_, i) => i)));
      setStep('preview');
    } catch (err: any) {
      console.error(err);
      // Try to match specific error messages or fallback
      let errorMessage = t('ai.error.gen');
      if (err.message && (err.message.includes('API Key') || err.message.includes('API key'))) {
        errorMessage = t('ai.error.key');
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setStep('input');
    }
  };

  const toggleCardSelection = (index: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCards(newSelected);
  };

  const handleSaveToDeck = async () => {
    const cardsToSave = generatedCards.filter((_, i) => selectedCards.has(i));
    
    for (const card of cardsToSave) {
      await db.createCard({
        deck_id: deckId,
        front_text: card.front,
        back_text: card.back,
      });
    }
    
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 sm:p-4">
      {/* Full screen on mobile (rounded-none, h-full), centered on sm */}
      <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:max-w-2xl shadow-2xl flex flex-col transition-all">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800 shrink-0 sm:rounded-t-2xl">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Sparkles size={20} />
            <h2 className="text-xl font-bold">{t('ai.title')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {step === 'input' && (
            <div className="space-y-6">
              {/* Mode Tabs */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={() => setMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    mode === 'text' ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Type size={16} />
                  {t('ai.mode.text')}
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    mode === 'image' ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <ImageIcon size={16} />
                  {t('ai.mode.image')}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Text Mode */}
              {mode === 'text' && (
                <div className="space-y-4">
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex gap-2 items-start">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      {t('ai.info.text')}
                      {deckDescription && (
                        <div className="mt-1 font-medium opacity-80">
                           {t('ai.info.context')}: "{deckDescription}"
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <textarea
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl p-4 h-48 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-base"
                    placeholder={t('ai.placeholder.text')}
                    autoFocus
                  />
                </div>
              )}

              {/* Image Mode */}
              {mode === 'image' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                    {t('ai.info.image')}
                  </div>

                  <div className="flex flex-col items-center">
                    {!imagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{t('editor.upload')}</span></p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    ) : (
                      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                        <img src={imagePreview} alt="Upload" className="w-full max-h-64 object-contain bg-gray-50 dark:bg-gray-900" />
                        <button 
                          onClick={() => { setImageFile(null); setImagePreview(null); setImageBase64(null); }}
                          className="absolute top-2 right-2 bg-white/90 text-gray-700 p-2 rounded-full shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('ai.prompt.image')}</label>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl p-3 h-20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-sm"
                      placeholder="z.B. Erstelle nur Vokabeln, fasse den Text zusammen..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <Loader2 className="relative text-primary animate-spin" size={48} />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">
                {mode === 'image' ? t('ai.analyzing') : t('ai.generating')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('ai.wait')}</p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-semibold text-gray-800 dark:text-white">{t('ai.found')} ({generatedCards.length})</h3>
                 <button 
                   onClick={() => setStep('input')}
                   className="text-xs text-primary hover:underline"
                 >
                   {t('ai.restart')}
                 </button>
               </div>
               
               {generatedCards.length === 0 ? (
                 <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                   {t('ai.no_cards')}
                 </div>
               ) : (
                 <div className="space-y-3">
                   {generatedCards.map((card, idx) => (
                     <div 
                       key={idx} 
                       onClick={() => toggleCardSelection(idx)}
                       className={`p-4 rounded-xl border cursor-pointer transition-all ${
                         selectedCards.has(idx) 
                           ? 'border-primary bg-indigo-50/50 dark:bg-indigo-900/30 ring-1 ring-primary' 
                           : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 opacity-60'
                       }`}
                     >
                       <div className="flex items-start gap-3">
                         <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                           selectedCards.has(idx) ? 'bg-primary border-primary text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                         }`}>
                           {selectedCards.has(idx) && <Check size={12} />}
                         </div>
                         <div className="flex-1 space-y-2">
                           <div>
                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('editor.front')}</span>
                             <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">{card.front}</p>
                           </div>
                           <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('editor.back')}</span>
                             <p className="text-gray-600 dark:text-gray-300 text-sm">{card.back}</p>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800 shrink-0 sm:rounded-b-2xl">
          {step === 'input' && (
            <button
              onClick={handleGenerate}
              disabled={mode === 'image' ? !imageBase64 : !textPrompt.trim()}
              className="flex items-center gap-2 bg-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium shadow-md transition-all"
            >
              <Sparkles size={18} />
              {t('ai.generate_btn')}
            </button>
          )}
          
          {step === 'preview' && (
            <>
               <button
                onClick={() => onClose()}
                className="text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors"
              >
                {t('deck.cancel')}
              </button>
              <button
                onClick={handleSaveToDeck}
                disabled={selectedCards.size === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium shadow-md transition-colors"
              >
                {selectedCards.size} {t('ai.save_selected')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};