import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, BarChart3, BookOpen, Languages, Clock } from 'lucide-react';
import { storage, UsageSession } from '@/src/lib/storage';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [stats, setStats] = useState({
    totalWords: 0,
    totalArticles: 0,
    avgDay: 0,
    avgWeek: 0,
    avgMonth: 0,
  });

  useEffect(() => {
    const profile = storage.getProfile();
    setName(profile.name);

    const dictionary = storage.getDictionary();
    const articles = storage.getSavedArticles();
    const usage = storage.getUsageStats();

    // Calculate time stats
    const totalMinutes = usage.reduce((acc, curr) => acc + curr.duration, 0);
    const daysTracked = usage.length || 1;
    
    const avgDay = totalMinutes / daysTracked;
    const avgWeek = avgDay * 7;
    const avgMonth = avgDay * 30;

    setStats({
      totalWords: dictionary.length,
      totalArticles: articles.length,
      avgDay: Math.round(avgDay),
      avgWeek: Math.round(avgWeek),
      avgMonth: Math.round(avgMonth),
    });
  }, []);

  const handleSaveName = () => {
    storage.saveProfile({ name });
    toast.success('Имя профиля сохранено!');
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Button 
        variant="ghost" 
        className="mb-8 text-zinc-500 hover:text-[#4B0082]"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад в библиотеку
      </Button>

      <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-[#4B0082]">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-[#4B0082]">Профиль</h1>
            <p className="text-zinc-500">Ваш прогресс и личные данные.</p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Ваше имя</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-48 border-zinc-200 focus-visible:ring-[#BA55D3]"
              placeholder="Введите имя"
            />
          </div>
          <Button onClick={handleSaveName} className="bg-[#4B0082] hover:bg-[#9932CC]">
            Сохранить
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Слов в словаре" 
          value={stats.totalWords} 
          icon={Languages} 
          color="text-blue-500" 
          bgColor="bg-blue-50" 
        />
        <StatCard 
          title="Статей сохранено" 
          value={stats.totalArticles} 
          icon={BookOpen} 
          color="text-emerald-500" 
          bgColor="bg-emerald-50" 
        />
        <StatCard 
          title="В день (среднее)" 
          value={`${stats.avgDay} мин`} 
          icon={Clock} 
          color="text-orange-500" 
          bgColor="bg-orange-50" 
        />
        <StatCard 
          title="В неделю (среднее)" 
          value={`${stats.avgWeek} мин`} 
          icon={BarChart3} 
          color="text-purple-500" 
          bgColor="bg-purple-50" 
        />
      </div>

      <section className="mt-12">
        <Card className="border-zinc-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-[#4B0082]">Статистика обучения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Среднее время в месяц</span>
                <span className="text-xl font-bold text-[#4B0082]">{stats.avgMonth} минут</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full bg-[#BA55D3]" style={{ width: '65%' }}></div>
              </div>
              <p className="text-xs text-zinc-400">
                * Статистика рассчитывается на основе времени, проведенного в читалке.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-zinc-200">
        <CardContent className="p-6">
          <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${bgColor} ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
