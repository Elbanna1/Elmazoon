/**
 * End-to-end verification against the live API, through this app's BFF proxy.
 *
 * Read-only by default. Pass `--write` to additionally run a full CRUD round-trip
 * (create → update → delete an article), which writes to whatever database the
 * configured backend is pointing at — so it is opt-in, not the default.
 *
 *   node scripts/verify-api.mjs                 # read-only
 *   node scripts/verify-api.mjs --write         # + CRUD round-trip
 *
 * Requires the app to be running (npm run dev). Credentials come from the
 * environment so they never enter the repo:
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/verify-api.mjs
 */

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const BFF = `${BASE}/bff`;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const WRITE = process.argv.includes("--write");

if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.");
  process.exit(1);
}

/** Cookies, kept the way a browser would keep them. */
let jar = "";

function remember(response) {
  const cookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    const pair = cookie.split(";")[0];
    const name = pair.split("=")[0];
    const existing = jar
      .split("; ")
      .filter(Boolean)
      .filter((c) => c.split("=")[0] !== name);
    jar = [...existing, pair].join("; ");
  }
}

async function call(method, path, { body, headers = {} } = {}) {
  const response = await fetch(`${BFF}${path}`, {
    method,
    headers: { ...(jar ? { cookie: jar } : {}), ...headers },
    body,
    redirect: "manual",
  });
  remember(response);

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body (some 200s return nothing) */
  }

  return { status: response.status, json, text, headers: response.headers };
}

const results = [];

function check(name, ok, note = "") {
  results.push({ name, ok, note });
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
}

console.log(`\nVerifying against ${BASE} (write mode: ${WRITE ? "ON" : "off"})\n`);

/* -- auth ---------------------------------------------------------------- */
console.log("AUTH");

const login = await call("POST", "/api/admin/login", {
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  headers: { "content-type": "application/json" },
});
check("POST /api/admin/login", login.status === 200, `HTTP ${login.status}`);

if (login.status !== 200) {
  console.error("\nCannot continue without a session. Aborting.\n");
  process.exit(1);
}

check("  → jwt cookie set", jar.includes("jwt"), jar ? "cookies received" : "NO COOKIES");

const auth = await call("GET", "/api/admin/check-authentication");
check(
  "GET /api/admin/check-authentication",
  auth.status === 200 && auth.json?.isAuthenticated === true && auth.json?.isAdmin === true,
  JSON.stringify(auth.json),
);

/* -- dashboard ------------------------------------------------------------ */
console.log("\nDASHBOARD");

const stats = await call("GET", "/api/dashboard/stats?recentCount=5");
check(
  "GET /api/dashboard/stats",
  stats.status === 200 && typeof stats.json?.totalQuestions === "number",
  `questions=${stats.json?.totalQuestions} articles=${stats.json?.totalArticles}`,
);

const dashAnalytics = await call("GET", "/api/dashboard/analytics");
check(
  "GET /api/dashboard/analytics",
  dashAnalytics.status === 200 && typeof dashAnalytics.json?.visitors === "object",
  `visitors=${dashAnalytics.json?.visitors?.totalVisitors} views=${dashAnalytics.json?.totalArticleViews}`,
);

const charts = await call("GET", "/api/dashboard/charts?days=30&months=12");
const c = charts.json;
check(
  "GET /api/dashboard/charts",
  charts.status === 200 && Array.isArray(c?.visitorsPerDay) && Array.isArray(c?.articlesPerMonth),
  `series: visitorsPerDay=${c?.visitorsPerDay?.length} articleViewsPerDay=${c?.articleViewsPerDay?.length} questionsPerDay=${c?.questionsPerDay?.length} articlesPerMonth=${c?.articlesPerMonth?.length}`,
);

/* -- questions ------------------------------------------------------------ */
console.log("\nQUESTIONS");

const questions = await call("GET", "/api/questions/get-questions?page=1&limit=5");
check(
  "GET /api/questions/get-questions",
  questions.status === 200 && Array.isArray(questions.json?.data),
  `count=${questions.json?.data?.length} X-Total-Count=${questions.headers.get("x-total-count")} X-Total-Pages=${questions.headers.get("x-total-pages")}`,
);

for (const status of ["Pending", "Answered"]) {
  const filtered = await call("GET", `/api/questions/get-questions?page=1&limit=5&status=${status}`);
  check(`  ?status=${status}`, filtered.status === 200, `HTTP ${filtered.status}`);
}

const searched = await call("GET", "/api/questions/get-questions?page=1&limit=5&search=زواج");
check("  ?search=…", searched.status === 200, `HTTP ${searched.status}`);

/* -- articles ------------------------------------------------------------- */
console.log("\nARTICLES");

const articles = await call("GET", "/api/articles/get-articles?page=1&limit=5");
check(
  "GET /api/articles/get-articles",
  articles.status === 200 && Array.isArray(articles.json?.articles),
  `count=${articles.json?.articles?.length} totalPages=${articles.json?.totalPages}`,
);

const firstId = articles.json?.articles?.[0]?._id;
if (firstId) {
  const one = await call("GET", `/api/articles/${firstId}`);
  check("GET /api/articles/{id}", one.status === 200 && one.json?._id === firstId);

  const views = await call("GET", `/api/articles/${firstId}/views`);
  check("GET /api/articles/{id}/views", views.status === 200, `views=${views.json?.views}`);
}

