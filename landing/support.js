// 6-EMPIRES Design Content (DC) Runtime
// Processes <x-dc> templates and <script type="text/x-dc"> components
(function() {
  'use strict';

  // DCLogic base class - provides state management and lifecycle
  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
      this.refs = {};
      this._listeners = {};
      this._mounted = false;
    }

    setState(updater, callback) {
      const prev = this.state;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      this.state = Object.assign({}, prev, next);
      if (this._mounted && this._rerender) this._rerender();
      if (callback) setTimeout(callback, 0);
    }

    on(event, handler) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(handler);
    }

    emit(event, data) {
      const handlers = this._listeners[event];
      if (handlers) handlers.forEach(h => h(data));
    }

    componentDidMount() {}
    componentDidUpdate() {}
    componentWillUnmount() {}

    _mount(container) {
      this._container = container;
      this._mounted = true;
      this.componentDidMount();
      this._rerender();
    }

    _rerender() {
      if (!this._container || !this.render) return;
      const html = this.render();
      if (html && typeof html === 'string') {
        this._container.innerHTML = html;
        this._bindEvents();
        this.componentDidUpdate();
      } else if (html && typeof html === 'object' && html.$$typeof) {
        ReactDOM.render(html, this._container);
        this._bindEvents();
        this.componentDidUpdate();
      }
    }

    _bindEvents() {
      // Bind click handlers
      const container = this._container;
      if (!container) return;

      // Wire up data-click attributes
      container.querySelectorAll('[data-click]').forEach(el => {
        const handler = el.getAttribute('data-click');
        if (this[handler] && !el._dcBound) {
          el._dcBound = true;
          el.addEventListener('click', (e) => this[handler] && this[handler](e));
        }
      });

      // Wire up data-input attributes
      container.querySelectorAll('[data-input]').forEach(el => {
        const handler = el.getAttribute('data-input');
        if (this[handler] && !el._dcBound) {
          el._dcBound = true;
          el.addEventListener('input', (e) => this[handler] && this[handler](e));
        }
      });

      // Wire up data-change attributes
      container.querySelectorAll('[data-change]').forEach(el => {
        const handler = el.getAttribute('data-change');
        if (this[handler] && !el._dcBound) {
          el._dcBound = true;
          el.addEventListener('change', (e) => this[handler] && this[handler](e));
        }
      });

      // Wire up ref attributes
      container.querySelectorAll('[data-ref]').forEach(el => {
        const ref = el.getAttribute('data-ref');
        this.refs[ref] = el;
      });
    }
  }

  // Parse HTML entities in data-props
  function parseProps(str) {
    if (!str) return {};
    // Decode HTML entities
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    const decoded = txt.value;
    try {
      return JSON.parse(decoded);
    } catch(e) {
      console.warn('DC: failed to parse props', e);
      return {};
    }
  }

  // Get default props from the props definition
  function getDefaultProps(propsDef) {
    const defaults = {};
    if (!propsDef) return defaults;
    for (const key in propsDef) {
      if (key === '$preview') continue;
      const def = propsDef[key];
      if (def && typeof def === 'object' && 'default' in def) {
        defaults[key] = def.default;
      }
    }
    return defaults;
  }

  // Read URL params to override props
  function getURLProps() {
    const params = new URLSearchParams(location.search);
    const props = {};
    for (const [key, value] of params.entries()) {
      props[key] = value === 'true' ? true : value === 'false' ? false : isNaN(value) ? value : Number(value);
    }
    return props;
  }

  // Initialize when DOM is ready
  function init() {
    // Find x-dc content (the template)
    const xdc = document.querySelector('x-dc');
    if (!xdc) {
      console.warn('DC: no <x-dc> element found');
      return;
    }

    // Get the template HTML (everything inside x-dc, minus the script tags)
    const xdcClone = xdc.cloneNode(true);
    xdcClone.querySelectorAll('script').forEach(s => s.remove());
    const templateHTML = xdcClone.innerHTML;

    // Find the DC script (React component)
    const dcScript = document.querySelector('script[type="text/x-dc"][data-dc-script]');
    if (!dcScript) {
      console.warn('DC: no DC script found, rendering template only');
      // Just render the template
      const container = document.createElement('div');
      container.innerHTML = templateHTML;
      xdc.replaceWith(container);
      return;
    }

    // Parse props
    const propsDef = parseProps(dcScript.getAttribute('data-props') || '');
    const defaultProps = getDefaultProps(propsDef);
    const urlProps = getURLProps();
    const finalProps = Object.assign({}, defaultProps, urlProps);

    // Extract and evaluate the component class
    const scriptContent = dcScript.textContent || dcScript.innerText || '';
    const componentCode = scriptContent.trim();

    // Create the component instance
    try {
      // Evaluate the class definition
      const ComponentClass = eval(componentCode);
      if (!ComponentClass || typeof ComponentClass !== 'function') {
        throw new Error('DC script did not define a class');
      }

      // Check if it's already a class (extends DCLogic)
      const instance = new ComponentClass(finalProps);

      // Create container
      const container = document.createElement('div');
      container.id = 'dc-root';
      container.style.width = '100%';
      container.style.height = '100%';
      xdc.replaceWith(container);

      // If the component has a render method that returns HTML string, use it
      if (instance.render && typeof instance.render === 'function') {
        // Mount the component
        instance._mount(container);
      } else {
        // Fall back to just rendering the template
        container.innerHTML = templateHTML;
      }
    } catch(e) {
      console.error('DC: error initializing component', e);
      // Fall back to rendering template directly
      const container = document.createElement('div');
      container.innerHTML = templateHTML;
      const xdcEl = document.querySelector('x-dc');
      if (xdcEl) xdcEl.replaceWith(container);
    }
  }

  // Wait for React/ReactDOM to be loaded
  function waitForReact(callback, attempts) {
    attempts = attempts || 0;
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
      callback();
    } else if (attempts < 50) {
      setTimeout(function() { waitForReact(callback, attempts + 1); }, 100);
    } else {
      console.warn('DC: React not loaded, initializing without it');
      callback();
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { waitForReact(init); });
  } else {
    waitForReact(init);
  }
})();
