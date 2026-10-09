import { revalidateTag, unstable_cache } from 'next/cache';
import { getSettings, blockedSlots } from './repository';
import { buildAvailability, validateAvailabilityInput, type AgendaSnapshot } from './public-agenda-service';

const AGENDA_TAG = 'h30-public-agenda';

// One persistent snapshot for every month and timezone; visits never expire it.
const readSnapshot = unstable_cache(async (): Promise<AgendaSnapshot> => ({
  settings: await getSettings(),
  blocks: await blockedSlots('1970-01-01T00:00:00.000Z', '9999-12-31T00:00:00.000Z'),
}), ['h30-public-agenda-v1'], { tags: [AGENDA_TAG], revalidate: false });

export async function publicAvailability(month: string, timezone: string) {
  validateAvailabilityInput(month, timezone);
  return buildAvailability(month, timezone, await readSnapshot());
}

export async function refreshPublicAgenda() {
  revalidateTag(AGENDA_TAG, { expire: 0 });
  await readSnapshot();
}
