"""Integration checks against the local preview only. Never point at production."""
import re, json, urllib.request, urllib.error, http.cookiejar
base='http://127.0.0.1:5173'
jar=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def login(password,origin=base):
    req=urllib.request.Request(base+'/api/admin/session',json.dumps({'password':password}).encode(),{'Content-Type':'application/json','Origin':origin})
    try:
        res=client.open(req);return res.status,res.headers,json.load(res)
    except urllib.error.HTTPError as e: return e.code,e.headers,e.read().decode()
assert login('wrong-password')[0]==401
assert login('local-test-password','https://elsewhere.test')[0]==403
status,headers,_=login('local-test-password');assert status==200
assert 'HttpOnly' in headers['Set-Cookie'] and 'SameSite=Strict' in headers['Set-Cookie']

def get(): return json.load(client.open(base+'/api/tournament'))
def post(payload,origin=base):
    req=urllib.request.Request(base+'/api/tournament',json.dumps(payload).encode(),{'Content-Type':'application/json','Origin':origin})
    try:
        res=client.open(req);return res.status,json.load(res)
    except urllib.error.HTTPError as e:
        raw=e.read().decode()
        try: return e.code,json.loads(raw)
        except ValueError: return e.code,raw
j=get();assert j['admin'] is True
d=j['data'];match=next(m for m in d['matches'] if m['a']=='mm' and m['b']=='mp')
p=dict(type='match',id=match['id'],date=match['date'],scoreA=3,scoreB=1,revision=d['revision'])
assert post(p,origin='https://elsewhere.test')[0]==403
invalid={**p,'scoreA':1,'scoreB':1};assert post(invalid)[0]==400
status,out=post(p);assert status==200,out
saved=get()['data'];assert saved['revision']==d['revision']+1
assert next(m for m in saved['matches'] if m['id']==match['id'])['scoreA']==3
# The very first server response must show the saved total rather than a seed flash.
def assert_server_snapshot(data):
    count=sum(m['scoreA'] is not None and m['scoreB'] is not None for m in data['matches'])
    html=client.open(base+'/').read().decode()
    assert re.search(r'Series completed</span><strong>'+str(count).zfill(2)+r'</strong>',html), 'SSR must render the saved series count.'
assert_server_snapshot(saved)

assert post(p)[0]==409
p.update(scoreA=match['scoreA'],scoreB=match['scoreB'],revision=saved['revision'])
assert post(p)[0]==200
assert next(m for m in get()['data']['matches'] if m['id']==match['id'])['scoreA'] is None
assert_server_snapshot(get()['data'])
print('PASS: password sign-in, cookie protection, cross-origin rejection, invalid score rejection, persistent score update, concurrent-edit rejection, and restoration of original scores.')
# New controls: validate unique seeds, persist a swap, and restore live seeding.
d=get()['data']
assert not any(x['scoreA'] is not None for x in d['playoffs'].values()), 'Use a fresh local playoff fixture.'
original_seeds=d['lockedSeeds'][:]
seeds=[t['id'] for t in d['teams']]
status,_=post(dict(type='seeds',seeds=[seeds[0]]*8,revision=d['revision']));assert status==400
seeds[0],seeds[7]=seeds[7],seeds[0]
status,out=post(dict(type='seeds',seeds=seeds,revision=d['revision']));assert status==200,out
assert get()['data']['lockedSeeds']==seeds
status,out=post(dict(type='seeds',seeds=original_seeds,revision=get()['data']['revision'])) if original_seeds else post(dict(type='reseed',revision=get()['data']['revision']))
assert status==200,out
assert get()['data']['lockedSeeds']==original_seeds
# Player ranks persist independently of team match scores.
d=get()['data'];p=next(p for p in d['players'] if p['id']=='lw-0');t=next(t for t in d['teams'] if t['id']=='lw');name=t['players'][0];oldrank=p['rank'];scores=[(m['scoreA'],m['scoreB']) for m in d['matches']]
status,out=post(dict(type='player',id=p['id'],name=name,rank='GC2',revision=d['revision']));assert status==200,out
assert next(p for p in get()['data']['players'] if p['id']=='lw-0')['rank']=='GC2'
status,out=post(dict(type='player',id=p['id'],name=name,rank=oldrank or '',revision=get()['data']['revision']));assert status==200,out
assert [(m['scoreA'],m['scoreB']) for m in get()['data']['matches']]==scores
print('PASS: seed duplicates rejected, swapped seeding persisted and restored, player rank edit persisted and restored, and all match scores preserved.')
# All added ranks must be accepted by the protected API and persist on the next read.
for pid,rank in [('mp-0','Plat 2'),('mp-1','Plat 3'),('hg-0','Champion 2'),('hg-1','GC1'),('lw-1','Champion 1')]:
    d=get()['data'];p=next(p for p in d['players'] if p['id']==pid);t=next(t for t in d['teams'] if t['id']==p['teamId']);name=t['players'][p['slot']]
    status,out=post(dict(type='player',id=pid,name=name,rank=rank,revision=d['revision']));assert status==200,out
    assert next(p for p in get()['data']['players'] if p['id']==pid)['rank']==rank
    status,out=post(dict(type='player',id=pid,name=name,rank='Plat 4',revision=get()['data']['revision']));assert status==400
