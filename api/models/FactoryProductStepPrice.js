
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'factory_product_step_price',

    attributes: {

        id: {
            columnName: 'stepNo',
            type: 'string',
            maxLength: 32,
            description: '',
            required: true
        },

        factoryProductNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        designProductNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        skuNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        numberMin: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: 'abc'
        },

        numberMax: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: 'abc'
        },

        price: {
            type: 'number',
            description: '价格',
            columnType: 'decimal(13,2)',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false
    },

    genUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await FactoryProductStepPrice.count({id: id}).usingConnection($conn);
            else
                $exist = await FactoryProductStepPrice.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

};

