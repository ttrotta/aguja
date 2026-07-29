import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link and the navigation hooks: they keep
// the current locale without every call site having to prefix a path by hand.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
