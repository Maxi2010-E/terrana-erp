import path from "node:path";

import { terranaColors } from "@/lib/theme";

/** Public URL for the official Terrana Africa Ltd logo */
export const TERRANA_LOGO_URL = "/terrana-africa-logo.png";

/** Absolute path for server-side PDF embedding */
export const TERRANA_LOGO_PATH = path.join(
  process.cwd(),
  "public",
  "terrana-africa-logo.png",
);

export const terranaBrand = {
  ...terranaColors,
  /** Logo aspect ratio (404×200 source asset) */
  logoAspectRatio: 404 / 200,
} as const;
