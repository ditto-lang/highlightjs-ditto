/// <reference types="jest" />
const fs = require("fs");
const path = require("path");

const prettier = require("prettier");

const ditto = require("../src/languages/ditto.js");
const hljs = require("highlight.js/lib");
hljs.registerLanguage("ditto", ditto);

const HLJS_VERSION = require("../package.json").devDependencies["highlight.js"];

async function exists(path) {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

expect.extend({
  async toMatchHtmlSnapshot(got) {
    const gotPretty = prettier.format(got, { parser: "html" });

    await fs.promises.mkdir("docs", { recursive: true });
    const snapshotPath = path.join("docs", `${this.currentTestName}.html`);
    const snapshotExists = await exists(snapshotPath);

    if (!snapshotExists) {
      this.snapshotState.added += 1;
      await fs.promises.writeFile(snapshotPath, gotPretty, {
        encoding: "utf-8",
      });
      return { pass: true };
    }

    const want = await fs.promises.readFile(snapshotPath, {
      encoding: "utf-8",
    });
    const wantPretty = prettier.format(want, { parser: "html" });
    if (wantPretty !== gotPretty) {
      if (this.snapshotState._updateSnapshot === "all") {
        await fs.promises.writeFile(snapshotPath, gotPretty, {
          encoding: "utf-8",
        });
        this.snapshotState.updated += 1;
        return { pass: true };
      }
      this.snapshotState.unmatched += 1;
      return {
        message: () => this.utils.diff(wantPretty, gotPretty),
        pass: false,
      };
    }
    this.snapshotState.matched += 1;
    return { pass: true };
  },
});

function highlight(source, title) {
  const highlighted = hljs.highlight(source.trim(), {
    language: "ditto",
  }).value;
  return `
<!doctype html>
<html>
<head>
<title>${title}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${HLJS_VERSION}/styles/a11y-light.min.css">
<style>
body {
  background-color: #606c76;
}
code {
  max-width: 400px;
  margin: 50px auto;
  box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
  border-radius: 10px;
}
</style>
</head>
<body>
<pre class="ditto">
<code class="hljs language-ditto">${highlighted}</code>
</pre>
</body>
</html>
`;
}

function testHighlighting(slug, title, source) {
  test(slug, async () => {
    const highlighted = highlight(source, title);
    await expect(highlighted).toMatchHtmlSnapshot();
  });
}

testHighlighting(
  "kitchen-sink",
  "Kitchen sink",
  `
-- ditto module
module Example exports (..);

import (core) Maybe;
import My.Module as MM (
  my_thing
);

type Dunno;

type Example = Example;

type FooBarBaz(a, b) =
    | Foo
    | Bar(a, b)
    | Baz;

foreign magic: (Int, a) -> Bool;

example = Example;
bar = Bar("", unit);
five_int : Int = 5;
five_float : Float = 5.0;
five_thousand : Int = 5_000.0_0;
five_string : String = "five";
fives : Array(Int) = [5, 5, 5, 5, 5, 5];
nada = unit;
yes = true;
no = false;
`
);

testHighlighting(
  "teaser",
  "Teaser",
  `
module Hello.Ditto exports (..);

import (core) String;
import (node-readline) Readline (question);
import (js-console) Console;

type Greeting =
  | Generic
  | Name(String);

greeting_to_string = (greeting: Greeting): String ->
  match greeting with
  | Generic -> "Hello there!"
  | Name(name) -> "Hello there, \${name}!";

main = do {
  response <- question("What's your name?");
  let greeting =
    if String.is_empty(response) then
      Generic
    else
      Name(response);

  greeting_to_string(greeting) |> Console.log
};
`
);
