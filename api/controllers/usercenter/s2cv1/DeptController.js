const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    listDept: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $dept_rows = await Dept.find({
            compId: $comp_row.id
        });

        var ret = {};
        _.each($dept_rows, function(row, idx) {
            ret[row.id] = {
                id: row.id,
                pid: row.pid,
                name: row.name
            };
        });

        return res.jsonok(ret);
    },

    searchDeptMember: async function(req, res) {
        let $comp_id = req.me.compId;
        if(!$comp_id) return res.jsonerr('企业不存在');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        let $name = cutil.getReq(req, 'k');

		let $sql = "select count(1) as cnt from index_comp_user where compId=" + $comp_id + " and concat_ws(userName, mobile, mail, deptName, roleName) like '%" + cutil.dbEscape($name) + "%'";
		let $n_rows = await sails.getDatastore().sendNativeQuery($sql);
		$n_rows = _.size($n_rows) && _.size($n_rows.rows) && $n_rows.rows[0].cnt || 0;
		if(!$n_rows) return res.jsonok({total: 0, list: []});

		$sql = "select userId as id from index_comp_user where compId=" + $comp_id + " and concat_ws(userName, mobile, mail, deptName, roleName) like '%" + cutil.dbEscape($name) + "%'";
		let $user_rows = await sails.getDatastore().sendNativeQuery($sql);
		$user_rows = _.size($user_rows) && $user_rows.rows || [];

        let $user_ids = cutil.getTabCol($user_rows, 'id');
        $user_ids = $user_ids || {};
		$user_rows = {};
		if(_.size($user_ids)) {
			$user_rows = await User.find({
				id: _.values($user_ids)
			});
			$user_rows = cutil.indexTabByCol($user_rows, 'id');
		}

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
        var ret = [];
        _.each($user_rows, function($user_row) {
            ret.push(cutil.snakeCaseObject(cutil.getRowCols($user_row, retFds)));
        });
        return res.jsonok({total: $n_rows, list: ret});
    },

    listDeptMember: async function(req, res) {
        let $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');

        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

        let $dept_id = parseInt(cutil.getReq(req, 'dept_id')) || 0;

        if(!await Comp.count({ id: $comp_id })) return res.jsonerr('企业不存在');

        let $user_rows, $n_rows = 0;
        if($dept_id == -2) { //超级管理员
			$n_rows = await sails.getDatastore().sendNativeQuery(
				"select count(1) as cnt from user where compId=$1 and compCreator=1",
				[$comp_id]
			);
			$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0

			$user_rows = await User.find({
				where: {
					compId      : $comp_id,
					compCreator : 1
				},
				skip: $start,
				limit: $pagesize
			});
        } else if($dept_id == -1) { //全部人员
            $n_rows = await sails.getDatastore().sendNativeQuery(
                "select count(1) as cnt from user where compId=$1",
                [$comp_id]
            );
			$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0

			$user_rows = await User.find({
				where: {
					compId: $comp_id
				},
				skip: $start,
				limit: $pagesize
			});
        } else { //dept_id = 0 为未分组人员
			$n_rows = await sails.getDatastore().sendNativeQuery(
				"select distinct userId, count(1) as cnt from comp_dept_user_rel where compId=$1 and deptId=$2",
				[$comp_id, $dept_id]
			);
			$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0

			$user_rows = await sails.getDatastore().sendNativeQuery(
				"select * from user join (select distinct userId from comp_dept_user_rel where compId=$1 and deptId=$2 limit $3, $4) rel on rel.userId=user.id",
                [$comp_id, $dept_id, $start, $pagesize]
            );
			$user_rows = $user_rows && $user_rows.rows || [];
        }

        let $user_ids = cutil.getTabCol($user_rows, 'id');
        $user_ids = $user_ids || {};

        if(_.size($user_ids)) {
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

            _.each($user_rows, function($user_row) {
				let $uid = $user_row.id;

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
        }

        let retFds = [
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
			'compCreator',
            'roles',
            'depts',
            'oriMobile',
            'stat'
        ];

        let ret = [];
        _.each($user_rows, function($user_row) {
            ret.push(cutil.snakeCaseObject(cutil.getRowCols($user_row, retFds)));
        });

        return res.jsonok({total: $n_rows, list: ret});
    },

    addDept: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_STRUCTURE)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $dept_name = cutil.getReq(req, 'dept_name');
        var $dept_pid = parseInt(cutil.getReq(req, 'dept_pid')) || 0;

        if(!$dept_name) return res.jsonerr('请填写部门名称');

        try{
            await Dept.create({
                name: $dept_name,
                pid: $dept_pid,
                compId: $comp_id
            });
        } catch (e) {
            return res.jsonerr('写入数据失败');
        }

        return res.jsonok('ok');
    },

    updateDept: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_STRUCTURE)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $dept_id = cutil.getReq(req, 'dept_id') || 0;
        var $dept_name = cutil.getReq(req, 'dept_name');
        var $dept_pid = parseInt(cutil.getReq(req, 'dept_pid')) || 0;

        if(!$dept_name) return res.jsonerr('请填写部门名称');

        try{
            await Dept.update({
                id: $dept_id
            }).set({
                name: $dept_name,
                pid: $dept_pid
            });

			await sails.getDatastore().sendNativeQuery(
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
				" 	end)"
			);
        } catch (e) {
            return res.jsonerr('写入数据失败');
        }

        return res.jsonok('ok');
    },

    deleteDept: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_STRUCTURE)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $dept_id = cutil.getReq(req, 'dept_id');

        if(
            await Dept.count({
                pid: $dept_id
            })
        ) return res.jsonerr('还有下属部门, 请先删除所有下属部门');

        if(
            await CompDeptUserRel.count({
                compId:$comp_id,
                deptId: $dept_id
            })
        ) return res.jsonerr('部门下还有成员, 请先删除该部门下所有成员');

        try{
            await Dept.destroy({
                id: $dept_id
            });
        } catch (e) {
            return res.jsonerr('写入数据库失败');
        }

        return res.jsonok('ok');
    },

    xportDeptUser: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_STRUCTURE)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $ids = cutil.getReqSP(req, 'ids');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('公司不存在');


        if($ids.length) {
            //xtodo: xport
        }

        return res.jsonok();
    },

    updateUsersDept: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_STRUCTURE)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $user_ids = cutil.getReqSP(req, 'user_ids');
        var $dept_ids = cutil.getReqSP(req, 'dept_ids');

        if($user_ids.length < 1) return res.jsonerr('请选择成员');
        if($dept_ids.length < 1) return res.jsonerr('请选择部门');

        var $sets = [];
        _.each($user_ids, function ($user_id) {
            _.each($dept_ids, function ($dept_id) {
                $sets.push({
                    compId: $comp_row.id,
                    deptId: $dept_id,
                    userId: $user_id
                });
            });
        });

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
					await CompDeptUserRel.destroy({
						compId: $comp_row.id,
						userId: $user_ids
					}).usingConnection(db);

                    await CompDeptUserRel.createEach($sets).usingConnection(db);

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
						" 	end)"
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

    removeUsers: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_REMOVE_MEMBER)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $user_ids = cutil.getReqSP(req, 'user_ids');

        if($user_ids.length < 1) return res.jsonerr('请选择成员');

        var $tmp = {};
        _.each($user_ids, $v => {
            $v = parseInt($v);
            if($v) $tmp[$v] = $v;
        });
        $user_ids = _.map($tmp, $v => $v);
        if($user_ids.length < 1) return res.jsonerr('请选择成员');

		const $user_rows = await User.getUsers($user_ids);

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
					/*
					await CompDeptUserRel.destroy({
						compId: $comp_row.id,
						userId: $user_ids
					}).usingConnection(db);

					await UserRoleRel.destroy({
						compId: $comp_row.id,
						userId: $user_ids
					}).usingConnection(db);

					await IndexCompUser.update({
						id: $user_ids
					}).set({
						compId   : 0,
						deptId   : 0,
						deptName : '',
						roleId   : 0,
						roleName : ''
					});
					*/

					for(let i = 0; i < $user_ids.length; i ++) {
						let $user_id = $user_ids[i];

						//需要设置到未分组里面
						//await CompDeptUserRel.create({
						//	compId: $comp_row.id,
						//	deptId: 0,
						//	userId: $user_id
						//}).usingConnection(db);

						//由于可能会存在其他业务关联用户id的数据，故这里只将用户登录手机号设置为一个不合法的不可登录的号码
						//d+13位随机数
						let $n = 1;
						let $ok = false;
						while($n ++ < 5) {
							try {
								let $del_mobile = await cutil.SNID();
								await User.setUser($user_id, {
									mobile      : 'd' + $del_mobile,
									oriMobile   : $user_rows[$user_id].mobile,
									stat        : CONST.USER_STAT_DEL
								}, db);

								$ok = true;
								break;
							} catch($e) {
								sails.log.error($e);
							}
						}

						if(!$ok) {
							throw new Error('删除失败');
						}
					}

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
    }
};
