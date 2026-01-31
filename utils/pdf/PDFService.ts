import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
  shopName: string;
  customerPhone: string;
  items: InvoiceItem[];
  total: number;
  date: string;
}

export const generateInvoicePDF = async (
  data: InvoiceData,
): Promise<string> => {
  const tableRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `,
    )
    .join("");

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4285F4; padding-bottom: 20px; }
          .shop-name { font-size: 28px; font-weight: bold; color: #4285F4; }
          .invoice-title { font-size: 20px; color: #666; margin-top: 10px; }
          .details { margin-bottom: 30px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #eee; }
          .total-section { text-align: right; border-top: 2px solid #eee; padding-top: 20px; }
          .total-label { font-size: 18px; color: #666; }
          .total-amount { font-size: 24px; font-weight: bold; color: #34A853; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${data.shopName}</div>
          <div class="invoice-title">Sales Invoice</div>
        </div>
        
        <div class="details">
          <div>
            <strong>Bill To:</strong><br>
            Phone: ${data.customerPhone}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong><br>
            ${data.date}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="total-section">
          <span class="total-label">Grand Total: </span>
          <span class="total-amount">₹${data.total}</span>
        </div>

        <div class="footer">
          Thank you for your business!<br>
          This is a computer generated invoice.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    return uri;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};

export const shareInvoicePDF = async (uri: string) => {
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share Invoice",
    UTI: "com.adobe.pdf",
  });
};
