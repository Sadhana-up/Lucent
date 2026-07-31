/**
 * Auth test script — tests sign-up, sign-in, and session for dummy users.
 * Run: node scripts/test-auth.mjs
 */

const BASE = "http://localhost:3000";

const green = (s) => `\x1b[32m✓ ${s}\x1b[0m`;
const red = (s) => `\x1b[31m✗ ${s}\x1b[0m`;
const blue = (s) => `\x1b[34m» ${s}\x1b[0m`;

async function authFetch(path, body, cookies = "") {
  const res = await fetch(`${BASE}/api/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": BASE,
      "Referer": BASE + "/",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  const setCookie = res.headers.get("set-cookie") || "";
  return { status: res.status, data, cookies: setCookie };
}

async function getSession(cookies) {
  const res = await fetch(`${BASE}/api/auth/get-session`, {
    headers: { Cookie: cookies },
  });
  return res.json();
}

function extractSessionCookie(setCookieHeader) {
  // Extract better-auth session cookie
  return setCookieHeader
    .split(",")
    .map((c) => c.trim().split(";")[0])
    .join("; ");
}

async function runTest(label, userPayload) {
  console.log("\n" + blue(`Testing: ${label}`));

  const ts = Date.now();
  const email = userPayload.email.replace("@", `+${ts}@`);

  // 1. Sign Up
  const signup = await authFetch("/sign-up/email", { ...userPayload, email });
  if (signup.status === 200) {
    console.log(green(`Sign-up succeeded (${email})`));
  } else {
    console.log(red(`Sign-up failed: ${JSON.stringify(signup.data)}`));
    return;
  }

  // 2. Sign In
  const signin = await authFetch("/sign-in/email", {
    email,
    password: userPayload.password,
  });
  if (signin.status === 200) {
    console.log(green(`Sign-in succeeded`));
  } else {
    console.log(red(`Sign-in failed: ${JSON.stringify(signin.data)}`));
    return;
  }

  const sessionCookie = extractSessionCookie(signin.cookies);

  // 3. Get session
  const session = await getSession(sessionCookie);
  if (session?.user) {
    console.log(green(`Session valid — user: ${session.user.email}, role: ${session.user.role ?? "(not set)"}`));
  } else {
    console.log(red(`Session missing — got: ${JSON.stringify(session)}`));
  }

  // 4. Sign Out
  const signout = await authFetch("/sign-out", {}, sessionCookie);
  if (signout.status === 200) {
    console.log(green(`Sign-out succeeded`));
  } else {
    console.log(red(`Sign-out failed: status ${signout.status}`));
  }
}

(async () => {
  console.log(blue("=== Better Auth Integration Tests ==="));

  await runTest("Customer sign-up + sign-in", {
    name: "Test Customer",
    email: "testcustomer@example.com",
    password: "TestPass123!",
    initialRole: "user",
  });

  await runTest("Seller sign-up + sign-in", {
    name: "Test Seller",
    email: "testseller@example.com",
    password: "TestPass123!",
    initialRole: "seller",
  });

  console.log("\n" + blue("=== Done ==="));
})();
