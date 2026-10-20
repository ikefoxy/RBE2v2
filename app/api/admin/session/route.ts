import {adminConfigured,verifyPassword,sessionCookie,expiredSessionCookie,loginAttempt,clearLoginAttempts} from '../../../../lib/admin-auth';
export const dynamic='force-dynamic';
const sameOrigin=(req:Request)=>req.headers.get('origin')===new URL(req.url).origin;
const json=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
 if(!adminConfigured())return json({error:'Admin password is not configured.'},503);
 try{const text=await req.text();if(text.length>2048)return json({error:'Request is too large.'},413);const body=JSON.parse(text);if(typeof body.password!=='string'||body.password.length>128)return json({error:'Enter your admin password.'},400);
 const attempt=await loginAttempt(req);if(!attempt.allowed)return json({error:'Too many sign-in attempts. Please try again later.'},429,{'Retry-After':String(attempt.retryAfter)});
 if(!await verifyPassword(body.password))return json({error:'Incorrect password.'},401);
 await clearLoginAttempts(attempt.id);return json({admin:true},200,{'Set-Cookie':await sessionCookie(req)});
 }catch{return json({error:'Unable to sign in. Please try again.'},500)}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);return json({admin:false},200,{'Set-Cookie':expiredSessionCookie(req)})}
