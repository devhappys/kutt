const { differenceInSeconds } = require("date-fns");
const promisify = require("node:util").promisify;
const bcrypt = require("bcryptjs");
const { isbot } = require("isbot");
const URL = require("node:url");
const dns = require("node:dns");

const validators = require("./validators.handler");
const map = require("../utils/map.json");
const transporter = require("../mail");
const query = require("../queries");
const queue = require("../queues");
const utils = require("../utils");
const env = require("../env");
const redirectMiddleware = require("../middleware/redirect.middleware");

const CustomError = utils.CustomError;
const dnsLookup = promisify(dns.lookup);

// Helper function to check click limits
async function checkClickLimits(link) {
  if (!link.max_clicks) return { allowed: true };
  
  const period = link.click_limit_period || 'total';
  const now = new Date();
  
  // For total clicks
  if (period === 'total') {
    if (link.visit_count >= link.max_clicks) {
      return { allowed: false, reason: 'Total click limit reached' };
    }
    return { allowed: true };
  }
  
  // For period-based limits, we need to check the period start and count
  if (link.click_period_start) {
    const periodStart = new Date(link.click_period_start);
    const periodDuration = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    const elapsed = now - periodStart;
    const duration = periodDuration[period];
    
    if (duration && elapsed < duration) {
      // Still in the same period
      if (link.click_count_period >= link.max_clicks) {
        return { allowed: false, reason: `Click limit for this ${period} reached` };
      }
      return { allowed: true, resetPeriod: false };
    } else {
      // Period expired, reset
      return { allowed: true, resetPeriod: true };
    }
  }
  
  // First click in this period
  return { allowed: true, resetPeriod: true };
}

// Helper function to build target URL with UTM parameters
function buildTargetURL(link) {
  let targetURL = link.target;
  
  // Add UTM parameters if provided
  if (link.utm_campaign || link.utm_source || link.utm_medium) {
    const url = new URL.URL(targetURL);
    
    if (link.utm_campaign) url.searchParams.append('utm_campaign', link.utm_campaign);
    if (link.utm_source) url.searchParams.append('utm_source', link.utm_source);
    if (link.utm_medium) url.searchParams.append('utm_medium', link.utm_medium);
    
    targetURL = url.toString();
  }
  
  return targetURL;
}

async function get(req, res) {
  const { limit, skip } = req.context;
  const search = req.query.search;
  const userId = req.user.id;

  const match = {
    user_id: userId
  };

  const [data, total] = await Promise.all([
    query.link.get(match, { limit, search, skip }),
    query.link.total(match, { search })
  ]);

  // Add tags to each link
  const linksWithTags = await Promise.all(
    data.map(async link => {
      const tags = await query.tag.getByLinkId(link.id);
      return { ...link, tags };
    })
  );

  if (req.isHTML) {
    res.render("partials/links/table", {
      total,
      limit,
      skip,
      links: linksWithTags.map(utils.sanitize.link_html),
    })
    return;
  }

  return res.send({
    total,
    limit,
    skip,
    data: linksWithTags.map(utils.sanitize.link),
  });
};

async function getAdmin(req, res) {
  const { limit, skip } = req.context;
  const search = req.query.search;
  const user = req.query.user;
  let domain = req.query.domain;
  const banned = utils.parseBooleanQuery(req.query.banned);
  const anonymous = utils.parseBooleanQuery(req.query.anonymous);
  const has_domain = utils.parseBooleanQuery(req.query.has_domain);
  
  const match = {
    ...(banned !== undefined && { banned }),
    ...(anonymous !== undefined && { user_id: [anonymous ? "is" : "is not", null] }),
    ...(has_domain !== undefined && { domain_id: [has_domain ? "is not" : "is", null] }),
  };
  
  // if domain is equal to the defualt domain,
  // it means admins is looking for links with the defualt domain (no custom user domain)
  if (domain === env.DEFAULT_DOMAIN) {
    domain = undefined;
    match.domain_id = null;
  }
  
  const [data, total] = await Promise.all([
    query.link.getAdmin(match, { limit, search, user, domain, skip }),
    query.link.totalAdmin(match, { search, user, domain })
  ]);

  // Add tags to each link
  const linksWithTags = await Promise.all(
    data.map(async link => {
      const tags = await query.tag.getByLinkId(link.id);
      return { ...link, tags };
    })
  );

  const links = linksWithTags.map(utils.sanitize.link_admin);

  if (req.isHTML) {
    res.render("partials/admin/links/table", {
      total,
      total_formatted: total.toLocaleString("en-US"),
      limit,
      skip,
      links,
    })
    return;
  }

  return res.send({
    total,
    limit,
    skip,
    data: links,
  });
};

