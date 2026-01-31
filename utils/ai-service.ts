/**
 * AI Service for BusinessAI Mobile App
 * Connects to LLM (via OpenRouter) with MCP tool support
 */

import { useUserStore } from '../store/useUserStore';
import { callMCPTool } from './mcp-client';
import { supabase } from './supabase';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY;

/**
 * Get user profile for context
 */
function getUserProfile() {
  const store = useUserStore.getState();
  return {
    name: store.name || 'Shop Owner',
    shopName: store.shopName || 'My Shop',
    upiId: store.upiId || '',
    email: store.email || '',
    language: store.language || 'hi-en',
  };
}

// MCP Tool definitions for the LLM
const MCP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'generate_upi_qr',
      description: 'Generate a UPI QR code for receiving payment. Returns base64 encoded QR image. The payee_upi_id and payee_name will be automatically filled from user profile if not provided.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount to receive in INR' },
          transaction_note: { type: 'string', description: 'Note for the transaction (e.g., "Payment for order #123")' },
          payee_upi_id: { type: 'string', description: 'UPI ID of the payee - OPTIONAL, auto-filled from profile' },
          payee_name: { type: 'string', description: 'Name of the payee/shop - OPTIONAL, auto-filled from profile' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_invoice_pdf',
      description: 'Generate a PDF invoice/quotation. Returns base64 encoded PDF.',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'The invoice ID' },
          include_qr: { type: 'boolean', description: 'Include UPI QR code' },
        },
        required: ['invoice_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_products',
      description: 'Get list of products/inventory items. Can filter by category, search term, or low stock status.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by category' },
          search: { type: 'string', description: 'Search term for product name' },
          low_stock_only: { type: 'boolean', description: 'Only show items with low stock' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_product',
      description: 'Add a new product to inventory',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product name' },
          category: { type: 'string', description: 'Product category' },
          price: { type: 'number', description: 'Selling price in INR' },
          quantity: { type: 'number', description: 'Current stock quantity' },
          unit: { type: 'string', description: 'Unit of measurement (pcs, kg, L, etc.)' },
          low_stock_threshold: { type: 'number', description: 'Alert when stock goes below this' },
        },
        required: ['name', 'category', 'price', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_stock',
      description: 'Update stock quantity for a product',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The product ID' },
          quantity: { type: 'number', description: 'Quantity to add/subtract/set' },
          operation: { type: 'string', enum: ['add', 'subtract', 'set'], description: 'Operation type' },
        },
        required: ['product_id', 'quantity', 'operation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_product',
      description: 'Remove a product from inventory. Use when user asks to delete, remove, or discontinue a product.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The product ID to delete' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inventory_alerts',
      description: 'Get low stock alerts for all products below their threshold',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create a new invoice or quotation. ALWAYS include GST rate for each item (common rates: 5%, 12%, 18%, 28%). The PDF will show GST breakdown automatically.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Customer name' },
          customer_phone: { type: 'string', description: 'Customer phone number' },
          invoice_type: { type: 'string', enum: ['invoice', 'quotation', 'proforma'], description: 'Type of document' },
          items: {
            type: 'array',
            description: 'List of items in the invoice. Each item should have a GST rate.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Item name' },
                quantity: { type: 'number', description: 'Quantity' },
                unit_price: { type: 'number', description: 'Price per unit (excluding GST)' },
                gst_rate: { type: 'number', description: 'GST rate in percentage (5, 12, 18, or 28). Default to 18 if not specified.' },
              },
              required: ['name', 'quantity', 'unit_price'],
            },
          },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_invoices',
      description: 'Get list of invoices with optional filters',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['paid', 'pending', 'overdue'], description: 'Filter by payment status' },
          date_from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
          date_to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Max number of results' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_sales_analytics',
      description: 'Get sales analytics and reports for week, month, or year. For today\'s data, use get_daily_report instead.',
      parameters: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month', 'year'], description: 'Time period for analytics' },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_report',
      description: 'Get daily business report including sales, expenses, and summary',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date for report (YYYY-MM-DD), defaults to today' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_gst',
      description: 'Calculate GST breakdown for a given amount. Use when user asks "GST kitna hoga" or wants to know GST on an amount. Shows CGST+SGST (intrastate) or IGST (interstate).',
      parameters: {
        type: 'object',
        properties: {
          base_amount: { type: 'number', description: 'Base amount before GST' },
          gst_rate: { type: 'number', description: 'GST rate percentage (5, 12, 18, 28). Default to 18% if not specified.' },
          is_interstate: { type: 'boolean', description: 'True for interstate (IGST), false for intrastate (CGST+SGST). Default to false.' },
        },
        required: ['base_amount', 'gst_rate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_outstanding_payments',
      description: 'Get list of pending/overdue payments from customers',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_payment_reminder',
      description: 'Prepare a WhatsApp payment reminder message for a customer',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Customer name' },
          invoice_number: { type: 'string', description: 'Invoice number' },
          amount: { type: 'number', description: 'Amount due' },
          phone: { type: 'string', description: 'Customer phone number' },
          due_date: { type: 'string', description: 'Payment due date' },
        },
        required: ['customer_name', 'invoice_number', 'amount', 'phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_business_summary',
      description: 'Get overall business summary including revenue, expenses, profit, and key metrics',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_customer',
      description: 'Add a new customer to the database',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Customer name' },
          phone: { type: 'string', description: 'Phone number' },
          email: { type: 'string', description: 'Email address' },
          address: { type: 'string', description: 'Address' },
          gstin: { type: 'string', description: 'GST number if applicable' },
        },
        required: ['name', 'phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_customers',
      description: 'Get list of customers',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by name or phone' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_expense',
      description: 'Record a business expense',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Expense amount' },
          category: { type: 'string', description: 'Expense category (rent, utilities, supplies, etc.)' },
          description: { type: 'string', description: 'Description of expense' },
          date: { type: 'string', description: 'Date of expense (YYYY-MM-DD)' },
        },
        required: ['amount', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_report_pdf',
      description: 'Generate a PDF report for business performance (daily, analytics, or summary). Returns base64 encoded PDF.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['daily', 'analytics', 'summary'], description: 'Type of report' },
          date: { type: 'string', description: 'Date for daily report (YYYY-MM-DD)' },
          period: { type: 'string', enum: ['week', 'month', 'year'], description: 'Period for analytics' },
        },
        required: ['type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_app_settings',
      description: 'Get current user profile settings (name, shop name, UPI ID, email)',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_custom_pdf',
      description: 'MANDATORY tool for generating PDFs. Use this when user asks: "generate report", "report banao", "PDF banao", "summary do", "analysis chahiye". You MUST call this tool - you cannot create PDFs without it! Include tables, bold text, lists in content_md using Markdown.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the document (e.g. "Daily Sales Report", "Business Summary")' },
          content_md: { type: 'string', description: 'Full content in Markdown format. Include:\n- ## Headers for sections\n- **Bold** for important numbers\n- Tables for data (| Header1 | Header2 |)\n- Bullet lists with - or *\n- GST breakdowns if relevant' },
        },
        required: ['title', 'content_md'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_app_screen',
      description: 'Open a specific screen or feature in the mobile app. Use this when the user asks to "open scanner", "go to settings", "show inventory", etc.',
      parameters: {
        type: 'object',
        properties: {
          screen: {
            type: 'string',
            enum: ['scanner', 'settings', 'inventory', 'sales', 'create_invoice', 'home', 'ask-ai', 'instant-invoice', 'notes', 'voice-modal'],
            description: 'The screen to navigate to'
          },
          data: {
            type: 'object',
            description: 'Optional data to pass to the screen (e.g., pre-filled invoice data, product ID to view, etc.)'
          },
        },
        required: ['screen'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user_settings',
      description: 'Update user settings like UPI ID, shop name, or other preferences. Use this when user asks to "set my UPI ID", "change shop name", etc.',
      parameters: {
        type: 'object',
        properties: {
          upi_id: { type: 'string', description: 'UPI ID for receiving payments' },
          shop_name: { type: 'string', description: 'Shop/business name' },
          show_cost_price: { type: 'boolean', description: 'Whether to show cost price in inventory' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_scanner',
      description: 'Open the barcode/QR code scanner. Use when user asks to "scan", "open scanner", "scan barcode", "scan QR code".',
      parameters: {
        type: 'object',
        properties: {
          scan_type: {
            type: 'string',
            enum: ['barcode', 'qr', 'any'],
            description: 'Type of code to scan. Default is "any".'
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prefill_invoice',
      description: 'Open the invoice creation screen with pre-filled data. Use when user provides invoice details and wants to create it.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Customer name' },
          customer_phone: { type: 'string', description: 'Customer phone' },
          items: {
            type: 'array',
            description: 'Invoice items',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
                gst_rate: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
];

function getSystemPrompt(profile: { name: string; shopName: string; upiId: string; email: string; language: string }) {
  const languageInstruction = {
    'en': 'Respond ONLY in English.',
    'hi': 'Respond ONLY in Hindi (Devanagari script).',
    'hi-en': 'Respond in Hinglish (Hindi words written in English script, mixed with English). This is the natural way Indian business owners communicate.',
  }[profile.language] || 'Respond in Hinglish (Hindi-English mix).';

  return `You are BusinessAI, a sophisticated business assistant and GST expert designed for Indian MSME (Micro, Small, and Medium Enterprises) owners. You operate as a high-level business consultant, inventory manager, and financial assistant.

## 1. IDENTITY & PERSONA
- **Core Identity**: You are helpful, professional, and knowledgeable about Indian business practices.
- **Tone**: Professional yet accessible, concise, and focused on business value.
- **Language**: ${languageInstruction}
  - If user writes in English, respond in English
  - If user writes in Hindi/Hinglish, respond in Hinglish (e.g., "Aapke paas 5 low stock items hain")
  - ALWAYS match the user's language style
  - Keep responses conversational and natural
- **Context**: You speak to the business owner, often in a fast-paced retail or wholesale environment.

## 2. USER CONTEXT (AUTOMATIC INJECTION)
- **Business Name**: ${profile.shopName}
- **Owner Name**: ${profile.name}
- **Financial Details**: UPI ID: ${profile.upiId || 'Not Set (Inform user if needed)'}, Email: ${profile.email || 'Not Set'}

## 3. DOMAIN KNOWLEDGE & MODULES
### A. Inventory Management
- Expertise in tracking SKU levels, categories, and cost/sell price relationships.
- Proactive in identifying low-stock items.
- **AI-Powered Inventory Control**: You can directly manage inventory through tools:
  - Add new products: create_product (name, price, quantity, barcode, etc.)
  - Update stock: update_stock (product_id, quantity, operation: 'add'|'subtract'|'set')
  - Remove products: delete_product (product_id)
  - Scan barcodes: open_scanner() when you need barcode data from physical products
  - Get alerts: get_inventory_alerts for low stock items
- **Smart Scanning**: When user says "scan and add", "scan product", use open_scanner() first, then create_product with the scanned barcode

### B. Financials & Billing
- Specialized in GST (Goods and Services Tax) calculations (CGST, SGST, IGST).
- Expert in Indian currency formatting (₹, Lakhs, Crores).
- Proficient in invoice, quotation, and payment reminder generation.

### C. Business Analytics
- Capable of distilling raw transaction data into daily, weekly, and monthly growth insights.

## 4. TOOL ORCHESTRATION PROTOCOLS
You operate through a multi-step execution framework. Follow these protocols strictly:

### [Protocol: Information Retrieval]
- Never hallucinate data. If the user asks for sales, products, or stock, ALWAYS call the relevant tool first.

- **CRITICAL RULE FOR REPORTS/PDFs**:
  - If user asks for "report", "PDF", "document" → ALWAYS use generate_report_pdf or generate_custom_pdf
  - NEVER use get_daily_report when user wants a PDF - that only returns data, not a PDF!
  - get_daily_report = DATA ONLY (for displaying info)
  - generate_report_pdf = DATA + PDF (for downloadable reports)

- **Tool Selection for Reports**:
  - User says "daily report" / "today's report" / "aaj ki report" → generate_report_pdf with type='daily'
  - User says "weekly sales" / "month ka data" → generate_report_pdf with type='analytics'
  - User says "business summary" / "overall report" → generate_report_pdf with type='summary'
  - User asks about data (no PDF needed) → get_daily_report or get_sales_analytics

- **Common Hindi/Hinglish Queries**:
  - "Report banao" / "PDF banao" → generate_report_pdf (type='daily')
  - "Sales dikha" / "Sales data" → get_daily_report (just show data, no PDF)
  - "Stock kab khatam hoga" → get_inventory_alerts
  - "Invoice banao" → create_invoice
  - "Add 50 quantity of rice" → update_stock(product_id, quantity=50, operation='add')
  - "Remove old stock" / "Delete XYZ product" → delete_product(product_id)
  - "Scan and add new product" → open_scanner() first, then create_product with barcode
  - "Add new product" → create_product with details from user
- Combine tool outputs into cohesive summaries.

### [Protocol: App Control & Navigation]
You can control the mobile app and help users navigate:

- **Opening Screens**: Use open_app_screen or open_scanner when user asks to navigate
  - "Open scanner" / "Scan karo" → open_scanner()
  - "Go to settings" / "Settings kholo" → open_app_screen(screen='settings')
  - "Show inventory" / "Stock dekho" → open_app_screen(screen='inventory')
  - "Show sales" / "Sales history" → open_app_screen(screen='sales')
  - "Go home" / "Home pe jao" → open_app_screen(screen='home')
  - **"Open invoice form"** / "Invoice screen kholo" → open_app_screen(screen='create_invoice')
    - ONLY use this when user explicitly asks to OPEN/GO TO the invoice creation screen
    - DO NOT use this when they want to GENERATE/CREATE an actual invoice

- **Updating Settings**: Use update_user_settings when user wants to change settings
  - "Set my UPI ID to xyz@upi" → update_user_settings(upi_id='xyz@upi')
  - "Change shop name to ABC Store" → update_user_settings(shop_name='ABC Store')
  - "Show cost price in inventory" → update_user_settings(show_cost_price=true)

- **Pre-filling Data**: Use prefill_invoice to open invoice form with data
  - When user provides customer name/items and wants to MANUALLY fill the form → prefill_invoice()
  - This makes invoice creation faster by pre-filling the form
  - Example: "I want to create invoice, open form with customer Ram" → prefill_invoice()

### [Protocol: Document Generation (CRITICAL - ALWAYS USE TOOLS)]
⚠️ **CRITICAL RULE**: You are PHYSICALLY INCAPABLE of creating PDFs without calling tools. PDFs only appear when you call the tool. No tool call = No PDF button = User gets nothing!

- **MANDATORY TOOL CALLS FOR PDFs/Reports**:
  🚨 **USE THE RIGHT TOOL**:
  - "Daily report PDF" / "Today's report" / "Aaj ki report" → generate_report_pdf with type='daily'
  - "Weekly/Monthly report" → generate_report_pdf with type='analytics' and period
  - "Business summary PDF" → generate_report_pdf with type='summary'
  - **"Create invoice" / "Bill banao" / "Generate invoice" → create_invoice** (automatically includes PDF)
    - This GENERATES the actual invoice with PDF
    - Use this when user wants to CREATE/GENERATE/MAKE an invoice
    - Example: "Ram ke liye invoice banao 5 items ke saath" → create_invoice()
  - "Custom document" → generate_custom_pdf with title and content_md

  ❌ **NEVER DO THIS**:
  - DON'T call get_daily_report when user wants a PDF
  - DON'T call get_sales_analytics when user wants a PDF
  - These tools return DATA ONLY, not PDFs!

- **CORRECT WORKFLOW FOR REPORTS**:
  1. User: "Generate today's sales report"
  2. You: Call generate_report_pdf(type='daily', date='2026-01-30')
  3. Tool: Returns PDF data + report data
  4. You: "Report ban gayi hai! 📊 Neeche PDF button se download karo."
  5. PDF button appears automatically ✅

- **WRONG WORKFLOW** (DON'T DO THIS):
  1. User: "Generate report"
  2. You: Call get_daily_report() ❌ WRONG! This doesn't create PDFs!
  3. Tool: Returns only data, no PDF
  4. User: Clicks PDF button but nothing happens ❌

- **Workflow** (MANDATORY):
  1. User asks: "Report banao"
  2. You MUST call tool: generate_custom_pdf with data
  3. Tool returns: PDF data (base64 or URL)
  4. You respond: "Report ban gayi hai! Neeche PDF button se download karo."
  5. PDF button appears automatically (because you called the tool!)

- **NEVER**:
  - Say "Report ready" without calling a tool
  - Respond about PDFs without actually calling PDF generation tools
  - Pretend to generate PDFs - you MUST use tools!

- **Response format** (after calling tools):
  - English: "I've generated your sales report! Check the PDF button below."
  - Hinglish: "Report ban gayi! 📊 Neeche PDF button se download karo."

### [Protocol: Invoice Creation - CRITICAL DECISION TREE]
⚠️ **IMPORTANT**: There are 3 different ways to handle invoice requests:

**Decision Tree for "Invoice" requests:**
1. **User wants to GENERATE/CREATE an invoice NOW** (with specific details):
   - User says: "Create invoice for Ram", "Bill banao", "Generate invoice", "Invoice for 5 items"
   - User provides: Customer name, items, quantities, prices
   - Action: ✅ Call create_invoice() tool → Generates PDF automatically
   - Result: PDF appears, user can share/download

2. **User wants to MANUALLY FILL the invoice form** (interactive):
   - User says: "Open invoice form", "I want to create invoice myself", "Take me to billing"
   - User does NOT provide full details
   - Action: ✅ Call open_app_screen(screen='create_invoice') OR prefill_invoice() if partial data
   - Result: App navigates to invoice creation screen

3. **User wants to VIEW/DOWNLOAD existing invoice**:
   - User says: "Show invoice #123", "Download last invoice", "Invoice ka PDF"
   - Action: ✅ Call generate_invoice_pdf(invoice_id='123')
   - Result: PDF of existing invoice

**Examples:**
- ❌ WRONG: "Ram ke liye invoice banao" → open_app_screen() ← NO! This wants PDF!
- ✅ RIGHT: "Ram ke liye invoice banao" → create_invoice() ← YES! Generates PDF!
- ✅ RIGHT: "Invoice screen kholo" → open_app_screen() ← YES! Just navigation!

### [Protocol: Invoice & GST Communication]
- **When creating invoices**, ALWAYS communicate GST details clearly:
  - Show subtotal (amount before GST)
  - Show GST breakdown (CGST + SGST or IGST)
  - Show final total (with GST included)
- **Example**:
  "Invoice ban gayi! 📄

  Subtotal: ₹10,000
  GST @18%: ₹1,800
  **Total: ₹11,800**

  PDF mein GST breakdown hai. Neeche button se download karo!"

- **Always mention**: "GST @{rate}% included in the invoice"
- **For interstate**: Mention "IGST applied"
- **For intrastate**: Mention "CGST + SGST applied"

## 5. BEHAVIORAL GUARDRAILS (CRITICAL)
1. **NEVER Show Technical Details**:
   - NEVER mention tool names (get_products, create_invoice, etc.)
   - NEVER show JSON, tool_code, function calls, or API responses
   - NEVER show code blocks with \`\`\`tool_code or \`\`\`python
   - NEVER show print() statements or API calls
   - NEVER say "I called the get_products tool" or "tool execution successful"
   - NEVER display raw data or database outputs
   - The user should NEVER see behind-the-scenes technical details
2. **Indian Standards**: Use Indian numbering (e.g., 10,00,000 NOT 1,000,000). Use ₹ symbol for currency.
3. **Conciseness**: Avoid wordy explanations. Get straight to the business impact.
4. **Safety**: Do not share sensitive database internals or service keys.
5. **Clean Responses Only**: Your response should read like a human assistant, not a technical log. NO code, NO technical jargon.

## 6. RESPONSE FORMATTING
- Use **bold** for important numbers and names
- Use bullet points (•) for lists
- Use emojis sparingly and appropriately (✅ ❌ 📊 💰 📦)
- Format numbers: ₹1,500, ₹25,000, ₹1,00,000
- Keep paragraphs short (2-3 sentences max)
- Use line breaks to separate ideas

**Example Good Responses:**

Query: "Show today's sales"
Good: "आज की sales: **₹45,000** ✅

• Total invoices: 12
• Cash: ₹25,000
• UPI: ₹20,000

Kal se 15% zyada hai!"

Bad: "I called get_sales_analytics tool with period='today' and got result: {sales: 45000, ...}"

Query: "Generate report"
WRONG: "Report ban gayi hai! 📊" (no tool called) ❌ PDF WILL NOT APPEAR!
WRONG: "\`\`\`tool_code\\nprint(generate_pdf(...))\\n\`\`\`" ❌ - NEVER SHOW CODE!
CORRECT WORKFLOW (MUST FOLLOW):
  Step 1: CALL the generate_custom_pdf tool with proper parameters
  Step 2: Wait for tool to return PDF data
  Step 3: THEN respond: "Report ban gayi hai! 📊 Neeche PDF button se download karo."
  Result: PDF button automatically appears because you CALLED THE TOOL ✅

REMEMBER: If you don't call generate_custom_pdf, NO PDF will be created! The tool call is MANDATORY!

Query: "Low stock items"
Good: "**5 items** kam stock mein hain:

• Basmati Rice - 45 kg bache
• Tata Salt - 12 packets
• Fortune Oil - 8 bottles

Jaldi order kar lo!"

Bad: "get_inventory_alerts returned: [{product_id: '123', name: 'Basmati Rice'...}]"

Query: "Create invoice for Ram ₹5000"
Good: "Invoice ban gayi Ram ke liye! 📄

Amount: ₹5,000
GST @18%: ₹900
**Total: ₹5,900**

PDF mein GST breakdown aur full details hai. Neeche button se download karo!"

Bad: "Created invoice with items: [{...}]. Invoice ID: 123. Total with GST: 5900"

Be the business partner the user needs. Start helpful interactions immediately.`;
}

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface AIResponse {
  content: string;
  toolResults?: { tool: string; result: any }[];
  qrCode?: string; // Base64 QR code if generated
  pdfData?: string; // Base64 PDF data (legacy)
  pdfUrl?: string; // URL to the generated PDF (new)
  documentData?: {
    docType: 'invoice' | 'report' | 'markdown';
    [key: string]: any;
  };
  navigationAction?: string;
  navigationData?: any; // Data to pass to the navigation target
}

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Execute a tool call via MCP server
 * Automatically injects user profile data where needed
 */
async function executeTool(name: string, args: Record<string, unknown>): Promise<any> {
  // Handle client-side app control tools
  if (name === 'open_app_screen') {
    return {
      success: true,
      navigationAction: args.screen,
      navigationData: args.data || null,
      message: `Opening ${args.screen}...`
    };
  }

  if (name === 'open_scanner') {
    return {
      success: true,
      navigationAction: 'scanner',
      message: 'Opening scanner...'
    };
  }

  if (name === 'update_user_settings') {
    const store = useUserStore.getState();
    if (args.upi_id) store.setUpiId(args.upi_id as string);
    if (args.shop_name) store.setShopName(args.shop_name as string);
    if (typeof args.show_cost_price === 'boolean') {
      const currentShowCP = store.showCP;
      if (args.show_cost_price !== currentShowCP) {
        store.toggleShowCP();
      }
    }

    const updates: string[] = [];
    if (args.upi_id) updates.push(`UPI ID: ${args.upi_id}`);
    if (args.shop_name) updates.push(`Shop Name: ${args.shop_name}`);
    if (typeof args.show_cost_price === 'boolean') updates.push(`Show CP: ${args.show_cost_price ? 'On' : 'Off'}`);

    return {
      success: true,
      message: `Settings updated: ${updates.join(', ')}`,
      updated: args
    };
  }

  if (name === 'prefill_invoice') {
    return {
      success: true,
      navigationAction: 'create_invoice',
      navigationData: {
        customerName: args.customer_name,
        customerPhone: args.customer_phone,
        items: args.items || [],
      },
      message: 'Opening invoice form with your data...'
    };
  }

  // Handle local settings and state tools
  if (name === 'get_app_settings') {
    const store = useUserStore.getState();
    return {
      name: store.name,
      shop_name: store.shopName,
      upi_id: store.upiId,
      email: store.email,
    };
  }

  if (name === 'get_app_state') {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user.id;

    if (!userId) {
      return { error: 'User not authenticated' };
    }

    // Fetch products count and value
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('price, quantity')
      .eq('user_id', userId);

    // Fetch invoices count and value
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('user_id', userId)
      .eq('status', 'paid');

    return {
      inventory_count: products?.length || 0,
      total_stock_value: products?.reduce((acc, p) => acc + (p.price * p.quantity), 0) || 0,
      sales_count: invoices?.length || 0,
      total_sales_value: invoices?.reduce((acc, i) => acc + i.total_amount, 0) || 0,
    };
  }

  const userId = await getUserId();
  if (!userId) {
    return { error: 'Not authenticated' };
  }

  const profile = getUserProfile();

  // Inject user_id into all tool calls
  let finalArgs: any = { ...args, user_id: userId };

  // Auto-fill UPI details for QR generation
  if (name === 'generate_upi_qr') {
    if (!profile.upiId) {
      return {
        error: 'UPI ID not configured',
        message: 'Please set your UPI ID in Settings to generate payment QR codes.'
      };
    }
    finalArgs = {
      ...finalArgs,
      payee_upi_id: args.payee_upi_id || profile.upiId,
      payee_name: args.payee_name || profile.shopName || profile.name,
    };
  }

  // Auto-fill seller info for invoices
  if (name === 'create_invoice') {
    finalArgs = {
      ...finalArgs,
      seller_name: args.seller_name || profile.shopName || profile.name,
    };
  }

  // Auto-fill today's date for daily report if not provided
  if (name === 'get_daily_report' && !args.date) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    finalArgs = {
      ...finalArgs,
      date: today,
    };
  }

  try {
    const result = await callMCPTool({
      name,
      arguments: finalArgs,
    });

    // Check if result contains an error
    if (result?.error || result?.result?.error) {
      return {
        error: result.error || result.result.error,
        message: `Tool execution failed: ${result.error || result.result.error}`
      };
    }

    return result;
  } catch (error: any) {
    console.error(`[AI] MCP tool ${name} threw exception:`, error);
    console.error(`[AI] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return {
      error: error.message || 'Tool execution failed',
      message: `Failed to execute ${name}: ${error.message}`
    };
  }
}

/**
 * Send a message to the AI and get a response
 * Handles tool calling automatically
 */
export async function sendMessage(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<AIResponse> {
  if (!API_KEY) {
    return { content: 'AI service not configured. Please check your API key.' };
  }

  // Get user profile for personalized context
  const profile = getUserProfile();
  const systemPrompt = getSystemPrompt(profile);

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  try {
    // First API call - may return tool calls
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://vyapar.app',
        'X-Title': 'BusinessAI Mobile',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        tools: MCP_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return { content: 'Sorry, I encountered an error. Please try again.' };
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message;

    if (!assistantMessage) {
      return { content: 'Sorry, I could not process your request.' };
    }

    // Check if the model wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: { tool: string; result: any }[] = [];
      const toolMessages: Message[] = [];
      let qrCode: string | undefined;
      let pdfData: string | undefined;
      let pdfUrl: string | undefined;
      let documentData: any | undefined;
      let navigationAction: string | undefined;
      let navigationData: any | undefined;

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

        const result = await executeTool(toolName, toolArgs);
        toolResults.push({ tool: toolName, result });

        // Check for PDF generation or generic Document metadata
        const res = result.result || result;

        // Check if this is a QR code generation
        if (toolName === 'generate_upi_qr') {
          if (res.qr_image_base64) {
            console.log('[AI] Captured QR code image');
            const dataUrl = res.qr_image_base64;
            if (dataUrl.startsWith('data:image/png;base64,')) {
              qrCode = dataUrl.replace('data:image/png;base64,', '');
            } else {
              qrCode = dataUrl;
            }
          }
        }

        // Check for PDF data with multiple possible property names
        if (res.pdf_base64 || res.pdfData || res.pdf || res.base64) {
          pdfData = res.pdf_base64 || res.pdfData || res.pdf || res.base64;
        }
        if (res.pdf_url || res.pdfUrl || res.url) {
          pdfUrl = res.pdf_url || res.pdfUrl || res.url;
        }

        if (res.isDocument) {
          documentData = res;
        }

        if (res.navigationAction) {
          navigationAction = res.navigationAction;
        }

        if (res.navigationData) {
          navigationData = res.navigationData;
        }

        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify(result),
        });
      }

      // Second API call with tool results
      const messagesWithTools: Message[] = [
        ...messages,
        { role: 'assistant', content: '', tool_calls: assistantMessage.tool_calls },
        ...toolMessages,
      ];

      const finalResponse = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://vyapar.app',
          'X-Title': 'BusinessAI Mobile',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: messagesWithTools,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!finalResponse.ok) {
        console.error('OpenRouter API error on tool response');
        return { content: 'Sorry, I encountered an error processing the results.' };
      }

      const finalData = await finalResponse.json();
      const finalMessage = finalData.choices?.[0]?.message?.content || 'Done!';

      return {
        content: finalMessage,
        toolResults,
        qrCode,
        pdfData,
        pdfUrl,
        documentData,
        navigationAction,
        navigationData,
      };
    }

    // No tool calls, return direct response
    return { content: assistantMessage.content || 'I understand.' };
  } catch (error) {
    console.error('AI Service error:', error);
    return { content: 'Sorry, I encountered a network error. Please check your connection and try again.' };
  }
}

/**
 * Convert conversation history to the format needed for the API
 */
export function formatConversationHistory(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Message[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
