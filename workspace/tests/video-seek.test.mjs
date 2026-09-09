import test from 'node:test';
import assert from 'node:assert/strict';
import {SeekQueue} from '../video-seek.mjs';
test('coalesces rapid forward input into the newest destination',()=>{const sent=[];const q=new SeekQueue({seek:t=>sent.push(t)});q.enable();q.request(1);q.request(2);q.request(6);assert.deepEqual(sent,[1]);q.complete(1);assert.deepEqual(sent,[1,6]);q.complete(6);assert.equal(q.busy,false);});
test('reversal supersedes an obsolete forward destination',()=>{const sent=[];const q=new SeekQueue({seek:t=>sent.push(t)});q.enable(4);q.request(7);q.request(1);q.complete(7);assert.deepEqual(sent,[7,1]);q.complete(1);assert.equal(q.settled,1);});
test('input before readiness is retained, while stopped queue does not seek',()=>{const sent=[];const q=new SeekQueue({seek:t=>sent.push(t)});q.request(5);assert.deepEqual(sent,[]);q.enable();assert.deepEqual(sent,[5]);q.stop();q.request(1);q.complete(5);assert.deepEqual(sent,[5]);});
test('settled and non-finite requests do not churn',()=>{const sent=[];const q=new SeekQueue({seek:t=>sent.push(t)});q.enable();q.request(NaN);q.request(Infinity);q.request(.001);assert.deepEqual(sent,[]);});
test('an unseekable backend stops after three misses instead of looping',()=>{const sent=[];let failed=0;const q=new SeekQueue({seek:t=>sent.push(t),fail:()=>failed++});q.enable();q.request(4);q.complete(0);q.complete(0);q.complete(0);q.request(7);assert.equal(sent.length,3);assert.equal(failed,1);assert.equal(q.ready,false);});
