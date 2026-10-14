# Rhythm demo video — 90-second guide

## Before recording

- Start LM Studio, load google/gemma-4-e4b, and start its OpenAI-compatible local server on port 1234.
- The current LM Studio configuration has been verified: Gemma uses the Vulkan backend, all model layers are offloaded, and the RX 9070 XT is GPU 0. During recording, show Task Manager’s RX 9070 XT performance graph while generating the draft.
- Start Rhythm with pnpm dev from the project folder and open http://localhost:3001.
- Keep the reporting date at 9 November 2011 and use the bundled UCI dataset.
- Choose the top shopper and show the reason, repeated item, and formula. Generate one draft; do not send it.
- Say clearly that the data is historical and the return rate is not campaign impact.

## Narration

“Small retailers can see orders, but it is hard to know when a regular customer’s routine has changed. A one-size-fits-all churn window can miss the difference between a weekly buyer and someone who returns every few months.

This is Rhythm. It reads transaction CSVs locally in the browser and looks at each shopper’s own purchase history. A shopper needs at least four purchase days. Rhythm flags them for review when time since their last order passes the larger of 14 days or 1.6 times their personal median gap.

Here is the attention list from the real UCI Online Retail research dataset. It covers UK transactions from 2010 and 2011, so this is a product demonstration, not live merchant data. I can select a shopper and inspect the cadence, last order, repeated item, and exact reason for the flag.

Now I can ask Gemma, served locally through LM Studio with Vulkan acceleration on the Radeon RX 9070 XT, to draft a low-pressure reminder. The model only writes the message. Rhythm’s statistical rule identifies the shopper, and a person reviews the draft. Nothing is sent automatically.

The historical return rate is not proof that a message works. For a real campaign, we would hold out a randomized group and compare 30-day repeat purchases and gross margin. That is how Rhythm turns a signal into a measurable, responsible retention test.”

## Closing line

“Rhythm helps a retailer notice when a customer’s own pattern changes, then act with evidence instead of a blanket discount.”

## AMD proof to capture

Open Task Manager’s Performance view and select the Radeon RX 9070 XT. Keep its graph visible while clicking “Draft a follow-up” so the recording shows GPU activity during model inference. LM Studio reports a Vulkan backend with all model layers offloaded to GPU 0; Windows showed compute-engine activity for that inference process. Do not claim that the model makes the retention decision. Rhythm’s cadence rule does that.
