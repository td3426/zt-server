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
	listComp: async function(req, res) {
		let $range      = req.param('range');
		let $n_employee = parseInt(cutil.getReq(req, 'n_employee'));
		let $n_reg_date = parseInt(cutil.getReq(req, 'n_reg_date'));
		let $onSale     = parseInt(cutil.getReq(req, 'onsale'));

		let $fname      = cutil.getReq(req, 'fname');

		let $page       = parseInt(cutil.getReq(req, 'page')) || 0;
		$page           = $page || 1;
		let $pagesize   = parseInt(cutil.getReq(req, 'pagesize')) || 0;
		$pagesize       = $pagesize || 15;
		let $start      = ($page - 1) * $pagesize;

		let $sql = "from company as comp";
		$sql += " left join index_design_comp_aptitude as idx on idx.compId=comp.id";
	
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

		if($onSale) $where.push('comp.nOnsale>0');

		$where.push('comp.compType=' + CONST.COMPONY_TYPE_FURNITURE_DESIGNER);
		$where.push('comp.certStat=' + CONST.CERTIFYCATION_STAT_SUCCESS);
		if(_.size($fname)) $where.push("name like '%" + cutil.dbEscape($fname) + "%'");

		if(_.size($where)) $sql += ' where ' + $where.join(' and ').trim();

		let $n_rows = await sails.getDatastore().sendNativeQuery("select count(1) as cnt " + $sql);
		$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0;

		let $ret = {
			total : $n_rows,
			list  : []
		};
		if(!$n_rows) return res.jsonok($ret);

		let $comp_rows = await sails.getDatastore().sendNativeQuery("select comp.id, comp.name, comp.logo, comp.certStat, comp.contactMobile, comp.aptitude, comp.aptitudeScore, comp.nProductCopyRight, comp.nProductPercent, comp.nOnsale " + $sql + " order by comp.aptitudeScore desc, comp.id asc limit " + $start + ',' + $pagesize);
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

		let $st_contact_rows = {};
		if(_.size($comp_ids)) {
			$st_contact_rows = await sails.getDatastore().sendNativeQuery(
				"select compId, sum(cnt) as vcnt from st_company_contact_visited where compId in(" + $comp_ids.join(',')  + ") group by compId"
			);
			$st_contact_rows = _.size($st_contact_rows) && _.size($st_contact_rows.rows) && $st_contact_rows.rows || [];
			$st_contact_rows = cutil.indexTabByCol($st_contact_rows, 'compId');
		}

		_.each($comp_rows, function($comp_row) {
			let $ret_row = {
				id             : $comp_row.id,
				name           : $comp_row.name,
				logo           : $comp_row.logo,
				cert_stat      : $comp_row.certStat,
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

			$ret_row.aptitude_score    = $comp_row.aptitudeScore;

			$ret_row.nProductCopyRight = $comp_row.nProductCopyRight || 0;
			$ret_row.nProductPercent   = $comp_row.nProductPercent || 0;
			$ret_row.onsale            = $comp_row.nOnsale || 0;

			$ret_row.nContact          = _.size($st_contact_rows) && _.size($st_contact_rows[$comp_row.id]) && $st_contact_rows[$comp_row.id].vcnt || 0;

			$ret.list.push($ret_row);
		});

        return res.jsonok($ret);
	},
};

