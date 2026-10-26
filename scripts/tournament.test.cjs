const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rbe-logic-'));
process.on('exit',()=>fs.rmSync(tmp,{recursive:true,force:true}));
cp.execFileSync(process.execPath,['node_modules/typescript/bin/tsc','lib/tournament.ts','--outDir',tmp,'--module','commonjs','--resolveJsonModule','--esModuleInterop','--skipLibCheck','--target','es2022']);
const {seed,normalize,roundRobinCheck,standings,forecast,bracket,validateScore,reconcile,nextMatch,youtubeId,syncRecording,recordingsForMatch,recordingsForPlayer,filterRecordings,teamRankPoints,forecastWeights,forecastBreakdown,mountainDate,tournamentWeek}=require(path.join(tmp,'lib/tournament.js'));
const fresh=()=>structuredClone(seed);
assert.equal(roundRobinCheck(seed).valid,true);assert.equal(seed.matches.length,28);
assert.ok(roundRobinCheck(seed).teams.every(t=>t.total===7&&t.opponents===7));
const duplicate=fresh();duplicate.matches[0]={...duplicate.matches[1]};assert.equal(roundRobinCheck(duplicate).valid,false);
assert.equal(seed.withdrawals.length,8);assert.equal(new Set(seed.withdrawals.map(n=>n.teamId)).size,8);
assert.ok(seed.withdrawals.every(n=>!seed.matches.some(m=>m.id===n.id)));
assert.equal(seed.withdrawals.find(n=>n.teamId==='ssl').date,'2026-10-14');
assert.equal(seed.players.length,16);assert.equal(new Set(seed.players.map(p=>p.id)).size,16);
for(const t of seed.teams)assert.equal(seed.players.filter(p=>p.teamId===t.id).length,2);
for(const [teamId,ranks] of Object.entries({mf:['GC2','GC3'],lw:['GC1','Champion 1'],hg:['Champion 2','GC1'],pg:['GC1','GC1'],mp:['Plat 2','Plat 3'],mm:['SSL','GC2']}))assert.deepEqual(seed.players.filter(p=>p.teamId===teamId).map(p=>p.rank),ranks);
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
const empty=fresh();empty.matches.forEach(m=>{m.scoreA=null;m.scoreB=null});empty.players.forEach(p=>p.rank='GC1');assert.equal(forecast(empty,'ct','mm'),50);
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
assert.equal(v3.contentVersion,8);assert.deepEqual(v3.players.filter(p=>p.teamId==='mp').map(p=>p.rank),['Plat 2','Plat 3']);
assert.equal(JSON.stringify({matches:v3.matches,teams:v3.teams,playoffs:v3.playoffs,videos:v3.videos}),before);
v3.players.find(p=>p.id==='mp-0').rank='GC1';normalize(v3);assert.equal(v3.players.find(p=>p.id==='mp-0').rank,'GC1');
const {rankOptions,rankConfig,isRank}=require(path.join(tmp,'lib/ranks.js'));
assert.ok(isRank('Plat 2')&&isRank('Plat 3'));assert.ok(!isRank('Plat 4')&&!isRank('__proto__'));
assert.equal(rankConfig['Plat 2'].label,'Platinum II');assert.equal(rankConfig['Plat 3'].label,'Platinum III');
for(const p of seed.players)assert.ok(rankOptions.includes(p.rank));
console.log('PASS: Platinum II/III rank mappings, shared rank configuration, safe v3 upgrade, and later admin rank preservation.');

const spelling=fresh();spelling.contentVersion=4;spelling.teams.find(t=>t.id==='lw').players[1]='Instristic';spelling.players.find(p=>p.id==='lw-1').aliases.push('intristic');
const scoreSnapshot=JSON.stringify(spelling.matches);normalize(spelling);
assert.equal(spelling.teams.find(t=>t.id==='lw').players[1],'Intrinsic');assert.equal(spelling.players.find(p=>p.id==='lw-1').rank,'Champion 1');
assert.ok(!spelling.players.find(p=>p.id==='lw-1').aliases.some(a=>/^(instristic|intristic)$/i.test(a)));assert.equal(JSON.stringify(spelling.matches),scoreSnapshot);
assert.equal(seed.teams.find(t=>t.id==='lw').players[1],'Intrinsic');
console.log('PASS: Intrinsic spelling corrected in seed and saved state without changing rank, player ID, or scores.');

