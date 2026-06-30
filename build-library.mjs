#!/usr/bin/env node
/**
 * ChartMatch — equities chart-library builder
 * --------------------------------------------
 * Fetches REAL daily OHLC from Stooq (free, no API key), slices it into
 * history/future windows, and writes chart-library.json next to index.html.
 *
 * Run it on your own machine (this needs outbound internet that the
 * Claude sandbox doesn't have):
 *
 *     node build-library.mjs
 *
 * Then drop the resulting chart-library.json beside index.html and reload —
 * the app auto-detects it and switches off sample data.
 *
 * Requires Node 18+ (uses global fetch).
 *
 * NOTE ON LICENSING: Stooq is free and fine for building/prototyping. Before
 * you charge users, re-run this against a commercially-licensed daily EOD
 * source (e.g. EODHD or Tiingo, ~$10-20/mo) by swapping fetchStooq() for that
 * provider — the rest of the pipeline is identical.
 */

import { writeFileSync } from 'node:fs';

const N_HIST = 60;            // candles shown
const N_FUT  = 30;            // candles hidden, then revealed
const WIN    = N_HIST + N_FUT;
const REPS_TARGET = 180;      // how many random practice windows to build

/* Liquid US names for the random "reps". Stooq US tickers use a .us suffix. */
const REP_TICKERS = [
  'aapl.us','msft.us','nvda.us','amd.us','tsla.us','amzn.us','googl.us','meta.us',
  'nflx.us','spy.us','qqq.us','iwm.us','jpm.us','dis.us','ba.us','intc.us',
  'pypl.us','crm.us','adbe.us','avgo.us','xom.us','wmt.us','ko.us','pep.us',
  'coin.us','pltr.us','smh.us','xlf.us'
];

/* Boss levels — real eras, with the ticker corrections we worked out.
 * IMPORTANT: SPY only exists from 1993, so anything earlier uses ^spx (S&P 500 index). */
const BOSSES = [
  { id:'covid-2020',     title:'The COVID Crash',   ticker:'spy.us', d1:'2020-01-02', d2:'2020-04-30', macroHeadline:'WHO declares a global health emergency as the virus spreads.' },
  { id:'lehman-2008',    title:'The Lehman Moment',  ticker:'^spx',   d1:'2008-08-01', d2:'2008-11-21', macroHeadline:'Lehman Brothers files for bankruptcy; credit markets seize.' },
  { id:'dotcom-2000',    title:'The Dotcom Top',     ticker:'qqq.us', d1:'2000-02-01', d2:'2000-06-15', macroHeadline:'Tech valuations stretch to extremes as bubble fears build.' },
  { id:'oil-2020',       title:'Black Gold Collapse',ticker:'uso.us', d1:'2020-02-03', d2:'2020-05-15', macroHeadline:'Demand evaporates and storage fills; crude futures crater.' },
  { id:'gme-2021',       title:'The Short Squeeze',  ticker:'gme.us', d1:'2020-11-02', d2:'2021-02-12', macroHeadline:'Retail traders pile in; short sellers get squeezed.' },
  { id:'flash-2010',     title:'The Flash Crash',    ticker:'^spx',   d1:'2010-03-01', d2:'2010-06-15', macroHeadline:'A liquidity vacuum erases ~$1T in minutes intraday.' },
  { id:'china-2015',     title:'China Growth Scare', ticker:'spy.us', d1:'2015-06-15', d2:'2015-10-02', macroHeadline:'China devalues the yuan; global risk assets wobble.' },
  { id:'inflation-2022', title:'The Inflation Pivot',ticker:'qqq.us', d1:'2021-11-01', d2:'2022-06-30', macroHeadline:'The Fed turns hawkish; long-duration tech reprices hard.' },
  { id:'blackmon-1987',  title:'Black Monday',       ticker:'^spx',   d1:'1987-08-03', d2:'1987-11-20', macroHeadline:'Portfolio insurance cascades; the Dow loses 22.6% in a day.' }
];

const sleep = ms => new Promise(r=>setTimeout(r,ms));

