// Only one seek is in flight. New input replaces the desired destination,
// rather than building a queue of obsolete scroll positions.
export class SeekQueue {
 constructor({seek,notify=()=>{},fail=()=>{},epsilon=1/48}){this.seek=seek;this.notify=notify;this.fail=fail;this.epsilon=epsilon;this.target=null;this.settled=0;this.busy=false;this.ready=false;this.count=0;this.misses=0;}
 request(time){this.target=Math.max(0,Number.isFinite(time)?time:0);this.flush();}
 enable(time=0){this.ready=true;this.settled=time;this.flush();}
 flush(){if(this.target===null||!this.ready||this.busy||Math.abs(this.target-this.settled)<this.epsilon)return;this.busy=true;this.count++;this.requested=this.target;this.seek(this.target);}
 complete(time){if(!this.busy)return;this.settled=time;this.busy=false;if(Math.abs(time-this.requested)>1/12){this.misses++;if(this.misses>=3){this.stop();this.fail();return;}}else this.misses=0;this.flush();this.notify();}
 stop(){this.ready=false;this.busy=false;}
}
