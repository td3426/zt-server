const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    listProductByCat: async function(req, res) {
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		$pagesize = $pagesize >= 1 ? $pagesize : 15;
		$pagesize = $pagesize <= 50 ? $pagesize : 50;

		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page >= 1 ? $page : 1;

		let $start = ($page - 1) * $pagesize;

		let $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;
		if(!$comp_id) return res.jsonerr('comp_id参数为空');

		let $where = {
			factoryCompId          : $comp_id,
			salebookPublish        : CONST.PRODUCT_MARMET_STAT_PUBLISHED,
			factoryParentProductNo : '-',
		};
		let $cat_id = parseInt(cutil.getReq(req, 'cat_id')) || 0;
		if($cat_id) {
			let $cat_rows = await ProductCat.find({
				where: {
					path: {
						contains: '"id":' + $cat_id + ','
					}
				},
				select: ['id', 'name']
			});
			if(_.size($cat_rows)) {
				let $cat_id_arr = [];
				_.each($cat_rows, function($cat_row) {
					$cat_id_arr.push($cat_row.id);
				});
				if(_.size($cat_id_arr)) $where.catId = {
					in: $cat_id_arr
				};
			}
		}

		if(req.param('is_video') != undefined && parseInt(cutil.getReq(req, 'is_video'))) {
			let $is_video = parseInt(cutil.getReq(req, 'is_video')) || 0;
			if($is_video) {
				$where.video = {
					'!=': [
						'',
						'[]'
					]
				};
			} else {
				$where.video = {
					'=': ''
				};
			}
		}

		let $n_product_rows = await FactoryProduct.count({
			where: $where
		});

		let $ret = {
			total: $n_product_rows,
			list: []
		};
		if(!$n_product_rows) return res.jsonok($ret);

		let $ret_fds = ["id", "name", "sname", "styleNo", "catId", "photoRender", "video", "videoThumb", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "salebookPublishedAt"];
		let $product_rows = await FactoryProduct.find({
			where : $where,
			skip  : $start,
			limit : $pagesize,
            sort  : 'salebookPublishedAt desc'
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

		_.each($product_rows, function($row){
            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }
			try{ $ret_row.video = $ret_row.video ? JSON.parse($ret_row.video) : []; } catch(e) { $ret_row.video = []; }

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

			delete $ret_row.factory_user_id;
			delete $ret_row.factory_comp_id;

			$ret.list.push($ret_row);
		});
	
		return res.jsonok($ret);
	},

    searchProduct: async function(req, res) {
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		$pagesize = $pagesize >= 1 ? $pagesize : 15;
		$pagesize = $pagesize <= 50 ? $pagesize : 50;

		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page >= 1 ? $page : 1;

		let $start = ($page - 1) * $pagesize;

		let $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;
		if(!$comp_id) return res.jsonerr('comp_id参数为空');

		let $where = {
			factoryCompId          : $comp_id,
			salebookPublish        : CONST.PRODUCT_MARMET_STAT_PUBLISHED,
			factoryParentProductNo : '-',
		};
		let $k = cutil.getReq(req, 'k');
		if($k && $k.length) $where.name = {
			contains: $k
		}

		let $n_product_rows = await FactoryProduct.count({
			where: $where
		});

		let $ret = {
			total: $n_product_rows,
			list: []
		};
		if(!$n_product_rows) return res.jsonok($ret);

		let $ret_fds = ["id", "name", "sname", "styleNo", "catId", "photoRender", "video", "videoThumb", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "salebookPublishedAt"];
		let $product_rows = await FactoryProduct.find({
			where : $where,
			skip  : $start,
			limit : $pagesize,
            sort  : 'salebookPublishedAt desc'
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

		_.each($product_rows, function($row){
            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }
			try{ $ret_row.video = $ret_row.video ? JSON.parse($ret_row.video) : []; } catch(e) { $ret_row.video = []; }

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

			delete $ret_row.factory_user_id;
			delete $ret_row.factory_comp_id;

			$ret.list.push($ret_row);
		});
	
		return res.jsonok($ret);
	},

    detailProduct: async function(req, res) {
        let $product_id = cutil.getReq(req, 'product_no');
		if(!$product_id.length) return res.jsonerr('商品不存在');

        let $share_user_id = parseInt(cutil.getReq(req, 'share_user_id'));

		let $ret_fds = ["id", "name", "sname", "styleNo", "catId", "moduleNo", "designIdea", "photoRender", "video", "videoThumb", "photoCad", "photoSample", "dimension", "intro", "photoSize", "photoStory", "stat", "salebookPublish", "designerUserId", "designerCompId", "factoryUserId", "factoryCompId", "publishedAt", "factoryParentProductNo", "priceType"];
		let $product_rows = await FactoryProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ factoryParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});

		let $product_ids = cutil.getTabCol($product_rows, 'id');
		$product_rows = cutil.indexTabByCol($product_rows, 'factoryParentProductNo', 'id');
		if(!_.size($product_rows) || !_.size($product_rows['-'])) return res.jsonerr('商品不存在');
		let $product_row = $product_rows['-'][$product_id];
		if(
			!_.size($product_row) ||
			$product_row.salebookPublish != CONST.PRODUCT_MARMET_STAT_PUBLISHED
		) {
			return res.jsonerr('商品不存在');
		}

		if($share_user_id) {
			let $share_user = await User.getUser($share_user_id, ['id', 'name', 'avatar', 'compId']);
			if($share_user.compId == parseInt($product_row.factoryCompId)) {
				try {
					let  $share_statistic_row = await ProductShareStatistics.findOne({
						productNo: $product_id,
						shareUserId: $share_user_id
					});
					if(_.size($share_statistic_row)) {
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
				} catch ($e) {
					sails.log.error($e);
				}
			}
		}

        let $designer_row = await User.getUsers([$product_row.designerUserId], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.designerUserId] || null;

		let $design_comp_row = $product_row.designerCompId ? await Comp.findOne($product_row.designerCompId) : null;

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//let $set_ids = [$product_row.setNo];
		//let $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		let $style_ids = [$product_row.styleNo];
		let $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		let $sku_rows = await FactoryProductSku.getStepPrice(_.values($product_ids), true);

		let $ret = cutil.snakeCaseObject(cutil.getRowCols($product_row, $ret_fds));

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

		$ret.style = {
			id: $product_row.styleNo,
			name: $style_rows && $style_rows[$product_row.styleNo] ? $style_rows[$product_row.styleNo].name : ''
		};
		delete $ret.style_no;

		$ret.step_price = $sku_rows[$product_row.id] || [];
		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			let $acc_row = {};

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.stat = $row.stat;
			$acc_row.intro = $row.intro;
			$acc_row.dimension = $row.dimension;
			$acc_row.photo_size = $row.photoSize;
			$acc_row.photo_story = $row.photoStory;
			$acc_row.step_price = $sku_rows[$row.id] || [];

			try{ $acc_row.dimension = $acc_row.dimension ? JSON.parse($acc_row.dimension) : {}; } catch(e) { $acc_row.dimension = {}; }
			try{ $acc_row.photo_size = $acc_row.photo_size ? JSON.parse($acc_row.photo_size) : []; } catch(e) { $acc_row.photo_size = []; }
			try{ $acc_row.photo_story = $acc_row.photo_story ? JSON.parse($acc_row.photo_story) : []; } catch(e) { $acc_row.photo_story = []; }

			$ret.accessory.push($acc_row);
		});

		return res.jsonok($ret);
	},

	addShareStatistics: async function(req, res) {
		let $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;
		if(!$comp_id) return res.jsonerr('comp_id参数为空');

		let $share_uid = parseInt(cutil.getReq(req, 'suid')) || 0;
		if(!$share_uid) return res.jsonerr('suid参数为空');
	
		if(await FactorySalebookShareStatistics.count({
			compId      : $comp_id,
			shareUserId : $share_uid
		})) {
			await sails.getDatastore().sendNativeQuery("update factory_salebook_share_statistics set nVisited=nVisited+1 where compId=" + $comp_id + " and shareUserId=" + $share_uid);
		} else {
			await FactorySalebookShareStatistics.create({
				compId      : $comp_id,
				shareUserId : $share_uid,
				nVisited    : 1
			});
		}
	
		return res.jsonok('ok');
	},

	listShareStatistics: async function(req, res) {
        let $compId = req.me.compId || 0;
        if(!$compId) return res.jsonerr('公司id为空');

		let $comp_row = await Comp.findOne({
			id: $compId
		});
		if(!_.size($comp_row)) return res.jsonerr('公司不存在');

		let $share_rows = await FactorySalebookShareStatistics.find({
			compId: $compId
		});
		let $share_user_ids = cutil.getTabCol($share_rows, 'shareUserId');
		let $share_user_rows = await User.find({
			id: _.values($share_user_ids)
		});
		$share_user_rows = cutil.indexTabByCol($share_user_rows, 'id');

        let ret = [];
        _.each($share_rows, function($share_row) {
            let $ret_row = {};

			$ret_row.share_user = {
				id: $share_row.shareUserId,
				name: $share_user_rows[$share_row.shareUserId] && $share_user_rows[$share_row.shareUserId].name ? $share_user_rows[$share_row.shareUserId].name : '',
                avatar: $share_user_rows[$share_row.shareUserId] && $share_user_rows[$share_row.shareUserId].avatar ? $share_user_rows[$share_row.shareUserId].avatar : ''
			}

			$ret_row.n_visited = $share_row.nVisited;

            ret.push($ret_row);
        });

        return res.jsonok(ret);
	},

	getAppQrCode: async function(req, res) {
		let $page_uri = cutil.getReq(req, 'page_uri');
		let $img_width = parseInt(cutil.getReq(req, 'img_width')) || 320;

		try {
			let $wx_api = new WxApi(req);
			let $access_token_info = await $wx_api.getAccessToken();
			let $data = {
				scene: 'compid=' + req.me.compId + '&suid=' + req.me.id,
				width: $img_width
			};
			if($page_uri) $data.page = $page_uri;

			let $code_img = await $wx_api.getWxAppQrCode($access_token_info.access_token, $data);

			try {
				$error = JSON.parse($code_img);
				return res.jsonerr($error.errmsg);
			} catch($e) {
				return res.jsonok({
					img: cutil.base64Encode($code_img)
				});
				//return res.set('Content-Type', 'image/png').send($code_img);
			}
		} catch($e) {
			console.log($e);
			return res.jsonerr($e.message || $e.toString());
		}
	},
};

