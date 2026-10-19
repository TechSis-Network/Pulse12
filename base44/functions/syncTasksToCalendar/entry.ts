import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { date, items } = body || {};
    if (!Array.isArray(items) || items.length === 0) return Response.json({ created: 0, skipped: 0, links: [] });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const created = [];
    let skipped = 0;
    for (const item of items) {
      const startMs = Date.parse(item.start);
      if (Number.isNaN(startMs)) { skipped++; continue; }

      const existing = await base44.asServiceRole.entities.CalendarSync.filter({ task_id: item.task_id, date });
      if (existing && existing.length > 0) { skipped++; continue; }

      const dur = Number(item.duration_minutes) || 30;
      const endIso = new Date(startMs + dur * 60000).toISOString();
      const event = {
        summary: item.title,
        start: { dateTime: new Date(startMs).toISOString() },
        end: { dateTime: endIso },
        conferenceData: {
          createRequest: {
            requestId: `${item.task_id}-${date}-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) { skipped++; continue; }

      const meetLink = (data.conferenceData?.entryPoints || []).find((ep) => ep.entryPointType === 'video')?.uri || null;

      await base44.asServiceRole.entities.CalendarSync.create({
        task_id: item.task_id,
        date,
        event_id: data.id,
        calendar_id: 'primary',
        synced_at: new Date().toISOString(),
      });

      try {
        await base44.asServiceRole.entities.Notification.create({
          type: 'meeting',
          title: `Meeting: ${item.title}`,
          body: `Scheduled for ${new Date(startMs).toLocaleString()}`,
          link: '/',
          meet_link: meetLink || null,
          ref_id: data.id,
          read: false,
        });
      } catch (_e) { /* notification is best-effort */ }

      created.push({ task_id: item.task_id, html_link: data.htmlLink, meet_link: meetLink });
    }

    return Response.json({ created: created.length, skipped, links: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}