import initial from '../data/tournament.json';
import {rankPoints,type Rank} from './ranks';
export type Team={id:string;name:string;short:string;players:string[];logo:string;color:string};
export type Match={id:string;week:number;a:string;b:string;scoreA:number|null;scoreB:number|null;date:string;bestOf:number};
export type Video={id:string;title:string;week:number;url:string;teams:string[];matchId?:string;playerIds?:string[]};
export type Result={scoreA:number|null;scoreB:number|null;bestOf:number;participants?:string[]};
export type Player={id:string;teamId:string;slot:number;rank:Rank|null;aliases:string[]};
export type Withdrawal={id:string;week:number;teamId:string;date:string;status:'withdrawn'};
export type Tournament={teams:Team[];players:Player[];withdrawals:Withdrawal[];contentVersion:number;matches:Match[];videos:Video[];playoffs:Record<string,Result>;legacyPlayoffs?:Record<string,Result>;lockedSeeds:string[];lanDate:string;lanVenue:string;conflicts:{match:string;league:(number|null)[];roundSchedule:number[];resolution:string}[];revision:number;updatedAt:string;audit:{at:string;action:string}[]};
export const seed=initial as Tournament;
// Upgrade old persisted records without replacing scores, playoff results, or owner edits.
export function normalize(d:Tournament):Tournament{
 if(!d.contentVersion||d.contentVersion<2){
  d.players=structuredClone(seed.players);d.withdrawals=structuredClone(seed.withdrawals);
  for(const t of d.teams){if(t.id==='mf'&&['4ldnn','4dln'].includes(t.players[1]))t.players[1]='Schmtt';if(t.id==='lw'){if(t.players[0]==='Kylee')t.players[0]='Walnutty';if(t.players[1]==='Andrew H')t.players[1]='Intrinsic'}}
  const v=d.videos.find(v=>v.id==='iVYHQ0uzUuU');if(v)v.title='Mommy Mag vs Cliip That';d.contentVersion=2;
 }
 if(d.contentVersion<3){
  for(const p of d.players){if(['hg-0','hg-1'].includes(p.id))p.rank='Grand Plat';if(['pg-0','pg-1'].includes(p.id))p.rank='GC1'}
  for(const m of d.matches){if(!m.date)m.date=seed.matches.find(s=>s.id===m.id)?.date||''}
  for(const n of d.withdrawals){if(!n.date)n.date=seed.withdrawals.find(s=>s.id===n.id)?.date||''}
  const shared=d.videos.find(v=>v.id==='iVYHQ0uzUuU');
  if(shared){shared.title='SONper SONic Legends vs The Hex Girls';shared.teams=['ssl','hg'];shared.matchId='w1-ssl-hg';
   if(!d.videos.some(v=>v.id==='iVYHQ0uzUuU-mm-ct'))d.videos.splice(d.videos.indexOf(shared)+1,0,{...shared,id:'iVYHQ0uzUuU-mm-ct',title:'Mommy Mag vs Cliip That',teams:['mm','ct'],matchId:'w1-mm-ct'});
  }
  for(const v of d.videos)syncRecording(d,v);
  const allowed=new Set(bracketDefs.map(m=>m.id));
  for(const [id,r] of Object.entries(d.playoffs)){if(!allowed.has(id)){(d.legacyPlayoffs??={})[id]=r;delete d.playoffs[id]}else if(r.bestOf!==bracketDefs.find(m=>m.id===id)!.bestOf){(d.legacyPlayoffs??={})[id]=structuredClone(r);d.playoffs[id]={scoreA:null,scoreB:null,bestOf:bracketDefs.find(m=>m.id===id)!.bestOf}}}
  reconcile(d);d.contentVersion=3;
 }
 if(d.contentVersion<4){
  for(const p of d.players){if(p.id==='mp-0')p.rank='Plat 2';if(p.id==='mp-1')p.rank='Plat 3'}
  d.contentVersion=4;
 }
 if(d.contentVersion<5){
  const team=d.teams.find(t=>t.id==='lw');if(team&&['instristic','intristic','andrew h'].includes(team.players[1].toLowerCase()))team.players[1]='Intrinsic';
  const player=d.players.find(p=>p.id==='lw-1');if(player)player.aliases=player.aliases.filter(a=>!['instristic','intristic'].includes(a.toLowerCase()));
  d.contentVersion=5;
 }
 if(d.contentVersion<6){
  for(const p of d.players){if(p.id==='hg-1')p.rank='GC1';if(p.id==='hg-0')p.rank='Champion 2';if(p.id==='lw-1')p.rank='Champion 1'}
  d.contentVersion=6;
 }
 if(d.contentVersion<7){
  const hexGirls=d.teams.find(t=>t.id==='hg');if(hexGirls)hexGirls.color=seed.teams.find(t=>t.id==='hg')!.color;
  d.contentVersion=7;
 }
 return d;
}
export function youtubeId(value:string){const u=new URL(value);if(u.protocol!=='https:'||!['youtube.com','www.youtube.com','youtu.be'].includes(u.hostname))throw Error('Use a YouTube HTTPS link.');const id=u.hostname==='youtu.be'?u.pathname.slice(1).split('/')[0]:u.searchParams.get('v')||u.pathname.split('/')[2];if(!id||!/^[\w-]{11}$/.test(id))throw Error('Enter a valid YouTube video URL.');return id}
export function recordingWeek(week:number){return week===10?'Playoffs':`Week ${week}`}
export function syncRecording(d:Tournament,v:Video){v.playerIds=d.players.filter(p=>v.teams.includes(p.teamId)).map(p=>p.id);if(v.matchId?.startsWith('playoff:')){const m=bracket(d).find(m=>'playoff:'+m.id===v.matchId);if(v.week!==10||!m?.a||!m.b||v.teams.length!==2||!v.teams.includes(m.a)||!v.teams.includes(m.b))delete v.matchId}if(!v.matchId?.startsWith('playoff:')){const m=d.matches.find(m=>m.week===v.week&&v.teams.length===2&&v.teams.includes(m.a)&&v.teams.includes(m.b));v.matchId=m?.id}return v}
export function recordingsForPlayer(d:Tournament,id:string){const p=d.players.find(p=>p.id===id);return p?d.videos.filter(v=>v.playerIds?.includes(id)||(!v.playerIds&&v.teams.includes(p.teamId))):[]}
export function recordingsForMatch(d:Tournament,m:Match){return d.videos.filter(v=>v.matchId===m.id||(!v.matchId&&v.week===m.week&&v.teams.includes(m.a)&&v.teams.includes(m.b)))}
export function nextMatch(d:Tournament){return d.matches.filter(m=>!complete(m)).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.week-b.week||a.id.localeCompare(b.id))[0]}
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
// Rank is the primary signal; small, smoothed league samples cannot dominate it.
export const forecastWeights={rank:.7,series:.2,games:.1} as const;
export function teamRankPoints(d:Tournament,id:string){const players=d.players.filter(p=>p.teamId===id);const points=players.map(p=>rankPoints(p.rank));return players.length===2&&points.every((p):p is number=>p!==null)?(points[0]!+points[1]!)/2:null}
export function forecastBreakdown(d:Tournament,a:string,b:string){
 const records=standings(d),x=records.find(t=>t.id===a),y=records.find(t=>t.id===b);if(!x||!y)return null;
 const rankA=teamRankPoints(d,a),rankB=teamRankPoints(d,b);
 // A six-step (two full tiers) average-rank gap gives a 10:1 rank-only advantage.
 const rankChance=(rankA===null||rankB===null)?0.5:1/(1+10**((rankB-rankA)/6));
 const share=(a:number,b:number)=>a/(a+b);
 const series=share((x.w+1)/(x.w+x.l+2),(y.w+1)/(y.w+y.l+2));
 const games=share((x.gw+1)/(x.gw+x.gl+2),(y.gw+1)/(y.gw+y.gl+2));
 const components={rank:rankChance,series,games};
 const contributions={rank:100*forecastWeights.rank*rankChance,series:100*forecastWeights.series*series,games:100*forecastWeights.games*games};
 const rawProbability=contributions.rank+contributions.series+contributions.games;
 // Round only the final result to hundredths. Canonical orientation keeps both sides complementary.
 const canonical=a.localeCompare(b)<=0;
 const basisPoints=Math.max(100,Math.min(9900,Math.round((canonical?rawProbability:100-rawProbability)*100)));
 const probability=(canonical?basisPoints:10000-basisPoints)/100;
 return {a:{record:x,rank:rankA,seriesRate:(x.w+1)/(x.w+x.l+2),gameRate:(x.gw+1)/(x.gw+x.gl+2)},b:{record:y,rank:rankB,seriesRate:(y.w+1)/(y.w+y.l+2),gameRate:(y.gw+1)/(y.gw+y.gl+2)},components,contributions,rawProbability,probability};
}
export function forecast(d:Tournament,a:string,b:string):number{return a===b?50:forecastBreakdown(d,a,b)?.probability??50}

