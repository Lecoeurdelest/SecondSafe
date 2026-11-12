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
    return { getPropertyValue: () => '' };
  }
};

afterEach(() => {
  document.head.querySelectorAll('style[data-rc-order], style[data-css-hash], style[data-token-hash]').forEach(node => node.remove());
});
