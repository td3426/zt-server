
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
	setProductStepPrice: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		var $product_id = cutil.getReq(req, 'product_no');
		if(!$product_id) return res.jsonerr('商品不存在');
		var $product_row = await FactoryProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.factoryCompId != req.me.compId) return res.jsonerr('商品不属于该企业');
		if(CONST.PRODUCT_STAT_BANED != parseInt($product_row.stat)) return res.jsonerr('未上架的商品才可编辑');

		if(typeof req.param('step_price') == 'undefined') return res.jsonerr('阶梯价格表不能为空');

		var $step_price = req.param('step_price');
		if(!_.size($step_price)) return res.jsonerr('阶梯价格表为空'); 

		var $product_set = {};
        var $publish = parseInt(cutil.getReq(req, 'publish'));
		if($publish == CONST.PRODUCT_STAT_PUBLISHED) {
			//if(CONST.PRODUCT_STAT_BANED != parseInt($product_row.stat)) {
			//	return res.jsonerr('未上架的商品才可上架');
			//}

			let $tm = moment().valueOf();
			$product_set.stat = CONST.PRODUCT_STAT_PUBLISHED;
			$product_set.publishedAt = $tm;
			$product_set.marketPublish = CONST.PRODUCT_MARMET_STAT_PUBLISHED;
			$product_set.marketPublishedAt = $tm;
			$product_set.salebookPublish = CONST.PRODUCT_MARMET_STAT_PUBLISHED;
			$product_set.salebookPublishedAt = $tm;
		}

        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) {
			$product_set.stat = CONST.PRODUCT_STAT_BANED;
			$product_set.marketPublish = CONST.PRODUCT_MARMET_STAT_BAND;
			$product_set.salebookPublish = CONST.PRODUCT_MARMET_STAT_BAND;
			delete $product_set.publishedAt;
			delete $product_set.marketPublishedAt;
			delete $product_set.salebookPublishedAt;
		}

		/*
		[
			{
				"id":"0d5ce7e3c1d440dcbf1b016fd340ed26",
				"material": "1ec03516331a47df9ea23ef5c329f1ac",
				"color": "160d420b3da64cecbbc9833f3032dca2",
				"code":"12321321",
				"attrs": [
					{
						"id": "b8b233473f0d4d5da82c7bce9a7e12ee",
						"name": "尺寸",
						"value": "300*400"
					},
					{
						"id": "0d5ce7e3c1d440dcbf1b016fd340ed26",
						"name": "规格",
						"value": "规格1"
					}
				],
				"prices": [
					{
						"start": 0,
						"end": 100,
						"price": "12345"
					},
					{
						"start": 101,
						"end": 200,
						"price": "4565"
					},
					{
						"start": 201,
						"price": "300"
					}
				]
			},...
		] 
		*/
		let $sku_create_sets = [], $sku_update_sets = [], $sku_step_price_sets = [];
		let $mes_create_ids = [], $mes_update_ids = [], $mes_del_ids = [];
		let $event_add_sku = [], $event_update_sku = [];
		let $sku_attr_db_sets = [];

		let $module_no_map = {}, $sku_id_map = {}, $module_dup = false;
		_.each($step_price, function($sku_row) {
			if(parseInt($sku_row.stat) == CONST.PRODUCT_SKU_STAT_ENABLED) {
				if(!_.size($sku_row.module_no)) $module_dup = true;

				if(cutil.defined($module_no_map[$sku_row.module_no])) {
					$module_dup = true;
					return false;
				}

				//只需要判断当前这批启用的sku型号
				$module_no_map[$sku_row.module_no] = $sku_row.module_no;
			}
		});
		if($module_dup) return res.jsonerr('型号不能为空且不能重复');

		//数据库检查需要排除当前这批sku
		$sku_id_map = await FactoryProductSku.find({
			where: {
				factoryProductNo: $product_row.id
			},
			select: ["id"]
		});
		$sku_id_map = _.size($sku_id_map) ? cutil.getTabCol($sku_id_map, 'id') : {};

		let $sku_exiestd_module_no = await FactoryProductSku.find({
			where: {
				factoryCompId : $comp_row.id,
				stat          : CONST.PRODUCT_SKU_STAT_ENABLED,
				moduleNo      : _.values($module_no_map),
				id            : {
					'nin': _.values($sku_id_map)
				}
			},
			select: ['moduleNo']
		});
		$sku_exiestd_module_no = _.size($sku_exiestd_module_no) ? cutil.getTabCol($sku_exiestd_module_no, 'moduleNo') : {};
		if(_.size($sku_exiestd_module_no)) return res.jsonerr('型号 ' + _.values($sku_exiestd_module_no).join(' | ') + ' 不能重复');

		for(var $sku_idx = 0; $sku_idx < $step_price.length; $sku_idx ++) {
			let $sku_row = $step_price[$sku_idx];
			if(!$sku_row.material) return res.jsonerr('材质ID不能为空');
			if(!$sku_row.color) return res.jsonerr('颜色ID不能为空');

			for(let $sku_attr_idx in $sku_row.attrs) {
				let $sku_attr = $sku_row.attrs[$sku_attr_idx];
				if(
					!cutil.defined($sku_attr.id)
					|| !cutil.defined($sku_attr.name)
					|| !cutil.defined($sku_attr.valueId)
					|| !cutil.defined($sku_attr.value)
				)  return res.jsonerr('sku属性参数错误');
			}

			let $sku_id;
			let $sku_stat = parseInt($sku_row.stat) == CONST.PRODUCT_SKU_STAT_BAND ? CONST.PRODUCT_SKU_STAT_BAND : CONST.PRODUCT_SKU_STAT_ENABLED;

			if($sku_row.id) {
				$sku_id = $sku_row.id;

				if($sku_stat == CONST.PRODUCT_SKU_STAT_BAND)
					$mes_del_ids.push($sku_id);
				else
					$mes_update_ids.push($sku_id);

				$sku_update_sets.push({
					id               : $sku_id,
					factoryProductNo : $product_row.id,
					designProductNo  : $product_row.designProductNo,
					materialNo       : $sku_row.material,
					colorNo          : $sku_row.color,
					stat             : $sku_stat,
					codeNo           : $sku_row.code || '',
					moduleNo         : $sku_row.module_no || '',
					cond: JSON.stringify($sku_row.attrs)
				});

				for(let $sku_attr_idx in $sku_row.attrs) {
					let $sku_attr = $sku_row.attrs[$sku_attr_idx];
					$sku_attr_db_sets.push({
						skuNo            : $sku_id,
						factoryCompId    : $comp_row.id,
						factoryProductNo : $product_row.id,
						nameNo           : $sku_attr.id,
						attrName         : $sku_attr.name,
						valueNo          : $sku_attr.valueId,
						attrValue        : $sku_attr.value
					});
				}
			} else {
				try{
					$sku_id = await FactoryProductSku.genUUID();
				} catch($e) {
					return res.jsonerr('生成商品SKU ID失败');
				}

				$mes_create_ids.push($sku_id);
				$sku_create_sets.push({
					id               : $sku_id,
					factoryCompId    : $comp_row.id,
					factoryProductNo : $product_row.id,
					designProductNo  : $product_row.designProductNo,
					materialNo       : $sku_row.material,
					colorNo          : $sku_row.color,
					stat             : $sku_stat,
					codeNo           : $sku_row.code || '',
					moduleNo         : $sku_row.module_no || '',
					cond: JSON.stringify($sku_row.attrs)
				});

				for(let $sku_attr_idx in $sku_row.attrs) {
					let $sku_attr = $sku_row.attrs[$sku_attr_idx];
					$sku_attr_db_sets.push({
						skuNo            : $sku_id,
						factoryCompId    : $comp_row.id,
						factoryProductNo : $product_row.id,
						nameNo           : $sku_attr.id,
						attrName         : $sku_attr.name,
						valueNo          : $sku_attr.valueId,
						attrValue        : $sku_attr.value
					});
				}
			}
			
			for(var $price_idx = 0, $price_len = $sku_row.prices && $sku_row.prices.length || 0; $price_idx < $price_len; $price_idx ++) {
				var $price_row = $sku_row.prices[$price_idx];
				let $price_id;
				try{
					$price_id = await FactoryProductStepPrice.genUUID();
				} catch($e) {
					return res.jsonerr('生成商品阶梯价格ID失败');
				}

				$sku_step_price_sets.push({
					id: $price_id,
					factoryProductNo: $product_row.id,
					designProductNo: $product_row.designProductNo,
					skuNo: $sku_id,
					numberMin: $price_row.start || 0,
					numberMax: $price_row.end || 0,
					price: $price_row.price || 0
				});
			}
		}

		if(
			!_.size($sku_create_sets) && !_.size($sku_update_sets) 
			|| !_.size($sku_step_price_sets)
		) return res.jsonerr('阶梯价格表为空');

		if($product_set.stat == CONST.PRODUCT_STAT_PUBLISHED) {
			try {
				if(!$product_row) throw '请填写商品信息';
				if(!$product_row.name || $product_row.name.length < 1) throw '请填写商品名称';
				if(!$product_row.styleNo || $product_row.styleNo.length < 1) throw '请选择商品风格';
				if(!$product_row.catId) throw '请选择商品类目';

				if(!$product_row.photoRender || _.size($product_row.photoRender) < 1) throw '请上传3D单品渲染图'; 

				if(!$sku_create_sets && !$sku_update_sets) throw '请填写阶梯价格';
			} catch($e) {
				return res.jsonerr($e.toString());
			}
		}

		try{
            var $id = await sails.getDatastore('factory').transaction(async (db, proceed) => {
                try {
					await FactoryProductSku.update({
						factoryProductNo: $product_row.id
					}).set({
						stat: CONST.PRODUCT_SKU_STAT_DEL
					}).usingConnection(db);

					if(_.size($sku_update_sets)) {
						for(var $update_set_idx = 0; $update_set_idx < $sku_update_sets.length; $update_set_idx ++) {
							var $update_set_row = $sku_update_sets[$update_set_idx];
							let $sku_id = $update_set_row.id;
							delete $update_set_row.id;
							let $sku_rows = await FactoryProductSku.update($sku_id).set($update_set_row).fetch().usingConnection(db);
							$event_update_sku = $event_update_sku.concat($sku_rows);
						}
					}

					if(_.size($sku_create_sets)) {
						let $sku_rows = await FactoryProductSku.createEach($sku_create_sets).fetch().usingConnection(db);
						$event_add_sku = $event_add_sku.concat($sku_rows);
					}

					await db.query(
						"delete from factory_product_sku_attr where skuNo in(" +
							"select skuNo from factory_product_sku where factoryProductNo='" + $product_row.id + "' and (stat = " + CONST.PRODUCT_SKU_STAT_ENABLED + " or stat = " + CONST.PRODUCT_SKU_STAT_BAND + ")" +
						")"
					);
					if(_.size($sku_attr_db_sets)) {
						await FactoryProductSkuAttr.createEach($sku_attr_db_sets).usingConnection(db);
						//let $cond_sku_nos = await cutil.getTabCol($sku_attr_db_sets, 'skuNo');
						//let $cond_sku_no_str = _.values($cond_sku_nos).join("','");
						//await db.query(
						//	"update factory_product_sku as sku inner join (" +
						//    "	select attr.skuNo, group_concat('{', '\"id\":\"', attr.nameNo, '\",', '\"name\":\"', attr.attrName, '\",', '\"valueId\":\"', attr.valueNo, '\",', '\"value\":\"', attr.attrValue, '\"}' separator ',') as cond " +
						//	"	from factory_product_sku_attr as attr" +
						//	"	where attr.skuNo in('" + $cond_sku_no_str + "')" + 
						//	"	group by attr.skuNo" +
						//	") as b" +
						//	" set sku.cond=concat('[', ifnull(b.cond, ''), ']')" +
						//	" where sku.skuNo in ('" + $cond_sku_no_str + "')"
						//);
					}

					await db.query(
						"delete from factory_product_step_price where skuNo in (" +
							"select skuNo from factory_product_sku where factoryProductNo='" + $product_row.id + "' and (stat = " + CONST.PRODUCT_SKU_STAT_ENABLED + " or stat = " + CONST.PRODUCT_SKU_STAT_BAND + ")" +
						")"
					);
					await FactoryProductStepPrice.createEach($sku_step_price_sets).usingConnection(db);

					if($product_set && _.size($product_set)) {
						$product_row = await FactoryProduct.update($product_row.id).set($product_set).usingConnection(db).fetch();
						$product_row = _.size($product_row) && $product_row[0] || FactoryProduct.findOne($product_id);
					}

					return proceed(undefined, 'ok');
                } catch (err) {
                    return proceed(err);
                }
            });
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr('写入数据库失败');
        }

		let $del_sku_rows = await FactoryProductSku.find({
			where: {
				factoryProductNo: $product_row.id,
				stat: CONST.PRODUCT_SKU_STAT_DEL
			},
			select: ['id']
		});
		_.each($del_sku_rows, function($del_sku_row) {
			if($mes_del_ids.indexOf($del_sku_row.id) === -1) $mes_del_ids.push($del_sku_row.id);
			if($event_update_sku.indexOf($del_sku_row.id) === -1) $event_update_sku.push($del_sku_row.id);
		});

		try {
			if($mes_create_ids && _.size($mes_create_ids)) {
				await FactoryProduct.addSkuToMes($mes_create_ids, $product_row.id);
			}

			if($mes_update_ids && _.size($mes_update_ids)) {
				await FactoryProduct.updateSkuToMes($mes_update_ids, $product_row.id);
			}
			
			if($mes_del_ids && _.size($mes_del_ids)) {
				await FactoryProduct.delSkuToMes($mes_del_ids, $product_row.id);
			}
		} catch($e) {
			sails.log.error($e);
		}

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_sku in $event_add_sku) {
				let $sku_row = $event_add_sku[$_idx_sku];
				await mq.tranSend(sails.config.mqApi.product.routeSkuAdd, {id: $sku_row.id});
			}
			for(let $_idx_sku in $event_update_sku) {
				let $sku_row = $event_update_sku[$_idx_sku];
				await mq.tranSend(sails.config.mqApi.product.routeSkuUpdate, {id: $sku_row.id});
			}
			await mq.tranSend(sails.config.mqApi.product.routeSpuUpdate, {id: $product_row.id});
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok($id);
	},

	setProductSampleImg: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		var $product_id = cutil.getReq(req, 'product_no');
		if(!$product_id) return res.jsonerr('商品不存在');
		var $product_row = await FactoryProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.factoryCompId != req.me.compId) return res.jsonerr('商品不属于该企业');

		var $photo_sample = req.param('photo_sample');
		if(!_.isArray($photo_sample) || !_.size($photo_sample)) return res.jsonerr('请上传打样图片');

		await FactoryProduct.update($product_id).set({
			photoSample: JSON.stringify($photo_sample),
			isProof: $photo_sample && _.size($photo_sample) ? 1 : 0
		});

		return res.jsonok('ok');
	},

	getNproductByCatAttrNo: async function(req, res) {
		let $cat_no      = parseInt(cutil.getReq(req, 'cat_no')) || 0;
		let $attr_no     = cutil.getReq(req, 'attr_no');
		let $attr_val_no = cutil.getReq(req, 'attr_val_no');
		let $spu_attr_no     = cutil.getReq(req, 'spu_attr_no');
		let $spu_attr_val_no = cutil.getReq(req, 'spu_attr_val_no');

		if(
			!$cat_no && 
			!_.size($attr_no) && !_.size($attr_val_no) &&
			!_.size($spu_attr_no) && !_.size($spu_attr_val_no)
		) return res.jsonerr('所有参数为空'); 

		let $where = [];

		//spu factory and design
		if(_.size($spu_attr_no) || _.size($spu_attr_val_no)) {
			if(_.size($spu_attr_no)) $where.push("nameNo = '" + cutil.dbEscape($spu_attr_no) + "'");
			if(_.size($spu_attr_val_no)) $where.push("valueNo = '" + cutil.dbEscape($spu_attr_val_no) + "'");
			if(!_.size($where)) return res.jsonerr('cat_no和spu_attr_no和spu_attr_val_no不能同时为空'); 
			$where = $where.join(' and ');
	
			let $nProduct_factory = await sails.getDatastore().sendNativeQuery('select count(1) as cnt from factory_product_attr where ' + $where + ' group by factoryProductNo');
			$nProduct_factory = _.size($nProduct_factory) && _.size($nProduct_factory.rows) && _.size($nProduct_factory.rows[0]) && $nProduct_factory.rows[0].cnt || 0;

			let $nProduct = await sails.getDatastore().sendNativeQuery('select count(1) as cnt from design_product_attr where ' + $where + ' group by designProductNo');
			$nProduct = _.size($nProduct) && _.size($nProduct.rows) && _.size($nProduct.rows[0]) && $nProduct.rows[0].cnt || 0;

			$nProduct += $nProduct_factory;

			return res.jsonok({
				n_product   : $nProduct
			});
		}

		//factory sku
		if(_.size($attr_no) || _.size($attr_val_no)) {
			if(_.size($attr_no)) $where.push("nameNo = '" + cutil.dbEscape($attr_no) + "'");
			if(_.size($attr_val_no)) $where.push("valueNo = '" + cutil.dbEscape($attr_val_no) + "'");
			if(!_.size($where)) return res.jsonerr('cat_no和attr_no和attr_val_no不能同时为空'); 
			$where = $where.join(' and ');

			let $nProduct = await sails.getDatastore().sendNativeQuery('select count(1) as cnt from factory_product_sku_attr where ' + $where + ' group by factoryProductNo');
			$nProduct = _.size($nProduct) && _.size($nProduct.rows) && _.size($nProduct.rows[0]) && $nProduct.rows[0].cnt || 0;

			return res.jsonok({
				n_product   : $nProduct
			});
		}

		//cat factory and design
		if($cat_no) {
			let $nProduct_factory = await sails.getDatastore().sendNativeQuery('select count(1) as cnt from factory_product where catId=' + $cat_no + " and factoryParentProductNo='-'");
			$nProduct_factory = _.size($nProduct_factory) && _.size($nProduct_factory.rows) && _.size($nProduct_factory.rows[0]) && $nProduct_factory.rows[0].cnt || 0;

			let $nProduct = await sails.getDatastore().sendNativeQuery('select count(1) as cnt from design_product where catId=' + $cat_no + " and designParentProductNo='-'");
			$nProduct = _.size($nProduct) && _.size($nProduct.rows) && _.size($nProduct.rows[0]) && $nProduct.rows[0].cnt || 0;

			$nProduct += $nProduct_factory;

			return res.jsonok({
				n_product   : $nProduct
			});
		}

		return res.jsonerr('所有参数为空');
	},

	getNproductByColorNo: async function(req, res) {
		let $color_no     = cutil.getReq(req, 'color_no');
		if(!_.size($color_no)) return res.jsonerr('color_no为空');

		let $nProduct = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from factory_product_sku where colorNo='" + cutil.dbEscape($color_no) + "' group by factoryProductNo");
		$nProduct = _.size($nProduct) && _.size($nProduct.rows) && _.size($nProduct.rows[0]) && $nProduct.rows[0].cnt || 0;

		return res.jsonok({
			n_product : $nProduct
		});
	},

	getNproductByMaterialNo: async function(req, res) {
		let $material_no     = cutil.getReq(req, 'material_no');
		if(!_.size($material_no)) return res.jsonerr('material_no为空');

		let $nProduct = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from factory_product_sku where materialNo='" + cutil.dbEscape($material_no) + "' group by factoryProductNo");
		$nProduct = _.size($nProduct) && _.size($nProduct.rows) && _.size($nProduct.rows[0]) && $nProduct.rows[0].cnt || 0;

		return res.jsonok({
			n_product   : $nProduct
		});
	},

	getNproductByStyleNo: async function(req, res) {
		let $style_no     = cutil.getReq(req, 'style_no');
		if(!_.size($style_no)) return res.jsonerr('style_no为空');

		let $nProduct_factory = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from factory_product where styleNo='" + cutil.dbEscape($style_no) + "'");
		$nProduct_factory = _.size($nProduct_factory) && _.size($nProduct_factory.rows) && _.size($nProduct_factory.rows[0]) && $nProduct_factory.rows[0].cnt || 0;

		let $nProduct = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from design_product where styleNo='" + cutil.dbEscape($style_no) + "'");
		$nProduct = _.size($nProduct) && _.size($nProduct.rows) && _.size($nProduct.rows[0]) && $nProduct.rows[0].cnt || 0;

		$nProduct += $nProduct_factory;

		return res.jsonok({
			n_product   : $nProduct
		});
	},

	querySpuSku: async function(req, res) {
		let $spu_ids = [], $sku_ids = [];

		if(cutil.defined(req.param('spu_id'))) {
			$spu_ids = req.param('spu_id');
			$spu_ids = _.isArray($spu_ids) && $spu_ids || [];
		}

		if(cutil.defined(req.param('sku_id'))) {
			$sku_ids = req.param('sku_id');
			$sku_ids = _.isArray($sku_ids) && $sku_ids || [];
		}

		if(!_.size($spu_ids) && !_.size($sku_ids)) return res.jsonerr('spu_id和sku_id参数均为空');

		let $sku_rows = {};
		if(_.size($spu_ids)) {
			$sku_rows = await FactoryProductSku.find({
				factoryProductNo: $spu_ids
			});

			$sku_ids = _.size($sku_rows) ? cutil.getTabCol($sku_rows, 'id') : {};
			$sku_ids = _.values($sku_ids);
		} else if(_.size($sku_ids)) {
			$sku_rows = await FactoryProductSku.find({
				id: $sku_ids
			});

			$spu_ids = _.size($sku_rows) ? cutil.getTabCol($sku_rows, 'factoryProductNo') : {};
			$spu_ids = _.values($spu_ids);
		}

		let $spu_rows = await FactoryProduct.find({
			id: $spu_ids
		});
        let $uc_user_id_arr = cutil.getTabCol($spu_rows, 'designerUserId');
        let $factory_user_ids = cutil.getTabCol($spu_rows, 'factoryUserId');
		$uc_user_id_arr = _.assign($uc_user_id_arr, $factory_user_ids);
		$uc_user_id_arr = _.values($uc_user_id_arr);

		let $uc_comp_id_arrs = cutil.getTabCol($spu_rows, 'designerCompId');
		let $factory_comp_ids = cutil.getTabCol($spu_rows, 'factoryCompId');
		$uc_comp_id_arrs = _.assign($uc_comp_id_arrs, $factory_comp_ids);
		$uc_comp_id_arrs = _.values($uc_comp_id_arrs);

        let $uc_user_rows = {};
        if(_.size($uc_user_id_arr)) {
            $uc_user_rows = await User.getUsers($uc_user_id_arr, ['id', 'name', 'avatar', 'compId']);
			$uc_user_rows = cutil.indexTabByCol($uc_user_rows, 'id');
        }

        let $uc_comp_rows = {};
		if(_.size($uc_comp_id_arrs)) {
			$uc_comp_rows = await Comp.getComps($uc_comp_id_arrs, ['id', 'name', 'logo']);
			$uc_comp_rows = cutil.indexTabByCol($uc_comp_rows, 'id');
		}

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//let $set_ids = cutil.getTabCol($spu_rows, 'setNo');
		//let $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		let $style_ids = cutil.getTabCol($spu_rows, 'styleNo');
		let $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		let $sku_step_rows = await FactoryProductStepPrice.find({
			skuNo: $sku_ids
		});

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			where: {
				skuNo: $sku_ids
			},
			select: ['skuNo', 'nameNo', 'attrName', 'valueNo', 'attrValue']
		});
		let $tmp_sku_attr = {};
		_.each($sku_attr_rows, function($sku_attr_row) {
			if(!_.size($sku_attr_row.valueNo)) return true;

			if(!_.size($tmp_sku_attr[$sku_attr_row.skuNo])) $tmp_sku_attr[$sku_attr_row.skuNo] = [];
			$tmp_sku_attr[$sku_attr_row.skuNo].push({
				name_id  : $sku_attr_row.nameNo,
				name     : $sku_attr_row.attrName,
				value_id : $sku_attr_row.valueNo,
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

		let $tmp_step_rows = {};
		_.each($sku_step_rows, function($step_row) {
			$tmp_step_rows[$step_row.skuNo] = $tmp_step_rows[$step_row.skuNo] || [];
			$tmp_step_rows[$step_row.skuNo].push({
				start: $step_row.numberMin,
				end: $step_row.numberMax,
				price: $step_row.price
			});
		});
		$sku_step_rows = {};
		_.each($tmp_step_rows, function($tmp_row, $tmp_id) {
			$sku_step_rows[$tmp_id] = _.sortBy($tmp_row, ['start']);
		});

		$tmp_sku_rows = {};
		_.each($sku_rows, function($sku_row) {
			$tmp_sku_rows[$sku_row.factoryProductNo] = $tmp_sku_rows[$sku_row.factoryProductNo] || [];
			$tmp_sku_rows[$sku_row.factoryProductNo].push({
				id            : $sku_row.id,
				material      : {
					id   : $sku_row.materialNo,
					name : $mat_rows && $mat_rows[$sku_row.materialNo] && $mat_rows[$sku_row.materialNo].name || ''
				},
				color         : {
					id   : $sku_row.colorNo,
					name : $color_rows && $color_rows[$sku_row.colorNo] && $color_rows[$sku_row.colorNo].name || '',
				},
				code          : $sku_row.codeNo,
				module_no     : $sku_row.moduleNo || '',
				stat          : $sku_row.stat,
				attrs         : $sku_attr_rows[$sku_row.id] || [],
				prices        : $sku_step_rows[$sku_row.id] || []
			});
		});
		$sku_rows = $tmp_sku_rows;

		//let $ret_fds = ["id", "name", "setNo", "styleNo", "catId", "moduleNo", "photoRender", "video", "videoThumb", "photoSample", "price", "stat", "marketPublish", "marketPublishedAt", "marketBanAt", "salebookPublish", "salebookPublishedAt", "salebookBanAt", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "publishedAt", "priceType"];
		let $ret = [];
		_.each($spu_rows, function($row){
            //let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));
            let $ret_row = cutil.snakeCaseObject($row);

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }
			try{ $ret_row.photo_sample = $ret_row.photo_sample ? JSON.parse($ret_row.photo_sample) : []; } catch(e) { $ret_row.photo_sample = []; }
			try{ $ret_row.photo_cad = $ret_row.photo_cad ? JSON.parse($ret_row.photo_cad) : []; } catch(e) { $ret_row.photo_cad = []; }
			try{ $ret_row.photo_size = $ret_row.photo_size ? JSON.parse($ret_row.photo_size) : []; } catch(e) { $ret_row.photo_size = []; }
			try{ $ret_row.dimension = $row.dimension ? JSON.parse($row.dimension) : []; } catch(e) { $ret_row.dimension = []; }
			try{ $ret_row.photo_story = $ret_row.photo_story ? JSON.parse($ret_row.photo_story) : []; } catch(e) { $ret_row.photo_story = []; }
			try{ $ret_row.video        = $ret_row.video ? JSON.parse($ret_row.video) : []; } catch(e) { $ret_row.video = []; }

            $ret_row.designer = {
                id     : $row.designerUserId,
                name   : $uc_user_rows[$row.designerUserId] && $uc_user_rows[$row.designerUserId].name ? $uc_user_rows[$row.designerUserId].name : '',
                avatar : $uc_user_rows[$row.designerUserId] && $uc_user_rows[$row.designerUserId].avatar ? $uc_user_rows[$row.designerUserId].avatar : ''
            };
			delete $ret_row.designer_user_id;

			$ret_row.design_comp = {
				id   : $row.designerCompId,
				name : $uc_comp_rows && $uc_comp_rows[$row.designerCompId] ? $uc_comp_rows[$row.designerCompId].name : '',
				logo : $uc_comp_rows && $uc_comp_rows[$row.designerCompId] ? $uc_comp_rows[$row.designerCompId].logo : ''
			};
			delete $ret_row.designer_comp_id;

			$ret_row.factory_comp = {
				id   : $row.factoryCompId,
				name : $uc_comp_rows && $uc_comp_rows[$row.factoryCompId] ? $uc_comp_rows[$row.factoryCompId].name : '',
				logo : $uc_comp_rows && $uc_comp_rows[$row.factoryCompId] ? $uc_comp_rows[$row.factoryCompId].logo : ''
			};
			delete $ret_row.factory_comp_id;

			$ret_row.cat = {
				id   : $row.catId,
				name : $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : ''
			};
			delete $ret_row.cat_id;

			//$ret_row.set = {
			//	id   : $set_rows && $set_rows[$row.setNo] && $set_rows[$row.setNo].pid || '',
			//	name : $set_rows && $set_rows[$row.setNo] && $pset_rows && $pset_rows[$set_rows[$row.setNo].pid] ? $pset_rows[$set_rows[$row.setNo].pid].name : ''
			//};
			//$ret_row.set_id = $row.setNo;
			//delete $ret_row.set_no;

			$ret_row.style = {
				id   : $row.styleNo,
				name : $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : ''
			};
			delete $ret_row.style_no;

			$ret_row.sku = $sku_rows[$row.id] || [];

			delete $ret_row.price;
			delete $ret_row.published_at;

			$ret.push($ret_row);
		});

		return res.jsonok($ret);
	},

	querySkuSpu: async function(req, res) {
		let $spu_ids = [], $sku_ids = [];

		if(cutil.defined(req.param('spu_id'))) {
			$spu_ids = req.param('spu_id');
			$spu_ids = _.isArray($spu_ids) && $spu_ids || [];
		}

		if(cutil.defined(req.param('sku_id'))) {
			$sku_ids = req.param('sku_id');
			$sku_ids = _.isArray($sku_ids) && $sku_ids || [];
		}

		if(!_.size($spu_ids) && !_.size($sku_ids)) return res.jsonerr('spu_id和sku_id参数均为空');

		let $sku_rows = {};
		if(_.size($spu_ids)) {
			$sku_rows = await FactoryProductSku.find({
				factoryProductNo: $spu_ids
			});

			$sku_ids = _.size($sku_rows) ? cutil.getTabCol($sku_rows, 'id') : {};
			$sku_ids = _.values($sku_ids);
		} else if(_.size($sku_ids)) {
			$sku_rows = await FactoryProductSku.find({
				id: $sku_ids
			});

			$spu_ids = _.size($sku_rows) ? cutil.getTabCol($sku_rows, 'factoryProductNo') : {};
			$spu_ids = _.values($spu_ids);
		}

		let $where = {
			id: $spu_ids
		};
		let $market_publish = parseInt(cutil.getReq(req, 'market_publish')); //1上架，2下架
		if($market_publish) $where.marketPublish = $market_publish == CONST.PRODUCT_MARMET_STAT_PUBLISHED ? CONST.PRODUCT_MARMET_STAT_PUBLISHED : CONST.PRODUCT_MARMET_STAT_BAND;
		let $spu_rows = await FactoryProduct.find($where);
		let $tmp_sku_rows = [];
		_.each($sku_rows, function($sku_row) {
			if($spu_ids.indexOf($sku_row.factoryProductNo) === -1) return true;
			$tmp_sku_rows.push($sku_row);
		});
		$sku_rows = $tmp_sku_rows;

		let $uc_comp_id_arrs = cutil.getTabCol($spu_rows, 'designerCompId');
		let $factory_comp_ids = cutil.getTabCol($spu_rows, 'factoryCompId');
		$uc_comp_id_arrs = _.assign($uc_comp_id_arrs, $factory_comp_ids);
		$uc_comp_id_arrs = _.values($uc_comp_id_arrs);

        let $uc_comp_rows = {};
		if(_.size($uc_comp_id_arrs)) {
			$uc_comp_rows = await Comp.getComps($uc_comp_id_arrs, ['id', 'name', 'logo']);
			$uc_comp_rows = cutil.indexTabByCol($uc_comp_rows, 'id');
		}

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//let $set_ids = cutil.getTabCol($spu_rows, 'setNo');
		//let $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		let $style_ids = cutil.getTabCol($spu_rows, 'styleNo');
		let $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		let $sku_step_rows = await FactoryProductStepPrice.find({
			skuNo: $sku_ids
		});

		let $spu_attr_rows = await FactoryProductAttr.find({
			where: {
				factoryProductNo: $spu_ids,
			},
			select: ['factoryProductNo', 'nameNo', 'valueNo']
		});
		$spu_attr_rows = cutil.indexTabByCol($spu_attr_rows, 'factoryProductNo', 'nameNo');

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			where: {
				skuNo: $sku_ids
			},
			select: ['skuNo', 'nameNo', 'valueNo']
		});
		$sku_attr_rows = cutil.indexTabByCol($sku_attr_rows, 'skuNo', 'nameNo');

		let $spu_cat_ids_arr = cutil.getTabCol($spu_rows, 'catId');
		let $tg_dict_api = new TGDictApi(req);
		let $product_cat_rows = {};
		try {
			$product_cat_rows = await $tg_dict_api.getProductCat($spu_cat_ids_arr, true),

			_.each($product_cat_rows, function($product_cat_row) {
				_.each($product_cat_row.attrs, function($product_cat_attr_row) {
					$product_cat_attr_row.items = cutil.indexTabByCol($product_cat_attr_row.items, 'id');
				});
				$product_cat_row.attrs = cutil.indexTabByCol($product_cat_row.attrs, 'id');
			});
			$product_cat_rows = cutil.indexTabByCol($product_cat_rows, 'id');
		} catch($e) {
			return res.jsonerr($e.message || 'TgDictApi: error');
		}

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

		let $tmp_step_rows = {};
		_.each($sku_step_rows, function($step_row) {
			$tmp_step_rows[$step_row.skuNo] = $tmp_step_rows[$step_row.skuNo] || [];
			$tmp_step_rows[$step_row.skuNo].push({
				start : $step_row.numberMin,
				end   : $step_row.numberMax,
				price : $step_row.price
			});
		});
		$sku_step_rows = {};
		_.each($tmp_step_rows, function($tmp_row, $tmp_id) {
			$sku_step_rows[$tmp_id] = _.sortBy($tmp_row, ['start']);
		});

		let $ret_spu_rows = {};
		$spu_rows = cutil.indexTabByCol($spu_rows, 'id');
		_.each($spu_rows, function($row){
			let $ret_row = {
				id              : $row.id,
				name            : $row.name,
				moduleNo        : $row.moduleNo,
				priceType       : $row.priceType,
				factoryCompId   : $row.factoryCompId,
				factoryComp     : {
					id          : $row.factoryCompId,
					name        : $uc_comp_rows && $uc_comp_rows[$row.factoryCompId] ? $uc_comp_rows[$row.factoryCompId].name : '',
					logo        : $uc_comp_rows && $uc_comp_rows[$row.factoryCompId] ? $uc_comp_rows[$row.factoryCompId].logo : ''
				},
				marketPublish   : $row.marketPublish,
				salebookPublish : $row.salebookPublish,
				stat            : $row.stat
			};

			try{ $ret_row.photoRender = $row.photoRender ? JSON.parse($row.photoRender) : []; } catch(e) { $ret_row.photoRender = []; }
			try{ $ret_row.dimension = $row.dimension ? JSON.parse($row.dimension) : []; } catch(e) { $ret_row.dimension = []; }

			$ret_row.cat = {
				id   : $row.catId,
				name : _.size($product_cat_rows[$row.catId]) && $product_cat_rows[$row.catId].name || ''
			};

			//$ret_row.series = {
			//	id   : $set_rows && $set_rows[$row.setNo] && $set_rows[$row.setNo].pid || '',
			//	name : $set_rows && $set_rows[$row.setNo] && $pset_rows && $pset_rows[$set_rows[$row.setNo].pid] ? $pset_rows[$set_rows[$row.setNo].pid].name : ''
			//};
			//$ret_row.set_id = $row.setNo;

			$ret_row.style = {
				id   : $row.styleNo,
				name : $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : ''
			};

			$ret_row.attrs = [];
			if(_.size($spu_attr_rows[$row.id])) {
				_.each($spu_attr_rows[$row.id], function($spu_attr_row) {
					$ret_row.attrs.push({
						attr: {
							id: $spu_attr_row.nameNo,
							name: _.size($product_cat_rows[$row.catId]) && 
								_.size($product_cat_rows[$row.catId].attrs) && 
								_.size($product_cat_rows[$row.catId].attrs[$spu_attr_row.nameNo]) &&
								$product_cat_rows[$row.catId].attrs[$spu_attr_row.nameNo].name || 
								''
						},
						value: {
							id: $spu_attr_row.valueNo,
							value: _.size($product_cat_rows[$row.catId]) && 
								_.size($product_cat_rows[$row.catId].attrs) && 
								_.size($product_cat_rows[$row.catId].attrs[$spu_attr_row.nameNo]) &&
								_.size($product_cat_rows[$row.catId].attrs[$spu_attr_row.nameNo].items) &&
								_.size($product_cat_rows[$row.catId].attrs[$spu_attr_row.nameNo].items[$spu_attr_row.valueNo]) &&
								$product_cat_rows[$row.catId].attrs[$spu_attr_row.nameNo].items[$spu_attr_row.valueNo].value || 
								''
						}
					});
				});
			}

			$ret_spu_rows[$row.id] = $ret_row;
		});


		let $ret = [];
		_.each($sku_rows, function($sku_row) {
			let $ret_row = {
				id            : $sku_row.id,
				material      : {
					id        : $sku_row.materialNo,
					name      : $mat_rows && $mat_rows[$sku_row.materialNo] && $mat_rows[$sku_row.materialNo].name || ''
				},
				color         : {
					id        : $sku_row.colorNo,
					name      : $color_rows && $color_rows[$sku_row.colorNo] && $color_rows[$sku_row.colorNo].name || '',
				},
				code          : $sku_row.codeNo,
				catAttrValues : [],
				prices        : $sku_step_rows[$sku_row.id] || [],
				item          : _.size($ret_spu_rows) && _.size($ret_spu_rows[$sku_row.factoryProductNo]) ? $ret_spu_rows[$sku_row.factoryProductNo] : {}
			};
			let $spu_cat_id = _.size($spu_rows[$sku_row.factoryProductNo]) && $spu_rows[$sku_row.factoryProductNo].catId || 0;
			_.each($sku_attr_rows[$sku_row.id], function($sku_attr_row) {
				$ret_row.catAttrValues.push({
					attr: {
						id: $sku_attr_row.nameNo,
						name: _.size($product_cat_rows[$spu_cat_id]) && 
							_.size($product_cat_rows[$spu_cat_id].attrs) && 
							_.size($product_cat_rows[$spu_cat_id].attrs[$sku_attr_row.nameNo]) &&
							$product_cat_rows[$spu_cat_id].attrs[$sku_attr_row.nameNo].name || 
							''
					},
					value: {
						id: $sku_attr_row.valueNo,
						value: _.size($product_cat_rows[$spu_cat_id]) && 
							_.size($product_cat_rows[$spu_cat_id].attrs) && 
							_.size($product_cat_rows[$spu_cat_id].attrs[$sku_attr_row.nameNo]) &&
							_.size($product_cat_rows[$spu_cat_id].attrs[$sku_attr_row.nameNo].items) &&
							_.size($product_cat_rows[$spu_cat_id].attrs[$sku_attr_row.nameNo].items[$sku_attr_row.valueNo]) &&
							$product_cat_rows[$spu_cat_id].attrs[$sku_attr_row.nameNo].items[$sku_attr_row.valueNo].value || 
							''
					}
				});
			});
			$ret.push($ret_row);
		});

		return res.jsonok($ret);
	},
};

