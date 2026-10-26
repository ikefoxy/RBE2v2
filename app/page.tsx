import TournamentApp from './tournament-app';
import {mountainDate} from '../lib/tournament';
import {readTournament} from '../lib/tournament-store';
export const dynamic='force-dynamic';
export default async function Home(){
 let initial=null;try{initial=await readTournament()}catch{/* Recover via the public API without showing stale imported scores. */}
 return <TournamentApp initial={initial} initialDate={mountainDate()}/>;
}
