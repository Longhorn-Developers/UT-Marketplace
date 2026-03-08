type AccessRules = {
  publicExact: string[];
  publicPrefixes: string[];
  protectedExact: string[];
  protectedPrefixes: string[];
  adminPrefixes: string[];
  protectedApiPrefixes: string[];
};

export const accessRules: AccessRules = {
  publicExact: ["/", "/browse", "/terms", "/privacy"],
  publicPrefixes: ["/auth", "/listing", "/profile/"],
  protectedExact: ["/profile"],
  protectedPrefixes: ["/create", "/my-listings", "/messages", "/favorites", "/settings"],
  adminPrefixes: ["/admin"],
  protectedApiPrefixes: ["/api/user-settings"],
};

const matchExact = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path);

const matchPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

export const isPublicPath = (pathname: string) =>
  matchExact(pathname, accessRules.publicExact) || matchPrefix(pathname, accessRules.publicPrefixes);

export const isProtectedPath = (pathname: string) =>
  matchExact(pathname, accessRules.protectedExact) || matchPrefix(pathname, accessRules.protectedPrefixes);

export const isAdminPath = (pathname: string) => matchPrefix(pathname, accessRules.adminPrefixes);

export const isProtectedApiPath = (pathname: string) =>
  matchPrefix(pathname, accessRules.protectedApiPrefixes);

export const requiresAuth = (pathname: string) =>
  isProtectedPath(pathname) || isAdminPath(pathname) || isProtectedApiPath(pathname);
