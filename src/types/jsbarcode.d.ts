// Narrow local declaration for the pinned MIT JsBarcode 3.11.6 SVG API.
// The installed package is CommonJS; company TS config enables esModuleInterop.
declare module 'jsbarcode' {
  export default function JsBarcode(element:SVGElement,value:string,options:{
    format:'CODE128';displayValue:boolean;width:number;height:number;margin:number;
  }):void;
}
