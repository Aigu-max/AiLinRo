import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/src/components/Dashboard';
import ReaderSelection from '@/src/components/ReaderSelection';
import Reader from '@/src/components/Reader';
import SavedArticles from '@/src/components/SavedArticles';
import Dictionary from '@/src/components/Dictionary';
import Profile from '@/src/components/Profile';
import Settings from '@/src/components/Settings';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { storage } from '@/src/lib/storage';
import { toast } from 'sonner';

const ACCESS_CODE = "040513";

function Gatekeeper({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem('app_authorized') === 'true';
  });
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState(false);

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputCode === ACCESS_CODE) {
      setIsAuthorized(true);
      sessionStorage.setItem('app_authorized', 'true');
      toast.success('Доступ разрешен');
    } else {
      setError(true);
      setInputCode('');
      toast.error('Неверный код доступа');
      setTimeout(() => setError(false), 500);
    }
  };

  if (isAuthorized) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm px-6"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-[#4B0082] dark:bg-purple-900/30 dark:text-purple-400">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-100">AiLinRo</h1>
          <p className="mt-2 text-sm text-zinc-500">Введите код доступа для входа</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Input
              type="password"
              placeholder="Код доступа"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className={`h-12 text-center text-lg tracking-[0.5em] focus-visible:ring-[#4B0082] ${error ? 'border-red-500 ring-red-500/20' : 'border-zinc-200'}`}
              autoFocus
            />
          </motion.div>
          <Button 
            type="submit" 
            className="h-12 w-full rounded-xl bg-[#4B0082] text-white hover:bg-[#3b0066]"
          >
            Войти
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
        
        <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-400">
          Защищенный доступ
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const settings = storage.getSettings();
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.body.style.backgroundColor = settings.backgroundColor;
  }, []);

  return (
    <Gatekeeper>
      <Router>
        <div className="min-h-screen font-sans text-foreground selection:bg-purple-200/30">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/read" element={<ReaderSelection />} />
            <Route path="/reader" element={<Reader />} />
            <Route path="/saved" element={<SavedArticles />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </Router>
    </Gatekeeper>
  );
}
