import test from 'node:test';
import assert from 'node:assert/strict';
import {availableActions,statusLabel,needsThaw} from '../src/app/features/blood-bank/bank-model.ts';
const all={inspect:true,reserve:true,thaw:true,ready:true,hold:true,unreserve:true,discard:true};
const unit={status:'ReceivedHold',productCode:'RBC',expired:false,requestGuid:null,thawStartedAt:null,thawCompletedAt:null};
test('received unit needs supervisor inspection before reservation',()=>{assert.deepEqual(availableActions(unit,all),['Inspect','Hold','Discard']);assert.deepEqual(availableActions(unit,{...all,inspect:false,discard:false}),['Hold']);});
test('expiry blocks operational transitions and does not erase quarantine and discard',()=>{const u={...unit,status:'Reserved',expired:true,requestGuid:'request'};assert.deepEqual(availableActions(u,all),['Hold','Unreserve']);assert.match(statusLabel(u),/منقضی/);});
test('frozen product requires thaw completion before ready',()=>{const u={...unit,status:'Reserved',productCode:'FFP',requestGuid:'request'};assert.equal(needsThaw('FFP'),true);assert.ok(availableActions(u,all).includes('StartThaw'));assert.ok(!availableActions(u,all).includes('Ready'));assert.ok(availableActions({...u,thawStartedAt:'start',thawCompletedAt:'finish'},all).includes('Ready'));});
test('quarantined thawed or assigned unit is not released to inventory',()=>{assert.ok(!availableActions({...unit,status:'Quarantined',thawStartedAt:'start'},all).includes('Inspect'));assert.ok(!availableActions({...unit,status:'Quarantined',requestGuid:'request'},all).includes('Inspect'));assert.ok(availableActions({...unit,status:'Quarantined',requestGuid:'request'},all).includes('Unreserve'));});
