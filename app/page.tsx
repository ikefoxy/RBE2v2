import TournamentApp from './tournament-app';
import {seed} from '../lib/tournament';
export default function Home(){return <TournamentApp initial={seed}/> }
