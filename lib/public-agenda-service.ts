import { AppError } from './errors';
import { generateSlots, overlaps } from './scheduling';
import { DURATION_MINUTES, PRICE_CENTS, timezoneSchema, type AppSettings } from './validation';

export interface AgendaSnapshot {
  settings: AppSettings;
  blocks: Array<{ startAt: string; blockedUntil: string }>;
}

export function validateAvailabilityInput(month: string, timezone: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !timezoneSchema.safeParse(timezone).success) {
    throw new AppError('Mes o zona horaria inválidos');
  }
}

export function buildAvailability(month: string, timezone: string, snapshot: AgendaSnapshot, now = new Date()) {
  validateAvailabilityInput(month, timezone);
  const { settings, blocks } = snapshot;
  const publicSettings = {
    hostName: settings.hostName, timezone: settings.timezone, meetingType: settings.meetingType,
    meetingUrl: settings.meetingUrl, bookingEnabled: settings.bookingEnabled,
    callChannels: ['phone', 'whatsapp'].includes(settings.meetingType) ? ['whatsapp', 'phone'] : [],
  };
  // Time-dependent rules are applied outside the cache so past slots disappear.
  const slots = settings.bookingEnabled ? generateSlots(month, timezone, settings, now).filter(start =>
    !blocks.some(block => overlaps(start, new Date(Date.parse(start) + (DURATION_MINUTES + settings.bufferMinutes) * 60000).toISOString(), block.startAt, block.blockedUntil)),
  ) : [];
  return { slots, settings: publicSettings, price: PRICE_CENTS, duration: DURATION_MINUTES };
}
