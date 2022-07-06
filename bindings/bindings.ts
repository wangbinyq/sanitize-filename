// Auto-generated with deno_bindgen
import { CachePolicy, prepare } from "https://deno.land/x/plug@0.5.1/plug.ts";
function encode(v: string | Uint8Array): Uint8Array {
  if (typeof v !== "string") return v;
  return new TextEncoder().encode(v);
}
function decode(v: Uint8Array): string {
  return new TextDecoder().decode(v);
}
function readPointer(v: any): Uint8Array {
  //@ts-ignore
  const ptr = new Deno.UnsafePointerView(v as Deno.UnsafePointer);
  const lengthBe = new Uint8Array(4);
  const view = new DataView(lengthBe.buffer);
  ptr.copyInto(lengthBe, 0);
  const buf = new Uint8Array(view.getUint32(0));
  ptr.copyInto(buf, 4);
  return buf;
}
const opts = {
  name: "snaitize",
  url: (new URL("../target/release", import.meta.url)).toString(),
  policy: CachePolicy.NONE,
};
const _lib = await prepare(opts, {
  sanitize: {
    parameters: ["pointer", "usize", "pointer", "usize"],
    result: "pointer",
    nonblocking: false,
  },
});

export function sanitize(a0: string, a1: string) {
  const a0_buf = encode(a0);
  const a1_buf = encode(a1);
  let rawResult = _lib.symbols.sanitize(
    a0_buf,
    a0_buf.byteLength,
    a1_buf,
    a1_buf.byteLength,
  );
  const result = readPointer(rawResult);
  return decode(result);
}
