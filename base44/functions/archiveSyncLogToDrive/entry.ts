import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CONNECTOR_ID = '6aa1f79ddd5e1d282a8db13a';
const FOLDER_NAME = 'Pulse12 — Sync Logs';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (_e) {
      // Return 200 (not 401) so the SDK doesn't surface a spurious auth error on the connection check.
      return Response.json({ connected: false, not_connected: true });
    }

    const body = await req.json().catch(() => ({}));
    const { date, summary, wins, blockers, commitments } = body || {};

    // No payload => connection check only (used by the frontend to detect auth)
    if (!date) return Response.json({ connected: true });

    const authHeader = { Authorization: `Bearer ${accessToken}` };
    const folderId = await ensureFolder(authHeader);

    const title = `Sync Log — ${date}`;
    const html = buildHtml(title, { date, summary, wins, blockers, commitments });
    const docId = await createDoc(authHeader, title, html, folderId);

    return Response.json({
      connected: true,
      doc_id: docId,
      doc_url: `https://docs.google.com/document/d/${docId}/edit`,
      folder_name: FOLDER_NAME,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function ensureFolder(authHeader) {
  const q = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, { headers: authHeader });
  const listData = await listRes.json();
  if (listData.files && listData.files.length > 0) return listData.files[0].id;

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData.error?.message || 'Failed to create archive folder');
  return createData.id;
}

async function createDoc(authHeader, title, html, folderId) {
  const boundary = 'pulse12-' + Math.random().toString(36).slice(2);
  const metadata = { name: title, parents: [folderId], mimeType: 'application/vnd.google-apps.document' };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html\r\n\r\n${html}\r\n` +
    `--${boundary}--`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create Google Doc');
  return data.id;
}

function buildHtml(title, { date, summary, wins, blockers, commitments }) {
  const section = (heading, value) =>
    value && value.trim() ? `<h2>${heading}</h2><p>${escapeHtml(value)}</p>` : '';
  return (
    `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title></head><body>` +
    `<h1>${escapeHtml(title)}</h1>` +
    `<p><em>Accountability sync log</em></p>` +
    section('Summary', summary) +
    section('Wins', wins) +
    section('Blockers', blockers) +
    section('Commitments for next sync', commitments) +
    `</body></html>`
  );
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}