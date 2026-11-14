"""LAN admin API integration checks. Loopback only, restores the disposable fixture."""
import json, urllib.request, urllib.error, http.cookiejar, sqlite3, glob
base='http://127.0.0.1:5173'
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def request(path,payload=None):
    req=urllib.request.Request(base+path,None if payload is None else json.dumps(payload).encode(),{'Content-Type':'application/json','Origin':base})
    try:
        r=client.open(req);return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
def get():return request('/api/tournament')[1]['data']
def post(p):return request('/api/tournament',{**p,'revision':get()['revision']})
assert request('/api/admin/session',{'password':'local-test-password'})[0]==200
original=get()
def save(p):
    status,out=post(p);assert status==200,out;return out['data']
try:
    a=dict(id='lan-local-a',label='Local losers semifinal',division='losers',round=1,group='Semifinals',a={'team':'ct'},b={'team':'mm'},bestOf=3)
    save(dict(type='lan-match',match=a));
    for sa,sb in [(1,0),(2,2),(3,0),(2,.5)]:assert post(dict(type='playoff',id=a['id'],scoreA=sa,scoreB=sb))[0]==400
    assert any(m['id']==a['id'] for m in get()['lanMatches'])
    save(dict(type='playoff',id=a['id'],scoreA=2,scoreB=1));assert get()['playoffs'][a['id']]['scoreA']==2
    b={**a,'id':'l3','label':'Local losers final','round':2,'group':'Final','a':{'win':a['id']},'b':{'team':'pg'}}
    save(dict(type='lan-match',match=b));save(dict(type='playoff',id=b['id'],scoreA=2,scoreB=0))
    save(dict(type='playoff',id=a['id'],scoreA=0,scoreB=2));assert get()['playoffs'][b['id']]['scoreA'] is None
    assert post(dict(type='lan-match',match={**b,'a':{'win':'w1'}}))[0]==400
    assert post(dict(type='lan-match',match={**b,'bestOf':5}))[0]==400
    a.update(a={'team':'lw'});save(dict(type='lan-match',match=a));
    for sa,sb in [(1,0),(2,2),(3,0),(2,.5)]:assert post(dict(type='playoff',id=a['id'],scoreA=sa,scoreB=sb))[0]==400
    assert get()['playoffs'][a['id']]['scoreA'] is None
    save(dict(type='playoff',id=a['id'],scoreA=2,scoreB=0))
    save(dict(type='lan-delete',id=a['id']));assert next(m for m in get()['lanMatches'] if m['id']==b['id'])['a']=={'empty':True}
    assert get()['playoffs'][b['id']]['scoreA'] is None
    save(dict(type='lan-delete',id=b['id']))
    save(dict(type='lan-match',match=dict(id='w5',label='Local semifinal',division='winners',round=2,group='Semifinals',a={'team':'ct'},b={'team':'mm'},bestOf=5)))
    for sa,sb in [(2,1),(3,3),(4,0),(3,.5)]:assert post(dict(type='playoff',id='w5',scoreA=sa,scoreB=sb))[0]==400
    save(dict(type='playoff',id='w5',scoreA=3,scoreB=2))
    save(dict(type='lan-match',match=dict(id='w7',label='Local final',division='winners',round=3,group='Final',a={'team':'ct'},b={'team':'mm'},bestOf=7)))
    assert post(dict(type='playoff',id='w7',scoreA=3,scoreB=2))[0]==400
    save(dict(type='playoff',id='w7',scoreA=4,scoreB=3))
    save(dict(type='lan-delete',id='w7'))
    reset=save(dict(type='lan-reset'));assert len(reset['lanMatches'])==10 and reset['lockedSeeds']==[] and reset['playoffs']=={}
    assert next(m for m in reset['lanMatches'] if m['id']=='l1')['a']=={'lose':'w1'}
    assert get()['matches']==original['matches'] and get()['videos']==original['videos']
    print('PASS: protected LAN creation/edit/delete, saved scores, BO7 validation, independent advancement, downstream invalidation, rejected cross-bracket sources and preserved league/recordings.')
finally:
    # Restore only the local fixture and preserve monotonic revisions.
    for path in glob.glob('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite'):
        db=sqlite3.connect(path)
        if db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tournament'").fetchone():
            revision=db.execute('SELECT revision FROM tournament WHERE id=1').fetchone()[0]+1
            original['revision']=revision
            db.execute('UPDATE tournament SET state=?,revision=? WHERE id=1',(json.dumps(original),revision));db.commit();db.close();break
        db.close()
