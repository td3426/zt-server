'use strict';

const Url = require('url');
const urllib = require('urllib');
const querystring = require('querystring');
const moment = require('moment');
const flaverr = require('flaverr');

const PayApi = function() {
    this.host = sails.config.payApi.host;

	return this;
};

async function post(uri, params, headers, noreturn) {
	var url = new URL(uri, this.host).href;
    if(sails.config.payApi.debug) sails.log.debug("[PayApi] info: \nurl(post): " + url + "\n", params);
	var $headers = headers || {};
	$headers['Content-Type'] = "application/json";
    try {
        let result = await urllib.request(url, {
            method: 'POST',
            timeout: [5000, 30000],
			headers: $headers,
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[PayApi Request] error: ", result);
			throw flaverr('E_USER_ERROR', new Error(result.res && result.res.statusMessage || result.status));
        }

        if(sails.config.payApi.debug) sails.log.debug("[PayApi] return: ", result.data.toString('utf8'));

		if(noreturn) return 'ok';

        let ret = JSON.parse(result.data.toString('utf8'));
        if(!ret || parseInt(ret.errcode) !== 0) {
            sails.log.error("[PayApi] error: ", ret);
			throw flaverr('E_USER_ERROR', new Error(ret.msg || ret.message || '未知错误'));
        }

        return typeof ret.result != 'undefined' ? ret.result : {};
    } catch(err) {
        sails.log.error("[PayApi Request] error: ", err);
        if(err && err.name == 'ResponseTimeoutError') {
            throw flaverr('E_USER_ERROR', new Error('PayApi: 请求超时'));
		} else if(err && err.name == 'RequestError') {
			throw flaverr('E_USER_ERROR', new Error('PayApi: 请求失败'));
        } else {
            throw flaverr('E_USER_ERROR', new Error('PayApi: ' + (err.message || '未知错误')));
        }
    }
}


PayApi.prototype.pay = async function(token, params) {
    var res = await post.call(this, '/api/offline/pay', params, {
		token: token
	});

	return res && res.id || '';
};

PayApi.prototype.confirmPaid = async function(pay_no, token) {
    return await post.call(this, '/api/offline/confirm/' + pay_no, {}, {
		token: token
	}, true);
};

module.exports = PayApi;

