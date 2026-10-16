export const config = {
  matcher: "/",
};

export default function middleware(request) {
  const host = (request.headers.get("host") || "").split(":")[0];
  if (host !== "blackinfinita.devemdobro.com") {
    return new Response(null, { headers: { "x-middleware-next": "1" } });
  }

  return new Response(null, {
    headers: { "x-middleware-rewrite": "/v2/index.html" },
  });
}
