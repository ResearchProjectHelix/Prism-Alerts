const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
const source=fs.readFileSync(path.join(root,'src/hooks/usePatientDetail.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
async function run(failingTable){
  const error=new Error('Synthetic query failure: '+failingTable);let evaluated=false;
  const client={from:table=>{const data=table==='patients'?{id:'synthetic',hospital_id:'sandbox',family_history:null}:table==='user_profiles'?{organization_id:'sandbox'}:[];const response={data,error:table===failingTable?error:null};const chain={select:()=>chain,eq:()=>chain,single:async()=>response,order:async()=>response};return chain;}};
  const ctx={exports:{},require:name=>{
    if(name==='@tanstack/react-query')return {useQuery:options=>options.queryFn()};
    if(name.endsWith('/supabase'))return {supabase:client};
    if(name.endsWith('/completeness'))return {buildRules:()=>{evaluated=true;return [];}};
    if(name.endsWith('/AuthContext'))return {useAuth:()=>({user:{id:'synthetic-user'}})};
    throw Error('Unexpected dependency '+name);
  }};
  vm.runInNewContext(compiled,ctx);
  if(failingTable){await assert.rejects(ctx.exports.usePatientDetail('synthetic'),e=>e===error);assert.equal(evaluated,false);}
  else {const result=await ctx.exports.usePatientDetail('synthetic');assert.equal(evaluated,true);assert.equal(result.patient.id,'synthetic');assert.equal(result.isShared,false);}
  console.log('PASS '+(failingTable||'successful patient detail'));
}
(async()=>{for(const table of ['user_profiles','patients','blood_tests','reports','timeline_events',null])await run(table);})().catch(error=>{console.error(error);process.exitCode=1;});
