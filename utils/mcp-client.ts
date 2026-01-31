/**
 * MCP Client for BusinessAI Mobile App
 * Connects to the BusinessAI MCP server for AI-powered business operations
 */

import { supabase } from './supabase';

const MCP_SERVER_URL = process.env.EXPO_PUBLIC_MCP_SERVER_URL || 'https://mcp.felon.in';

interface MCPToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

interface MCPToolResult {
  result?: unknown;
  error?: string;
}

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Call an MCP tool on the server (with authentication)
 */
export async function callMCPTool(tool: MCPToolCall): Promise<MCPToolResult> {
  try {
    const token = await getAuthToken();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[MCP] Tool Call:', tool.name);
    console.log('[MCP] Server URL:', MCP_SERVER_URL);
    console.log('[MCP] Token snippet:', token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'NULL');
    console.log('[MCP] Arguments:', JSON.stringify(tool.arguments, null, 2));

    if (!token) {
      console.error('[MCP] ❌ No authentication token available');
      return { error: 'Not authenticated. Please sign in.' };
    }

    const requestBody = {
      name: tool.name,
      arguments: tool.arguments,
    };
    console.log('[MCP] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${MCP_SERVER_URL}/mcp/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[MCP] Response status:', response.status);
    console.log('[MCP] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MCP] ❌ 401 Unauthorized:', errorData);
      return { error: errorData.message || errorData.error || 'Session expired. Please sign in again.' };
    }

    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MCP] ❌ 403 Forbidden:', errorData);
      return { error: errorData.message || errorData.error || 'Access denied. You can only access your own data.' };
    }

    if (response.status === 500) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MCP] ❌ 500 Server Error:', errorData);
      return { error: errorData.message || errorData.error || 'Server error. Please try again.' };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MCP] ❌ Error response:', errorText);
      try {
        const error = JSON.parse(errorText);
        return { error: error.error || error.message || 'Failed to call MCP tool' };
      } catch {
        return { error: `Server error: ${response.status} ${response.statusText}` };
      }
    }

    const resultText = await response.text();
    console.log(`[MCP] ✅ Raw response (${resultText.length} chars):`, resultText.substring(0, 500));

    try {
      const result = JSON.parse(resultText);
      console.log(`[MCP] ✅ Parsed result:`, JSON.stringify(result).substring(0, 300));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return result;
    } catch (parseError) {
      console.error('[MCP] ❌ Failed to parse JSON response:', parseError);
      return { error: 'Invalid JSON response from server' };
    }
  } catch (error) {
    console.error('[MCP] ❌ Exception:', error);
    console.error('[MCP] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Get list of available MCP tools
 */
export async function getMCPTools(): Promise<string[]> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/mcp/tools`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.tools?.map((t: { name: string }) => t.name) || [];
  } catch {
    return [];
  }
}

/**
 * Check if MCP server is healthy
 */
export async function checkMCPHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ============ CONVENIENCE METHODS ============

/**
 * Generate UPI QR code for receiving payment
 */
export async function generateUPIQR(params: {
  payee_upi_id: string;
  payee_name: string;
  amount: number;
  transaction_note?: string;
  transaction_ref?: string;
}) {
  return callMCPTool({
    name: 'generate_upi_qr',
    arguments: params,
  });
}

/**
 * Create a new invoice
 */
export async function createInvoice(params: {
  user_id: string;
  customer_id?: string;
  invoice_type?: 'invoice' | 'quotation' | 'proforma' | 'delivery_challan';
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    unit?: string;
    gst_rate?: number;
  }>;
  notes?: string;
}) {
  return callMCPTool({
    name: 'create_invoice',
    arguments: params,
  });
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(params: {
  user_id: string;
  invoice_id: string;
  include_qr?: boolean;
}) {
  return callMCPTool({
    name: 'generate_invoice_pdf',
    arguments: params,
  });
}

/**
 * Share invoice via WhatsApp
 */
export async function shareInvoiceWhatsApp(params: {
  user_id: string;
  invoice_id: string;
  phone: string;
}) {
  return callMCPTool({
    name: 'share_invoice_whatsapp',
    arguments: params,
  });
}

/**
 * Get inventory products
 */
export async function getProducts(params: {
  user_id: string;
  category?: string;
  search?: string;
  low_stock_only?: boolean;
}) {
  return callMCPTool({
    name: 'get_products',
    arguments: params,
  });
}

/**
 * Get low stock alerts
 */
export async function getInventoryAlerts(user_id: string) {
  return callMCPTool({
    name: 'get_inventory_alerts',
    arguments: { user_id },
  });
}

/**
 * Get sales analytics
 */
export async function getSalesAnalytics(params: {
  user_id: string;
  period: 'week' | 'month' | 'year';
}) {
  return callMCPTool({
    name: 'get_sales_analytics',
    arguments: params,
  });
}

/**
 * Get daily report
 */
export async function getDailyReport(params: {
  user_id: string;
  date: string;
}) {
  return callMCPTool({
    name: 'get_daily_report',
    arguments: params,
  });
}

/**
 * Calculate GST
 */
export async function calculateGST(params: {
  base_amount: number;
  gst_rate: number;
  is_interstate?: boolean;
}) {
  return callMCPTool({
    name: 'calculate_gst',
    arguments: params,
  });
}

/**
 * Send payment reminder via WhatsApp
 */
export async function sendPaymentReminder(params: {
  customer_name: string;
  invoice_number: string;
  amount: number;
  phone: string;
  due_date?: string;
  upi_id?: string;
}) {
  return callMCPTool({
    name: 'send_payment_reminder',
    arguments: params,
  });
}

/**
 * Get outstanding payments
 */
export async function getOutstandingPayments(user_id: string) {
  return callMCPTool({
    name: 'get_outstanding_payments',
    arguments: { user_id },
  });
}

/**
 * Get business summary
 */
export async function getBusinessSummary(user_id: string) {
  return callMCPTool({
    name: 'get_business_summary',
    arguments: { user_id },
  });
}

/**
 * Create transaction record
 */
export async function createTransaction(params: {
  user_id: string;
  amount: number;
  payment_type: 'cash' | 'upi' | 'credit' | 'bank_transfer' | 'cheque';
  customer_id?: string;
  invoice_id?: string;
  notes?: string;
}) {
  return callMCPTool({
    name: 'create_transaction',
    arguments: params,
  });
}

/**
 * Update stock quantity
 */
export async function updateStock(params: {
  user_id: string;
  product_id: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
}) {
  return callMCPTool({
    name: 'update_stock',
    arguments: params,
  });
}

/**
 * Get recent invoices/documents
 */
export async function getRecentInvoices(params: {
  user_id: string;
  limit?: number;
  invoice_type?: 'invoice' | 'quotation' | 'proforma' | 'delivery_challan' | 'all';
}) {
  return callMCPTool({
    name: 'get_invoices',
    arguments: params,
  });
}

/**
 * Get transactions with optional filters
 */
export async function getTransactions(params: {
  user_id: string;
  limit?: number;
  payment_type?: 'cash' | 'upi' | 'credit' | 'bank_transfer' | 'cheque';
  start_date?: string;
  end_date?: string;
}) {
  return callMCPTool({
    name: 'get_transactions',
    arguments: params,
  });
}
