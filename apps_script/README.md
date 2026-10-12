# Funnel Dashboard (Apps Script)

A web dashboard that reads the central dashboard Google Sheet. The notebook's
section 5 fills that sheet; this code only displays it.

## What's in the sheet

| Tab | Filled by | What it holds |
|---|---|---|
| `Data` | notebook | One row per project per day: Sales, orders, Spend, Purchases, Platform Revenue. New uploads overwrite matching dates and keep older ones. |
| `Q1 MTD` | notebook (formulas) | Sales, Spend, ROAS and Platform ROAS, month to date vs the same days last month, per project and in total. |

Only projects with `ads_match` set are included.

The date windows follow the latest date in `Data`: if the latest is Oct 12, the
comparison is Oct 1-12 vs Sep 1-12. When last month is shorter (e.g. Mar 31 vs
Feb), the last-month window stops at that month's final day.

## One-time setup

1. Run the notebook through section 5 once, so the `Data` and `Q1 MTD` tabs exist.
2. Open the dashboard sheet, then **Extensions > Apps Script**.
3. Replace the contents of `Code.gs` with `apps_script/Code.gs` from this repo.
4. Click **+ > HTML**, name it `Index` (exactly), and paste in `apps_script/Index.html`.
5. Click **Deploy > New deployment**, type **Web app**.
   - Execute as: **Me**
   - Who has access: pick who should see it (e.g. anyone in your organization)
6. Click **Deploy**, approve the permission prompt, and open the web app URL.

After that, every notebook run refreshes the numbers; just reload the page.

## Updating the code

When `Code.gs` or `Index.html` change in this repo, paste the new versions in,
then **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**.
The URL stays the same.
