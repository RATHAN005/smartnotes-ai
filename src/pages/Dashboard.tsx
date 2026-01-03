import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  keywords: string[] | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState({ totalNotes: 0, thisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch recent notes
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, summary, created_at, keywords')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notes) {
        setRecentNotes(notes);
      }

      // Fetch stats
      const { count: totalNotes } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: thisWeek } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      setStats({
        totalNotes: totalNotes || 0,
        thisWeek: thisWeek || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-foreground"
            >
              Hello, {firstName}! 👋
            </motion.h1>
            <p className="text-muted-foreground mt-1">
              Ready to summarize something new?
            </p>
          </div>
          <Link to="/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Note
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Notes</p>
                    <p className="text-2xl font-bold">{stats.totalNotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-success/10">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{stats.thisWeek}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-none shadow-md gradient-primary text-primary-foreground">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-foreground/80">AI Powered</p>
                    <p className="text-lg font-semibold">Smart Summaries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions & Recent Notes */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-none shadow-md h-full">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/new" className="block">
                  <div className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Summarize Text</p>
                        <p className="text-sm text-muted-foreground">Paste text to get AI summary</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link to="/notes" className="block">
                  <div className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Browse Notes</p>
                        <p className="text-sm text-muted-foreground">View all your summaries</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-none shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Notes</CardTitle>
                <Link to="/notes" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-secondary animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : recentNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No notes yet</p>
                    <Link to="/new">
                      <Button variant="link" className="mt-2">
                        Create your first note
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentNotes.map((note) => (
                      <Link key={note.id} to={`/notes/${note.id}`}>
                        <div className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{note.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {note.summary || 'No summary'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Clock className="h-3 w-3" />
                              {format(new Date(note.created_at), 'MMM d')}
                            </div>
                          </div>
                          {note.keywords && note.keywords.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {note.keywords.slice(0, 3).map((keyword, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
