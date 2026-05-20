import { adminPages } from "../../../src/generated/admin-page-content";

const ADMIN_UX_STYLESHEET = '<link rel="stylesheet" href="/admin/assets/css/admin-ux-polish.css?v=20260520-ux">';

function normalizeAdminKey(segments = []) {
  const normalizedSegments = segments
    .map((segment) => String(segment || "").replace(/\.html$/i, ""))
    .filter(Boolean);

  if (normalizedSegments.at(-1) === "index") normalizedSegments.pop();

  return normalizedSegments.join("/");
}

function addBodyClass(html) {
  return html.replace(/<body([^>]*)>/i, (match, attributes = "") => {
    const classMatch = attributes.match(/\sclass=(["'])(.*?)\1/i);
    if (!classMatch) return `<body${attributes} class="admin-enhanced admin-next-shell">`;

    const classes = new Set(classMatch[2].split(/\s+/).filter(Boolean));
    classes.add("admin-enhanced");
    classes.add("admin-next-shell");
    return match.replace(classMatch[0], ` class=${classMatch[1]}${Array.from(classes).join(" ")}${classMatch[1]}`);
  });
}

function addUxStylesheet(html) {
  if (html.includes("/admin/assets/css/admin-ux-polish.css")) return html;
  if (html.includes("/admin/assets/css/admin.css")) {
    return html.replace(/(<link[^>]+href=(["'])\/admin\/assets\/css\/admin\.css\2[^>]*>)/i, `$1\n  ${ADMIN_UX_STYLESHEET}`);
  }
  return html.replace(/<\/head>/i, `  ${ADMIN_UX_STYLESHEET}\n</head>`);
}

function enhanceAdminHtml(html) {
  return addBodyClass(addUxStylesheet(html));
}

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const key = normalizeAdminKey(resolvedParams?.path);
  const html = adminPages[key];

  if (!html) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  return new Response(enhanceAdminHtml(html), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
