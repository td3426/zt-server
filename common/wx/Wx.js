'use strict';

const Url = require('url');
const urllib = require('urllib');
const querystring = require('querystring');
const moment = require('moment');
const flaverr = require('flaverr');

const WxApi = function(req) {
	this.req       = req;
	this.name      = 'WxApi';
	this.appId     = sails.config.wxApi.appId;
	this.appSecret = sails.config.wxApi.appSecret;
	this.host      = sails.config.wxApi.host;
	this.debug     = sails.config.wxApi.debug;

	return this;
};

async function get(uri, params) {
	var url = new URL(uri, this.host).href;
    if(this.debug) sails.log.debug("[WxApi] info: \nurl(get): " + url + "\n", params);

    try {
        let result = await urllib.request(url, {
            method: 'GET',
            timeout: [5000, 30000],
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[WxApi Request] error: ", result);
            throw result.statusMessage;
        }

        if(this.debug) sails.log.debug("[WxApi] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));

        //if(!ret || parseInt(ret.errcode) !== 0) {
        //    sails.log.error("[WxApi] error: ", ret);
        //    throw ret.errmsg || "未知错误";
        //}

        return ret;
    } catch(err) {
        sails.log.error("[WxApi Request] error: ", err);
        if(err && err.name == 'ResponseTimeoutError') {
            throw new Error('请求wx 10s超时');
        } else {
            throw err;
        }
    }
}

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
			debug   : this.debug
		});
	} catch(err) {
		throw flaverr('E_USER_ERROR', new Error(err.message || '未知错误'));
	}

    try {
        let ret = JSON.parse(ret_data.toString('utf8'));

        return ret;
    } catch(err) {
        sails.log.error(cutil.getLogSNStr(this.req, this.name) + " error -> ", err);
		throw flaverr('E_USER_ERROR', new Error(this.name + ': ' + (err.message || '未知错误')));
	}
}



WxApi.prototype.code2Session = async function($code) {
	let $uri = "/sns/jscode2session?appid=" + sails.config.wxApi.appId + "&secret=" + sails.config.wxApi.appSecret + "&js_code=" + $code + "&grant_type=authorization_code";
    return await get.call(this, $uri, null);
};

WxApi.prototype.getAccessToken = async function($code) {
	let $uri = "/cgi-bin/token?grant_type=client_credential&appid=" + sails.config.wxApi.appId + "&secret=" + sails.config.wxApi.appSecret;
    return await get.call(this, $uri, null);
	//{"access_token":"ACCESS_TOKEN","expires_in":7200}
	//{"errcode":40013,"errmsg":"invalid appid"}
};

//POST https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=ACCESS_TOKEN
WxApi.prototype.getWxAppQrCode = async function($access_token, $data) {
	let $uri = '/wxa/getwxacodeunlimit?access_token=' + $access_token;
	let $url = new URL($uri, this.host).href;
	let $ret_data = "";
	try {
		$ret_data = await cutil.post({
			url           : $url,
			data          : $data,
			req           : this.req,
			mod           : this.name,
			debug         : this.debug,
			no_log_return : true
		});
	} catch(err) {
		throw flaverr('E_USER_ERROR', new Error(err.message || '未知错误'));
	}

	return $ret_data;
};



module.exports = WxApi;

