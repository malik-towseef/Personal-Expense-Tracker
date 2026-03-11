const API_URL = 'http://127.0.0.1:5000/api/transactions';

// State
let transactions = [];
let chartInstance = null;
let currentCurrency = '$';

// DOM Elements
const form = document.getElementById('transaction-form');
const titleInput = document.getElementById('trans-title');
const amountInput = document.getElementById('trans-amount');
const typeInput = document.getElementById('trans-type');
const categoryInput = document.getElementById('trans-category');
const dateInput = document.getElementById('trans-date');
const idInput = document.getElementById('trans-id');
const submitBtn = document.getElementById('submit-btn');

const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const tableBody = document.getElementById('transactions-body');

const filterMonth = document.getElementById('filter-month');
const filterCategory = document.getElementById('filter-category');
const exportBtn = document.getElementById('export-btn');
const currencySelector = document.getElementById('global-currency');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchTransactions();
    
    form.addEventListener('submit', handleFormSubmit);
    filterMonth.addEventListener('change', renderUI);
    filterCategory.addEventListener('change', renderUI);
    exportBtn.addEventListener('click', exportCSV);
    
    currencySelector.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        renderUI();
    });
});

// Fetch Transactions
async function fetchTransactions() {
    try {
        const response = await fetch(API_URL);
        transactions = await response.json();
        renderUI();
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

// Render UI Components
function renderUI() {
    const filtered = getFilteredTransactions();
    updateDashboard(filtered);
    renderTable(filtered);
    renderChart(filtered);
}

// Filter Logic ($O(N)$ linear scan)
function getFilteredTransactions() {
    const month = filterMonth.value;
    const category = filterCategory.value;

    return transactions.filter(t => {
        let matchMonth = true;
        let matchCategory = true;

        if (month) {
            // date format: YYYY-MM-DD
            const tMonth = t.date.split('-')[1];
            matchMonth = tMonth === month;
        }

        if (category) {
            matchCategory = t.category === category;
        }

        return matchMonth && matchCategory;
    });
}

// Update Dashboard Calculations ($O(N)$ data aggregation)
function updateDashboard(filtered) {
    const amounts = filtered.map(t => ({
        amount: parseFloat(t.amount),
        type: t.type
    }));

    const income = amounts
        .filter(item => item.type === 'income')
        .reduce((acc, item) => acc + item.amount, 0);

    const expense = amounts
        .filter(item => item.type === 'expense')
        .reduce((acc, item) => acc + item.amount, 0);

    const balance = income - expense;

    incomeEl.innerText = `+${currentCurrency}${income.toFixed(2)}`;
    expenseEl.innerText = `-${currentCurrency}${expense.toFixed(2)}`;
    balanceEl.innerText = `${currentCurrency}${balance.toFixed(2)}`;
}

// Render Table
function renderTable(filtered) {
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No transactions found</td></tr>`;
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        const isIncome = t.type === 'income';
        const amountSign = isIncome ? '+' : '-';
        const typeClass = isIncome ? 'type-income' : 'type-expense';

        tr.innerHTML = `
            <td>${t.date}</td>
            <td style="font-weight: 500">${t.title}</td>
            <td>${t.category}</td>
            <td><span class="type-badge ${typeClass}">${t.type}</span></td>
            <td style="font-weight: 600; color: ${isIncome ? 'var(--success)' : 'var(--danger)'}">
                ${amountSign}${currentCurrency}${parseFloat(t.amount).toFixed(2)}
            </td>
            <td class="action-btns">
                <button class="btn-icon btn-edit" onclick="editTransaction(${t.id})" title="Edit">✎</button>
                <button class="btn-icon btn-delete" onclick="deleteTransaction(${t.id})" title="Delete">🗑</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Render Chart ($O(N)$ category grouping)
function renderChart(filtered) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Filter only expenses for the pie chart
    const expenses = filtered.filter(t => t.type === 'expense');
    
    // Group by category using a Hash Map
    const categoryTotals = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
    }, {});

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (chartInstance) {
        chartInstance.destroy();
    }

    if (expenses.length === 0) {
        // Render Empty state chart
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{ data: [1], backgroundColor: ['#334155'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
        return;
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', padding: 20, font: { family: 'Outfit', size: 12 } }
                }
            }
        }
    });
}

// Form Submit Handler (Create / Update)
async function handleFormSubmit(e) {
    e.preventDefault();

    const id = idInput.value;
    const transaction = {
        title: titleInput.value,
        amount: parseFloat(amountInput.value),
        type: typeInput.value,
        category: categoryInput.value,
        date: dateInput.value
    };

    try {
        if (id) {
            // Update
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
        } else {
            // Create
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            });
        }

        // Reset form and UI
        form.reset();
        idInput.value = '';
        submitBtn.innerText = 'Save Transaction';
        fetchTransactions();
    } catch (error) {
        console.error('Error saving transaction', error);
    }
}

// Edit Transaction
function editTransaction(id) {
    const t = transactions.find(t => t.id === id);
    if (!t) return;

    idInput.value = t.id;
    titleInput.value = t.title;
    amountInput.value = t.amount;
    typeInput.value = t.type;
    categoryInput.value = t.category;
    dateInput.value = t.date;
    
    submitBtn.innerText = 'Update Transaction';
    
    // Scroll to form
    document.getElementById('add-transaction').scrollIntoView({ behavior: 'smooth' });
}

// Delete Transaction
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchTransactions();
    } catch (error) {
        console.error('Error deleting transaction', error);
    }
}

// Export CSV
function exportCSV() {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
        alert('No transactions to export.');
        return;
    }

    const headers = ['Date,Title,Category,Type,Amount'];
    const rows = filtered.map(t => {
        // escape string if needed, basic implementation
        const title = `"${t.title.replace(/"/g, '""')}"`;
        return `${t.date},${title},${t.category},${t.type},${t.amount}`;
    });

    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
