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
    if(!params.version) throw new Error('no version');

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


const HtApi = function() {
    this.host = sails.config.htApi.host;

	return this;
};

async function get(uri, params) {
	var url = new URL(uri, this.host).href;
    if(sails.config.htApi.debug) sails.log.debug("[HtApi] info: \nurl(get): " + url + "\n", params);

    try {
        let result = await urllib.request(url, {
            method: 'GET',
            timeout: [5000, 30000],
			headers: {
				"Content-Type": "application/json",
			},
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[HtApi Request] error: ", result);
            throw result.statusMessage;
        }

        if(sails.config.htApi.debug) sails.log.debug("[HtApi] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));
        if(!ret || parseInt(ret.errcode) !== 0) {
            sails.log.error("[HtApi] error: ", ret);
            throw ret.msg || "未知错误";
        }

        return typeof ret.result != 'undefined' ? ret.result : {};
    } catch(err) {
        sails.log.error("[HtApi Request] error: ", err);
        if(err && err.name == 'ResponseTimeoutError') {
            throw new Error('请求ht 10s超时');
        } else {
            throw err;
        }
    }
}

async function post(uri, params) {
	var url = new URL(uri, this.host).href;
    if(sails.config.htApi.debug) sails.log.debug("[HtApi] info: \nurl(post): " + url + "\n", params);
    try {
        let result = await urllib.request(url, {
            method: 'POST',
            timeout: [5000, 30000],
			headers: {
				"Content-Type": "application/json",
			},
            data: params
        });

        if(result.status != 200) {
            sails.log.error("[HtApi Request] error: ", result);
			throw flaverr('E_USER_ERROR', new Error(result.res && result.res.statusMessage || result.status));
        }

        if(sails.config.htApi.debug) sails.log.debug("[HtApi] return: ", result.data.toString('utf8'));

        let ret = JSON.parse(result.data.toString('utf8'));
        if(!ret || parseInt(ret.errcode) !== 0) {
            sails.log.error("[HtApi] error: ", ret);
			throw flaverr('E_USER_ERROR', new Error(ret.msg || ret.message || '未知错误'));
        }

        return typeof ret.result != 'undefined' ? ret.result : {};
    } catch(err) {
        sails.log.error("[HtApi Request] error: ", err);
        if(err && err.name == 'ResponseTimeoutError') {
            throw flaverr('E_USER_ERROR', new Error('HtApi: 请求超时'));
		} else if(err && err.name == 'RequestError') {
			throw flaverr('E_USER_ERROR', new Error('HtApi: 请求失败'));
		} else {
            throw flaverr('E_USER_ERROR', new Error('HtApi: ' + (err.message || '未知错误')));
        }
    }
}



HtApi.prototype.api = async function($api, $data) {
    let params = {
		appid: sails.config.htApi.appId,
		timestamp: moment().format('YYYYMMDDHHmmss'),
		version: '1.0'
	};
	params = _.assign(params, $data);
	params.digest = buildDigest(params, sails.config.htApi.appSecret);

    return await post.call(this, $api, params);
};

HtApi.prototype.getTpl = async function($tpl_no) {
	return await this.api('detail-tpl', {tpl_no: $tpl_no});
};

HtApi.prototype.addTplHt = async function($data) {
	return await this.api('add-tpl-ht', $data);
};

module.exports = HtApi;

