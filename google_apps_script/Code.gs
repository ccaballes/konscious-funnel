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

// Every getter's result is cached per notebook run. The notebook writes the time it finished
// to Projects!F1 (and blanks it while it runs), so a new run means a new cache key and fresh
// reads. A blank stamp (older notebook, run in progress or failed) turns the cache off.
// Bump CACHE_VERSION when a getter's output shape changes.
const STAMP_CELL = 'F1';
const CACHE_VERSION = 1;
const CACHE_SECONDS = 6 * 60 * 60;   // CacheService maximum
const CACHE_CHUNK = 90000;           // CacheService caps one value at 100 KB

function cached_(name, build) {
  const ws = SpreadsheetApp.getActive().getSheetByName('Projects');
  const stamp = ws ? ws.getRange(STAMP_CELL).getDisplayValue() : '';
  if (!stamp) return build();
  const cache = CacheService.getScriptCache();
  const key = [name, CACHE_VERSION, stamp].join('|');
  try {
    const n = Number(cache.get(key));
    if (n > 0) {
      const keys = [];
      for (let i = 0; i < n; i++) keys.push(key + '|' + i);
      const parts = cache.getAll(keys);
      if (keys.every(function (k) { return parts[k] != null; })) {
        return JSON.parse(keys.map(function (k) { return parts[k]; }).join(''));
      }
    }
  } catch (e) { /* cache unavailable: read the sheet */ }
  const data = build();
  try {
    // \u escapes keep the JSON ASCII, so CACHE_CHUNK characters are CACHE_CHUNK bytes.
    const json = JSON.stringify(data).replace(/[\u007f-\uffff]/g, function (c) {
      return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
    });
    const parts = {};
    let n = 0;
    for (let i = 0; i < json.length; i += CACHE_CHUNK) parts[key + '|' + n++] = json.slice(i, i + CACHE_CHUNK);
    cache.putAll(parts, CACHE_SECONDS);
    cache.put(key, String(n), CACHE_SECONDS);   // last, so a reader never sees a count without its parts
  } catch (e) { /* too big or cache unavailable: serve uncached */ }
  return data;
}

// Brand and platform per project, for the side menu: { 'VBP-FB': { brand: 'Vital BP', platform: 'Facebook' } }
function projectMeta_() {
  const ws = SpreadsheetApp.getActive().getSheetByName('Projects');
  const meta = {};
  if (!ws || ws.getLastRow() < 2) return meta;
  ws.getRange(2, 1, ws.getLastRow() - 1, 3).getValues().forEach(function (r) {
    if (r[0] !== '') meta[String(r[0])] = { brand: String(r[1]), platform: String(r[2]) };
  });
  return meta;
}

function getQ1() { return cached_('q1', q1_); }

function q1_() {
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
    meta: projectMeta_(),
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

function getQ2() { return cached_('q2', q2_); }

function q2_() {
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
const EMAIL_TOP_TAB = 'Email Top 10';
const EMAIL_TOP_HEADER_ROW = 3;

// Top 10 per email/SMS source and email type (All / Abandoned Cart / Regular Sales),
// in the order the notebook wrote them.
// A row with no rank is that source's blank-field total (or an empty block).
function emailTop_() {
  const ws = SpreadsheetApp.getActive().getSheetByName(EMAIL_TOP_TAB);
  if (!ws) return [];
  const last = ws.getLastRow();
  const values = last > EMAIL_TOP_HEADER_ROW
    ? ws.getRange(EMAIL_TOP_HEADER_ROW + 1, 1, last - EMAIL_TOP_HEADER_ROW, 8).getValues() : [];
  const blocks = {}, order = [];
  values.forEach(function (r) {
    const src = String(r[0]), type = String(r[7] || 'All'), key = type + '\u0000' + src;
    if (!src) return;
    if (!blocks[key]) { blocks[key] = { source: src, type: type, field: String(r[1]), top: [], untagged: null }; order.push(key); }
    const item = { rank: num_(r[2]), content: String(r[3]), sales: num_(r[4]), orders: num_(r[5]), share: num_(r[6]) };
    if (item.rank !== null) blocks[key].top.push(item);
    else if (item.content) blocks[key].untagged = item;
  });
  return order.map(function (k) { return blocks[k]; });
}

function getEmail() { return cached_('email', email_); }

function email_() {
  const ws = SpreadsheetApp.getActive().getSheetByName(EMAIL_TAB);
  if (!ws) throw new Error('Tab "' + EMAIL_TAB + '" not found. Run the notebook\'s dashboard cell first.');
  const windows = ws.getRange('B1:C2').getDisplayValues();
  const last = ws.getLastRow();
  const rows = (last > EMAIL_HEADER_ROW
    ? ws.getRange(EMAIL_HEADER_ROW + 1, 1, last - EMAIL_HEADER_ROW, 8).getValues() : [])
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return { funnel: String(r[0]), source: String(r[1]), sales: [num_(r[2]), num_(r[3]), num_(r[4])],
               orders: [num_(r[5]), num_(r[6])], type: String(r[7] || 'All') };
    });
  // One set per email type for the page's filter: { All: {...}, 'Abandoned Cart': {...}, 'Regular Sales': {...} }
  const types = {};
  rows.forEach(function (r) {
    const t = types[r.type] || (types[r.type] = { funnels: [], bySource: [], total: null });
    if (r.funnel === 'All funnels') t.bySource.push(r);
    else if (r.funnel === 'All email & SMS') t.total = r;
    else t.funnels.push(r);
  });
  return { current: windows[0], prior: windows[1], types: types, top: emailTop_() };
}

