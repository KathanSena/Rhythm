# Lablab submission copy

## Project title

Rhythm

## Short description

Rhythm helps small retailers spot repeat shoppers who have drifted from their own purchase cadence, understand the evidence, and draft a considerate follow-up.

## Long description

Small retailers often have transaction history but no simple way to tell when a repeat customer’s routine has changed. Generic churn windows can overlook the fact that one shopper returns weekly while another returns every few months.

Rhythm analyzes transaction CSVs in the browser and compares each repeat shopper’s latest purchase date with their own historical cadence. It requires at least four distinct purchase days and flags a shopper for human review when days since last order exceed max(14 days, 1.6 × that shopper’s median gap between purchase days). The attention list shows the personal cadence, last order, repeated item, and days beyond the threshold.

For a possible next step, Rhythm can ask Gemma through a local LM Studio endpoint to draft a low-pressure reorder reminder. The model only writes the draft; it does not decide who is flagged, invent discounts, or send messages. The merchant reviews every suggestion.

The included research sample is an attributed, anonymized extract of the UCI Online Retail dataset, covering UK transactions from 2010–2011. It is a historical research sample, not current merchant data. Rhythm makes no campaign-lift claim. A merchant pilot should randomize a holdout group and compare 30-day repeat purchases and gross margin before claiming impact.

## Selected challenge

Track 3 — Reinvent Commerce

## Technology tags

AMD Radeon hardware (local inference demo; confirm GPU offload before submission), Gemma 4 E4B, LM Studio, Next.js, React, TypeScript, customer retention, browser-side CSV analytics.

## Intended user

An independent retailer or retention marketer reviewing repeat purchase behavior and deciding whether a customer merits a thoughtful follow-up.

## Business value and measurement

The useful action is an evidence-backed customer review and optional message draft. The product does not yet show intervention results. Measure a future campaign using a randomized holdout, 30-day repeat purchase rate, and gross margin.

## Data and caveat

Online Retail, UCI Machine Learning Repository, donated by Daqing Chen (2015), DOI 10.24432/C5BW33, CC BY 4.0. Dataset: https://archive.ics.uci.edu/dataset/352/online%2Bretail. The data is historical; the app’s 30-day return figure is descriptive behavior, not the effect of a campaign.
