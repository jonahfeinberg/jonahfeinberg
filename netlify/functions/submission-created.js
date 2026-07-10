const SKIP_FIELDS = new Set(['form-name', 'bot-field']);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join(', ') || '—';
  return value || '—';
}

exports.handler = async event => {
  try {
    const { payload } = JSON.parse(event.body);

    const entries = payload.ordered_human_fields && payload.ordered_human_fields.length
      ? payload.ordered_human_fields.map(f => [f.title || f.name, f.value])
      : Object.entries(payload.data || {});

    const rows = entries
      .filter(([key]) => !SKIP_FIELDS.has(key))
      .map(([key, value]) => `
        <tr>
          <td style="padding:8px 14px;border:1px solid #ddd;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(key)}</td>
          <td style="padding:8px 14px;border:1px solid #ddd;">${escapeHtml(formatValue(value))}</td>
        </tr>`)
      .join('');

    const html = `
      <h2>New project questionnaire submission</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">${rows}</table>
      <p style="font-family:sans-serif;font-size:13px;color:#555;">
        Uploaded files (logo, photos, marketing materials) can be viewed in the Netlify Forms dashboard for this submission.
      </p>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'jonah@jonahfeinberg.com',
        subject: 'New form submission!',
        html,
      }),
    });

    if (!res.ok) {
      console.error('Resend API error', res.status, await res.text());
      return { statusCode: 502, body: 'Failed to send notification email' };
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('submission-created function error', err);
    return { statusCode: 500, body: 'error' };
  }
};
