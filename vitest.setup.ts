import "@testing-library/jest-dom";

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(value: string) {
    if (value.includes("fail")) {
      setTimeout(() => {
        this.onerror?.();
      }, 0);
    } else {
      setTimeout(() => {
        this.onload?.();
      }, 0);
    }
  }
}

beforeEach(() => {
  // @ts-expect-error test env override
  global.Image = MockImage;
});

afterEach(() => {
  // @ts-expect-error cleanup
  delete global.Image;
});

// Simulate absence of Image for coverage when explicitly unset in tests
export const unsetImage = () => {
  // @ts-expect-error test env override
  delete global.Image;
};

