# Funnel Dashboard (Apps Script)

A web dashboard that reads the central dashboard Google Sheet. The notebook's
section 5 fills that sheet; this code only displays it.

## What's in the sheet

| Tab | Filled by | What it holds |
|---|---|---|
| `Projects` | notebook | Each project's brand and platform for the side menu, read from its `ads_match` token ("Vital BP Google" -> Vital BP / Google). A project can set `"brand"` or `"platform"` itself to override. Cell F1 holds when the notebook last finished writing (see **Loading speed**). |
| `Data` | notebook | One row per project per day: Sales, orders, Spend, Purchases, Platform Revenue. New uploads overwrite matching dates and keep older ones. Each file only overwrites its own columns: a day the orders export covers but the ad spend export doesn't keeps its Spend, and a day only the ad spend export covers keeps its Sales. |
| `Q1 MTD` | notebook (formulas) | Sales, Spend, ROAS and Platform ROAS, month to date vs the same days last month, per project and in total. The total ROAS counts only projects with ad spend in the window. |
| `Q3 Trends` | notebook (values) | Per project and in total: Sales, Orders (Total Order), Spend, ROAS and Platform ROAS for four views: daily (this month vs last month), monthly and quarterly (this year vs last year) and yearly, each with running / to-date columns. A point is blank when no uploaded day falls in it; a note marks a point that is in progress or only partly uploaded. Feeds the charts. Includes a running Spend total (columns W/X) for the Spend chart. |
| `UTM Data` | notebook | One row per project / day / UTM Source / UTM Content: Sales and Orders. Same overwrite-and-keep rule as `Data`. |
| `Q2 UTM Source` | notebook (values) | Month-to-date sales split by UTM Source, per project. Feeds the pie chart. |
| `Q2 Top Content` | notebook (values) | Month-to-date top 10 UTM Content per project, plus a "(not tagged)" row for sales with no UTM Content. |
| `Email Data` | notebook | One row per day / UTM Source / UTM Medium / UTM Campaign / UTM Content / funnel for orders whose UTM Source is in `EMAIL_UTM_SOURCES` (simon, attentive, emotive), from any funnel, plus an **Email type** column: Abandoned Cart when the UTM Campaign contains a word from `EMAIL_ABANDONED_KEYWORDS` (default "abandoned"), else Regular Sales. |
| `Email MTD` | notebook (values) | Email & SMS sales month to date vs the same days last month, per funnel and source, plus totals per source. Written once per email type (column H: All / Abandoned Cart / Regular Sales) for the page's filter. |
| `Email Trends` | notebook (values) | Same layout as `Q3 Trends`: one group per email/SMS source (simon incl. simons, attentive, emotive) and "All email & SMS", each also split by email type ("simon \| Abandoned Cart", "All email & SMS \| Regular Sales"). Sales and Orders for the daily, monthly, quarterly and yearly views. Feeds the Email & SMS charts. |
| `Email Top 10` | notebook (values) | Month-to-date top 10 per email/SMS source and email type (column H). Each source is ranked by the field `EMAIL_TOP_FIELDS` names for it: UTM Content for simon and attentive, UTM Campaign for emotive (its UTM Content is always blank; the campaign is the text message name). |
| `Refunds MTD` | notebook section 6 (values) | Per Refunds + Gross account and "All accounts": Gross, Refunds, Refund rate and Net, month to date vs the same days last month, with the % change (percentage points for Refund rate) and how many days each window has uploaded. Built from every row on the Refunds + Gross sheet, so last month fills in once its export has been uploaded once. Refunds are a positive amount; Refund rate = Refunds / Gross; Net = Gross - Refunds. |
| `Refunds Trends` | notebook section 6 (values) | The same four per account, each day this month vs the same day last month, per day and running (month to date). A day is blank when it isn't uploaded; a note marks the latest day (may be incomplete) and a day only some accounts were uploaded for. Feeds the Refunds & Gross charts. |

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
3. Replace the contents of `Code.gs` with `google_apps_script/Code.gs` from this repo.
4. Click **+ > HTML**, name it `Index` (exactly), and paste in `google_apps_script/Index.html`.
5. Click **Deploy > New deployment**, type **Web app**.
   - Execute as: **Me**
   - Who has access: pick who should see it (e.g. anyone in your organization)
