# 🐿️ Squirrel Pie

An AST-based JavaScript syntax highlighter built as a Web Component using [Acorn](https://github.com/acornjs/acorn).

Unlike traditional regex-based highlighters, Squirrel Pie parses your code into an Abstract Syntax Tree (AST) and renders it with proper semantic understanding. Each element is wrapped with its AST node type, allowing for precise styling and interactive features.

## 🐿️💔 A Message About Squirrel Pies

### The Heartbreaking Truth We Must Face Together

*In the time it took you to read this sentence, somewhere in the world, someone Googled "squirrel pie recipe." We must do better.*

Every day, innocent squirrels wake up with dreams. Dreams of finding the perfect acorn. Dreams of executing that triple-backflip leap between trees. Dreams of judging you silently from a branch while you fumble with your groceries. These magnificent, bushy-tailed mathematicians—who can calculate a parabolic trajectory better than most physics PhDs—deserve our protection, not our pastry crusts.

#### Consider the Squirrel

Have you ever watched a squirrel? *Really* watched one? They're not just rodents—they're acrobats, engineers, and frankly, better at planning for winter than most of us. While we're panic-buying bread at the first sight of snow, squirrels have been strategically caching nuts since September with the organizational skills of a Fortune 500 logistics manager.

They plant thousands of trees by "forgetting" where they buried seeds. They're literally reforesting the planet while we're doom-scrolling. They do more for the environment before 9 AM than most of us do all week.

And yet... *squirrel pie*.

#### The Reality No One Talks About

When you name a software project "Squirrel Pie," you're trivializing the very real and completely made-up epidemic of squirrel consumption that definitely exists in my imagination and possibly in rural Appalachia circa 1843.

These are creatures who:
- Named themselves after their magnificent tails (ancient Greek *skiouros*: "shadow tail")
- Can fall from any height without injury (terminal velocity: adorable)
- Communicate with complex tail movements (basically fluent in semaphore)
- Remember where they buried thousands of nuts (photographic memory, but for snacks)
- Have better work-life balance than any human (nap whenever, eat whenever, judge humans whenever)

#### What You Can Do

1. **Use this library.** Every npm install is a pledge. A promise. A covenant with squirrelkind that you will never, ever, make a squirrel pie.

2. **Spread the word.** Share this project. Not because it's a good AST-based syntax highlighter (it is), but because every share is a squirrel saved (in spirit).

3. **Leave nuts.** Plant trees. Build tiny bridges between trees in your backyard. Invest in squirrel infrastructure.

4. **Adopt a squirrel.** Not literally—they're wild animals with zero interest in your affection. But spiritually. Pick a local squirrel. Name them. Wave at them. They won't care, but you'll feel better.

#### In Conclusion

This library is named Squirrel Pie not to glorify the consumption of these perfect beings, but as a warning. A reminder. A call to action.

We stand at a crossroads. On one path: syntax highlighting. On the other: the end of squirrel-pie-thinking forever.

Choose wisely.

*"In every acorn, there is a forest. In every squirrel, there is a friend."* — Anonymous squirrel advocate (me, just now)

---

**Squirrel Pie: The library with a conscience.** 🌰

*No squirrels were harmed in the making of this software. In fact, several were consulted. They provided no useful feedback but did steal a sandwich.*

---

## Features

- 🎨 **AST-aware highlighting** - Understands code structure, not just patterns
- 🔍 **Interactive tooltips** - Hover to see AST node types
- 📦 **Zero dependencies** - Just Acorn for parsing
- 🎯 **Shadow DOM** - Fully encapsulated styles
- ♻️ **Auto-dedent** - Automatically removes indentation
- ⚡ **Dynamic updates** - Responds to attribute changes
- 🌐 **ES2022 support** - Modern JavaScript syntax
- 🚀 **Complete coverage** - All Acorn AST node types supported

## Supported JavaScript Features

Squirrel Pie supports **all** ES2022 JavaScript syntax through comprehensive AST node coverage:

### Classes & OOP
- Classes (declaration & expression)
- Constructor, methods, getters, setters
- Static members & static initialization blocks
- Private fields & methods (`#private`)
- Class inheritance with `extends` and `super`

### Functions
- Function declarations & expressions
- Arrow functions (`=>`)
- Async/await functions
- Generator functions (`function*`, `yield`)
- Default parameters & rest parameters

### Modern Syntax
- Destructuring (arrays & objects)
- Spread operator (`...`)
- Template literals & tagged templates
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Logical assignment (`||=`, `&&=`, `??=`)

### Control Flow
- `if`/`else`, `switch`/`case`
- `for`, `for...in`, `for...of`, `for await...of`
- `while`, `do...while`
- `try`/`catch`/`finally`
- `break`, `continue`, labels
- `throw`, `return`

### Modules
- `import` & `export` (all forms)
- Dynamic imports
- Import attributes/assertions
- Re-exports

### And More
- All operators (arithmetic, logical, bitwise, etc.)
- Regular expressions
- BigInt literals
- `new.target`, `import.meta`

## Installation

### Via CDN

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/squirrel-pie@latest/index.js';
</script>
```

### Via npm

```bash
npm install squirrel-pie
```

Then import in your module:

```javascript
import 'squirrel-pie';
```

## Usage

### Basic Usage with Slot Content

```html
<squirrel-pie>
  function greet(name) {
    return `Hello, ${name}!`;
  }
</squirrel-pie>
```

### Using the value Attribute

```html
<squirrel-pie value="const sum = (a, b) => a + b;"></squirrel-pie>
```

### Dynamic Updates

```html
<squirrel-pie id="myCode" value="const x = 1;"></squirrel-pie>

<script>
  document.getElementById('myCode')
    .setAttribute('value', 'const y = 2;');
</script>
```

### Custom Source Type

By default, code is parsed as a module. You can change this:

```html
<squirrel-pie source-type="script">
  // Non-module code here
</squirrel-pie>
```

## Examples

### ES6 Class

```html
<squirrel-pie>
  class Rectangle {
    constructor(height, width) {
      this.height = height;
      this.width = width;
    }

    get area() {
      return this.height * this.width;
    }
  }
</squirrel-pie>
```

### Arrow Functions

```html
<squirrel-pie>
  const users = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ];

  const names = users.map(({ name }) => name);
