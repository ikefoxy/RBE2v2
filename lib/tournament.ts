import initial from '../data/tournament.json';
export type Team={id:string;name:string;short:string;players:string[];logo:string;color:string};
export type Match={id:string;week:number;a:string;b:string;scoreA:number|null;scoreB:number|null;date:string;bestOf:number};
export type Video={id:string;title:string;week:number;url:string;teams:string[]};
export type Result={scoreA:number|null;scoreB:number|null;bestOf:number;participants?:string[]};
export type Player={id:string;teamId:string;slot:number;rank:string|null;aliases:string[]};
export type Withdrawal={id:string;week:number;teamId:string;date:string;status:'withdrawn'};
export type Tournament={teams:Team[];players:Player[];withdrawals:Withdrawal[];contentVersion:number;matches:Match[];videos:Video[];playoffs:Record<string,Result>;lockedSeeds:string[];lanDate:string;lanVenue:string;conflicts:{match:string;league:(number|null)[];roundSchedule:number[];resolution:string}[];revision:number;updatedAt:string;audit:{at:string;action:string}[]};
export const seed=initial as Tournament;
// Upgrade old persisted records without replacing scores, playoff results, or owner edits.
export function normalize(d:Tournament):Tournament{
 if(!d.contentVersion||d.contentVersion<2){
  d.players=structuredClone(seed.players);d.withdrawals=structuredClone(seed.withdrawals);
  for(const t of d.teams){if(t.id==='mf'&&['4ldnn','4dln'].includes(t.players[1]))t.players[1]='Schmtt';if(t.id==='lw'){if(t.players[0]==='Kylee')t.players[0]='Walnutty';if(t.players[1]==='Andrew H')t.players[1]='Instristic'}}
  const v=d.videos.find(v=>v.id==='iVYHQ0uzUuU');if(v)v.title='Mommy Mag vs Cliip That';d.contentVersion=2;
 }
 return d;
}
export function roundRobinCheck(d:Tournament){
 const ids=new Set(d.teams.map(t=>t.id)),pairs=new Set<string>();let valid=d.teams.length===8&&d.matches.length===28;
 for(const m of d.matches){const key=[m.a,m.b].sort().join(':');if(!ids.has(m.a)||!ids.has(m.b)||m.a===m.b||pairs.has(key))valid=false;pairs.add(key)}
 const teams=d.teams.map(t=>{const fixtures=d.matches.filter(m=>[m.a,m.b].includes(t.id));const opponents=new Set(fixtures.map(m=>m.a===t.id?m.b:m.a));return {id:t.id,total:fixtures.length,opponents:opponents.size,valid:fixtures.length===7&&opponents.size===7}});
 return {valid:valid&&teams.every(t=>t.valid),pairings:pairs.size,teams};
}
export const complete=(m:{scoreA:number|null;scoreB:number|null})=>m.scoreA!==null&&m.scoreB!==null;
export function standings(d:Tournament){
 return d.teams.map(t=>{
  const played=d.matches.filter(m=>(m.a===t.id||m.b===t.id)&&complete(m));let w=0,l=0,gw=0,gl=0;
  const form:string[]=[];
  for(const m of [...played].sort((a,b)=>a.week-b.week)){const a=m.a===t.id;const own=(a?m.scoreA:m.scoreB)!;const other=(a?m.scoreB:m.scoreA)!;gw+=own;gl+=other;if(own>other){w++;form.push('W')}else{l++;form.push('L')}}
  return {...t,w,l,gw,gl,md:w-l,gd:gw-gl,sw:w+l?w/(w+l):0,gwr:gw+gl?gw/(gw+gl):0,form:form.slice(-5)};
 }).sort((a,b)=>b.md-a.md||b.gd-a.gd||a.name.localeCompare(b.name)).map((t,i)=>({...t,rank:i+1}));
}
// Equal weight to Laplace-smoothed series and game win rates; normalized for the pairing.
export function forecast(d:Tournament,a:string,b:string){const s=standings(d);const strength=(id:string)=>{const t=s.find(t=>t.id===id)!;return ((t.w+1)/(t.w+t.l+2)+(t.gw+1)/(t.gw+t.gl+2))/2};const x=strength(a),y=strength(b);return Math.round(x/(x+y)*100)}
type Slot={seed:number}|{win:string}|{lose:string};
type BracketDef={id:string;label:string;group:string;a:Slot;b:Slot;bestOf:number};
const S=(seed:number):Slot=>({seed}),W=(win:string):Slot=>({win}),L=(lose:string):Slot=>({lose});
export const bracketDefs:BracketDef[]=[
 {id:'w1',label:'Quarterfinal 1',group:'Upper · quarterfinals',a:S(1),b:S(8),bestOf:3},{id:'w2',label:'Quarterfinal 2',group:'Upper · quarterfinals',a:S(4),b:S(5),bestOf:3},{id:'w3',label:'Quarterfinal 3',group:'Upper · quarterfinals',a:S(2),b:S(7),bestOf:3},{id:'w4',label:'Quarterfinal 4',group:'Upper · quarterfinals',a:S(3),b:S(6),bestOf:3},
 {id:'w5',label:'Semifinal 1',group:'Upper · semifinals',a:W('w1'),b:W('w2'),bestOf:3},{id:'w6',label:'Semifinal 2',group:'Upper · semifinals',a:W('w3'),b:W('w4'),bestOf:3},{id:'w7',label:'Upper final',group:'Upper · final',a:W('w5'),b:W('w6'),bestOf:5},
 {id:'l1',label:'Lower round 1A',group:'Lower · round 1',a:L('w1'),b:L('w2'),bestOf:3},{id:'l2',label:'Lower round 1B',group:'Lower · round 1',a:L('w3'),b:L('w4'),bestOf:3},
 {id:'l3',label:'Lower round 2A',group:'Lower · round 2',a:W('l1'),b:L('w6'),bestOf:3},{id:'l4',label:'Lower round 2B',group:'Lower · round 2',a:W('l2'),b:L('w5'),bestOf:3},{id:'l5',label:'Lower semifinal',group:'Lower · semifinal',a:W('l3'),b:W('l4'),bestOf:3},{id:'l6',label:'Lower final',group:'Lower · final',a:W('l5'),b:L('w7'),bestOf:3},
 {id:'gf',label:'Grand final',group:'Championship',a:W('w7'),b:W('l6'),bestOf:5},{id:'reset',label:'Bracket reset · if needed',group:'Championship',a:W('w7'),b:W('l6'),bestOf:5}
];
export function bracket(d:Tournament){
 const seeds=d.lockedSeeds.length?d.lockedSeeds:standings(d).map(t=>t.id);const resolved:Record<string,{a:string|null;b:string|null;winner:string|null;loser:string|null} >={};
 return bracketDefs.map(def=>{const slot=(s:Slot):string|null=>'seed'in s?seeds[s.seed-1]??null:'win'in s?resolved[s.win]?.winner??null:resolved[s.lose]?.loser??null;
 let a=slot(def.a),b=slot(def.b);if(def.id==='reset'&&resolved.gf?.winner!==resolved.gf?.b){a=null;b=null}
 const r=d.playoffs[def.id];const valid=!!(a&&b&&r?.participants?.[0]===a&&r?.participants?.[1]===b);const scoreA=valid?r.scoreA:null,scoreB=valid?r.scoreB:null;const done=scoreA!==null&&scoreB!==null;
 const winner=done?(scoreA!>scoreB!?a:b):null,loser=done?(scoreA!>scoreB!?b:a):null;resolved[def.id]={a,b,winner,loser};return {...def,a,b,scoreA,scoreB,bestOf:r?.bestOf??def.bestOf,winner,loser};});
}
export function reconcile(d:Tournament){for(const m of bracket(d)){const r=d.playoffs[m.id];if(r&&(r.participants?.[0]!==m.a||r.participants?.[1]!==m.b)){d.playoffs[m.id]={scoreA:null,scoreB:null,bestOf:r.bestOf}}}return d}
export function validateScore(a:number|null,b:number|null,bestOf:number){if(![3,5,7].includes(bestOf))throw Error('Choose best of 3, 5, or 7.');if(a===null&&b===null)return;if(a===null||b===null)throw Error('Enter both scores, or clear both.');const target=(bestOf+1)/2;if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>target||b>target||a===b||Math.max(a,b)!==target)throw Error(`A completed best-of-${bestOf} series needs one winner at ${target} games.`)}
