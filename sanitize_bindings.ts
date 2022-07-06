import { sanitize as sanitize_ffi } from "./bindings/bindings.ts";
import truncate from "https://esm.sh/truncate-utf8-bytes";

export function sanitize_bindings(
  a0: string,
  options?: { replacement?: string },
): string {
  return truncate(
    sanitize_ffi(a0, (options && options.replacement) || ""),
    255,
  );
}
