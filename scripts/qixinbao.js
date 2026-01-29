"use strict";

var system = require('system');
var fs = require('fs');

//var ct = fs.read('./abc.html');
//var res = ct.match(/keyId=[\'"][^"\']+[\'"]/gi);
//if(!res.length) {
//	console.log('error: no item found.');
//}
//
//var tmp = [];
//var i;
//for(i = 0; i < res.length; i ++) {
//	var item = res[i].trim();
//	item = item.substr(7, item.length - 8);
//	tmp.push(item);
//}
//res = tmp;
//console.log(res.join('\n'));

//var idx = ct.search(/\$components\s*=\s*\(window\.\$components\|\|\[\]\)\.concat\(/gi);
//var ct = ct.replace(/.*\$components\s*=\s*\(window\.\$components\|\|\[\]\)\.concat\((.+)\)\|\|\$components\<\/script\>.*/gi, "$1");
//ct = JSON.parse(ct);
//var ct = ct.substr(idx).trim();
//console.log(idx);
//phantom.exit();


if (system.args.length != 5) {
	console.log('x.js listurl startPage pageStep saveFolderName');
	phantom.exit();
}

var listUrl = system.args[1];
//console.log('url:' + listUrl);
var startPage = parseInt(system.args[2]);
//console.log('page:' + startPage);
var pageStep = parseInt(system.args[3]);
//console.log('step:' + pageStep);
var saveName = system.args[4];
//console.log('saveName:' + saveName);
//phantom.exit();


var npage = 0;
var stoped = false;


function save_detail_uri(uri) {
	var d = new Date();
	var day = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear()
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;

	var path = "./scripts/data/uri/"; 
	var filename = saveName + '-' + year.toString() + month.toString() + day.toString() + '.txt';
	if(!fs.exists(path)) {
		fs.makeTree(path);
	}
	fs.write(path  + filename, uri, 'a');
};


function save_detail(name, data) {
	var d = new Date();
	var day = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear()
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;

	var path = "./scripts/data/" + saveName + '/' + year.toString() + month.toString() + day.toString() + '/';
	if(!fs.exists(path)) {
		fs.makeTree(path);
	}
	fs.write(path  + name + ".html", data, 'w');
};

function printArgs() {
    var i, ilen;
    for (i = 0, ilen = arguments.length; i < ilen; ++i) {
        console.log(JSON.stringify(arguments[i]));
        //console.log("    arguments[" + i + "] = " + JSON.stringify(arguments[i]));
    }
    //console.log("");
}

function onRequest(requestData, networkRequest) {
	networkRequest.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36');
};

function onListConsole() {
	//console.log('list: ', arguments.length, arguments[0]);
	if(arguments.length > 0) {
		if(arguments[0].length >= 7 && arguments[0].substr(0, 7) == ':npage:') {
			npage ++;
		} else {
			printArgs.apply(this, arguments);
		}
	}
};

function onDetailConsole() {
	//console.log('detail: ', arguments.length, arguments[0]);
	if(arguments.length > 0) {
		printArgs.apply(this, arguments);
	}
};

function onError(msg, trace) {
	var msgStack = ['ERROR: ' + msg];
	if (trace && trace.length) {
		msgStack.push('TRACE:');
		trace.forEach(function(t) {
			msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
		});
	}
	console.error(msgStack.join('\n'));
};

function onDetailPage(newpage) {
	newpage.settings.javascriptEnabled = true;
	newpage.settings.loadImages = false;
	newpage.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36';
	newpage.onResourceRequested = onRequest;
	newpage.onClosing = function(closingPage) {
		//console.log('A child page is closing: ' + closingPage.url);
		npage --;
	};
	newpage.onConsoleMessage = onDetailConsole;
	newpage.onLoadFinished = function(status) {
		console.log("get detail(" + newpage.url + ")");
		if (status !== 'success') {
			console.log('error: Unable to access network');
			console.log('reget-detail: ' + newpage.url);
			stoped = true;
		} else {
			var need_captcha = newpage.evaluate(function() {
				var check_item = document.querySelectorAll('.contact-container .address');
				if(typeof check_item == 'undefined' || !check_item || check_item.length < 1) {
					console.log('error: get detail failed ...');
					stoped = true;
					return true;
				}
				return false;
			});

			if(need_captcha) {
				console.log('reget-detail: ' + newpage.url);
				stoped = true;
				return;
			}

			var name = newpage.url.substr(newpage.url.lastIndexOf('/') + 1);
			save_detail(name, newpage.content);
		}
		newpage.close();
	};
}

