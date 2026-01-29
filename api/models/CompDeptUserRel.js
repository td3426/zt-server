
module.exports = {

    tableName: 'comp_dept_user_rel',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        compId: {
            type: 'number',
            description: '公司ID',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        deptId: {
            type: 'number',
            description: '部门id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        userId: {
            type: 'number',
            description: '用户id',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        createdAt: false,
        updatedAt: false,


        //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
        //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
        //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


        //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
        //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
        //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    },

};
