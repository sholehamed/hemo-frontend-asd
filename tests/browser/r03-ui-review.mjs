import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const base='http://127.0.0.1:18002';
const chunks=[];
for await(const chunk of process.stdin)chunks.push(chunk);
const input=Buffer.concat(chunks);
const sessions=JSON.parse(input.toString('utf8'));
const existing=spawnSync(process.execPath,[fileURLToPath(new URL('./r03-live-browser.mjs',import.meta.url))],{input,encoding:'utf8',timeout:120000});
if(existing.status!==0||!existing.stdout?.includes('R03_BROWSER_PASS')){
  console.error('R03 baseline browser failed');process.exit(1);
}
console.log(existing.stdout);
const browser=await chromium.launch({headless:true});
const contexts=[];
let scenario='startup';
async function open(name,width){
  const context=await browser.newContext({viewport:{width,height:900}});
  contexts.push(context);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await context.addInitScript(({token,role})=>{
    if(location.origin!=='http://127.0.0.1:18002')return;
    sessionStorage.setItem('Token',token);
    sessionStorage.setItem('UserRole',String(role));
    sessionStorage.setItem('userRole',String(role));
    sessionStorage.setItem('firstName','Synthetic');
    sessionStorage.setItem('lastName','Browser');
  },sessions[name]);
  const page=await context.newPage();page.setDefaultTimeout(20000);
  return page;
}
async function visible(page,selector){await page.locator(selector).first().waitFor({state:'visible'});}
async function scoped(page){
  await visible(page,'.router-outlet.hemo-page');
  assert.equal(await page.locator('.router-outlet.hemo-page').evaluate(e=>getComputedStyle(e).direction),'rtl');
  assert.equal(await page.locator('html').getAttribute('lang'),'fa');
}
async function fits(page){
  const bounds=await page.locator('.router-outlet.hemo-page').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,rect:e.getBoundingClientRect().width,viewport:innerWidth}));
  assert.ok(bounds.width>0&&bounds.rect<=bounds.viewport+1,'Page wider than viewport');
  assert.ok(bounds.scroll<=bounds.width+2,'Page content overflows horizontally');
}
async function shot(page,name){
  if(process.env.HEMO_UI_SCREENSHOTS)await page.screenshot({path:join(process.env.HEMO_UI_SCREENSHOTS,name+'.png'),fullPage:true,animations:'disabled'});
}
try{
  scenario='mobile-dashboard';
  const manager=await open('hemo.dashboard.manager',390);
  await manager.goto(base+'/hemo/dashboard');
  await scoped(manager);
  await visible(manager,'[data-module="quality"] .dashboard-metric strong');
  assert.equal(await manager.locator('.module-panel').count(),7);
  assert.equal(await manager.locator('.module-panel').first().evaluate(e=>getComputedStyle(e).borderTopStyle),'solid');
  await fits(manager);await shot(manager,'dashboard-mobile');
  console.log('PASS mobile RTL dashboard and seven sections');
  scenario='desktop-dashboard-dark';
  await manager.setViewportSize({width:1440,height:960});
  await manager.locator('.layout-config-menu > button').first().click();
  await manager.locator('html.app-dark').waitFor({state:'attached'});
  assert.equal(await manager.locator('.module-panel').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(32, 43, 56)');
  const header=manager.locator('.dashboard-header');
  assert.equal(await header.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(24, 45, 51)');
  assert.equal(await header.locator('h1').evaluate(e=>getComputedStyle(e).color),'rgb(231, 238, 247)');
  assert.equal(await manager.locator('.dashboard-metric:not(.attention)').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(24, 34, 47)');
  assert.equal(await manager.locator('.dashboard-metric:not(.attention) strong').first().evaluate(e=>getComputedStyle(e).color),'rgb(152, 232, 205)');
  await fits(manager);await shot(manager,'dashboard-desktop-dark');
  console.log('PASS desktop dark scoped theme');
  scenario='mobile-admission-form';
  const admission=await open('hemo.admission',390);
  await admission.goto(base+'/admission/new');
  await scoped(admission);
  await visible(admission,'[formcontrolname="hisNumber"]');
  assert.equal(await admission.locator('.form-grid').first().evaluate(e=>getComputedStyle(e).display),'grid');
  assert.equal(await admission.locator('.form-grid').first().evaluate(e=>getComputedStyle(e).gridTemplateColumns.trim().split(/\s+/).length),1);
  const submit=admission.getByRole('button',{name:'ثبت نهایی پرونده و پذیرش'});
  assert.ok(await submit.evaluate(e=>e.getBoundingClientRect().height>=44));
  await fits(admission);await shot(admission,'admission-mobile');
  console.log('PASS mobile single-column form and touch target');
  scenario='mobile-table';
  await admission.goto(base+'/admission/list');
  await scoped(admission);await visible(admission,'app-admission-table .table-wrap table tbody tr');
  assert.equal(await admission.locator('app-admission-table .table-wrap').evaluate(e=>getComputedStyle(e).overflowX),'auto');
  await fits(admission);await shot(admission,'admission-list-mobile');
  console.log('PASS table scroll contained within mobile layout');
  scenario='print-wristband';
  const detail=admission.locator('app-admission-table a[href^="/admission/detail/"]').first();
  await detail.click();
  scenario='print-wristband-barcode-ready';
  await visible(admission,'app-wristband .wristband svg rect');
  await admission.emulateMedia({media:'print'});
  scenario='print-wristband-hide-company-layout';
  assert.equal(await admission.locator('.layout-topbar').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  scenario='print-wristband-visible-target';
  assert.equal(await admission.locator('.wristband').evaluate(e=>getComputedStyle(e).visibility),'visible');
  scenario='print-wristband-visible-barcode';
  assert.equal(await admission.locator('app-wristband .wristband svg rect').first().evaluate(e=>getComputedStyle(e).visibility),'visible');
  scenario='print-wristband-hide-other-patient-data';
  assert.equal(await admission.locator('.hemo-page .heading').first().evaluate(e=>getComputedStyle(e).visibility),'hidden');
  await admission.emulateMedia({media:'screen'});
  console.log('PASS wristband print isolation');
  scenario='company-route-scope';
  await admission.goto(base+'/');
  await visible(admission,'.layout-main');
  assert.equal(await admission.locator('.router-outlet.hemo-page').count(),0);
  console.log('PASS company root not affected by HEMO CSS');
  console.log('R03_UI_PASS');
}catch{
  console.error('R03 UI failed at '+scenario);process.exitCode=1;
}finally{
  for(const context of contexts)await context.close();
  await browser.close();
}
