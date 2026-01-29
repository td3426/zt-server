
const moment = require('moment');
const flaverr = require('flaverr');

/*
async function checkPaidPriceProduct($trans_row) {
	let $product_row = await DesignProduct.findOne($trans_row.productNo);
	if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');

	let $acc_product_rows = await DesignProduct.find({
		designParentProductNo: $product_row.id
	});

	//let $design_product_set = $product_row.setNo && $product_row.setNo.length > 0 && await ProductSet.findOne($product_row.setNo) || null;

	let $event_add_spu = [];
	let $mes_spu = [];
	try{
		await sails.getDatastore('factory').transaction(async (db, proceed) => {
			try {
				let productNo;
				try{
					productNo = await FactoryProduct.genUUID(db);
				} catch($e) {
					throw new Error('生成商品UUID失败');
				}

				let productSN;
				try{
					productSN = await FactoryProduct.genSN($trans_row.buyByCompId, db);
				} catch($e) {
					throw new Error('生成商品编码失败');
				}

				//let $set_no = '';
				//if($design_product_set && _.size($design_product_set)) {
				//	let $factory_product_set = await ProductSet.find({
				//		createdByCompId : $trans_row.buyByCompId,
				//		name            : $design_product_set.name
				//	}).usingConnection(db);
				//	if($factory_product_set && _.size($factory_product_set)) {
				//		$set_no = $factory_product_set[0].id;
				//	} else {
				//		$set_no = await ProductSet.genUUID();
				//		$factory_product_set = await ProductSet.create({
				//			id              : $set_no,
				//			name            : $design_product_set.name,
				//			priceType       : $design_product_set.priceType,
				//			photos          : $design_product_set.photos,
				//			createdBy       : $trans_row.buyBy,
				//			createdByCompId : $trans_row.buyByCompId
				//		}).usingConnection(db);
				//	}
				//}

				let $factory_product_row = await FactoryProduct.create({
					id                     : productNo,
					designProductNo        : $product_row.id,
					factoryParentProductNo : '-',
					designParentProductNo  : $product_row.designParentProductNo,
					factoryProductSN       : productSN,
					name                   : $product_row.name,
					sname                  : $product_row.sname || $product_row.name,
					priceType              : $product_row.priceType,
					//setNo                  : $set_no,
					styleNo                : $product_row.styleNo,
					catId                  : $product_row.catId,
					designIdea             : $product_row.designIdea,
					photoRender            : $product_row.photoRender,
					photoCad               : $product_row.photoCad,
					intro                  : $product_row.intro,
					dimension              : $product_row.dimension,
					photoSize              : $product_row.photoSize,
					photoStory             : $product_row.photoStory,
					price                  : $product_row.price,
					pricePercent           : $product_row.pricePercent,
					transactionNo          : $trans_row.id,
					contractNo             : $trans_row.contractNo,
					stat                   : CONST.PRODUCT_STAT_BANED,
					marketPublish          : CONST.PRODUCT_MARMET_STAT_BAND,
					salebookPublish        : CONST.PRODUCT_MARMET_STAT_BAND,
					designerUserId         : $product_row.createdBy,
					designerCompId         : $product_row.createdByCompId,
					factoryUserId          : $trans_row.buyBy,
					factoryCompId          : $trans_row.buyByCompId
				}).fetch().usingConnection(db);
				$event_add_spu.push($factory_product_row);
				$mes_spu.push($factory_product_row.id);

				let $design_spu_attr_rows = await DesignProductAttr.find({
					designCompId    : $product_row.createdByCompId,
					designProductNo : $product_row.id
				});
				let $factory_spu_attr_set = [];
				_.each($design_spu_attr_rows, function($attr_row) {
					$factory_spu_attr_set.push({
						factoryCompId    : $trans_row.buyByCompId,
						factoryProductNo : productNo,
						nameNo           : $attr_row.nameNo,
						valueNo          : $attr_row.valueNo
					});
				});
				if(_.size($factory_spu_attr_set)) await FactoryProductAttr.createEach($factory_spu_attr_set);

				if($acc_product_rows && _.size($acc_product_rows)) {
					let $acc_sets = [];
					for(let $acc_product_row_idx in $acc_product_rows) {
						let $acc_product_row = $acc_product_rows[$acc_product_row_idx];
						let acc_set_row = {
							designProductNo        : $acc_product_row.id,
							factoryParentProductNo : $factory_product_row.id,
							designParentProductNo  : $acc_product_row.designParentProductNo,
							name                   : $acc_product_row.name,
							sname: $acc_product_row.sname || $acc_product_row.name,
							priceType              : $acc_product_row.priceType,
							//setNo                  : $set_no,
							styleNo                : $acc_product_row.styleNo,
							catId                  : $acc_product_row.catId,
							designIdea             : $acc_product_row.designIdea,
							photoRender            : $acc_product_row.photoRender,
							photoCad               : $acc_product_row.photoCad,
							intro                  : $acc_product_row.intro,
							dimension              : $acc_product_row.dimension,
							photoSize              : $acc_product_row.photoSize,
							photoStory             : $acc_product_row.photoStory,
							price                  : $acc_product_row.price,
							pricePercent           : $acc_product_row.pricePercent,
							transactionNo          : $trans_row.id,
							contractNo             : $trans_row.contractNo,
							stat                   : CONST.PRODUCT_STAT_BANED,
							marketPublish          : CONST.PRODUCT_MARMET_STAT_BAND,
							salebookPublish        : CONST.PRODUCT_MARMET_STAT_BAND,
							designerUserId         : $acc_product_row.createdBy,
							designerCompId         : $acc_product_row.createdByCompId,
							factoryUserId          : $trans_row.buyBy,
							factoryCompId          : $trans_row.buyByCompId
						};

						try{
							acc_set_row.id = await FactoryProduct.genUUID(db);
						} catch($e) {
							throw new Error('生成商品UUID失败');
						}
						$mes_spu.push(acc_set_row.id);

						try{
							acc_set_row.factoryProductSN = await FactoryProduct.genSN($trans_row.buyByCompId, db);
						} catch($e) {
							throw new Error('生成商品编码失败');
						}

						$acc_sets.push(acc_set_row);
					}

					if(_.size($acc_sets)) {
						let $acc_rows = await FactoryProduct.createEach($acc_sets).fetch().usingConnection(db);
						$event_add_spu = $event_add_spu.concat($acc_rows);
					}
				}

				return proceed(undefined, 'ok');
			} catch (err) {
				return proceed(flaverr('E_USER_ERROR', new Error(err)));
			}
		});
	} catch ($e) {
		sails.log.error($e);
		throw $e;
	}

	try {
		if($mes_spu && _.size($mes_spu)) {
			for(let $mes_idx in $mes_spu) {
				let $mes_id = $mes_spu[$mes_idx];
				await FactoryProduct.addSpuToMes($mes_id);
			}
		}
	} catch($e) {
		sails.log.error($e);
		throw $e;
	}

	try {
		const mq = new MqApi(req);
		await mq.startTrans(sails.config.mqApi.product.exchange);
		for(let $_idx_spu in $event_add_spu) {
			let $spu_row = $event_add_spu[$_idx_spu];
			await mq.tranSend(sails.config.mqApi.product.routeSpuAdd, {id: $spu_row.id});
		}
		await mq.endTrans();
	} catch($e) {
		sails.log.error($e);
		throw $e;
	}
}
*/


