const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rbe-logic-'));
process.on('exit',()=>fs.rmSync(tmp,{recursive:true,force:true}));
cp.execFileSync(process.execPath,['node_modules/typescript/bin/tsc','lib/tournament.ts','--outDir',tmp,'--module','commonjs','--resolveJsonModule','--esModuleInterop','--skipLibCheck','--target','es2022']);
const {seed,standings,forecast,bracket,validateScore,reconcile}=require(path.join(tmp,'lib/tournament.js'));
const fresh=()=>structuredClone(seed);
assert.equal(seed.teams.length,8);
assert.equal(seed.matches.length,28);
assert.equal(new Set(seed.matches.map(m=>[m.a,m.b].sort().join(':'))).size,28);
assert.ok(seed.teams.every(t=>t.players.length===2&&t.name!=='Defying Gravity'));
for(const t of seed.teams)assert.equal(seed.matches.filter(m=>[m.a,m.b].includes(t.id)).length,7);
const ranks=standings(seed);
assert.deepEqual(ranks.map(t=>[t.short,t.w,t.l,t.gw,t.gl]),[
 ['SSL',3,0,9,4],['CT',3,2,12,7],['PG',3,1,9,3],['MM',2,0,6,2],['LW',1,2,3,6],['MF',2,3,10,9],['MP',0,2,0,6],['HG',0,4,0,12]
].sort((a,b)=>(b[1]-b[2])-(a[1]-a[2])||(b[3]-b[4])-(a[3]-a[4])));
assert.equal(ranks.reduce((s,t)=>s+t.w,0),14);
assert.equal(ranks.reduce((s,t)=>s+t.l,0),14);
assert.equal(ranks.reduce((s,t)=>s+t.gw,0),ranks.reduce((s,t)=>s+t.gl,0));
assert.equal(seed.videos.length,16);
assert.deepEqual(seed.videos.find(v=>v.id==='iVYHQ0uzUuU').teams,['ssl','hg','mm','ct']);
assert.equal(seed.videos.filter(v=>v.title.includes('Defying Gravity')).length,3);
assert.equal(seed.videos.find(v=>v.id==='s5COCZR243w').week,4);
for(const m of seed.matches){validateScore(m.scoreA,m.scoreB,m.bestOf);assert.match(m.date,/^2026-/);assert.ok(forecast(seed,m.a,m.b)>0&&forecast(seed,m.a,m.b)<100)}
const empty=fresh();empty.matches.forEach(m=>{m.scoreA=null;m.scoreB=null});assert.equal(forecast(empty,'ct','mm'),50);
for(const [a,b,bo] of [[1,1,5],[2,1,5],[-1,3,5],[3,null,5],[3,4,5],[2.5,3,5]])assert.throws(()=>validateScore(a,b,bo));
validateScore(null,null,5);validateScore(3,0,5);validateScore(2,1,3);
const d=fresh();const opening=bracket(d).slice(0,4);assert.deepEqual(opening.map(m=>[m.a,m.b]),[[ranks[0].id,ranks[7].id],[ranks[3].id,ranks[4].id],[ranks[1].id,ranks[6].id],[ranks[2].id,ranks[5].id]]);
function win(id,side=0){const m=bracket(d).find(m=>m.id===id);assert.ok(m.a&&m.b,id+' participants');const target=(m.bestOf+1)/2;d.playoffs[id]={scoreA:side?0:target,scoreB:side?target:0,bestOf:m.bestOf,participants:[m.a,m.b]};reconcile(d)}
d.lockedSeeds=ranks.map(t=>t.id);
for(const id of ['w1','w2','w3','w4','w5','w6','w7','l1','l2','l3','l4','l5','l6'])win(id);
win('gf',1);assert.ok(bracket(d).find(m=>m.id==='reset').a);win('reset');
win('gf',0);assert.equal(bracket(d).find(m=>m.id==='reset').a,null);assert.equal(d.playoffs.reset.scoreA,null);
win('w1',1);assert.equal(d.playoffs.w5.scoreA,null);assert.equal(d.playoffs.gf.scoreA,null);
const locked=bracket(d)[0].a;d.matches.forEach(m=>{if(m.a==='ssl'||m.b==='ssl'){m.scoreA=m.a==='ssl'?0:3;m.scoreB=m.b==='ssl'?0:3}});assert.equal(bracket(d)[0].a,locked);
d.lockedSeeds=[];d.playoffs={};assert.equal(bracket(d)[0].a,standings(d)[0].id);
console.log('PASS: import totals, all 28 pairings, corrected standings, forecasts, video mappings, score validation, double elimination, reset final, downstream invalidation, and locked seeding.');
