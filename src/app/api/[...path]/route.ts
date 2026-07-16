import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TARGET = (process.env.API_PROXY_TARGET || "http://localhost:3001").replace(
  /\/$/,
  "",
);

type RouteCtx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const { path } = await ctx.params;
  const upstreamUrl = `${TARGET}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, init);
  } catch {
    return NextResponse.json(
      { message: "API no disponible. Revisa API_PROXY_TARGET." },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  const passThrough = ["content-type", "cache-control"];
  for (const name of passThrough) {
    const value = upstream.headers.get(name);
    if (value) outHeaders.set(name, value);
  }

  const body = await upstream.arrayBuffer();
  const res = new NextResponse(body, {
    status: upstream.status,
    headers: outHeaders,
  });

  // Rewrite Set-Cookie onto the FE host (first-party). Critical for iOS Chrome/Safari.
  const rawCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : (() => {
          const single = upstream.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  for (const raw of rawCookies) {
    const cleaned = raw
      .replace(/;\s*Domain=[^;]*/gi, "")
      .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
      .replace(/;\s*Partitioned/gi, "");
    res.headers.append("set-cookie", cleaned);
  }

  return res;
}

export function GET(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
export function POST(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
export function PUT(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
export function PATCH(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
export function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
export function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx);
}
