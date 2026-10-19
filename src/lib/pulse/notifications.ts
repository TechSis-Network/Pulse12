import type { NotificationFields } from '@/types/entities';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

export const NOTIF_KEY = ['notifications'];

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEY,
    queryFn: async () => base44.entities.Notification.list('-created_date', 30),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });
}

export async function ensureNotification({ type, title, body, link, ref_id }: NotificationFields) {
  if (!ref_id) {
    const created = await base44.entities.Notification.create({ type, title, body, link, read: false, ref_id: null });
    queryClientInstance.invalidateQueries({ queryKey: NOTIF_KEY });
    return created;
  }
  const existing = await base44.entities.Notification.filter({ ref_id });
  if (existing.length > 0) return existing[0];
  const created = await base44.entities.Notification.create({ type, title, body, link, read: false, ref_id });
  queryClientInstance.invalidateQueries({ queryKey: NOTIF_KEY });
  return created;
}

export async function markRead(id: string) {
  await base44.entities.Notification.update(id, { read: true });
  queryClientInstance.invalidateQueries({ queryKey: NOTIF_KEY });
}

export async function markAllRead(ids: string[]) {
  if (!ids?.length) return;
  await base44.entities.Notification.bulkUpdate(ids.map((id) => ({ id, read: true })));
  queryClientInstance.invalidateQueries({ queryKey: NOTIF_KEY });
}