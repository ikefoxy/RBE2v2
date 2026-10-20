'use client';
import {useState} from 'react';
import {standings,type Tournament} from '../lib/tournament';
export default function SeedEditor({data,save,busy}:{data:Tournament;save:(p:Record<string,unknown>)=>Promise<void>;busy:boolean}){
 const [seeds,setSeeds]=useState(data.lockedSeeds.length?data.lockedSeeds:standings(data).map(t=>t.id));const started=Object.values(data.playoffs).some(r=>r.scoreA!==null||r.scoreB!==null);
 function swap(index:number,id:string){const next=[...seeds];const previous=next.indexOf(id);[next[index],next[previous]]=[next[previous],next[index]];setSeeds(next)}
 return <section className="panel seed-editor"><h3>Playoff seeding</h3><p>Select a team for a seed to swap its position with the team already there. Saved seeding updates the bracket.</p><div className="seed-grid">{seeds.map((id,i)=><label key={i}>Seed {i+1}<select disabled={started||busy} value={id} onChange={e=>swap(i,e.target.value)}>{data.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>)}</div><div className="seed-preview">{[[0,7],[3,4],[1,6],[2,5]].map(([a,b],i)=><span key={i}>QF {i+1}: {data.teams.find(t=>t.id===seeds[a])?.short} vs {data.teams.find(t=>t.id===seeds[b])?.short}</span>)}</div><button className="primary" disabled={started||busy} onClick={()=>save({type:'seeds',seeds})}>Save seed order</button>{started&&<p>Reset playoff results before changing seed positions.</p>}</section>
}
