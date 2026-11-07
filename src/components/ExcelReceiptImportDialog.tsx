import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Loader2, ChevronDown, ChevronRight, AlertCircle, Check, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/dateUtils';
import { parseExcelReceipts, receiptTotal, selectedReceipts, type SpreadsheetReceipt } from '@/lib/excelReceiptImport';
import { getBudgetCategories } from '@/types';

const usd = (n: number) => n.toLocaleString('en-US', {style:'currency', currency:'USD'});
interface Props { open: boolean; onOpenChange: (open: boolean) => void; initialFile?: File | null; onImported: () => void }

export function ExcelReceiptImportDialog({ open, onOpenChange, initialFile, onImported }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<SpreadsheetReceipt[]>([]);
  const [selected, setSelected] = useState(new Set<string>());
  const [duplicates, setDuplicates] = useState(new Set<string>());
  const [expanded, setExpanded] = useState(new Set<string>());
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dragging, setDragging] = useState(false);
  const categories = getBudgetCategories();

  async function load(file: File) {
    setError('');
    if (!/\.xlsx$/i.test(file.name)) { setError('Choose an Excel .xlsx workbook. Save older .xls files as .xlsx first.'); return; }
    if (file.size > 20*1024*1024) { setError('Choose a workbook smaller than 20 MB.'); return; }
    setLoading(true);
    try {
      const parsed = await parseExcelReceipts(await file.arrayBuffer(), file.name);
      const {data:{user}} = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in before uploading receipts.');
      // Include already matched and imported receipts when detecting repeated uploads.
      const {data, error: dbError} = await supabase.from('pending_receipts').select('spreadsheet_import_key').eq('user_id',user.id).in('spreadsheet_import_key', parsed.map(r=>r.import_key));
      if (dbError) throw dbError;
      const existing = new Set((data || []).map(r=>r.spreadsheet_import_key).filter((k): k is string => Boolean(k)));
      setReceipts(parsed); setDuplicates(existing);
      setSelected(new Set(parsed.filter(r=>!r.isReturn && !existing.has(r.import_key)).map(r=>r.import_key)));
      setExpanded(new Set()); setFileName(file.name); setSearch(''); setFilter('all');
    } catch(e) { setError(e instanceof Error ? e.message : 'Could not read this workbook.'); }
    finally { setLoading(false); }
  }
  useEffect(()=> {
    if (!open) return;
    setReceipts([]); setSelected(new Set()); setError(''); setFileName(''); setSearch(''); setFilter('all');
    if (initialFile) void load(initialFile);
  }, [open, initialFile]);

  const chosen = selectedReceipts(receipts,selected);
  const visible = receipts.filter(r => (filter==='all' || (filter==='returns' ? r.isReturn : !r.isReturn)) && `${r.receipt_number} ${r.vendor_name} ${r.job} ${r.items.map(i=>i.item_name).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const eligible = visible.filter(r=>!duplicates.has(r.import_key));
  function toggle(key: string, checked: boolean) { setSelected(prev=>{const next=new Set(prev); checked ? next.add(key) : next.delete(key); return next;}); }
  function setCategory(key:string, index: number | null, category:string) {
    setReceipts(prev=>prev.map(r=>r.import_key===key ? {...r, items:r.items.map((i,n)=>index===null || index===n ? {...i,suggested_category:category}: i)}:r));
  }
  async function save() {
    if (!chosen.length || saving) return;
    setSaving(true); setError('');
    try {
      const {data,error: saveError} = await supabase.rpc('import_spreadsheet_receipts', {p_receipts: chosen.map(({isReturn,job,store,receipt_number,...r})=>({...r, items:r.items.map(i=>({...i}))}))});
      if (saveError) throw saveError;
      const result = data as {imported:number; skipped:number};
      toast({title: `${result.imported} receipts added to queue`, description: result.skipped ? `${result.skipped} duplicates skipped.` : 'Ready for bank transaction matching.'});
      onImported(); onOpenChange(false);
    } catch(e) { setError(e instanceof Error ? e.message : 'Receipts were not saved. Please try again.'); }
    finally { setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={v=>{if(!saving && !loading) onOpenChange(v);}}>
    <DialogContent className="max-w-5xl flex flex-col overflow-hidden p-0 gap-0" onInteractOutside={e=>e.preventDefault()} onEscapeKeyDown={e=>e.preventDefault()} onDragOver={e=>{e.preventDefault(); e.stopPropagation();}}>
      <DialogHeader className="p-5 pr-12 border-b border-border text-left">
        <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary"/>Excel receipts</DialogTitle>
        <DialogDescription className="truncate">{fileName || 'Upload receipt workbook'}</DialogDescription>
      </DialogHeader>
      <input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" aria-label="Excel receipt workbook" onChange={e=>{const f=e.target.files?.[0]; if(f) void load(f); e.target.value='';}}/>
      {error && <div role="alert" className="m-4 p-3 border border-destructive/40 bg-destructive/10 text-destructive text-sm flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/><span>{error}</span></div>}
      {loading ? <div className="p-16 flex flex-col items-center gap-3"><Loader2 className="h-8 w-8 text-primary animate-spin"/><p className="text-sm text-muted-foreground">Reading workbook…</p></div> : !receipts.length ? <div className="p-5">
        <div className={`border-2 border-dashed rounded-sm p-10 flex flex-col items-center gap-4 ${dragging ? 'border-primary bg-primary/5' : 'border-border'}`} onDragEnter={()=>setDragging(true)} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault(); e.stopPropagation(); setDragging(false); const file=e.dataTransfer.files[0]; if(file) void load(file);}}>
          <FileSpreadsheet className="h-10 w-10 text-primary"/>
          <p className="font-medium text-center">Drop your receipt spreadsheet here</p>
          <Button variant="outline" className="gap-2" onClick={()=>input.current?.click()}><Upload className="h-4 w-4"/>Choose Excel file</Button>
          <span className="text-xs text-muted-foreground">.xlsx · Up to 20 MB</span>
        </div>
      </div> : <>
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
          <div><p className="text-xs text-muted-foreground">Receipts</p><p className="text-lg font-semibold">{receipts.length}</p></div>
          <div><p className="text-xs text-muted-foreground">Line items</p><p className="text-lg font-semibold">{receipts.reduce((s,r)=>s+r.items.length,0)}</p></div>
          <div><p className="text-xs text-muted-foreground">Selected total</p><p className="text-lg font-semibold font-mono">{usd(chosen.reduce((s,r)=>s+receiptTotal(r),0))}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
          <div className="relative min-w-0 flex-1 basis-40"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input aria-label="Search receipts" placeholder="Search receipt, job, or item" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9"/></div>
          <Select value={filter} onValueChange={setFilter}><SelectTrigger aria-label="Receipt type" className="w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All receipts</SelectItem><SelectItem value="purchases">Purchases</SelectItem><SelectItem value="returns">Returns ({receipts.filter(r=>r.isReturn).length})</SelectItem></SelectContent></Select>
          <Button variant="ghost" size="sm" disabled={saving} onClick={()=>setSelected(prev=>{const next=new Set(prev); const all=eligible.every(r=>prev.has(r.import_key)); eligible.forEach(r=>all ? next.delete(r.import_key):next.add(r.import_key)); return next;})}>{eligible.length>0 && eligible.every(r=>selected.has(r.import_key)) ? 'Deselect shown':'Select shown'}</Button>
        </div>
        {receipts.some(r=>r.isReturn) && <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border">Returns are unchecked by default. {duplicates.size>0 && `${duplicates.size} receipts already uploaded.`}</p>}
        <div className="overflow-y-auto flex-1 min-h-0" aria-label="Receipt review">
          {visible.map(r=><div key={r.import_key} className="border-b border-border last:border-0">
            <div className="flex items-start sm:items-center gap-3 p-4">
              <Checkbox aria-label={`Include receipt ${r.receipt_number}`} checked={selected.has(r.import_key)} disabled={saving || duplicates.has(r.import_key)} onCheckedChange={v=>toggle(r.import_key,v===true)} className="mt-1 sm:mt-0"/>
              <div className="flex-1 min-w-0"><div className="flex flex-wrap gap-2 items-center"><span className="font-medium text-sm">{r.vendor_name}</span><span className="text-xs font-mono text-muted-foreground">#{r.receipt_number}</span>{r.isReturn && <Badge variant="outline">Return</Badge>}{duplicates.has(r.import_key) && <Badge variant="secondary"><Check className="h-3 w-3 mr-1"/>Already uploaded</Badge>}</div><p className="text-xs text-muted-foreground mt-1 break-words">{formatDisplayDate(r.purchase_date)} · {r.items.length} items{r.job && ` · ${r.job}`}</p></div>
              <span className={`font-mono font-medium text-sm shrink-0 ${r.isReturn ? 'text-success':'text-foreground'}`}>{usd(receiptTotal(r))}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label={`${expanded.has(r.import_key)?'Collapse':'Expand'} receipt ${r.receipt_number}`} onClick={()=>setExpanded(prev=>{const n=new Set(prev); n.has(r.import_key)?n.delete(r.import_key):n.add(r.import_key);return n;})}>{expanded.has(r.import_key)?<ChevronDown className="h-4 w-4"/>:<ChevronRight className="h-4 w-4"/>}</Button>
            </div>
            {expanded.has(r.import_key) && <div className="bg-muted/20 px-4 sm:pl-11 pb-4">
              <div className="flex items-center justify-between gap-2 pb-3"><span className="text-xs text-muted-foreground">{r.store} · Tax {usd(r.items.reduce((s,i)=>s+i.tax,0))}</span><Select onValueChange={v=>setCategory(r.import_key,null,v)} disabled={saving}><SelectTrigger aria-label={`Category for all items in ${r.receipt_number}`} className="w-44 h-8 text-xs"><SelectValue placeholder="All items category"/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              {r.items.map((item,n)=><div key={n} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-t border-border"><div className="flex-1 min-w-0"><p className="text-sm break-words">{item.item_name}</p><p className="text-xs text-muted-foreground mt-0.5">Qty {item.quantity} · {usd(item.unit_price)} each</p></div><div className="flex gap-3 items-center"><Select value={item.suggested_category} onValueChange={v=>setCategory(r.import_key,n,v)} disabled={saving}><SelectTrigger aria-label={`Category for ${item.item_name}`} className="w-44 h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select><span className="text-sm font-mono w-24 text-right shrink-0">{usd(item.total_price+item.tax)}</span></div></div>)}
            </div>}
          </div>)}
          {!visible.length && <p className="p-10 text-center text-muted-foreground text-sm">No matching receipts</p>}
        </div>
      </>}
      <DialogFooter className="p-4 border-t border-border gap-2 sm:gap-0">
        {receipts.length>0 && <Button variant="ghost" disabled={saving || loading} onClick={()=>input.current?.click()} className="sm:mr-auto">Change file</Button>}
        <Button variant="outline" disabled={saving || loading} onClick={()=>onOpenChange(false)}>Cancel</Button>
        {receipts.length>0 && <Button disabled={!chosen.length || saving || loading} onClick={()=>void save()} className="gap-2">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}{saving?'Adding receipts…':`Add ${chosen.length} to receipt queue`}</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}