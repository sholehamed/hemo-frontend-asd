import test from 'node:test';
import assert from 'node:assert/strict';
import { isNationalId,maskFor,flagsFor,csvCell,csvContent,percentage } from '../src/app/shared/admission-utils.ts';
import { jalaliToIso,isoToJalali,normalizeDigits } from '../src/app/shared/jalali-date.ts';
test('national id checksum accepts valid normalized input and rejects invalid/repeated digits',()=>{
 assert.equal(isNationalId('۱۲۳۴۵۶۷۸۹۱'),true);
 assert.equal(isNationalId('١٢٣٤٥٦٧٨٩١'),true);
 assert.equal(isNationalId('1234567890'),false);
 assert.equal(isNationalId('1111111111'),false);
 assert.equal(isNationalId('123'),false);
});
test('five-item checklist round trips all masks and full completion',()=>{
 for(let i=0;i<32;i++)assert.equal(maskFor(flagsFor(i)),i);
 assert.equal(maskFor([true,true,true,true,true]),31);
 assert.equal(maskFor([true,false,true,true,true]),29);
});
test('Jalali date and Persian digit normalization',()=>{
 assert.equal(jalaliToIso('۱۴۰۳/۰۱/۰۱'),'2024-03-20');
 assert.equal(isoToJalali('2024-03-20'),'۱۴۰۳/۰۱/۰۱');
 assert.equal(jalaliToIso('۱۴۰۳/۰۷/۳۱'),null);
 assert.equal(normalizeDigits('۱۲٣۴'),'1234');
});
test('CSV quotes values, preserves UTF-8 BOM and neutralizes formulas',()=>{
 assert.equal(csvCell('=HYPERLINK("x")'),'"\'=HYPERLINK(""x"")"');
 assert.equal(csvCell('سلام, دنیا'),'"سلام, دنیا"');
 assert.equal(csvContent([['عنوان'],[42]]),'\uFEFF"عنوان"\r\n"42"');
});
test('percentage avoids division by zero',()=>{assert.equal(percentage(0,0),0);assert.equal(percentage(3,4),75);});
