

## Plan: Replace "90% match" Badge with Three Match Indicator Circles

### Overview

Replace the text-based confidence badge (e.g., "90% match") with three small circular indicators that visually show which matching criteria passed:

| Icon | Criteria | Filled When |
|------|----------|-------------|
| $ | Price match | Amount difference ≤ $0.01 |
| 📅 | Date match | Within -2 to +5 days |
| 🏢 | Vendor match | Vendor similarity > 30% |

---

### Visual Design

```text
BEFORE:
┌─────────────────────────────────────────────────┐
│ 🧾 In-Store Purchase   [90% match]              │
│ $111.48 • Jan 28, 2026 • 11 items               │
└─────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────┐
│ 🧾 In-Store Purchase   [$] [📅] [🏢]           │
│ $111.48 • Jan 28, 2026 • 11 items               │
└─────────────────────────────────────────────────┘

[●] = Filled circle (criteria matched) - green/success color
[○] = Empty/faded circle (criteria not matched) - muted/gray
```

---

### Technical Implementation

**File: `src/components/SmartSplitReceiptUpload.tsx`**

**1. Add helper functions to calculate match criteria**

```typescript
// Check if amounts match (within $0.01)
const isAmountMatch = (receiptAmount: number, qbAmount: number) => 
  Math.abs(receiptAmount - qbAmount) <= 0.01;

// Check if date is in range (-2 to +5 days)
const isDateInRange = (receiptDate: string, qbDate: string) => {
  const receipt = new Date(receiptDate);
  const transaction = new Date(qbDate);
  const diffDays = (transaction.getTime() - receipt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= -2 && diffDays <= 5;
};

// Vendor similarity (simplified: check if one contains the other or exact match)
const isVendorMatch = (vendor1: string, vendor2: string) => {
  const norm1 = vendor1?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || '';
  const norm2 = vendor2?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || '';
  if (!norm1 || !norm2) return false;
  return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
};
```

**2. Create a MatchIndicators component**

```tsx
// Match criteria indicator component
const MatchIndicators = ({ receipt, qbExpense }: { receipt: PendingReceipt; qbExpense: QBExpense }) => {
  const amountMatched = isAmountMatch(receipt.total_amount, qbExpense.amount);
  const dateMatched = isDateInRange(receipt.purchase_date, qbExpense.date);
  const vendorMatched = isVendorMatch(receipt.vendor_name, qbExpense.vendor_name || '');

  return (
    <div className="flex items-center gap-1">
      {/* Price match indicator */}
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
      
      {/* Date match indicator */}
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
      
      {/* Vendor match indicator */}
      <div
        className={cn(
          "h-5 w-5 rounded-full flex items-center justify-center border",
          vendorMatched 
            ? "bg-success/20 border-success text-success" 
            : "bg-muted/50 border-muted-foreground/30 text-muted-foreground"
        )}
        title={vendorMatched ? "Vendor matched" : "Vendor did not match"}
      >
        <Building className="h-2.5 w-2.5" />
      </div>
    </div>
  );
};
```

**3. Update import statement**

Add `Building` and `CalendarIcon` from lucide-react:
```typescript
import { ..., Building, CalendarIcon } from 'lucide-react';
```

**4. Replace the Badge in the matched receipts section (~line 761)**

```tsx
// BEFORE:
<Badge variant="outline" className="text-xs">
  {match.receipt.match_confidence}% match
</Badge>

// AFTER:
<MatchIndicators receipt={match.receipt} qbExpense={match.qbExpense} />
```

**5. Update the match modal header (~line 902-905)**

```tsx
// BEFORE:
{selectedMatch && !selectedMatch.isManual && selectedMatch.receipt.match_confidence && (
  <Badge variant="outline" className="text-xs ml-auto">
    {selectedMatch.receipt.match_confidence}% confidence
  </Badge>
)}

// AFTER:
{selectedMatch && !selectedMatch.isManual && (
  <div className="ml-auto">
    <MatchIndicators receipt={selectedMatch.receipt} qbExpense={selectedMatch.qbExpense} />
  </div>
)}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add helper functions, MatchIndicators component, replace Badge with indicators |

---

### Summary

This change replaces the percentage-based match badge with three visual indicator circles:
- **$** (Dollar) - Shows if the price matched exactly
- **Calendar** - Shows if the date was within the expected range
- **Building** - Shows if the vendor name matched

Each indicator is either filled (green/success) when the criterion matched or faded/gray when it didn't. This gives users instant visual feedback about why a match was found without needing to understand confidence percentages.

