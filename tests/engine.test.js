import test from "node:test";
import assert from "node:assert/strict";
import { ExpenseBook, amountToPaise } from "../site/engine.js";
const row = {
  id: "one",
  description: "Lunch",
  paise: 105,
  date: "2024-02-29",
  category: "Food",
};
test("decimal money has exact minor-unit arithmetic", () => {
  assert.equal(amountToPaise("0.10") + amountToPaise("0.20"), 30);
  assert.equal(amountToPaise("12.3"), 1230);
  for (const v of ["1e3", "-1", "1.001", "0", "NaN"])
    assert.throws(() => amountToPaise(v));
});
test("CRUD is immutable and updates one ID", () => {
  const a = new ExpenseBook().upsert(row),
    b = a.upsert({ ...row, paise: 200 });
  assert.equal(a.rows[0].paise, 105);
  assert.equal(b.rows.length, 1);
  assert.equal(b.rows[0].paise, 200);
  assert.equal(b.remove("one").rows.length, 0);
  assert.throws(() => b.remove("missing"));
});
test("backup round trip preserves exact records", () => {
  const a = new ExpenseBook([row]);
  assert.deepEqual(ExpenseBook.import(a.export()).rows, a.rows);
});
test("invalid import is rejected without modifying existing book", () => {
  const book = new ExpenseBook([row]);
  assert.throws(() =>
    ExpenseBook.import(
      JSON.stringify({ schema: 1, currency: "INR", expenses: [row, row] }),
    ),
  );
  assert.equal(book.rows.length, 1);
  assert.throws(() => new ExpenseBook([{ ...row, date: "2023-02-29" }]));
  assert.throws(() => new ExpenseBook([{ ...row, paise: 1.2 }]));
});
test("filtered totals match visible records", () => {
  const book = new ExpenseBook([
    row,
    { ...row, id: "two", paise: 200, category: "Other", date: "2024-03-01" },
  ]);
  assert.equal(book.filter().paise, 305);
  assert.equal(book.filter({ through: "2024-02-29" }).paise, 105);
  assert.equal(book.filter({ category: "Other" }).paise, 200);
  assert.throws(() =>
    book.filter({ from: "2025-01-01", through: "2024-01-01" }),
  );
});

test("a substantial valid expense book can export and reimport its complete backup", () => {
  const book = new ExpenseBook(
    Array.from({ length: 7000 }, (_, i) => ({
      ...row,
      id: "record-" + i,
      description: "Fictional expense " + "x".repeat(90),
    })),
  );
  const text = book.export();
  assert.ok(text.length > 1024 * 1024);
  assert.equal(ExpenseBook.import(text).rows.length, 7000);
});
