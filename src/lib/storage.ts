export interface DictionaryEntry {
  id: string;
  word: string;
  translation: string;
  context: string;
  source_url: string;
  created_at: string;
}

export interface SavedArticle {
  id: string;
  title: string;
  source: string;
  type: 'pdf' | 'url' | 'manual';
  created_at: string;
}

const STORAGE_KEYS = {
  DICTIONARY: 'lingoreader_dictionary',
  SAVED_ARTICLES: 'lingoreader_saved_articles',
  USER_PROFILE: 'lingoreader_user_profile',
  SETTINGS: 'lingoreader_settings',
  USAGE_STATS: 'lingoreader_usage_stats',
  TRANSLATION_CACHE: 'lingoreader_translation_cache',
};

export interface UserProfile {
  name: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  backgroundColor: string;
}

export interface UsageSession {
  date: string; // ISO date
  duration: number; // minutes
}

export const storage = {
  // ... existing methods ...
  
  // Profile methods
  getProfile: (): UserProfile => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : { name: 'Пользователь' };
  },
  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  // Settings methods
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { theme: 'light', backgroundColor: '#ffffff' };
  },
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    // Apply theme to document
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Usage stats methods
  getUsageStats: (): UsageSession[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USAGE_STATS);
    return data ? JSON.parse(data) : [];
  },
  trackSession: (minutes: number) => {
    const stats = storage.getUsageStats();
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = stats.findIndex(s => s.date === today);
    
    if (existingIndex > -1) {
      stats[existingIndex].duration += minutes;
    } else {
      stats.push({ date: today, duration: minutes });
    }
    
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(stats));
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  },

  // Dictionary methods
  getDictionary: (): DictionaryEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DICTIONARY);
    return data ? JSON.parse(data) : [];
  },
  saveToDictionary: (entry: Omit<DictionaryEntry, 'id' | 'created_at'>) => {
    const dictionary = storage.getDictionary();
    const newEntry: DictionaryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.DICTIONARY, JSON.stringify([newEntry, ...dictionary]));
    return newEntry;
  },
  removeFromDictionary: (id: string) => {
    const dictionary = storage.getDictionary();
    localStorage.setItem(STORAGE_KEYS.DICTIONARY, JSON.stringify(dictionary.filter(e => e.id !== id)));
  },

  // Saved articles methods
  getSavedArticles: (): SavedArticle[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_ARTICLES);
    return data ? JSON.parse(data) : [];
  },
  saveArticle: (article: Omit<SavedArticle, 'id' | 'created_at'>) => {
    const articles = storage.getSavedArticles();
    const newArticle: SavedArticle = {
      ...article,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.SAVED_ARTICLES, JSON.stringify([newArticle, ...articles]));
    return newArticle;
  },
  removeArticle: (id: string) => {
    const articles = storage.getSavedArticles();
    localStorage.setItem(STORAGE_KEYS.SAVED_ARTICLES, JSON.stringify(articles.filter(a => a.id !== id)));
  },

  // Translation cache methods
  getCachedTranslation: (text: string, langCode: string): string | null => {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSLATION_CACHE) || '{}');
    const key = `${text.trim()}_${langCode}`;
    return cache[key] || null;
  },
  saveToTranslationCache: (text: string, langCode: string, translation: string) => {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSLATION_CACHE) || '{}');
    const key = `${text.trim()}_${langCode}`;
    cache[key] = translation;
    
    // Limit cache size to avoid localStorage overflow (keep last 500 entries)
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      delete cache[keys[0]];
    }
    
    localStorage.setItem(STORAGE_KEYS.TRANSLATION_CACHE, JSON.stringify(cache));
  },
};
