
module.exports = {

    tableName: 'department',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        name: {
            type: 'string',
            description: 'The dept name.',
            unique: true,
            maxLength: 255,
            defaultsTo: '',
            example: '开发部'
        },

        pid: {
            type: 'number',
            description: '上级部门id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        compId: {
            type: 'number',
            description: '公司ID',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

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
    getDeptsByCompUserIds: async function(opts) {
        let $comp_id = opts.comp_id;
        let $user_ids = opts.user_ids;

        if(!_.isArray($user_ids)) throw flaverr({
            message: '用户ID列表错误',
            code: 'E_USER_ID_LIST'
        });


        let $user_dept_rel_rows = await CompDeptUserRel
        .find({
            compId: $comp_id,
            userId: $user_ids
        });
        let $dept_ids = cutil.getTabCol($user_dept_rel_rows, 'deptId');
        let $user_dept_rows = cutil.indexTabByCol($user_dept_rel_rows, 'userId', 'deptId');
        $dept_ids = _.map($dept_ids, $v => $v);
        let $dept_rows = await Dept
        .find({
            id: $dept_ids
        });
        $dept_rows = cutil.indexTabByCol($dept_rows, 'id');

        let $uid, $i = 0; $len = $user_ids.length;
        let $ret = {};
        for($i = 0; $i < $len; $i ++) {
            $uid = $user_ids[$i];

            if(typeof $user_dept_rows[$uid] != 'undefined') {
                _.each($user_dept_rows[$uid], function ($vrel, $dept_id) {
                    if(typeof $dept_rows[$dept_id] != 'undefined') {
                        if(!$ret[$uid]) $ret[$uid] = {};
                        $ret[$uid][$dept_id] = $dept_rows[$dept_id];
                    }
                });
            }
        }

        return $ret;
    }
};

