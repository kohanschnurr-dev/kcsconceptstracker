import { useState, useEffect } from 'react';
import { Plus, Landmark, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/dateUtils';

interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  vendor_name: string | null;
  payment_type: string;
  source: string;
  notes: string | null;
}

interface LoanPaymentsProps {
  projectId: string;
}

const PAYMENT_TYPES = [
  { value: 'disbursement', label: 'Disbursement' },
  { value: 'interest', label: 'Interest' },
  { value: 'payoff', label: 'Payoff' },
  { value: 'other', label: 'Other' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

export function LoanPayments({ projectId }: LoanPaymentsProps) {
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [paymentType, setPaymentType] = useState('other');
  const [notes, setNotes] = useState('');

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    if (!error) setPayments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, [projectId]);

  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setVendorName('');
    setPaymentType('other');
    setNotes('');
  };

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('loan_payments').insert({
      project_id: projectId,
      user_id: user.id,
      amount: parseFloat(amount),
      date,
      description: description || null,
      vendor_name: vendorName || null,
      payment_type: paymentType,
      source: 'manual',
      notes: notes || null,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add payment', variant: 'destructive' });
    } else {
      toast({ title: 'Payment Added', description: formatCurrency(parseFloat(amount)) });
      resetForm();
      setModalOpen(false);
      await fetchPayments();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('loan_payments').delete().eq('id', id);
    if (!error) {
      setPayments(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Removed', description: 'Payment deleted' });
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          Loan Payments
        </CardTitle>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Loan Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Lender / Vendor</Label>
                <Input placeholder="e.g. ABC Capital" value={vendorName} onChange={e => setVendorName(e.target.value)} />
              </div>
              <div>
                <Label>Payment Type</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="e.g. Wire transfer" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <Button onClick={handleAdd} disabled={saving || !amount} className="w-full">
                {saving ? 'Adding...' : 'Add Payment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">
            No loan payments recorded yet. Add one manually or import from QuickBooks expenses.
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{formatDisplayDate(p.date)}</TableCell>
                      <TableCell className="text-sm">
                        <div>{p.description || p.vendor_name || '—'}</div>
                        {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{p.payment_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">{p.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-3 text-sm">
              <span className="text-muted-foreground mr-2">Total Paid:</span>
              <span className="font-mono font-semibold">{formatCurrency(totalPaid)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
