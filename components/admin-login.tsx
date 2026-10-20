'use client';
import {useState,type FormEvent} from 'react';
import {LockKeyhole,ArrowUpRight} from 'lucide-react';
export default function AdminLogin({onLogin}:{onLogin:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');try{const password=new FormData(form).get('password');const response=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error||'Unable to sign in.');form.reset();await onLogin()}catch(e){setError(e instanceof Error?e.message:'Unable to sign in.')}finally{setBusy(false)}}
 return <section className="admin-gate panel"><LockKeyhole size={40}/><h2>Admin access</h2><p>Enter the tournament admin password to manage results, players, and recordings.</p><form className="password-form" onSubmit={submit}><label>Admin password<input type="password" name="password" required maxLength={128} autoComplete="current-password" autoFocus/></label>{error&&<p role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Signing in…':'Unlock admin portal'}<ArrowUpRight size={15}/></button></form><p className="muted">Tournament pages and player profiles are public.</p></section>
}
