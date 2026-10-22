// Opt-in smoke against the deployment configured by the frontend.
// Owns a temporary Firebase account; never reads or changes another user's data.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { loadEnv } from "../../src/config/env.js";
import { createFirebaseAuth } from "../../src/config/firebase.js";
import { AndroidUi } from "./android-ui.mjs";

if (!process.argv.includes("--allow-external-test-user"))
  throw new Error(
    "Pass --allow-external-test-user to create and remove a temporary deployed account.",
  );
process.loadEnvFile("../vegan-app-mma301/.env");
const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
assert.ok(base?.startsWith("https://"), "Use the deployed HTTPS API from frontend .env");
const firebase = createFirebaseAuth(loadEnv(process.env).firebase);
const email = "vegeta.deploy." + randomUUID().slice(0, 12) + "@example.com";
const password = "VegetaQa" + randomUUID().replaceAll("-", "");
let uid,
  token,
  synced = false;
const checks = [];
const output = new URL("../../test-results/deployed-smoke/", import.meta.url);
await mkdir(output, { recursive: true });
const request = async (path, method = "GET", body) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(90000),
  });
  const payload = await response.json();
  checks.push({ path, method, status: response.status, errorCode: payload.error?.code });
  return { status: response.status, data: payload.data, error: payload.error };
};
try {
  for (const path of ["/health", "/health/ready", "/app/config", "/recipes?limit=2"])
    assert.equal((await request(path)).status, 200);
  const account = await firebase.createUser({
    email,
    password,
    emailVerified: true,
    displayName: "VEGETA deployment QA",
  });
  uid = account.uid;
  await writeFile(new URL("cleanup-manifest.json", output), JSON.stringify({ uid, email, base }));
  const customToken = await firebase.createCustomToken(uid);
  const signIn = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=" +
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const identity = await signIn.json();
  assert.equal(signIn.status, 200, "Firebase test sign-in");
  token = identity.idToken;
  assert.equal((await request("/auth/sync", "POST", {})).status, 200);
  synced = true;
  const conversation = await request("/ai/conversations", "POST", {
    title: "Temporary deployment acceptance test",
  });
  let ai = { passed: false, status: conversation.status, errorCode: conversation.error?.code };
  if (conversation.status < 300) {
    const id = conversation.data._id ?? conversation.data.id;
    const reply = await request("/ai/conversations/" + id + "/messages", "POST", {
      content: "Suggest one simple vegan breakfast in one sentence.",
      useProfile: false,
    });
    ai = {
      passed: reply.status < 300 && Boolean(reply.data?.content),
      status: reply.status,
      errorCode: reply.error?.code,
    };
  }
  const result = { base, publicApiPassed: true, realFirebasePassed: true, ai, checks };
  if (process.argv.includes("--android")) {
    const ui = new AndroidUi(process.env.ANDROID_TEST_SERIAL || "emulator-5560", output);
    assert.ok(
      (await ui.adb("emu", "avd", "name"))
        .split("\n")
        .map((line) => line.trim())
        .includes("VEGETA_Requirement_Test"),
      "Use only the dedicated QA emulator",
    );
    assert.equal(
      (await request("/profiles/me", "PUT", { dateOfBirth: "1998-04-05", gender: "male" })).status,
      200,
    );
    assert.equal(
      (
        await request("/onboarding", "PUT", {
          dietType: "vegan",
          goal: "maintain",
          activityLevel: "moderate",
          heightCm: 170,
          currentWeightKg: 65,
          allergenIds: [],
          timezone: "Asia/Ho_Chi_Minh",
        })
      ).status,
      200,
    );
    assert.equal((await request("/onboarding/complete", "POST", {})).status, 200);
    await ui.adb("shell", "pm", "clear", "com.ngocthang.veganapp");
    await ui.adb("logcat", "-b", "crash", "-c");
    await ui.adb("shell", "am", "start", "-W", "-n", "com.ngocthang.veganapp/.MainActivity");
    try {
      await ui.tap("Tôi đã có tài khoản");
      await ui.fill("Email", email);
      await ui.fill("Mật khẩu", password);
      await ui.scrollTap("Đăng nhập");
      await ui.waitFor(/Xin chào/);
      await ui.capture("01-deployed-home");
      for (const [tab, name] of [
        ["Mở Thực đơn", "02-meal-plan"],
        ["Mở Mua sắm", "03-grocery"],
        ["Mở Nhật ký", "04-tracking"],
        ["Mở Cá nhân", "05-profile"],
      ]) {
        await ui.tap(tab);
        await ui.snapshot();
        await ui.capture(name);
      }
      await ui.scrollTap("Mở kho nguyên liệu");
      await ui.waitFor("Thêm nguyên liệu");
      await ui.capture("06-pantry");
      await ui.back();
      await ui.scrollTap("Nhắc lịch");
      await ui.adb(
        "shell",
        "pm",
        "grant",
        "com.ngocthang.veganapp",
        "android.permission.POST_NOTIFICATIONS",
      );
      await ui.tap("Đăng ký nhận push");
      await ui.waitFor("Thiết bị đã đăng ký nhận push.", { timeout: 60000 });
      await ui.capture("07-native-fcm-registered");
      await ui.tap("Tắt push trên thiết bị này");
      await ui.waitFor("Bật push để nhận nhắc lịch trên thiết bị này.");
      await ui.back();
      await ui.scrollTap("Tài khoản & bảo mật");
      await ui.scrollTap("Đăng xuất");
      await ui.waitFor("Đăng nhập");
      const crashes = await ui.adb("logcat", "-b", "crash", "-d");
      assert.ok(!crashes.includes("com.ngocthang.veganapp"), "No application native crash");
      result.android = { passed: true, fcmRegistration: true, logout: true };
    } catch (error) {
      await ui.capture("native-failure").catch(() => {});
      throw new Error(
        String(error.message).replaceAll(email, "[TEST_EMAIL]").replaceAll(password, "[REDACTED]"),
      );
    }
  }
  await writeFile(new URL("result.json", output), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} catch (error) {
  throw new Error(
    String(error.message).replaceAll(email, "[TEST_EMAIL]").replaceAll(password, "[REDACTED]"),
  );
} finally {
  let deleted = false;
  let firebaseRemoved = false;
  const cleanupErrors = [];
  try {
    if (synced) deleted = (await request("/users/me", "DELETE", {})).status < 300;
    if (synced && !deleted) throw new Error("Backend cleanup failed");
  } catch (error) {
    cleanupErrors.push({ target: "backend", code: error.code || error.name });
  }
  try {
    if (uid) {
      const account = await firebase.getUser(uid);
      assert.equal(account.email, email);
      await firebase.deleteUser(uid);
      firebaseRemoved = true;
    }
  } catch (error) {
    cleanupErrors.push({ target: "firebase", code: error.code || error.name });
  }
  if (cleanupErrors.length) process.exitCode = 1;
  else await rm(new URL("cleanup-manifest.json", output), { force: true });
  console.log(
    JSON.stringify({
      cleanup: cleanupErrors.length === 0,
      firebaseRemoved,
      backendTestAccountDeleted: deleted,
      cleanupErrors,
    }),
  );
}
