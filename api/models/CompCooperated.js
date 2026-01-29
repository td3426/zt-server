
module.exports = {

    tableName: 'comp_cooperated',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        fromCompId: {
            type: 'number',
            description: '合作甲方公司ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        toCompId: {
            type: 'number',
            description: '合作乙方公司ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        updatedAt: false

    },

    isCooperated: async function ($compId, $compId2) {
        return await CompCooperated.count({
            'or': [
                {fromCompId: [$compId, $compId2]},
                {toCompId: [$compId, $compId2]},
            ]
        });
    },

    getCooperated: async function ($compId, $fds) {
        $fds = _.isArray($fds) && $fds.length > 0 ? $fds : ['id', 'name'];
        let $rows = await CompCooperated.find({
            'or': [
                {fromCompId: [$compId, $compId2]},
                {toCompId: [$compId, $compId2]},
            ]
        });

        let $compIds = cutil.getTabCol($rows, 'fromCompId');
        $compIds = _.assign($compIds, cutil.getTabCol($rows, 'toCompId'));
        delete($compIds[$compId]);

        let $compRows = await Comp.find({
            where: {
                id: _.values($compIds)
            },
            select: $fds
        });
        $compRows = cutil.indexTabByCol($compRows, 'id');

        return $compRows;
    }

};

