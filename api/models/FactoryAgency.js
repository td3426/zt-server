
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {
    datastore: 'factory',
    tableName: 'factory_agency',

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

        saleCompId: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },

        stat: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },

        applyByUser: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },

        applyAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },


    },
};

