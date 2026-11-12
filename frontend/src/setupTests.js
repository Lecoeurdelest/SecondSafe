import '@testing-library/jest-dom';

jest.setTimeout(30000);

if (!window.matchMedia) {
  window.matchMedia = query => ({
    matches: false,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false
  });
}

if (!global.MessageChannel) {
  global.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: data => { setTimeout(() => this.port1.onmessage && this.port1.onmessage({ data }), 0); } };
    }
  };
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const computedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (...args) => {
  try {
    return computedStyle(...args);
  } catch {
    const inline = (args[0] && args[0].style) || {};
    return {
      display: inline.display || 'block',
      visibility: inline.visibility || 'visible',
      getPropertyValue: name => (inline.getPropertyValue ? inline.getPropertyValue(name) : '')
    };
  }
};

afterEach(() => {
  document.head.querySelectorAll('style[data-rc-order], style[data-css-hash], style[data-token-hash]').forEach(node => node.remove());
});
