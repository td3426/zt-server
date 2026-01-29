
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {
    datastore: 'factory',
    tableName: 'factory_agency_group',

    attributes: {

        factoryCompId: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },


        name: {
            type: 'string',
            maxLength: 32,
            defaultsTo: ''
        },

    },
};

