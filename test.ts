import * as path from "https://deno.land/std@0.146.0/path/mod.ts";
import * as t from "https://deno.land/std@0.146.0/testing/asserts.ts";
import { default as sanitize } from "./mod.ts";

function repeat(string: string, times: number): string {
  return new Array(times + 1).join(string);
}

const REPLACEMENT_OPTS = {
  replacement: "_",
};

Deno.test("valid names", function () {
  ["the quick brown fox jumped over the lazy dog.mp3", "résumé"].forEach(
    function (name) {
      t.equal(sanitize(name), name);
    },
  );
});

Deno.test("valid names", function () {
  ["valid name.mp3", "résumé"].forEach(function (name) {
    t.equal(sanitize(name, REPLACEMENT_OPTS), name);
  });
});

Deno.test("null character", function () {
  t.equal(sanitize("hello\u0000world"), "helloworld");
});

Deno.test("null character", function () {
  t.equal(sanitize("hello\u0000world", REPLACEMENT_OPTS), "hello_world");
});

Deno.test("control characters", function () {
  t.equal(sanitize("hello\nworld"), "helloworld");
});

Deno.test("control characters", function () {
  t.equal(sanitize("hello\nworld", REPLACEMENT_OPTS), "hello_world");
});

Deno.test("restricted codes", function () {
  ["h?w", "h/w", "h*w"].forEach(function (name) {
    t.equal(sanitize(name), "hw");
  });
});

Deno.test("restricted codes", function () {
  ["h?w", "h/w", "h*w"].forEach(function (name) {
    t.equal(sanitize(name, REPLACEMENT_OPTS), "h_w");
  });
});

// https://msdn.microsoft.com/en-us/library/aa365247(v=vs.85).aspx
Deno.test("restricted suffixes", function () {
  ["mr.", "mr..", "mr ", "mr  "].forEach(function (name) {
    t.equal(sanitize(name), "mr");
  });
});

Deno.test("relative paths", function () {
  [".", "..", "./", "../", "/..", "/../", "*.|."].forEach(function (name) {
    t.equal(sanitize(name), "");
  });
});

Deno.test("relative path with replacement", function () {
  t.equal(sanitize("..", REPLACEMENT_OPTS), "_");
});

Deno.test("reserved filename in Windows", function () {
  t.equal(sanitize("con"), "");
  t.equal(sanitize("COM1"), "");
  t.equal(sanitize("PRN."), "");
  t.equal(sanitize("aux.txt"), "");
  t.equal(sanitize("LPT9.asdfasdf"), "");
  t.equal(sanitize("LPT10.txt"), "LPT10.txt");
});

Deno.test("reserved filename in Windows with replacement", function () {
  t.equal(sanitize("con", REPLACEMENT_OPTS), "_");
  t.equal(sanitize("COM1", REPLACEMENT_OPTS), "_");
  t.equal(sanitize("PRN.", REPLACEMENT_OPTS), "_");
  t.equal(sanitize("aux.txt", REPLACEMENT_OPTS), "_");
  t.equal(sanitize("LPT9.asdfasdf", REPLACEMENT_OPTS), "_");
  t.equal(sanitize("LPT10.txt", REPLACEMENT_OPTS), "LPT10.txt");
});

Deno.test("invalid replacement", function () {
  t.equal(sanitize(".", { replacement: "." }), "");
  t.equal(sanitize("foo?.txt", { replacement: ">" }), "foo.txt");
  t.equal(sanitize("con.txt", { replacement: "aux" }), "");
  t.equal(sanitize("valid.txt", { replacement: '\/:*?"<>|' }), "valid.txt");
});

Deno.test("255 characters max", function () {
  const string = repeat("a", 300);
  t.assert(string.length > 255);
  t.assert(sanitize(string).length <= 255);
});

// Test the handling of non-BMP chars in UTF-8
//

