import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Star, Users, MoreVertical, Pencil, Trash2, FileText, Sparkles, Download, Receipt, Folder, FolderPlus, X, ChevronRight } from 'lucide-react';
import { ScopeOfWorkSheet } from '@/components/vendors/ScopeOfWorkSheet';
import { GenerateInvoiceSheet } from '@/components/project/GenerateInvoiceSheet';
import { GenerateReceiptSheet } from '@/components/project/GenerateReceiptSheet';
import { generatePDF } from '@/lib/pdfExport';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NewVendorModal } from '@/components/NewVendorModal';
import { CreateVendorFolderModal } from '@/components/vendors/CreateVendorFolderModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
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
import { cn, formatPhone } from '@/lib/utils';

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
  folder_id: string | null;
}

interface VendorFolder {
  id: string;
  name: string;
  color: string;
}

export default function Vendors() {
  const { toast } = useToast();
  const { settings, companyName } = useCompanySettings();
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [folders, setFolders] = useState<VendorFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<VendorFolder | null>(null);

  useEffect(() => {
    fetchVendors();
    fetchFolders();
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

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_folders')
        .select('*')
        .order('name');
      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleMoveToFolder = async (vendorId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ folder_id: folderId })
        .eq('id', vendorId);
      if (error) throw error;
      fetchVendors();
      toast({ title: folderId ? 'Moved to folder' : 'Removed from folder' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      // Unassign vendors first
      await supabase.from('vendors').update({ folder_id: null }).eq('folder_id', folderToDelete.id);
      const { error } = await supabase.from('vendor_folders').delete().eq('id', folderToDelete.id);
      if (error) throw error;
      toast({ title: 'Folder deleted', description: `"${folderToDelete.name}" removed.` });
      if (activeFolderId === folderToDelete.id) setActiveFolderId(null);
      fetchFolders();
      fetchVendors();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
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
    lines.push('CONTRACTOR DIRECTORY');
    lines.push(`Total: ${filteredVendors.length} contractor(s)\n`);
    lines.push('─'.repeat(60));

    filteredVendors.forEach((vendor, i) => {
      lines.push(`\n${i + 1}. ${vendor.name.toUpperCase()}`);
      if (vendor.trades.length > 0) {
        lines.push(`   Trades: ${vendor.trades.map(getTradeLabel).join(', ')}`);
      }
      if (vendor.phone) lines.push(`   Phone: ${formatPhone(vendor.phone)}`);
      if (vendor.email) lines.push(`   Email: ${vendor.email}`);
      lines.push(`   Rating: ${'★'.repeat(vendor.reliability_rating || 0)}${'☆'.repeat(5 - (vendor.reliability_rating || 0))}`);
      lines.push(`   Pricing: ${vendor.pricing_model === 'flat' ? 'Flat Rate' : vendor.pricing_model === 'hourly' ? 'Hourly' : 'Not set'}`);
      lines.push(`   W9 on File: ${vendor.has_w9 ? 'Yes' : 'No'}`);
      if (vendor.notes) lines.push(`   Notes: ${vendor.notes}`);
      lines.push('   ' + '─'.repeat(56));
    });

    generatePDF(lines.join('\n'), {
      docType: 'Contractor Directory',
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
    const matchesFolder = activeFolderId === null || vendor.folder_id === activeFolderId;
    return matchesSearch && matchesTrade && matchesFolder;
  });

  const getFolderVendorCount = (folderId: string) =>
    vendors.filter(v => v.folder_id === folderId).length;

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
        title: 'Contractor deleted',
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

  const activeFolder = activeFolderId ? folders.find(f => f.id === activeFolderId) : null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Contractors</h1>
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
                <DropdownMenuItem onClick={() => setReceiptOpen(true)} className="gap-2">
                  <Receipt className="h-4 w-4" /> Receipt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Contractor
            </Button>
          </div>
        </div>

        {/* Folders Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-dashed"
            onClick={() => setFolderModalOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <Button
            variant={activeFolderId === null ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setActiveFolderId(null)}
          >
            All
            <Badge
              variant="secondary"
              className={cn(
                'ml-1 h-5 min-w-[20px] px-1 text-[10px]',
                activeFolderId === null && 'bg-white/20 text-white'
              )}
            >
              {vendors.length}
            </Badge>
          </Button>
          {folders.map((folder) => {
            const isActive = activeFolderId === folder.id;
            const count = getFolderVendorCount(folder.id);
            return (
              <div key={folder.id} className="relative group">
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'gap-1.5 pr-2 transition-all',
                    isActive && 'ring-2 ring-offset-1 ring-offset-background'
                  )}
                  style={isActive ? { backgroundColor: folder.color, borderColor: folder.color } : undefined}
                  onClick={() => setActiveFolderId(isActive ? null : folder.id)}
                >
                  <Folder className="h-4 w-4" style={{ color: isActive ? undefined : folder.color }} />
                  {folder.name}
                  <Badge
                    variant="secondary"
                    className={cn(
                      'ml-1 h-5 min-w-[20px] px-1 text-[10px]',
                      isActive && 'bg-white/20 text-white'
                    )}
                  >
                    {count}
                  </Badge>
                </Button>
                {/* Delete folder on right-click or hover X */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderToDelete(folder);
                    setDeleteFolderDialogOpen(true);
                  }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>


        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contractors..."
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
              {filteredVendors.map((vendor) => {
                const vendorFolder = vendor.folder_id ? folders.find(f => f.id === vendor.folder_id) : null;
                return (
                  <div
                    key={vendor.id}
                    className="glass-card p-5 hover:border-primary/50 transition-all cursor-pointer animate-slide-up relative"
                    onClick={() => setSelectedVendor(vendor)}
                    style={vendorFolder ? { borderLeftWidth: 3, borderLeftColor: vendorFolder.color } : undefined}
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
                            {folders.length > 0 && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                                  <Folder className="h-4 w-4 mr-2" />
                                  Move to Folder
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  {folders.map(f => (
                                    <DropdownMenuItem
                                      key={f.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveToFolder(vendor.id, f.id);
                                      }}
                                      className={cn(vendor.folder_id === f.id && 'bg-accent')}
                                    >
                                      <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: f.color }} />
                                      {f.name}
                                    </DropdownMenuItem>
                                  ))}
                                  {vendor.folder_id && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveToFolder(vendor.id, null);
                                      }}>
                                        <X className="h-4 w-4 mr-2" />
                                        Remove from folder
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
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
                          <span>{formatPhone(vendor.phone)}</span>
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
                      {vendorFolder && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: vendorFolder.color }} />
                          {vendorFolder.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12 glass-card">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">
                  {vendors.length === 0 ? 'No contractors yet' : 'No contractors match your search'}
                </p>
                {vendors.length === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Contractor
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
        folders={folders}
      />

      <CreateVendorFolderModal
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
        onCreated={fetchFolders}
      />

      <ScopeOfWorkSheet
        open={scopeSheetOpen}
        onOpenChange={setScopeSheetOpen}
      />

      <GenerateInvoiceSheet open={invoiceOpen} onOpenChange={setInvoiceOpen} />
      <GenerateReceiptSheet open={receiptOpen} onOpenChange={setReceiptOpen} />

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
                    {formatPhone(selectedVendor.phone)}
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
                Edit Contractor
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contractor</AlertDialogTitle>
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

      <AlertDialog open={deleteFolderDialogOpen} onOpenChange={setDeleteFolderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>"{folderToDelete?.name}"</strong>? Contractors in this folder will be unassigned, not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
