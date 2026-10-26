import {env} from 'cloudflare:workers';
import {normalize,seed,type Tournament} from './tournament';

// Page rendering and API refreshes read the same saved snapshot. Seed only an empty database.
export async function readTournament():Promise<Tournament>{
 const row=await env.DB!.prepare('SELECT state, revision FROM tournament WHERE id=1').first<{state:string;revision:number}>();
 return normalize(row?{...JSON.parse(row.state),revision:row.revision}:structuredClone(seed));
}