async function create(req, res) {
  const { 
    reuse, password, customurl, description, target, fetched_domain, expire_in,
    // Advanced features
    max_clicks, click_limit_period, redirect_type, enable_analytics, public_stats,
    meta_title, meta_description, meta_image,
    utm_campaign, utm_source, utm_medium
  } = req.body;
  const domain_id = fetched_domain ? fetched_domain.id : null;
  
  const targetDomain = utils.removeWww(URL.parse(target).hostname);
  
  const tasks = await Promise.all([
    reuse &&
      query.link.find({
        target,
        user_id: req.user.id,
        domain_id
      }),
    customurl &&
      query.link.find({
        address: customurl,
        domain_id
      }),
    !customurl && utils.generateId(query, domain_id),
    validators.bannedDomain(targetDomain),
    validators.bannedHost(targetDomain)
  ]);
  
  // if "reuse" is true, try to return
  // the existent URL without creating one
  if (tasks[0]) {
    return res.json(utils.sanitize.link(tasks[0]));
  }
  
  // Check if custom link already exists
  if (tasks[1]) {
    const error = "Custom URL is already in use.";
    res.locals.errors = { customurl: error };
    throw new CustomError(error);
  }

  // Create new link with advanced features
  const address = customurl || tasks[2];
  const linkData = {
    password,
    address,
    domain_id,
    description,
    target,
    expire_in,
    user_id: req.user && req.user.id
  };
  
  // Add advanced features if provided
  if (max_clicks !== undefined) linkData.max_clicks = max_clicks;
  if (click_limit_period) linkData.click_limit_period = click_limit_period;
  if (redirect_type) linkData.redirect_type = redirect_type;
  if (enable_analytics !== undefined) linkData.enable_analytics = enable_analytics;
  if (public_stats !== undefined) linkData.public_stats = public_stats;
  if (meta_title) linkData.meta_title = meta_title;
  if (meta_description) linkData.meta_description = meta_description;
  if (meta_image) linkData.meta_image = meta_image;
  if (utm_campaign) linkData.utm_campaign = utm_campaign;
  if (utm_source) linkData.utm_source = utm_source;
  if (utm_medium) linkData.utm_medium = utm_medium;
  
  const link = await query.link.create(linkData);

  link.domain = fetched_domain?.address;
  
  // Add tags if provided
  if (req.body.tag_ids && Array.isArray(req.body.tag_ids) && req.body.tag_ids.length > 0) {
    try {
      await query.tag.addToLink(link.id, req.body.tag_ids);
    } catch (err) {
      // Ignore tag errors for link creation
    }
  }
  
  // Get tags for response
  link.tags = await query.tag.getByLinkId(link.id);
  
  if (req.isHTML) {
    res.setHeader("HX-Trigger", "reloadMainTable");
    const shortURL = utils.getShortURL(link.address, link.domain);
    return res.render("partials/shortener", {
      link: shortURL.link, 
      url: shortURL.url,
    });
  }
  
  return res
    .status(201)
    .send(utils.sanitize.link({ ...link }));
};

