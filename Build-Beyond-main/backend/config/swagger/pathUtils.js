const normalizeSegment = (segment = "") => segment.replace(/^\/+|\/+$/g, "");

const joinPaths = (basePath, routePath) => {
  const base = normalizeSegment(basePath);
  const route = normalizeSegment(routePath);

  if (!base && !route) return "/";
  if (!base) return `/${route}`;
  if (!route) return `/${base}`;
  return `/${base}/${route}`;
};

const ensureOpenApiPathParams = (pathKey) =>
  pathKey.replace(/:([A-Za-z0-9_]+)/g, "{$1}");

const extractPathParams = (pathKey) => {
  const params = [];
  const paramMatches = pathKey.matchAll(/\{([A-Za-z0-9_]+)\}/g);

  for (const match of paramMatches) {
    params.push({
      name: match[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    });
  }

  return params;
};

module.exports = {
  normalizeSegment,
  joinPaths,
  ensureOpenApiPathParams,
  extractPathParams,
};
