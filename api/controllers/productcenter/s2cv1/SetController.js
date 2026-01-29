'use strict'

const moment = require('moment');
const flaverr = require('flaverr');

//该文件已废弃
module.exports = {

	listSet: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

		let $price_type = parseInt(cutil.getReq(req, 'price_type', 0)) || 0;

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		//$price_type = $price_type == CONST.PRODUCT_PRICE_TYPE_PRICE 
		//	? [CONST.PRODUCT_PRICE_TYPE_PRICE, CONST.PRODUCT_PRICE_TYPE_FACTORY_SELF]
		//	: CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE;

		let $product_count_rows = {};
		if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY) {
			$product_count_rows = await sails.getDatastore().sendNativeQuery(
				"select setNo, count(1) as cnt from factory_product where factoryCompId=$1 group by setNo",
				[$comp_row.id]
			);
			$product_count_rows = _.size($product_count_rows) && _.size($product_count_rows.rows) && $product_count_rows.rows || []
			$product_count_rows = _.size($product_count_rows) ? cutil.indexTabByCol($product_count_rows, 'setNo') : {};
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER) {
			$product_count_rows = await sails.getDatastore().sendNativeQuery(
				"select setNo, count(1) as cnt from design_product where createdByCompId=$1 group by setNo",
				[$comp_row.id]
			);
			$product_count_rows = _.size($product_count_rows) && _.size($product_count_rows.rows) && $product_count_rows.rows || []
			$product_count_rows = _.size($product_count_rows) ? cutil.indexTabByCol($product_count_rows, 'setNo') : {};
		}

		let $rows = await ProductSet.getAllByCompId($comp_id, $price_type);
		let $ret = [];
		_.each($rows, function($row) {
			$row.productCount = _.size($product_count_rows[$row.id]) && $product_count_rows[$row.id].cnt || 0;
			$ret.push(cutil.snakeCaseObject($row));
		});

		$ret.sort((a, b) => {
			const oa = parseInt(a.order_no) || 0;
			const ob = parseInt(b.order_no) || 0
			return oa - ob;
		});

		return res.jsonok($ret);
	},

	listCompSet: async function(req, res) {
		const $comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

        const $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');

		let $rows = await ProductSet.find({
			createdByCompId: $comp_id
		});

		let $ret = [];
		_.each($rows, function($row) {
			$ret.push(cutil.snakeCaseObject($row));
		});

		$ret.sort((a, b) => {
			const oa = parseInt(a.order_no) || 0;
			const ob = parseInt(b.order_no) || 0
			return oa - ob;
		});


		return res.jsonok($ret);
	},

	listChildSet: async function(req, res) {
		const $pid = cutil.getReq(req, 'set_id');
		if(!$pid) return res.jsonerr('pid参数错误');

		let $rows = await ProductSet.find({
			pid: $pid
		});

		let $ret = [];
		_.each($rows, function($row) {
			$ret.push(cutil.snakeCaseObject($row));
		});

		$ret.sort((a, b) => {
			const oa = parseInt(a.order_no) || 0;
			const ob = parseInt(b.order_no) || 0
			return oa - ob;
		});


		return res.jsonok($ret);
	},

	infoMultiSet: async function(req, res) {
		let $set_ids = [];
		if(_.isArray(req.param('set_ids'))) {
			$set_ids = req.param('set_ids').map(v => (_.isString(v) ? v.trim() : '')).filter(v => (v.length));
		}
		if(!_.size($set_ids)) return res.jsonerr('套系不存在');

		let $set_rows = await ProductSet.find({
			id: $set_ids
		});
		if(!_.size($set_rows)) return res.jsonerr('套系不存在');

		let $ret = $set_rows.map($set_row => (cutil.snakeCaseObject($set_row)));

		return res.jsonok($ret);
	},

	addSet: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

		let $name = cutil.getReq(req, 'name');
		let $price_type = parseInt(cutil.getReq(req, 'price_type', 0)) || 0;
		//$price_type = $price_type == CONST.PRODUCT_PRICE_TYPE_PRICE 
		//	? CONST.PRODUCT_PRICE_TYPE_PRICE
		//	: CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE;
		let $photos = [];
		if(_.isArray(req.param('photos'))) {
			$photos = req.param('photos').filter(v => (_.isString(v) && v.length > 0));
		}

		if(!$name.length) return res.jsonerr('请输入套系名称');

		let $pid = cutil.getReq(req, 'pid');
		let $order_no = parseInt(cutil.getReq(req, 'order_no')) || 0;

		let $prow = {};
		if($pid.length) {
			$prow = await ProductSet.findOne($pid);
			if(!_.size($prow)) return res.jsonerr('父分类不存在');
		}

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		if(await ProductSet.count({createdByCompId: $comp_id, name: $name})) return res.jsonerr('套系名称已经存在');

		let $setNo = await ProductSet.genUUID();
		await ProductSet.create({
			id              : $setNo,
			pid             : $pid,
			name            : $name,
			pname           : $prow && $prow.name || '',
			priceType       : $price_type,
			photos          : JSON.stringify($photos),
			createdBy       : req.me.id,
			createdByCompId : $comp_id,
			orderNo         : $order_no
		});

		return res.jsonok({
			set_no: $setNo
		});
	},
	
	updateSet: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

		const $set_no = cutil.getReq(req, 'id');
		if(!$set_no) return res.jsonerr('数据不存在');

		let $set_set = {};
		if(typeof req.param('name') != 'undefined') {
			var $name = cutil.getReq(req, 'name');

			if(!$name.length) return res.jsonerr('请输入套系名称');
			$set_set.name = $name;
		}

		if(_.isArray(req.param('photos'))) {
			let $photos = req.param('photos').filter(v => (_.isString(v) && v.length > 0));
			$set_set.photos = JSON.stringify($photos);
		}

		if(typeof req.param('pid') != 'undefined') {
			$set_set.pid = cutil.getReq(req, 'pid');
			if($set_set.pid.length) {
				let $prow = await ProductSet.findOne($set_set.pid);
				if(!_.size($prow)) return res.jsonerr('父分类不存在');
				$set_set.pname = $prow.name;
			}
		}

		if(typeof req.param('order_no') != 'undefined') {
			$set_set.orderNo = parseInt(cutil.getReq(req, 'order_no')) || 0;
		}

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $set_row = await ProductSet.findOne($set_no);
		if(!$set_row || !_.size($set_row)) return res.jsonerr('数据不存在');
		if($set_row.createdByCompId != $comp_id) return res.jsonerr('没有权限');

		if(
			$set_set.name 
			&& $set_row.name != $set_set.name 
			&& await ProductSet.count({createdByCompId: $comp_id, name: $name})
			) return res.jsonerr('套系名称已经存在');

		await ProductSet.update({ id: $set_no }).set($set_set);
		return res.jsonok('ok');
	},

	delSet: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

		const $set_no = cutil.getReq(req, 'id');
		if(!$set_no) return res.jsonerr('数据不存在');

		let $set_row = await ProductSet.findOne($set_no);
		if(!$set_row || !_.size($set_row)) return res.jsonerr('数据不存在');
		if($set_row.createdByCompId != $comp_id) return res.jsonerr('没有权限');
		if(!_.size($set_row.pid) && await ProductSet.count({pid: $set_row.id})) return res.jsonerr('还有子分类存在，不能删除该分类');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

        try {
            await sails.getDatastore('factory').transaction(async (db, proceed) => {
                try {
					if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY) {
						await FactoryProduct.update({
							setNo:$set_no
						}).set({
							setNo:''
						}).usingConnection(db);
					} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER) {
						await DesignProduct.update({
							setNo:$set_no
						}).set({
							setNo:''
						}).usingConnection(db);
					}

					await ProductSet.destroy($set_no).usingConnection(db);

                    return proceed(undefined, 'ok');
                } catch (err) {
                    return proceed(err);
                }
            });

            return res.jsonok('ok');
        } catch ($e) {
			sails.log.error($e);
            return res.jsonerr('写入数据库失败');
        }
	},


	listSetProduct: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

		let $set_no = cutil.getReq(req, 'id');
		if(!$set_no) return res.jsonerr('数据不存在');

        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
		if(!$comp_row) return res.jsonerr('未找到企业信息');
		$comp_row.compType = parseInt($comp_row.compType);
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $set_row = await ProductSet.findOne($set_no);
		if(!$set_row || !_.size($set_row)) return res.jsonerr('数据不存在');
		if($set_row.createdByCompId != $comp_id) return res.jsonerr('没有权限');

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		let $ret = [], $total = 0;
		if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY) {
			$total = await FactoryProduct.count({
				setNo: $set_no,
				factoryParentProductNo: "-"
			});
			let $product_rows = await FactoryProduct.find({
				where: {
					setNo: $set_no,
					factoryParentProductNo: "-"
				},
				skip: $start,
				limit: $pagesize,
			});
			_.each($product_rows, function($row) {
				//let $ret_row;
				//if(parseInt($row.priceType) == CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE) {
				//	$ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, ['id', 'name', 'catId', 'stat', 'expireAt']));
				//} else {
				//	$ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, ['id', 'name', 'catId', 'stat']));
				//}
				//$ret_row.n_visited = 0;
				////todo: nvisited
				//$ret_row.cat = {
				//	id: $row.catId,
				//	name: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : '',
				//	path: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].path : '',
				//};
				//delete $ret_row.cat_id;
				//$ret.push($ret_row);

				$ret.push({
					id   : $row.id,
					name : $row.name
				});
			});
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER) {
			$total = await DesignProduct.find({
				setNo: $set_no,
				designParentProductNo: "-"
			});
			let $product_rows = await DesignProduct.find({
				where: {
					setNo: $set_no,
					designParentProductNo: "-"
				},
				skip: $start,
				limit: $pagesize,
			});
			_.each($product_rows, function($row) {
				//let $ret_row;
				//if(parseInt($row.priceType) == CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE) {
				//	$ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, ['id', 'name', 'catId', 'stat', 'designMarketNVisited', 'nCooperated']));
				//} else {
				//	$ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, ['id', 'name', 'catId', 'stat', 'designMarketNVisited']));
				//}
				//$ret_row.n_visited = $ret_row.design_market_n_visited;
				//delete $ret_row.design_market_n_visited;
				//$ret_row.cat = {
				//	id: $row.catId,
				//	name: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : '',
				//	path: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].path : '',
				//};
				//delete $ret_row.cat_id;
				//$ret.push($ret_row);

				$ret.push({
					id   : $row.id,
					name : $row.name
				});
			});
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_SELL) {
			try {
				const $fx_api = new FxApi(req);
				let $product_rows = await $fx_api.listFxProductBySet({
					page     : $page,
					pagesize : $pagesize,
					set_id   : $set_no
				});
				$product_rows = _.size($product_rows) && _.size($product_rows.list) && $product_rows.list || [];
				_.each($product_rows, function($row) {
					$ret.push({
						id   : $row.id,
						name : $row.name
					});
				});
			} catch($e) {
				return res.jsonerr($e.message || 'FxApi: error');
			}
		}

		return res.jsonok({total: $total, list: $ret, set: {id: $set_row.id, name: $set_row.name}});
	},


	removeFromSet: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');
	
		let $product_no = cutil.getReq(req, 'product_id');
		if(!$product_no) return res.jsonerr('数据不存在');

		let $set_no = cutil.getReq(req, 'set_id');
		if(!$set_no) return res.jsonerr('数据不存在');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $set_row = await ProductSet.findOne($set_no);
		if(!$set_row || !_.size($set_row)) return res.jsonerr('数据不存在');
		if($set_row.createdByCompId != $comp_id) return res.jsonerr('没有权限');

		let $product_row;
		if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY) {
			$product_row = await FactoryProduct.findOne($product_no);
			if(!$product_row || !_.size($product_row)) return res.jsonerr('数据不存在');
			await FactoryProduct.update({
				id: $product_no
			}).set({
				setNo: ''
			});
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER) {
			$product_row = await DesignProduct.findOne($product_no);
			if(!$product_row || !_.size($product_row)) return res.jsonerr('数据不存在');
			await DesignProduct.update({
				id: $product_no
			}).set({
				setNo: ''
			});
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_SELL) {
			try {
				const $fx_api = new FxApi(req);
				await $fx_api.updateFxProduct({
					fx_product_id : $product_no,
					set_id        : ""
				});
			} catch($e) {
				return res.jsonerr($e.message || 'FxApi: error');
			}
		}

		return res.jsonok('ok');
	},

	moveToSet: async function(req, res) {
		const $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('未找到企业信息');

		let $product_no = cutil.getReq(req, 'product_id');
		if(!$product_no) return res.jsonerr('数据不存在');

		let $set_no = cutil.getReq(req, 'set_id');
		if(!$set_no) return res.jsonerr('数据不存在');

        let $comp_row = await Comp.findOne({
            id: $comp_id
        });
        if(!$comp_row) return res.jsonerr('未找到企业信息');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');

		let $set_row = await ProductSet.findOne($set_no);
		if(!$set_row || !_.size($set_row)) return res.jsonerr('数据不存在');
		if($set_row.createdByCompId != $comp_id) return res.jsonerr('没有权限');
		if(!_.size($set_row.pid)) return res.jsonerr('商品只能放置于子分类');

		let $product_row;
		if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_FACTORY) {
			$product_row = await FactoryProduct.findOne($product_no);
			if(!$product_row || !_.size($product_row)) return res.jsonerr('数据不存在');
			await FactoryProduct.update({
				id: $product_no
			}).set({
				setNo: $set_no
			});
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_DESIGNER) {
			$product_row = await DesignProduct.findOne($product_no);
			if(!$product_row || !_.size($product_row)) return res.jsonerr('数据不存在');
			await DesignProduct.update({
				id: $product_no
			}).set({
				setNo: $set_no
			});
		} else if($comp_row.compType == CONST.COMPONY_TYPE_FURNITURE_SELL) {
			try {
				const $fx_api = new FxApi(req);
				await $fx_api.updateFxProduct({
					fx_product_id : $product_no,
					set_id        : $set_no
				});
			} catch($e) {
				return res.jsonerr($e.message || 'FxApi: error');
			}
		}

		return res.jsonok('ok');
	},

};

