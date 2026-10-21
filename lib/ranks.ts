// Shared by every player badge, the admin selector, and server-side validation.
export const rankConfig={
 'Plat 2':{label:'Platinum II',asset:'/assets/ranks/plat2.png'},
 'Plat 3':{label:'Platinum III',asset:'/assets/ranks/plat3.png'},
 GC1:{label:'Grand Champion I',asset:'/assets/ranks/gc1.png'},
 GC2:{label:'Grand Champion II',asset:'/assets/ranks/gc2.png'},
 GC3:{label:'Grand Champion III',asset:'/assets/ranks/gc3.png'},
 SSL:{label:'Supersonic Legend',asset:'/assets/ranks/ssl.png'},
 'Grand Plat':{label:'Grand Plat',asset:'/assets/ranks/grand-plat.png'},
} as const;
export type Rank=keyof typeof rankConfig;
export const rankOptions=Object.keys(rankConfig) as Rank[];
export function isRank(value:unknown):value is Rank{return typeof value==='string'&&Object.hasOwn(rankConfig,value)}
