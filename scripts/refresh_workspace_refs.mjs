// Rebind curated indexed references by identity, never by their old array position.
import {readFileSync,writeFileSync} from 'node:fs';
import {createDocumentLibrary} from '../workspace/documents.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const corpus=read('../workspace/corpus.json'),identities=read('./workspace-data/reference-identities.json');
const library=createDocumentLibrary(corpus);
function visit(value){
 if(Array.isArray(value))return value.map(visit);
 if(!value||typeof value!=='object')return value;
 const out=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,visit(v)]));
 if(out.kind&&typeof out.key==='string'&&typeof out.snapshot==='string'){
  if(identities[out.kind]){
   const identity=identities[out.kind][out.key];
   if(!identity)throw Error(`Missing frozen identity: ${out.kind}/${out.key}`);
   const field=out.kind==='refused'?'refused':'wrong';
   const matches=corpus[field].map((r,i)=>({r,i})).filter(({r})=>Object.entries(identity).every(([k,v])=>(r[k]??null)===v));
   if(matches.length!==1)throw Error(`Cannot uniquely rebind ${out.kind}/${out.key}: ${matches.length} matches`);
   out.key=`${out.kind}:${matches[0].i}`;
  }
  out.snapshot=corpus.generated;
  if(!library.resolve(out).ok)throw Error(`Curated record does not resolve: ${out.kind}/${out.key}`);
 }
 return out;
}
for(const file of ['cases.json','editions.json']){
 const updated=visit(read(`./workspace-data/${file}`));updated.snapshot=corpus.generated;
 updated.reference_note='References revalidated by identity against this public export at build time. Original authorship notes remain unchanged.';
 writeFileSync(new URL(`../workspace/data/${file}`,import.meta.url),JSON.stringify(updated,null,2)+'\n');
}
await import('../workspace/build-record.mjs');
