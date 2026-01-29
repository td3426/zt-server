const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'comp_product',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            type: 'string',
            maxLength: 32,
            description: 'comp_product uuid',
            required: true
        },

        compId: {
            type: 'number',
            description: '所属工厂ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            required: true
        },

        stat: {
            type: 'number',
            description: '状态, 0创建，1可用/已上架，2已过期/已下架',
            columnType: 'int(11)',
            example: 'abc'
        },

        priceType: {
            type: 'number',
            description: '价格类型，0设计版权销售，1分成合作销售',
            columnType: 'int(11)',
            example: 'abc'
        },


        expireAt: {
            type: 'number',
            description: '过期时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        transactionNo: {
            type: 'string',
            maxLength: 32,
            description: '交易号',
            required: true
        },


        designerUserId: {
            type: 'number',
            description: '设计师用户ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        designerCompId: {
            type: 'number',
            description: '设计公司ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
        //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
        //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


        //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
        //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
        //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    },

    genUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await CompProduct.count({id: id}).usingConnection($conn);
            else
                $exist = await CompProduct.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

};

