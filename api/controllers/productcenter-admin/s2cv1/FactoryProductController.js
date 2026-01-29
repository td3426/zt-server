
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    list: async function(req, res) {
		let $cat_id        = parseInt(cutil.getReq(req, 'cat_id')) || 0;
		let $set_no        = cutil.getReq(req, 'set_no');
		let $style_no      = cutil.getReq(req, 'style_no');
		let $market_stat   = parseInt(cutil.getReq(req, 'market_stat')) || 0;
		let $handbook_stat = parseInt(cutil.getReq(req, 'handbook_stat')) || 0;
		let $page          = parseInt(cutil.getReq(req, 'page')) || 0;
		$page              = $page || 1;
		let $pagesize      = parseInt(cutil.getReq(req, 'pagesize')) || 0;
		$pagesize          = $pagesize || 15;
		let $start         = ($page - 1) * $pagesize;
		let $k             = cutil.getReq(req, 'k');

		let $cond = ["factoryParentProductNo='-'"];
		if($cat_id) $cond.push("pd.catId=" + $cat_id);
		//if($set_no) $cond.push("pd.setNo='" + $set_no + "'");
		if($style_no) $cond.push("pd.styleNo='" + $style_no + "'");

		let $tm = moment().valueOf();
		if($market_stat == 1) {
			//已上架
			$cond.push('pd.marketPublish=1');
		} else if($market_stat == 2) {
			//未上架
			$cond.push('pd.marketPublish=0');
		} else if($market_stat == 3) {
			//已终止/已过期/已删除
			$cond.push('(pd.stat=3 or expireAt>0 and expireAt <=' + $tm + ')');
		}

		if($handbook_stat == 1) {
			//已上架
			$cond.push('pd.salebookPublish=1');
		} else if($handbook_stat == 2) {
			//未上架
			$cond.push('pd.salebookPublish=0');
		} else if($handbook_stat == 3) {
			//已终止/已过期/已删除
			$cond.push('(pd.stat=3 or expireAt>0 and expireAt <=' + $tm + ')');
		}

		if(_.size($k)) $cond.push("pd.name like '%" + cutil.dbEscape($k) + "%'");

		let $sql = "from factory_product as pd";
		if(_.size($cond)) $sql += ' where ' + $cond.join(' and ');

		let $n_rows = await sails.getDatastore().sendNativeQuery("select count(1) as cnt " + $sql);
		$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0;

		let $ret = {
			total : $n_rows,
			list  : []
		};
		if(!$n_rows) return res.jsonok($ret);

		let $product_rows = await sails.getDatastore().sendNativeQuery("select pd.* " + $sql + " limit " + $start + ',' + $pagesize);
		$product_rows = $product_rows && $product_rows.rows || [];

		let $product_ids = cutil.getTabCol($product_rows, 'factoryProductNo');

		let $factory_comp_ids = cutil.getTabCol($product_rows, 'factoryCompId');
        let $factory_comp_rows = await Comp.getComps(_.values($factory_comp_ids), ['id', 'name', 'logo']);
		$factory_comp_rows = cutil.indexTabByCol($factory_comp_rows, 'id');

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



		let $n_sku_rows = await sails.getDatastore().sendNativeQuery("select sku.factoryProductNo, sum(1) as cnt from factory_product_sku as sku where sku.factoryProductNo in ('" + _.values($product_ids).join("','") + "') and stat=1 group by sku.factoryProductNo");
		$n_sku_rows = $n_sku_rows && $n_sku_rows.rows || [];
		$n_sku_rows = cutil.indexTabByCol($n_sku_rows, 'factoryProductNo');

		_.each($product_rows, function($product_row) {
			let $ret_row = {
				id   : $product_row.factoryProductNo,
				name : $product_row.name
			};

			try {
				$ret_row.photo_render = JSON.parse($product_row.photoRender);
			} catch($e) {
				$ret_row.photo_render = [];
			}

			try {
				$ret_row.photo_story = JSON.parse($product_row.photoStory);
			} catch($e) {
				$ret_row.photo_story = [];
			}

			try {
				$ret_row.photo_size = JSON.parse($product_row.photoSize);
			} catch($e) {
				$ret_row.photo_size = [];
			}

			$ret_row.n_sku = _.size($n_sku_rows) && $n_sku_rows[$product_row.factoryProductNo] && $n_sku_rows[$product_row.factoryProductNo].cnt || 0;
			$ret_row.start_price = $product_row.startPrice;

			$ret_row.salebook_stat = parseInt($product_row.salebookPublish) == 1 ? 1 : 2;
			$ret_row.market_stat   = parseInt($product_row.marketPublish) == 1 ? 1 : 2;

			$product_row.expireAt = parseInt($product_row.expireAt);
			if(parseInt($product_row.stat) == 3 || $product_row.expireAt > 0 && $product_row.expireAt <= $tm) {
				$ret_row.salebook_stat = 3;
				$ret_row.market_stat   = 3;
			}

			$ret_row.factory = $factory_comp_rows && $factory_comp_rows[$product_row.factoryCompId] || {};
			$ret_row.module_no = $product_row.moduleNo;

			$ret_row.cat = {
				id: $product_row.catId,
				name: _.size($product_dict.cat) && _.size($product_dict.cat[$product_row.catId]) && $product_dict.cat[$product_row.catId].name || ''
			};

			//$ret_row.set = {
			//	id   : $set_rows && $set_rows[$product_row.setNo] && $set_rows[$product_row.setNo].pid || '',
			//	name : $set_rows && $set_rows[$product_row.setNo] && $pset_rows && $pset_rows[$set_rows[$product_row.setNo].pid] ? $pset_rows[$set_rows[$product_row.setNo].pid].name : ''
			//};
			//$ret_row.set_id = $product_row.setNo;

			$ret_row.style = {
				id: $product_row.styleNo,
				name: _.size($product_dict.style) && _.size($product_dict.style[$product_row.styleNo]) && $product_dict.style[$product_row.styleNo].name || ''
			};

			$ret.list.push($ret_row);
		});

		return res.jsonok($ret);
	},

    statistics: async function(req, res) {
		let $ret = {};

		//按一级分类统计商品数
        let $cat_rows = await ProductCat.find();
		let $top_cat_rows = {};
        _.each($cat_rows, function($row){
			if($row.pid) return true;
			$top_cat_rows[$row.id] = $row;
			$top_cat_rows[$row.id].subcats = [];
			$top_cat_rows[$row.id].subcats.push($row.id);
		});

        _.each($cat_rows, function($row){
			let $path = [];
			try {
				$path = JSON.parse($row.path);
			} catch(e) {
				$path = [];
			}

			if(!_.size($path)) return true;
			if(!cutil.defined($top_cat_rows[$path[0].id])) return true;

			$top_cat_rows[$path[0].id].subcats.push($row.id);
        });

		if(_.size($top_cat_rows)) {
			for(let $idx_cat_id_map in $top_cat_rows) {
				let $cat_row = $top_cat_rows[$idx_cat_id_map];
				if(_.size($cat_row.subcats)) {
					$cat_row.n_product = await FactoryProduct.count({
						catId: $cat_row.subcats,
						factoryParentProductNo: '-'
					});
				} else {
					$cat_row.n_product = 0;
				}
			}
		}

		$ret.cat = _.values($top_cat_rows).sort(function(a, b) {return a.order - b.order});
		_.each($ret.cat, function($cat_row) {
			delete $cat_row.pid;
			delete $cat_row.order;
			delete $cat_row.icon;
			delete $cat_row.path;
			delete $cat_row.subcats;
		});
		delete $cat_rows;

		//按风格统计商品数
		let $style_rows = await ProductStyle.find({
			sort: [{order: 'asc'}]
		});
		let $style_n_product_rows = await sails.getDatastore().sendNativeQuery("select sum(1) as cnt, styleNo from factory_product as p where p.factoryParentProductNo='-' group by styleNo");
		$style_n_product_rows = _.size($style_n_product_rows) && _.size($style_n_product_rows.rows) ? $style_n_product_rows.rows : [];
		$style_n_product_rows = cutil.indexTabByCol($style_n_product_rows, 'styleNo');

		_.each($style_rows, function($style_row) {
			$style_row.n_product = $style_n_product_rows[$style_row.id] && $style_n_product_rows[$style_row.id].cnt || 0;
		});

		$ret.style = $style_rows;
		_.each($ret.style, function($style_row) {
			delete $style_row.order;
		});
		delete $style_n_product_rows;

		//按有无套系
		//$ret.set = {};
		//$ret.set.yes = await FactoryProduct.count({
		//	setNo: {
		//		'!=': ''
		//	},
		//	factoryParentProductNo: '-'
		//});;
		//$ret.set.no = await FactoryProduct.count({
		//	setNo: '',
		//	factoryParentProductNo: '-'
		//});

		//价格分布
		//500以下，501 - 1000，1001 - 5000，5000以上
		let $price_range = [
			{start: 0, end: 500},
			{start: 500, end: 1000},
			{start: 1000, end: 5000},
			{start: 5000, end: 9999999},
		];
		let $n_product = 0;
		for(let $idx_price_range in $price_range) {
			let $price_range_row = $price_range[$idx_price_range];
			$price_range_row.n_product = await sails.getDatastore().sendNativeQuery("select sum(1) as cnt from factory_product_step_price where price>" + $price_range_row.start + " and price <= " + $price_range_row.end);
			$price_range_row.n_product = $price_range_row.n_product && $price_range_row.n_product.rows && $price_range_row.n_product.rows[0] && $price_range_row.n_product.rows[0].cnt || 0;
			$n_product += $price_range_row.n_product;
		}
		_.each($price_range, function($price_range_row) {
			$price_range_row.n_product_percent = $n_product ? ($price_range_row.n_product / $n_product) * 100 : 0;
		});
		$ret.price = $price_range;

		//按商品属性统计
		$ret.product = {};
		//总商品数
		$ret.product.total = await FactoryProduct.count({factoryParentProductNo: '-'});
		//SKU总数
		$ret.product.sku_total = await FactoryProductSku.count();
		//已删除
		$ret.product.del = await FactoryProduct.count({
			factoryParentProductNo: '-',
			stat: CONST.PRODUCT_STAT_DELETED
		});
		//未填写SKU
		$ret.product.no_sku = await FactoryProduct.count({
			factoryParentProductNo: '-',
			skuCount: 0
		});
		//有素材图
		$ret.product.has_story_photo = await FactoryProduct.count({
			factoryParentProductNo: '-',
			photoStory: {
				'!=': '[]'
			}
		});
		//有标高图
		$ret.product.has_size_photo = await FactoryProduct.count({
			factoryParentProductNo: '-',
			photoSize: {
				'!=': '[]'
			}
		});
		//有视频
		$ret.product.has_video = await FactoryProduct.count({
			factoryParentProductNo: '-',
			video: {
				'!=': '[]'
			}
		});
		//有CAD文件
		$ret.product.has_cad_photo = await FactoryProduct.count({
			factoryParentProductNo: '-',
			photoCad: {
				'!=': '[]'
			}
		});

		//集市商品统计
		$ret.market = {};
		$ret.market.publish = await FactoryProduct.count({
			factoryParentProductNo: '-',
			marketPublish: CONST.PRODUCT_MARMET_STAT_PUBLISHED
		});
		$ret.market.unpublish = await FactoryProduct.count({
			factoryParentProductNo: '-',
			marketPublish: CONST.PRODUCT_MARMET_STAT_BAND
		});

		//销售手册商品统计
		$ret.salebook = {};
		$ret.salebook.publish = await FactoryProduct.count({
			factoryParentProductNo: '-',
			salebookPublish: CONST.PRODUCT_MARMET_STAT_PUBLISHED
		});
		$ret.salebook.unpublish = await FactoryProduct.count({
			factoryParentProductNo: '-',
			salebookPublish: CONST.PRODUCT_MARMET_STAT_BAND
		});

		return res.jsonok($ret);
	},

	saleOrderStyleStatistics: async function(req, res) {
		const $tm_type = parseInt(cutil.getReq(req, 'tm_type')) || 1; //1月度，2季度，3年度
		let $day_val = 86400 * 30 * 1000; //月度
		if($tm_type == 2) $day_val = 86400 * 30 * 3 * 1000; //季度
		else if($tm_type == 3) $day_val = 86400 * 365 * 1000; //年度

		const $tm = moment().valueOf();
		const $tm_start = $tm - $day_val;
		const $tm_end = $tm;
		$sql = `select fp.styleNo, sum(ts.cnt) as cnt from factory_product as fp inner join (select t1.fitem, sum(t1.fcount) as cnt from t_pur_order_entries t1 left join t_pur_order t on t.fid = t1.forder where t.fstate>=6 and t.fsrc='js' and t.fcreated_at >= ${$tm_start} and t.fcreated_at <${$tm_end} group by t1.fitem) as ts on fp.factoryProductNo=ts.fitem group by fp.styleNo order by cnt desc`;
		//sails.log($sql);

		let $rows = await sails.getDatastore().sendNativeQuery($sql);
		$rows = _.size($rows) && _.size($rows.rows) ? $rows.rows : [];

		const $ret = [];
		let $style_rows;
		if($rows.length) {
			const $style_ids = cutil.getTabCol($rows, 'styleNo');
			$style_rows = await ProductStyle.find({
				id: _.values($style_ids)
			});
			$style_rows = cutil.indexTabByCol($style_rows, 'id');
		}

		_.each($rows, ($row) => {
			$ret.push({
				style_no : $row.styleNo,
				name     : $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : '',
				count    : $row.cnt,
			});
		});

		return res.jsonok($ret);
	},
};

