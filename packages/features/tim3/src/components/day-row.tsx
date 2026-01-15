import { format, isSameDay } from 'date-fns';
import { Badge } from '@kit/ui/shadcn/badge';
import { Button } from '@kit/ui/shadcn/button';
import { cn } from '@kit/ui/utils';

import { AvailabilityStatus } from '../types';

interface DayRowProps {
  date: Date;
  status: AvailabilityStatus;
  onChange: (date: Date, newStatus: AvailabilityStatus) => void;
  isHoliday?: boolean;
  holidayName?: string;
}

export function DayRow({ 
  date, 
  status, 
  onChange, 
  isHoliday, 
  holidayName 
}: DayRowProps) {
  
  // Handlers for specific toggles
  const handleToggle = (code: AvailabilityStatus) => {
    // If clicking what is already selected, maybe we don't deselect to null? 
    // Spec says "Default to NA". So if we deselect, we might go to NA. 
    // BUT the status is a single AvailabilityStatus string for v1 (A, D, E, NA).
    // Wait, requirement says "Any combination of D, E, OS, ON" or "A" or "NA".
    // My Type definition in types.ts was: export type AvailabilityStatus = 'A' | 'D' | 'E' | 'NA';
    // This implies SINGLE SELECTION in types.ts from Task 4. 
    // PRD "Business Rules" 3.1 says: "Multiple shift codes (D, E, OS, ON) per day are allowed."
    
    // CRITICAL MISALIGNMENT FOUND:
    // Types.ts defined AvailabilityStatus as a union of strings.
    // Requirement allows MULTIPLE. 
    // I must update the Type to support multiple codes, OR handle it as a comma-separated string in the DB/Type.
    // The DB schema says `status_code TEXT`.
    // PRD 9.2 says "A or comma-separated shift codes".
    
    // ACTION: I will perform a minimal refactor here to support the intended UX, 
    // treating the input `status` as a potentially comma-separated string or handling the single selection for now if I want to stick to the strict type I made.
    // However, sticking to the single type breaks the requirement. 
    // To unblock, I will update the local component logical to handle the codes, 
    // AND I SHOULD UPDATE `types.ts` in the next step or right now.
    
    // For this file, let's treat `status` as string for flexibility and parse it.
    
    // Logic:
    // If 'A' is clicked -> Clear others, set 'A'.
    // If 'NA' is clicked -> Clear others, set 'NA'.
    // If 'D' is clicked:
    //    If 'A' or 'NA' was set -> Clear them, set 'D'.
    //    If 'D' was set -> Remove 'D' (if empty, set NA).
    //    If 'E' was set -> Add 'D' to it (e.g. "D,E").
    
    // Implementation Plan inside Handler:
    // 1. Parse current CSV.
    // 2. Modify.
    // 3. Re-join.
    
    let currentCodes = status.split(',').filter(c => c.trim() !== '');
    
    if (code === 'A') {
        onChange(date, 'A');
        return;
    }
    
    if (code === 'NA') {
        onChange(date, 'NA');
        return;
    }
    
    // Handling specific shift codes (D, E, OS)
    // First, clear mutually exclusive global states
    if (currentCodes.includes('A') || currentCodes.includes('NA')) {
        currentCodes = [];
    }
    
    // Toggle the specific code
    if (currentCodes.includes(code)) {
        currentCodes = currentCodes.filter(c => c !== code);
    } else {
        currentCodes.push(code);
    }
    
    // If empty after toggle, default to 'NA' (per requirements, unmarked = NA)
    if (currentCodes.length === 0) {
        onChange(date, 'NA');
    } else {
        // Sort for consistency? D, E, OS
        // Let's just join.
        onChange(date, currentCodes.join(',') as AvailabilityStatus);
    }
  };
  
  const currentCodes = status.split(',');

  const isSelected = (code: string) => currentCodes.includes(code);

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b gap-4",
      isHoliday && "bg-muted/50 -mx-4 px-4 sm:mx-0 sm:px-0" // Highlight holiday
    )}>
      {/* Date Column */}
      <div className="flex flex-col min-w-32">
        <span className={cn(
          "font-medium text-lg",
           // Weekend styling
           (date.getDay() === 0 || date.getDay() === 6) && "text-muted-foreground"
        )}>
          {format(date, 'EEE, MMM d')}
        </span>
        {isHoliday && (
          <Badge variant="secondary" className="w-fit mt-1 text-xs">
            {holidayName}
          </Badge>
        )}
      </div>

      {/* Controls Column */}
      <div className="flex flex-wrap gap-2">
        {/* Available (Exclusive) */}
        <Button
          variant={isSelected('A') ? 'default' : 'outline'}
          size="sm"
          className="w-12"
          onClick={() => handleToggle('A')}
        >
          A
        </Button>

        {/* Adjuster Group */}
        <div className="flex gap-1 border-l pl-2 border-r pr-2 mx-1">
          {['D', 'E', 'OS'].map((shift) => (
             <Button
                key={shift}
                variant={isSelected(shift) ? 'secondary' : 'ghost'} 
                // Secondary used for "Active but not 'A' green"? Or just toggle style.
                // Let's use darker 'secondary' for selected shifts to differentiate from Primary 'A'.
                // Actually 'outline' vs 'default' is clearer.
                // If selected, use 'default' or a specific color capability.
                // Let's stick to simple variant toggles for now.
                className={cn(
                    "w-10 px-0",
                    isSelected(shift) && "bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-200"
                )}
                size="sm"
                onClick={() => handleToggle(shift as AvailabilityStatus)}
             >
                {shift}
             </Button>
          ))}
        </div>

        {/* Not Available (Exclusive) */}
        <Button
          variant={isSelected('NA') ? 'destructive' : 'ghost'}
          size="sm"
          className={cn(
             "w-12",
             !isSelected('NA') && "text-muted-foreground"
          )}
          onClick={() => handleToggle('NA')}
        >
          NA
        </Button>
      </div>
    </div>
  );
}
