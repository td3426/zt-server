const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    myInfo: async function(req, res) {
        let $retType = req.param('type') || 'uid';
        $retType = $retType.trim();
        $retType = $retType == 'base' || $retType == 'ext' ? $retType : 'uid';

        if(!req.me.id) return res.jsonerr('token无效');
        let $user_id = req.me.id;

        if($retType == 'uid') return res.jsonok({
            id: $user_id
        });

        $user_row = await User.getUser($user_id);
		if(!_.size($user_row) || $user_row.stat != CONST.USER_STAT_OK) {
            return res.jsonerr('用户不存在');
        }

        var retUserFds = [
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
			"compCreator",
            'oriMobile',
            'stat'
        ];
        var $ret = cutil.snakeCaseObject(cutil.getRowCols($user_row, retUserFds));
        if($retType == 'base') return res.jsonok($ret);

        var $comp_row, $ret_comp = {};
        if($user_row.compId) {
            $comp_row = await Comp.findOne({
                id: $user_row.compId
            });

            $ret_comp = cutil.snakeCaseObject($comp_row);
        }

		let $user_priv_rows;
		try {
			$user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row});
		} catch($e) {
			return res.jsonerr($e.message || $e);
		}

        $user_priv_rows = $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : [];

        $ret.privs = $user_priv_rows;
        $ret.comp = $ret_comp;
        return res.jsonok($ret);
    },

    ucan: async function(req, res) {
        if(!req.me.id) return res.jsonerr('token无效');

        let $priv = parseInt(req.param('priv')) || 0;
        if(!$priv) return res.jsonerr('priv不存在');

        let $user_priv_rows = await Role.getPrivsByUserId({user_id: req.me.id});
        $user_priv_rows = $user_priv_rows || {};

        return res.jsonok({
            can: $user_priv_rows[$priv] ? 'yes' : 'no'
        });
    },

	userInfo: async function(req, res) {
        let $retType = req.param('type') || 'uid';
        $retType = $retType.trim();
        $retType = $retType == 'base' || $retType == 'ext' ? $retType : 'uid';

		let $user_id = parseInt(cutil.getReq(req, 'user_id'));
        if(!$user_id) return res.jsonerr('user_id参数为空');

        if($retType == 'uid') return res.jsonok({
            id: $user_id
        });

        let $user_row = await User.getUser($user_id);
		if(!_.size($user_row) || $user_row.stat != CONST.USER_STAT_OK) {
            return res.jsonerr('用户不存在');
        }

        var retUserFds = [
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
			"compCreator",
            'oriMobile',
            'stat'
            //'step',
            //'stepCode'
        ];
        //$user_row.stepCode = User.getUserStepCode($user_row.step);
        let $ret = cutil.snakeCaseObject(cutil.getRowCols($user_row, retUserFds));
        if($retType == 'base') return res.jsonok($ret);

        let $comp_row, $ret_comp = {};
        if($user_row.compId) {
            $comp_row = await Comp.findOne({
                id: $user_row.compId
            });

            $ret_comp = cutil.snakeCaseObject($comp_row);
        }

		let $user_priv_rows;
		try {
			$user_priv_rows = await Role.getPrivsByUserId({user_row: $user_row, comp_row: $comp_row});
		} catch($e) {
			return res.jsonerr($e.message || $e);
		}

        $user_priv_rows = $user_priv_rows && _.size($user_priv_rows) ? _.values($user_priv_rows) : [];

        $ret.privs = $user_priv_rows;
        $ret.comp = $ret_comp;
        return res.jsonok($ret);
    },

	multiUserInfo: async function(req, res) {
		let $user_ids = req.param('user_ids');
        if(!_.isArray($user_ids) || !_.size($user_ids)) return res.jsonerr('user_ids参数为空');

		$user_ids = $user_ids.filter(v => (parseInt(v) || 0));

        let $user_rows = await User.find({
			where: {
				id     : $user_ids,
			},
		});
		if(!_.size($user_rows)) return res.jsonok([]);

        //部门
        //职务
        let $user_dept_rows = await Dept.getDeptsByCompUserIds({
            user_ids: $user_ids
        });
        let $user_role_rows = await Role.getRolesByCompUserIds({
            user_ids: $user_ids
        });

        let $ret = [];
		for(let $user_row of $user_rows) {
			delete $user_row.passwd;
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

			$ret.push(cutil.snakeCaseObject($user_row));
		}

        return res.jsonok($ret);
	},
};
