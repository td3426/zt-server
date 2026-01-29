
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'design_product',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            columnName: 'designProductNo',
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            required: true
        },

        designProductSN: {
            type: 'string',
            maxLength: 32,
            description: '商品编码',
            defaultsTo: ''
        },

        designParentProductNo: {
            type: 'string',
            maxLength: 32,
            description: '主商品编码',
            defaultsTo: ''
        },


       name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },
	
       sname: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
        },
	
        priceType: {
            type: 'number',
            description: '价格类型，0设计版权销售，1分成合作销售',
            columnType: 'int(11)',
            example: 'abc'
        },

        setNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        styleNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        catId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        designIdea: {
            type: 'string',
            description: '设计理念',
            defaultsTo: '',
            example: 'abc'
        },

        photoRender: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: ''
        },

        photoCad: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: ''
        },

        intro: {
            type: 'string',
            defaultsTo: '',
			allowNull: true,
        },

        dimension: {
            type: 'string',
            defaultsTo: '',
			allowNull: true,
        },

        photoSize: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: ''
        },

        photoStory: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: ''
        },

        price: {
            type: 'number',
            columnType: 'decimal(13,2)',
            defaultsTo: 0,
        },

        pricePercent: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        contractFile: {
            type: 'string',
            defaultsTo: '',
        },

        customCoverPage: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0,
        },


        nCooperated: {
            type: 'number',
            description: '合作工厂数量',
            columnType: 'int(11)',
            example: 'abc'
        },

        stat: {
            type: 'number',
            description: '状态, 0创建，1已上架，2已下架',
            columnType: 'int(11)',
            example: 'abc'
        },

        stock: {
            type: 'number',
            columnType: 'int(11)',
			defaultsTo: 1
        },

        marketPublish: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        salebookPublish: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },


        createdBy: {
            type: 'number',
            description: '创建人ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        createdByCompId: {
            type: 'number',
            description: '创建人所在公司ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        designMarketNVisited: {
            type: 'number',
            description: '',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        startPrice: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: 'abc'
        },

        publishedAt: {
            type: 'number',
            description: '上架时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        banAt: {
            type: 'number',
            description: '下架时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        delAt: {
            type: 'number',
            description: '删除时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

    },

    genUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await DesignProduct.count({id: id}).usingConnection($conn);
            else
                $exist = await DesignProduct.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

    genSN: async function($compId, $conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = moment().valueOf();

            let $exist = 0;
            if($conn)
                $exist = await DesignProduct.count({createdByCompId: $compId, designProductSN: id}).usingConnection($conn);
            else
                $exist = await DesignProduct.count({createdByCompId: $compId, designProductSN: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成商品编码失败');
            }
        }

        return id;
    }
};

