
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    initSetId: async function(req, res) {
		const $set_id = await ProductSet.genUUID();
		return res.jsonok({
			id: $set_id
		});
	},

    addOrUpdateSet: async function(req, res) {
		let $set_no = cutil.getReq(req, 'id');
		if($set_no.length < 1) return res.jsonerr('套系编号不能为空');//$set_no = await ProductSet.genUUID();

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $new_set_row = {
			id: $set_no
		};
		
		if(cutil.defined(req.param('parent_set_no'))) {
			let $parent_set_no = cutil.getReq(req, 'parent_set_no');
			$new_set_row.pid = $parent_set_no;
			$new_set_row.pname = '';
			if($parent_set_no.length) {
				let $parent_set_row = await ProductSet.findOne({
					id: $parent_set_no,
					createdByCompId : req.me.compId
				});
				if(!_.size($parent_set_row)) return res.jsonerr('上级套系不存在');
				$new_set_row.pname = $parent_set_row.name;
			}
		}
	
		if(cutil.defined(req.param('name')))         $new_set_row.name      = cutil.getReq(req, 'name');
		if(cutil.defined(req.param('price_type')))   $new_set_row.priceType = parseInt(cutil.getReq(req, 'price_type'));
		if(cutil.defined(req.param('photos'))) {
			let $photos = [];
			if(_.isArray(req.param('photos'))) $photos = req.param('photos');
			$new_set_row.photos = $photos;
		}
	
		if(cutil.defined(req.param('style_no')))            $new_set_row.styleNo         = cutil.getReq(req, 'style_no');
		if(cutil.defined(req.param('price')))               $new_set_row.price           = cutil.getReq(req, 'price');
		if(cutil.defined(req.param('price'))) {
			$new_set_row.price = parseFloat(cutil.getReq(req, 'price'));
			$new_set_row.price = isNaN($new_set_row.price) ? 0 : $new_set_row.price.toFixed(2);
		}

		if(cutil.defined(req.param('contract_file')))       $new_set_row.contractFile    = cutil.getReq(req, 'contract_file');
		if(cutil.defined(req.param('custom_cover_page')))   $new_set_row.customCoverPage = cutil.getReq(req, 'custom_cover_page');
		if(cutil.defined(req.param('order_no')))            $new_set_row.orderNo         = parseInt(cutil.getReq(req, 'order_no'));

		let $old_set_row = await ProductSet.findOne({
			id              : $new_set_row.id
		});
		if(_.size($old_set_row) && $old_set_row.createdByCompId != req.me.compId) return res.jsonerr('该商品非该公司所有');
		if(_.size($old_set_row) && $old_set_row.stat == CONST.PRODUCT_STAT_TRANS) return res.jsonerr('该套系已经发生交易，不能修改');

		if(cutil.defined($new_set_row.photos)) $new_set_row.photos = JSON.stringify($new_set_row.photos);
		if(_.size($old_set_row)) {
			//update
			if(_.size($new_set_row)) {
				if(cutil.defined($new_set_row.priceType)) {
					if([
						CONST.PRODUCT_STAT_TRASH,
						CONST.PRODUCT_STAT_DELETED,
						CONST.PRODUCT_STAT_TRANS
					].indexOf($old_set_row.stat) === -1) {
						$new_set_row.stat = $new_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_STAT_BANED : CONST.PRODUCT_STAT_PUBLISHED;
						if($new_set_row.stat == CONST.PRODUCT_STAT_PUBLISHED) $new_set_row.publishedAt = moment().valueOf();
					}
				}
				$set_no = $new_set_row.id;
				delete $new_set_row.id;
				$old_set_row = await ProductSet.update({
					id              : $set_no,
					createdByCompId : req.me.compId
				}).set($new_set_row).fetch();
				$old_set_row = _.size($old_set_row) && $old_set_row[0] || {};
			}
		} else {
			//add
			$new_set_row.createdBy       = req.me.id;
			$new_set_row.createdByCompId = req.me.compId;
			$new_set_row.pname           = cutil.defined($new_set_row.pname) ? $new_set_row.pname : '';
			$new_set_row.name            = cutil.defined($new_set_row.name) ? $new_set_row.name : '';
			$new_set_row.priceType       = cutil.defined($new_set_row.priceType) ? $new_set_row.priceType : CONST.PRODUCT_PRICE_TYPE_UNKNOWN;
			$new_set_row.stat            = $new_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_STAT_BANED : CONST.PRODUCT_STAT_PUBLISHED;
			$new_set_row.stock           = 1;

			if($new_set_row.stat == CONST.PRODUCT_STAT_PUBLISHED) $new_set_row.publishedAt = moment().valueOf();

			$old_set_row = await ProductSet.create($new_set_row).fetch();
		}
	
		return res.jsonok(cutil.snakeCaseObject($old_set_row));
	},

    multiUpdateSet: async function(req, res) {
        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $new_set_rows = [];
		let $id_err = false;
		if(_.isArray(req.param('rows'))) {
			_.each(req.param('rows'), $input_row => {
				let $set_no = '';
				if(_.isString($input_row.id)) $set_no = $input_row.id.trim();
				if(!$set_no.length) {
					$id_err = true;
					return false;
				}

				let $new_set_row = {
					id: $set_no
				};

				if(cutil.defined($input_row.name))         $new_set_row.name      = $input_row.name.trim();
				if(cutil.defined($input_row.price_type))   $new_set_row.priceType = parseInt($input_row.price_type);
				if(cutil.defined($input_row.order_no))     $new_set_row.orderNo   = parseInt($input_row.order_no);

				$new_set_rows.push($new_set_row);
			});
		}

		if($id_err) return res.jsonerr('id不能为空');
		if(!_.size($new_set_rows)) return res.jsonerr('没有记录需要修改');
		let $new_set_ids = _.values(cutil.getTabCol($new_set_rows, 'id'));

		let $old_set_rows = await ProductSet.find({
			where: {
				id              : $new_set_ids,
				createdByCompId : req.me.compId
			},
			select: ['id', 'stat']
		});
		if(!_.size($old_set_rows)) return res.jsonerr('没有记录需要修改');
		$old_set_rows = cutil.indexTabByCol($old_set_rows, 'id');

		let $stat_err = false;
		_.each($old_set_rows, $old_set_row => {
			if($old_set_row.stat == CONST.PRODUCT_STAT_TRANS) {
				$stat_err = true;
			}
		});
		if($stat_err) return res.jsonerr('已经发生交易，不能修改');

		try{
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					for(let $new_set_row of $new_set_rows) {
						if(cutil.defined($new_set_row.priceType)) {
							if([
								CONST.PRODUCT_STAT_TRASH,
								CONST.PRODUCT_STAT_DELETED,
								CONST.PRODUCT_STAT_TRANS
							].indexOf($old_set_rows[$new_set_row.id].stat) === -1) {
								$new_set_row.stat = $new_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_STAT_BANED : CONST.PRODUCT_STAT_PUBLISHED;
								if($new_set_row.stat == CONST.PRODUCT_STAT_PUBLISHED) $new_set_row.publishedAt = moment().valueOf();
							}
						}
						$set_no = $new_set_row.id;
						delete $new_set_row.id;
						await ProductSet.update({
							id              : $set_no,
							createdByCompId : req.me.compId
						}).set($new_set_row);
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
	
		return res.jsonok('ok');
	},


    addOrUpdateProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('未创建公司');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $product_id = cutil.getReq(req, 'id');
        let $product_set_row = {};
		if(cutil.defined(req.param('name')))                $product_set_row.name            = cutil.getReq(req, 'name') || '';
		if(cutil.defined(req.param('sname')))               $product_set_row.sname           = cutil.getReq(req, 'sname') || set.name;
		if(cutil.defined(req.param('price_type')))          $product_set_row.priceType       = parseInt(cutil.getReq(req, 'price_type'));
		if(cutil.defined(req.param('set_no')))              $product_set_row.setNo           = cutil.getReq(req, 'set_no') || '';
		if(cutil.defined(req.param('style_no')))            $product_set_row.styleNo         = cutil.getReq(req, 'style_no') || '';
		if(cutil.defined(req.param('cat_id')))              $product_set_row.catId           = parseInt(cutil.getReq(req, 'cat_id')) || 0;
		if(cutil.defined(req.param('design_idea')))         $product_set_row.designIdea      = cutil.getReq(req, 'design_idea') || '';
		if(cutil.defined(req.param('photo_render')))        $product_set_row.photoRender     = _.isArray(req.param('photo_render')) ? req.param('photo_render') : [];
		if(cutil.defined(req.param('photo_cad')))           $product_set_row.photoCad        = _.isArray(req.param('photo_cad')) ? req.param('photo_cad') : [];
		if(cutil.defined(req.param('intro')))               $product_set_row.intro           = cutil.getReq(req, 'intro') || '';
		if(cutil.defined(req.param('dimension')))           $product_set_row.dimension       = _.isArray(req.param('dimension')) ? req.param('dimension') : [];
		if(cutil.defined(req.param('photo_size')))          $product_set_row.photoSize       = _.isArray(req.param('photo_size')) ? req.param('photo_size') : [];
		if(cutil.defined(req.param('photo_story')))         $product_set_row.photoStory      = _.isArray(req.param('photo_story')) ? req.param('photo_story') : [];
		if(cutil.defined(req.param('price'))) {
			$product_set_row.price = parseFloat(cutil.getReq(req, 'price'));
			$product_set_row.price = isNaN($product_set_row.price) ? 0 : $product_set_row.price.toFixed(2);
		}
		if(cutil.defined(req.param('price_percent'))) {
			$product_set_row.pricePercent = parseInt(cutil.getReq(req, 'price_percent')) || 0;
		}
		if(cutil.defined(req.param('contract_file')))       $product_set_row.contractFile    = cutil.getReq(req, 'contract_file');
		if(cutil.defined(req.param('custom_cover_page')))   $product_set_row.customCoverPage = parseInt(cutil.getReq(req, 'custom_cover_page')) ? 1 : 0;

		if(cutil.defined($product_set_row.setNo) && $product_set_row.setNo.length) {
			let $set_row = await ProductSet.findOne($product_set_row.setNo);
			if(!_.size($set_row)) return res.jsonerr('商品套系不存在');
		}

		let $product_row = {};
		if($product_id) {
			$product_row = await DesignProduct.findOne($product_id);
			if(!_.size($product_row)) return res.jsonerr('商品不存在');
			if($product_row.createdByCompId != req.me.compId) return res.jsonerr('商品不属于该企业');
			if($product_row.stat == CONST.PRODUCT_STAT_TRANS) return res.jsonerr('该商品已经发生交易，不能修改');
		}

		if(_.size($product_row)) {
			//update
			if(cutil.defined($product_set_row.priceType)) {
				if([
					CONST.PRODUCT_STAT_TRASH,
					CONST.PRODUCT_STAT_DELETED,
					CONST.PRODUCT_STAT_TRANS
				].indexOf($product_row.stat) === -1) {
					$product_set_row.stat = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_STAT_BANED : CONST.PRODUCT_STAT_PUBLISHED;
					$product_set_row.marketPublish = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_MARMET_STAT_BAND : CONST.PRODUCT_MARMET_STAT_PUBLISHED;
					$product_set_row.salebookPublish = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_HANDBOOK_STAT_BAND : CONST.PRODUCT_HANDBOOK_STAT_PUBLISHED;
					if($product_set_row.stat == CONST.PRODUCT_STAT_PUBLISHED) $product_set_row.publishedAt = moment().valueOf();
				}
			}
		} else {
			//add
			if(!cutil.defined($product_set_row.name) || !$product_set_row.name.length) return res.jsonerr('请输入商品名称');
			if(!cutil.defined($product_set_row.priceType)) $product_set_row.priceType = CONST.PRODUCT_PRICE_TYPE_UNKNOWN;
			$product_set_row.designParentProductNo = '-';
			$product_set_row.stat = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_STAT_BANED : CONST.PRODUCT_STAT_PUBLISHED;
			$product_set_row.marketPublish = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_MARMET_STAT_BAND : CONST.PRODUCT_MARMET_STAT_PUBLISHED;
			$product_set_row.salebookPublish = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_HANDBOOK_STAT_BAND : CONST.PRODUCT_HANDBOOK_STAT_PUBLISHED;
			$product_set_row.createdBy = req.me.id;
			$product_set_row.createdByCompId = req.me.compId;
			if($product_set_row.stat == CONST.PRODUCT_STAT_PUBLISHED) $product_set_row.publishedAt = moment().valueOf();
		}

		if($product_set_row.photoRender)   $product_set_row.photoRender = JSON.stringify($product_set_row.photoRender);
		if($product_set_row.photoCad)      $product_set_row.photoCad    = JSON.stringify($product_set_row.photoCad);
		if($product_set_row.dimension)     $product_set_row.dimension   = JSON.stringify($product_set_row.dimension);
		if($product_set_row.photoSize)     $product_set_row.photoSize   = JSON.stringify($product_set_row.photoSize);
		if($product_set_row.photoStory)    $product_set_row.photoStory  = JSON.stringify($product_set_row.photoStory);


		let $acc_set_rows = [];
		if(req.param('accessory')) {
			let $accessory = req.param('accessory');
			if(!$accessory || !_.isArray($accessory)) return res.jsonerr('附件参数不是数组');

			try {
				_.each($accessory, function($acc) {
					let $acc_set_row = {};
					$acc_set_row.id = $acc.id || 0;

					$acc_set_row.name = $acc.name && $acc.name.toString().trim() || '';
					if($acc_set_row.name.length < 1) throw '请输入附件名称';

					if(_.isArray($acc.dimension))     $acc_set_row.dimension  = $acc.dimension;
					if(_.isArray($acc.photo_size))    $acc_set_row.photoSize  = $acc.photo_size;
					if(_.isArray($acc.photo_story))   $acc_set_row.photoStory = $acc.photo_story;

					//$acc_set_row.stat                  = parseInt($acc.stat) == CONST.PRODUCT_STAT_DELETED ? CONST.PRODUCT_STAT_DELETED : CONST.PRODUCT_STAT_PUBLISHED;
					$acc_set_row.stat                  = CONST.PRODUCT_STAT_PUBLISHED;
					$acc_set_row.createdBy             = req.me.id;
					$acc_set_row.createdByCompId       = req.me.compId;

					$acc_set_rows.push($acc_set_row);
				});
			} catch(e) {
				return res.jsonerr(e.toString());
			}
		}


		let $add_spu_attr_set = [];
		let $req_attr = req.param('attr');
		if(_.isArray($req_attr) && _.size($req_attr)) {
			_.each($req_attr, function($attr) {
				if(_.isArray($attr.values) && _.size($attr.values)) {
					_.each($attr.values, function($attr_val) {
						$add_spu_attr_set.push({
							designCompId    : $comp_row.id,
							designProductNo : '',
							nameNo          : $attr.name,
							valueNo         : $attr_val
						});
					});
				}
			});
		}

        try {
			$product_row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					if(_.size($product_row)) {
						//update
						if(_.size($product_set_row)) {
							$product_row = await DesignProduct.update($product_row.id).set($product_set_row).fetch().usingConnection(db);
							$product_row = $product_row && $product_row[0] || null;

							//关闭所有正在进行的交易
							await Transaction.update({
								productNo: $product_row.id,
								stat: {
									'<': CONST.TRANSACTION_STAT_SIGNED_BUY
								}
							}).set({
								stat: CONST.TRANSACTION_STAT_CLOSED_BY_PRODUCT_UPDATE
							});
						}
					} else {
						let productNo;
						try{
							productNo = await DesignProduct.genUUID(db);
						} catch($e) {
							throw new Error('生成商品UUID失败');
						}
						$product_set_row.id = productNo;

						let productSN;
						try{
							productSN = await DesignProduct.genSN(req.me.compId, db);
						} catch($e) {
							throw new Error('生成商品编码失败');
						}
						$product_set_row.designProductSN = productSN;
						$product_set_row.stock           = 1;

						$product_row = await DesignProduct.create($product_set_row).fetch().usingConnection(db);
					}

					//if(parseInt(set.stat) == CONST.PRODUCT_STAT_PUBLISHED) {
					//	try {
					//		checkPriceProductForPublish($product_row);
					//	} catch($e) {
					//		 return proceed(flaverr('E_USER_ERROR', new Error($e)));
					//	}
					//}

					if(_.size($acc_set_rows)) {
						let $productNo, $productSN;
						for(let $acc_set_row of $acc_set_rows) {
							if(!$acc_set_row.id) {
								try{
									$productNo = await DesignProduct.genUUID(db);
								} catch($e) {
									throw new Error('生成商品UUID失败');
								}
								$acc_set_row.id = $productNo;
							}

							if(!$acc_set_row.productSN) {
								try{
									$productSN = await DesignProduct.genSN(req.me.compId, db);
								} catch($e) {
									throw new Error('生成商品编码失败');
								}
								$acc_set_row.designProductSN = $productSN;
							}

							$acc_set_row.designParentProductNo = $product_row.id;

							if($acc_set_row.dimension)    $acc_set_row.dimension = JSON.stringify($acc_set_row.dimension);
							if($acc_set_row.photoSize)    $acc_set_row.photoSize = JSON.stringify($acc_set_row.photoSize);
							if($acc_set_row.photoStory)   $acc_set_row.photoStory = JSON.stringify($acc_set_row.photoStory);
						}

						await DesignProduct.destroy({
							designParentProductNo: $product_row.id
						}).usingConnection(db);

						await DesignProduct.createEach($acc_set_rows).usingConnection(db);
					}

					await DesignProductAttr.destroy({
						designCompId    : $comp_row.id,
						designProductNo : $product_row.id
					});
					if(_.size($add_spu_attr_set)) {
						_.each($add_spu_attr_set, function($attr) {
							$attr.designProductNo = $product_row.id;
						});
						await DesignProductAttr.createEach($add_spu_attr_set);
					}

					return proceed(undefined, $product_row);
				} catch (err) {
					return proceed(err);
				}
			});
			return res.jsonok(cutil.snakeCaseObject($product_row));
        } catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr('写入数据库失败');
        }
	},

    multiUpdateProduct: async function(req, res) {
        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $product_set_rows = [];
		let $id_err = false;
		if(_.isArray(req.param('rows'))) {
			_.each(req.param('rows'), $input_row => {
				let $product_id = '';
				if(_.isString($input_row.id)) $product_id = $input_row.id.trim();
				if(!$product_id.length) {
					$id_err = true;
					return false;
				}

				let $product_set_row = {
					id: $product_id 
				};

				//if(cutil.defined($input_row.name))         $product_set_row.name      = $input_row.name.trim();
				if(cutil.defined($input_row.price_type))   $product_set_row.priceType = parseInt($input_row.price_type);

				$product_set_rows.push($product_set_row);
			});
		}

		if($id_err) return res.jsonerr('id不能为空');
		if(!_.size($product_set_rows)) return res.jsonerr('没有记录需要修改');
		let $product_set_ids = _.values(cutil.getTabCol($product_set_rows, 'id'));

		let $old_product_rows = await DesignProduct.find({
			where: {
				id              : $product_set_ids,
				createdByCompId : req.me.compId
			},
			select: ['id', 'stat']
		});
		if(!_.size($old_product_rows)) return res.jsonerr('没有记录需要修改');
		$old_product_rows = cutil.indexTabByCol($old_product_rows, 'id');

		let $stat_err = false;
		_.each($old_product_rows, $old_product_row => {
			if($old_product_row.stat == CONST.PRODUCT_STAT_TRANS) {
				$stat_err = true;
			}
		});
		if($stat_err) return res.jsonerr('已经发生交易，不能修改');

		try{
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					for(let $product_set_row of $product_set_rows) {
						if(cutil.defined($product_set_row.priceType)) {
							if([
								CONST.PRODUCT_STAT_TRASH,
								CONST.PRODUCT_STAT_DELETED,
								CONST.PRODUCT_STAT_TRANS
							].indexOf($old_product_rows[$product_set_row.id].stat) === -1) {
								$product_set_row.stat = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_STAT_BANED : CONST.PRODUCT_STAT_PUBLISHED;
								$product_set_row.marketPublish = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_MARMET_STAT_BAND : CONST.PRODUCT_MARMET_STAT_PUBLISHED;
								$product_set_row.salebookPublish = $product_set_row.priceType == CONST.PRODUCT_PRICE_TYPE_UNKNOWN ? CONST.PRODUCT_HANDBOOK_STAT_BAND : CONST.PRODUCT_HANDBOOK_STAT_PUBLISHED;

								if($product_set_row.stat == CONST.PRODUCT_STAT_PUBLISHED) $product_set_row.publishedAt = moment().valueOf();
							}
						}
						$product_id = $product_set_row.id;
						delete $product_set_row.id;
						await DesignProduct.update({
							id              : $product_id,
							createdByCompId : req.me.compId
						}).set($product_set_row);
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
	
		return res.jsonok('ok');
	},

	trashProduct: async function(req, res) {
		let $product_ids = {};
		if(_.isArray(req.param('ids'))) {
			req.param('ids').map(v => {
				v = _.isString(v) ? v.trim() : '';
				if(v.length) $product_ids[v] = v;
			});
		}
			
		if(_.size($product_ids)) $product_ids = _.values($product_ids);
		if(!_.size($product_ids)) return res.jsonok('ok');
	
		await DesignProduct.update({
			id: $product_ids,
			createdByCompId: req.me.compId,
			stat: {
				'!=': CONST.PRODUCT_STAT_TRANS
			}
		}).set({
			stat            : CONST.PRODUCT_STAT_TRASH,
			marketPublish   : CONST.PRODUCT_MARMET_STAT_BAND,
			salebookPublish : CONST.PRODUCT_HANDBOOK_STAT_BAND
		});
	
		return res.jsonok('ok');
	},

	unTrashProduct: async function(req, res) {
		let $product_ids = {};
		if(_.isArray(req.param('ids'))) {
			req.param('ids').map(v => {
				v = _.isString(v) ? v.trim() : '';
				if(v.length) $product_ids[v] = v;
			});
		}
		
		if(_.size($product_ids)) $product_ids = _.values($product_ids);
		if(!_.size($product_ids)) return res.jsonok('ok');

		let $product_rows = await DesignProduct.find({
			where: {
				id: $product_ids,
				createdByCompId: req.me.compId
			},
			select: ['id', 'priceType', 'stat']
		});

		let $stat_publish = [], $stat_ban = [];
		_.each($product_rows, $product_row => {
			if($product_row.stat == CONST.PRODUCT_STAT_TRASH) {
				if(parseInt($product_row.priceType) == CONST.PRODUCT_PRICE_TYPE_UNKNOWN) $stat_ban.push($product_row.id);
				else $stat_publish.push($product_row.id);
			}
		});

		if(_.size($stat_publish)) {
			await DesignProduct.update({
				id: $stat_publish,
				createdByCompId: req.me.compId
			}).set({
				stat            : CONST.PRODUCT_STAT_PUBLISHED,
				marketPublish   : CONST.PRODUCT_MARMET_STAT_PUBLISHED,
				salebookPublish : CONST.PRODUCT_HANDBOOK_STAT_PUBLISHED,
				publishedAt     : moment().valueOf()
			});
		}

		if(_.size($stat_ban)) {
			await DesignProduct.update({
				id: $stat_ban,
				createdByCompId: req.me.compId
			}).set({
				stat: CONST.PRODUCT_STAT_BANED,
				marketPublish   : CONST.PRODUCT_MARMET_STAT_BAND,
				salebookPublish : CONST.PRODUCT_HANDBOOK_STAT_BAND
			});
		}

		return res.jsonok('ok');
	},

	delProduct: async function(req, res) {
		let $product_ids = {};
		if(_.isArray(req.param('ids'))) {
			req.param('ids').map(v => {
				v = _.isString(v) ? v.trim() : '';
				if(v.length) $product_ids[v] = v;
			});
		}
			
		if(_.size($product_ids)) $product_ids = _.values($product_ids);
		if(!_.size($product_ids)) return res.jsonok('ok');
	
		await DesignProduct.update({
			id: $product_ids,
			createdByCompId: req.me.compId,
			stat: CONST.PRODUCT_STAT_TRASH
		}).set({
			stat: CONST.PRODUCT_STAT_DELETED
		});
	
		return res.jsonok('ok');
	},

	trashSet: async function(req, res) {
		let $set_ids = {};
		if(_.isArray(req.param('ids'))) {
			req.param('ids').map(v => {
				v = _.isString(v) ? v.trim() : '';
				if(v.length) $set_ids[v] = v;
			});
		}
		
		if(_.size($set_ids)) $set_ids = _.values($set_ids);
		if(!_.size($set_ids)) return res.jsonok('ok');

		//let $n_product_rows = await DesignProduct.count({
		//	setNo: $set_ids,
		//	createdByCompId: req.me.compId,
		//});
		//if($n_product_rows) return res.jsonerr('套系下还有作品，请先删除作品');
	
		await ProductSet.update({
			id: $set_ids,
			createdByCompId: req.me.compId,
			stat: {
				'!=': CONST.PRODUCT_STAT_TRANS
			}
		}).set({
			stat: CONST.PRODUCT_STAT_TRASH
		});
	
		return res.jsonok('ok');
	},

	unTrashSet: async function(req, res) {
		let $set_ids = {};
		if(_.isArray(req.param('ids'))) {
			req.param('ids').map(v => {
				v = _.isString(v) ? v.trim() : '';
				if(v.length) $set_ids[v] = v;
			});
		}
		
		if(_.size($set_ids)) $set_ids = _.values($set_ids);
		if(!_.size($set_ids)) return res.jsonok('ok');
	
		let $set_rows = await ProductSet.find({
			where: {
				id: $set_ids,
				createdByCompId: req.me.compId
			},
			select: ['id', 'priceType', 'stat']
		});

		let $stat_publish = [], $stat_ban = [];
		_.each($set_rows, $set_row => {
			if($set_row.stat == CONST.PRODUCT_STAT_TRASH) {
				if(parseInt($set_row.priceType) == CONST.PRODUCT_PRICE_TYPE_UNKNOWN) $stat_ban.push($set_row.id);
				else $stat_publish.push($set_row.id);
			}
		});

		if(_.size($stat_publish)) {
			await ProductSet.update({
				id: $stat_publish,
				createdByCompId: req.me.compId
			}).set({
				stat        : CONST.PRODUCT_STAT_PUBLISHED,
				publishedAt : moment().valueOf()
			});
		}

		if(_.size($stat_ban)) {
			await ProductSet.update({
				id: $stat_ban,
				createdByCompId: req.me.compId
			}).set({
				stat: CONST.PRODUCT_STAT_BANED
			});
		}

		return res.jsonok('ok');
	},

	delSet: async function(req, res) {
		let $set_ids = {};
		if(_.isArray(req.param('ids'))) {
			req.param('ids').map(v => {
				v = _.isString(v) ? v.trim() : '';
				if(v.length) $set_ids[v] = v;
			});
		}
		
		if(_.size($set_ids)) $set_ids = _.values($set_ids);
		if(!_.size($set_ids)) return res.jsonok('ok');

		let $set_rows = await ProductSet.find({
			where: {
				id: $set_ids
			},
			select: ['id', 'pid', 'stat', 'createdByCompId']
		});

		let $top_set_ids = {};
		let $sub_set_ids = {};
		let $sub_set_pids = {};
		let $top_set_not_trash = 0;
		let $top_set_has_trans = 0;
		let $set_not_belong_to = 0;
		_.each($set_rows, $set_row => {
			if(!_.size($set_row.pid)) {
				if($set_row.stat != CONST.PRODUCT_STAT_TRASH) {
					$top_set_not_trash = $set_row.id;
					return false;
				} else if($set_row.stat == CONST.PRODUCT_STAT_TRANS) {
					$top_set_has_trans = $set_row.id;
					return false;
				}
				$top_set_ids[$set_row.id] = $set_row.id;
			} else {
				$sub_set_ids[$set_row.id] = $set_row.id;
				$sub_set_pids[$set_row.pid] = $set_row.pid;
			}
			if($set_row.createdByCompId != req.me.compId) {
				$set_not_belong_to = $set_row.id;
				return false;
			}
		});

		if($set_not_belong_to) return res.jsonerr('套系非本企业所有');
		if($top_set_not_trash) return res.jsonerr('请移到回收站后再删除');
		//if($top_set_has_trans) return res.jsonerr('套系已经发送交易，不能删除');

		if(_.size($sub_set_ids) && await DesignProduct.count({setNo: _.values($sub_set_ids)})) return res.jsonerr('套系下还有商品，不能删除');
		if(_.size($sub_set_ids) && await ProductSet.count({id: _.values($sub_set_pids), stat: CONST.PRODUCT_STAT_TRANS})) return res.jsonerr('套系已经交易，不能删除');
	
		if(_.size($top_set_ids)) {
			await ProductSet.update({
				id              : _.values($top_set_ids),
				createdByCompId : req.me.compId,
				stat            : CONST.PRODUCT_STAT_TRASH
			}).set({
				stat: CONST.PRODUCT_STAT_DELETED
			});
		}

		if(_.size($sub_set_ids)) {
			await ProductSet.destroy({
				id              : _.values($sub_set_ids),
				createdByCompId : req.me.compId,
			});
		}
	
		return res.jsonok('ok');
	},

	delSetProduct: async function(req, res) {
		let $set_id = cutil.getReq(req, 'set_id');
		let $product_ids = [];
		if(_.isArray(req.param('product_id'))) {
			req.param('product_id').map(v => {
				if(_.isString(v)) {
					v = v.trim();
					if(v.length) $product_ids.push(v);
				}
			});
		}
	
		if(!$set_id.length) return res.jsonerr('套系id为空');
		if(!$product_ids.length) return res.jsonerr('商品id为空');
	
		await DesignProduct.destroy({
			createdByCompId : req.me.compId,
			setNo           : $set_id,
			stat            : {'!=': CONST.PRODUCT_STAT_TRANS},
			id              : $product_ids
		});
	
		return res.jsonok('ok');
	},

	listProduct: async function(req, res) {
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			createdByCompId       : req.me.compId,
			setNo                 : "",
			designParentProductNo : '-'
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $cat_ids = [], $price_types = [], $stats = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('cat_id'))) $cat_ids = req.param('cat_id').filter(v => (parseInt(v)));
		if(_.isArray(req.param('price_type'))) $price_types = req.param('price_type').filter(v => (parseInt(v)));
		if(_.isArray(req.param('stat'))) $stats = req.param('stat').filter(v => (parseInt(v)));
		if(_.size($style_nos)) $where.styleNo = $style_nos;
		if(_.size($cat_ids)) $where.catId = $cat_ids;
		if(_.size($price_types)) $where.priceType = $price_types;
		if(_.size($stats)) $where.stat = $stats;

		let $avail_only = parseInt(cutil.getReq(req, 'avail_only'));
		if($avail_only) $where.stat = CONST.PRODUCT_STAT_PUBLISHED;

		let $n_product_rows = await DesignProduct.count({
			where : $where,
		});
		if(!$n_product_rows) return res.jsonok({total: 0, list: []});

		let $product_rows = await DesignProduct.find({
			where : $where,
			sort  : 'createdAt desc',
			skip  : $start,
			limit : $pagesize
		});

        let $designer_ids = cutil.getTabCol($product_rows, 'createdBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $cat_ids_arr = cutil.getTabCol($product_rows, 'catId');
		$cat_ids_arr = _.values($cat_ids_arr).filter(v => (_.isString(v) && v.trim().length));
		let $style_no_arr = cutil.getTabCol($product_rows, 'styleNo');
		$style_no_arr = _.values($style_no_arr).filter(v => (_.isString(v) && v.trim().length));
		let $tg_dict_api = new TGDictApi(req);
		let $product_dict = {};
		try {
			$product_dict = await $tg_dict_api.getDicts({id: $cat_ids_arr, needAttr: false}, {id: $style_no_arr}, null, null);
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || 'TgDictApi: error');
		}

		let $ret = [];
		_.each($product_rows, $product_row => {
            $product_row.designer = {
                id: $product_row.createdBy,
                name: $designer_rows[$product_row.createdBy] && $designer_rows[$product_row.createdBy].name ? $designer_rows[$product_row.createdBy].name : '',
                avatar: $designer_rows[$product_row.createdBy] && $designer_rows[$product_row.createdBy].avatar ? $designer_rows[$product_row.createdBy].avatar : ''
            };
			delete $product_row.createdBy;

			$product_row.cat = {
				id: $product_row.catId,
				name: _.size($product_dict.cat) && _.size($product_dict.cat[$product_row.catId]) && $product_dict.cat[$product_row.catId].name || ''
			};
			delete $product_row.catId;

			$product_row.style = {
				id: $product_row.styleNo,
				name: _.size($product_dict.style) && _.size($product_dict.style[$product_row.styleNo]) && $product_dict.style[$product_row.styleNo].name || ''
			};
			delete $product_row.styleNo;

			try{ $product_row.photoRender = JSON.parse($product_row.photoRender); } catch(e) { $product_row.photoRender = []; }
			try{ $product_row.photoCad = JSON.parse($product_row.photoCad); } catch(e) { $product_row.photoCad = []; }
			try{ $product_row.dimension = JSON.parse($product_row.dimension); } catch(e) { $product_row.dimension = []; }
			try{ $product_row.photoSize = JSON.parse($product_row.photoSize); } catch(e) { $product_row.photoSize = []; }
			try{ $product_row.photoStory = JSON.parse($product_row.photoStory); } catch(e) { $product_row.photoStory = []; }

			$ret.push(cutil.snakeCaseObject($product_row));
		});

		return res.jsonok({total: $n_product_rows, list: $ret});
	},

	listSet: async function(req, res) {
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			createdByCompId: req.me.compId,
			or: [
				{pid: ''},
				{pid: null},
			]
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $cat_ids = [], $price_types = [], $stats = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('price_type'))) $price_types = req.param('price_type').filter(v => (parseInt(v)));
		if(_.isArray(req.param('stat'))) $stats = req.param('stat').filter(v => (parseInt(v)));
		if(_.size($style_nos)) $where.styleNo = $style_nos;
		if(_.size($price_types)) $where.priceType = $price_types;
		if(_.size($stats)) $where.stat = $stats;

		let $avail_only = parseInt(cutil.getReq(req, 'avail_only'));
		if($avail_only) $where.stat = CONST.PRODUCT_STAT_PUBLISHED;

		let $n_set_rows = await ProductSet.count({
			where : $where,
		});
		if(!$n_set_rows) return res.jsonok({total: 0, list: []});

		let $set_rows = await ProductSet.find({
			where : $where,
			sort  : 'createdAt desc',
			skip  : $start,
			limit : $pagesize
		});

		let $set_ids = cutil.getTabCol($set_rows, 'id');
		let $n_product_rows = {};
		if(_.size($set_ids)) {
			$n_product_rows = await sails.getDatastore().sendNativeQuery(
				"select setNo, count(1) as cnt from design_product where setNo in ('" + _.values($set_ids).join("','")+ "') group by setNo"
			);
		}
		$n_product_rows = _.size($n_product_rows) && _.size($n_product_rows.rows) && cutil.indexTabByCol($n_product_rows.rows, 'setNo') || {};

        let $designer_ids = cutil.getTabCol($set_rows, 'createdBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $style_no_arr = cutil.getTabCol($set_rows, 'styleNo');
		$style_no_arr = _.values($style_no_arr).filter(v => (_.isString(v) && v.trim().length));
		let $tg_dict_api = new TGDictApi(req);
		let $product_dict = {};
		try {
			$product_dict = await $tg_dict_api.getDicts(null, {id: $style_no_arr}, null, null);
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || 'TgDictApi: error');
		}

		let $ret = [];
		_.each($set_rows, $set_row => {
			$set_row.n_product = _.size($n_product_rows) && _.size($n_product_rows[$set_row.id]) && $n_product_rows[$set_row.id].cnt || 0;
            $set_row.designer = {
                id: $set_row.createdBy,
                name: $designer_rows[$set_row.createdBy] && $designer_rows[$set_row.createdBy].name ? $designer_rows[$set_row.createdBy].name : '',
                avatar: $designer_rows[$set_row.createdBy] && $designer_rows[$set_row.createdBy].avatar ? $designer_rows[$set_row.createdBy].avatar : ''
            };
			delete $set_row.createdBy;

			$set_row.style = {
				id: $set_row.styleNo,
				name: _.size($product_dict.style) && _.size($product_dict.style[$set_row.styleNo]) && $product_dict.style[$set_row.styleNo].name || ''
			};
			delete $set_row.styleNo;

			try{ $set_row.photos = JSON.parse($set_row.photos); } catch(e) { $set_row.photos = []; }

			$ret.push(cutil.snakeCaseObject($set_row));
		});

		return res.jsonok({total: $n_set_rows, list: $ret});
	},

	detailProduct: async function(req, res) {
		let $id = cutil.getReq(req, 'id');
		if(!$id.length) return res.jsonerr('作品不存在');
	
		let $product_row = await DesignProduct.findOne($id);
		if(!_.size($product_row)) return res.jsonerr('作品不存在');

		let $acc_product_rows = await DesignProduct.find({
			designParentProductNo: $id
		});

        let $trans_row = await Transaction.getValidTransactionsByProductNos([$id], ['productNo', 'stat', 'buyByCompId', 'contractNo', 'orderNo']);
		$trans_row = cutil.indexTabByCol($trans_row, 'productNo');
		$trans_row = $trans_row && $trans_row[$id] || {};

        let $designer_ids = [$product_row.createdBy];
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers($designer_ids, ['id', 'name', 'avatar', 'compId']);
        }

		let $cat_ids_arr = _.isString($product_row.catId) && $product_row.catId.trim().length ? [$product_row.catId] : [];
		let $style_no_arr = _.isString($product_row.styleNo) && $product_row.styleNo.trim().length ? [$product_row.styleNo] : [];
		let $tg_dict_api = new TGDictApi(req);
		let $product_dict = {};
		try {
			$product_dict = await $tg_dict_api.getDicts({id: $cat_ids_arr, needAttr: false}, {id: $style_no_arr}, null, null);
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || 'TgDictApi: error');
		}

		$product_row.designer = {
			id: $product_row.createdBy,
			name: $designer_rows[$product_row.createdBy] && $designer_rows[$product_row.createdBy].name ? $designer_rows[$product_row.createdBy].name : '',
			avatar: $designer_rows[$product_row.createdBy] && $designer_rows[$product_row.createdBy].avatar ? $designer_rows[$product_row.createdBy].avatar : ''
		};

		$product_row.cat = {
			id: $product_row.catId,
			name: _.size($product_dict.cat) && _.size($product_dict.cat[$product_row.catId]) && $product_dict.cat[$product_row.catId].name || ''
		};

		$product_row.style = {
			id: $product_row.styleNo,
			name: _.size($product_dict.style) && _.size($product_dict.style[$product_row.styleNo]) && $product_dict.style[$product_row.styleNo].name || ''
		};

		try{ $product_row.photoRender = JSON.parse($product_row.photoRender); } catch(e) { $product_row.photoRender = []; }
		try{ $product_row.photoCad = JSON.parse($product_row.photoCad); } catch(e) { $product_row.photoCad = []; }
		try{ $product_row.dimension = JSON.parse($product_row.dimension); } catch(e) { $product_row.dimension = []; }
		try{ $product_row.photoSize = JSON.parse($product_row.photoSize); } catch(e) { $product_row.photoSize = []; }
		try{ $product_row.photoStory = JSON.parse($product_row.photoStory); } catch(e) { $product_row.photoStory = []; }

		$product_row.trans_stat  = _.size($trans_row) && $trans_row.stat || '';
		$product_row.contract_no = _.size($trans_row) && $trans_row.contractNo || '';

		let $design_spu_attr_rows = await DesignProductAttr.find({
			designCompId    : $product_row.createdByCompId,
			designProductNo : $product_row.id
		});
		$design_spu_attr_rows = cutil.indexTabByCol($design_spu_attr_rows, 'nameNo', 'valueNo');

		let $ret = $product_row;
		$ret.attr = [];
		_.each($design_spu_attr_rows, function($attr_rows, $attr_name_no) {
			let $attr = {};
			$attr.name = $attr_name_no;
			$attr.values = _.keys($attr_rows);
			$ret.attr.push($attr);
		});

		$ret.accessory = [];
		_.each($acc_product_rows, function($row) {
			let $acc_row = {};

			$acc_row.id          = $row.id;
			$acc_row.name        = $row.name;
			$acc_row.dimension   = $row.dimension;
			$acc_row.photo_size  = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;

			try{ $acc_row.dimension   = $acc_row.dimension ? JSON.parse($acc_row.dimension) : []; } catch(e) { $acc_row.dimension = []; }
			try{ $acc_row.photo_size  = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }


			$ret.accessory.push($acc_row);
		});
	
		return res.jsonok(cutil.snakeCaseObject($ret));
	},

	detailSet: async function(req, res) {
		let $id = cutil.getReq(req, 'id');
		if(!$id.length) return res.jsonerr('套系不存在');
	
		let $set_row = await ProductSet.findOne($id);
		if(!_.size($set_row)) return res.jsonerr('套系不存在');

        let $trans_row = await Transaction.getValidTransactionsByProductNos([$id], ['productNo', 'stat', 'buyByCompId', 'contractNo', 'orderNo']);
		$trans_row = cutil.indexTabByCol($trans_row, 'productNo');
		$trans_row = $trans_row && $trans_row[$id] || {};

        let $designer_ids = [$set_row.createdBy];
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers($designer_ids, ['id', 'name', 'avatar', 'compId']);
        }

		let $sub_set_rows = await ProductSet.find({
			pid: $set_row.id
		});
		let $sub_set_ids = cutil.getTabCol($sub_set_rows, 'id');
		$sub_set_ids[$set_row.id] = $set_row.id;
		let $product_rows = await DesignProduct.find({
			where: {
				setNo                 : _.values($sub_set_ids),
				designParentProductNo : '-'
			},
			select: ['id', 'name', 'photoRender', 'setNo', 'catId']
		});

		let $cat_ids_arr = cutil.getTabCol($product_rows, 'catId');
		$cat_ids_arr = _.values($cat_ids_arr).filter(v => (_.isString(v) && v.trim().length));
		let $style_no_arr = _.isString($set_row.styleNo) && $set_row.styleNo.trim().length ? [$set_row.styleNo] : [];
		let $tg_dict_api = new TGDictApi(req);
		let $product_dict = {};
		try {
			$product_dict = await $tg_dict_api.getDicts({id: $cat_ids_arr, needAttr: false}, {id: $style_no_arr}, null, null);
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || 'TgDictApi: error');
		}


		$product_rows = cutil.indexTabByCol($product_rows, 'setNo', 'id');
		_.each($product_rows, $set_product_rows => {
			_.each($set_product_rows, $product_row => {
				try { $product_row.photo_render =  JSON.parse($product_row.photoRender); } catch($e) { $product_row.photo_render = []; }
				$product_row.cat = {
					id: $product_row.catId,
					name: _.size($product_dict.cat) && _.size($product_dict.cat[$product_row.catId]) && $product_dict.cat[$product_row.catId].name || ''
				};
			});
		});

		$set_row.sub_set_rows = [];
		_.each($sub_set_rows, $sub_set_row => {
			$set_row.sub_set_rows.push({
				id           : $sub_set_row.id,
				name         : $sub_set_row.name,
				order_no     : $sub_set_row.orderNo,
				product_rows : _.size($product_rows) && _.size($product_rows[$sub_set_row.id]) ? _.values($product_rows[$sub_set_row.id]) : []
			});
		});
		$set_row.sub_set_rows.sort((a, b) => (a.order_no - b.order_no));
		$set_row.product_rows = _.size($product_rows) && _.size($product_rows[$set_row.id]) ? _.values($product_rows[$set_row.id]) : [];

		$set_row.designer = {
			id: $set_row.createdBy,
			name: $designer_rows[$set_row.createdBy] && $designer_rows[$set_row.createdBy].name ? $designer_rows[$set_row.createdBy].name : '',
			avatar: $designer_rows[$set_row.createdBy] && $designer_rows[$set_row.createdBy].avatar ? $designer_rows[$set_row.createdBy].avatar : ''
		};

		$set_row.style = {
			id: $set_row.styleNo,
			name: _.size($product_dict.style) && _.size($product_dict.style[$set_row.styleNo]) && $product_dict.style[$set_row.styleNo].name || ''
		};

		try{ $set_row.photos = JSON.parse($set_row.photos); } catch(e) { $set_row.photos = []; }

		$set_row.trans_stat  = _.size($trans_row) && $trans_row.stat || '';
		$set_row.contract_no = _.size($trans_row) && $trans_row.contractNo || '';
	
		return res.jsonok(cutil.snakeCaseObject($set_row));
	},

	listDesignProductOrder: async function(req, res) {
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			saleByCompId : req.me.compId
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $stat = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('stat'))) $stat = req.param('stat').filter(v => (v = parseInt(v) && !isNaN(v)));
		if(_.size($style_nos)) $where.styleNo = $style_nos;
		if(_.size($stat)) $where.stat = $stat;

		let $order_by = [{}];
		let $sort_by = 'createdAt';
		let $sort_order = 'DESC';
		if(cutil.getReq(req, 'sort_by') == 'price') $sort_by = 'amount';
		if(cutil.getReq(req, 'sort_order')) $sort_order = 'ASC';
		$order_by[0][$sort_by] = $sort_order;

		let $n_trans_rows = await Transaction.count({
			where: $where,
		});
	
		if(!$n_trans_rows) return res.jsonok({total: 0, list: []});

		let $trans_rows = await Transaction.find({
			where : $where,
			sort  : $order_by,
			skip  : $start,
			limit : $pagesize
		});

		let $order_info_rows = {};
		let $order_no_arr = cutil.getTabCol($trans_rows, 'orderNo');
		$order_no_arr = _.size($order_no_arr) ? _.values($order_no_arr) : [];
		if(_.size($order_no_arr)) {
			try {
				let $trans_api = new TransApi(req);
				$order_info_rows = await $trans_api.getMultiOrder($order_no_arr);
				$order_info_rows = _.size($order_info_rows) && $order_info_rows.rows ? $order_info_rows.rows : [];
				let $tmp = {};
				_.each($order_info_rows, function($order_info) {
					$tmp[$order_info.bizOrderId] = $order_info;
				});
				$order_info_rows = $tmp;
			} catch($e) {
				return res.jsonerr($e.message || 'TransApi: error');
			}
		}
	
		let $ret = [];

		_.each($trans_rows, $trans_row => {
			try { $trans_row.productInfo = JSON.parse($trans_row.productInfo); } catch($e) { $trans_row.productInfo = {}; }
			$ret.push({
				id           : $trans_row.productInfo.id,
				order_no     : $trans_row.orderNo,
				contract_no  : $trans_row.contractNo,
				product_type : $trans_row.productType,
				name         : $trans_row.productInfo.name,
				photo_render : cutil.defined($trans_row.productInfo.photoRender) ? $trans_row.productInfo.photoRender : null,
				photos       : cutil.defined($trans_row.productInfo.photos) ? $trans_row.productInfo.photos : null,
				cat          : cutil.defined($trans_row.productInfo.cat) ? $trans_row.productInfo.cat : null,
				style        : $trans_row.productInfo.style,
				designer     : $trans_row.productInfo.designer,
				design_comp  : $trans_row.productInfo.design_comp,
				price        : $trans_row.amount,
				trans_stat   : $trans_row.stat,
				created_at   : $trans_row.createdAt,
				tradeOrder   : $order_info_rows[$trans_row.id] || null
			});
		});

		return res.jsonok({total: $n_trans_rows, list: $ret});
	},
};

