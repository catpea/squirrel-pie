# 🎨 Squirrel Pie Theme Guide

Themes in Squirrel Pie are more than just pretty colors - they're an **educational tool** for learning JavaScript's Abstract Syntax Tree (AST) structure!

## Why Themes Matter for Learning

When you create or customize a theme, you're not just picking colors - you're learning how JavaScript code is parsed and understood. Each CSS class represents a specific AST node type, teaching you:

- **What makes a function**: `FunctionDeclaration` vs `FunctionExpression` vs `ArrowFunctionExpression`
- **How control flow works**: `IfStatement`, `SwitchStatement`, `ForStatement`, `WhileStatement`
- **Expression types**: `CallExpression`, `BinaryExpression`, `MemberExpression`
- **Modern syntax**: `SpreadElement`, `RestElement`, `AwaitExpression`, `YieldExpression`

## Using Themes

### Default Theme
```html
<squirrel-pie>
  const greet = name => `Hello, ${name}!`;
</squirrel-pie>
```

### External Theme
```html
<squirrel-pie theme="./my-theme.css">
  const greet = name => `Hello, ${name}!`;
</squirrel-pie>
```

### CDN Theme
```html
<squirrel-pie theme="https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/gruvbox.css">
  const greet = name => `Hello, ${name}!`;
</squirrel-pie>
```

## Available Themes

### 1. Default (VS Code Dark+)
Built-in, no theme attribute needed. Modern dark theme inspired by VS Code.

**Best for:** General use, familiar look

### 2. Basic Light (`basic.css`)
Clean, minimalist light theme with excellent readability.

**Best for:** Documentation, printing, presentations

**URL:** `https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/basic.css`

### 3. Solarized Dark (`solarized.css`)
The classic Solarized color scheme - easy on the eyes.

**Best for:** Long coding sessions, reduced eye strain

**URL:** `https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/solarized.css`

### 4. Gruvbox Dark (`gruvbox.css`)
Retro groove with warm, earthy tones.

**Best for:** Developers who love vintage vibes

**URL:** `https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/gruvbox.css`

## Creating Your Own Theme

### Step 1: Start with a Template

Download any existing theme as your starting point:

```bash
curl -O https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/basic.css
```

### Step 2: Understand the Structure

Each theme has three main parts:

```css
/* 1. Host styles - container appearance */
:host {
  background: #fff;
  padding: 20px;
  /* ... */
}

/* 2. Code element styles */
code {
  color: #000;
  line-height: 1.6;
}

/* 3. AST node type classes - THE LEARNING PART! */
.FunctionDeclaration { color: blue; }
.IfStatement { color: purple; }
/* ... 60+ more! */
```

### Step 3: Learn Through Comments

Every class in the theme files has educational comments:

```css
/* function myFunc() {} - named function declaration */
.FunctionDeclaration { color: #005cc5; font-weight: 600; }

/* const fn = function() {} - anonymous function assigned to variable */
.FunctionExpression { color: #005cc5; font-weight: 500; }

/* const arrow = () => {} or x => x * 2 */
.ArrowFunctionExpression { color: #005cc5; font-weight: 500; }
```

Notice how you learn:
- Functions have THREE different AST representations!
- Each has a different use case
- The parser treats them differently

### Step 4: Customize Colors

Choose your color palette. Consider grouping by category:

```css
/* Control Flow - Purple/Magenta */
.IfStatement,
.ForStatement,
.WhileStatement,
.SwitchStatement {
  color: #c586c0;
  font-weight: bold;
}

/* Functions - Blue */
.FunctionDeclaration,
.FunctionExpression,
.ArrowFunctionExpression,
.CallExpression {
  color: #268bd2;
}

/* Literals & Values - Green */
.Literal,
.TemplateLiteral {
  color: #b5cea8;
}
```

## AST Node Type Quick Reference

### Declarations
- `ClassDeclaration` - `class MyClass {}`
- `FunctionDeclaration` - `function myFunc() {}`
- `VariableDeclaration` - `const x = 1;`

### Expressions
- `CallExpression` - `myFunc()`
- `MemberExpression` - `obj.prop`
- `BinaryExpression` - `a + b`
- `ArrowFunctionExpression` - `() => {}`
- `NewExpression` - `new Class()`
- `AwaitExpression` - `await promise`

### Statements
- `IfStatement` - `if (x) {}`
- `ForStatement` - `for (;;) {}`
- `WhileStatement` - `while (x) {}`
- `ReturnStatement` - `return x;`
- `ThrowStatement` - `throw err;`
- `TryStatement` - `try {} catch {}`

### Patterns (Destructuring)
- `ArrayPattern` - `[a, b] = arr`
- `ObjectPattern` - `{x, y} = obj`
- `RestElement` - `...rest`
- `SpreadElement` - `...spread`

### Literals
- `Literal` - `42`, `"string"`, `true`, `/regex/`
- `TemplateLiteral` - `` `template ${x}` ``

### Class Members
- `MethodDefinition` - `method() {}`
- `PropertyDefinition` - `prop = value;`
- `StaticBlock` - `static {}`

## Tips for Theme Creation

### 1. Use Color Families
Group related AST types with similar colors:
- **Control flow** (if, for, while) → Purple/Magenta
- **Functions** → Blue
- **Keywords** (this, super, new) → Red/Orange
- **Literals** → Green

### 2. Consider Accessibility
- Ensure sufficient contrast (4.5:1 for normal text, 3:1 for large)
- Test with color blindness simulators
- Don't rely solely on color - use weight/style too

### 3. The Learning Opportunity
As you assign colors, you'll discover:
- How many different expression types exist
- The difference between declarations and expressions
- How modern features (async/await, destructuring) are represented

### 4. Test with Complex Code
Create test files with:
```javascript
// Classes
class Animal extends Creature {
  #private = 'secret';
  static count = 0;

  constructor() {}
  get value() {}
  method() {}
}

// Async/Generators
async function* gen() {
  yield await fetch('/api');
}

// Destructuring
const {x, y, ...rest} = obj;
const [a, b = 5] = arr;

// Modern features
obj?.prop ?? 'default';
import {x} from 'mod' with { type: 'json' };
```

## From Theme Designer to AST Expert

Creating themes naturally leads you to:

1. **Understanding AST structure** - You see how code is parsed
2. **Learning the visitor pattern** - Each class is a "visit" to that node type
3. **Writing code transformations** - Once you understand nodes, you can modify them
4. **Building better tools** - Linters, formatters, transpilers all use AST

This is the gentle on-ramp to powerful code manipulation! 🐿️

## Share Your Theme!

Created an awesome theme? Share it!

1. Host it on GitHub
2. Submit a PR to add it to the theme showcase
3. Tag it with `#squirrel-pie-theme`

## Need Help?

- Check existing themes for examples
- Each CSS class has comments explaining the AST node
- Hover over code in Squirrel Pie to see node types
- [Open an issue](https://github.com/catpea/squirrel-pie/issues) if stuck

Happy theming! Remember: every color you choose is a step toward understanding how JavaScript really works. 🎨🐿️
