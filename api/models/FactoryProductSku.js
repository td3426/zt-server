
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {

    datastore: 'factory',
    tableName: 'factory_product_sku',

    attributes: {
        id: {
            columnName: 'skuNo',
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            required: true
        },

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

        designProductNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        codeNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        moduleNo: {
            type: 'string',
            maxLength: 255,
            description: '',
            defaultsTo: ''
        },

        stat: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        materialNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        colorNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        cond: {
            type: 'string',
            description: '',
            defaultsTo: ''
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
                $exist = await FactoryProductSku.count({id: id}).usingConnection($conn);
            else
                $exist = await FactoryProductSku.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

	getStepPrice: async function($product_ids, $skip_disabled) {
		$product_ids = _.isArray($product_ids) ? $product_ids : [$product_ids];
		$skip_disabled = $skip_disabled ? true : false;

		let $sku_where = {
			factoryProductNo: $product_ids
		};
		if($skip_disabled) $sku_where.stat = CONST.PRODUCT_SKU_STAT_ENABLED;
		else $sku_where.stat = [CONST.PRODUCT_SKU_STAT_ENABLED, CONST.PRODUCT_SKU_STAT_BAND];

		let $sku_rows = await FactoryProductSku.find($sku_where);
		if(!_.size($sku_rows)) return {};

		let $sku_ids = cutil.getTabCol($sku_rows, 'id');
		let $sku_step_rows = await FactoryProductStepPrice.find({
			skuNo: _.values($sku_ids)
		});

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			where: {
				skuNo: _.values($sku_ids)
			},
			select: ['skuNo', 'nameNo', 'attrName', 'valueNo', 'attrValue']
		});
		let $tmp_sku_attr = {};
		_.each($sku_attr_rows, function($sku_attr_row) {
			if(!_.size($sku_attr_row.valueNo)) return true;

			if(!_.size($tmp_sku_attr[$sku_attr_row.skuNo])) $tmp_sku_attr[$sku_attr_row.skuNo] = [];
			$tmp_sku_attr[$sku_attr_row.skuNo].push({
				id       : $sku_attr_row.nameNo,
				name     : $sku_attr_row.attrName,
				valueId : $sku_attr_row.valueNo,
				value    : $sku_attr_row.attrValue,
			});
		});
		$sku_attr_rows = $tmp_sku_attr;

		let $mat_ids = cutil.getTabCol($sku_rows, 'materialNo');
		let $mat_rows = await Material.find({
			id: _.values($mat_ids)
		});
		$mat_rows = cutil.indexTabByCol($mat_rows, 'id');

		let $color_ids = cutil.getTabCol($sku_rows, 'colorNo');
		let $color_rows = await Color.find({
			id: _.values($color_ids)
		});
		$color_rows = cutil.indexTabByCol($color_rows, 'id');

		let $tmp = {};
		_.each($sku_step_rows, function($step_row) {
			$tmp[$step_row.skuNo] = $tmp[$step_row.skuNo] || [];
			$tmp[$step_row.skuNo].push({
				start: $step_row.numberMin,
				end: $step_row.numberMax,
				price: $step_row.price
			});
		});
		$sku_step_rows = {};
		_.each($tmp, function($tmp_row, $tmp_id) {
			$sku_step_rows[$tmp_id] = _.sortBy($tmp_row, ['start']);
		});

		$tmp = {};
		_.each($sku_rows, function($sku_row) {
			$tmp[$sku_row.factoryProductNo] = $tmp[$sku_row.factoryProductNo] || [];
			$tmp[$sku_row.factoryProductNo].push({
				id            : $sku_row.id,
				material      : $sku_row.materialNo,
				material_name : $mat_rows && $mat_rows[$sku_row.materialNo] && $mat_rows[$sku_row.materialNo].name || '',
				color         : $sku_row.colorNo,
				color_name    : $color_rows && $color_rows[$sku_row.colorNo] && $color_rows[$sku_row.colorNo].name || '',
				code          : $sku_row.codeNo,
				module_no     : $sku_row.moduleNo,
				stat          : $sku_row.stat,
				attrs         : $sku_attr_rows[$sku_row.id] || [],
				prices        : $sku_step_rows[$sku_row.id] || []
			});
		});
		$sku_rows = $tmp;

		return $sku_rows;
	},

};

