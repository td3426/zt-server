const moment = require('moment');
const flaverr = require('flaverr');

function buildLikeStr($keys, $fd) {
	if(!_.isArray($keys) || !_.size($keys)) return '';

	let $ret = [];
	_.each($keys, function($k) {
		if(!/^[a-zA-Z0-9]+$/gi.test($k)) return true;

		$ret.push($fd + " like '%," + $k + ",%'");
	});
	$ret = $ret.join(' or ').trim();
	$ret = $ret.length ? ('(' + $ret + ')') : '';

	return $ret;
}

module.exports = {
	listFilter: async function(req, res) {
		var field_rows = await DictForm.getFields(CONST.APTITUDE_DICT_FORM_GROUP, CONST.DESIGN_COMP_APTITUDE_DICT_FORM);

		let $map = {};
		_.each(CONST.DESIGN_COMP_APTITUDE_DICT_FORM_MAP.fds, function(v,k) {
			$map[v] = k;
		});

		let $ret = {};
		_.each(field_rows, function(row) {
			let $vid = $map[row.id];
			$ret[$vid] = row.options;
		});

		return res.jsonok($ret);
	},

	filterCompany: async function(req, res) {
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page > 0 && $page || 1;
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		$pagesize = $pagesize < 1 ? 1 : $pagesize;
		$pagesize = $pagesize > 50 ? 50 : $pagesize;

		let $range = req.param('range');
		let $n_employee = parseInt(cutil.getReq(req, 'n_employee'));
		let $n_reg_date = parseInt(cutil.getReq(req, 'n_reg_date'));
		let $n_onsale = parseInt(cutil.getReq(req, 'n_onsale'));
		let $n_case = parseInt(cutil.getReq(req, 'n_case'));

		let $where = [];
		let $where_item = '';

		$where_item = buildLikeStr($range, 'idx.range');
		if($where_item.length > 0) $where.push($where_item);
	
		if($n_employee) $where.push('idx.nEmployee=' + $n_employee);
		switch($n_reg_date){
			case 1: //1年内
				$where.push('idx.regDate >= ' + (moment().valueOf() - 86400000 * 365));
				break;
			case 2: //1-3年
				$where.push('idx.regDate < ' + (moment().valueOf() - 86400000 * 365));
				$where.push('idx.regDate >= ' + (moment().valueOf() - 86400000 * 365 * 3));
				break;
			case 3: //3-5年
				$where.push('idx.regDate < ' + (moment().valueOf() - 86400000 * 365 * 3));
				$where.push('idx.regDate >= ' + (moment().valueOf() - 86400000 * 365 * 5));
				break;
			case 4: //5-10年
				$where.push('idx.regDate < ' + (moment().valueOf() - 86400000 * 365 * 5));
				$where.push('idx.regDate >= ' + (moment().valueOf() - 86400000 * 365 * 10));
				break;
			case 5: //10年以上
				$where.push('idx.regDate < ' + (moment().valueOf() - 86400000 * 365 * 10));
				break;
		}

		let $join = '';
		if($n_onsale) {
			$where.push('comp.nOnsale>0');
			$join = 'left join company as comp on idx.compId=comp.id';
		}

		if($n_case) $where.push('idx.nCase>0');
	
		if(_.size($where)) $where = ' where ' + $where.join(' and ').trim();
	
		let $n_comp_ids = 0;
		$n_comp_ids = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from index_design_comp_aptitude as idx " + $join + $where);
		$n_comp_ids = $n_comp_ids && $n_comp_ids.rows || [];
		$n_comp_ids = $n_comp_ids[0] && $n_comp_ids[0].cnt || 0;
		if(!$n_comp_ids) return res.jsonok({total: 0, page: $page, pagesize: $pagesize, list: []});

		let $comp_idx_rows = [];
		$comp_idx_rows = await sails.getDatastore().sendNativeQuery("select idx.compId, idx.nCase, idx.nPrize from index_design_comp_aptitude as idx " + $join + $where + ' limit ' + (($page - 1) * $pagesize) + ', ' + $pagesize);
		$comp_idx_rows = $comp_idx_rows && $comp_idx_rows.rows || [];
		$comp_idx_rows = _.size($comp_idx_rows) && cutil.indexTabByCol($comp_idx_rows, 'compId');

		let $comp_ids = [];
		$comp_ids = _.size($comp_idx_rows) && cutil.getTabCol($comp_idx_rows, 'compId');
		$comp_ids = _.size($comp_ids) && _.values($comp_ids);
		if(!_.size($comp_ids)) return res.jsonok({total: $n_comp_ids, page: $page, pagesize: $pagesize, list: []});

		let $comp_rows = await Comp.find({
			where: {
				id: $comp_ids
			},
			select: ['id', 'name', 'aptitude', 'nOnsale']
		});
	
		let $ret = [];
		_.each($comp_rows, function($row) {
			let $aptitude = {};
			try { $aptitude = JSON.parse($row.aptitude); } catch($e) {}
			$ret.push({
				id       : $row.id,
				name     : $row.name,
				aptitude : $aptitude,
				onsale   : $row.nOnsale || 0,
				n_case   : $comp_idx_rows[$row.id] && $comp_idx_rows[$row.id].nCase || 0,
				n_prize  : $comp_idx_rows[$row.id] && $comp_idx_rows[$row.id].nPrize || 0
			});
		});
	
		return res.jsonok({
			total    : $n_comp_ids,
			page     : $page,
			pagesize : $pagesize,
			list     : $ret
		});
	},

	searchCompany: async function(req, res) {
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page > 0 && $page || 1;
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		$pagesize = $pagesize < 1 ? 1 : $pagesize;
		$pagesize = $pagesize > 50 ? 50 : $pagesize;

		let $key = cutil.getReq(req, 'key');
		let $where = '';
		if($key.length) $where = " and name like '%" + cutil.dbEscape($key) + "%'";

		let $n_comp_rows = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from company where compType=2" + $where);
		$n_comp_rows = _.size($n_comp_rows) && _.size($n_comp_rows.rows) && $n_comp_rows.rows[0] && $n_comp_rows.rows[0].cnt || 0;
		let $comp_rows = await sails.getDatastore().sendNativeQuery("select id, name, nOnsale, aptitude from company where compType=2 " + $where +" limit " + (($page - 1) * $pagesize) + ', ' + $pagesize);
		$comp_rows = _.size($comp_rows) && $comp_rows.rows || [];

		let $comp_ids = cutil.getTabCol($comp_rows, 'id');
		$comp_ids = _.size($comp_ids) ? _.values($comp_ids) : [];
		let $comp_idx_rows = await IndexDesignCompAptitude.find({
			where: {
				id: $comp_ids
			},
			select: ['id', 'nCase', 'nPrize']
		});
		$comp_idx_rows = _.size($comp_idx_rows) && cutil.indexTabByCol($comp_idx_rows, 'id') || {};

	
		let $ret = [];
		_.each($comp_rows, function($row) {
			let $aptitude = {};
			try { $aptitude = JSON.parse($row.aptitude); } catch($e) {}
			$ret.push({
				id       : $row.id,
				name     : $row.name,
				aptitude : $aptitude,
				onsale   : $row.nOnsale || 0,
				n_case   : $comp_idx_rows[$row.id] && $comp_idx_rows[$row.id].nCase || 0,
				n_prize  : $comp_idx_rows[$row.id] && $comp_idx_rows[$row.id].nPrize || 0
			});
		});
	
		return res.jsonok({
			total    : $n_comp_rows,
			page     : $page,
			pagesize : $pagesize,
			list     : $ret
		});
	}
};

