
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'product_set',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

		id: {
            columnName: 'setNo',
            type: 'string',
            description: '',
            required: true,
            maxLength: 32,
            example: '0'
        },

		pid: {
            columnName: 'parentSetNo',
            type: 'string',
            defaultsTo: '',
            maxLength: 32,
        },

        createdBy: {
            type: 'number',
            description: 'id',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        createdByCompId: {
            type: 'number',
            description: 'id',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        priceType: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        name: {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        pname: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
			allowNull: true,
        },

        photos: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: 'abc'
        },

        orderNo: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        styleNo: {
            type: 'string',
            defaultsTo: '',
        },

        price: {
            type: 'number',
            columnType: 'decimal(13,2)',
            defaultsTo: 0,
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

        stat: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0,
        },

        stock: {
            type: 'number',
            columnType: 'int(11)',
			defaultsTo: 1
        },

        publishedAt: {
            type: 'number',
            description: '上架时间',
            columnType: 'bigint(20)',
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
                $exist = await ProductSet.count({id: id}).usingConnection($conn);
            else
                $exist = await ProductSet.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

    getAllByCompId: async function($comp_id, $priceType) {
		$priceType = _.isArray($priceType) ? $priceType : [$priceType];
		$priceType = _.size($priceType) ? $priceType : [0]
        let $rows = await ProductSet.find({
			createdByCompId: $comp_id,
			priceType: $priceType
		});
        let $ret = {};
        _.each($rows, function($row){
			try { $row.photos = JSON.parse($row.photos); } catch(e) {}
            $ret[$row.id] = $row;
        });

        return $ret;
    }

};

