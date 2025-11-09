const { Router } = require("express");

const helpers = require("./../handlers/helpers.handler");
const locals = require("./../handlers/locals.handler");
const renders = require("./renders.routes");
const domains = require("./domain.routes");
const health = require("./health.routes");
const link = require("./link.routes");
const user = require("./user.routes");
const auth = require("./auth.routes");
const tag = require("./tag.routes");
const qrcode = require("./qrcode.routes");
const stats = require("./stats.routes");
const security = require("./security.routes");

const renderRouter = Router();
renderRouter.use(renders);

const apiRouter = Router();
// Force API routes to return JSON instead of HTML
apiRouter.use((req, res, next) => {
  req.isHTML = false;
  next();
});
apiRouter.use(locals.noLayout);
apiRouter.use("/domains", domains);
apiRouter.use("/health", health);
apiRouter.use("/links", link);
apiRouter.use("/users", user);
apiRouter.use("/auth", auth);
apiRouter.use("/tags", tag);
apiRouter.use("/qrcode", qrcode);
apiRouter.use("/stats", stats);
apiRouter.use("/security", security);

module.exports = {
  api: apiRouter,
  render: renderRouter,
};
