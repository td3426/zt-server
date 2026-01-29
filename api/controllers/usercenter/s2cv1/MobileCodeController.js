const moment = require('moment');
const flaverr = require('flaverr');

async function genCode(req, res, $mobile, $tplid) {
    if($mobile.length != 11 || !/[0-9]/gi.test($mobile)) return res.jsonerr('请正确填写手机号');

    let $code =  _.random(100000, 999999);

    let $code_row = await MobileCode.findOne({
        mobile: $mobile
    });

    if($code_row) {
        let $tmval = moment().valueOf() - $code_row.updatedAt;
        if($tmval < 60 * 1000) {
            return res.jsonerr('请' + (Math.ceil(60 * 1000 - $tmval)/1000) + '秒后再获取');
        }

        await MobileCode
            .update({
                mobile: $mobile
            })
            .set({
                code: $code
            });
    } else {
        await MobileCode
            .create({
                mobile: $mobile,
                code: $code
            })
            .fetch();
    }
    
    if(sails.config.devMode) {
        return res.jsonok('ok');
    }

    try {
        await cutil.sendSMS([$mobile], $tplid, {code: $code});
    } catch (err) {
        sails.log.error(err);
        return res.jsonerr('验证码发送失败');
    }

    return res.jsonok('ok');
}

async function genActionCode(req, res, $mobile, $tplid, $action) {
    if($mobile.length != 11 || !/[0-9]/gi.test($mobile)) return res.jsonerr('请正确填写手机号');

    let $code =  _.random(100000, 999999);

    let $code_row = await MobileCode.findOne({
        mobile: $mobile
    });

	if($code_row) {
		let $tmval = moment().valueOf() - $code_row.updatedAt;
		if($tmval < 60 * 1000) {
			return res.jsonerr('请' + (Math.ceil(60 * 1000 - $tmval)/1000) + '秒后再获取');
		}

		await MobileCode.update({
			mobile: $mobile
		}).set({
			code: $code
		});
	} else {
		await MobileCode.create({
			mobile: $mobile,
			code: $code
		}).fetch();
	}
    
    if(sails.config.devMode) {
        return res.jsonok('ok');
    }

    try {
        await cutil.sendSMS([$mobile], $tplid, {code: $code, action: $action});
    } catch (err) {
        sails.log.error(err);
        return res.jsonerr('验证码发送失败');
    }

    return res.jsonok('ok');
}


module.exports = {
    registerCode: async function(req, res) {
        let $mobile = cutil.getReq(req, 'mobile');

        try {
			if($mobile.length != 11) throw new Error('请输入手机号'); 
            $mobile = cutil.isMobile($mobile);
        } catch (err) {
            return res.jsonerr('请输入手机号');
        }

        let $user_row = await User.getUserByMobile($mobile);
        if($user_row) return res.jsonerr('该手机号已经注册过了');

        return await genCode(req, res, $mobile, sails.config.sendcloud.smsRegId);
    },

    loginCode: async function(req, res) {
        var $mobile = cutil.getReq(req, 'mobile');
        return await genCode(req, res, $mobile, sails.config.sendcloud.smsLoginId);
    },

    resetPasswdCode: async function(req, res) {
        var $mobile = cutil.getReq(req, 'mobile');
        return await genCode(req, res, $mobile, sails.config.sendcloud.smsFindPassId);
    },

    changeManagerCode: async function(req, res) {
		if(!req.me.id) return res.jsonerr('未登录');

		let $user_row = await User.findOne({
			id: req.me.id
		});
		if(!_.size($user_row)) return res.jsonerr('未找到用户数据记录');
		if(!$user_row.compCreator) return res.jsonerr('您不是管理员');

		let $mobile = $user_row.mobile;
        return await genCode(req, res, $mobile, sails.config.sendcloud.smsChangeManager);
    },

    getCode: async function(req, res) {
        let $mobile = cutil.getReq(req, 'mobile');
        let $code_type = cutil.getReq(req, 'code_type');

		let $action_map = {
			"apply_factory_agency" : "申请代理商",
		};
		if(!_.has($action_map, $code_type)) return res.jsonerr('类型未注册');

		let $action = $action_map[$code_type];

        return await genActionCode(req, res, $mobile, sails.config.sendcloud.smsAction, $action);
    },
};
