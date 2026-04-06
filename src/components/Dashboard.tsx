import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, Bookmark, Languages, Settings, User, Trash2, Clipboard } from 'lucide-react';
import { motion } from 'motion/react';
import { storage, SavedArticle } from '@/src/lib/storage';
import { useEffect, useState } from 'react';
import ManualInputModal from '@/src/components/ManualInputModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentArticles, setRecentArticles] = useState<SavedArticle[]>([]);
  const [dictionaryCount, setDictionaryCount] = useState(0);
  const [profile, setProfile] = useState(storage.getProfile());
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  useEffect(() => {
    setRecentArticles(storage.getSavedArticles().slice(0, 3));
    setDictionaryCount(storage.getDictionary().length);
    setProfile(storage.getProfile());
  }, []);

  const handleDeleteArticle = (id: string) => {
    storage.removeArticle(id);
    setRecentArticles(storage.getSavedArticles().slice(0, 3));
  };

  const cards = [
    {
      title: 'Читать',
      description: 'Загрузите PDF или вставьте ссылку',
      icon: Book,
      path: '/read',
      color: 'bg-[#4B0082]',
      textColor: 'text-white'
    },
    {
      title: 'Сохраненное',
      description: `${recentArticles.length} статей в закладках`,
      icon: Bookmark,
      path: '/saved',
      color: 'bg-white',
      textColor: 'text-[#4B0082]'
    },
    {
      title: 'Словарь',
      description: `${dictionaryCount} слов сохранено`,
      icon: Languages,
      path: '/dictionary',
      color: 'bg-white',
      textColor: 'text-[#4B0082]'
    },
    {
      title: 'Вставить текст вручную',
      description: 'Вручную вставьте любой текст',
      icon: Clipboard,
      onClick: () => setIsManualInputOpen(true),
      color: 'bg-white',
      textColor: 'text-[#4B0082]'
    }
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-16 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-medium tracking-tight text-[#4B0082]">Привет, {profile.name}!</h1>
          <p className="text-zinc-500">Ваше личное пространство для чтения и обучения.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-purple-50"
            onClick={() => setIsManualInputOpen(true)}
            title="Вставить текст"
          >
            <Clipboard className="h-5 w-5 text-[#4B0082]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-purple-50"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5 text-[#4B0082]" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-purple-50"
            onClick={() => navigate('/profile')}
          >
            <User className="h-5 w-5 text-[#4B0082]" />
          </Button>
        </div>
      </header>

      <ManualInputModal 
        isOpen={isManualInputOpen} 
        onClose={() => setIsManualInputOpen(false)} 
      />

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="group cursor-pointer border-zinc-200 transition-all hover:border-[#BA55D3] hover:shadow-lg"
              onClick={() => card.onClick ? card.onClick() : navigate(card.path!)}
            >
              <CardHeader className="pb-4">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} ${card.textColor} shadow-md transition-transform group-hover:scale-110`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-medium">{card.title}</CardTitle>
                <CardDescription className="text-zinc-500">{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-[#9932CC] opacity-0 transition-opacity group-hover:opacity-100">
                  Открыть {card.title.toLowerCase()}
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <section className="mt-20">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-[#4B0082]">Недавняя активность</h2>
          <Button variant="link" className="text-[#9932CC]" onClick={() => navigate('/saved')}>Посмотреть все</Button>
        </div>
        
        {recentArticles.length > 0 ? (
          <div className="grid gap-4">
            {recentArticles.map((article) => (
              <div 
                key={article.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-purple-50/50"
              >
                <div 
                  className="flex flex-1 cursor-pointer items-center gap-4"
                  onClick={() => {
                    if (article.type === 'url') {
                      navigate(`/reader?url=${encodeURIComponent(article.source)}`);
                    } else {
                      navigate('/reader', { state: { type: article.type, source: article.source } });
                    }
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-[#4B0082]">
                    <Book className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900">{article.title}</h3>
                    <p className="text-xs text-zinc-500">{new Date(article.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-zinc-400 hover:text-red-500"
                  onClick={() => handleDeleteArticle(article.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center">
            <p className="text-sm text-zinc-400">Нет недавней активности. Начните читать, чтобы увидеть свой прогресс.</p>
          </div>
        )}
      </section>
    </div>
  );
}
