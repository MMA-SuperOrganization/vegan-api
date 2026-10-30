const placeholder = /change_me|placeholder|example|your[_ -]?(email|password)/i;

export const validateAdminSeedConfig = (seed = {}) => {
  const email = seed.adminEmail?.trim().toLowerCase();
  const password = seed.adminPassword?.trim();
  const displayName = seed.adminDisplayName?.trim() || "VEGETA Admin";

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || placeholder.test(email))
    throw new Error("Set SEED_ADMIN_EMAIL to the real administrator login email");
  if (!password || password.length < 12 || placeholder.test(password))
    throw new Error("Set SEED_ADMIN_PASSWORD to a non-placeholder value of at least 12 characters");
  if (displayName.length > 100) throw new Error("SEED_ADMIN_DISPLAY_NAME is too long");

  return { email, password, displayName };
};

export const provisionAdminAccount = async ({ firebaseAuth, users, seed }) => {
  const input = validateAdminSeedConfig(seed);
  let identity;
  try {
    identity = await firebaseAuth.getUserByEmail(input.email);
    identity = await firebaseAuth.updateUser(identity.uid, {
      password: input.password,
      displayName: input.displayName,
      disabled: false,
      emailVerified: true,
    });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    identity = await firebaseAuth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      disabled: false,
      emailVerified: true,
    });
  }

  const emailOwner = await users.findOne({ email: input.email });
  if (emailOwner && emailOwner.firebaseUid !== identity.uid)
    throw new Error("The admin email is already linked to another Firebase identity");

  const account = await users.upsert(
    { firebaseUid: identity.uid },
    {
      firebaseUid: identity.uid,
      email: input.email,
      displayName: input.displayName,
      role: "admin",
      status: "active",
      onboardingCompleted: true,
      deletedAt: null,
    },
  );

  return { firebaseUid: identity.uid, email: input.email, account };
};
