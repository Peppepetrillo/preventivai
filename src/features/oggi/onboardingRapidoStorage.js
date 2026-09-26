/** Pref locale (non APP_DATA_KEYS / non sync). */
export const ONBOARDING_RAPIDO_KEY = "preventivai:onboarding-rapido-v1";

export function leggiOnboardingCompletato() {
  try {
    const v = localStorage.getItem(ONBOARDING_RAPIDO_KEY);
    return v === "done" || v === "skipped";
  } catch {
    return true;
  }
}

export function marcaOnboarding(stato) {
  try {
    localStorage.setItem(ONBOARDING_RAPIDO_KEY, stato);
  } catch {
    /* ignore quota */
  }
}
