/**
 * Exercises every endpoint the product uses, against the live backend, and
 * cleans up everything it creates.
 *
 * Public reads/writes go through the site's own BFF proxy (`/api/bff/...`) —
 * which is the exact path a real visitor's browser now takes. Admin calls go
 * direct, because the admin application is not present in this repo any more.
 */
const SITE = process.env.SITE_URL ?? "http://localhost:3000";
const BFF = `${SITE}/api/bff`;
const API = process.env.API_URL ?? "https://elmazoon.runasp.net";
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@almaazoon.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe!2026";

let adminJar = "";
let visitorJar = "";

function absorb(res, which) {
  let jar = which === "admin" ? adminJar : visitorJar;
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const pair = c.split(";")[0];
    const name = pair.split("=")[0];
    jar = [...jar.split("; ").filter(Boolean).filter((x) => x.split("=")[0] !== name), pair].join("; ");
  }
  if (which === "admin") adminJar = jar;
  else visitorJar = jar;
}

async function call(base, method, path, { json, body, as = "visitor" } = {}) {
  const jar = as === "admin" ? adminJar : visitorJar;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(jar ? { cookie: jar } : {}),
      ...(json ? { "content-type": "application/json; charset=utf-8" } : {}),
    },
    body: json ? JSON.stringify(json) : body,
  });
  absorb(res, as);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, data, headers: res.headers };
}

