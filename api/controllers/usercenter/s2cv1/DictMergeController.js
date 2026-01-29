
module.exports = {
    getDict: async function(req, res) {
		let $dict_ids = cutil.getReqSP(req, 'k', 'string', '|');
		if(!_.isArray($dict_ids)) return res.jsonerr('k参数错误');

		let $ret = {};
		let $n_dict_ids = $dict_ids.length;
		for(let $_idx_dict_id = 0; $_idx_dict_id < $n_dict_ids; $_idx_dict_id ++) {
			let $dict_id = $dict_ids[$_idx_dict_id];

			switch($dict_id) {
				case 'zone':
					let $zone_rows = await DictCompZone.find();
					$ret.zone = $zone_rows;
					break;
				case 'employee':
					let $employee_rows = [];
					$employee_rows.push({id: 0, name: '未选择'});
					_.each(CONST.FACTORY_EMPLOYEE_MAP, function($employee_map_row) {
						$employee_rows.push($employee_map_row);
					});
					$ret.employee = $employee_rows;

					break;
				case 'n_reg_date':
					$ret.n_reg_date = CONST.N_REG_DATE_MAP;
					break;
			}
		}

		return res.jsonok($ret);
	},
};

