import { marked } from 'marked';

/**
 * PDF Generation Utilities
 * Generates HTML templates for business documents
 */

export const generateInvoiceHTML = (invoice: any, user: any, customer: any) => {
  const items = invoice.items || [];
  const itemsHtml = items.map((item: any, index: number) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.quantity} ${item.unit || ''}</td>
      <td>₹${(item.unit_price || 0).toFixed(2)}</td>
      <td>₹${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3366ff; padding-bottom: 20px; margin-bottom: 30px; }
          .shop-info h1 { margin: 0; color: #3366ff; font-size: 28px; }
          .shop-info p { margin: 5px 0; color: #666; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { margin: 0; color: #333; font-size: 24px; }
          .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-to h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; color: #333; }
          .bill-to p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f8f9fa; color: #333; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { margin-left: auto; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; }
          .grand-total { border-top: 2px solid #3366ff; font-weight: bold; font-size: 18px; color: #3366ff; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-info">
            <h1>${user.shopName || user.name || 'My Shop'}</h1>
            <p>${user.address || ''}</p>
            <p>Phone: ${user.phone || ''}</p>
            ${user.gstNumber ? `<p>GSTIN: ${user.gstNumber}</p>` : ''}
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p>#${invoice.invoice_number}</p>
            <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="details">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${customer?.name || 'Cash Customer'}</strong></p>
            <p>${customer?.phone || ''}</p>
            <p>${customer?.address || ''}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${(invoice.subtotal || invoice.total_amount || invoice.total || 0).toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${(invoice.total_amount || invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated via BusinessAI</p>
        </div>
      </body>
    </html>
  `;
};

export const generateReportHTML = (type: string, data: any, user: any) => {
  let content = '';
  let title = 'Business Report';

  if (type === 'daily') {
    title = 'Daily Performance Report';
    content = `
      <div class="summary-grid">
        <div class="card"><h3>Total Sales</h3><p>₹${(data.totalSales || 0).toFixed(2)}</p></div>
        <div class="card"><h3>Transactions</h3><p>${data.transactionCount || 0}</p></div>
        <div class="card"><h3>Average Ticket</h3><p>₹${(data.totalSales / (data.transactionCount || 1)).toFixed(2)}</p></div>
      </div>
      <h3>Recent Transactions</h3>
      <table>
        <thead><tr><th>Time</th><th>Customer</th><th>Amount</th><th>Type</th></tr></thead>
        <tbody>
          ${(data.recentTransactions || []).map((t: any) => `
            <tr>
              <td>${new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>${t.customer_name || 'Walking Customer'}</td>
              <td>₹${t.amount.toFixed(2)}</td>
              <td>${t.payment_type.toUpperCase()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'analytics') {
    title = 'Sales Analytics Report';
    content = `
      <div class="summary-grid">
        <div class="card"><h3>Total Revenue</h3><p>₹${data.totalRevenue.toFixed(2)}</p></div>
        <div class="card"><h3>Avg Daily</h3><p>₹${data.averageDailySales.toFixed(2)}</p></div>
        <div class="card"><h3>Growth</h3><p>${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%</p></div>
      </div>
      <h3>Daily Sales Breakdown</h3>
      <table>
        <thead><tr><th>Date</th><th>Revenue</th><th>Count</th></tr></thead>
        <tbody>
          ${(data.dailySales || []).map((d: any) => `
            <tr><td>${d.date}</td><td>₹${d.revenue.toFixed(2)}</td><td>${d.count}</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    title = 'Business Summary';
    content = `
      <div class="summary-grid">
        <div class="card"><h3>Total Revenue</h3><p>₹${data.totalRevenue.toFixed(2)}</p></div>
        <div class="card"><h3>Outstanding</h3><p>₹${data.totalOutstanding.toFixed(2)}</p></div>
        <div class="card"><h3>Low Stock</h3><p>${data.lowStockCount} Items</p></div>
      </div>
      <p>This summary provides an overview of your entire business operations, including current inventory health and financial standing.</p>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #ffcc00; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .summary-grid { display: flex; gap: 20px; margin-bottom: 30px; }
          .card { flex: 1; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; }
          .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; }
          .card p { margin: 0; font-size: 20px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${user.shopName || user.name || 'My Business'}</h1>
          <h2>${title}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        ${content}
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${user.shopName || user.name}</p>
          <p>Generated via BusinessAI Assistant</p>
        </div>
      </body>
    </html>
  `;
};

export const generateGenericHTML = (msgData: any, user: any) => {
  const data = msgData.data || msgData;
  const entries = Object.entries(data).filter(([key]) =>
    !['isDocument', 'docType', 'user', 'reportType', 'pdf_base64', 'filename'].includes(key)
  );

  const rowsHtml = entries.map(([key, value]) => `
    <tr>
      <td style="width: 40%; background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 12px;"><strong>${key.replace(/_/g, ' ').toUpperCase()}</strong></td>
      <td style="border: 1px solid #dee2e6; padding: 12px;">${typeof value === 'object' ? JSON.stringify(value) : value}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #3366ff; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${user?.shopName || user?.name || 'BusinessAI Business'}</h1>
          <h2>Business Information Report</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">
          <p>This document was automatically generated based on requested data.</p>
          <p>Generated via BusinessAI Anyhow™ System</p>
        </div>
      </body>
    </html>
  `;
};

export const generateMarkdownHTML = (title: string, markdown: string, user: any) => {
  const contentHtml = marked.parse(markdown);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #3366ff; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .content { font-size: 14px; }
          .content h1, .content h2, .content h3 { color: #3366ff; margin-top: 20px; }
          .content table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .content th, .content td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
          .content th { background-color: #f8f9fa; }
          .content blockquote { border-left: 4px solid #3366ff; padding-left: 20px; color: #666; font-style: italic; }
          .footer { margin-top: 50px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${user?.shopName || user?.name || 'BusinessAI Business'}</h1>
          <h2>${title}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>This document was generated by BusinessAI according to your requirements.</p>
          <p>Generated via BusinessAI Markdown Console</p>
        </div>
      </body>
    </html>
  `;
};
