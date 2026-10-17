# Rhythm demo video — about 2 minutes

## Before recording

- Start LM Studio, load Gemma 4 E4B, and start its OpenAI-compatible local server on port 1234.
- Start Rhythm with `pnpm dev` and open `http://localhost:3001`.
- Restore the bundled UCI sample and leave the reporting date at 9 November 2011.
- Keep Task Manager's RX 9070 XT performance graph visible while drafting if you want to show GPU activity. Describe GPU inference only if LM Studio confirms offload during that run.
- Use the lines below as conversational prompts. Pause while you click through the app.

## Talk track and screen actions

**Overview — show the main metrics**

“Small retailers can have years of purchase history and still struggle to spot when a regular customer’s routine changes. Rhythm helps a merchant find those changes and review the evidence before choosing a next step.

This sample contains 2,000 pseudonymized customers and about 298,000 original UK transaction lines from the UCI Online Retail dataset. It covers 2010 and 2011, so it demonstrates the workflow with historical research data.”

**Show the overview metrics**

“For this reporting date, 1,073 shoppers meet Rhythm’s repeat-purchase rule, and 170 are past their personal threshold. The typical cadence is 40 days. The 44% return figure describes historical 30-day behavior in this dataset; it does not show a campaign effect.”

**Scroll to the item watchlist**

“The item watchlist groups those flagged shoppers by the product they repeat most. It ranks items by shopper count and shows the typical repeat interval and median lateness. This first item appears in 11 overdue shoppers, with a 25-day typical interval and a median 16 days past threshold.”

**Click “Review shoppers,” then select a shopper**

“I can open the matching shoppers, choose one, and check the last order, usual gap, and reason for the flag. The rule is transparent: at least four purchase days, then a threshold of the larger of 14 days or 1.6 times that shopper’s median gap.”

**Click “Draft a follow-up” and show the result**

“Gemma through LM Studio helps write the reminder. The purchase-history rule creates the signal; the model only drafts wording. A merchant reviews the draft, and Rhythm doesn’t send messages.”

**Close on the dashboard or method section**

“Rhythm turns transaction history into a focused list of shoppers and products to review. Its results here are historical signals; a retailer would measure any real campaign separately.”

## GPU evidence

Show LM Studio's runtime details or Task Manager while generating the draft. State that the RX 9070 XT ran inference only when the runtime confirms GPU offload for that request. The language model writes the message; Rhythm's cadence rule determines the review signal.
