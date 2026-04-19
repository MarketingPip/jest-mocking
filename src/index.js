import expect from "expect@29";
import * as jestMock from "jest-mock@29";
import jestCircus from "jest-circus@29";
import FakeTimers from "@sinonjs/fake-timers@11";

// ─── Bootstrap expect ────────────────────────────────────────────────────────
expect.extend({});

const {
  iterableEquality, subsetEquality, typeEquality,
  sparseArrayEquality, arrayBufferEquality, utils,
} = expect;

if (typeof expect.addEqualityTesters === "function") {
  expect.addEqualityTesters(
    [iterableEquality, subsetEquality, typeEquality, sparseArrayEquality, arrayBufferEquality]
    .filter(Boolean)
  );
}

const AsymmetricMatcher =
  utils?.AsymmetricMatcher ??
  Object.getPrototypeOf(expect.any(Object)).constructor ??
  class AsymmetricMatcher {
    constructor(s) { this.sample = s; }
    asymmetricMatch() { return true; }
    toString() { return "AsymmetricMatcher"; }
    getExpectedType() { return "anything"; }
    toAsymmetricMatcher() { return "AsymmetricMatcher"; }
  };

if (!expect.plugins) expect.plugins = {};
if (!expect.plugins.AsymmetricMatcher) expect.plugins.AsymmetricMatcher = AsymmetricMatcher;

// ─── Lifecycle globals ───────────────────────────────────────────────────────
const { afterAll, afterEach, beforeAll, beforeEach, describe, it, test, run } = jestCircus;

// Standard aliases
const fdescribe  = describe.only;
const xdescribe  = describe.skip;
const fit        = test.only;
const xit        = test.skip;
const xtest      = test.skip;

// .each on describe and test (jest-circus exposes these natively)
// Expose them explicitly for clarity
const feach = test.only.each ?? test.each;

// ─── Fake timer state ────────────────────────────────────────────────────────
let _clock = null;
const getClock = (config) => {
  if (!_clock) _clock = FakeTimers.install(config ?? {});
  return _clock;
};

// ─── Replaced-property tracker (for jest.replaceProperty / restoreAllMocks) ──
const _replaced = [];

// ─── jest object — full Jest 29/30 surface ───────────────────────────────────
const _mocker = new jestMock.ModuleMocker(globalThis);

// Internal seed (jest.getSeed / --seed)
let _seed = Math.floor(Math.random() * 0x10000);
let _tornDown = false;

const jest = {

  // ── Mock Modules (browser stubs — Node registry doesn't exist) ───────────
  disableAutomock:       ()            => jest,
  enableAutomock:        ()            => jest,
  mock:                  (m, f, o)    => jest,
  unmock:                (m)           => jest,
  deepUnmock:            (m)           => jest,
  doMock:                (m, f, o)    => jest,
  dontMock:              (m)           => jest,
  setMock:               (m, e)       => jest,
  resetModules:          ()            => jest,
  isolateModules:        (fn)          => (fn(), jest),
  isolateModulesAsync:   async (fn)    => (await fn(), jest),
  onGenerateMock:        (cb)          => jest,   // no-op; automock not supported
  requireActual:         (m)           => { throw new Error(`jest.requireActual('${m}') is not supported in the browser`); },
  requireMock:           (m)           => { throw new Error(`jest.requireMock('${m}') is not supported in the browser`); },
  createMockFromModule:  ()            => ({}),

  // ── Mock Functions ────────────────────────────────────────────────────────
  fn:             (impl)               => _mocker.fn(impl),
  spyOn:          (obj, method, acc)   => _mocker.spyOn(obj, method, acc),
  isMockFunction: (fn)                 => _mocker.isMockFunction(fn),
  mocked:         (src)                => src,

  replaceProperty(obj, prop, val) {
    if (!(prop in obj)) throw new Error(`Property '${String(prop)}' does not exist on the provided object`);
    const orig = Object.getOwnPropertyDescriptor(obj, prop);
    obj[prop] = val;
    const entry = { obj, prop, orig };
    _replaced.push(entry);
    return {
      restore() {
        if (orig) Object.defineProperty(obj, prop, orig);
        else delete obj[prop];
        const i = _replaced.indexOf(entry);
        if (i !== -1) _replaced.splice(i, 1);
      },
    };
  },

  clearAllMocks()   { _mocker.clearAllMocks();   return jest; },
  resetAllMocks()   { _mocker.resetAllMocks();    return jest; },
  restoreAllMocks() {
    _mocker.restoreAllMocks();
    // Also restore all replaceProperty replacements
    while (_replaced.length) _replaced.pop().restore?.();
    return jest;
  },

  // ── Fake Timers ───────────────────────────────────────────────────────────
  useFakeTimers(config) {
    if (_clock) { _clock.uninstall(); _clock = null; }
    getClock(config);
    return jest;
  },
  useRealTimers() {
    _clock?.uninstall();
    _clock = null;
    return jest;
  },

  runAllTicks()                    { getClock().runMicrotasks?.(); },
  runAllTimers()                   { getClock().runAll(); },
  runAllTimersAsync:    async ()   => getClock().runAllAsync(),
  runAllImmediates()               { getClock().runAll(); },   // legacy alias
  advanceTimersByTime(ms)          { getClock().tick(ms); },
  advanceTimersByTimeAsync: async (ms) => getClock().tickAsync(ms),
  runOnlyPendingTimers()           { getClock().runToLast(); },
  runOnlyPendingTimersAsync: async () => getClock().runToLastAsync(),
  advanceTimersToNextTimer(steps = 1) {
    for (let i = 0; i < steps; i++) getClock().next();
  },
  advanceTimersToNextTimerAsync: async (steps = 1) => {
    for (let i = 0; i < steps; i++) await getClock().nextAsync();
  },
  advanceTimersToNextFrame() {
    // requestAnimationFrame fires at ~16ms intervals
    getClock().tick(16);
  },
  clearAllTimers()                 { getClock().reset(); },
  getTimerCount()                  { return _clock?.countTimers?.() ?? 0; },
  now()                            { return _clock ? _clock.now : Date.now(); },
  setSystemTime(t)                 { getClock().setSystemTime(t); },
  getRealSystemTime()              { return Date.now(); },

  // ── Misc ──────────────────────────────────────────────────────────────────
  getSeed()                        { return _seed; },
  isEnvironmentTornDown()          { return _tornDown; },
  setTimeout(ms)                   { /* jest-circus handles timeouts internally */ return jest; },
  retryTimes(n, opts)              { return jest; },
  randomize()                      { return jest; },

  // Internal — allow host runner to flip torn-down flag
  _setTornDown(v)                  { _tornDown = v; },
  _moduleMocker: _mocker,
};

// ─── Inject globals (mirrors jest-environment-* behaviour) ───────────────────
Object.assign(globalThis, {
  jest, expect,
  afterAll, afterEach, beforeAll, beforeEach,
  describe, fdescribe, xdescribe,
  it, fit, xit,
  test, xtest,
});

// ─── Exports ─────────────────────────────────────────────────────────────────
export {
  jest, expect,
  afterAll, afterEach, beforeAll, beforeEach,
  describe, fdescribe, xdescribe,
  it, fit, xit,
  test, xtest,
  run,
};
