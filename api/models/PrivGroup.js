
module.exports = {

    tableName: 'priv_group',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

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

        compType: {
            type: 'number',
            description: '所属公司类型，0全部，1工厂，2设计公司，99政府',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        groupType: {
            type: 'number',
            description: '分组类型，0企业管理员可分配，1企业管理员独有，2所有企业成员共有',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        privIds: {
            type: 'string',
            description: '权限值，多个值用英文逗号隔开',
            defaultsTo: '',
            example: ''
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

    getManagerPrivs: async function($compType) {
        let $rows = await PrivGroup.find({
            compType: {
                in: [0, $compType]
            }
        });

        let $ret = {}, $i, $len, $priv;
        _.each($rows, function($row){
            $privs = $row.privIds.split(',');

            $len = $privs.length;
            for($i = 0; $i < $len; $i ++) {
                $priv = parseInt($privs[$i]);
                if($priv) {
                    $ret[$priv] = $priv;
                }
            }
        });

        return $ret;
    },

    getPlatManagerPrivs: async function($compType) {
        let $rows = await PrivGroup.find({
            compType: {
                in: [0, $compType]
            },
            groupType: {
				in: [2, 3]
			}
        });

        let $ret = {}, $i, $len, $priv;
        _.each($rows, function($row){
            $privs = $row.privIds.split(',');

            $len = $privs.length;
            for($i = 0; $i < $len; $i ++) {
                $priv = parseInt($privs[$i]);
                if($priv) {
                    $ret[$priv] = $priv;
                }
            }
        });

        return $ret;
    },


    getMemberSharePrivs: async function($compType) {
        let $rows = await PrivGroup.find({
            compType: {
                in: [0, $compType]
            },
            groupType: 2
        });

        let $ret = {}, $i, $len, $priv;
        _.each($rows, function($row){
            $privs = $row.privIds.split(',');
            $len = $privs.length;
            for($i = 0; $i < $len; $i ++) {
                $priv = parseInt($privs[$i]);
                if($priv) {
                    $ret[$priv] = $priv;
                }
            }
        });

        return $ret;
    },

    getAssignStruct: async function($compType) {
        let $rows = await PrivGroup.find({
            compType: {
                in: [0, $compType]
            },
            groupType: 0
        });

        let $ret = {}, $privids = {}, $i, $len, $priv;
        _.each($rows, function($row){
            $ret[$row.id] = $row;
            $ret[$row.id]['privs'] = {};
            $privs = $row.privIds.split(',');
            $len = $privs.length;
            for($i = 0; $i < $len; $i ++) {
                $priv = parseInt($privs[$i]);
                if($priv) {
                    $privids[$priv] = $priv;
                    $ret[$row.id]['privs'][$priv] = {
                        id: $priv
                    };
                }
            }
        });

        $priv_rows = await Privs.getPrivByIds(_.values($privids));
        _.each($ret, function($row){
            _.each($row.privs, function($privRow, $pvid) {
                $row.privs[$pvid] = $priv_rows[$privRow.id];
            });
            _.unset($row, 'privIds');
        });

        return $ret;
    }

};

