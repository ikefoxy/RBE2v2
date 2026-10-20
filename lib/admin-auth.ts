import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
const encoder=new TextEncoder();
const COOKIE='rbe_admin';
const LIFETIME=12*60*60;
const ITERATIONS=100000;
type Secrets={ADMIN_PASSWORD_HASH?:string;ADMIN_PASSWORD_SALT?:string;ADMIN_SESSION_SECRET?:string};
const secrets=()=>env as unknown as Secrets;
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=(value:string)=>{if(!/^(?:[a-f0-9]{2})+$/i.test(value))throw Error('Invalid auth configuration.');return Uint8Array.from(value.match(/../g)!,b=>parseInt(b,16))};
async function signingKey(){const secret=secrets().ADMIN_SESSION_SECRET;if(!secret)throw Error('Admin access is not configured.');return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
export function adminConfigured(){const s=secrets();return !!(s.ADMIN_PASSWORD_HASH&&s.ADMIN_PASSWORD_SALT&&s.ADMIN_SESSION_SECRET)}
export async function verifyPassword(password:string){
 const s=secrets();if(!adminConfigured()||password.length>128)return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(s.ADMIN_PASSWORD_SALT!),iterations:ITERATIONS},key,256));const expected=unhex(s.ADMIN_PASSWORD_HASH!);
 let mismatch=actual.length^expected.length;for(let i=0;i<actual.length;i++)mismatch|=actual[i]^(expected[i]??0);return mismatch===0;
}
export async function isAdmin(){
 try{const token=(await cookies()).get(COOKIE)?.value;if(!token||!adminConfigured())return false;const parts=token.split('.');if(parts.length!==3)return false;const [expiry,nonce,signature]=parts;const time=Number(expiry);if(!Number.isSafeInteger(time)||time<=Date.now()/1000||time>Date.now()/1000+LIFETIME+60||!/^[a-f0-9]{32}$/.test(nonce))return false;
 return await crypto.subtle.verify('HMAC',await signingKey(),unhex(signature),encoder.encode(`${expiry}.${nonce}`));}catch{return false}
}
export async function sessionCookie(request:Request){const expiry=Math.floor(Date.now()/1000)+LIFETIME;const nonce=hex(crypto.getRandomValues(new Uint8Array(16)));const body=`${expiry}.${nonce}`;const signature=hex(new Uint8Array(await crypto.subtle.sign('HMAC',await signingKey(),encoder.encode(body))));return `${COOKIE}=${body}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${LIFETIME}${new URL(request.url).protocol==='https:'?'; Secure':''}`}
export function expiredSessionCookie(request:Request){return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(request.url).protocol==='https:'?'; Secure':''}`}
export async function loginAttempt(request:Request){
 const now=Date.now(),reset=now+10*60*1000;const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')||'local';const id=hex(new Uint8Array(await crypto.subtle.sign('HMAC',await signingKey(),encoder.encode('login:'+ip))));
 const row=await env.DB!.prepare('INSERT INTO admin_login_attempts (id,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING attempts,reset_at').bind(id,reset,now,now).first<{attempts:number;reset_at:number}>();
 return {id,allowed:!!row&&row.attempts<=8,retryAfter:Math.max(1,Math.ceil(((row?.reset_at||reset)-now)/1000))};
}
export async function clearLoginAttempts(id:string){await env.DB!.prepare('DELETE FROM admin_login_attempts WHERE id=?').bind(id).run()}
