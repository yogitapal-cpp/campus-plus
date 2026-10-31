import { Announcement } from '../types';

/**
 * Generates an iCalendar (.ics) file string and triggers client-side download
 */
export function exportToICS(announcement: Announcement): void {
  const icsContent = generateICSContent([announcement]);
  downloadICSFile(icsContent, `${sanitizeFilename(announcement.title)}.ics`);
}

/**
 * Exports all upcoming events in a single .ics calendar feed
 */
export function exportAllToICS(announcements: Announcement[]): void {
  const eventsWithDates = announcements.filter((a) => a.date);
  if (eventsWithDates.length === 0) {
    alert('No events with valid dates to export.');
    return;
  }
  const icsContent = generateICSContent(eventsWithDates);
  downloadICSFile(icsContent, 'campus_pulse_events.ics');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').substring(0, 40);
}

function formatICSDate(dateStr: string, timeStr?: string | null): string {
  // dateStr is YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';

  const year = parts[0];
  const month = parts[1].padStart(2, '0');
  const day = parts[2].padStart(2, '0');

  if (!timeStr) {
    // All-day event format: VALUE=DATE:YYYYMMDD
    return `${year}${month}${day}`;
  }

  // Parse time e.g. "10:00 AM" or "02:30 PM"
  let hours = 9;
  let minutes = 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const hStr = hours.toString().padStart(2, '0');
  const mStr = minutes.toString().padStart(2, '0');
  return `${year}${month}${day}T${hStr}${mStr}00`;
}

function generateICSContent(events: Announcement[]): string {
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Pulse//Campus Companion Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Campus Pulse Events',
  ];

  for (const item of events) {
    if (!item.date) continue;

    const startFormatted = formatICSDate(item.date, item.startTime);
    const endFormatted = item.endTime
      ? formatICSDate(item.date, item.endTime)
      : startFormatted;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${item.id}@campus-pulse.app`);
    lines.push(`DTSTAMP:${now}`);

    if (item.startTime) {
      lines.push(`DTSTART:${startFormatted}`);
      lines.push(`DTEND:${endFormatted}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${startFormatted}`);
    }

    lines.push(`SUMMARY:${escapeICSString(item.title)}`);
    lines.push(`DESCRIPTION:${escapeICSString(item.description + (item.requiredAction ? `\\nAction: ${item.requiredAction}` : ''))}`);
    if (item.venue) {
      lines.push(`LOCATION:${escapeICSString(item.venue)}`);
    }
    lines.push(`CATEGORIES:${item.category.toUpperCase()}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICSString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function downloadICSFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
