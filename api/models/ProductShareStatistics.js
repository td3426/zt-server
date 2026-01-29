
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'product_share_statistics',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            required: true
        },

        compId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        shareUserId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        nVisited: {
            type: 'number',
            description: '浏览次数',
            columnType: 'int(11)',
            example: 'abc'
        },

    },

};

