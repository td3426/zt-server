const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    listComp: async function(req, res) {
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $comp_code = cutil.getReq(req, 'comp_code');
		let $comp_name = cutil.getReq(req, 'name');
		let $comp_type = cutil.getReqSP(req, 'comp_type');
		let $cert_stat = cutil.getReqSP(req, 'cert_stat');

		let $where = {};
		if(_.size($comp_code)) $where.compCode = $comp_code;
		if(_.size($comp_name)) $where.name     = {contains: $comp_name};
		if(_.size($comp_type)) $where.compType = $comp_type;
		if(_.size($cert_stat)) $where.certStat = $cert_stat;

        let $n_rows = await Comp.count($where);

        let $comp_rows = await Comp.find({
			where  : $where,
            skip   : $start,
            limit  : $pagesize,
            select : [
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
                "fddVerifyUrl"
            ]
        });

        let ret = [];
        _.each($comp_rows, function($comp_row) {
            ret.push(cutil.snakeCaseObject($comp_row));
        });

        return res.jsonok({total: $n_rows, list: ret});
    },

    compInfo: async function(req, res) {
        const $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        let $comp_row = await Comp.findOne({
			where: {
				id: $comp_id
			}
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

		try{
			$comp_row.aptitude = JSON.parse($comp_row.aptitude);
		} catch($e) {
			$comp_row.aptitude = {};
		}

		const ret = cutil.snakeCaseObject($comp_row);

        return res.jsonok(ret);
    },

    multiCompInfo: async function(req, res) {
        let $comp_ids = req.param('comp_ids') || [];
        if(!_.isArray($comp_ids) || !_.size($comp_ids)) return res.jsonerr('企业不存在');

		let $qids = [];
		_.each($comp_ids, function($cid) {
			$cid = parseInt($cid);
			if(!$cid) return true;
			$qids.push($cid);
		});
		if(!_.size($qids)) return res.jsonok([]);

        let $comp_rows = await Comp.find({
			where: {
				id: $qids
			}
        });
        if(!_.size($comp_rows)) return res.jsonok([]);

        let $ret = [];
		_.each($comp_rows, function($comp_row) {
			try{
				$comp_row.aptitude = JSON.parse($comp_row.aptitude);
			} catch($e) {
				$comp_row.aptitude = {};
			}
			$ret.push(cutil.snakeCaseObject($comp_row));
		});

        return res.jsonok($ret);
    },


    listDept: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

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

    listDeptMember: async function(req, res) {
        let $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

        let $dept_id = parseInt(cutil.getReq(req, 'dept_id')) || 0;

        if(!await Comp.count({ id: $comp_id })) return res.jsonerr('企业不存在');

		let $member_ids = [];
		if(_.isArray(req.param('user_ids')) && _.size(req.param('user_ids'))) {
			for(let $uid of req.param('user_ids')) {
				$uid = parseInt($uid) || 0;
				if($uid) $member_ids.push($uid);
			}
		}

        let $user_rows, $n_rows = 0;
        if($dept_id == -2) { //超级管理员
			let $where = {
				compId      : $comp_id,
				compCreator : 1
			};
			if(_.size($member_ids)) $where.id = $member_ids;
	
			$n_rows = await User.count($where);

			$user_rows = await User.find({
				where : $where,
				skip  : $start,
				limit : $pagesize
			});
        } else if($dept_id == -1) { //全部人员
			let $where = {
				compId: $comp_id
			};
			if(_.size($member_ids)) $where.id = $member_ids;

			$n_rows = await User.count($where);

			$user_rows = await User.find({
				where : $where,
				skip  : $start,
				limit : $pagesize
			});
        } else { //dept_id = 0 为未分组人员
			if(_.size($member_ids)) {
				$n_rows = await sails.getDatastore().sendNativeQuery(
					"select distinct userId, count(1) as cnt from comp_dept_user_rel where compId=$1 and deptId=$2 and userId in (" + $member_ids.join(',') + ")",
					[$comp_id, $dept_id]
				);
			} else {
				$n_rows = await sails.getDatastore().sendNativeQuery(
					"select distinct userId, count(1) as cnt from comp_dept_user_rel where compId=$1 and deptId=$2",
					[$comp_id, $dept_id]
				);
			}
			$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0

			if(_.size($member_ids)) {
				$user_rows = await sails.getDatastore().sendNativeQuery(
					"select * from user join (select distinct userId from comp_dept_user_rel where compId=$1 and deptId=$2 and userId in(" + $member_ids.join(',') + ") limit $3, $4) rel on rel.userId=user.id",
					[$comp_id, $dept_id, $start, $pagesize]
				);
			} else {
				$user_rows = await sails.getDatastore().sendNativeQuery(
					"select * from user join (select distinct userId from comp_dept_user_rel where compId=$1 and deptId=$2 limit $3, $4) rel on rel.userId=user.id",
					[$comp_id, $dept_id, $start, $pagesize]
				);
			}
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

    getMembers: async function(req, res) {
        var $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');

        var $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

        var $user_ids = cutil.getReqSP(req, 'user_ids', 'int');
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

	getCompAptitude: async function(req, res) {
        const $comp_id = parseInt(cutil.getReq(req, "comp_id")) || 0;
        if(!$comp_id) return res.jsonerr('企业不存在');
	
        const $comp_row = await Comp.findOne({
			where: {
				id: $comp_id
			},
			select: [
				"compType",
				"contactName",
				"contactMobile",
				"aptitude",
				"aptitudeScore",
				"aptitudeStat",
				"aptitudeMsg"
			]
        });
        if(!$comp_row) return res.jsonerr('企业不存在');

		try {
			$comp_row.aptitude = JSON.parse($comp_row.aptitude);
		} catch(e) {
			$comp_row.aptitude = {};
		}

		if(
			(
				$comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY || 
				$comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER
			) &&
			(
				!_.size($comp_row.aptitude) || 
				!_.size($comp_row.aptitude.contact) || 
				!_.size($comp_row.aptitude.contact.mobile)
			)
		) {
			$comp_row.aptitude.contact = {
				name   : $comp_row.contactName,
				mobile : $comp_row.contactMobile
			}
		}

		let ret = cutil.snakeCaseObject(cutil.getRowCols($comp_row, [
			"aptitude",
			"aptitudeScore",
			"aptitudeStat",
			"aptitudeMsg"
		]));

        return res.jsonok(ret);
	},
};
