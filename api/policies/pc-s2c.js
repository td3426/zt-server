const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports = async function(req, res, proceed) {
	let $user_id, $user_row, $token;

    try {
        $token = req.headers.token || req.param('token');
        if(!$token) return res.jsonerr('未登录');

        let $token_data = cutil.verityToken($token);
        $user_id = $token_data && $token_data.user_id ? $token_data.user_id : 0;
    } catch(e) {
        if(e.name && e.name == 'TokenExpiredError') {
            return res.jsonerr('登录已过期', 2);
        } else {
            return res.jsonerr('未登录: ' + e.message);
        }
    }

    if(!$user_id) {
        sails.log.error('user_id不存在 (' + $user_id + ')');
        return res.jsonerr('用户不存在');
    }

    $user_row = await User.getUser($user_id);
    if(!_.size($user_row) || $user_row.stat != CONST.USER_STAT_OK) {
        sails.log.error('[DB-user]: 未找到用户记录(' + $user_id + ')');
        return res.jsonerr('用户不存在');
    }

    //if($user_row.step == CONST.USER_STEP_MOBILE) {
    //    $route_info = sails.getRouteFor('usercenter/s2cv1/user.myInfo');
    //    $route_info2 = sails.getRouteFor('usercenter/s2cv1/registerByAccount.selCompType');

    //    let $rpath = req.path.toLowerCase();
    //    if(
    //        $rpath != $route_info.url.toLowerCase()
    //        &&
    //        $rpath != $route_info2.url.toLowerCase()
    //    ) {
    //        return res.jsonerr('用户注册未完成', 101);
    //    }
    //} else if($user_row.step == CONST.USER_STEP_COMPINVITE) {
    //    $route_info = sails.getRouteFor('usercenter/s2cv1/user.myInfo');
    //    $route_info2 = sails.getRouteFor('usercenter/s2cv1/registerByInvite.setBaseinfo');

    //    let $rpath = req.path.toLowerCase();
    //    if(
    //        $rpath != $route_info.url.toLowerCase()
    //        &&
    //        $rpath != $route_info2.url.toLowerCase()
    //    ) {
    //        return res.jsonerr('用户注册未完成', 103);
    //    }
    //} else if($user_row.step == CONST.USER_STEP_COMPTYPE) {
    //    $route_info = sails.getRouteFor('usercenter/s2cv1/user.myInfo');
    //    $route_info2 = sails.getRouteFor('usercenter/s2cv1/registerByAccount.addComp');
    //    $route_info3 = sails.getRouteFor('usercenter/s2cv1/registerByAccount.selCompType');

    //    let $rpath = req.path.toLowerCase();
    //    if(
    //        $rpath != $route_info.url.toLowerCase()
    //        &&
    //        $rpath != $route_info2.url.toLowerCase()
    //        &&
    //        $rpath != $route_info3.url.toLowerCase()
    //    ) {
    //        return res.jsonerr('用户注册未完成', 102);
    //    }
    //}


    let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row});
    $user_priv_rows = $user_priv_rows || {};

    req.me = $user_row;
    req.me.privs = $user_priv_rows;
	req.me.token = $token;

    if(sails.config.debugMe && req.__sysvar && req.__sysvar.req_uuid) {
        let req_uuid = req.__sysvar.req_uuid;
        let req_tmstr = moment().format('YYYY-MM-DD HH:mm:ss');
        sails.log.debug('[' + req_uuid + '@' + req_tmstr + '] me  -> \n', req.me);
    }

    return proceed();
}
