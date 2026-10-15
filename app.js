const KEY='claimKeeper.v1',DAY=864e5;
const load=()=>JSON.parse(localStorage.getItem(KEY)||'[]'),save=a=>localStorage.setItem(KEY,JSON.stringify(a));
// Rules of thumb only. Shown to the user as "check with your issuer".
const DISPUTE_DAYS={card:60,debit:60,other:180};
function status(c,now=Date.now()){
 const tries=c.log.length,last=tries?c.log[tries-1].t:c.created,silent=Math.floor((now-last)/DAY);
 const age=c.date?Math.floor((now-new Date(c.date).getTime())/DAY):0;
 const win=DISPUTE_DAYS[c.pay],left=win-age;
 let level='green',next='Contact the company in writing and log it here.';
 if(c.resolved){level='green';next='Resolved 🎉';}
 else if(tries>=1&&silent>=7||tries>=3){level='red';next='Send the formal escalation letter below'+(left>0?`, then consider a ${c.pay==='other'?'PayPal/provider':'card'} dispute (about ${left} days left in a typical window).`:'.');}
 else if(tries>=1&&silent>=3){level='amber';next='Follow up in writing and quote your claim number.';}
 return{tries,silent,age,left,level,next}}
function letter(c){const s=status(c),d=new Date().toLocaleDateString();
 const body={US:'If this is not resolved within 14 days I will dispute the charge with my card issuer and file a complaint with the Better Business Bureau and my state Attorney General\u2019s consumer protection office.',
 UK:'If this is not resolved within 14 days I will pursue a chargeback or a Section 75 claim with my card provider and refer the matter to the relevant ombudsman or Citizens Advice.',
 EU:'Sans résolution sous 14 jours, je saisirai le médiateur de la consommation et ma banque. / If unresolved within 14 days I will contact the consumer mediator and my bank.'}[c.region];
 return `${d}\n\nTo: ${c.co} Customer Service\nRe: ${c.type} — reference ${c.ref||'(none given)'} — $${c.amt||'?'}\n\nI am writing formally about the above claim. I have contacted you ${s.tries} time(s):\n${c.log.map((l,i)=>`  ${i+1}. ${new Date(l.t).toLocaleDateString()} via ${l.ch}: ${l.note||'no response'}`).join('\n')||'  (no attempts logged)'}\n\nI have had no satisfactory reply for ${s.silent} day(s). Please resolve this by issuing the ${c.type.toLowerCase().includes('warranty')?'repair or replacement':'refund'} owed.\n\n${body}\n\nSincerely,\n[Your name]`}
function esc(s){return String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function render(){const a=load();document.getElementById('list').innerHTML=a.length?a.map(c=>{const s=status(c);
 return `<div class="card"><b>${esc(c.co)}</b> <span class="tag">${esc(c.type)}</span><span class="tag ${s.level}">${s.level==='red'?'Escalate':s.level==='amber'?'Follow up':'On track'}</span>
 <p style="margin:6px 0">$${esc(c.amt||'?')} · ref ${esc(c.ref||'—')} · ${s.tries} contact attempt(s) · ${s.silent} day(s) since last contact</p>
 <p><b>Next step:</b> ${s.next}</p><ol class="tl">${c.log.map(l=>`<li>${new Date(l.t).toLocaleString()} — ${esc(l.ch)}: ${esc(l.note||'no response')}</li>`).join('')}</ol>
 ${c.resolved?'':`<select id="ch${c.id}" style="width:auto"><option>Email</option><option>Phone</option><option>Live chat</option><option>Social</option><option>In store</option></select>
 <input id="n${c.id}" placeholder="What happened? (optional)" style="width:auto"><button onclick="logTry(${c.id})">Log contact attempt</button>
 <button class="ghost" onclick="showL(${c.id})">Escalation letter</button><button class="ghost" onclick="resolve(${c.id})">Mark resolved</button>`}
 <pre id="L${c.id}" style="display:none"></pre></div>`}).join(''):'<div class="card" style="color:#9aa6bf">No claims yet. Add one or load the sample.</div>'}
function logTry(id){const a=load(),c=a.find(x=>x.id===id);c.log.push({t:Date.now(),ch:document.getElementById('ch'+id).value,note:document.getElementById('n'+id).value});save(a);render()}
function resolve(id){const a=load();a.find(x=>x.id===id).resolved=true;save(a);render()}
function showL(id){const el=document.getElementById('L'+id);el.textContent=letter(load().find(x=>x.id===id));el.style.display='block'}
function add(c){const a=load();a.push({id:Date.now(),created:Date.now(),log:[],resolved:false,...c});save(a);render()}
const v=i=>document.getElementById(i).value;
document.getElementById('add').onclick=()=>{if(!v('co'))return;add({co:v('co'),type:v('type'),amt:v('amt'),ref:v('ref'),date:v('date'),region:v('region'),pay:v('pay')})};
document.getElementById('sample').onclick=()=>{const t=Date.now(); // illustrative sample written for this demo
 add({co:'Example Sofa Co.',type:'Refund',amt:'899',ref:'SO-10432',date:new Date(t-40*DAY).toISOString().slice(0,10),region:'UK',pay:'card',created:t-30*DAY,
 log:[{t:t-25*DAY,ch:'Email',note:'Requested refund for damaged sofa'},{t:t-18*DAY,ch:'Phone',note:'Told someone would call back'},{t:t-10*DAY,ch:'Email',note:'No reply'}]})};
render();
if(typeof module!=='undefined')module.exports={status,letter};
