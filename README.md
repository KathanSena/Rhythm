# Rhythm

**Retention, in time.** Rhythm helps small retailers notice when a repeat shopper has gone longer than their own historical buying pattern, inspect the evidence, and choose a considerate next action.

**Live application:** https://rhythm-eta-six.vercel.app

## What it does

- Analyzes an included, cited extract of real historical retail transactions or a merchant CSV export.
- Estimates a shopper's normal purchase interval from the median gap between distinct purchase days.
- Flags a shopper for human review after max(14 days, 1.6 × personal median gap), requiring at least four purchase days.
- Shows the repeated item and the supporting timeline, with masked identifiers.
- Ranks the top five repeat items found in the overdue shopper queue, showing shopper counts, typical repeat intervals, and median days past threshold. Merchants can open matching shoppers for review.
- Optionally drafts a low-pressure reorder reminder using Gemma served locally by LM Studio. A separate deterministic gate checks length, unsupported numbers, promotion/urgency language, and greetings; a failed draft is replaced with an evidence-only template. Rhythm never sends messages.

The sample's 30-day return rate describes historical behavior after a selected date. It does not estimate a campaign effect or forecast uplift.

## Run locally

Requires Node.js 20.9+ and pnpm.

    pnpm install
    pnpm dev

Open http://localhost:3000.

## Deploy the demo

The app can be deployed to Vercel from the public GitHub repository. The included transaction analysis runs in the visitor's browser and needs no database.

The optional Gemma drafting route is configured by server environment variables. The local .env.local endpoint (127.0.0.1:1234) is only for a local demo; it will not reach your computer from a hosted deployment. To enable AI drafts on a hosted deployment, set OPENAI_BASE_URL, OPENAI_API_KEY, and OPENAI_MODEL in the hosting provider to a reachable, secured OpenAI-compatible model endpoint. Never put endpoint credentials in client-side code or commit them. If no hosted model endpoint is set, the site creates a clearly labeled rule-based template instead of claiming an AI draft.

### Optional local Gemma draft

In LM Studio, load your downloaded Gemma model, start the local server (OpenAI-compatible API, normally port 1234), and copy .env.example to .env.local. Set OPENAI_MODEL to the exact model identifier shown by LM Studio. The sample API key value is a local placeholder; LM Studio commonly does not require a real key. Restart pnpm dev after editing .env.local.

Only previously purchased item labels and purchase timing are sent to the configured model endpoint. Customer identifiers and contact details stay in the browser. The bundled research sample uses pseudonymous IDs and is historical, not a contact list.

## Merchant CSV

Upload CSV from the button in the app. Required headers are order/invoice ID, customer ID, product/SKU, quantity, date, and unit price. Common headers such as InvoiceNo, CustomerID, StockCode, Quantity, InvoiceDate, and UnitPrice are recognized. Return/cancellation rows and incomplete, zero, or negative transactions are skipped. Files are read in browser memory and are not uploaded by the app.

For a smaller upload example, use [`submission/rhythm-small-demo.csv`](submission/rhythm-small-demo.csv). It is a subset of the same real, pseudonymized UCI transaction extract. Its expected results are documented in [`submission/demo-csv-info.md`](submission/demo-csv-info.md).

## Data source and attribution

Sample: **Online Retail**, UCI Machine Learning Repository, donated by Daqing Chen (2015), DOI [10.24432/C5BW33](https://doi.org/10.24432/C5BW33), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Dataset page: [UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online%2Bretail).

The bundled CSV contains 297,626 original transaction lines for 2,000 pseudonymized UK customers from the public dataset. It retains records with customer IDs, positive quantities and prices, and non-cancellation invoices. Product names, quantities, prices, and dates come from the source. The data is historical 2010–2011 activity, not live merchant data. The app does not generate fabricated sales or customer records.

## Stack

Next.js, React, TypeScript, and local browser-side CSV analysis. Optional message drafts use LM Studio's OpenAI-compatible local endpoint. No database or cloud account is required for the demo.