type Slot={seed:number}|{win:string};
type BracketDef={id:string;label:string;group:string;a:Slot;b:Slot;bestOf:number};
const S=(seed:number):Slot=>({seed}),W=(win:string):Slot=>({win});
export const bracketDefs:BracketDef[]=[
 {id:'w1',label:'Quarterfinal 1',group:'Quarterfinals',a:S(1),b:S(8),bestOf:3},{id:'w2',label:'Quarterfinal 2',group:'Quarterfinals',a:S(4),b:S(5),bestOf:3},{id:'w3',label:'Quarterfinal 3',group:'Quarterfinals',a:S(2),b:S(7),bestOf:3},{id:'w4',label:'Quarterfinal 4',group:'Quarterfinals',a:S(3),b:S(6),bestOf:3},
 {id:'w5',label:'Semifinal 1',group:'Semifinals',a:W('w1'),b:W('w2'),bestOf:5},{id:'w6',label:'Semifinal 2',group:'Semifinals',a:W('w3'),b:W('w4'),bestOf:5},{id:'w7',label:'Final',group:'Final',a:W('w5'),b:W('w6'),bestOf:5}
];
export function bracket(d:Tournament){
 const seeds=d.lockedSeeds.length?d.lockedSeeds:standings(d).map(t=>t.id);const resolved:Record<string,{a:string|null;b:string|null;winner:string|null;loser:string|null} >={};
 return bracketDefs.map(def=>{const slot=(s:Slot):string|null=>'seed'in s?seeds[s.seed-1]??null:resolved[s.win]?.winner??null;
 const a=slot(def.a),b=slot(def.b);
 const r=d.playoffs[def.id];const valid=!!(a&&b&&r?.bestOf===def.bestOf&&r?.participants?.[0]===a&&r?.participants?.[1]===b);const scoreA=valid?r.scoreA:null,scoreB=valid?r.scoreB:null;const done=scoreA!==null&&scoreB!==null;
 const winner=done?(scoreA!>scoreB!?a:b):null,loser=done?(scoreA!>scoreB!?b:a):null;resolved[def.id]={a,b,winner,loser};return {...def,a,b,scoreA,scoreB,bestOf:def.bestOf,winner,loser};});
}
export function reconcile(d:Tournament){for(const m of bracket(d)){const r=d.playoffs[m.id];if(r&&(r.participants?.[0]!==m.a||r.participants?.[1]!==m.b)){d.playoffs[m.id]={scoreA:null,scoreB:null,bestOf:r.bestOf}}}return d}
export function validateScore(a:number|null,b:number|null,bestOf:number){if(![3,5,7].includes(bestOf))throw Error('Choose best of 3, 5, or 7.');if(a===null&&b===null)return;if(a===null||b===null)throw Error('Enter both scores, or clear both.');const target=(bestOf+1)/2;if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>target||b>target||a===b||Math.max(a,b)!==target)throw Error(`A completed best-of-${bestOf} series needs one winner at ${target} games.`)}

