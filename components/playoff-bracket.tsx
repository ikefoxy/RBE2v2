'use client';
import {bracket,bracketDefs,standings,type Tournament} from '../lib/tournament';
import TeamLogo from './team-logo';
type Game=ReturnType<typeof bracket>[number];
export default function PlayoffBracket({data,onTeam}:{data:Tournament;onTeam:(id:string)=>void}){
 const games=bracket(data);const get=(id:string)=>games.find(m=>m.id===id)!;const order=data.lockedSeeds.length?data.lockedSeeds:standings(data).map(t=>t.id);
 function placeholder(m:Game,i:number){const def=bracketDefs.find(d=>d.id===m.id)!;const slot=i===0?def.a:def.b;if('seed'in slot)return 'Seed '+slot.seed;const origin=get(slot.win).label;return 'Winner: '+origin}
 function Card({id}:{id:string}){const m=get(id);return <article className="connected-match"><div className="bracket-meta">{m.label}<span>BO{m.bestOf}</span></div>{[m.a,m.b].map((id,i)=>{const t=data.teams.find(t=>t.id===id);return <div key={i} className={'bracket-team '+(id&&m.winner===id?'winner':'')}>{t?<button className="bracket-team-button" onClick={()=>onTeam(t.id)}><span className="bracket-seed">{order.indexOf(t.id)+1}</span><TeamLogo src={t.logo}/><span>{t.name}</span></button>:<span className="tbd">{placeholder(m,i)}</span>}<b>{i===0?m.scoreA??'–':m.scoreB??'–'}</b></div>})}{data.videos.filter(v=>v.matchId==='playoff:'+m.id&&v.teams.includes(m.a||'')&&v.teams.includes(m.b||'')).map(v=><a className="bracket-recording" key={v.id} href={v.url} target="_blank" rel="noreferrer">Watch recording ↗</a>)}</article>}
 const rounds=[['w1','w2','w3','w4'],['w5','w6'],['w7']];
 return <section className="bracket-section single-elimination"><div className="connected-scroll"><div className="connected-board upper-board">{rounds.map((ids,i)=><section key={i} className={'connected-round round-'+i}><h3>{['Quarterfinals · BO3','Semifinals · BO5','Final · BO5'][i]}</h3><div className="round-games">{ids.map(id=><div className="connected-slot" key={id}><Card id={id}/></div>)}</div></section>)}</div></div></section>;
}