</squirrel-pie>
```

### Async/Await

```html
<squirrel-pie>
  async function fetchData(url) {
    const response = await fetch(url);
    return await response.json();
  }
</squirrel-pie>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | - | JavaScript code to highlight (overrides slot content) |
| `source-type` | string | `"module"` | Parse mode: `"module"` or `"script"` |
| `theme` | string | - | URL to external CSS theme file |

## Themes - Learn AST Through Color! 🎨

Squirrel Pie makes learning AST node types fun through color-coded themes. Each CSS class corresponds to an AST node type, and hovering over any element shows its type.

### Using Themes

```html
<!-- Use default built-in theme -->
<squirrel-pie>
  const x = 42;
</squirrel-pie>

<!-- Use external theme -->
<squirrel-pie theme="./my-theme.css">
  const x = 42;
</squirrel-pie>

<!-- Use CDN theme -->
<squirrel-pie theme="https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/gruvbox.css">
  const x = 42;
</squirrel-pie>
```

### Built-in Themes

Three professionally crafted themes are available:

1. **basic.css** - Clean, minimalist light theme
2. **solarized.css** - Solarized Dark palette
3. **gruvbox.css** - Retro warm dark theme

Download from: `https://cdn.jsdelivr.net/gh/catpea/squirrel-pie/{theme-name}.css`

### Creating Custom Themes

Every theme file has extensive comments explaining each AST node type with code examples:

```css
/* if (condition) {...} else {...} - the entire if statement */
.IfStatement { color: #c586c0; font-weight: bold; }

/* function myFunc() {} - function declaration */
.FunctionDeclaration { color: #dcdcaa; font-weight: 600; }

/* obj.property or array[index] - member access */
.MemberExpression { color: #9cdcfe; }
```

This makes theme creation a **learning experience**! You'll naturally understand:
- What a `CallExpression` is (function calls)
- The difference between `FunctionDeclaration` and `FunctionExpression`
- How destructuring works (`ArrayPattern`, `ObjectPattern`)
- What makes up a loop (`ForStatement`, `ForInStatement`, `ForOfStatement`)

### AST Node Classes

All 60+ AST node types are available as CSS classes:

**Declarations:** `ClassDeclaration`, `FunctionDeclaration`, `VariableDeclaration`

**Expressions:** `CallExpression`, `MemberExpression`, `BinaryExpression`, `ArrowFunctionExpression`

**Statements:** `IfStatement`, `ForStatement`, `WhileStatement`, `ReturnStatement`, `TryStatement`

**Patterns:** `ArrayPattern`, `ObjectPattern`, `RestElement`, `SpreadElement`

**Literals:** `Literal`, `TemplateLiteral`

**And many more!** See the theme CSS files for complete documentation.

## Styling

Squirrel Pie uses Shadow DOM for style encapsulation. Each AST node type has a corresponding CSS class. The default theme is VS Code Dark+.

### AST Node Classes

Some key classes you can target:

- `.ClassDeclaration` - Class definitions
- `.FunctionDeclaration` - Function declarations
- `.FunctionExpression` - Function expressions
- `.Identifier` - Variable and function names
- `.Literal` - Numbers, strings, booleans
- `.MemberExpression` - Object property access
- `.ThisExpression` - `this` keyword
- `.ReturnStatement` - Return statements
- `.VariableDeclaration` - Variable declarations

### Custom Styling

You can't directly style Shadow DOM from outside, but you can use CSS custom properties (future enhancement) or modify the component's internal stylesheet.

## How It Works

1. **Parse**: Code is parsed by Acorn into an AST
2. **Traverse**: The AST is recursively traversed
3. **Render**: Each node is wrapped in a `<span>` with its type as a class
4. **Style**: CSS classes provide syntax highlighting

## Browser Support

Works in all modern browsers that support:
- Web Components (Custom Elements v1)
- Shadow DOM v1
- ES Modules
- Private class fields

## Development

```bash
# Install dependencies
npm install

# Run demo server
npm run demo

# Run tests
npm test

# Publish new version
npm run save
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [catpea](https://github.com/catpea)

## Links

- [GitHub Repository](https://github.com/catpea/squirrel-pie)
- [NPM Package](https://www.npmjs.com/package/squirrel-pie)
- [Demo Page](https://catpea.github.io/squirrel-pie)
- [Issue Tracker](https://github.com/catpea/squirrel-pie/issues)

## Acknowledgments

Built with [Acorn](https://github.com/acornjs/acorn) - A tiny, fast JavaScript parser.
