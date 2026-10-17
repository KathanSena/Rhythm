# Lablab submission copy

## Project title

Rhythm

## Short description

Rhythm helps small retailers spot repeat shoppers who have drifted from their own purchase cadence, understand the evidence, and draft a considerate follow-up.

## Long description

Small retailers often have transaction history but no simple way to tell when a repeat customer’s routine has changed. Generic churn windows can overlook the fact that one shopper returns weekly while another returns every few months.

Rhythm analyzes transaction CSVs in the browser and compares each repeat shopper’s latest purchase date with their own historical cadence. It requires at least four distinct purchase days and flags a shopper for human review when days since last order exceed max(14 days, 1.6 × that shopper’s median gap between purchase days). The attention list shows the personal cadence, last order, repeated item, and days beyond the threshold. A merchant can create a randomized follow-up/holdout plan, balanced within repeated-item groups, and export the assignment list for a human-reviewed campaign. After the campaign, the merchant should compare 30-day repeat purchases across the groups; Rhythm does not claim or predict campaign lift.

For a possible next step, Rhythm can ask Gemma through a local LM Studio endpoint to draft a low-pressure reorder reminder. The model only writes the draft; it does not decide who is flagged or send messages. A separate deterministic gate checks the output for excessive length, new numeric claims, promotions, urgency, and greetings. If any check fails, Rhythm replaces the AI text with an evidence-only template. The merchant reviews every suggestion.

The included research sample is an attributed, anonymized extract of the UCI Online Retail dataset, covering UK transactions from 2010–2011. It is a historical research sample, not current merchant data. Rhythm makes no campaign-lift claim. A merchant pilot should randomize a holdout group and compare 30-day repeat purchases and gross margin before claiming impact.

## Selected challenge

Track 3 — Reinvent Commerce

## Application URL

https://rhythm-eta-six.vercel.app

## Public source code

https://github.com/KathanSena/Rhythm

## Technology tags

AMD Radeon RX 9070 XT (verified Vulkan GPU inference), Gemma 4 E4B, LM Studio, Next.js, React, TypeScript, customer retention, browser-side CSV analytics.

## Intended user

An independent retailer or retention marketer reviewing repeat purchase behavior and deciding whether a customer merits a thoughtful follow-up.

## Business value and measurement

The useful action is an evidence-backed review, an optional message draft, and an exported randomized campaign plan. The product does not show intervention results. Measure a real campaign using the randomized holdout and 30-day repeat purchase rate; gross margin requires the merchant’s cost data and is not inferred from this sales CSV.

## Data and caveat

Online Retail, UCI Machine Learning Repository, donated by Daqing Chen (2015), DOI 10.24432/C5BW33, CC BY 4.0. Dataset: https://archive.ics.uci.edu/dataset/352/online%2Bretail. The data is historical; the app’s 30-day return figure is descriptive behavior, not the effect of a campaign.
