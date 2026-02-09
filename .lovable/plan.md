
## Add Days Tooltip on "To Date" Button

### Change

Wrap the "To Date" button with a `Tooltip` that shows the number of days elapsed since the project start date.

**In `src/components/project/HardMoneyLoanCalculator.tsx`:**

1. Add imports for `Tooltip`, `TooltipTrigger`, `TooltipContent`, and `TooltipProvider` from `@/components/ui/tooltip`.

2. Calculate the days elapsed alongside the existing `toDateMonths` memo (or add a separate `toDateDays` memo):
   ```typescript
   const toDateDays = useMemo(() => {
     if (!projectStartDate) return null;
     const start = parseDateString(projectStartDate);
     const now = new Date();
     return Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
   }, [projectStartDate]);
   ```

3. Wrap the existing "To Date" `Button` (lines 793-802) with tooltip components:
   ```tsx
   <TooltipProvider delayDuration={200}>
     <Tooltip>
       <TooltipTrigger asChild>
         <Button ...>
           <CalendarClock ... /> To Date
         </Button>
       </TooltipTrigger>
       <TooltipContent>
         <p>{toDateDays} days</p>
       </TooltipContent>
     </Tooltip>
   </TooltipProvider>
   ```

This gives a clean, minimal hover popup showing something like "24 days" without cluttering the button itself.
