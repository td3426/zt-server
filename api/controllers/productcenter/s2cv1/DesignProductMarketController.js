
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
	listProduct: async function(req, res) {
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			setNo                 : "",
			priceType             : CONST.PRODUCT_PRICE_TYPE_PRICE,
			stat                  : CONST.PRODUCT_STAT_PUBLISHED,
			designParentProductNo : '-'
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $cat_ids = [], $price_range = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('cat_id'))) $cat_ids = req.param('cat_id').filter(v => (parseInt(v)));
		if(_.isArray(req.param('price_range'))) {
			let $price_low = parseFloat(req.param('price_range')[0]) || 0;
			let $price_high = parseFloat(req.param('price_range')[1]) || 0;
			if($price_low) $price_range.push($price_low);
			if($price_high) $price_range.push($price_high);
			$price_range.sort();
		}
		if(_.size($style_nos)) $where.styleNo = $style_nos;

		let $tg_dict_api = new TGDictApi(req);
		if(_.size($cat_ids)) {
			try {
				let $where_cat_ids = {};
				let $cat_res = await $tg_dict_api.getProductCat($cat_ids, false);
				if(_.size($cat_res) && _.isArray($cat_res)) {
					$cat_res.map(v => {
						if(_.size(v.path) && _.isArray(v.path)) {
							v.path.map(v1 => {
								$where_cat_ids[v1.id] = v1.id;
							});
						}
					});
				}
				if(_.size($where_cat_ids)) $where.catId = _.values($where_cat_ids);
			} catch($e) {
				sails.log($e);
				return res.jsonerr($e.message || 'TgDictApi: error');
			}
		}
		if(_.size($price_range)) {
			if(_.size($price_range) > 0) $where.price = {'>=': $price_range[0]}
			if(_.size($price_range) > 1) $where.price = {'<=': $price_range[1]}
		}

		let $order_by = [{}];
		let $sort_by = 'publishedAt';
		let $sort_order = 'DESC';
		if(cutil.getReq(req, 'sort_by') == 'price') $sort_by = 'price';
		if(cutil.getReq(req, 'sort_order')) $sort_order = 'ASC';
		$order_by[0][$sort_by] = $sort_order;

	
		let $n_product_rows = await DesignProduct.count({
			where : $where,
		});
		if(!$n_product_rows) return res.jsonok({total: $n_product_rows, list: []});

		let $product_rows = await DesignProduct.find({
			where : $where,
			sort  : $order_by,
			skip  : $start,
			limit : $pagesize
		});

        let $designer_ids = cutil.getTabCol($product_rows, 'createdBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'createdByCompId');
		$design_comp_ids = _.values($design_comp_ids);
        let $design_comp_rows = await Comp.find({
			where: {
				id: $design_comp_ids,
			},
			select: ['id', 'name', 'logo']
        });
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		let $cat_ids_arr = cutil.getTabCol($product_rows, 'catId');
		$cat_ids_arr = _.values($cat_ids_arr).filter(v => (_.isString(v) && v.trim().length));
		let $style_no_arr = cutil.getTabCol($product_rows, 'styleNo');
		$style_no_arr = _.values($style_no_arr).filter(v => (_.isString(v) && v.trim().length));
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
                id     : $product_row.createdBy,
                name   : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].name || '',
                avatar : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].avatar || ''
            };
			delete $product_row.createdBy;

			$product_row.design_comp = {
                id     : $product_row.createdByCompId,
                name   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].name || '',
                logo   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].logo || '',
            };
			delete $product_row.createdByCompId;

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
			priceType : CONST.PRODUCT_PRICE_TYPE_PRICE,
			stat      : CONST.PRODUCT_STAT_PUBLISHED,
			or: [
				{pid: ''},
				{pid: null},
			]
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $cat_ids = [], $price_range = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('price_range'))) {
			let $price_low = parseFloat(req.param('price_range')[0]) || 0;
			let $price_high = parseFloat(req.param('price_range')[1]) || 0;
			if($price_low) $price_range.push($price_low);
			if($price_high) $price_range.push($price_high);
			$price_range.sort();
		}
		if(_.size($style_nos)) $where.styleNo = $style_nos;
		if(_.size($cat_ids)) $where.catId = $cat_ids;
		if(_.size($price_range)) {
			if(_.size($price_range) > 0) $where.price = {'>=': $price_range[0]}
			if(_.size($price_range) > 1) $where.price = {'<=': $price_range[1]}
		}

		let $order_by = [{}];
		let $sort_by = 'publishedAt';
		let $sort_order = 'DESC';
		if(cutil.getReq(req, 'sort_by') == 'price') $sort_by = 'price';
		if(cutil.getReq(req, 'sort_order')) $sort_order = 'ASC';
		$order_by[0][$sort_by] = $sort_order;

		let $n_rows = await ProductSet.count({
			where : $where,
		});
		if(!$n_rows) return res.jsonok({total: $n_rows, list: []});

		let $product_rows = await ProductSet.find({
			where : $where,
			sort  : $order_by,
			skip  : $start,
			limit : $pagesize
		});

		let $product_ids = cutil.getTabCol($product_rows, 'id');
		let $n_product_rows = {};
		if(_.size($product_ids)) {
			$n_product_rows = await sails.getDatastore().sendNativeQuery(
				"select setNo, count(1) as cnt from design_product where setNo in ('" + _.values($product_ids).join("','")+ "') group by setNo"
			);
		}
		$n_product_rows = _.size($n_product_rows) && _.size($n_product_rows.rows) && cutil.indexTabByCol($n_product_rows.rows, 'setNo') || {};

        let $designer_ids = cutil.getTabCol($product_rows, 'createdBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'createdByCompId');
		$design_comp_ids = _.values($design_comp_ids);
        let $design_comp_rows = await Comp.find({
			where: {
				id: $design_comp_ids,
			},
			select: ['id', 'name', 'logo']
        });
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		let $style_no_arr = cutil.getTabCol($product_rows, 'styleNo');
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
		_.each($product_rows, $product_row => {
            $product_row.designer = {
                id     : $product_row.createdBy,
                name   : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].name || '',
                avatar : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].avatar || ''
            };
			delete $product_row.createdBy;

			$product_row.design_comp = {
                id     : $product_row.createdByCompId,
                name   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].name || '',
                logo   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].logo || '',
            };
			delete $product_row.createdByCompId;

			$product_row.style = {
				id: $product_row.styleNo,
				name: _.size($product_dict.style) && _.size($product_dict.style[$product_row.styleNo]) && $product_dict.style[$product_row.styleNo].name || ''
			};
			delete $product_row.styleNo;

			$product_row.n_product = _.size($n_product_rows) && _.size($n_product_rows[$product_row.id]) && $n_product_rows[$product_row.id].cnt || 0;

			try{ $product_row.photos = JSON.parse($product_row.photos); } catch(e) { $product_row.photos = []; }

			$ret.push(cutil.snakeCaseObject($product_row));
		});
	
		return res.jsonok({total: $n_rows, list: $ret});
	},

	detailProduct: async function(req, res) {
		let $id = cutil.getReq(req, 'id');
		if(!$id.length) return res.jsonerr('作品不存在');
	
		let $product_row = await DesignProduct.findOne($id);
		if(!_.size($product_row)) return res.jsonerr('作品不存在');

		let $trans_product_type = CONST.TRANSACTION_PRODUCT_TYPE_PRODUCT;
		let $trans_product_no = $id;
		if(_.size($product_row.setNo)) {
			let $set_product = await ProductSet.findOne($product_row.setNo);
			if(!_.size($set_product)) return res.jsonerr('作品所属套系不存在');

			if(_.size($set_product.pid)) {
				$set_product = await ProductSet.findOne($set_product.pid);
				if(!_.size($set_product)) return res.jsonerr('作品所属套系不存在');
			}

			$trans_product_type = CONST.TRANSACTION_PRODUCT_TYPE_SET;
			$trans_product_no   = $set_product.id;
		}

		let $my_trans_row = {};
		if(req.me && req.me.compId) {
			$my_trans_row = await sails.getDatastore().sendNativeQuery(
				"select transactionNo as id, stat, contractNo, orderNo from transaction where productType=" + $trans_product_type + " and productNo='" + $trans_product_no + "'" + " and buyByCompId=" + req.me.compId + 
				" order by stat desc limit 1"
			);
			$my_trans_row = _.size($my_trans_row.rows) && $my_trans_row.rows[0] || {};
		}
			
		let $me_has_buy = false;
		if(_.size($my_trans_row) && $my_trans_row.stat >= CONST.TRANSACTION_STAT_PAID_OK && $my_trans_row.stat <= CONST.TRANSACTION_STAT_COMPLETE) $me_has_buy = true;

        let $designer_ids = [$product_row.createdBy];
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers($designer_ids, ['id', 'name', 'avatar', 'compId']);
        }

		$design_comp_ids = [$product_row.createdByCompId]
        let $design_comp_rows = await Comp.find({
			where: {
				id: $design_comp_ids,
			},
			select: ['id', 'name', 'logo']
        });
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

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
			id     : $product_row.createdBy,
			name   : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].name || '',
			avatar : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].avatar || ''
		};
		delete $product_row.createdBy;

		$product_row.design_comp = {
			id     : $product_row.createdByCompId,
			name   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].name || '',
			logo   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].logo || '',
		};
		delete $product_row.createdByCompId;

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
		try{ $product_row.dimension = JSON.parse($product_row.dimension); } catch(e) { $product_row.dimension = []; }
		try{ $product_row.photoSize = JSON.parse($product_row.photoSize); } catch(e) { $product_row.photoSize = []; }
		try{ $product_row.photoStory = JSON.parse($product_row.photoStory); } catch(e) { $product_row.photoStory = []; }
	
		//购买后能查看CAD
		$product_row.transaction_no = $my_trans_row.id;
		$product_row.trans_order_no = $my_trans_row.orderNo;
		$product_row.contract_no    = $my_trans_row.contractNo;
		$product_row.trans_stat     = $my_trans_row.stat;
		$product_row.has_buy        = $me_has_buy;
		if($me_has_buy) try{ $product_row.photoCad = JSON.parse($product_row.photoCad); } catch(e) { $product_row.photoCad = []; }
		else $product_row.photoCad = [];

		return res.jsonok(cutil.snakeCaseObject($product_row));
	},

	detailSet: async function(req, res) {
		let $id = cutil.getReq(req, 'id');
		if(!$id.length) return res.jsonerr('套系不存在');
	
		let $set_row = await ProductSet.findOne($id);
		if(!_.size($set_row)) return res.jsonerr('套系不存在');

		let $my_trans_row = await sails.getDatastore().sendNativeQuery(
			"select transactionNo as id, stat, contractNo, orderNo from transaction where productType=" + CONST.TRANSACTION_PRODUCT_TYPE_SET + " and productNo='" + $id + "'" + " and buyByCompId=" + req.me.compId + 
			" order by stat desc limit 1"
		);
		$my_trans_row = _.size($my_trans_row.rows) && $my_trans_row.rows[0] || {};
			
		let $me_has_buy = false;
		if(_.size($my_trans_row) && $my_trans_row.stat >= CONST.TRANSACTION_STAT_PAID_OK && $my_trans_row.stat <= CONST.TRANSACTION_STAT_COMPLETE) $me_has_buy = true;

        let $designer_ids = [$set_row.createdBy];
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers($designer_ids, ['id', 'name', 'avatar', 'compId']);
        }

		$design_comp_ids = [$set_row.createdByCompId]
        let $design_comp_rows = await Comp.find({
			where: {
				id: $design_comp_ids,
			},
			select: ['id', 'name', 'logo']
        });
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

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
		$product_rows = cutil.indexTabByCol($product_rows, 'setNo', 'id');

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
				product_rows : _.size($product_rows) && _.size($product_rows[$sub_set_row.id]) ? _.values($product_rows[$sub_set_row.id]) : []
			});
		});
		$set_row.product_rows = _.size($product_rows) && _.size($product_rows[$set_row.id]) ? _.values($product_rows[$set_row.id]) : [];

		$set_row.designer = {
			id: $set_row.createdBy,
			name: $designer_rows[$set_row.createdBy] && $designer_rows[$set_row.createdBy].name ? $designer_rows[$set_row.createdBy].name : '',
			avatar: $designer_rows[$set_row.createdBy] && $designer_rows[$set_row.createdBy].avatar ? $designer_rows[$set_row.createdBy].avatar : ''
		};

		$set_row.design_comp = {
			id     : $set_row.createdByCompId,
			name   : _.size($design_comp_rows[$set_row.createdByCompId]) && $design_comp_rows[$set_row.createdByCompId].name || '',
			logo   : _.size($design_comp_rows[$set_row.createdByCompId]) && $design_comp_rows[$set_row.createdByCompId].logo || '',
		};

		$set_row.style = {
			id: $set_row.styleNo,
			name: _.size($product_dict.style) && _.size($product_dict.style[$set_row.styleNo]) && $product_dict.style[$set_row.styleNo].name || ''
		};

		try{ $set_row.photos = JSON.parse($set_row.photos); } catch(e) { $set_row.photos = []; }

		$set_row.transaction_no = $my_trans_row.id;
		$set_row.trans_order_no = $my_trans_row.orderNo;
		$set_row.contract_no    = $my_trans_row.contractNo;
		$set_row.trans_stat     = $my_trans_row.stat;
		$set_row.has_buy        = $me_has_buy;
	
		return res.jsonok(cutil.snakeCaseObject($set_row));
	},

	buyProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');
        //if(!cutil.ucan(req.me.privs, CONST.PRIV_CONTRACT_SIGN)) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        let $product_id = cutil.getReq(req, 'product_no');
        if(!$product_id) return res.jsonerr('商品不存在');

        let $product_row = await DesignProduct.findOne({
            id        : $product_id,
			priceType : CONST.PRODUCT_PRICE_TYPE_PRICE
        });
        if(!$product_row) return res.jsonerr('商品不存在');
		if(req.me.compId == $product_row.createdByCompId) return res.jsonerr('不能自己买自己家的东西');
		if($product_row.stat != CONST.PRODUCT_STAT_PUBLISHED) return res.jsonerr('商品未上架');
		if($product_row.stock < 1) return res.jsonerr('哎呀，您看中的作品已被别人抢先一步预定了。去看看别的作品吧');

        let $sell_comp_row = await Comp.findOne({
            id: $product_row.createdByCompId
        });
        if(!$sell_comp_row || $sell_comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('卖方企业未认证');

        let $designer_ids = [$product_row.createdBy];
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers($designer_ids, ['id', 'name', 'avatar', 'compId']);
        }

		$design_comp_ids = [$product_row.createdByCompId]
        let $design_comp_rows = await Comp.find({
			where: {
				id: $design_comp_ids,
			},
			select: ['id', 'name', 'logo']
        });
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

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
			id     : $product_row.createdBy,
			name   : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].name || '',
			avatar : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].avatar || ''
		};

		$product_row.design_comp = {
			id     : $product_row.createdByCompId,
			name   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].name || '',
			logo   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].logo || '',
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
		try{ $product_row.dimension = JSON.parse($product_row.dimension); } catch(e) { $product_row.dimension = []; }
		try{ $product_row.photoSize = JSON.parse($product_row.photoSize); } catch(e) { $product_row.photoSize = []; }
		try{ $product_row.photoStory = JSON.parse($product_row.photoStory); } catch(e) { $product_row.photoStory = []; }
		try{ $product_row.photoCad = JSON.parse($product_row.photoCad); } catch(e) { $product_row.photoCad = []; }

		let $transaction_row;
		try {
			$transaction_row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					let transaction_no = await Transaction.genUUID(db);
					let $order_params = {
						bizOrderId      : transaction_no,
						bizType         : 'bq_order',
						ar              : $product_row.price,
						buyerId         : $comp_row.id,
						sellerId        : $sell_comp_row.id,
						contractConfig: {
							contract_title: '版权购买合同',
							side_a_id       : $comp_row.id,
							side_b_id       : $sell_comp_row.id,
							sign_order      : 'a,b',
							content_file    : $product_row.contractFile,
							custom_cover_page : $product_row.customCoverPage,
							contractArgs    : [
								{
									name: '商品名称', //商品名称
									value: $product_row.name
								},
								{
									name: '商品价格', //商品价格
									value: $product_row.price
								}
							]
						},
					};

					await Transaction.destroy({
						productNo   : $product_row.id,
						buyByCompId : $comp_row.id
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
						productType     : CONST.TRANSACTION_PRODUCT_TYPE_PRODUCT,
						productNo       : $product_row.id,
						contractNo      : $trans_order_info.contract_no,
						orderNo         : $trans_order_info.id,
						amount          : $product_row.price,
						saleBy          : $product_row.createdBy,
						saleByCompId    : $product_row.createdByCompId,
						buyBy           : req.me.id,
						buyByCompId     : $comp_row.id,
						productInfo     : JSON.stringify($product_row),
						styleNo         : $product_row.styleNo,
						name            : $product_row.name,
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

	buySet: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');
        //if(!cutil.ucan(req.me.privs, CONST.PRIV_CONTRACT_SIGN)) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        let $product_id = cutil.getReq(req, 'set_no');
        if(!$product_id) return res.jsonerr('商品不存在');

        let $product_row = await ProductSet.findOne({
            id        : $product_id,
			priceType : CONST.PRODUCT_PRICE_TYPE_PRICE
        });
        if(!$product_row) return res.jsonerr('商品不存在');
		if(req.me.compId == $product_row.createdByCompId) return res.jsonerr('不能自己买自己家的东西');
		if($product_row.stat != CONST.PRODUCT_STAT_PUBLISHED) return res.jsonerr('商品未上架');
		if($product_row.stock < 1) return res.jsonerr('哎呀，您看中的作品已被别人抢先一步预定了。去看看别的作品吧');

        let $sell_comp_row = await Comp.findOne({
            id: $product_row.createdByCompId
        });
        if(!$sell_comp_row || $sell_comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('卖方企业未认证');

        let $designer_ids = [$product_row.createdBy];
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers($designer_ids, ['id', 'name', 'avatar', 'compId']);
        }

		$design_comp_ids = [$product_row.createdByCompId]
        let $design_comp_rows = await Comp.find({
			where: {
				id: $design_comp_ids,
			},
			select: ['id', 'name', 'logo']
        });
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		let $style_no_arr = _.isString($product_row.styleNo) && $product_row.styleNo.trim().length ? [$product_row.styleNo] : [];
		let $tg_dict_api = new TGDictApi(req);
		let $product_dict = {};
		try {
			$product_dict = await $tg_dict_api.getDicts(null, {id: $style_no_arr}, null, null);
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || 'TgDictApi: error');
		}

		$product_row.designer = {
			id     : $product_row.createdBy,
			name   : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].name || '',
			avatar : _.size($designer_rows[$product_row.createdBy]) && $designer_rows[$product_row.createdBy].avatar || ''
		};

		$product_row.design_comp = {
			id     : $product_row.createdByCompId,
			name   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].name || '',
			logo   : _.size($design_comp_rows[$product_row.createdByCompId]) && $design_comp_rows[$product_row.createdByCompId].logo || '',
		};

		$product_row.style = {
			id: $product_row.styleNo,
			name: _.size($product_dict.style) && _.size($product_dict.style[$product_row.styleNo]) && $product_dict.style[$product_row.styleNo].name || ''
		};

		try{ $product_row.photos = JSON.parse($product_row.photos); } catch(e) { $product_row.photos = []; }

		let $transaction_row;
		try {
			$transaction_row = await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					let transaction_no = await Transaction.genUUID(db);
					let $order_params = {
						bizOrderId      : transaction_no,
						bizType         : 'bq_order',
						ar              : $product_row.price,
						buyerId         : $comp_row.id,
						sellerId        : $sell_comp_row.id,
						contractConfig: {
							contract_title: '版权购买合同',
							side_a_id       : $comp_row.id,
							side_b_id       : $sell_comp_row.id,
							sign_order      : 'a,b',
							content_file    : $product_row.contractFile,
							custom_cover_page : $product_row.customCoverPage,
							contractArgs    : [
								{
									name: '商品名称', //商品名称
									value: $product_row.name
								},
								{
									name: '商品价格', //商品价格
									value: $product_row.price
								}
							]
						},
					};

					await Transaction.destroy({
						productType : CONST.TRANSACTION_PRODUCT_TYPE_SET,
						productNo   : $product_row.id,
						buyByCompId : $comp_row.id
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
						productType     : CONST.TRANSACTION_PRODUCT_TYPE_SET,
						productNo       : $product_row.id,
						contractNo      : $trans_order_info.contract_no,
						orderNo         : $trans_order_info.id,
						amount          : $product_row.price,
						saleBy          : $product_row.createdBy,
						saleByCompId    : $product_row.createdByCompId,
						buyBy           : req.me.id,
						buyByCompId     : $comp_row.id,
						productInfo     : JSON.stringify($product_row),
						styleNo         : $product_row.styleNo,
						name            : $product_row.name,
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
};

