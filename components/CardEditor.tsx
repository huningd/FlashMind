import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Card } from '../types';
import { X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CardEditorProps {
  deckId: number;
  onClose: () => void;
  onSaved: () => void;
  cardToEdit?: Card | null;
}

export const CardEditor: React.FC<CardEditorProps> = ({ deckId, onClose, onSaved, cardToEdit }) => {
  const { t } = useLanguage();
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontImage, setFrontImage] = useState<Uint8Array | null>(null);
  const [backImage, setBackImage] = useState<Uint8Array | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  // Initialize form if editing an existing card
  useEffect(() => {
    if (cardToEdit) {
      setFrontText(cardToEdit.front_text);
      setBackText(cardToEdit.back_text);
      setFrontImage(cardToEdit.front_image || null);
      setBackImage(cardToEdit.back_image || null);

      if (cardToEdit.front_image) {
        const blob = new Blob([cardToEdit.front_image]);
        setFrontPreview(URL.createObjectURL(blob));
      }
      if (cardToEdit.back_image) {
        const blob = new Blob([cardToEdit.back_image]);
        setBackPreview(URL.createObjectURL(blob));
      }
    }
    
    // Cleanup preview URLs on unmount
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [cardToEdit]); // Run only when cardToEdit changes

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array]);
      const previewUrl = URL.createObjectURL(blob);

      if (side === 'front') {
        setFrontImage(uint8Array);
        setFrontPreview(previewUrl);
      } else {
        setBackImage(uint8Array);
        setBackPreview(previewUrl);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setFrontPreview(null);
    } else {
      setBackImage(null);
      setBackPreview(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontText.trim() && !frontImage) return; // Need at least something on front

    if (cardToEdit) {
      // Update existing card
      await db.updateCard({
        ...cardToEdit,
        front_text: frontText,
        front_image: frontImage,
        back_text: backText,
        back_image: backImage
      });
      onSaved();
      onClose(); // Close modal immediately after edit
    } else {
      // Create new card
      await db.createCard({
        deck_id: deckId,
        front_text: frontText,
        front_image: frontImage,
        back_text: backText,
        back_image: backImage
      });

      onSaved();
      // Reset form for next card (keep modal open)
      setFrontText('');
      setBackText('');
      setFrontImage(null);
      setBackImage(null);
      setFrontPreview(null);
      setBackPreview(null);
      setActiveSide('front');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 sm:p-4">
      {/* Full screen on mobile (rounded-none, h-full), centered card on sm */}
      <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:max-w-lg shadow-2xl flex flex-col transition-all">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {cardToEdit ? t('editor.edit_title') : t('editor.create_title')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeSide === 'front' ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {t('editor.front')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeSide === 'back' ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {t('editor.back')}
            </button>
          </div>

          <form id="cardForm" onSubmit={handleSave} className="space-y-4">
            <div className={activeSide === 'front' ? 'block' : 'hidden'}>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('editor.text_front_label')}</label>
               <textarea
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder={t('editor.placeholder_front')}
              />
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('editor.image_label')}</label>
                {!frontPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('editor.upload')}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img src={frontPreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage('front')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={activeSide === 'back' ? 'block' : 'hidden'}>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('editor.text_back_label')}</label>
               <textarea
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder={t('editor.placeholder_back')}
              />
               <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('editor.image_label')}</label>
                {!backPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('editor.upload')}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                    <img src={backPreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage('back')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between gap-3 shrink-0 bg-white dark:bg-gray-800 sm:rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium py-2.5 rounded-xl transition-colors"
          >
            {t('editor.done')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 text-white bg-primary hover:bg-indigo-700 font-medium py-2.5 rounded-xl shadow-md transition-colors"
          >
            {cardToEdit ? t('editor.save') : t('editor.save_next')}
          </button>
        </div>
      </div>
    </div>
  );
};