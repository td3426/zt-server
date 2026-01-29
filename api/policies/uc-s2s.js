const uuidv4 = require('uuid/v4');
const moment = require('moment');

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

module.exports = async function(req, res, proceed) {
    let $params = req.allParams();

    let $appId = $params.appid || 0;
    if(!$appId) return res.jsonerr('appid不存在');

    let $appSecr = await AppSecret.getSecretById({
        id: $appId,
		type: 1
    });
    if(!$appSecr) return res.jsonerr('appid不存在');

    try{
        let $digest = buildDigest($params, $appSecr);
        if($digest != $params.digest) return res.jsonerr('digest无效');
    } catch ($e) {
        return res.jsonerr('digest无效');
    }

    req.me = {};
    req.me.id = 0;
	req.appid = $appId;
    if(typeof req.param('token') != 'undefined') {
        try {
            var $token = req.param('token');
            var $token_data = cutil.verityToken($token);
            req.me.id = $token_data && $token_data.user_id ? $token_data.user_id : 0;
			req.me.token = $token;
		} catch(e) {
            if(e.name && e.name == 'TokenExpiredError') {
                return res.jsonerr('登录已过期', 2);
            } else {
                return res.jsonerr('未登录: ' + e.message);
            }
        }
    }

    if(sails.config.debugMe && req.__sysvar && req.__sysvar.req_uuid) {
        let req_uuid = req.__sysvar.req_uuid;
        let req_tmstr = moment().format('YYYY-MM-DD HH:mm:ss');
        sails.log.debug('[' + req_uuid + '@' + req_tmstr + '] me  -> \n' , req.me);
    }

    return proceed();

};
