# Konscious Funnel Reporting

| Folder / file | What it is |
|---|---|
| `Automation_Funnel_Report_4.ipynb` | The Python notebook (run in Google Colab). Reads the orders export and the TNT ad spend export, writes each project's Google Sheet, and fills the central dashboard sheet (section 5). The TNT export is the `T&T` Google Drive folder downloaded as a zip: one CSV per project and platform, named like `F-Vital BP_CreativesKPI 2026-11-01 to 2026-11-30.csv`, where **F = Facebook and G = Google**. The engine cell lists which project each file goes to and flags anything off (two files with the same numbers, days that don't add up to the file's Total row, a file or project left unmatched, today's partial numbers). When the TNT export can't be downloaded, section 1b takes the TNT page's table copied and pasted instead. Section 6 writes the Refunds + Gross exports (a zip of `<account>_refunds gross.csv` files) to their own sheet, one row per account per day, refreshes the dashboard's Refunds & Gross page, and can run on its own. |
| `google_apps_script/` | The Google Apps Script dashboard (`Code.gs`, `Index.html`) that displays the central dashboard sheet. Setup steps are in `google_apps_script/README.md`. |

**Order of use:** run the notebook top to bottom, then open the deployed dashboard and reload it.
