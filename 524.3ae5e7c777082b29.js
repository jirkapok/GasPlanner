(()=>{"use strict";var e,i={524:(e,t,n)=>{var _=n(172);addEventListener("message",({data:a})=>{const s=_.P.calculateConsumption(a);postMessage(s)})}},f={};function r(e){var t=f[e];if(void 0!==t)return t.exports;var n=f[e]={id:e,loaded:!1,exports:{}};return i[e].call(n.exports,n,n.exports,r),n.loaded=!0,n.exports}r.m=i,r.x=()=>{var e=r.O(void 0,[172],()=>r(524));return r.O(e)},e=[],r.O=(t,n,_,a)=>{if(!n){var c=1/0;for(s=0;s<e.length;s++){for(var[n,_,a]=e[s],p=!0,u=0;u<n.length;u++)(!1&a||c>=a)&&Object.keys(r.O).every(o=>r.O[o](n[u]))?n.splice(u--,1):(p=!1,a<c&&(c=a));if(p){e.splice(s--,1);var l=_();void 0!==l&&(t=l)}}return t}a=a||0;for(var s=e.length;s>0&&e[s-1][2]>a;s--)e[s]=e[s-1];e[s]=[n,_,a]},r.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return r.d(t,{a:t}),t},r.d=(e,t)=>{for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.f={},r.e=e=>Promise.all(Object.keys(r.f).reduce((t,n)=>(r.f[n](e,t),t),[])),r.u=e=>e+".81f6f8f94451a63e.js",r.miniCssF=e=>{},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r.nmd=e=>(e.paths=[],e.children||(e.children=[]),e),(()=>{var e;r.tt=()=>(void 0===e&&(e={createScriptURL:t=>t},typeof trustedTypes<"u"&&trustedTypes.createPolicy&&(e=trustedTypes.createPolicy("angular#bundler",e))),e)})(),r.tu=e=>r.tt().createScriptURL(e),r.p="",(()=>{var e={524:1};r.f.i=(a,s)=>{e[a]||importScripts(r.tu(r.p+r.u(a)))};var n=self.webpackChunkplanner=self.webpackChunkplanner||[],_=n.push.bind(n);n.push=a=>{var[s,c,p]=a;for(var u in c)r.o(c,u)&&(r.m[u]=c[u]);for(p&&p(r);s.length;)e[s.pop()]=1;_(a)}})(),(()=>{var e=r.x;r.x=()=>r.e(172).then(e)})(),r.x()})();