export function filterRecordings(d:Tournament,{query='',week='all',team='all'}:{query?:string;week?:string;team?:string}={}){
 const clean=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const terms=clean(query).split(/\s+/).filter(Boolean);
 const date=(v:Video)=>d.matches.find(m=>m.id===v.matchId)?.date||d.matches.find(m=>m.week===v.week&&v.teams.length===2&&v.teams.includes(m.a)&&v.teams.includes(m.b))?.date||d.withdrawals.find(n=>n.week===v.week&&v.teams.includes(n.teamId))?.date||'';
 return d.videos.map((v,index)=>({v,index,date:date(v)})).filter(({v})=>{
  if(week!=='all'&&v.week!==Number(week)||team!=='all'&&!v.teams.includes(team))return false;
  const teams=d.teams.filter(t=>v.teams.includes(t.id)),players=d.players.filter(p=>v.teams.includes(p.teamId));
  const hay=clean([v.title,recordingWeek(v.week),...teams.flatMap(t=>[t.name,t.short,...t.players]),...players.flatMap(p=>p.aliases)].join(' '));
  return terms.every(term=>hay.includes(term)||hay.replace(/ /g,'').includes(term));
 }).sort((a,b)=>b.v.week-a.v.week||b.date.localeCompare(a.date)||b.index-a.index).map(({v})=>v);
}
