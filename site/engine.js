export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Health",
  "Learning",
  "Shopping",
  "Other",
];
export function amountToPaise(text) {
  if (typeof text !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(text.trim()))
    throw Error("Use a positive amount with up to two decimal places.");
  const [a, b = ""] = text.trim().split(".");
  const n = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n < 1 || n > 1000000000)
    throw Error("Amount must be INR 0.01–10,000,000.");
  return n;
}
export function validateExpense(row) {
  if (
    !row ||
    typeof row !== "object" ||
    typeof row.id !== "string" ||
    !/^[-a-zA-Z0-9]{1,80}$/.test(row.id)
  )
    throw Error("Invalid expense ID.");
  if (
    typeof row.description !== "string" ||
    !row.description.trim() ||
    row.description.length > 120
  )
    throw Error("Description needs 1–120 characters.");
  if (
    !Number.isSafeInteger(row.paise) ||
    row.paise < 1 ||
    row.paise > 1000000000
  )
    throw Error("Invalid amount in paise.");
  if (!CATEGORIES.includes(row.category))
    throw Error("Choose a supported category.");
  if (
    typeof row.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
    !Number.isFinite(Date.parse(row.date)) ||
    new Date(row.date).toISOString().slice(0, 10) !== row.date
  )
    throw Error("Use a real calendar date.");
  return {
    id: row.id,
    description: row.description.trim(),
    paise: row.paise,
    date: row.date,
    category: row.category,
  };
}
export class ExpenseBook {
  constructor(rows = []) {
    if (!Array.isArray(rows) || rows.length > 10000)
      throw Error("Use up to 10,000 expenses.");
    this.rows = rows.map(validateExpense);
    if (new Set(this.rows.map((r) => r.id)).size !== rows.length)
      throw Error("Duplicate expense IDs.");
  }
  upsert(row) {
    row = validateExpense(row);
    return new ExpenseBook([...this.rows.filter((r) => r.id !== row.id), row]);
  }
  remove(id) {
    if (!this.rows.some((r) => r.id === id))
      throw Error("Expense no longer exists.");
    return new ExpenseBook(this.rows.filter((r) => r.id !== id));
  }
  filter({ from = "", through = "", category = "" } = {}) {
    if (from && through && from > through)
      throw Error("From date must precede through date.");
    const rows = this.rows
      .filter(
        (r) =>
          (!from || r.date >= from) &&
          (!through || r.date <= through) &&
          (!category || r.category === category),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    const totals = {};
    for (const r of rows)
      totals[r.category] = (totals[r.category] || 0) + r.paise;
    return { rows, paise: rows.reduce((s, r) => s + r.paise, 0), totals };
  }
  export() {
    return JSON.stringify(
      { schema: 1, currency: "INR", expenses: this.rows },
      null,
      2,
    );
  }
  static import(text) {
    if (typeof text !== "string" || text.length > 16 * 1024 * 1024)
      throw Error("Backup exceeds 16 MiB.");
    const data = JSON.parse(text);
    if (data.schema !== 1 || data.currency !== "INR")
      throw Error("Unsupported backup format/currency.");
    return new ExpenseBook(data.expenses);
  }
}
