import * as acorn from "https://cdn.jsdelivr.net/npm/acorn@8.15.0/+esm";

class SquirrelPie extends HTMLElement {
  static observedAttributes = ["value", "source-type", "theme"];

  #sourcecode = "";
  #sourceType = "module";
  #theme = "";

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    // Check for theme attribute
    const themeUrl = this.getAttribute("theme");

    if (themeUrl) {
      // Load external theme
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = themeUrl;
      shadow.appendChild(link);
    } else {
      // Use built-in default theme
      const style = document.createElement("style");
      style.textContent = this.getDefaultStyles();
      shadow.appendChild(style);
    }

    const template = document.createElement("template");
    const slot = document.createElement("slot");
    template.content.appendChild(slot);
    shadow.appendChild(template);
  }

  connectedCallback() {
    if (this.hasAttribute("value")) {
      this.#sourcecode = this.getAttribute("value");
    } else {
      this.#sourcecode = this.textContent;
    }
    this.#sourcecode = this.dedent(this.#sourcecode);
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === "value") {
      this.#sourcecode = this.dedent(newValue);
      this.render();
    } else if (name === "source-type") {
      this.#sourceType = newValue;
      this.render();
    } else if (name === "theme") {
      this.#theme = newValue;
      this.updateTheme();
    }
  }

  updateTheme() {
    // Remove existing style/link elements
    const existingStyle = this.shadowRoot.querySelector("style");
    const existingLink = this.shadowRoot.querySelector("link[rel='stylesheet']");
    if (existingStyle) existingStyle.remove();
    if (existingLink) existingLink.remove();

    // Add new theme
    if (this.#theme) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = this.#theme;
      this.shadowRoot.insertBefore(link, this.shadowRoot.firstChild);
    } else {
      const style = document.createElement("style");
      style.textContent = this.getDefaultStyles();
      this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
    }
  }

  getDefaultStyles() {
    return `
      :host {
        display: block;
        font-family: 'Courier New', monospace;
        background: #252526;
        padding: 20px;
        border-radius: 4px;
        border: 1px solid #3e3e42;
        overflow-x: auto;
      }
      code {
        display: block;
        white-space: pre;
        line-height: 1.6;
        color: #d4d4d4;
      }

      /* Root program node */
      .Program { color: #d4d4d4; }

      /* class MyClass {} or class MyClass extends Base {} */
      .ClassDeclaration { color: #4ec9b0; }

      /* const MyClass = class {} */
      .ClassExpression { color: #4ec9b0; }

      /* The {...} body containing class members */
      .ClassBody { color: #d4d4d4; }

      /* constructor() {} or myMethod() {} or get value() {} */
      .MethodDefinition { color: #dcdcaa; }

      /* class property: myProp = 42; */
      .PropertyDefinition { color: #9cdcfe; }

      /* const fn = function() {} */
      .FunctionExpression { color: #dcdcaa; }

      /* function myFunc() {} */
      .FunctionDeclaration { color: #dcdcaa; }

      /* const fn = () => {} or x => x * 2 */
      .ArrowFunctionExpression { color: #dcdcaa; }

      /* {...} containing statements */
      .BlockStatement { display: inline; }

      /* static {...} in class */
      .StaticBlock { display: inline; }

      /* Any expression used as a statement: console.log(); */
      .ExpressionStatement { color: #d4d4d4; }

      /* x = 10 or obj.prop = value */
      .AssignmentExpression { color: #d4d4d4; }

      /* obj.property or obj[key] or obj?.optional */
      .MemberExpression { color: #9cdcfe; }

      /* this keyword */
      .ThisExpression { color: #569cd6; font-weight: bold; }

      /* super keyword */
      .Super { color: #569cd6; font-weight: bold; }

      /* Variable and function names: myVar, funcName */
      .Identifier { color: #9cdcfe; }

      /* Private class members: #privateField */
      .PrivateIdentifier { color: #9cdcfe; }

      /* return value; */
      .ReturnStatement { color: #c586c0; font-weight: bold; }

      /* throw new Error(); */
      .ThrowStatement { color: #c586c0; font-weight: bold; }

      /* break; or break label; */
      .BreakStatement { color: #c586c0; font-weight: bold; }

      /* continue; or continue label; */
      .ContinueStatement { color: #c586c0; font-weight: bold; }

      /* if (condition) {...} else {...} */
      .IfStatement { color: #c586c0; font-weight: bold; }

      /* switch (value) { case ...: } */
      .SwitchStatement { color: #c586c0; font-weight: bold; }

      /* while (condition) {...} */
      .WhileStatement { color: #c586c0; font-weight: bold; }

      /* do {...} while (condition); */
      .DoWhileStatement { color: #c586c0; font-weight: bold; }

      /* for (let i = 0; i < 10; i++) {...} */
      .ForStatement { color: #c586c0; font-weight: bold; }

      /* for (key in obj) {...} */
      .ForInStatement { color: #c586c0; font-weight: bold; }

      /* for (item of array) {...} */
      .ForOfStatement { color: #c586c0; font-weight: bold; }

      /* try {...} catch {...} finally {...} */
      .TryStatement { color: #c586c0; font-weight: bold; }

      /* with (obj) {...} - deprecated but valid */
      .WithStatement { color: #c586c0; font-weight: bold; }

      /* func(arg1, arg2) or obj.method() */
      .CallExpression { color: #dcdcaa; }

      /* a + b or x * y or "string" + var */
      .BinaryExpression { color: #d4d4d4; }

      /* a && b or x || y or z ?? default */
      .LogicalExpression { color: #d4d4d4; }

      /* !value or -num or typeof x */
      .UnaryExpression { color: #d4d4d4; }

      /* i++ or --count */
      .UpdateExpression { color: #d4d4d4; }

      /* const x = 1; or let y; or var z; */
      .VariableDeclaration { color: #569cd6; font-weight: bold; }

      /* The x = 1 part of const x = 1; */
      .VariableDeclarator { color: #d4d4d4; }

      /* new MyClass() or new Array(10) */
      .NewExpression { color: #569cd6; font-weight: bold; }

      /* 42, "string", true, null, /regex/g */
      .Literal { color: #b5cea8; }

      /* \`template $ {expression} string\` */
      .TemplateLiteral { color: #ce9178; }

      /* [1, 2, 3] or [a, ...rest] */
      .ArrayExpression { color: #d4d4d4; }

      /* {key: value, method() {}} */
      .ObjectExpression { color: #d4d4d4; }

      /* ...array or ...obj in expressions */
      .SpreadElement { color: #d4d4d4; }

      /* ...rest in destructuring patterns */
      .RestElement { color: #d4d4d4; }

      /* yield value or yield* iterable */
      .YieldExpression { color: #c586c0; font-weight: bold; }

      /* await promise */
      .AwaitExpression { color: #c586c0; font-weight: bold; }

      /* import {x} from 'module'; */
      .ImportDeclaration { color: #c586c0; font-weight: bold; }

      /* export {x, y}; or export const z = 1; */
      .ExportNamedDeclaration { color: #c586c0; font-weight: bold; }

      /* export default MyClass; */
      .ExportDefaultDeclaration { color: #c586c0; font-weight: bold; }

      /* export * from 'module'; */
      .ExportAllDeclaration { color: #c586c0; font-weight: bold; }

      /* import.meta or new.target */
      .MetaProperty { color: #9cdcfe; }

      /* condition ? true : false */
      .ConditionalExpression { color: #d4d4d4; }

      /* [a, b] = array or {x, y} = obj */
      .ArrayPattern { color: #d4d4d4; }
      .ObjectPattern { color: #d4d4d4; }

      /* param = default in function params */
      .AssignmentPattern { color: #d4d4d4; }

      /* a, b, c in sequence */
      .SequenceExpression { color: #d4d4d4; }

      /* Fallback styles */
      .keyword { color: #569cd6; font-weight: bold; }
      .operator { color: #d4d4d4; }
      .punctuation { color: #808080; }

      /* Hover effect to show AST node type */
      span[title]:hover {
        background: #264f78;
        cursor: help;
      }
    `;
  }

  dedent(text) {
    if (!text) return "";
    const lines = text.split("\n");
    while (lines.length > 0 && lines[0].trim() === "") lines.shift();
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
    if (lines.length === 0) return "";
    const indents = lines.filter(line => line.trim() !== "").map(line => line.match(/^\s*/)[0].length);
    const minIndent = Math.min(...indents);
    return lines.map(line => line.slice(minIndent)).join("\n");
  }

  render() {
    if (!this.#sourcecode || !this.#sourcecode.trim()) return;
    try {
      const ast = this.parse(this.#sourcecode);
      const astHtml = this.renderNode(ast);
      const existingCode = this.shadowRoot.querySelector("code");
      if (existingCode) existingCode.remove();
      const outputElement = document.createElement("code");
      outputElement.innerHTML = astHtml;
      this.shadowRoot.appendChild(outputElement);
    } catch (error) {
      console.error("Squirrel Pie parsing error:", error);
      const errorElement = document.createElement("code");
      errorElement.style.color = "#f48771";
      errorElement.textContent = `Parse Error: ${error.message}`;
      const existingCode = this.shadowRoot.querySelector("code");
      if (existingCode) existingCode.remove();
      this.shadowRoot.appendChild(errorElement);
    }
  }

  parse(sourcecode) {
    const ast = acorn.parse(sourcecode, {
      ecmaVersion: 2022,
      sourceType: this.#sourceType,
    });
    return ast;
  }

  wrap(type, content) {
    return `<span class="${type}" title="${type}">${content}</span>`;
  }

  renderNode(node, indent = 0) {
    if (!node) return "";
    const ind = "  ".repeat(indent);

    switch (node.type) {
      case "Program":
        return node.body.map(n => this.renderNode(n, indent)).join("\n");

      case "ClassDeclaration":
      case "ClassExpression":
        const className = node.id ? this.renderNode(node.id) : "";
        const superClass = node.superClass ? ` extends ${this.renderNode(node.superClass)}` : "";
        const classBody = this.renderNode(node.body, indent);
        return this.wrap(node.type, `class ${className}${superClass} ${classBody}`);

      case "ClassBody":
        const members = node.body.map(n => this.renderNode(n, indent + 1)).join("\n");
        return this.wrap("ClassBody", `{\n${members}\n${ind}}`);

      case "MethodDefinition":
        const methodStatic = node.static ? "static " : "";
        const methodKind = node.kind === "get" ? "get " : node.kind === "set" ? "set " : "";
        const methodKey = this.renderNode(node.key);
        const methodParams = node.value.params.map(p => this.renderNode(p)).join(", ");
        const methodBody = this.renderNode(node.value.body, indent);
        return `${ind}${methodStatic}${this.wrap("MethodDefinition", methodKind + methodKey)}(${methodParams}) ${methodBody}`;

      case "PropertyDefinition":
        const propStatic = node.static ? "static " : "";
        const propKey = this.renderNode(node.key);
        const propValue = node.value ? ` = ${this.renderNode(node.value)}` : "";
        return `${ind}${propStatic}${this.wrap("PropertyDefinition", propKey)}${propValue};`;

      case "StaticBlock":
        const staticBody = node.body.map(n => this.renderNode(n, indent + 1)).join("\n");
        return `${ind}${this.wrap("StaticBlock", `static {\n${staticBody}\n${ind}}` )}`;

      case "FunctionDeclaration":
        const fnAsync = node.async ? "async " : "";
        const fnGenerator = node.generator ? "*" : "";
        const fnName = node.id ? this.renderNode(node.id) : "";
        const fnParams = node.params.map(p => this.renderNode(p)).join(", ");
        const fnBody = this.renderNode(node.body, indent);
        return this.wrap("FunctionDeclaration", `${fnAsync}function${fnGenerator} ${fnName}(${fnParams}) ${fnBody}`);

      case "FunctionExpression":
        const fAsync = node.async ? "async " : "";
        const fGenerator = node.generator ? "*" : "";
        const fName = node.id ? this.renderNode(node.id) : "";
        const fParams = node.params.map(p => this.renderNode(p)).join(", ");
        const fBody = this.renderNode(node.body, indent);
        return this.wrap("FunctionExpression", `${fAsync}function${fGenerator}${fName ? " " + fName : ""}(${fParams}) ${fBody}`);

      case "ArrowFunctionExpression":
        const arrowAsync = node.async ? "async " : "";
        const arrowParams = node.params.length === 1 && node.params[0].type === "Identifier"
          ? this.renderNode(node.params[0])
          : `(${node.params.map(p => this.renderNode(p)).join(", ")})`;
        const arrowBody = node.body.type === "BlockStatement"
          ? this.renderNode(node.body, indent)
          : this.renderNode(node.body);
        return this.wrap("ArrowFunctionExpression", `${arrowAsync}${arrowParams} => ${arrowBody}`);

      case "BlockStatement":
        const statements = node.body.map(n => this.renderNode(n, indent + 1)).join("\n");
        return this.wrap("BlockStatement", `{\n${statements}\n${ind}}`);

      case "EmptyStatement":
        return `${ind};`;

      case "DebuggerStatement":
        return `${ind}${this.wrap("DebuggerStatement", "debugger")};`;

      case "ExpressionStatement":
        return `${ind}${this.wrap("ExpressionStatement", this.renderNode(node.expression))};`;

      case "ReturnStatement":
        const retArg = node.argument ? " " + this.renderNode(node.argument) : "";
        return `${ind}${this.wrap("ReturnStatement", "return" + retArg)}`;

      case "BreakStatement":
        const breakLabel = node.label ? " " + this.renderNode(node.label) : "";
        return `${ind}${this.wrap("BreakStatement", "break" + breakLabel)};`;

      case "ContinueStatement":
        const contLabel = node.label ? " " + this.renderNode(node.label) : "";
        return `${ind}${this.wrap("ContinueStatement", "continue" + contLabel)};`;

      case "LabeledStatement":
        return `${ind}${this.renderNode(node.label)}: ${this.renderNode(node.body, indent)}`;

      case "IfStatement":
        const ifTest = this.renderNode(node.test);
        const ifCons = this.renderNode(node.consequent, indent);
        const ifAlt = node.alternate ? ` else ${this.renderNode(node.alternate, indent)}` : "";
        return `${ind}${this.wrap("IfStatement", `if (${ifTest}) ${ifCons}`)}${ifAlt}`;

      case "SwitchStatement":
        const switchDisc = this.renderNode(node.discriminant);
        const cases = node.cases.map(c => this.renderNode(c, indent + 1)).join("\n");
        return `${ind}${this.wrap("SwitchStatement", `switch (${switchDisc}) {\n${cases}\n${ind}}`)}`;

      case "SwitchCase":
        const caseTest = node.test ? `case ${this.renderNode(node.test)}:` : "default:";
        const caseCons = node.consequent.map(s => this.renderNode(s, indent + 1)).join("\n");
        return `${ind}${this.wrap("SwitchCase", caseTest)}\n${caseCons}`;

      case "ThrowStatement":
        return `${ind}${this.wrap("ThrowStatement", `throw ${this.renderNode(node.argument)}`)};`;

      case "TryStatement":
        const tryBlock = this.renderNode(node.block, indent);
        const catchClause = node.handler ? ` ${this.renderNode(node.handler, indent)}` : "";
        const finallyBlock = node.finalizer ? ` finally ${this.renderNode(node.finalizer, indent)}` : "";
        return `${ind}${this.wrap("TryStatement", `try ${tryBlock}`)}${catchClause}${finallyBlock}`;

      case "CatchClause":
        const catchParam = node.param ? `(${this.renderNode(node.param)})` : "";
        const catchBody = this.renderNode(node.body, indent);
        return this.wrap("CatchClause", `catch${catchParam} ${catchBody}`);

      case "WhileStatement":
        const whileTest = this.renderNode(node.test);
        const whileBody = this.renderNode(node.body, indent);
        return `${ind}${this.wrap("WhileStatement", `while (${whileTest}) ${whileBody}`)}`;

      case "DoWhileStatement":
        const doBody = this.renderNode(node.body, indent);
        const doTest = this.renderNode(node.test);
        return `${ind}${this.wrap("DoWhileStatement", `do ${doBody} while (${doTest})`)};`;

      case "ForStatement":
        const forInit = node.init ? this.renderNode(node.init).replace(/;\s*$/, "") : "";
        const forTest = node.test ? this.renderNode(node.test) : "";
        const forUpdate = node.update ? this.renderNode(node.update) : "";
        const forBody = this.renderNode(node.body, indent);
        return `${ind}${this.wrap("ForStatement", `for (${forInit}; ${forTest}; ${forUpdate}) ${forBody}`)}`;

      case "ForInStatement":
        const forInLeft = this.renderNode(node.left).replace(/;\s*$/, "");
        const forInRight = this.renderNode(node.right);
        const forInBody = this.renderNode(node.body, indent);
        return `${ind}${this.wrap("ForInStatement", `for (${forInLeft} in ${forInRight}) ${forInBody}`)}`;

      case "ForOfStatement":
        const forOfAwait = node.await ? "await " : "";
        const forOfLeft = this.renderNode(node.left).replace(/;\s*$/, "");
        const forOfRight = this.renderNode(node.right);
        const forOfBody = this.renderNode(node.body, indent);
        return `${ind}${this.wrap("ForOfStatement", `for ${forOfAwait}(${forOfLeft} of ${forOfRight}) ${forOfBody}`)}`;

      case "WithStatement":
        const withObj = this.renderNode(node.object);
        const withBody = this.renderNode(node.body, indent);
        return `${ind}${this.wrap("WithStatement", `with (${withObj}) ${withBody}`)}`;

      case "VariableDeclaration":
        const decls = node.declarations.map(d => this.renderNode(d)).join(", ");
        return this.wrap("VariableDeclaration", `${node.kind} ${decls}`);

      case "VariableDeclarator":
        const varId = this.renderNode(node.id);
        const varInit = node.init ? ` = ${this.renderNode(node.init)}` : "";
        return this.wrap("VariableDeclarator", varId + varInit);

      case "AssignmentExpression":
        const assignLeft = this.renderNode(node.left);
        const assignRight = this.renderNode(node.right);
        return this.wrap("AssignmentExpression", `${assignLeft} ${node.operator} ${assignRight}`);

      case "AssignmentPattern":
        const patternLeft = this.renderNode(node.left);
        const patternRight = this.renderNode(node.right);
        return this.wrap("AssignmentPattern", `${patternLeft} = ${patternRight}`);

      case "BinaryExpression":
        const binLeft = this.renderNode(node.left);
        const binRight = this.renderNode(node.right);
        return this.wrap("BinaryExpression", `${binLeft} ${node.operator} ${binRight}`);

      case "LogicalExpression":
        const logLeft = this.renderNode(node.left);
        const logRight = this.renderNode(node.right);
        return this.wrap("LogicalExpression", `${logLeft} ${node.operator} ${logRight}`);

      case "UnaryExpression":
        const unaryArg = this.renderNode(node.argument);
        return this.wrap("UnaryExpression", node.prefix ? `${node.operator}${unaryArg}` : `${unaryArg}${node.operator}`);

      case "UpdateExpression":
        const updateArg = this.renderNode(node.argument);
        return this.wrap("UpdateExpression", node.prefix ? `${node.operator}${updateArg}` : `${updateArg}${node.operator}`);

      case "ConditionalExpression":
        const condTest = this.renderNode(node.test);
        const condCons = this.renderNode(node.consequent);
        const condAlt = this.renderNode(node.alternate);
        return this.wrap("ConditionalExpression", `${condTest} ? ${condCons} : ${condAlt}`);

      case "CallExpression":
        const callee = this.renderNode(node.callee);
        const callArgs = node.arguments.map(a => this.renderNode(a)).join(", ");
        const optional = node.optional ? "?." : "";
        return this.wrap("CallExpression", `${callee}${optional}(${callArgs})`);

      case "NewExpression":
        const newCallee = this.renderNode(node.callee);
        const newArgs = node.arguments.map(a => this.renderNode(a)).join(", ");
        return this.wrap("NewExpression", `new ${newCallee}(${newArgs})`);

      case "MemberExpression":
        const memObj = this.renderNode(node.object);
        const memOpt = node.optional ? "?." : "";
        const memProp = node.computed
          ? `[${this.renderNode(node.property)}]`
          : `${memOpt ? memOpt : "."}${this.renderNode(node.property)}`;
        return this.wrap("MemberExpression", memObj + memProp);

      case "ChainExpression":
        return this.renderNode(node.expression);

      case "SequenceExpression":
        const seqExprs = node.expressions.map(e => this.renderNode(e)).join(", ");
        return this.wrap("SequenceExpression", seqExprs);

      case "ArrayExpression":
        const arrElements = node.elements.map(e => e ? this.renderNode(e) : "").join(", ");
        return this.wrap("ArrayExpression", `[${arrElements}]`);

      case "ObjectExpression":
        const objProps = node.properties.map(p => this.renderNode(p, indent + 1)).join(",\n");
        return this.wrap("ObjectExpression", objProps.includes("\n") ? `{\n${objProps}\n${ind}}` : `{${objProps}}`);

      case "Property":
        const propKeyNode = this.renderNode(node.key);
        const propValueNode = this.renderNode(node.value);
        const propPrefix = node.kind === "get" ? "get " : node.kind === "set" ? "set " : "";
        const propMethod = node.method ? `(${node.value.params.map(p => this.renderNode(p)).join(", ")}) ${this.renderNode(node.value.body, indent)}` : "";
        if (node.shorthand) {
          return `${ind}${this.wrap("Property", propKeyNode)}`;
        } else if (node.method) {
          return `${ind}${propPrefix}${this.wrap("Property", propKeyNode)}${propMethod}`;
        } else {
          return `${ind}${propPrefix}${this.wrap("Property", `${propKeyNode}: ${propValueNode}`)}`;
        }

      case "SpreadElement":
        return this.wrap("SpreadElement", `...${this.renderNode(node.argument)}`);

      case "RestElement":
        return this.wrap("RestElement", `...${this.renderNode(node.argument)}`);

      case "ArrayPattern":
        const arrPatternElements = node.elements.map(e => e ? this.renderNode(e) : "").join(", ");
        return this.wrap("ArrayPattern", `[${arrPatternElements}]`);

      case "ObjectPattern":
        const objPatternProps = node.properties.map(p => this.renderNode(p)).join(", ");
        return this.wrap("ObjectPattern", `{${objPatternProps}}`);

      case "ThisExpression":
        return this.wrap("ThisExpression", "this");

      case "Super":
        return this.wrap("Super", "super");

      case "Identifier":
        return this.wrap("Identifier", node.name);

      case "PrivateIdentifier":
        return this.wrap("PrivateIdentifier", `#${node.name}`);

      case "Literal":
        if (node.regex) {
          return this.wrap("Literal", `/${node.regex.pattern}/${node.regex.flags}`);
        }
        return this.wrap("Literal", node.raw);

      case "TemplateLiteral":
        let template = "`";
        for (let i = 0; i < node.quasis.length; i++) {
          template += node.quasis[i].value.raw;
          if (i < node.expressions.length) {
            template += "${" + this.renderNode(node.expressions[i]) + "}";
          }
        }
        template += "`";
        return this.wrap("TemplateLiteral", template);

      case "TaggedTemplateExpression":
        const tag = this.renderNode(node.tag);
        const quasi = this.renderNode(node.quasi);
        return this.wrap("TaggedTemplateExpression", `${tag}${quasi}`);

      case "TemplateElement":
        return node.value.raw;

      case "YieldExpression":
        const yieldDelegate = node.delegate ? "*" : "";
        const yieldArg = node.argument ? " " + this.renderNode(node.argument) : "";
        return this.wrap("YieldExpression", `yield${yieldDelegate}${yieldArg}`);

      case "AwaitExpression":
        return this.wrap("AwaitExpression", `await ${this.renderNode(node.argument)}`);

      case "MetaProperty":
        return this.wrap("MetaProperty", `${this.renderNode(node.meta)}.${this.renderNode(node.property)}`);

      case "ImportExpression":
        const importSource = this.renderNode(node.source);
        const importOptions = node.options ? `, ${this.renderNode(node.options)}` : "";
        return this.wrap("ImportExpression", `import(${importSource}${importOptions})`);

      case "ImportDeclaration":
        const importSpecs = node.specifiers.map(s => this.renderNode(s)).join(", ");
        const importFrom = this.renderNode(node.source);
        const importAttrs = node.attributes && node.attributes.length
          ? ` with { ${node.attributes.map(a => this.renderNode(a)).join(", ")} }`
          : "";
        return this.wrap("ImportDeclaration", `import ${importSpecs} from ${importFrom}${importAttrs}`);

      case "ImportSpecifier":
        const importedName = this.renderNode(node.imported);
        const localName = this.renderNode(node.local);
        return importedName === localName ? localName : `${importedName} as ${localName}`;

      case "ImportDefaultSpecifier":
        return this.renderNode(node.local);

      case "ImportNamespaceSpecifier":
        return `* as ${this.renderNode(node.local)}`;

      case "ImportAttribute":
        return `${this.renderNode(node.key)}: ${this.renderNode(node.value)}`;

      case "ExportNamedDeclaration":
        if (node.declaration) {
          return this.wrap("ExportNamedDeclaration", `export ${this.renderNode(node.declaration, indent)}`);
        }
        const exportSpecs = node.specifiers.map(s => this.renderNode(s)).join(", ");
        const exportFrom = node.source ? ` from ${this.renderNode(node.source)}` : "";
        const exportAttrs = node.attributes && node.attributes.length
          ? ` with { ${node.attributes.map(a => this.renderNode(a)).join(", ")} }`
          : "";
        return this.wrap("ExportNamedDeclaration", `export {${exportSpecs}}${exportFrom}${exportAttrs}`);

      case "ExportSpecifier":
        const exportedName = this.renderNode(node.exported);
        const exportLocalName = this.renderNode(node.local);
        return exportedName === exportLocalName ? exportLocalName : `${exportLocalName} as ${exportedName}`;

      case "ExportDefaultDeclaration":
        return this.wrap("ExportDefaultDeclaration", `export default ${this.renderNode(node.declaration, indent)}`);

      case "ExportAllDeclaration":
        const exportAllFrom = this.renderNode(node.source);
        const exportAllAs = node.exported ? ` as ${this.renderNode(node.exported)}` : "";
        const exportAllAttrs = node.attributes && node.attributes.length
          ? ` with { ${node.attributes.map(a => this.renderNode(a)).join(", ")} }`
          : "";
        return this.wrap("ExportAllDeclaration", `export *${exportAllAs} from ${exportAllFrom}${exportAllAttrs}`);

      case "ParenthesizedExpression":
        return `(${this.renderNode(node.expression)})`;

      default:
        return `/* Unknown: ${node.type} */`;
    }
  }
}

customElements.define("squirrel-pie", SquirrelPie);

export default SquirrelPie;
