/**
 * Manager.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const flaverr = require('flaverr');

module.exports = {

    tableName: 'role',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        compId: {
            type: 'number',
            description: '公司id',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        desc: {
            type: 'string',
            description: '描述',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false


        //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
        //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
        //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


        //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
        //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
        //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    },

    // opts:
    // {
    //     comp_id: 1,
    //     user_ids: [1,2,3,...]
    // }
    getRolesByCompUserIds: async function(opts) {
        let $comp_id = opts.comp_id;
        let $user_ids = opts.user_ids;

        if(!_.isArray($user_ids)) throw flaverr({
            message: '用户ID列表错误',
            code: 'E_USER_ID_LIST'
        });

        let $user_role_rel_rows = await UserRoleRel
            .find({
                where: {
                    compId: $comp_id,
                    userId: $user_ids
                }
            });
        let $role_ids = cutil.getTabCol($user_role_rel_rows, 'roleId');
        let $user_role_rows = cutil.indexTabByCol($user_role_rel_rows, 'userId', 'roleId');
        let $role_rows = await Role
            .find({
                id: _.values($role_ids)
            });
        $role_rows = cutil.indexTabByCol($role_rows, 'id');

        let $uid, $i = 0; $len = $user_ids.length;
        let $ret = {};
        for($i = 0; $i < $len; $i ++) {
            $uid = $user_ids[$i];

            if(typeof $user_role_rows[$uid] != 'undefined') {
                _.each($user_role_rows[$uid], function ($vrel, $role_id) {
                    if(typeof $role_rows[$role_id] != 'undefined') {
                        if(!$ret[$uid]) $ret[$uid] = {};
                        $ret[$uid][$role_id] = $role_rows[$role_id];
                    }
                });
            }
        }

        return $ret;
    },

    // opts{
    //     user_id: 1,
    //     user_row: {}, //user_row和user_id二选一
    //     comp_row: {}, //可选
    // }
    getPrivsByUserId: async function(opts) {
        let $user_id = opts.user_id;
        let $user_row = opts.user_row;
        let $comp_row = opts.comp_row;

        if(!$user_row && !$user_id) throw flaverr({
            message: '用户ID不存在',
            code: 'E_USER_ID'
        });

        if(!$user_row) {
            $user_row = await User.getUser($user_id);
            if(!$user_row) throw flaverr({
                message: '用户ID不存在',
                code: 'E_USER_ID'
            });
        }

        if(!$comp_row && $user_row.compId) {
            $comp_row = await Comp.findOne({
                id: $user_row.compId
            });
            $comp_row = $comp_row || {};
        }

        let $user_priv_rows = {};
        if($user_row.compCreator && $comp_row && $comp_row.compType) {
            let $compManagerPrivs = await PrivGroup.getManagerPrivs($comp_row.compType);
            $user_priv_rows = $compManagerPrivs || {};
        } else if(parseInt($user_row.memberType) === CONST.USER_TYPE_PLAT_ADMIN) {
            let $compManagerPrivs = await PrivGroup.getPlatManagerPrivs($comp_row.compType);
            $user_priv_rows = $compManagerPrivs || {};
		} else {
            let $compManagerPrivs = {};
            if($comp_row && $comp_row.compType) {
                $compManagerPrivs = await PrivGroup.getMemberSharePrivs($comp_row.compType);
            }

            let $user_role_rel_rows = await UserRoleRel.find({
                compId: $user_row.compId,
                userId: $user_row.id
            });
            let $user_role_ids = cutil.getTabCol($user_role_rel_rows, 'roleId');

            if(_.size($user_role_ids) > 0) {
                $user_priv_rows = await RolePrivRel.find({
                    compId: $user_row.compId,
                    roleId: _.values($user_role_ids)
                });
                $user_priv_rows = cutil.getTabCol($user_priv_rows, 'privId');
            }

            $user_priv_rows = _.assign($user_priv_rows, $compManagerPrivs);
        }

        return $user_priv_rows;
    }

};

