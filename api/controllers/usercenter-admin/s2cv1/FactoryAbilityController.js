
module.exports = {

    listAbility: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var form_rows = await DictForm.getForms(CONST.FACTORY_ABILITY_FORM_GROUP);
		var $ret = [];
		var ret_fds = ["id", "name"];
		_.each(form_rows, function(row) {
			var ret_row = cutil.snakeCaseObject(cutil.getRowCols(row, ret_fds));
			$ret.push(ret_row);
		});

		return res.jsonok($ret);
    },

    addAbility: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var name = cutil.getReq(req, 'name');
		if(!name.length) return res.jsonerr('名称为空');

		await DictForm.addForm(CONST.FACTORY_ABILITY_FORM_GROUP, {
			name: name
		});

		return res.jsonok('ok');
    },

    updateAbility: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		let id = cutil.getReq(req, 'id');
		let name = cutil.getReq(req, 'name');

		if(!_.size(id)) return res.jsonerr('id为空');
		if(!name.length) return res.jsonerr('名称为空');

		let $dict_form_row = await DictForm.findOne(id);
		if(!_.size($dict_form_row)) return res.jsonerr('记录不存在');

		await DictForm.update(id).set({
			name: name
		});

		return res.jsonok('ok');
    },


    delAbility: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var id = cutil.getReq(req, 'id');
		if(!id.length) return res.jsonerr('id为空');

		try {
			await DictForm.delForm(id);
			return res.jsonok('ok');
		} catch(e) {
			return res.jsonerr(e.message);
		}
    },


    listQuota: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var id = cutil.getReq(req, 'ability_id');
		if(!id.length) return res.jsonerr('id为空');

		var quota_rows = await DictForm.getFields(CONST.FACTORY_ABILITY_FORM_GROUP, id);

		var $ret = [];
		var ret_fds = ["id", "name", "formName", "type", "options"];
		_.each(quota_rows, function(row) {
			var ret_row = cutil.snakeCaseObject(cutil.getRowCols(row, ret_fds));
			$ret.push(ret_row);
		});

		return res.jsonok($ret);
    },

    addQuota: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var set = {};
		set.formGroupId = CONST.FACTORY_ABILITY_FORM_GROUP;
		set.formId = cutil.getReq(req, 'ability_id');
		set.name = cutil.getReq(req, 'name');
		set.type = cutil.getReq(req, 'type');
		set.options = req.param('options');

		try {
			await DictForm.addField(set);
			return res.jsonok('ok');
		} catch(e) {
			return res.jsonerr(e.message);
		}
    },

    updateQuota: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var set = {};
		var id = cutil.getReq(req, 'id');
		set.name = cutil.getReq(req, 'name');
		set.type = cutil.getReq(req, 'type');
		set.options = req.param('options');

		try {
			await DictForm.updateField(id, set);
			return res.jsonok('ok');
		} catch(e) {
			return res.jsonerr(e.message);
		}
    },

    delQuota: async function(req, res) {
		try {
			let adminApi = new AdminApi();
			if(!await adminApi.ucan(req.me.token, CONST.ADMIN_PRIV_DICT)) return res.jsonerr('没有权限');
		} catch($e) {
			return res.jsonerr('AdminApi: ' + ($e.message || '错误'));
		}

		var id = cutil.getReq(req, 'id');
		try {
			await DictForm.delField(id);
			return res.jsonok('ok');
		} catch(e) {
			return res.jsonerr(e.message);
		}
    },

};
