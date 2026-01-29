'use strict';

const Url = require('url');
const urllib = require('urllib');
const querystring = require('querystring');
const moment = require('moment');
const flaverr = require('flaverr');

async function post(uri, params, headers) {
	let url = new URL(uri, this.host).href;
	let ret_data = "";
	try {
		ret_data = await cutil.post({
			url     : url,
			data    : params,
			headers : headers,
			req     : this.req,
			mod     : this.name,
			debug   : sails.config.tgDictApi.debug
		});
	} catch(err) {
		throw flaverr('E_USER_ERROR', new Error(err.message || '未知错误'));
	}

    try {
        let ret = JSON.parse(ret_data.toString('utf8'));
        if(!ret || parseInt(ret.code) !== 0 || !ret.success) {
            sails.log.error(cutil.getLogSNStr(this.req, this.name) + " error -> ", ret);
			throw flaverr('E_USER_ERROR', new Error(ret.msg || ret.error || '未知错误'));
        }

        return cutil.defined(ret.content) ? ret.content : '';
    } catch(err) {
        sails.log.error(cutil.getLogSNStr(this.req, this.name) + " error -> ", err);
		throw flaverr('E_USER_ERROR', new Error('物流接口: ' + (err.message || '未知错误')));
	}
}

const WlApi = function(req) {
	this.name = 'WlApi';
    this.host = sails.config.wlApi.host;
	this.req = req;

	return this;
};


WlApi.prototype.createWayBill = async function($params) {
    return await post.call(this, 'api/SenderApi/newSaveSend', $params, {
		"Content-Type" : "application/json"
	});
};

WlApi.prototype.queryTrack = async function($params) {
    return await post.call(this, 'api/SenderApi/TrackingDetail', $params, {
		"Content-Type" : "application/json"
	});
};

module.exports = WlApi;

