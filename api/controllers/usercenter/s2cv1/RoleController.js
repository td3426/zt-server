const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

    privStruct: async function (req, res) {
        let ret = {};

        let $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('公司不存在');

        ret = await PrivGroup.getAssignStruct($comp_row.compType) || {};

        return res.jsonok(ret);
    },

    list: async function (req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        var $page = parseInt(cutil.getReq(req, 'page')) || 1;
        var $start = ($page - 1) * $pagesize;

		let $k = cutil.getReq(req, 'k');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

		let $where = {
            compId: $comp_row.id
		};
		if(_.size($k)) $where.name = {
			contains: $k
		};
        let $n_rows = await Role.count({
			where: $where
		});
        let $rows = await Role.find({
            where : $where,
            skip  : $start,
            limit : $pagesize
        });

        $role_priv_rel_rows = await RolePrivRel.find({
            compId: $comp_row.id
        });

        let role_priv_map = {};
        _.each($role_priv_rel_rows, function($role_priv_rel_row) {
            if(typeof role_priv_map[$role_priv_rel_row.roleId] == 'undefined')
                role_priv_map[$role_priv_rel_row.roleId] = [];

            role_priv_map[$role_priv_rel_row.roleId].push($role_priv_rel_row.privId);
        });

        let role_ids = {};
        _.each($rows, function($row){
            role_ids[$row.id] = $row.id;
            $row.privs = role_priv_map[$row.id] || [];
        });

        let role_id, role_count_rows = {};
        for(role_id in role_ids) {
            role_count_rows[role_id] = await UserRoleRel
            .count({
                compId: $comp_row.id,
                roleId: role_id
            });
        }

        var ret = [];
        _.each($rows, function($row){
            ret.push({
                id: $row.id,
                name: $row.name,
				desc: $row.desc,
                privs: $row.privs,
                n_users: role_count_rows[$row.id]
            });
        });

        return res.jsonok({total: $n_rows, list: ret});
    },

    detail: async function (req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $role_id = parseInt(cutil.getReq(req, 'role_id')) || 0;

        var $row = await Role.findOne({
            id: $role_id
        });

        if(!$row) return res.jsonerr('角色不存在');

        var $role_priv_rel_rows = await RolePrivRel.find({
            compId: $comp_row.id,
            roleId: $role_id
        });
        $row.privs = cutil.getTabCol($role_priv_rel_rows, 'privId');

        var ret = {
            id: $row.id,
            name: $row.name,
            desc: $row.desc,
            privs: $row.privs
        };

        return res.jsonok(ret);
    },

    add: async function (req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $name = cutil.getReq(req, 'name');
        var $desc = cutil.getReq(req, 'desc');
        var $privs = cutil.getReqSP(req, 'privs');

        if($name.length < 1) return res.jsonerr('请填写名称');

        $priv_set = [];
        _.each($privs, function(priv, idx){
            $priv_set.push({
                'compId': $comp_row.id,
                'roleId': 0,
                'privId': priv
            });
        });

        try{

            $id = await sails.getDatastore().transaction(async (db, proceed) => {

                try {

                    $role_row = await Role.create({
                            compId: $comp_row.id,
                            name: $name,
                            desc: $desc
                        }).fetch().usingConnection(db);

                    if(_.size($priv_set) > 0) {
                        _.each($priv_set, function($priv_row, idx){
                            $priv_row.roleId = $role_row.id;
                        });

                        await RolePrivRel
                            .createEach($priv_set)
                            .usingConnection(db);
                    }

                    return proceed(undefined, $role_row.id);

                } catch (err) {

                    sails.log.error(err);

                    return proceed(flaverr(
                        'E_ERROR',
                        new Error('数据写入失败')
                    ));

                }
            });

            return res.jsonok($id);

        } catch ($e) {
            sails.log.warn($e);

            return res.jsonerr('写入数据库失败');
        }

    },

    update: async function (req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $role_id = parseInt(cutil.getReq(req, 'role_id')) || 0;
        var $name = cutil.getReq(req, 'name');
        var $desc = cutil.getReq(req, 'desc');
        var $privs = cutil.getReqSP(req, 'privs');

        if(!$role_id) return res.jsonerr('角色不存在');
        if($name.length < 1) return res.jsonerr('请填写属性名称');

        $priv_set = [];
        _.each($privs, function(priv, idx){
            $priv_set.push({
                'compId': $comp_row.id,
                'roleId': $role_id,
                'privId': priv
            });
        });

        $row = await Role.findOne({
            id: $role_id
        });

        if(!$row) return res.jsonerr('数据不存在');

        try {
			await sails.getDatastore().transaction(async (db, proceed) => {
				try {
					await Role.update({
						id: $role_id
					}).set({
						name: $name,
						desc: $desc
					}).usingConnection(db);

					await RolePrivRel.destroy({
						'compId': $comp_row.id,
						'roleId': $role_id
					}).usingConnection(db);

					await RolePrivRel.createEach($priv_set).usingConnection(db);

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
						" 	end)"
					);

					return proceed(undefined, $role_id);
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

    delete: async function (req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $role_id = parseInt(cutil.getReq(req, 'role_id')) || 0;

        if(!$role_id) return res.jsonerr('数据不存在');

        $row = await Role.findOne({
            id: $role_id
        });
        if(!$row) return res.jsonerr('数据不存在');

        $xrow = await UserRoleRel.find({
            compId: $comp_row.id,
            roleId: $role_id
        }).limit(1);
        if($xrow.length > 0) return res.jsonerr('还有成员拥有该角色, 请先移除该角色的所有成员');

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
                    await Role
                        .destroy({
                            id: $role_id
                        })
                        .usingConnection(db);

                    await RolePrivRel
                        .destroy({
                            compId: $comp_row.id,
                            roleId: $role_id
                        })
                        .usingConnection(db);

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

    listUsers: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $role_id = parseInt(cutil.getReq(req, 'role_id')) || 0;

        if(!$role_id) return res.jsonerr('数据不存在');

        $row = await Role.findOne({
            id: $role_id
        });
        if(!$row) return res.jsonerr('数据不存在');

        var $user_ids = [];

        var $user_role_rows = await UserRoleRel
            .find({
                compId: $comp_row.id,
                roleId: $role_id
            });
        $user_ids = cutil.getTabCol($user_role_rows, 'userId');

        var $user_rows = {};
        $user_rows = await User.getUsers(_.values($user_ids));

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
            'compId'
        ];
        var ret = {};
        _.each($user_rows, function($user_row) {
            ret[$user_row.id] = cutil.snakeCaseObject(cutil.getRowCols($user_row, retFds));
        });

        return res.jsonok(ret);
    },

    updateUsers: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || parseInt(req.me.compId);
        if(!$comp_id) return res.jsonerr('企业不存在');

        if(req.me.compId != $comp_id) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_COMP_MANAGE_PRIVS)) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $role_id = parseInt(cutil.getReq(req, 'role_id')) || 0;

        var $user_ids = cutil.getReqSP(req, 'user_ids');

        $row = await Role.findOne({
            id: $role_id
        });

        if(!$row) return res.jsonerr('数据不存在');

        var $sets = [];
        _.each($user_ids, function ($uid) {
            $sets.push({
                compId: $comp_row.id,
                userId: $uid,
                roleId: $role_id
            });
        });

        try {
            await sails.getDatastore().transaction(async(db, proceed) => {
                try {
                    await UserRoleRel.destroy({
                            compId: $comp_row.id,
                            roleId: $role_id
                        }).usingConnection(db);

                    if($sets) {
                        await UserRoleRel.createEach($sets).usingConnection(db);
                    }

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
    }

};
