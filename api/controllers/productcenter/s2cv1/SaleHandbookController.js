const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

    detail: async function(req, res) {
        var $product_id = cutil.getReq(req, 'product_no');
        if(!$product_id) return res.jsonerr('商品不存在');

        var $share_user_id = cutil.getReq(req, 'share_user_id');

		var $ret_fds = ["id", "name", "styleNo", "catId", "designIdea", "photoRender", "photoCad", "size", "photoSize", "photoStory", "stat", "marketPublish", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "publishedAt", "factoryParentProductNo", "priceType"];
		var $product_rows = await FactoryProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ factoryParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});

		$product_rows = cutil.indexTabByCol($product_rows, 'factoryParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		var $product_row = $product_rows['-'][$product_id];
		if(parseInt($product_row.marketPublish) != CONST.PRODUCT_MARMET_STAT_PUBLISHED) return res.jsonerr('商品未上架');

        let $share_user = await User.getUser($share_user_id, ['id', 'name', 'avatar', 'compId']);
		if($share_user.compId == $product_row.factoryCompId) {
			try {
				var  $share_statistic_row = await ProductShareStatistics.findOne({
					productNo: $product_id,
					shareUserId: $share_user_id
				});
				if($share_statistic_row) {
					await ProductShareStatistics.update({
						productNo: $product_id,
						shareUserId: $share_user_id,
					}).set({
						nVisited: $share_statistic_row.nVisited + 1
					});
				} else {
					await ProductShareStatistics.create({
						productNo: $product_id,
						compId: $product_row.factoryCompId,
						shareUserId: $share_user_id,
						nVisited: 1
					});
				}
			} catch ($e) {}
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

		var $tm = moment().valueOf();
		var $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

		try{ $ret.photo_render = $ret.photo_render ? JSON.parse($ret.photo_render) : []; } catch(e) { $ret.photo_render = []; }
		try{ $ret.photo_cad = $ret.photo_cad ? JSON.parse($ret.photo_cad) : []; } catch(e) { $ret.photo_cad = []; }
		try{ $ret.size = $ret.size ? JSON.parse($ret.size) : {}; } catch(e) { $ret.size = {}; }
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

		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			var $acc_row = {};

			if($row.stat == CONST.PRODUCT_STAT_DELETED) return true;

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.size = $row.size;
			$acc_row.photo_size = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;

			try{ $acc_row.size = $acc_row.size ? JSON.parse($acc_row.size) : {}; } catch(e) { $acc_row.size = {}; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }


			$ret.accessory.push($acc_row);
		});

        return res.jsonok($ret);
    },

	listProductShareStatistics: async function(req, res) {
	    var $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        var $page = parseInt(cutil.getReq(req, 'page')) || 1;
        var $start = ($page - 1) * $pagesize;
        var $compId = req.me.compId || 0;
        //var $compId = parseInt(cutil.getReq(req, 'comp_id')) || 0;

        if(!$compId) return res.jsonerr('请输入正确的公司id');

		var $comp_row = await Comp.findOne({
			id: $compId
		});
		if(!$comp_row) return res.jsonerr('公司不存在');

		var $where = {
				compId: $compId
			};
        var $nrows = await ProductShareStatistics.count($where);
		var $share_rows = await ProductShareStatistics.find({
            where: $where,
            skip: $start,
            limit: $pagesize,
            sort: 'createdAt desc'
		});
		var $product_ids = cutil.getTabCol($share_rows, 'productNo');
		var $share_user_ids = cutil.getTabCol($share_rows, 'shareUserId');
		var $share_user_rows = await User.find({
			id: _.values($share_user_ids)
		});
		$share_user_rows = cutil.indexTabByCol($share_user_rows, 'id');

		var $ret_fds = ["id", "name", "styleNo", "catId", "photoRender", "price", "pricePercent", "stat", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "publishedAt"];

        var $product_rows = await FactoryProduct.find({
            where: {
				id: _.values($product_ids)
			},
            select: $ret_fds,
            skip: $start,
            limit: $pagesize,
            sort: 'createdAt desc'
        });
		$product_rows = cutil.indexTabByCol($product_rows, 'id');

        let $designer_ids = cutil.getTabCol($product_rows, 'designerUserId');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'designerCompId');
        let $design_comp_rows = await Comp.getComps(_.values($design_comp_ids), ['id', 'name', 'logo']);
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//var $set_ids = cutil.getTabCol($product_rows, 'setNo');
		//var $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		var $style_ids = cutil.getTabCol($product_rows, 'styleNo');
		var $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');


        let ret = [];
        _.each($share_rows, function($share_row) {
			if(!$product_rows[$share_row.productNo]) return true;

			let $row = $product_rows[$share_row.productNo];
            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }

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

			$ret_row.share_user = {
				id: $share_row.shareUserId,
				name: $share_user_rows[$share_row.shareUserId] && $share_user_rows[$share_row.shareUserId].name ? $share_user_rows[$share_row.shareUserId].name : '',
                avatar: $share_user_rows[$share_row.shareUserId] && $share_user_rows[$share_row.shareUserId].avatar ? $share_user_rows[$share_row.shareUserId].avatar : ''
			}

			$ret_row.n_visited = $share_row.nVisited;

            ret.push($ret_row);
        });

        return res.jsonok({list: ret, total: $nrows});
	}

};

