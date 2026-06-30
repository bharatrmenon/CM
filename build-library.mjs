#!/usr/bin/env node
/**
 * ChartMatch — equities chart-library builder (Yahoo Finance edition)
 * -------------------------------------------------------------------
 * Pulls REAL daily OHLC from Yahoo Finance (free, no API key), slices it into
 * history/future windows, and writes chart-library.json next to index.html.
 *
 * Setup (one time, in this folder):
 *     npm install yahoo-finance2
 *
 * Run:
 *     node build-library.mjs
 *
 * Then drop chart-library.json beside index.html (or commit it to the repo)
 * and reload — the app auto-detects it and turns off sample data.
 *
 * Requires Node 18+.
 *
 * NOTE ON LICENSING: Yahoo is free and fine for building/prototyping. Before
 * you charge users, re-point getHistory() at a commercially-licensed daily EOD
 * source (EODHD or Tiingo, ~$10-20/mo); the rest of the pipeline is identical.
 */

import { writeFileSync } from 'node:fs';

/* ---- works with both yahoo-finance2 v2 (object) and v3 (class) ---- */
import * as YFmod from 'yahoo-finance2';
const YF = YFmod.default ?? YFmod;
const yf = (typeof YF === 'function') ? new YF() : YF;
try { yf.suppressNotices?.(['yahooSurvey', 'ripHistorical']); } catch {}

const N_HIST = 60;            // candles shown
const N_FUT  = 30;            // candles hidden, then revealed
const WIN    = N_HIST + N_FUT;
const REPS_TARGET = 180;      // how many random practice windows to build
const REP_START = '2005-01-01';

/* Plain Yahoo symbols (no .us suffix). */
const REP_TICKERS = [
  'AAPL','MSFT','NVDA','AMD','TSLA','AMZN','GOOGL','META','NFLX','SPY','QQQ','IWM',
  'JPM','DIS','BA','INTC','PYPL','CRM','ADBE','AVGO','XOM','WMT','KO','PEP',
  'COIN','PLTR','SMH','XLF'
];

/* Boss levels — real eras, Yahoo symbols.
 * ^GSPC = S&P 500 index (back to the 1920s), ^IXIC = Nasdaq Composite. */
