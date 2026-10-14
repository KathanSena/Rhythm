# Small upload CSV

`rhythm-small-demo.csv` is a filtered subset of the project's existing UCI Online Retail extract. It contains **1,505 original transaction rows** for **12 pseudonymized shoppers**. No transaction or value was invented or edited for this file.

## Upload it

1. Open the local app at http://localhost:3001.
2. Choose **Upload sales CSV**.
3. Select `submission/rhythm-small-demo.csv` from the project folder.

The app should set the reporting date to **9 November 2011** and show these figures:

- **100** orders
- **12** repeat shoppers
- **8** shoppers past their personal threshold
- **26 days** median repeat cadence
- **38%** natural 30-day return rate, based on **3 of the 8 flagged shoppers**

The return rate describes subsequent behavior in this historical dataset. It does not measure the effect of a message or campaign. Shopper identifiers in the source extract are pseudonyms.

## Attribution

Source: Online Retail, UCI Machine Learning Repository, donated by Daqing Chen (2015), DOI 10.24432/C5BW33, licensed CC BY 4.0. The CSV uses rows from the already filtered project extract, so this file preserves its UK-only, positive-quantity and positive-price, non-cancellation selection. Dataset page: https://archive.ics.uci.edu/dataset/352/online%2Bretail.