module.exports = {
	/*
	listPriceProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        var $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        var $page = parseInt(cutil.getReq(req, 'page')) || 1;
        var $start = ($page - 1) * $pagesize;

		var $where = {
			priceType: CONST.PRODUCT_PRICE_TYPE_PRICE,
			designParentProductNo: '-',
			stat: CONST.PRODUCT_STAT_PUBLISHED
		};

		var $ret_fds = ["id", "name", "sname", "styleNo", "catId", "photoRender", "price", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt"];
		var $n_product_rows = await DesignProduct.count($where);
		var $product_rows = await DesignProduct.find({
			where: $where,
			select: $ret_fds,
            skip: $start,
            limit: $pagesize,
            sort: 'createdAt desc'
		});

		var $product_ids = cutil.getTabCol($product_rows, 'id');

        let $designer_ids = cutil.getTabCol($product_rows, 'createdBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'createdByCompId');
        let $design_comp_rows = await Comp.getComps(_.values($design_comp_ids), ['id', 'name', 'logo']);
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

        var $transaction_rows = await Transaction.getValidTransactionsByProductNos(_.values(cutil.getTabCol($product_rows, 'id')), ['productNo', 'stat', 'buyByCompId']);
		var $comp_rows = await Comp.find({
			id: _.values(cutil.getTabCol($transaction_rows, 'buyByCompId'))
		});
		$comp_rows = cutil.indexTabByCol($comp_rows, 'id');
		$transaction_rows = cutil.indexTabByCol($transaction_rows, 'productNo');

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		var $set_ids = cutil.getTabCol($product_rows, 'setNo');
		var $set_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$set_rows = cutil.indexTabByCol($set_rows, 'id');
		$set_ids = cutil.getTabCol($set_rows, 'pid');
		$pset_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$pset_rows = cutil.indexTabByCol($pset_rows, 'id');

		var $style_ids = cutil.getTabCol($product_rows, 'styleNo');
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		var $ret = [];
		var $tm = moment().valueOf();
		_.each($product_rows, function($row){
            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }

            $ret_row.designer = {
                id: $row.createdBy,
                name: $designer_rows[$row.createdBy] && $designer_rows[$row.createdBy].name ? $designer_rows[$row.createdBy].name : '',
                avatar: $designer_rows[$row.createdBy] && $designer_rows[$row.createdBy].avatar ? $designer_rows[$row.createdBy].avatar : ''
            };
			delete $ret_row.created_by;

			$ret_row.design_comp = {
				id: $row.createdByCompId,
				name: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].name : '',
				logo: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].logo : ''
			};
			delete $ret_row.created_by_comp_id;

			$ret_row.cat = {
				id: $row.catId,
				name: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : ''
			};
			delete $ret_row.cat_id;

			$ret_row.set = {
				id   : $set_rows && $set_rows[$row.setNo] && $set_rows[$row.setNo].pid || '',
				name : $set_rows && $set_rows[$row.setNo] && $pset_rows && $pset_rows[$set_rows[$row.setNo].pid] ? $pset_rows[$set_rows[$row.setNo].pid].name : ''
			};
			$ret_row.set_id = $row.setNo;
			delete $ret_row.set_no;

			$ret_row.style = {
				id: $row.styleNo,
				name: $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : ''
			};
			delete $ret_row.style_no;

			$ret_row.factory = {};
			if($transaction_rows && $transaction_rows[$row.id]) {
				$ret_row.factory = {
					stat: $transaction_rows[$row.id].stat,
					id: $transaction_rows[$row.id].buyByCompId,
					name: $comp_rows && $comp_rows[$transaction_rows[$row.id].buyByCompId] ? $comp_rows[$transaction_rows[$row.id].buyByCompId].name : '',
					logo: $comp_rows && $comp_rows[$transaction_rows[$row.id].buyByCompId] ? $comp_rows[$transaction_rows[$row.id].buyByCompId].logo : ''
				};
			}

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_product_rows});
	},

	detailPriceProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        var $product_id = cutil.getReq(req, 'product_no');

		var $ret_fds = ["id", "name", "sname", "setNo", "styleNo", "catId", "designIdea", "photoRender", "photoCad", "dimension", "intro", "photoSize", "photoStory", "price", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt", "designParentProductNo", "contractTplId"];
		var $product_rows = await DesignProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ designParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});
		if(!$product_rows || !_.size($product_rows)) return res.jsonerr('商品不存在');

		$product_rows = cutil.indexTabByCol($product_rows, 'designParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		var $product_row = $product_rows['-'][$product_id];

        let $designer_row = await User.getUsers([$product_row.createdBy], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.createdBy] || null;

		var $transaction_row = await Transaction.findOne({
			where: {
				productNo: $product_id,
				buyByCompId: $comp_row.id
			},
			select: ['productNo', 'stat', 'buyByCompId', 'contractNo', 'orderNo']
		});

		var $ok_transaction_row = await Transaction.find({
			where: {
				productNo: $product_id,
				stat: {
					'>=': CONST.TRANSACTION_STAT_SIGNED_BUY,
					'<=': CONST.TRANSACTION_STAT_COMPLETE
				}
			},
			select: ['buyByCompId']
		});
		$ok_transaction_row = _.size($ok_transaction_row) && _.size($ok_transaction_row[0]) ? $ok_transaction_row[0] : null;


		var $comp_ids = [];
		$comp_ids.push($product_row.createdByCompId);

		var $comp_rows;
		if($comp_ids) {
			$comp_rows = await Comp.find($comp_ids);
			if($comp_rows) $comp_rows = cutil.indexTabByCol($comp_rows, 'id');
		}

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		var $set_ids = [$product_row.setNo];
		var $set_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$set_rows = cutil.indexTabByCol($set_rows, 'id');
		$set_ids = cutil.getTabCol($set_rows, 'pid');
		$pset_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$pset_rows = cutil.indexTabByCol($pset_rows, 'id');

		var $style_ids = [$product_row.styleNo];
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		var $tm = moment().valueOf();
		var $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

		try{ $ret.photo_render = $ret.photo_render ? JSON.parse($ret.photo_render) : []; } catch(e) { $ret.photo_render = []; }
		try{ $ret.photo_cad = $ret.photo_cad ? JSON.parse($ret.photo_cad) : []; } catch(e) { $ret.photo_cad = []; }
		try{ $ret.dimension = $ret.dimension ? JSON.parse($ret.dimension) : []; } catch(e) { $ret.dimension = []; }
		try{ $ret.photo_size = $ret.photo_size ? JSON.parse($ret.photo_size) : []; } catch(e) { $ret.photo_size = []; }
		try{ $ret.photo_story = $ret.photo_story ? JSON.parse($ret.photo_story) : []; } catch(e) { $ret.photo_story = []; }

		delete $ret.design_parent_product_no;

		$ret.designer = {
			id: $product_row.createdBy,
			name: $designer_row && $designer_row.name ? $designer_row.name : '',
			avatar: $designer_row && $designer_row.avatar ? $designer_row.avatar : ''
		};
		delete $ret.created_by;

		var $design_comp_rows = $comp_rows;
		$ret.design_comp = {
			id: $product_row.createdByCompId,
			name: $design_comp_rows && $design_comp_rows[$product_row.createdByCompId] ? $design_comp_rows[$product_row.createdByCompId].name : '',
			logo: $design_comp_rows && $design_comp_rows[$product_row.createdByCompId] ? $design_comp_rows[$product_row.createdByCompId].logo : ''
		};
		delete $ret.created_by_comp_id;

		$ret.cat = {
			id: $product_row.catId,
			name: $cat_rows && $cat_rows[$product_row.catId] ? $cat_rows[$product_row.catId].name : ''
		};
		delete $ret.cat_id;

		$ret.set = {
			id   : $set_rows && $set_rows[$product_row.setNo] && $set_rows[$product_row.setNo].pid || '',
			name : $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : ''
		};
		$ret.set_id = $product_row.setNo;
		delete $ret.set_no;

		$ret.style = {
			id: $product_row.styleNo,
			name: $style_rows && $style_rows[$product_row.styleNo] ? $style_rows[$product_row.styleNo].name : ''
		};
		delete $ret.style_no;

		$ret.contract_no = "";
		$ret.trans_stat  = 0;
		if(_.size($transaction_row)) {
			$ret.contract_no = $transaction_row.contractNo;
			$ret.trans_stat  = $transaction_row.stat;

			try {
				if($transaction_row.orderNo && $transaction_row.orderNo.length) {
					let $trans_api = new TransApi(req);
					$ret.tradeOrder = await $trans_api.getOrder($transaction_row.orderNo);
				}
			} catch($e) {
				return res.jsonerr($e.message || 'TransApi: error');
			}
		}

		//被其他人已经购买成功了
		if(
			_.size($ok_transaction_row) && 
			$ok_transaction_row.buyByCompId != req.me.compId
		) {
			$ret.trans_stat = CONST.PRICE_PRODUCT_TRANSACTION_STAT_OTHER_SIGNED_OK;
			$ret.contract_no = "";
		}

		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			var $acc_row = {};

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.intro = $row.intro;
			$acc_row.dimension = $row.dimension;
			$acc_row.photo_size = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;

			try{ $acc_row.dimension = $acc_row.dimension ? JSON.parse($acc_row.dimension) : []; } catch(e) { $acc_row.dimension = []; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }


			$ret.accessory.push($acc_row);
		});

		let $design_spu_attr_rows = await DesignProductAttr.find({
			designCompId    : $product_row.createdByCompId,
			designProductNo : $product_row.id
		});
		$design_spu_attr_rows = cutil.indexTabByCol($design_spu_attr_rows, 'nameNo', 'valueNo');

		$ret.attr = [];
		_.each($design_spu_attr_rows, function($attr_rows, $attr_name_no) {
			let $attr = {};
			$attr.name = $attr_name_no;
			$attr.values = _.keys($attr_rows);
			$ret.attr.push($attr);
		});


		return res.jsonok($ret);
	},

	detailPriceProductBase: async function(req, res) {
        let $product_id = cutil.getReq(req, 'product_no');

		let $ret_fds = ["id", "name", "sname", "setNo", "styleNo", "catId", "designIdea", "photoRender", "photoCad", "dimension", "intro", "photoSize", "photoStory", "price", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt", "designParentProductNo", "contractTplId"];
		let $product_rows = await DesignProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ designParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});
		if(!$product_rows || !_.size($product_rows)) return res.jsonerr('商品不存在');

		$product_rows = cutil.indexTabByCol($product_rows, 'designParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		let $product_row = $product_rows['-'][$product_id];

        let $designer_row = await User.getUsers([$product_row.createdBy], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.createdBy] || null;

		let $comp_ids = [];
		$comp_ids.push($product_row.createdByCompId);

		let $comp_rows;
		if(_.size($comp_ids)) {
			$comp_rows = await Comp.find($comp_ids);
			if($comp_rows) $comp_rows = cutil.indexTabByCol($comp_rows, 'id');
		}

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		let $set_ids = [$product_row.setNo];
		let $set_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$set_rows = cutil.indexTabByCol($set_rows, 'id');
		$set_ids = cutil.getTabCol($set_rows, 'pid');
		$pset_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$pset_rows = cutil.indexTabByCol($pset_rows, 'id');

		let $style_ids = [$product_row.styleNo];
		let $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		let $tm = moment().valueOf();
		let $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

		try{ $ret.photo_render = $ret.photo_render ? JSON.parse($ret.photo_render) : []; } catch(e) { $ret.photo_render = []; }
		try{ $ret.photo_cad = $ret.photo_cad ? JSON.parse($ret.photo_cad) : []; } catch(e) { $ret.photo_cad = []; }
		try{ $ret.dimension = $ret.dimension ? JSON.parse($ret.dimension) : []; } catch(e) { $ret.dimension = []; }
		try{ $ret.photo_size = $ret.photo_size ? JSON.parse($ret.photo_size) : []; } catch(e) { $ret.photo_size = []; }
		try{ $ret.photo_story = $ret.photo_story ? JSON.parse($ret.photo_story) : []; } catch(e) { $ret.photo_story = []; }

		delete $ret.design_parent_product_no;

		$ret.designer = {
			id: $product_row.createdBy,
			name: $designer_row && $designer_row.name ? $designer_row.name : '',
			avatar: $designer_row && $designer_row.avatar ? $designer_row.avatar : ''
		};
		delete $ret.created_by;

		let $design_comp_rows = $comp_rows;
		$ret.design_comp = {
			id: $product_row.createdByCompId,
			name: $design_comp_rows && $design_comp_rows[$product_row.createdByCompId] ? $design_comp_rows[$product_row.createdByCompId].name : '',
			logo: $design_comp_rows && $design_comp_rows[$product_row.createdByCompId] ? $design_comp_rows[$product_row.createdByCompId].logo : ''
		};
		delete $ret.created_by_comp_id;

		$ret.cat = {
			id: $product_row.catId,
			name: $cat_rows && $cat_rows[$product_row.catId] ? $cat_rows[$product_row.catId].name : ''
		};
		delete $ret.cat_id;

		$ret.set = {
			id   : $set_rows && $set_rows[$product_row.setNo] && $set_rows[$product_row.setNo].pid || '',
			name : $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : ''
		};
		$ret.set_id = $product_row.setNo;
		delete $ret.set_no;

		$ret.style = {
			id: $product_row.styleNo,
			name: $style_rows && $style_rows[$product_row.styleNo] ? $style_rows[$product_row.styleNo].name : ''
		};
		delete $ret.style_no;

		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			let $acc_row = {};

			$acc_row.id          = $row.id;
			$acc_row.name        = $row.name;
			$acc_row.intro       = $row.intro;
			$acc_row.dimension   = $row.dimension;
			$acc_row.photo_size  = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;

			try{ $acc_row.dimension = $acc_row.dimension ? JSON.parse($acc_row.dimension) : []; } catch(e) { $acc_row.dimension = []; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }


			$ret.accessory.push($acc_row);
		});

		let $design_spu_attr_rows = await DesignProductAttr.find({
			designCompId    : $product_row.createdByCompId,
			designProductNo : $product_row.id
		});
		$design_spu_attr_rows = cutil.indexTabByCol($design_spu_attr_rows, 'nameNo', 'valueNo');

		$ret.attr = [];
		_.each($design_spu_attr_rows, function($attr_rows, $attr_name_no) {
			let $attr              = {};
			$attr.name             = $attr_name_no;
			$attr.values           = _.keys($attr_rows);
			$ret.attr.push($attr);
		});

		return res.jsonok($ret);
	},


    buyPriceProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');
        if(!cutil.ucan(req.me.privs, CONST.PRIV_CONTRACT_SIGN)) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        let $product_id = cutil.getReq(req, 'product_no');
        if(!$product_id) return res.jsonerr('商品不存在');

        let $product_row = await DesignProduct.findOne({
            id: $product_id
        });
        if(!$product_row) return res.jsonerr('商品不存在');
		if(req.me.compId == $product_row.createdByCompId) return res.jsonerr('不能自己买自己家的东西');
		if($product_row.stat != CONST.PRODUCT_STAT_PUBLISHED) return res.jsonerr('商品未上架');

        let $sell_comp_row = await Comp.findOne({
            id: $product_row.createdByCompId
        });
        if(!$sell_comp_row || $sell_comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('卖方企业未认证');

        if(await Transaction.count({
			productNo: $product_id,
			stat: CONST.TRANSACTION_STAT_SIGNED_BUY
		})) return res.jsonerr('哎呀，您看中的作品已被别人抢先一步预定了。去看看别的作品吧');

		//自己可以多次发起商品购买，因此会产生多个订单记录
		//不要加单个订单的限制，否则当设计师修改了商品价格的时候，就不能发起购买了


		//let $ht_api = new HtApi();
		//let $tpl_row = {};
		//try {
		//	$tpl_row = await $ht_api.getTpl($product_row.contractTplId);
		//	if(!$tpl_row || !_.size($tpl_row)) return res.jsonerr('未找到商品合同模板');
		//} catch($e) {
		//	return res.jsonerr('HtApi: ' + ($e.message || '错误'));
		//}

		let $photo_render = [];
		if(typeof $product_row.photoRender == 'string') {
			try{
				$product_row.photoRender = JSON.parse($product_row.photoRender);
				_.each($product_row.photoRender, function($photo_render_img_path) {
					$photo_render.push(sails.config.fileApi.productImgUrl + $photo_render_img_path);
				});
			} catch(e) {
				$product_row.photoRender = [];
			}
		}


		//let $ht_params = {
		//	token: req.me.token,
		//	tpl_no: $product_row.contractTplId,
		//	side_a_id: $sell_comp_row.id,
		//	side_b_id: $comp_row.id,
		//	params: [
		//		{
		//			name: 'product_name', //商品名称
		//			value: $product_row.name
		//		},
		//		{
		//			name: 'product_price', //商品价格
		//			value: $product_row.price
		//		},
		//		{
		//			name: 'product_images', //商品图片
		//			value: $photo_render
		//		}
		//	],
		//	extra: {}
		//};

		//let $contract_no = '';
		//try {
		//	let $contract_row = await $ht_api.addTplHt($ht_params);
		//	if(!_.size($contract_row)) return res.jsonerr('创建合同失败(1)');
		//	$contract_no = $contract_row.contract_no;
		//	if(!$contract_no.length) return res.jsonerr('创建合同失败(2)');
		//} catch($e) {
		//	sails.log.error($e);
		//	return res.jsonerr($e.message || '创建合同失败(3)');
		//}

		let $transaction_row;
		try {
			$transaction_row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					let transaction_no = await Transaction.genUUID(db);
					let $order_params = {
						callbackUrl     : '', //sails.config.custom.baseUrl + sails.getUrlFor(sails.config.transApi.notifyUrl),
						bizOrderId      : transaction_no,
						bizType         : 'bq_order',
						ar              : $product_row.price,
						buyerId         : $comp_row.id,
						sellerId        : $sell_comp_row.id,
						contractTplNo   : $product_row.contractTplId,
						contractPartIds : [$comp_row.id, $sell_comp_row.id],
						contractArgs    : [
							{
								name: 'product_name', //商品名称
								value: $product_row.name
							},
							{
								name: 'product_price', //商品价格
								value: $product_row.price
							},
							{
								name: 'product_images', //商品图片
								value: $photo_render
							}
						]
					};

					await Transaction.destroy({
						productNo: $product_row.id,
						buyByCompId: $comp_row.id
					});

					let $trans_order_info;
					try {
						let $trans_api = new TransApi(req);
						$trans_order_info = await $trans_api.createOrder($order_params);
					} catch($e) {
						throw flaverr('E_USER_ERROR', new Error($e.message || 'TransApi: error'));
					}

					let $transaction_row = await Transaction.create({
						id              : transaction_no,
						productNo       : $product_row.id,
						contractNo      : $trans_order_info.contract_no,
						orderNo         : $trans_order_info.id,
						amount          : $product_row.price,
						saleBy          : $product_row.createdBy,
						saleByCompId    : $product_row.createdByCompId,
						buyBy           : req.me.id,
						buyByCompId     : $comp_row.id,
						productInfo     : JSON.stringify($product_row),
						transactionInfo : ''
					}).fetch().usingConnection(db);

					return proceed(undefined, $transaction_row);
				} catch ($e) {
					sails.log.error($e);
					let $msg = '数据写入失败';
					if($e.code == 'E_USER_ERROR') $msg = $e.message || $e.toString();
					return proceed(flaverr('E_USER_ERROR', new Error($msg)));
				}
			});
		} catch($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message || $e.toString());
			return res.jsonerr($e.message);
		}

        return res.jsonok({
			transaction_no : $transaction_row.id,
			order_no       : $transaction_row.orderNo,
			contract_no    : $transaction_row.contractNo
		});
    },
	*/

	listPercentProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        var $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        var $page = parseInt(cutil.getReq(req, 'page')) || 1;
        var $start = ($page - 1) * $pagesize;

		var $where = {
			priceType: CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE,
			designParentProductNo: '-',
			stat: CONST.PRODUCT_STAT_PUBLISHED
		};

		var $ret_fds = ["id", "name", "sname", "setNo", "styleNo", "catId", "photoRender", "pricePercent", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt"];
		var $n_product_rows = await DesignProduct.count($where);
		var $product_rows = await DesignProduct.find({
			where: $where,
			select: $ret_fds,
            skip: $start,
            limit: $pagesize,
            sort: 'createdAt desc'
		});

		var $product_ids = cutil.getTabCol($product_rows, 'id');

        let $designer_ids = cutil.getTabCol($product_rows, 'createdBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'createdByCompId');
        let $design_comp_rows = await Comp.getComps(_.values($design_comp_ids), ['id', 'name', 'logo']);
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		var $factory_product_rows = await FactoryProduct.find({
			where: {
				designProductNo: _.values($product_ids)
			},
			select: ['id', 'factoryCompId', 'expireAt', 'designProductNo', 'stat']
		});
		var $factory_ids = cutil.getTabCol($factory_product_rows, 'factoryCompId');
		var $factory_product_ids = cutil.getTabCol($factory_product_rows, 'id');
		$factory_product_rows = cutil.indexTabByCol($factory_product_rows, 'designProductNo', 'id');

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		var $set_ids = cutil.getTabCol($product_rows, 'setNo');
		var $set_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$set_rows = cutil.indexTabByCol($set_rows, 'id');
		$set_ids = cutil.getTabCol($set_rows, 'pid');
		$pset_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = cutil.getTabCol($product_rows, 'styleNo');
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		var $ret = [];
		var $tm = moment().valueOf();
		_.each($product_rows, function($row){
            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }

            $ret_row.designer = {
                id: $row.createdBy,
                name: $designer_rows[$row.createdBy] && $designer_rows[$row.createdBy].name ? $designer_rows[$row.createdBy].name : '',
                avatar: $designer_rows[$row.createdBy] && $designer_rows[$row.createdBy].avatar ? $designer_rows[$row.createdBy].avatar : ''
            };
			delete $ret_row.created_by;

			$ret_row.design_comp = {
				id: $row.createdByCompId,
				name: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].name : '',
				logo: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].logo : ''
			};
			delete $ret_row.created_by_comp_id;

			$ret_row.cat = {
				id: $row.catId,
				name: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : ''
			};
			delete $ret_row.cat_id;

			$ret_row.set = {
				id   : $set_rows && $set_rows[$row.setNo] && $set_rows[$row.setNo].pid || '',
				name : $set_rows && $set_rows[$row.setNo] && $pset_rows && $pset_rows[$set_rows[$row.setNo].pid] ? $pset_rows[$set_rows[$row.setNo].pid].name : ''
			};
			$ret_row.set_id = $row.setNo;
			delete $ret_row.set_no;

			$ret_row.style = {
				id: $row.styleNo,
				name: $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : ''
			};
			delete $ret_row.style_no;

			$ret_row.factory_count = 0;
			_.each($factory_product_rows[$row.id], function($factory_product_row) {
				let $factory_row = {};

				if($tm - $factory_product_row.expireAt >= 0) {
					//end
				} else if($factory_product_row.stat == CONST.PRODUCT_STAT_EXPIRED || $factory_product_row.stat == CONST.PRODUCT_STAT_END) {
					//end
				} else if($factory_product_row.stat == CONST.PRODUCT_STAT_INUSE) {
					$ret_row.factory_count += 1;
				} else {
					//不会到这里来
				}
			});

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_product_rows});
	},

	detailPercentProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        var $product_id = cutil.getReq(req, 'product_no');

		var $ret_fds = ["id", "name", "sname", "setNo", "styleNo", "catId", "designIdea", "photoRender", "photoCad", "dimension", "intro", "photoSize", "photoStory", "pricePercent", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt", "designParentProductNo"];
		var $product_rows = await DesignProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ designParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});

		var $product_ids = cutil.getTabCol($product_rows, 'id');

		$product_rows = cutil.indexTabByCol($product_rows, 'designParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		var $product_row = $product_rows['-'][$product_id];

        let $designer_row = await User.getUsers([$product_row.createdBy], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.createdBy] || null;

		var $factory_product_rows = await FactoryProduct.find({
			where: {
				designProductNo: _.values($product_ids),
			},
			select: ['id', 'factoryCompId', 'expireAt', 'designProductNo', 'stat']
		});
		var $factory_ids = cutil.getTabCol($factory_product_rows, 'factoryCompId');
		var $factory_product_ids = cutil.getTabCol($factory_product_rows, 'id');
		$factory_product_rows = cutil.indexTabByCol($factory_product_rows, 'designProductNo', 'id');

		var $comp_ids = _.values($factory_ids) || [];
		$comp_ids.push($product_row.createdByCompId);
        $comp_rows = await Comp.getComps($comp_ids, ['id', 'name', 'logo', 'aptitude']);
		$comp_rows = cutil.indexTabByCol($comp_rows, 'id');

		let $sale_rows = {};
		try {
			let $tgstt = new TGSttApi(req);
			$sale_rows = await $tgstt.factorySpuSale(_.values($factory_product_ids), [6]);
			$sale_rows = cutil.indexTabByCol($sale_rows, 'itemId');
		} catch($e) {
			return res.jsonerr($e.message || '获取销售统计数据失败');
		}

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		var $set_ids = [$product_row.setNo];
		var $set_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$set_rows = cutil.indexTabByCol($set_rows, 'id');
		$set_ids = cutil.getTabCol($set_rows, 'pid');
		$pset_rows = await ProductSet.find({
			id: _.values($set_ids)
		});
		$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = [$product_row.styleNo];
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		var $tm = moment().valueOf();
		var $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

		try{ $ret.photo_render = $ret.photo_render ? JSON.parse($ret.photo_render) : []; } catch(e) { $ret.photo_render = []; }
		try{ $ret.photo_cad = $ret.photo_cad ? JSON.parse($ret.photo_cad) : []; } catch(e) { $ret.photo_cad = []; }
		try{ $ret.dimension = $ret.dimension ? JSON.parse($ret.dimension) : []; } catch(e) { $ret.dimension = []; }
		try{ $ret.photo_size = $ret.photo_size ? JSON.parse($ret.photo_size) : []; } catch(e) { $ret.photo_size = []; }
		try{ $ret.photo_story = $ret.photo_story ? JSON.parse($ret.photo_story) : []; } catch(e) { $ret.photo_story = []; }

		delete $ret.design_parent_product_no;

		$ret.designer = {
			id: $product_row.createdBy,
			name: $designer_row && $designer_row.name ? $designer_row.name : '',
			avatar: $designer_row && $designer_row.avatar ? $designer_row.avatar : ''
		};
		delete $ret.created_by;

		var $design_comp_rows = $comp_rows;
		$ret.design_comp = {
			id: $product_row.createdByCompId,
			name: $design_comp_rows && $design_comp_rows[$product_row.createdByCompId] ? $design_comp_rows[$product_row.createdByCompId].name : '',
			logo: $design_comp_rows && $design_comp_rows[$product_row.createdByCompId] ? $design_comp_rows[$product_row.createdByCompId].logo : ''
		};
		delete $ret.created_by_comp_id;

		$ret.cat = {
			id: $product_row.catId,
			name: $cat_rows && $cat_rows[$product_row.catId] ? $cat_rows[$product_row.catId].name : ''
		};
		delete $ret.cat_id;

		$ret.set = {
			id   : $set_rows && $set_rows[$product_row.setNo] && $set_rows[$product_row.setNo].pid || '',
			name : $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : ''
		};
		$ret.set_id = $product_row.setNo;
		delete $ret.set_no;

		$ret.style = {
			id: $product_row.styleNo,
			name: $style_rows && $style_rows[$product_row.styleNo] ? $style_rows[$product_row.styleNo].name : ''
		};
		delete $ret.style_no;

		$ret.factory_list = {
			'ing': [], //合作中
			'end': [] //已终止
		};
		_.each($factory_product_rows[$product_row.id], function($factory_product_row) {
			let $factory_row = {};

			$factory_row.id = $comp_rows[$factory_product_row.factoryCompId] ? $comp_rows[$factory_product_row.factoryCompId].id : 0;
			$factory_row.name = $comp_rows[$factory_product_row.factoryCompId] ? $comp_rows[$factory_product_row.factoryCompId].name : '';
			$factory_row.logo = $comp_rows[$factory_product_row.factoryCompId] ? $comp_rows[$factory_product_row.factoryCompId].logo : '';
			$factory_row.aptitude = $comp_rows[$factory_product_row.factoryCompId] ? $comp_rows[$factory_product_row.factoryCompId].aptitude : '';
			try{ $factory_row.aptitude = JSON.parse($factory_row.aptitude); } catch(e) {$factory_row.aptitude = {};}

			$factory_row.expire_at = $factory_product_row.expireAt;
			$factory_row.sale_amount = _.size($sale_rows) &&
				_.size($sale_rows[$factory_product_row.id]) &&
				$sale_rows[$factory_product_row.id].sale_amount || 0;

			if($tm - $factory_product_row.expireAt >= 0) {
				$ret.factory_list.end.push($factory_row);
			} else if($factory_product_row.stat == CONST.PRODUCT_STAT_EXPIRED || $factory_product_row.stat == CONST.PRODUCT_STAT_END) {
				$ret.factory_list.end.push($factory_row);
			} else if($factory_product_row.stat == CONST.PRODUCT_STAT_INUSE) {
				$ret.factory_list.ing.push($factory_row);
			} else {
				//不会到这里来
			}
		});

		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			var $acc_row = {};

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.intro = $row.intro;
			$acc_row.dimension = $row.dimension;
			$acc_row.photo_size = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;

			try{ $acc_row.dimension = $acc_row.dimension ? JSON.parse($acc_row.dimension) : []; } catch(e) { $acc_row.dimension = []; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }


			$ret.accessory.push($acc_row);
		});

		let $design_spu_attr_rows = await DesignProductAttr.find({
			designCompId    : $product_row.createdByCompId,
			designProductNo : $product_row.id
		});
		$design_spu_attr_rows = cutil.indexTabByCol($design_spu_attr_rows, 'nameNo', 'valueNo');

		$ret.attr = [];
		_.each($design_spu_attr_rows, function($attr_rows, $attr_name_no) {
			let $attr = {};
			$attr.name = $attr_name_no;
			$attr.values = _.keys($attr_rows);
			$ret.attr.push($attr);
		});


		return res.jsonok($ret);
	},

	buyPercentProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		var $product_id = cutil.getReq(req, 'product_no');
		var $product_row = await DesignProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.priceType != CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE ) return res.jsonerr('非分成合作商品类型');
        if($product_row.stat != CONST.PRODUCT_STAT_PUBLISHED) return res.jsonerr('商品未上架');
		if($product_row.nCooperated >= CONST.PRODUCT_PERCENT_MAX_COOPERATED_FACTORY) return res.jsonerr('合作已满');

        var $tm = moment().valueOf();
		if(await FactoryProduct.count({
			where: {
				designProductNo: $product_id,
				factoryCompId: req.me.compId,
				expireAt: {
					'>': $tm
				}
			}
		})) return res.jsonerr('已经在合作中，不能重复合作');

        var $timeval = parseInt(cutil.getReq(req, 'timeval')) || 0;
        if(!$timeval) return res.jsonerr('请选择合作期限');

        var $expireAt = 0;
        //1三个月，2六个月，3十二个月，4十八个月，5二十四个月，6三十六个月
        switch($timeval) {
            case 2:
                $expireAt = moment().add(6, 'months').valueOf();
                break;
            case 3:
                $expireAt = moment().add(12, 'months').valueOf();
                break;
            case 4:
                $expireAt = moment().add(18, 'months').valueOf();
                break;
            case 5:
                $expireAt = moment().add(24, 'months').valueOf();
                break;
            case 6:
                $expireAt = moment().add(36, 'months').valueOf();
                break;
            case 1:
            default:
                $expireAt = moment().add(3, 'months').valueOf();
                break;
        }

		if(typeof req.param('step_price') == 'undefined') return jsonerr('阶梯价格表不能为空');

		var $acc_product_rows = await DesignProduct.find({
			designParentProductNo: $product_id
		});

		//var $design_product_set = $product_row.setNo && await ProductSet.findOne($product_row.setNo) || null;

		let $step_price = req.param('step_price');
		if(!_.size($step_price)) return res.jsonerr('阶梯价格表为空'); 

		let $module_no_map = cutil.getTabCol($step_price, 'module_no');
		if(_.size($module_no_map) != _.size($step_price)) return res.jsonerr('型号不能为空且不能重复');

		let $sku_exiestd_module_no = await FactoryProductSku.find({
			where: {
				factoryCompId: $comp_row.id,
				stat: CONST.PRODUCT_SKU_STAT_ENABLED,
				moduleNo: _.values($module_no_map)
			},
			select: ['moduleNo']
		});
		$sku_exiestd_module_no = _.size($sku_exiestd_module_no) ? cutil.getTabCol($sku_exiestd_module_no, 'moduleNo') : {};
		if(_.size($sku_exiestd_module_no)) return res.jsonerr('型号 ' + _.values($sku_exiestd_module_no).join(' | ') + ' 不能重复');

		let $sku_sets = [];
		let $sku_step_price_sets = [];
		for(let $sku_idx = 0; $sku_idx < $step_price.length; $sku_idx ++) {
			let $sku_row = $step_price[$sku_idx];
			if(!$sku_row.material) return res.jsonerr('材质ID不能为空');
			if(!$sku_row.color) return res.jsonerr('颜色ID不能为空');
			if(!_.size($sku_row.module_no)) return res.jsonerr('型号不能为空');

			let $sku_id;
			try{
				$sku_id = await FactoryProductSku.genUUID();
			} catch($e) {
				return res.jsonerr('生成商品SKU ID失败');
			}

			for(let $sku_attr_idx in $sku_row.attrs) {
				let $sku_attr = $sku_row.attrs[$sku_attr_idx];
				if(
					!cutil.defined($sku_attr.id)
					|| !cutil.defined($sku_attr.name)
					|| !cutil.defined($sku_attr.valueId)
					|| !cutil.defined($sku_attr.value)
				)  return res.jsonerr('sku属性参数错误');
			}

			$sku_sets.push({
				id              : $sku_id,
				factoryCompId   : $comp_row.id,
				designProductNo : $product_row.id,
				materialNo      : $sku_row.material,
				colorNo         : $sku_row.color,
				codeNo          : $sku_row.code || '',
				moduleNo        : $sku_row.module_no,
				stat            : CONST.PRODUCT_SKU_STAT_ENABLED,
				cond            : _.size($sku_row.attrs) ? $sku_row.attrs : [],
			});
			
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
					designProductNo: $product_row.id,
					skuNo: $sku_id,
					numberMin: $price_row.start || 0,
					numberMax: $price_row.end || 0,
					price: $price_row.price || 0
				});
			}
		}

		if(!_.size($sku_sets) || !_.size($sku_step_price_sets)) return res.jsonerr('阶梯价格表为空');

		var $factory_product_row;
		let $event_add_spu = [], $event_add_sku = [];
        try{
            var $id = await sails.getDatastore('factory').transaction(async (db, proceed) => {
                try {
                    let productNo;
                    try{
                        productNo = await FactoryProduct.genUUID(db);
                    } catch($e) {
                        throw new Error('生成商品UUID失败');
                    }

                    let productSN;
                    try{
                        productSN = await FactoryProduct.genSN(req.me.compId, db);
                    } catch($e) {
                        throw new Error('生成商品编码失败');
                    }

					//let $set_no = '';
					//if($design_product_set && _.size($design_product_set)) {
					//	var $factory_product_set = await ProductSet.find({
					//		createdByCompId: req.me.compId,
					//		name: $design_product_set.name
					//	}).usingConnection(db);

					//	if($factory_product_set && _.size($factory_product_set)) {
					//		$set_no = $factory_product_set[0].id;
					//	} else {
					//		$set_no = await ProductSet.genUUID();
					//		$factory_product_set = await ProductSet.create({
					//			id: $set_no,
					//			name: $design_product_set.name,
					//			priceType: $design_product_set.priceType,
					//			photos: $design_product_set.photos,
					//			createdBy: req.me.id,
					//			createdByCompId: req.me.compId
					//		}).usingConnection(db);
					//	}
					//}

					$factory_product_row = await FactoryProduct.create({
						id: productNo,
						designProductNo: $product_row.id,
						factoryParentProductNo: '-',
						designParentProductNo: $product_row.designParentProductNo,
						factoryProductSN: productSN,
						name: $product_row.name,
						sname: $product_row.sname || $product_row.name,
						priceType: $product_row.priceType,
						//setNo: $set_no,
						styleNo: $product_row.styleNo,
						catId: $product_row.catId,
						designIdea: $product_row.designIdea,
						photoRender: $product_row.photoRender,
						photoCad: $product_row.photoCad,
						intro: $product_row.intro,
						dimension: $product_row.dimension,
						photoSize: $product_row.photoSize,
						photoStory: $product_row.photoStory,
						price: $product_row.price,
						pricePercent: $product_row.pricePercent,
						transactionNo: '',
						contractNo: '',
						stat: CONST.PRODUCT_STAT_INUSE,
						marketPublish: CONST.PRODUCT_MARMET_STAT_PUBLISHED,
						salebookPublish          : CONST.PRODUCT_MARMET_STAT_BAND,
						designerUserId: $product_row.createdBy,
						designerCompId: $product_row.createdByCompId,
						factoryUserId: req.me.id,
						factoryCompId: req.me.compId,
						expireAt: $expireAt
					}).fetch().usingConnection(db);
					$event_add_spu.push($factory_product_row);

					let $design_spu_attr_rows = await DesignProductAttr.find({
						designCompId    : $product_row.createdByCompId,
						designProductNo : $product_row.id
					});
					let $factory_spu_attr_set = [];
					_.each($design_spu_attr_rows, function($attr_row) {
						$factory_spu_attr_set.push({
							factoryCompId    : req.me.compId,
							factoryProductNo : productNo,
							nameNo           : $attr_row.nameNo,
							valueNo          : $attr_row.valueNo
						});
					});
					if(_.size($factory_spu_attr_set)) await FactoryProductAttr.createEach($factory_spu_attr_set);

					if($acc_product_rows && _.size($acc_product_rows)) {
						var $acc_sets = [];
						for(var $acc_product_row_idx in $acc_product_rows) {
							var $acc_product_row = $acc_product_rows[$acc_product_row_idx];
							var acc_set_row = {
								designProductNo: $acc_product_row.id,
								factoryParentProductNo: $factory_product_row.id,
								designParentProductNo: $acc_product_row.designParentProductNo,
								name: $acc_product_row.name,
								sname: $acc_product_row.sname || $acc_product_row.name,
								priceType: $acc_product_row.priceType,
								//setNo: $set_no,
								styleNo: $acc_product_row.styleNo,
								catId: $acc_product_row.catId,
								designIdea: $acc_product_row.designIdea,
								photoRender: $acc_product_row.photoRender,
								photoCad: $acc_product_row.photoCad,
								intro: $acc_product_row.intro,
								dimension: $acc_product_row.dimension,
								photoSize: $acc_product_row.photoSize,
								photoStory: $acc_product_row.photoStory,
								price: $acc_product_row.price,
								pricePercent: $acc_product_row.pricePercent,
								transactionNo: '',
								contractNo: '',
								stat: CONST.PRODUCT_STAT_INUSE,
								marketPublish: CONST.PRODUCT_MARMET_STAT_PUBLISHED,
								salebookPublish          : CONST.PRODUCT_MARMET_STAT_BAND,
								designerUserId: $acc_product_row.createdBy,
								designerCompId: $acc_product_row.createdByCompId,
								factoryUserId: req.me.id,
								factoryCompId: req.me.compId,
								expireAt: $expireAt
							};

							try{
								acc_set_row.id = await FactoryProduct.genUUID(db);
							} catch($e) {
								throw new Error('生成商品UUID失败');
							}

							try{
								acc_set_row.factoryProductSN = await FactoryProduct.genSN(req.me.compId, db);
							} catch($e) {
								throw new Error('生成商品编码失败');
							}

							$acc_sets.push(acc_set_row);
						}

						if(_.size($acc_sets)) {
							let $acc_rows = await FactoryProduct.createEach($acc_sets).fetch().usingConnection(db);
							$event_add_spu = $event_add_spu.concat($acc_rows);
						}
					}

					let $sku_db_sets = [];
					let $step_db_sets = [];
					let $sku_attr_db_sets = [];

					for(let $sku_sets_idx = 0; $sku_sets_idx < $sku_sets.length;  $sku_sets_idx ++) {
						$sku_sets[$sku_sets_idx].factoryProductNo = $factory_product_row.id;

						for(let $sku_attr_idx in $sku_sets[$sku_sets_idx].cond) {
							let $sku_attr = $sku_sets[$sku_sets_idx].cond[$sku_attr_idx];
							$sku_attr_db_sets.push({
								skuNo            : $sku_sets[$sku_sets_idx].id,
								factoryCompId    : $sku_sets[$sku_sets_idx].factoryCompId,
								factoryProductNo : $sku_sets[$sku_sets_idx].factoryProductNo,
								nameNo           : $sku_attr.id,
								attrName         : $sku_attr.name,
								valueNo          : $sku_attr.valueId,
								attrValue        : $sku_attr.value
							});
						}

						$sku_sets[$sku_sets_idx].cond = JSON.stringify($sku_sets[$sku_sets_idx].cond);
					}

					for(let $price_idx = 0; $price_idx < $sku_step_price_sets.length;  $price_idx ++) {
						$sku_step_price_sets[$price_idx].factoryProductNo = $factory_product_row.id;
					}

					let $sku_rows = await FactoryProductSku.createEach($sku_sets).fetch().usingConnection(db);

					await FactoryProductSkuAttr.createEach($sku_attr_db_sets).usingConnection(db);
					//let $cond_sku_nos = await cutil.getTabCol($sku_attr_db_sets, 'skuNo');
					//let $cond_sku_no_str = _.values($cond_sku_nos).join("','");
					//await db.query(
					//	"update factory_product_sku as sku inner join (" +
					//	"	select attr.skuNo, group_concat('{', '\"id\":\"', attr.nameNo, '\",', '\"name\":\"', attr.attrName, '\",', '\"valueId\":\"', attr.valueNo, '\",', '\"value\":\"', attr.attrValue, '\"}' separator ',') as cond " +
					//	"	from factory_product_sku_attr as attr" +
					//	"	where attr.skuNo in('" + $cond_sku_no_str + "')" + 
					//	"	group by attr.skuNo" +
					//	") as b" +
					//	" set sku.cond=concat('[', ifnull(b.cond, ''), ']')" +
					//	" where sku.skuNo in ('" + $cond_sku_no_str + "')"
					//);

					$event_add_sku = $event_add_sku.concat($sku_rows);
					await FactoryProductStepPrice.createEach($sku_step_price_sets).usingConnection(db);

					//await FactoryProduct.updateSkuStatstics($factory_product_row.id, $factory_product_row.designProductNo, db);

					var $pos_str = [];
					for(var i = 0; i < _.size($acc_product_rows); i ++) {
						$pos_str.push('$' + (i + 1));
					}
					$pos_str.push('$' + ($pos_str.length + 1));
					$pos_str = $pos_str.join(',');

					var $update_ids = [$product_row.id];
					_.each($acc_product_rows, function($row) {
						$update_ids.push($row.id);
					});
					await db.query(
						"update design_product set nCooperated=nCooperated+1, marketPublish=1, salebookPublish=1 where designProductNo in(" + $pos_str + ")",
						$update_ids
					);

                    return proceed(undefined, 'ok');
                } catch (err) {
                    return proceed(err);
                }
            });
        } catch ($e) {
            sails.log.error($e);
            return res.jsonerr('写入数据库失败');
        }

		if($factory_product_row) {
			try {
				await FactoryProduct.addSelfProductToMes($factory_product_row.id);
			} catch($e) {
				sails.log.error($e);
			}
		}

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_spu in $event_add_spu) {
				let $spu_row = $event_add_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuAdd, {id: $spu_row.id});
			}
			for(let $_idx_sku in $event_add_sku) {
				let $sku_row = $event_add_sku[$_idx_sku];
				await mq.tranSend(sails.config.mqApi.product.routeSkuAdd, {id: $sku_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok($id);
	},
};

