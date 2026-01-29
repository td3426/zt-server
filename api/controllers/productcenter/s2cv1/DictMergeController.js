
module.exports = {
    getDict: async function(req, res) {
		let $dict_ids = cutil.getReqSP(req, 'k', 'string', '|');
		if(!_.isArray($dict_ids)) return res.jsonerr('k参数错误');

		let $ret = {};
		let $n_dict_ids = $dict_ids.length;
		for(let $_idx_dict_id = 0; $_idx_dict_id < $n_dict_ids; $_idx_dict_id ++) {
			let $dict_id = $dict_ids[$_idx_dict_id];

			switch($dict_id) {
				case '':
					break;
			}
		}

		return res.jsonok($ret);
	},
};

