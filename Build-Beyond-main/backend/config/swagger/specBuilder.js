const swaggerJsdoc = require("swagger-jsdoc");
const pathOverrides = require("./paths");
const { buildSwaggerOptions } = require("./options");
const { generatePathsFromMounts } = require("./pathGenerators");

const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "trace",
]);

const orderSwaggerPaths = (paths = {}) => {
  const ordered = {};
  const groups = pathOverrides.__orderedPathGroups || [];

  groups.forEach((group) => {
    Object.keys(group.paths || {}).forEach((pathKey) => {
      if (paths[pathKey]) ordered[pathKey] = paths[pathKey];
    });
  });

  Object.keys(paths).forEach((pathKey) => {
    if (!ordered[pathKey]) ordered[pathKey] = paths[pathKey];
  });

  return ordered;
};

const applyOperationOverlays = (basePaths = {}, overlays = []) => {
  const merged = { ...basePaths };

  overlays.forEach((overlay) => {
    Object.entries(overlay || {}).forEach(([pathKey, pathItem]) => {
      if (!merged[pathKey] || !pathItem || typeof pathItem !== "object") return;

      Object.entries(pathItem).forEach(([method, operation]) => {
        const normalizedMethod = method.toLowerCase();
        if (!HTTP_METHODS.has(normalizedMethod)) return;
        if (!merged[pathKey][normalizedMethod]) return;

        merged[pathKey][normalizedMethod] = {
          ...merged[pathKey][normalizedMethod],
          ...operation,
        };
      });
    });
  });

  return merged;
};

const buildSwaggerSpec = (routeMounts = []) => {
  const options = buildSwaggerOptions();
  const jsdocSpec = swaggerJsdoc(options);
  const generatedPaths = generatePathsFromMounts(routeMounts);
  const mergedPaths = applyOperationOverlays(generatedPaths, [
    jsdocSpec.paths,
    pathOverrides,
  ]);

  return {
    ...jsdocSpec,
    paths: orderSwaggerPaths(mergedPaths),
  };
};

module.exports = {
  buildSwaggerSpec,
  orderSwaggerPaths,
  applyOperationOverlays,
};
