import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FileText, Clock, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  keywords: string[] | null;
  original_content: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNotes(notes.filter((n) => n.id !== id));
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted.',
      });
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Notes</h1>
            <p className="text-muted-foreground mt-1">
              {notes.length} notes saved
            </p>
          </div>
          <Link to="/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <Card className="border-none shadow-md">
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first note to get started'}
              </p>
              {!searchQuery && (
                <Link to="/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/notes/${note.id}`} className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                          {note.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                          {note.summary || 'No summary'}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(note.created_at), 'MMM d, yyyy')}
                          </div>
                          {note.keywords && note.keywords.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {note.keywords.slice(0, 3).map((keyword, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                                >
                                  {keyword}
                                </span>
                              ))}
                              {note.keywords.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{note.keywords.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete note?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your note.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(note.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
