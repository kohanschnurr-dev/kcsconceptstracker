import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ACTIVITY_TYPE_LABELS } from '@/types/crm';
import type { CRMActivity, ActivityType, CRMCalendarEvent, CRMEventType } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contactId: string;
  contactName: string;
  onLog: (activity: Omit<CRMActivity, 'id' | 'created_at' | 'contact_name'>) => void;
  onScheduleFollowUp?: (event: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'>) => void;
}

export function LogActivityModal({ open, onOpenChange, contactId, contactName, onLog, onScheduleFollowUp }: Props) {
  const { user } = useAuth();
  const [type, setType] = useState<ActivityType>('call_outbound');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState<CRMEventType>('follow_up_call');

  const handleSubmit = () => {
    onLog({
      contact_id: contactId,
      user_id: user?.id ?? '',
      activity_type: type,
      description: description || null,
      outcome: outcome || null,
      duration_minutes: duration ? parseInt(duration) : null,
      notes: notes || null,
      activity_date: new Date(date).toISOString(),
    });

    if (scheduleFollowUp && followUpDate && onScheduleFollowUp) {
      onScheduleFollowUp({
        contact_id: contactId,
        user_id: user?.id ?? '',
        title: `Follow-up: ${contactName}`,
        event_type: followUpType,
        event_date: new Date(followUpDate).toISOString(),
        duration_minutes: 30,
        notes: null,
        reminder: '30m',
        status: 'scheduled',
      });
    }

    // Reset
    setDescription(''); setOutcome(''); setNotes(''); setDuration('');
    setScheduleFollowUp(false); setFollowUpDate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Activity — {contactName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Activity Type</Label>
              <Select value={type} onValueChange={v => setType(v as ActivityType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input className="mt-1" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input className="mt-1" type="number" placeholder="15" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input className="mt-1" placeholder="e.g. Called seller about property timeline" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Outcome</Label>
            <Input className="mt-1" placeholder="e.g. Left voicemail, will try again Thursday" value={outcome} onChange={e => setOutcome(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Schedule Follow-Up?</p>
            <Switch checked={scheduleFollowUp} onCheckedChange={setScheduleFollowUp} />
          </div>
          {scheduleFollowUp && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Follow-Up Date</Label>
                <Input className="mt-1" type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={followUpType} onValueChange={v => setFollowUpType(v as CRMEventType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up_call">Follow-Up Call</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="general_reminder">General Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Log Activity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