//function getCurPage() {
//	return webpage.evaluate(function() {
//		var cur_page = document.querySelector(".pagination .active");
//		if(typeof cur_page != 'undefined') {
//			cur_page = cur_page.innerText;
//			cur_page = parseInt(cur_page) || 0;
//		}
//
//		return cur_page;
//	});
//};
//
//function check_loaded(n) {
//	var cur_page = getCurPage();
//	console.log('check page: ' + cur_page + ' != ' + n);
//
//	if(!cur_page) {
//		console.log('error: parse page failed.');
//		return;
//	}
//
//	if(cur_page == n) {
//		console.log('compute page ' + cur_page);
//		if(checkCaptcha()) return;
//
//		var res = computeList(webpage);
//		if(res) {
//			console.log(JSON.stringify(res));
//			//check_npage(res.next);
//		}
//		else {
//			console.log('error: no data from list');
//		}
//		return;
//	}
//
//	console.log('check page2: ' + cur_page + ' != ' + n);
//	setTimeout(function() {
//		console.log('check load: ' + n);
//		check_loaded(n);
//	}, 1000);
//};

function checkCaptcha() {
	return webpage.evaluate(function() {
		//<div class=\"captcha-container\"><button class=\"btn4\">点击按钮进行验证</button></div>
		var captcha = document.querySelector('.captcha-container button');
		if(typeof captcha != 'undefined' && captcha) {
			console.log('error: need a captcha ...');
			stoped = true;

			return true;
		}

		return false;
	});
};

function go_wait() {
	console.log('wait ......');
	setTimeout(function() {
		go_wait();
	}, 5000);
};
function check_npage(next) {
	//console.log('check: ', next, npage, next && npage < 1);
	if(!next) {
		console.log('error: next page = ' + next);
		stoped = true;
		return;
	}

	if(stoped) {
		webpage.close();
		go_wait();
		return;
	}

	if(next && npage < 1) {
		if(next >= startPage + pageStep) {
			console.log('list circle stop');
			webpage.close();
			phantom.exit();
		}
		gotoPage(next);
		return;
	}

	setTimeout(function() {
		check_npage(next);
	}, 1000);
};

function gotoPage(n) {
	console.log('goto page ' + n);
	//webpage.evaluate(function(n) {
	//	//console.log('goto page ' + n);
	//	var ev = document.createEvent("MouseEvents");
	//	ev.initEvent("click", true, true);
	//	document.querySelector(".jump-to input[type=text]").value = n;
	//	document.querySelector(".jump-to button").dispatchEvent(ev);
	//	//console.log('goto page ' + n);
	//}, n);

	//check_loaded(n);

	webpage.open(listUrl + '&page=' + n, function (status) {
		if (status !== 'success') {
			console.log('error: Unable to access network');
			console.log('reget-list: ' + webpage.url);
			stoped = true;
			return;
		} else {
			console.log('do list page(' + webpage.url + ')');
			var need_captcha = webpage.evaluate(function() {
				var check_item = document.querySelectorAll('.app-list-items .company-item');
				if(typeof check_item == 'undefined' || !check_item || check_item.length < 1) {
					console.log('error: get list failed ...');
					stoped = true;
					return true;
				}
				return false;
			});

			if(need_captcha) {
				console.log('reget-list: ' + webpage.url);
				return;
			}

			var res = computeList(webpage);
			if(res) {
				console.log(JSON.stringify(res));
				check_npage(res.next);
			}
			else {
				console.log('error: no data from list');
				console.log('reget-list: ' + webpage.url);
				stoped = true;
			}
		}
	});
};

function vsleep(time) {
	var startTime = new Date().getTime() + parseInt(time, 10);
	while(new Date().getTime() < startTime) {}
};

function computeList(webpage) {
	return webpage.evaluate(function() {
		var ret = [];
		var items = document.querySelectorAll('.app-list-items .company-item');
		var nitems = items.length || 0;
		var i = 0;
		if(nitems < 1) {
			console.log('error: no item found');
			stoped = true;
			return ret;
		}

		var uris = [];
		for(i = 0; i < nitems; i ++) {
			var item = items[i];
			var item_a = item.querySelector('.company-title a');

			//var ev = document.createEvent("MouseEvents");
			//ev.initEvent("click", true, true);
			//item_a.dispatchEvent(ev);
			//console.log(':npage:');

			//ret.push({
			//	//title: item_a.innerText,
			//	url: item_a.getAttribute('href')
			//});
			uris.push(item_a.getAttribute('href'));

			//vsleep(1000 + 100 * parseInt(Math.random() * 10));
		}
		save_detail_uri(uris.join('\n'));
		
		var cur_page = document.querySelector(".pagination .active");
		var next_page = document.querySelector(".pagination .active+li");
		var has_next = 0;
		if(typeof cur_page != 'undefined' && typeof next_page != 'undefined') {
			cur_page = cur_page.innerText;
			cur_page = parseInt(cur_page) || 0;
			next_page = next_page.innerText;
			next_page = parseInt(next_page) || 0;
			if(cur_page && next_page && (cur_page + 1) == next_page) {
				has_next = next_page;
			}
		}

		return {nres: nitems/*, res: ret*/, next: has_next};
	});
};

