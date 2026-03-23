const ALLOWED_UT_AUSTIN_EMAIL_DOMAINS = ["utexas.edu", "my.utexas.edu"] as const;

export const UT_AUSTIN_EMAIL_DOMAIN_LABEL = "@utexas.edu or @my.utexas.edu";
export const UT_AUSTIN_EMAIL_ERROR_MESSAGE = `Please use your UT Austin email (${UT_AUSTIN_EMAIL_DOMAIN_LABEL})`;

export const isAllowedUtAustinEmail = (email: string): boolean => {
  const normalizedEmail = email.trim().toLowerCase();
  return ALLOWED_UT_AUSTIN_EMAIL_DOMAINS.some((domain) => normalizedEmail.endsWith(`@${domain}`));
};
