import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Clipboard, X, BookOpen, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: 'ru', name: 'Русский', promptName: 'Russian' },
  { code: 'en', name: 'English', promptName: 'English' },
  { code: 'kk', name: 'Қазақша', promptName: 'Kazakh' },
  { code: 'zh', name: '中文', promptName: 'Chinese' },
  { code: 'es', name: 'Español', promptName: 'Spanish' },
  { code: 'ar', name: 'العربية', promptName: 'Arabic' },
];

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualInputModal({ isOpen, onClose }: ManualInputModalProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceLang, setSourceLang] = useState(LANGUAGES[1]); // Default English
  const [targetLang, setTargetLang] = useState(LANGUAGES[0]); // Default Russian

  const handleRead = () => {
    if (!content.trim()) return;

    toast.success('Загрузка текста...');
    navigate('/reader', { 
      state: { 
        type: 'manual', 
        source: content,
        title: title || 'Вставленный текст',
        sourceLang,
        targetLang
      } 
    });
    onClose();
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl border-zinc-100 sm:max-w-[600px]">
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-[#4B0082]">
            <Clipboard className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-medium text-[#4B0082]">Вставить текст</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Вставьте любой текст вручную, чтобы начать чтение с параллельным переводом.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Заголовок (необязательно)
            </Label>
            <Input
              id="title"
              placeholder="Например: Моя любимая статья"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-zinc-200 focus-visible:ring-[#BA55D3]"
            />
          </div>

          <div className="flex gap-4">
            <div className="grid flex-1 gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Язык оригинала</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between border-zinc-200")}>
                  {sourceLang.name}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  {LANGUAGES.map((lang) => (
                    <DropdownMenuItem key={lang.code} onClick={() => setSourceLang(lang)}>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="grid flex-1 gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Язык перевода</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between border-zinc-200")}>
                  {targetLang.name}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  {LANGUAGES.map((lang) => (
                    <DropdownMenuItem key={lang.code} onClick={() => setTargetLang(lang)}>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Основной текст
            </Label>
            <textarea
              id="content"
              placeholder="Вставьте ваш текст здесь..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[250px] w-full rounded-xl border border-zinc-200 bg-transparent p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#BA55D3]/20 focus:border-[#BA55D3]"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={handleClear}
            className="text-zinc-500 hover:text-red-500 hover:bg-red-50"
          >
            <X className="mr-2 h-4 w-4" />
            Очистить
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full border-zinc-200">
              Отмена
            </Button>
            <Button 
              onClick={handleRead} 
              disabled={!content.trim()}
              className="rounded-full bg-[#4B0082] px-6 hover:bg-[#9932CC]"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Начать чтение
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
