import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { storage } from '@/src/lib/storage';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Bookmark, 
  Languages, 
  Share2, 
  Save, 
  Layout, 
  Columns, 
  Plus, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Maximize2,
  Minimize2,
  Volume2,
  Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Type, Minus, Plus as PlusIcon } from 'lucide-react';
import ManualInputModal from '@/src/components/ManualInputModal';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ArticleContent {
  title: string;
  content: string;
  excerpt?: string;
  siteName?: string;
}

const LANGUAGES = [
  { code: 'ru', name: 'Русский', promptName: 'Russian' },
  { code: 'en', name: 'English', promptName: 'English' },
  { code: 'kk', name: 'Қазақша', promptName: 'Kazakh' },
  { code: 'zh', name: '中文', promptName: 'Chinese' },
  { code: 'es', name: 'Español', promptName: 'Spanish' },
  { code: 'ar', name: 'العربية', promptName: 'Arabic' },
];

interface ParagraphTranslationProps {
  pIdx: number;
  originalText: string;
  targetLang: any;
  onTranslate: (text: string, lang: any, idx: number) => void;
  translation?: string;
  isLoading?: boolean;
  error?: string;
  hoveredSentenceIndex: number | null;
  onHoverSentence: (idx: number | null) => void;
  fontSize: number;
}

