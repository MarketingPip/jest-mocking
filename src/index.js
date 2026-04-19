import expect from "expect";
import * as jestMock from "jest-mock";
import jestCircus from "jest-circus";
import FakeTimers from "@sinonjs/fake-timers";

// ─── expect bootstrap ────────────────────────────────────────────────────────
expect.extend({});

const {
  iterableEquality,
  subsetEquality,
  typeEquality,
  sparseArrayEquality,
  arrayBufferEquality,
} = expect;

if (typeof expect.addEqualityTesters === "function") {
  expect.addEqualityTesters(
    [
      iterableEquality,
      subsetEquality,
      typeEquality,
      sparseArrayEquality,
      arrayBufferEquality,
    ].filter(Boolean)
  );
}

// ─── lifecycle ───────────────────────────────────────────────────────────────
const {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
  run,
} = jestCircus;

const fdescribe = describe.only;
const xdescribe = describe.skip;
const fit = test.only;
const xit = test.skip;
const xtest = test.skip;

// ─── mocker (SAFE USAGE) ─────────────────────────────────────────────────────
const mocker = null;

// only expose safe APIs
const jest = {
  fn: (impl) => mocker.fn(impl),
  spyOn: (obj, method, acc) => mocker.spyOn(obj, method, acc),
  isMockFunction: (fn) => mocker.isMockFunction(fn),
  mocked: (v) => v,

  clearAllMocks() {
    mocker.clearAllMocks();
    return jest;
  },
  resetAllMocks() {
    mocker.resetAllMocks();
    return jest;
  },
  restoreAllMocks() {
    mocker.restoreAllMocks();
    return jest;
  },
};

// ─── fake timers (safe) ──────────────────────────────────────────────────────
let clock = null;

const getClock = (config) => {
  if (!clock) clock = FakeTimers.install(config || {});
  return clock;
};

jest.useFakeTimers = (config) => {
  clock?.uninstall();
  clock = null;
  getClock(config);
  return jest;
};

jest.useRealTimers = () => {
  clock?.uninstall();
  clock = null;
  return jest;
};

jest.runAllTimers = () => getClock().runAll();
jest.advanceTimersByTime = (ms) => getClock().tick(ms);
jest.clearAllTimers = () => getClock().reset();
jest.getTimerCount = () => clock?.countTimers?.() ?? 0;

// ─── globals ─────────────────────────────────────────────────────────────────
Object.assign(globalThis, {
  jest,
  expect,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  fdescribe,
  xdescribe,
  it,
  fit,
  xit,
  test,
  xtest,
});

// ─── exports ─────────────────────────────────────────────────────────────────
export {
  jest,
  expect,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  fdescribe,
  xdescribe,
  it,
  fit,
  xit,
  test,
  xtest,
  run,
};
