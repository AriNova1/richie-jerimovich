import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDocumentLibrary,serializeDocumentRef,parseDocumentRef,documentHash,parseDocumentHash} from '../documents.mjs';
import {createAppHost} from '../app-host.mjs';
const corpus=JSON.parse(await readFile(new URL('../corpus.json',import.meta.url),'utf8'));
// Synthetic fixtures below are deliberately separate from the public export.
const fixture={generated:'2026-09-07T01:00:00Z',kept:[{id:'a',title:'Alpha'},{id:'b',title:'Beta'}],writing:[{slug:'note/a',title:'A note'}],refused:[{reason:'First refusal'},{reason:'Second refusal'}],wrong:[{sentence:'A correction'}],log:[{sha:'abc1234'}]};
test('every supplied public record with an identity round-trips through a link',()=>{
 const library=createDocumentLibrary(corpus);
 for(const entry of library.entries()){
  const ref=parseDocumentHash(documentHash(entry.ref));
  const result=library.resolve(ref);
  assert.equal(result.ok,true,entry.ref.key);assert.equal(result.entry.record,entry.record);
 }
});
test('stable IDs survive collection order changes within the same snapshot',()=>{
 const a=createDocumentLibrary(fixture), b=createDocumentLibrary({...fixture,kept:[...fixture.kept].reverse()});
 const ref=a.entries('kept')[0].ref;
 assert.equal(b.resolve(ref).entry.record.title,'Alpha');
});
test('snapshot mismatch never resolves to a different refusal at the same index',()=>{
 const a=createDocumentLibrary(fixture), b=createDocumentLibrary({...fixture,generated:'later',refused:[...fixture.refused].reverse()});
 assert.equal(b.resolve(a.entries('refused')[0].ref).reason,'snapshot-mismatch');
});
test('even stable IDs require the requested source version',()=>{
 const a=createDocumentLibrary(fixture),b=createDocumentLibrary({...fixture,generated:'later'});
 assert.equal(b.resolve(a.entries('kept')[0].ref).reason,'snapshot-mismatch');
});
test('duplicate IDs are ambiguous rather than last-write-wins',()=>{
 const a=createDocumentLibrary({...fixture,kept:[{id:'a'},{id:'a'}]});
 assert.equal(a.resolve(a.entries('kept')[0].ref).reason,'ambiguous-reference');
});
test('malformed refs, prototype keys, corrupted encoding and missing records fail explicitly',()=>{
 const library=createDocumentLibrary(fixture);
 for(const ref of [null,{},[],{kind:'__proto__',key:'a',snapshot:fixture.generated},{kind:'kept',key:5,snapshot:fixture.generated}])assert.equal(library.resolve(ref).reason,'invalid-reference');
 assert.equal(library.resolve({kind:'kept',key:'missing',snapshot:fixture.generated}).reason,'not-found');
 for(const text of ['{','null','[]','x'.repeat(13000)])assert.equal(parseDocumentRef(text),null);
 assert.equal(parseDocumentHash('#document=%ZZ'),null);assert.equal(parseDocumentHash('#other=x'),null);
 assert.throws(()=>serializeDocumentRef({}));
});
test('library does not mutate input or invent IDs for missing kept records',()=>{
 const input=structuredClone(fixture);input.kept.push({title:'No id'});const before=JSON.stringify(input);
 assert.equal(createDocumentLibrary(input).entries('kept').length,2);assert.equal(JSON.stringify(input),before);
});
function host(){return {cleared:0,replaceChildren(){this.cleared++;}};}
test('app replacement and double-close destroy each mounted instance exactly once',()=>{
 const apps=createAppHost({token:1}),h=host();let mounted=0,closed=0;
 apps.register('test',(el,options)=>{assert.equal(el,h);assert.equal(options.token,1);mounted++;return {getState:()=>options.initialState,destroy(){closed++;}};});
 apps.mount('test',h,{selected:'a'});assert.deepEqual(apps.getState('test'),{selected:'a'});
 apps.mount('test',h,{selected:'b'});assert.equal(closed,1);
 apps.unmount('test');apps.unmount('test');apps.destroy();assert.equal(mounted,2);assert.equal(closed,2);
});
test('app failures clear their partial content and unknown registrations fail before mounting',()=>{
 const apps=createAppHost(),h=host();
 apps.register('bad',()=>{throw Error('partial failure');});assert.throws(()=>apps.mount('bad',h),/partial failure/);assert.equal(h.cleared,1);
 assert.throws(()=>apps.mount('unknown',h),/Unknown app/);assert.throws(()=>apps.register('bad',()=>{}),/already registered/);
});
test('one cleanup failure does not prevent the other apps from being destroyed',()=>{
 const apps=createAppHost();let closed=false;
 apps.register('a',()=>({destroy(){throw Error('cleanup');}}));apps.register('b',()=>({destroy(){closed=true;}}));
 apps.mount('a',host());apps.mount('b',host());assert.throws(()=>apps.destroy(),AggregateError);assert.equal(closed,true);
 apps.destroy();assert.throws(()=>apps.mount('b',host()),/disposed/);
});
