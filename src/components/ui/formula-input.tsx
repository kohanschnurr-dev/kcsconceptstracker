import * as React from 'react';
import { useState, useCallback } from 'react';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { evaluateFormula } from '@/lib/formulaEval';
import { cn } from '@/lib/utils';

/**
 * Drop-in replacement for <Input type="number"> that supports
 * Excel-like formulas starting with "=".
 *
 * When the user types "=22489-10000" and presses Enter or blurs,
 * it evaluates to 12489 and fires onChange with that result.
 */
const FormulaInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & { showHint?: boolean }
>(({ className, type, value, onChange, onBlur, onKeyDown, showHint = true, ...props }, ref) => {
  const [isFormulaMode, setIsFormulaMode] = useState(false);
  const [localValue, setLocalValue] = useState('');

  const isNumeric = type === 'number';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;

      if (isNumeric && val.startsWith('=')) {
        setIsFormulaMode(true);
        setLocalValue(val);
        return; // don't fire parent onChange while typing formula
      }

      // If we were in formula mode and user cleared the "=", exit
      if (isFormulaMode && !val.startsWith('=')) {
        setIsFormulaMode(false);
        setLocalValue('');
      }

      onChange?.(e);
    },
    [isNumeric, isFormulaMode, onChange],
  );

  const resolveFormula = useCallback(() => {
    if (!isFormulaMode || !localValue.startsWith('=')) return false;

    const result = evaluateFormula(localValue);
    if (result !== null) {
      // Synthesize a change event with the evaluated result
      const nativeInput = document.createElement('input');
      nativeInput.value = String(result);
      const syntheticEvent = {
        target: nativeInput,
        currentTarget: nativeInput,
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    }
    setIsFormulaMode(false);
    setLocalValue('');
    return true;
  }, [isFormulaMode, localValue, onChange]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      resolveFormula();
      onBlur?.(e);
    },
    [resolveFormula, onBlur],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === '=' && isNumeric && !isFormulaMode) {
        e.preventDefault();
        setIsFormulaMode(true);
        setLocalValue('=');
        return;
      }
      if (e.key === 'Enter' && isFormulaMode) {
        e.preventDefault();
        resolveFormula();
        return;
      }
      onKeyDown?.(e);
    },
    [isNumeric, isFormulaMode, resolveFormula, onKeyDown],
  );

  // When in formula mode, render as text to allow "=" and operators
  const inputType = isFormulaMode ? 'text' : type;
  const inputValue = isFormulaMode ? localValue : value;

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={inputType}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          isFormulaMode && 'font-mono text-primary pr-8',
          className,
        )}
        {...props}
      />
      {isFormulaMode && (
        <Calculator className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/60 pointer-events-none" />
      )}
      {showHint && isNumeric && !isFormulaMode && !value && (
        <TooltipProvider delayDuration={600}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Calculator className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 pointer-events-auto cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Type <span className="font-mono">=</span> for math (e.g. =5000-250)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
});

FormulaInput.displayName = 'FormulaInput';

export { FormulaInput };
