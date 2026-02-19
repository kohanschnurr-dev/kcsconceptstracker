import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Star, Users, MoreVertical, Pencil, Trash2, FileText, Sparkles, Download } from 'lucide-react';
import { ScopeOfWorkSheet } from '@/components/vendors/ScopeOfWorkSheet';
import { GenerateInvoiceSheet } from '@/components/project/GenerateInvoiceSheet';
import { generatePDF } from '@/lib/pdfExport';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NewVendorModal } from '@/components/NewVendorModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBudgetCategories, getVendorTrades } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  trades: string[];
  phone: string | null;
  email: string | null;
  has_w9: boolean;
  reliability_rating: number | null;
  pricing_model: 'flat' | 'hourly' | null;
  notes: string | null;
}

export default function Vendors() {
  const { toast } = useToast();
  const { settings, companyName } = useCompanySettings();
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTradeLabel = (trade: string) => {
    const found = getBudgetCategories().find(b => b.value === trade)?.label
      || getVendorTrades().find(t => t.value === trade)?.label;
    if (found) return found;
    return trade
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleGenerateVendorPDF = () => {
    const lines: string[] = [];
    lines.push('VENDOR DIRECTORY');
    lines.push(`Total: ${filteredVendors.length} vendor(s)\n`);
    lines.push('─'.repeat(60));

    filteredVendors.forEach((vendor, i) => {
      lines.push(`\n${i + 1}. ${vendor.name.toUpperCase()}`);
      if (vendor.trades.length > 0) {
        lines.push(`   Trades: ${vendor.trades.map(getTradeLabel).join(', ')}`);
      }
      if (vendor.phone) lines.push(`   Phone: ${vendor.phone}`);
      if (vendor.email) lines.push(`   Email: ${vendor.email}`);
      lines.push(`   Rating: ${'★'.repeat(vendor.reliability_rating || 0)}${'☆'.repeat(5 - (vendor.reliability_rating || 0))}`);
      lines.push(`   Pricing: ${vendor.pricing_model === 'flat' ? 'Flat Rate' : vendor.pricing_model === 'hourly' ? 'Hourly' : 'Not set'}`);
      lines.push(`   W9 on File: ${vendor.has_w9 ? 'Yes' : 'No'}`);
      if (vendor.notes) lines.push(`   Notes: ${vendor.notes}`);
      lines.push('   ' + '─'.repeat(56));
    });

    generatePDF(lines.join('\n'), {
      docType: 'Vendor Directory',
      companyName: companyName || 'Your Company',
      logoUrl: settings?.logo_url,
    });
  };

  const usedTrades = Array.from(new Set(vendors.flatMap(v => v.trades)))
    .map(value => ({ value, label: getTradeLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.trades.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesTrade = tradeFilter === 'all' || vendor.trades.includes(tradeFilter);
    return matchesSearch && matchesTrade;
  });

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setModalOpen(true);
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorToDelete.id);

      if (error) throw error;

      toast({
        title: 'Vendor deleted',
        description: `${vendorToDelete.name} has been removed.`,
      });
      
      fetchVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete vendor',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    }
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingVendor(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Vendors</h1>
            <p className="text-muted-foreground mt-1">Manage your contractors</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setScopeSheetOpen(true)} className="gap-2">
                  <FileText className="h-4 w-4" /> Scope of Work
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInvoiceOpen(true)} className="gap-2">
                  <FileText className="h-4 w-4" /> Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGenerateVendorPDF} className="gap-2">
                  <Download className="h-4 w-4" /> Generate PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {usedTrades.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="glass-card p-5 hover:border-primary/50 transition-all cursor-pointer animate-slide-up"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendor.trades.slice(0, 5).map((trade) => (
                          <Badge key={trade} variant="secondary" className="text-xs">
                            {getTradeLabel(trade)}
                          </Badge>
                        ))}
                        {vendor.trades.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{vendor.trades.length - 5} more
                          </Badge>
                        )}
                        {vendor.trades.length === 0 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No trades
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < (vendor.reliability_rating || 0)
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleEditVendor(vendor);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendorToDelete(vendor);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Badge variant="outline" className="text-xs">
                      {vendor.pricing_model === 'flat' ? 'Flat Rate' : vendor.pricing_model === 'hourly' ? 'Hourly' : 'Not set'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12 glass-card">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">
                  {vendors.length === 0 ? 'No vendors yet' : 'No vendors match your search'}
                </p>
                {vendors.length === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Vendor
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <NewVendorModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        onVendorCreated={fetchVendors}
        vendor={editingVendor}
      />

      <ScopeOfWorkSheet
        open={scopeSheetOpen}
        onOpenChange={setScopeSheetOpen}
        vendors={vendors}
      />

      <GenerateInvoiceSheet open={invoiceOpen} onOpenChange={setInvoiceOpen} />
      

      {/* Vendor Contact Card Dialog */}
      <Dialog open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)}>
        <DialogContent className="sm:max-w-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] duration-150">
          <DialogHeader>
            <DialogTitle>{selectedVendor?.name}</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              {/* Star Rating */}
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < (selectedVendor.reliability_rating || 0)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                {selectedVendor.phone && (
                  <a href={`tel:${selectedVendor.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Phone className="h-4 w-4" />
                    {selectedVendor.phone}
                  </a>
                )}
                {selectedVendor.email && (
                  <a href={`mailto:${selectedVendor.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" />
                    {selectedVendor.email}
                  </a>
                )}
              </div>

              {/* Trades */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Trades</p>
                <div className="flex flex-wrap gap-1">
                  {selectedVendor.trades.length > 0 ? selectedVendor.trades.map((trade) => (
                    <Badge key={trade} variant="secondary" className="text-xs">
                      {getTradeLabel(trade)}
                    </Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              {/* Pricing Model */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pricing</p>
                <Badge variant="outline" className="text-xs">
                  {selectedVendor.pricing_model === 'flat' ? 'Flat Rate' : selectedVendor.pricing_model === 'hourly' ? 'Hourly' : 'Not set'}
                </Badge>
              </div>

              {/* Notes */}
              {selectedVendor.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedVendor.notes}</p>
                </div>
              )}

              {/* Edit Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  const vendor = selectedVendor;
                  setSelectedVendor(null);
                  handleEditVendor(vendor);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit Vendor
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{vendorToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVendor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
