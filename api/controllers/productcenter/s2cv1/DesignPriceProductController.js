
const moment = require('moment');
const flaverr = require('flaverr');

async function savePriceProduct(set, acc_sets, $product_row) {
	try {
		var $row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
			try {
				set.designParentProductNo = '-';
				if($product_row) {
					if(_.size(set)) {
						$product_row = await DesignProduct.update($product_row.id).set(set).fetch().usingConnection(db);
						$product_row = $product_row && $product_row[0] || null;

						//关闭所有正在进行的交易
						await Transaction.update({
							productNo: $product_row.id
						}).set({
							stat: CONST.TRANSACTION_STAT_CLOSED_BY_PRODUCT_UPDATE
						});
					}
				} else {
					var productNo;
					try{
						productNo = await DesignProduct.genUUID(db);
					} catch($e) {
						throw new Error('生成商品UUID失败');
					}
					set.id = productNo;

					var productSN;
					try{
						productSN = await DesignProduct.genSN(set.createdByCompId, db);
					} catch($e) {
						throw new Error('生成商品编码失败');
					}
					set.designProductSN = productSN;

					$product_row = await DesignProduct.create(set).fetch().usingConnection(db);
				}

				if(parseInt(set.stat) == CONST.PRODUCT_STAT_PUBLISHED) {
					try {
						checkPriceProductForPublish($product_row);
					} catch($e) {
						 return proceed(flaverr('E_USER_ERROR', new Error($e)));
					}
				}

				if(_.size(acc_sets)) {
					var productNo, productSN;
					for(var acc_set_idx in acc_sets) {
						var acc_set = acc_sets[acc_set_idx];
						if(!acc_set.id) {
							try{
								productNo = await DesignProduct.genUUID(db);
							} catch($e) {
								throw new Error('生成商品UUID失败');
							}
							acc_set.id = productNo;
						}

						if(!acc_set.productSN) {
							try{
								productSN = await DesignProduct.genSN(set.createdByCompId, db);
							} catch($e) {
								throw new Error('生成商品编码失败');
							}
							acc_set.designProductSN = productSN;
						}

						acc_set.designParentProductNo = $product_row.id;
						acc_set.setNo = typeof set.setNo != 'undefined' ? set.setNo : $product_row.setNo;
						acc_set.styleNo = typeof set.styleNo != 'undefined' ? set.styleNo : $product_row.styleNo;
						acc_set.catId = typeof set.catId != 'undefined' ? set.catId : $product_row.catId;
						acc_set.photoRender = typeof set.photoRender != 'undefined' ? set.photoRender : $product_row.photoRender;
						acc_set.photoCad = typeof set.photoCad != 'undefined' ? set.photoCad : $product_row.photoCad;
						acc_set.designIdea = typeof set.designIdea != 'undefined' ? set.designIdea : $product_row.designIdea;
						acc_set.priceType = typeof set.priceType != 'undefined' ? set.priceType : $product_row.priceType;
						acc_set.price = typeof set.price != 'undefined' ? set.price : $product_row.price;
						acc_set.pricePercent = typeof set.pricePercent != 'undefined' ? set.pricePercent : $product_row.pricePercent;
						acc_set.contractTplId = typeof set.contractTplId != 'undefined' ? set.contractTplId : $product_row.contractTplId;
						acc_set.stat = $product_row.stat;
						acc_set.publishedAt = $product_row.publishedAt;
						acc_set.createdBy = set.createdBy;
						acc_set.createdByCompId = set.createdByCompId;

						acc_set.intro = typeof set.intro != 'undefined' ? set.intro : $product_row.intro;
						if(acc_set.dimension) acc_set.dimension = JSON.stringify(acc_set.dimension);
						if(acc_set.photoSize) acc_set.photoSize = JSON.stringify(acc_set.photoSize);
						if(acc_set.photoStory) acc_set.photoStory = JSON.stringify(acc_set.photoStory);
					}

					await DesignProduct.destroy({
						designParentProductNo: $product_row.id
					}).usingConnection(db);

					await DesignProduct.createEach(acc_sets).usingConnection(db);
				}

				return proceed(undefined, $product_row);

			} catch (err) {
				return proceed(err);
			}
		});

		return $row;
	} catch ($e) {
		throw $e;
	}
}

