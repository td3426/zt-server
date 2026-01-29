
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {
    datastore: 'factory',
    tableName: 'factory_agency_group_product',

    attributes: {

        factoryCompId: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },

        agencyGroupId: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },

        factoryProductNo: {
            type: 'string',
            maxLength: 32,
            defaultsTo: ''
        },

    },
};