/* -- analytics ------------------------------------------------------------ */
console.log("\nANALYTICS");

const visit = await call("POST", "/api/analytics/visit");
check("POST /api/analytics/visit", visit.status === 204, `HTTP ${visit.status}`);

const visitors = await call("GET", "/api/analytics/visitors");
check(
  "GET /api/analytics/visitors",
  visitors.status === 200 && typeof visitors.json?.totalVisitors === "number",
  `total=${visitors.json?.totalVisitors} today=${visitors.json?.visitorsToday}`,
);

const searches = await call("GET", "/api/analytics/searches?top=10");
check(
  "GET /api/analytics/searches",
  searches.status === 200 && Array.isArray(searches.json?.topKeywords),
  `totalSearches=${searches.json?.totalSearches} noResults=${searches.json?.searchesWithNoResults}`,
);

const audit = await call("GET", "/api/analytics/audit-log?page=1&limit=5");
check("GET /api/analytics/audit-log", audit.status === 200, `HTTP ${audit.status}`);
console.log("\n  audit-log SHAPE (undocumented in Swagger — this is the ground truth):");
console.log(
  "  " + JSON.stringify(audit.json, null, 2).split("\n").slice(0, 22).join("\n  "),
);

// Discover the real AuditAction names by asking the server which ones it accepts.
console.log("\n  AuditAction names the server accepts:");
const candidates = [
  "Login",
  "LoginFailed",
  "Logout",
  "CreateArticle",
  "EditArticle",
  "DeleteArticle",
  "AnswerQuestion",
  "DeleteQuestion",
  "PublishArticle",
  "UpdateArticle",
];
const accepted = [];
for (const name of candidates) {
  const probe = await call("GET", `/api/analytics/audit-log?page=1&limit=1&action=${name}`);
  if (probe.status === 200) accepted.push(name);
}
console.log(`  accepted: ${accepted.join(", ") || "(none)"}`);
console.log(`  rejected: ${candidates.filter((n) => !accepted.includes(n)).join(", ") || "(none)"}`);

/* -- CRUD round-trip ------------------------------------------------------ */
if (WRITE) {
  console.log("\nCRUD ROUND-TRIP (writes to the live database)");

  const form = new FormData();
  form.append("title", `Verification article ${Date.now()}`);
  form.append("content", "Created by scripts/verify-api.mjs. Safe to delete.");

  const created = await call("POST", "/api/articles/make-article", { body: form });
  check("POST /api/articles/make-article", created.status === 201, `HTTP ${created.status}`);

  // The create response has no schema; find the article we just made.
  const after = await call("GET", "/api/articles/get-articles?page=1&limit=5");
  const mine = after.json?.articles?.find((a) => a.title.startsWith("Verification article"));

  if (mine) {
    const edit = new FormData();
    edit.append("title", `${mine.title} (edited)`);
    edit.append("content", "Edited by the verification script.");
    const updated = await call("PUT", `/api/articles/${mine._id}`, { body: edit });
    check("PUT /api/articles/{id}", updated.status === 200, `HTTP ${updated.status}`);

    const removed = await call("DELETE", `/api/articles/${mine._id}/delete-article`);
    check(
      "DELETE /api/articles/{id}/delete-article",
      removed.status === 200,
      `HTTP ${removed.status}`,
    );
  } else {
    check("  locate created article", false, "could not find it in the list");
  }

  // Questions: create is public; answer and delete are admin.
  const q = await call("POST", "/api/questions/create-question", {
    body: JSON.stringify({ name: "Verification", question: "Automated check. Safe to delete." }),
    headers: { "content-type": "application/json" },
  });
  check("POST /api/questions/create-question", q.status === 201, `HTTP ${q.status}`);

  const qid = q.json?._id;
  if (qid) {
    const answered = await call("POST", `/api/questions/${qid}/edit-response`, {
      body: JSON.stringify({ response: "Automated answer." }),
      headers: { "content-type": "application/json" },
    });
    check("POST /api/questions/{id}/edit-response", answered.status === 200, `HTTP ${answered.status}`);

    const deleted = await call("DELETE", `/api/questions/${qid}/delete-question`);
    check(
      "DELETE /api/questions/{id}/delete-question",
      deleted.status === 200,
      `HTTP ${deleted.status}`,
    );
  }
}

/* -- refresh + sign-out --------------------------------------------------- */
console.log("\nSESSION");

const refreshed = await call("POST", "/api/admin/refresh");
check("POST /api/admin/refresh", refreshed.status === 200, `HTTP ${refreshed.status}`);

const stillIn = await call("GET", "/api/admin/check-authentication");
check(
  "  → session survives refresh",
  stillIn.json?.isAuthenticated === true,
  JSON.stringify(stillIn.json),
);

const out = await call("POST", "/sign-out");
check("POST /sign-out", out.status === 200, `HTTP ${out.status}`);

const afterOut = await call("GET", "/api/dashboard/stats");
check("  → admin endpoints 401 after sign-out", afterOut.status === 401, `HTTP ${afterOut.status}`);

/* -- summary -------------------------------------------------------------- */
const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed.` +
    (failed.length ? ` FAILED: ${failed.map((f) => f.name).join(", ")}` : " All green.") +
    "\n",
);
process.exit(failed.length ? 1 : 0);
