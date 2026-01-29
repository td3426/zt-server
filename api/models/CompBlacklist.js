
module.exports = {

    tableName: 'comp_blacklist',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        fromCompId: {
            type: 'number',
            description: '所属公司ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        toCompId: {
            type: 'number',
            description: '被黑名单公司ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        reasonId: {
            type: 'number',
            description: '原因ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },


        title: {
            type: 'string',
            description: '原因',
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

        updatedAt: false

    },

    //retType: 0返回compid列表,1返回compid和compname列表，2返回详细信息记录集
    getList: async function ($compId, $retType) {
        $retType = parseInt($retType);
        let $rows = await CompBlacklist.find({
            fromCompId: $compId
        });

        switch($retType) {
            case 1:
            case 2:
                $rows = cutil.indexTabByCol($rows, 'toCompId');
                $compIds = cutil.getTabCol($rows, 'toCompId');
                let $compRows = await Comp.find({
                    where: {
                        id: {
                            in: _.values($compIds)
                        }
                    },
                    select: ['id', 'name']
                });
                $compRows = cutil.indexTabByCol($compRows, 'id');

                let $ret = {};
                if($retType == 1) {
                    _.each($rows, function($row) {
                        $ret[$row.id] = $compRows[$row.id] || {};
                    });
                } else {
                    _.each($rows, function($row) {
                        $row.toCompName = $compRows[$row.id] ? $compRows[$row.id].name : ''
                        delete $row.fromCompId;
                        $ret[$row.id] = $row;
                    });
                }
                return $ret;
                break;
            case 0:
            default:
                return cutil.getTabCol($rows, 'toCompId');
                break;
        }
    }

};