function checkPriceProductForPublish($product_row) {
	if(!$product_row) throw '请填写商品信息';
	if(!$product_row.name || $product_row.name.length < 1) throw '请填写商品名称';
	if(!$product_row.styleNo || $product_row.styleNo.length < 1) throw '请选择商品风格';
	if(!$product_row.catId) throw '请选择商品类目';

	if(!$product_row.photoRender || _.size($product_row.photoRender) < 1) throw '请上传3D单品渲染图'; 

	if(!$product_row.price) throw '请填写价格';
	if(!$product_row.contractTplId) throw '请选择合同模板';
}

//该文件已废弃
module.exports = {

    addPriceProduct: async function(req, res) {
        if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

        var set = {};

        set.name = cutil.getReq(req, 'name') || '';
        set.sname = cutil.getReq(req, 'sname') || set.name;
        set.setNo = cutil.getReq(req, 'set_no') || '';
        set.styleNo = cutil.getReq(req, 'style_no') || '';
        set.catId = parseInt(cutil.getReq(req, 'cat_id')) || 0;
		if(set.name.length < 1) return res.jsonerr('请填写商品名称');

		if(set.setNo.length) {
			var $set_row = await ProductSet.findOne(set.setNo);
			if(!$set_row || !_.size($set_row)) return res.jsonerr('选择的商品套系不存在');
			if(parseInt($set_row.priceType) != CONST.PRODUCT_PRICE_TYPE_PRICE) return res.jsonerr('套系和商品类型不匹配');
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

        set.priceType = CONST.PRODUCT_PRICE_TYPE_PRICE;
        set.price = cutil.getReq(req, 'price') || 0;
        set.pricePercent = 0;

		if(typeof req.param('tpl_id') != 'undefined') {
			let $tpl_no = cutil.getReq(req, 'tpl_id') || '';
			set.contractTplId = $tpl_no;
			if(!set.contractTplId) return res.jsonerr('合同模板不存在(1)');

			let $ht_api = new HtApi();
			let $tpl_row = {};
			try { 
				$tpl_row = await $ht_api.getTpl($tpl_no);
				if(!$tpl_row || !_.size($tpl_row)) return res.jsonerr('合同模板不存在(2)');
			} catch($e) {
				return res.jsonerr('HtApi: ' + ($e.message || '错误'));
			}
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

		if(typeof req.param('publish') != 'undefined' && req.param('publish')) {
			set.stat = CONST.PRODUCT_STAT_PUBLISHED;
			set.publishedAt = moment().valueOf();
		} else {
			set.stat = CONST.PRODUCT_STAT_BANED;
		}

        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) {
			set.stat = CONST.PRODUCT_STAT_BANED;
			delete set.publishedAt;
		}

		if(set.photoRender) set.photoRender = JSON.stringify(set.photoRender);
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

					acc_set.intro = acc.intro || '';
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
							designCompId    : $comp_row.id,
							designProductNo : '',
							nameNo          : $attr.name,
							valueNo         : $attr_val
						});
					});
				}
			});
		}

        try{
			set.createdBy = req.me.id;
			set.createdByCompId = req.me.compId;
			let $product_row = await savePriceProduct(set, acc_sets);
			if(_.size($add_spu_attr_set)) {
				_.each($add_spu_attr_set, function($attr) {
					$attr.designProductNo = $product_row.id;
				});
				await DesignProductAttr.createEach($add_spu_attr_set);
			}
            return res.jsonok($product_row.id);
        } catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr('写入数据库失败');
        }
    },

	listPriceProduct: async function(req, res) {
	    if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

        var $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        var $page = parseInt(cutil.getReq(req, 'page')) || 1;
        var $start = ($page - 1) * $pagesize;

		var $where = {
			createdByCompId: $comp_row.id,
			priceType: CONST.PRODUCT_PRICE_TYPE_PRICE,
			designParentProductNo: '-'
		};
        var $ftype = parseInt(cutil.getReq(req, 'ftype'));
        switch($ftype) {
            case 1: //已上架
                $where.stat =  CONST.PRODUCT_STAT_PUBLISHED;
                break;
            case 2: //未上架
                $where.stat = [CONST.PRODUCT_STAT_CREATED, CONST.PRODUCT_STAT_BANED]
                break;
            case 3: //已删除
                $where.stat = CONST.PRODUCT_STAT_DELETED;
                break;
            case 0: //全部
            default:
                break;
        }

		var $ret_fds = ["id", "name", "sname", "setNo", "styleNo", "catId", "photoRender", "price", "stat", "createdBy", "designMarketNVisited", "publishedAt"];
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

        var $trans_rows = await Transaction.getValidTransactionsByProductNos(_.values(cutil.getTabCol($product_rows, 'id')), ['productNo', 'stat', 'buyByCompId', 'contractNo', 'id', 'orderNo']);

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

		var $comp_rows = await Comp.find({
			id: _.values(cutil.getTabCol($trans_rows, 'buyByCompId'))
		});
		$comp_rows = cutil.indexTabByCol($comp_rows, 'id');
		$trans_rows = cutil.indexTabByCol($trans_rows, 'productNo');

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

			if(_.size($trans_rows) && _.size($trans_rows[$row.id])) {
				$ret_row.factory = {
					id: $trans_rows[$row.id].buyByCompId,
					name: $comp_rows && $comp_rows[$trans_rows[$row.id].buyByCompId] ? $comp_rows[$trans_rows[$row.id].buyByCompId].name : '',
					logo: $comp_rows && $comp_rows[$trans_rows[$row.id].buyByCompId] ? $comp_rows[$trans_rows[$row.id].buyByCompId].logo : ''
				};
			}

			$ret_row.trans_no    = $trans_rows[$row.id] && $trans_rows[$row.id].id || '';
			$ret_row.trans_stat  = $trans_rows[$row.id] ? $trans_rows[$row.id].stat             : '';
			$ret_row.contract_no = $trans_rows[$row.id] && $trans_rows[$row.id].contractNo || '';
			$ret_row.tradeOrder  = $trans_rows[$row.id] && $order_info_rows[$trans_rows[$row.id].id] || null;

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_product_rows});
	},

	detailPriceProduct: async function(req, res) {
	    if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

        var $product_id = cutil.getReq(req, 'product_no');

		var $ret_fds = ["id", "name", "sname", "setNo", "styleNo", "catId", "designIdea", "photoRender", "photoCad", "dimension", "intro", "photoSize", "photoStory", "price", "stat", "createdBy", "designMarketNVisited", "publishedAt", "designParentProductNo", "contractTplId"];
		var $product_rows = await DesignProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ designParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});

		$product_rows = cutil.indexTabByCol($product_rows, 'designParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		var $product_row = $product_rows['-'][$product_id];

        let $designer_row = await User.getUsers([$product_row.createdBy], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.createdBy] || null;

        var $trans_row = await Transaction.getValidTransactionsByProductNos([$product_id], ['productNo', 'stat', 'buyByCompId', 'contractNo', 'orderNo']);
		$trans_row = cutil.indexTabByCol($trans_row, 'productNo');
		$trans_row = $trans_row && $trans_row[$product_id] || null;

		var $factory_comp_row = $trans_row && $trans_row.buyByCompId ? await Comp.findOne($trans_row.buyByCompId) : null;

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
		$ret.tpl_id = $ret.contractTplId;
		delete $ret.contractTplId;

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

		$ret.trans_stat = $trans_row && $trans_row.stat || '';
		$ret.contract_no = $trans_row && $trans_row.contractNo || '';
		if($trans_row) {
			try { $factory_comp_row.aptitude = JSON.parse($factory_comp_row.aptitude); } catch(e) {}
			$ret.factory = {
				id: $trans_row.buyByCompId,
				name: $factory_comp_row && $factory_comp_row.name || '',
				logo: $factory_comp_row && $factory_comp_row.logo || '',
				aptitude: $factory_comp_row && $factory_comp_row.aptitude || ''
			};

			try {
				if($trans_row.orderNo && $trans_row.orderNo.length) {
					let $trans_api = new TransApi(req);
					$ret.tradeOrder = await $trans_api.getOrder($trans_row.orderNo);
				}
			} catch($e) {
				return res.jsonerr($e.message || 'TransApi: error');
			}
		}

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

		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			var $acc_row = {};

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.dimension = $row.dimension;
			$acc_row.photo_size = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;

			try{ $acc_row.dimension = $acc_row.dimension ? JSON.parse($acc_row.dimension) : []; } catch(e) { $acc_row.dimension = []; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }


			$ret.accessory.push($acc_row);
		});

		return res.jsonok($ret);
	},

	updatePriceProduct: async function(req, res) {
        if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

        var $product_id = cutil.getReq(req, 'product_no');
		if(!$product_id) return res.jsonerr('商品不存在');
		var $product_row = await DesignProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.createdByCompId != req.me.compId) return res.jsonerr('商品不属于该企业');
		if(CONST.PRODUCT_STAT_BANED != parseInt($product_row.stat)) return res.jsonerr('未上架的商品才可编辑');

        var set = {};
		if(typeof req.param('name') != 'undefined') {
			set.name = cutil.getReq(req, 'name');
			if(set.name.length < 1) return res.jsonerr('请填写商品名称');
		}

		if(typeof req.param('sname') != 'undefined' && cutil.getReq(req, 'sname').length) {
			set.sname = cutil.getReq(req, 'sname');
		}
		
        if(typeof req.param('set_no') != 'undefined') {
			set.setNo = cutil.getReq(req, 'set_no');

			if(set.setNo) {
				var $set_row = await ProductSet.findOne(set.setNo);
				if(!$set_row || !_.size($set_row)) return res.jsonerr('选择的套系不存在');
				if(parseInt($set_row.priceType) != CONST.PRODUCT_PRICE_TYPE_PRICE) return res.jsonerr('套系和商品类型不匹配');
			}
		}

        if(typeof req.param('style_no') != 'undefined') {
			set.styleNo = cutil.getReq(req, 'style_no');
			if(set.styleNo.length < 1) return res.jsonerr('请选择商品风格');
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

			if(!set.photoRender || _.size(set.photoRender) < 1) return res.jsonerr('请上传3D单品渲染图'); 
        }

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

		if(typeof req.param('price') != 'undefined') {
			set.price = cutil.getReq(req, 'price') || 0;
		}

		if(typeof req.param('tpl_id') != 'undefined') {
			let $tpl_no = cutil.getReq(req, 'tpl_id') || '';
			set.contractTplId = $tpl_no;
			if(!set.contractTplId) return res.jsonerr('合同模板不存在(1)');

			let $ht_api = new HtApi();
			try {
				let $tpl_row = await $ht_api.getTpl($tpl_no);
				if(!$tpl_row || !_.size($tpl_row)) return res.jsonerr('合同模板不存在(2)');
			} catch($e) {
				return res.jsonerr('HtApi: ' + ($e.message || '错误'));
			}
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

		if(typeof req.param('publish') != 'undefined' && req.param('publish')) {
			set.stat = CONST.PRODUCT_STAT_PUBLISHED;
			set.publishedAt = moment().valueOf();
		}

        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) {
			set.stat = CONST.PRODUCT_STAT_BANED;
			delete set.publishedAt;
		}

		if(set.photoRender) set.photoRender = JSON.stringify(set.photoRender);
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
					acc_set.id = acc.id || 0;

					acc_set.name = acc.name && acc.name.toString().trim() || '';
					if(acc_set.name.length < 1) throw '请输入附件名称';

					acc_set.intro = acc.intro && acc.intro.toString().trim() || '';
					if(typeof acc.dimension != 'undefined') {
						let $dimension = req.param('dimension');
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
							designCompId    : $comp_row.id,
							designProductNo : '',
							nameNo          : $attr.name,
							valueNo         : $attr_val
						});
					});
				}
			});
		}

        try{
			set.createdBy = req.me.id;
			set.createdByCompId = req.me.compId;
			$product_row = await savePriceProduct(set, acc_sets, $product_row);
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
            return res.jsonok($product_row.id);
        } catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

            sails.log.error($e);
            return res.jsonerr('写入数据库失败');
        }
    },

	togglePriceProduct: async function(req, res) {
		if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
		if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

		var $set = {};
        var $stat = parseInt(cutil.getReq(req, 'stat'));
		if($stat == CONST.PRODUCT_STAT_PUBLISHED) {
			$set.stat = CONST.PRODUCT_STAT_PUBLISHED;
			$set.publishedAt = moment().valueOf();
		} else {
			$set.stat = CONST.PRODUCT_STAT_BANED;
			$set.banAt = moment().valueOf();
		}

        var $product_id = cutil.getReq(req, 'product_no');
		var $product_row = await DesignProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.createdByCompId != req.me.compId) return res.jsonerr('商品不属于该企业');
		if(
			$set.stat == CONST.PRODUCT_STAT_PUBLISHED 
			&& CONST.PRODUCT_STAT_BANED != parseInt($product_row.stat)
		) return res.jsonerr('未上架的商品才可上架');
		else if(
			$set.stat == CONST.PRODUCT_STAT_BANED 
			&& CONST.PRODUCT_STAT_PUBLISHED != parseInt($product_row.stat)
		) return res.jsonerr('上架且未交易的商品才可下架');

		if($set.stat == CONST.PRODUCT_STAT_PUBLISHED) {
			try {
				checkPriceProductForPublish($product_row);
			} catch($e) {
				return res.jsonerr('商品信息不完整，请完成必填项的填写');
			}
		}

		await DesignProduct.update($product_id).set($set);

		return res.jsonok('ok');
	},

	delPriceProduct: async function(req, res) {
		if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
		if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

		var $set = {};
		$set.stat = CONST.PRODUCT_STAT_DELETED;
		$set.delAt = moment().valueOf();

        var $product_id = cutil.getReq(req, 'product_no');
		var $product_row = await DesignProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.createdByCompId != req.me.compId) return res.jsonerr('商品不属于该企业');
		if(CONST.PRODUCT_STAT_BANED != parseInt($product_row.stat)) return res.jsonerr('未上架的商品才可删除');

		await DesignProduct.update($product_id).set($set);

		return res.jsonok('ok');
	},

    undelPriceProduct: async function(req, res) {
		if(!cutil.ucan(req.me.privs, CONST.PRIV_DESIGN_MANAGE_MY_PRODUCT)) return res.jsonerr('没有权限');
		if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_DESIGNER) return res.jsonerr('企业不是设计公司');

		var $set = {};
		$set.stat = CONST.PRODUCT_STAT_BANED;
		$set.banAt = moment().valueOf();

        var $product_id = cutil.getReq(req, 'product_no');
		var $product_row = await DesignProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');
		if($product_row.createdByCompId != req.me.compId) return res.jsonerr('商品不属于该企业');
		if(CONST.PRODUCT_STAT_DELETED != parseInt($product_row.stat)) return res.jsonerr('已删除的商品才能恢复');

		await DesignProduct.update($product_id).set($set);

		return res.jsonok('ok');
	},
};

