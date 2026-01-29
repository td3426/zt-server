const moment = require('moment');
const flaverr = require('flaverr');

async function checkUserManager(me, $user_id) {
    //me and owner can do it ...

    if(me.id == $user_id) return true;

    if(!me.compId) throw new Error('还没创建公司, 请先创建公司');
    if(!cutil.ucan(me.privs, CONST.PRIV_COMP_MANAGE_STRUCTURE)) return res.jsonerr('没有权限');

    var $comp_row = await Comp.findOne({
        id: me.compId
    });
    if(!$comp_row) throw new Error('还没创建公司, 请先创建公司');

    $dept_chk_nrow = await CompDeptUserRel.count({
            compId: me.compId,
            userId: $user_id
        });
    if(!$dept_chk_nrow) throw new Error('用户不存在');

    return true;
}

module.exports = {

    list: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $user_ids = cutil.getReqSP(req, 'user_ids', 'int');
        // var $has_err = false;
        // _.each($user_ids, function($user_id){
        //     if(typeof $user_id != 'number' || !$user_id) {
        //         $has_err = true;
        //         return false;
        //     }
        // });
        // if($has_err) return res.jsonerr('user_ids参数包含无效id');
        if($user_ids.length < 1) return res.jsonerr('请选择成员');

        var $comp_user_rows = await CompDeptUserRel.find({
                compId: $comp_row.id,
                userId: $user_ids
            });

        var $user_ids = cutil.getTabCol($comp_user_rows, 'userId');

        $user_rows = await User.getUsers(_.values($user_ids));

        //部门
        //职务
        let $user_dept_rows = await Dept.getDeptsByCompUserIds({
            comp_id: $comp_id,
            user_ids: _.values($user_ids)
        });
        let $user_role_rows = await Role.getRolesByCompUserIds({
            comp_id: $comp_id,
            user_ids: _.values($user_ids)
        });

        _.each($user_rows, function($user_row, $uid){
            $user_row.roles = [];
            $user_row.depts = [];

            if(typeof $user_role_rows[$uid] != 'undefined') {
                _.each($user_role_rows[$uid], function ($role_row) {
                    $user_row.roles.push({
                        id: $role_row.id,
                        name: $role_row.name
                    });
                });
            }

            if(typeof $user_dept_rows[$uid] != 'undefined') {
                _.each($user_dept_rows[$uid], function ($dept_row) {
                    $user_row.depts.push({
                        id: $dept_row.id,
                        name: $dept_row.name
                    });
                });
            }
        });


        var retFds = [
            'id',
			'memberType',
            'memberId',
			'certStat',
            'mobile',
            'name',
            'gender',
            'avatar',
            'intro',
            'phone',
            'tel',
            'mail',
            'wechat',
            'qq',
            'compId',
            'roles',
            'depts',
            'oriMobile',
            'stat'
        ];

        var ret = {};
        _.each($user_rows, function($user_row) {
            ret[$user_row.id] = cutil.snakeCaseObject(cutil.getRowCols($user_row, retFds));
        });

        return res.jsonok(ret);
    },

    myInfo: async function(req, res) {
        var $comp_id = parseInt(req.me.compId) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $user_id = parseInt(req.me.id) || 0;
        if(!$user_id) return res.jsonerr('用户不存在');

        $user_row = await User.getUser($user_id);

        let ret = cutil.snakeCaseObject($user_row);;
        return res.jsonok(ret);
    },

    update: async function(req, res) {
        var $set = {};
        var $user_id = parseInt(cutil.getReq(req, "user_id")) || 0;
        if(!$user_id) return res.jsonerr('用户不存在');

        try{
            await checkUserManager(req.me, $user_id);
        } catch(e) {
            return res.jsonerr(e.message);
        }

        if(req.me.certStat != CONST.CERTIFYCATION_STAT_SUCCESS && typeof req.param('name') != 'undefined') {
            $set.name = cutil.getReq(req, "name");
            if($set.name.length < 1) return res.jsonerr('请填写姓名');
        }

		//只有管理员能编辑
        if(req.me.compCreator) {
			$set.memberId = cutil.getReq(req, "member_id");
			if(!$set.memberId || !$set.memberId.length) return res.jsonerr('请输入员工编号');
			if(await User.count({
				compId: req.me.compId,
				memberId: $set.memberId,
				id: {
					'!=': $user_id
				}
			})) return res.jsonerr('员工编号已存在');
		}

        if(typeof req.param('intro') != 'undefined') $set.intro = cutil.getReq(req, "intro");
        if(typeof req.param('phone') != 'undefined') $set.phone = cutil.getReq(req, "phone");
        if(typeof req.param('tel') != 'undefined') $set.tel = cutil.getReq(req, "tel");
        if(typeof req.param('mail') != 'undefined') $set.mail = cutil.getReq(req, "mail");
        if(typeof req.param('wechat') != 'undefined') $set.wechat = cutil.getReq(req, "wechat");
        if(typeof req.param('qq') != 'undefined') $set.qq = cutil.getReq(req, "qq");
        if(typeof req.param('avatar') != 'undefined') $set.avatar = cutil.getReq(req, "avatar");
        if(req.me.certStat != CONST.CERTIFYCATION_STAT_SUCCESS && typeof req.param('gender') != 'undefined') {
            $set.gender = parseInt(cutil.getReq(req, "gender")) || 0;
            $set.gender = ($set.gender == 1 || $set.gender == 2) ? $set.gender : 0;
        }

        var $sets_depts;
        if(typeof req.param('dept_ids') != 'undefined') {
            $sets_depts = [];
            var $dept_ids = cutil.getReqSP(req, 'dept_ids');
            if($dept_ids.length < 1) return res.jsonerr('请选择部门');

            _.each($dept_ids, function ($dept_id) {
                $sets_depts.push({
                    compId: req.me.compId,
                    deptId: $dept_id,
                    userId: $user_id
                });
            });
        }

        var $sets_roles;
        if(typeof req.param('role_ids') != 'undefined') {
            $sets_roles = [];
            var $role_ids = cutil.getReqSP(req, 'role_ids');
            // if($role_ids.length < 1) return res.jsonerr('请选择职务');

            _.each($role_ids, function ($role_id) {
                $sets_roles.push({
                    compId: req.me.compId,
                    userId: $user_id,
                    roleId: $role_id
                });
            });
        }

        if(_.size($set) < 1) return res.jsonerr('请填写需要修改的信息');


        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
                    await User.setUser($user_id, $set);

                    if(_.size($sets_depts)) {
                        await CompDeptUserRel.destroy({
                            compId: req.me.compId,
                            userId: $user_id
                        }).usingConnection(db);

                        await CompDeptUserRel.createEach($sets_depts).usingConnection(db);
                    }

                    if(typeof $sets_roles != 'undefined') {
                        await UserRoleRel.destroy({
                            compId: req.me.compId,
                            userId: $user_id
                        }).usingConnection(db);

                        if(_.size($sets_roles)) {
                            await UserRoleRel.createEach($sets_roles).usingConnection(db);
                        }
                    }

					await db.query(
						"update index_comp_user as idx " +
						" left join (" +
						" 	select " +
						" 		IFNULL(group_concat(rel.deptId separator ','), '') as deptIds," +
						" 		IFNULL(group_concat(dept.name separator ','), '') as deptName, " +
						" 		rel.userId " +
						" 	from comp_dept_user_rel as rel " +
						" 	left join department as dept " +
						" 	on rel.deptId=dept.id group by rel.userId" +
						" ) as rel " +
						" on rel.userId=idx.userId " +
						" set idx.deptId=(" +
						" 	case" +
						" 	when isnull(rel.deptIds) then '' " +
						" 	when (rel.deptIds = '') then '' " +
						" 	when (rel.deptIds = '0') then '' " +
						" 	else concat(',', rel.deptIds, ',') " +
						" 	end), " +
						" idx.deptName=(" +
						" 	case " +
						" 	when isnull(rel.deptName) then '' " +
						" 	when (rel.deptName = '') then '' " +
						" 	else concat(',', rel.deptName, ',') " +
						" 	end)" +
						"	where idx.userId=" + $user_id
					);

					await db.query(
						"update index_comp_user as idx " +
						" left join (" +
						" 	select" +
						" 		IFNULL(group_concat(rel.roleId separator ','), '') as roleIds," +
						" 		IFNULL(group_concat(role.name separator ','), '') as roleName," +
						" 		rel.userId" +
						" 		from user_role_rel as rel " +
						" 	left join role " +
						" 	on rel.roleId=role.id group by rel.userId" +
						" ) as rel " +
						" on rel.userId=idx.userId " +
						" set idx.roleId=(" +
						" 	case" +
						" 	when isnull(rel.roleIds) then '' " +
						" 	when (rel.roleIds = '') then '' " +
						" 	when (rel.roleIds = '0') then '' " +
						" 	else concat(',', rel.roleIds, ',') " +
						" 	end), " +
						" idx.roleName=(" +
						" 	case " +
						" 	when isnull(rel.roleName) then '' " +
						" 	when (rel.roleName = '') then '' " +
						" 	else concat(',', rel.roleName, ',') " +
						" 	end)" +
						"	where idx.userId=" + $user_id
					);

                    return proceed(undefined, 'ok');
                } catch (err) {
                    sails.log.error(err);
                    return proceed(flaverr(
                        'E_ERROR',
                        new Error('数据写入失败')
                    ));
                }
            });
            return res.jsonok('ok');
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }
    },

    updateMobile: async function (req, res) {
        var $user_id = parseInt(cutil.getReq(req, "user_id")) || 0;
        if(!$user_id) return res.jsonerr('用户不存在');

        try{
            await checkUserManager(req.me, $user_id);
        } catch(e) {
            return res.jsonerr(e.message);
        }

        var $mobile = cutil.getReq(req, 'mobile');
        var $code = cutil.getReq(req, 'code');

        try {
            $mobile = cutil.isMobile($mobile);
        } catch (err) {
            res.jsonerr('请输入手机号');
        }

        let $user_row = await User.getUserByMobile($mobile);
        if($user_row) return res.jsonerr('该手机号已经注册过了');

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

        await User.setUser(req.me.id, {
                mobile: $mobile
            });

        return res.jsonok('ok');
    },

    verifyMyPassword: async function (req, res) {
        var $passwd = cutil.getReq(req, 'passwd');
        if($passwd.length < 6) return res.jsonerr('旧密码输入错误');

        try{
            await sails.helpers.passwords.checkPassword($passwd, req.me.passwd);
        } catch (e) {
            return res.jsonerr('旧密码输入错误');
		}

		return res.jsonok('ok');
	},

    updatePassword: async function (req, res) {
        var $user_id = parseInt(cutil.getReq(req, "user_id")) || 0;
        if(!$user_id) return res.jsonerr('用户不存在');

        try{
            await checkUserManager(req.me, $user_id);
        } catch(e) {
            return res.jsonerr(e.message);
        }

        var $passwd = cutil.getReq(req, 'old_passwd');
        var $new_passwd = cutil.getReq(req, 'new_passwd');

        if($passwd.length < 6) return res.jsonerr('旧密码输入错误');
        if($new_passwd.length < 6) return res.jsonerr('新密码长度至少6位');

        try{
            await sails.helpers.passwords.checkPassword($passwd, req.me.passwd);
        } catch (e) {
            return res.jsonerr('旧密码输入错误');
        }

        $password_hash = await sails.helpers.passwords.hashPassword($new_passwd);

        try{

            await User.setUser(req.me.id, {
                    passwd: $password_hash
                });

            return res.jsonok('ok');
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }
    },

	changeManager: async function(req, res) {
		let $code           = cutil.getReq(req, 'code');
		let $new_manager_id = cutil.getReq(req, 'new_manager_id');

		if(!req.me.id) return res.jsonerr('未登录');
		if(!$new_manager_id) return res.jsonerr('请选择新管理员');

		let $user_row = await User.findOne({
			id: req.me.id
		});
		if(!_.size($user_row)) return res.jsonerr('未找到用户数据记录');
		if(!$user_row.compCreator) return res.jsonerr('您不是管理员');

		let $mobile = $user_row.mobile;

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

		let $new_user_row = await User.findOne({
			id: $new_manager_id
		});
		if(!_.size($new_user_row)) return res.jsonerr('新管理员数据记录不存在');
		if($new_user_row.compId != $user_row.compId) return res.jsonerr('新管理员不是该公司成员');


        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
					await User.update({
						id: $user_row.id
					}).set({
						compCreator: 0
					}).usingConnection(db);

					await User.update({
						id: $new_user_row.id
					}).set({
						compCreator: 1
					}).usingConnection(db);

                    return proceed(undefined, 'ok');
                } catch (err) {
                    sails.log.error(err);
                    return proceed(flaverr('E_ERROR', new Error('数据写入失败')));
                }
            });

            return res.jsonok('ok');
        } catch ($e) {
            sails.log.warn($e);
            return res.jsonerr('写入数据库失败');
        }
	},

	verifyUser: async function(req, res) {
		let $user_row = await User.findOne(req.me.id);
		if(!_.size($user_row)) return res.jsonerr('用户记录不存在');
		
        let fdd = Fadada.create();
        try {
            //注册账号
            let $fdd_openid = await fdd.accountReg(sails.config.fadada.environment + 'user' + $user_row.id, CONST.FADADA_ACCOUNT_TYPE_PERSON);
            await User.update($user_row.id).set({
				fddOpenId : $fdd_openid,
				certStat  : CONST.CERTIFYCATION_STAT_APLLY,
				certMsg   : ''
			});

            let $fdd_verify_url = await fdd.getPersonVerifyUrl({
                customer_id: $fdd_openid, //*客户编号
                notify_url: sails.config.custom.baseUrl + sails.getUrlFor(sails.config.fadada.verifyPersonCallback), //*异步通知认证结果回调地址
            });
	
            let url = cutil.base64Decode($fdd_verify_url.url);
            let transactionNo = $fdd_verify_url.transactionNo;
			await User.update($user_row.id).set({
				fddVerifyUrl           : url,
				fddVerifyTransactionNo : transactionNo,
				certStat               : CONST.CERTIFYCATION_STAT_APLLY,
				certMsg                : ''
			});

            return res.jsonok({
                verify_url: url
            });
        } catch(err) {
            sails.log.warn(err);

            let $errmsg = _.isString(err) ? err : err.message;

			await User.update($user_row.id).set({
				certStat: CONST.CERTIFYCATION_STAT_FAILED,
				certMsg: $errmsg
			});

            return res.jsonerr('认证失败: ' + $errmsg);
        }
	},

    //实名认证异步回调
	fddVerifyNotify: async function(req, res) {
		let $params = req.allParams();
		/*
		 * 个人 Status: 2:审核通过; 3:已提交待审核; 4:审核不通过;
		{   appId: '402509',
			serialNo: '2f3662ba53734ffb9926b0ee9e70fd40',
			customerId: '5000288E4B7FAE80DD5ABE4C735B3526',
			status: '3',
			statusDesc: '',
			certStatus: '0',
			authenticationType: 1
		}
		*/

		if(!$params.appId || $params.appId != sails.config.fadada.appId) {
			sails.log.error('[fadada API fddVerifyNotify]: appId不一致: \n', $params);
			return res.jsonok('ok');
		}

		if(!$params.customerId) {
			sails.log.error('[fadada API fddVerifyNotify]: 未找到fddOpenId: \n', $params);
			return res.jsonok('ok');
		}

		let $user_row = await User.findOne({
			fddOpenId: $params.customerId
		});

		if(!$user_row || !$user_row.id) {
			sails.log.error('[fadada API fddVerifyNotify]: 未找到数据记录: \n', $params);
			return res.jsonok('ok');
		}

		if($user_row.certStat == CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonok('ok');

		/*
		个人:Status: 0:未激活; 1:未认证; 2:审核通过; 3:已提交待审核; 4:审核不通过
		*/
		let $status = CONST.CERTIFYCATION_STAT_APLLY;
		let $errmsg = '';
		switch(parseInt($params.status)) {
			case 0: //未激活
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '未激活';
				break;
			case 1: //未认证
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '未认证';
				break;
			case 2: //审核通过
				$status = CONST.CERTIFYCATION_STAT_SUCCESS;
				$errmsg = '审核通过';
				break;
			case 3: //已提交待审核
				$status = CONST.CERTIFYCATION_STAT_APLLY;
				$errmsg = '已提交待审核';
				break;
			case 4: //审核不通过
				$status = CONST.CERTIFYCATION_STAT_FAILED;
				$errmsg = '审核不通过';
				break;
		}

		let $set = {
			certStat: $status,
			certMsg: $params.statusDesc ? $params.statusDesc : $errmsg
		};

		if(!sails.config.localTestMode) {
			let fdd = Fadada.create();
			let $fddPersonRow = await fdd.findPersonCert($user_row.fddVerifyTransactionNo);
			if(
				$fddPersonRow
				&& $fddPersonRow.transactionNo == $user_row.fddVerifyTransactionNo
				&& parseInt($fddPersonRow.type) == CONST.FADADA_ACCOUNT_TYPE_PERSON
				&& _.size($fddPersonRow.person)
			) {
				$set.name            = $fddPersonRow.person.personName || 'unknown';
				$set.gender          = [1, 2].indexOf(parseInt($fddPersonRow.person.sex)) ? $fddPersonRow.person.sex : 0;
				$set.certMobile      = $fddPersonRow.person.mobile || '';
				$set.certIdCardType  = $fddPersonRow.person.certType;
				$set.certIdCardCode  = $fddPersonRow.person.idCard;
				$set.certIdCardPhoto = ''; //证件照片地址
			}
		}

		$user_row = await User.update({
			id: $user_row.id
		}).set($set).fetch();
		$user_row = _.size($user_row) && $user_row[0] || {};

		//todo: 申请证书
		if(!parseInt($params.certStatus)) {}

		return res.jsonok('ok');
	},
};

