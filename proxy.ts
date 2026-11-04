import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes are derived from the existing Clerk env vars.
const isPublicRoute = createRouteMatcher([
  `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}(.*)`,
  `${process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"}(.*)`,
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // API routes enforce auth themselves so they can return 401 JSON
  // (auth.protect() would answer unauthenticated API calls with a 404).
  if (!isPublicRoute(req) && !isApiRoute(req)) {
    await auth.protect();
  }
});

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
