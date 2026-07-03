const DRAFT_PREFIX = "customer_form_draft";
const CLIPBOARD_PREFIX = "customer_form_clipboard";

const buildDraftKey = (formName, scope = "default") =>
  `${DRAFT_PREFIX}:${formName}:${scope}`;

const buildClipboardKey = (formName) => `${CLIPBOARD_PREFIX}:${formName}`;

export const readDraft = (formName, scope = "default") => {
  try {
    const raw = localStorage.getItem(buildDraftKey(formName, scope));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      savedAt: parsed.savedAt || "",
      data: parsed.data || null,
    };
  } catch {
    return null;
  }
};

export const saveDraft = (formName, scope = "default", data = {}) => {
  const savedAt = new Date().toISOString();
  localStorage.setItem(
    buildDraftKey(formName, scope),
    JSON.stringify({ savedAt, data }),
  );
  return savedAt;
};

export const clearDraft = (formName, scope = "default") => {
  localStorage.removeItem(buildDraftKey(formName, scope));
};

export const draftExists = (formName, scope = "default") =>
  Boolean(readDraft(formName, scope));

export const readClipboard = (formName) => {
  try {
    const raw = localStorage.getItem(buildClipboardKey(formName));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      copiedAt: parsed.copiedAt || "",
      data: parsed.data || null,
      sourceLabel: parsed.sourceLabel || "",
    };
  } catch {
    return null;
  }
};

export const writeClipboard = (formName, data = {}, sourceLabel = "") => {
  const copiedAt = new Date().toISOString();
  localStorage.setItem(
    buildClipboardKey(formName),
    JSON.stringify({ copiedAt, data, sourceLabel }),
  );
  return copiedAt;
};

export const clearClipboard = (formName) => {
  localStorage.removeItem(buildClipboardKey(formName));
};

export const clipboardExists = (formName) => Boolean(readClipboard(formName));
