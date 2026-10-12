# Funnel Dashboard (Apps Script)

A web dashboard that reads the central dashboard Google Sheet. The notebook's
section 5 fills that sheet; this code only displays it.

## What's in the sheet

| Tab | Filled by | What it holds |
|---|---|---|
| `Data` | notebook | One row per project per day: Sales, orders, Spend, Purchases, Platform Revenue. New uploads overwrite matching dates and keep older ones. |
| `Q1 MTD` | notebook (formulas) | Sales, Spend, ROAS and Platform ROAS, month to date vs the same days last month, per project and in total. The total ROAS counts only projects with ad spend in the window. |
| `UTM Data` | notebook | One row per project / day / UTM Source / UTM Content: Sales and Orders. Same overwrite-and-keep rule as `Data`. |
| `Q2 UTM Source` | notebook (values) | Month-to-date sales split by UTM Source, per project. Feeds the pie chart. |
| `Q2 Top Content` | notebook (values) | Month-to-date top 10 UTM Content per project, plus a "(not tagged)" row for sales with no UTM Content. |
| `Email Data` | notebook | One row per day / UTM Source / UTM Medium / funnel for orders whose UTM Source is in `EMAIL_UTM_SOURCES` (simon, attentive, emotive), from any funnel. |
| `Email MTD` | notebook (values) | Email & SMS sales month to date vs the same days last month, per funnel and source, plus totals per source. |

UTM Source is matched ignoring case, and `UTM_SOURCE_ALIASES` in the control
cell merges spellings (e.g. `simons` -> `simon`).

The Q2 tabs hold values rather than formulas on purpose: UTM Content is often an
18-digit ad ID, and Sheets formulas round numbers past 15 digits, which would
merge different ads. To check a Q2 number, filter `UTM Data` by project and date.

Only projects with `ads_match` set are included.

The date windows follow the latest date in `Data`: if the latest is Oct 12, the
comparison is Oct 1-12 vs Sep 1-12. When last month is shorter (e.g. Mar 31 vs
Feb), the last-month window stops at that month's final day.

## One-time setup

1. Run the notebook through section 5 once, so the dashboard tabs exist.
2. Open the dashboard sheet, then **Extensions > Apps Script**.
3. Replace the contents of `Code.gs` with `apps_script/Code.gs` from this repo.
4. Click **+ > HTML**, name it `Index` (exactly), and paste in `apps_script/Index.html`.
5. Click **Deploy > New deployment**, type **Web app**.
   - Execute as: **Me**
   - Who has access: pick who should see it (e.g. anyone in your organization)
6. Click **Deploy**, approve the permission prompt, and open the web app URL.

After that, every notebook run refreshes the numbers; just reload the page.

## Pages and links

- **All projects**: every project side by side. Click a project name to open its page.
- **Project pages**: one page per project, with its month-to-date tiles, UTM Source
  pie and top 10 UTM Content. Each has its own link: add `?project=SF` (any project
  name) to the web app URL, e.g. `https://script.google.com/.../exec?project=SF`.
- **Email & SMS**: `?view=email`.

## Updating the code

When `Code.gs` or `Index.html` change in this repo, paste the new versions in,
then **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**.
The URL stays the same.
