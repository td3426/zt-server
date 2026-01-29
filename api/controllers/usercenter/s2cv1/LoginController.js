const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    authAccount: async function (req, res) {
        var $mobile = cutil.getReq(req, 'mobile');
        var $passwd = cutil.getReq(req, 'passwd');
        var $captcha = cutil.getReq(req, 'captcha');
        var $captcha_token = cutil.getReq(req, 'captcha_token');
        var $remember = req.param('remember') ? true : false;

        if(!cutil.authCaptcha($captcha, $captcha_token)) {
            return res.jsonerr('图形验证码不正确');
        }

        try{
            $mobile = cutil.isMobile($mobile);
        } catch (e) {
            return res.jsonerr('请填写正确手机号');
        }

        if($passwd.length < 6) return res.jsonerr('密码错误');

        let $user_row = await User.getUserByMobile($mobile);

        if(!$user_row) return res.jsonerr('账号不存在');
		//平台管理员不允许通过前端登录
		if(parseInt($user_row.memberType) === CONST.USER_TYPE_PLAT_ADMIN) return res.jsonerr('账号不存在');

		let $n_try_row = await UserLoginCheck.findOne({
			userId: $user_row.id
		});
		if(_.size($n_try_row) && $n_try_row.nTry >= 5 && (moment().valueOf() - $n_try_row.updatedAt) <= 86400000) return res.jsonerr('密码错误超过5次，请通过短信验证码登录');

        try{
            await sails.helpers.passwords.checkPassword($passwd, $user_row.passwd);
        } catch (e) {
			if(_.size($n_try_row)) {
				let $n = 'nTry+1';
				if((moment().valueOf() - $n_try_row.updatedAt) > 86400000) $n = 1;
				await sails.getDatastore().sendNativeQuery("update user_login_check set nTry=" + $n + ", updatedAt=" + moment().valueOf() + " where id=" + $n_try_row.id);
			} else
				await UserLoginCheck.create({
					userId : $user_row.id,
					nTry   : 1
				});
            return res.jsonerr('密码错误')
        }

		if(_.size($n_try_row)) {
			await UserLoginCheck.update($n_try_row.id).set({
				nTry: 0
			});
		}

        var $token = cutil.signToken({
            user_id: $user_row.id
        }, $remember ? sails.config.loginToken.ploginExp : sails.config.loginToken.loginExp);

        var $rtoken = cutil.signToken({
            user_id: $user_row.id
        }, $remember ? sails.config.loginToken.ploginRefreshExp : sails.config.loginToken.loginRefreshExp);

        var $comp_row, $ret_comp = {};
        if($user_row.compId) {
            $comp_row = await Comp.findOne({
                id: $user_row.compId
            });

            $ret_comp = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
                "id",
                "compType",
                "compCode",
                "name",
                "shortName",
                "desc",
                "photos",
                "province",
                "city",
				"county",
				"town",
                "addr",
                "logo",
                "contactName",
                "contactPosition",
                "contactMobile",
                "creditIdCode",
                "creditImage",
                "bankIdCode",
                "bankName",
                "bankSubbranch",
                "legalName",
                "legalIdCode",
                "legalIdFront",
                "legalMobile",
                "certStat",
                "certMsg",
				"isInSpec",
				"isInBrandGroup"
            ]));
        }


        //let $stepCode = User.getUserStepCode($user_row.step);
        let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row})

        //部门
        //职务
        let $user_dept_rows = await Dept.getDeptsByCompUserIds({
            comp_id  : $comp_row.id,
            user_ids : [$user_row.id]
        });
        let $user_role_rows = await Role.getRolesByCompUserIds({
            comp_id  : $comp_row.id,
            user_ids : [$user_row.id]
        });

		$user_row.roles = [];
		$user_row.depts = [];

		let $uid = $user_row.id;
		if(typeof $user_role_rows[$uid] != 'undefined') {
			_.each($user_role_rows[$uid], function ($role_row) {
				$user_row.roles.push({
					id   : $role_row.id,
					name : $role_row.name
				});
			});
		}

		if(typeof $user_dept_rows[$uid] != 'undefined') {
			_.each($user_dept_rows[$uid], function ($dept_row) {
				$user_row.depts.push({
					id   : $dept_row.id,
					name : $dept_row.name
				});
			});
		}

        return res.jsonok({
			user  : {
				id           : $user_row.id,
				member_type  : $user_row.memberType,
				member_id    : $user_row.memberId,
				cert_stat    : $user_row.certStat,
				mobile       : $user_row.mobile,
				name         : $user_row.name,
				gender       : $user_row.gender,
				avatar       : $user_row.avatar,
				intro        : $user_row.intro,
				phone        : $user_row.phone,
				tel          : $user_row.tel,
				mail         : $user_row.mail,
				wechat       : $user_row.wechat,
				qq           : $user_row.qq,
				//step       : $user_row.step,
				//step_code  : $stepCode,
				comp_id      : $user_row.compId || $user_row.fromCompId,
				comp_creator : $user_row.compCreator,
				privids      : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
			},
            comp          : $ret_comp,
			dept          : $user_row.depts,
			role          : $user_row.roles,
            token         : $token,
			token_expired : $remember ? sails.config.loginToken.ploginExp : sails.config.loginToken.loginExp,
			refresh_token : $rtoken
        });
    },

    authMobile: async function (req, res) {
        var $mobile = cutil.getReq(req, 'mobile');
        var $code = cutil.getReq(req, 'code');
        var $captcha = cutil.getReq(req, 'captcha');
        var $captcha_token = cutil.getReq(req, 'captcha_token');
        var $remember = req.param('remember') ? true : false;

        if(!cutil.authCaptcha($captcha, $captcha_token)) {
            return res.jsonerr('图形验证码不正确');
        }

        try{
            $mobile = cutil.isMobile($mobile);
        } catch (e) {
            return res.jsonerr('请填写正确手机号');
        }

        if(sails.config.devMode) {
            if($code != '999999') return res.jsonerr('验证码错误');
        } else {
            $code_row = await MobileCode.findOne({
                mobile: $mobile
            });
            if(!$code_row) return res.jsonerr('请先获取验证码');

            if(moment().valueOf() - $code_row.updatedAt >= 30 * 60 * 1000) {
                return res.jsonerr('验证码已经过期,请重新获取');
            }

            if($code_row.code != $code) return res.jsonerr('验证码错误');
        }

        var $user_row = await User.getUserByMobile($mobile);

        if(!$user_row) return res.jsonerr('账号不存在');
		//平台管理员不允许通过前端登录
		if(parseInt($user_row.memberType) === CONST.USER_TYPE_PLAT_ADMIN) return res.jsonerr('账号不存在');

		await UserLoginCheck.update({
			userId: $user_row.id
		}).set({
			nTry: 0
		});

		var $token = cutil.signToken({
            user_id: $user_row.id
        }, $remember ? sails.config.loginToken.ploginExp : sails.config.loginToken.loginExp);

        var $rtoken = cutil.signToken({
            user_id: $user_row.id
        }, $remember ? sails.config.loginToken.ploginRefreshExp : sails.config.loginToken.loginRefreshExp);

        var $comp_row, $ret_comp = {};
        if($user_row.compId) {
            $comp_row = await Comp.findOne({
                id: $user_row.compId
            });

            var $ret_comp = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
                "id",
                "compType",
                "compCode",
                "name",
                "shortName",
                "desc",
                "photos",
                "province",
                "city",
				"county",
				"town",
                "addr",
                "logo",
                "contactName",
                "contactPosition",
                "contactMobile",
                "creditIdCode",
                "creditImage",
                "bankIdCode",
                "bankName",
                "bankSubbranch",
                "legalName",
                "legalIdCode",
                "legalIdFront",
                "legalMobile",
                "certStat",
                "certMsg",
				"isInSpec",
				"isInBrandGroup"
            ]));

        }

        //let $stepCode = User.getUserStepCode($user_row.step)
        let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row})

        //部门
        //职务
        let $user_dept_rows = await Dept.getDeptsByCompUserIds({
            comp_id  : $comp_row.id,
            user_ids : [$user_row.id]
        });
        let $user_role_rows = await Role.getRolesByCompUserIds({
            comp_id  : $comp_row.id,
            user_ids : [$user_row.id]
        });

		$user_row.roles = [];
		$user_row.depts = [];

		let $uid = $user_row.id;
		if(typeof $user_role_rows[$uid] != 'undefined') {
			_.each($user_role_rows[$uid], function ($role_row) {
				$user_row.roles.push({
					id   : $role_row.id,
					name : $role_row.name
				});
			});
		}

		if(typeof $user_dept_rows[$uid] != 'undefined') {
			_.each($user_dept_rows[$uid], function ($dept_row) {
				$user_row.depts.push({
					id   : $dept_row.id,
					name : $dept_row.name
				});
			});
		}

        return res.jsonok({
            user: {
                id           : $user_row.id,
				member_type  : $user_row.memberType,
				member_id    : $user_row.memberId,
				cert_stat    : $user_row.certStat,
                mobile       : $user_row.mobile,
                name         : $user_row.name,
                gender       : $user_row.gender,
                avatar       : $user_row.avatar,
                intro        : $user_row.intro,
                phone        : $user_row.phone,
                tel          : $user_row.tel,
                mail         : $user_row.mail,
                wechat       : $user_row.wechat,
                qq           : $user_row.qq,
                //step       : $user_row.step,
                //step_code  : $stepCode,
                comp_id      : $user_row.compId || $user_row.fromCompId,
				comp_creator : $user_row.compCreator,
                privids      : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
            },
            comp          : $ret_comp,
			dept          : $user_row.depts,
			role          : $user_row.roles,
            token         : $token,
			token_expired : $remember ? sails.config.loginToken.ploginExp : sails.config.loginToken.loginExp,
			refresh_token : $rtoken
        });
    },

    authToken: async function (req, res) {
        const $token = cutil.getReq(req, 'token');
		if(!$token || !$token.length) return res.jsonerr('错误的token');

		let $user_id = 0;
		try {
			let $token_data = cutil.verityToken($token);
			$user_id = $token_data && $token_data.user_id ? $token_data.user_id : 0;
		} catch(e) {
			if(e.name && e.name == 'TokenExpiredError') {
				return res.jsonerr('登录已过期', 2);
			} else {
				return res.jsonerr('未登录: ' + e.message);
			}
		}
		if(!$user_id) return res.jsonerr('错误的token');

        let $user_row = await User.getUser($user_id);
        if(!_.size($user_row)) return res.jsonerr('账号不存在');

        let $comp_row, $ret_comp = {};
        if($user_row.compId) {
            $comp_row = await Comp.findOne({
                id: $user_row.compId
            });

            $ret_comp = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
                "id",
                "compType",
                "compCode",
                "name",
                "shortName",
                "desc",
                "photos",
                "province",
                "city",
				"county",
				"town",
                "addr",
                "logo",
                "contactName",
                "contactPosition",
                "contactMobile",
                "creditIdCode",
                "creditImage",
                "bankIdCode",
                "bankName",
                "bankSubbranch",
                "legalName",
                "legalIdCode",
                "legalIdFront",
                "legalMobile",
                "certStat",
                "certMsg",
				"isInSpec",
				"isInBrandGroup"
            ]));
        }

        //let $stepCode = User.getUserStepCode($user_row.step)
        let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row})

        //部门
        //职务
        let $user_dept_rows = await Dept.getDeptsByCompUserIds({
            comp_id  : $comp_row && $comp_row.id || 0,
            user_ids : [$user_row.id]
        });
        let $user_role_rows = await Role.getRolesByCompUserIds({
            comp_id  : $comp_row && $comp_row.id || 0,
            user_ids : [$user_row.id]
        });

		$user_row.roles = [];
		$user_row.depts = [];

		let $uid = $user_row.id;
		if(typeof $user_role_rows[$uid] != 'undefined') {
			_.each($user_role_rows[$uid], function ($role_row) {
				$user_row.roles.push({
					id   : $role_row.id,
					name : $role_row.name
				});
			});
		}

		if(typeof $user_dept_rows[$uid] != 'undefined') {
			_.each($user_dept_rows[$uid], function ($dept_row) {
				$user_row.depts.push({
					id   : $dept_row.id,
					name : $dept_row.name
				});
			});
		}

        return res.jsonok({
            user: {
                id           : $user_row.id,
				member_type  : $user_row.memberType,
				member_id    : $user_row.memberId,
				cert_stat    : $user_row.certStat,
                mobile       : $user_row.mobile,
                name         : $user_row.name,
                gender       : $user_row.gender,
                avatar       : $user_row.avatar,
                intro        : $user_row.intro,
                phone        : $user_row.phone,
                tel          : $user_row.tel,
                mail         : $user_row.mail,
                wechat       : $user_row.wechat,
                qq           : $user_row.qq,
                comp_id      : $user_row.compId || $user_row.fromCompId,
				comp_creator : $user_row.compCreator,
                privids      : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
            },
            comp  : $ret_comp,
			dept  : $user_row.depts,
			role  : $user_row.roles
        });
    },

    authWx: async function (req, res) {
		let $user_name = "";
		let $wx_code = cutil.getReq(req, 'wx_code');
		if(!_.size($wx_code)) return res.jsonerr('请输入wx_code');

		let $wx_info;
		try {
			let $wx_api = new WxApi(req);
			$wx_info = await $wx_api.code2Session($wx_code);
			if(!_.size($wx_info.openid)) return res.jsonerr('WxApi Error: ' + $wx_info.errmsg);
		} catch($e) {
			return res.jsonerr($e.message || $e.toString());
		}

		let $user_row = await User.findOne({
			txOpenId: $wx_info.openid
		});

		if(!_.size($user_row)) {
			let $n = 1;
			let $ok = false;
			while($n ++ < 5) {
				try {
					//wx+13位随机数
					let $wx_mobile = await cutil.SNID();
					$user_row = await User.createUser({
						txOpenId: $wx_info.openid,
						mobile : 'wx' + $wx_mobile,
						name   : $user_name,
						passwd : "",
						compId: 0,
						compCreator: 0
					}, false, true);
					$ok = true;
					break;
				} catch($e) {
					sails.log.error($e);
				}
			}

			if(!$ok) {
				throw new Error('写入数据失败');
			}
		}

        let $token = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.ploginExp);

        let $rtoken = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.ploginRefreshExp);

        return res.jsonok({
			user             : {
				id           : $user_row.id,
				member_type  : $user_row.memberType,
				member_id    : $user_row.memberId,
				cert_stat    : $user_row.certStat,
				mobile       : $user_row.mobile,
				name         : $user_row.name,
				gender       : $user_row.gender,
				avatar       : $user_row.avatar,
				intro        : $user_row.intro,
				phone        : $user_row.phone,
				tel          : $user_row.tel,
				mail         : $user_row.mail,
				wechat       : $user_row.wechat,
				qq           : $user_row.qq,
				comp_id      : $user_row.compId,
				comp_creator : $user_row.compCreator,
				privids      : []
			},
            comp  : {},
			wx    : {
				openid      : $wx_info.openid
			},
            token         : $token,
			token_expired : sails.config.loginToken.ploginExp,
            refresh_token : $rtoken,
        });
    },

    refreshToken: async function (req, res) {
        let $remember = req.param('remember') ? true : false;

        let $user_row = await User.getUser(req.me.id);
        if(!$user_row) return res.jsonerr('账号不存在');
		//平台管理员不允许通过前端登录
		if(parseInt($user_row.memberType) === CONST.USER_TYPE_PLAT_ADMIN) return res.jsonerr('账号不存在');
	
        let $token = cutil.signToken({
            user_id: req.me.id
        }, $remember ? sails.config.loginToken.ploginExp : sails.config.loginToken.loginExp);

        let $rtoken = cutil.signToken({
            user_id: req.me.id
        }, $remember ? sails.config.loginToken.ploginRefreshExp : sails.config.loginToken.loginRefreshExp);

        return res.jsonok({
            user_id       : req.me.id,
            token         : $token,
			token_expired : $remember ? sails.config.loginToken.ploginExp : sails.config.loginToken.loginExp,
			refresh_token : $rtoken
        });
    },

    getUserStep: async function (req, res) { //unused
		return res.jsonerr('接口弃用');
        var $mobile = cutil.getReq(req, 'mobile');

        try{
            $mobile = cutil.isMobile($mobile);
        } catch (e) {
            return res.jsonerr('请填写正确手机号');
        }

        var $user_row = await User.getUserByMobile($mobile);
        if(!$user_row) return res.jsonerr('该手机号尚未注册');

        //let $stepCode = User.getUserStepCode($user_row.step);
		let $hasPassword = $user_row.passwd && $user_row.passwd.length > 6 ? 1 : 0;

        return res.jsonok({
            //step: $user_row.step,
            //step_code: $stepCode,
			has_password: $hasPassword
        });
    },

    isMobileReg: async function (req, res) {
        let $mobile = cutil.getReq(req, 'mobile');

        try{
            $mobile = cutil.isMobile($mobile);
        } catch (e) {
            return res.jsonerr('请填写正确手机号');
        }

        let $user_row = await User.getUserByMobile($mobile);

        return res.jsonok({
			reg: _.size($user_row) ? 1 : 0
        });
    }
};
