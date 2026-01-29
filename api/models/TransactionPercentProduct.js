
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'transaction_percent_product',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            columnName: 'transactionNo',
            type: 'string',
            maxLength: 32,
            description: '交易号',
            required: true
        },

        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号',
            defaultsTo: '',
            example: 'abc'
        },

        amount: {
            type: 'number',
            description: '交易金额，单位分',
            columnType: 'int(11)',
            example: 'abc'
        },

        timeval: {
            type: 'number',
            description: '合作期限，单位秒',
            columnType: 'int(11)',
            example: 'abc'
        },

        saleBy: {
            type: 'number',
            description: '卖方用户ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        saleByCompId: {
            type: 'number',
            description: '卖方公司ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        buyBy: {
            type: 'number',
            description: '买方用户ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        buyByCompId: {
            type: 'number',
            description: '买方公司ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        productInfo: {
            type: 'string',
            description: '产品参数信息json',
            defaultsTo: '',
            example: 'abc'
        },

        transactionInfo: {
            type: 'string',
            description: '交易订单信息json，[{"id":1,"range":{"start":0,"end":8},"price":0},{"id":2,"range":{"start":0,"end":14},"price":0},...]',
            defaultsTo: '',
            example: 'abc'
        },

        stat: {
            type: 'number',
            description: '状态, 0已创建',
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
                $exist = await TransactionPercentProduct.count({id: id}).usingConnection($conn);
            else
                $exist = await TransactionPercentProduct.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    }

};

