import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next 16 renamed this file convention from `middleware` to `proxy`; the
// next-intl factory is still exported under its original name.
export default createMiddleware(routing);

export const config = {
  // Everything except Next internals, the model files served from /models,
  // and anything with a file extension. A request with no locale segment —
  // including a bookmark from v2 such as /tool/chunks — lands here and is
  // redirected to the same page in the default locale (FR-057).
  matcher: "/((?!api|_next|_vercel|models|.*\\..*).*)",
};
