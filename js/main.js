// JavaScript Document

var url = document.getElementById("url"),
	history_list = document.getElementById("history"),
	storage = null;

function cancelDefault(e) {
	"use strict";

	if (typeof(e) !== "undefined" && e !== null) {
		if (e.preventDefault) {
			e.preventDefault();
		}
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		e.cancelBubble = true;
		e.returnValue = false;
	}
}

function getTarget(e) {
	"use strict";

	var targ;
	if (typeof(e) !== "undefined" && e !== null) {
		if (e.target) {
			targ = e.target;
		} else if (e.srcElement) {
			targ = e.srcElement;
		}
		if (targ !== null && targ.nodeType === 3) { // defeat Safari bug
			targ = targ.parentNode;
		}
	}

	return targ;
}

function createStyleSheet() {
	"use strict";

	// Create the <style> tag
	var style = document.createElement("style");

	// Add a media (and/or media query) here if you'd like!
	// style.setAttribute("media", "only screen and (max-width : 1024px)")
	style.setAttribute("media", "screen");
	style.type = "text/css";

	// WebKit hack :(
	style.appendChild(document.createTextNode(""));

	// Add the <style> element to the page
	document.head.appendChild(style);

	return style.sheet;
}

function removeItem(e) {
	"use strict";

	var item,
		index = -1;
	e = e || window.event;

	item = getTarget(e).parentNode;
	storage = storage || [];
	cancelDefault(e);

	if (item.hasChildNodes()) {
		while (item.lastChild !== null) {
			if (item.lastChild.nodeType === Node.ELEMENT_NODE) {
				if (item.lastChild.classList.contains("download_link")) {
					index = storage.indexOf(item.lastChild.href);
					if (index > -1) {
						storage.splice(index, 1);
						try {
							if (storage.length > 0) {
								localStorage.setItem("history", JSON.stringify(storage));
							} else {
								localStorage.removeItem("history");
							}
						} catch (err) {
							console.error("Removing item from storage: " + err.message);
						}
					}
				} else if (item.lastChild.classList.contains("remove")) {
					item.lastChild.removeEventListener("click", removeItem, false);
				}
			}
			item.removeChild(item.lastChild);
		}
	}

	history_list.removeChild(item);
	url.focus();

	return false;
}

function addToList(resource, fragment, save) {
	"use strict";

	if (resource !== null && resource !== "") {
		var li = document.createElement("li"),
			a = document.createElement("a"),
			x = document.createElement("a"),
			dec_url = decodeURI(resource),
			block = new URL(dec_url),
			file = decodeURIComponent((block.pathname.match(/\/?([^\/?#]+)$/i) || [, ""])[1]);

		if (file === "") {
			return;
		}

		a.href = dec_url;
		a.className = "download_link";
		a.setAttribute("title", "Download ‘" + file + "’");
		a.setAttribute("alt", a.getAttribute("title"));

		try {
			a.download = file;
			a.appendChild(document.createTextNode(file));
		} catch (e) {
			console.warn("Creating file link: " + e.message);
			return;
		}

		li.className = "item";
		li.appendChild(a);
		li.appendChild(x);
		x.className = "remove";
		x.href = "#";
		x.tabIndex = 0;
		x.appendChild(document.createTextNode("✖"));
		x.setAttribute("title", "Remove ‘" + file + "’");
		x.setAttribute("alt", x.getAttribute("title"));
		x.addEventListener("click", removeItem, false);

		fragment = fragment || history_list;
		fragment.appendChild(li);
	}

	if (!!save) {
		storage = storage || [];
		storage.push(dec_url);
		try {
			localStorage.setItem("history", JSON.stringify(storage));
		} catch (e) {
			console.error("Adding item to storage: " + e.message);
		}
	}
}

function registerListeners() {
	"use strict";

	var button = document.getElementById("clearhist"),
		form = document.getElementById("url-add"),
		input = document.getElementById("input"),
		fromtop = 0,
		sheet = null,
		stickyNav = null,
		resizer = null,
		fragment = null;

	button.addEventListener("click", function removeAll(e) {
		e = e || window.event;

		cancelDefault(e);
		while (history_list.hasChildNodes()) {
			if (history_list.lastChild.nodeType === Node.COMMENT_NODE) { // comment tag
				break;
			}
			history_list.removeChild(history_list.lastChild);
		}

		storage = storage || [];
		while (storage.length > 0) {
			storage.pop();
		}
		try {
			localStorage.removeItem("history");
		} catch (err) {
			console.error("Removing history from storage: " + err.message);
		}

		url.value = "";
		url.focus();

		return false;
	}, false);

	form.addEventListener("submit", function submitUrl(e) {
		e = e || window.event;

		cancelDefault(e);
		addToList(url.value, history_list, true);

		url.value = "";
		url.focus();

		return false;
	}, false);

	if (!CSS.supports("position", "sticky") || !CSS.supports("position", "-webkit-sticky")) {
		fromtop = input.offsetTop;
		sheet = createStyleSheet();
		stickyNav = function(e) {
			var dist = document.body.scrollTop || document.documentElement.scrollTop;
			document.body.classList.toggle("-sticky", dist >= fromtop);
			return true;
		};
		resizer = function(e) {
			if (sheet.cssRules.length === 0) {
				sheet.insertRule(".wrapper.-sticky::before { height: " + (input.offsetHeight - 8) + "px; }", 0);
			} else {
				sheet.insertRule(".wrapper.-sticky::before { height: " + (input.offsetHeight - 8) + "px; }", 1);
				sheet.deleteRule(0);
			}

			return true;
		};
		window.addEventListener("scroll", stickyNav, false);
		window.addEventListener("resize", resizer, false);
		resizer();
		stickyNav();
	}

	try {
		if (localStorage.key(0) === "history") {
			storage = JSON.parse(localStorage.getItem("history"));
			if (Array.isArray(storage)) {
				fragment = document.createDocumentFragment();
				storage.forEach(function(current, index, array) {
					addToList(current, fragment, false);
				});
				history_list.appendChild(fragment);
			}
		}
	} catch (e) {
		console.warn("No local storage available.");
	}
	storage = storage || [];

	url.focus();
}

try {
	document.documentElement.classList.remove("no-js");
	document.documentElement.classList.add("js");
} catch (e) {
	document.documentElement.className = document.documentElement.className.replace(/(?:^|\s)(no-js)(?!\S)/g, "");
	document.documentElement.className += "js";
}
registerListeners();
