// Funnel dashboard web app. Bound to the central dashboard sheet
// (Extensions > Apps Script). Reads the tabs the notebook's dashboard cell
// writes; does no math of its own, so every number traces back to a sheet cell.

const Q1_TAB = 'Q1 MTD';
const Q1_HEADER_ROW = 5;
const Q1_COLS = 13;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Funnel Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Numbers pass through; blanks and sheet errors (#DIV/0! etc.) become null.
function num_(v) {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

function getQ1() {
  const ws = SpreadsheetApp.getActive().getSheetByName(Q1_TAB);
  if (!ws) throw new Error('Tab "' + Q1_TAB + '" not found. Run the notebook\'s dashboard cell first.');
  const windows = ws.getRange('B1:C3').getDisplayValues();
  const last = ws.getLastRow();
  const values = last > Q1_HEADER_ROW
    ? ws.getRange(Q1_HEADER_ROW + 1, 1, last - Q1_HEADER_ROW, Q1_COLS).getValues()
    : [];
  const rows = values
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return {
        project: String(r[0]),
        sales: [num_(r[1]), num_(r[2]), num_(r[3])],
        spend: [num_(r[4]), num_(r[5]), num_(r[6])],
        roas: [num_(r[7]), num_(r[8]), num_(r[9])],
        platformRoas: [num_(r[10]), num_(r[11]), num_(r[12])]
      };
    });
  return {
    latest: windows[0][0],
    current: [windows[1][0], windows[1][1]],
    prior: [windows[2][0], windows[2][1]],
    projects: rows.filter(function (r) { return r.project !== 'All projects'; }),
    total: rows.filter(function (r) { return r.project === 'All projects'; })[0] || null
  };
}
