import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  Trash2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  summary: string | null;
  original_content: string;
  created_at: string;
  updated_at: string;
  keywords: string[] | null;
  summary_length: string | null;
  summary_tone: string | null;
  is_bullet_points: boolean | null;
}

export default function NoteDetail() {
  const { id } = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching note:', error);
        navigate('/notes');
      } else {
        setNote(data);
      }
      setLoading(false);
    };

    fetchNote();
  }, [id, user, navigate]);

  const handleCopy = async () => {
    if (!note) return;
    await navigator.clipboard.writeText(note.summary || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const handleExport = (format: 'txt' | 'md') => {
    if (!note) return;

    let content = '';
    const filename = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;

    if (format === 'md') {
      content = `# ${note.title}\n\n## Summary\n\n${note.summary || 'No summary'}\n\n`;
      if (note.keywords && note.keywords.length > 0) {
        content += `## Keywords\n\n${note.keywords.map((k) => `- ${k}`).join('\n')}\n\n`;
      }
      content += `## Original Content\n\n${note.original_content}`;
    } else {
      content = `${note.title}\n${'='.repeat(note.title.length)}\n\nSummary:\n${note.summary || 'No summary'}\n\n`;
      if (note.keywords && note.keywords.length > 0) {
        content += `Keywords: ${note.keywords.join(', ')}\n\n`;
      }
      content += `Original Content:\n${note.original_content}`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Note exported', description: `Saved as ${filename}` });
  };

  const handleDelete = async () => {
    if (!note) return;

    const { error } = await supabase.from('notes').delete().eq('id', note.id);

    if (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Note deleted' });
      navigate('/notes');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-32 bg-secondary animate-pulse rounded mb-8" />
          <div className="h-64 bg-secondary animate-pulse rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!note) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Note not found</h2>
          <Link to="/notes">
            <Button variant="link">Back to notes</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Link to="/notes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  Export as TXT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('md')}>
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Title & Meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-4">{note.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(note.created_at), 'MMMM d, yyyy • h:mm a')}
            </div>
            {note.summary_length && (
              <span className="px-2 py-0.5 bg-secondary rounded-full capitalize">
                {note.summary_length}
              </span>
            )}
            {note.summary_tone && (
              <span className="px-2 py-0.5 bg-secondary rounded-full capitalize">
                {note.summary_tone}
              </span>
            )}
          </div>
        </motion.div>

        {/* Keywords */}
        {note.keywords && note.keywords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            {note.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
              >
                {keyword}
              </span>
            ))}
          </motion.div>
        )}

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {note.summary || 'No summary available'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Original Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Original Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {note.original_content}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
