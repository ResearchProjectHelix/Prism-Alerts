const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {test}=require('node:test');
const root=path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
function compile(file,requireFn){const ctx={exports:{},require:requireFn};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,ctx);return ctx.exports;}
const paging=compile('src/lib/queryPaging.ts',()=>{throw Error('Unexpected import');});
const rules=compile('src/lib/completeness.ts',()=>{throw Error('Unexpected import');});
test('pagination includes every row beyond the default server limit and exact page boundaries',async()=>{
 for(const count of [0,200,201,1000,1201]){let calls=0;const source=Array.from({length:count},(_,id)=>({id}));const result=await paging.readAllPages(async(from,to)=>{calls++;assert.equal(to-from,199);return {data:source.slice(from,to+1),error:null};});assert.equal(result.length,count);assert.equal(calls,Math.floor(count/200)+1);}
});
test('a later page failure rejects partial results',async()=>{const error=new Error('Synthetic page failure');await assert.rejects(paging.readAllPages(async from=>({data:Array.from({length:200},()=>({})),error:from?error:null})),e=>e===error);});
test('patient filters are bounded and failures in later batches reject',async()=>{
 const ids=Array.from({length:251},(_,i)=>String(i));let sizes=[];const result=await paging.readPatientBatches(ids,async batch=>{sizes.push(batch.length);return {data:batch.map(id=>({id})),error:null};});assert.deepEqual(sizes,[100,100,51]);assert.equal(result.length,251);const error=new Error('Synthetic batch failure');await assert.rejects(paging.readPatientBatches(ids,async batch=>({data:[],error:batch[0]==='100'?error:null})),e=>e===error);
});
function fixture(failure){
 const patients=Array.from({length:205},(_,i)=>({id:'p'+String(i).padStart(3,'0'),name:'Synthetic '+i,mrn:'TEST-'+i,hospital_id:'sandbox',family_history:'Recorded'}));
 const data={user_profiles:{organization_id:'sandbox',is_active:true},patients,blood_tests:Array.from({length:1100},(_,i)=>({id:'b'+i,patient_id:'p000',test:'Other',value:'Recorded',recorded_at:'2026-10-28'})),reports:[],timeline_events:[]};
 data.blood_tests.push({id:'target',patient_id:'p000',test:'CA19-9',value:'20',recorded_at:'2026-10-20'});
 const calls=[];
 const client={from:table=>{const orders=[],filters={};let bounds;const query={select:()=>query,eq:(key,value)=>{filters[key]=value;return query;},in:(key,value)=>{assert.ok(value.length<=100);filters[key]=value;return query;},order:(column,options={})=>{orders.push([column,options]);return query;},range:(from,to)=>{bounds=[from,to];return query;},single:async()=>({data:table==='patients'?patients[0]:data[table],error:null}),then:(resolve,reject)=>{
  calls.push({table,bounds,filters,orders});assert.ok(bounds,'every list query must specify its page');assert.equal(orders.at(-1)[0],'id');
  let rows=[...data[table]];for(const [key,value] of Object.entries(filters))rows=rows.filter(r=>Array.isArray(value)?value.includes(r[key]):r[key]===value);
  rows.sort((a,b)=>{for(const [key,options] of orders){const result=String(a[key]??'').localeCompare(String(b[key]??''))*(options.ascending===false?-1:1);if(result)return result;}return 0;});
  const [from,to]=bounds;return Promise.resolve({data:rows.slice(from,Math.min(to+1,from+1000)),error:failure&&table===failure.table&&from===failure.from?failure.error:null}).then(resolve,reject);
 }};return query;}};
 return {client,calls};
}
function hook(file,client){return compile(file,name=>name==='@tanstack/react-query'?{useQuery:o=>o.queryFn()}:name.endsWith('/supabase')?{supabase:client}:name.endsWith('/queryPaging')?paging:name.endsWith('/AuthContext')?{useAuth:()=>({user:{id:'synthetic-user'},session:{}})}:name.endsWith('/completeness')?rules:(()=>{throw Error('Unexpected import '+name);})());}
test('Alerts reaches the final patient and a relevant result beyond row 1000',async()=>{const {client,calls}=fixture();const alerts=await hook('src/hooks/useAlerts.ts',client).useAlerts();assert.ok(alerts.some(a=>a.patientId==='p204'));assert.ok(!alerts.some(a=>a.patientId==='p000'&&a.ruleKey==='ca19_9'));assert.ok(calls.some(c=>c.table==='blood_tests'&&c.bounds[0]===1000));assert.ok(calls.some(c=>c.table==='patients'&&c.bounds[0]===200));});
test('patient detail retains a relevant result beyond row 1000',async()=>{const {client}=fixture();const detail=await hook('src/hooks/usePatientDetail.ts',client).usePatientDetail('p000');assert.equal(detail.bloods.length,1101);assert.ok(detail.rules.find(r=>r.key==='ca19_9').met);});
test('Alerts and patient detail both reject later-page failures',async()=>{for(const file of ['src/hooks/useAlerts.ts','src/hooks/usePatientDetail.ts']){const error=new Error('Synthetic later-page failure'),{client}=fixture({table:'blood_tests',from:200,error});const hooks=hook(file,client);await assert.rejects(file.includes('useAlerts')?hooks.useAlerts():hooks.usePatientDetail('p000'),e=>e===error);}});