Deno.test("non-bmp SADDLES the limit", function () {
  const str25x = repeat("a", 252),
    name = str25x + "\uD800\uDC00";
  t.equal(sanitize(name), str25x);
});

Deno.test("non-bmp JUST WITHIN the limit", function () {
  const str25x = repeat("a", 251),
    name = str25x + "\uD800\uDC00";
  t.equal(sanitize(name), name);
});

Deno.test("non-bmp JUST OUTSIDE the limit", function () {
  const str25x = repeat("a", 253),
    name = str25x + "\uD800\uDC00";
  t.equal(sanitize(name), str25x);
});

// Test invalid input
// As deno use typescript, we don't need this test

// Deno.test("invalid input", function () {
//   t.assertThrows(
//     function () {
//       sanitize();
//     },
//     null,
//     "no arguments",
//   );

//   [
//     undefined,
//     null,
//     false,
//     true,
//     {},
//     {
//       replace: function () {
//         return "foo";
//       },
//       toString: function () {
//         return "bar";
//       },
//     },
//     [],
//     new Buffer("asdf"),
//   ].forEach(function (input) {
//     t.throws(
//       function () {
//         sanitize(input);
//       },
//       null,
//       JSON.stringify(input),
//     );
//   });
// });
const blnsTxt = await Deno.readTextFile(
  "./vendor/big-list-of-naughty-strings/blns.json",
);
const blns = JSON.parse(blnsTxt) as string[];
const tempdir = await Deno.makeTempDir({
  prefix: "sanitize-filename-test-XXXXXX",
});
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

async function testStringUsingFS(str: string) {
  const sanitized = sanitize(str) || "default";
  const filepath = path.join(tempdir, sanitized);

  // Should not contain any directories or relative paths
  t.equal(
    path.dirname(path.resolve("/abs/path", sanitized)),
    path.resolve("/abs/path"),
  );

  // Should be max 255 bytes
  t.assert(textEncoder.encode(sanitized).byteLength <= 255, "max 255 bytes");

  // Should write and read file to disk
  t.equal(path.dirname(path.normalize(filepath)), tempdir);

  try {
    await Deno.writeFile(filepath, textEncoder.encode("foobar"));
  } catch (err) {
    t.assertIsError(err, undefined, "write", "no error writing file");
  }

  let data;
  try {
    data = await Deno.readFile(filepath);
  } catch (err) {
    t.assertIsError(err, undefined, "read", "no error reading file");
  }

  t.assertEquals(textDecoder.decode(data), "foobar", "file contents equals");

  try {
    await Deno.remove(filepath);
  } catch (err) {
    t.assertIsError(err, undefined, "remove", "no error removing file");
  }
}

[
  repeat("a", 300),
  "the quick brown fox jumped over the lazy dog",
  "résumé",
  "hello\u0000world",
  "hello\nworld",
  "semi;colon.js",
  ";leading-semi.js",
  "slash\\.js",
  "slash/.js",
  "col:on.js",
  "star*.js",
  "question?.js",
  'quote".js',
  "singlequote'.js",
  "brack<e>ts.js",
  "p|pes.js",
  "plus+.js",
  "'five and six<seven'.js",
  " space at front",
  "space at end ",
  ".period",
  "period.",
  "relative/path/to/some/dir",
  "/abs/path/to/some/dir",
  "~/.\u0000notssh/authorized_keys",
  "",
  "h?w",
  "h/w",
  "h*w",
  ".",
  "..",
  "./",
  "../",
  "/..",
  "/../",
  "*.|.",
  "./",
  "./foobar",
  "../foobar",
  "../../foobar",
  "./././foobar",
  "|*.what",
  "LPT9.asdf",
  ...blns,
].forEach(function (str) {
  Deno.test(JSON.stringify(str), async function () {
    await testStringUsingFS(str);
  });
});

Deno.test("remove temp directory", async function () {
  try {
    await Deno.remove(tempdir, { recursive: true });
  } catch (err) {
    t.assertIsError(err);
  }
});
