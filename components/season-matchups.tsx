'use client';
import {complete,seasonEntries,type Tournament} from '../lib/tournament';
import TeamLogo from './team-logo';
import TeamNumber from './team-number';

export function WeeklyResults({data,teamId}:{data:Tournament;teamId:string}){
 const matches=data.matches.filter(m=>[m.a,m.b].includes(teamId)&&complete(m)).sort((a,b)=>a.week-b.week||a.date.localeCompare(b.date)).slice(-5);
 return <div className="form" aria-label="Last five completed series">{matches.map(m=>{
  const own=m.a===teamId,opponent=data.teams.find(t=>t.id===(own?m.b:m.a))!;
  const code=(own?m.scoreA!:m.scoreB!)>(own?m.scoreB!:m.scoreA!)?'W':'L';
  const label=`Week ${m.week}: ${code==='W'?'Win':'Loss'} vs ${opponent.name}`;
  return <span key={m.id} className={code} title={label} aria-label={label}>{code}</span>;
 })}</div>;
}
export default function SeasonMatchups({data,teamId,onTeam}:{data:Tournament;teamId:string;onTeam:(id:string)=>void}){
 const ownTeam=data.teams.find(t=>t.id===teamId)!;
 return <div className="season-matchups">{seasonEntries(data,teamId).map(e=>{
  const m=e.kind==='match'?e.match:null,own=m?.a===teamId,opponent=m?data.teams.find(t=>t.id===(own?m.b:m.a)):null;
  return <div className={'season-row season-'+e.kind} key={e.id}>
   <span className="season-week">Week {e.week}</span>
   <div className="season-opponent">{opponent?<button className="team-name" onClick={()=>onTeam(opponent.id)}><TeamLogo src={opponent.logo}/><span>{opponent.name}</span></button>:e.kind==='default'?<span className="team-name"><TeamLogo src="/assets/defying-gravity.png"/><span>Defying Gravity</span></span>:<span>BYE</span>}
   </div>
   <div className="season-outcome">{m&&complete(m)?<b><TeamNumber color={ownTeam.color}>{own?m.scoreA:m.scoreB}</TeamNumber><span> – </span><TeamNumber color={opponent!.color}>{own?m.scoreB:m.scoreA}</TeamNumber></b>:e.kind==='bye'?null:<span className={'season-status '+e.kind}>{e.kind==='default'?'Default':'Upcoming'}</span>}
   </div>
  </div>;
 })}</div>;
}
