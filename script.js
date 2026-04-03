// ===== Load Data =====
let stored = localStorage.getItem("transactions");

if (stored) {
  transactions = JSON.parse(stored);
} else {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ===== Elements =====
let tableBody = document.getElementById("tableBody");
let searchInput = document.getElementById("search");
let filterSelect = document.getElementById("filter");
let roleSelect = document.getElementById("role");
let addBtn = document.getElementById("addBtn");

// ===== Chart Instances (IMPORTANT FIX) =====
let lineChart = null;
let pieChart = null;

// ===== Format Currency =====
function formatCurrency(val) {
  return "₹" + val.toLocaleString("en-IN");
}

// ===== Display Transactions =====
function displayTransactions(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>No transactions found</td></tr>";
    return;
  }

  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  data.forEach(t => {
    tableBody.innerHTML += `
      <tr>
        <td>${t.date}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${t.category}</td>
        <td style="color:${t.type === 'income' ? 'green' : 'red'}">${t.type}</td>
      </tr>
    `;
  });

  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// ===== Summary =====
function updateSummary() {
  let income = 0, expense = 0;

  transactions.forEach(t => {
    t.type === "income" ? income += t.amount : expense += t.amount;
  });

  document.getElementById("income").innerText = income;
  document.getElementById("expense").innerText = expense;
  document.getElementById("balance").innerText = income - expense;
}

// ===== Filter =====
function filterData() {
  let search = searchInput.value.toLowerCase();
  let type = filterSelect.value;

  let filtered = transactions.filter(t =>
    t.category.toLowerCase().includes(search) &&
    (type === "all" || t.type === type)
  );

  displayTransactions(filtered);
}

searchInput.addEventListener("input", filterData);
filterSelect.addEventListener("change", filterData);

// ===== Role UI =====
roleSelect.addEventListener("change", () => {
  let isAdmin = roleSelect.value === "admin";

  addBtn.style.display = isAdmin ? "block" : "none";
  searchInput.disabled = !isAdmin;
});

// ===== Add Transaction =====
document.getElementById("addBtn").onclick = () => {
  document.getElementById("addForm").classList.toggle("show");
};

document.getElementById("submitBtn").onclick = () => {
  let date = document.getElementById("newDate").value;
  let amount = parseFloat(document.getElementById("newAmount").value);
  let category = document.getElementById("newCategory").value;
  let type = document.getElementById("newType").value;

  if (!date || !amount || !category || !type) {
    alert("Fill all fields");
    return;
  }

  transactions.push({ id: Date.now(), date, amount, category, type });

  displayTransactions(transactions);
  updateSummary();
  generateInsights();
  createCharts();

  document.getElementById("addForm").classList.remove("show");
};

// ===== Insights =====
function generateInsights() {
  let totals = {};
  let income = 0, expense = 0;

  transactions.forEach(t => {
    if (t.type === "expense") {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
      expense += t.amount;
    } else {
      income += t.amount;
    }
  });

  let maxCat = "None", maxVal = 0;
  for (let c in totals) {
    if (totals[c] > maxVal) {
      maxVal = totals[c];
      maxCat = c;
    }
  }

  document.getElementById("insightText").innerText =
    `Top spending: ${maxCat} (${formatCurrency(maxVal)}) | ` +
    (expense > income ? "Overspending ⚠️" : "Good balance ✅");
}

// ===== Charts (FULL FIX) =====
function createCharts() {
  let lineCtx = document.getElementById("lineChart").getContext("2d");
  let pieCtx = document.getElementById("pieChart").getContext("2d");

  // Destroy old charts
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  // ===== Line Chart =====
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: transactions.map(t => t.date),
      datasets: [
        {
          label: "Income",
          data: transactions.map(t => t.type === "income" ? t.amount : 0),
          borderColor: "green",
          tension: 0.3
        },
        {
          label: "Expense",
          data: transactions.map(t => t.type === "expense" ? t.amount : 0),
          borderColor: "red",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // ===== Pie Chart (expenses only) =====
  let categoryTotals = {};

  transactions.forEach(t => {
    if (t.type === "expense") {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// ===== Init =====
displayTransactions(transactions);
updateSummary();
generateInsights();
createCharts();
let darkBtn = document.getElementById("darkToggle");

// Load saved mode
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

darkBtn.onclick = () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
};
document.getElementById("exportBtn").onclick = () => {
  if (transactions.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "Date,Amount,Category,Type\n";

  transactions.forEach(t => {
    csv += `${t.date},${t.amount},${t.category},${t.type}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
};