const BOSSES = [
  { id:'covid-2020',     title:'The COVID Crash',    ticker:'SPY',   d1:'2020-01-02', d2:'2020-04-30', macroHeadline:'WHO declares a global health emergency as the virus spreads.' },
  { id:'lehman-2008',    title:'The Lehman Moment',  ticker:'^GSPC', d1:'2008-08-01', d2:'2008-11-21', macroHeadline:'Lehman Brothers files for bankruptcy; credit markets seize.' },
  { id:'dotcom-2000',    title:'The Dotcom Top',     ticker:'^IXIC', d1:'2000-02-01', d2:'2000-06-15', macroHeadline:'Tech valuations stretch to extremes as bubble fears build.' },
  { id:'oil-2020',       title:'Black Gold Collapse',ticker:'USO',   d1:'2020-02-03', d2:'2020-05-15', macroHeadline:'Demand evaporates and storage fills; crude futures crater.' },
  { id:'gme-2021',       title:'The Short Squeeze',  ticker:'GME',   d1:'2020-11-02', d2:'2021-02-12', macroHeadline:'Retail traders pile in; short sellers get squeezed.' },
  { id:'flash-2010',     title:'The Flash Crash',    ticker:'^GSPC', d1:'2010-03-01', d2:'2010-06-15', macroHeadline:'A liquidity vacuum erases ~$1T in minutes intraday.' },
  { id:'china-2015',     title:'China Growth Scare', ticker:'SPY',   d1:'2015-06-15', d2:'2015-10-02', macroHeadline:'China devalues the yuan; global risk assets wobble.' },
  { id:'inflation-2022', title:'The Inflation Pivot',ticker:'QQQ',   d1:'2021-11-01', d2:'2022-06-30', macroHeadline:'The Fed turns hawkish; long-duration tech reprices hard.' },
  { id:'blackmon-1987',  title:'Black Monday',       ticker:'^GSPC', d1:'1987-08-03', d2:'1987-11-20', macroHeadline:'Portfolio insurance cascades; the Dow loses 22.6% in a day.' }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const iso = d => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

/* ---- one history call per symbol; works across library versions ---- */
async function getHistory(symbol, period1, period2 = new Date()){
  let rows;
  if (typeof yf.chart === 'function'){
    const r = await yf.chart(symbol, { period1, period2, interval: '1d' });
    rows = r.quotes || [];
  } else {
    rows = await yf.historical(symbol, { period1, period2, interval: '1d' });
  }
  return rows
    .filter(q => [q.open, q.high, q.low, q.close].every(v => typeof v === 'number' && isFinite(v) && v > 0))
    .map(q => ({ t: iso(q.date), o: q.open, h: q.high, l: q.low, c: q.close, v: q.volume ?? null }));
}

function sliceWindow(c, start){
  const w = c.slice(start, start + WIN);
  return { history: w.slice(0, N_HIST), future: w.slice(N_HIST) };
}

async function buildReps(){
  const reps = [];
  const perTicker = Math.ceil(REPS_TARGET / REP_TICKERS.length);
  for (const tk of REP_TICKERS){
    try {
      const c = await getHistory(tk, REP_START);
      if (c.length < WIN + 5){ console.warn(`  skip ${tk}: only ${c.length} bars`); await sleep(250); continue; }
      const maxStart = c.length - WIN;
      const picks = new Set();
      let guard = 0;
      while (picks.size < perTicker && guard++ < perTicker * 6){
        picks.add(5 + Math.floor(Math.random() * (maxStart - 5)));
      }
      for (const s of picks){
        const w = sliceWindow(c, s);
        reps.push({ ticker: tk.replace('^',''), date: w.history[0].t + ' \u2192 ' + w.future[w.future.length-1].t, ...w });
      }
      console.log(`  ${tk}: ${picks.size} windows  (${c.length} bars)`);
    } catch(e){ console.warn(`  ${tk} failed: ${e.message}`); }
    await sleep(250);
  }
  return reps;
}

async function buildBosses(){
  const out = [];
  for (const b of BOSSES){
    try {
      const c = await getHistory(b.ticker, b.d1, new Date(b.d2));
      const start = Math.max(0, c.length - WIN);
      const w = sliceWindow(c.slice(start), 0);
      if (w.history.length > 10 && w.future.length > 2){
        out.push({ id:b.id, title:b.title, ticker:b.ticker.replace('^',''), macroHeadline:b.macroHeadline, date:`${b.d1} \u2192 ${b.d2}`, ...w });
        console.log(`  ${b.id}: ok (${c.length} bars)`);
      } else {
        console.warn(`  ${b.id}: not enough data (${c.length} bars), skipped`);
      }
    } catch(e){ console.warn(`  ${b.id} failed: ${e.message}`); }
    await sleep(300);
  }
  return out;
}

(async function main(){
  console.log('Building ChartMatch library from Yahoo Finance (real daily equities)\u2026\n');
  console.log('Reps:');
  const reps = await buildReps();
  console.log('\nBoss levels:');
  const bosses = await buildBosses();

  if (reps.length === 0 && bosses.length === 0){
    console.error('\nNothing fetched. Check: (1) `npm install yahoo-finance2` ran in this folder, (2) Node 18+ (`node -v`), (3) internet access.');
    process.exit(1);
  }

  const lib = { generatedAt: new Date().toISOString(), source: 'Yahoo Finance (daily)', reps, bosses };
  writeFileSync('chart-library.json', JSON.stringify(lib));
  console.log(`\nDone \u2192 chart-library.json   (${reps.length} reps, ${bosses.length} bosses)`);
  console.log('Attach that file in the chat, and/or commit it next to index.html to go live.');
})();
