import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileImage, Loader2, Receipt, Trash2, Check, X, Sparkles, ChevronDown, ChevronUp, ChevronRight, AlertCircle, AlertTriangle, Clipboard, Package, Wrench, Link2, Building, CalendarIcon, Home, Building2, Download, Camera, Info, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getBudgetCategories, getBusinessExpenseCategories, type BudgetCategory } from '@/types';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface SimpleProject {
  id: string;
  name: string;
  address?: string;
  status?: string;
}
interface LineItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  suggested_category: string;
  project_id?: string;
  notes?: string;
}

interface PendingReceipt {
  id: string;
  vendor_name: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  purchase_date: string;
  status: string;
  receipt_image_url?: string;
  matched_qb_id?: string;
  match_confidence?: number;
  warnings?: string[];
  line_items?: LineItem[];
}

interface QBExpense {
  id: string;
  qb_id?: string;
  vendor_name: string | null;
  amount: number;
  date: string;
  description?: string | null;
  payment_method?: string | null;
  is_imported?: boolean;
}

interface MatchedExpense {
  receipt: PendingReceipt;
  qbExpense: QBExpense;
  isManual?: boolean; // Track if this was a manual link
}

interface SmartSplitReceiptUploadProps {
  projects?: SimpleProject[];
  pendingQBExpenses?: QBExpense[]; // QB transactions available for manual linking
  onReceiptProcessed?: () => void;
  onRefreshQBExpenses?: () => void;
}

