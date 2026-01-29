const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    //验证手机号注册
	regByMobile: async function (req, res) {
        let $comp_name       = cutil.getReq(req, 'comp_name');
        let $comp_short_name = cutil.getReq(req, 'comp_short_name');
		let $comp_type       = cutil.getReq(req, 'comp_type');
		let $comp_province   = cutil.getReq(req, 'province');
		let $comp_city       = cutil.getReq(req, 'city');
		let $comp_county     = cutil.getReq(req, 'county');
		let $comp_town       = cutil.getReq(req, 'town');
		let $comp_addr       = cutil.getReq(req, 'comp_addr');
		let $comp_logo       = cutil.getReq(req, 'comp_logo');

        let $user_name       = cutil.getReq(req, 'user_name');
        let $user_mobile     = cutil.getReq(req, 'user_mobile');
        let $user_pass       = cutil.getReq(req, 'user_pass');
        let $mobile_code     = cutil.getReq(req, 'mobile_code');
        let $captcha         = cutil.getReq(req, 'captcha');
        let $captcha_token   = cutil.getReq(req, 'captcha_token');


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


        if($comp_name.length < 1) return res.jsonerr('请输入企业名称');
        if(!_.has(sails.config.dict.componyType, $comp_type)) return res.jsonerr('类型不存在');

        let $comp_row = await Comp.findOne({
            name: $comp_name,
            certStat: [CONST.CERTIFYCATION_STAT_APLLY, CONST.CERTIFYCATION_STAT_SUCCESS]
        });
        if(_.size($comp_row)) return res.jsonerr('公司已经存在');


        $user_pass_hash = await sails.helpers.passwords.hashPassword($user_pass);

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
					$user_row = await User.createUser({
						mobile : $user_mobile,
						name   : $user_name,
						passwd : $user_pass_hash
					}, db, true);

					let $comp_code = await Comp.genCompCode(db);
					$comp_row = await Comp.create({
						compCode  : $comp_code,
						name      : $comp_name,
						shortName : $comp_short_name,
						compType  : $comp_type,
						province  : $comp_province,
						city      : $comp_city,
						county    : $comp_county,
						town      : $comp_town,
						addr      : $comp_addr,
						logo      : $comp_logo,
						createdBy : $user_row.id
					}).fetch().usingConnection(db);

                    await CompDeptUserRel.create({
                            compId: $comp_row.id,
                            deptId: 0,
                            userId: $user_row.id
                        }).usingConnection(db);

                    await User.setUser($user_row.id, {
                            compId: $comp_row.id,
							memberId: "1",
                            compCreator: 1
                        }, db);
					$user_row.memberId = 1;
					$user_row.compCreator = 1;

                    return proceed(undefined, 'ok');
                } catch ($err) {
                    sails.log.error($err);
					throw $err;
                }
            });
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败111');
        }

		try {
			const mq = new MqApi(req);
			mq.notifyAddComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
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
