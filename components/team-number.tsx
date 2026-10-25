import type {CSSProperties,ReactNode} from 'react';

// Resolve from the current team data so every team-owned statistic shares its identity.
export default function TeamNumber({color,children}:{color:string;children:ReactNode}){
 return <span className="team-number" style={{'--team-color':color} as CSSProperties}>{children}</span>;
}
