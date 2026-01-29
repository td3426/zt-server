
const flaverr = require('flaverr');

module.exports = {

    tableName: 'app_secret',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        appType: {
            type: 'number',
            description: '类型，0备用，1用户中心s2sAPI，2Admin s2sAPI',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        secr: {
            type: 'string',
            description: 'secret',
            maxLength: 32,
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

    },

    getSecretById: async function(opts) {
        let $id = parseInt(opts.id) || 0;
        let $type = parseInt(opts.type) || 0;

        if(!$id) return '';

        let $row = await AppSecret
            .findOne({
                id: $id,
				appType: $type
            });

        return $row && $row.secr ? $row.secr : '';
    }

};

