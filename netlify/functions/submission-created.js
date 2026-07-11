// netlify/functions/submission-created.js
//
// Netlify automatically invokes any function named "submission-created"
// as a background function whenever ANY form on the site is submitted.
// No manual webhook configuration needed.
//
// Requires the RESEND_API_KEY environment variable to be set in
// Netlify's Project configuration > Environment variables.

exports.handler = async (event) => {
  try {
    if (!event.body || event.body.trim() === "") {
      console.log("submission-created: empty body, ignoring invocation");
      return { statusCode: 200, body: "Ignored: empty body" };
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;

    const payload = JSON.parse(rawBody);
    const data = payload.payload;

    // Only handle the project-questionnaire form; ignore any other forms
    // that might exist on the site.
    if (!data || data.form_name !== "project-questionnaire") {
      return { statusCode: 200, body: "Ignored: not the target form" };
    }

    const fields = data.data || {};

    // Human-readable labels for each field name used in the form.
    const fieldLabels = {
      package: "Package",
      businessName: "Business name",
      businessAddress: "Business address",
      businessPhone: "Business phone",
      currentWebsite: "Current website",
      yearFounded: "Year founded",
      logoColors: "Logo / preferred colors",
      contactName: "Primary contact name",
      contactEmail: "Primary contact email",
      contactPhone: "Primary contact phone",
      services: "Services / products",
      serviceArea: "Service area",
      differentiators: "What sets them apart",
      advertising: "Past/current advertising",
      domainHosting: "Domain / hosting status",
      pages: "Pages wanted",
      pagesOther: "Other page(s)",
      contactFormNeeded: "Contact form needed",
      socialLinks: "Social media links",
      certifications: "Organizations / certifications",
      copyReady: "Copy ready?",
      hasPhotos: "Has photos?",
      hasTestimonials: "Has testimonials?",
      testimonialsText: "Testimonials",
      videoLinks: "Video links",
      websitesLiked: "Websites they like",
      marketingMaterials: "Marketing materials note",
      launchSpeed: "Launch speed / urgency",
      updateFrequency: "Update frequency",
      updateFrequencyOther: "Update frequency (other)",
      searchTerms: "Google search terms",
      anythingElse: "Anything else",
    };

    // Build the list of non-empty fields, skipping anything blank/undefined,
    // and skipping Netlify's internal bookkeeping keys.
    const skipKeys = new Set(["form-name", "bot-field"]);
    const rows = [];

    for (const [key, rawValue] of Object.entries(fields)) {
      if (skipKeys.has(key)) continue;

      let value = rawValue;
      if (Array.isArray(value)) {
        value = value.filter(Boolean).join(", ");
      }
      if (value === undefined || value === null) continue;
      if (typeof value === "string" && value.trim() === "") continue;

      const label = fieldLabels[key] || key;
      rows.push({ label, value });
    }

    const textBody = rows.map((r) => `${r.label}: ${r.value}`).join("\n");

    const htmlBody = `
      <h2>New questionnaire submission</h2>
      <table cellpadding="6" cellspacing="0" border="0">
        ${rows
          .map(
            (r) => `
          <tr>
            <td style="font-weight:bold; vertical-align:top; padding-right:12px;">${escapeHtml(
              r.label
            )}</td>
            <td>${escapeHtml(String(r.value)).replace(/\n/g, "<br/>")}</td>
          </tr>`
          )
          .join("")}
      </table>
    `;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      return { statusCode: 200, body: "Skipped: missing API key" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "jonah@jonahfeinberg.com",
        subject: "New form submission!",
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend API error:", response.status, errText);
      // Don't throw — a failed email shouldn't cause Netlify to treat
      // the form submission itself as failed.
      return { statusCode: 200, body: "Submission received; email failed" };
    }

    return { statusCode: 200, body: "Notification sent" };
  } catch (err) {
    console.error("submission-created function error:", err);
    return { statusCode: 200, body: "Submission received; handler error" };
  }
};

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
