
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {
    datastore: 'factory',
    tableName: 'factory_product_sku_attr',

    attributes: {
        factoryCompId: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0
        },

        factoryProductNo: {
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

        nameNo: {
            type: 'string',
            maxLength: 36,
            description: '',
            defaultsTo: ''
        },

        attrName: {
            type: 'string',
            maxLength: 255,
            description: '',
			allowNull: true,
            defaultsTo: ''
        },

        valueNo: {
            type: 'string',
            maxLength: 36,
            description: '',
			allowNull: true,
            defaultsTo: ''
        },

        attrValue: {
            type: 'string',
            maxLength: 255,
            description: '',
			allowNull: true,
            defaultsTo: ''
        },

        createdAt: false,
        updatedAt: false
    },

    genUUID: async function($conn) {
        let id;
        let nTimes = 0;
		while(true) {
			id = await cutil.SNID();

            let $exist = 0;
            if($conn)
                $exist = await FactoryProductSkuAttr.count({id: id}).usingConnection($conn);
            else
                $exist = await FactoryProductSkuAttr.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },
};

