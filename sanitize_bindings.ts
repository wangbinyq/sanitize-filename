import { instantiate } from "./lib/rs_lib.generated.js";
import truncate from "https://esm.sh/truncate-utf8-bytes";

const { sanitize } = await instantiate();

export function sanitize_bindings(
  a0: string,
  options?: { replacement?: string },
): string {
  return truncate(
    sanitize(a0, (options && options.replacement) || ""),
    255,
  );
}
