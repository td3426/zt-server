
const moment = require('moment');
const uuidv4 = require('uuid/v4');

module.exports = {
    datastore: 'factory',
    tableName: 'factory_product',

    attributes: {
        id: {
            columnName: 'factoryProductNo',
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            required: true
        },

        designProductNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        factoryProductSN: {
            type: 'string',
            maxLength: 32,
            description: '商品编码',
            defaultsTo: ''
        },

        factoryParentProductNo: {
            type: 'string',
            maxLength: 32,
            description: '主商品编码',
            defaultsTo: ''
        },

        designParentProductNo: {
            type: 'string',
            maxLength: 32,
            description: '主商品编码',
            defaultsTo: ''
        },

       moduleNo: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
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

        //setNo: {
        //    type: 'string',
        //    maxLength: 32,
        //    description: '',
        //    defaultsTo: ''
        //},

        customCatNo: {
            type       : 'string',
            maxLength  : 32,
			allowNull  : true,
            defaultsTo : ''
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

        video: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: ''
        },

        videoThumb: {
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

        photoSample: {
            type: 'string',
            description: '',
            defaultsTo: '',
			allowNull: true,
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
            description: '价格',
            columnType: 'decimal(13,2)',
            example: 'abc'
        },

        pricePercent: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        transactionNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        contractNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: ''
        },

        stat: {
            type: 'number',
            description: '状态, 0创建，1已上架，2已下架',
            columnType: 'int(11)',
            defaultsTo: 0,
        },

        publishedAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },

        banAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },


        marketPublish: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0,
        },

        marketPublishedAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },

        marketBanAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },

        salebookPublish: {
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0,
        },

        salebookPublishedAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },

        salebookBanAt: {
            type: 'number',
            columnType: 'bigint(20)',
            defaultsTo: 0,
        },

        designerUserId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        designerCompId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        factoryUserId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        factoryCompId: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        expireAt: {
            type: 'number',
            description: '',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        endAt: {
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

        skuCount: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: 'abc'
        },

        isProof: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            defaultsTo: 0,
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
                $exist = await FactoryProduct.count({id: id}).usingConnection($conn);
            else
                $exist = await FactoryProduct.count({id: id});

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
                $exist = await FactoryProduct.count({factoryCompId: $compId, factoryProductSN: id}).usingConnection($conn);
            else
                $exist = await FactoryProduct.count({factoryCompId: $compId, factoryProductSN: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成商品编码失败');
            }
        }

        return id;
    },

	updateSkuStatstics: async function($spuid, $design_spuid, $conn, $product_set) {
		//已经在loop-check脚本实现定时跑数据
		return;
		if(!_.size($spuid)) {
			sails.log.error('updateSkuStatstics(spuid: ' + $spuid + ', design_spuid: ' + $design_spuid + ') but spuid is empty. product_set: ', $product_set);
			return;
		}

		$product_set = $product_set || {
			startPrice: 0,
			skuCount: 0
		};

		if($conn) {
			$product_set.skuCount = await FactoryProductSku.count({
				factoryProductNo: $spuid,
				stat: CONST.PRODUCT_SKU_STAT_ENABLED
			}).usingConnection($conn);
			$product_set.startPrice = await $conn.query(
				"select min(a.price) as price from factory_product_step_price a left join factory_product_sku b on a.skuNo=b.skuNo where a.factoryProductNo=$1 and b.stat=$2", 
				[$spuid, CONST.PRODUCT_SKU_STAT_ENABLED]
			);
			$product_set.startPrice = $product_set.startPrice && $product_set.startPrice.rows && $product_set.startPrice.rows[0] && $product_set.startPrice.rows[0].price || 0;
			await FactoryProduct.update($spuid).set($product_set).usingConnection($conn);

			if(!_.size($design_spuid)) return;

			let $design_start_price = await $conn.query(
				"select min(startPrice) as startPrice from factory_product where designProductNo=$1 and stat=$2",
				[
					$design_spuid,
					CONST.PRODUCT_STAT_PUBLISHED
				]
			);
			$design_start_price = $design_start_price && $design_start_price.rows && $design_start_price.rows[0] && $design_start_price.rows[0].startPrice || 0;
			await DesignProduct.update($design_spuid).set({
				startPrice: $design_start_price
			}).usingConnection($conn);
		} else {
			$product_set.skuCount = await FactoryProductSku.count({
				factoryProductNo: $spuid,
				stat: CONST.PRODUCT_SKU_STAT_ENABLED
			});
			$product_set.startPrice = await sails.getDatastore('factory').sendNativeQuery(
				"select min(a.price) as price from factory_product_step_price a left join factory_product_sku b on a.skuNo=b.skuNo where a.factoryProductNo=$1 and b.stat=$2", 
				[$spuid, CONST.PRODUCT_SKU_STAT_ENABLED]
			);
			$product_set.startPrice = $product_set.startPrice && $product_set.startPrice.rows && $product_set.startPrice.rows[0] && $product_set.startPrice.rows[0].price || 0;
			await FactoryProduct.update($spuid).set($product_set);

			if(!_.size($design_spuid)) return;

			let $design_start_price = await await sails.getDatastore('factory').sendNativeQuery(
				"select min(startPrice) as startPrice from factory_product where designProductNo=$1 and stat=$2",
				[
					$design_spuid,
					CONST.PRODUCT_STAT_PUBLISHED
				]
			);
			$design_start_price = $design_start_price && $design_start_price.rows && $design_start_price.rows[0] && $design_start_price.rows[0].startPrice || 0;
			await DesignProduct.update($design_spuid).set({
				startPrice: $design_start_price
			});
		}
	},


	addSelfProductToMes: async function($spuid) {
		var $product_rows = await FactoryProduct.find({
			or: [
				{ id: $spuid },
				{ factoryParentProductNo: $spuid },
			],
			stat: {
				'!=': CONST.PRODUCT_STAT_DELETED
			}
		});

		for(var $idx in $product_rows) {
			var $row = $product_rows[$idx];
			await FactoryProduct.addSingleSelfProductToMes(0, $row);
		}
	},

	addSingleSelfProductToMes: async function($spuid, $product_row) {
		$product_row = $product_row || await FactoryProduct.findOne($spuid);

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = [$product_row.setNo];
		//var $set_rows = $set_ids && await ProductSet.find({
		//	id: _.values($set_ids)
		//}) || null;
		//$set_rows = $set_rows && cutil.indexTabByCol($set_rows, 'id') || null;
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = [$product_row.styleNo];
		var $style_rows = $style_ids && await ProductStyle.find({
			id: _.values($style_ids)
		}) || null;
		$style_rows = $style_ids && cutil.indexTabByCol($style_rows, 'id') || null;

		var $factory_user_row = await User.getUsers([$product_row.factoryUserId], ['id', 'name', 'avatar', 'compId']);
		$factory_user_row = $factory_user_row && $factory_user_row[$product_row.factoryUserId] || null;

		var $sku_rows = await FactoryProductSku.find({
			factoryProductNo: $product_row.id
		});

		var $mat_ids = cutil.getTabCol($sku_rows, 'materialNo');
		var $mat_rows = await Material.find({
			id: _.values($mat_ids)
		});
		$mat_rows = cutil.indexTabByCol($mat_rows, 'id');

		var $color_ids = cutil.getTabCol($sku_rows, 'colorNo');
		var $color_rows = await Color.find({
			id: _.values($color_ids)
		});
		$color_rows = cutil.indexTabByCol($color_rows, 'id');


		var $price_rows = await FactoryProductStepPrice.find({
			factoryProductNo: $product_row.id
		});
		$price_rows = cutil.indexTabByCol($price_rows, 'skuNo', 'id');

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			where: {
				factoryProductNo: $product_row.id
			},
			select: ['skuNo', 'nameNo', 'attrName', 'valueNo', 'attrValue']
		});
		let $tmp = {};
		_.each($sku_attr_rows, function($sku_attr_row) {
			$tmp[$sku_attr_row.skuNo] = $tmp[$sku_attr_row.skuNo] || [];
			$tmp[$sku_attr_row.skuNo].push({
				id       : $sku_attr_row.nameNo,
				name     : $sku_attr_row.attrName,
				valueId  : $sku_attr_row.valueNo,
				value    : $sku_attr_row.attrValue,
			});
		});
		$sku_attr_rows = $tmp;

		var $photo_render = "";
		try {
			$photo_render = JSON.parse($product_row.photoRender);
		} catch($e) {}

		var $photo_cad = "";
		try {
			$photo_cad = JSON.parse($product_row.photoCad);
		} catch($e) {}

		var $photo_size = "";
		try {
			$photo_size = JSON.parse($product_row.photoSize);
		} catch($e) {}

		var $photo_story = "";
		try {
			$photo_story = JSON.parse($product_row.photoStory);
		} catch($e) {}

		var $spu_info = {
			spuid: $product_row.id,
			Module: $product_row.moduleNo,
			cat: $product_row.catId && $cat_rows[$product_row.catId] && $cat_rows[$product_row.catId].name || '',
			style: $product_row.styleNo && $style_rows[$product_row.styleNo] && $style_rows[$product_row.styleNo].name || '',
			name: $product_row.name,
			sname: $product_row.sname,
			size: "0,0,0",
			photo_render: $photo_render && $photo_render.join(',') || '',
			photo_cad: $photo_cad && $photo_cad.join(',') || '',
			photo_size: $photo_size && $photo_size.join(',') || '',
			photo_story: $photo_story && $photo_story.join(',') || '',
			//set : $product_row.setNo && $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : '',
			createdId: $product_row.factoryUserId,
			createdBy: $factory_user_row && $factory_user_row.name || '',
			orgId: $product_row.factoryCompId,
			skus: []
		};

		let $skus = [];
		_.each($sku_rows, function($sku_row) {
			let $price_ids = [];
			if($price_rows[$sku_row.id]) {
				_.each($price_rows[$sku_row.id], function($price_row) {
					$price_ids.push($price_row.id);
				});
			}
			$skus.push({
				skuid     : $sku_row.id,
				colour    : $color_rows && $color_rows[$sku_row.colorNo] && $color_rows[$sku_row.colorNo].name || '',
				material  : $mat_rows && $mat_rows[$sku_row.materialNo] && $mat_rows[$sku_row.materialNo].name || '',
				code      : $sku_row.codeNo,
				Module    : $sku_row.moduleNo,
				cond      : $sku_attr_rows[$sku_row.id] || [],
				pricesId  : $price_ids && $price_ids.join(',') || '',
				createdId : $product_row.factoryUserId,
				createdBy : $factory_user_row && $factory_user_row.name || '',
			});
		});

		$spu_info.skus = $skus;

		var $mes = new MesApi();
		await $mes.addProduct($spu_info);
	},


	addSpuToMes: async function($spuid, $product_row) {
		$product_row = $product_row || await FactoryProduct.findOne($spuid);
		if(!$product_row) throw '商品(' + ($spuid || $product_row && $product_row.id || '') + ')没找到？';

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = [$product_row.setNo];
		//var $set_rows = $set_ids && await ProductSet.find({
		//	id: _.values($set_ids)
		//}) || null;
		//$set_rows = $set_rows && cutil.indexTabByCol($set_rows, 'id') || null;
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = [$product_row.styleNo];
		var $style_rows = $style_ids && await ProductStyle.find({
			id: _.values($style_ids)
		}) || null;
		$style_rows = $style_ids && cutil.indexTabByCol($style_rows, 'id') || null;

		var $factory_user_row = await User.getUsers([$product_row.factoryUserId], ['id', 'name', 'avatar', 'compId']);
		$factory_user_row = $factory_user_row && $factory_user_row[$product_row.factoryUserId] || null;

		var $photo_render = "";
		try {
			$photo_render = JSON.parse($product_row.photoRender);
		} catch($e) {}

		var $photo_cad = "";
		try {
			$photo_cad = JSON.parse($product_row.photoCad);
		} catch($e) {}

		var $photo_size = "";
		try {
			$photo_size = JSON.parse($product_row.photoSize);
		} catch($e) {}

		var $photo_story = "";
		try {
			$photo_story = JSON.parse($product_row.photoStory);
		} catch($e) {}

		var $spu_info = {
			spuid: $product_row.id,
			Module: $product_row.moduleNo,
			cat: $product_row.catId && $cat_rows[$product_row.catId] && $cat_rows[$product_row.catId].name || '',
			style: $product_row.styleNo && $style_rows[$product_row.styleNo] && $style_rows[$product_row.styleNo].name || '',
			name: $product_row.name,
			sname: $product_row.sname,
			size: "0,0,0",
			photo_render: $photo_render && $photo_render.join(',') || '',
			photo_cad: $photo_cad && $photo_cad.join(',') || '',
			photo_size: $photo_size && $photo_size.join(',') || '',
			photo_story: $photo_story && $photo_story.join(',') || '',
			//set : $product_row.setNo && $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : '',
			createdId: $product_row.factoryUserId,
			createdBy: $factory_user_row && $factory_user_row.name || '',
			orgId: $product_row.factoryCompId,
			skus: []
		};

		var $mes = new MesApi();
		await $mes.addProduct($spu_info);
	},

	updateSpuToMes: async function($spuid, $product_row) {
		$product_row = $product_row || await FactoryProduct.findOne($spuid);
		if(!$product_row) throw '商品(' + ($spuid || $product_row && $product_row.id || '') + ')没找到？';

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = [$product_row.setNo];
		//var $set_rows = $set_ids && await ProductSet.find({
		//	id: _.values($set_ids)
		//}) || null;
		//$set_rows = $set_rows && cutil.indexTabByCol($set_rows, 'id') || null;
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = [$product_row.styleNo];
		var $style_rows = $style_ids && await ProductStyle.find({
			id: _.values($style_ids)
		}) || null;
		$style_rows = $style_ids && cutil.indexTabByCol($style_rows, 'id') || null;

		var $factory_user_row = await User.getUsers([$product_row.factoryUserId], ['id', 'name', 'avatar', 'compId']);
		$factory_user_row = $factory_user_row && $factory_user_row[$product_row.factoryUserId] || null;

		var $photo_render = "";
		try {
			$photo_render = JSON.parse($product_row.photoRender);
		} catch($e) {}

		var $photo_cad = "";
		try {
			$photo_cad = JSON.parse($product_row.photoCad);
		} catch($e) {}

		var $photo_size = "";
		try {
			$photo_size = JSON.parse($product_row.photoSize);
		} catch($e) {}

		var $photo_story = "";
		try {
			$photo_story = JSON.parse($product_row.photoStory);
		} catch($e) {}

		var $spu_info = {
			spuid        : $product_row.id,
			Module       : $product_row.moduleNo,
			cat          : $product_row.catId && $cat_rows[$product_row.catId] && $cat_rows[$product_row.catId].name || '',
			style        : $product_row.styleNo && $style_rows[$product_row.styleNo] && $style_rows[$product_row.styleNo].name || '',
			name         : $product_row.name,
			sname        : $product_row.sname,
			size         : "0,0,0",
			photo_render : $photo_render && $photo_render.join(',') || '',
			photo_cad    : $photo_cad && $photo_cad.join(',') || '',
			photo_size   : $photo_size && $photo_size.join(',') || '',
			photo_story  : $photo_story && $photo_story.join(',') || '',
			//set : $product_row.setNo && $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : '',
			createdId    : $product_row.factoryUserId,
			createdBy    : $factory_user_row && $factory_user_row.name || '',
			orgId        : $product_row.factoryCompId,
			isDeleted    : $product_row.stat == CONST.PRODUCT_STAT_DELETED ? 1 : 0,
			skus         : []
		};

		var $mes = new MesApi();
		await $mes.updateProduct($spu_info);
	},

	delSpuToMes: async function($spuid) {
		return await FactoryProduct.updateSpuToMes($spuid);
		//var $mes = new MesApi();
		//await $mes.delProduct({
		//	spuid: $spuid,
		//	skuid: ''
		//});
	},


	addSkuToMes: async function($sku_ids, $spu_id, $spu_row) {
		var $sku_rows = await FactoryProductSku.find($sku_ids);
		if(!$sku_rows) throw 'sku不存在';

		var $product_row = $spu_row || await FactoryProduct.findOne($spu_id) || null;
		if(!$product_row) throw 'spu不存在';

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = [$product_row.setNo];
		//var $set_rows = $set_ids && await ProductSet.find({
		//	id: _.values($set_ids)
		//}) || null;
		//$set_rows = $set_rows && cutil.indexTabByCol($set_rows, 'id') || null;
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = [$product_row.styleNo];
		var $style_rows = $style_ids && await ProductStyle.find({
			id: _.values($style_ids)
		}) || null;
		$style_rows = $style_ids && cutil.indexTabByCol($style_rows, 'id') || null;

		var $factory_user_row = await User.getUsers([$product_row.factoryUserId], ['id', 'name', 'avatar', 'compId']);
		$factory_user_row = $factory_user_row && $factory_user_row[$product_row.factoryUserId] || null;

		var $mat_ids = cutil.getTabCol($sku_rows, 'materialNo');
		var $mat_rows = await Material.find({
			id: _.values($mat_ids)
		});
		$mat_rows = cutil.indexTabByCol($mat_rows, 'id');

		var $color_ids = cutil.getTabCol($sku_rows, 'colorNo');
		var $color_rows = await Color.find({
			id: _.values($color_ids)
		});
		$color_rows = cutil.indexTabByCol($color_rows, 'id');

		var $price_rows = await FactoryProductStepPrice.find({
			factoryProductNo: $product_row.id
		});
		$price_rows = cutil.indexTabByCol($price_rows, 'skuNo', 'id');

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			where: {
				factoryProductNo: $product_row.id
			},
			select: ['skuNo', 'nameNo', 'attrName', 'valueNo', 'attrValue']
		});
		let $tmp = {};
		_.each($sku_attr_rows, function($sku_attr_row) {
			$tmp[$sku_attr_row.skuNo] = $tmp[$sku_attr_row.skuNo] || [];
			$tmp[$sku_attr_row.skuNo].push({
				id       : $sku_attr_row.nameNo,
				name     : $sku_attr_row.attrName,
				valueId  : $sku_attr_row.valueNo,
				value    : $sku_attr_row.attrValue,
			});
		});
		$sku_attr_rows = $tmp;

		var $photo_render = "";
		try {
			$photo_render = JSON.parse($product_row.photoRender);
		} catch($e) {}

		var $photo_cad = "";
		try {
			$photo_cad = JSON.parse($product_row.photoCad);
		} catch($e) {}

		var $photo_size = "";
		try {
			$photo_size = JSON.parse($product_row.photoSize);
		} catch($e) {}

		var $photo_story = "";
		try {
			$photo_story = JSON.parse($product_row.photoStory);
		} catch($e) {}

		var $spu_info = {
			spuid: $product_row.id,
			Module: $product_row.moduleNo,
			cat: $product_row.catId && $cat_rows[$product_row.catId] && $cat_rows[$product_row.catId].name || '',
			style: $product_row.styleNo && $style_rows[$product_row.styleNo] && $style_rows[$product_row.styleNo].name || '',
			name: $product_row.name,
			sname: $product_row.sname,
			size: "0,0,0",
			photo_render: $photo_render && $photo_render.join(',') || '',
			photo_cad: $photo_cad && $photo_cad.join(',') || '',
			photo_size: $photo_size && $photo_size.join(',') || '',
			photo_story: $photo_story && $photo_story.join(',') || '',
			//set : $product_row.setNo && $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : '',
			createdId: $product_row.factoryUserId,
			createdBy: $factory_user_row && $factory_user_row.name || '',
			orgId: $product_row.factoryCompId,
			skus: []
		};

		var $skus = [];
		_.each($sku_rows, function($sku_row) {
			let $price_ids = [];
			if($price_rows[$sku_row.id]) {
				_.each($price_rows[$sku_row.id], function($price_row) {
					$price_ids.push($price_row.id);
				});
			}
			$skus.push({
				skuid     : $sku_row.id,
				colour    : $color_rows && $color_rows[$sku_row.colorNo] && $color_rows[$sku_row.colorNo].name || '',
				material  : $mat_rows && $mat_rows[$sku_row.materialNo] && $mat_rows[$sku_row.materialNo].name || '',
				code      : $sku_row.codeNo,
				Module    : $sku_row.moduleNo,
				cond      : $sku_attr_rows[$sku_row.id] || [],
				pricesId  : $price_ids && $price_ids.join(',') || '',
				createdId : $product_row.factoryUserId,
				createdBy : $factory_user_row && $factory_user_row.name || '',
			});
		});

		$spu_info.skus = $skus;
		sails.log('ddd-sku:', $sku_rows, $skus);

		var $mes = new MesApi();
		await $mes.addProduct($spu_info);
	},

	updateSkuToMes: async function($sku_ids, $spu_id, $spu_row) {
		var $sku_rows = await FactoryProductSku.find($sku_ids);
		if(!$sku_rows) throw 'sku不存在';

		var $product_row = $spu_row || await FactoryProduct.findOne($spu_id) || null;
		if(!$product_row) throw 'spu不存在';

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = [$product_row.setNo];
		//var $set_rows = $set_ids && await ProductSet.find({
		//	id: _.values($set_ids)
		//}) || null;
		//$set_rows = $set_rows && cutil.indexTabByCol($set_rows, 'id') || null;
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = [$product_row.styleNo];
		var $style_rows = $style_ids && await ProductStyle.find({
			id: _.values($style_ids)
		}) || null;
		$style_rows = $style_ids && cutil.indexTabByCol($style_rows, 'id') || null;

		var $factory_user_row = await User.getUsers([$product_row.factoryUserId], ['id', 'name', 'avatar', 'compId']);
		$factory_user_row = $factory_user_row && $factory_user_row[$product_row.factoryUserId] || null;

		var $mat_ids = cutil.getTabCol($sku_rows, 'materialNo');
		var $mat_rows = await Material.find({
			id: _.values($mat_ids)
		});
		$mat_rows = cutil.indexTabByCol($mat_rows, 'id');

		var $color_ids = cutil.getTabCol($sku_rows, 'colorNo');
		var $color_rows = await Color.find({
			id: _.values($color_ids)
		});
		$color_rows = cutil.indexTabByCol($color_rows, 'id');

		var $price_rows = await FactoryProductStepPrice.find({
			factoryProductNo: $product_row.id
		});
		$price_rows = cutil.indexTabByCol($price_rows, 'skuNo', 'id');

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			where: {
				factoryProductNo: $product_row.id
			},
			select: ['skuNo', 'nameNo', 'attrName', 'valueNo', 'attrValue']
		});
		let $tmp = {};
		_.each($sku_attr_rows, function($sku_attr_row) {
			$tmp[$sku_attr_row.skuNo] = $tmp[$sku_attr_row.skuNo] || [];
			$tmp[$sku_attr_row.skuNo].push({
				id       : $sku_attr_row.nameNo,
				name     : $sku_attr_row.attrName,
				valueId : $sku_attr_row.valueNo,
				value    : $sku_attr_row.attrValue,
			});
		});
		$sku_attr_rows = $tmp;

		var $photo_render = "";
		try {
			$photo_render = JSON.parse($product_row.photoRender);
		} catch($e) {}

		var $photo_cad = "";
		try {
			$photo_cad = JSON.parse($product_row.photoCad);
		} catch($e) {}

		var $photo_size = "";
		try {
			$photo_size = JSON.parse($product_row.photoSize);
		} catch($e) {}

		var $photo_story = "";
		try {
			$photo_story = JSON.parse($product_row.photoStory);
		} catch($e) {}

		var $spu_info = {
			spuid: $product_row.id,
			Module: $product_row.moduleNo,
			cat: $product_row.catId && $cat_rows[$product_row.catId] && $cat_rows[$product_row.catId].name || '',
			style: $product_row.styleNo && $style_rows[$product_row.styleNo] && $style_rows[$product_row.styleNo].name || '',
			name: $product_row.name,
			sname: $product_row.sname,
			size: "0,0,0",
			photo_render: $photo_render && $photo_render.join(',') || '',
			photo_cad: $photo_cad && $photo_cad.join(',') || '',
			photo_size: $photo_size && $photo_size.join(',') || '',
			photo_story: $photo_story && $photo_story.join(',') || '',
			//set : $product_row.setNo && $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : '',
			createdId: $product_row.factoryUserId,
			createdBy: $factory_user_row && $factory_user_row.name || '',
			orgId: $product_row.factoryCompId,
			isDeleted: $product_row.stat == CONST.PRODUCT_STAT_DELETED ? 1 : 0,
			skus: []
		};

		var $skus = [];
		_.each($sku_rows, function($sku_row) {
			let $price_ids = [];
			if($price_rows[$sku_row.id]) {
				_.each($price_rows[$sku_row.id], function($price_row) {
					$price_ids.push($price_row.id);
				});
			}

			$skus.push({
				skuid     : $sku_row.id,
				colour    : $color_rows && $color_rows[$sku_row.colorNo] && $color_rows[$sku_row.colorNo].name || '',
				material  : $mat_rows && $mat_rows[$sku_row.materialNo] && $mat_rows[$sku_row.materialNo].name || '',
				code      : $sku_row.codeNo,
				Module    : $sku_row.moduleNo,
				cond      : $sku_attr_rows[$sku_row.id] || [],
				pricesId  : $price_ids && $price_ids.join(',') || '',
				isDeleted : $sku_row.stat == CONST.PRODUCT_SKU_STAT_DEL ? 1 : 0,
				createdId : $product_row.factoryUserId,
				createdBy : $factory_user_row && $factory_user_row.name || '',
			});
		});

		$spu_info.skus = $skus;

		var $mes = new MesApi();
		await $mes.updateProduct($spu_info);
	},

	delSkuToMes: async function($sku_ids, $spu_id) {
		return await FactoryProduct.updateSkuToMes($sku_ids, $spu_id);
		//var $mes = new MesApi();
		//await $mes.delProduct({
		//	spuid: '',
		//	skuid: $sku_id
		//});
	},


	getProductNBom: async function($spu_ids) {
		if(!_.isArray($spu_ids) || !_.size($spu_ids)) return [];

		var $mes = new MesApi();
		return await $mes.getProductNBom($spu_ids);
	}
};