phantom.onError = onError;
phantom.addCookie({
	  'name'     : 'sid',
	  'value'    : 's%3AWas1gTCmCLXwweIoNtnCKkyYYUSvkK4O.oClbfbnVJXQsR2yUW0Lw%2FB9lUhmgKB3jcPiyRnJG5O8',
	  'domain'   : 'www.qixin.com',
	  'path'     : '/',
	  'httponly' : true,
	  'secure'   : false,
	  'expires'  : (new Date()).getTime() + (1000 * 60 * 60 * 24)
});
phantom.addCookie({
	  'name'     : 'acw_tc',
	  'value'    : '2f624a4615802005922012530e0544a72aa562d95de21e4dbcdb927c607cef',
	  'domain'   : 'www.qixin.com',
	  'path'     : '/',
	  'httponly' : true,
	  'secure'   : false,
	  'expires'  : (new Date()).getTime() + (1000 * 60 * 60 * 24)
});
phantom.addCookie({
	  'name'     : 'Hm_lpvt_52d64b8d3f6d42a2e416d59635df3f71',
	  'value'    : '1581607275',
	  'domain'   : '.qixin.com',
	  'path'     : '/',
	  'expires'  : (new Date()).getTime() + (1000 * 60 * 60)
});
phantom.addCookie({
	  'name'     : 'Hm_lvt_52d64b8d3f6d42a2e416d59635df3f71',
	  'value'    : '1580200727,1581050625'
});


var webpage = require('webpage').create();
webpage.settings.javascriptEnabled = true;
webpage.settings.loadImages = false;
webpage.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36';

//webpage.onClosing = function() {};
webpage.onConsoleMessage = onListConsole;
webpage.onError = onError;
webpage.onResourceRequested = onRequest;
webpage.onPageCreated = onDetailPage;
//webpage.onInitialized = function() {
//	webpage.evaluate(function() {
//		var open_original = XMLHttpRequest.prototype.open;
//		XMLHttpRequest.prototype.open = function (method, url, async, unk1, unk2) {
//			this.requestUrl = url
//			open_original.apply(this, arguments);
//		};
//
//		var xhrSend = XMLHttpRequest.prototype.send;
//		XMLHttpRequest.prototype.send = function () {
//			var xhr = this;
//			this.onreadystatechange = function() {
//				if(xhr.readyState == 4 && xhr.requestUrl == "https://www.qixin.com/api/search") {
//					//console.log(xhr.response);
//					window.callPhantom({eventName: 'searchLoad', eventData: xhr});
//				}
//			};
//			xhrSend.apply(xhr, arguments);
//		};
//	});
//};
//webpage.onCallback = function(data){
//	//console.log('CALLBACK: ' + JSON.stringify(data));
//	//webpage.sendEvent(data.eventName, data.eventData);
//};
//webpage.onResourceReceived = function(response) {
//	//console.log('receive: ', response.url);
//	if(
//		response.url == 'https://www.qixin.com/api/search' 
//		&& response.stage == 'end' 
//		&& response.status == '200'
//	) {
//		//check_loaded();
//	}
//};

//gotoPage(startPage);


webpage.open(listUrl + '&page=' + startPage, function (status) {
	if (status !== 'success') {
		console.log('error: Unable to access network');
		console.log('reget-list: ' + webpage.url);
		stoped = true;
		return;
	} else {
		console.log('do list page(' + webpage.url + ')');
		//var need_captcha = webpage.evaluate(function() {
		//	var check_item = document.querySelectorAll('.app-list-items .company-item');
		//	if(typeof check_item == 'undefined' || !check_item || check_item.length < 1) {
		//		console.log('error: get list failed ...');
		//		stoped = true;
		//		return true;
		//	}
		//	return false;
		//});
		var ct = webpage.content;

		var res = ct.match(/keyId=[\'"][^"\']+[\'"]/gi);
		if(typeof res == 'undefined' || !res || !res.length) {
			console.log('error: no item found.');
			go_wait();
			return;
		}

		var tmp = [];
		var i;
		for(i = 0; i < res.length; i ++) {
			var item = res[i].trim();
			item = item.substr(7, item.length - 8);
			tmp.push(item);
		}
		res = tmp.join('\n') + '\n';
		console.log(res);
		save_detail_uri(res);
		webpage.close();
		phantom.exit();
	}
});

//setInterval(function(){ console.log(npage + '.........'); }, 2000);

