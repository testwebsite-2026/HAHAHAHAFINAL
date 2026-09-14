/**
 * reports.js
 * Sales reporting: date-filtered stats, top products, transaction log,
 * CSV export, and printable summary.
 */

const Reports = {
  filterFrom: null,
  filterTo: null,

  init() {
    document.getElementById('downloadReportsBtn').addEventListener('click', () => this.openDownloadModal());
    document.getElementById('cancelReportsBtn').addEventListener('click', () => UI.closeModal('reportsDateModal'));
    document.getElementById('confirmDownloadReportsBtn').addEventListener('click', () => this.downloadReport());

    // Set default dates to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDownloadFrom').value = today;
    document.getElementById('reportDownloadTo').value = today;

    this.render();
  },

  openDownloadModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDownloadFrom').value = this.filterFrom ? this.filterFrom.toISOString().split('T')[0] : today;
    document.getElementById('reportDownloadTo').value = this.filterTo ? this.filterTo.toISOString().split('T')[0] : today;
    document.getElementById('reportIncludePreview').checked = false;
    UI.openModal('reportsDateModal');
  },

  downloadReport() {
    const from = document.getElementById('reportDownloadFrom').value;
    const to = document.getElementById('reportDownloadTo').value;
    const preview = document.getElementById('reportIncludePreview').checked;

    this.filterFrom = from ? new Date(from + 'T00:00:00') : null;
    this.filterTo = to ? new Date(to + 'T23:59:59') : null;

    if (preview) {
      this.render();
      UI.closeModal('reportsDateModal');
      UI.toast('Preview loaded. Scroll down to see the report.');
    } else {
      this.exportCsv();
      UI.closeModal('reportsDateModal');
    }
  },

  getFilteredSales() {
    return DB.getSales().filter(s => {
      const d = new Date(s.datetime);
      if (this.filterFrom && d < this.filterFrom) return false;
      if (this.filterTo && d > this.filterTo) return false;
      return true;
    });
  },

  render() {
    const sales = this.getFilteredSales().sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = sales.length;
    const itemsSold = sales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.qty, 0), 0);
    const avgSale = totalTransactions ? totalSales / totalTransactions : 0;

    document.getElementById('statTotalSales').textContent = UI.peso(totalSales);
    document.getElementById('statTransactions').textContent = totalTransactions;
    document.getElementById('statItemsSold').textContent = itemsSold;
    document.getElementById('statAvgSale').textContent = UI.peso(avgSale);

    this.renderSalesTable(sales);
  },

  renderSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    if (sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">No transactions in this range.</td></tr>`;
      return;
    }

    tbody.innerHTML = sales.map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${UI.formatDateTime(s.datetime)}</td>
        <td>${UI.escapeHtml(s.cashier)}</td>
        <td>${s.items.reduce((a, i) => a + i.qty, 0)}</td>
        <td>${UI.peso(s.total)}</td>
        <td><button class="icon-btn view-sale-btn" data-id="${s.id}" title="View receipt">🧾</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-sale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sale = DB.getSales().find(s => s.id === btn.dataset.id);
        if (sale) Receipt.show(sale);
      });
    });
  },

  exportCsv() {
    const sales = this.getFilteredSales();
    if (sales.length === 0) {
      UI.toast('No transactions to export.');
      return;
    }

    const rows = [['Sale ID', 'Date/Time', 'Cashier', 'Item', 'Qty', 'Unit Price', 'Subtotal', 'Sale Total', 'Amount Paid', 'Change']];
    sales.forEach(s => {
      s.items.forEach(i => {
        rows.push([s.id, s.datetime, s.cashier, i.name, i.qty, i.price, i.subtotal, s.total, s.amountPaid, s.change]);
      });
    });

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tindarhan-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('CSV exported.');
  },

  printReport() {
    window.print();
  },
};
