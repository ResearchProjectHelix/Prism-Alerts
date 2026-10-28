const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
const code=ts.transpileModule(fs.readFileSync(path.join(root,'src/hooks/usePatients.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
async function check({count=2,fail,active=true,user=true}={}){
 const ranges=[];const failure=new Error('synthetic failure');
 const client={from:table=>{const chain={select:()=>chain,eq:()=>chain,order:()=>chain,single:async()=>({data:{organization_id:'sandbox',is_active:active},error:fail==='profile'?failure:null}),range:async(start,end)=>{
   ranges.push([start,end]);return {error:fail==='patients'||fail==='second-page'&&start>0?failure:null,data:Array.from({length:Math.max(0,Math.min(200,count-start))},(_,i)=>({id:String(start+i),name:'Synthetic '+(start+i),mrn:'TEST-'+(start+i),hospital_id:i%2?'shared':'sandbox'}))};}};return chain;}};
 const ctx={exports:{},require:name=>name==='@tanstack/react-query'?{useQuery:options=>options}:name.endsWith('/supabase')?{supabase:client}:{useAuth:()=>({user:user?{id:'synthetic-user'}:null})}};
 vm.runInNewContext(code,ctx);const query=ctx.exports.usePatients();assert.equal(query.enabled,user);if(!user){assert.equal(ranges.length,0);return;}
 assert.equal(query.queryKey[1],'synthetic-user');
 if(fail||!active){await assert.rejects(query.queryFn());if(!active||fail==='profile')assert.equal(ranges.length,0);}
 else{const result=await query.queryFn();assert.equal(result.length,count);if(count>1){assert.equal(result[0].isShared,false);assert.equal(result[1].isShared,true);}assert.equal(ranges.length,Math.floor(count/200)+1);}
}
(async()=>{for(const fixture of [{},{count:0},{count:200},{count:201},{count:201,fail:'second-page'},{fail:'patients'},{fail:'profile'},{active:false},{user:false}]){await check(fixture);console.log('PASS '+JSON.stringify(fixture));}})().catch(error=>{console.error(error);process.exitCode=1;});
