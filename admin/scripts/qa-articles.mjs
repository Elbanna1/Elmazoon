/**
 * Article lifecycle QA against the live API, through the BFF.
 *
 * Written in Node rather than shell: the Windows console mangles Arabic on its
 * way through bash, which silently turns a title lookup into `undefined` and
 * makes a passing API look broken. Everything here stays in UTF-8.
 *
 *   node scripts/qa-articles.mjs
 */
import { Blob } from "node:buffer";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const BFF = `${BASE}/bff`;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}

let jar = "";
function remember(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const pair = c.split(";")[0];
    const name = pair.split("=")[0];
    jar = [
      ...jar.split("; ").filter(Boolean).filter((x) => x.split("=")[0] !== name),
      pair,
    ].join("; ");
  }
}

async function call(method, path, { body, json } = {}) {
  const headers = { ...(jar ? { cookie: jar } : {}) };
  if (json) headers["content-type"] = "application/json";
  const res = await fetch(`${BFF}${path}`, { method, headers, body: json ? JSON.stringify(json) : body });
  remember(res);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, data, text };
}

const results = [];
const check = (name, ok, note = "") => {
  results.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${note ? `  — ${note}` : ""}`);
};

const listArticles = async () =>
  (await call("GET", "/api/articles/get-articles?page=1&limit=50")).data?.articles ?? [];

// A real 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function form({ title, content, image, removeImage }) {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("content", content);
  if (image) fd.append("image", new Blob([image], { type: "image/png" }), "test.png");
  if (removeImage) fd.append("removeImage", "true");
  return fd;
}

const TAG = `QA-${Date.now()}`;
const BODY = "محتوى تحقق آلي. يمكن حذفه بأمان. نص كافٍ لتجاوز الحد الأدنى للطول.";

console.log(`\nArticle lifecycle QA against ${BASE}\n`);

const login = await call("POST", "/api/admin/login", { json: { email: EMAIL, password: PASSWORD } });
check("login", login.status === 200, `HTTP ${login.status}`);
if (login.status !== 200) process.exit(1);

/* -- create without image ------------------------------------------------- */
const noImgTitle = `${TAG} بدون صورة`;
const a1 = await call("POST", "/api/articles/make-article", {
  body: form({ title: noImgTitle, content: BODY }),
});
check("create article WITHOUT image", a1.status === 201, `HTTP ${a1.status}`);

/* -- create with image ---------------------------------------------------- */
const imgTitle = `${TAG} بصورة`;
const a2 = await call("POST", "/api/articles/make-article", {
  body: form({ title: imgTitle, content: BODY, image: PNG }),
});
check("create article WITH image", a2.status === 201, `HTTP ${a2.status}`);

let all = await listArticles();
const noImg = all.find((a) => a.title === noImgTitle);
const withImg = all.find((a) => a.title === imgTitle);

check("  → image-less article has image=null", noImg?.image === null, `image=${JSON.stringify(noImg?.image)}`);
check("  → image-less article has imageUrl=null", noImg?.imageUrl === null, `imageUrl=${JSON.stringify(noImg?.imageUrl)}`);
check("  → uploaded article has an imageUrl", Boolean(withImg?.imageUrl), withImg?.imageUrl ?? "(none)");

/* -- the uploaded image must actually serve ------------------------------- */
if (withImg?.imageUrl) {
  const img = await fetch(withImg.imageUrl);
  const type = img.headers.get("content-type") ?? "";
  check(
    "  → uploaded image serves real bytes",
    img.status === 200 && type.startsWith("image/"),
    `HTTP ${img.status} ${type}`,
  );
}

/* -- edit title/content, image must survive ------------------------------- */
if (withImg) {
  const edited = `${imgTitle} (معدَّلة)`;
  const e = await call("PUT", `/api/articles/${withImg._id}`, {
    body: form({ title: edited, content: `${BODY} تم التعديل.` }),
  });
  check("edit title + content", e.status === 200, `HTTP ${e.status}`);

  all = await listArticles();
  const after = all.find((a) => a._id === withImg._id);
  check("  → title updated", after?.title === edited, after?.title);
  check("  → image survived the edit", Boolean(after?.image), `image=${JSON.stringify(after?.image)}`);

  /* -- remove the image --------------------------------------------------- */
  const r = await call("PUT", `/api/articles/${withImg._id}`, {
    body: form({ title: edited, content: `${BODY} تم التعديل.`, removeImage: true }),
  });
  check("remove the image (removeImage=true)", r.status === 200, `HTTP ${r.status}`);

  all = await listArticles();
  const cleared = all.find((a) => a._id === withImg._id);
  check("  → image is now null", cleared?.image === null, `image=${JSON.stringify(cleared?.image)}`);
  check("  → imageUrl is now null", cleared?.imageUrl === null, `imageUrl=${JSON.stringify(cleared?.imageUrl)}`);
}

/* -- cleanup: delete everything this run created -------------------------- */
all = await listArticles();
for (const a of all.filter((x) => x.title.startsWith(TAG))) {
  const d = await call("DELETE", `/api/articles/${a._id}/delete-article`);
  check(`cleanup: delete «${a.title}»`, d.status === 200, `HTTP ${d.status}`);
}

const left = (await listArticles()).filter((a) => a.title.startsWith(TAG));
check("cleanup: no test articles remain", left.length === 0, `${left.length} left`);

/* -- summary -------------------------------------------------------------- */
const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} passed.` +
    (failed.length ? ` FAILED: ${failed.map((f) => f.name).join(", ")}` : " All green.") +
    "\n",
);
process.exit(failed.length ? 1 : 0);
