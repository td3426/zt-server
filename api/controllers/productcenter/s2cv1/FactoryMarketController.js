
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {
	listFactory: async function(req, res) {
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page > 0 && $page || 1;

		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		$pagesize = $pagesize < 1 ? 1 : $pagesize;
		$pagesize = $pagesize > 50 ? 50 : $pagesize;

		let $name = cutil.getReq(req, 'name');

		let $n_reg_date = parseInt(cutil.getReq(req, 'n_reg_date'));
		let $cert_stat = parseInt(cutil.getReq(req, 'cert_stat'));
		let $onSale     = parseInt(cutil.getReq(req, 'onsale'));

		let $sql = "from company as comp";
		$sql += " left join index_factory_aptitude as idx on idx.compId=comp.id";

		let $where = [];
		$where.push('comp.compType=' + CONST.COMPONY_TYPE_FURNITURE_FACTORY);
		if(_.size($name)) $where.push("comp.name like '%" + cutil.dbEscape($name) + "%'");

		if($n_reg_date) {
			let $dict_n_reg_date = cutil.indexTabByCol(CONST.N_REG_DATE_MAP, 'id');
			let $cur_dict_n_reg_date = $dict_n_reg_date[$n_reg_date] || {};
			if(_.size($cur_dict_n_reg_date)) {
				$where.push('idx.regDate < ' + (moment().valueOf() - $cur_dict_n_reg_date.tmdiff_min));
				$where.push('idx.regDate >= ' + (moment().valueOf() - $cur_dict_n_reg_date.tmdiff_max));
			}
		}

		if($cert_stat) $where.push('comp.certStat=2');
		if($onSale) $where.push('comp.nOnsale>0');

		if(_.size($where)) $sql += ' where ' + $where.join(' and ');

		let $n_rows = await sails.getDatastore().sendNativeQuery("select count(1) as cnt " + $sql);
		$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0;

		let $ret = {
			total : $n_rows,
			list  : []
		};
		if(!$n_rows) return res.jsonok($ret);

		let $start = ($page - 1) * $pagesize;
		let $comp_rows = await sails.getDatastore().sendNativeQuery("select comp.id, comp.name, comp.contactMobile, comp.aptitude, comp.aptitudeScore, comp.certStat, comp.nOnsale " + $sql + " order by comp.aptitudeScore desc, comp.id asc limit " + $start + ',' + $pagesize);
		$comp_rows = $comp_rows && $comp_rows.rows || [];
		let $comp_ids = cutil.getTabCol($comp_rows, 'id');
		$comp_ids = _.size($comp_ids) && _.values($comp_ids) || [];

		let $zone_rows = await DictCompZone.find();
		$zone_rows.push({id: 0, name: '未选择'});
		$zone_rows = cutil.indexTabByCol($zone_rows, 'id');

		let $employee_rows = [];
		$employee_rows.push({id: 0, name: '未选择'});
		_.each(CONST.FACTORY_EMPLOYEE_MAP, function($employee_map_row) {
			$employee_rows.push($employee_map_row);
		});
		$employee_rows = cutil.indexTabByCol($employee_rows, 'id');

		let $spec_rows = {};
		if(_.size($comp_ids)) {
			$spec_rows = await sails.getDatastore().sendNativeQuery(
				"select compId, isProvinceSpecs from comp_in_specs where compId in(" + $comp_ids.join(',') + ")"
			);
			$spec_rows = _.size($spec_rows) && _.size($spec_rows.rows) && $spec_rows.rows || [];
			$spec_rows = cutil.indexTabByCol($spec_rows, 'compId');
		}

		_.each($comp_rows, function($comp_row) {
			let $ret_row = {
				id             : $comp_row.id,
				name           : $comp_row.name,
				contact_mobile : $comp_row.contactMobile
			};

			try{
				$ret_row.aptitude = JSON.parse($comp_row.aptitude);
				if(_.size($ret_row.aptitude) && _.size($ret_row.aptitude.stat)) {
					$ret_row.aptitude.stat.zone_str = _.size($zone_rows[$ret_row.aptitude.stat.zone]) ? $zone_rows[$ret_row.aptitude.stat.zone].name : '';
				}
				if(_.size($ret_row.aptitude) && _.size($ret_row.aptitude.stat)) {
					$ret_row.aptitude.stat.n_employee_str = _.size($employee_rows[$ret_row.aptitude.stat.n_employee]) ? $employee_rows[$ret_row.aptitude.stat.n_employee].name : '';
				}
			} catch($e) {
				$ret_row.aptitude = {};
			}
			$ret_row.aptitude_score = $comp_row.aptitudeScore;

			//1已认证，2未认证
			$ret_row.cert_stat = parseInt($comp_row.certStat) == CONST.CERTIFYCATION_STAT_SUCCESS ? 1 : 2;
			$ret_row.onsale   = $comp_row.nOnsale || 0;

			//0未入规，1区规，2省规
			$ret.spec_stat = 0;
			if(_.size($spec_rows) && _.size($spec_rows[$comp_row.id])) {
				$ret.spec_stat = parseInt($spec_rows[$comp_row.id].isProvinceSpecs) ? 2 : 1;
			}

			$ret.list.push($ret_row);
		});

        return res.jsonok($ret);
	},

	createWayBill: async function(req, res) {
		const $order_id = cutil.getReq(req, 'order_id');
		const $waybill = req.param('waybill');
	
		if(!$order_id || !$waybill) return res.jsonerr('参数值不能为空');
		if(await MarketOrder.count({
			order_id: $order_id,
		})) return res.jsonerr('物流信息已存在');

		let $rows = await sails.getDatastore().sendNativeQuery(`select * from t_pur_order where fid='${$order_id}'`);
		$rows = _.size($rows) && _.size($rows.rows) && $rows.rows[0] || null;
		if(!$rows) return res.jsonerr('订单不存在');
		if(parseInt($rows.fstate) < 6) return res.jsonerr('订单状态未经过确认收款环节');

		const $waybill_str = JSON.stringify($waybill);

		let $waybill_num;
		try {
			let $wl_api = new WlApi(req);
			$waybill_num = await $wl_api.createWayBill($waybill);
			if(!$waybill_num) throw flaverr('E_USER_ERROR', new Error('物流接口未获取到物流单号'));
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || '物流接口报错');
		}

		try {
			await MarketOrder.create({
				order_id    : $order_id,
				waybill     : $waybill_str,
				waybill_num : $waybill_num,
			});
		} catch($e) {
			sails.log($e);
			return res.jsonerr('写入数据库失败');
		}

		return res.jsonok('ok');
	},

	getWayBill: async function(req, res) {
		const $order_id = cutil.getReq(req, 'order_id');
		if(!$order_id) return res.jsonerr('order_id参数为空');
		let $row = await MarketOrder.find({
			order_id: $order_id,
		});
		$row = $row && $row[0] || null;
		if(!$row) return res.jsonerr('数据不存在');

		let $ret;
		try {
			$ret = JSON.parse($row.waybill);
			$ret.waybill_num = $row.waybill_num;
		} catch($e) {
			return res.jsonerr('waybill数据JSON解码失败');
		}

		return res.jsonok($ret);
	},

	isOrderWayBill: async function(req, res) {
		let $order_ids = req.param('order_ids');
		const $tmp = [];
		_.each($order_ids, ($order_id) => {
			try{
				$order_id = $order_id.toString().trim();
			} catch(e) {
				$order_id = null;
			}

			if($order_id) $tmp[$order_id] = $order_id;
		});
		$order_ids = $tmp;

		if(!$order_ids || !Object.keys($order_ids).length) return res.jsonerr('order_ids参数不能为空');
		const $rows = await MarketOrder.find({
			order_id: Object.keys($order_ids),
		});
	
		if(!_.size($rows)) return res.jsonerr('订单不存在');
		const $ret = [];
		_.each($rows, ($row) => {
			$ret.push({
				order_id    : $row.order_id,
				waybill_num : $row.waybill_num,
			});
		});

		return res.jsonok($ret);
	},

	queryWayBillTrack: async function(req, res) {
		const $waybill_num = cutil.getReq(req, 'waybill_num');
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page > 0 && $page || 1;

		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 999;
		$pagesize = $pagesize < 1 ? 1 : $pagesize;

		try {
			let $wl_api = new WlApi(req);
			$wl_ret = await $wl_api.queryTrack({
				search: {
					WaybillCode : $waybill_num,
				},
				pageIndex   : $page,
				pageSize    : $pagesize,
			});
			if($wl_ret.rows) return res.jsonok($wl_ret.rows);
		} catch($e) {
			sails.log($e);
			return res.jsonerr($e.message || '物流接口报错');
		}
		return res.jsonerr('未查询到物流信息');
	},
};