const rows = [];
const check = (group, name, ok, note = "") => {
  rows.push({ group, name, ok, note });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name.padEnd(46)} ${note}`);
};

const created = { questions: [], comments: [], articles: [] };

console.log(`\nAPI matrix — public via ${BFF}, admin direct via ${API}\n`);

/* -- AUTH ----------------------------------------------------------------- */
console.log("AUTHENTICATION");
let r = await call(API, "POST", "/api/admin/login", { json: { email: EMAIL, password: PASSWORD }, as: "admin" });
check("auth", "POST /api/admin/login", r.status === 200, `HTTP ${r.status}`);

r = await call(API, "GET", "/api/admin/check-authentication", { as: "admin" });
check("auth", "GET /api/admin/check-authentication", r.status === 200 && r.data?.isAdmin === true, JSON.stringify(r.data));

/* -- QUESTIONS ------------------------------------------------------------ */
console.log("\nQUESTIONS");
r = await call(BFF, "GET", "/api/questions/get-questions?page=1&limit=5");
check("questions", "GET /api/questions/get-questions", r.status === 200 && Array.isArray(r.data?.data),
  `count=${r.data?.data?.length} X-Total-Count=${r.headers.get("x-total-count")}`);

r = await call(BFF, "GET", "/api/questions/my");
check("questions", "GET /api/questions/my", r.status === 200, `total=${r.data?.total}`);

r = await call(BFF, "POST", "/api/questions/create-question", {
  json: { name: "فحص آلي", question: "سؤال تحقق آلي من مصفوفة الـ API. يمكن حذفه." },
});
const qid = (r.data?.data ?? r.data)?._id;
if (qid) created.questions.push(qid);
check("questions", "POST /api/questions/create-question", r.status === 201 && Boolean(qid), `HTTP ${r.status} id=${qid ?? "none"}`);

if (qid) {
  r = await call(API, "POST", `/api/questions/${qid}/edit-response`, { json: { response: "رد تحقق آلي." }, as: "admin" });
  check("questions", "POST /api/questions/{id}/edit-response", r.status === 200, `HTTP ${r.status}`);
}

/* -- ARTICLES ------------------------------------------------------------- */
console.log("\nARTICLES");
r = await call(BFF, "GET", "/api/articles/get-articles?page=1&limit=5");
const articles = r.data?.articles ?? [];
check("articles", "GET /api/articles/get-articles", r.status === 200 && Array.isArray(articles), `count=${articles.length}`);

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const fd = new FormData();
fd.append("title", `QA-matrix ${Date.now()}`);
fd.append("content", "مقالة تحقق آلي. يمكن حذفها بأمان. نص كافٍ لتجاوز الحد الأدنى للطول.");
fd.append("image", new Blob([PNG], { type: "image/png" }), "t.png");
r = await call(API, "POST", "/api/articles/make-article", { body: fd, as: "admin" });
check("articles", "POST /api/articles/make-article", r.status === 201, `HTTP ${r.status}`);

let list = (await call(BFF, "GET", "/api/articles/get-articles?page=1&limit=50")).data?.articles ?? [];
const mine = list.find((a) => a.title.startsWith("QA-matrix"));
if (mine) created.articles.push(mine._id);
check("articles", "  → appears in the list", Boolean(mine), mine?.title ?? "not found");
check("articles", "  → imageUrl is absolute + public", Boolean(mine?.imageUrl?.startsWith("http")), mine?.imageUrl ?? "none");

if (mine?.imageUrl) {
  const img = await fetch(mine.imageUrl);
  check("articles", "  → uploaded image serves bytes", img.status === 200 && (img.headers.get("content-type") ?? "").startsWith("image/"),
    `HTTP ${img.status} ${img.headers.get("content-type")}`);
}

if (mine) {
  r = await call(BFF, "GET", `/api/articles/${mine._id}`);
  check("articles", "GET /api/articles/{id}", r.status === 200 && r.data?._id === mine._id, `HTTP ${r.status}`);

  const edit = new FormData();
  edit.append("title", `${mine.title} (معدّلة)`);
  edit.append("content", "محتوى معدّل للتحقق. نص كافٍ.");
  r = await call(API, "PUT", `/api/articles/${mine._id}`, { body: edit, as: "admin" });
  check("articles", "PUT /api/articles/{id}", r.status === 200, `HTTP ${r.status}`);

  r = await call(BFF, "POST", `/api/articles/${mine._id}/view`);
  check("articles", "POST /api/articles/{id}/view", r.status === 200, `views=${r.data?.views} counted=${r.data?.counted}`);

  r = await call(BFF, "GET", `/api/articles/${mine._id}/views`);
  check("articles", "GET /api/articles/{id}/views", r.status === 200, `views=${r.data?.views}`);
}

/* -- COMMENTS ------------------------------------------------------------- */
console.log("\nCOMMENTS");
const target = mine ?? articles[0];
if (target) {
  r = await call(BFF, "POST", `/api/articles/${target._id}/comments`, {
    json: { name: "فحص آلي", comment: "تعليق تحقق آلي. يمكن حذفه." },
  });
  const cid = r.data?._id;
  if (cid) created.comments.push(cid);
  check("comments", "POST /api/articles/{id}/comments", r.status === 201 && Boolean(cid), `HTTP ${r.status}`);

  r = await call(BFF, "GET", `/api/articles/${target._id}/comments`);
  const visible = (r.data ?? []).some((c) => c._id === cid);
  check("comments", "GET /api/articles/{id}/comments", r.status === 200, `count=${r.data?.length}`);
  check("comments", "  → comment appears IMMEDIATELY", visible, visible ? "no approval gate" : "NOT VISIBLE");

  // A reply from a visitor (nested under the parent).
  r = await call(BFF, "POST", `/api/articles/${target._id}/comments`, {
    json: { name: "فحص آلي", comment: "رد زائر للتحقق. يمكن حذفه.", parentCommentId: cid },
  });
  if (r.data?._id) created.comments.push(r.data._id);
  check("comments", "  → visitor reply (parentCommentId)", r.status === 201, `HTTP ${r.status}`);

  if (cid) {
    r = await call(API, "POST", `/api/articles/comments/${cid}/reply`, { json: { reply: "رد المأذون للتحقق." }, as: "admin" });
    check("comments", "POST /api/articles/comments/{id}/reply", r.status === 200, `HTTP ${r.status}`);

    r = await call(BFF, "GET", `/api/articles/${target._id}/comments`);
    const withReply = (r.data ?? []).find((c) => c._id === cid);
    check("comments", "  → admin reply visible publicly", Boolean(withReply?.adminReply), withReply?.adminReply ?? "none");
  }
}

/* -- DASHBOARD ------------------------------------------------------------ */
console.log("\nDASHBOARD");
for (const [path, probe] of [
  ["/api/dashboard/stats", (d) => typeof d?.totalQuestions === "number"],
  ["/api/dashboard/analytics", (d) => typeof d?.totalArticleViews === "number"],
  ["/api/dashboard/overview?recentCount=5", (d) => typeof d?.questions?.total === "number"],
  ["/api/dashboard/charts?days=30&months=12", (d) => Array.isArray(d?.visitorsPerDay)],
  ["/api/dashboard/comments?page=1&limit=5", (d) => Array.isArray(d?.data)],
]) {
  r = await call(API, "GET", path, { as: "admin" });
  check("dashboard", `GET ${path.split("?")[0]}`, r.status === 200 && probe(r.data), `HTTP ${r.status}`);
}

/* -- NOTIFICATIONS -------------------------------------------------------- */
console.log("\nNOTIFICATIONS");
r = await call(API, "GET", "/api/notifications?take=10", { as: "admin" });
check("notifications", "GET /api/notifications", r.status === 200, `unread=${r.data?.unreadCount}`);

r = await call(BFF, "GET", "/api/notifications/my");
check("notifications", "GET /api/notifications/my", r.status === 200, `unread=${r.data?.unreadCount}`);

r = await call(API, "POST", "/api/notifications/read", { as: "admin" });
check("notifications", "POST /api/notifications/read", r.status === 200, `HTTP ${r.status}`);

r = await call(BFF, "POST", "/api/notifications/my/read");
check("notifications", "POST /api/notifications/my/read", r.status === 200, `HTTP ${r.status}`);

/* -- ANALYTICS ------------------------------------------------------------ */
console.log("\nANALYTICS");
r = await call(BFF, "POST", "/api/analytics/visit");
check("analytics", "POST /api/analytics/visit", r.status === 204, `HTTP ${r.status}`);

for (const [path, probe] of [
  ["/api/analytics/visitors", (d) => typeof d?.totalVisitors === "number"],
  ["/api/analytics/searches?top=10", (d) => Array.isArray(d?.topKeywords)],
  ["/api/analytics/audit-log?page=1&limit=5", (d) => Boolean(d)],
]) {
  r = await call(API, "GET", path, { as: "admin" });
  check("analytics", `GET ${path.split("?")[0]}`, r.status === 200 && probe(r.data), `HTTP ${r.status}`);
}

/* -- SESSION -------------------------------------------------------------- */
console.log("\nSESSION");
r = await call(API, "POST", "/api/admin/refresh", { as: "admin" });
check("auth", "POST /api/admin/refresh", r.status === 200, `HTTP ${r.status}`);

/* -- CLEANUP -------------------------------------------------------------- */
console.log("\nCLEANUP");
for (const id of created.comments) {
  r = await call(API, "DELETE", `/api/articles/comments/${id}`, { as: "admin" });
  check("cleanup", "DELETE /api/articles/comments/{id}", r.status === 200, `HTTP ${r.status}`);
}
for (const id of created.questions) {
  r = await call(API, "DELETE", `/api/questions/${id}/delete-question`, { as: "admin" });
  check("cleanup", "DELETE /api/questions/{id}/delete-question", r.status === 200, `HTTP ${r.status}`);
}
for (const id of created.articles) {
  r = await call(API, "DELETE", `/api/articles/${id}/delete-article`, { as: "admin" });
  check("cleanup", "DELETE /api/articles/{id}/delete-article", r.status === 200, `HTTP ${r.status}`);
}

r = await call(API, "POST", "/sign-out", { as: "admin" });
check("auth", "POST /sign-out", r.status === 200, `HTTP ${r.status}`);

const left = ((await call(BFF, "GET", "/api/articles/get-articles?page=1&limit=50")).data?.articles ?? [])
  .filter((a) => a.title.startsWith("QA-matrix"));
check("cleanup", "no test articles remain", left.length === 0, `${left.length} left`);

/* -- SUMMARY -------------------------------------------------------------- */
const failed = rows.filter((x) => !x.ok);
console.log(`\n${rows.length - failed.length}/${rows.length} passed.`);
if (failed.length) {
  console.log("FAILED:");
  for (const f of failed) console.log(`  - [${f.group}] ${f.name}  ${f.note}`);
}
console.log();
process.exit(failed.length ? 1 : 0);
