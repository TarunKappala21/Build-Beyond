const FAVORITES_STORAGE_KEY = "customer_service_favorites_v1";

const readAllFavorites = () => {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
};

const writeAllFavorites = (data) => {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(data));
};

export const readFavoritesByType = (serviceType) => {
  const allFavorites = readAllFavorites();
  const ids = allFavorites[serviceType];

  return Array.isArray(ids) ? ids.filter(Boolean) : [];
};

export const isFavoriteByType = (serviceType, entityId) => {
  if (!entityId) return false;
  return readFavoritesByType(serviceType).includes(entityId);
};

export const toggleFavoriteByType = (serviceType, entityId) => {
  if (!entityId) return [];

  const allFavorites = readAllFavorites();
  const current = Array.isArray(allFavorites[serviceType])
    ? allFavorites[serviceType].filter(Boolean)
    : [];

  const next = current.includes(entityId)
    ? current.filter((id) => id !== entityId)
    : [...current, entityId];

  allFavorites[serviceType] = next;
  writeAllFavorites(allFavorites);

  return next;
};

export const clearFavoritesByType = (serviceType) => {
  const allFavorites = readAllFavorites();
  allFavorites[serviceType] = [];
  writeAllFavorites(allFavorites);
};
