const parseUri = (uri) => {
  if (typeof uri !== "string" || !/^mongodb(?:\+srv)?:\/\//.test(uri) || /CHANGE_ME/i.test(uri))
    throw new Error("Use a real dedicated MongoDB test URI");
  const match = uri.match(/^mongodb(\+srv)?:\/\/([^/?#]+)\/([^/?#]+)(?:\?([^#]*))?$/);
  if (!match) throw new Error("Test URI must explicitly name its isolated database");
  let database;
  try {
    database = decodeURIComponent(match[3]);
  } catch {
    throw new Error("Invalid test database encoding");
  }
  const query = new URLSearchParams(match[4] ?? "");
  return { srv: Boolean(match[1]), authority: match[2], database, query };
};
export function validateDatabaseTestConfig(source = process.env) {
  if (source.RUN_DATABASE_TESTS !== "true" || !source.MONGODB_URI_TEST) return { enabled: false };
  const test = parseUri(source.MONGODB_URI_TEST);
  if (!/^test_vegan_[a-z0-9_]{8,64}$/.test(test.database))
    throw new Error(
      "Test database must be exactly test_vegan_<unique suffix of 8..64 lowercase letters/digits/underscores>",
    );
  if (!test.srv && !test.query.get("replicaSet"))
    throw new Error(
      "Real persistence tests require an explicit replicaSet URI or mongodb+srv Atlas URI",
    );
  if (source.MONGODB_URI === source.MONGODB_URI_TEST)
    throw new Error("Test URI must not reuse the application URI");
  if (source.MONGODB_DB_NAME === test.database)
    throw new Error("Test database must not be the application database");
  if (source.MONGODB_URI) {
    try {
      if (parseUri(source.MONGODB_URI).database === test.database)
        throw new Error("Test database must not reuse the application URI database");
    } catch (error) {
      if (error.message.includes("must not reuse")) throw error;
    }
  }
  return { enabled: true, uri: source.MONGODB_URI_TEST, database: test.database };
}
