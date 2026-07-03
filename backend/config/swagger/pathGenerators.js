const { ensureOpenApiPathParams, joinPaths } = require("./pathUtils");
const { buildOperation } = require("./operationBuilder");

const extractPathsFromRouter = (router, basePath = "") => {
  const paths = {};

  if (!router || !Array.isArray(router.stack)) return paths;

  router.stack.forEach((layer) => {
    if (!layer || !layer.route || !layer.route.path) return;

    const routePath = Array.isArray(layer.route.path)
      ? layer.route.path[0]
      : layer.route.path;

    const fullPath = ensureOpenApiPathParams(joinPaths(basePath, routePath));
    if (!paths[fullPath]) paths[fullPath] = {};

    Object.entries(layer.route.methods || {}).forEach(([method, enabled]) => {
      if (!enabled) return;
      paths[fullPath][method] = buildOperation(method, fullPath);
    });
  });

  return paths;
};

const generatePathsFromMounts = (routeMounts = []) => {
  const generatedPaths = {};

  routeMounts.forEach(({ basePath, router }) => {
    const routerPaths = extractPathsFromRouter(router, basePath);
    Object.entries(routerPaths).forEach(([pathKey, pathValue]) => {
      if (!generatedPaths[pathKey]) generatedPaths[pathKey] = {};
      generatedPaths[pathKey] = { ...generatedPaths[pathKey], ...pathValue };
    });
  });

  return generatedPaths;
};

const generatePathsFromAppRoutes = (app) => {
  const generatedPaths = {};
  if (!app || !app._router || !Array.isArray(app._router.stack)) return generatedPaths;

  app._router.stack.forEach((layer) => {
    if (!layer || !layer.route || !layer.route.path) return;

    const routePath = Array.isArray(layer.route.path)
      ? layer.route.path[0]
      : layer.route.path;

    const fullPath = ensureOpenApiPathParams(joinPaths("", routePath));
    if (!generatedPaths[fullPath]) generatedPaths[fullPath] = {};

    Object.entries(layer.route.methods || {}).forEach(([method, enabled]) => {
      if (!enabled) return;
      generatedPaths[fullPath][method] = buildOperation(method, fullPath);
    });
  });

  return generatedPaths;
};

module.exports = {
  extractPathsFromRouter,
  generatePathsFromMounts,
  generatePathsFromAppRoutes,
};
