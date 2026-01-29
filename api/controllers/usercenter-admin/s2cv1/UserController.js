const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    regCompAccount: async function(req, res) {
        let $comp_name       = cutil.getReq(req, 'comp_name');
		let $comp_type       = cutil.getReq(req, 'comp_type');
        let $user_name       = cutil.getReq(req, 'user_name');
        let $user_mobile     = cutil.getReq(req, 'user_mobile');
        let $user_pass       = cutil.getReq(req, 'user_pass');

        try {
			if($user_mobile.length != 11) throw new Error('请输入手机号'); 
            $user_mobile = cutil.isMobile($user_mobile);
        } catch (err) {
            return res.jsonerr('请输入手机号');
        }

        let $user_row = await User.getUserByMobile($user_mobile);
        if(_.size($user_row)) return res.jsonerr('该手机号已经注册过了');

        if($user_name.length < 1) return res.jsonerr('请输入姓名');
        if($user_pass.length < 8) return res.jsonerr('密码至少8位');
        if($user_pass.length > 20) return res.jsonerr('密码最长20位');

        if($comp_name.length < 1) return res.jsonerr('请输入企业名称');
        //if(!_.has(sails.config.dict.componyType, $comp_type)) return res.jsonerr('类型不存在');

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
						shortName : '',
						compType  : $comp_type,
						province  : '',
						city      : '',
						county    : '',
						town      : '',
						addr      : '',
						logo      : '',
						createdBy : $user_row.id
					}).fetch().usingConnection(db);

                    await CompDeptUserRel.create({
                            compId: $comp_row.id,
                            deptId: 0,
                            userId: $user_row.id
                        }).usingConnection(db);

                    await User.setUser($user_row.id, {
                            compId      : $comp_row.id,
							memberId    : "1",
                            compCreator : 1
                        }, db);
					$user_row.compId      = $comp_row.id;
					$user_row.memberId    = 1;
					$user_row.compCreator = 1;

                    return proceed(undefined, 'ok');
                } catch ($err) {
                    sails.log.error($err);
					throw $err;
                }
            });
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }

		try {
			const mq = new MqApi(req);
			mq.notifyAddComp({id: $comp_row.id});
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok($user_row);
	},
};
