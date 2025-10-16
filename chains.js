export default
class ChainCollector {
    constructor() {
        this.chain = [];

        // Create a function that will be our proxy target
        const chainFunction = (options) => {
            // When called as a function, add options to the last chain item
            if (this.chain.length > 0) {
                const lastItem = this.chain[this.chain.length - 1];
                if (typeof lastItem === 'string') {
                    this.chain[this.chain.length - 1] = {
                        name: lastItem,
                        options: options
                    };
                }
            }
            return proxy;
        };

        // Bind the function to this instance
        const boundFunction = chainFunction.bind(this);

        // Create proxy around the bound function
        const proxy = new Proxy(boundFunction, {
            get: (target, prop) => {

              // Handle iteration
              if (prop === Symbol.iterator) {
                  return () => this.chain[Symbol.iterator]();
              }

              // Handle array-like indexing
              if (typeof prop === 'string' && !isNaN(prop)) {
                  return this.chain[parseInt(prop)];
              }

              // Symbol.toPrimitive for coercion
              if (prop === Symbol.toPrimitive) {
                  return (hint) => {
                      if (hint === 'string') return this.toString();
                      if (hint === 'number') return this.chain.length;
                      return this.toPath();
                  };
              }

              // Symbol for async iteration
              if (prop === Symbol.asyncIterator) {
                  return async function* () {
                      for (const item of this.chain) {
                          yield await Promise.resolve(item);
                      }
                  }.bind(this);
              }

                // Special properties
                if (prop === 'toArray' || prop === 'getChain') {
                    return () => [...this.chain];
                }
                if (prop === 'toString') {
                    return () => JSON.stringify(this.chain, null, 2);
                }
                if (prop === 'clear') {
                    return () => {
                        this.chain = [];
                        return proxy;
                    };
                }
                if (prop === 'length') {
                    return this.chain.length;
                }

                // Ignore symbols (except iterator) and special properties
                if (typeof prop === 'symbol' || prop === 'then') {
                    return undefined;
                }

                // Add property name to chain
                this.chain.push(prop);
                return proxy;
            }
        });

        return proxy;
    }
}
