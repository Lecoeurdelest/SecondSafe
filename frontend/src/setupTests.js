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
const ANT_HIDDEN = /(^|\s)ant-[a-z-]+-hidden(\s|$)/;

window.getComputedStyle = (...args) => {
  const [element, pseudoElement] = args;
  if (pseudoElement || !element || !element.style) {
    try {
      return computedStyle(...args);
    } catch {
      return { getPropertyValue: () => '' };
    }
  }
  const inline = element.style;
  const hiddenByClass = typeof element.className === 'string' && ANT_HIDDEN.test(element.className);
  return {
    display: inline.display || (hiddenByClass ? 'none' : 'block'),
    visibility: inline.visibility || 'visible',
    opacity: inline.opacity || '1',
    getPropertyValue: name => inline.getPropertyValue(name) || ''
  };
};

afterEach(() => {
  document.head.querySelectorAll('style[data-rc-order], style[data-css-hash], style[data-token-hash]').forEach(node => node.remove());
});
