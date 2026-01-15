'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@kit/ui/button';
import { toast } from '@kit/ui/sonner';
import { AlertCircle, Check, Copy, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';

import { AvailabilityEntry, AvailabilityStatus } from '../types';
import { getMonthDays, generateCopyWeekEntries } from '../services/date-utils';
import { DayRow } from './day-row';

interface AvailabilityGridProps {
  userId: string;
  monthDate: Date; // The month we are editing (e.g., 2026-02-01)
  initialEntries: AvailabilityEntry[];
  onSave: (entries: AvailabilityEntry[]) => Promise<void>;
  isLocked?: boolean;
}

export function AvailabilityGrid({
  userId,
  monthDate,
  initialEntries,
  onSave,
  isLocked = false,
}: AvailabilityGridProps) {
  const [entries, setEntries] = useState<AvailabilityEntry[]>(initialEntries);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);


  // Generate all days for the month view
  const days = getMonthDays(monthDate);

  // Sync internal state if props change (e.g. month switch)
  useEffect(() => {
    setEntries(initialEntries);
    setDirty(false);
  }, [initialEntries, monthDate]);

  const handleEntryChange = useCallback((date: Date, newStatus: AvailabilityStatus) => {
    if (isLocked) return;

    setEntries((prev) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingIndex = prev.findIndex((e) => e.date === dateStr);
      
      const newEntry: AvailabilityEntry = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `temp-${dateStr}`,
        user_id: userId,
        date: dateStr,
        status_code: newStatus,
        is_late_submission: false,
        effective_start: new Date().toISOString(),
        effective_end: 'infinity',
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newEntry;
        return updated;
      } else {
        return [...prev, newEntry];
      }
    });

    setDirty(true);
  }, [isLocked, userId]);

  const handleCopyWeek = () => {
    if (isLocked) return;

    // Use pure logic service
    const copiedEntries = generateCopyWeekEntries(entries, monthDate, userId);
    
    // Merge: We only want to add/overwrite entries from day 8 onwards
    // generateCopyWeekEntries returns ONLY the new entries for day 8+
    
    setEntries((prev) => {
      // Filter out previous entries that overlap with the new copied ones (to avoid duplicates)
      const copiedDates = new Set(copiedEntries.map(e => e.date));
      const kept = prev.filter(e => !copiedDates.has(e.date));
      
      return [...kept, ...copiedEntries];
    });
    
    setDirty(true);
    toast('Schedule Copied', {
        description: 'Availability from the first week has been applied to the rest of the month.',
    });
  };

  const handleSave = async () => {
    if (!dirty) return;
    
    setIsSaving(true);
    try {
      await onSave(entries);
      setDirty(false);
      toast('Success', {
        description: 'Your availability has been saved.',
      });
    } catch (error) {
      console.error(error);
      toast('Error', {
        description: 'Failed to save availability. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to find status for a day
  const getStatusForDay = (date: Date): AvailabilityStatus => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = entries.find((e) => e.date === dateStr);
    return entry ? entry.status_code : 'NA'; // Default to NA visually
  };

  return (
    <div className="space-y-6">
      {isLocked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Locked</AlertTitle>
          <AlertDescription>
            This month is closed for editing. Please contact your manager for changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex justify-between items-center sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
        <div className="text-sm text-muted-foreground hidden sm:block">
          Select "A" for full availability, or specific shifts.
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopyWeek}
            disabled={isLocked}
            title="Copy first 7 days to rest of month"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Week 1
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={!dirty || isSaving || isLocked}
            size="sm"
          >
            {isSaving ? (
                'Saving...'
            ) : (
                <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-md px-4">
        {days.map((day) => (
          <DayRow
            key={day.toISOString()}
            date={day}
            status={getStatusForDay(day)}
            onChange={handleEntryChange}
            // TODO: Holiday prop logic later
          />
        ))}
      </div>
      
      {/* Footer Instructions (Mobile) */}
      <div className="sm:hidden text-xs text-muted-foreground text-center">
        Unmarked days will be saved as Not Available (NA).
      </div>
    </div>
  );
}
