
module.exports = {

    tableName: 'privs',

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
            allowNull: true,
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

    getPrivByIds: async function($ids) {
        let $rows = await Privs.find({
            id: {
                in: $ids
            }
        });
        
        let $ret = {};
        _.each($rows, function($row){
            $ret[$row.id] = {
                id: $row.id,
                name: $row.name,
                desc: $row.desc
            };
        });

        return $ret;
    }

};

