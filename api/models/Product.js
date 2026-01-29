
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'product',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            columnName: 'productNo',
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            required: true
        },

        productSN: {
            type: 'string',
            maxLength: 32,
            description: '商品编码',
            required: true
        },

        priceType: {
            type: 'number',
            description: '价格类型，0设计版权销售，1分成合作销售',
            columnType: 'int(11)',
            example: 'abc'
        },


        catId: {
            type: 'number',
            description: '所属类目ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        styleId: {
            type: 'number',
            description: '所属风格ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        seriesId: {
            type: 'number',
            description: '所属套系ID',
            columnType: 'int(11)',
            example: 'abc'
        },

       name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        size: {
            type: 'string',
            description: '尺寸json，{len:"",wlen:"",height:""}',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        designPhotos: {
            type: 'string',
            description: '渲染图列表json',
            defaultsTo: '',
            example: ''
        },

        //sizePhotos: {
        //    type: 'string',
        //    description: '尺寸图列表json',
        //    defaultsTo: '',
        //    example: ''
        //},

        price: {
            type: 'number',
            description: '价格',
            columnType: 'int(11)',
            example: 'abc'
        },

        priceDesignPercent: {
            type: 'number',
            description: '设计公司分成百分比，0--100',
            columnType: 'int(11)',
            example: 'abc'
        },

        contractProtoId: {
            type: 'number',
            description: '关联合同原型ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        detail: {
            type: 'string',
            description: '详情html',
            defaultsTo: '',
            example: 'abc'
        },

        memo: {
            type: 'string',
            description: '备注',
            defaultsTo: '',
            example: 'abc'
        },

        designIdea: {
            type: 'string',
            description: '设计理念',
            defaultsTo: '',
            example: 'abc'
        },

        blacklist : {
            type: 'string',
            description: '要屏蔽的工厂id，多个工厂id用英文逗号隔开',
            defaultsTo: '',
            example: 'abc'
        },

        stat: {
            type: 'number',
            description: '状态, 0创建，1已上架，2已下架',
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

        nVisited: {
            type: 'number',
            description: '浏览次数',
            columnType: 'int(11)',
            example: 'abc'
        },

        nCooperated: {
            type: 'number',
            description: '合作工厂数量',
            columnType: 'int(11)',
            example: 'abc'
        },

        marketPublish: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        handbookPublish: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        }

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
                $exist = await Product.count({id: id}).usingConnection($conn);
            else
                $exist = await Product.count({id: id});

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
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await Product.count({createdByCompId: $compId, productSN: id}).usingConnection($conn);
            else
                $exist = await Product.count({createdByCompId: $compId, productSN: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成商品编码失败');
            }
        }

        return id;
    },

    incNvisited: async function($dt, $product_id, $product_row) {
        try {
            await sails.getDatastore('factory').transaction(async ($conn, proceed) => {
                try {
                    if(!$product_row) {
                        $product_row = await Product.findOne({
                            id: $product_id
                        });
                    }
                    if(!$product_row) {
                        throw new Error('商品不存在');
                    }

                    await Product.update({
                            id: $product_id
                        }).set({
                            nVisited: $product_row.nVisited + 1
                        }).usingConnection($conn);

                    await ProductStatisticsDaily.incNvisited($dt, $product_id, $product_row.createdBy, $product_row.createdByCompId, $conn);

                    return proceed(undefined, $product_row.id);

                } catch (err) {
                    sails.log.error(err);
                    return proceed(flaverr('E_ERROR', new Error('数据写入失败')));
                }
            });
        } catch ($e) {
            sails.log.warn($e);
        }
    }

};