// Paragraph component for lazy translation
const ParagraphTranslation: React.FC<ParagraphTranslationProps> = ({ 
  pIdx, 
  originalText, 
  targetLang, 
  onTranslate, 
  translation, 
  isLoading, 
  error,
  hoveredSentenceIndex,
  onHoverSentence,
  fontSize
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasRequested = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !translation && !isLoading && !hasRequested.current) {
          hasRequested.current = true;
          onTranslate(originalText, targetLang, pIdx);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [originalText, targetLang, translation, isLoading, pIdx, onTranslate]);

  // Reset request flag if language changes
  useEffect(() => {
    hasRequested.current = false;
  }, [targetLang.code]);

  return (
    <div 
      ref={ref} 
      className="min-h-[2em] cursor-pointer transition-all hover:bg-purple-50/50 rounded-lg p-2"
      onClick={() => !translation && !isLoading && onTranslate(originalText, targetLang, pIdx)}
      style={{ fontSize: `${fontSize}px` }}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-400 animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs italic">Загрузка перевода...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs italic">{error}</span>
        </div>
      ) : translation ? (
        <p>
          {translation.match(/[^.!?]+[.!?]+/g)?.map((sentence, sIdx) => {
            const globalIdx = pIdx * 100 + sIdx;
            return (
              <span 
                key={sIdx}
                className={`transition-colors duration-200 rounded-sm px-1 ${
                  hoveredSentenceIndex === globalIdx ? 'bg-purple-100/80' : ''
                }`}
                onMouseEnter={() => onHoverSentence(globalIdx)}
                onMouseLeave={() => onHoverSentence(null)}
              >
                {sentence}
              </span>
            );
          }) || translation}
        </p>
      ) : (
        <div className="flex items-center gap-2 text-zinc-300">
          <Languages className="h-3 w-3" />
          <span className="text-xs italic">Нажмите или прокрутите для перевода</span>
        </div>
      )}
    </div>
  );
}
export default function Reader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlParam = searchParams.get('url');
  
  const { type: initialType, source: initialSource, title: initialTitle, targetLang: passedTargetLang } = location.state || { type: 'url', source: '', title: '', targetLang: null };
  const type = urlParam ? 'url' : initialType;
  const source = urlParam || initialSource;
  
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(passedTargetLang || LANGUAGES[0]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [showParallel, setShowParallel] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number; sentence: string } | null>(null);
  const [originalFontSize, setOriginalFontSize] = useState(20);
  const [translationFontSize, setTranslationFontSize] = useState(18);
  
  // New state for lazy translation
  const [paragraphTranslations, setParagraphTranslations] = useState<{ [key: number]: string }>({});
  const [loadingParagraphs, setLoadingParagraphs] = useState<{ [key: number]: boolean }>({});
  const [errorParagraphs, setErrorParagraphs] = useState<{ [key: number]: string }>({});
  
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const startTime = useRef(Date.now());

  // Track usage time
  useEffect(() => {
    startTime.current = Date.now();
    
    return () => {
      const endTime = Date.now();
      const durationMs = endTime - startTime.current;
      const durationMinutes = Math.round(durationMs / 60000);
      if (durationMinutes > 0) {
        storage.trackSession(durationMinutes);
      }
    };
  }, []);

  // Text-to-Speech
  const handleTTS = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Basic language detection (very simple)
      const isCyrillic = /[а-яА-ЯёЁ]/.test(text);
      utterance.lang = isCyrillic ? 'ru-RU' : 'en-US';
      
      window.speechSynthesis.speak(utterance);
      toast.info("Озвучка запущена...");
    } else {
      toast.error("Ваш браузер не поддерживает озвучку текста.");
    }
  }, []);

  // Helper function for translation with detailed logging and caching
  const translateParagraph = useCallback(async (text: string, lang: typeof LANGUAGES[0], pIdx: number) => {
    // Check cache first
    const cached = storage.getCachedTranslation(text, lang.code);
    if (cached) {
      setParagraphTranslations(prev => ({ ...prev, [pIdx]: cached }));
      return;
    }

    setLoadingParagraphs(prev => ({ ...prev, [pIdx]: true }));
    setErrorParagraphs(prev => ({ ...prev, [pIdx]: '' }));
    
    try {
      // Add a small random delay to simulate human behavior and avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, to: lang.code })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка перевода на сервере");
      }
      
      const translatedText = data.text;
      setParagraphTranslations(prev => ({ ...prev, [pIdx]: translatedText }));
      storage.saveToTranslationCache(text, lang.code, translatedText);
    } catch (error: any) {
      console.error(`[Translation] Error for paragraph ${pIdx}:`, error);
      
      let userMessage = "Ошибка перевода";
      if (error.message?.includes("429") || error.message?.toLowerCase().includes("too many requests")) {
        userMessage = "Слишком много запросов, подождите 1 минуту или попробуйте позже";
      } else if (error.message?.includes("API key")) {
        userMessage = "Ошибка API ключа";
      }
      
      setErrorParagraphs(prev => ({ ...prev, [pIdx]: userMessage }));
      toast.error(userMessage);
    } finally {
      setLoadingParagraphs(prev => ({ ...prev, [pIdx]: false }));
    }
  }, [targetLang.code]);

  // Fetch content from API if URL
  useEffect(() => {
    if (type === 'url' && source) {
      setLoading(true);
      fetch(`/api/parse?url=${encodeURIComponent(source)}`)
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Ошибка загрузки статьи");
          return data;
        })
        .then(data => {
          setArticle(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("[Reader] Content extraction error:", err);
          toast.error(err.message);
          setLoading(false);
          // If it was a URL param and failed, maybe navigate back or show error state
        });
    } else if (type === 'pdf' && source) {
      setLoading(true);
      // Mock PDF loading
      setTimeout(() => {
        setArticle({
          title: source || "PDF Документ",
          content: "Это пример текста из вашего PDF документа. В реальном приложении мы бы использовали библиотеку для парсинга PDF, чтобы извлечь этот контент. Изучение нового языка — один из самых полезных опытов, который может получить человек. Оно открывает новые миры, новые перспективы и новые способы мышления. В прошлом изучение языка часто было утомительным процессом заучивания грамматических правил и списков слов. Но сегодня технологии меняют способ нашего обучения. С помощью искусственного интеллекта и умных инструментов для чтения мы можем учиться более эффективно и результативно, чем когда-либо прежде."
        });
        setLoading(false);
      }, 1500);
    } else if (type === 'manual' && source) {
      setLoading(true);
      setTimeout(() => {
        setArticle({
          title: initialTitle || "Вставленный текст",
          content: source
        });
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
    }
  }, [type, source]);

  // Synchronized scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>, target: 'left' | 'right') => {
    if (isScrolling.current) return;
    
    const sourceEl = e.currentTarget;
    const targetEl = target === 'left' ? leftRef.current : rightRef.current;
    
    if (targetEl) {
      isScrolling.current = true;
      const scrollRatio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
      targetEl.scrollTop = scrollRatio * (targetEl.scrollHeight - targetEl.clientHeight);
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    }
  }, []);

  // Text selection logic
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 0 && text.length < 100) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const fullText = sel.anchorNode?.parentElement?.innerText || "";
      const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
      const sentence = sentences.find(s => s.includes(text)) || text;

      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY,
        sentence: sentence.trim()
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  // Parallel translation logic - now just toggles visibility
  const handleTranslate = async (lang = targetLang) => {
    if (!article) return;
    
    setTargetLang(lang);
    setShowParallel(!showParallel);
    
    if (!showParallel) {
      toast.info(`Перевод на ${lang.name} активирован. Абзацы будут переводиться при прокрутке.`);
    }
  };

  // Save to dictionary
  const saveToDictionary = async () => {
    if (!selection) return;

    try {
      // Translate the selected word using Gemini
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the word "${selection.text}" to ${targetLang.name}. Provide only the translated word or short phrase, nothing else.`,
      });
      
      const translation = response.text?.trim() || "Перевод не найден";

      storage.saveToDictionary({
        word: selection.text,
        translation: translation,
        context: selection.sentence,
        source_url: source,
      });

      toast.success(`"${selection.text}" сохранено в словарь!`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setSelection(null);
    } catch (error) {
      console.error("Error translating word:", error);
      toast.error("Не удалось получить перевод слова.");
    }
  };

  const handleSaveArticle = () => {
    if (!article) return;
    storage.saveArticle({
      title: article.title,
      source: source,
      type: type,
    });
    toast.success("Статья сохранена в библиотеку!");
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col px-8 py-12">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <Skeleton className="h-12 w-3/4 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-5/6 rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
          </div>
          <div className="space-y-4 pt-8">
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-lg" />
          </div>
        </div>
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/80 p-8 backdrop-blur-sm shadow-xl dark:bg-zinc-900/80">
            <Loader2 className="h-10 w-10 animate-spin text-[#4B0082]" />
            <p className="text-sm font-medium text-zinc-500 animate-pulse">Загрузка контента...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-500`}>
      {/* Sticky Toolbar */}
      <AnimatePresence>
        {!isFocusMode && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="sticky top-0 z-50 border-b border-zinc-100 bg-white/40 px-4 py-2 backdrop-blur-xl dark:bg-zinc-900/40 min-[600px]:px-6 min-[600px]:py-3"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div className="flex items-center gap-2 min-[600px]:gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full hover:bg-purple-50"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-5 w-5 text-[#4B0082]" />
                </Button>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#BA55D3] min-[600px]:text-[10px]">Читалка</span>
                  <h1 className="max-w-[120px] truncate text-xs font-medium text-zinc-900 min-[600px]:max-w-[300px] min-[600px]:text-sm">{article?.title}</h1>
                </div>
              </div>

              {/* Desktop Controls */}
              <div className="hidden items-center gap-2 min-[600px]:flex">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-purple-50"
                  onClick={() => setIsManualInputOpen(true)}
                  title="Вставить новый текст"
                >
                  <Clipboard className="h-5 w-5 text-[#4B0082]" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-purple-50"
                  onClick={() => setIsFocusMode(true)}
                  title="Режим фокуса"
                >
                  <Maximize2 className="h-5 w-5 text-[#4B0082]" />
                </Button>

                <div className="flex items-center rounded-full border border-zinc-200 p-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 rounded-full px-3 text-xs font-medium text-[#4B0082] hover:bg-purple-50")}>
                      {targetLang.name}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-zinc-100">
                      {LANGUAGES.map((lang) => (
                        <DropdownMenuItem 
                          key={lang.code} 
                          className="rounded-lg focus:bg-purple-50 focus:text-[#4B0082]"
                          onClick={() => handleTranslate(lang)}
                        >
                          {lang.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant={showParallel ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 rounded-full transition-all ${showParallel ? 'bg-[#4B0082] text-white' : 'text-[#4B0082] hover:bg-purple-50'}`}
                    onClick={() => handleTranslate()}
                    disabled={translating}
                  >
                    {translating ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Columns className="mr-2 h-3 w-3" />
                    )}
                    {showParallel ? "Скрыть" : "Перевод"}
                  </Button>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-zinc-200 text-[#4B0082] hover:border-[#BA55D3] hover:bg-purple-50"
                  onClick={handleSaveArticle}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить
                </Button>

                <div className="h-6 w-px bg-zinc-200 mx-1"></div>

                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full hover:bg-purple-50")}>
                    <Type className="h-5 w-5 text-[#4B0082]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-xl border-zinc-100 p-4">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <span>Размер оригинала</span>
                          <span className="font-mono text-xs">{originalFontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="32" 
                          value={originalFontSize} 
                          onChange={(e) => setOriginalFontSize(parseInt(e.target.value))}
                          className="w-full accent-[#4B0082]"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <span>Размер перевода</span>
                          <span className="font-mono text-xs">{translationFontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="32" 
                          value={translationFontSize} 
                          onChange={(e) => setTranslationFontSize(parseInt(e.target.value))}
                          className="w-full accent-[#BA55D3]"
                        />
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-1 min-[600px]:hidden">
                <Button 
                  variant={showParallel ? "default" : "ghost"}
                  size="icon"
                  className={`h-9 w-9 rounded-full transition-all ${showParallel ? 'bg-[#4B0082] text-white' : 'text-[#4B0082] hover:bg-purple-50'}`}
                  onClick={() => handleTranslate()}
                  disabled={translating}
                >
                  {translating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Columns className="h-4 w-4" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 rounded-full text-[#4B0082] hover:bg-purple-50")}>
                    <Menu className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-100 p-2">
                    <DropdownMenuItem onClick={() => setIsManualInputOpen(true)} className="rounded-lg py-2">
                      <Clipboard className="mr-2 h-4 w-4" />
                      Вставить текст
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFocusMode(true)} className="rounded-lg py-2">
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Режим фокуса
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSaveArticle} className="rounded-lg py-2">
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить в библиотеку
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-zinc-100"></div>
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Шрифт</div>
                    <div className="px-2 py-2 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <span>Оригинал</span>
                          <span>{originalFontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="32" 
                          value={originalFontSize} 
                          onChange={(e) => setOriginalFontSize(parseInt(e.target.value))}
                          className="w-full accent-[#4B0082]"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <span>Перевод</span>
                          <span>{translationFontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="32" 
                          value={translationFontSize} 
                          onChange={(e) => setTranslationFontSize(parseInt(e.target.value))}
                          className="w-full accent-[#BA55D3]"
                        />
                      </div>
                    </div>
                    <div className="my-1 h-px bg-zinc-100"></div>
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Язык перевода</div>
                    {LANGUAGES.map((lang) => (
                      <DropdownMenuItem 
                        key={lang.code} 
                        className={`rounded-lg py-2 ${targetLang.code === lang.code ? 'bg-purple-50 text-[#4B0082]' : ''}`}
                        onClick={() => handleTranslate(lang)}
                      >
                        {lang.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Focus Mode Exit Button */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 z-[100] -translate-x-1/2"
          >
            <Button 
              onClick={() => setIsFocusMode(false)}
              className="rounded-full bg-[#4B0082] px-6 py-6 shadow-2xl hover:bg-[#9932CC]"
            >
              <Minimize2 className="mr-2 h-5 w-5" />
              Выйти из режима фокуса
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden transition-all duration-700 ${
        isFocusMode ? 'mx-auto w-full max-w-4xl py-20' : 
        showParallel ? 'flex flex-row overflow-x-auto snap-x snap-mandatory min-[600px]:overflow-x-hidden min-[600px]:snap-none' : 'mx-auto w-full max-w-3xl'
      }`}>
        {/* Original Text */}
        <div 
          ref={leftRef}
          onScroll={(e) => showParallel && handleScroll(e, 'right')}
          className={`overflow-y-auto px-8 py-12 transition-all duration-500 ease-in-out shrink-0 snap-center ${
            showParallel ? 'w-screen border-r border-zinc-100 min-[600px]:w-1/2' : 'w-full'
          }`}
        >
          <article className="prose prose-zinc max-w-none">
            {!isFocusMode && (
              <h1 className="mb-12 text-4xl font-medium tracking-tight text-foreground leading-tight">
                {article?.title}
              </h1>
            )}
            <div 
              className="space-y-8 leading-[1.8] text-foreground/80 font-serif"
              style={{ fontSize: `${originalFontSize}px` }}
            >
              {article?.content.split('\n').filter(p => p.trim()).map((para, pIdx) => (
                <p key={pIdx} className="relative group">
                  {para.match(/[^.!?]+[.!?]+/g)?.map((sentence, sIdx) => {
                    const globalIdx = pIdx * 100 + sIdx;
                    return (
                      <span 
                        key={sIdx}
                        className={`transition-colors duration-200 cursor-pointer rounded-sm px-1 ${
                          hoveredSentenceIndex === globalIdx ? 'bg-purple-100/80' : ''
                        }`}
                        onMouseEnter={() => showParallel && setHoveredSentenceIndex(globalIdx)}
                        onMouseLeave={() => showParallel && setHoveredSentenceIndex(null)}
                      >
                        {sentence}
                      </span>
                    );
                  }) || para}
                </p>
              ))}
            </div>
          </article>
        </div>

        {/* Translation Column */}
        <AnimatePresence>
          {showParallel && !isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              ref={rightRef}
              onScroll={(e) => handleScroll(e, 'left')}
              className="w-screen shrink-0 snap-center overflow-y-auto bg-purple-50/20 px-8 py-12 min-[600px]:w-1/2"
            >
              <article className="prose prose-zinc max-w-none">
                <h1 className="mb-12 text-4xl font-medium tracking-tight text-[#BA55D3] leading-tight opacity-70 italic">
                  {article?.title} ({targetLang.name})
                </h1>
                <div 
                  className="space-y-8 leading-[1.8] text-foreground/60 font-serif"
                  style={{ 
                    fontSize: `${translationFontSize}px`,
                    hyphens: 'auto'
                  }}
                >
                  {translation ? translation.split('\n').filter(p => p.trim()).map((para, pIdx) => (
                    <p key={pIdx}>
                      {para.match(/[^.!?]+[.!?]+/g)?.map((sentence, sIdx) => {
                        const globalIdx = pIdx * 100 + sIdx;
                        return (
                          <span 
                            key={sIdx}
                            className={`transition-colors duration-200 rounded-sm px-1 ${
                              hoveredSentenceIndex === globalIdx ? 'bg-purple-100/80' : ''
                            }`}
                          >
                            {sentence}
                          </span>
                        );
                      }) || para}
                    </p>
                  )) : (
                    <div className="space-y-8">
                      {article?.content.split('\n').filter(p => p.trim()).map((originalPara, pIdx) => (
                        <ParagraphTranslation
                          key={pIdx}
                          pIdx={pIdx}
                          originalText={originalPara}
                          targetLang={targetLang}
                          onTranslate={translateParagraph}
                          translation={paragraphTranslations[pIdx]}
                          isLoading={loadingParagraphs[pIdx]}
                          error={errorParagraphs[pIdx]}
                          hoveredSentenceIndex={hoveredSentenceIndex}
                          onHoverSentence={setHoveredSentenceIndex}
                          fontSize={translationFontSize}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Selection Tooltip */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ 
              position: 'absolute', 
              left: selection.x, 
              top: selection.y - 60,
              transform: 'translateX(-50%)'
            }}
            className="z-[100] flex items-center gap-1 rounded-full bg-[#4B0082] p-1 shadow-2xl"
          >
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 rounded-full px-3 text-xs font-medium text-white hover:bg-[#9932CC] hover:text-white"
              onClick={saveToDictionary}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              В словарь
            </Button>
            <div className="h-4 w-px bg-white/20 mx-1"></div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 rounded-full px-3 text-xs font-medium text-white hover:bg-[#9932CC] hover:text-white"
              onClick={() => handleTTS(selection.text)}
            >
              <Volume2 className="mr-1.5 h-3.5 w-3.5" />
              Прослушать
            </Button>
            <div className="h-4 w-px bg-white/20 mx-1"></div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 rounded-full px-3 text-xs font-medium text-purple-200 hover:bg-[#9932CC] hover:text-white"
              onClick={() => setSelection(null)}
            >
              Отмена
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {!isFocusMode && (
        <div className="fixed bottom-0 left-0 h-1 bg-[#4B0082] transition-all duration-300" style={{ width: '30%' }}></div>
      )}

      <ManualInputModal 
        isOpen={isManualInputOpen} 
        onClose={() => setIsManualInputOpen(false)} 
      />
    </div>
  );
}
