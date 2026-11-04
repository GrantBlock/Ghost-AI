import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes are derived from the existing Clerk env vars.
const isPublicRoute = createRouteMatcher([
  `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}(.*)`,
  `${process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"}(.*)`,
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
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
