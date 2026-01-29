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

const TgDictApi = function(req) {
	this.name = 'TgDictApi';
    this.host = sails.config.tgDictApi.host;
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
			debug   : sails.config.tgDictApi.debug
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



TgDictApi.prototype.getProductCat = async function($cat_id_arr, $need_attr) {
    return await post.call(this, 'api/common/cat/list', {
		ids: $cat_id_arr,
		hasAttr: $need_attr ? true : false
	}, {
		"Content-Type" : "application/json"
	});
};

TgDictApi.prototype.getProductStyle = async function($id_arr) {
    return await post.call(this, 'api/common/style/list', {
        ids: $id_arr,
    }, {
        "Content-Type" : "application/json"
    }); 
};  

TgDictApi.prototype.getProductColor = async function($id_arr) {
    return await post.call(this, 'api/common/color/list', {
        ids: $id_arr,
    }, {
        "Content-Type" : "application/json"
    });
};

TgDictApi.prototype.getProductMaterial = async function($id_arr) {
    return await post.call(this, 'api/common/material/list', {
        ids: $id_arr,
    }, {
        "Content-Type" : "application/json"
    });
};

TgDictApi.prototype.getProductCustomCat = async function($comp_id, $cat_id_arr) {
    return await post.call(this, 'api/common/orgcat/list/' + $comp_id, {
		ids: $cat_id_arr,
	}, {
		"Content-Type" : "application/json"
	});
};


TgDictApi.prototype.getDicts = async function($cat, $style, $color, $mtl) {
	let $ret = {cat: {}, style: {}, color: {}, mtl: {}};
	try {
		let $dict_reqs = {req: [], map: {}};

		if(_.size($cat) && $cat.id) {
			$dict_reqs.req.push(this.getProductCat($cat.id, $cat.needAttr));
			$dict_reqs.map.cat = $dict_reqs.req.length - 1;
		}

		if(_.size($style) && $style.id) {
			$dict_reqs.req.push(this.getProductStyle($style.id));
			$dict_reqs.map.style = $dict_reqs.req.length - 1;
		}

		if(_.size($color) && $color.id) {
			$dict_reqs.req.push(this.getProductColor($color.id));
			$dict_reqs.map.color = $dict_reqs.req.length - 1;
		}

		if(_.size($mtl) && $mtl.id) {
			$dict_reqs.req.push(this.getProductMaterial($mtl.id));
			$dict_reqs.map.mtl = $dict_reqs.req.length - 1;
		}

		let $dict_result = await Promise.all($dict_reqs.req);

		_.each($dict_reqs.map, function($idx, $k) {
			$ret[$k] = $dict_result[$idx];
			$ret[$k] = _.isArray($ret[$k]) ? cutil.indexTabByCol($ret[$k], 'id') : {};
		});

		return $ret;
	} catch($e) {
		throw $e;
	}
};

module.exports = TgDictApi;

