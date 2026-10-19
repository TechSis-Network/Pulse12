import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { start, duration_minutes, title, partner_email, partner_name, notes } = body || {};
    if (!start) return Response.json({ error: 'start is required' }, { status: 400 });

    const startMs = Date.parse(start);
    if (Number.isNaN(startMs)) return Response.json({ error: 'Invalid start datetime' }, { status: 400 });
    const endIso = new Date(startMs + (Number(duration_minutes) || 30) * 60000).toISOString();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const description = `Accountability session with ${partner_name || 'your partner'}.` + (notes ? `\n\n${notes}` : '');
    const event = {
      summary: title || 'Accountability check-in',
      description,
      start: { dateTime: new Date(startMs).toISOString() },
      end: { dateTime: endIso },
      attendees: partner_email ? [{ email: partner_email }] : [],
      conferenceData: {
        createRequest: {
          requestId: `acct-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || 'Google Calendar API error' }, { status: res.status });

    const meetLink = (data.conferenceData?.entryPoints || []).find((ep) => ep.entryPointType === 'video')?.uri || null;

    try {
      await base44.asServiceRole.entities.Notification.create({
        type: 'meeting',
        title: title || 'Accountability check-in',
        body: `Scheduled for ${new Date(startMs).toLocaleString()}`,
        link: '/accountability',
        meet_link: meetLink || null,
        ref_id: data.id,
        read: false,
      });
    } catch (_e) { /* notification is best-effort */ }

    return Response.json({ event_id: data.id, html_link: data.htmlLink, meet_link: meetLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}