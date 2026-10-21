const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rbe-logic-'));
process.on('exit',()=>fs.rmSync(tmp,{recursive:true,force:true}));
cp.execFileSync(process.execPath,['node_modules/typescript/bin/tsc','lib/tournament.ts','--outDir',tmp,'--module','commonjs','--resolveJsonModule','--esModuleInterop','--skipLibCheck','--target','es2022']);
const {seed,normalize,roundRobinCheck,standings,forecast,bracket,validateScore,reconcile,nextMatch,youtubeId,syncRecording,recordingsForMatch,recordingsForPlayer}=require(path.join(tmp,'lib/tournament.js'));
const fresh=()=>structuredClone(seed);
assert.equal(roundRobinCheck(seed).valid,true);assert.equal(seed.matches.length,28);
assert.ok(roundRobinCheck(seed).teams.every(t=>t.total===7&&t.opponents===7));
const duplicate=fresh();duplicate.matches[0]={...duplicate.matches[1]};assert.equal(roundRobinCheck(duplicate).valid,false);
assert.equal(seed.withdrawals.length,8);assert.equal(new Set(seed.withdrawals.map(n=>n.teamId)).size,8);
assert.ok(seed.withdrawals.every(n=>!seed.matches.some(m=>m.id===n.id)));
assert.equal(seed.withdrawals.find(n=>n.teamId==='ssl').date,'2026-10-14');
assert.equal(seed.players.length,16);assert.equal(new Set(seed.players.map(p=>p.id)).size,16);
for(const t of seed.teams)assert.equal(seed.players.filter(p=>p.teamId===t.id).length,2);
for(const [teamId,ranks] of Object.entries({mf:['GC2','GC3'],lw:['GC1','Grand Plat'],hg:['Grand Plat','Grand Plat'],pg:['GC1','GC1'],mp:['Plat 2','Plat 3'],mm:['SSL','GC2']}))assert.deepEqual(seed.players.filter(p=>p.teamId===teamId).map(p=>p.rank),ranks);
assert.ok(seed.players.every(p=>p.rank));
const ranks=standings(seed);
assert.deepEqual(ranks.map(t=>[t.short,t.w,t.l,t.gw,t.gl]),[
 ['SSL',3,0,9,4],['CT',3,2,12,7],['PG',3,1,9,3],['MM',2,0,6,2],['LW',1,2,3,6],['MF',2,3,10,9],['MP',0,2,0,6],['HG',0,4,0,12]
].sort((a,b)=>(b[1]-b[2])-(a[1]-a[2])||(b[3]-b[4])-(a[3]-a[4])));
assert.equal(ranks.reduce((s,t)=>s+t.w,0),14);assert.equal(ranks.reduce((s,t)=>s+t.l,0),14);
assert.equal(ranks.reduce((s,t)=>s+t.gw,0),ranks.reduce((s,t)=>s+t.gl,0));
// All dates in the supplied week 6–9 screenshot, including every SSL fixture.
const dates={ 'w6-mf-pg':'2026-10-26','w6-lw-mm':'2026-10-27','w6-mp-ssl':'2026-10-28','w7-pg-mm':'2026-11-02','w7-mp-hg':'2026-11-03','w7-ssl-lw':'2026-11-05','w8-hg-lw':'2026-11-09','w8-mm-ssl':'2026-11-10','w8-ct-mp':'2026-11-11','w9-hg-mm':'2026-11-16','w9-pg-ssl':'2026-11-17','w9-lw-ct':'2026-11-19','w9-mp-mf':'2026-11-20'};
for(const [id,date] of Object.entries(dates))assert.equal(seed.matches.find(m=>m.id===id)?.date,date,id);
assert.ok(seed.matches.filter(m=>[m.a,m.b].includes('ssl')).every(m=>m.date));
assert.equal(seed.videos.length,17);assert.equal(new Set(seed.videos.map(v=>v.url)).size,16);
const combined=seed.videos.filter(v=>youtubeId(v.url)==='iVYHQ0uzUuU');assert.equal(combined.length,2);assert.equal(combined[0].url,combined[1].url);
for(const team of ['ssl','hg']){const recording=recordingsForPlayer(seed,team+'-0').find(v=>youtubeId(v.url)==='iVYHQ0uzUuU');assert.equal(recording.title,'SONper SONic Legends vs The Hex Girls')}
for(const team of ['mm','ct']){const recording=recordingsForPlayer(seed,team+'-0').find(v=>youtubeId(v.url)==='iVYHQ0uzUuU');assert.equal(recording.title,'Mommy Mag vs Cliip That')}
assert.equal(recordingsForMatch(seed,seed.matches.find(m=>m.id==='w1-mm-ct'))[0].title,'Mommy Mag vs Cliip That');
assert.equal(seed.videos.filter(v=>v.title.includes('Defying Gravity')).length,3);
for(const v of seed.videos){assert.equal(v.playerIds.length,v.teams.length*2);assert.equal(youtubeId(v.url).length,11)}
for(const url of ['http://youtube.com/watch?v=abcdefghijk','https://youtube.com.evil.test/watch?v=abcdefghijk','https://www.youtube.com/watch?v=bad'])assert.throws(()=>youtubeId(url));
assert.equal(youtubeId('https://youtu.be/abcdefghijk?t=20'),'abcdefghijk');
const sync=fresh(),m=nextMatch(sync);const video={id:'new',title:'New match',url:'https://youtu.be/abcdefghijk',week:m.week,teams:[m.a,m.b],matchId:m.id};syncRecording(sync,video);sync.videos.push(video);assert.equal(video.playerIds.length,4);assert.ok(recordingsForMatch(sync,m).includes(video));assert.ok(recordingsForPlayer(sync,video.playerIds[0]).includes(video));
const firstPlayer=video.playerIds[0];video.teams=['pg','ssl'];syncRecording(sync,video);assert.ok(!recordingsForPlayer(sync,firstPlayer).includes(video));assert.equal(video.playerIds.length,4);
const upcoming=fresh();assert.equal(nextMatch(upcoming).id,'w5-mm-mp');const next=nextMatch(upcoming);next.scoreA=3;next.scoreB=1;assert.equal(nextMatch(upcoming).date,'2026-10-26');nextMatch(upcoming).date='2026-10-18';assert.equal(nextMatch(upcoming).date,'2026-10-18');upcoming.matches.forEach(m=>{m.scoreA=3;m.scoreB=0});assert.equal(nextMatch(upcoming),undefined);
for(const m of seed.matches){validateScore(m.scoreA,m.scoreB,m.bestOf);assert.ok(forecast(seed,m.a,m.b)>0&&forecast(seed,m.a,m.b)<100)}
const empty=fresh();empty.matches.forEach(m=>{m.scoreA=null;m.scoreB=null});assert.equal(forecast(empty,'ct','mm'),50);
for(const [a,b,bo] of [[1,1,5],[2,1,5],[-1,3,5],[3,null,5],[3,4,5],[2.5,3,5]])assert.throws(()=>validateScore(a,b,bo));
const d=fresh();assert.deepEqual(bracket(d).map(m=>m.bestOf),[3,3,3,3,5,5,5]);assert.equal(bracket(d).length,7);
assert.deepEqual(bracket(d).slice(0,4).map(m=>[m.a,m.b]),[[ranks[0].id,ranks[7].id],[ranks[3].id,ranks[4].id],[ranks[1].id,ranks[6].id],[ranks[2].id,ranks[5].id]]);
function win(id,side=0){const m=bracket(d).find(m=>m.id===id);assert.ok(m.a&&m.b);const target=(m.bestOf+1)/2;d.playoffs[id]={scoreA:side?0:target,scoreB:side?target:0,bestOf:m.bestOf,participants:[m.a,m.b]};reconcile(d)}
d.lockedSeeds=ranks.map(t=>t.id);for(const id of ['w1','w2','w3','w4','w5','w6','w7'])win(id);
assert.equal(bracket(d).find(m=>m.id==='w7').winner,ranks[0].id);win('w1',1);assert.equal(d.playoffs.w5.scoreA,null);assert.equal(d.playoffs.w7.scoreA,null);assert.equal(d.playoffs.w6.scoreA,3);
const locked=bracket(d)[0].a;d.matches.forEach(m=>{if(m.a==='ssl'||m.b==='ssl'){m.scoreA=m.a==='ssl'?0:3;m.scoreB=m.b==='ssl'?0:3}});assert.equal(bracket(d)[0].a,locked);d.lockedSeeds=[];d.playoffs={};assert.equal(bracket(d)[0].a,standings(d)[0].id);
const custom=fresh();custom.lockedSeeds=standings(custom).map(t=>t.id);[custom.lockedSeeds[0],custom.lockedSeeds[7]]=[custom.lockedSeeds[7],custom.lockedSeeds[0]];assert.equal(bracket(custom)[0].a,custom.lockedSeeds[0]);
// Upgrade v2 records without losing edited scores, valid dates, or existing recordings.
const legacy=fresh();legacy.contentVersion=2;legacy.videos=legacy.videos.filter(v=>v.id!=='iVYHQ0uzUuU-mm-ct');legacy.videos.find(v=>v.id==='iVYHQ0uzUuU').teams=['ssl','hg','mm','ct'];legacy.matches[0].scoreB=1;legacy.matches.find(m=>m.id==='w6-mp-ssl').date='';legacy.matches.find(m=>m.id==='w7-ssl-lw').date='2026-11-06';legacy.playoffs={l1:{scoreA:2,scoreB:1,bestOf:3,participants:['ct','mm']},w5:{scoreA:2,scoreB:1,bestOf:3,participants:['ct','mm']}};normalize(legacy);assert.equal(legacy.matches[0].scoreB,1);assert.equal(legacy.matches.find(m=>m.id==='w6-mp-ssl').date,'2026-10-28');assert.equal(legacy.matches.find(m=>m.id==='w7-ssl-lw').date,'2026-11-06');assert.equal(legacy.videos.length,17);assert.ok(legacy.legacyPlayoffs.l1);assert.equal(legacy.playoffs.w5.scoreA,null);assert.ok(!legacy.playoffs.l1);normalize(legacy);assert.equal(legacy.videos.length,17);
console.log('PASS: seven-opponent round robin, screenshot dates, defaults excluded, all player ranks, shared-stream titles, recording/player linkage, next-match updates, single elimination BO3/BO5/BO5, seed swaps, and safe data upgrades.');

