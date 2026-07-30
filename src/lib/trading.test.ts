import { describe, expect, test } from "bun:test";
import {
  fillPrice,
  shouldFill,
  feeFor,
  buyExecutionPrice,
  FEE_RATE,
  MAX_SLIPPAGE,
} from "./trading";

describe("shouldFill", () => {
  test("a limit buy fills only once the market falls to the trigger", () => {
    expect(shouldFill("limit-buy", 100, 101)).toBe(false);
    expect(shouldFill("limit-buy", 100, 100)).toBe(true);
    expect(shouldFill("limit-buy", 100, 99)).toBe(true);
  });

  test("a stop-loss fills on the way down", () => {
    expect(shouldFill("stop-loss", 90, 91)).toBe(false);
    expect(shouldFill("stop-loss", 90, 90)).toBe(true);
    expect(shouldFill("stop-loss", 90, 80)).toBe(true);
  });

  test("a take-profit fills on the way up", () => {
    expect(shouldFill("take-profit", 120, 119)).toBe(false);
    expect(shouldFill("take-profit", 120, 120)).toBe(true);
    expect(shouldFill("take-profit", 120, 130)).toBe(true);
  });
});

describe("fillPrice", () => {
  test("a limit buy fills at the price you named, not the market", () => {
    // The market may have dropped well past the trigger between ticks; you
    // still pay what you asked for.
    expect(fillPrice("limit-buy", 100, 92)).toBe(100);
  });

  test("a stop-loss fills at the market, so gapping costs you", () => {
    // This is the whole lesson: a stop is a trigger, not a guaranteed price.
    expect(fillPrice("stop-loss", 90, 82)).toBe(82);
    expect(fillPrice("stop-loss", 90, 82)).toBeLessThan(90);
  });

  test("a take-profit also fills at the market", () => {
    expect(fillPrice("take-profit", 120, 127)).toBe(127);
  });
});

describe("fees and slippage", () => {
  test("the fee is a flat rate on the gross amount", () => {
    expect(feeFor(100)).toBeCloseTo(100 * FEE_RATE, 10);
    expect(feeFor(0)).toBe(0);
  });

  test("a negative amount can never produce a negative fee", () => {
    expect(feeFor(-50)).toBe(0);
  });

  test("a market buy never fills better than quoted, and never beyond the cap", () => {
    for (let i = 0; i < 500; i++) {
      const exec = buyExecutionPrice(100);
      expect(exec).toBeGreaterThanOrEqual(100);
      expect(exec).toBeLessThanOrEqual(100 * (1 + MAX_SLIPPAGE));
    }
  });
});
