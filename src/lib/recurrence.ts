import { addDays, addWeeks, addMonths, addYears, isWeekend, isSameDay, parseISO, format, isBefore, isAfter, add, isEqual, startOfDay, endOfDay } from 'date-fns';
import { db, TimeSlot, RecurrenceRule, RecurrenceRuleWithDate } from './database';

type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface GenerateRecurringTimeSlotsParams {
  timeSlot: TimeSlot; // Accept a full TimeSlot with id
  recurrence: RecurrenceRuleWithDate;
  endDate: Date;
}

/**
 * Generates recurring time slots based on the provided recurrence rules
 */
export async function generateRecurringTimeSlots({
  timeSlot,
  recurrence,
  endDate
}: GenerateRecurringTimeSlotsParams): Promise<Omit<TimeSlot, 'id'>[]> {
  const { frequency, interval = 1, daysOfWeek = [] } = recurrence;
  const startDate = new Date(timeSlot.date);
  const result: Omit<TimeSlot, 'id'>[] = [];
  const parentId = timeSlot.id!;
  let currentDate = startDate;
  let occurrenceCount = 0;
  const maxOccurrences = 365 * 5;

  // Do NOT add the original slot to the database here

  while (isBefore(currentDate, endDate) && occurrenceCount < maxOccurrences) {
    // Move to the next occurrence based on frequency
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekdays':
        currentDate = addDays(currentDate, 1);
        while (isWeekend(currentDate)) {
          currentDate = addDays(currentDate, 1);
        }
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        if (daysOfWeek && daysOfWeek.length > 0) {
          const slotsForWeek = daysOfWeek.map(dayIndex => {
            const slotDate = addDays(currentDate, dayIndex - currentDate.getDay());
            // Skip if slotDate is the same as the parent/original slot date
            if (isSameDay(slotDate, startDate)) return null;
            return createRecurringSlot(timeSlot, slotDate, parentId);
          }).filter((slot): slot is Omit<TimeSlot, 'id'> => !!slot);
          result.push(...slotsForWeek);
          currentDate = addWeeks(currentDate, interval);
          continue;
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
      default:
        throw new Error(`Unsupported recurrence frequency: ${frequency}`);
    }
    // Skip if currentDate is the same as the parent/original slot date
    if ((frequency !== 'weekly' || !daysOfWeek || daysOfWeek.length === 0) && !isSameDay(currentDate, startDate)) {
      result.push(createRecurringSlot(timeSlot, currentDate, parentId));
    }
    occurrenceCount++;
  }
  return result;
}

/**
 * Helper function to create a recurring time slot instance
 */
function createRecurringSlot(
  baseSlot: Omit<TimeSlot, 'id'>,
  date: Date,
  parentId: number
): Omit<TimeSlot, 'id'> {
  const slot = {
    ...baseSlot,
    date: format(date, 'yyyy-MM-dd'),
    isRecurring: true,
    parentId,
    isInstance: true,
    recurrenceId: parentId,
    originalStartTime: baseSlot.startTime,
    originalEndTime: baseSlot.endTime,
    createdAt: new Date(),
  };
  // Ensure id is not present
  delete (slot as any).id;
  return slot;
}

/**
 * Updates all instances of a recurring time slot
 */
export async function updateRecurringTimeSlot(
  timeSlot: TimeSlot,
  updates: Partial<TimeSlot>
): Promise<void> {
  if (!timeSlot.isRecurring || timeSlot.isInstance) {
    throw new Error('Can only update the parent of a recurring time slot');
  }
  
  // Update the parent time slot
  await db.timeSlots.update(timeSlot.id!, updates);
  
  // Update all instances
  await db.timeSlots
    .where('recurrenceId')
    .equals(timeSlot.id!)
    .modify(instance => {
      // Preserve the instance-specific dates
      const { date, startTime, endTime, ...restUpdates } = updates;
      Object.assign(instance, restUpdates);
    });
}

/**
 * Deletes a recurring time slot and all its instances
 */
