
module.exports = {

    list: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var field_rows = await DictForm.getFields(CONST.APTITUDE_DICT_FORM_GROUP, [CONST.FACTORY_APTITUDE_DICT_FORM, CONST.DESIGN_COMP_APTITUDE_DICT_FORM]);

		var ret_fds = ["id", "name", "formName", "options"];
		var $ret = [];
		_.each(field_rows, function(row) {
			var ret_row = cutil.snakeCaseObject(cutil.getRowCols(row, ret_fds));
			$ret.push(ret_row);
		});

		return res.jsonok($ret);
    },

    updateField: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}
		var id = cutil.getReq(req, 'id');
		var options = req.param('options');

		if(!id) return res.jsonerr('记录不存在');
		var field_row = await DictForm.getFields(CONST.APTITUDE_DICT_FORM_GROUP, [CONST.FACTORY_APTITUDE_DICT_FORM, CONST.DESIGN_COMP_APTITUDE_DICT_FORM], id);
		if(!field_row || !_.size(field_row)) return res.jsonerr('记录不存在');

		try {
			await DictForm.updateField(id, {options: options});
		} catch(e) {
			return res.jsonerr(e.toString());
		}

		return res.jsonok('ok');
    }

};
