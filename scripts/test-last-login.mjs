/**
 * Last-login integration test (Supabase dev).
 * Run: node scripts/test-last-login.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(ROOT, ".env.local");
  if (!existsSync(path)) {
    throw new Error("Missing .env.local");
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

assert(url, "NEXT_PUBLIC_SUPABASE_URL missing");
assert(anonKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing");
assert(serviceKey, "SUPABASE_SECRET_KEY missing");

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testEmail = `last-login-test-${Date.now()}@terrana-test.local`;
const testPassword = `TestPass-${Date.now()}-Aa1`;
let userId = null;

try {
  console.log("Last login integration test…\n");

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

  assert(!createError && created.user, `createUser failed: ${createError?.message}`);
  userId = created.user.id;
  console.log(`✓ created temp user ${testEmail}`);

  const { data: beforeRow, error: beforeError } = await admin
    .from("users")
    .select("id, last_login")
    .eq("id", userId)
    .single();

  assert(!beforeError, `users read failed: ${beforeError?.message}`);
  assert(beforeRow.last_login === null, "expected null last_login on new user");
  console.log("✓ new user last_login is null");

  const authed = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: signInError } = await authed.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  assert(!signInError, `signIn failed: ${signInError?.message}`);
  console.log("✓ signed in as temp user");

  const loginTime = new Date().toISOString();

  const { error: rpcError } = await authed.rpc("record_login_attendance", {
    login_time: loginTime,
    login_lat: null,
    login_lng: null,
  });
  assert(!rpcError, `record_login_attendance RPC failed: ${rpcError?.message}`);
  console.log("✓ record_login_attendance RPC succeeded (geofence off)");

  const { data: afterRow, error: afterError } = await admin
    .from("users")
    .select("last_login")
    .eq("id", userId)
    .single();

  assert(!afterError, `users re-read failed: ${afterError?.message}`);
  assert(afterRow.last_login, "last_login still null after RPC");
  assert(
    Math.abs(new Date(afterRow.last_login).getTime() - new Date(loginTime).getTime()) <
      5000,
    `last_login mismatch: got ${afterRow.last_login}, expected ~${loginTime}`,
  );
  console.log(`✓ last_login stored: ${afterRow.last_login}`);

  const loginForm = readFileSync(
    join(ROOT, "src/components/auth/login-form.tsx"),
    "utf8",
  );
  assert(
    loginForm.includes("await recordLoginSession(supabase)"),
    "login form must await recordLoginSession(supabase) before redirect",
  );
  console.log("✓ login form records session on authenticated browser client");

  console.log("\nPASS — last login flow is working");
} catch (error) {
  console.error(`\nFAIL — ${error.message}`);
  process.exitCode = 1;
} finally {
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
    console.log("✓ cleaned up temp user");
  }
}
