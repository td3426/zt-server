'use strict';

const Url = require('url');
const urllib = require('urllib');
const querystring = require('querystring');
const moment = require('moment');
const flaverr = require('flaverr');

function sortByKey(object) {
    object = object || {};
    let ret = [];
    let keys = _.keys(object).sort();
    for(let i = 0, len = keys.length; i < len; i ++) {
        let key = keys[i];

        if(_.has(object, key) && key != 'digest') {
            ret.push(object[key]);
        }
    }

    return ret;
}

function buildDigest(params, secret) {
    params = params || {};

    if(!params.appid) throw new Error('no appid');
    if(!params.timestamp) throw new Error('no timestamp');

    return cutil.base64Encode(
        cutil.sha1(
            params.appid +
            cutil.md5(params.timestamp).toUpperCase() +
            cutil.sha1(
                secret + sortByKey(params).join('')
            ).toUpperCase()
        ).toUpperCase()
    );
}

const FxApi = function(req) {
	this.name = 'FxApi';
    this.host = sails.config.fxApi.host;
	this.req = req;

	return this;
};

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
			debug   : sails.config.fxApi.debug
		});
	} catch(err) {
		throw flaverr('E_USER_ERROR', new Error(err.message || '未知错误'));
	}

    try {
        let ret = JSON.parse(ret_data.toString('utf8'));
        if(!ret || parseInt(ret.errcode) !== 0) {
            sails.log.error(cutil.getLogSNStr(this.req, this.name) + " error -> ", ret);
			throw flaverr('E_USER_ERROR', new Error(ret.msg || ret.message || '未知错误'));
        }

        return cutil.defined(ret.result) ? ret.result : {};
    } catch(err) {
        sails.log.error(cutil.getLogSNStr(this.req, this.name) + " error -> ", err);
		throw flaverr('E_USER_ERROR', new Error(this.name + ': ' + (err.message || '未知错误')));
	}
};

async function commonPost($uri, $data) {
	let $tm = moment().format('YYYYMMDDHHmmss');
    let $params = {
		appid     : sails.config.fxApi.appId,
		timestamp : $tm,
		version   : '1.0'
	};
	let $digest = buildDigest(_.assign($params, $data), sails.config.fxApi.appSecret);

    return await post.call(this, $uri, $data, {
		"Content-Type" : "application/json",
		appid          : sails.config.fxApi.appId,
		timestamp      : $tm,
		digest         : $digest,
		version        : '1.0'
	});
};

FxApi.prototype.updateFxProduct = async function($data) {
    return await commonPost.call(this, 'fx-s2s/v1/update-fx-product', $data);
};

FxApi.prototype.listFxProductBySet = async function($data) {
    return await commonPost.call(this, 'fx-s2s/v1/list-fx-product-by-set', $data);
};

module.exports = FxApi;

