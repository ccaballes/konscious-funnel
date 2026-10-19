# Konscious Funnel Reporting

| Folder / file | What it is |
|---|---|
| `Automation_Funnel_Report_4.ipynb` | The Python notebook (run in Google Colab). Reads the orders and ad spend exports, writes each project's Google Sheet, and fills the central dashboard sheet (section 5). Section 6 writes the Refunds + Gross exports (a zip of `<account>_refunds gross.csv` files) to their own sheet, one row per account per day, and can run on its own. |
| `google_apps_script/` | The Google Apps Script dashboard (`Code.gs`, `Index.html`) that displays the central dashboard sheet. Setup steps are in `google_apps_script/README.md`. |

**Order of use:** run the notebook top to bottom, then open the deployed dashboard and reload it.
