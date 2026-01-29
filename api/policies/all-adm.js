const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports = async function(req, res, proceed) {
	var $manger_row;
	var $token = req.headers.token || req.param('token');
	try {
        if(!$token) return res.jsonerr('未登录');

		let adminApi = new AdminApi();
		$manger_row = await adminApi.verifyToken($token);
    } catch($e) {
		return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
    }

    // sails.log.debug('chk permission user_id: ', $user_id);
    if(!$manger_row.id) {
        sails.log.error('user_id不存在 (' + JSON.stringify($manger_row) + ')');
        return res.jsonerr('用户不存在');
    }

    req.me = $manger_row;
    req.me.token = $token;

    if(sails.config.debugMe && req.__sysvar && req.__sysvar.req_uuid) {
        let req_uuid = req.__sysvar.req_uuid;
        let req_tmstr = moment().format('YYYY-MM-DD HH:mm:ss');
        sails.log.debug('[' + req_uuid + '@' + req_tmstr + '] me  -> \n' , req.me);
    }

    return proceed();
};

