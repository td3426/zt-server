
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 't_material',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            columnName: 'fid',
            type: 'string',
            maxLength: 32,
            description: '',
            required: true
        },

        name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false
    },

};