const TRENDS_TAB = 'Q3 Trends';
const TRENDS_HEADER_ROW = 6;

// Platform ROAS (columns U/V) is left out of the dashboard for now.
const TREND_COLS = { sales: 4, salesCum: 6, orders: 8, ordersCum: 10, roas: 12, roasCum: 14, spend: 18, spendCum: 22 };

// Line-chart series per project and view (daily / monthly / quarterly / yearly).
// Each metric is [this period's points, comparison points]; blanks are null.
function getTrends() {
  return cached_('trends', function () { return trendsFrom_(TRENDS_TAB, Object.keys(TREND_COLS)); });
}

// Same layout as Q3 Trends, one group per email/SMS source plus 'All email & SMS'.
// Only Sales and Orders: the spend and ROAS columns are blank on this tab.
function getEmailTrends() {
  return cached_('emailTrends', function () { return trendsFrom_('Email Trends', ['sales', 'salesCum', 'orders', 'ordersCum']); });
}

function trendsFrom_(tab, keys) {
  const ws = SpreadsheetApp.getActive().getSheetByName(tab);
  if (!ws) throw new Error('Tab "' + tab + '" not found. Run the notebook\'s dashboard cell first.');
  const views = {};
  ws.getRange(1, 1, 4, 3).getDisplayValues().forEach(function (r) { views[r[0]] = { now: r[1], prev: r[2] }; });
  const last = ws.getLastRow();
  const values = last > TRENDS_HEADER_ROW
    ? ws.getRange(TRENDS_HEADER_ROW + 1, 1, last - TRENDS_HEADER_ROW, 22).getValues() : [];
  const projects = {};
  values.forEach(function (r) {
    const n = String(r[0]), v = String(r[1]);
    if (!n || !v) return;
    const p = projects[n] || (projects[n] = {});
    const s = p[v] || (p[v] = { labels: [], notes: [[], []] });
    s.labels.push(String(r[3]));
    s.notes[0].push(String(r[16] || '')); s.notes[1].push(String(r[17] || ''));
    keys.forEach(function (k) {
      (s[k] || (s[k] = [[], []]))[0].push(num_(r[TREND_COLS[k]]));
      s[k][1].push(num_(r[TREND_COLS[k] + 1]));
    });
  });
  return { views: views, projects: projects };
}

const REFUNDS_MTD_TAB = 'Refunds MTD';
const REFUNDS_MTD_HEADER_ROW = 4;
const REFUNDS_TRENDS_TAB = 'Refunds Trends';
const REFUNDS_TRENDS_HEADER_ROW = 3;
// Refunds Trends columns (0-based); each holds this month, the next column last month.
const REFUND_TREND_COLS = { gross: 3, grossCum: 5, refunds: 7, refundsCum: 9, rate: 11, rateCum: 13, net: 15, netCum: 17 };

// Refunds & Gross page, from the notebook's section 6: month to date per account
// (Gross, Refunds, Refund rate, Net; each [now, last month, change]) and the daily
// series per account, in the same shape as getTrends().
function getRefunds() { return cached_('refunds', refunds_); }

function refunds_() {
  const ss = SpreadsheetApp.getActive();
  const ws = ss.getSheetByName(REFUNDS_MTD_TAB), wt = ss.getSheetByName(REFUNDS_TRENDS_TAB);
  if (!ws || !wt) throw new Error('Tab "' + (ws ? REFUNDS_TRENDS_TAB : REFUNDS_MTD_TAB) +
    '" not found. Run the notebook\'s Refunds + Gross cell (section 6) first.');
  const windows = ws.getRange('B1:C2').getDisplayValues();
  const last = ws.getLastRow();
  const rows = (last > REFUNDS_MTD_HEADER_ROW
    ? ws.getRange(REFUNDS_MTD_HEADER_ROW + 1, 1, last - REFUNDS_MTD_HEADER_ROW, 15).getValues() : [])
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      return { account: String(r[0]), gross: [num_(r[1]), num_(r[2]), num_(r[3])],
               refunds: [num_(r[4]), num_(r[5]), num_(r[6])], rate: [num_(r[7]), num_(r[8]), num_(r[9])],
               net: [num_(r[10]), num_(r[11]), num_(r[12])], days: [num_(r[13]), num_(r[14])] };
    });
  const top = wt.getRange(1, 1, 1, 3).getDisplayValues()[0];
  const tl = wt.getLastRow();
  const groups = {};
  (tl > REFUNDS_TRENDS_HEADER_ROW
    ? wt.getRange(REFUNDS_TRENDS_HEADER_ROW + 1, 1, tl - REFUNDS_TRENDS_HEADER_ROW, 21).getValues() : [])
    .forEach(function (r) {
      const n = String(r[0]);
      if (!n) return;
      const s = groups[n] || (groups[n] = { labels: [], notes: [[], []] });
      s.labels.push(String(r[2]));
      s.notes[0].push(String(r[19] || '')); s.notes[1].push(String(r[20] || ''));
      Object.keys(REFUND_TREND_COLS).forEach(function (k) {
        const c = REFUND_TREND_COLS[k];
        (s[k] || (s[k] = [[], []]))[0].push(num_(r[c]));
        s[k][1].push(num_(r[c + 1]));
      });
    });
  return {
    current: windows[0], prior: windows[1],
    accounts: rows.filter(function (r) { return r.account !== 'All accounts'; }),
    total: rows.filter(function (r) { return r.account === 'All accounts'; })[0] || null,
    trends: { views: { daily: { now: top[1], prev: top[2] } }, groups: groups }
  };
}
