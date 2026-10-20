"""Integration checks against the local preview only. Never point at production."""
import json, urllib.request, urllib.error, http.cookiejar
base='http://127.0.0.1:5173'
jar=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
client.open(base+'/signin-with-chatgpt?return_to=/')
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
assert post(p)[0]==409
p.update(scoreA=match['scoreA'],scoreB=match['scoreB'],revision=saved['revision'])
assert post(p)[0]==200
assert next(m for m in get()['data']['matches'] if m['id']==match['id'])['scoreA'] is None
print('PASS: owner sign-in, cross-origin rejection, invalid score rejection, persistent score update, concurrent-edit rejection, and restoration of original scores.')
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
