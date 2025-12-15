import React, { useState, useRef } from 'react';
import { db } from '../services/db';
import { X, Image as ImageIcon, Trash2 } from 'lucide-react';

interface CardEditorProps {
  deckId: number;
  onClose: () => void;
  onSaved: () => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({ deckId, onClose, onSaved }) => {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontImage, setFrontImage] = useState<Uint8Array | null>(null);
  const [backImage, setBackImage] = useState<Uint8Array | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

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

    await db.createCard({
      deck_id: deckId,
      front_text: frontText,
      front_image: frontImage,
      back_text: backText,
      back_image: backImage
    });

    onSaved();
    // Reset form for next card
    setFrontText('');
    setBackText('');
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview(null);
    setBackPreview(null);
    setActiveSide('front');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Neue Karte erstellen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeSide === 'front' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Vorderseite
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeSide === 'back' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Rückseite
            </button>
          </div>

          <form id="cardForm" onSubmit={handleSave} className="space-y-4">
            <div className={activeSide === 'front' ? 'block' : 'hidden'}>
               <label className="block text-sm font-medium text-gray-700 mb-2">Text (Vorderseite)</label>
               <textarea
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder="Was möchtest du lernen?"
              />
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bild (Optional)</label>
                {!frontPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Bild hochladen</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
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
               <label className="block text-sm font-medium text-gray-700 mb-2">Text (Rückseite)</label>
               <textarea
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                placeholder="Die Antwort..."
              />
               <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bild (Optional)</label>
                {!backPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Bild hochladen</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
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

        <div className="p-4 border-t border-gray-100 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium py-2.5 rounded-xl transition-colors"
          >
            Fertig
          </button>
          <button
            onClick={handleSave}
            className="flex-1 text-white bg-primary hover:bg-indigo-700 font-medium py-2.5 rounded-xl shadow-md transition-colors"
          >
            Speichern & Nächste
          </button>
        </div>
      </div>
    </div>
  );
};