async function edit(req, res) {
  const link = await query.link.find({
    uuid: req.params.id,
    ...(!req.user.admin && { user_id: req.user.id })
  });

  if (!link) {
    throw new CustomError("Link was not found.");
  }

  let isChanged = false;
  [
    [req.body.address, "address"], 
    [req.body.target, "target"], 
    [req.body.description, "description"], 
    [req.body.expire_in, "expire_in"], 
    [req.body.password, "password"],
    // Advanced features
    [req.body.max_clicks, "max_clicks"],
    [req.body.click_limit_period, "click_limit_period"],
    [req.body.redirect_type, "redirect_type"],
    [req.body.enable_analytics, "enable_analytics"],
    [req.body.public_stats, "public_stats"],
    [req.body.meta_title, "meta_title"],
    [req.body.meta_description, "meta_description"],
    [req.body.meta_image, "meta_image"],
    [req.body.utm_campaign, "utm_campaign"],
    [req.body.utm_source, "utm_source"],
    [req.body.utm_medium, "utm_medium"]
  ].forEach(([value, name]) => {
    // Allow null/undefined for clearable fields
    const isClearableField = [
      "password", "description", "expire_in",
      "max_clicks", "click_limit_period", "redirect_type",
      "meta_title", "meta_description", "meta_image",
      "utm_campaign", "utm_source", "utm_medium"
    ].includes(name);
    
    // Allow false for boolean fields
    const isBooleanField = ["enable_analytics", "public_stats"].includes(name);
    
    if (value === undefined || (value === null && !isClearableField)) {
      delete req.body[name];
      return;
    }
    
    // Handle password special case
    if (name === "password") {
      if (!value && link.password) {
        req.body.password = null;
        isChanged = true;
        return;
      }
      if (value && value.replace(/•/ig, "").length === 0) {
        delete req.body.password;
        return;
      }
    }
    
    // Handle expire_in special case
    if (name === "expire_in" && link.expire_in) {
      if (Math.abs(differenceInSeconds(utils.parseDatetime(value), utils.parseDatetime(link.expire_in))) < 60) {
        delete req.body[name];
        return;
      }
    }
    
    // Check if value changed (handle booleans and nulls)
    if (isBooleanField) {
      if (value !== link[name]) {
        isChanged = true;
      } else {
        delete req.body[name];
      }
      return;
    }
    
    // For clearable fields, allow setting to null
    if (value === null && isClearableField && link[name] !== null) {
      isChanged = true;
      return;
    }
    
    // Regular value comparison
    if (value === link[name] && name !== "password") {
      delete req.body[name];
      return;
    }
    
    isChanged = true;
  });

  if (!isChanged) {
    throw new CustomError("Should at least update one field.");
  }

  const { 
    address, target, description, expire_in, password,
    // Advanced features
    max_clicks, click_limit_period, redirect_type, enable_analytics, public_stats,
    meta_title, meta_description, meta_image,
    utm_campaign, utm_source, utm_medium
  } = req.body;
  
  const targetDomain = target && utils.removeWww(URL.parse(target).hostname);
  const domain_id = link.domain_id || null;

  const tasks = await Promise.all([
    address &&
      query.link.find({
        address,
        domain_id
      }),
    target && validators.bannedDomain(targetDomain),
    target && validators.bannedHost(targetDomain)
  ]);

  // Check if custom link already exists
  if (tasks[0]) {
    const error = "Custom URL is already in use.";
    res.locals.errors = { address: error };
    throw new CustomError("Custom URL is already in use.");
  }

  // Update link with all fields including advanced features
  const updateData = {
    ...(address && { address }),
    ...(description !== undefined && { description }),
    ...(target && { target }),
    ...(expire_in !== undefined && { expire_in }),
    ...((password !== undefined) && { password }),
    // Advanced features
    ...(max_clicks !== undefined && { max_clicks }),
    ...(click_limit_period !== undefined && { click_limit_period }),
    ...(redirect_type !== undefined && { redirect_type }),
    ...(enable_analytics !== undefined && { enable_analytics }),
    ...(public_stats !== undefined && { public_stats }),
    ...(meta_title !== undefined && { meta_title }),
    ...(meta_description !== undefined && { meta_description }),
    ...(meta_image !== undefined && { meta_image }),
    ...(utm_campaign !== undefined && { utm_campaign }),
    ...(utm_source !== undefined && { utm_source }),
    ...(utm_medium !== undefined && { utm_medium })
  };
  
  const [updatedLink] = await query.link.update(
    { id: link.id },
    updateData
  );

  if (req.isHTML) {
    res.render("partials/links/edit", {
      swap_oob: true,
      success: "Link has been updated.",
      ...utils.sanitize.link_html({ ...updatedLink }),
    });
    return;
  }

  return res.status(200).send(utils.sanitize.link({ ...updatedLink }));
};

