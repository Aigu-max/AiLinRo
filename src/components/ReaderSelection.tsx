import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link as LinkIcon, ArrowLeft, FileText, Globe, Clipboard } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import ManualInputModal from '@/src/components/ManualInputModal';

export default function ReaderSelection() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    toast.success('Загрузка статьи...');
    navigate(`/reader?url=${encodeURIComponent(url)}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      toast.success('Загрузка PDF...');
      navigate('/reader', { state: { type: 'pdf', source: file.name } });
    } else {
      toast.error('Пожалуйста, загрузите корректный PDF файл.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      toast.success('Загрузка PDF...');
      navigate('/reader', { state: { type: 'pdf', source: file.name } });
    } else {
      toast.error('Пожалуйста, загрузите корректный PDF файл.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Button 
        variant="ghost" 
        className="mb-8 text-zinc-500 hover:text-[#4B0082]"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад в библиотеку
      </Button>

      <div className="mb-12 space-y-2">
        <h1 className="text-3xl font-medium tracking-tight text-[#4B0082]">Начать чтение</h1>
        <p className="text-zinc-500">Выберите источник, чтобы начать учебную сессию.</p>
      </div>

      <div className="grid gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-zinc-200 shadow-sm hover:border-[#BA55D3] transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#4B0082]">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-lg font-medium">Загрузить PDF</CardTitle>
              </div>
              <CardDescription>Перетащите PDF файл сюда или нажмите для выбора</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                  isDragging 
                    ? 'border-[#4B0082] bg-purple-50' 
                    : 'border-zinc-200 hover:border-[#BA55D3] hover:bg-purple-50/30'
                }`}
                onClick={() => document.getElementById('pdf-upload')?.click()}
              >
                <Upload className={`mb-4 h-10 w-10 ${isDragging ? 'text-[#4B0082]' : 'text-zinc-400'}`} />
                <p className="text-sm font-medium text-zinc-600">
                  {isDragging ? 'Отпустите файл' : 'Перетащите PDF или нажмите для загрузки'}
                </p>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="relative flex items-center justify-center">
          <div className="absolute w-full border-t border-zinc-200"></div>
          <span className="relative px-4 text-xs font-medium uppercase tracking-widest text-zinc-400">или</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-zinc-200 shadow-sm hover:border-[#BA55D3] transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#4B0082]">
                <Globe className="h-5 w-5" />
                <CardTitle className="text-lg font-medium">Веб-статья</CardTitle>
              </div>
              <CardDescription>Вставьте URL-адрес для чтения любого веб-контента</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="https://example.com/article"
                    className="pl-10 border-zinc-200 focus-visible:ring-[#BA55D3]"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <Button type="submit" className="bg-[#4B0082] hover:bg-[#9932CC]">
                  Загрузить
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-zinc-200 shadow-sm hover:border-[#BA55D3] transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#4B0082]">
                <Clipboard className="h-5 w-5" />
                <CardTitle className="text-lg font-medium">Вставить текст</CardTitle>
              </div>
              <CardDescription>Вставьте текст вручную из буфера обмена</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsManualInputOpen(true)}
                className="w-full bg-white border border-zinc-200 text-[#4B0082] hover:bg-purple-50 hover:border-[#BA55D3]"
              >
                Открыть редактор
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ManualInputModal 
        isOpen={isManualInputOpen} 
        onClose={() => setIsManualInputOpen(false)} 
      />
    </div>
  );
}
