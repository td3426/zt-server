
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

	addFav: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        const $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
	
		const $product_id = cutil.getReq(req, 'factory_product_no');
		if(!$product_id) return res.jsonerr('商品不存在');

		const $product_row = await FactoryProduct.findOne($product_id);
		if(!$product_row || !_.size($product_row)) return res.jsonerr('商品不存在');

		if(CONST.PRODUCT_STAT_PUBLISHED != parseInt($product_row.stat)) return res.jsonerr('商品未上架');
	
		if(await MarketFav.count({
			where: {
				userId           : req.me.id,
				factoryProductNo : $product_id,
			},
		})) return res.jsonerr('不能重复收藏');
	
		await MarketFav.create({
			compId           : req.me.compId,
			userId           : req.me.id,
			factoryProductNo : $product_id,
			priceType        : $product_row.priceType,
		});
	
		return res.jsonok('ok');
	},

	delFav: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

		const $product_id = cutil.getReq(req, 'factory_product_no');
		if(!$product_id) return res.jsonerr('记录不存在');
	
		if(!await MarketFav.count({
			where: {
				userId           : req.me.id,
				factoryProductNo : $product_id,
			},
		})) return res.jsonerr('记录不存在');
	
		await MarketFav.destroy({
			userId           : req.me.id,
			factoryProductNo : $product_id,
		});

		return res.jsonok('ok');
	},

	listFav: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        const $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
	
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        const $start = ($page - 1) * $pagesize;
		const $type = parseInt(cutil.getReq(req, 'type')) || 0; //0工厂款，1设计师合作款

		const $where = {
			priceType: {
				in: [CONST.PRODUCT_PRICE_TYPE_PRICE, CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF]
			},
			userId: req.me.id,
		};
		if($type) $where.priceType = CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE;

		const $n_fav_rows = await MarketFav.count($where);
		const $fav_rows = await MarketFav.find({
			where  : $where,
			select : ['factoryProductNo'],
			skip   : $start,
			limit  : $pagesize,
			sort   : 'createdAt desc'
		});

		const $product_ids = cutil.getTabCol($fav_rows, 'factoryProductNo');
		let $product_rows = await FactoryProduct.find({
			id: _.values($product_ids)
		});
		$product_rows = cutil.indexTabByCol($product_rows, 'id');

		let $design_product_cooperated_count_rows;
		if($type) {
			//设计师合作款，增加cooperatedCount字段
			const $designProductNos = cutil.getTabCol($product_rows, 'designProductNo');
			if(Object.keys($designProductNos).length) {
				$design_product_cooperated_count_rows = await DesignProduct.find({
					where: {
						id: _.values($designProductNos)
					},
					select: ['id', 'nCooperated']
				});
				$design_product_cooperated_count_rows = cutil.indexTabByCol($design_product_cooperated_count_rows, 'id');
			}
		}

		let $factory_comp_ids = cutil.getTabCol($product_rows, 'factoryCompId');
        let $factory_comp_rows = await Comp.getComps(_.values($factory_comp_ids), ['id', 'name', 'logo', 'aptitude']);
		$factory_comp_rows = cutil.indexTabByCol($factory_comp_rows, 'id');


		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

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


		const $ret =[];
		const $ret_fds = ["id", "name", "designProductNo", "styleNo", "catId", "customCatNo", "photoRender", "factoryCompId", 'startPrice', 'skuCount', 'isProof'];
		_.each($fav_rows, function($row){
			const $product_row = $product_rows[$row.factoryProductNo];
			if(!$product_row) return true;

            const $ret_row = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));
			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }

			if($type) {
				$ret_row.cooperatedCount = $design_product_cooperated_count_rows && $design_product_cooperated_count_rows[$product_row.designProductNo] && $design_product_cooperated_count_rows[$product_row.designProductNo].nCooperated || 0;
			}

			$ret_row.cat = {
				id: $product_row.catId,
				name: $cat_rows && $cat_rows[$product_row.catId] ? $cat_rows[$product_row.catId].name : ''
			};
			delete $ret_row.cat_id;

			$ret_row.custom_cat = {
				id   : $product_row.customCatNo,
				name : _.size($product_custom_cat_rows) && _.size($product_custom_cat_rows[$product_row.customCatNo]) && $product_custom_cat_rows[$product_row.customCatNo].name || ''
			};
			delete $ret_row.custom_cat_no;

			$ret_row.style = {
				id: $product_row.styleNo,
				name: $style_rows && $style_rows[$product_row.styleNo] ? $style_rows[$product_row.styleNo].name : ''
			};
			delete $ret_row.style_no;

			$ret_row.factory_comp = {
				id: $product_row.factoryCompId,
				name: $factory_comp_rows && $factory_comp_rows[$product_row.factoryCompId] ? $factory_comp_rows[$product_row.factoryCompId].name : '',
				logo: $factory_comp_rows && $factory_comp_rows[$product_row.createdByCompId] ? $factory_comp_rows[$product_row.createdByCompId].logo : ''
			};
			delete $ret_row.factory_comp_id;

			let $aptitude = $factory_comp_rows[$product_row.factoryCompId] ? $factory_comp_rows[$product_row.factoryCompId].aptitude : '';
			try{ $aptitude = JSON.parse($aptitude); } catch(e) {$aptitude = {};}
			$ret_row.factory_comp.aptitude = $aptitude;

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_fav_rows});
	},

	statFav: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

		const $ret = { is_exist: false };
		const $product_id = cutil.getReq(req, 'factory_product_no');
		if(!$product_id) return res.jsonok($ret);
	
		if(await MarketFav.count({
			where: {
				userId           : req.me.id,
				factoryProductNo : $product_id,
			},
		})) $ret.is_exist = true;

		return res.jsonok($ret);
	},

};

