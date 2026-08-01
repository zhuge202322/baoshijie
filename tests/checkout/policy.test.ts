import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCheckoutTotals,
  getShippingCents,
  isSupportedDestination,
  validateCartLines
} from "../../lib/checkout/policy.ts";
import { checkoutCountries } from "../../lib/checkout/countries.ts";

test("checkout supports the US, Canada, EU 27, UK, Norway, Switzerland, Iceland, and Liechtenstein", () => {
  assert.equal(checkoutCountries.length, 34);
  for (const code of ["US", "CA", "DE", "FR", "GB", "NO", "CH", "IS", "LI"]) {
    assert.equal(isSupportedDestination(code), true, code);
  }
  for (const code of ["CN", "JP", "AU", "RU", "", "usa"]) {
    assert.equal(isSupportedDestination(code), false, code);
  }
});

test("fixed shipping is USD 12 standard or USD 45 expedited", () => {
  assert.equal(getShippingCents("standard"), 1200);
  assert.equal(getShippingCents("expedited"), 4500);
  assert.throws(() => getShippingCents("overnight"), /shipping method/);
});

test("checkout totals use integer cents and contain no tax", () => {
  assert.deepEqual(calculateCheckoutTotals([245000, 62000], "standard"), {
    currency: "USD",
    subtotalCents: 307000,
    shippingCents: 1200,
    totalCents: 308200
  });
  assert.throws(() => calculateCheckoutTotals([100.5], "standard"), /integer cents/);
  assert.throws(() => calculateCheckoutTotals([-1], "standard"), /integer cents/);
});

test("checkout totals accept configured shipping rates", () => {
  assert.deepEqual(calculateCheckoutTotals([10000], "standard", { standard: 1899, expedited: 5275 }), {
    currency: "USD",
    subtotalCents: 10000,
    shippingCents: 1899,
    totalCents: 11899
  });
});

test("cart lines require a product slug and quantities from one through nine", () => {
  assert.deepEqual(validateCartLines([{ slug: "heritage-wheel", quantity: 2 }]), [{ slug: "heritage-wheel", quantity: 2 }]);
  assert.throws(() => validateCartLines([]), /empty/);
  assert.throws(() => validateCartLines([{ slug: "heritage-wheel", quantity: 0 }]), /between 1 and 9/);
  assert.throws(() => validateCartLines([{ slug: "heritage-wheel", quantity: 10 }]), /between 1 and 9/);
  assert.throws(() => validateCartLines([{ slug: "", quantity: 1 }]), /slug/);
  assert.throws(() => validateCartLines([{ slug: "heritage-wheel", quantity: 1 }, { slug: "heritage-wheel", quantity: 1 }]), /duplicate/);
});
