import test from 'node:test';
import assert from 'node:assert/strict';
import {validRequestLines,canEditRequest,REQUEST_STATUS_LABEL,blankClinical,submissionIssue} from '../src/app/features/blood-requests/blood-request-model.ts';
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

test('special forms require matching product and documented fields',()=>{
 const input={patientAdmissionGuid:'fixture',clientRequestId:'fixture',formType:'WashedRBC',priority:'Routine',items:[line],clinical:{...blankClinical(),clinicalIndication:'test'}};
 assert.match(submissionIssue(input),/مطابقت/);
 input.items=[{...line,productCode:'WashedRBC'}];
 assert.match(submissionIssue(input),/علت اختصاصی/);
 input.clinical.formDetails.specialReason='test';
 assert.equal(submissionIssue(input),null);
 input.formType='Autologous';input.items=[{...line,productCode:'Autologous'}];
 assert.match(submissionIssue(input),/رضایت/);
 input.clinical.formDetails={specialReason:'test',consentDocumented:true,surgery:'test',surgeryAt:'2026-12-01T00:00:00'};
 assert.equal(submissionIssue(input),null);
});
