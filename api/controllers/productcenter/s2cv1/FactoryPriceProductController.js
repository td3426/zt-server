
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
	listPriceProduct: async function(req, res) {
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

		let $n_trans_rows = await Transaction.count({
			buyByCompId: $comp_row.id
		});
		let $trans_rows = await Transaction.find({
			where: {
				buyByCompId: $comp_row.id
			},
            skip: $start,
            limit: $pagesize,
            sort: 'createdAt desc'
		});

		let $product_ids = cutil.getTabCol($trans_rows, 'productNo');

        let $designer_ids = cutil.getTabCol($trans_rows, 'saleBy');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($trans_rows, 'saleByCompId');
        let $design_comp_rows = await Comp.getComps(_.values($design_comp_ids), ['id', 'name', 'logo']);
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		var $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		var $product_rows = {};
		if(_.size($product_ids)) {
			$product_rows = await DesignProduct.find({
				id: _.values($product_ids)
			});
			$product_rows = _.size($product_rows) ? cutil.indexTabByCol($product_rows, 'id') : {};
		}

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

		var $ret = [];
		var $tm = moment().valueOf();
		var $need_update_expired_stat = [];
		var $ret_fds = ["id", "name", "sname", "styleNo", "catId", "photoRender", "price", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt", "contractNo"];

		let $order_info_rows = {};
		if(_.size($trans_rows)) {
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
		}

		_.each($trans_rows, function($trans_row){
			let $row = $product_rows && $product_rows[$trans_row.productNo] ? $product_rows[$trans_row.productNo] : null;
			if(!$row) return true;

            let $ret_row = cutil.snakeCaseObject(cutil.getRowCols($row, $ret_fds));

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }

            $ret_row.designer = {
                id: $row.createdBy,
                name: $designer_rows[$row.createdBy] && $designer_rows[$row.createdBy].name ? $designer_rows[$row.createdBy].name : '',
                avatar: $designer_rows[$row.createdBy] && $designer_rows[$row.createdBy].avatar ? $designer_rows[$row.createdBy].avatar : ''
            };
			delete $ret_row.created_by;

			$ret_row.design_comp = {
				id: $row.createdByCompId,
				name: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].name : '',
				logo: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].logo : ''
			};
			delete $ret_row.created_by_comp_id;

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

			$ret_row.trans_no = $trans_row.id;
			$ret_row.trans_stat = $trans_row.stat;
			$ret_row.contract_no = $trans_row.contractNo;
			$ret_row.tradeOrder = $order_info_rows[$trans_row.id] || null;

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_trans_rows});
	},

	detailPriceProduct: async function(req, res) {
        if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        //if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');

		var $trans_no = cutil.getReq(req, 'trans_no');
		if($trans_no.length < 1) return res.jsonerr('交易记录不存在');

		var $transaction_row = await Transaction.findOne({
			where: {
				id: $trans_no
			},
			select: ['productNo', 'stat', 'buyByCompId', 'contractNo', 'orderNo']
		});
		if(!_.size($transaction_row)) return res.jsonerr('交易记录不存在');
		if($transaction_row.buyByCompId != req.me.compId) return res.jsonerr('不是该企业的交易');

        var $product_id = $transaction_row.productNo;

		var $ret_fds = ["id", "name", "sname", "styleNo", "catId", "designIdea", "photoRender", "photoCad", "dimension", "intro", "photoSize", "photoStory", "price", "stat", "createdBy", "createdByCompId", "designMarketNVisited", "publishedAt", "designParentProductNo", "contractTplId"];
		var $product_rows = await DesignProduct.find({
			where: {
				or: [
					{ id: $product_id },
					{ designParentProductNo: $product_id }
				]
			},
			select: $ret_fds
		});
		if(!$product_rows || !_.size($product_rows)) return res.jsonerr('商品不存在');

		$product_rows = cutil.indexTabByCol($product_rows, 'designParentProductNo', 'id');
		if(!$product_rows || !_.size($product_rows) || !$product_rows['-']) return res.jsonerr('商品不存在');
		var $product_row = $product_rows['-'][$product_id];

        let $designer_row = await User.getUsers([$product_row.createdBy], ['id', 'name', 'avatar', 'compId']);
		$designer_row = $designer_row && $designer_row[$product_row.createdBy] || null;

		let $design_comp_row = await Comp.findOne({id: $product_row.createdByCompId});

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

		$ret.design_comp = {
			id: $product_row.createdByCompId,
			name: $design_comp_row ? $design_comp_row.name : '',
			logo: $design_comp_row ? $design_comp_row.logo : ''
		};
		delete $ret.created_by_comp_id;

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

		$ret.contract_no = "";
		$ret.trans_stat  = 0;
		if(_.size($transaction_row)) {
			$ret.contract_no = $transaction_row.contractNo;
			$ret.trans_stat  = $transaction_row.stat;

			try {
				if($transaction_row.orderNo && $transaction_row.orderNo.length) {
					let $trans_api = new TransApi(req);
					$ret.tradeOrder = await $trans_api.getOrder($transaction_row.orderNo);
				}
			} catch($e) {
				return res.jsonerr($e.message || 'TransApi: error');
			}
		}

		$ret.accessory = [];
		_.each($product_rows[$product_id], function($row) {
			var $acc_row = {};

			$acc_row.id = $row.id;
			$acc_row.name = $row.name;
			$acc_row.intro = $row.intro;
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

	payForPriceProduct: async function(req, res) {//unused
		return res.json('已调整为交易中心接口');
	    if(!req.me.compId) return res.jsonerr('没有权限');

        var $comp_row = await Comp.findOne({
            id: req.me.compId
        });
        if(!$comp_row) return res.jsonerr('企业不存在');
        if($comp_row.certStat != CONST.CERTIFYCATION_STAT_SUCCESS) return res.jsonerr('企业未认证');
        if($comp_row.compType != CONST.COMPONY_TYPE_FURNITURE_FACTORY) return res.jsonerr('企业不是工厂');
	
		var $trans_id = cutil.getReq(req, 'trans_no');
		if(!$trans_id) return res.jsonerr('交易不存在');
		var $trans_row = await Transaction.findOne($trans_id);
		if(!$trans_row || !_.size($trans_row)) return res.jsonerr('交易不存在');
		if($trans_row.buyByCompId != req.me.compId) return res.jsonerr('该交易不属于该公司');
		if($trans_row.stat != CONST.TRANSACTION_STAT_SIGNED_SELL) return res.jsonerr('非付款阶段');

		var $receiv_info = req.param('receivInfo');
		var $send_info = req.param('sendInfo');
		var $proof_img = cutil.getReq(req, 'proofImg');

		var $req_params = {
			order_no: $trans_id,
			bizType: 'bq_order',
			amount: $trans_row.amount,
			receivInfo: $receiv_info,
			sendInfo: $send_info,
			proofImg: $proof_img,
			callbackUrl: sails.config.custom.baseUrl + sails.getUrlFor(sails.config.payApi.payback4PriceProduct)
		};
        var $token = req.headers.token || req.param('token');

		try {
			var $payapi = new PayApi();
			var $pay_no = await $payapi.pay($token, $req_params);
			if(!$pay_no) return res.jsonerr('支付失败，没有支付流水号');

			await Transaction.update($trans_row.id).set({
				payNo: $pay_no,
				stat: CONST.TRANSACTION_STAT_PAID
			});

			return res.jsonok($pay_no);
		} catch(e) {
			return res.jsonerr(e.toString());
		}
	},

	paybackForPriceProduct: async function(req, res) {//unused
		return res.json('已调整为交易中心接口');
		//线下付款，这一步不处理
		return res.jsonok('ok');
	},
};

