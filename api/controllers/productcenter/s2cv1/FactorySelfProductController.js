
const moment = require('moment');
const flaverr = require('flaverr');
const {validator, sanitizer} = require('indicative');
const validate = validator.validate;
const sanitize = sanitizer.sanitize;

module.exports = {
    addSelfProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		try {
			await validate(req.allParams(), {
				name: 'required|string|accepted',
			}, {
				'name': '请填写商品名称'
			});
		} catch($e) {
			return res.jsonerr($e.map(v => (v.message)));
		}

        let set = {};
		//set = sanitize(req.allParams(), {
		//	name: 'strip_tags'
		//});

        set.name = cutil.getReq(req, 'name') || '';
        set.sname = cutil.getReq(req, 'sname') || set.name;
        //set.setNo = cutil.getReq(req, 'set_no') || '';
        set.customCatNo = cutil.getReq(req, 'custom_cat_no') || '';
        set.styleNo = cutil.getReq(req, 'style_no') || '';
        set.catId = parseInt(cutil.getReq(req, 'cat_id')) || 0;
		if(set.name.length < 1) return res.jsonerr('请填写商品名称');

		//if(set.setNo.length) {
		//	var $set_row = await ProductSet.findOne(set.setNo);
		//	if(!$set_row || !_.size($set_row)) return res.jsonerr('选择的商品套系不存在');
		//	if(parseInt($set_row.priceType) != CONST.PRODUCT_PRICE_TYPE_PRICE) return res.jsonerr('套系和商品类型不匹配');
		//}

        set.moduleNo = cutil.getReq(req, 'module_no') || '';
		if(!_.size(set.moduleNo)) return res.jsonerr('请填写型号');
		if(await FactoryProduct.count({
			factoryCompId: $comp_row.id,
			moduleNo: set.moduleNo
		})) return res.jsonerr('型号 ' + set.moduleNo + ' 不能重复');


        if(typeof req.param('photo_render') != 'undefined') {
			var photoRender = [];
			try {
				photoRender = cutil.getReqPhoto(req, 'photo_render');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoRender = photoRender;
        }

        if(typeof req.param('video') != 'undefined') {
			var video = [];
			try {
				video = cutil.getReqPhoto(req, 'video');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.video = video;
        }

		set.videoThumb = cutil.getReq(req, 'video_thumb'); 

        if(typeof req.param('photo_cad') != 'undefined') {
			var photoCad = [];
			try {
				photoCad = cutil.getReqPhoto(req, 'photo_cad');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoCad = photoCad;
        }

        set.designIdea = cutil.getReq(req, 'design_idea') || '';

        set.intro = cutil.getReq(req, 'intro') || '';
        if(typeof req.param('dimension') != 'undefined') {
			let $dimension = req.param('dimension');
			if(_.isArray($dimension)) set.dimension = $dimension;
        }

        if(typeof req.param('photo_size') != 'undefined') {
			var photoSize = [];
			try {
				photoSize = cutil.getReqPhoto(req, 'photo_size');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoSize = photoSize;
        }

        if(typeof req.param('photo_story') != 'undefined') {
			var photoStory = [];
			try {
				photoStory = cutil.getReqPhoto(req, 'photo_story');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoStory = photoStory;
        }

		set.factoryParentProductNo = '-';
        set.priceType              = CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF;
        set.price                  = 0;
        set.pricePercent           = 0;

		set.stat            = CONST.PRODUCT_STAT_BANED;
		set.marketPublish   = CONST.PRODUCT_MARMET_STAT_BAND;
		set.salebookPublish = CONST.PRODUCT_MARMET_STAT_BAND;

        set.designerUserId = set.factoryUserId = req.me.id;
        set.designerCompId = set.factoryCompId = req.me.compId;

		if(set.photoRender) set.photoRender = JSON.stringify(set.photoRender);
		if(set.video) set.video = JSON.stringify(set.video);
		if(set.photoCad) set.photoCad = JSON.stringify(set.photoCad);
		if(set.dimension) set.dimension = JSON.stringify(set.dimension);
		if(set.photoSize) set.photoSize = JSON.stringify(set.photoSize);
		if(set.photoStory) set.photoStory = JSON.stringify(set.photoStory);

		var acc_sets = [];
		if(req.param('accessory')) {
			var accessory = req.param('accessory');
			if(!accessory || !_.isArray(accessory)) return res.jsonerr('附件参数不是一个数组');

			try {
				_.each(accessory, function(acc) {
					var acc_set = {};
					acc_set.name = acc.name && acc.name.toString().trim() || '';
					if(acc_set.name.length < 1) throw '请输入附件名称';

					acc_set.sname = acc.sname && acc.sname.toString().trim() || acc_set.name;

					acc_set.intro = acc.intro && acc.intro.toString().trim() || '';
					if(typeof acc.dimension != 'undefined') {
						let $dimension = acc.dimension;
						if(_.isArray($dimension)) acc_set.dimension = $dimension;
					}

					if(typeof acc.photo_size != 'undefined') {
						var photoSize = [];
						try {
							photoSize = cutil.getReqPhoto(req, null, acc.photo_size);
						} catch(e) {
							return res.jsonerr(e.toString());
						}
						acc_set.photoSize = photoSize;
					}

					if(typeof acc.photo_story != 'undefined') {
						var photoStory = [];
						try {
							photoStory = cutil.getReqPhoto(req, null, acc.photo_story);
						} catch(e) {
							return res.jsonerr(e.toString());
						}
						acc_set.photoStory = photoStory;
					}

					//附件spu型号可以为空
					acc_set.moduleNo = acc.module_no || '';
					acc_sets.push(acc_set);
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
							factoryCompId    : $comp_row.id,
							factoryProductNo : '',
							nameNo          : $attr.name,
							valueNo         : $attr_val
						});
					});
				}
			});
		}

		var $mes_spu = [];
		let $event_add_spu = [];
		let $product_row;
        try {
			$product_row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					var productNo;
					try{
						productNo = await FactoryProduct.genUUID(db);
					} catch($e) {
						throw new Error('生成商品UUID失败');
					}
					set.id = productNo;
					$mes_spu.push(set.id);

					var productSN;
					try{
						productSN = await FactoryProduct.genSN(req.me.compId, db);
					} catch($e) {
						throw new Error('生成商品编码失败');
					}
					set.factoryProductSN = productSN;

					var $product_row = await FactoryProduct.create(set).fetch().usingConnection(db);
					$event_add_spu.push($product_row);

					if(_.size($add_spu_attr_set)) {
						_.each($add_spu_attr_set, function($attr) {
							$attr.factoryProductNo = $product_row.id;
						});
						await FactoryProductAttr.createEach($add_spu_attr_set);
					}


					if(_.size(acc_sets)) {
						var productNo, productSN;
						let $acc_ids = [];
						for(var acc_set_idx in acc_sets) {
							var acc_set = acc_sets[acc_set_idx];
							try{
								productNo = await FactoryProduct.genUUID(db);
							} catch($e) {
								throw new Error('生成商品UUID失败');
							}
							acc_set.id = productNo;
							$mes_spu.push(acc_set.id);
							$acc_ids.push(acc_set.id);

							try{
								productSN = await FactoryProduct.genSN(req.me.compId, db);
							} catch($e) {
								throw new Error('生成商品编码失败');
							}
							acc_set.factoryProductSN = productSN;

							acc_set.factoryParentProductNo = $product_row.id;
							//acc_set.setNo = typeof set.setNo != 'undefined' ? set.setNo : $product_row.setNo;
							acc_set.customCatNo = typeof set.customCatNo != 'undefined' ? set.customCatNo : $product_row.customCatNo;
							acc_set.styleNo = typeof set.styleNo != 'undefined' ? set.styleNo : $product_row.styleNo;
							acc_set.catId = typeof set.catId != 'undefined' ? set.catId : $product_row.catId;
							acc_set.photoRender = typeof set.photoRender != 'undefined' ? set.photoRender : $product_row.photoRender;
							acc_set.video = typeof set.video != 'undefined' ? set.video : $product_row.video;
							acc_set.videoThumb = typeof set.videoThumb != 'undefined' ? set.videoThumb : $product_row.videoThumb;
							acc_set.photoCad = typeof set.photoCad != 'undefined' ? set.photoCad : $product_row.photoCad;
							acc_set.designIdea = typeof set.designIdea != 'undefined' ? set.designIdea : $product_row.designIdea;
							acc_set.priceType = typeof set.priceType != 'undefined' ? set.priceType : $product_row.priceType;
							acc_set.price = typeof set.price != 'undefined' ? set.price : $product_row.price;
							acc_set.pricePercent = typeof set.pricePercent != 'undefined' ? set.pricePercent : $product_row.pricePercent;

							acc_set.stat                = $product_row.stat;
							acc_set.publishedAt         = $product_row.publishedAt;
							acc_set.marketPublish       = $product_row.marketPublish;
							acc_set.marketPublishedAt   = $product_row.marketPublishedAt;
							acc_set.salebookPublish     = $product_row.salebookPublish;
							acc_set.salebookPublishedAt = $product_row.salebookPublishedAt;

							acc_set.designerUserId = acc_set.factoryUserId = req.me.id;
							acc_set.designerCompId = acc_set.factoryCompId = req.me.compId;

							if(acc_set.dimension) acc_set.dimension = JSON.stringify(acc_set.dimension);
							if(acc_set.photoSize) acc_set.photoSize = JSON.stringify(acc_set.photoSize);
							if(acc_set.photoStory) acc_set.photoStory = JSON.stringify(acc_set.photoStory);
						}

						let $acc_rows = await FactoryProduct.createEach(acc_sets).fetch().usingConnection(db);
						$event_add_spu = $event_add_spu.concat($acc_rows);
					}

					return proceed(undefined, $product_row);
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			if($mes_spu && _.size($mes_spu)) {
				for(var $mes_idx in $mes_spu) {
					var $mes_id = $mes_spu[$mes_idx];
					await FactoryProduct.addSpuToMes($mes_id);
				}
			}
		} catch($e) {
			sails.log.error($e);
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
		}

		return res.jsonok({
			"product_no": $product_row.id
		});
    },

	updateSelfProduct: async function(req, res) {
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

        var set = {};
		if(typeof req.param('name') != 'undefined') {
			set.name = cutil.getReq(req, 'name');
			if(set.name.length < 1) return res.jsonerr('请填写商品名称');
		}
			
		if(typeof req.param('sname') != 'undefined' && cutil.getReq(req, 'sname').length) {
			set.sname = cutil.getReq(req, 'sname');
		}	

        //if(typeof req.param('set_no') != 'undefined') {
		//	set.setNo = cutil.getReq(req, 'set_no');

		//	if(set.setNo) {
		//		var $set_row = await ProductSet.findOne(set.setNo);
		//		if(!$set_row || !_.size($set_row)) return res.jsonerr('选择的套系不存在');
		//		if(parseInt($set_row.priceType) != CONST.PRODUCT_PRICE_TYPE_PRICE) return res.jsonerr('套系和商品类型不匹配');
		//	}
		//}

        if(typeof req.param('custom_cat_no') != 'undefined') {
			set.customCatNo = cutil.getReq(req, 'custom_cat_no');
		}


        if(typeof req.param('style_no') != 'undefined') {
			set.styleNo = cutil.getReq(req, 'style_no');
			if(set.styleNo.length < 1) return res.jsonerr('请选择商品风格');
		}

        if(typeof req.param('module_no') != 'undefined') {
			set.moduleNo = cutil.getReq(req, 'module_no');
			if(!_.size(set.moduleNo)) return res.jsonerr('请填写型号');
			if(await FactoryProduct.count({
				factoryCompId: $comp_row.id,
				moduleNo: set.moduleNo,
				id: {
					'!=': $product_id
				}
			})) return res.jsonerr('型号 ' + set.moduleNo + ' 不能重复');
		}

        if(typeof req.param('cat_id') != 'undefined') {
			set.catId = parseInt(cutil.getReq(req, 'cat_id'));
			if(!set.catId) return res.jsonerr('请选择商品类目');
		}

        if(typeof req.param('photo_render') != 'undefined') {
			var photoRender = [];
			try {
				photoRender = cutil.getReqPhoto(req, 'photo_render');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoRender = photoRender;
        }

        if(typeof req.param('video') != 'undefined') {
			var video = [];
			try {
				video = cutil.getReqPhoto(req, 'video');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.video = video;
        }

		set.videoThumb = cutil.getReq(req, 'video_thumb'); 


        if(typeof req.param('photo_cad') != 'undefined') {
			var photoCad = [];
			try {
				photoCad = cutil.getReqPhoto(req, 'photo_cad');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoCad = photoCad;
        }

		if(typeof req.param('design_idea') != 'undefined') {
			set.designIdea = cutil.getReq(req, 'design_idea');
		}

        set.intro = cutil.getReq(req, 'intro') || '';
        if(typeof req.param('dimension') != 'undefined') {
			let $dimension = req.param('dimension');
			if(_.isArray($dimension)) set.dimension = $dimension;
        }

        if(typeof req.param('photo_size') != 'undefined') {
			var photoSize = [];
			try {
				photoSize = cutil.getReqPhoto(req, 'photo_size');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoSize = photoSize;
        }

        if(typeof req.param('photo_story') != 'undefined') {
			var photoStory = [];
			try {
				photoStory = cutil.getReqPhoto(req, 'photo_story');
			} catch(e) {
				return res.jsonerr(e.toString());
			}
			set.photoStory = photoStory;
        }

        set.designerUserId = set.factoryUserId = req.me.id;
        set.designerCompId = set.factoryCompId = req.me.compId;

		if(set.photoRender) set.photoRender = JSON.stringify(set.photoRender);
		if(set.video) set.video = JSON.stringify(set.video);
		if(set.photoCad) set.photoCad = JSON.stringify(set.photoCad);
		if(set.dimension) set.dimension = JSON.stringify(set.dimension);
		if(set.photoSize) set.photoSize = JSON.stringify(set.photoSize);
		if(set.photoStory) set.photoStory = JSON.stringify(set.photoStory);

		var $acc_create_sets = [], $acc_update_sets = [];
		if(req.param('accessory')) {
			var accessory = req.param('accessory');
			if(!accessory || !_.isArray(accessory)) return res.jsonerr('附件参数不是一个数组');

			try {
				_.each(accessory, function(acc) {
					var acc_set = {};
					acc_set.id = acc.id || '';

					acc_set.name = acc.name && acc.name.toString().trim() || '';
					if(acc_set.name.length < 1) throw '请输入附件名称';

					acc_set.sname = acc.sname && acc.sname.toString().trim() || acc_set.name;

					if(parseInt(acc.stat) == CONST.PRODUCT_STAT_DELETED) {
						acc_set.stat = CONST.PRODUCT_STAT_DELETED;
						acc_set.delAt = moment().valueOf();
					} else acc_set.stat = $product_row.stat;

					acc_set.intro = acc.intro && acc.intro.toString().trim() || '';
					if(typeof acc.dimension != 'undefined') {
						let $dimension = acc.dimension;
						if(_.isArray($dimension)) acc_set.dimension = $dimension;
					}

					if(typeof acc.photo_size != 'undefined') {
						var photoSize = [];
						try {
							photoSize = cutil.getReqPhoto(req, null, acc.photo_size);
						} catch(e) {
							return res.jsonerr(e.toString());
						}
						acc_set.photoSize = photoSize;
					}

					if(typeof acc.photo_story != 'undefined') {
						var photoStory = [];
						try {
							photoStory = cutil.getReqPhoto(req, null, acc.photo_story);
						} catch(e) {
							return res.jsonerr(e.toString());
						}
						acc_set.photoStory = photoStory;
					}

					if(typeof acc.module_no != 'undefined') {
						acc_set.moduleNo = acc.module_no;
					}

					if(acc_set.id) {
						$acc_update_sets.push(acc_set);
					} else {
						$acc_create_sets.push(acc_set);
					}

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
							factoryCompId    : $comp_row.id,
							factoryProductNo : '',
							nameNo          : $attr.name,
							valueNo         : $attr_val
						});
					});
				}
			});
		}

		var $mes_create_ids = [], $mes_update_ids = [], $mes_del_ids = [];
		let $event_update_spu = [], $event_add_spu = [];
        try {
			var $product_row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					if(_.size(set)) {
						$product_row = await FactoryProduct.update($product_row.id).set(set).fetch().usingConnection(db);
						$product_row = _.size($product_row) && $product_row[0] || null;
						$event_update_spu.push($product_row);
						$mes_update_ids.push($product_row.id);
					}

					await FactoryProductAttr.destroy({
						factoryCompId    : $comp_row.id,
						factoryProductNo : $product_row.id
					});
					if(_.size($add_spu_attr_set)) {
						_.each($add_spu_attr_set, function($attr) {
							$attr.factoryProductNo = $product_row.id;
						});
						await FactoryProductAttr.createEach($add_spu_attr_set);
					}

					if(_.size($acc_update_sets)) {
						var productSN;
						for(var acc_set_idx in $acc_update_sets) {
							var acc_set = $acc_update_sets[acc_set_idx];

							if(!acc_set.productSN) {
								try{
									productSN = await FactoryProduct.genSN(set.createdByCompId, db);
								} catch($e) {
									throw new Error('生成商品编码失败');
								}
								acc_set.factoryProductSN = productSN;
							}

							acc_set.factoryParentProductNo = $product_row.id;
							//acc_set.setNo = typeof set.setNo != 'undefined' ? set.setNo : $product_row.setNo;
							acc_set.customCatNo = typeof set.customCatNo != 'undefined' ? set.customCatNo : $product_row.customCatNo;
							acc_set.styleNo = typeof set.styleNo != 'undefined' ? set.styleNo : $product_row.styleNo;
							acc_set.catId = typeof set.catId != 'undefined' ? set.catId : $product_row.catId;
							acc_set.photoRender = typeof set.photoRender != 'undefined' ? set.photoRender : $product_row.photoRender;
							acc_set.video = typeof set.video != 'undefined' ? set.video : $product_row.video;
							acc_set.videoThumb = typeof set.videoThumb != 'undefined' ? set.videoThumb : $product_row.videoThumb;
							acc_set.photoCad = typeof set.photoCad != 'undefined' ? set.photoCad : $product_row.photoCad;
							acc_set.designIdea = typeof set.designIdea != 'undefined' ? set.designIdea : $product_row.designIdea;
							acc_set.priceType = typeof set.priceType != 'undefined' ? set.priceType : $product_row.priceType;
							acc_set.price = typeof set.price != 'undefined' ? set.price : $product_row.price;
							acc_set.pricePercent = typeof set.pricePercent != 'undefined' ? set.pricePercent : $product_row.pricePercent;

							acc_set.publishedAt         = $product_row.publishedAt;
							acc_set.marketPublish       = $product_row.marketPublish;
							acc_set.marketPublishedAt   = $product_row.marketPublishedAt;
							acc_set.salebookPublish     = $product_row.salebookPublish;
							acc_set.salebookPublishedAt = $product_row.salebookPublishedAt;

							acc_set.designerUserId = acc_set.factoryUserId = req.me.id;
							acc_set.designerCompId = acc_set.factoryCompId = req.me.compId;

							if(acc_set.dimension) acc_set.dimension = JSON.stringify(acc_set.dimension);
							if(acc_set.photoSize) acc_set.photoSize = JSON.stringify(acc_set.photoSize);
							if(acc_set.photoStory) acc_set.photoStory = JSON.stringify(acc_set.photoStory);

							var $acc_id = acc_set.id;

							if(acc_set.stat == CONST.PRODUCT_STAT_DELETED)
								$mes_del_ids.push($acc_id);
							else
								$mes_update_ids.push($acc_id);

							delete acc_set.id;
							let $accrow = await FactoryProduct.update($acc_id).set(acc_set).fetch().usingConnection(db);
							$accrow = _.size($accrow) && $accrow[0] || null;
							$event_update_spu = $event_update_spu.concat($accrow);
						}
					}

					if(_.size($acc_create_sets)) {
						var productNo, productSN;
						for(var acc_set_idx in $acc_create_sets) {
							var acc_set = $acc_create_sets[acc_set_idx];

							try{
								productNo = await FactoryProduct.genUUID(db);
							} catch($e) {
								throw new Error('生成商品UUID失败');
							}
							acc_set.id = productNo;
							$mes_create_ids.push(acc_set.id);

							if(!acc_set.productSN) {
								try{
									productSN = await FactoryProduct.genSN(set.createdByCompId, db);
								} catch($e) {
									throw new Error('生成商品编码失败');
								}
								acc_set.factoryProductSN = productSN;
							}

							acc_set.factoryParentProductNo = $product_row.id;
							//acc_set.setNo = typeof set.setNo != 'undefined' ? set.setNo : $product_row.setNo;
							acc_set.customCatNo = typeof set.customCatNo != 'undefined' ? set.customCatNo : $product_row.customCatNo;
							acc_set.styleNo = typeof set.styleNo != 'undefined' ? set.styleNo : $product_row.styleNo;
							acc_set.catId = typeof set.catId != 'undefined' ? set.catId : $product_row.catId;
							acc_set.photoRender = typeof set.photoRender != 'undefined' ? set.photoRender : $product_row.photoRender;
							acc_set.video = typeof set.video != 'undefined' ? set.video : $product_row.video;
							acc_set.videoThumb = typeof set.videoThumb != 'undefined' ? set.videoThumb : $product_row.videoThumb;
							acc_set.photoCad = typeof set.photoCad != 'undefined' ? set.photoCad : $product_row.photoCad;
							acc_set.designIdea = typeof set.designIdea != 'undefined' ? set.designIdea : $product_row.designIdea;
							acc_set.priceType = typeof set.priceType != 'undefined' ? set.priceType : $product_row.priceType;
							acc_set.price = typeof set.price != 'undefined' ? set.price : $product_row.price;
							acc_set.pricePercent = typeof set.pricePercent != 'undefined' ? set.pricePercent : $product_row.pricePercent;

							acc_set.publishedAt         = $product_row.publishedAt;
							acc_set.marketPublish       = $product_row.marketPublish;
							acc_set.marketPublishedAt   = $product_row.marketPublishedAt;
							acc_set.salebookPublish     = $product_row.salebookPublish;
							acc_set.salebookPublishedAt = $product_row.salebookPublishedAt;

							acc_set.designerUserId = acc_set.factoryUserId = req.me.id;
							acc_set.designerCompId = acc_set.factoryCompId = req.me.compId;

							if(acc_set.dimension) acc_set.dimension = JSON.stringify(acc_set.dimension);
							if(acc_set.photoSize) acc_set.photoSize = JSON.stringify(acc_set.photoSize);
							if(acc_set.photoStory) acc_set.photoStory = JSON.stringify(acc_set.photoStory);
						}

						let $acc_rows = await FactoryProduct.createEach($acc_create_sets).fetch().usingConnection(db);
						$event_add_spu = _.size($acc_rows) ? $acc_rows : [];
					}

					return proceed(undefined, $product_row);
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			if($mes_create_ids && _.size($mes_create_ids)) {
				for(var $mes_idx in $mes_create_ids) {
					var $mes_id = $mes_create_ids[$mes_idx];
					await FactoryProduct.addSpuToMes($mes_id);
				}
			}

			if($mes_update_ids && _.size($mes_update_ids)) {
				for(var $mes_idx in $mes_update_ids) {
					var $mes_id = $mes_update_ids[$mes_idx];
					await FactoryProduct.updateSpuToMes($mes_id);
				}
			}

			if($mes_del_ids && _.size($mes_del_ids)) {
				for(var $mes_idx in $mes_del_ids) {
					var $mes_id = $mes_del_ids[$mes_idx];
					await FactoryProduct.delSpuToMes($mes_id);
				}
			}
		} catch($e) {
			sails.log.error($e);
		}

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_spu in $event_update_spu) {
				let $spu_row = $event_update_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuUpdate, {id: $spu_row.id});
			}
			for(let $_idx_spu in $event_add_spu) {
				let $spu_row = $event_add_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuAdd, {id: $spu_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		} 

		return res.jsonok('ok');
    },

	multiUpdateSelfProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		let $update_set_rows = {};
		let $id_err = false;
		if(_.isArray(req.param('rows'))) {
			_.each(req.param('rows'), $row => {
				let $id = $row.id || '';
				$id = $id.trim();
				if(!$id.length) {
					$id_err = true;
					return false
				}

				$update_set_rows[$id] = {
					id: $id
				};
				if(cutil.defined($row.custom_cat_no)) $update_set_rows[$id].customCatNo = _.isString($row.custom_cat_no) ? $row.custom_cat_no.trim() : '';
			});
		}

		if($id_err) return res.jsonerr('id不能为空');
		if(!$update_set_rows) return res.jsonerr('没有记录需要修改');

		let $old_rows = await FactoryProduct.find({
			where: {
				id            : _.keys($update_set_rows),
				factoryCompId : req.me.compId
			},
			select: ['id']
		});
		if(!$old_rows) return res.jsonerr('没有记录需要修改');
	
		$old_rows = cutil.indexTabByCol($old_rows, 'id');
		$update_set_rows = _.values($update_set_rows);
		$update_set_rows = $update_set_rows.filter($row => (_.size($old_rows[$row.id])));
		if(!$update_set_rows) return res.jsonerr('没有记录需要修改');

		try {
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					for(let $row of $update_set_rows) {
						let $id = $row.id;
						delete $row.id;
						await FactoryProduct.update($id).set($row).usingConnection(db);
					}

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		return res.jsonok('ok');
	},

	toggleMarketSelfProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        let $product_id = cutil.getReq(req, 'product_no');
		if(!$product_id) return res.jsonerr('商品不存在');

		let $product_row = await FactoryProduct.findOne($product_id);
		if(!_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.factoryCompId != req.me.compId) return res.jsonerr('商品不属于该企业');

		let $set = {};
        let $stat = parseInt(cutil.getReq(req, 'stat'));
		let $tm = moment().valueOf();
		if($stat == CONST.PRODUCT_MARMET_STAT_PUBLISHED) {
			$set.marketPublish     = CONST.PRODUCT_MARMET_STAT_PUBLISHED;
			$set.marketPublishedAt = $tm;

			$set.stat                = CONST.PRODUCT_STAT_PUBLISHED;
			$set.publishedAt         = $tm;
		} else {
			$set.marketPublish = CONST.PRODUCT_MARMET_STAT_BAND;
			$set.marketBanAt   = $tm;

			if($product_row.salebookPublish == CONST.PRODUCT_MARMET_STAT_PUBLISHED) {
				$set.stat = CONST.PRODUCT_STAT_PUBLISHED;
			} else {
				$set.stat  = CONST.PRODUCT_STAT_BANED;
				$set.banAt = $tm;
			}
		}

		if($set.stat == CONST.PRODUCT_MARMET_STAT_PUBLISHED) {
			try {
				if(!$product_row.name || $product_row.name.length < 1) throw '请填写商品名称';
				if(!$product_row.styleNo || $product_row.styleNo.length < 1) throw '请选择商品风格';
				if(!$product_row.catId) throw '请选择商品类目';

				if(!$product_row.photoRender || _.size($product_row.photoRender) < 1) throw '请上传3D单品渲染图'; 

				let $n_product_sku_rows = await FactoryProductSku.count({
					factoryProductNo: $product_row.id,
					stat: CONST.PRODUCT_SKU_STAT_ENABLED
				});
				if(!$n_product_sku_rows || !parseInt($n_product_sku_rows)) throw '请填写阶梯价格';
			} catch($e) {
				return res.jsonerr($e.toString());
			}
		}

		let $event_update_spu = [];
        try {
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					let $spu_rows = await FactoryProduct.update($product_id).set($set).fetch().usingConnection(db);
					$event_update_spu = _.size($spu_rows) ? $spu_rows : [];

					$spu_rows = await FactoryProduct.update({
						factoryParentProductNo: $product_id,
						stat: {
							'!=': CONST.PRODUCT_STAT_DELETED
						}
					}).set($set).fetch().usingConnection(db);
					$event_update_spu = $event_update_spu.concat(_.size($spu_rows) ? $spu_rows : []);

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_spu in $event_update_spu) {
				let $spu_row = $event_update_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuUpdate, {id: $spu_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	toggleSalebookSelfProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        let $product_id = cutil.getReq(req, 'product_no');
		if(!$product_id) return res.jsonerr('商品不存在');

		let $product_row = await FactoryProduct.findOne($product_id);
		if(!_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.factoryCompId != req.me.compId) return res.jsonerr('商品不属于该企业');

		let $set = {};
        let $stat = parseInt(cutil.getReq(req, 'stat'));
		let $tm = moment().valueOf();
		if($stat == CONST.PRODUCT_MARMET_STAT_PUBLISHED) {
			$set.salebookPublish     = CONST.PRODUCT_MARMET_STAT_PUBLISHED;
			$set.salebookPublishedAt = $tm;

			$set.stat                = CONST.PRODUCT_STAT_PUBLISHED;
			$set.publishedAt         = $tm;
		} else {
			$set.salebookPublish = CONST.PRODUCT_MARMET_STAT_BAND;
			$set.salebookBanAt   = $tm;

			if($product_row.marketPublish == CONST.PRODUCT_MARMET_STAT_PUBLISHED) {
				$set.stat = CONST.PRODUCT_STAT_PUBLISHED;
			} else {
				$set.stat  = CONST.PRODUCT_STAT_BANED;
				$set.banAt = $tm;
			}
		}

		if($set.stat == CONST.PRODUCT_MARMET_STAT_PUBLISHED) {
			try {
				if(!$product_row.name || $product_row.name.length < 1) throw '请填写商品名称';
				if(!$product_row.styleNo || $product_row.styleNo.length < 1) throw '请选择商品风格';
				if(!$product_row.catId) throw '请选择商品类目';

				if(!$product_row.photoRender || _.size($product_row.photoRender) < 1) throw '请上传3D单品渲染图'; 

				let $n_product_sku_rows = await FactoryProductSku.count({
					factoryProductNo: $product_row.id,
					stat: CONST.PRODUCT_SKU_STAT_ENABLED
				});
				if(!$n_product_sku_rows || !parseInt($n_product_sku_rows)) throw '请填写阶梯价格';
			} catch($e) {
				return res.jsonerr($e.toString());
			}
		}

		let $event_update_spu = [];
        try {
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					let $spu_rows = await FactoryProduct.update($product_id).set($set).fetch().usingConnection(db);
					$event_update_spu = _.size($spu_rows) ? $spu_rows : [];

					$spu_rows = await FactoryProduct.update({
						factoryParentProductNo: $product_id,
						stat: {
							'!=': CONST.PRODUCT_STAT_DELETED
						}
					}).set($set).fetch().usingConnection(db);
					$event_update_spu = $event_update_spu.concat(_.size($spu_rows) ? $spu_rows : []);

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_spu in $event_update_spu) {
				let $spu_row = $event_update_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuUpdate, {id: $spu_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	delSelfProduct: async function(req, res) {
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
		if(CONST.PRODUCT_STAT_BANED != parseInt($product_row.stat)) return res.jsonerr('未上架的商品才可删除');

		var $set = {};
		$set.stat = CONST.PRODUCT_STAT_DELETED;
		$set.delAt = moment().valueOf();

		let $event_update_spu = [];
		var $acc_product_rows;
		try {
			var $row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				$acc_product_rows = await FactoryProduct.find({
					where: {
						factoryParentProductNo: $product_row.id,
						stat: {
							'!=': CONST.PRODUCT_STAT_DELETED
						}
					},
					select: ['id']
				}).usingConnection(db);

				let $spu_rows = await FactoryProduct.update($product_id).set($set).fetch().usingConnection(db);
				$event_update_spu = _.size($spu_rows) ? $spu_rows : [];

				$spu_rows = await FactoryProduct.update({
					factoryParentProductNo: $product_id,
					stat: {
						'!=': CONST.PRODUCT_STAT_DELETED
					}
				}).set($set).fetch().usingConnection(db);
				$event_update_spu = $event_update_spu.concat(_.size($spu_rows) ? $spu_rows : []);

				return proceed(undefined, 'ok');
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			await FactoryProduct.delSpuToMes($product_id);
			$acc_product_rows = cutil.indexTabByCol($acc_product_rows, 'id');
			for(var $mes_idx in $acc_product_rows) {
				var $mes_id = $acc_product_rows[$mes_idx].id;
				await FactoryProduct.delSpuToMes($mes_id);
			}
		} catch($e) {
			sails.log.error($e);
		}

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_spu in $event_update_spu) {
				let $spu_row = $event_update_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuUpdate, {id: $spu_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	undelSelfProduct: async function(req, res) {
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
		sails.log(CONST.PRODUCT_STAT_DELETED != parseInt($product_row.stat), CONST.PRODUCT_STAT_DELETED, parseInt($product_row.stat));
		if(CONST.PRODUCT_STAT_DELETED != parseInt($product_row.stat)) return res.jsonerr('已删除的商品才能恢复');

		var $set = {};
		$set.stat = CONST.PRODUCT_STAT_BANED;
		$set.banAt = moment().valueOf();

		let $event_update_spu = [];
		try {
			var $row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				$event_update_spu = await FactoryProduct.update($product_id).set($set).fetch().usingConnection(db);
				return proceed(undefined, 'ok');
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr($e.message || $e.toString());
        }

		try {
			await FactoryProduct.updateSpuToMes($product_id);
		} catch($e) {
			sails.log.error($e);
		}

		try {
			const mq = new MqApi(req);
			await mq.startTrans(sails.config.mqApi.product.exchange);
			for(let $_idx_spu in $event_update_spu) {
				let $spu_row = $event_update_spu[$_idx_spu];
				await mq.tranSend(sails.config.mqApi.product.routeSpuUpdate, {id: $spu_row.id});
			}
			await mq.endTrans();
		} catch($e) {
			sails.log.error($e);
		}

		return res.jsonok('ok');
	},

	listSelfProduct: async function(req, res) {
	    if(!req.me.compId) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		let $fname = cutil.getReq(req, 'fname');
		let $custom_cat_no = cutil.getReq(req, 'custom_cat_no');

        let $has_sku = parseInt(cutil.getReq(req, 'has_sku')) || 0;

        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			priceType: {
				in: [CONST.PRODUCT_PRICE_TYPE_PRICE, CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF]
			},
			factoryCompId: req.me.compId,
			factoryParentProductNo: '-'
		};

		if(_.isArray(req.param('stat'))) $where.stat = req.param('stat').filter(v => (parseInt(v)));

		if($has_sku) $where.skuCount = {">": 0};
		if(_.size($custom_cat_no)) $where.customCatNo = $custom_cat_no;

		let $ret_fds = ["id", "name", "sname", "styleNo", "customCatNo", "catId", "moduleNo", "photoRender", "photoSample", "price", "stat", "marketPublish", "marketPublishedAt", "marketBanAt", "salebookPublish", "salebookPublishedAt", "salebookBanAt", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "publishedAt"];
		let $n_product_rows  = 0;
		let $product_rows = [];

		if(_.size($fname)) {
			let $k = cutil.dbEscape($fname);
			$n_product_rows = await sails.getDatastore().sendNativeQuery(
				"select count(1) as cnt from factory_product as pd " +
				" left join company as comp on pd.designerCompId=comp.id" +
				" where (pd.priceType=" + CONST.PRODUCT_PRICE_TYPE_PRICE + " or pd.priceType=" + CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF + ") " +
				" and factoryCompId=" + req.me.compId + " and factoryParentProductNo='-' " +
				" and (pd.name like '%" + $k + "%' or moduleNo like '%" + $k + "%' or comp.name like '%" + $k + "%')"
			);
			$n_product_rows = _.size($n_product_rows) && _.size($n_product_rows.rows) && $n_product_rows.rows[0].cnt || 0;

			let $select_fds = [];
			_.each($ret_fds, function($ret_fd) {
				if($ret_fd == 'id') $select_fds.push('pd.factoryProductNo as id');
				else $select_fds.push('pd.' + $ret_fd);
			});
			$product_rows = await sails.getDatastore().sendNativeQuery(
				"select " + $select_fds.join(',') + " from factory_product as pd " +
				" left join company as comp on pd.designerCompId=comp.id" +
				" where (pd.priceType=" + CONST.PRODUCT_PRICE_TYPE_PRICE + " or pd.priceType=" + CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF + ") " +
				" and factoryCompId=" + req.me.compId + " and factoryParentProductNo='-' " +
				" and (pd.name like '%" + $k + "%' or moduleNo like '%" + $k + "%' or comp.name like '%" + $k + "%')" + 
				" order by pd.createdAt desc" +
				" limit " + $start + ", " + $pagesize
			);
			$product_rows = _.size($product_rows) && _.size($product_rows.rows) && $product_rows.rows || [];
		} else {
			$n_product_rows = await FactoryProduct.count($where);
			$product_rows = await FactoryProduct.find({
				where: $where,
				select: $ret_fds,
				skip: $start,
				limit: $pagesize,
				sort: 'createdAt desc'
			});
		}

		let $product_ids = cutil.getTabCol($product_rows, 'id');

		let $acc_rows = await FactoryProduct.find({
			factoryParentProductNo: _.values($product_ids),
		});
		let $acc_product_ids = cutil.getTabCol($acc_rows, 'id');
		$acc_rows = cutil.indexTabByCol($acc_rows, 'factoryParentProductNo', 'id');

        let $designer_ids = cutil.getTabCol($product_rows, 'designerUserId');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'designerCompId');
        let $design_comp_rows = await Comp.getComps(_.values($design_comp_ids), ['id', 'name', 'logo']);
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//let $set_ids = cutil.getTabCol($product_rows, 'setNo');
		//let $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');

		let $spu_custom_cat_ids_arr = cutil.getTabCol($product_rows, 'customCatNo');
		$spu_custom_cat_ids_arr = _.size($spu_custom_cat_ids_arr) && _.values($spu_custom_cat_ids_arr) || [];
		$spu_custom_cat_ids_arr = $spu_custom_cat_ids_arr.filter(v => (_.isString(v) && v.length));
		let $product_custom_cat_rows = {};
		if(_.size($spu_custom_cat_ids_arr)) {
			let $tg_dict_api = new TGDictApi(req);
			try {
				$product_custom_cat_rows = await $tg_dict_api.getProductCustomCat($comp_row.id, $spu_custom_cat_ids_arr);
				$product_custom_cat_rows = cutil.indexTabByCol($product_custom_cat_rows, 'id');	
			} catch($e) {
				return res.jsonerr($e.message || 'TgDictApi: error');
			}
		}

		let $style_ids = cutil.getTabCol($product_rows, 'styleNo');
		let $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		let $sku_rows = await FactoryProductSku.getStepPrice(_.values(_.assign({}, $product_ids, $acc_product_ids)));

		let $sale_rows = {};
		try {
			let $tgstt = new TGSttApi(req);
			$sale_rows = await $tgstt.factorySpuSale(_.values($product_ids), [6]);
			$sale_rows = cutil.indexTabByCol($sale_rows, 'itemId');
		} catch($e) {
			return res.jsonerr($e.message || '获取销售统计数据失败');
		}


		let $nbom_rows = {};
		try {
			$nbom_rows = await FactoryProduct.getProductNBom(_.values($product_ids));
			$nbom_rows = cutil.indexTabByCol($nbom_rows, 'spuid');
		} catch($e) {
			return res.jsonerr($e.message || 'MesApi错误');
		}

		let $ret = [];
		let $tm = moment().valueOf();
		_.each($product_rows, function($row){
            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }
			try{ $ret_row.photo_sample = $ret_row.photo_sample ? JSON.parse($ret_row.photo_sample) : []; } catch(e) { $ret_row.photo_sample = []; }

            $ret_row.designer = {
                id: $row.designerUserId,
                name: $designer_rows[$row.designerUserId] && $designer_rows[$row.designerUserId].name ? $designer_rows[$row.designerUserId].name : '',
                avatar: $designer_rows[$row.designerUserId] && $designer_rows[$row.designerUserId].avatar ? $designer_rows[$row.designerUserId].avatar : ''
            };
			delete $ret_row.designerUserId;

			$ret_row.design_comp = {
				id: $row.designerCompId,
				name: $design_comp_rows && $design_comp_rows[$row.designerCompId] ? $design_comp_rows[$row.designerCompId].name : '',
				logo: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].logo : ''
			};
			delete $ret_row.designerCompId;

			$ret_row.cat = {
				id: $row.catId,
				name: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : ''
			};
			delete $ret_row.cat_id;

			//$ret_row.set = {
			//	id   : $set_rows && $set_rows[$row.setNo] && $set_rows[$row.setNo].pid || '',
			//	name : $set_rows && $set_rows[$row.setNo] && $pset_rows && $pset_rows[$set_rows[$row.setNo].pid] ? $pset_rows[$set_rows[$row.setNo].pid].name : ''
			//};
			//$ret_row.set_id = $row.setNo;
			//delete $ret_row.set_no;

			$ret_row.customCat = {
				id   : $row.customCatNo,
				name : _.size($product_custom_cat_rows) && _.size($product_custom_cat_rows[$row.customCatNo]) && $product_custom_cat_rows[$row.customCatNo].name || ''
			};

			$ret_row.style = {
				id: $row.styleNo,
				name: $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : ''
			};
			delete $ret_row.style_no;

			$ret_row.step_price = $sku_rows[$row.id] || [];
			$ret_row.accessory = [];
			_.each($acc_rows[$row.id], function($acc_row) {
				var $ret_acc_row = {
					id: $acc_row.id,
					name: $acc_row.name,
					stat: $acc_row.stat,
					intro: $acc_row.intro,
					dimension: $acc_row.dimension,
					photo_size: $acc_row.photoSize,
					photo_story: $acc_row.photoStory,
					step_price: $sku_rows[$acc_row.id] || []
				};

				try{ $ret_acc_row.dimension = $ret_acc_row.dimension ? JSON.parse($ret_acc_row.dimension) : {}; } catch(e) { $ret_acc_row.dimension = {}; }
				try{ $ret_acc_row.photo_size = $ret_acc_row.photo_size ? JSON.parse($ret_acc_row.photo_size) : []; } catch(e) { $ret_acc_row.photo_size = []; }
				try{ $ret_acc_row.photo_story = $ret_acc_row.photo_story ? JSON.parse($ret_acc_row.photo_story) : []; } catch(e) { $ret_acc_row.photo_story = []; }

				$ret_row.accessory.push($ret_acc_row);
			});

			$ret_row.sale_amount = _.size($sale_rows) &&
				_.size($sale_rows[$row.id]) &&
				$sale_rows[$row.id].sale_amount || 0;

			$ret_row.sale_count = _.size($sale_rows) &&
				_.size($sale_rows[$row.id]) &&
				$sale_rows[$row.id].sale_count || 0;

			delete $ret_row.price;
			delete $ret_row.published_at;

			$ret_row.is_bom = $nbom_rows && $nbom_rows[$row.id] && parseInt($nbom_rows[$row.id].bom) ? 1 : 0;

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_product_rows});
	},

	detailSelfProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        var $product_id = cutil.getReq(req, 'product_no');

		var $ret_fds = ["id", "name", "sname", "styleNo", "customCatNo", "catId", "moduleNo", "designIdea", "photoRender", "video", "videoThumb", "photoCad", "photoSample", "dimension", "intro", "photoSize", "photoStory", "stat", "marketPublish", "marketPublishedAt", "marketBanAt", "salebookPublish", "salebookPublishedAt", "salebookBanAt", "designerUserId", "designerCompId", "factoryUserId", "publishedAt", "factoryParentProductNo", "priceType"];
		var $product_rows = await FactoryProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ factoryParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});

		var $product_ids = cutil.getTabCol($product_rows, 'id');
		$product_rows = cutil.indexTabByCol($product_rows, 'factoryParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		var $product_row = $product_rows['-'][$product_id];
		if(
			!$product_row 
			|| -1 === _.indexOf([
				CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF, 
				CONST.PRODUCT_PRICE_TYPE_PRICE
			], $product_row.priceType)
		) {
			return res.jsonerr('商品不存在2');
		}

        let $designer_row = await User.getUsers([$product_row.designerUserId], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.designerUserId] || null;

		var $design_comp_row = $product_row.designerCompId ? await Comp.findOne($product_row.designerCompId) : null;

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = [$product_row.setNo];
		//var $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');

		let $spu_custom_cat_ids_arr = [$product_row.customCatNo];
		$spu_custom_cat_ids_arr = $spu_custom_cat_ids_arr.filter(v => (_.isString(v) && v.length));
		let $product_custom_cat_rows = {};
		if(_.size($spu_custom_cat_ids_arr)) {
			let $tg_dict_api = new TGDictApi(req);
			try {
				$product_custom_cat_rows = await $tg_dict_api.getProductCustomCat($comp_row.id, $spu_custom_cat_ids_arr);
				$product_custom_cat_rows = cutil.indexTabByCol($product_custom_cat_rows, 'id');	
			} catch($e) {
				return res.jsonerr($e.message || 'TgDictApi: error');
			}
		}

		var $style_ids = [$product_row.styleNo];
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		var $sku_rows = await FactoryProductSku.getStepPrice(_.values($product_ids));

		var $tm = moment().valueOf();
		var $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

		try{ $ret.photo_render = $ret.photo_render ? JSON.parse($ret.photo_render) : []; } catch(e) { $ret.photo_render = []; }
		try{ $ret.video = $ret.video ? JSON.parse($ret.video) : []; } catch(e) { $ret.video = []; }
		try{ $ret.photo_cad = $ret.photo_cad ? JSON.parse($ret.photo_cad) : []; } catch(e) { $ret.photo_cad = []; }
		try{ $ret.photo_sample = $ret.photo_sample ? JSON.parse($ret.photo_sample) : []; } catch(e) { $ret.photo_sample = []; }
		try{ $ret.dimension = $ret.dimension ? JSON.parse($ret.dimension) : []; } catch(e) { $ret.dimension = []; }
		try{ $ret.photo_size = $ret.photo_size ? JSON.parse($ret.photo_size) : []; } catch(e) { $ret.photo_size = []; }
		try{ $ret.photo_story = $ret.photo_story ? JSON.parse($ret.photo_story) : []; } catch(e) { $ret.photo_story = []; }

		delete $ret.price_type;
		delete $ret.factory_parent_product_no;

		$ret.designer = {
			id: $product_row.designerUserId,
			name: $designer_row && $designer_row.name ? $designer_row.name : '',
			avatar: $designer_row && $designer_row.avatar ? $designer_row.avatar : ''
		};
		delete $ret.designer_user_id;

		$ret.design_comp = {
			id: $product_row.designerCompId,
			name: $design_comp_row ? $design_comp_row.name : '',
			logo: $design_comp_row ? $design_comp_row.logo : ''
		};
		delete $ret.designer_comp_id;;


		$ret.cat = {
			id: $product_row.catId,
			name: $cat_rows && $cat_rows[$product_row.catId] ? $cat_rows[$product_row.catId].name : ''
		};
		delete $ret.cat_id;

		//$ret.set = {
		//	id   : $set_rows && $set_rows[$product_row.setNo] && $set_rows[$product_row.setNo].pid || '',
		//	name : $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : ''
		//};
		//$ret.set_id = $product_row.setNo;
		//delete $ret.set_no;
		$ret.customCat = {
			id   : $product_row.customCatNo,
			name : _.size($product_custom_cat_rows) && _.size($product_custom_cat_rows[$product_row.customCatNo]) && $product_custom_cat_rows[$product_row.customCatNo].name || ''
		};

		$ret.style = {
			id: $product_row.styleNo,
			name: $style_rows && $style_rows[$product_row.styleNo] ? $style_rows[$product_row.styleNo].name : ''
		};
		delete $ret.style_no;

		$ret.step_price = $sku_rows[$product_row.id] || [];
		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			var $acc_row = {};

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.stat = $row.stat;
			$acc_row.intro = $row.intro;
			$acc_row.dimension = $row.dimension;
			$acc_row.photo_size = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;
			$acc_row.step_price = $sku_rows[$row.id] || [];

			try{ $acc_row.dimension = $acc_row.dimension ? JSON.parse($acc_row.dimension) : []; } catch(e) { $acc_row.dimension = []; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }

			$ret.accessory.push($acc_row);
		});

		let $spu_attr_rows = await FactoryProductAttr.find({
			factoryCompId: $product_row.factoryCompId,
			factoryProductNo: $product_row.id
		});
		$spu_attr_rows = cutil.indexTabByCol($spu_attr_rows, 'nameNo', 'valueNo');

		$ret.attr = [];
		_.each($spu_attr_rows, function($attr_rows, $attr_name_no) {
			let $attr = {};
			$attr.name = $attr_name_no;
			$attr.values = _.keys($attr_rows);
			$ret.attr.push($attr);
		});

		return res.jsonok($ret);
	},
};

