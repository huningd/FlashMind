import React, { useState, useEffect, useRef } from 'react';
import { Save, Key, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Globe, Download, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { t, language, setLanguage, availableLanguages, exportLanguage, importLanguage } = useLanguage();
  
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const local = localStorage.getItem('custom_api_key');
    if (local) {
      setSavedKey(local);
      setApiKey(local);
    }
    if (process.env.API_KEY) {
      setHasEnvKey(true);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    localStorage.setItem('custom_api_key', apiKey.trim());
    setSavedKey(apiKey.trim());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('custom_api_key');
    setSavedKey(null);
    setApiKey('');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const success = await importLanguage(content);
      if (success) {
        alert(t('settings.import_success'));
      } else {
        alert(t('settings.import_error'));
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('settings.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
          <Globe className="text-primary" size={20} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('settings.lang_config')}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.lang_select')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 pt-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />
            <button
              onClick={exportLanguage}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Upload size={18} />
              {t('settings.export_lang')}
            </button>
            <button
              onClick={handleImportClick}
              className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Download size={18} />
              {t('settings.import_lang')}
            </button>
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-2">
          <ShieldCheck className="text-primary" size={20} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('settings.ai_config')}</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('settings.ai_desc')}
          </p>

          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            {t('settings.status')}
          </div>

          <div className="flex flex-col gap-3">
             {savedKey ? (
               <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                 <CheckCircle2 size={18} />
                 <span className="text-sm font-medium">{t('settings.key_custom')}</span>
               </div>
             ) : hasEnvKey ? (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                 <CheckCircle2 size={18} />
                 <span className="text-sm font-medium">{t('settings.key_env')}</span>
               </div>
             ) : (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                 <AlertTriangle size={18} />
                 <span className="text-sm font-medium">{t('settings.key_none')}</span>
               </div>
             )}
          </div>

          <form onSubmit={handleSave} className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.key_label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10 w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                placeholder="AIzaSy..."
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t('settings.key_local_info')}
            </p>

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={!apiKey.trim() || apiKey === savedKey}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                {showSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {showSuccess ? t('settings.saved') : t('settings.save')}
              </button>
              
              {savedKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                  <Trash2 size={18} />
                  {t('settings.remove')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <div className="text-center pt-8">
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {t('settings.back')}
          </button>
      </div>
    </div>
  );
};