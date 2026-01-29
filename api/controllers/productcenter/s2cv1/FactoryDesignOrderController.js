
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
    listDesignProductOrder: async function(req, res) {
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			productType: CONST.TRANSACTION_PRODUCT_TYPE_PRODUCT,
			buyByCompId: req.me.compId
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $stat = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('stat'))) $stat = req.param('stat').filter(v => (v = parseInt(v) && !isNaN(v)));
		if(_.size($style_nos)) $where.styleNo = $style_nos;
		if(_.size($stat)) $where.stat = $stat;

		let $order_by = [{}];
		let $sort_by = 'createdAt';
		let $sort_order = 'DESC';
		if(cutil.getReq(req, 'sort_by') == 'price') $sort_by = 'amount';
		if(cutil.getReq(req, 'sort_order')) $sort_order = 'ASC';
		$order_by[0][$sort_by] = $sort_order;

		let $n_trans_rows = await Transaction.count({
			where: $where,
		});
	
		if(!$n_trans_rows) return res.jsonok({total: 0, list: []});

		let $trans_rows = await Transaction.find({
			where : $where,
			sort  : $order_by,
			skip  : $start,
			limit : $pagesize
		});
	
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
	
		let $ret = [];

		_.each($trans_rows, $trans_row => {
			try { $trans_row.productInfo = JSON.parse($trans_row.productInfo); } catch($e) { $trans_row.productInfo = {}; }
			$ret.push({
				id           : $trans_row.productInfo.id,
				name         : $trans_row.productInfo.name,
				photo_render : $trans_row.productInfo.photoRender,
				cat          : $trans_row.productInfo.cat,
				style        : $trans_row.productInfo.style,
				designer     : $trans_row.productInfo.designer,
				design_comp  : $trans_row.productInfo.design_comp,
				price        : $trans_row.amount,
				trans_stat   : $trans_row.stat,
				order_no     : $trans_row.orderNo,
				contract_no  : $trans_row.contractNo,
				created_at   : $trans_row.createdAt,
				tradeOrder   : $order_info_rows[$trans_row.id] || null
			});
		});

		return res.jsonok({total: $n_trans_rows, list: $ret});
	},

    listDesignSetOrder: async function(req, res) {
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $where = {
			productType: CONST.TRANSACTION_PRODUCT_TYPE_SET,
			buyByCompId: req.me.compId
		};

		let $k = cutil.getReq(req, 'k');
		if($k.length) $where.name = {contains: $k};

		let $style_nos = [], $stat = [];
		if(_.isArray(req.param('style_no'))) $style_nos = req.param('style_no').filter(v => (_.isString(v) && v.trim().length));
		if(_.isArray(req.param('stat'))) $stat = req.param('stat').filter(v => (v = parseInt(v) && !isNaN(v)));
		if(_.size($style_nos)) $where.styleNo = $style_nos;
		if(_.size($stat)) $where.stat = $stat;

		let $order_by = [{}];
		let $sort_by = 'createdAt';
		let $sort_order = 'DESC';
		if(cutil.getReq(req, 'sort_by') == 'price') $sort_by = 'amount';
		if(cutil.getReq(req, 'sort_order')) $sort_order = 'ASC';
		$order_by[0][$sort_by] = $sort_order;

		let $n_trans_rows = await Transaction.count({
			where: $where,
		});
	
		if(!$n_trans_rows) return res.jsonok({total: 0, list: []});

		let $trans_rows = await Transaction.find({
			where : $where,
			sort  : $order_by,
			skip  : $start,
			limit : $pagesize
		});
	
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
	
		let $ret = [];

		_.each($trans_rows, $trans_row => {
			try { $trans_row.productInfo = JSON.parse($trans_row.productInfo); } catch($e) { $trans_row.productInfo = {}; }
			$ret.push({
				id           : $trans_row.productInfo.id,
				name         : $trans_row.productInfo.name,
				photos       : $trans_row.productInfo.photos,
				style        : $trans_row.productInfo.style,
				designer     : $trans_row.productInfo.designer,
				design_comp  : $trans_row.productInfo.design_comp,
				price        : $trans_row.amount,
				trans_stat   : $trans_row.stat,
				order_no     : $trans_row.orderNo,
				contract_no  : $trans_row.contractNo,
				created_at   : $trans_row.createdAt,
				tradeOrder   : $order_info_rows[$trans_row.id] || null
			});
		});

		return res.jsonok({total: $n_trans_rows, list: $ret});
	},
};

