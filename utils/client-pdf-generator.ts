/**
 * Client-side PDF generator
 * Generates PDFs directly in the app when only data is available
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

interface User {
  name: string;
  shop_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gst_number?: string | null;
}

interface DailyReportData {
  date: string;
  total_sales: number;
  total_transactions: number;
  total_expenses: number;
  top_products?: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

interface Invoice {
  invoice_number: string;
  customer_name?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    gst_rate?: number;
  }>;
  total_amount: number;
  subtotal: number;
  total_gst: number;
  created_at: string;
}

/**
 * Generate a daily report PDF
 */
export async function generateDailyReportPDF(data: DailyReportData, user: User): Promise<string> {
  // Add safety checks and defaults
  const safeData = {
    date: data?.date || new Date().toISOString().split('T')[0],
    total_sales: data?.total_sales || 0,
    total_transactions: data?.total_transactions || 0,
    total_expenses: data?.total_expenses || 0,
    top_products: data?.top_products || [],
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2196F3;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #2196F3;
      font-size: 28px;
      margin-bottom: 5px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .shop-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .shop-info h2 {
      color: #2196F3;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .shop-info p {
      font-size: 13px;
      color: #666;
      margin: 3px 0;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card.green {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
    .card.orange {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .card-label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .card-value {
      font-size: 28px;
      font-weight: bold;
    }
    .products-section {
      margin-top: 30px;
    }
    .products-section h3 {
      color: #2196F3;
      margin-bottom: 15px;
      font-size: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    th {
      background: #2196F3;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 13px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
      font-style: italic;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 11px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Daily Sales Report</h1>
    <p class="subtitle">${new Date(data.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
  </div>

  <div class="shop-info">
    <h2>${user.shop_name || user.name}</h2>
    ${user.email ? `<p>📧 ${user.email}</p>` : ''}
    ${user.phone ? `<p>📱 ${user.phone}</p>` : ''}
    ${user.address ? `<p>📍 ${user.address}</p>` : ''}
    ${user.gst_number ? `<p>🏢 GST: ${user.gst_number}</p>` : ''}
  </div>

  <div class="summary-cards">
    <div class="card green">
      <div class="card-label">Total Sales</div>
      <div class="card-value">₹${safeData.total_sales.toLocaleString('en-IN')}</div>
    </div>
    <div class="card">
      <div class="card-label">Transactions</div>
      <div class="card-value">${safeData.total_transactions}</div>
    </div>
    <div class="card orange">
      <div class="card-label">Expenses</div>
      <div class="card-value">₹${safeData.total_expenses.toLocaleString('en-IN')}</div>
    </div>
  </div>

  ${safeData.top_products && safeData.top_products.length > 0 ? `
    <div class="products-section">
      <h3>🏆 Top Products</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity Sold</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${safeData.top_products.map(product => `
            <tr>
              <td>${product.name || 'N/A'}</td>
              <td>${product.quantity || 0}</td>
              <td>₹${(product.revenue || 0).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : `
    <div class="empty-state">
      <p>No sales data available for this day</p>
    </div>
  `}

  <div class="footer">
    <p>Generated via BusinessAI • ${new Date().toLocaleString('en-IN')}</p>
  </div>
</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Generate an invoice PDF
 */
export async function generateInvoicePDF(invoice: Invoice, user: User, customer?: { name?: string }): Promise<string> {
  // Add safety checks and defaults
  const safeInvoice = {
    invoice_number: invoice?.invoice_number || 'N/A',
    customer_name: invoice?.customer_name || customer?.name || 'N/A',
    items: invoice?.items || [],
    total_amount: invoice?.total_amount || 0,
    subtotal: invoice?.subtotal || 0,
    total_gst: invoice?.total_gst || 0,
    created_at: invoice?.created_at || new Date().toISOString(),
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, sans-serif;
      padding: 40px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      border-bottom: 2px solid #2196F3;
      padding-bottom: 20px;
    }
    .company h1 {
      color: #2196F3;
      font-size: 24px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      color: #2196F3;
      font-size: 20px;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party {
      flex: 1;
    }
    .party h3 {
      color: #2196F3;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .party p {
      font-size: 13px;
      margin: 3px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #2196F3;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 13px;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .totals table {
      margin-left: auto;
      width: 300px;
    }
    .totals td {
      border: none;
    }
    .totals .grand-total {
      font-size: 18px;
      font-weight: bold;
      color: #2196F3;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>${user.shop_name || user.name}</h1>
      <p>${user.address || ''}</p>
      <p>${user.phone || ''}</p>
      ${user.gst_number ? `<p>GSTIN: ${user.gst_number}</p>` : ''}
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p>#${safeInvoice.invoice_number}</p>
      <p>${new Date(safeInvoice.created_at).toLocaleDateString('en-IN')}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Bill To:</h3>
      <p><strong>${safeInvoice.customer_name}</strong></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>GST</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${safeInvoice.items.map(item => {
        const quantity = item?.quantity || 0;
        const unitPrice = item?.unit_price || 0;
        const gstRate = item?.gst_rate || 0;
        const amount = quantity * unitPrice;
        const gstAmount = amount * gstRate / 100;
        const total = amount + gstAmount;
        return `
          <tr>
            <td>${item?.name || 'N/A'}</td>
            <td>${quantity}</td>
            <td>₹${unitPrice.toLocaleString('en-IN')}</td>
            <td>${gstRate}%</td>
            <td>₹${total.toLocaleString('en-IN')}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td>₹${safeInvoice.subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>GST:</td>
        <td>₹${safeInvoice.total_gst.toLocaleString('en-IN')}</td>
      </tr>
      <tr class="grand-total">
        <td>Total:</td>
        <td>₹${safeInvoice.total_amount.toLocaleString('en-IN')}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 40px; text-align: center; color: #999; font-size: 11px;">
    <p>Generated via BusinessAI</p>
  </div>
</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Generate a generic markdown PDF
 */
export async function generateMarkdownPDF(title: string, content: string, user: User): Promise<string> {
  // Convert markdown to HTML (simple conversion)
  let htmlContent = content
    .replace(/## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    h1 {
      color: #2196F3;
      margin-bottom: 10px;
      font-size: 24px;
    }
    h2 {
      color: #2196F3;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 18px;
    }
    li {
      margin: 5px 0;
    }
    .header {
      border-bottom: 2px solid #2196F3;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .shop-name {
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p class="shop-name">${user.shop_name || user.name}</p>
    <p style="font-size: 12px; color: #999;">${new Date().toLocaleDateString('en-IN')}</p>
  </div>
  <div>
    ${htmlContent}
  </div>
  <div style="margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px;">
    <p>Generated via BusinessAI</p>
  </div>
</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Main function to generate PDF based on document type
 */
export async function generatePDFFromDocumentData(documentData: any): Promise<string> {
  try {
    if (!documentData) {
      throw new Error('No document data provided');
    }

    const { docType, data, user } = documentData;

    if (!docType) {
      throw new Error('Document type not specified');
    }

    console.log('[PDF Generator] Generating PDF for type:', docType);
    console.log('[PDF Generator] Document data:', JSON.stringify(documentData).substring(0, 200));

    switch (docType) {
      case 'report':
        if (!data) {
          throw new Error('No report data provided');
        }
        if (documentData.reportType === 'daily') {
          return await generateDailyReportPDF(data, user || {});
        }
        // For other report types, generate generic
        return await generateMarkdownPDF('Business Report', JSON.stringify(data, null, 2), user || {});

      case 'invoice':
        if (!documentData.invoice) {
          throw new Error('No invoice data provided');
        }
        return await generateInvoicePDF(documentData.invoice, user || {}, documentData.customer);

      case 'markdown':
        if (!documentData.title || !documentData.content) {
          throw new Error('Title or content missing for markdown PDF');
        }
        return await generateMarkdownPDF(documentData.title, documentData.content, user || {});

      default:
        throw new Error(`Unknown document type: ${docType}`);
    }
  } catch (error) {
    console.error('[PDF Generator] Error:', error);
    throw error;
  }
}

/**
 * Helper to share PDF
 */
export async function sharePDF(uri: string, title: string = 'Document') {
  try {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'PDF sharing is not supported on web');
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${title}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Success', 'PDF generated successfully');
    }
  } catch (error) {
    console.error('[PDF Generator] Share error:', error);
    throw error;
  }
}
