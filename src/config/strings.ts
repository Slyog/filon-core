import { en } from "@/i18n/en";
import { de } from "@/i18n/de";

// Language toggle: switch between 'en' and 'de'
// TODO: Connect to user settings/preferences store
const currentLang: "en" | "de" = "en";

export const t = currentLang === "de" ? de : en;
