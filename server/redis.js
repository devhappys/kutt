const Redis = require("ioredis");

const env = require("./env");

let client;

if (env.REDIS_ENABLED) {
  client = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    // Performance optimizations
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    // Keep connections alive
    keepAlive: 30000,
    // Retry strategy
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // Reconnect on error
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    // Lazy connect
    lazyConnect: false,
    // Command queue size limit
    commandQueueHighWaterMark: 1000,
  });

  // Error handling
  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  client.on('ready', () => {
    console.log('[Redis] Ready to accept commands');
  });

  client.on('close', () => {
    console.log('[Redis] Connection closed');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });
}

const key = {
  link: (address, domain_id) => `l:${address}:${domain_id || ""}`,
  domain: (address) => `d:${address}`,
  stats: (link_id) => `s:${link_id}`,
  host: (address) => `h:${address}`,
  user: (idOrKey) => `u:${idOrKey}`
};

const remove = {
  domain: (domain) => {
    if (!domain) return;
    return client.del(key.domain(domain.address));
  },
  host: (host) => {
    if (!host) return;
    return client.del(key.host(host.address));
  },
  link: (link) => {
    if (!link) return;
    return client.del(key.link(link.address, link.domain_id));
  },
  user: (user) => {
    if (!user) return;
    return Promise.all([
      client.del(key.user(user.id)),
      client.del(key.user(user.apikey)),
    ]);
  }
};


module.exports = {
  client,
  key,
  remove,
}