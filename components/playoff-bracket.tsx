'use client';
import {bracket,lanDefinitions,standings,type Tournament,type Slot} from '../lib/tournament';
import TeamLogo from './team-logo';
import TeamNumber from './team-number';
export default function PlayoffBracket({data,onTeam}:{data:Tournament;onTeam:(id:string)=>void}){
 const games=bracket(data),defs=lanDefinitions(data),order=data.lockedSeeds.length?data.lockedSeeds:standings(data).map(t=>t.id);
 function placeholder(slot:Slot){return 'seed'in slot?'Seed '+slot.seed:'win'in slot?'Winner: '+defs.find(d=>d.id===slot.win)?.label:'Team to be assigned'}
 return <>{(['winners','losers'] as const).map(division=>{
  const matches=games.filter(m=>m.division===division),rounds=[...new Set(matches.map(m=>m.round))].sort((a,b)=>a-b),columns=rounds.map(r=>matches.filter(m=>m.round===r));
  const height=Math.max(1,...columns.map(c=>c.length))*170,width=columns.length*310-50;
  function position(id:string){const col=columns.findIndex(c=>c.some(m=>m.id===id)),index=columns[col].findIndex(m=>m.id===id);return {x:col*310,y:(index+.5)*height/columns[col].length}}
  return <section className="bracket-section lan-division" key={division}><h2>{division==='winners'?'Winners bracket':'Losers bracket'}</h2>{division==='losers'&&<p>Separate bracket · All matches BO3</p>}{matches.length?<div className="connected-scroll"><div className="lan-board" style={{width,height:height+36}}>
   <svg className="lan-connectors" width={width} height={height} aria-hidden="true">{matches.flatMap(m=>[defs.find(d=>d.id===m.id)!.a,defs.find(d=>d.id===m.id)!.b].flatMap((slot,i)=>{if(!('win'in slot))return [];const from=position(slot.win),to=position(m.id);return <path key={m.id+'-'+i} d={`M ${from.x+260} ${from.y} H ${from.x+285} V ${to.y+(i===0?-18:18)} H ${to.x}`}/>;}))}</svg>
   {columns.map((col,i)=><section className="lan-round" key={rounds[i]} style={{left:i*310,width:260}}><h3>{col[0].group} · BO{col[0].bestOf}</h3><div style={{height,display:'grid',gridTemplateRows:`repeat(${col.length},1fr)`}}>{col.map(m=>{const def=defs.find(d=>d.id===m.id)!;return <div className="lan-slot" key={m.id}><article className="connected-match"><div className="bracket-meta">{m.label}<span>BO{m.bestOf}</span></div>{[m.a,m.b].map((id,j)=>{const t=data.teams.find(t=>t.id===id);return <div key={j} className={'bracket-team '+(id&&m.winner===id?'winner':'')}>{t?<button className="bracket-team-button" onClick={()=>onTeam(t.id)}><span className="bracket-seed"><TeamNumber color={t.color}>{order.indexOf(t.id)+1}</TeamNumber></span><TeamLogo src={t.logo}/><span>{t.name}</span></button>:<span className="tbd">{placeholder(j===0?def.a:def.b)}</span>}<b>{t?<TeamNumber color={t.color}>{j===0?m.scoreA??'–':m.scoreB??'–'}</TeamNumber>:'–'}</b></div>})}{data.videos.filter(v=>v.matchId==='playoff:'+m.id&&v.teams.includes(m.a||'')&&v.teams.includes(m.b||'')).map(v=><a className="bracket-recording" key={v.id} href={v.url} target="_blank" rel="noreferrer">Watch recording ↗</a>)}</article></div>})}</div></section>)}
  </div></div>:<p>No matches added.</p>}</section>
 })}</>;
}
