const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

	getNeedVerifyByMobiles: async function(req, res) {
        var $mobiles = req.param('mobiles');

		var $ret =[];
		if($mobiles) {
			let $comp_ids = {};
			let $user_rows = await User.find({
				where: {
					mobile: $mobiles
				},
				select: ['compId']
			});

			if(_.size($user_rows)) {
				$comp_ids = cutil.getTabCol($user_rows, 'compId');
				if(_.size($comp_ids)) {
					let $comp_rows = await Comp.find({
						where: {
							id: _.values($comp_ids)
						},
						select: ['id', 'name', 'fddVerifyTransactionNo']
					});
					if(_.size($comp_rows)) {
						_.each($comp_rows, function($comp_row) {
							$ret.push({
								id            : $comp_row.id,
								name          : $comp_row.name,
								transactionNo : $comp_row.fddVerifyTransactionNo
							});
						});
					}
				}
			}
		}

		return res.jsonok($ret);
	},

	passVerifyCompanyByMobile: async function(req, res) {
        var $mobiles = req.param('mobiles');
		if(!_.isArray($mobiles) || !_.size($mobiles)) return res.jsonerr('请输入手机号');

		var $user_rows = await User.find({
			mobile: $mobiles
		});
		if(!$user_rows || !_.size($user_rows)) return res.jsonerr('用户不存在');

		var $comp_ids = {};
		_.each($user_rows, function($user_row) {
			var $comp_id = parseInt($user_row.compId);
			if($comp_id) {
				$comp_ids[$comp_id] = $comp_id;
			}
		});
		if(!$comp_ids || !_.size($comp_ids)) return res.jsonerr('公司id为空');

		let $comp_rows = await Comp.update(_.values($comp_ids)).set({
			certStat: CONST.CERTIFYCATION_STAT_SUCCESS
		}).fetch();
		if(!_.size($comp_rows)) return res.jsonerr('写数据库失败');

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.company.exchange);

			for(let $comp_row of $comp_rows) {
				await mq.tranSend(sails.config.mqApi.company.routeUpdate, {id: $comp_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	addUser: async function(req, res) {
		let $comp_name = cutil.getReq(req, 'comp_name');
		if(!$comp_name) return res.jsonerr('请输入公司名称');

		let $comp_type = parseInt(cutil.getReq(req, 'comp_type')) || 0;
		if(!$comp_type) return res.jsonerr('请输入公司类型');

		let $user_mobile = cutil.getReq(req, 'user_mobile');
		if(!$user_mobile) return res.jsonerr('请输入登录手机号');

		let $user_name = cutil.getReq(req, 'user_name');
		if(!$user_name) return res.jsonerr('请输入用户名称');

		let $user_pass = cutil.getReq(req, 'user_pass');
		if(!$user_pass || $user_pass.length < 6) return res.jsonerr('请输入登录密码');
        let $password_hash = await sails.helpers.passwords.hashPassword($user_pass);

		if(await Comp.count({
			name     : $comp_name,
			certStat : CONST.CERTIFYCATION_STAT_SUCCESS
		})) return res.jsonerr('该名称的公司已经存在');

		if(await User.count({
			mobile:$user_mobile 
		})) return res.jsonerr('该手机号已经存在');

		try {
			let $comp_row = null;
			let $ret = await sails.getDatastore('default').transaction(async (db, proceed) => {
				try {
					let $user_row = await User.createUser({
						name: $user_name,
						mobile: $user_mobile,
						passwd: $password_hash,
					}, db, true);

					let $comp_code = await Comp.genCompCode(db);
					$comp_row = await Comp.create({
						compType  : $comp_type,
						compCode  : $comp_code,
						name      : $comp_name,
						regFrom   : CONST.COMPONY_REG_FROM_PLAT,
						createdBy : $user_row.id
					}).fetch().usingConnection(db);

					await CompDeptUserRel.create({
						compId: $comp_row.id,
						deptId: 0,
						userId: $user_row.id
					}).usingConnection(db);

					await User.setUser($user_row.id, {
						//step: CONST.USER_STEP_COMP,
						compId: $comp_row.id,
						memberId: "1",
						compCreator: 1
					}, db);

					return proceed(undefined, {
						user_id: $user_row.id,
						comp_id: $comp_row.id
					});
				} catch (err) {
					return proceed(err);
				}
			});

			try {
				const mq = new MqApi(req);
				mq.notifyAddComp({id: $comp_row.id});
			} catch($e) {
				sails.log.error($e);
			}


			return res.jsonok($ret);
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

			sails.log.error($e);
			return res.jsonerr($e.message || $e.toString());
		}
	},

};