async function editAdmin(req, res) {
  const link = await query.link.find({
    uuid: req.params.id,
    ...(!req.user.admin && { user_id: req.user.id })
  });

  if (!link) {
    throw new CustomError("Link was not found.");
  }

  let isChanged = false;
  [
    [req.body.address, "address"], 
    [req.body.target, "target"], 
    [req.body.description, "description"], 
    [req.body.expire_in, "expire_in"], 
    [req.body.password, "password"]
  ].forEach(([value, name]) => {
    if (!value) {
      if (name === "password" && link.password) 
        req.body.password = null;
      else {
        delete req.body[name];
        return;
      }
    }
    if (value === link[name] && name !== "password") {
      delete req.body[name];
      return;
    }
    if (name === "expire_in" && link.expire_in)
      if (Math.abs(differenceInSeconds(utils.parseDatetime(value), utils.parseDatetime(link.expire_in))) < 60)
          return;
    if (name === "password")
      if (value && value.replace(/•/ig, "").length === 0) {
        delete req.body.password;
        return;
      }
    isChanged = true;
  });

  if (!isChanged) {
    throw new CustomError("Should at least update one field.");
  }

  const { address, target, description, expire_in, password } = req.body;
  
  const targetDomain = target && utils.removeWww(URL.parse(target).hostname);
  const domain_id = link.domain_id || null;

  const tasks = await Promise.all([
    address &&
      query.link.find({
        address,
        domain_id
      }),
    target && validators.bannedDomain(targetDomain),
    target && validators.bannedHost(targetDomain)
  ]);

  // Check if custom link already exists
  if (tasks[0]) {
    const error = "Custom URL is already in use.";
    res.locals.errors = { address: error };
    throw new CustomError("Custom URL is already in use.");
  }

  // Update link
  const [updatedLink] = await query.link.update(
    {
      id: link.id
    },
    {
      ...(address && { address }),
      ...(description && { description }),
      ...(target && { target }),
      ...(expire_in && { expire_in }),
      ...((password || password === null) && { password })
    }
  );

  if (req.isHTML) {
    res.render("partials/admin/links/edit", {
      swap_oob: true,
      success: "Link has been updated.",
      ...utils.sanitize.link_admin({ ...updatedLink }),
    });
    return;
  }

  return res.status(200).send(utils.sanitize.link({ ...updatedLink }));
};

async function remove(req, res) {
  const { error, isRemoved, link } = await query.link.remove({
    uuid: req.params.id,
    ...(!req.user.admin && { user_id: req.user.id })
  });

  if (!isRemoved) {
    const messsage = error || "Could not delete the link.";
    throw new CustomError(messsage);
  }

  if (req.isHTML) {
    res.setHeader("HX-Reswap", "outerHTML");
    res.setHeader("HX-Trigger", "reloadMainTable");
    res.render("partials/links/dialog/delete_success", {
      link: utils.getShortURL(link.address, link.domain).link,
    });
    return;
  }

  return res
    .status(200)
    .send({ message: "Link has been deleted successfully." });
};

async function report(req, res) {
  const { link } = req.body;

  await transporter.sendReportEmail(link);

  if (req.isHTML) {
    res.render("partials/report/form", {
      message: "Report was received. We'll take actions shortly."
    });
    return;
  }
  
  return res
    .status(200)
    .send({ message: "Thanks for the report, we'll take actions shortly." });
};

