
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
	listPercentProduct: async function(req, res) {
	    if(!req.me.compId) return res.jsonerr('没有权限');

        let $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $fname = cutil.getReq(req, 'fname');

		let $where = {
			priceType: CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE,
			factoryCompId: req.me.compId,
			factoryParentProductNo: '-'
		};

		let $ret_fds = ["id", "name", "sname",  "styleNo", "catId", "photoRender", "photoSample", "pricePercent", "stat", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "publishedAt", "expireAt"];

		let $n_product_rows  = 0;
		let $product_rows = [];
		if(_.size($fname)) {
			let $k = cutil.dbEscape($fname);
			$n_product_rows = await sails.getDatastore().sendNativeQuery(
				"select count(1) as cnt from factory_product as pd " +
				" left join company as comp on pd.designerCompId=comp.id" +
				" where pd.priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE + " and factoryCompId=" + req.me.compId + " and factoryParentProductNo='-' " +
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
				" where pd.priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE + " and factoryCompId=" + req.me.compId + " and factoryParentProductNo='-' " +
				" and (pd.name like '%" + $k + "%' or moduleNo like '%" + $k + "%' or comp.name like '%" + $k + "%')" + 
				" order by pd.updatedAt desc" +
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
				sort: 'updatedAt desc'
			});
		}

		let $product_ids = cutil.getTabCol($product_rows, 'id');

		let $acc_rows = await FactoryProduct.find({
			factoryParentProductNo: _.values($product_ids)
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
					intro: $acc_row.intro,
					dimension: $acc_row.dimension,
					photo_size: $acc_row.photoSize,
					photo_story: $acc_row.photoStory,
					step_price: $sku_rows[$acc_row.id] || []
				};

				try{ $ret_acc_row.dimension = $ret_acc_row.dimension ? JSON.parse($ret_acc_row.dimension) : []; } catch(e) { $ret_acc_row.dimension = []; }
				try{ $ret_acc_row.photo_size = $ret_acc_row.photo_size ? JSON.parse($ret_acc_row.photo_size) : []; } catch(e) { $ret_acc_row.photo_size = []; }
				try{ $ret_acc_row.photo_story = $ret_acc_row.photo_story ? JSON.parse($ret_acc_row.photo_story) : []; } catch(e) { $ret_acc_row.photo_story = []; }

				$ret_row.accessory.push($ret_acc_row);
			});

			$ret_row.sale_amount = _.size($sale_rows) &&
				_.size($sale_rows[$row.id]) &&
				$sale_rows[$row.id].sale_amount || 0;

			$ret_row.is_bom = $nbom_rows && $nbom_rows[$row.id] && parseInt($nbom_rows[$row.id].bom) ? 1 : 0;

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

		var $ret_fds = ["id", "name", "sname", "styleNo", "catId", "designIdea", "photoRender", "photoSample", "photoCad", "dimension", "intro", "photoSize", "photoStory", "pricePercent", "stat", "designerUserId", "designerCompId", "publishedAt", "factoryParentProductNo", "priceType"];
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
				CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE
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


		var $style_ids = [$product_row.styleNo];
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		var $sku_rows = await FactoryProductSku.getStepPrice(_.values($product_ids));

		var $tm = moment().valueOf();
		var $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

		try{ $ret.photo_render = $ret.photo_render ? JSON.parse($ret.photo_render) : []; } catch(e) { $ret.photo_render = []; }
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

		return res.jsonok($ret);
	},

	terminatePercentProduct: async function(req, res) {
		if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

        var $factory_product_id = cutil.getReq(req, 'factory_product_no');
		if(!$factory_product_id) return res.jsonerr('合作信息不存在');
		var $factory_product_row = await FactoryProduct.findOne($factory_product_id);
		if(!$factory_product_row || !_.size($factory_product_row)) return res.jsonerr('合作信息不存在');
		if($factory_product_row.factoryCompId != req.me.compId) return res.jsonerr('合作商品不属于该公司');
		if($factory_product_row.stat != CONST.PRODUCT_STAT_INUSE) return res.jsonerr('合作商品已过期或者已终止');

		let $tm = moment().valueOf();
		await FactoryProduct.update({
			or: [
				{ id: $factory_product_id },
				{ factoryParentProductNo: $factory_product_id },
			]
		}).set({
			stat            : CONST.PRODUCT_STAT_END,
			endAt           : $tm,
			marketPublish   : CONST.PRODUCT_MARMET_STAT_BAND,
			marketBanAt     : $tm,
			salebookPublish : CONST.PRODUCT_MARMET_STAT_BAND,
			salebookBanAt   : $tm
		});

		var $design_product_rows = await DesignProduct.find({
			or: [
				{ id: $factory_product_row.designProductNo },
				{ designParentProductNo: $factory_product_row.designProductNo }
			]
		});

		var $update_ids = [];
		var $pos_str = [];
		for(var i = 0; i < _.size($design_product_rows); i ++) {
			var $row = $design_product_rows[i];
			$update_ids.push($row.id);
			$pos_str.push('$' + (i + 1));
		}
		$pos_str = $pos_str.join(',');
		await sails.getDatastore('factory').sendNativeQuery(
			"update design_product set nCooperated=nCooperated-1 where designProductNo in(" + $pos_str + ") and nCooperated>0",
			$update_ids
		);

		//await FactoryProduct.updateSkuStatstics($factory_product_row.id, $factory_product_row.designProductNo);

		return res.jsonok('ok');
	},
};