const v5=fresh();v5.contentVersion=5;for(const p of v5.players)if(['hg-0','hg-1','lw-1'].includes(p.id))p.rank='Grand Plat';
const unchanged=JSON.stringify({matches:v5.matches,teams:v5.teams,playoffs:v5.playoffs,lockedSeeds:v5.lockedSeeds,videos:v5.videos});normalize(v5);
for(const [id,rank] of Object.entries({'hg-0':'Champion 2','hg-1':'GC1','lw-1':'Champion 1'}))assert.equal(v5.players.find(p=>p.id===id).rank,rank);
assert.equal(JSON.stringify({matches:v5.matches,teams:v5.teams,playoffs:v5.playoffs,lockedSeeds:v5.lockedSeeds,videos:v5.videos}),unchanged);
v5.players.find(p=>p.id==='hg-0').rank='GC2';normalize(v5);assert.equal(v5.players.find(p=>p.id==='hg-0').rank,'GC2');
assert.ok(isRank('Champion 1')&&isRank('Champion 2'));assert.equal(rankConfig['Champion 1'].label,'Champion I');assert.equal(rankConfig['Champion 2'].label,'Champion II');assert.ok(!isRank('Champion 4'));
console.log('PASS: Slayer GC1, Hex Champion II, Intrinsic Champion I, shared configuration and one-time saved-state upgrade.');

// Forecast behavior: rank leads, records still matter, absent ranks are neutral.
assert.deepEqual(forecastWeights,{rank:.7,series:.2,games:.1});
const model=fresh();model.matches.forEach(m=>{m.scoreA=null;m.scoreB=null});model.players.forEach(p=>p.rank='GC1');
assert.equal(teamRankPoints(model,'ct'),19);assert.equal(forecast(model,'ct','mm'),50);
model.players.filter(p=>p.teamId==='ct').forEach(p=>p.rank='GC3');model.players.filter(p=>p.teamId==='mm').forEach(p=>p.rank='Champion 1');
const beforeRecords=forecast(model,'ct','mm');assert.ok(beforeRecords>50);
for(const m of model.matches){if([m.a,m.b].includes('ct')){m.scoreA=m.a==='ct'?0:3;m.scoreB=m.b==='ct'?0:3}else if([m.a,m.b].includes('mm')){m.scoreA=m.a==='mm'?3:0;m.scoreB=m.b==='mm'?3:0}}
assert.ok(forecast(model,'ct','mm')>50,'A clear rank gap outweighs opposite series records');assert.ok(forecast(model,'ct','mm')<beforeRecords,'League records still affect the estimate');
const withRecords=forecast(model,'ct','mm');const recordsBefore=JSON.stringify(standings(model));model.players.filter(p=>p.teamId==='ct').forEach(p=>p.rank='SSL');assert.ok(forecast(model,'ct','mm')>withRecords);assert.equal(JSON.stringify(standings(model)),recordsBefore);
for(const m of model.matches)assert.equal(forecast(model,m.a,m.b)+forecast(model,m.b,m.a),100);
const unknown=fresh();unknown.matches.forEach(m=>{m.scoreA=null;m.scoreB=null});unknown.players.filter(p=>p.teamId==='ct').forEach(p=>p.rank='Unranked');assert.equal(teamRankPoints(unknown,'ct'),null);assert.equal(forecast(unknown,'ct','mm'),50);
unknown.players.find(p=>p.id==='ct-0').rank='GC1';assert.equal(forecast(unknown,'ct','mm'),50);unknown.players.find(p=>p.id==='ct-1').rank=null;assert.equal(forecast(unknown,'ct','mm'),50);
assert.deepEqual(Object.values(rankConfig).map(r=>r.points).filter(p=>p!==null),Array.from({length:22},(_,i)=>i+1));
// Replay search combines title, team names/abbreviations, player aliases and all controls.
const sourceIds=seed.videos.map(v=>v.id);const latest=filterRecordings(seed);assert.equal(latest.length,17);assert.ok(latest.every((v,i)=>!i||latest[i-1].week>=v.week));assert.equal(youtubeId(latest[0].url),'diNVZ6eNIiw');
assert.deepEqual(filterRecordings(seed,{query:'mommy mag',week:'1',team:'ct'}).map(v=>v.title),['Mommy Mag vs Cliip That']);
assert.deepEqual(filterRecordings(seed,{query:'SSL',week:'1'}).map(v=>v.title),['SONper SONic Legends vs The Hex Girls']);
assert.ok(filterRecordings(seed,{query:'sonpersonic'}).every(v=>v.teams.includes('ssl')));assert.ok(filterRecordings(seed,{query:'sonpersonic'}).length);
assert.ok(filterRecordings(seed,{query:'Andrew H'}).every(v=>v.teams.includes('lw')));assert.ok(filterRecordings(seed,{query:'zeek'}).every(v=>v.teams.includes('mm')));
assert.equal(filterRecordings(seed,{query:'Defying Gravity'}).length,3);assert.equal(filterRecordings(seed,{week:'1',team:'ct',query:'Mow Foes'}).length,0);assert.equal(filterRecordings(seed,{query:'no replay matches this'}).length,0);
assert.deepEqual(seed.videos.map(v=>v.id),sourceIds);
const newReplay=fresh();newReplay.videos.push({id:'new-six',title:'New Week 6 replay',url:'https://youtu.be/abcdefghijk',week:6,teams:['mp','ssl'],matchId:'w6-mp-ssl'});assert.equal(filterRecordings(newReplay)[0].id,'new-six');assert.equal(filterRecordings(newReplay,{team:'ssl',week:'6',query:'Wes'})[0].id,'new-six');
console.log('PASS: rank-led forecasts, record influence, neutral unknown ranks, complete rank ladder, symmetric probabilities, newest-first replays and combined search filters.');

