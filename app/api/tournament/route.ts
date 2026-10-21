import {env} from 'cloudflare:workers';
import {isRank} from '../../../lib/ranks';
import {isAdmin} from '../../../lib/admin-auth';
import {seed,normalize,bracket,standings,validateScore,reconcile,syncRecording,youtubeId,type Tournament,type Video} from '../../../lib/tournament';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function read():Promise<Tournament>{const row=await env.DB!.prepare('SELECT state, revision FROM tournament WHERE id=1').first<{state:string;revision:number}>();return normalize(row?{...JSON.parse(row.state),revision:row.revision}:structuredClone(seed))}
export async function GET(){try{return json({data:await read(),admin:await isAdmin()})}catch{return json({error:'Tournament data is temporarily unavailable. Please retry.'},503)}}
export async function POST(req:Request){
 if(new URL(req.url).origin!==req.headers.get('origin'))return json({error:'Invalid request origin.'},403);
 if(!await isAdmin())return json({error:'Only the tournament owner can edit.'},403);
 try{
 const body=await req.text();if(body.length>100000)return json({error:'Request is too large.'},413);const p=JSON.parse(body);const d=await read();if(p.revision!==d.revision)return json({error:'Another update was saved. Refresh before editing again.'},409);
 let action='';
 if(p.type==='match'){
 const m=d.matches.find(m=>m.id===p.id);if(!m)throw Error('Unknown match.');validateScore(p.scoreA,p.scoreB,m.bestOf);
 if(typeof p.date!=='string'||(p.date!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(p.date)))throw Error('Enter a valid date.');
 Object.assign(m,{scoreA:p.scoreA,scoreB:p.scoreB,date:p.date});action=`Updated Week ${m.week}: ${m.a} vs ${m.b}`;
 }else if(p.type==='playoff'){
 const m=bracket(d).find(m=>m.id===p.id);if(!m||!m.a||!m.b)throw Error('Both bracket teams must be determined first.');validateScore(p.scoreA,p.scoreB,m.bestOf);
 if(!d.lockedSeeds.length&&p.scoreA!==null)d.lockedSeeds=standings(d).map(t=>t.id);
 d.playoffs[p.id]={scoreA:p.scoreA,scoreB:p.scoreB,bestOf:m.bestOf,participants:[m.a,m.b]};reconcile(d);action=`Updated ${m.label}`;
 }else if(p.type==='seeds'){
 if(!Array.isArray(p.seeds)||p.seeds.length!==8||new Set(p.seeds).size!==8||p.seeds.some((id:string)=>!d.teams.some(t=>t.id===id)))throw Error('Each of the eight teams must appear once.');
 if(bracket(d).some(r=>r.scoreA!==null||r.scoreB!==null))throw Error('Reset playoff results before changing seeds.');d.lockedSeeds=p.seeds;action='Updated playoff seed order';
 }else if(p.type==='reseed'){
 d.lockedSeeds=[];d.playoffs={};action='Reset playoff results and restored live seeding';
 }else if(p.type==='team'){
 const t=d.teams.find(t=>t.id===p.id);if(!t)throw Error('Unknown team.');if(!Array.isArray(p.players)||p.players.length!==2||p.players.some((x:unknown)=>typeof x!=='string'||!x.trim()||(x as string).length>80))throw Error('Enter two player names.');t.players=p.players.map((x:string)=>x.trim());action=`Updated ${t.name} roster`;
 }else if(p.type==='player'){
 const player=d.players.find(x=>x.id===p.id);if(!player)throw Error('Unknown player.');if(typeof p.name!=='string'||!p.name.trim()||p.name.length>80)throw Error('Enter a player name.');if(p.rank!==''&&!isRank(p.rank))throw Error('Choose a supported rank.');d.teams.find(t=>t.id===player.teamId)!.players[player.slot]=p.name.trim();player.rank=p.rank||null;action=`Updated player ${p.name.trim()}`;
 }else if(p.type==='video-create'){
 youtubeId(p.url);const url=new URL(p.url).href;
 const league=d.matches.find(m=>m.id===p.matchId);const playoff=typeof p.matchId==='string'&&p.matchId.startsWith('playoff:')?bracket(d).find(m=>m.id===p.matchId.slice(8)):null;
 const m=league||playoff;if(!m||!m.a||!m.b)throw Error('Choose a matchup with both teams assigned.');
 if(typeof p.title!=='string'||p.title.length>250)throw Error('Enter a title of 250 characters or fewer.');
 if(d.videos.some(v=>v.matchId===p.matchId&&youtubeId(v.url)===youtubeId(url)))throw Error('That recording is already linked to this matchup.');
 const v:Video={id:'recording-'+crypto.randomUUID(),title:p.title.trim()||`${d.teams.find(t=>t.id===m.a)!.name} vs ${d.teams.find(t=>t.id===m.b)!.name}`,url,week:league?league.week:10,teams:[m.a,m.b],matchId:p.matchId};syncRecording(d,v);d.videos.push(v);action=`Added recording: ${v.title}`;
 }else if(p.type==='video'){
 const v=d.videos.find(v=>v.id===p.id);if(!v)throw Error('Unknown recording.');youtubeId(p.url);const u=new URL(p.url);if(typeof p.title!=='string'||!p.title.trim()||p.title.length>250)throw Error('Enter a video title.');if(!Array.isArray(p.teams)||!p.teams.length||p.teams.some((id:string)=>!d.teams.some(t=>t.id===id)))throw Error('Choose at least one known team.');if(p.week!==undefined&&(!Number.isInteger(Number(p.week))||Number(p.week)<1||Number(p.week)>10))throw Error('Choose a valid week.');Object.assign(v,{title:p.title.trim(),url:u.href,teams:[...new Set(p.teams)],week:p.week===undefined?v.week:Number(p.week)});syncRecording(d,v);action=`Updated recording: ${v.title}`;
 }else if(p.type==='lan'){
 if(typeof p.date!=='string'||(p.date!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(p.date))||typeof p.venue!=='string'||p.venue.length>200)throw Error('Enter a valid LAN date and venue.');d.lanDate=p.date;d.lanVenue=p.venue;action='Updated LAN details';
 }else throw Error('Unknown update.');
 d.updatedAt=new Date().toISOString();d.audit=[{at:d.updatedAt,action},...d.audit].slice(0,100);const previous=d.revision;d.revision++;
 const state=JSON.stringify(d);
 const result=previous===0?await env.DB!.prepare('INSERT INTO tournament (id,state,revision) VALUES (1,?,1) ON CONFLICT(id) DO NOTHING RETURNING revision').bind(state).first():await env.DB!.prepare('UPDATE tournament SET state=?,revision=? WHERE id=1 AND revision=? RETURNING revision').bind(state,d.revision,previous).first();
 if(!result)return json({error:'Another update was saved. Refresh and retry.'},409);return json({data:d,admin:true});
 }catch(e){return json({error:e instanceof Error?e.message:'Unable to save update.'},400)}
}
