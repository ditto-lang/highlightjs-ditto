/*
Language: Ditto
Author: Jordan Mackie <jordan@nous.co>
Website: https://ditto-lang.github.io/book/
Category: functional
*/

const PROPER_NAME_RE = "[A-Z]\\w*";
const NAME_RE = "[a-z]\\w*";
const MODULE_NAME_RE = "[A-Z][.\\w]*"; // not _entirely_ legit as can't have a trailing dot...

/** @type {import("highlight.js").Mode} */
const MODULE_NAME_MODE = {
  //scope: "built_in",
  begin: MODULE_NAME_RE,
};

/** @type {import("highlight.js").Mode} */
const DOUBLE_DOT_MODE = {
  scope: "symbol",
  begin: "\\.\\.",
};

/** @type {import("highlight.js").Mode} */
const TYPE_NAME_MODE = {
  scope: "type",
  begin: PROPER_NAME_RE,
};

/** @type {import("highlight.js").Mode} */
const TYPE_VARIABLE_MODE = {
  scope: "variable",
  begin: NAME_RE,
};

/** @type {import("highlight.js").Mode[]} */
const TYPE_MODES = [TYPE_NAME_MODE, TYPE_VARIABLE_MODE];
const TYPE_MODE = {
  contains: TYPE_MODES,
};

/** @type {import("highlight.js").Mode} */
const CONSTRUCTOR_MODE = {
  scope: "title.function.invoke",
  begin: PROPER_NAME_RE,
};

/** @type {import("highlight.js").LanguageFn} */
export default function (hljs) {
  const COMMENT = hljs.COMMENT("--", "$");

  /** @type {import("highlight.js").Mode} */
  const EXPRESSION_MODES = [
    // Constructors (e.g. Just)
    CONSTRUCTOR_MODE,
    // "strings"
    hljs.QUOTE_STRING_MODE,
    // Ints and Floats
    hljs.NUMBER_MODE,
  ];

  const EXPRESSION_MODE = {
    contains: [...EXPRESSION_MODES],
    keywords: {
      literal: ["true", "false", "unit"],
    },
  };

  return {
    name: "ditto",
    contains: [
      COMMENT,
      // module header
      {
        begin: "module",
        end: ";",
        contains: [MODULE_NAME_MODE, DOUBLE_DOT_MODE],
        keywords: ["module", "exports"],
      },
      // import line
      {
        begin: "import",
        end: ";",
        contains: [MODULE_NAME_MODE, DOUBLE_DOT_MODE],
        keywords: ["import", "as"],
      },
      // foreign declaration
      {
        begin: "foreign",
        end: ";",
        contains: [{ begin: ":", endsWithParent: true, ...TYPE_MODE }],
        keywords: ["foreign"],
      },
      // type declaration
      {
        begin: "type",
        end: ";",
        contains: [
          ...TYPE_MODES,
          {
            begin: "=",
            endsWithParent: true,
            contains: [CONSTRUCTOR_MODE, TYPE_VARIABLE_MODE],
          },
        ],
        keywords: ["type"],
      },
      // value declaration
      {
        begin: NAME_RE,
        end: ";",
        contains: [
          // Optional type annotation
          { begin: ":", end: "=", returnEnd: true, ...TYPE_MODE },
          // Assigned expression
          {
            begin: "=",
            endsWithParent: true,
            ...EXPRESSION_MODE,
          },
        ],
      },
      // TODO operators?
    ],
  };
}

// https://github.com/highlightjs/highlight.js/blob/main/src/lib/modes.js
// https://highlightjs.readthedocs.io/en/latest/css-classes-reference.html