async function ban(req, res) {
  const { id } = req.params;

  const update = {
    banned_by_id: req.user.id,
    banned: true
  };

  // 1. check if link exists
  const link = await query.link.find({ uuid: id });

  if (!link) {
    throw new CustomError("No link has been found.", 400);
  }

  if (link.banned) {
    throw new CustomError("Link has been banned already.", 400);
  }

  const tasks = [];

  // 2. ban link
  tasks.push(query.link.update({ uuid: id }, update));

  const domain = utils.removeWww(URL.parse(link.target).hostname);

  // 3. ban target's domain
  if (req.body.domain) {
    tasks.push(query.domain.add({ ...update, address: domain }));
  }

  // 4. ban target's host
  if (req.body.host) {
    const dnsRes = await dnsLookup(domain).catch(() => {
      throw new CustomError("Couldn't fetch DNS info.");
    });
    const host = dnsRes?.address;
    tasks.push(query.host.add({ ...update, address: host }));
  }

  // 5. ban link owner
  if (req.body.user && link.user_id) {
    tasks.push(query.user.update({ id: link.user_id }, update));
  }

  // 6. ban all of owner's links
  if (req.body.userLinks && link.user_id) {
    tasks.push(query.link.update({ user_id: link.user_id }, update));
  }

  // 7. wait for all tasks to finish
  await Promise.all(tasks).catch((err) => {
    throw new CustomError("Couldn't ban entries.");
  });

  // 8. send response
  if (req.isHTML) {
    res.setHeader("HX-Reswap", "outerHTML");
    res.setHeader("HX-Trigger", "reloadMainTable");
    res.render("partials/links/dialog/ban_success", {
      link: utils.getShortURL(link.address, link.domain).link,
    });
    return;
  }

  return res.status(200).send({ message: "Banned link successfully." });
};

async function redirect(req, res, next) {
  const isPreservedUrl = utils.preservedURLs.some(
    item => item === req.path.replace("/", "")
  );

  if (isPreservedUrl) return next();

  // 1. If custom domain, get domain info
  const host = utils.removeWww(req.headers.host);
  const domain =
    host !== env.DEFAULT_DOMAIN
      ? await query.domain.find({ address: host })
      : null;

  // 2. Get link
  const address = req.params.id.replace("+", "");
  const link = await query.link.find({
    address,
    domain_id: domain ? domain.id : null
  });

  // 3. When no link, if has domain redirect to domain's homepage
  // otherwise redirect to 404
  if (!link) {
    return res.redirect(domain?.homepage || "/404");
  }

  // 4. If link is banned, redirect to banned page.
  if (link.banned) {
    return res.redirect("/banned");
  }

  // 5. If wants to see link info, then redirect
  const isRequestingInfo = /.*\+$/gi.test(req.params.id);
  if (isRequestingInfo && !link.password) {
    if (req.isHTML) {
      res.render("url_info", { 
        title: "Short link information",
        target: link.target,
        link: utils.getShortURL(link.address, link.domain).link
      });
      return;
    }
    return res.send({ target: link.target });
  }

  // 6. Apply security and smart redirect checks
  const securityResult = await redirectMiddleware.applySecurityAndSmartRedirect(req, res, next, link);
  if (securityResult !== null) {
    // Security check handled the response (blocked or smart redirected)
    return;
  }

  // 7. Check click limits
  const clickCheck = await checkClickLimits(link);
  if (!clickCheck.allowed) {
    // Click limit reached - return 410 Gone status
    if (req.isHTML) {
      res.status(410).render("error", {
        title: "Link expired",
        message: clickCheck.reason || "This link has reached its click limit."
      });
      return;
    }
    return res.status(410).send({ 
      message: clickCheck.reason || "Link has reached its click limit." 
    });
  }
  
  // Update click count for period-based limits
  if (link.max_clicks && link.click_limit_period && link.click_limit_period !== 'total') {
    if (clickCheck.resetPeriod) {
      // Reset the period counter
      await query.link.update(
        { id: link.id },
        { 
          click_count_period: 1, 
          click_period_start: new Date() 
        }
      );
    } else {
      // Increment the period counter
      await query.link.update(
        { id: link.id },
        { click_count_period: (link.click_count_period || 0) + 1 }
      );
    }
  }

  // 8. If link is protected, redirect to password page
  if (link.password) {
    if ("authorization" in req.headers) {
      const auth = req.headers.authorization;
      const firstSpace = auth.indexOf(" ");
      if (firstSpace !== -1) {
        const method = auth.slice(0, firstSpace);
        const payload = auth.slice(firstSpace + 1);
        if (method === "Basic") {
          const decoded = Buffer.from(payload, "base64").toString("utf8");
          const colon = decoded.indexOf(":");
          if (colon !== -1) {
            const password = decoded.slice(colon + 1);
            const matches = await bcrypt.compare(password, link.password);
            if (matches) {
              // Build target URL with UTM parameters
              const targetURL = buildTargetURL(link);
              const redirectType = link.redirect_type || 302;
              return res.redirect(redirectType, targetURL);
            }
          }
        }
      }
    }
    res.render("protected", {
      title: "Protected short link",
      id: link.uuid
    });
    return;
  }

  // 9. Create link visit (only if analytics is enabled)
  const isBot = isbot(req.headers["user-agent"]);
  const analyticsEnabled = link.enable_analytics !== false; // Default to true if not set
  
  if (link.user_id && !isBot && analyticsEnabled) {
    queue.visit.add({
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      country: req.get("cf-ipcountry"),
      referrer: req.get("Referrer"),
      headers: {
        "user-agent": req.headers["user-agent"],
        "accept-language": req.headers["accept-language"],
      },
      link
    });
  }

  // 10. Build target URL with UTM parameters and redirect
  const targetURL = buildTargetURL(link);
  const redirectType = link.redirect_type || 302; // Default to 302 if not set
  
  return res.redirect(redirectType, targetURL);
};

