# Lablab submission copy

## Project title

Rhythm

## Short description

Rhythm helps small retailers spot repeat shoppers who have drifted from their own purchase cadence, review which products appear most often in the signals, and draft a considerate follow-up.

## Long description

Small retailers often have transaction history but no simple way to tell when a repeat customer’s routine has changed. A generic inactivity window can overlook that one shopper returns weekly while another returns every few months.

Rhythm analyzes transaction CSVs in the browser and compares each repeat shopper’s latest purchase date with their own historical cadence. It requires at least four distinct purchase days and flags a shopper for human review when days since last order exceed max(14 days, 1.6 × that shopper’s median gap between purchase days). The shopper queue shows the personal cadence, last order, repeated item, and days beyond the threshold.

The item watchlist groups flagged shoppers by their most repeated product and ranks the top five items by shopper count. For each item, it shows the typical repeat interval and median days past the personal threshold. A merchant can open the matching shoppers and inspect their purchase history before deciding whether to follow up.

For a possible next step, Rhythm can ask Gemma through an LM Studio endpoint to draft a low-pressure reorder reminder. The model writes the draft; the cadence rule determines who appears for review. A deterministic gate checks length, unsupported numbers, promotions, urgency, and greetings. The merchant reviews every suggestion, and Rhythm does not send messages.

The bundled research sample contains 297,626 original UK transaction lines for 2,000 pseudonymized customers from the UCI Online Retail dataset. The data covers 2010–2011 and demonstrates the product workflow; it does not represent current merchant activity. Rhythm reports historical return behavior without attributing it to a campaign.

## Selected challenge

Track 3 — Reinvent Commerce

## Application URL

https://rhythm-eta-six.vercel.app

## Public source code

https://github.com/KathanSena/Rhythm

## Technology tags

AMD Radeon RX 9070 XT, Gemma 4 E4B, LM Studio, Next.js, React, TypeScript, customer retention, browser-side CSV analytics.

## Intended user

An independent retailer or retention marketer reviewing repeat purchase behavior and deciding whether a customer merits a thoughtful follow-up.

## Business value and measurement

The useful action is an evidence-backed review of shoppers and repeat items, followed by an optional message draft. The prototype does not show intervention results. A retailer can measure a real campaign separately using repeat purchase rates and gross margin from its own campaign and cost data.

## Data and caveat

Online Retail, UCI Machine Learning Repository, donated by Daqing Chen (2015), DOI 10.24432/C5BW33, CC BY 4.0. Dataset: https://archive.ics.uci.edu/dataset/352/online%2Bretail. The data is historical; the app’s 30-day return figure describes past behavior and is not the effect of a campaign.
