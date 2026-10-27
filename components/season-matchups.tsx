'use client';
import {complete,seasonEntries,type Tournament} from '../lib/tournament';
import TeamLogo from './team-logo';
import TeamNumber from './team-number';

const date=(value:string)=>value?new Date(value+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/Denver'}):'Date TBA';
export function WeeklyResults({data,teamId}:{data:Tournament;teamId:string}){
 return <div className="form season-form" aria-label="Weekly results in week order">{seasonEntries(data,teamId).map(e=>{
  let label:string,code:string;
  if(e.kind==='bye'){code='B';label='BYE, no match scheduled'}
  else if(e.kind==='default'){code='D';label='Defying Gravity withdrew, no result counted'}
  else{const m=e.match,own=m.a===teamId,other=data.teams.find(t=>t.id===(own?m.b:m.a))!;code=complete(m)?((own?m.scoreA!:m.scoreB!)>(own?m.scoreB!:m.scoreA!)?'W':'L'):'–';label=(code==='W'?'Win':code==='L'?'Loss':'Upcoming')+' vs '+other.name}
  return <span key={e.id} className={code==='–'?'pending':code} title={`Week ${e.week}: ${label}`} aria-label={`Week ${e.week}: ${label}`}>{code}</span>;
 })}</div>;
}
export default function SeasonMatchups({data,teamId,onTeam}:{data:Tournament;teamId:string;onTeam:(id:string)=>void}){
 const ownTeam=data.teams.find(t=>t.id===teamId)!;
 return <div className="season-matchups">{seasonEntries(data,teamId).map(e=>{
  const m=e.kind==='match'?e.match:null,own=m?.a===teamId,opponent=m?data.teams.find(t=>t.id===(own?m.b:m.a)):null;
  return <div className={'season-row season-'+e.kind} key={e.id}>
   <span className="season-week">Week {e.week}</span>
   <div className="season-opponent">{opponent?<button className="team-name" onClick={()=>onTeam(opponent.id)}><TeamLogo src={opponent.logo}/><span>{opponent.name}</span></button>:e.kind==='default'?<span className="team-name"><TeamLogo src="/assets/defying-gravity.png"/><span>Defying Gravity</span></span>:<span>BYE</span>}
    <small>{e.kind==='default'?'Withdrew · no result counted':e.kind==='bye'?'No match scheduled':date(m!.date)}</small>
   </div>
   <div className="season-outcome">{m&&complete(m)?<b><TeamNumber color={ownTeam.color}>{own?m.scoreA:m.scoreB}</TeamNumber><span> – </span><TeamNumber color={opponent!.color}>{own?m.scoreB:m.scoreA}</TeamNumber></b>:<span className={'season-status '+e.kind}>{e.kind==='default'?'Default':e.kind==='bye'?'BYE':'Upcoming'}</span>}
    {e.kind==='default'&&<small>{date(e.notice.date)}</small>}
   </div>
  </div>;
 })}</div>;
}
