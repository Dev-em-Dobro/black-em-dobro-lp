function getApiConfig() {
  const apiUrl = process.env.ACTIVECAMPAIGN_API_URL?.replace(/\/$/, "");
  const apiToken = process.env.ACTIVECAMPAIGN_API_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error("A lista ainda não está conectada.");
  }

  return { apiUrl, apiToken };
}

async function acRequest(apiUrl, apiToken, path, payload) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Api-Token": apiToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || data?.errors?.[0]?.title || "Erro ao comunicar com o ActiveCampaign.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

const ALLOWED_FIELDS = new Set(["name", "email", "phone"]);

function readPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Dados inválidos." };
  }

  const extra = Object.keys(body).filter((key) => !ALLOWED_FIELDS.has(key));
  if (extra.length) return { error: "Dados inválidos." };

  const { name, email, phone } = body;
  if (typeof name !== "string" || typeof email !== "string" || typeof phone !== "string") {
    return { error: "Dados inválidos." };
  }
  if (name.length > 80 || email.length > 120 || phone.length > 20) {
    return { error: "Dados inválidos." };
  }

  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanEmail = email.trim().toLowerCase();
  const digits = phone.replace(/\D/g, "");

  if (!/^[\p{L}][\p{L}\s'.-]{1,79}$/u.test(cleanName)) {
    return { error: "Nome inválido." };
  }
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)) {
    return { error: "E-mail inválido." };
  }
  if (!/^[1-9]{2}\d{8,9}$/.test(digits)) {
    return { error: "WhatsApp inválido." };
  }

  return { name: cleanName, email: cleanEmail, phone: digits };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    return res.status(415).json({ error: "Formato não suportado." });
  }

  const payload = readPayload(req.body);
  if (payload.error) return res.status(400).json({ error: payload.error });

  let apiUrl;
  let apiToken;

  try {
    ({ apiUrl, apiToken } = getApiConfig());
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const contact = {
    email: payload.email,
    firstName: payload.name,
    phone: payload.phone,
  };

  try {
    const syncData = await acRequest(apiUrl, apiToken, "/api/3/contact/sync", { contact });
    const contactId = syncData?.contact?.id;
    const listId = process.env.ACTIVECAMPAIGN_LIST_ID;
    const tagId = process.env.ACTIVECAMPAIGN_TAG_BLACK;

    if (contactId && listId) {
      await acRequest(apiUrl, apiToken, "/api/3/contactLists", {
        contactList: { list: String(listId), contact: String(contactId), status: 1 },
      });
    }

    if (contactId && tagId) {
      await acRequest(apiUrl, apiToken, "/api/3/contactTags", {
        contactTag: { contact: String(contactId), tag: String(tagId) },
      });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: "Não foi possível enviar a inscrição." });
  }
};
