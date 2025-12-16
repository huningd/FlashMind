import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DisclaimerProps {
  onClose: () => void;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ onClose }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 mb-4">
            <ShieldAlert size={32} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('disclaimer.title')}</h2>
          </div>
          
          <div className="text-gray-600 dark:text-gray-300 space-y-4 text-sm leading-relaxed whitespace-pre-wrap">
            {t('disclaimer.text')}
          </div>
          
          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full bg-primary hover:bg-indigo-700 text-white font-medium py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
            >
              {t('disclaimer.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};