async function redirectProtected(req, res) {
  // 1. Get link
  const uuid = req.params.id;
  const link = await query.link.find({ uuid });

  // 2. Throw error if no link
  if (!link || !link.password) {
    throw new CustomError("Couldn't find the link.", 400);
  }

  // 3. Check if password matches
  const matches = await bcrypt.compare(req.body.password, link.password);

  if (!matches) {
    throw new CustomError("Password is not correct.", 401);
  }

  // 4. Create visit (only if analytics is enabled)
  const analyticsEnabled = link.enable_analytics !== false; // Default to true if not set
  
  if (link.user_id && analyticsEnabled) {
    queue.visit.add({
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      country: req.get("cf-ipcountry"),
      referrer: req.get("Referrer"),
      headers: {
        "user-agent": req.headers["user-agent"],
        "accept-language": req.headers["accept-language"],
      },
      link
    });
  }

  // 5. Build target URL with UTM parameters
  const targetURL = buildTargetURL(link);
  
  // 6. Send target
  if (req.isHTML) {
    res.setHeader("HX-Redirect", targetURL);
    res.render("partials/protected/form", {
      id: link.uuid,
      message: "Redirecting...",
    });
    return;
  }
  return res.status(200).send({ target: targetURL });
};

async function redirectCustomDomainHomepage(req, res, next) {
  const host = utils.removeWww(req.headers.host);
  if (host === env.DEFAULT_DOMAIN) {
    next();
    return;
  }

  const path = req.path;
  const pathName = path.replace("/", "").split("/")[0];
  if (
    path === "/" ||
    utils.preservedURLs.includes(pathName)
  ) {
    const domain = await query.domain.find({ address: host });
    if (domain?.homepage) {
      res.redirect(302, domain.homepage);
      return;
    }
  }

  next();
};

async function stats(req, res) {
  const { user } = req;
  const uuid = req.params.id;

  const link = await query.link.find({
    ...(!user.admin && { user_id: user.id }),
    uuid
  });

  if (!link) {
    if (req.isHTML) {
      res.setHeader("HX-Redirect", "/404");
      res.status(200).send("");
      return;
    }
    throw new CustomError("Link could not be found.");
  }

  const stats = await query.visit.find({ link_id: link.id }, link.visit_count);

  if (!stats) {
    throw new CustomError("Could not get the short link stats. Try again later.");
  }

  if (req.isHTML) {
    res.render("partials/stats", {
      link: utils.sanitize.link_html(link),
      stats,
      map,
    });
    return;
  }

  return res.status(200).send({
    ...stats,
    ...utils.sanitize.link(link)
  });
};

module.exports = {
  ban,
  create,
  edit,
  editAdmin,
  get,
  getAdmin,
  remove,
  report,
  stats,
  redirect,
  redirectProtected,
  redirectCustomDomainHomepage,
}