const swaggerUi = require("swagger-ui-express");
const { buildSwaggerSpec, orderSwaggerPaths } = require("./specBuilder");
const { generatePathsFromAppRoutes } = require("./pathGenerators");

const setupSwagger = (app, routeMounts = []) => {
  const spec = buildSwaggerSpec(routeMounts);
  const appLevelPaths = generatePathsFromAppRoutes(app);

  const mergedPaths = {
    ...appLevelPaths,
    ...(spec.paths || {}),
  };
  spec.paths = orderSwaggerPaths(mergedPaths);

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, { explorer: true }),
  );
  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(spec);
  });
};

module.exports = { setupSwagger };
