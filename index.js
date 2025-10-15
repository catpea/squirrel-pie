import * as acorn from "https://cdn.jsdelivr.net/npm/acorn@8.15.0/+esm";

/**
 * SquirrelPie 2.0 - Clean, event-driven AST visualization
 * Following MDN conventions for readability and maintainability
 */
class SquirrelPie extends HTMLElement {
  static observedAttributes = ["value", "source-type", "theme"];

  // Private fields
  #sourcecode = "";
  #sourceType = "module";
  #theme = "";
  #ast = null;

  // Maps for bidirectional AST <-> DOM association
  #astToElement = new WeakMap();
  #elementToAst = new WeakMap();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.#initializeStyles();
    this.#initializeSlot();
  }

  connectedCallback() {
    this.#loadSourceCode();
    this.#render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "value":
        this.#sourcecode = this.#dedent(newValue);
        this.#render();
        break;
      case "source-type":
        this.#sourceType = newValue;
        this.#render();
        break;
      case "theme":
        this.#theme = newValue;
        this.#updateTheme();
        break;
    }
  }

  // Public API - Get AST node for any element
  getNodeForElement(element) {
    return this.#elementToAst.get(element);
  }

  // Public API - Get element for any AST node
  getElementForNode(node) {
    return this.#astToElement.get(node);
  }

  // Public API - Generate path for any node
  getPathForNode(node) {
    const path = [];
    const arrayPath = [];

    let current = node;
    while (current) {
      path.unshift(current.type);

      // Build array path
      if (current._parent && current._parentKey) {
        if (current._parentIndex !== undefined) {
          arrayPath.unshift(`${current._parentKey}[${current._parentIndex}]`);
        } else {
          arrayPath.unshift(current._parentKey);
        }
      }

      current = current._parent;
    }

    return {
      astPath: path.join(" > "),
      arrayPath: arrayPath.join("."),
      nodeType: node.type,
      node: node
    };
  }

  #initializeStyles() {
    const themeUrl = this.getAttribute("theme");

    if (themeUrl) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = themeUrl;
      this.shadowRoot.appendChild(link);
    } else {
      const style = document.createElement("style");
      style.textContent = this.#getDefaultStyles();
      this.shadowRoot.appendChild(style);
    }
  }

  #initializeSlot() {
    const template = document.createElement("template");
    const slot = document.createElement("slot");
    template.content.appendChild(slot);
    this.shadowRoot.appendChild(template);
  }

  #loadSourceCode() {
    if (this.hasAttribute("value")) {
      this.#sourcecode = this.getAttribute("value");
    } else {
      this.#sourcecode = this.textContent;
    }
    this.#sourcecode = this.#dedent(this.#sourcecode);
  }

  #dedent(text) {
    if (!text) return "";

    const lines = text.split("\n");
    while (lines.length > 0 && lines[0].trim() === "") lines.shift();
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

    if (lines.length === 0) return "";

    const indents = lines
      .filter(line => line.trim() !== "")
      .map(line => line.match(/^\s*/)[0].length);

    const minIndent = Math.min(...indents);
    return lines.map(line => line.slice(minIndent)).join("\n");
  }

  #updateTheme() {
    const existingStyle = this.shadowRoot.querySelector("style");
    const existingLink = this.shadowRoot.querySelector("link[rel='stylesheet']");

    if (existingStyle) existingStyle.remove();
    if (existingLink) existingLink.remove();

    if (this.#theme) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = this.#theme;
      this.shadowRoot.insertBefore(link, this.shadowRoot.firstChild);
    } else {
      const style = document.createElement("style");
      style.textContent = this.#getDefaultStyles();
      this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
    }
  }

  #render() {
    if (!this.#sourcecode || !this.#sourcecode.trim()) return;

    try {
      // Parse and augment AST with parent references
      this.#ast = this.#parseWithParents(this.#sourcecode);

      // Render to DOM
      const codeElement = document.createElement("code");
      this.#renderNode(this.#ast, codeElement, 0);

      // Add click handlers
      this.#attachClickHandlers(codeElement);

      // Replace existing code
      const existingCode = this.shadowRoot.querySelector("code");
      if (existingCode) existingCode.remove();
      this.shadowRoot.appendChild(codeElement);

    } catch (error) {
      console.error("Squirrel Pie parsing error:", error);
      this.#renderError(error.message);
    }
  }

  #parseWithParents(sourcecode) {
    const ast = acorn.parse(sourcecode, {
      ecmaVersion: 2022,
      sourceType: this.#sourceType,
    });

    // Walk AST and add parent references
    this.#addParentReferences(ast, null, null, null);
    return ast;
  }

  #addParentReferences(node, parent, parentKey, parentIndex) {
    if (!node || typeof node !== 'object') return;

    // Add metadata for path generation
    node._parent = parent;
    node._parentKey = parentKey;
    node._parentIndex = parentIndex;

    // Recurse through all properties
    for (const key in node) {
      if (key.startsWith('_') || key === 'loc' || key === 'range') continue;

      const value = node[key];

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === 'object' && item.type) {
            this.#addParentReferences(item, node, key, index);
          }
        });
      } else if (value && typeof value === 'object' && value.type) {
        this.#addParentReferences(value, node, key, null);
      }
    }
  }

  #renderNode(node, container, indent = 0) {
    if (!node) return;

    const renderer = this.#getRenderer(node.type);
    if (renderer) {
      renderer.call(this, node, container, indent);
    } else {
      this.#renderUnknown(node, container);
    }
  }

  #getRenderer(nodeType) {
    // Map node types to render methods
    const renderers = {
      // Existing renderers
      Program: this.#renderProgram,
      ClassDeclaration: this.#renderClass,
      ClassExpression: this.#renderClass,
      ClassBody: this.#renderClassBody,
      MethodDefinition: this.#renderMethodDefinition,
      FunctionDeclaration: this.#renderFunction,
      FunctionExpression: this.#renderFunction,
      ArrowFunctionExpression: this.#renderArrowFunction,
      BlockStatement: this.#renderBlockStatement,
      ExpressionStatement: this.#renderExpressionStatement,
      ReturnStatement: this.#renderReturnStatement,
      IfStatement: this.#renderIfStatement,
      VariableDeclaration: this.#renderVariableDeclaration,
      VariableDeclarator: this.#renderVariableDeclarator,
      CallExpression: this.#renderCallExpression,
      MemberExpression: this.#renderMemberExpression,
      BinaryExpression: this.#renderBinaryExpression,
      Identifier: this.#renderIdentifier,
      Literal: this.#renderLiteral,
      ObjectExpression: this.#renderObjectExpression,
      ArrayExpression: this.#renderArrayExpression,
      Property: this.#renderProperty,

      // New renderers for missing node types
      EmptyStatement: this.#renderEmptyStatement,
      DebuggerStatement: this.#renderDebuggerStatement,
      WithStatement: this.#renderWithStatement,
      LabeledStatement: this.#renderLabeledStatement,
      BreakStatement: this.#renderBreakStatement,
      ContinueStatement: this.#renderContinueStatement,
      SwitchStatement: this.#renderSwitchStatement,
      SwitchCase: this.#renderSwitchCase,
      ThrowStatement: this.#renderThrowStatement,
      TryStatement: this.#renderTryStatement,
      CatchClause: this.#renderCatchClause,
      WhileStatement: this.#renderWhileStatement,
      DoWhileStatement: this.#renderDoWhileStatement,
      ForStatement: this.#renderForStatement,
      ForInStatement: this.#renderForInStatement,
      ForOfStatement: this.#renderForOfStatement,
      ThisExpression: this.#renderThisExpression,
      UnaryExpression: this.#renderUnaryExpression,
      UpdateExpression: this.#renderUpdateExpression,
      AssignmentExpression: this.#renderAssignmentExpression,
      LogicalExpression: this.#renderLogicalExpression,
      ConditionalExpression: this.#renderConditionalExpression,
      NewExpression: this.#renderNewExpression,
      SequenceExpression: this.#renderSequenceExpression,
      Super: this.#renderSuper,
      SpreadElement: this.#renderSpreadElement,
      YieldExpression: this.#renderYieldExpression,
      TemplateLiteral: this.#renderTemplateLiteral,
      TaggedTemplateExpression: this.#renderTaggedTemplateExpression,
      TemplateElement: this.#renderTemplateElement,
      ObjectPattern: this.#renderObjectPattern,
      ArrayPattern: this.#renderArrayPattern,
      RestElement: this.#renderRestElement,
      AssignmentPattern: this.#renderAssignmentPattern,
      PropertyDefinition: this.#renderPropertyDefinition,
      StaticBlock: this.#renderStaticBlock,
      MetaProperty: this.#renderMetaProperty,
      ImportDeclaration: this.#renderImportDeclaration,
      ImportSpecifier: this.#renderImportSpecifier,
      ImportDefaultSpecifier: this.#renderImportDefaultSpecifier,
      ImportNamespaceSpecifier: this.#renderImportNamespaceSpecifier,
      ExportNamedDeclaration: this.#renderExportNamedDeclaration,
      ExportSpecifier: this.#renderExportSpecifier,
      ExportDefaultDeclaration: this.#renderExportDefaultDeclaration,
      ExportAllDeclaration: this.#renderExportAllDeclaration,
      AwaitExpression: this.#renderAwaitExpression,
      ChainExpression: this.#renderChainExpression,
      ImportExpression: this.#renderImportExpression,
      ParenthesizedExpression: this.#renderParenthesizedExpression,
      PrivateIdentifier: this.#renderPrivateIdentifier,
    };

    return renderers[nodeType];
  }

  #createSpan(node, className, textContent = null) {
    const span = document.createElement("span");
    span.className = className;
    span.title = className;

    if (textContent) {
      span.textContent = textContent;
    }

    // Associate element with node
    this.#astToElement.set(node, span);
    this.#elementToAst.set(span, node);

    return span;
  }

  // ===== EXISTING RENDERERS =====

  #renderProgram(node, container, indent) {
    node.body.forEach(statement => {
      this.#renderNode(statement, container, indent);
      container.appendChild(document.createTextNode("\n"));
    });
  }

  #renderClass(node, container, indent) {
    const wrapper = this.#createSpan(node, node.type);

    wrapper.appendChild(document.createTextNode("class "));

    if (node.id) {
      this.#renderNode(node.id, wrapper, 0);
    }

    if (node.superClass) {
      wrapper.appendChild(document.createTextNode(" extends "));
      this.#renderNode(node.superClass, wrapper, 0);
    }

    wrapper.appendChild(document.createTextNode(" "));
    this.#renderNode(node.body, wrapper, indent);

    container.appendChild(wrapper);
  }

  #renderClassBody(node, container, indent) {
    const wrapper = this.#createSpan(node, "ClassBody");

    wrapper.appendChild(document.createTextNode("{\n"));

    node.body.forEach(member => {
      wrapper.appendChild(document.createTextNode("  ".repeat(indent + 1)));
      this.#renderNode(member, wrapper, indent + 1);
      wrapper.appendChild(document.createTextNode("\n"));
    });

    wrapper.appendChild(document.createTextNode("  ".repeat(indent) + "}"));

    container.appendChild(wrapper);
  }

  #renderMethodDefinition(node, container, indent) {
    const wrapper = this.#createSpan(node, "MethodDefinition");

    if (node.static) {
      wrapper.appendChild(document.createTextNode("static "));
    }

    if (node.kind === "get") {
      wrapper.appendChild(document.createTextNode("get "));
    } else if (node.kind === "set") {
      wrapper.appendChild(document.createTextNode("set "));
    }

    this.#renderNode(node.key, wrapper, 0);
    wrapper.appendChild(document.createTextNode("("));

    node.value.params.forEach((param, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(param, wrapper, 0);
    });

    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.value.body, wrapper, indent);

    container.appendChild(wrapper);
  }

  #renderFunction(node, container, indent) {
    const wrapper = this.#createSpan(node, node.type);

    if (node.async) wrapper.appendChild(document.createTextNode("async "));
    wrapper.appendChild(document.createTextNode("function"));
    if (node.generator) wrapper.appendChild(document.createTextNode("*"));

    if (node.id) {
      wrapper.appendChild(document.createTextNode(" "));
      this.#renderNode(node.id, wrapper, 0);
    }

    wrapper.appendChild(document.createTextNode("("));
    node.params.forEach((param, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(param, wrapper, 0);
    });
    wrapper.appendChild(document.createTextNode(") "));

    this.#renderNode(node.body, wrapper, indent);

    container.appendChild(wrapper);
  }

  #renderArrowFunction(node, container, indent) {
    const wrapper = this.#createSpan(node, "ArrowFunctionExpression");

    if (node.async) wrapper.appendChild(document.createTextNode("async "));

    if (node.params.length === 1 && node.params[0].type === "Identifier") {
      this.#renderNode(node.params[0], wrapper, 0);
    } else {
      wrapper.appendChild(document.createTextNode("("));
      node.params.forEach((param, i) => {
        if (i > 0) wrapper.appendChild(document.createTextNode(", "));
        this.#renderNode(param, wrapper, 0);
      });
      wrapper.appendChild(document.createTextNode(")"));
    }

    wrapper.appendChild(document.createTextNode(" => "));
    this.#renderNode(node.body, wrapper, indent);

    container.appendChild(wrapper);
  }

  #renderBlockStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "BlockStatement");

    wrapper.appendChild(document.createTextNode("{\n"));

    node.body.forEach(statement => {
      wrapper.appendChild(document.createTextNode("  ".repeat(indent + 1)));
      this.#renderNode(statement, wrapper, indent + 1);
      wrapper.appendChild(document.createTextNode("\n"));
    });

    wrapper.appendChild(document.createTextNode("  ".repeat(indent) + "}"));

    container.appendChild(wrapper);
  }

  #renderExpressionStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ExpressionStatement");
    this.#renderNode(node.expression, wrapper, indent);
    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderReturnStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ReturnStatement");
    wrapper.appendChild(document.createTextNode("return"));

    if (node.argument) {
      wrapper.appendChild(document.createTextNode(" "));
      this.#renderNode(node.argument, wrapper, indent);
    }

    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderIfStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "IfStatement");

    wrapper.appendChild(document.createTextNode("if ("));
    this.#renderNode(node.test, wrapper, 0);
    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.consequent, wrapper, indent);

    if (node.alternate) {
      wrapper.appendChild(document.createTextNode(" else "));
      this.#renderNode(node.alternate, wrapper, indent);
    }

    container.appendChild(wrapper);
  }

  #renderVariableDeclaration(node, container, indent) {
    const wrapper = this.#createSpan(node, "VariableDeclaration");

    wrapper.appendChild(document.createTextNode(node.kind + " "));

    node.declarations.forEach((decl, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(decl, wrapper, 0);
    });

    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderVariableDeclarator(node, container, indent) {
    const wrapper = this.#createSpan(node, "VariableDeclarator");

    this.#renderNode(node.id, wrapper, 0);

    if (node.init) {
      wrapper.appendChild(document.createTextNode(" = "));
      this.#renderNode(node.init, wrapper, 0);
    }

    container.appendChild(wrapper);
  }

  #renderCallExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "CallExpression");

    this.#renderNode(node.callee, wrapper, 0);

    if (node.optional) {
      wrapper.appendChild(document.createTextNode("?."));
    }

    wrapper.appendChild(document.createTextNode("("));

    node.arguments.forEach((arg, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(arg, wrapper, 0);
    });

    wrapper.appendChild(document.createTextNode(")"));

    container.appendChild(wrapper);
  }

  #renderMemberExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "MemberExpression");

    this.#renderNode(node.object, wrapper, 0);

    if (node.computed) {
      wrapper.appendChild(document.createTextNode("["));
      this.#renderNode(node.property, wrapper, 0);
      wrapper.appendChild(document.createTextNode("]"));
    } else {
      if (node.optional) {
        wrapper.appendChild(document.createTextNode("?."));
      } else {
        wrapper.appendChild(document.createTextNode("."));
      }
      this.#renderNode(node.property, wrapper, 0);
    }

    container.appendChild(wrapper);
  }

  #renderBinaryExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "BinaryExpression");

    this.#renderNode(node.left, wrapper, 0);
    wrapper.appendChild(document.createTextNode(` ${node.operator} `));
    this.#renderNode(node.right, wrapper, 0);

    container.appendChild(wrapper);
  }

  #renderObjectExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "ObjectExpression");

    wrapper.appendChild(document.createTextNode("{"));

    node.properties.forEach((prop, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(prop, wrapper, indent);
    });

    wrapper.appendChild(document.createTextNode("}"));

    container.appendChild(wrapper);
  }

  #renderArrayExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "ArrayExpression");

    wrapper.appendChild(document.createTextNode("["));

    node.elements.forEach((elem, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      if (elem) {
        this.#renderNode(elem, wrapper, indent);
      }
    });

    wrapper.appendChild(document.createTextNode("]"));

    container.appendChild(wrapper);
  }

  #renderProperty(node, container, indent) {
    const wrapper = this.#createSpan(node, "Property");

    if (node.method) {
      // Method shorthand: { foo() {} }
      if (node.kind === "get") {
        wrapper.appendChild(document.createTextNode("get "));
      } else if (node.kind === "set") {
        wrapper.appendChild(document.createTextNode("set "));
      }
      this.#renderNode(node.key, wrapper, 0);
      wrapper.appendChild(document.createTextNode("("));
      if (node.value.params) {
        node.value.params.forEach((param, i) => {
          if (i > 0) wrapper.appendChild(document.createTextNode(", "));
          this.#renderNode(param, wrapper, 0);
        });
      }
      wrapper.appendChild(document.createTextNode(") "));
      this.#renderNode(node.value.body, wrapper, indent);
    } else {
      this.#renderNode(node.key, wrapper, 0);
      if (!node.shorthand) {
        wrapper.appendChild(document.createTextNode(": "));
        this.#renderNode(node.value, wrapper, 0);
      }
    }

    container.appendChild(wrapper);
  }

  #renderIdentifier(node, container, indent) {
    const span = this.#createSpan(node, "Identifier", node.name);
    container.appendChild(span);
  }

  #renderLiteral(node, container, indent) {
    const span = this.#createSpan(node, "Literal", node.raw);
    container.appendChild(span);
  }

  // ===== NEW RENDERERS FOR MISSING NODE TYPES =====

  #renderEmptyStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "EmptyStatement", ";");
    container.appendChild(wrapper);
  }

  #renderDebuggerStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "DebuggerStatement", "debugger;");
    container.appendChild(wrapper);
  }

  #renderWithStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "WithStatement");
    wrapper.appendChild(document.createTextNode("with ("));
    this.#renderNode(node.object, wrapper, 0);
    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderLabeledStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "LabeledStatement");
    this.#renderNode(node.label, wrapper, 0);
    wrapper.appendChild(document.createTextNode(": "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderBreakStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "BreakStatement");
    wrapper.appendChild(document.createTextNode("break"));
    if (node.label) {
      wrapper.appendChild(document.createTextNode(" "));
      this.#renderNode(node.label, wrapper, 0);
    }
    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderContinueStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ContinueStatement");
    wrapper.appendChild(document.createTextNode("continue"));
    if (node.label) {
      wrapper.appendChild(document.createTextNode(" "));
      this.#renderNode(node.label, wrapper, 0);
    }
    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderSwitchStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "SwitchStatement");
    wrapper.appendChild(document.createTextNode("switch ("));
    this.#renderNode(node.discriminant, wrapper, 0);
    wrapper.appendChild(document.createTextNode(") {\n"));

    node.cases.forEach(caseNode => {
      wrapper.appendChild(document.createTextNode("  ".repeat(indent + 1)));
      this.#renderNode(caseNode, wrapper, indent + 1);
    });

    wrapper.appendChild(document.createTextNode("  ".repeat(indent) + "}"));
    container.appendChild(wrapper);
  }

  #renderSwitchCase(node, container, indent) {
    const wrapper = this.#createSpan(node, "SwitchCase");

    if (node.test) {
      wrapper.appendChild(document.createTextNode("case "));
      this.#renderNode(node.test, wrapper, 0);
      wrapper.appendChild(document.createTextNode(":\n"));
    } else {
      wrapper.appendChild(document.createTextNode("default:\n"));
    }

    node.consequent.forEach(statement => {
      wrapper.appendChild(document.createTextNode("  ".repeat(indent + 1)));
      this.#renderNode(statement, wrapper, indent + 1);
      wrapper.appendChild(document.createTextNode("\n"));
    });

    container.appendChild(wrapper);
  }

  #renderThrowStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ThrowStatement");
    wrapper.appendChild(document.createTextNode("throw "));
    this.#renderNode(node.argument, wrapper, indent);
    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderTryStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "TryStatement");
    wrapper.appendChild(document.createTextNode("try "));
    this.#renderNode(node.block, wrapper, indent);

    if (node.handler) {
      wrapper.appendChild(document.createTextNode(" "));
      this.#renderNode(node.handler, wrapper, indent);
    }

    if (node.finalizer) {
      wrapper.appendChild(document.createTextNode(" finally "));
      this.#renderNode(node.finalizer, wrapper, indent);
    }

    container.appendChild(wrapper);
  }

  #renderCatchClause(node, container, indent) {
    const wrapper = this.#createSpan(node, "CatchClause");
    wrapper.appendChild(document.createTextNode("catch"));

    if (node.param) {
      wrapper.appendChild(document.createTextNode(" ("));
      this.#renderNode(node.param, wrapper, 0);
      wrapper.appendChild(document.createTextNode(")"));
    }

    wrapper.appendChild(document.createTextNode(" "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderWhileStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "WhileStatement");
    wrapper.appendChild(document.createTextNode("while ("));
    this.#renderNode(node.test, wrapper, 0);
    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderDoWhileStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "DoWhileStatement");
    wrapper.appendChild(document.createTextNode("do "));
    this.#renderNode(node.body, wrapper, indent);
    wrapper.appendChild(document.createTextNode(" while ("));
    this.#renderNode(node.test, wrapper, 0);
    wrapper.appendChild(document.createTextNode(");"));
    container.appendChild(wrapper);
  }

  #renderForStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ForStatement");
    wrapper.appendChild(document.createTextNode("for ("));

    if (node.init) {
      this.#renderNode(node.init, wrapper, 0);
      // Remove semicolon if VariableDeclaration added it
      if (node.init.type === "VariableDeclaration" && wrapper.lastChild.textContent.endsWith(";")) {
        wrapper.lastChild.textContent = wrapper.lastChild.textContent.slice(0, -1);
      }
    }
    wrapper.appendChild(document.createTextNode("; "));

    if (node.test) {
      this.#renderNode(node.test, wrapper, 0);
    }
    wrapper.appendChild(document.createTextNode("; "));

    if (node.update) {
      this.#renderNode(node.update, wrapper, 0);
    }

    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderForInStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ForInStatement");
    wrapper.appendChild(document.createTextNode("for ("));
    this.#renderNode(node.left, wrapper, 0);
    // Remove semicolon if VariableDeclaration added it
    if (node.left.type === "VariableDeclaration" && wrapper.lastChild.textContent.endsWith(";")) {
      wrapper.lastChild.textContent = wrapper.lastChild.textContent.slice(0, -1);
    }
    wrapper.appendChild(document.createTextNode(" in "));
    this.#renderNode(node.right, wrapper, 0);
    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderForOfStatement(node, container, indent) {
    const wrapper = this.#createSpan(node, "ForOfStatement");
    wrapper.appendChild(document.createTextNode("for "));
    if (node.await) {
      wrapper.appendChild(document.createTextNode("await "));
    }
    wrapper.appendChild(document.createTextNode("("));
    this.#renderNode(node.left, wrapper, 0);
    // Remove semicolon if VariableDeclaration added it
    if (node.left.type === "VariableDeclaration" && wrapper.lastChild.textContent.endsWith(";")) {
      wrapper.lastChild.textContent = wrapper.lastChild.textContent.slice(0, -1);
    }
    wrapper.appendChild(document.createTextNode(" of "));
    this.#renderNode(node.right, wrapper, 0);
    wrapper.appendChild(document.createTextNode(") "));
    this.#renderNode(node.body, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderThisExpression(node, container, indent) {
    const span = this.#createSpan(node, "ThisExpression", "this");
    container.appendChild(span);
  }

  #renderUnaryExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "UnaryExpression");

    if (node.prefix) {
      wrapper.appendChild(document.createTextNode(node.operator));
      if (node.operator === "typeof" || node.operator === "void" || node.operator === "delete") {
        wrapper.appendChild(document.createTextNode(" "));
      }
      this.#renderNode(node.argument, wrapper, indent);
    } else {
      this.#renderNode(node.argument, wrapper, indent);
      wrapper.appendChild(document.createTextNode(node.operator));
    }

    container.appendChild(wrapper);
  }

  #renderUpdateExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "UpdateExpression");

    if (node.prefix) {
      wrapper.appendChild(document.createTextNode(node.operator));
      this.#renderNode(node.argument, wrapper, indent);
    } else {
      this.#renderNode(node.argument, wrapper, indent);
      wrapper.appendChild(document.createTextNode(node.operator));
    }

    container.appendChild(wrapper);
  }

  #renderAssignmentExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "AssignmentExpression");
    this.#renderNode(node.left, wrapper, 0);
    wrapper.appendChild(document.createTextNode(` ${node.operator} `));
    this.#renderNode(node.right, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderLogicalExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "LogicalExpression");
    this.#renderNode(node.left, wrapper, 0);
    wrapper.appendChild(document.createTextNode(` ${node.operator} `));
    this.#renderNode(node.right, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderConditionalExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "ConditionalExpression");
    this.#renderNode(node.test, wrapper, 0);
    wrapper.appendChild(document.createTextNode(" ? "));
    this.#renderNode(node.consequent, wrapper, 0);
    wrapper.appendChild(document.createTextNode(" : "));
    this.#renderNode(node.alternate, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderNewExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "NewExpression");
    wrapper.appendChild(document.createTextNode("new "));
    this.#renderNode(node.callee, wrapper, 0);
    wrapper.appendChild(document.createTextNode("("));

    node.arguments.forEach((arg, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(arg, wrapper, 0);
    });

    wrapper.appendChild(document.createTextNode(")"));
    container.appendChild(wrapper);
  }

  #renderSequenceExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "SequenceExpression");

    node.expressions.forEach((expr, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(expr, wrapper, indent);
    });

    container.appendChild(wrapper);
  }

  #renderSuper(node, container, indent) {
    const span = this.#createSpan(node, "Super", "super");
    container.appendChild(span);
  }

  #renderSpreadElement(node, container, indent) {
    const wrapper = this.#createSpan(node, "SpreadElement");
    wrapper.appendChild(document.createTextNode("..."));
    this.#renderNode(node.argument, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderYieldExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "YieldExpression");
    wrapper.appendChild(document.createTextNode("yield"));
    if (node.delegate) {
      wrapper.appendChild(document.createTextNode("*"));
    }
    if (node.argument) {
      wrapper.appendChild(document.createTextNode(" "));
      this.#renderNode(node.argument, wrapper, indent);
    }
    container.appendChild(wrapper);
  }

  #renderTemplateLiteral(node, container, indent) {
    const wrapper = this.#createSpan(node, "TemplateLiteral");
    wrapper.appendChild(document.createTextNode("`"));

    for (let i = 0; i < node.quasis.length; i++) {
      this.#renderNode(node.quasis[i], wrapper, indent);
      if (i < node.expressions.length) {
        wrapper.appendChild(document.createTextNode("${"));
        this.#renderNode(node.expressions[i], wrapper, indent);
        wrapper.appendChild(document.createTextNode("}"));
      }
    }

    wrapper.appendChild(document.createTextNode("`"));
    container.appendChild(wrapper);
  }

  #renderTaggedTemplateExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "TaggedTemplateExpression");
    this.#renderNode(node.tag, wrapper, 0);
    this.#renderNode(node.quasi, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderTemplateElement(node, container, indent) {
    const span = this.#createSpan(node, "TemplateElement", node.value.raw);
    container.appendChild(span);
  }

  #renderObjectPattern(node, container, indent) {
    const wrapper = this.#createSpan(node, "ObjectPattern");
    wrapper.appendChild(document.createTextNode("{"));

    node.properties.forEach((prop, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(prop, wrapper, indent);
    });

    wrapper.appendChild(document.createTextNode("}"));
    container.appendChild(wrapper);
  }

  #renderArrayPattern(node, container, indent) {
    const wrapper = this.#createSpan(node, "ArrayPattern");
    wrapper.appendChild(document.createTextNode("["));

    node.elements.forEach((elem, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(", "));
      if (elem) {
        this.#renderNode(elem, wrapper, indent);
      }
    });

    wrapper.appendChild(document.createTextNode("]"));
    container.appendChild(wrapper);
  }

  #renderRestElement(node, container, indent) {
    const wrapper = this.#createSpan(node, "RestElement");
    wrapper.appendChild(document.createTextNode("..."));
    this.#renderNode(node.argument, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderAssignmentPattern(node, container, indent) {
    const wrapper = this.#createSpan(node, "AssignmentPattern");
    this.#renderNode(node.left, wrapper, 0);
    wrapper.appendChild(document.createTextNode(" = "));
    this.#renderNode(node.right, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderPropertyDefinition(node, container, indent) {
    const wrapper = this.#createSpan(node, "PropertyDefinition");

    if (node.static) {
      wrapper.appendChild(document.createTextNode("static "));
    }

    this.#renderNode(node.key, wrapper, 0);

    if (node.value) {
      wrapper.appendChild(document.createTextNode(" = "));
      this.#renderNode(node.value, wrapper, 0);
    }

    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderStaticBlock(node, container, indent) {
    const wrapper = this.#createSpan(node, "StaticBlock");
    wrapper.appendChild(document.createTextNode("static {\n"));

    node.body.forEach(statement => {
      wrapper.appendChild(document.createTextNode("  ".repeat(indent + 1)));
      this.#renderNode(statement, wrapper, indent + 1);
      wrapper.appendChild(document.createTextNode("\n"));
    });

    wrapper.appendChild(document.createTextNode("  ".repeat(indent) + "}"));
    container.appendChild(wrapper);
  }

  #renderMetaProperty(node, container, indent) {
    const wrapper = this.#createSpan(node, "MetaProperty");
    this.#renderNode(node.meta, wrapper, 0);
    wrapper.appendChild(document.createTextNode("."));
    this.#renderNode(node.property, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderImportDeclaration(node, container, indent) {
    const wrapper = this.#createSpan(node, "ImportDeclaration");
    wrapper.appendChild(document.createTextNode("import "));

    if (node.specifiers.length > 0) {
      const defaultSpecs = node.specifiers.filter(s => s.type === "ImportDefaultSpecifier");
      const namespaceSpecs = node.specifiers.filter(s => s.type === "ImportNamespaceSpecifier");
      const namedSpecs = node.specifiers.filter(s => s.type === "ImportSpecifier");

      defaultSpecs.forEach(spec => {
        this.#renderNode(spec, wrapper, 0);
      });

      if (defaultSpecs.length > 0 && (namespaceSpecs.length > 0 || namedSpecs.length > 0)) {
        wrapper.appendChild(document.createTextNode(", "));
      }

      namespaceSpecs.forEach(spec => {
        this.#renderNode(spec, wrapper, 0);
      });

      if (namespaceSpecs.length > 0 && namedSpecs.length > 0) {
        wrapper.appendChild(document.createTextNode(", "));
      }

      if (namedSpecs.length > 0) {
        wrapper.appendChild(document.createTextNode("{ "));
        namedSpecs.forEach((spec, i) => {
          if (i > 0) wrapper.appendChild(document.createTextNode(", "));
          this.#renderNode(spec, wrapper, 0);
        });
        wrapper.appendChild(document.createTextNode(" }"));
      }

      wrapper.appendChild(document.createTextNode(" from "));
    }

    this.#renderNode(node.source, wrapper, 0);

    if (node.attributes && node.attributes.length > 0) {
      wrapper.appendChild(document.createTextNode(" with { "));
      node.attributes.forEach((attr, i) => {
        if (i > 0) wrapper.appendChild(document.createTextNode(", "));
        this.#renderNode(attr.key, wrapper, 0);
        wrapper.appendChild(document.createTextNode(": "));
        this.#renderNode(attr.value, wrapper, 0);
      });
      wrapper.appendChild(document.createTextNode(" }"));
    }

    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderImportSpecifier(node, container, indent) {
    const wrapper = this.#createSpan(node, "ImportSpecifier");
    this.#renderNode(node.imported, wrapper, 0);
    if (node.local.name !== (node.imported.name || node.imported.value)) {
      wrapper.appendChild(document.createTextNode(" as "));
      this.#renderNode(node.local, wrapper, 0);
    }
    container.appendChild(wrapper);
  }

  #renderImportDefaultSpecifier(node, container, indent) {
    const wrapper = this.#createSpan(node, "ImportDefaultSpecifier");
    this.#renderNode(node.local, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderImportNamespaceSpecifier(node, container, indent) {
    const wrapper = this.#createSpan(node, "ImportNamespaceSpecifier");
    wrapper.appendChild(document.createTextNode("* as "));
    this.#renderNode(node.local, wrapper, 0);
    container.appendChild(wrapper);
  }

  #renderExportNamedDeclaration(node, container, indent) {
    const wrapper = this.#createSpan(node, "ExportNamedDeclaration");
    wrapper.appendChild(document.createTextNode("export "));

    if (node.declaration) {
      this.#renderNode(node.declaration, wrapper, indent);
      // Remove the semicolon that declaration might add, we'll add it at the end
      if (wrapper.lastChild.textContent.endsWith(";")) {
        wrapper.lastChild.textContent = wrapper.lastChild.textContent.slice(0, -1);
      }
    } else {
      wrapper.appendChild(document.createTextNode("{ "));
      node.specifiers.forEach((spec, i) => {
        if (i > 0) wrapper.appendChild(document.createTextNode(", "));
        this.#renderNode(spec, wrapper, 0);
      });
      wrapper.appendChild(document.createTextNode(" }"));

      if (node.source) {
        wrapper.appendChild(document.createTextNode(" from "));
        this.#renderNode(node.source, wrapper, 0);
      }
    }

    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderExportSpecifier(node, container, indent) {
    const wrapper = this.#createSpan(node, "ExportSpecifier");
    this.#renderNode(node.local, wrapper, 0);
    if ((node.exported.name || node.exported.value) !== (node.local.name || node.local.value)) {
      wrapper.appendChild(document.createTextNode(" as "));
      this.#renderNode(node.exported, wrapper, 0);
    }
    container.appendChild(wrapper);
  }

  #renderExportDefaultDeclaration(node, container, indent) {
    const wrapper = this.#createSpan(node, "ExportDefaultDeclaration");
    wrapper.appendChild(document.createTextNode("export default "));
    this.#renderNode(node.declaration, wrapper, indent);
    // Remove semicolon from declaration, we'll add it
    if (wrapper.lastChild.textContent.endsWith(";")) {
      wrapper.lastChild.textContent = wrapper.lastChild.textContent.slice(0, -1);
    }
    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderExportAllDeclaration(node, container, indent) {
    const wrapper = this.#createSpan(node, "ExportAllDeclaration");
    wrapper.appendChild(document.createTextNode("export *"));

    if (node.exported) {
      wrapper.appendChild(document.createTextNode(" as "));
      this.#renderNode(node.exported, wrapper, 0);
    }

    wrapper.appendChild(document.createTextNode(" from "));
    this.#renderNode(node.source, wrapper, 0);
    wrapper.appendChild(document.createTextNode(";"));
    container.appendChild(wrapper);
  }

  #renderAwaitExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "AwaitExpression");
    wrapper.appendChild(document.createTextNode("await "));
    this.#renderNode(node.argument, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderChainExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "ChainExpression");
    this.#renderNode(node.expression, wrapper, indent);
    container.appendChild(wrapper);
  }

  #renderImportExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "ImportExpression");
    wrapper.appendChild(document.createTextNode("import("));
    this.#renderNode(node.source, wrapper, indent);
    if (node.options) {
      wrapper.appendChild(document.createTextNode(", "));
      this.#renderNode(node.options, wrapper, indent);
    }
    wrapper.appendChild(document.createTextNode(")"));
    container.appendChild(wrapper);
  }

  #renderParenthesizedExpression(node, container, indent) {
    const wrapper = this.#createSpan(node, "ParenthesizedExpression");
    wrapper.appendChild(document.createTextNode("("));
    this.#renderNode(node.expression, wrapper, indent);
    wrapper.appendChild(document.createTextNode(")"));
    container.appendChild(wrapper);
  }

  #renderPrivateIdentifier(node, container, indent) {
    const span = this.#createSpan(node, "PrivateIdentifier", "#" + node.name);
    container.appendChild(span);
  }

  #renderUnknown(node, container) {
    const span = document.createElement("span");
    span.className = "Unknown";
    span.textContent = `/* ${node.type} */`;
    container.appendChild(span);
  }

  #renderError(message) {
    const errorElement = document.createElement("code");
    errorElement.style.color = "#f48771";
    errorElement.textContent = `Parse Error: ${message}`;

    const existingCode = this.shadowRoot.querySelector("code");
    if (existingCode) existingCode.remove();
    this.shadowRoot.appendChild(errorElement);
  }

  #attachClickHandlers(container) {
    container.addEventListener("click", (e) => {
      const target = e.target.closest("span[class]");
      if (!target) return;

      const node = this.#elementToAst.get(target);
      if (!node) return;

      e.stopPropagation();

      // Generate path dynamically
      const pathInfo = this.getPathForNode(node);

      // Dispatch custom event with rich data
      this.dispatchEvent(new CustomEvent("squirrel", {
        bubbles: true,
        composed: true,
        detail: {
          node: node,
          element: target,
          astPath: pathInfo.astPath,
          arrayPath: pathInfo.arrayPath,
          nodeType: pathInfo.nodeType,
          source: this
        }
      }));
    });
  }

  #getDefaultStyles() {
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
      span {
        cursor: pointer;
      }
      span:hover {
        background: #264f78;
      }
      .Program { color: #d4d4d4; }
      .ClassDeclaration { color: #4ec9b0; font-weight: 600; }
      .ClassExpression { color: #4ec9b0; }
      .ClassBody { color: #d4d4d4; }
      .MethodDefinition { color: #dcdcaa; }
      .FunctionDeclaration { color: #dcdcaa; font-weight: 600; }
      .FunctionExpression { color: #dcdcaa; }
      .ArrowFunctionExpression { color: #dcdcaa; }
      .BlockStatement { color: #d4d4d4; }
      .ExpressionStatement { color: #d4d4d4; }
      .ReturnStatement { color: #c586c0; font-weight: 600; }
      .IfStatement { color: #c586c0; font-weight: 600; }
      .VariableDeclaration { color: #569cd6; font-weight: 600; }
      .VariableDeclarator { color: #d4d4d4; }
      .CallExpression { color: #dcdcaa; }
      .MemberExpression { color: #9cdcfe; }
      .BinaryExpression { color: #d4d4d4; }
      .ObjectExpression { color: #d4d4d4; }
      .ArrayExpression { color: #d4d4d4; }
      .Property { color: #9cdcfe; }
      .Identifier { color: #9cdcfe; }
      .Literal { color: #b5cea8; }
      .Unknown { color: #f48771; }

      /* New node type styles */
      .EmptyStatement { color: #d4d4d4; }
      .DebuggerStatement { color: #c586c0; font-weight: 600; }
      .WithStatement { color: #c586c0; font-weight: 600; }
      .LabeledStatement { color: #d4d4d4; }
      .BreakStatement { color: #c586c0; font-weight: 600; }
      .ContinueStatement { color: #c586c0; font-weight: 600; }
      .SwitchStatement { color: #c586c0; font-weight: 600; }
      .SwitchCase { color: #c586c0; }
      .ThrowStatement { color: #c586c0; font-weight: 600; }
      .TryStatement { color: #c586c0; font-weight: 600; }
      .CatchClause { color: #c586c0; font-weight: 600; }
      .WhileStatement { color: #c586c0; font-weight: 600; }
      .DoWhileStatement { color: #c586c0; font-weight: 600; }
      .ForStatement { color: #c586c0; font-weight: 600; }
      .ForInStatement { color: #c586c0; font-weight: 600; }
      .ForOfStatement { color: #c586c0; font-weight: 600; }
      .ThisExpression { color: #569cd6; font-weight: 600; }
      .UnaryExpression { color: #d4d4d4; }
      .UpdateExpression { color: #d4d4d4; }
      .AssignmentExpression { color: #d4d4d4; }
      .LogicalExpression { color: #d4d4d4; }
      .ConditionalExpression { color: #d4d4d4; }
      .NewExpression { color: #569cd6; font-weight: 600; }
      .SequenceExpression { color: #d4d4d4; }
      .Super { color: #569cd6; font-weight: 600; }
      .SpreadElement { color: #d4d4d4; }
      .YieldExpression { color: #c586c0; font-weight: 600; }
      .TemplateLiteral { color: #ce9178; }
      .TaggedTemplateExpression { color: #dcdcaa; }
      .TemplateElement { color: #ce9178; }
      .ObjectPattern { color: #9cdcfe; }
      .ArrayPattern { color: #9cdcfe; }
      .RestElement { color: #9cdcfe; }
      .AssignmentPattern { color: #9cdcfe; }
      .PropertyDefinition { color: #9cdcfe; }
      .StaticBlock { color: #569cd6; font-weight: 600; }
      .MetaProperty { color: #569cd6; }
      .ImportDeclaration { color: #c586c0; font-weight: 600; }
      .ImportSpecifier { color: #9cdcfe; }
      .ImportDefaultSpecifier { color: #9cdcfe; }
      .ImportNamespaceSpecifier { color: #9cdcfe; }
      .ExportNamedDeclaration { color: #c586c0; font-weight: 600; }
      .ExportSpecifier { color: #9cdcfe; }
      .ExportDefaultDeclaration { color: #c586c0; font-weight: 600; }
      .ExportAllDeclaration { color: #c586c0; font-weight: 600; }
      .AwaitExpression { color: #c586c0; font-weight: 600; }
      .ChainExpression { color: #d4d4d4; }
      .ImportExpression { color: #dcdcaa; }
      .ParenthesizedExpression { color: #d4d4d4; }
      .PrivateIdentifier { color: #9cdcfe; }
    `;
  }
}

customElements.define("squirrel-pie", SquirrelPie);
export default SquirrelPie;
