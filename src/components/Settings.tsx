import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, Trash2, Download, FileJson, FileText, Table } from 'lucide-react';
import { storage, AppSettings } from '@/src/lib/storage';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const PASTEL_COLORS = [
  { name: 'Стандартный', color: '#ffffff' },
  { name: 'Нежно-розовый', color: '#fff5f5' },
  { name: 'Мятный', color: '#f0fff4' },
  { name: 'Небесно-голубой', color: '#ebf8ff' },
  { name: 'Лавандовый', color: '#f5f3ff' },
  { name: 'Песочный', color: '#fffaf0' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  useEffect(() => {
    storage.saveSettings(settings);
    // Apply background color
    document.body.style.backgroundColor = settings.backgroundColor;
  }, [settings]);

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  const setBgColor = (color: string) => {
    setSettings(prev => ({ ...prev, backgroundColor: color }));
  };

  const handleClearAll = () => {
    if (window.confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие необратимо.')) {
      storage.clearAllData();
      toast.success('Все данные удалены.');
    }
  };

  const exportDictionary = (format: 'json' | 'txt' | 'csv') => {
    const dictionary = storage.getDictionary();
    if (dictionary.length === 0) {
      toast.error('Словарь пуст.');
      return;
    }

    let content = '';
    let mimeType = '';
    let fileName = `dictionary_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'json':
        content = JSON.stringify(dictionary, null, 2);
        mimeType = 'application/json';
        fileName += '.json';
        break;
      case 'txt':
        content = dictionary.map(e => `${e.word} - ${e.translation}\nКонтекст: ${e.context}\nИсточник: ${e.source_url}`).join('\n\n---\n\n');
        mimeType = 'text/plain';
        fileName += '.txt';
        break;
      case 'csv':
        const headers = 'Word,Translation,Context,Source URL,Date\n';
        const rows = dictionary.map(e => 
          `"${e.word.replace(/"/g, '""')}","${e.translation.replace(/"/g, '""')}","${e.context.replace(/"/g, '""')}","${e.source_url}","${e.created_at}"`
        ).join('\n');
        content = headers + rows;
        mimeType = 'text/csv';
        fileName += '.csv';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Словарь экспортирован в ${format.toUpperCase()}`);
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

      <div className="mb-12 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-[#4B0082]">
          <SettingsIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-[#4B0082]">Настройки</h1>
          <p className="text-zinc-500">Персонализация вашего опыта.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Theme & Appearance */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Внешний вид</CardTitle>
            <CardDescription>Настройте тему и цвета приложения.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">Тема оформления</span>
              <Button 
                variant="outline" 
                onClick={toggleTheme}
                className="border-zinc-200 hover:border-[#BA55D3] hover:bg-purple-50"
              >
                {settings.theme === 'light' ? (
                  <><Moon className="mr-2 h-4 w-4" /> Темная</>
                ) : (
                  <><Sun className="mr-2 h-4 w-4" /> Светлая</>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-medium text-zinc-700">Цвет фона (пастельные тона)</span>
              <div className="flex flex-wrap gap-3">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color.color}
                    onClick={() => setBgColor(color.color)}
                    className={`h-10 w-10 rounded-full border-2 transition-all hover:scale-110 ${
                      settings.backgroundColor === color.color ? 'border-[#4B0082] ring-2 ring-purple-100' : 'border-zinc-200'
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Экспорт данных</CardTitle>
            <CardDescription>Сохраните ваш словарь в файл для использования в других приложениях.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => exportDictionary('json')}
              className="border-zinc-200 hover:border-[#BA55D3] hover:bg-purple-50"
            >
              <FileJson className="mr-2 h-4 w-4" /> JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportDictionary('txt')}
              className="border-zinc-200 hover:border-[#BA55D3] hover:bg-purple-50"
            >
              <FileText className="mr-2 h-4 w-4" /> TXT
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportDictionary('csv')}
              className="border-zinc-200 hover:border-[#BA55D3] hover:bg-purple-50"
            >
              <Table className="mr-2 h-4 w-4" /> Excel / CSV
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-red-600">Опасная зона</CardTitle>
            <CardDescription>Действия, которые невозможно отменить.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Удалить все данные
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
