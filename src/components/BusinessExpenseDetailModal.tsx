import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Paperclip, Download, Trash2, Save, Briefcase, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getBusinessExpenseCategories } from '@/types';
import { formatDisplayDateLong } from '@/lib/dateUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BusinessExpenseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    id: string;
    amount: number;
    date: string;
    category: string;
    vendor_name: string | null;
    description: string | null;
    payment_method: string | null;
    includes_tax: boolean;
    tax_amount: number | null;
    notes?: string | null;
    receipt_url?: string | null;
    project_id?: string | null;
  } | null;
  onExpenseUpdated: () => void;
  onDelete?: () => void;
  projects?: { id: string; name: string }[];
}

export function BusinessExpenseDetailModal({
  open,
  onOpenChange,
  expense,
  onExpenseUpdated,
  onDelete,
  projects = [],
}: BusinessExpenseDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (expense) {
      setNotes(expense.notes || '');
      setReceiptUrl(expense.receipt_url || null);
      setReceiptFile(null);
    }
  }, [expense]);

  if (!expense) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return formatDisplayDateLong(date);
  };

  const getCategoryLabel = (category: string) => {
    return getBusinessExpenseCategories().find(b => b.value === category)?.label || 
      category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/business-${expense.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('expense-receipts').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or PDF file',
        variant: 'destructive',
      });
      return;
    }
    setReceiptFile(file);
    setReceiptUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptUrl(null);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptUrl(null);
  };

  const handleDownloadReceipt = async () => {
    if (!receiptUrl) return;
    try {
      const urlParts = receiptUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        const link = document.createElement('a');
        link.href = receiptUrl;
        link.download = 'receipt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const [bucketName, ...pathParts] = urlParts[1].split('/');
      const filePath = pathParts.join('/');
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
      
      if (error || !data) {
        toast({ title: 'Download failed', variant: 'destructive' });
        return;
      }
      
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filePath.split('/').pop() || 'receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let newReceiptUrl = receiptUrl;

      // Upload new receipt if selected
      if (receiptFile) {
        setIsUploading(true);
        newReceiptUrl = await uploadReceipt(receiptFile);
        setIsUploading(false);
        if (!newReceiptUrl) {
          toast({
            title: 'Upload failed',
            description: 'Could not upload receipt',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('business_expenses')
        .update({
          notes: notes || null,
          receipt_url: newReceiptUrl,
        })
        .eq('id', expense.id);

      if (error) throw error;

      toast({
        title: 'Expense updated',
        description: 'Notes and receipt saved successfully',
      });

      onExpenseUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update expense',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Business Expense Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{expense.vendor_name || 'Unknown Contractor'}</p>
                <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-semibold">{formatCurrency(expense.amount)}</p>
                {expense.includes_tax && expense.tax_amount && (
                  <p className="text-xs text-muted-foreground">+{formatCurrency(expense.tax_amount)} tax</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">{getCategoryLabel(expense.category)}</Badge>
              <Badge variant="outline" className="capitalize">{expense.payment_method}</Badge>
            </div>

            {expense.description && (
              <p className="text-sm text-muted-foreground pt-2 border-t border-border mt-2">
                {expense.description}
              </p>
            )}

            {expense.project_id && (() => {
              const proj = projects.find(p => p.id === expense.project_id);
              return proj ? (
                <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                  <Badge variant="outline" className="text-xs">
                    {proj.name}
                  </Badge>
                </div>
              ) : null;
            })()}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add notes about this expense..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Receipt</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />

            {receiptUrl && !receiptFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <Paperclip className="h-5 w-5 text-primary" />
                <span className="text-sm flex-1">Receipt attached</span>
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="text-primary hover:text-primary/80"
                >
                  <Download className="h-4 w-4" />
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveReceipt}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : receiptFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiptFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  isDragging 
                    ? "border-primary bg-primary/10" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  Drag & drop or click to upload receipt
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, or PDF
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 gap-2" 
              onClick={handleSave}
              disabled={isSaving || isUploading}
            >
              <Save className="h-4 w-4" />
              {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
