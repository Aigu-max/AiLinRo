import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trash2, BookOpen } from 'lucide-react';
import { storage, SavedArticle } from '@/src/lib/storage';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function SavedArticles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<SavedArticle[]>([]);

  useEffect(() => {
    setArticles(storage.getSavedArticles());
  }, []);

  const handleDelete = (id: string) => {
    storage.removeArticle(id);
    setArticles(storage.getSavedArticles());
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

      <h1 className="mb-8 text-3xl font-medium tracking-tight text-[#4B0082]">Сохраненные статьи</h1>

      {articles.length > 0 ? (
        <div className="grid gap-4">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-zinc-200 transition-shadow hover:shadow-md hover:border-[#BA55D3]">
                <CardContent className="flex items-center justify-between p-4">
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
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900">{article.title}</h3>
                      <p className="text-xs text-zinc-500">
                        {article.type.toUpperCase()} • {new Date(article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-400 hover:text-red-500"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400">Пока нет сохраненных статей.</p>
        </div>
      )}
    </div>
  );
}
