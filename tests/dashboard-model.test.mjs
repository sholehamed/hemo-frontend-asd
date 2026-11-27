import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fullWeeks,bar,metric,link,loadSection} from '../src/app/features/home/dashboard-model.ts';
test('ST09 weeks exclude today, are nonoverlapping and seven complete UTC days',()=>{
 const {current,previous}=fullWeeks(new Date('2026-11-27T19:20:00Z'));
 assert.equal(current.from,'2026-11-20T00:00:00.000Z');assert.equal(current.to,'2026-11-26T23:59:59.999Z');
 assert.equal(previous.fromDate,'2026-11-13');assert.equal(previous.toDate,'2026-11-19');
 assert.equal(Date.parse(current.from)-Date.parse(previous.to),1);
 assert.equal(Date.parse(current.to)-Date.parse(current.from)+1,7*86400000);
});
test('ST09 visual bars are bounded and zero remains zero',()=>{assert.equal(bar(0,0),0);assert.equal(bar(4,8),50);assert.equal(bar(8,4),100);});
test('ST09 keeps exact filter in drill-down and does not flag a missing count as zero',async()=>{
 const m=metric('Queue',3,link('Records','/hemo/requests',{status:'AwaitingDoctor'}),true);
 assert.equal(m.link.query.status,'AwaitingDoctor');
 const result=await Promise.all([loadSection('ok','OK','',[],async()=>[m]),loadSection('fail','Fail','',[],async()=>{throw Error('403');})]);
 assert.equal(result[0].metrics[0].value,3);assert.deepEqual(result[1].metrics,[]);assert.ok(result[1].error);
});
