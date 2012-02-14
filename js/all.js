/* SWFObject v2.1 <http://code.google.com/p/swfobject/>
	Copyright (c) 2007-2008 Geoff Stearns, Michael Williams, and Bobby van der Sluis
	This software is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
var swfobject=function(){var b="undefined",Q="object",n="Shockwave Flash",p="ShockwaveFlash.ShockwaveFlash",P="application/x-shockwave-flash",m="SWFObjectExprInst",j=window,K=document,T=navigator,o=[],N=[],i=[],d=[],J,Z=null,M=null,l=null,e=false,A=false;var h=function(){var v=typeof K.getElementById!=b&&typeof K.getElementsByTagName!=b&&typeof K.createElement!=b,AC=[0,0,0],x=null;if(typeof T.plugins!=b&&typeof T.plugins[n]==Q){x=T.plugins[n].description;if(x&&!(typeof T.mimeTypes!=b&&T.mimeTypes[P]&&!T.mimeTypes[P].enabledPlugin)){x=x.replace(/^.*\s+(\S+\s+\S+$)/,"$1");AC[0]=parseInt(x.replace(/^(.*)\..*$/,"$1"),10);AC[1]=parseInt(x.replace(/^.*\.(.*)\s.*$/,"$1"),10);AC[2]=/r/.test(x)?parseInt(x.replace(/^.*r(.*)$/,"$1"),10):0}}else{if(typeof j.ActiveXObject!=b){var y=null,AB=false;try{y=new ActiveXObject(p+".7")}catch(t){try{y=new ActiveXObject(p+".6");AC=[6,0,21];y.AllowScriptAccess="always"}catch(t){if(AC[0]==6){AB=true}}if(!AB){try{y=new ActiveXObject(p)}catch(t){}}}if(!AB&&y){try{x=y.GetVariable("$version");if(x){x=x.split(" ")[1].split(",");AC=[parseInt(x[0],10),parseInt(x[1],10),parseInt(x[2],10)]}}catch(t){}}}}var AD=T.userAgent.toLowerCase(),r=T.platform.toLowerCase(),AA=/webkit/.test(AD)?parseFloat(AD.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,q=false,z=r?/win/.test(r):/win/.test(AD),w=r?/mac/.test(r):/mac/.test(AD);/*@cc_on q=true;@if(@_win32)z=true;@elif(@_mac)w=true;@end@*/return{w3cdom:v,pv:AC,webkit:AA,ie:q,win:z,mac:w}}();var L=function(){if(!h.w3cdom){return }f(H);if(h.ie&&h.win){try{K.write("<script id=__ie_ondomload defer=true src=//:><\/script>");J=C("__ie_ondomload");if(J){I(J,"onreadystatechange",S)}}catch(q){}}if(h.webkit&&typeof K.readyState!=b){Z=setInterval(function(){if(/loaded|complete/.test(K.readyState)){E()}},10)}if(typeof K.addEventListener!=b){K.addEventListener("DOMContentLoaded",E,null)}R(E)}();function S(){if(J.readyState=="complete"){J.parentNode.removeChild(J);E()}}function E(){if(e){return }if(h.ie&&h.win){var v=a("span");try{var u=K.getElementsByTagName("body")[0].appendChild(v);u.parentNode.removeChild(u)}catch(w){return }}e=true;if(Z){clearInterval(Z);Z=null}var q=o.length;for(var r=0;r<q;r++){o[r]()}}function f(q){if(e){q()}else{o[o.length]=q}}function R(r){if(typeof j.addEventListener!=b){j.addEventListener("load",r,false)}else{if(typeof K.addEventListener!=b){K.addEventListener("load",r,false)}else{if(typeof j.attachEvent!=b){I(j,"onload",r)}else{if(typeof j.onload=="function"){var q=j.onload;j.onload=function(){q();r()}}else{j.onload=r}}}}}function H(){var t=N.length;for(var q=0;q<t;q++){var u=N[q].id;if(h.pv[0]>0){var r=C(u);if(r){N[q].width=r.getAttribute("width")?r.getAttribute("width"):"0";N[q].height=r.getAttribute("height")?r.getAttribute("height"):"0";if(c(N[q].swfVersion)){if(h.webkit&&h.webkit<312){Y(r)}W(u,true)}else{if(N[q].expressInstall&&!A&&c("6.0.65")&&(h.win||h.mac)){k(N[q])}else{O(r)}}}}else{W(u,true)}}}function Y(t){var q=t.getElementsByTagName(Q)[0];if(q){var w=a("embed"),y=q.attributes;if(y){var v=y.length;for(var u=0;u<v;u++){if(y[u].nodeName=="DATA"){w.setAttribute("src",y[u].nodeValue)}else{w.setAttribute(y[u].nodeName,y[u].nodeValue)}}}var x=q.childNodes;if(x){var z=x.length;for(var r=0;r<z;r++){if(x[r].nodeType==1&&x[r].nodeName=="PARAM"){w.setAttribute(x[r].getAttribute("name"),x[r].getAttribute("value"))}}}t.parentNode.replaceChild(w,t)}}function k(w){A=true;var u=C(w.id);if(u){if(w.altContentId){var y=C(w.altContentId);if(y){M=y;l=w.altContentId}}else{M=G(u)}if(!(/%$/.test(w.width))&&parseInt(w.width,10)<310){w.width="310"}if(!(/%$/.test(w.height))&&parseInt(w.height,10)<137){w.height="137"}K.title=K.title.slice(0,47)+" - Flash Player Installation";var z=h.ie&&h.win?"ActiveX":"PlugIn",q=K.title,r="MMredirectURL="+j.location+"&MMplayerType="+z+"&MMdoctitle="+q,x=w.id;if(h.ie&&h.win&&u.readyState!=4){var t=a("div");x+="SWFObjectNew";t.setAttribute("id",x);u.parentNode.insertBefore(t,u);u.style.display="none";var v=function(){u.parentNode.removeChild(u)};I(j,"onload",v)}U({data:w.expressInstall,id:m,width:w.width,height:w.height},{flashvars:r},x)}}function O(t){if(h.ie&&h.win&&t.readyState!=4){var r=a("div");t.parentNode.insertBefore(r,t);r.parentNode.replaceChild(G(t),r);t.style.display="none";var q=function(){t.parentNode.removeChild(t)};I(j,"onload",q)}else{t.parentNode.replaceChild(G(t),t)}}function G(v){var u=a("div");if(h.win&&h.ie){u.innerHTML=v.innerHTML}else{var r=v.getElementsByTagName(Q)[0];if(r){var w=r.childNodes;if(w){var q=w.length;for(var t=0;t<q;t++){if(!(w[t].nodeType==1&&w[t].nodeName=="PARAM")&&!(w[t].nodeType==8)){u.appendChild(w[t].cloneNode(true))}}}}}return u}function U(AG,AE,t){var q,v=C(t);if(v){if(typeof AG.id==b){AG.id=t}if(h.ie&&h.win){var AF="";for(var AB in AG){if(AG[AB]!=Object.prototype[AB]){if(AB.toLowerCase()=="data"){AE.movie=AG[AB]}else{if(AB.toLowerCase()=="styleclass"){AF+=' class="'+AG[AB]+'"'}else{if(AB.toLowerCase()!="classid"){AF+=" "+AB+'="'+AG[AB]+'"'}}}}}var AD="";for(var AA in AE){if(AE[AA]!=Object.prototype[AA]){AD+='<param name="'+AA+'" value="'+AE[AA]+'" />'}}v.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+AF+">"+AD+"</object>";i[i.length]=AG.id;q=C(AG.id)}else{if(h.webkit&&h.webkit<312){var AC=a("embed");AC.setAttribute("type",P);for(var z in AG){if(AG[z]!=Object.prototype[z]){if(z.toLowerCase()=="data"){AC.setAttribute("src",AG[z])}else{if(z.toLowerCase()=="styleclass"){AC.setAttribute("class",AG[z])}else{if(z.toLowerCase()!="classid"){AC.setAttribute(z,AG[z])}}}}}for(var y in AE){if(AE[y]!=Object.prototype[y]){if(y.toLowerCase()!="movie"){AC.setAttribute(y,AE[y])}}}v.parentNode.replaceChild(AC,v);q=AC}else{var u=a(Q);u.setAttribute("type",P);for(var x in AG){if(AG[x]!=Object.prototype[x]){if(x.toLowerCase()=="styleclass"){u.setAttribute("class",AG[x])}else{if(x.toLowerCase()!="classid"){u.setAttribute(x,AG[x])}}}}for(var w in AE){if(AE[w]!=Object.prototype[w]&&w.toLowerCase()!="movie"){F(u,w,AE[w])}}v.parentNode.replaceChild(u,v);q=u}}}return q}function F(t,q,r){var u=a("param");u.setAttribute("name",q);u.setAttribute("value",r);t.appendChild(u)}function X(r){var q=C(r);if(q&&(q.nodeName=="OBJECT"||q.nodeName=="EMBED")){if(h.ie&&h.win){if(q.readyState==4){B(r)}else{j.attachEvent("onload",function(){B(r)})}}else{q.parentNode.removeChild(q)}}}function B(t){var r=C(t);if(r){for(var q in r){if(typeof r[q]=="function"){r[q]=null}}r.parentNode.removeChild(r)}}function C(t){var q=null;try{q=K.getElementById(t)}catch(r){}return q}function a(q){return K.createElement(q)}function I(t,q,r){t.attachEvent(q,r);d[d.length]=[t,q,r]}function c(t){var r=h.pv,q=t.split(".");q[0]=parseInt(q[0],10);q[1]=parseInt(q[1],10)||0;q[2]=parseInt(q[2],10)||0;return(r[0]>q[0]||(r[0]==q[0]&&r[1]>q[1])||(r[0]==q[0]&&r[1]==q[1]&&r[2]>=q[2]))?true:false}function V(v,r){if(h.ie&&h.mac){return }var u=K.getElementsByTagName("head")[0],t=a("style");t.setAttribute("type","text/css");t.setAttribute("media","screen");if(!(h.ie&&h.win)&&typeof K.createTextNode!=b){t.appendChild(K.createTextNode(v+" {"+r+"}"))}u.appendChild(t);if(h.ie&&h.win&&typeof K.styleSheets!=b&&K.styleSheets.length>0){var q=K.styleSheets[K.styleSheets.length-1];if(typeof q.addRule==Q){q.addRule(v,r)}}}function W(t,q){var r=q?"visible":"hidden";if(e&&C(t)){C(t).style.visibility=r}else{V("#"+t,"visibility:"+r)}}function g(s){var r=/[\\\"<>\.;]/;var q=r.exec(s)!=null;return q?encodeURIComponent(s):s}var D=function(){if(h.ie&&h.win){window.attachEvent("onunload",function(){var w=d.length;for(var v=0;v<w;v++){d[v][0].detachEvent(d[v][1],d[v][2])}var t=i.length;for(var u=0;u<t;u++){X(i[u])}for(var r in h){h[r]=null}h=null;for(var q in swfobject){swfobject[q]=null}swfobject=null})}}();return{registerObject:function(u,q,t){if(!h.w3cdom||!u||!q){return }var r={};r.id=u;r.swfVersion=q;r.expressInstall=t?t:false;N[N.length]=r;W(u,false)},getObjectById:function(v){var q=null;if(h.w3cdom){var t=C(v);if(t){var u=t.getElementsByTagName(Q)[0];if(!u||(u&&typeof t.SetVariable!=b)){q=t}else{if(typeof u.SetVariable!=b){q=u}}}}return q},embedSWF:function(x,AE,AB,AD,q,w,r,z,AC){if(!h.w3cdom||!x||!AE||!AB||!AD||!q){return }AB+="";AD+="";if(c(q)){W(AE,false);var AA={};if(AC&&typeof AC===Q){for(var v in AC){if(AC[v]!=Object.prototype[v]){AA[v]=AC[v]}}}AA.data=x;AA.width=AB;AA.height=AD;var y={};if(z&&typeof z===Q){for(var u in z){if(z[u]!=Object.prototype[u]){y[u]=z[u]}}}if(r&&typeof r===Q){for(var t in r){if(r[t]!=Object.prototype[t]){if(typeof y.flashvars!=b){y.flashvars+="&"+t+"="+r[t]}else{y.flashvars=t+"="+r[t]}}}}f(function(){U(AA,y,AE);if(AA.id==AE){W(AE,true)}})}else{if(w&&!A&&c("6.0.65")&&(h.win||h.mac)){A=true;W(AE,false);f(function(){var AF={};AF.id=AF.altContentId=AE;AF.width=AB;AF.height=AD;AF.expressInstall=w;k(AF)})}}},getFlashPlayerVersion:function(){return{major:h.pv[0],minor:h.pv[1],release:h.pv[2]}},hasFlashPlayerVersion:c,createSWF:function(t,r,q){if(h.w3cdom){return U(t,r,q)}else{return undefined}},removeSWF:function(q){if(h.w3cdom){X(q)}},createCSS:function(r,q){if(h.w3cdom){V(r,q)}},addDomLoadEvent:f,addLoadEvent:R,getQueryParamValue:function(v){var u=K.location.search||K.location.hash;if(v==null){return g(u)}if(u){var t=u.substring(1).split("&");for(var r=0;r<t.length;r++){if(t[r].substring(0,t[r].indexOf("="))==v){return g(t[r].substring((t[r].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(A&&M){var q=C(m);if(q){q.parentNode.replaceChild(M,q);if(l){W(l,true);if(h.ie&&h.win){M.style.display="block"}}M=null;l=null;A=false}}}}}();var _duration=[["yt:-5EmnQp3V48",193,0,0,100,1978,"The Commodores","Brick House"],["yt:-5Yx2TnN9mc",330,0,0,100,1984,"Alphaville","Forever Young"],["yt:-6Y-t85vs4g",257,0,0,100,1983,"U2","New Years Day"],["yt:-CyGT8f9_v4",305,0,0,100,1984,"Rush","Afterimage"],["yt:-JoSIGGOGZQ",162,0,0,100,1970,"Black Sabbath","Paranoid"],["yt:-b-6ksMdkrU",224,0,0,100,1986,"Company B","Fascinated"],["yt:0FFrCZNNCeU",279,5,0,100,1986,"Dj Jazzy Jeff & The Fresh Prince","Girls Aint Nothin' but Trouble"],["yt:0KE3-IyLsg8",206,0,0,100,1984,"U.T.F.O.","Leader Of The Pack"],["yt:0KfGEJQgsTo",220,0,0,100,1984,"Divinyls","The Good Die Young"],["yt:0X7RyGBq2E8",236,0,0,100,1983,"Madonna","Holiday"],["yt:0_Pq0xYr3L4",238,0,0,100,1982,"A Flock Of Seagulls","I Ran"],["yt:0tUdUVmnWNc",206,0,0,100,1969,"Jimi Hendrix","Hey Joe"],["yt:110k5hsSTjo",236,0,0,100,1981,"Moon Ray","Comanchero"],["yt:17lkdqoLt44",245,0,0,100,1982,"The Gap Band","you Dropped a Bomb"],["yt:1BDJt30FmzI",229,0,0,100,1983,"Madonna","Like A Virgin"],["yt:1Hm08f5b8tc",240,0,0,100,1979,"Amii Stewart","Knock on Wood"],["yt:1PO19wvNr98",217,0,0,100,1989,"Kool Rock Steady","You Ain't Nobody"],["yt:1TKQcWEXSKU",249,0,0,100,1983,"Donna Summer","She Works Hard For the Money"],["yt:1XHcPYorSJw",293,0,0,100,1989,"M�tley Cr�e","Dr. Feelgood"],["yt:1ZUQ59UjCR0",184,0,0,100,1982,"Devo","Time out for Fun"],["yt:1hDbpF4Mvkw",228,0,0,100,1983,"David Bowie","Modern Love"],["yt:1rPOg6VnzV8",228,0,0,100,1988,"Taylor Dayne","Don't Rush Me"],["yt:1w7OgIMMRc4",299,0,0,100,1988,"Guns N' Roses","Sweet Child O' Mine"],["yt:1xFMg2Bc5GE",216,0,0,100,1985,"LA Dream Team","Nursery Rhymes"],["yt:1y3TKv7Chk4",223,0,0,100,1981,"Kim Wilde","Cambodia"],["yt:2BfkzfW770g",304,0,0,100,1984,"Rush","The Body Electric"],["yt:2RJlYzBhLg4",418,0,0,100,1983,"Afrika Bambaataa","Looking for the Perfect Beat"],["yt:2RgMngGPTJg",251,0,0,100,1990,"Whitney Houston","I'm Your Baby Tonight"],["yt:2aljlKYesT4",205,0,0,100,1983,"Violent Femmes","Blister in the Sun"],["yt:2nXGPZaTKik",270,0,0,100,1982,"Culture Club","Do You Really Want To Hurt Me"],["yt:2rYYecQN3VM",189,0,0,100,1979,"Patrick Hernandez","Born to be alive"],["yt:2v8YragSIuI",210,0,0,100,1986,"Expose","Point Of No Return"],["yt:3fI8834iCgo",231,0,0,100,1982,"Thomas Dolby","She blinded me with science"],["yt:3tCEQwww65g",264,0,0,100,1983,"Greg Kihn Band","Jeopardy"],["yt:3y5Ru76ce6Q",242,0,0,100,1983,"Machinations","Pressure Sway"],["yt:45wCqCAeSWY",216,0,0,100,1982,"Trees","Delta Sleep"],["yt:4KzORRrLxxo",259,0,0,100,1982,"Dazz Band","Let it Whip"],["yt:4NXkM8PsPXs",219,0,0,100,1986,"Talking Heads","Wild Wild Life"],["yt:4b7GGQ9tBoY",195,0,0,100,1983,"Barnes & Barnes","Soak It Up"],["yt:4gpNqB4dnT4",337,0,0,100,1977,"Heart","Crazy On You"],["yt:4kHl4FoK1Ys",195,0,0,100,1984,"Modern Talking","Your my heart, Your my sould"],["yt:4nuR780B458",249,0,0,100,1983,"Spandau Ballet","Communication"],["yt:4xmckWVPRaI",272,0,0,100,1984,"Twisted Sister","We're Not Gonna Take It"],["yt:4yM9uVeVLNM",214,0,0,100,1984,"John Rocca","Once Upon A Time"],["yt:4z_usl6i9IY",228,0,0,100,1985,"Katrina and the Waves","Walking on Sunshine"],["yt:54IN3URGuM8",349,3,0,100,1985,"Tears For Fears","Shout"],["yt:5HI_xFQWiYU",219,0,0,100,1988,"When In Rome","The Promise"],["yt:5IBRbzf3Fws",298,0,0,100,1988,"Rob Base DJ E Z Rock","It Takes Two"],["yt:5X-Mrc2l1d0",202,0,0,100,1979,"Michael Jackson","Rock With You"],["yt:6T-zBGs7KAM",207,2,0,100,1984,"The Twins","Love System"],["yt:6Uxc9eFcZyM",366,0,0,100,1982,"Duran Duran","Save A Prayer"],["yt:6aumejrcEHs",271,0,0,100,1983,"PIL","This is not a Love Song"],["yt:6zK-SJZCfK0",190,0,0,100,1987,"Danuta","Touch My Heart"],["yt:7SCXP_8P_W8",212,0,0,100,1985,"Paul Hardcastle","19 Nineteen"],["yt:7m1UWSD-FaA",202,0,0,100,1979,"Olivia Newton John & ELO","Xanadu"],["yt:7movKfyTBII",164,0,0,100,1983,"Men Without Hats","Safety Dance"],["yt:7rtIN9dWHsw",246,0,0,100,1989,"808 State","Pacific State"],["yt:7uEBuqkkQRk",225,0,0,100,1986,"New Order","Bizarre Love Triangle"],["yt:7v2GDbEmjGE",251,0,0,100,1980,"The Police","De Do Do Do, De Da Da Da"],["yt:7wqxHThRgsA",212,2,0,100,1986,"Nu Shooz","Point of No Return"],["yt:8NjbGr2nk2c",241,0,0,100,1983,"Michael Sembello (Flashdance)","Maniac"],["yt:8SbUC-UaAxE",548,0,0,100,1991,"Guns N' Roses","November Rain"],["yt:8qrriKcwvlY",201,0,0,100,1986,"Timbuk 3","The Future's So Bright"],["yt:97bnfcuPOjc",227,0,0,100,1983,"P Lion","Happy Children"],["yt:998P6HEzCdI",246,0,0,100,1988,"Inner City","Good Life"],["yt:99vgiU-qsoo",381,0,0,100,1984,"Iron Maiden","2 Minutes To Midnight"],["yt:9AKQ2H4QW9M",181,0,0,100,1977,"Split Enz","My Mistake"],["yt:9AlH2oYedfk",139,0,0,100,1986,"The Smiths","Panic"],["yt:9B090fZFU7w",183,0,0,100,1984,"Takeaways","Sweet & Sour"],["yt:9N6jHsAU63g",283,0,0,100,1986,"Madonna","Material Girl"],["yt:9_A8Xe9M0NY",184,0,0,100,1973,"Devo","Dr Detroit"],["yt:9jwyHRimHkQ",236,0,0,100,1985,"Sylvester","Rock The Box"],["yt:9lDCYjb8RHk",240,0,0,100,1982,"Africa Bambaataa","Planet Rock"],["yt:9whehyybLqU",233,0,0,100,1984,"Nena","99 Luftballons"],["yt:A5C8AC6V2KQ",197,0,0,100,1986,"Modern Talking","Geronimo's Cadillac"],["yt:A7F2X3rSSCU",207,0,0,100,1969,"The Beatles","Lucy in the Sky with Diamonds"],["yt:AQ4xwmZ6zi4",292,0,0,100,1987,"Def Leppard","Pour Some Sugar On Me"],["yt:AlxCQGNeJDw",210,0,0,100,1982,"Ruins","Tricks To Survive"],["yt:B3Q-8jtLIvc",218,0,0,100,1983,"Wham!","Young Guns"],["yt:B3WIS6bB75o",175,0,0,100,1989,"Tyree","Let the Music Take Control"],["yt:BKmldYSDJaM",232,0,2,100,1984,"Billy Idol","Eyes without a Face"],["yt:BUj8NlnHPbA",150,0,0,100,1976,"Double Exposure","Ten Percent"],["yt:Bj4ZqutTTQs",208,0,0,100,1982,"Missing Persons","Destination Unknown"],["yt:BoXu6QmxpJE",257,0,0,100,1986,"Wang Chang","Everybody Have Fun Tonight"],["yt:BzdHxqwTO-4",212,0,0,100,1982,"Kim Wilde","Kids in Ameria"],["yt:CDfuMrUgqD4",241,0,0,100,1984,"Autograph","Turn up the radio"],["yt:CK3uf5V0pDA",225,2,0,100,1982,"The Pretenders","Back on the Chain Gang"],["yt:CMThz7eQ6K0",230,0,0,100,1980,"David Bowie","Ashes to Ashes"],["yt:CdqoNKCCt7A",260,0,0,100,1985,"Simple Minds","Don't You (Forget About Me)"],["yt:D67kmFzSh_o",229,0,0,100,1969,"David Bowie","Major Tom"],["yt:D6zBjYIyz-0",233,0,0,100,1983,"Real Life","Send Me An Angel"],["yt:DJKOYbxSoZU",189,0,0,100,1979,"Australian Crawl","Beautiful People"],["yt:DYp2LGKOF_M",194,0,0,100,1985,"The Smiths","The Boy With The Thorn In His Side"],["yt:D_Bj8wrXslk",229,0,0,100,1986,"The Pretenders","Don't Get Me Wrong"],["yt:Ded4MZVVAhE",244,0,0,100,1979,"The Knack","My Sharona"],["yt:Di-z4XSnus8",223,0,0,100,1988,"Confetti","Sound of C"],["yt:E5gNYVia2rg",202,0,0,100,1976,"Boney M","Daddy Cool"],["yt:E7t8eoA_1jQ",216,0,0,100,1987,"Erik B and Rakim","Paid in Full"],["yt:E_8IXx4tsus",243,0,0,100,1983,"David Bowie","China Girl"],["yt:EcNLr0AYgXc",242,0,0,100,1983,"Madonna","Lucky Star"],["yt:Egdv8xhw35M",135,0,0,100,1980,"Blondie","Call Me"],["yt:Eglgj77T0rk",180,0,0,100,1982,"Devo","Peek-A-Boo"],["yt:EnDtoFX5ITU",155,0,0,100,1982,"Trees","Shock Of The New"],["yt:EnmTtC7A_qc",158,0,0,100,1986,"A Split-Second","Flesh"],["yt:Ey9tJUxMk8Q",243,0,0,100,1986,"V. Spy V. Spy","Don't Tear It Down"],["yt:F0FBi5Rv1ho",277,0,0,100,1986,"Peter Gabriel","Big Time"],["yt:F0KGF8lg6Dc",253,0,0,100,1987,"Pseudo Echo","Living in a Dream"],["yt:FG1NrQYXjLU",203,0,0,100,1982,"Billy Idol","Dancing with Myself"],["yt:FHsip5xOenQ",244,0,0,100,1990,"The Sundays","Here's Where The Story Ends"],["yt:FJcQmXnAD3E",244,0,0,100,1982,"Gap Band","Early in the Morning"],["yt:FUyd8JJaMIM",228,0,0,100,1980,"Ultravox","Passing Strangers"],["yt:FXViS2CXLWU",230,0,0,100,1989,"Peter Schilling","The Different Story"],["yt:Ff5wxR081YQ",249,0,0,100,1989,"Love and Rockets","So Alive"],["yt:FfOOlppnZG4",193,0,0,100,1981,"Taxi Girl","Cherchez Le Garço"],["yt:FpwUC8LdqFo",203,0,0,100,1983,"Boytronic","You"],["yt:FwexPTV1_W4",222,0,0,100,1983,"Madonna","Burning Up"],["yt:FyMQLrnbBgE",334,0,0,100,1984,"Van Halen","Hot For Teacher"],["yt:G333Is7VPOg",306,0,0,100,1986,"Madonna","Papa Don't Preach"],["yt:G4JXHmvsCMU",236,0,0,100,1988,"The Bollock Brothers","Harley David, Son of a Bitch"],["yt:GI876rqao8A",205,0,0,100,1982,"Palais Schaumburg","Wir bauen eine neue Stadt"],["yt:GND7sPNwWko",315,0,0,100,1984,"RUN-DMC","Rock Box"],["yt:GQ0Drtft8-I",237,0,0,100,1984,"Goria Estefan","Dr. Beat"],["yt:Gbkhla8Ivlk",336,0,0,100,1983,"Styx","Mr. Roboto"],["yt:GguPC2U2EaI",329,0,0,100,1986,"Mike Mareen","Agent Of Liberty"],["yt:GieHr2CbPxk",196,4,0,100,1979,"M","Pop Muzik"],["yt:Gpq9UsFUuO4",243,0,1,100,1983,"Pamala Stanley","Coming out of hiding"],["yt:HBQ9dm7zaQU",223,0,0,100,1979,"Cheap Trick","I Want You To Want Me"],["yt:HGj1RvOo-2g",371,8,2,100,1980,"Sugar Hill Gang","Rappers Delight"],["yt:HP0_hkRV-zs",229,0,0,100,1985,"Mary Jane Girls","In My House"],["yt:Hc4ENEP_5-w",255,0,0,100,1990,"Sweet Sensation","Love. Child"],["yt:HiAYmEvuUng",198,0,0,100,1983,"Total Coelo","Milk from Coconuts"],["yt:HjNTu8jdukA",237,0,0,100,1988,"Slick Rick","Childrens' Story"],["yt:I1wg1DNHbNU",223,0,0,100,1981,"Talking Heads","Once in a lifetime"],["yt:IGVZOLV9SPo",318,0,0,100,1983,"Pat Benatar","Love Is A Battlefield"],["yt:IW-ftxIrhBc",217,0,0,100,1984,"Depeche Mode","People Are People"],["yt:IcTP7YWPayU",225,0,0,100,1984,"Eurythmics","Sex Crime 1984"],["yt:IuezNswtRfo",253,0,0,100,1988,"The Sisters of Mercy","Lucretia, My Reflection"],["yt:IwK67UvWPJs",181,0,0,100,1978,"Cissy Houston","Think It Over"],["yt:Iwuy4hHO3YQ",189,0,0,100,1979,"Buggles","Video killed the radio star"],["yt:J3nPLoODtGU",233,0,0,100,1988,"JJ Fad","Supersonic"],["yt:JH3WvI_S6-k",213,0,0,100,1986,"Bananarama","Venus"],["yt:JHYIGy1dyd8",193,0,0,100,1983,"The Fixx","One Thing Leads To Another"],["yt:JJrSTAv0-tw",356,0,0,100,1985,"Art of Noise","Legs"],["yt:JLYC7ltxOrk",248,2,0,100,1984,"Whodini","Freaks come out at Night"],["yt:JOO8-Jp-xsg",147,0,0,100,1969,"The Beatles","Sgt. Pepper's Lonely Hearts Club Band"],["yt:JOiZP8FS5Ww",213,0,0,100,1983,"The Fixx","Saved By Zero"],["yt:JicmU_MtOjE",197,0,0,100,1983,"Herbie Hancock","Rockit"],["yt:Jm-upHSP9KU",213,0,0,100,1982,"Oingo Boingo","Weird Science"],["yt:JmcA9LIIXWw",236,0,0,100,1983,"Culture Club","Karma Chameleon"],["yt:KFq4E9XTueY",227,0,0,100,1984,"Cyndi Lauper","She Bop"],["yt:KNIZofPB8ZM",233,0,0,100,1980,"The Police","Don't Stand So Close To Me"],["yt:KTn4o2Z-vZU",236,0,0,100,1983,"Tears For Fears","Pale Shelter"],["yt:KXewIR7Y7cc",211,0,0,100,1980,"Blondie","One Way Or Another"],["yt:KnIJOO__jVo",166,0,0,100,1979,"Lene Lovich","Lucky Number"],["yt:KwIe_sjKeAY",224,0,0,100,1983,"Madness","Our House"],["yt:KzA-V0YN3QA",242,0,0,100,1984,"Bronski Beat","Tell Me Why"],["yt:L03PJeB38dI",329,0,0,100,1984,"Blancmange","Living on the Ceiling"],["yt:L5si4rGARBo",195,0,0,100,1986,"C. C. Catch","Strangers By Night"],["yt:LHcP4MWABGY",247,0,0,100,1984,"U2","Pride (In the name of Love)"],["yt:LTYvjrM6djo",202,0,0,100,1984,"David Bowie","Blue Jean"],["yt:LV0eTlLU31k",215,0,0,100,1987,"Latin Fire","Fancy"],["yt:LoF_a0-7xVQ",257,0,0,100,1983,"Suicidal Tendencies","Institutionalized"],["yt:Lp2qcCrdBLA",225,0,0,100,1986,"Modern Talking","Brother Louie"],["yt:LuN6gs0AJls",228,0,0,100,1982,"Modern English","I Melt With You "],["yt:LuyS9M8T03A",255,0,0,100,1982,"George Clinton","Atomic Dog"],["yt:LxLhytQ67fs",440,0,0,100,1985,"Cyndi Lauper","The Goonies 'R' Good Enough"],["yt:M5NE1QHRSUs",237,0,0,100,1983,"The Romantics","Talking in your Sleep"],["yt:MA5oz8b3UJM",197,0,0,100,1983,"Pete Shelley","Telephone Operator"],["yt:MI0a9hTh5AU",202,0,0,100,1987,"The Cure","Why Can't I Be You"],["yt:MRwIcNJ_qJs",262,0,0,100,1985,"Alba","Only Music Survives"],["yt:MWiQkPem3BY",262,0,0,100,1982,"Missing Persons","Words"],["yt:MZjAantupsA",280,0,0,100,1986,"Cameo","Word Up"],["yt:MbXWrmQW-OE",246,0,0,100,1979,"The Police","Message In a Bottle"],["yt:MeG-hNXXy6I",220,0,0,100,1982,"Men At Work","Down Under"],["yt:MhpokfEKfx8",214,0,1,100,1979,"Sparks","Beat the Clock"],["yt:MkYyG1GOETc",197,0,0,100,1979,"The Riptides","77 Sunset Strip"],["yt:MrXu97GVVqc",286,0,0,100,1979,"Shirts","Laugh And Walk Away"],["yt:N-aK6JnyFmk",155,0,0,100,1965,"Mamas & The Papas","California Dreamin"],["yt:N-uyWAe0NhQ",150,0,0,100,1979,"Madness","One Step Beyond"],["yt:N5XkKceOvwY",223,0,0,100,1978,"Kraftwerk","The Robots"],["yt:NN5OgiwprP8",237,0,0,100,1983,"RedRockets","China"],["yt:NVQCpI4GbKQ",218,0,0,100,1983,"Icicle Works","Whisper To A Scream Birds Fly"],["yt:NXQYyKzyDaE",256,0,10,100,1984,"Talk Talk","It's My Life"],["yt:NZ2X2_ts5Kw",118,0,0,100,1981,"Josie Cotton","Johnny Are You Queer?"],["yt:Nl8ULWxt7sQ",150,0,0,100,1988,"The Primitives","Crash"],["yt:Nm_QilrHkh8",220,0,0,100,1986,"The Jets","Crush on You"],["yt:Nnpil_pRUiw",283,0,0,100,1966,"The Beatles","I am the Walrus"],["yt:O1Q7Wj8IQTQ",231,0,0,100,1984,"Ruins","Fire"],["yt:O4o8TeqKhgY",357,8,0,100,1984,"Grandmaster Flash","The Message"],["yt:OG3PnQ3tgzY",273,0,0,100,1982,"Taco","Puttin on the Ritz"],["yt:Oak4_095Cug",206,0,0,100,1982,"ABC","The Look of Love"],["yt:OkE3piTWME8",207,0,0,100,1978,"Sylvester","Can't Stop Dancing"],["yt:OtJn2VMmvY4",229,0,0,100,1983,"Madness","Tomorrow Is Just Another Day"],["yt:P-hRy5ilcGs",222,0,0,100,1982,"Baby's Gang","Happy song"],["yt:P0FKzPfsxA4",250,0,0,100,1989,"Bobby Brown","Every Little Step"],["yt:P0Hdt_zWIPI",216,0,0,100,1988,"The Clash","Rock the Casbah"],["yt:P0TQNp5MIO0",221,0,0,100,1981,"Madness","Shutup"],["yt:P5m8lj5DCtI",238,0,0,100,1984,"Lisa Lisa & Cult Jam","I Wonder If I Take You Home"],["yt:P9mwELXPGbA",236,0,0,100,1984,"Murray Head","One Night in Bangkok"],["yt:PIb6AZdTr-A",268,0,0,100,1983,"Cyndi Lauper","Girls Just Want To Have Fun"],["yt:PJFShE1VfEc",194,5,0,100,1981,"Yello","Bostich"],["yt:PSTHMxBttlU",225,0,0,100,1979,"Madness","Night Boat To Cairo"],["yt:PVzEfR6wL70",213,0,0,100,1984,"OMD","Tesla Girls"],["yt:PYnK83WxJnw",228,0,0,100,1983,"Howard Jones","New Song"],["yt:PdLIerfXuZ4",295,0,0,100,1978,"The Who","Who Are You?"],["yt:PeGTJOFSIgU",202,0,0,100,1980,"Visage","Fade To Grey"],["yt:PffB49ILRZU",234,0,0,100,1977,"Heart","Barracuda"],["yt:Q13FbBavgz4",173,0,0,100,1983,"Taco","Superphysical Resurrection"],["yt:QQxl9EI9YBg",303,0,0,100,1987,"U2","Where The Streets Have No Name"],["yt:QYHxGBH6o4M",202,0,0,100,1981,"Rick James","Super Freak"],["yt:bKyweX0rfOE",140,0,0,100,1967,"The Doors","People are strange"],["yt:QdV-5ivltkc",347,0,0,100,1982,"Yazoo","Situation"],["yt:QmDCTLAi67A",214,0,0,100,1982,"The Flirts","Helpless"],["yt:QtPefHZ0PV0",185,0,0,100,1981,"Electric Light Orchestra","Hold on Tight"],["yt:R30P9CgKfSs",194,0,0,100,1986,"Carola","The Runaway"],["yt:R6xm_iUA_90",235,0,0,100,1983,"Real Life","Catch me I'm falling"],["yt:RIcmIhOesaI",261,0,0,100,1986,"Art of Noise","Moments in Love"],["yt:RS_ux2H473I",198,0,0,100,1987,"The Cure","Just Like Heaven"],["yt:RT9O-pUGsVM",255,0,0,100,1984,"World Class Wreckin Cru ft. Dr. Dre","Surgery"],["yt:RTOQUnvI3CA",287,0,0,100,1983,"Frankie Goes to Hollywood","Two Tribes"],["yt:RXfXTB7UcuU",246,0,0,100,1986,"The Psychedelic Furs","Heartbreak Beat"],["yt:Rbm6GXllBiw",410,0,0,100,1987,"Guns N' Roses","Paradise City"],["yt:RczATjSmdNs",300,0,5,100,1982,"Ric Ocasek","Jimmy Jimmy"],["yt:RqQn2ADZE1A",330,0,0,100,1989,"Aerosmith","Janie's Got A Gun"],["yt:SE6CNBTT0go",132,0,0,100,1966,"The Rolling Stones","Paint it Black"],["yt:SEyhtdPEQxA",215,0,0,100,1984,"Siouxsie & The Banshees","Dazzle"],["yt:ST86JM1RPl0",191,0,0,100,1985,"Tears For Fears","Everybody Wants To Rule The World"],["yt:SbzYn48qJxU",264,0,0,100,1983,"The Bongos","Numbers With Wings"],["yt:Se-QYEgAU8E",244,0,0,100,1988,"Kon Kan","I Beg Your Pardon"],["yt:T8__EwAT8VM",220,0,0,100,1963,"The Ventures","Wipe Out"],["yt:THJy_L9___g",223,0,0,100,1989,"Technotronic","Pump Up The Jam"],["yt:UBnF7et1plA",218,0,0,100,1984,"Go-Gos","Head Over Heels"],["yt:UCtWkFbW0Us",170,0,0,100,1983,"Haysi Fantayzee","Shiny Shiny"],["yt:UPuXvpkOLmM",276,0,0,100,1988,"Information Society","What's on your mind"],["yt:Us3LemNhFOA",208,0,2,100,1983,"INXS","The One Thing"],["yt:Uvk6DJu26gI",211,0,0,100,1984,"Kenny Loggins","Danger Zone"],["yt:V-mQyRuHIuA",297,0,0,100,1988,"The Church","Under The Milky Way"],["yt:VJYfUS96f6w",264,0,0,100,1989,"Rufus Chaka Khan","Ain't Nobody"],["yt:VPgHbt0ODr4",176,0,0,100,1980,"Adam and The Ants","Stand and Deliver"],["yt:VQzVHs4pn9A",204,0,0,100,1983,"Yello","I Love You"],["yt:VdphvuyaV_I",296,0,3,100,1983,"Billy Idol","Rebel Yell"],["yt:W-NiJ9K4QKM",201,0,0,100,1988,"C. C. Catch","Backseat Of Your Cadillac"],["yt:W0YdJ66fM_c",198,0,0,100,1982,"Total Coelo","Dracula's Tango"],["yt:WANNqr-vcx0",149,0,0,100,1967,"Jefferson Airplane","White Rabbit"],["yt:WGU_4-5RaxU",221,0,0,100,1980,"Blondie","Heart Of Glass"],["yt:WZ-1DYwaxrE",230,0,0,100,1983,"Freez","I.O.U"],["yt:Wn9E5i7l-Eg",257,0,0,100,1988,"Pet Shop Boys","What Have I Done To Deserve This?"],["yt:X2LTL8KgKv8",233,0,0,100,1983,"Corey Hart","Sunglasses At Night"],["yt:XeJLZi0uyJw",220,0,0,100,1984,"Sheila E.","The Glamorous Life"],["yt:Xn-od3KxBZw",144,0,0,100,1965,"Nancy Sinatra","These Boots Are Made For Walking"],["yt:Xuz94ZIPfJk",298,0,0,100,1984,"Bronski Beat","Smalltwon Boy"],["yt:YEZSpj5R5L4",123,0,0,100,1981,"Sandii & The Sunsetz","Alive"],["yt:YPnGPIMUnus",224,0,0,100,1978,"Armi Ja Danny","I Want to Love You Tender"],["yt:YR5ApYxkU-U",361,0,0,100,1979,"Pink Floyd","Another Brick in the Wall"],["yt:YXTor_NUPIE",199,0,0,100,1986,"Radiorama","Vampires"],["yt:YlXtrnh-Ejo",206,0,0,100,1984,"King","Love & Pride"],["yt:Yv0rHDI0ujY",302,0,0,100,1988,"Stevie B","Spring Love"],["yt:Z3OjiZS5GNc",222,0,10,100,1984,"Baby's Gang","Challenger"],["yt:Z61tlxcqaVE",163,0,0,100,1968,"Arthur Brown","Fire"],["yt:ZCM4_5uB1ww",226,0,0,100,1982,"The Fixx","Red Skies"],["yt:ZSjn3CAC5zI",204,0,0,100,1975,"Michael Jackson","Dancing Machine"],["yt:Zc4G8w3Ocbo",198,8,6,100,1983,"Fun Fun","Happy Station"],["yt:ZgPe1MdL7VQ",431,0,0,100,1977,"Voyage","From East To West"],["yt:Zi_XLOBDo_Y",294,0,0,100,1982,"Michael Jackson","Billie Jean"],["yt:ZzEo0z5q-XY",233,0,0,100,1984,"John Rocca","I Want It To Be Real"],["yt:_-0sUuGufmw",220,0,0,100,1983,"Shannon","Let The Music Play"],["yt:_9tOR4On8Uk",258,0,0,100,1981,"Red Rider","Lunatic Fringe"],["yt:_IVp3uqYZZQ",248,0,0,100,1982,"Peter Schilling","Major Tom"],["yt:_JDBu3tRm1E",146,0,0,100,1976,"Ramones","Blitzkrieg Bop"],["yt:_QtJh7Akb7s",285,0,0,100,1981,"Rush","Tom Sawyer"],["yt:_SDvb3cjPQg",208,0,0,100,1985,"Toy Dolls","James Bond Lives Down our Street"],["yt:_UXtort76gY",239,0,0,100,1983,"Berlin","The Metro"],["yt:_r0n9Dv6XnY",219,0,0,100,1985,"Baltimora","Tarzan Boy"],["yt:_w4Xulsjo5I",223,0,0,100,1982,"Falco","Der Kommissar"],["yt:a5N7RNQUKts",202,0,0,100,1986,"Bangles","Walk like an Egyptian"],["yt:aENX1Sf3fgQ",251,0,0,100,1981,"The Police","Every Little Thing She Does Is Magic"],["yt:aH3Q_CZy968",188,0,0,100,1980,"Blondie","Call Me"],["yt:aINmJ5ieM6Y",231,0,0,100,1985,"Stacey Q","Two of Hearts"],["yt:aIxgBMNhsKU",265,0,0,100,1981,"The Plimsouls","A Million Miles Away"],["yt:aNSRdXMMY-M",209,0,0,100,1985,"Muriel Dacq","Tropique"],["yt:aQy5vKAaTuA",226,0,0,100,1983,"Oingo Boingo","Nothing Bad Ever Happens to Me"],["yt:aX1PwkgwsG0",293,0,0,100,1984,"Echo & The Bunnymen","The Killing Moon"],["yt:aeqCqxhxLtc",216,0,0,100,1983,"Burning Sensations","Belly of the Whale"],["yt:ahj093_jkgo",232,0,0,100,1983,"Berlin","Sex"],["yt:avCeJnw9WbQ",178,0,0,100,1990,"Suzanne Vega","Toms Diner"],["yt:ayu2XZ-mFGw",232,14,0,100,1986,"Gene Loves Jezebel","Desire(Come And Get It)"],["yt:azr2ooLlfzQ",272,0,0,100,1982,"Berlin","Masquerade"],["yt:b-98JMMsgPY",192,2,0,100,1984,"The Treacherous Three & Doug E Fresh","Santa's Rap"],["yt:b9xBAtCsCTQ",271,0,0,100,1983,"Trans-X","Living on Video"],["yt:bDbpzjbXUZI",246,0,0,100,1985,"Eddie Murphy","Party All The Time"],["yt:bEea624OBzM",220,0,0,100,1978,"Billy Joel","Big Shot"],["yt:bHoPYLQvnQM",215,0,0,100,1983,"Slade","Run Runaway"],["yt:bKMAaiJWvTw",207,0,0,100,1983,"Flash & The Pan","Waiting For A Train"],["yt:bPjfD8ulnpw",205,0,0,100,1980,"Adam and the Ants","Antmusic"],["yt:b_KBnY-2F4Y",272,0,0,100,1984,"Taxi-Girl","Paris"],["yt:be0mRpzdAT4",257,5,5,100,1985,"Tears For Fears","Head over Heals"],["yt:bo9riZYUpTw",244,0,0,100,1982,"Peter Gabriel","Shock the Monkey"],["yt:c98qdFQF7sw",228,0,0,100,1984,"Alphaville","Big in Japan"],["yt:cDs9zbiumDc",422,0,0,100,1981,"The Police","Spirits in the Material World"],["yt:cVikZ8Oe_XA",202,23,0,100,1983,"Falco","Rock Me Amadeus"],["yt:cjI4p8_NZVc",202,0,0,100,1986,"Bangles","Walk like an Egyptian"],["yt:crbFmpezO4A",276,0,0,100,1987,"Michael Jackson","Leave Me Alone"],["yt:crjlOTkzL80",361,0,0,100,1982,"Daryl Hall & John Oates","Maneater"],["yt:cySnG42s0lE",262,0,0,100,1974,"Elton John","Pinball Wizard"],["yt:d4O1A-mmBWw",207,0,0,100,1982,"Total Coelo","I Eat Cannibals"],["yt:dA5ser7Qgx0",385,0,5,100,1975,"Peter Frampton","Do you feel like I do"],["yt:dHb7_steTDU",325,0,0,100,1979,"Talking Heads","Psychokiller"],["yt:dIQ1TLvQViY",276,0,0,100,1984,"Hall and Oates","Out of Touch"],["yt:dN85Fjwvq-M",278,0,0,100,1983,"Dear Enemy","Computer One"],["yt:dOad0FU9zF8",283,0,0,100,1983,"Jesse Rae","Over The Sea"],["yt:di60NYGu03Y",223,0,0,100,1986,"Pet Shop Boys","Opportunities"],["yt:dsUXAEzaC3Q",260,0,0,100,1987,"Michael Jackson","Beat It"],["yt:e3W6yf6c-FA",304,0,0,100,1982,"Duran Duran","Rio"],["yt:eB1LI9j2btc",239,0,0,100,1989,"The B-52's","Roam"],["yt:eFTLKWw542g",246,0,0,100,1989,"Billy Joel","We Didn't Start The Fire"],["yt:eH3giaIzONA",315,0,0,100,1987,"Whitney Houston","I Wanna Dance With Somebody"],["yt:eKqtVhcRZwU",239,0,0,100,1982,"Patrick Cowley & Paul Parker","Right On Target"],["yt:ePIImGMjn_8",277,0,0,100,1981,"Romeo Void","Never Say Never"],["yt:egDJc1HhiZ4",230,0,0,100,1984,"INXS","Original Sin"],["yt:ejorQVy3m8E",277,0,0,100,1988,"Midnight Oil","Beds Are Burning"],["yt:eomxwZcrvlY",225,0,0,100,1986,"The Cover Girls","Show Me"],["yt:eyCEexG9xjw",235,0,0,100,1982,"Wall Of Voodoo","Mexican Radio"],["yt:f-kfmuGHtxo",223,0,0,100,1983,"JoBoxers","Just Got Lucky"],["yt:fK9hK82r-AM",301,0,0,100,1980,"Frankie Smith","Double Dutch Bus"],["yt:f_-7fqUMuyg",183,0,0,100,1981,"The English Beat","Mirror in the Bathroom"],["yt:fcpj1j31jWc",265,0,0,100,1982,"The Flirts","Passion"],["yt:fdSqpT6gfDU",142,0,0,100,1980,"The Jam","Start"],["yt:ftJZomwDhxQ",269,0,0,100,1983,"New Order","Blue Monday"],["yt:g2BqLlVHlWA",214,3,0,100,1981,"U2","I Will Follow"],["yt:g4dL0lv72oM",201,0,0,100,1979,"The Clash","London Calling"],["yt:gEL4qLmtQ30",181,0,0,100,1979,"The Pretenders","Brass In Pocket"],["yt:gEmJ-VWPDM4",227,0,0,100,1980,"The Vapors","Turning Japanese"],["yt:gHDbv7ZPCE0",237,0,0,100,1984,"Madonna","Borderline"],["yt:gg3FOJNAiks",239,0,0,100,1981,"Psychedelic Furs","Pretty in Pink"],["yt:gudEttJlw3s",209,0,0,100,1981,"Duran Duran","Girls On Film"],["yt:gvlxRvhCB_A",110,0,0,100,1968,"Elvis Presley","A Little Less Conversation"],["yt:hCuMWrfXG4E",203,0,0,100,1984,"Billy Joel","Uptown Girl"],["yt:hFVuuRxM2VU",286,0,0,100,1983,"Culture Club","Miss Me Blind"],["yt:hRqdOyMnnxM",323,0,0,100,1985,"New Order","Perfect Kiss"],["yt:h_D3VFfhvs4",589,0,0,100,1988,"Michael Jackson","Smooth Criminal"],["yt:hqyc37aOqT0",293,6,0,100,1986,"Peter Gabriel","Sledgehammer"],["yt:hrUUKoz8IM0",218,0,0,100,1986,"XTC","Dear God"],["yt:i-j3xITvYQY",282,0,0,100,1973,"Pink Floyd","Money"],["yt:iNOdFQ-BN7o",320,0,0,100,1990,"Los Prisioneros","Tren al Sur"],["yt:iQM8mdpG6qc",277,0,0,100,1984,"Digital Emotion","Go Go Yellow Screen"],["yt:iVWWtqa9-7M",235,0,0,100,1982,"Adam Ant","Desperate But Not Serious"],["yt:iYf_NM_lCLI",142,0,0,100,1980,"Joan Jett And The Runaways","Cherry Bomb"],["yt:iabsOa0LoAo",242,4,0,100,1983,"Howard Devoto","Rainy Season"],["yt:inrEPapTtMM",209,0,0,100,1982,"Joe Jackson","Stepping Out"],["yt:iypUpv9xelg",235,0,0,100,1985,"Oingo Boingo","Dead Man's Party"],["yt:jF_coqVZJwM",204,0,0,100,1977,"Arabesque","Hello Mr. Monkey"],["yt:jItz-uNjoZA",224,0,0,100,1981,"Oingo Boingo","Little Girls"],["yt:jPfCOe8_VEw",320,0,0,100,1986,"Gloria Estefan & Miami Sound Machine","Conga"],["yt:jPj-8_wOZcA",267,5,0,100,1986,"Public Image Ltd.","Rise"],["yt:jUHYLBxmUEw",305,0,0,100,1985,"Thomas Dolby","I Scare Myself"],["yt:j_RcdZzDg3c",226,0,0,100,1983,"Class Action","Weekend"],["yt:jlkarj6uJdE",315,0,0,100,1987,"INXS","The Devil Inside"],["yt:jlsYEuv4rwA",261,0,0,100,1982,"Whodini","Magic's Wand"],["yt:jvG2Jav0uMI",203,0,0,100,1984,"Sylvester","Do You Wanna Funk"],["yt:jztgaereXyI",183,0,0,100,1980,"Lene Lovich","New Toy"],["yt:k6zstmlOjLs",250,0,0,100,1983,"Adam Ant","Puss'N Boots"],["yt:kG4wdAVltmE",209,0,0,100,1989,"Fuzzbox","International Rescue"],["yt:kGnjrTkv1gs",165,0,0,100,1983,"The Smiths","This Charming Man"],["yt:kOnde5c7OG8",255,0,0,100,1982,"Roxy Music","More Than This"],["yt:kvDMlk3kSYg",282,0,0,100,1978,"Boney M","Rasputin"],["yt:kwb9-OlQimc",157,0,0,100,1982,"Culture Club","I'll Tumble 4 Ya"],["yt:kykts8xH8q4",233,0,0,100,1986,"Device","Hanging On A Heart Attack"],["yt:lDK9QqIzhwk",249,0,0,100,1986,"Bon Jovi","Livin' On A Prayer"],["yt:lKVa4O2MuS0",224,0,0,100,1987,"Taylor Dayne","Tell It To My Heart"],["yt:lO_68NFm-BE",223,0,0,100,1983,"Kano","Another Life"],["yt:lTaXtWWR16A",385,0,0,100,1990,"Madonna","Vogue"],["yt:lXInek0kz70",229,0,0,100,1983,"Yes","Owner of a lonely heart"],["yt:lbT2lHtYtEQ",256,0,0,100,1983,"Iron Maiden","The Trooper"],["yt:leohcvmf8kM",259,0,0,100,1989,"The B-52s","Love Shack"],["yt:ljIQo1OHkTI",327,0,0,100,1985,"Simple Minds","Alive And Kicking"],["yt:lyl5DlrsU90",233,0,0,100,1983,"Frankie Goes To Hollywood","Relax"],["yt:m17rt_xo9x0",209,0,12,100,1981,"Missing Persons","Mental Hopscotch"],["yt:m3-hY-hlhBg",273,0,0,100,1985,"Whitney Houston","How Will I Know"],["yt:m8DQzdtPlSQ",134,0,0,100,1983,"Regrets","Je ne veux pas rentrer chez moi seule"],["yt:mXOO7QVHgXs",165,0,0,100,1976,"Heart","Magic Man"],["yt:ml9ZB98EfzY",223,0,0,100,1983,"Ric Ocasek","Something To grab For"],["yt:mlrxyiIVFUU",155,0,0,100,1979,"Jethro Tull","Dun Ringill"],["yt:mmdPQp6Jcdk",249,0,0,100,1964,"The Animals","House of the Rising Sun"],["yt:myPtkun1dPk",232,0,0,100,1989,"Depeche Mode","Personal Jesus"],["yt:n6p5Q6_JBes",260,0,0,100,1983,"Duran Duran","Union Of The Snake"],["yt:n7t7cGwN7_0",200,0,0,100,1980,"The B-52s","Private Idaho"],["yt:ngsZtWFCgAY",227,0,0,100,1982,"George Kranz","Din da da"],["yt:nqh9pKPalWo",236,0,0,100,1982,"Wish Key","Orient Express"],["yt:nv0ENvpaHVQ",233,0,0,100,1983,"Laura Branigan","Gloria"],["yt:o1tj2zJ2Wvg",275,0,0,100,1987,"Guns N' Roses","Welcome To The Jungle"],["yt:oEh5pWjcWCg",159,0,0,100,1981,"Soft Cell","Tainted Love"],["yt:oIb9QUGjdIc",247,4,0,100,1984,"Berlin","No More Words"],["yt:oOg5VxrRTi0",222,0,0,100,1982,"Duran Duran","Hungry Like The Wolf"],["yt:oc-P8oDuS0Q",228,0,0,100,1982,"Dexy's Midnight Runners","Come On Eileen"],["yt:ofkzvM7Skxg",240,0,0,100,1986,"The B-52s","Rock Lobster"],["yt:omfiVkkJ1OU",202,0,0,100,1988,"Inner City","Big Fun"],["yt:p3j2NYZ8FKs",236,0,0,100,1985,"Pet Shop Boys","West End Girls"],["yt:p5PQnngPX00",196,0,0,100,1980,"The Ramones","We Want The Airwaves"],["yt:pEcpwSenouQ",311,0,0,100,1984,"Iron Maiden","Aces High"],["yt:pHCdS7O248g",295,0,0,100,1980,"Blondie","Rapture"],["yt:pIgZ7gMze7A",231,0,0,100,1984,"Wham!","Wake Me Up Before You Go-Go"],["yt:pJrU9RIurFE",267,0,0,100,1983,"Heaven 17","Let Me Go"],["yt:q4-hixGlELw",291,0,0,100,1985,"Propaganda","Duel"],["yt:q68Qwgz1aXQ",150,0,0,100,1973,"Pink Floyd","Run like hell"],["yt:qLl44pj7a70",147,0,0,100,1980,"Plastics","Top Secret Man"],["yt:qdt2DJQ-pyk",209,0,0,100,1983,"QED","Everywhere I Go"],["yt:qkV4-QNxLFM",233,0,0,100,1984,"Depeche Mode","Master and Servant"],["yt:qt0-4FzoNgw",236,0,0,100,1980,"The Angels","Face The Day"],["yt:qxZInIyOBXk",218,0,0,100,1988,"Pat Benatar","We Belong"],["yt:r0qBaBb1Y-U",316,0,0,100,1985,"Phil Collins","Sussudio"],["yt:rDhzZ7jAUKA",231,0,0,100,1983,"Break Machine","Street Dance"],["yt:rJE_Sc1Wags",292,0,0,100,1982,"Eurythmics","Sweet Dreams"],["yt:rNQRfBAzSzo",212,5,0,100,1980,"Queen","Another One Bites The Dust"],["yt:rOM0qqi_pi4",229,0,0,100,1982,"The Pointer Sisters","Jump"],["yt:rVuwXM9u2ps",229,0,0,100,1983,"Spandau Ballet","Gold"],["yt:rmGxh1FhtxE",249,0,0,100,1984,"Thomas Dolby","Hyperactive!"],["yt:rnuC-VpCXuM",166,4,12,100,1980,"The Suburban Lawns","Janitor"],["yt:rwTTGnDcwoA",214,0,0,100,1982,"Junior","Mama Used To Say"],["yt:s86K-p089R8",259,0,0,100,1984,"Bon Jovi","Runaway"],["yt:sOnqjkJTMaA",823,0,0,100,1981,"Michael Jackson","Thriller"],["yt:sV-3Otn_4uQ",197,0,0,100,1977,"Space","Magic Fly"],["yt:sXD43jjG0jQ",216,0,0,100,1978,"Evelyn Champagne King","Shame"],["yt:snsTmi9N9Gs",266,0,0,100,1986,"Madonna","Open Your Heart"],["yt:swQi4CAzmrA",206,0,0,100,1981,"Men At Work","Who Can It Be Now"],["yt:tSNWeXGZMcU",251,0,0,100,1985,"Colonel Abrams","Trapped"],["yt:tgFh4RHgn0A",252,0,0,100,1988,"Billy Idol","White Wedding"],["yt:tkJNyQfAprY",379,0,0,100,1980,"Pink Floyd","Comfortably Numb"],["yt:tnAQRodZNp0",217,0,0,100,1983,"The English Beat","I Confess"],["yt:uIQMTo6ryh8",285,0,0,100,1987,"Echo & The Bunnymen","Lips Like Sugar"],["yt:uPudE8nDog0",206,0,0,100,1982,"The Human League","Don't You Want Me"],["yt:uRo426va26I",244,0,0,100,1983,"Midnight Star","Freak-A-Zoid"],["yt:uXMd6pPobQA",202,0,0,100,1984,"My Mine","Zorro"],["yt:uttV1VZUgQQ",222,0,0,100,1988,"Erasure","Chains of Love"],["yt:uwOMSbmykj8",246,0,0,100,1985,"Ken Laszlo","Tonight"],["yt:v1M55Ux6oUQ",180,0,0,100,1979,"Mistral","Starship 109"],["yt:v7H_gGA7Qr4",91,0,0,100,1983,"Hashim","Al Naafiysh"],["yt:vFTxqMg-OKQ",378,0,0,100,1985,"Falco","Vienna Calling"],["yt:vJChh7ghGnE",297,0,0,100,1983,"Quiet Riot","Bang Your Head"],["yt:vSME53nL8tg",215,0,0,100,1985,"INXS","What You Need"],["yt:vVdyFs576PA",176,13,14,100,1982,"D-Train","Your The One For Me"],["yt:vWz9VN40nCA",224,0,0,100,1981,"Olivia Newton-John","Physical"],["yt:w-NshzYK9y0",223,0,0,100,1983,"Van Halen","Panama"],["yt:wFaIhDLb_NE",215,0,0,100,1981,"Soft Cell","Bed Sitter"],["yt:wccHFyWaoiU",245,0,0,100,1985,"Fancy","Chinese Eyes"],["yt:whSYTSXm8wo",185,0,0,100,1980,"The Jam","Going Underground"],["yt:wlq0lYB3iSM",242,0,0,100,1983,"Van Halen","Jump"],["yt:x1U1Ue_5kq8",232,0,0,100,1985,"Killing Joke","80s"],["yt:x8RKbGgBXSQ",261,0,0,100,1981,"Ultravox","The Voice"],["yt:xG3yGdQYwqg",298,0,0,100,1984,"Julie Brown","Homecoming Queen's got a gun"],["yt:xLFhCOYRf0E",343,0,0,100,1990,"Megadeth","Holy Wars...The Punishment Due"],["yt:xLb9jPuDS9Y",183,0,0,100,1985,"Yello","Oh Yeah"],["yt:xTAjEIzDKMY",219,0,0,100,1983,"Taco","Singin� in the Rain"],["yt:xTzMeDiv-7U",227,0,0,100,1984,"The Fixx","Less Cities, More Moving People"],["yt:xrOek4z32Vg",213,0,0,100,1989,"Fine Young Cannibals","Good Thing"],["yt:xrzX8rIwZUw",230,0,0,100,1984,"Shannon","Give me Tonight"],["yt:y4CyNvEfWoE",215,0,0,100,1982,"Toni Basil","Mickey"],["yt:yURRmWtbTbo",252,0,0,100,1978,"Michael Jackson","Don't Stop 'Til You Get Enough"],["yt:yiy9eOrifS8",270,0,0,100,1982,"Futurisk","Army Now"],["yt:zExFchzV5UQ",225,0,0,100,1981,"OMD","Electricity"],["yt:zJv5qLsLYoo",183,0,0,100,1984,"Dead or Alive","Spin me round"],["yt:zMAe31FFHbo",221,0,0,100,1982,"Naked Eyes","Always Something There"],["yt:zTUR1ohVZfQ",118,3,0,100,1980,"Modernettes","Barbra"],["yt:zU9lv_WqK6k",331,0,0,100,1986,"Genesis","Land of Confusion"],["yt:zaPskhuQWVI",220,0,0,100,1984,"Den Harrow","Mad Desire"],["yt:zeH2Um-yOrA",188,0,0,100,1982,"Vanessa","Upside Down"],["yt:zfytdyMy2-k",207,0,0,100,1979,"Split Enz","I See Red"],["yt:zpiUEbxAMxk",207,0,0,100,1985,"Danse Society","Say It Again"],["yt:zyUZRKNc8jk",207,0,0,100,1987,"Mandy","Positive Reaction"]];// This is for the minimizer
(function(){
// Constants {{
var
  ID = 0,

  // This is the duration of the video minus the offsets in
  // the start and stop, as determined through visual inspection.
  // These are the transitions put on by different uploaders, things
  // like "THIS IS A JJ COOLGUY RIP" etc.
  RUNTIME = 1,
  START = 2,
  STOP = 3,

  // This is for volume normalization on a per video
  // basis
  VOLUME = 4,

  // The year of release
  YEAR = 5,

  ARTIST = 6,

  TITLE = 7,

  NOTES = 8,

  OFFSET = 9,

  // If there is a hash value (there should not be regularly)
  // Then debugging output is turned on, whatever the hell that
  // entails
  DEBUG = location.hash.length > 0,

  // The offset addition was after some toying around and 
  // seeint how long the player took to load. This seemed
  // to work ok; we really want the drift to be as close
  // to 0 as possible.
  YTLOADTIME_sec = 5,

  // According to the docs: "The player does not request 
  // the FLV until playVideo() or seekTo() is called.". In
  // order to combat this, we have to pre-load the video
  // by some increment, we take that to be the YTLOADTIME,
  // multiplied by 1000 because it's expressed in MS
  PRELOAD_ms = YTLOADTIME_sec * 1000,

  LAG_THRESHHOLD = 12,

  // An extra player
  EXTRA = 2,

  NEXTVIDEO_PRELOAD = 3,

  // @ref: http://code.google.com/apis/youtube/flash_api_reference.html
  LEVELS = ["small", "medium", "large"]; //, "hd720", "hd1080", "highres"];

// }} // Constants

// This is for IE
if (typeof console == "undefined") {
  self.console = {log: new Function()}
}

self.indexOf = function(array, item) {
  for(var ix = 0; ix < array.length; ix++) {
    if(array[ix] == item) {
      return ix;
    }
  }
  return -1;
}

// Utils {{
function getNow(offset) {
  return +(new Date() / 1000) + (offset || 0);
}

function remainingTime() {
  if(_player[_active] && _player[_active].getDuration && 'index' in _player[_active]) {
    return Math.max(0,
      _player[_active].getDuration() - 
      _duration[_player[_active].index][STOP] - 
      _player[_active].getCurrentTime()
    );
  } else {
    return 0;
  }
}

function toTime(sec) {
  return [
    Math.floor(sec / 3600),
    (Math.floor(sec / 60) % 60 + 100).toString().substr(1),
    ((Math.floor(sec) % 60) + 100).toString().substr(1)
  ].join(':');
}

function hide(player) {
  if(document.getElementById('player-' + player)) {
    document.getElementById("player-" + player).style.left = "-200%";
  }
}

function show(player) {
  if(document.getElementById('player-' + player)) {
    document.getElementById("player-" + player).style.left = 0;
  }
}

function timer(str) {
  console.log([
      getNow() - _start,
      str
  ].join(' '));
} 

// }} // Utils


// Globals {{
var 
  _active = -1,

  // This the the current playback quality index, which can be triggered
  // in a direction (either up or down) based on how successful we can
  // combat drift (basically by playing without hitting a buffer interval)
  //
  // We start at medium quality and then the skies the limit, I guess.
  _currentLevel = 2,
  
  // The lag counter is a token system that gets set by an interval.  If
  // we accumulate a certain negative or positive balance, then we can exchange
  // the negative or positive units for a quality shift. This makes sure that 
  // we can prove the stability of any setting through successive incremental
  // sampling
  _lagCounter = 0,

  _muted = false,

  _index = -1,
  _lastLoaded,

  _seekTimeout = 0,
  _qualityTimeout = 0,

  _driftcounter = 0,
  _drift,
 
  // The epoch time is based off the system time AND the users
  // local clock.  This makes sure that separate clock drifts
  // are *about* the same ... minus the TTL latency incurred by
  // the emit from the server of course (which we assume to be fairly
  // constant).
  _start = getNow(),
  _epoch = 1325138061 + ( _start - _referenceTime ),

  _bAppend = true,

  // How many of the YT players are loaded
  _loaded = 0,

  // And their associated references
  _player = [],
  _playerById = {},

  _lastTime = 0,

  _next = 0,
  _runtime = 0;

for(var ix = 0; ix < _duration.length; ix++) {
  _duration[ix][OFFSET] = _runtime;
  _runtime += _duration[ix][RUNTIME] - NEXTVIDEO_PRELOAD;
}

// }} // Globals

self.mutetoggle = function(el){
  _muted = !_muted;

  if(_muted) {
    el.src = "images/mute_on_32.png";
    _player[_active].setVolume(0);
  } else {
    el.src = "images/mute_off_32.png";
    var volume = 100;

    if ("index" in _player[_active]) {
      volume = _duration[_player[_active].index][VOLUME];
    }
    _player[_active].setVolume(volume);
  }
}

function secondarySwap(){
  var swapInterval = setInterval(function(){
    if (_playerById[_index].getCurrentTime() < _player[EXTRA].getCurrentTime()) {

      // Nows our time to shine
      _playerById[_index].playVideo();
      if(!_muted) {
        _playerById[_index].setVolume(_duration[_index][VOLUME]);
      }
     
      // Bring the volume up of the higher quality player and mute the current
      _player[EXTRA].setVolume(0);
      _player[EXTRA].stopVideo();

      // Show the higher quality and hide the current one
      hide(EXTRA);
      show(_active);

      // And then clear the polling interval
      clearInterval(swapInterval);
    }
  }, 10);
}

// This sets the quality of the video along with
// supporting going down or up a notch based on
// what is detected, probably in findOffset
function setQuality(direction) {
  var 
    supported = true,

    newQualityIndex = _currentLevel,
    newQualityWord,
                    
    activeAvailable = _playerById[_index].getAvailableQualityLevels().reverse(),
    activeQualityWord = _playerById[_index].getPlaybackQuality();

  // If no video is loaded, then go no further.
  if(activeAvailable.length === 0) {
    return;
  }

  if(direction === -1) {
    _qualityTimeout = 2 * YTLOADTIME_sec + getNow();
  } else if (direction > 0 && getNow() < _qualityTimeout) {
    return;
  }

  // If the lapse has dropped and the direction is specific
  if(direction) {
    newQualityIndex = Math.min(
      Math.max(_currentLevel + direction, 0),
      LEVELS.length
    );
  }

  // Now that we have the destination quality level, we need to see
  // if the current video playing has this quality level.
  newQualityWord = LEVELS[newQualityIndex];

  // If this video doesn't support the destination quality level
  if ( indexOf(activeAvailable, newQualityWord) === -1) {
    console.log("NOT SUPPORTED", newQualityWord, activeAvailable);

    // Use the highest one available (the lower ones are always available)
    // Get the word version of the highest quality available
    newQualityWord = activeAvailable[activeAvailable.length - 1];

    // state that we are downsampling because of an incompatibility
    supported = false;
  }

  // If this new, supported quality isn't the current one set
  if (newQualityWord !== activeQualityWord) {

    console.log("Quality: " + activeQualityWord + " => " + newQualityWord);

    // If we are downsampling then just do it
    if(direction < 0) {
      // we also shuffle the placement forward to accomodate for the change over
      _playerById[_index].seekTo(_playerById[_index].getCurrentTime() + YTLOADTIME_sec);
      _playerById[_index].setPlaybackQuality(newQualityWord);

      // If we are upsampling, then do it seemlessly.
    } else if( 
      _playerById[_index].getDuration() - 
      _duration[_index][STOP] - 
      _playerById[_index].getCurrentTime() > YTLOADTIME_sec * 2.5
    ) {

      // First, load the active video in the extra player,
      // setting the volume to 0
      _player[EXTRA].loadVideoById(
        _duration[_index][ID].split(":")[1], 
        _playerById[_index].getCurrentTime() + YTLOADTIME_sec
      );

      _player[EXTRA].setVolume(0);
      _player[EXTRA].pauseVideo();

      // Set the playback quality of the extra video to the higher
      // quality
      _player[EXTRA].setPlaybackQuality(newQualityWord);

      // Now poll the two time offsets and swap videos when they cross
      var swapInterval = setInterval(function(){

        if (
          (_player[EXTRA].getCurrentTime() > 0) &&
          (_playerById[_index].getCurrentTime() > _player[EXTRA].getCurrentTime())
        ) {
          // Nows our time to shine
          // Start the higher quality player and stop the current one
          _player[EXTRA].playVideo();
          var myplayer = _playerById[_index];
          setTimeout(function(){
            // Show the higher quality and hide the current one
            hide(_active);
            show(EXTRA);

            // Bring the volume up of the higher quality player and mute the current
            if(!_muted) {
              _player[EXTRA].setVolume(_duration[_index][VOLUME]);
            }
            myplayer.setVolume(0);
            myplayer.seekTo(_player[EXTRA].getCurrentTime() + 3.5);
            myplayer.setPlaybackQuality(newQualityWord);
            secondarySwap();
          }, 500);

          // And then clear the polling interval
          clearInterval(swapInterval);
        }
      }, 10);

      // And sEt it as the default, but only if this isn't
      // a forced down-sampling because of available quality
      // limitations.
      if(supported) {
        _currentLevel = indexOf(LEVELS, newQualityWord);
      }
    } 
  }
}

function doTitle(){
  if(_bAppend) {
    document.title = _duration[_index][ARTIST] + " - " + _duration[_index][TITLE] + " | " + toTime(getNow() - _start);
  }
}

function findOffset() {
  var 
    now = getNow(),
    // This is where we should be
    lapse = (now - _epoch) % _runtime;
 
  if(_index === -1) {
    for(
      _index = 0; 
      lapse > _duration[_index][OFFSET] + _duration[_index][RUNTIME];
      _index++
    ); 
    lapse -= _duration[_index][OFFSET];
    transition(_index, lapse);
  } else {
    lapse -= _duration[_index][OFFSET];
  }

  // If the duration has a starting offset, then 
  // we put that here...
  lapse += _duration[_index][START];

  if(_index > -1) {

    _drift = -1;
    if(_index in _playerById) {
      _drift = _playerById[_index].getCurrentTime() - lapse;
    }

    doTitle();
    if(DEBUG && _index in _playerById) {
      var drift;
      if(_drift > 0) {
        drift = "+" + _drift.toFixed(2);
      } else {
        drift = _drift.toFixed(2);
      }

      document.title = " " + [
        drift, 
        _lagCounter, 
        _playerById[_index].getCurrentTime().toFixed(0),
        (_playerById[_index].getCurrentTime() - _duration[_index][RUNTIME]).toFixed(2),
        _index
      ].join('|');
    }
    
    if(_drift > 3 && ++_driftcounter > 7) {
      _playerById[_index].seekTo(_playerById[_index].getCurrentTime() - 3);
    } else if (_drift < 3) {
      _driftcounter = 0;
    }
  }

  if ( _index in _playerById ) {

    if (_duration[_index][RUNTIME] - lapse < YTLOADTIME_sec * 2) {
      transition(
        (_index + 1) % _duration.length, 
        _duration[(_index + 1) % _duration.length][START]
      );
    }

    if ( 
      now > _seekTimeout &&
      _playerById[_index].getCurrentTime() > 0
    ) {

      if ( _lastTime === _playerById[_index].getCurrentTime() ) {
        _lagCounter ++;
      } else {
        _lagCounter --;
      }
      _lastTime = _playerById[_index].getCurrentTime();

      // Make sure that we don't reseek too frequently.
      if(Math.abs(_lagCounter) > LAG_THRESHHOLD) {
        _seekTimeout = now + YTLOADTIME_sec;
      }

      // If we have been buffering for a while, 
      // then we will downsample and shift forward
      if(_lagCounter > LAG_THRESHHOLD && 
        (drift < -YTLOADTIME_sec * 3 && _playerById[_index].getCurrentTime() > 0) 
        ) {
        console.log(_lagCounter, LAG_THRESHHOLD, drift, YTLOADTIME_sec, _index, playerById[_index].getCurrentTime());
        setQuality(-1);
        _lagCounter -= LAG_THRESHHOLD;

        console.log("Seeking:", lapse, _playerById[_index].getCurrentTime());

        // We don't trust seeking to be insanely accurate so we throw an offset
        // on to it to avoid some kind of weird seeking loop.
        _playerById[_index].seekTo(lapse + YTLOADTIME_sec);
      }

      // If our lagcounter is really low, then
      // we have been good and can up the quality at
      // this point
      if(_lagCounter < -LAG_THRESHHOLD) {
        //setQuality(+1);
        _lagCounter += LAG_THRESHHOLD;
      } 
    }
  }
}

// This is the 34 / MTV effect at the beginning (working towards fixing
// issue #8)
function flashChannel(){
  var 
    ix = 0,
    ival = setInterval(function(){
      if(++ix % 2 == 0) {
        document.getElementById("channel").style.display = "none";
        if(ix > 7) {
          clearInterval(ival);
        }
      } else {
        document.getElementById("channel").style.display = "block";
      } 
    }, 1000);
}

self.onYouTubePlayerReady = function(playerId) {
  var id = parseInt(playerId.split('-')[1]);
  _player[ id ] = document.getElementById(playerId);
  timer("player ready");

  if(++_loaded === 1) {
    show(_next);
    findOffset();
    flashChannel();
    setInterval(findOffset, YTLOADTIME_sec * 1000 / 10);

    setTimeout(function(){ 
      loadPlayer(1);
      loadPlayer(2); 
    }, 2000);
  } else {
    hide(id);
  }
}

function transition(index, offset) {
  if(index === _lastLoaded) {
    return;
  }
  _lastLoaded = index;

  // Load the next video prior to actually switching over
  var 
    id = _duration[index][ID],
    proto = id.split(':')[0],
    uuid = id.split(':')[1];

  console.log("Loading: ", id);

  // Offset mechanics are throughout, but placing it here
  // make sure that on first load there isn't some brief beginning
  // of video sequence then a seek.
  _player[_next].loadVideoById(uuid, offset);
  timer("video loaded");
  _player[_next].setVolume(0);
  _player[_next].playVideo();

  setTimeout(function(){
    _player[_next].seekTo(offset);
    // Crank up the volume to the computed normalization
    // level.
    if(_muted) {
      _player[_next].setVolume(0);
    } else {
      _player[_next].setVolume(_duration[index][VOLUME]);
    }
  }, Math.max((remainingTime() - NEXTVIDEO_PRELOAD) * 1000, 0));

  setTimeout(function(){

    // After the PRELOAD_ms interval, then we stop the playing video
    if(_active in _player) {
      _player[_active].stopVideo();
      if("index" in _player[_active]) {
        delete _playerById[_player[_active].index];
      }
    }

    // Toggle the player pointers
    _active = (_active + 1) % 2;
    _next = (_active + 1) % 2;

    // When you toggle the visibility, there is still an annoying spinner.
    // So to avoid this we just "move" the players off screen that aren't
    // being used.
    show(_active);
    hide(_next);
    hide(EXTRA);

    _player[_active].index = index;
    _playerById[index] = _player[_active];

    _index = index;
    setQuality(0);
  }, remainingTime() * 1000);
}

function append(data){
  for(var ix = 0; ix < data.length; ix++) {
    _duration[ix] = [].concat(_duration[ix].slice(0,5), data[ix]);
  }
  _bAppend = true;
  doTitle();
}

function loadPlayer(ix) {
  swfobject.embedSWF("http://www.youtube.com/apiplayer?" + [
    "version=3",
    "enablejsapi=1",
    "playerapiid=player-" + ix
  ].join('&'),  // swfUrl
    "vid" + ix, // id
    "400",      // width
    "300",      // height
    "9",        // [false] version (the flv2 player (flash 8) has ad-free vevo, so we use the old player)
    null,       // express install swf url (we assume you have the flash player)
    null,       // flash vars 

    {
      allowScriptAccess: "always"
    }, // params

    // This little hack forces our small mt80s logo to the bottom left so 
    // the user can click on it at any time.
    {
      wmode: "transparent", 
      id: 'player-' + ix
    }, // attributes

    new Function()                 // yt doesn't do the callbackfunction
  );
}

// Load two players to be transitioned between at a nominal
// resolution ... this is irrelevant as quality will be 
// managed in a more sophisticated manner than size of screen.
loadPlayer(0);
})();