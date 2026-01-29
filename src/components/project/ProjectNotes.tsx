import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, StickyNote, Bell, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDisplayDate, parseDateString } from '@/lib/dateUtils';

interface Note {
  id: string;
  project_id: string;
  content: string;
  is_reminder: boolean;
  reminder_date: string | null;
  created_at: string;
}

interface ProjectNotesProps {
  projectId: string;
}

export function ProjectNotes({ projectId }: ProjectNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isReminder, setIsReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
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
  }, [projectId]);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from('project_notes')
      .insert({
        project_id: projectId,
        content: content.trim(),
        is_reminder: isReminder,
        reminder_date: isReminder && reminderDate ? reminderDate : null,
      });

    if (error) {
      toast.error('Failed to add note');
      console.error(error);
    } else {
      toast.success('Note added');
      setContent('');
      setIsReminder(false);
      setReminderDate('');
      setIsOpen(false);
      fetchNotes();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete note');
    } else {
      toast.success('Note deleted');
      fetchNotes();
    }
  };

  const formatDate = (date: string) => {
    return formatDisplayDate(date);
  };

  const isUpcoming = (reminderDate: string | null) => {
    if (!reminderDate) return false;
    const reminder = parseDateString(reminderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (reminder.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  };

  const reminders = notes.filter(n => n.is_reminder && n.reminder_date);
  const regularNotes = notes.filter(n => !n.is_reminder);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Notes & Reminders ({notes.length})
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Note *</Label>
                <Textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note..."
                  rows={4}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder-toggle" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  Set as reminder
                </Label>
                <Switch 
                  id="reminder-toggle"
                  checked={isReminder} 
                  onCheckedChange={setIsReminder}
                />
              </div>
              {isReminder && (
                <div>
                  <Label>Reminder Date</Label>
                  <Input 
                    type="date"
                    value={reminderDate} 
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>
              )}
              <Button onClick={handleAdd} disabled={!content.trim() || submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No notes yet. Add some to keep track of important details!
          </p>
        ) : (
          <div className="space-y-4">
            {/* Reminders section */}
            {reminders.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Bell className="h-4 w-4" />
                  Reminders
                </h4>
                {reminders.map(note => (
                  <div 
                    key={note.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      isUpcoming(note.reminder_date) 
                        ? "bg-warning/10 border-warning/30" 
                        : "bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        {note.reminder_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(note.reminder_date)}
                            {isUpcoming(note.reminder_date) && (
                              <span className="ml-1 text-warning font-medium">Coming up!</span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regular notes */}
            {regularNotes.length > 0 && (
              <div className="space-y-2">
                {reminders.length > 0 && (
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                )}
                {regularNotes.map(note => (
                  <div 
                    key={note.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