print('PASS: Platinum and Champion ranks accepted, persisted, and unsupported ranks rejected.')

# Recordings are public; create/edit operations require the owner.
public=json.load(urllib.request.urlopen(base+'/api/tournament'));assert public['admin'] is False
assert len(public['data']['players'])==16 and all(p['rank'] for p in public['data']['players'])
d=get()['data'];match=next(m for m in d['matches'] if m['id']=='w6-mp-ssl')
create=dict(type='video-create',matchId=match['id'],title='Local API recording test',url='https://www.youtube.com/watch?v=abcdefghijk',revision=d['revision'])
status,out=post({**create,'url':'https://example.com/video'});assert status==400
status,out=post(create);assert status==200,out
video=next(v for v in out['data']['videos'] if v['title']=='Local API recording test')
try:
    assert set(video['teams'])=={'mp','ssl'}
    assert set(video['playerIds'])=={'mp-0','mp-1','ssl-0','ssl-1'}
    assert video['week']==6 and video['matchId']==match['id']
    public=json.load(urllib.request.urlopen(base+'/api/tournament'));assert any(v['id']==video['id'] for v in public['data']['videos'])
    status,_=post({**create,'revision':get()['data']['revision']});assert status==400
    edit=dict(type='video',id=video['id'],title='Edited local recording',url=video['url'],teams=['ct','mm'],week=1,revision=get()['data']['revision'])
    status,out=post(edit);assert status==200,out
    changed=next(v for v in out['data']['videos'] if v['id']==video['id'])
    assert changed['matchId']=='w1-mm-ct'
    assert set(changed['playerIds'])=={'ct-0','ct-1','mm-0','mm-1'}
finally:
    # Remove only this disposable record from the LOCAL database. Keep all other updates.
    import subprocess
    safe_id=video['id'].replace("'","''")
    sql="UPDATE tournament SET state=json_set(state,'$.videos',json((SELECT json_group_array(json(value)) FROM json_each(tournament.state,'$.videos') WHERE json_extract(value,'$.id')!='"+safe_id+"'))),revision=revision+1 WHERE id=1;"
    subprocess.run(['node','--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',sql],check=True,capture_output=True,text=True)
assert not any(v['id']==video['id'] for v in get()['data']['videos'])
print('PASS: public profiles, owner recording creation, duplicate/URL validation, persisted matchup/team/player links, mapping edits, and local test cleanup.')

req=urllib.request.Request(base+'/api/admin/session',method='DELETE',headers={'Origin':base})
assert client.open(req).status==200
assert get()['admin'] is False
assert post(dict(type='reseed',revision=get()['data']['revision']))[0]==403
for _ in range(8): assert login('incorrect')[0]==401
assert login('incorrect')[0]==429
print('PASS: sign-out revokes browser access, anonymous writes rejected, and repeated incorrect passwords rate-limited.')
