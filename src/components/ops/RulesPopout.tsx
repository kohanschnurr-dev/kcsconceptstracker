 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Checkbox } from '@/components/ui/checkbox';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 interface OperationCode {
   id: string;
   title: string;
   category: string | null;
   is_completed: boolean | null;
 }
 
 interface RulesPopoutProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   rules: OperationCode[];
 }
 
 export function RulesPopout({ open, onOpenChange, rules }: RulesPopoutProps) {
   const orderOfOps = rules.filter(r => r.category === 'order_of_operations');
   const vendorReqs = rules.filter(r => r.category === 'vendor_requirements');
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>Operation Rules</DialogTitle>
         </DialogHeader>
         
         <ScrollArea className="max-h-[400px]">
           <div className="space-y-6">
             {/* Order of Operations */}
             {orderOfOps.length > 0 && (
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-muted-foreground">Order of Operations</h4>
                 <div className="space-y-2">
                   {orderOfOps.map((rule) => (
                     <div 
                       key={rule.id}
                       className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                     >
                       <Checkbox 
                         checked={rule.is_completed || false} 
                         disabled
                         className="pointer-events-none"
                       />
                       <span className={`text-sm ${rule.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                         {rule.title}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Vendor Requirements */}
             {vendorReqs.length > 0 && (
               <div className="space-y-3">
                 <h4 className="text-sm font-medium text-muted-foreground">Vendor Requirements</h4>
                 <div className="space-y-2">
                   {vendorReqs.map((rule) => (
                     <div 
                       key={rule.id}
                       className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                     >
                       <Checkbox 
                         checked={rule.is_completed || false} 
                         disabled
                         className="pointer-events-none"
                       />
                       <span className={`text-sm ${rule.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                         {rule.title}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {rules.length === 0 && (
               <p className="text-center text-muted-foreground py-8">No rules configured</p>
             )}
           </div>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 }