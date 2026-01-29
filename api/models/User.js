
module.exports = {
    tableName: 'user',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        memberType: {
            type: 'number',
            defaultsTo: 1,
            columnType: 'int(11)',
        },

        memberId: {
            type: 'string',
            maxLength: 32,
            defaultsTo: '',
        },

        txOpenId: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        fddOpenId: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        mobile: {
            type: 'string',
            description: '手机号码.',
            unique: true,
            maxLength: 20,
            defaultsTo: '',
            example: '13888888888'
        },

        oriMobile: {
            type: 'string',
            description: '原手机号码.',
            unique: true,
            maxLength: 20,
            defaultsTo: '',
            example: '13888888888'
        },


        name: {
            type: 'string',
            description: '姓名',
            unique: true,
            maxLength: 20,
            defaultsTo: '',
			allowNull: true,
            example: '张三'
        },

        passwd: {
            type: 'string',
            description: '密码.',
            maxLength: 255,
            defaultsTo: '',
            example: '13888888888'
        },

        avatar: {
            type: 'string',
            description: '头像',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        intro: {
            type: 'string',
            description: '介绍',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        phone: {
            type: 'string',
            description: '手机',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        tel: {
            type: 'string',
            description: '座机',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        mail: {
            type: 'string',
            description: '邮箱',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        wechat: {
            type: 'string',
            description: '微信',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        qq: {
            type: 'string',
            description: 'qq',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
            example: ''
        },

        gender: {
            type: 'number',
            description: '性别',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        step: {
            type: 'number',
            description: '注册完第几步',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        stepCompType: {
            type: 'number',
            description: '用户注册时候选择的公司类型',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        fromCompId: {
            type: 'number',
            description: '邀请人公司id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        fromUserId: {
            type: 'number',
            description: '邀请人id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        compId: {
            type: 'number',
            description: '关联公司ID',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        compCreator: {
            type: 'number',
            description: '是否是公司创建人',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        stat: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 1
        },

        certStat: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        certMsg: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        certMobile: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        certIdCardType: {
            type: 'string',
            maxLength: 3,
            defaultsTo: '',
			allowNull: true,
        },

        certIdCardCode: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        certIdCardPhoto: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        fddVerifyUrl: {
            type: 'string',
            defaultsTo: '',
			allowNull: true,
        },

        fddVerifyTransactionNo: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },


        //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
        //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
        //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


        //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
        //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
        //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    },

    getUser: async function($id, $fds) {
        let $queryOpts = {
            where: {
                id: $id
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $row = await User.findOne($queryOpts);

        let $ret = $row;
        if($fds && _.isArray($fds)) {
            let $tmp = {};
            let $i = 0, $len = $fds.length, $k;
            for(; $i < $len; $i ++) {
                $k = $fds[$i];
                if(typeof $row[$k] != 'undefined') {
                    $tmp[$k] = $row[$k];
                }
            }

            $ret = $tmp;
        }

        return $ret;
    },

    getUserByMobile: async function($mobile, $fds) {
        let $queryOpts = {
            where: {
                mobile: $mobile
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $row = await User.findOne($queryOpts);

        let $ret = $row;
        if($fds && _.isArray($fds)) {
            let $tmp = {};
            let $i = 0, $len = $fds.length, $k;
            for(; $i < $len; $i ++) {
                $k = $fds[$i];
                if(typeof $row[$k] != 'undefined') {
                    $tmp[$k] = $row[$k];
                }
            }

            $ret = $tmp;
        }

        return $ret;
    },

    getUsersByMobile: async function($mobiles, $fds) {
        let $queryOpts = {
            where: {
                mobile: $mobiles
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $ret = await User.find($queryOpts);

        return $ret;
    },

    getUsers: async function($ids, $fds) {
        let $queryOpts = {
            where: {
                id: {
                    in: $ids
                }
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $rows = await User.find($queryOpts);
        let $ret = {};
        _.each($rows, function($row){
            if($fds && _.isArray($fds)) {
                let $tmp = {};
                let $i = 0, $len = $fds.length, $k;
                for(; $i < $len; $i ++) {
                    $k = $fds[$i];
                    if(typeof $row[$k] != 'undefined') {
                        $tmp[$k] = $row[$k];
                    }
                }

                $ret[$row.id] = $tmp;
            } else {
                $ret[$row.id] = $row;
            }
        });

        return $ret;
    },

    getUserStepCode: function($step) {
        var stepCode = 0;

        if($step == CONST.USER_STEP_MOBILE) stepCode = 101;
        else if($step == CONST.USER_STEP_COMPINVITE) stepCode = 103;
        else if($step == CONST.USER_STEP_COMPTYPE) stepCode = 102;
        else if($step == CONST.USER_STEP_COMP) stepCode = 0;

        return stepCode;
    },

    createUser: async function($set, $conn, $fetch) {
        let $ret;

        if($conn) {
            $ret = await User.create($set).usingConnection($conn).fetch();
			await IndexCompUser.create({
				id       : $ret.id,
				compId   : $ret.compId,
				deptId   : 0,
				roleId   : 0,
				mobile   : $ret.mobile,
				mail     : $ret.mail,
				userName : $ret.name,
				deptName : '',
				roleName : ''
			}).usingConnection($conn);
        } else {
			$ret = await User.create($set).fetch();
			await IndexCompUser.create({
				id       : $ret.id,
				compId   : $ret.compId,
				deptId   : 0,
				roleId   : 0,
				mobile   : $ret.mobile,
				mail     : $ret.mail,
				userName : $ret.name,
				deptName : '',
				roleName : ''
			});
        }

        return $ret;
    },

    setUser: async function($id, $set, $conn) {
		let $index_set = {};
		if(cutil.defined($set.compId)) $index_set.compId = $set.compId;
		if(cutil.defined($set.mobile)) $index_set.mobile = $set.mobile;
		if(cutil.defined($set.mail)) $index_set.mail = $set.mail;
		if(cutil.defined($set.name)) $index_set.userName = $set.name;

        if($conn) {
            await User.update({
                id: $id
            }).set($set).usingConnection($conn);
			if(_.size($index_set)) {
				await IndexCompUser.update({
					id: $id
				}).set($index_set).usingConnection($conn);
			}
        } else {
            await User.update({
                id: $id
            }).set($set);
			if(_.size($index_set)) {
				await IndexCompUser.update({
					id: $id
				}).set($index_set);
			}
		}

        return $id;
    },

	getMemberId: async function($comp_id, $user_id, $conn) {
		let $member_id = $user_id;

		let $while_times = 0
		while(true) {
			if($while_times >= 10) {
				$member_id = 0;
				break;
			}

            let $exist = 0;
			if($conn) {
				$exist = await User.count({
					compId   : $comp_id,
					memberId : $member_id
				}).usingConnection($conn);
			} else {
				$exist = await User.count({
					compId   : $comp_id,
					memberId : $member_id
				});
			}

            if(!$exist) break;

			$member_id = await cutil.randomCustom('123456789abcdef', 6);
			$while_times ++;
		}

		return $member_id;
	}
};

