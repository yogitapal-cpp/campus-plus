import { Announcement, EventClash } from '../types';

/**
 * Parses time string like "09:00 AM" into minutes from midnight
 */
function timeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Checks if a candidate announcement clashes with any existing announcements in the calendar
 */
export function detectEventClashes(
  candidate: { id?: string; date: string | null; startTime: string | null; endTime: string | null; title: string },
  existingEvents: Announcement[]
): EventClash[] {
  if (!candidate.date) return [];

  const clashes: EventClash[] = [];
  const candidateStart = candidate.startTime ? timeToMinutes(candidate.startTime) : null;
  const candidateEnd = candidate.endTime ? timeToMinutes(candidate.endTime) : (candidateStart ? candidateStart + 60 : null);

  for (const event of existingEvents) {
    if (candidate.id && event.id === candidate.id) continue;
    if (event.date !== candidate.date) continue;

    // Same date! Check time overlap if available
    const eventStart = event.startTime ? timeToMinutes(event.startTime) : null;
    const eventEnd = event.endTime ? timeToMinutes(event.endTime) : (eventStart ? eventStart + 60 : null);

    if (candidateStart !== null && candidateEnd !== null && eventStart !== null && eventEnd !== null) {
      // Both have concrete times: check range overlap
      const hasOverlap = Math.max(candidateStart, eventStart) < Math.min(candidateEnd, eventEnd);
      if (hasOverlap) {
        clashes.push({
          existingEvent: event,
          clashingField: 'time',
          message: `Time overlap with "${event.title}" (${event.startTime || ''} - ${event.endTime || 'End'}) on ${candidate.date}`,
        });
      }
    } else {
      // Date matches, but time is missing on one of them - warn about same-day concurrent commitment
      clashes.push({
        existingEvent: event,
        clashingField: 'date',
        message: `Scheduled on the same date (${candidate.date}) as "${event.title}". Times should be verified.`,
      });
    }
  }

  return clashes;
}