export async function deleteRecurringTimeSlot(timeSlot: TimeSlot): Promise<void> {
  if (!timeSlot.isRecurring) {
    await db.timeSlots.delete(timeSlot.id!);
    return;
  }
  
  // For recurring slots, delete all instances
  if (timeSlot.isInstance) {
    // If this is an instance, just delete this one instance
    await db.timeSlots.delete(timeSlot.id!);
  } else {
    // If this is the parent, delete all instances
    await db.timeSlots
      .where('recurrenceId')
      .equals(timeSlot.id!)
      .delete();
    // Delete the parent
    await db.timeSlots.delete(timeSlot.id!);
  }
}

/**
 * Gets all time slots for a specific date range, including recurring instances
 */
export async function getTimeSlotsInRange(
  startDate: Date,
  endDate: Date
): Promise<TimeSlot[]> {
  // Get non-recurring and parent recurring slots in the date range
  const directSlots = await db.timeSlots
    .where('date')
    .between(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), true, true)
    .toArray();
  
  // Get all parent recurring slots that might have instances in the date range
  const parentRecurringSlots = await db.timeSlots
    .where('isRecurring')
    .equals(1) // Dexie uses 1/0 for booleans
    .and(slot => !slot.isInstance)
    .toArray();
  
  // Generate instances for each parent recurring slot
  const recurringInstances = await Promise.all(
    parentRecurringSlots.map(async parent => {
      const instances = await generateInstancesInRange(parent, startDate, endDate);
      return instances;
    })
  );
  
  // Flatten the array of arrays
  const allInstances = recurringInstances.flat();
  
  // Combine direct slots and recurring instances, removing any duplicates
  const allSlots = [...directSlots, ...allInstances];
  
  // Remove duplicates (in case a slot was both directly in the range and an instance)
  const uniqueSlots = Array.from(new Map(allSlots.map(slot => [slot.id, slot])).values());
  
  return uniqueSlots;
}

/**
 * Helper function to generate instances of a recurring slot within a date range
 */
async function generateInstancesInRange(
  parent: TimeSlot,
  startDate: Date,
  endDate: Date
): Promise<TimeSlot[]> {
  if (!parent.isRecurring || parent.isInstance) {
    return [];
  }
  
  const parentDate = new Date(parent.date);
  const recurrenceRule = parent.recurrenceRule as RecurrenceRuleWithDate | undefined;
  
  if (!recurrenceRule) {
    return [];
  }
  
  const { frequency, interval = 1, daysOfWeek = [] } = recurrenceRule;
  const result: TimeSlot[] = [];
  let currentDate = new Date(parentDate);
  
  // If the parent is in the range, add it
  if (isWithinRange(parentDate, startDate, endDate)) {
    result.push(parent);
  }
  
  // Generate instances based on the recurrence rule
  while (isBefore(currentDate, endDate)) {
    // Move to the next occurrence
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekdays':
        currentDate = addDays(currentDate, 1);
        // Skip weekends
        while (isWeekend(currentDate)) {
          currentDate = addDays(currentDate, 1);
        }
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // For weekly with specific days, generate slots for each day in the week
          const weekInstances = daysOfWeek
            .map(dayIndex => {
              const slotDate = addDays(startOfWeek(currentDate), dayIndex);
              return isWithinRange(slotDate, startDate, endDate)
                ? createRecurringSlot(parent, slotDate, parent.id!)
                : null;
            })
            .filter(Boolean) as TimeSlot[];
          
          result.push(...weekInstances);
          currentDate = addWeeks(currentDate, interval);
          continue;
        } else {
          currentDate = addWeeks(currentDate, interval);
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
      default:
        return result; // Unsupported frequency
    }
    
    // For non-weekly or weekly without specific days, add the slot if it's in range
    if ((frequency !== 'weekly' || !daysOfWeek || daysOfWeek.length === 0) && 
        isWithinRange(currentDate, startDate, endDate)) {
      result.push(createRecurringSlot(parent, currentDate, parent.id!));
    }
  }
  
  return result;
}

/**
 * Helper function to check if a date is within a range (inclusive)
 */
function isWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  const check = startOfDay(date);
  
  return (isEqual(check, start) || isAfter(check, start)) && 
         (isEqual(check, end) || isBefore(check, end));
}

/**
 * Helper function to get the start of the week (Sunday)
 */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}


