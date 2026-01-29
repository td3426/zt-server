
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'product_fashion',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            columnName: 'fashionNo',
            type: 'string',
            maxLength: 32,
            description: '商品款式uuid',
            required: true
        },

        fashionSN: {
            type: 'string',
            maxLength: 32,
            description: '商品款式编码',
            required: true
        },

        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            defaultsTo: '',
        },

        color: {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },

        material : {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },

        photos : {
            type: 'string',
            description: '',
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },

        designPhotos : {
            type: 'string',
            description: '',
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },

        proofPhotos : {
            type: 'string',
            description: '',
            defaultsTo: '',
            allowNull: true,
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
                $exist = await ProductFashion.count({id: id}).usingConnection($conn);
            else
                $exist = await ProductFashion.count({id: id});

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
                $exist = await ProductFashion.count({createdByCompId: $compId, fashionSN: id}).usingConnection($conn);
            else
                $exist = await ProductFashion.count({createdByCompId: $compId, fashionSN: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成商品编码失败');
            }
        }

        return id;
    }

};

