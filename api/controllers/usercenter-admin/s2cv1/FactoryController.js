
module.exports = {
    list: async function(req, res) {
		let $zone_id = parseInt(cutil.getReq(req, 'zone_id')) || 0;
		let $n_employee = parseInt(cutil.getReq(req, 'n_employee')) || 0;
		let $reg_stat = parseInt(cutil.getReq(req, 'reg_stat')) || 0;
		let $cert_stat = parseInt(cutil.getReq(req, 'cert_stat')) || 0;
		let $spec_stat = parseInt(cutil.getReq(req, 'spec_stat')) || 0;
		let $k = cutil.getReq(req, 'k');
		let $page = parseInt(cutil.getReq(req, 'page')) || 0;
		$page = $page || 1;
		let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 0;
		$pagesize = $pagesize || 15;
		let $start = ($page - 1) * $pagesize;

		let $sql = "from company as comp";
		$sql += " left join index_factory_aptitude as idx on idx.compId=comp.id";
		$sql += " left join comp_in_specs as spec on spec.compId=comp.id";

		let $cond = [];
		$cond.push('comp.compType=' + CONST.COMPONY_TYPE_FURNITURE_FACTORY);

		if($zone_id) $cond.push("idx.zoneId=" + $zone_id);
		if($n_employee) $cond.push("idx.nEmployee=" + $n_employee);

		if($reg_stat == 1) {
			//已注册
			//注册来源，1自主注册，2平台代注册
			$cond.push('(comp.regFrom=' + CONST.COMPONY_REG_FROM_SELF + ' or comp.regFrom=' + CONST.COMPONY_REG_FROM_PLAT + ')');
		} else if($reg_stat == 2) {
			//未注册
			//20入规批量导入
			$cond.push('comp.regFrom=' + CONST.COMPONY_REG_FROM_IN_SPEC);
		} else {
			$cond.push('(comp.regFrom=' + CONST.COMPONY_REG_FROM_SELF + ' or comp.regFrom=' + CONST.COMPONY_REG_FROM_PLAT + ' or comp.regFrom=' + CONST.COMPONY_REG_FROM_IN_SPEC + ')');
		}
		

		if($cert_stat == 1) {
			//已认证
			$cond.push("comp.certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS);
		} else if($cert_stat == 2) {
			//未认证
			$cond.push("comp.certStat!=" + CONST.CERTIFYCATION_STAT_SUCCESS);
		}

		if($spec_stat == 1) {
			//已入规
			$cond.push("spec.certStat=4");
		} else if($spec_stat == 2) {
			//未入规
			$cond.push("(spec.certStat!=4 or spec.certStat is null)");
		}

		if(_.size($k)) {
			$cond.push("comp.name like '%" + cutil.dbEscape($k) + "%'");
		}
		
		if(_.size($cond)) $sql += ' where ' + $cond.join(' and ');

		let $n_rows = await sails.getDatastore().sendNativeQuery("select count(1) as cnt " + $sql);
		$n_rows = $n_rows && $n_rows.rows && $n_rows.rows[0] && $n_rows.rows[0].cnt || 0;

		let $ret = {
			total : $n_rows,
			list  : []
		};
		if(!$n_rows) return res.jsonok($ret);

		let $comp_rows = await sails.getDatastore().sendNativeQuery("select comp.id, comp.name, comp.aptitude, comp.aptitudeScore, comp.regFrom, comp.certStat, spec.isProvinceSpecs, spec.certStat as specStat " + $sql + " limit " + $start + ',' + $pagesize);
		$comp_rows = $comp_rows && $comp_rows.rows || [];

		let $comp_ids = cutil.getTabCol($comp_rows, 'id');
		if(!_.size($comp_ids)) return res.jsonok($ret);

		let $comp_n_product_rows = await sails.getDatastore().sendNativeQuery("select factoryCompId as compId, sum(1) as cnt from factory_product where factoryParentProductNo='-' and factoryCompId in(" + _.values($comp_ids).join(',') + ") group by factoryCompId");
		$comp_n_product_rows = $comp_n_product_rows && $comp_n_product_rows.rows || [];
		$comp_n_product_rows = cutil.indexTabByCol($comp_n_product_rows, 'compId');

		let $zone_rows = await DictCompZone.find();
		$zone_rows.push({id: 0, name: '未选择'});
		$zone_rows = cutil.indexTabByCol($zone_rows, 'id');

		let $employee_rows = [];
		$employee_rows.push({id: 0, name: '未选择'});
		_.each(CONST.FACTORY_EMPLOYEE_MAP, function($employee_map_row) {
			$employee_rows.push($employee_map_row);
		});
		$employee_rows = cutil.indexTabByCol($employee_rows, 'id');

		_.each($comp_rows, function($comp_row) {
			let $ret_row = {
				id             : $comp_row.id,
				name           : $comp_row.name
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

			//1已注册，2未注册
			$ret_row.reg_stat = parseInt($comp_row.regFrom) == CONST.COMPONY_REG_FROM_IN_SPEC ? 2 : 1;
			//1已认证，2未认证
			$ret_row.cert_stat = parseInt($comp_row.certStat) == CONST.CERTIFYCATION_STAT_SUCCESS ? 1 : 2;
			//0未入规，1区规，2省规
			$ret_row.spec_type = parseInt($comp_row.isProvinceSpecs) ? 2 : 1;
			if(parseInt($comp_row.specStat) !== 4) $ret_row.spec_type = 0;

			$ret_row.n_product = _.size($comp_n_product_rows) && _.size($comp_n_product_rows[$comp_row.id]) && $comp_n_product_rows[$comp_row.id].cnt || 0; 

			$ret.list.push($ret_row);
		});

		return res.jsonok($ret);
	},
};

