/*!	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/

var swfobject = function() {
	
	var UNDEF = "undefined",
		OBJECT = "object",
		SHOCKWAVE_FLASH = "Shockwave Flash",
		SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
		FLASH_MIME_TYPE = "application/x-shockwave-flash",
		EXPRESS_INSTALL_ID = "SWFObjectExprInst",
		ON_READY_STATE_CHANGE = "onreadystatechange",
		
		win = window,
		doc = document,
		nav = navigator,
		
		plugin = false,
		domLoadFnArr = [main],
		regObjArr = [],
		objIdArr = [],
		listenersArr = [],
		storedAltContent,
		storedAltContentId,
		storedCallbackFn,
		storedCallbackObj,
		isDomLoaded = false,
		isExpressInstallActive = false,
		dynamicStylesheet,
		dynamicStylesheetMedia,
		autoHideShow = true,
	
	/* Centralized function for browser feature detection
		- User agent string detection is only used when no good alternative is possible
		- Is executed directly for optimal performance
	*/	
	ua = function() {
		var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF,
			u = nav.userAgent.toLowerCase(),
			p = nav.platform.toLowerCase(),
			windows = p ? /win/.test(p) : /win/.test(u),
			mac = p ? /mac/.test(p) : /mac/.test(u),
			webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
			ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
			playerVersion = [0,0,0],
			d = null;
		if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
			d = nav.plugins[SHOCKWAVE_FLASH].description;
			if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
				plugin = true;
				ie = false; // cascaded feature detection for Internet Explorer
				d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
				playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
				playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
			}
		}
		else if (typeof win.ActiveXObject != UNDEF) {
			try {
				var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
				if (a) { // a will return null when ActiveX is disabled
					d = a.GetVariable("$version");
					if (d) {
						ie = true; // cascaded feature detection for Internet Explorer
						d = d.split(" ")[1].split(",");
						playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
			}
			catch(e) {}
		}
		return { w3:w3cdom, pv:playerVersion, wk:webkit, ie:ie, win:windows, mac:mac };
	}(),
	
	/* Cross-browser onDomLoad
		- Will fire an event as soon as the DOM of a web page is loaded
		- Internet Explorer workaround based on Diego Perini's solution: http://javascript.nwbox.com/IEContentLoaded/
		- Regular onload serves as fallback
	*/ 
	onDomLoad = function() {
		if (!ua.w3) { return; }
		if ((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body))) { // function is fired after onload, e.g. when script is inserted dynamically 
			callDomLoadFunctions();
		}
		if (!isDomLoaded) {
			if (typeof doc.addEventListener != UNDEF) {
				doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, false);
			}		
			if (ua.ie && ua.win) {
				doc.attachEvent(ON_READY_STATE_CHANGE, function() {
					if (doc.readyState == "complete") {
						doc.detachEvent(ON_READY_STATE_CHANGE, arguments.callee);
						callDomLoadFunctions();
					}
				});
				if (win == top) { // if not inside an iframe
					(function(){
						if (isDomLoaded) { return; }
						try {
							doc.documentElement.doScroll("left");
						}
						catch(e) {
							setTimeout(arguments.callee, 0);
							return;
						}
						callDomLoadFunctions();
					})();
				}
			}
			if (ua.wk) {
				(function(){
					if (isDomLoaded) { return; }
					if (!/loaded|complete/.test(doc.readyState)) {
						setTimeout(arguments.callee, 0);
						return;
					}
					callDomLoadFunctions();
				})();
			}
			addLoadEvent(callDomLoadFunctions);
		}
	}();
	
	function callDomLoadFunctions() {
		if (isDomLoaded) { return; }
		try { // test if we can really add/remove elements to/from the DOM; we don't want to fire it too early
			var t = doc.getElementsByTagName("body")[0].appendChild(createElement("span"));
			t.parentNode.removeChild(t);
		}
		catch (e) { return; }
		isDomLoaded = true;
		var dl = domLoadFnArr.length;
		for (var i = 0; i < dl; i++) {
			domLoadFnArr[i]();
		}
	}
	
	function addDomLoadEvent(fn) {
		if (isDomLoaded) {
			fn();
		}
		else { 
			domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
		}
	}
	
	/* Cross-browser onload
		- Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
		- Will fire an event as soon as a web page including all of its assets are loaded 
	 */
	function addLoadEvent(fn) {
		if (typeof win.addEventListener != UNDEF) {
			win.addEventListener("load", fn, false);
		}
		else if (typeof doc.addEventListener != UNDEF) {
			doc.addEventListener("load", fn, false);
		}
		else if (typeof win.attachEvent != UNDEF) {
			addListener(win, "onload", fn);
		}
		else if (typeof win.onload == "function") {
			var fnOld = win.onload;
			win.onload = function() {
				fnOld();
				fn();
			};
		}
		else {
			win.onload = fn;
		}
	}
	
	/* Main function
		- Will preferably execute onDomLoad, otherwise onload (as a fallback)
	*/
	function main() { 
		if (plugin) {
			testPlayerVersion();
		}
		else {
			matchVersions();
		}
	}
	
	/* Detect the Flash Player version for non-Internet Explorer browsers
		- Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
		  a. Both release and build numbers can be detected
		  b. Avoid wrong descriptions by corrupt installers provided by Adobe
		  c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
		- Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
	*/
	function testPlayerVersion() {
		var b = doc.getElementsByTagName("body")[0];
		var o = createElement(OBJECT);
		o.setAttribute("type", FLASH_MIME_TYPE);
		var t = b.appendChild(o);
		if (t) {
			var counter = 0;
			(function(){
				if (typeof t.GetVariable != UNDEF) {
					var d = t.GetVariable("$version");
					if (d) {
						d = d.split(" ")[1].split(",");
						ua.pv = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
				else if (counter < 10) {
					counter++;
					setTimeout(arguments.callee, 10);
					return;
				}
				b.removeChild(o);
				t = null;
				matchVersions();
			})();
		}
		else {
			matchVersions();
		}
	}
	
	/* Perform Flash Player and SWF version matching; static publishing only
	*/
	function matchVersions() {
		var rl = regObjArr.length;
		if (rl > 0) {
			for (var i = 0; i < rl; i++) { // for each registered object element
				var id = regObjArr[i].id;
				var cb = regObjArr[i].callbackFn;
				var cbObj = {success:false, id:id};
				if (ua.pv[0] > 0) {
					var obj = getElementById(id);
					if (obj) {
						if (hasPlayerVersion(regObjArr[i].swfVersion) && !(ua.wk && ua.wk < 312)) { // Flash Player version >= published SWF version: Houston, we have a match!
							setVisibility(id, true);
							if (cb) {
								cbObj.success = true;
								cbObj.ref = getObjectById(id);
								cb(cbObj);
							}
						}
						else if (regObjArr[i].expressInstall && canExpressInstall()) { // show the Adobe Express Install dialog if set by the web page author and if supported
							var att = {};
							att.data = regObjArr[i].expressInstall;
							att.width = obj.getAttribute("width") || "0";
							att.height = obj.getAttribute("height") || "0";
							if (obj.getAttribute("class")) { att.styleclass = obj.getAttribute("class"); }
							if (obj.getAttribute("align")) { att.align = obj.getAttribute("align"); }
							// parse HTML object param element's name-value pairs
							var par = {};
							var p = obj.getElementsByTagName("param");
							var pl = p.length;
							for (var j = 0; j < pl; j++) {
								if (p[j].getAttribute("name").toLowerCase() != "movie") {
									par[p[j].getAttribute("name")] = p[j].getAttribute("value");
								}
							}
							showExpressInstall(att, par, id, cb);
						}
						else { // Flash Player and SWF version mismatch or an older Webkit engine that ignores the HTML object element's nested param elements: display alternative content instead of SWF
							displayAltContent(obj);
							if (cb) { cb(cbObj); }
						}
					}
				}
				else {	// if no Flash Player is installed or the fp version cannot be detected we let the HTML object element do its job (either show a SWF or alternative content)
					setVisibility(id, true);
					if (cb) {
						var o = getObjectById(id); // test whether there is an HTML object element or not
						if (o && typeof o.SetVariable != UNDEF) { 
							cbObj.success = true;
							cbObj.ref = o;
						}
						cb(cbObj);
					}
				}
			}
		}
	}
	
	function getObjectById(objectIdStr) {
		var r = null;
		var o = getElementById(objectIdStr);
		if (o && o.nodeName == "OBJECT") {
			if (typeof o.SetVariable != UNDEF) {
				r = o;
			}
			else {
				var n = o.getElementsByTagName(OBJECT)[0];
				if (n) {
					r = n;
				}
			}
		}
		return r;
	}
	
	/* Requirements for Adobe Express Install
		- only one instance can be active at a time
		- fp 6.0.65 or higher
		- Win/Mac OS only
		- no Webkit engines older than version 312
	*/
	function canExpressInstall() {
		return !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac) && !(ua.wk && ua.wk < 312);
	}
	
	/* Show the Adobe Express Install dialog
		- Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
	*/
	function showExpressInstall(att, par, replaceElemIdStr, callbackFn) {
		isExpressInstallActive = true;
		storedCallbackFn = callbackFn || null;
		storedCallbackObj = {success:false, id:replaceElemIdStr};
		var obj = getElementById(replaceElemIdStr);
		if (obj) {
			if (obj.nodeName == "OBJECT") { // static publishing
				storedAltContent = abstractAltContent(obj);
				storedAltContentId = null;
			}
			else { // dynamic publishing
				storedAltContent = obj;
				storedAltContentId = replaceElemIdStr;
			}
			att.id = EXPRESS_INSTALL_ID;
			if (typeof att.width == UNDEF || (!/%$/.test(att.width) && parseInt(att.width, 10) < 310)) { att.width = "310"; }
			if (typeof att.height == UNDEF || (!/%$/.test(att.height) && parseInt(att.height, 10) < 137)) { att.height = "137"; }
			doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
			var pt = ua.ie && ua.win ? "ActiveX" : "PlugIn",
				fv = "MMredirectURL=" + win.location.toString().replace(/&/g,"%26") + "&MMplayerType=" + pt + "&MMdoctitle=" + doc.title;
			if (typeof par.flashvars != UNDEF) {
				par.flashvars += "&" + fv;
			}
			else {
				par.flashvars = fv;
			}
			// IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
			// because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			if (ua.ie && ua.win && obj.readyState != 4) {
				var newObj = createElement("div");
				replaceElemIdStr += "SWFObjectNew";
				newObj.setAttribute("id", replaceElemIdStr);
				obj.parentNode.insertBefore(newObj, obj); // insert placeholder div that will be replaced by the object element that loads expressinstall.swf
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						obj.parentNode.removeChild(obj);
					}
					else {
						setTimeout(arguments.callee, 10);
					}
				})();
			}
			createSWF(att, par, replaceElemIdStr);
		}
	}
	
	/* Functions to abstract and display alternative content
	*/
	function displayAltContent(obj) {
		if (ua.ie && ua.win && obj.readyState != 4) {
			// IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
			// because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
			var el = createElement("div");
			obj.parentNode.insertBefore(el, obj); // insert placeholder div that will be replaced by the alternative content
			el.parentNode.replaceChild(abstractAltContent(obj), el);
			obj.style.display = "none";
			(function(){
				if (obj.readyState == 4) {
					obj.parentNode.removeChild(obj);
				}
				else {
					setTimeout(arguments.callee, 10);
				}
			})();
		}
		else {
			obj.parentNode.replaceChild(abstractAltContent(obj), obj);
		}
	} 

	function abstractAltContent(obj) {
		var ac = createElement("div");
		if (ua.win && ua.ie) {
			ac.innerHTML = obj.innerHTML;
		}
		else {
			var nestedObj = obj.getElementsByTagName(OBJECT)[0];
			if (nestedObj) {
				var c = nestedObj.childNodes;
				if (c) {
					var cl = c.length;
					for (var i = 0; i < cl; i++) {
						if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
							ac.appendChild(c[i].cloneNode(true));
						}
					}
				}
			}
		}
		return ac;
	}
	
	/* Cross-browser dynamic SWF creation
	*/
	function createSWF(attObj, parObj, id) {
		var r, el = getElementById(id);
		if (ua.wk && ua.wk < 312) { return r; }
		if (el) {
			if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
				attObj.id = id;
			}
			if (ua.ie && ua.win) { // Internet Explorer + the HTML object element + W3C DOM methods do not combine: fall back to outerHTML
				var att = "";
				for (var i in attObj) {
					if (attObj[i] != Object.prototype[i]) { // filter out prototype additions from other potential libraries
						if (i.toLowerCase() == "data") {
							parObj.movie = attObj[i];
						}
						else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							att += ' class="' + attObj[i] + '"';
						}
						else if (i.toLowerCase() != "classid") {
							att += ' ' + i + '="' + attObj[i] + '"';
						}
					}
				}
				var par = "";
				for (var j in parObj) {
					if (parObj[j] != Object.prototype[j]) { // filter out prototype additions from other potential libraries
						par += '<param name="' + j + '" value="' + parObj[j] + '" />';
					}
				}
				el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
				objIdArr[objIdArr.length] = attObj.id; // stored to fix object 'leaks' on unload (dynamic publishing only)
				r = getElementById(attObj.id);	
			}
			else { // well-behaving browsers
				var o = createElement(OBJECT);
				o.setAttribute("type", FLASH_MIME_TYPE);
				for (var m in attObj) {
					if (attObj[m] != Object.prototype[m]) { // filter out prototype additions from other potential libraries
						if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							o.setAttribute("class", attObj[m]);
						}
						else if (m.toLowerCase() != "classid") { // filter out IE specific attribute
							o.setAttribute(m, attObj[m]);
						}
					}
				}
				for (var n in parObj) {
					if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // filter out prototype additions from other potential libraries and IE specific param element
						createObjParam(o, n, parObj[n]);
					}
				}
				el.parentNode.replaceChild(o, el);
				r = o;
			}
		}
		return r;
	}
	
	function createObjParam(el, pName, pValue) {
		var p = createElement("param");
		p.setAttribute("name", pName);	
		p.setAttribute("value", pValue);
		el.appendChild(p);
	}
	
	/* Cross-browser SWF removal
		- Especially needed to safely and completely remove a SWF in Internet Explorer
	*/
	function removeSWF(id) {
		var obj = getElementById(id);
		if (obj && obj.nodeName == "OBJECT") {
			if (ua.ie && ua.win) {
				obj.style.display = "none";
				(function(){
					if (obj.readyState == 4) {
						removeObjectInIE(id);
					}
					else {
						setTimeout(arguments.callee, 10);
					}
				})();
			}
			else {
				obj.parentNode.removeChild(obj);
			}
		}
	}
	
	function removeObjectInIE(id) {
		var obj = getElementById(id);
		if (obj) {
			for (var i in obj) {
				if (typeof obj[i] == "function") {
					obj[i] = null;
				}
			}
			obj.parentNode.removeChild(obj);
		}
	}
	
	/* Functions to optimize JavaScript compression
	*/
	function getElementById(id) {
		var el = null;
		try {
			el = doc.getElementById(id);
		}
		catch (e) {}
		return el;
	}
	
	function createElement(el) {
		return doc.createElement(el);
	}
	
	/* Updated attachEvent function for Internet Explorer
		- Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
	*/	
	function addListener(target, eventType, fn) {
		target.attachEvent(eventType, fn);
		listenersArr[listenersArr.length] = [target, eventType, fn];
	}
	
	/* Flash Player and SWF content version matching
	*/
	function hasPlayerVersion(rv) {
		var pv = ua.pv, v = rv.split(".");
		v[0] = parseInt(v[0], 10);
		v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
		v[2] = parseInt(v[2], 10) || 0;
		return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
	}
	
	/* Cross-browser dynamic CSS creation
		- Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
	*/	
	function createCSS(sel, decl, media, newStyle) {
		if (ua.ie && ua.mac) { return; }
		var h = doc.getElementsByTagName("head")[0];
		if (!h) { return; } // to also support badly authored HTML pages that lack a head element
		var m = (media && typeof media == "string") ? media : "screen";
		if (newStyle) {
			dynamicStylesheet = null;
			dynamicStylesheetMedia = null;
		}
		if (!dynamicStylesheet || dynamicStylesheetMedia != m) { 
			// create dynamic stylesheet + get a global reference to it
			var s = createElement("style");
			s.setAttribute("type", "text/css");
			s.setAttribute("media", m);
			dynamicStylesheet = h.appendChild(s);
			if (ua.ie && ua.win && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
				dynamicStylesheet = doc.styleSheets[doc.styleSheets.length - 1];
			}
			dynamicStylesheetMedia = m;
		}
		// add style rule
		if (ua.ie && ua.win) {
			if (dynamicStylesheet && typeof dynamicStylesheet.addRule == OBJECT) {
				dynamicStylesheet.addRule(sel, decl);
			}
		}
		else {
			if (dynamicStylesheet && typeof doc.createTextNode != UNDEF) {
				dynamicStylesheet.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
			}
		}
	}
	
	function setVisibility(id, isVisible) {
		if (!autoHideShow) { return; }
		var v = isVisible ? "visible" : "hidden";
		if (isDomLoaded && getElementById(id)) {
			getElementById(id).style.visibility = v;
		}
		else {
			createCSS("#" + id, "visibility:" + v);
		}
	}

	/* Filter to avoid XSS attacks
	*/
	function urlEncodeIfNecessary(s) {
		var regex = /[\\\"<>\.;]/;
		var hasBadChars = regex.exec(s) != null;
		return hasBadChars && typeof encodeURIComponent != UNDEF ? encodeURIComponent(s) : s;
	}
	
	/* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
	*/
	var cleanup = function() {
		if (ua.ie && ua.win) {
			window.attachEvent("onunload", function() {
				// remove listeners to avoid memory leaks
				var ll = listenersArr.length;
				for (var i = 0; i < ll; i++) {
					listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
				}
				// cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
				var il = objIdArr.length;
				for (var j = 0; j < il; j++) {
					removeSWF(objIdArr[j]);
				}
				// cleanup library's main closures to avoid memory leaks
				for (var k in ua) {
					ua[k] = null;
				}
				ua = null;
				for (var l in swfobject) {
					swfobject[l] = null;
				}
				swfobject = null;
			});
		}
	}();
	
	return {
		/* Public API
			- Reference: http://code.google.com/p/swfobject/wiki/documentation
		*/ 
		registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr, callbackFn) {
			if (ua.w3 && objectIdStr && swfVersionStr) {
				var regObj = {};
				regObj.id = objectIdStr;
				regObj.swfVersion = swfVersionStr;
				regObj.expressInstall = xiSwfUrlStr;
				regObj.callbackFn = callbackFn;
				regObjArr[regObjArr.length] = regObj;
				setVisibility(objectIdStr, false);
			}
			else if (callbackFn) {
				callbackFn({success:false, id:objectIdStr});
			}
		},
		
		getObjectById: function(objectIdStr) {
			if (ua.w3) {
				return getObjectById(objectIdStr);
			}
		},
		
		embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn) {
			var callbackObj = {success:false, id:replaceElemIdStr};
			if (ua.w3 && !(ua.wk && ua.wk < 312) && swfUrlStr && replaceElemIdStr && widthStr && heightStr && swfVersionStr) {
				setVisibility(replaceElemIdStr, false);
				addDomLoadEvent(function() {
					widthStr += ""; // auto-convert to string
					heightStr += "";
					var att = {};
					if (attObj && typeof attObj === OBJECT) {
						for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
							att[i] = attObj[i];
						}
					}
					att.data = swfUrlStr;
					att.width = widthStr;
					att.height = heightStr;
					var par = {}; 
					if (parObj && typeof parObj === OBJECT) {
						for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
							par[j] = parObj[j];
						}
					}
					if (flashvarsObj && typeof flashvarsObj === OBJECT) {
						for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
							if (typeof par.flashvars != UNDEF) {
								par.flashvars += "&" + k + "=" + flashvarsObj[k];
							}
							else {
								par.flashvars = k + "=" + flashvarsObj[k];
							}
						}
					}
					if (hasPlayerVersion(swfVersionStr)) { // create SWF
						var obj = createSWF(att, par, replaceElemIdStr);
						if (att.id == replaceElemIdStr) {
							setVisibility(replaceElemIdStr, true);
						}
						callbackObj.success = true;
						callbackObj.ref = obj;
					}
					else if (xiSwfUrlStr && canExpressInstall()) { // show Adobe Express Install
						att.data = xiSwfUrlStr;
						showExpressInstall(att, par, replaceElemIdStr, callbackFn);
						return;
					}
					else { // show alternative content
						setVisibility(replaceElemIdStr, true);
					}
					if (callbackFn) { callbackFn(callbackObj); }
				});
			}
			else if (callbackFn) { callbackFn(callbackObj);	}
		},
		
		switchOffAutoHideShow: function() {
			autoHideShow = false;
		},
		
		ua: ua,
		
		getFlashPlayerVersion: function() {
			return { major:ua.pv[0], minor:ua.pv[1], release:ua.pv[2] };
		},
		
		hasFlashPlayerVersion: hasPlayerVersion,
		
		createSWF: function(attObj, parObj, replaceElemIdStr) {
			if (ua.w3) {
				return createSWF(attObj, parObj, replaceElemIdStr);
			}
			else {
				return undefined;
			}
		},
		
		showExpressInstall: function(att, par, replaceElemIdStr, callbackFn) {
			if (ua.w3 && canExpressInstall()) {
				showExpressInstall(att, par, replaceElemIdStr, callbackFn);
			}
		},
		
		removeSWF: function(objElemIdStr) {
			if (ua.w3) {
				removeSWF(objElemIdStr);
			}
		},
		
		createCSS: function(selStr, declStr, mediaStr, newStyleBoolean) {
			if (ua.w3) {
				createCSS(selStr, declStr, mediaStr, newStyleBoolean);
			}
		},
		
		addDomLoadEvent: addDomLoadEvent,
		
		addLoadEvent: addLoadEvent,
		
		getQueryParamValue: function(param) {
			var q = doc.location.search || doc.location.hash;
			if (q) {
				if (/\?/.test(q)) { q = q.split("?")[1]; } // strip question mark
				if (param == null) {
					return urlEncodeIfNecessary(q);
				}
				var pairs = q.split("&");
				for (var i = 0; i < pairs.length; i++) {
					if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
						return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
					}
				}
			}
			return "";
		},
		
		// For internal usage only
		expressInstallCallback: function() {
			if (isExpressInstallActive) {
				var obj = getElementById(EXPRESS_INSTALL_ID);
				if (obj && storedAltContent) {
					obj.parentNode.replaceChild(storedAltContent, obj);
					if (storedAltContentId) {
						setVisibility(storedAltContentId, true);
						if (ua.ie && ua.win) { storedAltContent.style.display = "block"; }
					}
					if (storedCallbackFn) { storedCallbackFn(storedCallbackObj); }
				}
				isExpressInstallActive = false;
			} 
		}
	};
}();
//
// EvDa Events and Data v1.0
// https://github.com/kristopolous/EvDa
//
// Copyright 2011, Chris McKenzie
// Dual licensed under the MIT or GPL Version 2 licenses.
//
function EvDa (imported) {
  var 
    BASE = '__base',
    slice = Array.prototype.slice,  
    toString = Object.prototype.toString,
    isArray = [].isArray || function(obj) { return toString.call(obj) === '[object Array]' },
    isFunction = function(obj) { return !!(obj && obj.constructor && obj.call && obj.apply) },
    isString = function(obj) { return !!(obj === '' || (obj && obj.charCodeAt && obj.substr)) },
    isNumber = function(obj) { return toString.call(obj) === '[object Number]' },
    isObject = function(obj) {
      if(isString(obj)) {
        return false;
      }

      return obj == null ? 
        String( obj ) == 'object' : 
        toString.call(obj) === '[object Object]' || true ;
    },

    toArray = function(obj) {
      return slice.call(obj);
    },

    each = [].forEach ?
      function (obj, cb) {
        if (isArray(obj) || obj.length) { 
          toArray(obj).forEach(cb);
        } else {
          for( var key in obj ) {
            cb(key, obj[key]);
          }
        }
      } :

      function (obj, cb) {
        if (isArray(obj)) {
          for ( var i = 0, len = obj.length; i < len; i++ ) { 
            cb(obj[i], i);
          }
        } else {
          for( var key in obj ) {
            cb(key, obj[key]);
          }
        }
      },

    last = function(obj) {
      return obj.length ? obj[obj.length - 1] : undefined;
    },

    keys = ({}).keys || function (obj) {
      if(isArray(obj)) { 
        return obj;
      }
      var ret = [];

      for(var key in obj) {
        ret.push(key);
      }

      return ret;
    },

    without = function(collection, item) {
      var ret = [];
      each(collection, function(which) {
        if(which !== item) {
          ret.push(which);
        }
      });
      return ret;
    },

    uniq = function(obj) {
      var 
        old, 
        ret = [];

      each(keys(obj).sort(), function(which) {
        if(which != old) {
          old = which;
          ret.push(which);
        }
      });
      return ret;
    },

    select = function(obj, test) {
      var ret = [];
      each(obj, function(which) {
        if(test(which)) { ret.push (which); }
      });
      return ret;
    },

    size = function(obj) {
      return (obj && 'length' in obj) ? obj.length : 0;
    },

    map = [].map ?
      function(array, cb) { 
        return array.map(cb) 
      } : 

      function(array, cb) {
        var ret = [];

        for ( var i = 0, len = array.length; i < len; i++ ) { 
          ret.push(cb(array[i], i));
        }

        return ret;
      },

    clone = function(obj) {
      if(isArray(obj)) { return slice.call(obj); }
      if(isObject(obj)) { return extend(obj, {}); }
      return obj;
    },

    extend = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (source[prop] !== void 0) {
            obj[prop] = source[prop];
          }
        }
      });
      return obj;
    },

    // Constants
    ON = 'on',
    AFTER = 'after',

    // The one time callback gets a property to
    // the end of the object to notify our future-selfs
    // that we ought to remove the function.
    ONCE = {once: 1},

    // Internals
    data = imported || {},
    setterMap = {},
    eventMap = {};

  // This is the main invocation function. After
  // you declare an instance and call that instance
  // as a function, this is what gets run.
  function pub ( scope, value, meta ) {
    // If there was one argument, then this is
    // either a getter or the object style
    // invocation.
    if ( arguments.length == 1 ) {

      // The object style invocation will return
      // handles associated with all the keys that
      // went in. There *could* be a mix and match
      // of callbacks and setters, but that would
      // be fine I guess...
      if( isObject(scope) ) {
        var ret = {};

        // Object style should be executed as a transaction
        // to avoid ordinals of the keys making a substantial
        // difference in the existence of the values
        each( scope, function( _key, _value ) {
          ret[_key] = pub ( _key, _value, meta, 0, 1 );
        });

        // After the callbacks has been bypassed, then we
        // run all of them a second time, this time the
        // dependency graphs from the object style transactional
        // invocation should be satisfied
        each( ret, function( _key, _value ) {
          if(isFunction(ret[_key]) && !isFunction(scope[_key])) {
            scope[_key] = ret[_key]();
          }
        });

        return scope;
      } else if (isArray(scope)) {
        return map(scope, function(which) {
          return pub(which, value, meta);
        });
      }

      return data[ scope ];
    } 

    // If there were two arguments and if one of them was a function, then
    // this needs to be registered.  Otherwise, we are setting a value.
    return pub [ isFunction ( value ) ? ON : 'set' ].apply(this, arguments);
  }

  // Register callbacks for
  // test, on, and after.
  each ( [ON, AFTER, 'test'], function ( stage ) {

    // register the function
    pub[stage] = function ( key, callback, meta ) {
      if ( !callback ) {
        callback = key;
        key = BASE;
      }

      // This is the back-reference map to this callback
      // so that we can unregister it in the future.
      (callback.$ || (callback.$ = [])).push ( stage + key );

      (eventMap[stage + key] || (eventMap[stage + key] = [])).push ( callback );

      return extend(callback, meta);
    }
  });

  function del ( handle ) {
    each ( handle.$, function( stagekey ) {
      eventMap[ stagekey ] = without( eventMap[ stagekey ], handle );
    });
  }

  function isset ( key, callback ) {
    if( isObject(key) ) {

      each( key, function( _key, _value ) {
        key[_key] = isset( _key, _value );
      });

      return key;
    }

    // If I know how to set this key but
    // I just haven't done it yet, run through
    // those functions now.

    if( setterMap[key] ) {
      setterMap[key]();

      // This is functionally the same as a delete
      // for our purposes.  Also, this should not
      // grow enormous so it's an inexpensive 
      // optimization.
      setterMap[key] = 0;
    }

    if ( callback ) {
      return key in data ?
        callback ( data[key] ) :
        pub ( key, callback, ONCE );
    }

    return key in data;
  };

  extend(pub, {
    // Exposing the internal variables so that
    // extensions can be made.
    list: {},
    db: data,
    events: eventMap,
    del: del,
    isset: isset,

    // Unlike much of the reset of the code,
    // setters have single functions.
    setter: function ( key, callback ) {
      setterMap[key] = callback;

      if (eventMap[ON + key]) {
        isset( key );
      }
    },

    incr: function ( key ) {
      // we can't use the same trick here because if we
      // hit 0, it will auto-increment to 1
      return pub.set ( key, isNumber(data[key]) ? (data[key] + 1) : 1 );
    },

    decr: function ( key ) {
      // if key isn't in data, it returns 0 and sets it
      // if key is in data but isn't a number, it returns NaN and sets it
      // if key is 1, then it gets reduced to 0, getting 0,
      // if key is any other number, than it gets set
      return pub.set ( key, data[key] - 1 || 0 );
    },

    // If we are pushing and popping a non-array then
    // it's better that the browser tosses the error
    // to the user than we try to be graceful and silent
    // Therein, we don't try to handle input validation
    // and just try it anyway
    push: function ( key, value ) {
      if (size(arguments) == 1) {
        value = key;
        key = BASE;
      }

      return pub.set ( key, [].concat(data[key] || [], [value]) );
    },

    pop: function ( key ) {
      return pub.set ( key || BASE, data[key].slice(0, -1) );
    },

    group: function ( list ) {
      var 
        opts = toArray(arguments),
        list = opts.shift(),
        ret = pub.apply(0, opts);

      ( pub.list[list] || (pub.list[list] = []) );

      if(isFunction(ret)) {
        pub.list[list].push(ret);
      } else {
        each(ret, function(value, key) {
          pub.list[list].push(value);
        });
      } 
      return function() {
        return pub.group.apply(0, [list].concat(toArray(arguments)));
      }
    },

    set: function (key, value, _meta, bypass, _noexecute) {
      var 
        testKey = 'test' + key,
        times = size(eventMap[ testKey ]),
        failure,

        // Invoke will also get done
        // but it will have no semantic
        // meaning, so it's fine.
        meta = {
          meta: _meta || {},
          old: clone(data[key]),
          key: key,
          done: function ( ok ) {
            failure |= (ok === false);

            if ( ! --times ) {
              if ( ! failure ) { 
                pub.set ( key, value, _meta, 1 );
              }
            }
          }
        };

      if (times && !bypass) {
        each ( eventMap[ testKey ], function ( callback ) {
          callback ( value, meta );
        });
      } else {
        // Set the key to the new value.
        // The old value is beind passed in
        // through the meta
        data[key] = value;

        var cback = function(){
          each(
            (eventMap[ON + key] || []).concat
            (eventMap[AFTER + key] || []), 
            function(callback) {

              if(!callback.S) {
                callback ( value, meta );

                if ( callback.once ) {
                  del ( callback );
                }
              }
            });
          return value;
        }

        if(!_noexecute) {
          return cback();
        } else {
          return cback;
        }
      }

      return value;
    },

    once: function ( key, lambda ) {
      return pub ( key, lambda, { once: true } );
    },

    enable: function ( listName ) {
      each(pub.list[listName], function(callback) {
        if ( callback.S && callback.S[listName] ) {
          delete callback.S[listName];
        }

        if ( size(callback.S) == 0 ) {
          delete callback.S;
        }
      });
    },

    setadd: function ( key, value ) {
      return pub ( key, uniq(( data[key] || [] ).concat([value])) );
    },

    setdel: function ( key, value ) {
      return pub ( key, without(( data[key] || [] ), value) );
    },

    disable: function ( listName ) {
      each(pub.list[listName], function(callback) {
        ( callback.S || (callback.S = {}) ) [ listName ] = true;
      });
    },

    unset: function () { 
      each(arguments, function(which) {
        delete data[which];
      });
    },

    find: function ( regex ) {
      return select( keys(data), function(toTest) {
        return toTest.match(regex);
      });
    },

    added: function(key, callback) {
      if( !callback ) {
        callback = key;
        key = BASE;
      }

      pub.on(key, function(value, meta) {
        var 
          newlen = size(value),
          oldlen = size(meta.old);
        
        if(newlen - oldlen == 1) {
          callback(last(value));
        } else if (newlen > oldlen) { 
          callback(toArray(value).slice(oldlen));
        }
      });
    },

    sniff: function () {
      pub.set_ = pub.set;
      var ignoreMap = {};

      pub.set = function() {
        var args = Array.prototype.slice.call(arguments);

        if(!ignoreMap[args[0]]) {
          console.log(+new Date(), args);
        }

        pub.set_.apply (this, args);
      }

      // neuter this function but don't populate
      // the users keyspace.
      pub.sniff = function(key) {
        if(key) {
          ignoreMap[key] = !ignoreMap[key];
          return "[Un]ignoring " + key;
        } else {
          console.log(keys(ignoreMap));
        }
      }
    }
  });

  pub.change = pub.on;
  pub.add = pub.push;

  return pub;
}
//
// db.js Javascript Database 0.0.1
// https://github.com/kristopolous/db.js
//
// Copyright 2011, Chris McKenzie
// Dual licensed under the MIT or GPL Version 2 licenses.
//
(function(){

  var 
    // undefined
    _u,

    // prototypes and short cuts
    slice = Array.prototype.slice,  
    toString = Object.prototype.toString,

    // system caches
    _orderCache = {},

    _compProto = {},

    // For computing set differences
    _stainID = 0,

    // type checking system
    _ = {
      // from underscore.js {
      isFun: function(obj) { return !!(obj && obj.constructor && obj.call && obj.apply) },
      isStr: function(obj) { return !!(obj === '' || (obj && obj.charCodeAt && obj.substr)) },
      isNum: function(obj) { return toString.call(obj) === '[object Number]' },
      isArr: [].isArray || function(obj) { return toString.call(obj) === '[object Array]' },
      // } end underscore.js
      // from jquery 1.5.2's type
      isObj: function( obj ){
        return obj == null ? 
          String( obj ) == 'object' : 
          toString.call(obj) === '[object Object]' || true ;
      }
    },

    // functions that may have native shortcuts
    indexOf = [].indexOf ? 
      function(array, item) { 
        return array.indexOf(item) 
      } :

      function(array, item) {
        for(var i = array.length - 1; 
          (i != -1) && (item != array[i]);
          i--
        );

        return i;
      },

    keys = ({}).keys || function (obj) {
      var ret = [];

      for(var key in obj) {
        ret.push(key);
      }

      return ret;
    },

    map = [].map ?
      function(array, cb) { 
        return array.map(cb) 
      } : 

      function(array, cb) {
        var ret = [];

        for ( var i = 0, len = array.length; i < len; i++ ) { 
          ret.push(cb(array[i], i));
        }

        return ret;
      },

    // each is a complex one
    each = [].forEach ?
      function (obj, cb) {
        if (_.isArr(obj)) { 
          obj.forEach(cb);
        } else {
          for( var key in obj ) {
            cb(key, obj[key]);
          }
        }
      } :

      function (obj, cb) {
        if (_.isArr(obj)) {
          for ( var i = 0, len = obj.length; i < len; i++ ) { 
            cb(obj[i], i);
          }
        } else {
          for( var key in obj ) {
            cb(key, obj[key]);
          }
        }
     };
   

  function hash(array) {
    var ret = {};

    each(array, function(index) {
      ret[index] = true;
    });

    return ret;
  }

  function print(arg) {
    if(_.isStr(arg)) {
      return '"' + arg.replace(/\"/g, '\\\"') + '"';
    } else if(_.isNum(arg)) {
      return arg;
    } else if(_.isArr(arg)) {
      return '[' + arg.map(function(param) { return print(param) }).join(',') + ']';
    }
  }

  // We create basic comparator prototypes to avoid evals
  each('< <= > >= == === != !=='.split(' '), function(which) {
    _compProto[which] = Function(
      'rhs',
      'return function(x){return x' + which + 'rhs}'
    )
  });

  function trace(obj, cb) {
    obj.__$$tracer$$__ = {};

    each(obj, function(key, value) {
      if(_.isFun(value)) {
        obj.__$$tracer$$__[key] = value;
        obj[key] = function() {
          console.log.apply(this, [key + ":" ].concat(slice.call(arguments)));
          if(cb) { cb.apply(this, arguments); }
          return obj.__$$tracer$$__[key].apply(this, arguments);
        }
      }
    });
  }

  // The first parameter, if exists, is assumed to be the value in the database,
  // which has a content of arrays, to search.
  // The second parameter is the index to search
  function has(param1, param2) {
    var 
      len = arguments.length,
      compare = len == 1 ? param1 : param2,
      callback,
      obj = {};

    if(_.isArr(compare)) {
      var len = compare.length;

      // This becomes O(N * M)
      callback = function(key) {
        for(var ix = 0; ix < len; ix++) {
          if (indexOf(key, compare[ix]) > -1) {
            return true;
          }
        }
        return false;
      }
    } else {
      // This is O(N)
      callback = function(key) {
        return indexOf(key, compare) > -1;
      }
    }

    if(len == 2) {
      obj = {};
      obj[param1] = callback;
      return obj;
    } else {
      return callback;
    }
  }

  function simplecopy(obj) {
    // we need to call slice for array-like objects, such as the dom
    return obj.length ? slice.call(obj) : values(obj);
  }

  function find() {
    var 
      filterList = slice.call(arguments),
      filter,
      filterIx,

      which,
      val,

      // The indices
      end,
      spliceix,
      ix,

      // The dataset to compare against
      set = simplecopy(_.isArr(this) ? this : filterList.shift());

    if( filterList.length == 2 && _.isStr( filterList[0] )) {
      // This permits find(key, value)
      which = {};
      which[filterList[0]] = filterList[1];
      filterList = [deepcopy(which)];
    } 

    for(filterIx = 0; filterIx < filterList.length; filterIx++) {
      filter = filterList[filterIx];

      if(_.isFun(filter)) {
        var callback = filter.single || filter;

        for(end = set.length, ix = end - 1; ix >= 0; ix--) {
          which = set[ix];
          if(!callback(which)) { continue }

          if(end - (ix + 1)) {
            spliceix = ix + 1;
            set.splice(spliceix, end - spliceix);
          }
          end = ix;
        }

        spliceix = ix + 1;
        if(end - spliceix) {
          set.splice(spliceix, end - spliceix);
        }
      } else {
        each(filter, function(key, value) {

          if( _.isFun(value)) {
            for(end = set.length, ix = end - 1; ix >= 0; ix--) {
              which = set[ix];

              // Check for existence
              if( key in which ) {
                val = which[key];

                // Permit mutator events
                if( _.isFun(val) ) { val = val(); }

                if( ! value(val, which) ) { continue }

                if(end - (ix + 1)) {
                  spliceix = ix + 1;
                  set.splice(spliceix, end - spliceix);
                }

                end = ix;
              }
            }

          } else {
            for(end = set.length, ix = end - 1; ix >= 0; ix--) {
              which = set[ix];

              val = which[key];

              if( _.isFun(val) ) { val = val(); }

              // Check for existence
              if( ! (key in which && val === value ) ) {
                continue;
              }

              if(end - (ix + 1)) {
                spliceix = ix + 1;
                set.splice(spliceix, end - spliceix);
              }
              end = ix;
            }
          }

          spliceix = ix + 1;
          if(end - spliceix) {
            set.splice(spliceix, end - spliceix);
          }
        });
      }
    }

    set.first = set[0];
    set.last = set[set.length - 1];

    return set;
  }

  //
  // missing
  //
  // Missing is to get records that have keys not defined
  //
  function missing() {
    var fieldList = hash(slice.call(arguments));

    return function(record) {
      for(var field in fieldList) {
        if(field in record) {
          return false;
        }
      }
      return true;
    };
  }

  // 
  // isin
  //
  // This is like the SQL "in" operator, which is a reserved JS word.  You can invoke it either
  // with a static array or a callback
  var isin = (function() {
    // It has a cache for optimization
    var cache = {};

    return function (param1, param2) {
      var 
        callback,
        len = arguments.length,
        compare = len == 1 ? param1 : (param2 || []),
        obj = {};

      // If the second argument is an array then we assume that we are looking
      // to see if the value in the database is part of the user supplied funciton
      if(!_.isArr(compare)) {
        throw new TypeError("isin's argument is wrong. ", compare);
      }
      if(compare.length){
        if(compare.length < 20 && _.isNum(compare[0])) {
          var key = compare.join(',');

          // new Function is faster then eval but it's still slow, so we cache
          // the output of them and then pass them down the pipe if we need them
          // again
          if(! cache[key]) {
            callback = cache[key] = new Function('x', 'return x==' + compare.join('||x=='));
          } else {
            callback = cache[key];
          }
        } else {
          callback = function(x) { return indexOf(compare, x) > -1; };
        }
      } else if (_.isFun(compare)) {
        callback = function(x) { return indexOf(compare(), x) > -1; };
      } else {
        callback = compare;
      }

      if(len == 2) {
        obj = {};
        obj[param1] = callback;
        return obj;
      } else {
        return callback;
      }
    }
  })();

  function like(param1, param2) {
    var 
      compare,
      len = arguments.length,
      query,
      obj = {};

    if(len == 1) {
      query = param1;
    } else if(len == 2){
      query = param2;
    } 

    query = query.toString().toLowerCase();

    compare = function(x) { 
      return x.toString().toLowerCase().search(query) > -1; 
    }

    if(len == 2) {
      obj = {};
      obj[param1] = compare;
      return obj;
    } else {
      return compare;
    }
  }

  // An encapsulator for hiding internal variables
  function secret(x) {
    var cache = {x:x};

    return function(arg0, arg1){
      if (arguments.length == 2) { cache[arg0] = arg1; }
      return cache[arg0];
    };
  }

  function deepcopy(from) {
    // @http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object
    return extend({}, from);
  }

  function list2obj(list) {
    var ret = {};

    each(list, function(which) {
      ret[which] = true;
    });

    return ret;
  }

  function values(obj) {
    var ret = [];

    for(var key in obj) {
      ret.push(obj[key]);
    }

    return ret;
  }

  // These function accept index lists.
  function setdiff(larger, subset) {
    var ret = [];

    stain(subset);

    for(var ix = 0, len = larger.length; ix < len; ix++) {
      if (isStained(larger[ix])) { 
        continue;
      } 
      ret.push(larger[ix]);
    }

    return ret;
  }

  function update(arg0, arg1) {
    var key, filter = this;

    // This permits update(key, value) on a chained find
    if( arg1 !== _u ) {

      // Store the key string
      key = arg0;

      // The constraint is actually the new value to be
      // assigned.
      arg0 = {};
      arg0[key] = arg1; 
    }

    if(_.isFun(arg0)) {
      each(filter, arg0);
    } else {
      each(arg0, function(key, value) {
        if(_.isFun( value )) {
          // take each item from the filter (filtered results)
          // and then apply the value function to it, storing
          // back the results
          each(filter, function(which) { 
            if(_.isFun(which[key])) {
              which[key]( value(which) );
            } else {
              which[key] = value(which); 
            }
          });
        } else {
          // otherwise, assign the static 
          each(filter, function(which) { 
            if(_.isFun(which[key])) {
              which[key]( value );
            } else {
              which[key] = value; 
            }
          });
        }
      });
    }

    return this;
  }

  // Jacked from Resig's jquery 1.5.2
  // The code has been modified to not rely on jquery and stripped
  // to not be so safe and general
  function extend(o1, o2) {
    var 
      options, src, copy, copyIsArray, clone,
      target = o1,
      len = arguments.length;

    for (var i = 0 ; i < len; i++ ) {
      // Only deal with non-null/undefined values
      options = arguments[ i ];

      // Extend the base object
      for (var name in options ) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( copy && ( copy.constructor == Object || (copyIsArray = (_.isArr(copy))) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && (_.isArr(constructor)) ? src : [];
          } else {
            clone = src && (src.constructor == Object) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = extend( clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== _u ) {
          target[ name ] = copy;
        }
      }
    }
 
    // Return the modified object
    return target;
  }

  function kvarg(which){
    var ret = {};

    if(which.length == 2) {
      ret[which[0]] = which[1];
      return ret;
    }

    if(which.length == 1) {
      return which[0];
    }
  }

  var expression = (function(){
    var 
      regex = /^\s*([=<>!]+)['"]*(.*)$/,
      canned,
      cache = {};

    // A closure is needed here to avoid mangling pointers
    return function (){

      return function(arg0, arg1) {
        var ret, expr;

        if(_.isStr( arg0 )) {
          expr = arg0;
          // There are TWO types of lambda function here (I'm not using the
          // term 'closure' because that means something else)
          //
          // We can have one that is sensitive to a specific record member and 
          // one that is local to a record and not a specific member.  
          //
          // As it turns out, we can derive the kind of function intended simply
          // because they won't ever syntactically both be valid in real use cases.
          //
          // I mean sure, the empty string, space, semicolon etc is valid for both, 
          // alright sure, thanks smarty pants.  But is that what you are using? really?
          //
          // No? ok, me either. This seems practical then.
          //
          // The invocation wrapping will also make this work magically, with proper
          // expreessive usage.
          if(arguments.length == 1) {
            if(!cache[expr]) {

              try {
                ret = new Function("x,rec", "return x " + expr);
              } catch(ex) {
                ret = {};
              }

              try {
                ret.single = new Function("rec", "return " + arg0);
              } catch(ex) {}

              cache[expr] = ret;
            } else {
              ret = cache[expr];
            }
          }

          if(arguments.length == 2 && _.isStr(arg1)) {
            ret = {};
            expr = arg1;

            // See if we've seen this function before
            if(!cache[expr]) {

              // If we haven't, see if we can avoid an eval
              if((canned = expr.match(regex)) !== null) {
                cache[expr] = _compProto[canned[1]](canned[2].replace(/['"]$/, ''));
              } else {      
                // if not, fall back on it 
                cache[expr] = new Function("x,rec", "return x " + expr);
              }
            } 
            ret[arg0] = cache[expr];
          }

          return ret;
        } 
      }
    }
  })();

  function eachRun(callback, arg1) {
    var 
      ret = [],
      filter;

    if(arguments.length == 2) {
      filter = callback;
      callback = arg1;
    } else {
      filter = this;
    }

    if(_.isArr(filter)) {
      ret = map(filter, callback);
    } else {
      ret = {};

      for(var key in filter) {
        if(!_.isFun(filter[key])) {
          ret[key] = callback.call(this, filter[key]);
        }
      }
    } 

    return ret;
  }


  // 
  // "Staining" is my own crackpot algorithm of comparing
  // two unsorted lists of pointers that reference shared
  // objects. We go through list one, affixing a unique
  // constant value to each of the members. Then we go
  // through list two and see if the value is there.
  //
  // This has to be done rather atomically as the value
  // can easily be replaced by something else.  It's an
  // N + M cost...
  //
  function stain(list) {
    _stainID++;

    for(var ix = 0, len = list.length; ix < len; ix++) {
      list[ix].constructor('i', _stainID);
    }
  }

  function isStained(obj) {
    return obj.constructor('i') == _stainID;
  }

  // the list of functions to chain
  var chainList = list2obj('has hasKey insert invert missing isin group keyBy remove update where select find sort orderBy order each like'.split(' '));

  // --- START OF AN INSTANCE ----
  //
  // This is the start of a DB instance.
  // All the instance local functions
  // and variables ought to go here. Things
  // that would have been considered "static"
  // in a language such as Java or C++ should
  // go above!!!!
  //
  self.DB = function(arg0, arg1){
    var 
      constraints = {},
      constrainCache = {},
      syncList = [],
      bSync = false,
      _template = false,
      ret = expression(),
      raw = [];

    function sync() {
      if(!bSync) {
        bSync = true;
        each(syncList, function(which) { which.call(ret, raw); });
        bSync = false;
      }
    }

    function chain(list) {
      for(var func in chainList) {
        list[func] = ret[func];
      }

      return list;
    }

    function list2data(list) {
      var ret = [];

      for(var ix = 0, len = list.length; ix < len; ix++) {
        ret[ix] = raw[list[ix]];
      }

      return ret;
    }

    extend(ret, {

      // This is to constrain the database.  Currently you can enforce a unique
      // key value through something like `db.constrain('unique', 'somekey')`.
      // You should probably run this early, as unlike in RDBMSs, it doesn't do
      // a historical check nor does it create a optimized hash to index by
      // this key ... it just does a lookup every time as of now.
      constrain: function() { extend(constraints, kvarg(arguments)); },

      each: eachRun,
    
      // This is a shorthand to find for when you are only expecting one result.
      findFirst: function(){
        var res = ret.find.apply(this, slice.call(arguments));
        return res.length ? res[0] : {};
      },

      has: has,

      // hasKey is to get records that have keys defined
      hasKey: function() {
        return ret.find(missing.apply(this, slice.call(arguments))).invert();
      },

      isin: isin,
      like: like,
      invert: function(list) { return chain(setdiff(raw, list || this)); },

      map: eachRun,

      // Missing is to get records that have keys not defined
      missing: function() { 
        return ret.find(missing.apply(this, slice.call(arguments))); 
      },

      // The callbacks in this list are called
      // every time the database changes with
      // the raw value of the database.
      sync: function(callback) { 
        if(callback) {
          syncList.push(callback);
        } else { 
          sync();
        }
      },

      template: {
        create: function(opt) { _template = opt; },
        update: function(opt) { extend(_template || {}, opt); },
        get: function() { return _template },
        destroy: function() { _template = false }
      },

      // Update allows you to set newvalue to all
      // parameters matching constraint where constraint
      // is either a set of K/V pairs or a result
      // of find so that you can do something like
      //
      // Update also can take a callback.
      //
      //   var result = db.find(constraint);
      //   result.update({a: b});
      //
      update: function() {
        var list = update.apply( _.isArr(this) ? this : ret.find(), slice.call(arguments)) ;
        sync();
        return chain (list);
      }

    });

    //
    // group
    //
    // This is like SQLs groupby function. It will take results from any other function and then
    // return them as a hash where the keys are the field values and the results are an array
    // of the rows that match that value.
    //
    ret.group = function(field) {
      var 
        groupMap = {},
        filter = _.isArr(this) ? this : ret.find();                 

      each(filter, function(which) {
        if(field in which) {
          if(! groupMap[which[field]]) {
            groupMap[which[field]] = chain([]);
          }

          groupMap[which[field]].push(which);
        }
      });
      
      return groupMap;
    } 

    //
    // keyBy
    //
    // This is like group above but it just maps as a K/V tuple, with 
    // the duplication policy of the first match being preferred.
    //
    ret.keyBy = function(field) {
      var groupResult = ret.group.apply(this, arguments);

      each(groupResult, function(key, value) {
        groupResult[key] = value[0];
      });

      return groupResult;
    } 

    //
    // sort
    //
    // This is like SQLs orderby function.  If you pass it just a field, then
    // the results are returned in ascending order (x - y).  
    //
    // You can also supply a second parameter of a case insensitive "asc" and "desc" like in SQL.
    //
    ret.order = ret.sort = ret.orderBy = function (arg0, arg1) {
      var 
        key, 
        fnSort,
        len = arguments.length,
        order,
        filter = _.isArr(this) ? this : ret.find();                 

      if(_.isFun(arg0)) {
        fnSort = arg0;
      } else if(_.isStr(arg0)) {
        key = arg0;

        if(len == 1) {
          order = 'x-y';
        } else if(len == 2) {

          if(_.isStr(arg1)) {
            order = {
              'asc': 'x-y',
              'desc': 'y-x'
            }[arg1.toLowerCase()];
          } else {
            order = arg1;
          }
        }

        if(_.isStr(order)) {
          if(! _orderCache[order]) {
            order = _orderCache[order] = new Function('x,y', 'return ' + order);
          } else {
            order = _orderCache[order];
          }
        }

        eval('fnSort=function(a,b){return order(a.' + key + ', b.' + key + ')}');
      }

      return chain(slice.call(filter).sort(fnSort));
    }

    ret.where = ret.find = function() {
      var args = slice.call(arguments || []);

      // Addresses test 23 (Finding: Find all elements cascarded, 3 times)
      if(!_.isArr(this)) {
        args = [raw].concat(args);
      }

      return chain( find.apply(this, args) );
    }

    //
    // view 
    //
    // Views are an expensive synchronization macro that return 
    // an object that can be indexed in order to get into the data.
    //
    ret.view = function(field) {
      var obj = {};

      ret.sync(function(data) {
        var ref = {}, key;

        each(data, function(row) {
          if(field in row) {
            ref[row[field]] = row;
          }
        });

        for(key in ref) {
          if( ! ( key in obj ) ) {
            obj[key] = ref[key];
          } else if(obj[key] !== ref[key]) {
            obj[key] = ref[key];
          }
        }
        for(key in obj) {
          if( ! (key in ref) ) {
            delete obj[key];
          }
        }
      });

      sync();

      return obj;
    }


    //
    // select
    //
    // This will extract the values of a particular key from the filtered list
    // and then return it as an array or an array of arrays, depending on
    // which is relevant for the query.
    //
    // You can also do db.select(' * ') to retrieve all fields, although the 
    // key values of these fields aren't currently being returned.
    //
    ret.select = function(field) {
      var 
        filter = _.isArr(this) ? this : ret.find(),
        fieldCount,
        resultList = {};

      if(arguments.length > 1) {
        field = slice.call(arguments);
      } else if (_.isStr(field)) {
        field = [field];
      }

      fieldCount = field.length;
      
      each(field, function(column, iy) {
        if(column == '*') {
          resultList = map(filter, values);
        } else {
          for(var ix = 0, len = filter.length; ix < len; ix++) {
            row = filter[ix];

            if(column in row){
              if(fieldCount > 1) {
                if(!resultList[ix]) {
                  resultList[ix] = [];
                }
                resultList[ix][iy] = row[column];
              } else {
                resultList[ix] = row[column];
              }
            }
          }
        }
      });
      
      return chain(values(resultList));
    }

    // 
    // insert
    //
    // This is to insert data into the database.  You can either insert
    // data as a list of arguments, as an array, or as a single object.
    //
    ret.insert = function(param) {
      var 
        constraintMap = {},
        toInsert = [],
        ixList = [];

      if(arguments.length > 1) {
        toInsert = slice.call(arguments);
      } else if (_.isArr(param)) {
        toInsert = param;
      } else {
        toInsert.push(param);
      } 

      each(toInsert, function(which) {
        // If the unique field has been set then we do
        // a hash search through the constraints to 
        // see if it's there.
        if(constraints.unique) {
          // If the user had opted for a certain field to be unique,
          // then we find all the matches to that field and create
          // a block list from them.
          constraintMap = {};

          each(raw, function(data, index){
            constraintMap[data[constraints.unique]] = index;
          });

          if(which[constraints.unique] in constraintMap){
            // put on the existing value
            ixList.push(constraintMap[which[constraints.unique]]);
            return;
          }
        }

        var ix = raw.length, data;

        // insert from a template if available
        if(_template) {
          var instance = {};
          
          // create a template instance that's capable
          // of holding evaluations
          each(_template, function(key, value) {
            if(_.isFun(value)) {
              instance[ key ] = value();
            } else {
              instance[ key ] = value;
            }
          });

          // map the values to be inserted upon
          // the instance of this template
          which = extend(instance, which);
        }

        try {
          data = new (secret(ix))();
          extend(data, which);
          raw.push(data);
        } catch(ex) {

          // Embedded objects, like flash controllers
          // will bail on JQuery's extend because the
          // properties aren't totally enumerable.  We
          // work around that by slightly changing the 
          // object; hopefully in a non-destructive way.
          which.constructor = secret(ix);
          raw.push(which);
        }

        ixList.push(ix);
      });

      sync();

      return chain(list2data(ixList));
    }

    //
    // remove
    // 
    // This will remove the entries from the database but also return them if
    // you want to manipulate them.  You can invoke this with a constraint.
    //
    ret.remove = function(arg0, arg1) {
      var 
        end, start,
        list,
        save = [];

      if(_.isArr(this)) { list = this; } 
      else if(_.isArr(arg0)) { list = arg0; } 
      else if(arguments.length > 0){ list = ret.find.apply(this, slice.call(arguments)); } 
      else { list = ret.find(); }

      stain(list);

      for(var ix = raw.length - 1, end = raw.length; ix >= 0; ix--) {
        if (isStained(raw[ix])) { 
          save.push(raw[ix]);
          continue;
        }
        if(end - (ix + 1)) {
          start = ix + 1;
          raw.splice(start, end - start);
        }
        end = ix;
      }

      start = ix + 1;
      if(end - start) {
        raw.splice(start, end - start);
      }

      sync();
      return chain(save.reverse());
    }

    // The ability to import a database from somewhere
    if (arguments.length == 1) {
      if(_.isArr(arg0)) { ret.insert(arg0) }
      else if(_.isFun(arg0)) { ret.insert(arg0()) }
      else if(_.isStr(arg0)) { return ret.apply(this, arguments) }
      else if(_.isObj(arg0)) { ret.insert(arg0) }
    } else if(arguments.length > 1) {
      ret.insert(slice.call(arguments));
    }

    // Assign this after initialization
    ret.__raw__ = raw;
    return ret;
  }

  extend(DB, {
    find: find,
    each: eachRun,
    like: like,
    trace: trace,
    isin: isin,

    objectify: function(keyList, values) {
      var obj = [];

      each(values, function(row) {
        var objRow = {};
        each(keyList, function(key, index) {
          objRow[key] = row[index];
        });

        obj.push(objRow);

      });

      return obj; 
    },

    findFirst: function(){
      var res = find.apply(this, slice.call(arguments));
      return res.length ? res[0] : {};
    },

    // This does a traditional left-reduction on a list
    // as popular in list comprehension suites common in 
    // functional programming.
    reduceLeft: function(memo, callback) {
      var lambda = _.isStr(callback) ? new Function("y,x", "return y " + callback) : callback;

      return function(list) {
        var reduced = memo;

        for(var ix = 0, len = list.length; ix < len; ix++) {
          if(list[ix]) {
            reduced = lambda(reduced, list[ix]);
          }
        }

        return reduced;
      }
    },

    // This does a traditional right-reduction on a list
    // as popular in list comprehension suites common in 
    // functional programming.
    //
    reduceRight: function(memo, callback) {
      var callback = DB.reduceLeft(memo, callback);

      return function(list) {
        return callback(list.reverse());
      }
    }
  });

})();
