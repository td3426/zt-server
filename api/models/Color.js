
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 't_color',

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
            columnName: 'fname',
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        fval: {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false
    },

};

