const domain = require("./domain.queries");
const visit = require("./visit.queries");
const link = require("./link.queries");
const user = require("./user.queries");
const host = require("./host.queries");
const tag = require("./tag.queries");
const stats = require("./stats.queries");
const security = require("./security.queries");

module.exports = {
  domain,
  host,
  link,
  user,
  visit,
  tag,
  stats,
  security
};
