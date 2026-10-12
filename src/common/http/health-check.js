const HEALTH_CHECK_PATH = /(?:^|\/)health(?:\/ready)?$/;

export const isHealthCheckRequest = (request) => {
  const url = request?.originalUrl ?? request?.url ?? "";
  const path = String(url).split("?", 1)[0].replace(/\/+$/, "");
  return HEALTH_CHECK_PATH.test(path);
};
