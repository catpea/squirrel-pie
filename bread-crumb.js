  class BreadCrumb extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }

      static get observedAttributes() {
        return ['separator', 'value'];
      }

      connectedCallback() {
        this.render();
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
          this.render();
        }
      }

      get separator() {
        return this.getAttribute('separator') || '/';
      }

      get items() {
        try {
          const value = this.getAttribute('value');
          return value ? JSON.parse(value) : [];
        } catch (e) {
          console.error('Invalid breadcrumb value format:', e);
          return [];
        }
      }

      handleClick(event, url, label) {
        event.preventDefault();

        const customEvent = new CustomEvent('navigate', {
          detail: { url, label },
          bubbles: true,
          composed: true
        });

        this.dispatchEvent(customEvent);
      }

      render() {
        const items = this.items;
        const separator = this.separator;

        this.shadowRoot.innerHTML = `
          <style>
            :host {
              display: block;
            }

            nav {
              --breadcrumb-divider: '${separator}';
              --breadcrumb-divider-color: var(--bs-secondary-color, #6c757d);
              --breadcrumb-item-padding-x: 0.5rem;
              --breadcrumb-margin-bottom: 1rem;
              --breadcrumb-bg: transparent;
              --breadcrumb-border-radius: 0.375rem;
              --breadcrumb-active-color: var(--bs-secondary-color, #6c757d);
              --breadcrumb-link-color: var(--bs-link-color, #0d6efd);
              --breadcrumb-link-hover-color: var(--bs-link-hover-color, #0a58ca);
            }

            .breadcrumb {
              display: flex;
              flex-wrap: wrap;
              padding: 0;
              margin-bottom: var(--breadcrumb-margin-bottom);
              font-size: 1rem;
              list-style: none;
              background-color: var(--breadcrumb-bg);
              border-radius: var(--breadcrumb-border-radius);
            }

            .breadcrumb-item {
              display: flex;
              align-items: center;
            }

            .breadcrumb-item + .breadcrumb-item {
              padding-left: var(--breadcrumb-item-padding-x);
            }

            .breadcrumb-item + .breadcrumb-item::before {
              display: inline-block;
              padding-right: var(--breadcrumb-item-padding-x);
              color: var(--breadcrumb-divider-color);
              content: var(--breadcrumb-divider);
            }

            .breadcrumb-item.active {
              color: var(--breadcrumb-active-color);
            }

            button {
              background: none;
              border: none;
              padding: 0;
              color: var(--breadcrumb-link-color);
              text-decoration: none;
              cursor: pointer;
              font: inherit;
              transition: color 0.15s ease-in-out;
            }

            button:hover {
              color: var(--breadcrumb-link-hover-color);
              text-decoration: underline;
            }

            button:focus {
              outline: 2px solid var(--breadcrumb-link-color);
              outline-offset: 2px;
              border-radius: 2px;
            }

            .active button {
              color: var(--breadcrumb-active-color);
              pointer-events: none;
              cursor: default;
            }
          </style>

          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              ${items.map((item, index) => {
                const [label, url] = item;
                const isLast = index === items.length - 1;
                const activeClass = isLast ? ' active' : '';
                const ariaCurrent = isLast ? ' aria-current="page"' : '';

                return `
                  <li class="breadcrumb-item${activeClass}"${ariaCurrent}>
                    <button data-url="${url}">${label}</button>
                  </li>
                `;
              }).join('')}
            </ol>
          </nav>
        `;

        // Add event listeners to buttons
        this.shadowRoot.querySelectorAll('button').forEach((button) => {
          button.addEventListener('click', (e) => {
            const url = button.getAttribute('data-url');
            const label = button.textContent;
            this.handleClick(e, url, label);
          });
        });
      }
    }

    customElements.define('bread-crumb', BreadCrumb);
