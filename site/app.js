import { ExpenseBook, amountToPaise } from "./engine.js";
import { $, announce, download } from "./ui.js";
const KEY = "spendly.workspace.v1";
let book = new ExpenseBook(),
  editing = null;
const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n / 100,
  );
function persist(next) {
  localStorage.setItem(KEY, next.export());
  book = next;
  render();
}
function render() {
  try {
    const result = book.filter({
      from: $("from").value,
      through: $("through").value,
      category: $("filter-category").value,
    });
    $("total").textContent =
      `${money(result.paise)} · ${result.rows.length} visible expenses`;
    $("category-totals").replaceChildren();
    for (const [name, value] of Object.entries(result.totals)) {
      const label = document.createElement("p"),
        bar = document.createElement("meter");
      label.textContent = `${name}: ${money(value)} `;
      bar.min = 0;
      bar.max = Math.max(1, result.paise);
      bar.value = value;
      bar.setAttribute("aria-label", name + " share of spending");
      label.append(bar);
      $("category-totals").append(label);
    }
    $("expenses").replaceChildren();
    for (const row of result.rows) {
      const tr = document.createElement("tr");
      for (const v of [
        row.date,
        row.description,
        row.category,
        money(row.paise),
      ]) {
        const td = document.createElement("td");
        td.textContent = v;
        tr.append(td);
      }
      const actions = document.createElement("td");
      for (const label of ["Edit", "Delete"]) {
        const button = document.createElement("button");
        button.textContent = label;
        button.addEventListener("click", () => {
          try {
            if (label === "Delete") {
              if (
                window.confirm(
                  "Delete this expense? Export a backup if needed.",
                )
              ) {
                persist(book.remove(row.id));
                if (editing === row.id) cancel();
                announce("Expense deleted locally.");
              }
            } else {
              editing = row.id;
              $("description").value = row.description;
              $("amount").value = (row.paise / 100).toFixed(2);
              $("date").value = row.date;
              $("category").value = row.category;
              $("save").textContent = "Update expense";
              $("description").focus();
            }
          } catch (error) {
            announce(error.message);
          }
        });
        actions.append(button);
      }
      tr.append(actions);
      $("expenses").append(tr);
    }
  } catch (error) {
    announce(error.message);
  }
}
function cancel() {
  editing = null;
  $("expense-form").reset();
  $("date").value = new Date().toISOString().slice(0, 10);
  $("save").textContent = "Save expense";
}
$("expense-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    persist(
      book.upsert({
        id: editing || crypto.randomUUID(),
        description: $("description").value,
        paise: amountToPaise($("amount").value),
        date: $("date").value,
        category: $("category").value,
      }),
    );
    cancel();
    announce("Saved in this browser. Export a backup for safekeeping.");
  } catch (error) {
    announce("Not saved: " + error.message);
  }
});
$("cancel").addEventListener("click", cancel);
for (const id of ["from", "through", "filter-category"])
  $(id).addEventListener("change", render);
$("backup").addEventListener("click", () =>
  download("spendly-backup.json", book.export(), "application/json"),
);
$("import").addEventListener("change", async (event) => {
  try {
    const file = event.target.files[0];
    if (!file || file.size > 16 * 1024 * 1024)
      throw Error("Use a JSON backup up to 16 MiB.");
    const next = ExpenseBook.import(await file.text());
    if (
      window.confirm(
        `Replace this workspace with ${next.rows.length} imported expenses?`,
      )
    ) {
      persist(next);
      cancel();
      announce("Validated backup imported.");
    }
  } catch (error) {
    announce("Import rejected; existing data retained. " + error.message);
  }
});
$("clear").addEventListener("click", () => {
  if (
    window.confirm(
      "Clear all expenses in this browser? Export a backup first if needed.",
    )
  ) {
    try {
      persist(new ExpenseBook());
      cancel();
      announce("Workspace cleared.");
    } catch (error) {
      announce(error.message);
    }
  }
});
$("demo").addEventListener("click", () => {
  if (
    book.rows.length &&
    !window.confirm(
      "Replace existing expenses with a fictional example? Export a backup first.",
    )
  )
    return;
  try {
    persist(
      new ExpenseBook([
        {
          id: "demo-1",
          description: "Fictional lunch",
          paise: 25000,
          date: "2026-01-15",
          category: "Food",
        },
        {
          id: "demo-2",
          description: "Fictional bus fare",
          paise: 4500,
          date: "2026-01-16",
          category: "Transport",
        },
        {
          id: "demo-3",
          description: "Fictional course",
          paise: 99900,
          date: "2026-01-17",
          category: "Learning",
        },
      ]),
    );
    announce("Fictional example loaded locally.");
  } catch (error) {
    announce(error.message);
  }
});
try {
  const stored = localStorage.getItem(KEY);
  if (stored) book = ExpenseBook.import(stored);
} catch (error) {
  announce(
    "Stored data could not be read. It was not overwritten: " + error.message,
  );
}
cancel();
render();
