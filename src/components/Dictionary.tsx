import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';
import { storage, DictionaryEntry } from '@/src/lib/storage';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function Dictionary() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);

  useEffect(() => {
    setEntries(storage.getDictionary());
  }, []);

  const handleDelete = (id: string) => {
    storage.removeFromDictionary(id);
    setEntries(storage.getDictionary());
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

      <h1 className="mb-8 text-3xl font-medium tracking-tight text-[#4B0082]">Ваш словарь</h1>

      {entries.length > 0 ? (
        <div className="grid gap-4">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-zinc-200 transition-shadow hover:shadow-md hover:border-[#BA55D3]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-baseline gap-3">
                        <h3 className="text-2xl font-medium text-zinc-900">{entry.word}</h3>
                        <span className="text-lg text-[#9932CC]">—</span>
                        <h3 className="text-2xl font-medium text-[#4B0082]">{entry.translation}</h3>
                      </div>
                      
                      <div className="rounded-lg bg-purple-50/50 p-3 border-l-4 border-purple-200 dark:bg-zinc-800/50">
                        <p className="text-sm text-zinc-600 leading-relaxed italic dark:text-zinc-300">
                          "{entry.context}"
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate max-w-[300px]">{entry.source_url}</span>
                        <span className="ml-auto font-bold uppercase tracking-widest">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center">
          <p className="text-zinc-400">Слова пока не сохранены. Выделяйте текст в читалке, чтобы добавить слова.</p>
        </div>
      )}
    </div>
  );
}
