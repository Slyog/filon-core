import { en } from "./en";

export const de = {
  ...Object.fromEntries(
    Object.entries(en).map(([k]) => [k, `[DE] ${en[k as keyof typeof en]}`])
  ),
};
