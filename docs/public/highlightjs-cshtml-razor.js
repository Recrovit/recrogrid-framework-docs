/* eslint-disable no-useless-escape */
/*
 * Vendored from:
 *   package: highlightjs-cshtml-razor
 *   version: 2.2.0
 *   source: https://github.com/highlightjs/highlightjs-cshtml-razor
 *   license: CC0-1.0
 *
 * Upstream file:
 *   src/languages/cshtml-razor.js
 *
 * Adaptation:
 *   Converted from CommonJS export to ES module default export for DocFX template loading.
 */
/*
 * Language: cshtml-razor
 * Requires: xml.js, csharp.js, css.js, javascript.js
 * Author: Roman Resh <romanresh@live.com>
 */

export default function defineCshtmlRazorLanguage(hljs) {
  const SPECIAL_SYMBOL_CLASSNAME = "built_in";
  const CONTENT_REPLACER = {};
  const closedBrace = {
    begin: "}",
    className: SPECIAL_SYMBOL_CLASSNAME,
    endsParent: true
  };
  const braces = {
    begin: "{",
    end: "}",
    contains: [hljs.QUOTE_STRING_MODE, 'self']
  };
  const csbraces = {
    begin: "{",
    end: "}",
    contains: ['self'],
    skip: true
  };
  const quotes = {
    variants: [
      { begin: /"/, end: /"/, skip: true },
      { begin: /'/, end: /'/, skip: true }
    ],
    skip: true
  };
  const razorComment = hljs.COMMENT(
    '@\\*',
    '\\*@',
    {
      relevance: 10
    }
  );
  const razorInlineExpression = {
    begin: '@[A-Za-z0-9\\._:-]+',
    returnBegin: true,
    end: "(\\r|\\n|<|\\s|\"|')",
    subLanguage: 'csharp',
    contains: [
      {
        begin: '@',
        className: SPECIAL_SYMBOL_CLASSNAME
      },
      {
        begin: '\\[',
        end: '\\]',
        skip: true
      },
      {
        begin: '\\(',
        end: '\\)',
        skip: true
      }
    ],
    returnEnd: true
  };
  const razorTextBlock = {
    begin: "[@]{0,1}<text>",
    returnBegin: true,
    end: "</text>",
    returnEnd: true,
    subLanguage: "cshtml-razor",
    contains: [
      {
        begin: "[@]{0,1}<text>",
        className: SPECIAL_SYMBOL_CLASSNAME
      },
      {
        begin: "</text>",
        className: SPECIAL_SYMBOL_CLASSNAME,
        endsParent: true
      }
    ]
  };
  const razorEscapeAt = {
    variants: [
      { begin: "@@" },
      { begin: "[a-zA-Z]+@" }
    ],
    skip: true
  };

  const razorParenthesesBlock = {
    begin: "@\\(",
    end: "\\)",
    returnBegin: true,
    returnEnd: true,
    subLanguage: 'csharp',
    contains: [
      {
        begin: "@\\(",
        className: SPECIAL_SYMBOL_CLASSNAME
      },
      {
        begin: "\\(",
        end: "\\)",
        subLanguage: 'csharp',
        contains: [hljs.QUOTE_STRING_MODE, 'self', razorTextBlock]
      },
      razorTextBlock,
      {
        begin: "\\)",
        className: SPECIAL_SYMBOL_CLASSNAME,
        endsParent: true
      }
    ]
  };
  const xmlBlocks = getXmlBlocks(hljs, [razorInlineExpression, razorParenthesesBlock]);
  const razorDirectivesPrefix = "^\\s*@(page|model|using|inherits|inject|layout)";
  const razorDirectives = {
    begin: razorDirectivesPrefix + "[^\\r\\n{\\(]*$",
    end: "$",
    returnBegin: true,
    returnEnd: true,
    subLanguage: 'csharp',
    contains: [
      {
        begin: razorDirectivesPrefix,
        className: SPECIAL_SYMBOL_CLASSNAME
      }
    ]
  };
  const razorDirectiveVariants = [ "section", "functions", "code" ]
    .map(k => ({ begin: "^\\s*@" + k + "\\s*{" }));
  const closedTag = { begin: ">", className: SPECIAL_SYMBOL_CLASSNAME, endsParent: true };
  const razorDirectiveBlock = {
    variants: razorDirectiveVariants,
    end: "}",
    returnBegin: true,
    returnEnd: true,
    subLanguage: "csharp",
    contains: [
      {
        variants: razorDirectiveVariants.map(function(v) { return { begin: v.begin }; }),
        returnBegin: true,
        contains: [
          { begin: "@", className: SPECIAL_SYMBOL_CLASSNAME },
          {
            begin: razorDirectiveVariants.map(function(v) { return v.begin.substring(2, v.begin.length - 2); }).join("|"),
            subLanguage: "csharp"
          },
          { begin: "{", className: SPECIAL_SYMBOL_CLASSNAME }
        ]
      },
      CONTENT_REPLACER,
      braces,
      closedBrace
    ]
  };

  const razorTagVariant = {
    begin: "^\\s*@(?![{}()_a-zA-Z])",
    end: "$",
    subLanguage: "xml"
  };
  const razorTag = {
    variants: [razorTagVariant],
    contains: [
      { begin: "@", className: SPECIAL_SYMBOL_CLASSNAME },
      CONTENT_REPLACER
    ]
  };
  const htmlTagContinueMode = {
    begin: /[^]*/,
    end: /\/?>/,
    endsWithParent: true,
    subLanguage: "xml",
    contains: [
      razorParenthesesBlock,
      razorInlineExpression
    ]
  };
  const htmlTagBeginMode = {
    begin: "<[A-Za-z0-9\\._:-]+",
    end: /\/?>/,
    subLanguage: "xml",
    contains: [
      razorParenthesesBlock,
      razorInlineExpression,
      htmlTagContinueMode
    ]
  };
  const htmlTagMode = {
    begin: "<\\/?[A-Za-z0-9\\._:-]+",
    end: /\/?>/,
    subLanguage: "xml",
    contains: [
      razorParenthesesBlock,
      razorInlineExpression
    ]
  };
  const htmlScriptTag = getTagMode(
    hljs,
    "script",
    [
      razorInlineExpression,
      razorParenthesesBlock,
      htmlTagContinueMode
    ],
    "javascript"
  );
  const htmlStyleTag = getTagMode(
    hljs,
    "style",
    [
      razorInlineExpression,
      razorParenthesesBlock,
      htmlTagContinueMode
    ],
    "css"
  );
  const htmlTagWithInjectedCode = {
    begin: "<",
    end: ">",
    subLanguage: "xml",
    contains: [
      razorInlineExpression,
      razorParenthesesBlock
    ]
  };
  const razorSingleLineTemplate = {
    begin: "@:",
    end: "$",
    returnBegin: true,
    subLanguage: "cshtml-razor",
    contains: [
      { begin: "@:", className: SPECIAL_SYMBOL_CLASSNAME },
      CONTENT_REPLACER
    ]
  };
  const bracesWithInjectedCode = {
    begin: "{",
    end: "}",
    contains: [
      hljs.QUOTE_STRING_MODE,
      'self',
      razorTextBlock,
      razorInlineExpression,
      razorParenthesesBlock,
      razorSingleLineTemplate,
      htmlTagMode
    ]
  };
  const razorModelExpression = {
    begin: "@<",
    end: ">",
    returnBegin: true,
    returnEnd: true,
    subLanguage: "cshtml-razor",
    contains: [
      { begin: "@<", className: SPECIAL_SYMBOL_CLASSNAME },
      {
        begin: "<",
        end: ">",
        subLanguage: "xml",
        contains: [
          razorParenthesesBlock,
          razorInlineExpression
        ]
      },
      closedTag
    ]
  };
  const razorSectionBlock = {
    begin: "^\\s*@section\\s+[^{\\s]+\\s*{",
    returnBegin: true,
    returnEnd: true,
    end: "}",
    subLanguage: "cshtml-razor",
    contains: [
      { begin: "@section", className: SPECIAL_SYMBOL_CLASSNAME },
      { begin: "{", className: SPECIAL_SYMBOL_CLASSNAME },
      CONTENT_REPLACER,
      bracesWithInjectedCode,
      closedBrace
    ]
  };
  const razorFunctionsBlock = {
    begin: "^\\s*@(functions|code)\\s*{",
    returnBegin: true,
    returnEnd: true,
    end: "}",
    subLanguage: "csharp",
    contains: [
      { begin: "@(functions|code)", className: SPECIAL_SYMBOL_CLASSNAME },
      { begin: "{", className: SPECIAL_SYMBOL_CLASSNAME },
      CONTENT_REPLACER,
      csbraces,
      quotes,
      closedBrace
    ]
  };
  const razorHelperBlock = {
    begin: "^\\s*@helper\\s+[^{\\s]+(?:\\s+[^{\\s]+)*\\s*{",
    returnBegin: true,
    returnEnd: true,
    end: "}",
    subLanguage: "cshtml-razor",
    contains: [
      { begin: "@helper", className: SPECIAL_SYMBOL_CLASSNAME },
      { begin: "{", className: SPECIAL_SYMBOL_CLASSNAME },
      closedBrace
    ]
  };
  const razorCodeBlockVariants = ["for", "if", "switch", "while", "using", "lock", "foreach"]
    .map(keyword => ({
      begin: `@${keyword}(?![\\w\\d])[^{]*\\{`,
      end: "}"
    }));
  const elseVariants = [
    { begin: "\\}\\s*else\\s*(if[^\\{]+|)\\{" }
  ];
  const razorCodeBlock = {
    variants: razorCodeBlockVariants,
    returnBegin: true,
    returnEnd: true,
    subLanguage: "csharp",
    contains: [
      {
        variants: razorCodeBlockVariants.map(function(v) { return { begin: v.begin }; }),
        returnBegin: true,
        contains: [
          { begin: "@", className: SPECIAL_SYMBOL_CLASSNAME },
          {
            variants: razorCodeBlockVariants.map(function(v) { return { begin: `${v.begin}`.substring(1, v.begin.length - 2) }; }),
            subLanguage: "csharp"
          },
          { begin: "{", className: SPECIAL_SYMBOL_CLASSNAME }
        ]
      },
      CONTENT_REPLACER,
      {
        variants: elseVariants,
        returnBegin: true,
        contains: [
          { begin: "}", className: SPECIAL_SYMBOL_CLASSNAME },
          {
            begin: elseVariants[0].begin.substring(2, elseVariants[0].begin.length - 2),
            subLanguage: "csharp"
          },
          {
            begin: "{",
            className: SPECIAL_SYMBOL_CLASSNAME
          }
        ]
      },
      braces,
      closedBrace
    ]
  };
  const razorTryBlock = {
    begin: "@try\\s*{",
    end: "}",
    returnBegin: true,
    returnEnd: true,
    subLanguage: "csharp",
    contains: [
      { begin: "@", className: SPECIAL_SYMBOL_CLASSNAME },
      { begin: "try\\s*{", subLanguage: "csharp" },
      {
        variants: [
          { begin: "}\\s*catch\\s*\\([^\\)]+\\)\\s*{" },
          { begin: "}\\s*finally\\s*{" }
        ],
        returnBegin: true,
        contains: [
          { begin: "}", className: SPECIAL_SYMBOL_CLASSNAME },
          {
            variants: [
              { begin: "catch\\s*\\([^\\)]+\\)\\s*{" },
              { begin: "finally\\s*{" }
            ],
            subLanguage: "csharp"
          },
          { begin: "{", className: SPECIAL_SYMBOL_CLASSNAME }
        ]
      },
      braces,
      closedBrace
    ]
  };
  const mainMode = {
    contains: [
      razorComment,
      razorEscapeAt,
      razorDirectives,
      razorDirectiveBlock,
      razorSectionBlock,
      razorFunctionsBlock,
      razorHelperBlock,
      razorSingleLineTemplate,
      razorModelExpression,
      razorTextBlock,
      razorTag,
      razorCodeBlock,
      razorTryBlock,
      razorParenthesesBlock,
      razorInlineExpression,
      htmlScriptTag,
      htmlStyleTag,
      htmlTagBeginMode,
      htmlTagMode,
      htmlTagWithInjectedCode
    ]
  };
  CONTENT_REPLACER.contains = mainMode.contains;

  return {
    name: "cshtml-razor",
    aliases: [
      "cshtml",
      "razor"
    ],
    case_insensitive: true,
    subLanguage: "xml",
    contains: mainMode.contains.concat(xmlBlocks)
  };
}

function getTagMode(hljs, tagName, tagContains, subLanguage) {
  return {
    begin: `<${tagName}(\\s|>)`,
    end: `</${tagName}>`,
    returnBegin: true,
    returnEnd: true,
    subLanguage: "xml",
    contains: [
      {
        begin: `<${tagName}(\\s|>)`,
        end: /\/?>/,
        subLanguage: "xml",
        contains: tagContains
      },
      {
        begin: ">",
        className: "built_in"
      },
      {
        begin: "[^<]+",
        subLanguage
      },
      {
        begin: `</${tagName}>`,
        className: "built_in"
      }
    ]
  };
}

function getXmlBlocks(hljs, tagContains) {
  return [
    {
      begin: "<!DOCTYPE",
      end: ">",
      subLanguage: "xml"
    },
    {
      begin: "<\\?xml",
      end: "\\?>",
      subLanguage: "xml"
    },
    {
      begin: "<!--",
      end: "-->",
      subLanguage: "xml"
    },
    getTagMode(hljs, "script", tagContains, "javascript"),
    getTagMode(hljs, "style", tagContains, "css")
  ];
}
