const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    authCode: async function (req, res) { //unused
		return res.jsonerr('接口弃用');
        var $comp_code = cutil.getReq(req, 'comp_code');
        var $invite_code = cutil.getReq(req, 'invite_code');
        var $mobile_code = cutil.getReq(req, 'mobile_code');
        var $captcha = cutil.getReq(req, 'captcha');
        var $captcha_token = cutil.getReq(req, 'captcha_token');

        try {
            $mobile = cutil.isMobile(cutil.getReq(req, 'mobile'));
        } catch (err) {
            return res.jsonerr('请输入手机号');
        }

        if(!cutil.authCaptcha($captcha, $captcha_token)) {
            return res.jsonerr('图形验证码不正确');
        }

        var $comp_row;
        try {
            $comp_row = await Comp.findOne({
                compCode: $comp_code
            });
        } catch (err) {
            return res.jsonerr('机构号不正确');
        }
        if(!$comp_row) return res.jsonerr('机构号不正确');

        $invite_code_row = await InviteCode.findOne({
            fromCompId: $comp_row.id,
            code: $invite_code
        });

        if(!$invite_code_row) return res.jsonerr('邀请码不存在');

        if(moment().valueOf() - $invite_code_row.createdAt > 86400 * 1000 * 7) return res.jsonerr('邀请码已过期');

        let $user_row = await User.getUserByMobile($mobile);
        if($user_row) return res.jsonerr('该手机号已经注册过了');

        if(sails.config.devMode) {
            if($mobile_code != '999999') return res.jsonerr('验证码错误');
        } else {
            $code_row = await MobileCode.findOne({
                mobile: $mobile
            });
            if(!$code_row) return res.jsonerr('请先获取验证码');

            if(moment().valueOf() - $code_row.updatedAt >= 30 * 60 * 1000) {
                return res.jsonerr('验证码已经过期,请重新获取');
            }

            if($code_row.code != $mobile_code) return res.jsonerr('验证码错误');
        }

        $user_row = await User.createUser({
                mobile: $mobile,
                name: '',
                fromCompId: $invite_code_row.fromCompId,
                fromUserId: $invite_code_row.fromUserId,
                //step: CONST.USER_STEP_COMPINVITE
            }, false, true);

        let $token = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.loginExp);

        let $rtoken = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.loginRefreshExp);

        //let $stepCode = User.getUserStepCode($user_row.step);
        let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row})
        var $ret_comp = {};
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
            "certMsg"
        ]));

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
				//step       : $user_row.step,
				//step_code  : $stepCode,
				comp_id      : $user_row.compId || $user_row.fromCompId,
				comp_creator : $user_row.compCreator,
				privids      : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
			},
            comp          : $ret_comp,
            token         : $token,
			token_expired : sails.config.loginToken.loginExp,
			refresh_token : $rtoken
        });
    },

    setBaseinfo: async function(req, res) { //unused
		return res.jsonerr('接口弃用');

        var $name = cutil.getReq(req, 'name');
        var $passwd = cutil.getReq(req, 'passwd');
        var $passwd_confirmed = cutil.getReq(req, 'passwd_confirmed');

        if($name.length < 1) return res.jsonerr('请输入姓名');
        if($passwd.length < 6) return res.jsonerr('密码长度至少6位');
        if($passwd != $passwd_confirmed) return res.jsonerr('两次密码不匹配');

        //if(req.me.step != CONST.USER_STEP_COMPINVITE) {
        //    return res.jsonerr('没有权限');
        //}

        var $comp_row;
        if(req.me.fromCompId) {
            $comp_row = await Comp.findOne({
                id: req.me.fromCompId
            });

            if(!$comp_row) return res.jsonerr('邀请信息不存在');
        }

        $password_hash = await sails.helpers.passwords.hashPassword($passwd);

        try {

            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
                    await User.setUser(req.me.id, {
                            name: $name,
                            passwd: $password_hash,
                            //step: CONST.USER_STEP_BASE
                        }, db);

                    if(req.me.fromCompId) {
                        await CompDeptUserRel.create({
                                compId: req.me.fromCompId,
                                deptId: 0,
                                userId: req.me.id
                            })
                            .usingConnection(db);

                        await User.setUser(req.me.id, {
                                //step: CONST.USER_STEP_COMP,
                                compId: req.me.fromCompId,
                                compCreator: 0
                            }, db);
                    }

                    return proceed(undefined, req.me.id);
                } catch (err) {
                    sails.log.error(err);
                    return proceed(flaverr(
                        'E_ERROR',
                        new Error('数据写入失败')
                    ));
                }
            });

        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }


        var $user_row = await User.getUser(req.me.id);
        //let $stepCode = User.getUserStepCode($user_row.step);
        let $user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row})
        var $ret_comp = {};
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
            "certMsg"
        ]));

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
				//step       : $user_row.step,
				//step_code  : $stepCode,
				comp_id      : $user_row.compId || $user_row.fromCompId,
				comp_creator : $user_row.compCreator,
				privids      : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
			},
            comp: $ret_comp
        });
    },

	authInviteCode: async function (req, res) {
        let $comp_code = cutil.getReq(req, 'comp_code');
        let $invite_code = cutil.getReq(req, 'invite_code');

		if(!$comp_code.length) return res.jsonerr('机构号为空');
		if(!$invite_code.length) return res.jsonerr('邀请码为空');

		let $comp_row = await Comp.findOne({
			compCode: $comp_code
		});
        if(!_.size($comp_row)) return res.jsonerr('机构号不正确');

        let $invite_code_row = await InviteCode.findOne({
            fromCompId: $comp_row.id,
            code: $invite_code
        });
        if(!_.size($invite_code_row)) return res.jsonerr('邀请码不存在');
	
		return res.jsonok('ok');
	},

    regByInvite: async function (req, res) {
        let $comp_code = cutil.getReq(req, 'comp_code');
        let $invite_code = cutil.getReq(req, 'invite_code');

        let $user_name       = cutil.getReq(req, 'user_name');
        let $user_mobile     = cutil.getReq(req, 'user_mobile');
        let $user_pass       = cutil.getReq(req, 'user_pass');
        let $mobile_code     = cutil.getReq(req, 'mobile_code');
        let $captcha         = cutil.getReq(req, 'captcha');
        let $captcha_token   = cutil.getReq(req, 'captcha_token');


		if(!$comp_code.length) return res.jsonerr('机构号为空');
		if(!$invite_code.length) return res.jsonerr('邀请码为空');

		let $comp_row = await Comp.findOne({
			compCode: $comp_code
		});
        if(!_.size($comp_row)) return res.jsonerr('机构号不正确');

        let $invite_code_row = await InviteCode.findOne({
            fromCompId: $comp_row.id,
            code: $invite_code
        });
        if(!_.size($invite_code_row)) return res.jsonerr('邀请码不存在');

        if(!cutil.authCaptcha($captcha, $captcha_token)) {
            return res.jsonerr('图形验证码不正确');
        }

        try {
			if($user_mobile.length != 11) throw new Error('请输入手机号'); 
            $user_mobile = cutil.isMobile($user_mobile);
        } catch (err) {
            return res.jsonerr('请输入手机号');
        }

        let $user_row = await User.getUserByMobile($user_mobile);
        if($user_row) return res.jsonerr('该手机号已经注册过了');

		if($mobile_code.length < 1) return res.jsonerr('请输入手机验证码');
        if(sails.config.devMode) {
            if($mobile_code != '999999') return res.jsonerr('验证码错误');
        } else {
            $code_row = await MobileCode.findOne({
                mobile: $user_mobile
            });
            if(!$code_row) return res.jsonerr('请先获取验证码');

            if(moment().valueOf() - $code_row.updatedAt >= 30 * 60 * 1000) {
                return res.jsonerr('验证码已经过期,请重新获取');
            }

            if($code_row.code != $mobile_code) return res.jsonerr('验证码错误');
        }

        if($user_name.length < 1) return res.jsonerr('请输入姓名');
        if($user_pass.length < 8) return res.jsonerr('密码至少8位');
        if($user_pass.length > 20) return res.jsonerr('密码最长20位');

        $user_pass_hash = await sails.helpers.passwords.hashPassword($user_pass);

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
					$user_row = await User.createUser({
						mobile : $user_mobile,
						name   : $user_name,
						passwd : $user_pass_hash,
                        compId : $comp_row.id,
					}, db, true);

                    await CompDeptUserRel.create({
                            compId: $comp_row.id,
                            deptId: 0,
                            userId: $user_row.id
                        }).usingConnection(db);

					let $member_id = await User.getMemberId($comp_row.id, $user_row.id, db);
					if(!$member_id) throw "生成员工编号失败";

					await User.setUser($user_row.id, {
						memberId: $member_id
					}, db);
					$user_row.memberId = $member_id;

                    return proceed(undefined, 'ok');
                } catch ($err) {
                    sails.log.error($err);
					return proceed(flaverr('E_USER_ERROR', new Error('写入数据失败')));
                }
            });
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }

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


		let $ret = {};

        $ret.token = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.loginExp);

		$ret.token_expired = sails.config.loginToken.loginExp;

        $ret.refresh_token = cutil.signToken({
            user_id: $user_row.id
        }, sails.config.loginToken.loginRefreshExp);

		$ret.user = {
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
		};
		$ret.comp = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
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
			"certMsg"
		]));

		$ret.dept  = $user_row.depts;
		$ret.role  = $user_row.roles;

        return res.jsonok($ret);
	},
};
