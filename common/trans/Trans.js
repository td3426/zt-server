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

const TransApi = function(req) {
	this.name = 'TransApi';
    this.host = sails.config.transApi.host;
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
			debug   : sails.config.transApi.debug
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
}


TransApi.prototype.createOrder = async function($data) {
	let $tm = moment().format('YYYYMMDDHHmmss');
    let $params = {
		appid     : sails.config.transApi.appId,
		timestamp : $tm
	};
	let $digest = buildDigest(_.assign($params, $data), sails.config.transApi.appSecret);

    return await post.call(this, 'api/server/order/create', $data, {
		"Content-Type" : "application/json",
		appid          : sails.config.transApi.appId,
		timestamp      : $tm,
		digest         : $digest
	});
};

TransApi.prototype.getOrder = async function($order_id) {
	let $tm = moment().format('YYYYMMDDHHmmss');
    let $params = {
		appid     : sails.config.transApi.appId,
		timestamp : $tm
	};
	let $digest = buildDigest($params, sails.config.transApi.appSecret);

    return await post.call(this, 'api/server/order/get/' + $order_id, {}, {
		"Content-Type" : "application/json",
		appid          : sails.config.transApi.appId,
		timestamp      : $tm,
		digest         : $digest
	});
};

TransApi.prototype.getMultiOrder = async function($order_ids) {
	let $data = {
		where: {
			ids: $order_ids
		}
	};

	let $tm = moment().format('YYYYMMDDHHmmss');
    let $params = {
		appid          : sails.config.transApi.appId,
		timestamp      : $tm
	};

	let $digest = buildDigest(_.assign($params, $data), sails.config.transApi.appSecret);

    return await post.call(this, 'api/server/order/list', $data, {
		"Content-Type" : "application/json",
		appid          : sails.config.transApi.appId,
		timestamp      : $tm,
		digest         : $digest
	});
};



module.exports = TransApi;

