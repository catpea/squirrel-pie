 import * as acorn from "https://cdn.jsdelivr.net/npm/acorn@8.15.0/+esm";

      // TODO: make sure that we use template as the the main slot, so that the code content is not rendered
      class AraAra extends HTMLElement {
        static observedAttributes = ["value", "sourceType"];

        #sourcecode; //this should hold the sourcecode pulled from main slot within the template element

        constructor() {
          super();
          const shadow = this.attachShadow({ mode: "open" });
          // TODO: create template that hosts the main slot, or whatever you choose
          // TODO: shadow.appendChild(...);
        }

        connectedCallback() {
          const ast = this.parseCode(this.#sourcecode);
          const astHtml = this.renderNode(ast);

          const outputElement = document.createElement("code");
          outputElement.innerHTML = astHtml;
          this.shadowRoot.appendChild(outputElement);
        }

        parse(sourcecode) {
          const ast = acorn.parse(sourcecode, {
            ecmaVersion: 2022,
            sourceType: "module",
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
              return node.body.map((n) => renderNode(n, indent)).join("\n");

            case "ClassDeclaration":
              const className = this.wrap("Identifier", node.id.name);
              const classBody = renderNode(node.body, indent);
              return this.wrap("ClassDeclaration", `class ${className} ${classBody}`);

            case "ClassBody":
              const methods = node.body.map((n) => renderNode(n, indent + 1)).join("\n");
              return this.wrap("ClassBody", `{\n${methods}\n${ind}}`);

            case "MethodDefinition":
              const prefix = node.kind === "get" ? "get " : node.kind === "set" ? "set " : "";
              const methodName = this.wrap("Identifier", node.key.name);
              const params = node.value.params.map((p) => renderNode(p)).join(", ");
              const body = renderNode(node.value.body, indent);
              return `${ind}${this.wrap("MethodDefinition", prefix + methodName)}(${params}) ${body}`;

            case "FunctionDeclaration":
              const fnName = this.wrap("Identifier", node.id.name);
              const fnParams = node.params.map((p) => renderNode(p)).join(", ");
              const fnBody = renderNode(node.body, indent);
              return this.wrap("FunctionDeclaration", `function ${fnName}(${fnParams}) ${fnBody}`);

            case "FunctionExpression":
              const fParams = node.params.map((p) => renderNode(p)).join(", ");
              const fBody = renderNode(node.body, indent);
              return this.wrap("FunctionExpression", `function (${fParams}) ${fBody}`);

            case "BlockStatement":
              const statements = node.body.map((n) => renderNode(n, indent + 1)).join("\n");
              return this.wrap("BlockStatement", `{\n${statements}\n${ind}}`);

            case "ExpressionStatement":
              return `${ind}${this.wrap("ExpressionStatement", renderNode(node.expression))};`;

            case "ReturnStatement":
              return `${ind}${this.wrap("ReturnStatement", "return " + renderNode(node.argument))}`;

            case "VariableDeclaration":
              const decls = node.declarations.map((d) => renderNode(d)).join(", ");
              return this.wrap("VariableDeclaration", `${node.kind} ${decls}`);

            case "VariableDeclarator":
              const varId = renderNode(node.id);
              const varInit = node.init ? " = " + renderNode(node.init) : "";
              return this.wrap("VariableDeclarator", varId + varInit);

            case "AssignmentExpression":
              const left = renderNode(node.left);
              const right = renderNode(node.right);
              return this.wrap("AssignmentExpression", `${left} ${node.operator} ${right}`);

            case "BinaryExpression":
              const binLeft = renderNode(node.left);
              const binRight = renderNode(node.right);
              return this.wrap("BinaryExpression", `${binLeft} ${node.operator} ${binRight}`);

            case "CallExpression":
              const callee = renderNode(node.callee);
              const args = node.arguments.map((a) => renderNode(a)).join(", ");
              return this.wrap("CallExpression", `${callee}(${args})`);

            case "NewExpression":
              const newCallee = renderNode(node.callee);
              const newArgs = node.arguments.map((a) => renderNode(a)).join(", ");
              return this.wrap("NewExpression", `new ${newCallee}(${newArgs})`);

            case "MemberExpression":
              const obj = renderNode(node.object);
              const prop = node.computed ? `[${renderNode(node.property)}]` : `.${renderNode(node.property)}`;
              return this.wrap("MemberExpression", obj + prop);

            case "ThisExpression":
              return this.wrap("ThisExpression", "this");

            case "Identifier":
              return this.wrap("Identifier", node.name);

            case "Literal":
              return this.wrap("Literal", node.raw);

            default:
              return `/* Unknown: ${node.type} */`;
          }
        }
      }

      // Define the custom element
      customElements.define("ara-ara", AraAra);
