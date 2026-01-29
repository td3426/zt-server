
module.exports = {

    tableName: 'user_role_rel',

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

        userId: {
            type: 'number',
            description: '用户ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        roleId: {
            type: 'number',
            description: '角色ID',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
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

};

