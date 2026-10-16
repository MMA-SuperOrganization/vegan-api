const reconnecting = new WeakSet();

export const connectWithDeadline = async (client, timeoutMs = 5000) => {
  let timer;
  try {
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          if (client.isOpen) client.destroy();
          reject(new Error("Redis connection deadline exceeded"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const reconnect = (client) => {
  if (reconnecting.has(client)) return;
  reconnecting.add(client);
  // Drop queued/in-flight replies: they must never be mistaken for responses to
  // commands on a new connection. A timed-out SET may still have run on Redis;
  // the durable Mongo guard remains necessary for standalone safety.
  if (client.isOpen) client.destroy();
  void connectWithDeadline(client)
    .catch(() => {})
    .finally(() => reconnecting.delete(client));
};

export const createRedisCommandRunner =
  ({ client, timeoutMs }) =>
  async (method, ...args) => {
    let timer;
    try {
      return await Promise.race([
        Promise.resolve().then(() => client[method](...args)),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            reconnect(client);
            reject(new Error("Redis response deadline exceeded"));
          }, timeoutMs);
        }),
      ]);
    } catch (error) {
      // The SDK stops reconnecting after its retry budget. Future requests must
      // be able to start a fresh connection once Redis is available again.
      if (!client.isOpen) reconnect(client);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