/* ---- Stooq daily CSV ---- */
async function fetchStooq(symbol, d1, d2){
  const enc = encodeURIComponent(symbol);
  let url = `https://stooq.com/q/d/l/?s=${enc}&i=d`;
  if(d1 && d2) url += `&d1=${d1.replaceAll('-','')}&d2=${d2.replaceAll('-','')}`;
  const res = await fetch(url, { headers:{'User-Agent':'Mozilla/5.0 ChartMatch/1.0'} });
  if(!res.ok) throw new Error(`HTTP ${res.status} for ${symbol}`);
  const text = await res.text();
  if(!text.startsWith('Date')) throw new Error(`No data for ${symbol} (got: ${text.slice(0,40)})`);
  const rows = text.trim().split('\n').slice(1);
  const out = [];
  for(const line of rows){
    const [date,o,h,l,c] = line.split(',');
    const O=+o,Hh=+h,L=+l,C=+c;
    if([O,Hh,L,C].some(v=>!isFinite(v)||v<=0)) continue;
    out.push({ t:date, o:O, h:Hh, l:L, c:C });
  }
  return out;
}

function sliceWindow(candles, startIdx){
  const w = candles.slice(startIdx, startIdx+WIN);
  return { history:w.slice(0,N_HIST), future:w.slice(N_HIST) };
}

async function buildReps(){
  const reps=[];
  const perTicker = Math.ceil(REPS_TARGET / REP_TICKERS.length);
  for(const tk of REP_TICKERS){
    try{
      const c = await fetchStooq(tk);            // full available daily history
      if(c.length < WIN+5){ console.warn(`  skip ${tk}: only ${c.length} bars`); await sleep(350); continue; }
      const maxStart = c.length - WIN;
      const picks = new Set();
      let guard=0;
      while(picks.size<perTicker && guard++<perTicker*6){
        picks.add(40 + Math.floor(Math.random()*(maxStart-40)));   // skip the very first illiquid bars
      }
      for(const s of picks){
        const w = sliceWindow(c,s);
        reps.push({ ticker:tk.replace('.us','').toUpperCase(), date:w.history[0].t+' → '+w.future[w.future.length-1].t, ...w });
      }
      console.log(`  ${tk}: ${picks.size} windows  (${c.length} bars)`);
    }catch(e){ console.warn(`  ${tk} failed: ${e.message}`); }
    await sleep(400);   // be polite to Stooq
  }
  return reps;
}

async function buildBosses(){
  const out=[];
  for(const b of BOSSES){
    try{
      const c = await fetchStooq(b.ticker, b.d1, b.d2);
      if(c.length < WIN){ console.warn(`  boss ${b.id}: only ${c.length} bars, taking what's there`); }
      // anchor so the "future" lands on the dramatic part: take the last WIN bars of the window
      const start = Math.max(0, c.length - WIN);
      const w = sliceWindow(c.slice(start), 0);
      if(w.history.length>10 && w.future.length>2){
        out.push({ id:b.id, title:b.title, ticker:b.ticker.replace('.us','').toUpperCase().replace('^',''),
                   macroHeadline:b.macroHeadline, date:b.d1+' → '+b.d2, ...w });
        console.log(`  ${b.id}: ok (${c.length} bars)`);
      } else {
        console.warn(`  ${b.id}: not enough data, skipped`);
      }
    }catch(e){ console.warn(`  ${b.id} failed: ${e.message}`); }
    await sleep(450);
  }
  return out;
}

(async function main(){
  console.log('Building ChartMatch library from Stooq (real daily equities)…\n');
  console.log('Reps:');
  const reps = await buildReps();
  console.log('\nBoss levels:');
  const bosses = await buildBosses();

  const lib = { generatedAt:new Date().toISOString(), source:'stooq.com (daily)', reps, bosses };
  writeFileSync('chart-library.json', JSON.stringify(lib));
  console.log(`\nDone → chart-library.json   (${reps.length} reps, ${bosses.length} bosses)`);
  console.log('Drop it next to index.html and reload the app.');
})();
