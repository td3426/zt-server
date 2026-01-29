
module.exports = {
    tableName: 'user_login_check',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        userId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        nTry: {
            type: 'number',
            defaultsTo: 1,
            columnType: 'int(11)',
        },
    },

};

