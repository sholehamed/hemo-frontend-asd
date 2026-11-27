import test from 'node:test';
import assert from 'node:assert/strict';
import {validRequestLines,canEditRequest,REQUEST_STATUS_LABEL} from '../src/app/features/blood-requests/blood-request-model.ts';
const line={productCode:'RBC',quantity:1,requestedBloodGroup:null,specialInstructions:null};
test('request items must use an allowed product and positive integer quantity',()=>{
 assert.equal(validRequestLines([line]),true);
 for(const quantity of [0,-1,1.5,NaN])assert.equal(validRequestLines([{...line,quantity}]),false);
 assert.equal(validRequestLines([]),false);
 assert.equal(validRequestLines([line,line]),false);
 assert.equal(validRequestLines([{...line,productCode:'Unknown'}]),false);
});
test('submitted requests cannot be edited and bank queue does not claim issuance',()=>{
 assert.equal(canEditRequest('Draft'),true);
 assert.equal(canEditRequest('Returned'),true);
 assert.equal(canEditRequest('AwaitingDoctor'),false);
 assert.equal(canEditRequest('AwaitingBank'),false);
 assert.equal(REQUEST_STATUS_LABEL.AwaitingBank,'در انتظار بانک خون');
});
