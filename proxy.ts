import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The auth pages are mounted at fixed routes (app/sign-in, app/sign-up), so the
// public matcher uses the same literal paths. Keep NEXT_PUBLIC_CLERK_SIGN_IN_URL
// and NEXT_PUBLIC_CLERK_SIGN_UP_URL set to /sign-in and /sign-up.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

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
