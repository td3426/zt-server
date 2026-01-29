
module.exports = {
    count: async function(req, res) {
		let $ret = {
			reg: {
				all   : 0,
				type_group : []
			},
			cert: {
				all   : 0,
				type_group : []
			},
			score: {
				all   : 0,
				type_group : []
			}
		};

		let $reg_rows = await sails.getDatastore().sendNativeQuery(
			"select compType, count(1) as cnt from company where regFrom=1 group by compType"
		);

		for(let $row of $reg_rows.rows) {
			$ret.reg.all += $row.cnt;
			$ret.reg.type_group.push({
				comp_type : $row.compType,
				count     : $row.cnt
			});
		}

		let $certed_rows = await sails.getDatastore().sendNativeQuery(
			"select compType, count(1) as cnt from company where regFrom=1 and certStat=2 group by compType"
		);

		for(let $row of $certed_rows.rows) {
			$ret.cert.all += $row.cnt;
			$ret.cert.type_group.push({
				comp_type : $row.compType,
				count     : $row.cnt
			});
		}

		let $apt_score_rows = await sails.getDatastore().sendNativeQuery(
			"select compType, count(1) as cnt from company where regFrom=1 and aptitudeScore >= 80 group by compType"
		);

		for(let $row of $apt_score_rows.rows) {
			$ret.score.all += $row.cnt;
			$ret.score.type_group.push({
				comp_type : $row.compType,
				count     : $row.cnt
			});
		}

		return res.jsonok($ret);
	},

    index: async function(req, res) {
		//公司类型，1工厂，2设计公司，3销售公司，4共享打样，5共享喷涂, 6供应商，99政府
		let $comp_type_arr = [];
		if(_.isArray(req.param('comp_type_list'))) {
			for(let $comp_id of req.param('comp_type_list')) {
				$comp_id = parseInt($comp_id);
				$comp_type_arr.push($comp_id);
			}
		}

		let $comp_name_k = cutil.getReq(req, 'name');

        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $order_by = 'createdAt';
		let $order_dir = 'desc';

		let $where = {
			regFrom: CONST.COMPONY_REG_FROM_SELF
		};
		if($comp_type_arr.length) $where.compType = $comp_type_arr;
		if(_.size($comp_name_k)) $where.name = {
			'contains': $comp_name_k
		};
		
		let $cond = {
			sort  : $order_by + ' ' + $order_dir,
            skip  : $start,
            limit : $pagesize
		};
		if(_.size($where)) $cond.where = $where;
		
		let $n_comp_rows = await Comp.count($where);
		if(!$n_comp_rows) return res.jsonok({total: 0, list: []});

		let $comp_rows = await Comp.find($cond);
		let $user_rows = await User.find({
			compId      : _.values(cutil.getTabCol($comp_rows, 'id')),
			compCreator : 1
		});
		$user_rows = cutil.indexTabByCol($user_rows, 'compId');

		let $ret = [];
		let $ret_fds = [
			"id",
			"name",
			"createdAt",
			"certStat",
			"manager",
			"aptitudeScore"
		];
		for(let $comp_row of $comp_rows) {
			$comp_row.manager = null;
			if($user_rows[$comp_row.id]) {
				$comp_row.manager = {
					id     : $user_rows[$comp_row.id].id || 0,
					name   : $user_rows[$comp_row.id].name || '',
					mobile : $user_rows[$comp_row.id].mobile || ''
				};
			}
			//try { $comp_row.aptitude = JSON.parse($comp_row.aptitude); } catch($e) { $comp_row.aptitude = {}; }
			$ret.push(cutil.snakeCaseObject(cutil.getRowCols($comp_row, $ret_fds)));
		}

		return res.jsonok({
			total : $n_comp_rows,
			list  : $ret
		});
	},

    show: async function(req, res) {
	},
};

