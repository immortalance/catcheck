!function(){"use strict";if(!mw.config.get("wgIsMainPage")){var e=mw.config.get("wgNamespaceNumber");if("view"===mw.config.get("wgAction")&&(0===e||14===e)){
var t=mw.config.get("wgPageName"),a=mw.util.wikiScript("api"),n="https://en.wikipedia.org/w/api.php",i="https://www.wikidata.org/w/api.php",r="immortalance-kategori-araci",c="immortalance-kategori-sonuclari"
;mw.loader.load(mw.util.getUrl("Kullanıcı:İmmortalance/js/CatCheck.css",{action:"raw",ctype:"text/css"}),"text/css")
;var l="[[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']]",o=null,s=null,d=new mw.Api,u={},p=null,h=null;$(function(){!function(){
var t=document.querySelector("#firstHeading");if(t&&!document.getElementById(r)){var a=g("button");a.id=r,a.type="button",0===e?(y(a,"CatCheck"),
a.title="Vikiveri ve İngilizce Vikipedi kategorilerine göre öner"):(y(a,"CatCheck"),
a.title="İngilizce kategori üyelerinin Türkçe karşılıklarını ve alt kategorilerini bul"),a.addEventListener("click",function(){0===e?async function(e){p=e
;var t,a=C(e);e.disabled=!0,y(e,"Kategoriler aranıyor...");try{var n=await(t=mw.config.get("wgWikibaseItemId"),t?L(i,{action:"wbgetentities",ids:t,
props:"sitelinks"},"Vikiveri").then(function(e){var a=e.entities[t];return a&&a.sitelinks&&a.sitelinks.enwiki?a.sitelinks.enwiki.title:null
}):Promise.reject(new Error("Bu maddenin Vikiveri bağlantısı bulunamadı.")));if(!n)return void showResults([],"Bu maddenin enwiki karşılığı bulunamadı.")
;var r=await I(),c=await B(n);if(!c.length)return void showResults([],"İngilizce maddede uygun kategori bulunamadı.");var l=await R(c),o=[]
;Object.keys(l).forEach(function(e){var t=l[e];-1===o.indexOf(t)&&o.push(t)});var s=await P(o),d={};r.forEach(function(e){d[O(e)]=!0});var u=[]
;Object.keys(l).forEach(function(e){var t=l[e],a=s[t];a&&(d[O(a)]||u.some(function(e){return e.tr&&O(e.tr)===O(a)})||u.push({tr:a,en:e,hasTurkish:!0}))}),
c.forEach(function(e){var t=l[e];t&&s[t]||u.some(function(t){return t.en===e})||u.push({tr:null,en:e,hasTurkish:!1})}),x(a,"categories","Kategori önerileri",u),
showResults(u,null,"category")}catch(e){console.error("[Kategori aracı]",e),showResults([],"Hata oluştu: "+(e.message||String(e)))}finally{
var h=document.querySelector(".catcheck-article-redundancy");h&&h.catcheckRun&&await h.catcheckRun(!0),w(a),p===e&&(p=null),e.disabled=!1,y(e,"CatCheck")}
}(a):(function(e){var t=K();q();var a=document.getElementById("catcheck-scope-choices");if(!a){(a=g("div")).id="catcheck-scope-choices";var n=g("button")
;n.type="button",
n.id="catcheck-full-search",y(n,"Tam arama"),n.title="Hazır madde sonuçlarını koruyarak alt ve üst kategori, taşıma ve yinelenen üyelik kontrollerini başlat",
n.addEventListener("click",function(){o||(h&&h.complete&&!h.full&&h.extend?h.extend():Z(e,!0))}),a.appendChild(n),t.body.prepend(a)}}(a),Z(a,!1))}),
t.appendChild(a)}}()})}}function g(e){return document.createElement(e)}function m(e){return document.createTextNode(e)}function k(e){
return"[\u005bKategori:"+e.replace(/_/g," ")+"]]"}function f(e){var t=e.replace(/_/g," ").trim().split(/\s+/).map(z).join("[ _]+")
;return new RegExp("^[ \\t]*\\[\\[[ \\t]*"+z("Kategori:")+"[ \\t]*"+t+"[ \\t]*(?:\\|[^\\]\\r\\n]*)?\\]\\][ \\t]*(?:\\r?\\n|$)","gim")}function v(e){
return O(e.replace(/^Kategori:/i,""))===O("Commons kategori bağlantısı Vikiveri'de tanımlı olan sayfalar")}function y(e,t){
e.isConnected&&(t.indexOf("...")>=0||0===t.indexOf("✓"))&&ae(t),
e.dataset.ccAction||(e.dataset.ccAction=/durdur/i.test(t)?"stop":/olmayan|dil bağlant|üye sayı|hesapla/i.test(t)?"discover":/kontrol|mevcut olanları çıkar/i.test(t)?"check":/taşı/i.test(t)?"move":/kaldır|sil|sıfırla/i.test(t)?"remove":/ekle/i.test(t)?"add":"neutral"),
"stop"===e.dataset.ccAction?e.dataset.ccAction=/devam et/i.test(t)?"resume":"stop":"resume"===e.dataset.ccAction&&/durdur/i.test(t)&&(e.dataset.ccAction="stop"),
e.classList.toggle("catcheck-busy",t.indexOf("...")>=0),e.classList.toggle("catcheck-action-done",0===t.indexOf("✓")),e.textContent=t,
e.removeAttribute("aria-label");var a=t.indexOf("...");if(!(a<0)){e.setAttribute("aria-label",t),e.textContent="",e.appendChild(m(t.substring(0,a)))
;var n=g("span");n.className="catcheck-dots-holder",n.setAttribute("aria-hidden","true");for(var i=0;i<3;i++){var r=g("span")
;r.className="catcheck-dot catcheck-dot-"+i,r.textContent=".",n.appendChild(r)}e.appendChild(n),e.appendChild(m(t.substring(a+3)))}}function b(e){
return e&&e.paused?new Promise(function(t){e.waiters.push(t)}):Promise.resolve()}function C(t,a,n){
(p=document.getElementById("catcheck-scope-choices"))&&K().body.prepend(p);var i=document.getElementById(c);i&&!a&&i.remove()
;var r=document.getElementById("catcheck-scan-controls");r&&r.remove();var l=a||{full:!!n,paused:!1,waiters:[],button:t,sections:{},rendered:{},statuses:{}}
;l.complete=!1,ve(!0);var s=g("div");s.id="catcheck-scan-controls";var d=g("button");d.type="button",y(d,"Taramayı durdur"),s.appendChild(d);var u=g("span")
;u.className="catcheck-scan-status",u.textContent="Sonuçlar hazır oldukça gösterilecek.",s.appendChild(u),d.addEventListener("click",function(){
l.paused=!l.paused,Object.keys(l.statuses).forEach(function(e){
"Kontrol ediliyor"!==l.statuses[e]&&"Duraklatıldı"!==l.statuses[e]||E(l,e,l.paused?"Duraklatıldı":"Kontrol ediliyor")}),
y(d,l.paused?"Kaldığı yerden devam et":"Taramayı durdur"),
u.textContent=l.paused?"Tarama duraklatıldı. Başlamış istekler tamamlanabilir; yeni sorgu gönderilmez.":"Tarama devam ediyor.",ae(u.textContent),
l.paused||l.waiters.splice(0).forEach(function(e){e()})});var p,h=K();return h.desktop.matches&&!h.dialog.open&&h.dialog.showModal(),
(p=document.getElementById("catcheck-scope-choices"))?p.after(s):h.body.prepend(s),l.controls=s,o=l,
14===e&&(showCategoryPageResults(a?l.sections.articles.items:[],[],[],[],null,[],[],[],l.missingArticles||[],void 0,l),a||E(l,"articles","Kontrol ediliyor")),l}
function w(t){ae(t.complete?"✓ Tarama tamamlandı":"Tarama sona erdi"),ve(!1),q(),14!==e||t.complete||Object.keys(t.statuses).forEach(function(e){
t.rendered[e]||E(t,e,"Tamamlanamadı")}),t.paused=!1,t.waiters.splice(0).forEach(function(e){e()}),t.controls.remove(),o===t&&(o=null)}function E(e,t,a){
e.statuses[t]=a;var n=document.getElementById(c);if(n){var i=n.querySelector('[data-scan-key="'+t+'"]');if(i){var r=i.querySelector(".catcheck-section-status")
;r||((r=g("small")).className="catcheck-section-status",i.querySelector("summary").appendChild(r)),r.textContent=a,
r.classList.toggle("catcheck-section-done","Tamamlandı"===a)}}}function x(t,a,n,i){t.sections[a]={title:n,items:i},t.statuses[a]="Tamamlandı",
14===e&&showCategoryPageResults(t.sections.articles?t.sections.articles.items:[],t.sections.categories?t.sections.categories.items:[],[],[],null,t.sections.parents?t.sections.parents.items:[],[],[],t.missingArticles||[],void 0,t)
}function q(){s&&s.desktop.matches&&!s.dialog.open&&s.dialog.showModal()}function K(){if(s)return s;var e=g("div"),t=document.querySelector("#firstHeading")
;t.parentNode.insertBefore(e,t.nextSibling);var a=g("dialog");a.className="catcheck-dialog",a.setAttribute("aria-label","CatCheck kategori kontrol sonuçları")
;var n=g("button");n.type="button",n.className="catcheck-close",n.textContent="Pencereyi kapat",n.addEventListener("click",function(){a.close()});var i=g("div")
;i.className="catcheck-window-header";var r=g("span");r.id="catcheck-window-progress",r.setAttribute("role","status"),r.setAttribute("aria-live","polite"),
r.textContent="Tarama kapsamını seçin.",i.appendChild(r),i.appendChild(n),a.appendChild(i);var c=g("div"),l=g("button");l.type="button",
l.textContent="CatCheck sonuçlarını aç",l.hidden=!0,e.appendChild(l),document.body.appendChild(a);var o=window.matchMedia("(min-width: 721px)");function d(){
o.matches?(a.appendChild(c),l.hidden=!1,a.open||a.showModal()):(a.open&&a.close(),e.appendChild(c),l.hidden=!0)}return l.addEventListener("click",function(){
a.open||a.showModal()}),o.addEventListener("change",d),s={body:c,dialog:a,desktop:o},d(),s}function L(e,t,n,i){var r=i?null:o;return b(r).then(function(){
return mw.loader.using("mediawiki.ForeignApi").then(function(){var i=e===a?d:u[e]||(u[e]=new mw.ForeignApi(e,{anonymous:!0}));return function e(a){
return b(r).then(function(){return new Promise(function(r,c){i.get(t).then(r,function(t,i){if(!("http"===t&&a>0)||i&&i.xhr&&i.xhr.status){
var l=i&&i.error&&i.error.info||i&&i.textStatus||t||"Bilinmeyen hata";c(new Error(n+" API isteği başarısız: "+l))}else setTimeout(function(){e(a-1).then(r,c)
},1e3)})})})}(2)})}).then(function(e){return b(r).then(function(){return e})})}function S(e){return d.postWithToken("csrf",e)}function T(e){
e.classList.remove("catcheck-action-done"),e.title=""}function j(e){q(),e.disabled=!1,y(e,"✓ Tamamlandı"),e.removeAttribute("title")}function A(e,t,a){
var n=e.closest("details.catcheck-group")||document.querySelector("#"+c+" details.catcheck-group");if(n){
var i=n.querySelector("summary"),r=i.querySelector(".catcheck-progress");r||((r=g("span")).className="catcheck-progress",i.appendChild(r)),
r.textContent=" ("+t+"/"+a+")",r.classList.toggle("catcheck-progress-done",a>0&&t>=a),a>0&&t>=a&&(r.textContent+=" ✓")}}function N(e,t){if(!t.length)return e
;var a=e.replace(/\s+$/,"");return(a?a+"\n":"")+t.join("\n")+"\n"}function z(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function O(e){
return e.replace(/_/g," ").trim().toLocaleLowerCase("tr-TR")}function _(e,t,a){var n=a||p,i={},r=0;function c(){
n&&y(n,e+"... ("+(null==t?r.toLocaleString("tr-TR")+" alındı":Math.min(r,t).toLocaleString("tr-TR")+"/"+t.toLocaleString("tr-TR"))+")")}return c(),{
request:function(e,t,a){return L(e,t,a).then(function(e){if(t.titles||t.ids)(t.titles||t.ids).split("|").forEach(function(e){i[e]||(i[e]=!0,r++)
});else if(e.query&&e.query.categorymembers)r+=e.query.categorymembers.length;else if(e.query&&e.query.pages){var a=Object.keys(e.query.pages).map(function(t){
return e.query.pages[t]});r+="categories"===t.prop?a.reduce(function(e,t){return e+(t.categories||[]).length},0):a.length}return c(),e})}}}function I(){
return _("Türkçe kategoriler alınıyor",null).request(a,{action:"query",prop:"categories",titles:t,cllimit:"max"},"Türkçe Vikipedi").then(function(e){var t=[]
;return e.query&&e.query.pages?(Object.keys(e.query.pages).forEach(function(a){var n=e.query.pages[a];n.categories&&n.categories.forEach(function(e){
t.push(e.title.replace(new RegExp("^"+z("Kategori:"),"i"),"").trim())})}),t):t})}function B(e){return _("İngilizce kategoriler alınıyor",null).request(n,{
action:"query",prop:"categories",titles:e,cllimit:"max",clshow:"!hidden"},"İngilizce Vikipedi").then(function(e){var t=[]
;return e.query&&e.query.pages?(Object.keys(e.query.pages).forEach(function(a){var n=e.query.pages[a];n.categories&&n.categories.forEach(function(e){
""!==e.hidden&&t.push(e.title)})}),t):t})}function R(e){
for(var t=_("Kategoriler Vikiveri ile eşleştiriliyor",e.length),a={},i=[],r=0;r<e.length;r+=50)i.push(e.slice(r,r+50));return i.reduce(function(e,i){
return e.then(function(){return t.request(n,{action:"query",prop:"pageprops",titles:i.join("|"),ppprop:"wikibase_item"},"İngilizce kategori").then(function(e){
e.query&&e.query.pages&&Object.keys(e.query.pages).forEach(function(t){var n=e.query.pages[t]
;n.pageprops&&n.pageprops.wikibase_item&&(a[n.title]=n.pageprops.wikibase_item)})})})},Promise.resolve()).then(function(){return a})}function P(e){
for(var t=_("Türkçe kategori karşılıkları eşleştiriliyor",e.length),a={},n=[],r=0;r<e.length;r+=50)n.push(e.slice(r,r+50));return n.reduce(function(e,n){
return e.then(function(){return t.request(i,{action:"wbgetentities",ids:n.join("|"),props:"sitelinks"},"Vikiveri kategorileri").then(function(e){
e.entities&&Object.keys(e.entities).forEach(function(t){var n=e.entities[t];if(n.sitelinks&&n.sitelinks.trwiki){var i=n.sitelinks.trwiki.title
;0===i.indexOf("Kategori:")&&(a[t]=i.substring(9).trim())}})})})},Promise.resolve()).then(function(){return a})}async function M(e){
var t=_("İngilizce maddeler alınıyor",null),a=[],i=null;do{var r={action:"query",list:"categorymembers",cmtitle:e,cmnamespace:"0",cmlimit:"500"}
;i&&(r.cmcontinue=i);var c=await t.request(n,r,"İngilizce kategori");c.query&&c.query.categorymembers&&c.query.categorymembers.forEach(function(e){
a.push(e.title)}),i=c.continue&&c.continue.cmcontinue}while(i);return a}async function V(e){var t=_("İngilizce alt kategoriler alınıyor",null),a=[],i=null;do{
var r={action:"query",list:"categorymembers",cmtitle:e,cmnamespace:"14",cmlimit:"500"};i&&(r.cmcontinue=i)
;var c=await t.request(n,r,"İngilizce alt kategoriler");c.query&&c.query.categorymembers&&c.query.categorymembers.forEach(function(e){a.push(e.title)}),
i=c.continue&&c.continue.cmcontinue}while(i);return a}function U(){return"catcheck-member-count-progress-v1:"+t}function D(){try{var e=localStorage.getItem(U())
;if(!e)return{};var t=JSON.parse(e);return t&&"object"==typeof t?t:{}}catch(e){return console.warn("[CatCheck] Kayıtlı üye sayımı okunamadı:",e),{}}}
function H(e){try{localStorage.setItem(U(),JSON.stringify(e))}catch(e){console.warn("[CatCheck] Üye sayımı ilerlemesi kaydedilemedi:",e)}}async function Y(e){
var t=_("Türkçe alt kategoriler alınıyor",null),n={lookup:{},titles:[]},i=null;do{var r={action:"query",list:"categorymembers",cmtitle:e,cmnamespace:"14",
cmlimit:"500"};i&&(r.cmcontinue=i);var c=await t.request(a,r,"Mevcut Türkçe alt kategoriler")
;c.query&&c.query.categorymembers&&c.query.categorymembers.forEach(function(e){var t=e.title.replace(new RegExp("^"+z("Kategori:"),"i"),"").trim()
;n.lookup[O(t)]=!0,n.titles.push(e.title)}),i=c.continue&&c.continue.cmcontinue}while(i);return n}async function W(e){
var t=_("Türkçe kategori maddeleri alınıyor",null),n=[],i=null;do{var r={action:"query",list:"categorymembers",cmtitle:e,cmnamespace:"0",cmlimit:"500"}
;i&&(r.cmcontinue=i);var c=await t.request(a,r,"Mevcut kategori maddeleri");c.query&&c.query.categorymembers&&c.query.categorymembers.forEach(function(e){
n.push(e.title)}),i=c.continue&&c.continue.cmcontinue}while(i);return n}async function G(e,t,n){
var i=_("Türkçe alt kategori üyelikleri kontrol ediliyor",e.length,n);if(!e.length||!t.length)return[];var r={},c={};t.forEach(function(e){
r[O(e.replace(/^Kategori:/i,""))]=e.replace(/^Kategori:/i,"")});for(var l=0;l<e.length;l+=50){var o=e.slice(l,l+50),s=null;do{var d={action:"query",
prop:"categories",titles:o.join("|"),cllimit:"max",redirects:"1",formatversion:"2"};s&&(d.clcontinue=s);var u=await i.request(a,d,"Madde kategorileri")
;u.query&&u.query.pages&&u.query.pages.forEach(function(e){e.categories&&e.categories.forEach(function(t){var a=t.title.replace(/^Kategori:/i,""),n=r[O(a)]
;if(n){var i=O(e.title);c[i]||(c[i]={tr:e.title,subcategories:[]}),-1===c[i].subcategories.indexOf(n)&&c[i].subcategories.push(n)}})}),
s=u.continue&&u.continue.clcontinue}while(s)}return Object.keys(c).map(function(e){return c[e]})}async function F(e,t,a){var i={},r=new Set;function c(t){
return async function(e){for(var t={request:L},a={},i=0;i<e.length;i+=50){var r=e.slice(i,i+50),c=await t.request(n,{action:"query",prop:"pageprops|info",
titles:r.join("|"),ppprop:"wikibase_item",formatversion:"2"},"İngilizce maddeler");c.query&&c.query.pages&&c.query.pages.forEach(function(e){
!0!==e.redirect&&e.pageprops&&e.pageprops.wikibase_item&&(a[e.title]=e.pageprops.wikibase_item)})}return a}(e.slice(t,t+50)).then(function(e){return{value:e}
},function(e){return{error:e}})}for(var l=e.length?c(0):null,o=0;o<e.length;o+=50){var s=await l;if(s.error)throw s.error;l=o+50<e.length?c(o+50):null
;var d=Object.values(s.value).filter(function(e){return!r.has(e)&&(r.add(e),!0)});Object.assign(i,await J(d,t,!0)),
y(a,"Vikiveri ve Türkçe karşılıklar eşleştiriliyor... "+Math.min(o+50,e.length)+"/"+e.length)}return i}async function J(e,t,a){for(var n=a?{request:L
}:_("Türkçe madde karşılıkları eşleştiriliyor",e.length),r={},c=0;c<e.length;c+=50){var l=e.slice(c,c+50),o=await n.request(i,{action:"wbgetentities",
ids:l.join("|"),props:"sitelinks"},"Vikiveri maddeleri");o.entities&&Object.keys(o.entities).forEach(function(e){var a,n,i=o.entities[e]
;t&&i&&i.sitelinks&&!i.sitelinks.trwiki&&i.sitelinks.enwiki&&t.push({qid:e,en:i.sitelinks.enwiki.title,languageCount:(a=i.sitelinks,
n=/^(commons|species|meta|wikidata|mediawiki|incubator|outreach|foundation|sources|strategy|test|test2|nostalgia|login|office|advisory|quality|usability|donate|exec|collab)wiki$/,
Object.keys(a||{}).filter(function(e){return/wiki$/.test(e)&&!n.test(e)}).length)}),i.sitelinks&&i.sitelinks.trwiki&&(r[e]=i.sitelinks.trwiki.title)})}return r}
async function Q(e){for(var t=_("Anlam ayrımı maddeleri kontrol ediliyor",e.length),n={},i=0;i<e.length;i+=50){var r=e.slice(i,i+50),c=await t.request(a,{
action:"query",prop:"pageprops",titles:r.join("|"),ppprop:"disambiguation"},"Anlam ayrımı kontrolü")
;c.query&&c.query.pages&&Object.keys(c.query.pages).forEach(function(e){var t=c.query.pages[e];t.pageprops&&void 0!==t.pageprops.disambiguation&&(n[t.title]=!0)
})}return n}async function X(e){for(var t=_("İngilizce karşılıklar eşleştiriliyor",e.length),a={},n=0;n<e.length;n+=50){
var r=e.slice(n,n+50),c=await t.request(i,{action:"wbgetentities",sites:"trwiki",titles:r.join("|"),props:"sitelinks",sitefilter:"trwiki|enwiki"
},"Vikiveri madde eşleştirmesi");c.entities&&Object.keys(c.entities).forEach(function(e){var t=c.entities[e]
;t.sitelinks&&t.sitelinks.trwiki&&t.sitelinks.enwiki&&(a[O(t.sitelinks.trwiki.title)]=t.sitelinks.enwiki.title)})}return a}async function Z(e,r){p=e
;var l,o=C(e,null,r);h=o,e.disabled=!0,y(e,"İngilizce kategori aranıyor...");try{var s=await(l=mw.config.get("wgWikibaseItemId"),l?Promise.resolve(l):L(a,{
action:"query",prop:"pageprops",titles:t,ppprop:"wikibase_item"},"Türkçe kategori").then(function(e){
if(!e.query||!e.query.pages)throw new Error("Kategori bilgisi alınamadı.");var t=Object.keys(e.query.pages);if(!t.length)throw new Error("Kategori bulunamadı.")
;var a=e.query.pages[t[0]];if(!a.pageprops||!a.pageprops.wikibase_item)throw new Error("Bu kategorinin Vikiveri bağlantısı yok.")
;return a.pageprops.wikibase_item})),d=await function(e){return L(i,{action:"wbgetentities",ids:e,props:"sitelinks"},"Vikiveri").then(function(t){
var a=t.entities[e];if(!a||!a.sitelinks||!a.sitelinks.enwiki)throw new Error("İngilizce kategori karşılığı bulunamadı.");return a.sitelinks.enwiki.title})}(s)
;y(e,"İngilizce maddeler ve kategoriler alınıyor...")
;var u=await Promise.all([M(d),o.full?V(d):Promise.resolve([]),o.full?B(d):Promise.resolve([])]),m=u[0],k=u[1],f=u[2]
;if(o.full&&!m.length&&!k.length&&!f.length)return void showCategoryPageResults([],[],[],[],"Eklenecek madde veya alt kategori bulunamadı. Kategori yönetimi için tam aramayı kullanın.")
;y(e,"Maddeler Vikiveri ile eşleştiriliyor...");var b=[],q=await F(m,b,e),S=Object.keys(q).map(function(e){return q[e]})
;y(e,"Anlam ayrımı maddeleri filtreleniyor...");var T=await Q(S);S=S.filter(function(e){return!T[e]});var j=t.replace(/^Kategori:/i,"").trim()
;y(e,"Mevcut kategori maddeleri kontrol ediliyor...");var A=await W(t),N={};A.forEach(function(e){N[O(e)]=!0});var z=O(j),U=[];if(S.forEach(function(e){
N[O(e)]||O(e)!==z&&U.push({tr:e})}),o.missingArticles=b,x(o,"articles","Kategoriye eklenebilecek maddeler",U),o.extend=async function(){
var a=document.getElementById(c);a&&a.classList.remove("catcheck-empty-results");var n=document.getElementById("catcheck-scope-choices");n&&K().body.prepend(n),
o.full=!0,Object.keys(o.statuses).forEach(function(e){o.rendered[e]||(o.statuses[e]="Sıra bekliyor")}),C(e,o),e.disabled=!0,p=e;try{
y(e,"Kapsam genişletiliyor...");var i=await Promise.all([V(d),B(d),W(t)]);k=i[0],f=i[1],A=i[2],N={},A.forEach(function(e){N[O(e)]=!0}),await J()}catch(e){
var r=g("p");r.textContent="Ek kontroller tamamlanamadı: "+(e.message||String(e)),document.getElementById(c).appendChild(r)}finally{w(o),p=null,e.disabled=!1,
y(e,"CatCheck")}},!o.full){o.complete=!0;var D=document.querySelector("#"+c+" .catcheck-ready-notice")
;if(D.textContent=U.length?"Madde tarama tamamlandı. Diğer kontrolleri üstteki Tam arama düğmesiyle başlatabilirsiniz.":"Eklenecek madde veya alt kategori bulunamadı. Kategori yönetimi için tam aramayı kullanın.",
!U.length){document.getElementById(c).classList.add("catcheck-empty-results");var $=document.getElementById("catcheck-scope-choices");$&&D.after($)}return}
async function J(){E(o,"categories","Kontrol ediliyor"),y(e,"Alt kategoriler kontrol ediliyor...");var i=await R(k),r=[];Object.keys(i).forEach(function(e){
var t=i[e];-1===r.indexOf(t)&&r.push(t)});var c=await P(r),l=await Y(t),s=l.lookup,d=[];Object.keys(i).forEach(function(e){var t=i[e],a=c[t];if(a){
if(O(a)===z)return;if(s[O(a)])return;if(d.some(function(e){return e.tr&&O(e.tr)===O(a)}))return;d.push({tr:a,en:e,hasTurkish:!0})}else{if(d.some(function(t){
return t.en===e}))return;d.push({tr:null,en:e,hasTurkish:!1})}}),x(o,"categories","Alt kategoriler",d),E(o,"parents","Kontrol ediliyor"),
y(e,"Üst kategoriler kontrol ediliyor...");var u=await R(f),p=await P(Object.keys(u).map(function(e){return u[e]})),h=(await I()).filter(function(e){return!v(e)
}),g={};h.forEach(function(e){g[O(e)]=!0});var m={};f.forEach(function(e){m[O(e)]=!0});var C=[];Object.keys(u).forEach(function(e){var t=p[u[e]]
;!t||v(t)||O(t)===O(j)||g[O(t)]||C.some(function(e){return O(e.tr)===O(t)})||C.push({tr:t,action:"add",en:e})}),f.forEach(function(e){var t=u[e]
;t&&p[t]||C.push({tr:null,en:e,hasTurkish:!1,action:"missing"})});var w=await X(h.map(function(e){return"Kategori:"+e}));h.forEach(function(e){
var t=w[O("Kategori:"+e)];t&&!m[O(t)]&&C.push({tr:e,action:"remove",en:t})}),x(o,"parents","Üst kategori önerileri",C);var q={}
;Object.keys(i).forEach(function(e){var t=i[e];c[t]&&(q[O(e)]=c[t])});var K=l.titles.length>0,L=[];if(E(o,"moves","Kontrol ediliyor"),Object.keys(q).length){
y(e,"İngilizce alt kategori yerleşimleri kontrol ediliyor...");var S=await X(A);L=await async function(e,t,a){
var i=_("Maddelerin alt kategori yerleşimleri kontrol ediliyor",e.length),r={},c=[];e.forEach(function(e){var a=t[O(e)];a&&(r[O(a)]=e,c.push(a))})
;var l={},o={},s={};function d(e,t){var a=O(e);l[a]||(l[a]={tr:e,subcategories:[]}),-1===l[a].subcategories.indexOf(t)&&l[a].subcategories.push(t)}
for(var u=0;u<c.length;u+=50){var p=c.slice(u,u+50),h=null;do{var g={action:"query",prop:"categories",titles:p.join("|"),cllimit:"max",redirects:"1",
formatversion:"2"};h&&(g.clcontinue=h.clcontinue,g.continue=h.continue);var m=await i.request(n,g,"İngilizce alt kategori üyelikleri")
;m.query&&m.query.pages&&m.query.pages.forEach(function(e){var t=r[O(e.title)];t&&e.categories&&e.categories.forEach(function(e){var n=a[O(e.title)]
;if(n)d(t,n);else{var i=O(e.title);s[i]=e.title,o[i]||(o[i]=[]),-1===o[i].indexOf(t)&&o[i].push(t)}})}),h=m.continue||null}while(h)}
for(var k=Object.keys(s).map(function(e){return s[e]}),f=0;f<k.length;f+=50){var v=k.slice(f,f+50),y=null;do{var b={action:"query",prop:"categories",
titles:v.join("|"),cllimit:"max",formatversion:"2"};y&&(b.clcontinue=y.clcontinue,b.continue=y.continue)
;var C=await i.request(n,b,"Alt kategorilerin üst kategorileri");C.query&&C.query.pages&&C.query.pages.forEach(function(e){var t=o[O(e.title)]||[]
;(e.categories||[]).forEach(function(e){var n=a[O(e.title)];n&&t.forEach(function(e){d(e,n)})})}),y=C.continue||null}while(y)}
return Object.keys(l).map(function(e){return l[e]})}(A,S,q)}E(o,"moves","Sonuçlar hazırlanıyor"),E(o,"submoves","Kontrol ediliyor"),
K&&y(e,"Alt kategorilerin taşınabileceği kategoriler kontrol ediliyor...");var T=K?await async function(e){
var t=_("Alt kategori yerleşimleri kontrol ediliyor",e.length),i=await X(e),r={},c={},l=[];e.forEach(function(e){c[O(e)]=!0;var t=i[O(e)]
;t&&(r[O(t)]=e.replace(/^Kategori:/i,""),l.push(t))});var o={},s={};function d(e,t){if(t&&O(t)!==O(e)){var a=O(e);o[a]||(o[a]={tr:e,subcategories:[]}),
-1===o[a].subcategories.indexOf(t)&&o[a].subcategories.push(t)}}for(var u=0;u<l.length;u+=50){var p=l.slice(u,u+50),h=null;do{var g={action:"query",
prop:"categories",titles:p.join("|"),cllimit:"max",formatversion:"2"};h&&(g.clcontinue=h.clcontinue,g.continue=h.continue)
;var m=await t.request(n,g,"Alt kategorilerin İngilizce üst kategorileri");m.query&&m.query.pages&&m.query.pages.forEach(function(e){var t=r[O(e.title)]
;t&&(e.categories||[]).forEach(function(e){var a=r[O(e.title)];if(a)d(t,a);else{var n=O(e.title);s[n]||(s[n]={title:e.title,children:[]}),
-1===s[n].children.indexOf(t)&&s[n].children.push(t)}})}),h=m.continue||null}while(h)}var k=Object.keys(s).map(function(e){return s[e].title
}),f=await R(k),v=await P(Array.from(new Set(Object.keys(f).map(function(e){return f[e]})))),y={};Object.keys(f).forEach(function(e){var t=v[f[e]]
;t&&!r[O(e)]&&(y[O("Kategori:"+t)]={title:"Kategori:"+t,children:s[O(e)].children})});for(var b=Object.keys(y).map(function(e){return y[e].title
}),C=0;C<b.length;C+=50){var w=b.slice(C,C+50),E=null;do{var x={action:"query",prop:"categories",titles:w.join("|"),cllimit:"max",formatversion:"2"}
;E&&(x.clcontinue=E.clcontinue,x.continue=E.continue);var q=await t.request(a,x,"İkinci seviye alt kategoriler")
;q.query&&q.query.pages&&q.query.pages.forEach(function(e){var t=y[O(e.title)];if(t){
var a=e.title.replace(/^Kategori:/i,""),n=(e.categories||[]).map(function(e){return O(e.title)});t.children.forEach(function(e){n.some(function(t){
return!!c[t]&&t!==O("Kategori:"+e)})&&d(e,a)})}}),E=q.continue||null}while(E)}return Object.keys(o).map(function(e){return o[e]})}(l.titles):[]
;E(o,"submoves","Sonuçlar hazırlanıyor"),E(o,"redundantSubs","Kontrol ediliyor"),K&&y(e,"Alt kategorilerin yinelenen üyelikleri kontrol ediliyor...")
;var B=(K?await G(l.titles,l.titles):[]).map(function(e){return{tr:e.tr.replace(/^Kategori:/i,""),subcategories:e.subcategories.filter(function(t){
return O(t)!==O(e.tr.replace(/^Kategori:/i,""))})}}).filter(function(e){return e.subcategories.length>0}),M={};B.forEach(function(e){M[O(e.tr)]=!0}),
T=T.filter(function(e){return!M[O(e.tr)]}),E(o,"redundantSubs","Sonuçlar hazırlanıyor"),E(o,"redundantArticles","Kontrol ediliyor"),
K&&y(e,"Alt kategori üyelikleri kontrol ediliyor...");var V=A,D=l.titles.slice(),$={};D.forEach(function(e){$[O(e)]=!0}),Object.keys(c).forEach(function(e){
var t="Kategori:"+c[e];$[O(t)]||(D.push(t),$[O(t)]=!0)});var H=K?await G(V,l.titles):[],W={},F={};H.forEach(function(e){W[O(e.tr)]=!0,F[O(e.tr)]=e.subcategories
});var J=H.filter(function(e){return N[O(e.tr)]});L=L.map(function(e){var t=F[O(e.tr)]||[];return{tr:e.tr,subcategories:e.subcategories.filter(function(e){
return-1===t.indexOf(e)})}}).filter(function(e){return e.subcategories.length>0});var Q={};L.forEach(function(e){Q[O(e.tr)]=!0}),J=J.filter(function(e){
return!Q[O(e.tr)]}),showCategoryPageResults(U,d,L,J,null,C,T,B,b,D,o,!0)}await J()}catch(Z){if(console.error("[Kategori aracı]",Z),
Object.keys(o.sections).length){var H=g("p");H.textContent="Tarama tamamlanamadı; hazır sonuçlar korunuyor. "+(Z.message||String(Z)),
document.getElementById(c).appendChild(H)}else showCategoryPageResults([],[],[],[],"Hata oluştu: "+(Z.message||String(Z)))}finally{w(o),p===e&&(p=null),
e.disabled=!1,y(e,"CatCheck")}}function ee(e){e.appendChild(m(" — v4.2 · "));var t=g("a");t.href=mw.util.getUrl("Kullanıcı mesaj:İmmortalance/js/CatCheck.js"),
t.textContent="Geri bildirim",t.target="_blank",t.rel="noopener",t.addEventListener("click",function(e){e.stopPropagation()}),e.appendChild(t)}
function showCategoryPageResults(e,a,n,i,r,o,s,d,u,p,h,b){a=a.map(function(e){return Object.assign({},e)}),o=(o||[]).map(function(e){return Object.assign({},e)
});var C=document.getElementById(c);C&&!h&&C.remove();var w=g("div");w.id=c,w.classList.add("ccs1","ccs2","ccs3","ccs4","ccs5");var x=g("strong")
;if(x.textContent="Kategori kontrol sonuçları",ee(x),w.appendChild(x),r){var q=g("div");return q.classList.add("ccs6","ccs7"),q.textContent=r,w.appendChild(q),
te(w),void ge(w)}var K=g("div");K.classList.add("ccs8","ccs9","ccs10","ccs11");var L=g("label");L.classList.add("ccs12","ccs13");var _=g("input")
;_.type="checkbox",L.appendChild(_),L.appendChild(m(" Tüm maddeleri ve alt kategorileri seç")),K.appendChild(L);var I=g("button");I.type="button",
y(I,"Seçilenlerin hepsini ekle"),I.classList.add("ccs14","ccs13"),K.appendChild(I),w.appendChild(K);var B=[],R=[],P=null,M=null,V=g("div")
;V.classList.add("ccs15","ccs16","ccs17"),V.textContent="Kategoriye eklenebilecek maddeler ("+e.length+")";var U=V.firstChild;w.appendChild(V),u=u||[]
;var $=g("div");$.classList.add("ccs18");var H=g("button");H.type="button",y(H,"Türkçede olmayan, en çok dil bağlantılı 5 maddeyi göster"),$.appendChild(H),
w.appendChild($);var W=g("div");if(W.classList.add("ccs19"),w.appendChild(W),H.addEventListener("click",function(){W.textContent=""
;var e=u.slice().sort(function(e,t){return t.languageCount-e.languageCount||e.en.localeCompare(t.en,"en")}).slice(0,5),t=g("div")
;if(t.textContent="İngilizce kategoride Türkçe dil bağlantısı olmayan "+u.length.toLocaleString("tr-TR")+" madde arasından en çok dil bağlantısına sahip "+e.length+" madde:",
W.appendChild(t),e.length){var a=g("ol");e.forEach(function(e){var t=g("li"),n=g("a")
;n.href="https://en.wikipedia.org/wiki/"+encodeURIComponent(e.en.replace(/ /g,"_")),n.textContent=e.en,n.target="_blank",n.rel="noopener",t.appendChild(n),
t.appendChild(m(" ("+e.languageCount.toLocaleString("tr-TR")+" dil)")),a.appendChild(t)}),W.appendChild(a)
}else t.textContent="İngilizce kategoride Türkçe dil bağlantısı olmayan madde bulunamadı.";j(H),y(H,"✓ Türkçede olmayan ilk "+e.length+" madde gösterildi")}),
e.length){var F=g("div");F.classList.add("ccs20"),(P=g("input")).type="checkbox",F.appendChild(P),F.appendChild(m(" Tümünü seç "));var J=g("button")
;J.type="button",y(J,"Seçilen maddeleri kategoriye ekle"),J.classList.add("ccs14","ccs13"),F.appendChild(J);var Q=g("button");Q.type="button",
Q.classList.add("ccs21"),y(Q,"Alt kategorilerde mevcut olanları çıkar"),F.appendChild(Q);var X=g("span");X.classList.add("ccs21"),F.appendChild(X),
Q.addEventListener("click",async function(){Q.disabled=!0;var a=J.disabled,n=I.disabled;J.disabled=!0,I.disabled=!0,T(Q),
y(Q,"Alt kategori üyelikleri kontrol ediliyor..."),X.textContent="";try{var i=B.map(function(e){return e.value});p||(p=(await Y(t)).titles)
;var r=await G(i,p,Q),c={};r.forEach(function(e){c[O(e.tr)]=!0});var l=0;B=B.filter(function(e){return!c[O(e.value)]||(e.checked=!1,e.parentNode.remove(),l++,
!1)}),e=e.filter(function(e){return!c[O(e.tr)]}),U.nodeValue="Kategoriye eklenebilecek maddeler ("+B.length+")",P.checked=B.length>0&&B.every(function(e){
return e.checked}),P.indeterminate=B.some(function(e){return e.checked})&&!P.checked,ve(),X.textContent=l+" madde öneri listesinden çıkarıldı.",
(p||[]).length||(X.textContent="Kontrol edilecek Türkçe alt kategori bulunmuyor."),j(Q),y(Q,"✓ Alt kategori kontrolü tamamlandı")}catch(e){
X.textContent="Kontrol tamamlanamadı; öneri listesi korunuyor. "+(e.message||String(e)),y(Q,"Alt kategori kontrolünü tekrar dene")}finally{Q.disabled=!1,
J.disabled=a,I.disabled=n}}),w.appendChild(F);var Z=g("div");Z.classList.add("catcheck-list","ccs22"),e.forEach(function(e){var t=g("span")
;t.classList.add("ccs23","ccs24","ccs25");var a=g("input");a.type="checkbox",a.value=e.tr,B.push(a),t.appendChild(a);var n=g("a");n.href=mw.util.getUrl(e.tr),
n.textContent=" "+e.tr,n.target="_blank",t.appendChild(n),Z.appendChild(t)}),w.appendChild(Z),P.addEventListener("change",function(){B.forEach(function(e){
e.checked=!e.disabled&&P.checked}),ve()}),J.addEventListener("click",function(){var e=[];B.forEach(function(t){t.checked&&!t.disabled&&e.push(t.value)}),
e.length?de(e,J):alert("Önce en az bir madde seç.")})}else{var ae=g("div");ae.textContent="Eklenecek yeni madde bulunamadı.",ae.classList.add("ccs26"),
w.appendChild(ae)}var ne=g("div");if(ne.classList.add("ccs27","ccs16","ccs17"),ne.textContent="Alt kategoriler ("+a.length+")",w.appendChild(ne),a.length){
var oe=g("div");oe.classList.add("ccs20"),(M=g("input")).type="checkbox",oe.appendChild(M),oe.appendChild(m(" Tüm Türkçe kategorileri seç "));var me=g("button")
;me.type="button",y(me,"Seçilen alt kategorileri ekle"),me.classList.add("ccs14","ccs13"),oe.appendChild(me),re(a,oe),w.appendChild(oe);var ke=g("div")
;ke.classList.add("catcheck-list","ccs22"),a.forEach(function(e){var t=g("span");if(t.classList.add("ccs23","ccs24","ccs25"),e.hasTurkish){var a=g("input")
;a.type="checkbox",a.value=e.tr,R.push(a),t.appendChild(a);var n=g("a");n.href=mw.util.getUrl("Kategori:"+e.tr),n.textContent=" "+e.tr,n.target="_blank",
t.appendChild(n)}else{var i=g("a"),r=e.en.replace(/^Category:/i,"");i.href="https://en.wikipedia.org/wiki/Category:"+encodeURIComponent(r.replace(/ /g,"_")),
i.textContent="[EN] "+r,i.target="_blank",i.rel="noopener",i.classList.add("ccs28"),i.title="Türkçe karşılığı bulunamadı. İngilizce kategoriyi aç",
t.appendChild(i),e.memberCountNode=g("span");var c=D()[O(e.en)]
;c&&!0===c.done&&(e.memberCountNode.textContent=" ("+c.articles.toLocaleString("tr-TR")+"m "+c.categories.toLocaleString("tr-TR")+"k)",
e.memberCountNode.title="Önceki sayımdan yüklendi"),t.appendChild(e.memberCountNode)}ke.appendChild(t)}),w.appendChild(ke),
M.addEventListener("change",function(){R.forEach(function(e){e.checked=!e.disabled&&M.checked}),ve()}),me.addEventListener("click",function(){var e=[]
;R.forEach(function(t){t.checked&&!t.disabled&&e.push(t.value)}),e.length?se(e,me):alert("Önce en az bir alt kategori seç.")})}else{var fe=g("div")
;fe.textContent="İngilizce kategoride alt kategori bulunamadı.",w.appendChild(fe)}function ve(){var e=B.concat(R),t=e.filter(function(e){return e.checked
}).length;_.checked=e.length>0&&t===e.length,_.indeterminate=t>0&&t<e.length}B.concat(R).forEach(function(e){e.addEventListener("change",ve)}),
_.addEventListener("change",function(){B.concat(R).forEach(function(e){e.checked=_.checked}),P&&(P.checked=_.checked),M&&(M.checked=_.checked),
_.indeterminate=!1}),I.addEventListener("click",function(){var e=[],t=[];B.forEach(function(t){t.checked&&!t.disabled&&e.push(t.value)}),R.forEach(function(e){
e.checked&&!e.disabled&&t.push(e.value)}),e.length||t.length?ue(e,t,I):alert("Önce en az bir madde veya alt kategori seç.")}),(o=(o||[]).filter(function(e){
return!e.tr||!v(e.tr)})).forEach(function(e){e.hasTurkish=!!e.tr});var ye=g("div");if(ye.classList.add("ccs29","ccs17"),
ye.textContent="Üst kategori önerileri ("+o.length+")",w.appendChild(ye),o.length){var be=g("div");be.classList.add("ccs20");var Ce=g("input")
;Ce.type="checkbox",be.appendChild(Ce),be.appendChild(m(" Tümünü seç "));var we=g("button");we.type="button",y(we,"Seçilen üst kategorileri düzenle"),
we.classList.add("ccs14","ccs13"),be.appendChild(we),re(o,be),w.appendChild(be);var Ee=[];o.forEach(function(e){var t=g("div");if(t.classList.add("ccs22"),
!e.hasTurkish){var a=g("a");a.href="https://en.wikipedia.org/wiki/"+encodeURIComponent(e.en.replace(/ /g,"_")),
a.textContent="[EN] "+e.en.replace(/^Category:/i,""),a.target="_blank",a.rel="noopener",t.appendChild(a),e.memberCountNode=g("span");var n=D()[O(e.en)]
;return n&&!0===n.done&&(e.memberCountNode.textContent=" ("+n.articles.toLocaleString("tr-TR")+"m "+n.categories.toLocaleString("tr-TR")+"k)",
e.memberCountNode.title="Önceki sayımdan yüklendi"),t.appendChild(e.memberCountNode),void w.appendChild(t)}var i=g("input");i.type="checkbox",i.parentInfo=e,
Ee.push(i),t.appendChild(i),t.appendChild(m("add"===e.action?" Ekle: ":" Gözden geçir ve kaldır: "));var r=g("a");r.href=mw.util.getUrl("Kategori:"+e.tr),
r.textContent=e.tr,
r.target="_blank",t.appendChild(r),t.appendChild(m("add"===e.action?" (İngilizce üst kategori: "+e.en+")":" (İngilizce karşılığı üst kategori listesinde yok: "+e.en+")")),
w.appendChild(t)}),Ce.addEventListener("change",function(){Ee.forEach(function(e){e.checked=Ce.checked})}),we.addEventListener("click",function(){
var e=Ee.filter(function(e){return e.checked}).map(function(e){return e.parentInfo});e.length?function(e,a){a.disabled=!0,T(a),
y(a,"Üst kategoriler düzenleniyor..."),A(a,0,e.length),he(t).then(function(n){var i=n,r=[],c=[];if(e.forEach(function(e){
var t=e.tr.replace(/_/g," ").trim(),a=t.split(/\s+/).map(z).join("[ _]+"),n=new RegExp("^[ \\t]*\\[\\[[ \\t]*"+z("Kategori:")+"[ \\t]*"+a+"[ \\t]*(?:\\|[^\\]\\r\\n]*)?\\]\\][ \\t]*(?:\\r?\\n|$)","gim")
;if("remove"===e.action){var l=i.replace(n,"");l!==i&&(i=l,c.push(t))}else n.test(i)||r.push(t)}),(i=N(i,r.map(function(e){return"[\u005bKategori:"+e+"]]"
})))===n)return j(a),A(a,e.length,e.length),null;var l=[];return r.length&&l.push("Üst kategori eklendi: "+r.map(function(e){return"[\u005bKategori:"+e+"]]"
}).join(", ")),c.length&&l.push("Üst kategori kaldırıldı: "+c.map(function(e){return"[\u005bKategori:"+e+"]]"}).join(", ")),S({action:"edit",title:t,text:i,
summary:l.join("; ")+" ([[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']])",minor:!0})}).then(function(t){
if(t&&(!t.edit||"Success"!==t.edit.result))throw new Error(t.error&&t.error.info||"Değişiklik kaydedilemedi.");j(a),A(a,e.length,e.length)}).catch(function(e){
a.disabled=!1,y(a,"Seçilen üst kategorileri düzenle"),alert("Hata: "+(e.message||e))})}(e,we):alert("Önce en az bir üst kategori seç.")})}else{var xe=g("div")
;xe.textContent="Üst kategori önerisi bulunamadı.",w.appendChild(xe)}var qe=g("div");if(qe.classList.add("ccs27","ccs16","ccs17"),
qe.textContent="Alt kategorilere taşınabilecek maddeler ("+n.length+")",w.appendChild(qe),n.length){var Ke=g("div");Ke.classList.add("ccs20");var Le=g("input")
;Le.type="checkbox",Ke.appendChild(Le),Ke.appendChild(m(" Tümünü seç "));var Se=g("button");Se.type="button",y(Se,"Seçilenleri alt kategorilere taşı"),
Se.classList.add("ccs14","ccs13"),Ke.appendChild(Se),w.appendChild(Ke);var Te=g("div");Te.classList.add("catcheck-list","ccs22");var je=[]
;n.forEach(function(e){var t=g("div"),a=g("input");a.type="checkbox",a.moveInfo=e,je.push(a),t.appendChild(a);var n=g("a");n.href=mw.util.getUrl(e.tr),
n.textContent=" "+e.tr,n.target="_blank",t.appendChild(n),t.appendChild(m(" → ")),e.subcategories.forEach(function(e,a){a&&t.appendChild(m(", "));var n=g("a")
;n.href=mw.util.getUrl("Kategori:"+e),n.textContent=e,n.target="_blank",t.appendChild(n)}),Te.appendChild(t)}),w.appendChild(Te),
Le.addEventListener("change",function(){je.forEach(function(e){e.checked=Le.checked})}),Se.addEventListener("click",function(){var e,a,n,i=[]
;je.forEach(function(e){e.checked&&i.push(e.moveInfo)}),i.length?(e=i,a=Se,n=t.replace(/^Kategori:/i,"").replace(/_/g," ").trim(),
le(e,a,"Alt kategorilere taşınıyor",function(e){return e.tr},function(e,t){var a=e.replace(f(n),""),i=[];return t.subcategories.forEach(function(e){
f(e).test(a)||(a=N(a,[k(e)]),i.push(e))}),{text:a,summary:k(n)+" yerine "+(i.length?i:t.subcategories).map(k).join(", ")+" eklendi ("+l+")"}
})):alert("Önce en az bir madde seç.")})}else{var Ae=g("div");Ae.textContent="İngilizce alt kategori yerleşimine göre taşınacak madde bulunamadı.",
w.appendChild(Ae)}s=s||[];var Ne=g("div")
;if(Ne.classList.add("ccs29","ccs17"),Ne.textContent="Başka alt kategorilere taşınabilecek alt kategoriler ("+s.length+")",w.appendChild(Ne),s.length){
var ze=g("div");ze.classList.add("ccs20");var Oe=g("input");Oe.type="checkbox",ze.appendChild(Oe),ze.appendChild(m(" Tümünü seç "));var _e=g("button")
;_e.type="button",y(_e,"Seçilen alt kategorileri taşı"),ze.appendChild(_e),w.appendChild(ze);var Ie=[];s.forEach(function(e){var t=g("div")
;t.classList.add("ccs22");var a=g("input");a.type="checkbox",a.moveInfo=e,Ie.push(a),t.appendChild(a);var n=g("a");n.href=mw.util.getUrl("Kategori:"+e.tr),
n.textContent=" "+e.tr,n.target="_blank",t.appendChild(n),t.appendChild(m(" → ")),e.subcategories.forEach(function(e,a){a&&t.appendChild(m(", "));var n=g("a")
;n.href=mw.util.getUrl("Kategori:"+e),n.textContent=e,n.target="_blank",t.appendChild(n)}),w.appendChild(t)}),Oe.addEventListener("change",function(){
Ie.forEach(function(e){e.checked=Oe.checked})}),_e.addEventListener("click",function(){var e=Ie.filter(function(e){return e.checked}).map(function(e){
return e.moveInfo});e.length?async function(e,a){a.disabled=!0,T(a);var n=t.replace(/^Kategori:/i,"").replace(/_/g," ").trim(),i=0,r=0
;y(a,"Alt kategoriler taşınıyor... 0/"+e.length),await pe(e,async function(e){try{var t="Kategori:"+e.tr,c=await he(t),l=f(n);if(!l.test(c))return;l.lastIndex=0
;var o=c.replace(l,"");if(e.subcategories.forEach(function(t){O(t)!==O(e.tr)&&(f(t).test(o)||(o=N(o,["[\u005bKategori:"+t.replace(/_/g," ")+"]]"])))}),o===c)return
;var s=e.subcategories.map(function(e){return"[\u005bKategori:"+e.replace(/_/g," ")+"]]"}).join(", "),d=await S({action:"edit",title:t,text:o,
summary:"Alt kategori [\u005bKategori:"+n+"]] kategorisinden "+s+" kategorisine taşındı ([[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']])",minor:!0})
;if(!d.edit||"Success"!==d.edit.result)throw new Error(d.error&&d.error.info||"Değişiklik kaydedilemedi.");i++,ce(a,t)}catch(t){r++,
console.error("[Kategori aracı]",e.tr,t)}},function(e,t){y(a,"Alt kategoriler taşınıyor... "+e+"/"+t),A(a,e,t)}),A(a,e.length-r,e.length),r?(a.disabled=!1,
y(a,i+" alt kategori taşındı, "+r+" işlem başarısız")):j(a)}(e,_e):alert("Önce en az bir alt kategori seç.")})}else{var Be=g("div")
;Be.textContent="Taşınabilecek alt kategori bulunamadı.",w.appendChild(Be)}d=d||[];var Re=g("div");if(Re.classList.add("ccs29","ccs17"),
Re.textContent="Başka alt kategorilerde de bulunan alt kategoriler ("+d.length+")",w.appendChild(Re),d.length){var Pe=g("div");Pe.classList.add("ccs20")
;var Me=g("input");Me.type="checkbox",Pe.appendChild(Me),Pe.appendChild(m(" Tümünü seç "));var Ve=g("button");Ve.type="button",
y(Ve,"Seçilen alt kategorileri ana kategoriden kaldır"),Pe.appendChild(Ve),w.appendChild(Pe);var Ue=[];d.forEach(function(e){var t=g("div")
;t.classList.add("ccs22");var a=g("input");a.type="checkbox",a.moveInfo=e,Ue.push(a),t.appendChild(a);var n=g("a");n.href=mw.util.getUrl("Kategori:"+e.tr),
n.textContent=" "+e.tr,n.target="_blank",t.appendChild(n),t.appendChild(m(" — Diğer alt kategori: "+e.subcategories.join(", "))),w.appendChild(t)}),
Me.addEventListener("change",function(){Ue.forEach(function(e){e.checked=Me.checked})}),Ve.addEventListener("click",function(){var e=Ue.filter(function(e){
return e.checked}).map(function(e){return e.moveInfo});e.length?async function(e,a){a.disabled=!0,T(a)
;var n=t.replace(/^Kategori:/i,"").replace(/_/g," ").trim(),i=0,r=0;y(a,"Yinelenen kategori kaldırılıyor... 0/"+e.length),await pe(e,async function(e){try{
var t="Kategori:"+e.tr,c=await he(t);if(!e.subcategories.some(function(e){return f(e).test(c)}))return;var l=f(n);if(!l.test(c))return;l.lastIndex=0
;var o=c.replace(l,""),s=await S({action:"edit",title:t,text:o,
summary:"Alt kategori başka bir alt kategoride mevcut olduğundan [\u005bKategori:"+n+"]] kaldırıldı ([[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']])",
minor:!0});if(!s.edit||"Success"!==s.edit.result)throw new Error(s.error&&s.error.info||"Değişiklik kaydedilemedi.");i++,ce(a,t)}catch(t){r++,
console.error("[Kategori aracı]",e.tr,t)}},function(e,t){y(a,"Yinelenen kategori kaldırılıyor... "+e+"/"+t),A(a,e,t)}),A(a,e.length-r,e.length),
r?(a.disabled=!1,y(a,i+" alt kategoriden ana kategori kaldırıldı, "+r+" işlem başarısız")):j(a)}(e,Ve):alert("Önce en az bir alt kategori seç.")})}else{
var De=g("div");De.textContent="Yinelenen alt kategori bulunamadı.",w.appendChild(De)}var $e=g("div");if($e.classList.add("ccs27","ccs16","ccs17"),
$e.textContent="Alt kategorilerde de bulunan ana kategori maddeleri ("+i.length+")",w.appendChild($e),i.length){var He=g("div");He.classList.add("ccs20")
;var Ye=g("input");Ye.type="checkbox",He.appendChild(Ye),He.appendChild(m(" Tümünü seç "));var We=g("button");We.type="button",
y(We,"Seçilenleri ana kategoriden kaldır"),We.classList.add("ccs14","ccs13"),He.appendChild(We),w.appendChild(He);var Ge=g("div")
;Ge.classList.add("catcheck-list","ccs22");var Fe=[];i.forEach(function(e){var t=g("div"),a=g("input");a.type="checkbox",a.value=e.tr,Fe.push(a),
t.appendChild(a);var n=g("a");n.href=mw.util.getUrl(e.tr),n.textContent=" "+e.tr,n.target="_blank",t.appendChild(n);var i=g("span");i.classList.add("ccs30"),
i.textContent=" — Alt kategori: "+e.subcategories.join(", "),t.appendChild(i),Ge.appendChild(t)}),w.appendChild(Ge),Ye.addEventListener("change",function(){
Fe.forEach(function(e){e.checked=Ye.checked})}),We.addEventListener("click",function(){var e,a,n,i=[];Fe.forEach(function(e){
e.checked&&!e.disabled&&i.push(e.value)}),i.length?(e=i,a=We,n=t.replace(/^Kategori:/i,"").replace(/_/g," ").trim(),
le(e,a,"Ana kategori kaldırılıyor",function(e){return e},function(e){return{text:e.replace(f(n),""),
summary:"Alt kategoride bulunan madde üst kategoriden kaldırıldı: "+k(n)+" ("+l+")"}})):alert("Önce en az bir madde seç.")})}else{var Je=g("div")
;Je.textContent="Ana kategori ile doğrudan alt kategoriler arasında yinelenen madde bulunamadı.",w.appendChild(Je)}if(ie(w,[V,ne,ye,qe,Ne,Re,$e]),h){K.remove()
;var Qe=["articles","categories","parents","moves","submoves","redundantSubs","redundantArticles"],Xe=b?Qe:Object.keys(h.sections);b&&(h.complete=!0)
;var Ze=C||w;if(!C){var et=g("p");et.className="catcheck-ready-notice",w.insertBefore(et,w.children[1]);var tt=g("div");tt.className="ccs8 ccs9 ccs10 ccs11"
;var at=g("label"),nt=g("input");nt.type="checkbox",at.appendChild(nt),at.appendChild(m(" Hazır maddeleri ve alt kategorileri seç ")),tt.appendChild(at)
;var it=g("button");function rt(){
return w.querySelectorAll('[data-scan-key="articles"] .catcheck-list input, [data-scan-key="categories"] .catcheck-list input')}it.type="button",
y(it,"Seçilenlerin hepsini ekle"),tt.appendChild(it),nt.addEventListener("change",function(){rt().forEach(function(e){e.checked=!e.disabled&&nt.checked})}),
it.addEventListener("click",function(){var e=[],t=[];rt().forEach(function(a){
a.checked&&!a.disabled&&("articles"===a.closest("details").dataset.scanKey?e:t).push(a.value)}),e.length||t.length?ue(e,t,it):alert("Önce en az bir seçim yap.")
}),w.insertBefore(tt,et.nextSibling)}Array.from(w.querySelectorAll("details.catcheck-group")).forEach(function(e,t){var a=Qe[t];e.dataset.scanKey=a,
h.full||"articles"===a||(h.statuses[a]="Kapsam dışında",e.querySelector(".catcheck-group-content").textContent="Bu kontrol için Tam tarama seçin.")
;var n=C&&C.querySelector('[data-scan-key="'+a+'"]');if(h.rendered[a])e.remove();else{if(Xe.indexOf(a)<0){if(n)return void e.remove()
;e.querySelector("summary").firstChild.nodeValue=e.querySelector("summary").firstChild.nodeValue.replace(/ \(0\)$/,""),
e.querySelector(".catcheck-group-content").textContent=h.full||"articles"===a?"Bu bölümün kontrolü henüz tamamlanmadı.":"Bu kontrol için Tam tarama seçin."
}else h.rendered[a]=!0,h.statuses[a]="Tamamlandı";n?(e.open=n.open,n.replaceWith(e)):C&&C.appendChild(e)}}),C||te(w),Qe.forEach(function(e){
E(h,e,h.statuses[e]||"Sıra bekliyor")
}),Ze.querySelector(".catcheck-ready-notice").textContent=b?"Tarama tamamlandı. Bölümlerdeki işlem düğmelerini kullanabilirsiniz.":"Tarama sürüyor. Kontrolü tamamlanan bölümlerde işlem yapabilirsiniz."
}else te(w);ge(document.getElementById(c))}function te(e){K().body.appendChild(e)}function ae(e){var t=document.getElementById("catcheck-window-progress")
;if(t){t.textContent=e;var a=e.indexOf("...");if(!(a<0)){t.textContent="",t.appendChild(m(e.substring(0,a)));var n=g("span");n.className="catcheck-dots-holder",
n.setAttribute("aria-hidden","true");for(var i=0;i<3;i++){var r=g("span");r.className="catcheck-dot catcheck-dot-"+i,r.textContent=".",n.appendChild(r)}
t.appendChild(n),t.appendChild(m(e.substring(a+3)))}}}function ne(e){
return/üst kategorileri düzenle/i.test(e.textContent)?-1:["add","move","check","discover","remove","neutral"].indexOf(e.dataset.ccAction||"neutral")}
function ie(e,t){var a=[];t.forEach(function(n,i){var r=t[i+1]||null,c=g("details");c.className="catcheck-group",c.open=0===i;var l=g("summary")
;for(l.className="catcheck-group-title";n.firstChild;)l.appendChild(n.firstChild);c.appendChild(l);var o=g("div")
;for(o.className="catcheck-group-content";n.nextSibling&&n.nextSibling!==r;)o.appendChild(n.nextSibling);!function(e){
var t=Array.from(e.querySelectorAll("button"));if(t.length){var a=g("div");a.className="catcheck-action-bar";var n=g("div")
;if(n.className="catcheck-select-row",e.querySelectorAll("input[type=checkbox]").forEach(function(e){var t=e.closest("label")
;if((t?t.parentNode:e.parentNode).querySelector("button")){if(!t){t=g("label");var a=e.nextSibling;t.appendChild(e),a&&3===a.nodeType&&t.appendChild(a)}
n.appendChild(t)}}),t.sort(function(e,t){return ne(e)-ne(t)}).forEach(function(e){a.appendChild(e)}),e.prepend(a),n.firstChild){
var i=Array.from(e.children).find(function(e){return e.classList.contains("catcheck-list")||e.querySelector("input[type=checkbox]")});e.insertBefore(n,i||null)}
}}(o),c.appendChild(o),e.replaceChild(c,n),a.push(c),c.addEventListener("toggle",function(){
c.open&&c.parentNode&&c.parentNode.querySelectorAll("details.catcheck-group").forEach(function(e){e!==c&&(e.open=!1)})})})}function re(e,t){
var a=e.filter(function(e){return!e.hasTurkish}),r=D();if(a.length){var c=a.filter(function(e){var t=r[O(e.en)];return t&&!0===t.done}).length,l=g("button")
;l.type="button",
y(l,c>0&&c<a.length?"Hesaplamaya devam et ("+c+"/"+a.length+")":c===a.length?"✓ Türkçe üye sayıları hazır ("+c+"/"+a.length+")":"Türkçe üye sayılarını hesapla"),
l.classList.add("ccs21"),t.appendChild(l);var o=g("button");o.type="button",y(o,"Sayım kaydını sıfırla"),o.classList.add("ccs21"),t.appendChild(o),
o.addEventListener("click",function(){!function(){try{localStorage.removeItem(U())}catch(e){console.warn("[CatCheck] Üye sayımı ilerlemesi temizlenemedi:",e)}
}(),r={},a.forEach(function(e){e.memberCountNode&&(e.memberCountNode.textContent="")}),l.disabled=!1,T(l),y(l,"Türkçe üye sayılarını hesapla"),
y(o,"Sayım kaydı temizlendi"),setTimeout(function(){y(o,"Sayım kaydını sıfırla")},1500)}),l.addEventListener("click",function(){l.disabled=!0,o.disabled=!0,T(l)
;var e=a.map(function(e){return e.en});(async function(e,t,a){var r={},c=0,l=0,o=0,s=!1,d=!1,u=D(),p={};function h(){A(t,l,e.length),
y(t,"Kategorilerin Türkçe üyeleri sayılıyor... ("+l+"/"+e.length+")")}async function g(e,t){var a=[],i={},r=null;do{var c,l={action:"query",
generator:"categorymembers",gcmtitle:e,gcmnamespace:String(t),gcmlimit:"500",prop:"pageprops",ppprop:"wikibase_item",formatversion:"2"}
;r&&Object.keys(r).forEach(function(e){l[e]=r[e]});try{c=await L(n,l,0===t?"İngilizce kategori maddeleri":"İngilizce alt kategoriler")}catch(a){
console.warn("[CatCheck] Kategori sorgusu tekrar deneniyor:",e,a),await new Promise(function(e){setTimeout(e,1200)}),
c=await L(n,l,0===t?"İngilizce kategori maddeleri":"İngilizce alt kategoriler")}c&&c.query&&c.query.pages&&c.query.pages.forEach(function(e){
if(e.pageprops&&e.pageprops.wikibase_item){var t=e.pageprops.wikibase_item;i[t]||(i[t]=!0,a.push(t))}}),r=c&&c.continue?c.continue:null}while(r&&!d);return a}
async function m(e,t){for(var a=0,n=0;n<e.length;n+=50){if(d)throw new Error("İşlem durduruldu.");var r,c={action:"wbgetentities",ids:e.slice(n,n+50).join("|"),
props:"sitelinks",sitefilter:"trwiki",format:"json"};try{r=await L(i,c,"Vikiveri Türkçe karşılıkları")}catch(e){
console.warn("[CatCheck] Wikidata grubu tekrar deneniyor:",e),await new Promise(function(e){setTimeout(e,1500)}),r=await L(i,c,"Vikiveri Türkçe karşılıkları")}
r&&r.entities&&(Object.keys(r.entities).forEach(function(e){var n=r.entities[e];if(n&&n.sitelinks&&n.sitelinks.trwiki){var i=n.sitelinks.trwiki.title
;0===t?0!==i.indexOf("Kategori:")&&a++:14===t&&0===i.indexOf("Kategori:")&&a++}}),n+50<e.length&&await new Promise(function(e){setTimeout(e,150)}))}return a}
async function k(e){var t=await Promise.all([g(e,0),g(e,14)]);if(d)throw new Error("İşlem durduruldu.");return{articles:await m(t[0],0),
categories:await m(t[1],14)}}async function f(){for(;!d&&c<e.length;){var t=e[c++],n=O(t);if(!u[n]||!0!==u[n].done){try{var i=await k(t);if(d)return;r[n]=i,
u[n]={category:t,articles:i.articles,categories:i.categories,done:!0,updatedAt:Date.now()},H(u),l++,o++,a(t,i,"done"),h()}catch(e){
return void(d||(console.error("[CatCheck] Üye sayımı yarıda kaldı:",t,e),s=!0,d=!0,a(t,null,"error")))}await new Promise(function(e){setTimeout(e,100)})}}}
e.forEach(function(e){p[O(e)]=!0}),Object.keys(u).forEach(function(e){p[e]&&u[e]&&!0===u[e].done&&(r[e]={articles:u[e].articles,categories:u[e].categories},l++,
a(u[e].category||e,r[e],"cached"))}),h();for(var v=[],b=Math.max(0,e.length-l),C=0;C<Math.min(3,b);C++)v.push(f());return await Promise.all(v),{counts:r,
completed:l,total:e.length,processedThisRun:o,interrupted:s||l<e.length}})(e,l,function(e,t,n){var i=O(e),r=a.find(function(e){return O(e.en)===i})
;r&&r.memberCountNode&&(t?(r.memberCountNode.textContent=" ("+t.articles.toLocaleString("tr-TR")+"m "+t.categories.toLocaleString("tr-TR")+"k)",
r.memberCountNode.title="cached"===n?"Önceki sayımdan yüklendi":"Yeni hesaplandı"):"error"===n&&(r.memberCountNode.textContent=" (?)",
r.memberCountNode.title="Bu kategoride bağlantı veya API hatası oluştu; sonraki çalıştırmada yeniden denenecek."))}).then(function(e){r=D(),o.disabled=!1,
l.disabled=!1,e.completed>=e.total?(j(l),y(l,"✓ Tamamlandı ("+e.completed+"/"+e.total+")")):(T(l),y(l,"Kaldığı yerden devam et ("+e.completed+"/"+e.total+")"),
l.title="Bağlantı veya API sorunu nedeniyle sayım durdu. Tamamlanan sonuçlar kaydedildi.")}).catch(function(t){console.error("[Kategori aracı]",t),
o.disabled=!1,l.disabled=!1;var a=D(),n=e.filter(function(e){var t=a[O(e)];return t&&!0===t.done}).length;y(l,"Kaldığı yerden devam et ("+n+"/"+e.length+")"),
l.title=t.message||String(t)})})}}function showResults(a,n,i){var s=document.getElementById(c);s&&s.remove();var d=g("div");d.id=c,
d.classList.add("ccs1","ccs2","ccs3","ccs4","ccs5");var u=g("strong");if(u.textContent="Kategori önerileri",ee(u),d.appendChild(u),n){var p=g("div")
;p.classList.add("ccs6","ccs7"),p.textContent=n,d.appendChild(p)}else if(a.length){var h=g("div");h.classList.add("ccs18");var v=g("label")
;v.classList.add("ccs31","ccs13");var b=g("input");b.type="checkbox",v.appendChild(b),v.appendChild(m(" Tümünü seç")),h.appendChild(v);var C=g("button")
;C.type="button",y(C,"Seçilen kategorileri ekle"),C.classList.add("ccs14","ccs13"),h.appendChild(C),re(a,h),d.appendChild(h);var w=g("div")
;w.classList.add("catcheck-list","ccs22");var E=[];a.forEach(function(e){var t=g("span");if(t.classList.add("ccs23","ccs24","ccs25"),e.hasTurkish){
var a=g("input");a.type="checkbox",a.value=e.tr,E.push(a),t.appendChild(a);var n=g("a");n.href=mw.util.getUrl("Kategori:"+e.tr),n.textContent=" "+e.tr,
n.target="_blank",t.appendChild(n)}else{var i=g("a"),r=e.en.replace(/^Category:/i,"")
;i.href="https://en.wikipedia.org/wiki/Category:"+encodeURIComponent(r.replace(/ /g,"_")),i.textContent="[EN] "+r,i.target="_blank",i.rel="noopener",
i.classList.add("ccs28"),t.appendChild(i),e.memberCountNode=g("span");var c=D()[O(e.en)]
;c&&!0===c.done&&(e.memberCountNode.textContent=" ("+c.articles.toLocaleString("tr-TR")+"m "+c.categories.toLocaleString("tr-TR")+"k)",
e.memberCountNode.title="Önceki sayımdan yüklendi"),t.appendChild(e.memberCountNode)}w.appendChild(t)}),d.appendChild(w),b.addEventListener("change",function(){
E.forEach(function(e){e.checked=b.checked})}),C.addEventListener("click",function(){var e,a,n,i=[];E.forEach(function(e){e.checked&&!e.disabled&&i.push(e.value)
}),i.length?(e=i,n=[],(a=C).disabled=!0,T(a),A(a,0,e.length),y(a,"Kategori ekleniyor..."),he(t).then(function(i){if(e.forEach(function(e){
new RegExp("\\[\\["+z("Kategori:")+z(e)+"(?:\\||\\]\\])","i").test(i)||n.push(e)}),!n.length)return j(a),null;var r=n.map(function(e){
return"[\u005bKategori:"+e.replace(/_/g," ")+"]]"}),c=N(i,r),o=n.map(function(e){return"[\u005bKategori:"+e.replace(/_/g," ")+"]]"}).join(", ");return S({action:"edit",
title:t,text:c,summary:"Kategori eklendi: "+o+" ("+l+")",minor:!0})}).then(function(t){if(t){
if(!t.edit||"Success"!==t.edit.result)throw new Error(t.error&&t.error.info?t.error.info:"Değişiklik kaydedilemedi.");j(a,n.length),A(a,e.length,e.length)}
}).catch(function(e){a.disabled=!1,y(a,"Seçilen kategorileri ekle"),alert("Hata:\n\n"+(e.message||e))})):alert("Önce en az bir seçim yap.")})}else{
var x=g("div");x.classList.add("ccs6"),x.textContent="Yeni Türkçe kategori bulunamadı.",d.appendChild(x)}!n&&a.length&&ie(d,[u]),te(d),function(a){
if(0!==e||a.querySelector(".catcheck-article-redundancy"))return;var n=g("details");n.className="catcheck-group catcheck-article-redundancy";var i=g("summary")
;i.className="catcheck-group-title",i.textContent="Üst kategoride yinelenen üyelikler";var c=g("small");c.className="catcheck-section-status",
c.textContent="Sıra bekliyor",i.appendChild(c);var s=g("div");s.className="catcheck-group-content";var d=g("div");d.className="catcheck-action-bar"
;var u=g("button");u.type="button",u.className="catcheck-article-redundancy-check",u.disabled=!!o,y(u,"Üst kategori kontrolünü yenile"),d.appendChild(u),
s.appendChild(d);var p=g("p")
;p.textContent="Doğrudan alt ve üst kategorilere aynı anda eklenmiş bu madde için üst kategori kaldırma önerileri. Seçimleri gözden geçirin; yalnızca seçilen üst kategoriler kaldırılır.",
s.appendChild(p);var h=g("div");s.appendChild(h),n.appendChild(i),n.appendChild(s),a.appendChild(n),n.catcheckRun=async function(e){if(!o||e){
var a=document.getElementById(r);a.disabled=u.disabled=!0,h.textContent="",n.open=!0,c.textContent="Kontrol ediliyor";try{
var i=(await getVisibleCategoryParents([t],u))[O(t)]||[],s=function(e,t,a){var n=Object.create(null),i=Object.create(null);function r(e,a,i){
return e===a||!i.has(e)&&(i.add(e),(t[e]||[]).some(function(e){var t=O(e);return!!n[t]&&r(t,a,i)}))}return e.forEach(function(e){ke(a,e)&&(n[O(e)]=e)}),
Object.keys(n).forEach(function(e){(t[e]||[]).forEach(function(t){var a=O(t);n[a]&&!r(a,e,new Set)&&(i[a]||(i[a]={parent:n[a],children:[]}),
i[a].children.push(n[e]))})}),Object.values(i)}(i,await getVisibleCategoryParents(i,u),(await fe()).text)
;p.textContent=s.length?s.length+" üst kategori için kaldırma önerisi bulundu. Korunacak alt kategoriler her önerinin yanında gösterilir.":"Doğrudan alt ve üst kategoriler arasında yinelenen üyelik bulunamadı.",
s.length&&function(e,a,n,i,r){var c=g("div");c.className="catcheck-action-bar";var o=g("button");o.type="button",
y(o,"Seçilen üst kategorileri maddeden kaldır"),c.appendChild(o),a.appendChild(c);var s=g("label");s.className="catcheck-select-row";var d=g("input")
;d.type="checkbox",s.appendChild(d),s.appendChild(m(" Tümünü seç")),a.appendChild(s);var u=g("div");u.className="catcheck-list catcheck-redundancy-list"
;var p=e.map(function(e){var t=g("span"),a=g("input");a.type="checkbox",a.value=e.parent,a.redundancy=e,a.setAttribute("aria-label",e.parent),t.appendChild(a)
;var n=g("span");return[e.parent].concat(e.children).forEach(function(e,t){t&&n.appendChild(m(1===t?" — Korunacak: ":", "));var a=g("a")
;a.href=mw.util.getUrl(e),a.textContent=e.replace(/^Kategori:/i,""),a.target="_blank",a.rel="noopener",n.appendChild(a)}),t.appendChild(n),u.appendChild(t),a})
;a.appendChild(u),d.addEventListener("change",function(){p.forEach(function(e){e.checked=d.checked&&!e.disabled})}),o.addEventListener("click",async function(){
var e=p.filter(function(e){return e.checked&&!e.disabled});if(e.length){o.disabled=n.disabled=i.disabled=!0,y(o,"Üst kategoriler kaldırılıyor...");try{
var a=await fe(),c=new Set(e.map(function(e){return O(e.value)})),s=Array.from(new Set(e.flatMap(function(e){return e.redundancy.children
}))),d=await getVisibleCategoryParents(s,o),u=[];e.forEach(function(e){var t=e.redundancy;t.children.some(function(e){
return!c.has(O(e))&&ke(a.text,e)&&(d[O(e)]||[]).some(function(e){return O(e)===O(t.parent)})})&&ke(a.text,t.parent)&&u.push(t.parent)})
;var h=a.text.split(/(<!--[\s\S]*?(?:-->|$)|<(?:nowiki|pre|source|syntaxhighlight)\b[^>]*>[\s\S]*?<\/(?:nowiki|pre|source|syntaxhighlight)\s*>)/gi).map(function(e,t){
return t%2||u.forEach(function(t){e=e.replace(f(t.replace(/^Kategori:/i,"")),"")}),e}).join("");if(h!==a.text){var g=await S({action:"edit",title:t,text:h,
baserevid:a.revid,summary:"Alt kategoride bulunan maddenin yinelenen üst kategorileri kaldırıldı: "+u.map(function(e){return k(e.replace(/^Kategori:/i,""))
}).join(", ")+" ("+l+")",minor:!0});if(!g.edit||"Success"!==g.edit.result)throw new Error(g.error&&g.error.info||"Değişiklik kaydedilemedi.")
;e.forEach(function(e){u.indexOf(e.value)>=0&&(e.checked=!1,e.disabled=!0,e.parentNode.classList.add("catcheck-row-done"))})}
r.textContent=u.length+" üst kategori kaldırıldı."+(u.length<e.length?" Diğer seçimler güncel üyelik veya korunacak alt kategori koşulunu sağlamadığı için atlandı. Yeniden kontrol edebilirsiniz.":""),
j(o)}catch(e){r.textContent="Düzeltme kaydedilemedi: "+(e.message||String(e)),y(o,"Üst kategorileri kaldırmayı tekrar dene")}finally{
o.disabled=n.disabled=i.disabled=!1}}else alert("Önce en az bir üst kategori seç.")})}(s,h,u,a,p),j(u),c.textContent="Tamamlandı",
y(u,"Üst kategori kontrolünü yenile")}catch(e){c.textContent="Tamamlanamadı",p.textContent="Kontrol tamamlanamadı: "+(e.message||String(e)),
y(u,"Kategori üyeliklerini tekrar kontrol et")}finally{a.disabled=u.disabled=!1}}},u.addEventListener("click",function(){n.catcheckRun(!1)})}(d)}
function ce(e,t){var a=e.closest("details.catcheck-group")||document.getElementById(c);a&&a.querySelectorAll("input[type=checkbox]").forEach(function(e){
O(e.value)!==O(t)&&O("Kategori:"+e.value)!==O(t)||(e.checked=!1,e.disabled=!0,e.parentNode.classList.add("catcheck-row-done"))})}async function le(e,t,a,n,i,r){
r=r||{},t.disabled=!0,T(t);var c=0,l=0;function o(n){y(t,a+"... "+n+"/"+e.length),A(t,n+(r.offset||0),r.total||e.length)}return o(0),
await pe(e,async function(e){var a=n(e);try{var r=await he(a),o=i(r,e);if(!o||o.text===r)return void ce(t,a);var s=await S({action:"edit",title:a,text:o.text,
summary:o.summary,minor:!0});if(!s.edit||"Success"!==s.edit.result)throw new Error(s.error&&s.error.info||"Değişiklik kaydedilemedi.");c++,ce(t,a)}catch(e){l++,
console.error("[Kategori aracı]",a,e)}},o),r.onComplete?r.onComplete():j(t),{changed:c,failed:l}}function oe(e,a,n,i){
var r=(n&&n.targetCategory||t).replace(/^Kategori:/i,"").replace(/_/g," ").trim(),c=k(r),o=new RegExp("\\[\\["+z("Kategori:")+z(r)+"(?:\\||\\]\\])","i")
;return le(e,a,i?"Alt kategoriler güncelleniyor":"Maddeler güncelleniyor",function(e){return i?"Kategori:"+e:e},function(e){return o.test(e)?null:{
text:N(e,[c]),summary:(i?"Üst kategori eklendi: ":"Kategori eklendi: ")+c+" ("+l+")"}},n)}function se(e,t,a){return oe(e,t,a,!0)}function de(e,t,a){
return oe(e,t,a,!1)}function ue(e,t,a){function n(){j(a,(e.length,t.length))}function i(){t.length?se(t,a,{onComplete:n,offset:e.length,total:e.length+t.length
}):n()}a.disabled=!0,T(a),e.length?de(e,a,{onComplete:i,total:e.length+t.length}):i()}async function pe(e,t,a){var n=0,i=0;await Promise.all(Array.from({
length:Math.min(4,e.length)},async function(){for(;n<e.length;){var r=e[n++];await t(r),i++,a&&a(i,e.length)}}))}function he(e){return L(a,{action:"query",
prop:"revisions",titles:e,rvprop:"content",rvslots:"main",formatversion:"2"},"Madde",!0).then(function(e){
if(!e.query||!e.query.pages||!e.query.pages.length)throw new Error("Madde içeriği alınamadı.");var t=e.query.pages[0]
;if(!t.revisions)throw new Error("Madde sürümü bulunamadı.");return t.revisions[0].slots.main.content})}function ge(e){
if(e&&!e.querySelector(".catcheck-child-suggestions")){var n=g("details");n.className="catcheck-group catcheck-child-suggestions";var c=g("summary")
;c.className="catcheck-group-title",c.appendChild(m("Alt kategorilere eklenebilecek maddeler"));var l=g("small");l.className="catcheck-section-status",
l.textContent="İsteğe bağlı",c.appendChild(l),n.appendChild(c);var s=g("div");s.className="catcheck-group-content";var d=g("p")
;d.textContent="Bu kategorinin doğrudan altındaki tüm Türkçe kategorileri tarar. Her birinin İngilizce karşılığından, Türkçede mevcut olup ilgili alt kategoride bulunmayan maddeleri önerir.",
s.appendChild(d);var u=g("button");u.type="button",u.className="catcheck-child-scan",u.disabled=!!o,y(u,"Alt kategorilerin maddelerini tara"),s.appendChild(u)
;var h=g("div");s.appendChild(h),n.appendChild(s),e.appendChild(n);var k=[];u.addEventListener("click",async function(){if(!o){
var e=document.getElementById(r),c={paused:!1,waiters:[],statuses:{},rendered:{},complete:!1};o=c,p=u,e.disabled=!0,ve(!0);var d=g("div")
;d.className="catcheck-action-bar";var f=g("button");f.type="button",y(f,"Taramayı durdur"),d.appendChild(f),s.insertBefore(d,h),c.controls=d,
f.addEventListener("click",function(){c.paused=!c.paused,y(f,c.paused?"Kaldığı yerden devam et":"Taramayı durdur"),
l.textContent=c.paused?"Duraklatıldı":"Kontrol ediliyor",c.paused||c.waiters.splice(0).forEach(function(e){e()})});var v=0;try{if(n.open=!0,
l.textContent="Alt kategoriler alınıyor",!k.length){var C=await Y(t);(k=Array.from(new Set(C.titles)).map(function(e){var t=g("details")
;t.className="catcheck-group catcheck-child-category";var a=g("summary");a.className="catcheck-group-title",a.appendChild(m(e.replace(/^Kategori:/i,"")))
;var n=g("small");n.className="catcheck-section-status",n.textContent="Sıra bekliyor",a.appendChild(n);var i=g("div")
;return i.className="catcheck-group-content",t.appendChild(a),t.appendChild(i),h.appendChild(t),{title:e,label:n,body:i,done:!1}
})).length||(h.textContent="Bu kategoride Türkçe alt kategori bulunamadı.")}for(var E=0;E<k.length;E++){var x=k[E];if(!x.done){await b(c),
x.label.textContent="Kontrol ediliyor",x.body.textContent="";try{var q=await L(a,{action:"query",prop:"pageprops",titles:x.title,ppprop:"wikibase_item",
formatversion:2},"Alt kategori"),K=q.query&&q.query.pages&&q.query.pages[0],S=K&&K.pageprops&&K.pageprops.wikibase_item,T=null;if(S){var j=await L(i,{
action:"wbgetentities",ids:S,props:"sitelinks",sitefilter:"enwiki"},"Alt kategori karşılığı"),A=j.entities&&j.entities[S]
;T=A&&A.sitelinks&&A.sitelinks.enwiki&&A.sitelinks.enwiki.title}if(T&&/^Category:/i.test(T)){
var N=await Promise.all([M(T),W(x.title)]),z=await F(N[0],null,u),_=Array.from(new Set(Object.values(z))),I=await Q(_),B=new Set(N[1].map(O))
;_=_.filter(function(e){return!I[e]&&!B.has(O(e))&&O(e)!==O(x.title.replace(/^Kategori:/i,""))}),me(x,_),x.label.textContent="Tamamlandı · "+_.length+" öneri"
}else x.body.textContent=S?"İngilizce kategori karşılığı bulunamadı.":"Vikiveri bağlantısı bulunamadı.",x.label.textContent="Atlandı";x.done=!0}catch(e){v++,
x.label.textContent="Tamamlanamadı",x.body.textContent="Kontrol başarısız: "+(e.message||String(e))}l.textContent=E+1+"/"+k.length+" kategori",
y(u,"Alt kategoriler taranıyor... "+(E+1)+"/"+k.length)}}c.complete=!0,l.textContent=v?v+" kategori tekrar denenebilir":"Tamamlandı · "+k.length+" kategori",
v||(n.dataset.complete="true")}catch(e){v++,l.textContent="Tarama tamamlanamadı: "+(e.message||String(e))}finally{w(c),p=null,e.disabled=!1,
y(u,v?"Tamamlanamayanları tekrar tara":"✓ Alt kategori taraması tamamlandı"),u.disabled="true"===n.dataset.complete}}})}}function me(e,t){if(t.length){
var a=g("div");a.className="catcheck-action-bar";var n=g("button");n.type="button",y(n,"Seçilen maddeleri bu alt kategoriye ekle"),a.appendChild(n),
e.body.appendChild(a);var i=g("label");i.className="catcheck-select-row";var r=g("input");r.type="checkbox",i.appendChild(r),i.appendChild(m(" Tümünü seç")),
e.body.appendChild(i);var c=g("div");c.className="catcheck-list";var l=t.map(function(e){var t=g("span"),a=g("input");a.type="checkbox",a.value=e,
a.setAttribute("aria-label",e),t.appendChild(a);var n=g("a");return n.href=mw.util.getUrl(e),n.textContent=e,n.target="_blank",n.rel="noopener",
t.appendChild(n),c.appendChild(t),a});e.body.appendChild(c),r.addEventListener("change",function(){l.forEach(function(e){e.checked=!e.disabled&&r.checked})}),
n.addEventListener("click",function(){var t=l.filter(function(e){return e.checked&&!e.disabled}).map(function(e){return e.value});t.length?de(t,n,{
targetCategory:e.title}):alert("Önce en az bir madde seç.")})}else e.body.textContent="Eklenecek madde bulunamadı."}
async function getVisibleCategoryParents(e,t){for(var n=Object.create(null),i=_("Kategori ilişkileri kontrol ediliyor",e.length,t),r=0;r<e.length;r+=50){
var c=e.slice(r,r+50),l={};do{var o=await i.request(a,Object.assign({action:"query",prop:"categories",titles:c.join("|"),clshow:"!hidden",cllimit:"max",
formatversion:2},l),"Türkçe kategori ilişkileri");if(!o.query||!o.query.pages)throw new Error("Kategori ilişkileri alınamadı.")
;o.query.pages.forEach(function(e){var t=O(e.title);n[t]||(n[t]=[]),(e.categories||[]).forEach(function(e){
!v(e.title)&&n[t].indexOf(e.title)<0&&n[t].push(e.title)})}),l=o.continue}while(l)}return n}function ke(e,t){
return f(t.replace(/^Kategori:/i,"")).test(function(e){
return e.replace(/<!--[\s\S]*?(?:-->|$)|<(nowiki|pre|source|syntaxhighlight)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,"")}(e))}async function fe(){var e=await L(a,{
action:"query",prop:"revisions",titles:t,rvprop:"ids|content",rvslots:"main",formatversion:2
},"Güncel madde",!0),n=e.query&&e.query.pages&&e.query.pages[0].revisions&&e.query.pages[0].revisions[0]
;if(!n||!n.slots||!n.slots.main)throw new Error("Güncel madde içeriği alınamadı.");return{text:n.slots.main.content,revid:n.revid}}function ve(e){
var t=document.querySelector(".catcheck-article-redundancy-check");t&&(t.disabled=e);var a=document.querySelector(".catcheck-child-scan")
;a&&(a.disabled=e||"true"===a.closest("details").dataset.complete);var n=document.getElementById("catcheck-full-search");if(n){var i=h&&h.full&&h.complete
;n.disabled=e||!!i,y(n,i?"✓ Tam arama tamamlandı":"Tam arama")}}}();
