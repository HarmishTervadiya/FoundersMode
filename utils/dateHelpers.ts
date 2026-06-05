/**
 * TIMEZONE STRATEGY
 * -----------------
 * Supabase stores all timestamps as UTC (e.g., "2025-06-04T14:30:00+00:00").
 * The JavaScript Date object parses UTC ISO strings and converts to local time
 * automatically when you call getFullYear(), getMonth(), getDate() etc.
 *
 * This means: a log saved at "23:58 IST" is stored as "18:28 UTC", but
 * toLocalYMD() will correctly return the IST date ("2025-06-04"), not the UTC
 * date ("2025-06-04" which might be "2025-06-05" in UTC next day).
 *
 * All date comparisons (streaks, daily log check, "today") use LOCAL device time.
 */

/**
 * Formats a UTC timestamp (from Supabase) to the user's LOCAL "YYYY-MM-DD".
 * Safe for streak calculations and same-day log grouping.
 *
 * @param dateOrString - Date object or ISO/SQL timestamp string
 * @returns Local date string "YYYY-MM-DD" (e.g., "2025-06-04")
 */
export const toLocalYMD = (dateOrString: Date | string = new Date()): string => {
  let date: Date;

  if (typeof dateOrString === 'string') {
    // Normalize SQL format "2023-01-01 12:00:00+00" -> ISO "2023-01-01T12:00:00+00"
    const isoString = dateOrString.trim().replace(' ', 'T');
    date = new Date(isoString);
  } else {
    date = dateOrString;
  }

  if (isNaN(date.getTime())) {
    console.warn('toLocalYMD received invalid date:', dateOrString);
    return 'Invalid-Date';
  }

  // Uses LOCAL time methods — correctly handles UTC+5:30 (IST) and all other offsets
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Formats a UTC timestamp for human-readable LOCAL display.
 * e.g., "Jun 4, 2025 at 11:58 PM" (in user's timezone)
 *
 * @param dateOrString - Date object or ISO/SQL timestamp string
 * @returns Localized display string
 */
export const toLocalDisplayTime = (dateOrString: Date | string): string => {
  let date: Date;

  if (typeof dateOrString === 'string') {
    const isoString = dateOrString.trim().replace(' ', 'T');
    date = new Date(isoString);
  } else {
    date = dateOrString;
  }

  if (isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
