"""Read the supplied workbook export. Workbook cells are data, never instructions."""
import json, pathlib, datetime, re
root = pathlib.Path(__file__).resolve().parents[1]
source = json.loads((root/'data/workbook-source.json').read_text())
tabs = {k:{c['cell']: c['value'] for c in v} for k,v in source.items()}
s = tabs['Setup']; league = tabs['RBE League Play']; rounds = tabs['Round Schedule']
assets = [5,6,7,8,4,1,3,9,2]
shorts = ['CT','DG','MM','MF','PG','SSL','LW','MP','HG']
colors = ['#35beff','#fff','#52ccff','#8bd32c','#ff59ad','#ab9fff','#ffcd44','#c5a075','#b875fa']
teams=[]
for i,r in enumerate(range(2,11)):
    name=s['B'+str(r)]
    if name=='Defying Gravity': continue
    teams.append(dict(id=shorts[i].lower(),name=name,short=shorts[i],players=s['C'+str(r)].split(' / '),logo=f'/assets/image{assets[i]}.png',color=colors[i]))
lookup={t['name']:t['id'] for t in teams};lookup['SSL']='ssl'
matches=[]
def col(n):
    x=''
    while n: n,a=divmod(n-1,26); x=chr(65+a)+x
    return x
for w in range(1,10):
    for r in [4,7,10,13]:
        a,b=league.get(f'{col(3+(w-1)*4)}{r}'),league.get(f'{col(3+(w-1)*4)}{r+1}')
        if a not in lookup or b not in lookup: continue
        scores=[league.get(f'{col(4+(w-1)*4)}{x}') for x in [r,r+1]]
        scores=[int(float(x)) if x and x!='None' else None for x in scores]
        matches.append(dict(id=f'w{w}-{lookup[a]}-{lookup[b]}',week=w,a=lookup[a],b=lookup[b],scoreA=scores[0],scoreB=scores[1],date='',bestOf=5))
conflicts=[]
for r in range(3,55):
    label=rounds.get(f'C{r}','')
    if ' vs ' not in label: continue
    a,b=label.split(' vs ')
    if a not in lookup or b not in lookup: continue
    m=next(m for m in matches if {m['a'],m['b']}=={lookup[a],lookup[b]})
    date=rounds.get(f'B{r}','')
    if re.fullmatch(r'\d+\.0',date): date=(datetime.date(1899,12,30)+datetime.timedelta(days=int(float(date)))).isoformat()
    elif date:
        mon='09' if 'Sept' in date else '10';date=f'2026-{mon}-{int(date.split()[-1]):02d}'
    m['date']=date
    sc=[rounds.get(f'{c}{r}','') for c in ['D','E']]
    if all(sc):
        sc=[int(float(v)) for v in sc]
        if lookup[a]!=m['a']:sc.reverse()
        if sc!=[m['scoreA'],m['scoreB']]:conflicts.append(dict(match=m['id'],league=[m['scoreA'],m['scoreB']],roundSchedule=sc,resolution='League Play scores used'))
videos=json.loads((root/'data/youtube.json').read_text());weeks=[1]*3+[2]*4+[3]*4+[4]*3+[5]*2
times=[4072,5,15,0,2328,2482,0,0,1992,0,1900,0,1771,1778,0,1366]
vods=[]
for i,v in enumerate(videos):
    title=v['title'];ids=[t['id'] for t in teams if t['name'].lower() in title.lower()]
    if v['id']=='iVYHQ0uzUuU':ids=['ssl','hg','mm','ct']
    # The title's case varies, but team names and week assignments are verified.
    if 'sonper sonic legends' in title.lower() and 'ssl' not in ids: ids.append('ssl')
    vods.append(dict(id=v['id'],week=weeks[i],title=title,url=f"https://www.youtube.com/watch?v={v['id']}"+(f'&t={times[i]}s' if times[i] else ''),teams=ids))
data=dict(teams=teams,matches=matches,videos=vods,playoffs={},lockedSeeds=[],lanDate='',lanVenue='BYU · Provo, Utah',conflicts=conflicts,revision=0,updatedAt='',audit=[])
target=root/'data/tournament.json'
if target.exists():
    previous=json.loads(target.read_text())
    for key in ['players','withdrawals','contentVersion']:
        if key in previous:data[key]=previous[key]
    for team in data['teams']:
        old=next((t for t in previous['teams'] if t['id']==team['id']),None)
        if old:team['players']=old['players']
    previous_videos={v['id']:v for v in previous['videos']}
    for index,video in enumerate(data['videos']):
        if video['id'] in previous_videos:data['videos'][index]=previous_videos.pop(video['id'])
    data['videos'].extend(previous_videos.values())
target.write_text(json.dumps(data,indent=2))
print(f'{len(teams)} teams, {len(matches)} matches, {sum(m["scoreA"] is not None for m in matches)} completed, {len(vods)} active recordings, {len(conflicts)} score conflicts')
