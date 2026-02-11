import { useState, useRef, useCallback, useEffect } from 'react';
import { Paperclip, Upload, X, Loader2, DollarSign, Calendar, Building2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';
import { getBusinessExpenseCategories } from '@/types';

interface BusinessExpense {
  id: string;
  amount: number;
  date: string;
  category: string;
  vendor_name: string | null;
  description: string | null;
  receipt_url: string | null;
}

interface ParsedReceipt {
  vendor_name: string;
  total_amount: number;
  purchase_date: string;
  subtotal?: number;
  tax_amount?: number;
}

interface MatchCandidate {
  expense: BusinessExpense;
  amountMatch: boolean;
  dateMatch: boolean;
  vendorMatch: boolean;
  score: number;
}

interface BusinessReceiptUploadProps {
  expenses: BusinessExpense[];
  onReceiptAttached: () => void;
}

export function BusinessReceiptUpload({ expenses, onReceiptAttached }: BusinessReceiptUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste events globally when component is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleFileUpload(file);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const getCategoryLabel = (category: string) => {
    return getBusinessExpenseCategories().find(c => c.value === category)?.label || 
      category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Vendor name similarity (simple word matching)
  const calculateVendorSimilarity = (vendor1: string, vendor2: string | null): number => {
    if (!vendor2) return 0;
    const words1 = vendor1.toLowerCase().split(/\s+/);
    const words2 = vendor2.toLowerCase().split(/\s+/);
    const matches = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
    return matches.length / Math.max(words1.length, words2.length);
  };

  // Check if dates are within 5 days
  const isDateInRange = (receiptDate: string, expenseDate: string): boolean => {
    const r = new Date(receiptDate);
    const e = new Date(expenseDate);
    const diffDays = Math.abs((r.getTime() - e.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 5;
  };

  // Find match candidates from expenses
  const findMatchCandidates = useCallback((receipt: ParsedReceipt): MatchCandidate[] => {
    // Filter to expenses without receipts
    const candidateExpenses = expenses.filter(e => !e.receipt_url);
    
    return candidateExpenses
      .map(expense => {
        const amountMatch = Math.abs(expense.amount - receipt.total_amount) <= 0.05;
        const dateMatch = isDateInRange(receipt.purchase_date, expense.date);
        const vendorSimilarity = calculateVendorSimilarity(receipt.vendor_name, expense.vendor_name);
        const vendorMatch = vendorSimilarity > 0.3;

        // Calculate match score
        let score = 0;
        if (amountMatch) score += 50;
        if (dateMatch) score += 30;
        if (vendorMatch) score += vendorSimilarity * 20;

        return {
          expense,
          amountMatch,
          dateMatch,
          vendorMatch,
          score,
        };
      })
      .filter(m => m.amountMatch || (m.dateMatch && m.vendorMatch) || m.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [expenses]);

  const handleFileUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    setIsParsing(true);
    setParsedReceipt(null);
    setMatchCandidates([]);

    try {
      // Upload to storage first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/business-receipt-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(fileName);

      setReceiptImageUrl(urlData.publicUrl);

      // Parse receipt using edge function
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('parse-receipt-image', {
        body: { 
          image_base64: base64,
          extract_line_items: false,
        },
      });

      if (error) throw error;

      if (data?.vendor_name && data?.total_amount) {
        const receipt: ParsedReceipt = {
          vendor_name: data.vendor_name,
          total_amount: data.total_amount,
          purchase_date: data.purchase_date || new Date().toISOString().split('T')[0],
          subtotal: data.subtotal,
          tax_amount: data.tax_amount,
        };
        setParsedReceipt(receipt);
        
        // Find matches
        const candidates = findMatchCandidates(receipt);
        setMatchCandidates(candidates);
        
        if (candidates.length === 0) {
          toast.info('No matching expenses found. Try uploading a different receipt.');
        }
      } else {
        toast.error('Could not parse receipt details. Please try a clearer image.');
      }
    } catch (error: any) {
      console.error('Error parsing receipt:', error);
      toast.error(error.message || 'Failed to parse receipt');
    } finally {
      setIsParsing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleAttachReceipt = async (expenseId: string) => {
    if (!receiptImageUrl) return;

    setIsAttaching(true);
    try {
      const { error } = await supabase
        .from('business_expenses')
        .update({ receipt_url: receiptImageUrl })
        .eq('id', expenseId);

      if (error) throw error;

      toast.success('Receipt attached to expense');
      handleReset();
      onReceiptAttached();
    } catch (error: any) {
      console.error('Error attaching receipt:', error);
      toast.error(error.message || 'Failed to attach receipt');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleReset = () => {
    setParsedReceipt(null);
    setReceiptImageUrl(null);
    setMatchCandidates([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Paperclip className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Attach Receipt to Expense</p>
                <p className="text-xs text-muted-foreground">
                  Upload a receipt to auto-match and attach to existing transactions
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {isOpen ? 'Close' : 'Open'}
              </Badge>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Upload Zone */}
            {!parsedReceipt && !isParsing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isDragging 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag & drop receipt image or <span className="text-primary">click to upload</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Or paste (Ctrl+V) • JPG, PNG, WebP
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Parsing State */}
            {isParsing && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 bg-muted/30 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Parsing receipt...</p>
              </div>
            )}

            {/* Parsed Receipt + Match Candidates */}
            {parsedReceipt && !isParsing && (
              <div className="space-y-4">
                {/* Parsed Receipt Summary */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Paperclip className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{parsedReceipt.vendor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(parsedReceipt.total_amount)} • {formatDisplayDate(parsedReceipt.purchase_date)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Match Candidates */}
                {matchCandidates.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Match to existing expense:
                    </p>
                    {matchCandidates.map((match) => (
                      <div
                        key={match.expense.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Match Indicators */}
                          <div className="flex gap-1">
                            <div 
                              className={cn(
                                "p-1 rounded",
                                match.amountMatch ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                              )}
                              title="Amount match"
                            >
                              <DollarSign className="h-3 w-3" />
                            </div>
                            <div 
                              className={cn(
                                "p-1 rounded",
                                match.dateMatch ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                              )}
                              title="Date in range"
                            >
                              <Calendar className="h-3 w-3" />
                            </div>
                            <div 
                              className={cn(
                                "p-1 rounded",
                                match.vendorMatch ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                              )}
                              title="Vendor match"
                            >
                              <Building2 className="h-3 w-3" />
                            </div>
                          </div>

                          {/* Expense Details */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {match.expense.vendor_name || 'Unknown Vendor'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(match.expense.amount)} • {formatDisplayDate(match.expense.date)} • {getCategoryLabel(match.expense.category)}
                            </p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAttachReceipt(match.expense.id)}
                          disabled={isAttaching}
                          className="gap-1"
                        >
                          {isAttaching ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Attach
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
                    <p className="text-sm">No matching expenses found</p>
                    <p className="text-xs mt-1">Try uploading a different receipt or check that matching expenses exist</p>
                  </div>
                )}

                {/* Cancel Button */}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
