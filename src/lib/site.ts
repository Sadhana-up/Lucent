export const SITE_NAME = "Lucent";
export const SITE_TITLE = "Lucent — AI Skincare Advisor";
export const SITE_DESCRIPTION =
  "Your skin, finally understood. AI-powered skincare analysis, personalized routines, and curated products — all in one place.";
export const SITE_KEYWORDS = [
  "skincare",
  "AI skincare",
  "skin analysis",
  "personalized skincare routine",
  "dermatologist",
  "beauty",
];

export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      // fall through to defaults
    }
  }

  const authUrl = process.env.BETTER_AUTH_URL;
  if (authUrl && !/localhost|127\.0\.0\.1/.test(authUrl)) {
    try {
      return new URL(authUrl);
    } catch {
      // fall through to default
    }
  }

  return new URL("https://lucent.app");
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, getSiteUrl()).toString();
}
