import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Save, Loader2, List, AlignLeft, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function NewNote() {
  const [content, setContent] = useState('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [summaryTone, setSummaryTone] = useState<'academic' | 'casual' | 'professional'>('professional');
  const [isBulletPoints, setIsBulletPoints] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    summary: string;
    keywords: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter some text to summarize.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('summarize', {
        body: {
          content,
          length: summaryLength,
          tone: summaryTone,
          bulletPoints: isBulletPoints,
        },
      });

      if (error) throw error;

      setResult({
        title: data.title,
        summary: data.summary,
        keywords: data.keywords,
      });

      toast({
        title: 'Summary generated!',
        description: 'Your content has been summarized successfully.',
      });
    } catch (error: any) {
      console.error('Summarization error:', error);
      toast({
        title: 'Summarization failed',
        description: error.message || 'An error occurred while summarizing.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;

    try {
      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: result.title,
        original_content: content,
        summary: result.summary,
        keywords: result.keywords,
        summary_length: summaryLength,
        summary_tone: summaryTone,
        is_bullet_points: isBulletPoints,
      });

      if (error) throw error;

      toast({
        title: 'Note saved!',
        description: 'Your note has been saved successfully.',
      });

      navigate('/notes');
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error.message || 'An error occurred while saving.',
        variant: 'destructive',
      });
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Note</h1>
          <p className="text-muted-foreground mt-1">
            Paste your text and let AI generate a summary
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your text here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length} characters
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Summary Length</Label>
                    <Select value={summaryLength} onValueChange={(v) => setSummaryLength(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={summaryTone} onValueChange={(v) => setSummaryTone(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {isBulletPoints ? <List className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" />}
                    <Label htmlFor="bullet-points">Bullet Points</Label>
                  </div>
                  <Switch
                    id="bullet-points"
                    checked={isBulletPoints}
                    onCheckedChange={setIsBulletPoints}
                  />
                </div>

                <Button
                  onClick={handleSummarize}
                  disabled={isProcessing || !content.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-none shadow-md h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Summary</CardTitle>
                {result && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-4 animate-pulse">
                      <Sparkles className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <p className="text-muted-foreground">Generating summary...</p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                        Generated Title
                      </Label>
                      <h3 className="text-lg font-semibold mt-1">{result.title}</h3>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                        Summary
                      </Label>
                      <div className="mt-2 p-4 bg-secondary rounded-lg">
                        <p className="text-foreground whitespace-pre-wrap">{result.summary}</p>
                      </div>
                    </div>

                    {result.keywords.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                          Keywords
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {result.keywords.map((keyword, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Your AI-generated summary will appear here
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Enter text and click "Generate Summary"
                    </p>
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
