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

const Q2_SOURCE_TAB = 'Q2 UTM Source';
const Q2_CONTENT_TAB = 'Q2 Top Content';
const Q2_HEADER_ROW = 3;

function q2Rows_(name, cols) {
  const ws = SpreadsheetApp.getActive().getSheetByName(name);
  if (!ws) throw new Error('Tab "' + name + '" not found. Run the notebook\'s dashboard cell first.');
  const last = ws.getLastRow();
  return {
    window: ws.getRange('B1:C1').getDisplayValues()[0],
    rows: last > Q2_HEADER_ROW
      ? ws.getRange(Q2_HEADER_ROW + 1, 1, last - Q2_HEADER_ROW, cols).getValues()
          .filter(function (r) { return r[0] !== ''; })
      : []
  };
}

function getQ2() {
  const src = q2Rows_(Q2_SOURCE_TAB, 5);
  const cnt = q2Rows_(Q2_CONTENT_TAB, 6);
  const byProject = {};
  const order = [];
  function proj(n) {
    if (!byProject[n]) { byProject[n] = { project: n, sources: [], top: [], untagged: null }; order.push(n); }
    return byProject[n];
  }
  src.rows.forEach(function (r) {
    proj(String(r[0])).sources.push({ source: String(r[1]), sales: num_(r[2]), orders: num_(r[3]), share: num_(r[4]) });
  });
  cnt.rows.forEach(function (r) {
    const item = { rank: num_(r[1]), content: String(r[2]), sales: num_(r[3]), orders: num_(r[4]), share: num_(r[5]) };
    if (item.rank === null) proj(String(r[0])).untagged = item;
    else proj(String(r[0])).top.push(item);
  });
  return { window: src.window, projects: order.map(function (n) { return byProject[n]; }) };
}

const EMAIL_TAB = 'Email MTD';
const EMAIL_HEADER_ROW = 4;

function getEmail() {
  const ws = SpreadsheetApp.getActive().getSheetByName(EMAIL_TAB);
  if (!ws) throw new Error('Tab "' + EMAIL_TAB + '" not found. Run the notebook\'s dashboard cell first.');
  const windows = ws.getRange('B1:C2').getDisplayValues();
  const last = ws.getLastRow();
  const rows = (last > EMAIL_HEADER_ROW
    ? ws.getRange(EMAIL_HEADER_ROW + 1, 1, last - EMAIL_HEADER_ROW, 7).getValues() : [])
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return { funnel: String(r[0]), source: String(r[1]), sales: [num_(r[2]), num_(r[3]), num_(r[4])],
               orders: [num_(r[5]), num_(r[6])] };
    });
  return {
    current: windows[0], prior: windows[1],
    funnels: rows.filter(function (r) { return r.funnel !== 'All funnels' && r.funnel !== 'All email & SMS'; }),
    bySource: rows.filter(function (r) { return r.funnel === 'All funnels'; }),
    total: rows.filter(function (r) { return r.funnel === 'All email & SMS'; })[0] || null
  };
}