export function SmartSplitReceiptUpload({ projects = [], pendingQBExpenses = [], onReceiptProcessed, onRefreshQBExpenses }: SmartSplitReceiptUploadProps) {
  const { companyName } = useCompanySettings();
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [matchedReceipts, setMatchedReceipts] = useState<MatchedExpense[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchedExpense | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [awaitingCollapsed, setAwaitingCollapsed] = useState(false);
  const uploadZoneRef = useRef<HTMLDivElement>(null);
  
  const [editableCategories, setEditableCategories] = useState<Record<number, string>>({});
  const [editableQuantities, setEditableQuantities] = useState<Record<number, number>>({});
  const [editablePrices, setEditablePrices] = useState<Record<number, number>>({});
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [expenseType, setExpenseType] = useState<'product' | 'labor'>('product');
  const [costType, setCostType] = useState<string>('construction');
  const [isImporting, setIsImporting] = useState(false);
  const [assignmentType, setAssignmentType] = useState<'project' | 'business'>('project');
  const [includeTax, setIncludeTax] = useState(true);
  const [isReparsing, setIsReparsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);

  // Process multiple files sequentially
  const processMultipleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length, currentFileName: '' });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ 
        current: i + 1, 
        total: files.length, 
        currentFileName: file.name 
      });
      
      try {
        await handleFileUpload(file);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with remaining files
      }
    }
    
    setUploadProgress(null);
    setIsUploading(false);
  };

  // Handle paste events (Ctrl+V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (isUploading) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(file);
        }
        break;
      }
    }
  }, [isUploading]);

  // Add global paste listener when expanded
  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [isExpanded, handlePaste]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Compute warnings from receipt data (since warnings aren't persisted)
  const getReceiptWarnings = (receipt: PendingReceipt): string[] => {
    if (receipt.warnings && receipt.warnings.length > 0) return receipt.warnings;
    const warnings: string[] = [];
    if (receipt.line_items && receipt.line_items.length > 0 && receipt.subtotal > 0) {
      const itemsTotal = receipt.line_items.reduce((s, i) => s + i.total_price, 0);
      const diff = Math.abs(receipt.subtotal - itemsTotal);
      const pct = (diff / receipt.subtotal) * 100;
      if (pct > 10) {
        warnings.push(`Line items total (${formatCurrency(itemsTotal)}) differs from subtotal (${formatCurrency(receipt.subtotal)}) by ${pct.toFixed(1)}%`);
      } else if (pct > 2) {
        warnings.push(`Minor discrepancy: items total ${formatCurrency(itemsTotal)} vs subtotal ${formatCurrency(receipt.subtotal)}`);
      }
    }
    return warnings;
  };

  // Match criteria helper functions
  const isAmountMatch = (receiptAmount: number, qbAmount: number) => 
    Math.abs(receiptAmount - qbAmount) <= 0.01;

  const isDateInRange = (receiptDate: string, qbDate: string) => {
    const receipt = new Date(receiptDate);
    const transaction = new Date(qbDate);
    const diffDays = (transaction.getTime() - receipt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= -2 && diffDays <= 5;
  };

  const isVendorMatch = (vendor1: string, vendor2: string) => {
    const norm1 = vendor1?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || '';
    const norm2 = vendor2?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || '';
    if (!norm1 || !norm2) return false;
    return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
  };

  // Match criteria indicator component
  const MatchIndicators = ({ receipt, qbExpense }: { receipt: PendingReceipt; qbExpense: QBExpense }) => {
    const amountMatched = isAmountMatch(receipt.total_amount, qbExpense.amount);
    const dateMatched = isDateInRange(receipt.purchase_date, qbExpense.date);
    const vendorMatched = isVendorMatch(receipt.vendor_name, qbExpense.vendor_name || '');

    return (
      <div className="flex items-center gap-1">
        <div
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
            amountMatched 
              ? "bg-success/20 border-success text-success" 
              : "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
          )}
          title={amountMatched ? "Price matched" : "Price did not match"}
        >
          $
        </div>
        <div
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center border",
            dateMatched 
              ? "bg-success/20 border-success text-success" 
              : "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
          )}
          title={dateMatched ? "Date within range" : "Date outside range"}
        >
          <CalendarIcon className="h-2.5 w-2.5" />
        </div>
        <div
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center border",
            vendorMatched 
              ? "bg-success/20 border-success text-success" 
              : "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
          )}
          title={vendorMatched ? "Contractor matched" : "Contractor did not match"}
        >
          <Building className="h-2.5 w-2.5" />
        </div>
      </div>
    );
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get category label from BUDGET_CATEGORIES
  const getCategoryLabel = (category: string) => {
    const found = getBudgetCategories().find(c => c.value === category);
    return found?.label || category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
  };

  // Category options for the dropdown - dynamic based on assignment type
  const projectCategoryOptions = getBudgetCategories().map(c => c.value);
  
  const businessCategoryOptions = getBusinessExpenseCategories().map(c => c.value);
  
  const categoryOptions = assignmentType === 'project' ? projectCategoryOptions : businessCategoryOptions;
  
  // Get category label - check both project and business categories
  const getCategoryLabelDynamic = (category: string) => {
    const projectCat = getBudgetCategories().find(c => c.value === category);
    if (projectCat) return projectCat.label;
    const businessCat = getBusinessExpenseCategories().find(c => c.value === category);
    if (businessCat) return businessCat.label;
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
  };

  // Fetch pending receipts on mount
  const fetchPendingReceipts = useCallback(async () => {
    try {
      const { data: receipts, error } = await supabase
        .from('pending_receipts')
        .select('*')
        .in('status', ['pending', 'matched', 'parsing'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch line items for each receipt
      if (receipts && receipts.length > 0) {
        const receiptIds = receipts.map(r => r.id);
        const { data: lineItems } = await supabase
          .from('receipt_line_items')
          .select('*')
          .in('receipt_id', receiptIds);

        const receiptsWithItems = receipts.map(receipt => ({
          ...receipt,
          line_items: lineItems?.filter(item => item.receipt_id === receipt.id) || [],
        }));

        setPendingReceipts(receiptsWithItems);

        // Check for matched receipts and fetch QB expenses
        const matchedReceiptsData = receiptsWithItems.filter(r => r.status === 'matched' && r.matched_qb_id);
        if (matchedReceiptsData.length > 0) {
          const qbIds = matchedReceiptsData.map(r => r.matched_qb_id);
          const { data: qbExpenses } = await supabase
            .from('quickbooks_expenses')
            .select('*')
            .in('qb_id', qbIds);

          const matches: MatchedExpense[] = matchedReceiptsData.map(receipt => ({
            receipt,
            qbExpense: qbExpenses?.find(qb => qb.qb_id === receipt.matched_qb_id) || {
              id: '',
              vendor_name: 'Unknown',
              amount: receipt.total_amount,
              date: receipt.purchase_date,
            },
          }));

          setMatchedReceipts(matches);
        } else {
          // Clear matched receipts when none exist (fixes stale UI after deletion)
          setMatchedReceipts([]);
        }
      } else {
        setPendingReceipts([]);
        setMatchedReceipts([]);
      }
    } catch (error) {
      console.error('Error fetching pending receipts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingReceipts();
  }, [fetchPendingReceipts]);

  // Poll every 5s while any receipt is still parsing
  useEffect(() => {
    const hasParsing = pendingReceipts.some(r => r.status === 'parsing');
    if (!hasParsing) return;
    const interval = setInterval(() => {
      fetchPendingReceipts();
    }, 5000);
    return () => clearInterval(interval);
  }, [pendingReceipts, fetchPendingReceipts]);

  // Handle file upload — fire-and-forget background parsing
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or PDF file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(fileName);

      // Convert to base64 for AI parsing
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create pending receipt row with 'parsing' status
      const { data: receipt, error: receiptError } = await supabase
        .from('pending_receipts')
        .insert({
          user_id: user.id,
          vendor_name: 'Processing...',
          total_amount: 0,
          tax_amount: 0,
          subtotal: 0,
          purchase_date: new Date().toISOString().split('T')[0],
          receipt_image_url: publicUrl,
          status: 'parsing',
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Refresh list immediately to show "Parsing..." entry
      await fetchPendingReceipts();

      // Fire-and-forget: call edge function with receipt_id
      supabase.functions.invoke('parse-receipt-image', {
        body: { image_base64: base64, receipt_id: receipt.id },
      }).then((res) => {
        if (res.error || !res.data?.success) {
          console.error('Background parse failed:', res.error || res.data?.error);
        }
        // Polling will pick up the result
        fetchPendingReceipts();
        onReceiptProcessed?.();
      }).catch((err) => {
        console.error('Background parse error:', err);
        fetchPendingReceipts();
      });

      toast({
        title: 'Receipt uploaded!',
        description: 'AI is parsing your receipt in the background...',
      });

    } catch (error: any) {
      console.error('Error processing receipt:', error);
      toast({
        title: 'Failed to upload receipt',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith('image/') || file.type === 'application/pdf'
      );
      if (files.length === 1) {
        handleFileUpload(files[0]);
      } else if (files.length > 1) {
        await processMultipleFiles(files);
      }
    }
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (files.length === 1) {
        handleFileUpload(files[0]);
      } else {
        await processMultipleFiles(files);
      }
      // Reset input so the same files can be selected again
      e.target.value = '';
    }
  };

  // Silent auto-match - only shows toast on success
  const runAutoMatching = async () => {
    if (isMatching) return; // Prevent concurrent runs
    
    try {
      const { data, error } = await supabase.functions.invoke('match-receipts');
      
      if (error) {
        console.log('Auto-match error:', error);
        return;
      }
      
      if (data.matches && data.matches.length > 0) {
        toast({
          title: 'Matches found!',
          description: `Auto-matched ${data.matches.length} receipt(s) to bank transactions`,
        });
        await fetchPendingReceipts();
      }
    } catch (error) {
      console.log('Auto-match failed silently:', error);
    }
  };

  // Auto-match on mount/data change when there are pending receipts and QB expenses
  useEffect(() => {
    const pendingToMatch = pendingReceipts.filter(r => r.status === 'pending');
    if (pendingToMatch.length > 0 && pendingQBExpenses.length > 0) {
      runAutoMatching();
    }
  }, [pendingReceipts.length, pendingQBExpenses.length]);

  // Run matching (manual button - always shows result)
  const runMatching = async () => {
    setIsMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-receipts');
      
      if (error) throw error;
      
      if (data.matches && data.matches.length > 0) {
        toast({
          title: 'Matches found!',
          description: `Found ${data.matches.length} receipt-transaction matches`,
        });
        await fetchPendingReceipts();
      } else {
        toast({
          title: 'No matches found',
          description: 'Receipts are waiting for transactions to appear in QuickBooks',
        });
      }
    } catch (error: any) {
      console.error('Error matching receipts:', error);
      toast({
        title: 'Matching failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Delete pending receipt (must delete line items first due to foreign key)
  const deleteReceipt = async (receiptId: string) => {
    try {
      // First delete associated line items
      const { error: lineItemsError } = await supabase
        .from('receipt_line_items')
        .delete()
        .eq('receipt_id', receiptId);
      
      if (lineItemsError) {
        console.error('Error deleting line items:', lineItemsError);
      }
      
      // Then delete the receipt
      const { error: receiptError } = await supabase
        .from('pending_receipts')
        .delete()
        .eq('id', receiptId);
      
      if (receiptError) throw receiptError;
      
      await fetchPendingReceipts();
      toast({ title: 'Receipt deleted' });
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      toast({ 
        title: 'Failed to delete receipt', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  // Re-parse a receipt by re-submitting its image to the AI
  const handleReparse = async (receipt: PendingReceipt) => {
    if (!receipt.receipt_image_url || isReparsing) return;

    setIsReparsing(true);
    try {
      // Download the image and convert to base64 (AI gateway can't fetch Supabase URLs)
      const imageResponse = await fetch(receipt.receipt_image_url);
      if (!imageResponse.ok) throw new Error('Failed to download receipt image');
      const blob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-receipt-image', {
        body: { image_base64: base64 },
      });

      if (parseError) throw parseError;
      if (!parseResult.success) throw new Error(parseResult.error || 'Parse failed');

      const receiptData = parseResult.data;

      // Delete old line items
      await supabase.from('receipt_line_items').delete().eq('receipt_id', receipt.id);

      // Update receipt totals
      await supabase.from('pending_receipts').update({
        vendor_name: receiptData.vendor_name,
        total_amount: receiptData.total_amount,
        tax_amount: receiptData.tax_amount,
        subtotal: receiptData.subtotal,
      }).eq('id', receipt.id);

      // Insert new line items
      if (receiptData.line_items && receiptData.line_items.length > 0) {
        const lineItemsToInsert = receiptData.line_items.map((item: any) => ({
          receipt_id: receipt.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          suggested_category: item.suggested_category,
          notes: null,
        }));

        await supabase.from('receipt_line_items').insert(lineItemsToInsert);
      }

      toast({
        title: 'Receipt re-parsed!',
        description: `Found ${receiptData.line_items?.length || 0} items from ${receiptData.vendor_name}`,
      });

      // Reset editable state since line items changed
      setEditableCategories({});
      setEditableQuantities({});
      setEditablePrices({});

      await fetchPendingReceipts();
    } catch (error: any) {
      console.error('Error re-parsing receipt:', error);
      toast({
        title: 'Re-parse failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsReparsing(false);
    }
  };

  // Download receipt image
  const downloadReceipt = async (receiptImageUrl: string, vendorName: string) => {
    if (!receiptImageUrl) return;
    
    try {
      const urlParts = receiptImageUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        // Fallback: direct download
        const link = document.createElement('a');
        link.href = receiptImageUrl;
        link.download = `receipt-${vendorName}`;
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
        console.error('Failed to download receipt:', error);
        toast({
          title: 'Download failed',
          description: 'Could not download receipt image',
          variant: 'destructive',
        });
        return;
      }
      
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filePath.split('/').pop() || `receipt-${vendorName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast({
        title: 'Download failed',
        variant: 'destructive',
      });
    }
  };

  // Accept match and open split modal
  const acceptMatch = (match: MatchedExpense) => {
    setSelectedMatch(match);
    // Initialize editable categories and quantities from line items
    const initialCategories: Record<number, string> = {};
    const initialQuantities: Record<number, number> = {};
    const initialPrices: Record<number, number> = {};
    (match.receipt.line_items || []).forEach((item, idx) => {
      initialCategories[idx] = item.suggested_category || 'misc';
      initialQuantities[idx] = item.quantity || 1;
      initialPrices[idx] = item.unit_price;
    });
    setEditableCategories(initialCategories);
    setIncludeTax(true); // Reset tax toggle when opening modal
    setEditableQuantities(initialQuantities);
    setEditablePrices(initialPrices);
    setShowMatchModal(true);
  };

  // Handle manual transaction linking (bypasses auto-match)
  const handleManualLink = (receipt: PendingReceipt, qbExpense: QBExpense) => {
    const manualMatch: MatchedExpense = {
      receipt,
      qbExpense: {
        id: qbExpense.id,
        qb_id: qbExpense.qb_id,
        vendor_name: qbExpense.vendor_name,
        amount: qbExpense.amount,
        date: qbExpense.date,
        description: qbExpense.description,
        payment_method: qbExpense.payment_method,
      },
      isManual: true,
    };
    acceptMatch(manualMatch);
  };

  // Helper to group line items by category with editable quantities/prices
  const groupByCategory = (lineItems: LineItem[], categories: Record<number, string>, quantities: Record<number, number>, prices: Record<number, number>) => {
    const groups: Record<string, { items: (LineItem & { editedQuantity: number; editedTotal: number })[], total: number }> = {};

    lineItems.forEach((item, idx) => {
      const category = categories[idx] || item.suggested_category || 'misc';
      const editedQuantity = quantities[idx] ?? item.quantity ?? 1;
      const price = prices[idx] ?? item.unit_price;
      const editedTotal = Math.round(editedQuantity * price * 100) / 100;

      if (!groups[category]) {
        groups[category] = { items: [], total: 0 };
      }
      groups[category].items.push({ ...item, editedQuantity, editedTotal });
      groups[category].total += editedTotal;
    });

    return groups;
  };

  // Finalize the import - create expense records split by category
  const finalizeImport = async () => {
    // Validate: need project for project assignment, or just proceed for business
    if (!selectedMatch) return;
    if (assignmentType === 'project' && !selectedProject) return;

    setIsImporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Track original QB expense info
      const originalQbId = (selectedMatch.qbExpense as any).qb_id || selectedMatch.qbExpense.id;

      // Check if this QB expense was already split-imported (duplicate detection)
      const { data: existingSplits } = await supabase
        .from('quickbooks_expenses')
        .select('id, qb_id')
        .like('qb_id', `${originalQbId}_split_%`);

      if (existingSplits && existingSplits.length > 0) {
        // Warn user that this receipt may have been imported before
        const confirmed = window.confirm(
          `This QuickBooks transaction appears to have been split-imported before (${existingSplits.length} existing splits found). Continuing will update those records. Proceed?`
        );
        if (!confirmed) {
          setIsImporting(false);
          return;
        }
      }

      // Group line items by category with user-edited quantities/prices
      const categoryGroups = groupByCategory(
        selectedMatch.receipt.line_items || [],
        editableCategories,
        editableQuantities,
        editablePrices
      );

      // Calculate proportional tax per category (using edited quantities)
      const subtotal = Object.values(categoryGroups).reduce((sum, group) => sum + group.total, 0);
      const taxAmount = selectedMatch.receipt.tax_amount || 0;

      const originalQbExpenseId = selectedMatch.qbExpense.id;
      const categoryKeys = Object.keys(categoryGroups);
      
      // BUSINESS ASSIGNMENT - Insert into business_expenses table
      if (assignmentType === 'business') {
        const qbTransactionAmount = selectedMatch.qbExpense.amount;
        
        for (const category of categoryKeys) {
          const group = categoryGroups[category];
          const proportion = subtotal > 0 ? group.total / subtotal : 0;
          const categoryAmount = Math.round(qbTransactionAmount * proportion * 100) / 100;
          
          const itemNotes = group.items
            .map(item => `${item.item_name} (${item.editedQuantity}x)`)
            .join(', ');

          // Insert into business_expenses
          const { error: insertError } = await supabase
            .from('business_expenses')
            .insert({
              user_id: user.id,
              category: category,
              amount: categoryAmount,
              date: selectedMatch.qbExpense.date,
              vendor_name: selectedMatch.qbExpense.vendor_name,
              description: selectedMatch.qbExpense.description || selectedMatch.receipt.vendor_name,
              notes: itemNotes,
              receipt_url: selectedMatch.receipt.receipt_image_url || null,
              payment_method: selectedMatch.qbExpense.payment_method as any || null,
              includes_tax: true, // Amount already includes proportional tax
            });

          if (insertError) throw insertError;
        }

        // Mark original QB expense as imported (audit trail)
        await supabase
          .from('quickbooks_expenses')
          .update({ is_imported: true })
          .eq('id', originalQbExpenseId);

        // Mark receipt as imported
        const { error: receiptError } = await supabase
          .from('pending_receipts')
          .update({ status: 'imported' })
          .eq('id', selectedMatch.receipt.id);

        if (receiptError) throw receiptError;

        toast({
          title: 'Business expenses imported!',
          description: `Split into ${categoryKeys.length} ${categoryKeys.length === 1 ? 'category' : 'categories'} for ${companyName}.`,
        });
      } else {
        // PROJECT ASSIGNMENT - Existing flow
        for (let i = 0; i < categoryKeys.length; i++) {
          const category = categoryKeys[i];
          const group = categoryGroups[category];

          const proportion = subtotal > 0 ? group.total / subtotal : 0;
          const qbTransactionAmount = selectedMatch.qbExpense.amount;
          const categoryAmount = Math.round(qbTransactionAmount * proportion * 100) / 100;

          const itemNotes = group.items
            .map(item => `${item.item_name} (${item.editedQuantity}x)`)
            .join(', ');

          // Find or create project_category
          const { data: existingCategory } = await supabase
            .from('project_categories')
            .select('id')
            .eq('project_id', selectedProject)
            .eq('category', category as any)
            .maybeSingle();

          let categoryId: string;
          
          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            const { data: newCategory, error: categoryError } = await supabase
              .from('project_categories')
              .insert({
                project_id: selectedProject,
                category: category as any,
                estimated_budget: 0,
              })
              .select('id')
              .single();

            if (categoryError) throw categoryError;
            categoryId = newCategory.id;
          }

          // First category updates original QB expense with _split_ suffix, rest use check-then-upsert
          if (i === 0) {
            const splitQbId = `${originalQbId}_split_${category}`;
            console.log('Updating original QB expense with split suffix:', {
              id: originalQbExpenseId,
              newQbId: splitQbId,
              newAmount: categoryAmount,
              category,
              notes: itemNotes.slice(0, 50) + '...',
            });
            
            await supabase
              .from('quickbooks_expenses')
              .update({ original_amount: qbTransactionAmount })
              .eq('id', originalQbExpenseId)
              .is('original_amount', null);
            
            const { data: updateResult, error: qbError } = await supabase
              .from('quickbooks_expenses')
              .update({
                qb_id: splitQbId,
                is_imported: true,
                amount: categoryAmount,
                notes: itemNotes,
                receipt_url: selectedMatch.receipt.receipt_image_url || null,
                project_id: selectedProject,
                category_id: categoryId,
                expense_type: expenseType,
                cost_type: costType,
                payment_method: selectedMatch.qbExpense.payment_method || null,
              })
              .eq('id', originalQbExpenseId)
              .select('id, amount');

            if (qbError) {
              console.error('Failed to update original QB expense:', qbError);
              throw qbError;
            }
            
            console.log('Original QB expense updated:', updateResult);
          } else {
            const splitQbId = `${originalQbId}_split_${category}`;
            const { data: existingSplit } = await supabase
              .from('quickbooks_expenses')
              .select('id')
              .eq('qb_id', splitQbId)
              .maybeSingle();

            if (existingSplit) {
              const { error: updateError } = await supabase
                .from('quickbooks_expenses')
                .update({
                  amount: categoryAmount,
                  category_id: categoryId,
                  project_id: selectedProject,
                  expense_type: expenseType,
                  cost_type: costType,
                  notes: itemNotes,
                  receipt_url: selectedMatch.receipt.receipt_image_url || null,
                  payment_method: selectedMatch.qbExpense.payment_method || null,
                })
                .eq('id', existingSplit.id);

              if (updateError) throw updateError;
            } else {
              const { error: insertError } = await supabase
                .from('quickbooks_expenses')
                .insert({
                  user_id: user.id,
                  qb_id: splitQbId,
                  vendor_name: selectedMatch.qbExpense.vendor_name,
                  amount: categoryAmount,
                  date: selectedMatch.qbExpense.date,
                  description: selectedMatch.qbExpense.description,
                  is_imported: true,
                  project_id: selectedProject,
                  category_id: categoryId,
                  expense_type: expenseType,
                  cost_type: costType,
                  notes: itemNotes,
                  receipt_url: selectedMatch.receipt.receipt_image_url || null,
                  payment_method: selectedMatch.qbExpense.payment_method || null,
                });

              if (insertError) throw insertError;
            }
          }
        }

        // Mark receipt as imported
        const { error: receiptError } = await supabase
          .from('pending_receipts')
          .update({ status: 'imported' })
          .eq('id', selectedMatch.receipt.id);

        if (receiptError) throw receiptError;

        toast({
          title: 'Expenses imported!',
          description: `Split into ${categoryKeys.length} ${categoryKeys.length === 1 ? 'category' : 'categories'} for ${selectedMatch.receipt.vendor_name}.`,
        });
      }

      setShowMatchModal(false);
      setSelectedMatch(null);
      setSelectedProject('');
      setExpenseType('product');
      setCostType('construction');
      setAssignmentType('project');
      
      // Refresh both lists
      await fetchPendingReceipts();
      onRefreshQBExpenses?.();
      onReceiptProcessed?.();
    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const pendingCount = pendingReceipts.filter(r => r.status === 'pending').length;
  const matchedCount = matchedReceipts.length;

  return (
    <>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="glass-card overflow-hidden border-2 border-dashed border-primary/20">
          <CollapsibleTrigger asChild>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    SmartSplit Receipt Matching
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="start" className="max-w-xs text-sm p-3">
                          <p>Allow time for receipts to parse after uploading.</p>
                          <p className="mt-1">Upload clear, high-quality PDFs or photos for best parsing accuracy.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {pendingCount} waiting
                      </Badge>
                    )}
                    {matchedCount > 0 && (
                      <Badge variant="default" className="text-xs bg-success/20 text-success border-success/30">
                        {matchedCount} matched!
                      </Badge>
                    )}
                    {pendingCount === 0 && matchedCount === 0 && (
                      <span className="text-xs text-muted-foreground">Upload receipts now, auto-match later</span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border p-4 space-y-4">
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-all",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
              <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  id="receipt-upload"
                  disabled={isUploading}
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  {uploadProgress && uploadProgress.total > 1 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm font-medium">
                        Parsing receipt {uploadProgress.current} of {uploadProgress.total}...
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {uploadProgress.currentFileName}
                      </p>
                    </div>
                  ) : isParsing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm font-medium">Parsing receipt with AI...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Drop receipts here or click to upload</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clipboard className="h-3 w-3" />
                        Tip: Paste with Ctrl+V • Select multiple files
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Matched Receipts - Priority Display */}
              {matchedReceipts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" />
                    Matches Ready for Import
                  </h4>
                  {matchedReceipts.map((match) => (
                    <Card key={match.receipt.id} className="border-success/30 bg-success/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-success" />
                              <span className="font-medium">{match.receipt.vendor_name}</span>
                              <MatchIndicators receipt={match.receipt} qbExpense={match.qbExpense} />
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(match.receipt.total_amount)} • {formatDate(match.receipt.purchase_date)}
                              {match.receipt.line_items && match.receipt.line_items.length > 0 && (
                                <span> • {match.receipt.line_items.length} items</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {match.receipt.receipt_image_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadReceipt(match.receipt.receipt_image_url!, match.receipt.vendor_name)}
                                className="text-muted-foreground hover:text-primary"
                                title="Download receipt"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" onClick={() => acceptMatch(match)} className="gap-1">
                              <Check className="h-4 w-4" />
                              Import
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteReceipt(match.receipt.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pending Receipts */}
              {/* Parsing receipts */}
              {pendingReceipts.filter(r => r.status === 'parsing').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Parsing with AI...
                  </h4>
                  {pendingReceipts.filter(r => r.status === 'parsing').map((receipt) => (
                    <Card key={receipt.id} className="border-primary/30 bg-primary/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                          <span className="text-sm text-muted-foreground">Parsing</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pendingReceipts.filter(r => r.status === 'pending').length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAwaitingCollapsed(!awaitingCollapsed)}
                      className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
                    >
                      {awaitingCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Awaiting Bank Transaction
                      <Badge variant="secondary" className="text-xs ml-1">
                        {pendingReceipts.filter(r => r.status === 'pending').length}
                      </Badge>
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runMatching}
                      disabled={isMatching}
                      className="gap-1"
                    >
                      {isMatching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Find Matches
                    </Button>
                  </div>
                  {!awaitingCollapsed && pendingReceipts.filter(r => r.status === 'pending').map((receipt) => (
                    <Card key={receipt.id} className="border-warning/30 bg-warning/5">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4 text-warning shrink-0" />
                              <span className="font-medium truncate">{receipt.vendor_name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(receipt.total_amount)} • {formatDate(receipt.purchase_date)}
                              {receipt.line_items && receipt.line_items.length > 0 && (
                                <span> • {receipt.line_items.length} items parsed</span>
                              )}
                            </div>
                            
                            {/* Manual Link Transaction Dropdown */}
                            {pendingQBExpenses.length > 0 && (
                              <div className="mt-2">
                                <Select
                                  value=""
                                  onValueChange={(qbId) => {
                                    const selectedQb = pendingQBExpenses.find(qb => qb.id === qbId);
                                    if (selectedQb) {
                                      handleManualLink(receipt, selectedQb);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-full text-xs bg-background">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Link2 className="h-3 w-3" />
                                      <span>Link Transaction...</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[200px] z-50 bg-popover">
                                    {pendingQBExpenses.map((qb) => (
                                      <SelectItem key={qb.id} value={qb.id} className="text-xs">
                                        <div className="flex items-center justify-between gap-2 w-full">
                                          <span className="truncate">{qb.vendor_name || 'Unknown'}</span>
                                          <span className="font-mono text-muted-foreground">
                                            {formatCurrency(qb.amount)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {receipt.receipt_image_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadReceipt(receipt.receipt_image_url!, receipt.vendor_name)}
                                className="text-muted-foreground hover:text-primary"
                                title="Download receipt"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteReceipt(receipt.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pendingReceipts.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <p>Upload receipts right after purchase.</p>
                  <p>We'll auto-match when the charge hits QuickBooks (2-3 days).</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Match Approval Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMatch?.isManual ? (
                <Link2 className="h-5 w-5 text-primary" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
              {selectedMatch?.isManual ? 'Manual Link' : 'SmartSplit Match Found'}
              {selectedMatch && !selectedMatch.isManual && (
                <div className="ml-auto mr-6">
                  <MatchIndicators receipt={selectedMatch.receipt} qbExpense={selectedMatch.qbExpense} />
                </div>
              )}
              {selectedMatch?.isManual && (
                <Badge variant="secondary" className="text-xs ml-auto bg-primary/10 text-primary">
                  Manual
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedMatch?.isManual
                ? 'You manually linked this receipt. Review the suggested split below.'
                : 'We matched your receipt to a QuickBooks transaction. Review the suggested split below.'}
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4">
              {/* Assignment Type & Project Selection */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Assign to</h4>
                
                <ToggleGroup
                  type="single"
                  value={assignmentType}
                  onValueChange={(value) => value && setAssignmentType(value as 'project' | 'business')}
                  className="justify-start"
                >
                  <ToggleGroupItem value="project" size="sm" className="gap-1">
                    <Home className="h-3 w-3" />
                    Project
                  </ToggleGroupItem>
                  <ToggleGroupItem value="business" size="sm" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {companyName}
                  </ToggleGroupItem>
                </ToggleGroup>
                
                {assignmentType === 'project' && (
                  <div className="space-y-3">
                    <ProjectAutocomplete
                      projects={projects}
                      value={selectedProject}
                      onSelect={setSelectedProject}
                      placeholder="Search"
                    />

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm text-muted-foreground">Type:</Label>
                        <ToggleGroup
                          type="single"
                          value={expenseType}
                          onValueChange={(value) => value && setExpenseType(value as 'product' | 'labor')}
                          className="justify-start"
                        >
                          <ToggleGroupItem value="product" size="sm" className="gap-1">
                            <Package className="h-3 w-3" />
                            Product
                          </ToggleGroupItem>
                          <ToggleGroupItem value="labor" size="sm" className="gap-1">
                            <Wrench className="h-3 w-3" />
                            Labor
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Cost Type:</Label>
                        <Select value={costType} onValueChange={setCostType}>
                          <SelectTrigger className="h-8 text-sm w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="loan">Loan</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="transaction">Transaction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                {assignmentType === 'business' && (
                  <div className="text-sm text-muted-foreground p-3 rounded-md bg-muted/30">
                    Expense will be added to <span className="font-medium text-foreground">{companyName}</span> business expenses
                  </div>
                )}
              </div>

              {/* Parsing Confidence Warning */}
              {(() => {
                const receiptWarnings = getReceiptWarnings(selectedMatch.receipt);
                // Compute confidence from line items vs subtotal discrepancy
                let confidence: 'high' | 'medium' | 'low' = 'high';
                if (selectedMatch.receipt.line_items && selectedMatch.receipt.subtotal > 0) {
                  const itemsTotal = selectedMatch.receipt.line_items.reduce((s, i) => s + i.total_price, 0);
                  const pct = Math.abs(selectedMatch.receipt.subtotal - itemsTotal) / selectedMatch.receipt.subtotal * 100;
                  if (pct > 10) confidence = 'low';
                  else if (pct > 2) confidence = 'medium';
                }
                if (confidence === 'high' && receiptWarnings.length === 0) return null;
                return (
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-sm",
                    confidence === 'low'
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">
                        {confidence === 'low'
                          ? 'Low parsing confidence — please review prices'
                          : 'Some prices may need review'}
                      </p>
                      {receiptWarnings.length > 0 && (
                        <ul className="text-xs opacity-80 space-y-0.5">
                          {receiptWarnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-2 h-7 text-xs"
                        onClick={() => handleReparse(selectedMatch.receipt)}
                        disabled={isReparsing}
                      >
                        {isReparsing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Re-parse Receipt
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Match Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Receipt</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium">{selectedMatch.receipt.vendor_name}</p>
                    <p className="text-muted-foreground">{formatDate(selectedMatch.receipt.purchase_date)}</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedMatch.receipt.total_amount)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">QuickBooks Transaction</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium">{selectedMatch.qbExpense.vendor_name}</p>
                    <p className="text-muted-foreground">{formatDate(selectedMatch.qbExpense.date)}</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedMatch.qbExpense.amount)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Line Items */}
              {selectedMatch.receipt.line_items && selectedMatch.receipt.line_items.length > 0 && (() => {
                return (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium">
                      Suggested Split ({selectedMatch.receipt.line_items.length + (selectedMatch.receipt.tax_amount > 0 ? 1 : 0)} items)
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedMatch.receipt.line_items.map((item, idx) => {
                      const editedQty = editableQuantities[idx] ?? item.quantity ?? 1;
                      const editedPrice = editablePrices[idx] ?? item.unit_price;
                      const editedTotal = Math.round(editedQty * editedPrice * 100) / 100;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded bg-muted/30 text-sm">
                          <div className="flex-1">
                            <p className="font-medium">{item.item_name}</p>
                            {item.notes && item.notes.startsWith('Discount:') && (
                              <div className="flex items-center gap-1.5 text-[10px] text-green-500">
                                <span className="text-muted-foreground">{item.notes}</span>
                                <Badge variant="outline" className="text-[9px] h-4 px-1 border-green-500/30 text-green-500">
                                  Pro Discount
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Input
                                type="number"
                                min="1"
                                value={editedQty}
                                onChange={(e) => setEditableQuantities(prev => ({ 
                                  ...prev, 
                                  [idx]: Math.max(1, parseInt(e.target.value) || 1) 
                                }))}
                                className="w-12 h-5 px-1 text-xs text-center"
                              />
                              <span>×</span>
                              <span>$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editedPrice}
                                onChange={(e) => setEditablePrices(prev => ({
                                  ...prev,
                                  [idx]: parseFloat(e.target.value) || 0
                                }))}
                                className="w-16 h-5 px-1 text-xs text-center"
                              />
                            </div>
                          </div>
                          <Select
                            value={editableCategories[idx] || item.suggested_category || 'misc'}
                            onValueChange={(value) => setEditableCategories(prev => ({ ...prev, [idx]: value }))}
                          >
                            <SelectTrigger className="w-[140px] h-7 text-xs">
                              <SelectValue>{getCategoryLabelDynamic(editableCategories[idx] || item.suggested_category || 'misc')}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs">
                                  {getCategoryLabelDynamic(cat)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="font-mono">{formatCurrency(editedTotal)}</span>
                        </div>
                      );
                    })}
                    
                    {/* Tax Line Item */}
                    {selectedMatch.receipt.tax_amount > 0 && (
                      <div className={cn(
                        "flex items-center gap-3 p-2 rounded border text-sm transition-opacity",
                        includeTax 
                          ? "bg-amber-500/10 border-amber-500/20" 
                          : "bg-muted/20 border-muted opacity-50"
                      )}>
                        <div className="flex-1">
                          <p className={cn("font-medium", !includeTax && "line-through")}>Sales Tax</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Include in total</span>
                            <Switch
                              checked={includeTax}
                              onCheckedChange={setIncludeTax}
                              className="scale-75 origin-left"
                            />
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs",
                            includeTax 
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                              : "bg-muted/50 text-muted-foreground line-through"
                          )}
                        >
                          Tax
                        </Badge>
                        <span className={cn("font-mono", !includeTax && "line-through text-muted-foreground")}>
                          {formatCurrency(selectedMatch.receipt.tax_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Split Total */}
                  <div className="space-y-2 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Split Total</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(selectedMatch.qbExpense.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )})()}


            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto gap-2"
              onClick={() => selectedMatch && handleReparse(selectedMatch.receipt)}
              disabled={isReparsing}
            >
              {isReparsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-parse
            </Button>
            <Button variant="outline" onClick={() => setShowMatchModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={finalizeImport} 
              disabled={(assignmentType === 'project' && !selectedProject) || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {assignmentType === 'business' ? 'Import to Business' : 'Match & Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
