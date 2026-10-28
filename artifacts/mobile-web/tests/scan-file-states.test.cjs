const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
const req=createRequire(path.join(root,'package.json')),ts=req('typescript'),React=req('react');
const {renderToStaticMarkup}=req('react-dom/server');
function compile(relative,requireFn){const exports={};const src=fs.readFileSync(path.join(root,relative),'utf8');vm.runInNewContext(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:requireFn,console});return exports;}
const docs=[{id:'ready',name:'Synthetic <literal> title',file_path:'available',file_name:'scan.pdf',type:'CT'},{id:'none',name:'Metadata only',file_path:null,file_name:null,type:'CT'},{id:'denied',name:'Unavailable file',file_path:'denied',file_name:'scan.png',type:'MRI'}];
let filter;
const client={from:()=>{const chain={select:()=>chain,eq:(key,value)=>{if(key==='category')filter=value;return chain;},order:async()=>({data:docs,error:null})};return chain;},storage:{from:bucket=>{assert.equal(bucket,'clinical-documents');return {createSignedUrl:async key=>key==='available'?{data:{signedUrl:'https://example.invalid/synthetic.pdf'},error:null}:{data:null,error:new Error('denied')}};}}};
const hook=compile('src/hooks/useDocuments.ts',name=>name==='@tanstack/react-query'?{useQuery:options=>options.queryFn()}:name.endsWith('/supabase')?{supabase:client}:req(name));
const viewer=compile('src/components/ScanViewer.tsx',name=>name.endsWith('/colors')?{colors:{}}:req(name));
(async()=>{const result=await hook.useDocuments('synthetic');assert.equal(filter,'Imaging');assert.deepEqual(Array.from(result,x=>x.fileState),['ready','no_file','unavailable']);assert.equal(result[1].fileUrl,null);assert.equal(result[2].fileUrl,null);console.log('PASS signed-link success, no-file and inaccessible-file states');
for(const doc of result){const html=renderToStaticMarkup(React.createElement(viewer.ScanViewer,{doc,onClose:()=>{}}));assert.ok(html.includes('role="dialog"'));if(doc.id==='ready'){assert.ok(html.includes('<iframe'));assert.ok(html.includes('&lt;literal&gt;'));assert.ok(!html.includes('<literal>'));}else{assert.ok(!html.includes('<iframe'));assert.ok(html.includes(doc.id==='none'?'no file attached':'Refresh files'));}}console.log('PASS viewer distinguishes metadata from unavailable files and preserves literal titles');})().catch(error=>{console.error(error);process.exitCode=1;});
