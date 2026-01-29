"use strict"

const moment = require('moment');
const flaverr = require('flaverr');
const {validator, sanitizer} = require('indicative');
const validate = validator.validate;
const sanitize = sanitizer.sanitize;


module.exports = {
    register: async function (req, res) {
		try {
			await validate(req.allParams(), {
				user_name   : 'required|string|accepted',
				user_mobile : 'required|string|accepted',
			}, {
				'user_name'   : '请填写姓名',
				'user_mobile' : '请填写手机号',
			});
		} catch($e) {
			return res.jsonerr($e.map(v => (v.message)));
		}

		let $data = sanitize(req.allParams(), {
			user_name: 'strip_tags',
			user_mobile: 'strip_tags',
		});

		let $user_name   = $data.user_name;
		let $user_mobile = $data.user_mobile;
		let $user_pass   = cutil.getReq(req, 'user_pass');

        try {
			if($user_mobile.length != 11) throw new Error('请输入手机号'); 
            $user_mobile = cutil.isMobile($user_mobile);
        } catch (err) {
            return res.jsonerr('请输入手机号');
        }

		if($user_pass.length < 8) return res.jsonerr('密码至少8位');

        let $user_row = await User.getUserByMobile($user_mobile);
        if($user_row) return res.jsonerr('该手机号已存在');

		//const $user_pass = await cutil.randomCustom('23456789abcdefghjkmnpqrstuvwxyz#@:', 8);
        const $user_pass_hash = await sails.helpers.passwords.hashPassword($user_pass);

		try {
			$user_row = await User.create({
				memberType : CONST.USER_TYPE_PLAT_ADMIN,
				mobile     : $user_mobile,
				name       : $user_name,
				passwd     : $user_pass_hash
			}).fetch();
		} catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }

		//try {
		//	await cutil.sendSMS([$user_mobile], 758213, {code: $user_pass});
		//} catch($e) {
        //    sails.log.warn($e);
        //    return res.jsonerr('初始密码短信发送失败');
		//}

		const $ret = {
			id          : $user_row.id,
			name        : $user_row.name,
			mobile      : $user_row.mobile,
			member_type : $user_row.memberType
		};
		await OpLog.add(req.appid, $user_row.id, CONST.OP_LOG_TYPE_ACCOUNT_REG, $ret, null);

		return res.jsonok($ret);
	},

	sendRandPass: async function(req, res) {
		let $user_mobile = cutil.getReq(req, 'user_mobile');
		const $user_pass = cutil.getReq(req, 'user_pass');

        try {
			if($user_mobile.length != 11) throw new Error('请输入手机号'); 
            $user_mobile = cutil.isMobile($user_mobile);
        } catch (err) {
            return res.jsonerr('请输入手机号');
        }


		try {
			await cutil.sendSMS([$user_mobile], sails.config.sendcloud.smsPlatAdminRandPass, {code: $user_pass});
		} catch($e) {
            sails.log.warn($e);
            return res.jsonerr('初始密码短信发送失败');
		}

		await OpLog.add(req.appid, $user_row.id, CONST.OP_LOG_TYPE_ACCOUNT_SEND_PASS, {
			user_mobile : $user_mobile
		}, null);

		return res.jsonok('ok');
	},

    login: async function (req, res) {
        let $mobile = cutil.getReq(req, 'mobile');
        let $passwd = cutil.getReq(req, 'passwd');
        let $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;
        let $expire_time = parseInt(cutil.getReq(req, 'expire_time')) || 0; //单位秒

        try{
            $mobile = cutil.isMobile($mobile);
        } catch (e) {
            return res.jsonerr('请填写手机号');
        }

        if($passwd.length < 8) return res.jsonerr('密码至少8位');

		if(!$comp_id) return res.jsonerr('请指定要登录的企业id');
		if(!$expire_time) return res.jsonerr('请指定此次登录的过期时长，单位秒');


        let $user_row = await User.getUserByMobile($mobile);
        if(!$user_row) return res.jsonerr('账号不存在');

        try{
            await sails.helpers.passwords.checkPassword($passwd, $user_row.passwd);
        } catch (e) {
            return res.jsonerr('密码错误')
        }

		if(!await CompDeptUserRel.count({
			compId : $comp_id,
			userId : $user_row.id
		})) return res.jsonerr('用户未加入该企业');

		await User.update($user_row.id).set({
			compId: $comp_id
		});

        let $token = cutil.signToken({
            user_id: $user_row.id
        }, $expire_time);

		let $ret = {};
		let $comp_row = await Comp.findOne({
			id: $comp_id
		});

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

		$comp_row = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
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

		await OpLog.add(req.appid, $user_row.id, CONST.OP_LOG_TYPE_ACCOUNT_LOGIN, {
			id          : $user_row.id,
			member_type : $user_row.memberType,
			mobile      : $user_row.mobile,
			name        : $user_row.name,
			comp_id     : $comp_id,
			privids     : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
		}, null);

        return res.jsonok({
			user  : {
				id          : $user_row.id,
				member_type : $user_row.memberType,
				mobile      : $user_row.mobile,
				name        : $user_row.name,
				comp_id     : $comp_id,
				privids     : $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : []
			},
            comp          : $comp_row,
			dept          : $user_row.depts,
			role          : $user_row.roles,
            token         : $token,
			token_expired : $expire_time
        });
	},

    resetPasswd: async function (req, res) {
	},

    modifyPasswd: async function (req, res) {
        const $user_id = parseInt(cutil.getReq(req, 'user_id')) || 0;
        const $old_pass = cutil.getReq(req, 'old_pass');
        const $new_pass = cutil.getReq(req, 'new_pass');

		if(!$user_id) return res.jsonerr('请指定用户id');
		if($old_pass.length < 8) return res.jsonerr('密码至少8位');
		if($new_pass.length < 8) return res.jsonerr('密码至少8位');

		const $user_row = await User.findOne($user_id);
        try {
            await sails.helpers.passwords.checkPassword($old_pass, $user_row.passwd);
        } catch (e) {
            return res.jsonerr('原密码错误')
        }
        const $user_pass_hash = await sails.helpers.passwords.hashPassword($new_pass);

		await User.update($user_id).set({
			passwd : $user_pass_hash
		});

		await OpLog.add(req.appid, $user_id, CONST.OP_LOG_TYPE_ACCOUNT_MODIFY_PASSWD, {user_id: $user_id}, null);

		return res.jsonok('ok');
	},

    joinComp: async function (req, res) {
        const $user_id = parseInt(cutil.getReq(req, 'user_id')) || 0;
        const $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;
        //const $dept_id = parseInt(cutil.getReq(req, 'dept_id')) || 0;
        const $dept_id = 0;
	
		if(!$user_id) return res.jsonerr('请指定用户id');
		if(!$comp_id) return res.jsonerr('请指定企业id');
	
		if(!await User.count({id: $user_id})) return res.jsonerr('用户不存在');
		if(!await Comp.count({id: $comp_id})) return res.jsonerr('企业不存在');

		if(await CompDeptUserRel.count({
			compId : $comp_id,
			userId : $user_id
		})) return res.jsonok('ok');
	
		await CompDeptUserRel.create({
			compId: $comp_id,
			deptId: $dept_id,
			userId: $user_id,
		});

		await OpLog.add(req.appid, $user_id, CONST.OP_LOG_TYPE_ACCOUNT_JOIN_COMP, {user_id: $user_id, comp_id: $comp_id, dept_id: $dept_id}, null);
	
		return res.jsonok('ok');
	},

    quitComp: async function (req, res) {
        const $user_id = parseInt(cutil.getReq(req, 'user_id')) || 0;
        const $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;

		if(!$user_id) return res.jsonerr('请指定用户id');
		if(!$comp_id) return res.jsonerr('请指定企业id');

		let $user_row = await User.findOne({id: $user_id});
		if(!_.size($user_row)) return res.jsonerr('用户不存在');
		if(!await Comp.count({id: $comp_id})) return res.jsonerr('企业不存在');

		if(!await CompDeptUserRel.count({
			compId : $comp_id,
			userId : $user_id
		})) return res.jsonerr('企业不存在该用户');

		await CompDeptUserRel.destroy({
			compId: $comp_id,
			userId: $user_id
		});

		if(parseInt($user_row.compId) == $comp_id) await User.update($user_id).set({compId: 0});

		await OpLog.add(req.appid, $user_id, CONST.OP_LOG_TYPE_ACCOUNT_QUIT_COMP, {user_id: $user_id, comp_id: $comp_id}, null);

		return res.jsonok('ok');
	},
};

