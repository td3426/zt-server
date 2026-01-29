"use strict";

var system = require('system');
var fs = require('fs');

if (system.args.length != 3) {
	console.log('x.js id savepath');
	phantom.exit();
}

var id = system.args[1];
var savePath = system.args[2];


function save_detail(name, data) {
	var d = new Date();
	var day = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear()
	day = day < 10 ? '0' + day : day;
	month = month < 10 ? '0' + month : month;

	var path = savePath + '/';
	//var path = savePath + '/' + year.toString() + month.toString() + day.toString() + '/';
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
	networkRequest.setHeader('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0 MQQBrowser/10.0.2 Mobile/15B87 Safari/604.1 QBWebViewUA/2 QBWebViewType/1 WKType/1');
};

function onDetailConsole() {
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

function go_wait() {
	console.log('wait ......');
	setTimeout(function() {
		go_wait();
	}, 5000);
};



phantom.onError = onError;

var url = "https://m.qixin.com/company/" + id;
var webpage = require('webpage').create();
webpage.settings.javascriptEnabled = true;
webpage.settings.loadImages = false;
webpage.settings.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4_1 like Mac OS X) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0 MQQBrowser/10.0.2 Mobile/15B87 Safari/604.1 QBWebViewUA/2 QBWebViewType/1 WKType/1';

webpage.onConsoleMessage = onDetailConsole;
webpage.onError = onError;
webpage.onResourceRequested = onRequest;
var skip = false;
webpage.onResourceReceived = function(response) {
	if(response.status == 404 && response.url == url) {
		console.log('error: url 404');
		save_detail(id, '404');
		skip = true;
	}
};

webpage.open(url, function (status) {
	if(skip) {
		webpage.close();
		phantom.exit();
	}

	if (status !== 'success') {
		console.log('error: Unable to access network');
		console.log('reget-detail: ' + webpage.url);
		go_wait();
		return;
	} else {
		console.log('do detail page(' + webpage.url + ')');
		var ct = webpage.content;

		if(-1 == ct.indexOf('统一社会信用代码')) {
			console.log('error: no item found.');
			go_wait();
			return;
		}

		save_detail(id, ct);
		webpage.close();
		phantom.exit();
	}
});

