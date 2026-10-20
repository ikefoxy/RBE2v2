import bounds from '../data/logo-bounds.json';
export default function TeamLogo({src,className=''}:{src:string;className?:string}){
 const name=src.split('/').pop() as keyof typeof bounds;const box=bounds[name];
 return box?<svg className={'team-logo '+className} viewBox={box.viewBox} aria-hidden="true" focusable="false"><image href={src} width={box.width} height={box.height}/></svg>:<img className={'team-logo '+className} src={src} alt=""/>;
}
