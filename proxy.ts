import { clerkMiddleware } from "@clerk/nextjs/server";

// Keep the proxy bare: it only attaches Clerk auth state to each request.
// Route protection happens at the resource instead of by URL path matching:
//   - pages call getCurrentIdentity() / auth.protect() (see app/editor, lib/project-data.ts)
//   - API routes check auth themselves so they can return 401 JSON
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
