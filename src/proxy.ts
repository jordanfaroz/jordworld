import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getVisibleProjects } from "@/content/projects";

// Cache Components makes /projects/[slug] return 200 for a slug outside
// generateStaticParams instead of letting notFound() produce a real 404 (next
// build + next start, verified: curl -I /projects/<made-up-slug> comes back
// 200). This proxy derives the valid set directly from the content model
// (never a hardcoded list, which would drift from projects.ts) and 404s
// before the page ever renders.
const validSlugs = new Set(getVisibleProjects().map((p) => p.slug));

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !validSlugs.has(slug)) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/projects/:path*",
};