// A live-record regression: whole-percent rounding hid Mommy Mag's game-record edge.
const mmSsl=fresh();const mmMp=mmSsl.matches.find(m=>m.id==='w5-mm-mp');mmMp.scoreA=3;mmMp.scoreB=0;
const math=forecastBreakdown(mmSsl,'mm','ssl');
assert.equal(math.a.rank,21);assert.equal(math.b.rank,21);
assert.deepEqual([math.a.record.w,math.a.record.l,math.a.record.gw,math.a.record.gl],[3,0,9,2]);
assert.deepEqual([math.b.record.w,math.b.record.l,math.b.record.gw,math.b.record.gl],[3,0,9,4]);
assert.equal(math.components.rank,.5);assert.equal(math.components.series,.5);
assert.ok(Math.abs(math.components.games-15/28)<1e-12);
assert.ok(Math.abs(math.rawProbability-(35+10+75/14))<1e-12);
assert.equal(forecast(mmSsl,'mm','ssl'),50.36);assert.equal(forecast(mmSsl,'ssl','mm'),49.64);
for(const m of mmSsl.matches){const a=forecast(mmSsl,m.a,m.b),b=forecast(mmSsl,m.b,m.a);assert.equal(Math.round(a*100)+Math.round(b*100),10000)}
const beforeEdit=forecast(mmSsl,'mm','ssl');mmSsl.players.find(p=>p.id==='mm-1').rank='GC3';assert.ok(forecast(mmSsl,'mm','ssl')>beforeEdit);
mmSsl.players.find(p=>p.id==='mm-1').rank='GC2';mmMp.scoreB=1;assert.ok(forecast(mmSsl,'mm','ssl')<beforeEdit);
assert.equal(forecastBreakdown(mmSsl,'missing','ssl'),null);
console.log('PASS: MM/SSL live-record math, two-decimal complementary estimates, and immediate rank/result recalculation.');

// Upgrade saved team identity without changing any owner-managed tournament data.
const redHex=fresh();redHex.contentVersion=6;redHex.teams.find(t=>t.id==='hg').color='#b875fa';
const beforeColor=structuredClone(redHex);normalize(redHex);beforeColor.teams.find(t=>t.id==='hg').color='#ff5b5b';beforeColor.contentVersion=8;
assert.deepEqual(redHex,beforeColor);assert.equal(seed.teams.find(t=>t.id==='hg').color,'#ff5b5b');
normalize(redHex);assert.deepEqual(redHex,beforeColor);
console.log('PASS: Hex Girls red identity upgrades saved data without altering results, ranks or recordings.');

const blueCliip=fresh();blueCliip.contentVersion=7;blueCliip.teams.find(t=>t.id==='ct').color='#35beff';
const beforeBlue=structuredClone(blueCliip);normalize(blueCliip);beforeBlue.teams.find(t=>t.id==='ct').color='#3f79e8';beforeBlue.contentVersion=8;
assert.deepEqual(blueCliip,beforeBlue);assert.equal(seed.teams.find(t=>t.id==='ct').color,'#3f79e8');
normalize(blueCliip);assert.deepEqual(blueCliip,beforeBlue);
console.log('PASS: Cliip That deeper blue identity updates saved data and preserves other teams and results.');

// Overview follows the Mountain Time calendar week, never an older unfinished fixture.
assert.equal(mountainDate(new Date('2026-10-26T05:59:59Z')),'2026-10-25');
assert.equal(mountainDate(new Date('2026-10-26T06:00:00Z')),'2026-10-26');
assert.equal(tournamentWeek(seed,'2026-10-25'),5);assert.equal(tournamentWeek(seed,'2026-10-26'),6);
assert.equal(tournamentWeek(seed,'2026-11-01'),6);assert.equal(tournamentWeek(seed,'2026-11-02'),7);
assert.equal(tournamentWeek(seed,'2026-01-01'),1);assert.equal(tournamentWeek(seed,'2027-01-01'),9);
const weekly=fresh();assert.equal(nextMatch(weekly,6).id,'w6-mf-pg');
const firstWeekly=nextMatch(weekly,6);firstWeekly.scoreA=3;firstWeekly.scoreB=0;
assert.equal(nextMatch(weekly,6).id,'w6-lw-mm');nextMatch(weekly,6).date='2026-10-29';assert.equal(nextMatch(weekly,6).id,'w6-mp-ssl');
weekly.matches.filter(m=>m.week===6).forEach(m=>{m.scoreA=3;m.scoreB=0});
assert.equal(nextMatch(weekly,6),undefined);assert.equal(nextMatch(weekly).week,5);
assert.equal(nextMatch(weekly,7).week,7);
console.log('PASS: Mountain Time week rollover, current-week upcoming fixtures, score/date changes and no previous-week fallback.');
