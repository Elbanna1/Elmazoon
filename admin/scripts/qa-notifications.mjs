/**
 * Notifications + visitor-identity QA, and cleanup of leftover test rows.
 *
 *   node scripts/qa-notifications.mjs
 */
const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const BFF = `${BASE}/bff`;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

let adminJar = "";
let visitorJar = "";

function absorb(res, which) {
  const set = res.headers.getSetCookie?.() ?? [];
  const target = which === "admin" ? adminJar : visitorJar;
  let jar = target;
  for (const c of set) {
    const pair = c.split(";")[0];
    const name = pair.split("=")[0];
    jar = [...jar.split("; ").filter(Boolean).filter((x) => x.split("=")[0] !== name), pair].join("; ");
  }
  if (which === "admin") adminJar = jar;
  else visitorJar = jar;
  return set;
}

async function call(method, path, { json, as = "admin" } = {}) {
  const jar = as === "admin" ? adminJar : visitorJar;
  const res = await fetch(`${BFF}${path}`, {
    method,
    headers: { ...(jar ? { cookie: jar } : {}), ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify(json) : undefined,
  });
  const setCookies = absorb(res, as);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, data, setCookies };
}

const results = [];
const check = (name, ok, note = "") => {
  results.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
};

console.log(`\nNotifications + visitor identity QA against ${BASE}\n`);

await call("POST", "/api/admin/login", { json: { email: EMAIL, password: PASSWORD } });

/* -- visitor identity ------------------------------------------------------ */
console.log("VISITOR IDENTITY");

const visit = await call("POST", "/api/analytics/visit", { as: "visitor" });
check("POST /api/analytics/visit", visit.status === 204, `HTTP ${visit.status}`);
check(
  "  → server issues a visitor cookie",
  visit.setCookies.length > 0,
  visit.setCookies.length ? visit.setCookies.map((c) => c.split("=")[0]).join(", ") : "NO Set-Cookie",
);

const q = await call("POST", "/api/questions/create-question", {
  as: "visitor",
  json: { name: "فحص الإشعارات", question: "سؤال آلي للتحقق من الإشعارات و«أسئلتي». يمكن حذفه." },
});
check("POST /api/questions/create-question", q.status === 201, `HTTP ${q.status}`);

// The live server wraps it: { status, data: {...} }
const created = q.data?.data ?? q.data;
check("  → response carries the new question's _id", Boolean(created?._id), created?._id ?? "MISSING");

const mine = await call("GET", "/api/questions/my", { as: "visitor" });
check(
  "GET /api/questions/my sees the question just asked",
  (mine.data?.total ?? 0) > 0,
  `total=${mine.data?.total} pending=${mine.data?.pending} answered=${mine.data?.answered}`,
);

/* -- admin notifications --------------------------------------------------- */
console.log("\nADMIN NOTIFICATIONS");

const n1 = await call("GET", "/api/notifications?take=20");
check("GET /api/notifications", n1.status === 200, `unread=${n1.data?.unreadCount} items=${n1.data?.data?.length}`);

const gotQuestionNotif = (n1.data?.data ?? []).some((x) => /question/i.test(x.type ?? ""));
check("  → a notification was raised for the new question", gotQuestionNotif);

const before = n1.data?.unreadCount ?? 0;
check("  → unread badge is non-zero", before > 0, `unreadCount=${before}`);

const markAll = await call("POST", "/api/notifications/read");
check("POST /api/notifications/read (mark all)", markAll.status === 200, `HTTP ${markAll.status}`);

const n2 = await call("GET", "/api/notifications?take=20");
check("  → badge cleared and STAYS cleared on refetch", (n2.data?.unreadCount ?? -1) === 0, `unreadCount=${n2.data?.unreadCount}`);

/* -- a new comment must raise a notification ------------------------------- */
const articles = (await call("GET", "/api/articles/get-articles?page=1&limit=1")).data?.articles ?? [];
if (articles[0]) {
  const c = await call("POST", `/api/articles/${articles[0]._id}/comments`, {
    as: "visitor",
    json: { name: "فحص الإشعارات", comment: "تعليق آلي للتحقق من الإشعارات. يمكن حذفه." },
  });
  check("POST a comment as a visitor", c.status === 201, `HTTP ${c.status}`);

  const visible = await call("GET", `/api/articles/${articles[0]._id}/comments`, { as: "visitor" });
  const found = (visible.data ?? []).some((x) => x._id === c.data?._id);
  check("  → comment appears IMMEDIATELY (no approval)", found);

  const n3 = await call("GET", "/api/notifications?take=20");
  check("  → a notification was raised for the new comment", (n3.data?.unreadCount ?? 0) > 0, `unreadCount=${n3.data?.unreadCount}`);

  // Clean it up.
  if (c.data?._id) {
    const d = await call("DELETE", `/api/articles/comments/${c.data._id}`);
    check("cleanup: delete the test comment", d.status === 200, `HTTP ${d.status}`);
  }
}

/* -- cleanup --------------------------------------------------------------- */
console.log("\nCLEANUP");

if (created?._id) {
  const d = await call("DELETE", `/api/questions/${created._id}/delete-question`);
  check("delete the test question", d.status === 200, `HTTP ${d.status}`);
}

// Remove any stray articles left behind by earlier shell-based runs.
const stray = ((await call("GET", "/api/articles/get-articles?page=1&limit=50")).data?.articles ?? [])
  .filter((a) => a.title.includes("تحقق") || a.title.startsWith("QA-") || a.title.startsWith("Verification"));
for (const a of stray) {
  const d = await call("DELETE", `/api/articles/${a._id}/delete-article`);
  check(`delete stray article «${a.title}»`, d.status === 200, `HTTP ${d.status}`);
}

const remaining = ((await call("GET", "/api/articles/get-articles?page=1&limit=50")).data?.articles ?? []);
console.log(`\n  articles remaining on the site: ${remaining.map((a) => a.title).join(" | ") || "(none)"}`);

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} passed.` +
    (failed.length ? `\nFAILED:\n${failed.map((f) => "  - " + f.name).join("\n")}` : " All green.") +
    "\n",
);