// Apply this rank correction once without changing scores, IDs, names, or later admin edits.
const v3=fresh();v3.contentVersion=3;v3.players.filter(p=>p.teamId==='mp').forEach(p=>p.rank='Grand Plat');
const before=JSON.stringify({matches:v3.matches,teams:v3.teams,playoffs:v3.playoffs,videos:v3.videos});normalize(v3);
assert.equal(v3.contentVersion,5);assert.deepEqual(v3.players.filter(p=>p.teamId==='mp').map(p=>p.rank),['Plat 2','Plat 3']);
assert.equal(JSON.stringify({matches:v3.matches,teams:v3.teams,playoffs:v3.playoffs,videos:v3.videos}),before);
v3.players.find(p=>p.id==='mp-0').rank='GC1';normalize(v3);assert.equal(v3.players.find(p=>p.id==='mp-0').rank,'GC1');
const {rankOptions,rankConfig,isRank}=require(path.join(tmp,'lib/ranks.js'));
assert.ok(isRank('Plat 2')&&isRank('Plat 3'));assert.ok(!isRank('Plat 4')&&!isRank('__proto__'));
assert.equal(rankConfig['Plat 2'].label,'Platinum II');assert.equal(rankConfig['Plat 3'].label,'Platinum III');
for(const p of seed.players)assert.ok(rankOptions.includes(p.rank));
console.log('PASS: Platinum II/III rank mappings, shared rank configuration, safe v3 upgrade, and later admin rank preservation.');

const spelling=fresh();spelling.contentVersion=4;spelling.teams.find(t=>t.id==='lw').players[1]='Instristic';spelling.players.find(p=>p.id==='lw-1').aliases.push('intristic');
const scoreSnapshot=JSON.stringify(spelling.matches);normalize(spelling);
assert.equal(spelling.teams.find(t=>t.id==='lw').players[1],'Intrinsic');assert.equal(spelling.players.find(p=>p.id==='lw-1').rank,'Grand Plat');
assert.ok(!spelling.players.find(p=>p.id==='lw-1').aliases.some(a=>/^(instristic|intristic)$/i.test(a)));assert.equal(JSON.stringify(spelling.matches),scoreSnapshot);
assert.equal(seed.teams.find(t=>t.id==='lw').players[1],'Intrinsic');
console.log('PASS: Intrinsic spelling corrected in seed and saved state without changing rank, player ID, or scores.');
