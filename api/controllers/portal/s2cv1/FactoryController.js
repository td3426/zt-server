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
		let field_rows = await DictForm.getFields(CONST.APTITUDE_DICT_FORM_GROUP, CONST.FACTORY_APTITUDE_DICT_FORM);

		let $map = {};
		_.each(CONST.FACTORY_APTITUDE_DICT_FORM_MAP.fds, function(v,k) {
			$map[v] = k;
		});

		let $ret = {};
		_.each(field_rows, function(row) {
			let $vid = $map[row.id];
			if(['jgsx', 'mczl'].indexOf($vid) !== -1) $ret[$vid] = row.options;
		});

		let form_rows = await DictForm.getForms(CONST.FACTORY_ABILITY_FORM_GROUP);
		$ret.gynl = [];
		_.each(form_rows, function(row) {
			$ret.gynl.push({
				k: row.id,
				v: row.name
			});
		});

		return res.jsonok($ret);
	},

	filterCompany: async function(req, res) {
		let $page = parseInt(cutil.getReq(req, 'page')) || 1;
		$page = $page > 0 && $page || 1;
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
		$pagesize = $pagesize < 1 ? 1 : $pagesize;
		$pagesize = $pagesize > 50 ? 50 : $pagesize;

		let $jgsx = req.param('jgsx');
		let $gynl = req.param('gynl');
		let $zdcp = req.param('zdcp');
		let $mczl = req.param('mczl');
		let $n_employee = parseInt(cutil.getReq(req, 'n_employee'));
		let $n_reg_date = parseInt(cutil.getReq(req, 'n_reg_date'));
		let $real_check = parseInt(cutil.getReq(req, 'real_check'));

		let $where = [];
		let $where_item = '';

		$where_item = buildLikeStr($jgsx, 'idx.jgsx');
		if($where_item.length > 0) $where.push($where_item);

		$where_item = buildLikeStr($gynl, 'idx.abilityMake');
		if($where_item.length > 0) $where.push($where_item);

		$where_item = buildLikeStr($zdcp, 'idx.zdcp');
		if($where_item.length > 0) $where.push($where_item);
	
		$where_item = buildLikeStr($mczl, 'idx.mczl');
		if($where_item.length > 0) $where.push($where_item);
	
		if($n_employee) $where.push('idx.nEmployee=' + $n_employee);
		if($n_reg_date) {
			let $dict_n_reg_date = cutil.indexTabByCol(CONST.N_REG_DATE_MAP, 'id');
			let $cur_dict_n_reg_date = $dict_n_reg_date[$n_reg_date] || {};
			if(_.size($cur_dict_n_reg_date)) {
				$where.push('idx.regDate < ' + (moment().valueOf() - $cur_dict_n_reg_date.tmdiff_min));
				$where.push('idx.regDate >= ' + (moment().valueOf() - $cur_dict_n_reg_date.tmdiff_max));
			}
		}
		if($real_check) $where.push('idx.realCheckStat=1');
	
		if(_.size($where)) $where = ' where ' + $where.join(' and ').trim();
	
		let $n_comp_ids = 0;
		$n_comp_ids = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from index_factory_aptitude as idx " + $where);
		$n_comp_ids = $n_comp_ids && $n_comp_ids.rows || [];
		$n_comp_ids = $n_comp_ids[0] && $n_comp_ids[0].cnt || 0;
		if(!$n_comp_ids) return res.jsonok({total: 0, page: $page, pagesize: $pagesize, list: []});

		let $comp_rows = [];
		$comp_rows = await sails.getDatastore().sendNativeQuery(
			"select comp.id, comp.name, comp.aptitude, comp.logo, comp.nOnsale from index_factory_aptitude as idx " +
			" left join company as comp on idx.compId=comp.id " + 
			$where + 
			" order by comp.aptitudeScore desc, comp.id asc" +
			' limit ' + (($page - 1) * $pagesize) + ', ' + $pagesize
		);
		$comp_rows = $comp_rows && $comp_rows.rows || [];

		let $ret = [];
		_.each($comp_rows, function($row) {
			let $aptitude = {};
			try { $aptitude = JSON.parse($row.aptitude); } catch($e) {}
			$ret.push({
				id       : $row.id,
				name     : $row.name,
				logo     : $row.logo,
				aptitude : $aptitude,
				onsale   : $row.nOnsale || 0
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

		let $n_comp_rows = await sails.getDatastore().sendNativeQuery("select count(1) as cnt from company where compType=1" + $where);
		$n_comp_rows = _.size($n_comp_rows) && _.size($n_comp_rows.rows) && $n_comp_rows.rows[0] && $n_comp_rows.rows[0].cnt || 0;
		let $comp_rows = await sails.getDatastore().sendNativeQuery("select id, name, logo, nOnsale, aptitude from company where compType=1" + $where + " limit " + (($page - 1) * $pagesize) + ', ' + $pagesize);
		$comp_rows = _.size($comp_rows) && $comp_rows.rows || [];

		let $ret = [];
		_.each($comp_rows, function($row) {
			let $aptitude = {};
			try { $aptitude = JSON.parse($row.aptitude); } catch($e) {}
			$ret.push({
				id       : $row.id,
				name     : $row.name,
				logo     : $row.logo,
				aptitude : $aptitude,
				onsale   : $row.nOnsale || 0
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