6. Click **Deploy**, approve the permission prompt, and open the web app URL.

After that, every notebook run refreshes the numbers; just reload the page.

## Pages and links

- **All projects**: totals, charts and every project side by side. Click a project name to open its page.
- **Charts** (All projects and every project page): a Daily / Monthly / Quarterly / Yearly
  switch at the top, then four large charts: Sales, Orders, Spend and ROAS. Each shows its
  month-to-date number and change vs last month, and has an Each period / Running total switch
  (Month to date or Year to date for ROAS). The ROAS chart carries a dotted 1.0x break-even line.
  Each period is drawn against its comparison (last month for Daily, last year for Monthly and
  Quarterly). Dotted steps mark periods that are still in progress or only partly uploaded; hover a point to
  see why. Platform ROAS is left out of the dashboard for now (the notebook still writes it to
  `Q1 MTD` and `Q3 Trends`).
- **Project pages**: the side menu groups projects by brand; click a brand to see its
  platforms (Facebook, Google) and pick one. Each page has its charts, UTM Source
  pie and top 10 UTM Content. Each has its own link: add `?project=SF` (any project
  name) to the web app URL, e.g. `https://script.google.com/.../exec?project=SF`.
- **Email & SMS**: `?view=email`. Total email & SMS sales chart, then a card per source plus a
  total orders card, each with a mini chart on its own scale (simon is far larger, so a shared
  scale would flatten the others), all following the Daily / Monthly / Quarterly / Yearly
  switch; then the top 10 tables and the funnel table. An **Email type** filter (All / Abandoned Cart / Regular Sales) at the top of the
  page switches every chart, card and table on it.
- **Refunds & Gross**: `?view=refunds`. From the Refunds + Gross exports (notebook section 6). An **Account** picker
  (All accounts or one account), then four large charts: Gross sales, Refunds, Refund rate and Net sales, each with its
  month-to-date number, the change vs the same days last month (percentage points for Refund rate) and an Each day /
  Running total switch (Month to date for Refund rate). Then a table of every account, month to date; click an account to
  show it in the charts. Daily only, so the Daily / Monthly / Quarterly / Yearly switch is hidden on this page. A note above
  the charts says when last month isn't uploaded yet or the two windows cover a different number of days.
- **MTD Revenue Report**: `?view=revenue`. October vs September, day 1 to 19: C100, GA Total Revenue and its channels
  (Google, Facebook, Email, and Other = GA Total minus those three). Bottom line, four headline cards, the dollar change
  per channel, each channel's share of GA revenue, the key takeaways, a summary table and the checks to run before sharing.
  A one-off report: C100 and GA revenue aren't on the dashboard sheet, so the numbers are typed into `REVENUE` in
  `Index.html` (changes, shares and Other are worked out from them). The takeaway text is written for these numbers, so
  update both together.

## Loading speed

- **Spinner**: each page shows a spinner until its numbers arrive. If loading fails, the page
  says why and offers **Try again**.
- **Only what the page needs, all at once**: a page asks the sheet only for its own data, in
  parallel. A `?view=email` or `?project=` link no longer waits for the All projects data first.
- **Other pages load in the background**: once the first page is up, the rest of the data loads
  quietly, so switching pages is instant.
- **Cache per notebook run**: the first visitor after a notebook run reads the sheet; everyone
  after that gets a saved copy (kept up to 6 hours) instead of re-reading every tab. The notebook
  writes the time it finished into `Projects` F1, and a new time means a fresh read, so a reload
  after a run always shows the new numbers. F1 is blank while the notebook is writing (or if a
  run failed), and then the dashboard always reads the sheet directly.
  - The cache starts working after the first notebook run with this version of the notebook.
  - Edited a dashboard tab by hand? Clear `Projects` F1 (or run the notebook again) so the
    dashboard reads the sheet fresh.

## Updating the code

When `Code.gs` or `Index.html` change in this repo, paste the new versions in,
then **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**.
The URL stays the same.
