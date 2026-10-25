// One ordinal point per numbered rank; Unranked/legacy ranks have no measured strength.
export const rankConfig={
 Unranked:{label:'Unranked',asset:null,points:null},
 'Bronze 1':{label:'Bronze I',asset:null,points:1},
 'Bronze 2':{label:'Bronze II',asset:null,points:2},
 'Bronze 3':{label:'Bronze III',asset:null,points:3},
 'Silver 1':{label:'Silver I',asset:null,points:4},
 'Silver 2':{label:'Silver II',asset:null,points:5},
 'Silver 3':{label:'Silver III',asset:null,points:6},
 'Gold 1':{label:'Gold I',asset:null,points:7},
 'Gold 2':{label:'Gold II',asset:null,points:8},
 'Gold 3':{label:'Gold III',asset:null,points:9},
 'Plat 1':{label:'Platinum I',asset:null,points:10},
 'Plat 2':{label:'Platinum II',asset:'/assets/ranks/plat2.png',points:11},
 'Plat 3':{label:'Platinum III',asset:'/assets/ranks/plat3.png',points:12},
 'Diamond 1':{label:'Diamond I',asset:null,points:13},
 'Diamond 2':{label:'Diamond II',asset:null,points:14},
 'Diamond 3':{label:'Diamond III',asset:null,points:15},
 'Champion 1':{label:'Champion I',asset:'/assets/ranks/champion1.png',points:16},
 'Champion 2':{label:'Champion II',asset:'/assets/ranks/champion2.png',points:17},
 'Champion 3':{label:'Champion III',asset:null,points:18},
 GC1:{label:'Grand Champion I',asset:'/assets/ranks/gc1.png',points:19},
 GC2:{label:'Grand Champion II',asset:'/assets/ranks/gc2.png',points:20},
 GC3:{label:'Grand Champion III',asset:'/assets/ranks/gc3.png',points:21},
 SSL:{label:'Supersonic Legend',asset:'/assets/ranks/ssl.png',points:22},
 'Grand Plat':{label:'Grand Plat',asset:'/assets/ranks/grand-plat.png',points:null},
} as const;
export type Rank=keyof typeof rankConfig;
export const rankOptions=Object.keys(rankConfig) as Rank[];
export function isRank(value:unknown):value is Rank{return typeof value==='string'&&Object.hasOwn(rankConfig,value)}
export function rankPoints(value:unknown):number|null{return isRank(value)?rankConfig[value].points:null}
