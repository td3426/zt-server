
const uuidv4 = require('uuid/v4');
const flaverr = require('flaverr');

module.exports = {

    tableName: 'dict_form',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            type: 'string',
            maxLength: 32,
            description: 'uuid',
            required: true
        },

        formGroupId: {
            type: 'string',
            maxLength: 32,
            description: '',
            required: true
        },

       name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

       desc: {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false

    },

    genUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await DictForm.count({id: id}).usingConnection($conn);
            else
                $exist = await DictForm.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
				throw new flaverr( 'E_U_ERROR', new Error('生成UUID失败'));
            }
        }

        return id;
    },

	getForms: async function(form_group_id, form_id) {
		var where_form = {};

		if(form_group_id) {
			where_form.formGroupId = form_group_id;
		}

		if(form_id) {
			where_form.id = form_id
		}

		var form_rows = await DictForm.find(where_form);
		if(!form_rows || !_.size(form_rows)) return [];

		return form_rows;
	},

	addForm: async function(form_group_id, set) {
		try {
			if(!form_group_id) throw new flaverr( 'E_U_ERROR', new Error('ID为空'));

			var name = set.name.toString().trim();
			if(!name.length) throw new flaverr('E_U_ERROR', new Error('name为空'));

			var id = await DictForm.genUUID();
			var set_row = {
				id: id,
				formGroupId: form_group_id,
				name: name
			};

			await DictForm.create(set_row);
			return set_row;
		} catch(e) {
			if(e.code != 'E_U_ERROR') sails.log.error(e);
			throw new Error(e.message);
		}
	},

	delForm: async function(form_id, force) {
		force = force ? true : false;
		if(!form_id) throw new flaverr('E_U_ERROR', new Error('记录不存在'));

		var form_row = await DictForm.findOne({id: form_id});
		if(!form_row || !_.size(form_row)) throw new flaverr('E_U_ERROR', new Error('记录不存在'));

		if(!force) {
			var n_row = await DictFormField.count({
				formGroupId: form_row.formGroupId,
				formId: form_row.id
			});
			if(n_row) throw new flaverr('E_U_ERROR', new Error('还有子项存在，不能删除'));
		}

		try {
			await sails.getDatastore().transaction(async (db, proceed) => {
				try {
					await DictFormField.destroy({
						formGroupId: form_row.formGroupId,
						formId: form_row.id
					}).usingConnection(db);

					await DictForm.destroy({
						id: form_row.id
					}).usingConnection(db);

					return proceed(undefined, 'ok');
				} catch(e) {
					sails.log.error(err);
					return proceed(flaverr('E_ERROR', new Error('数据写入失败')));
				}
			});
			return true;
		} catch(e) {
			throw new Error(e.message);
		}
	},


	getFields: async function(form_group_id, form_id, field_id) {
		var where_form = {}, where_field = {};

		if(form_group_id) {
			where_form.formGroupId = form_group_id;
			where_field.formGroupId = form_group_id;
		}

		if(form_id) {
			where_form.id = form_id
			where_field.formId = form_id;
		}

		if(field_id) {
			where_field.id = field_id;
		}

		var form_rows = await DictForm.find(where_form);
		if(!form_rows || !_.size(form_rows)) return [];
		form_rows = cutil.indexTabByCol(form_rows, 'formGroupId', 'id');

		var field_rows = await DictFormField.find(where_field);
		if(!field_rows || !_.size(field_rows)) return [];

		var ret = [];
		_.each(field_rows, function(field_row){
			var ret_row = field_row;
			try{
				ret_row.options = ret_row.options && ret_row.options.length > 1 ? JSON.parse(ret_row.options) : [];
			} catch(e) {
				ret_row.options = [];
			};
			ret_row.formName = form_rows && form_rows[field_row.formGroupId] && form_rows[field_row.formGroupId][field_row.formId] && form_rows[field_row.formGroupId][field_row.formId].name || '';
			ret.push(ret_row);
		});

		return ret;
	},

	addField: async function(set) {
		try {
			var set_row = {};
			var form_group_id = set.formGroupId;
			var form_id = set.formId;

			var name = set.name.toString().trim();
			if(!name.length) throw new flaverr('E_U_ERROR_NAME', new Error('name为空'));
			set_row.name = name;

			var type = parseInt(set.type) || 0;
			if(type < 1 || type > 6) throw new flaverr('E_U_ERROR_type', new Error('type无效'));
			set_row.type = type;

			if(!form_group_id || !form_id) throw new flaverr('E_U_ERROR_FORM_ID', new Error('form_id不存在'));

			var form_row = await DictForm.findOne({ id: form_id });
			if(!form_row || !_.size(form_row)) throw new flaverr('E_U_ERROR_FORM_NOT_EXIST', new Error('form记录不存在'));
			set_row.formGroupId = form_group_id;
			set_row.formId = form_id;

			var options = set.options;
			if(_.isArray(options) && options) {
				var tmp = [];
				_.each(options, function(opt) {
					var opt_row = null;
					var k = opt.k.toString().trim();
					var v = opt.v.toString().trim();
					if(k) {
						opt_row = {
							k: k,
							v: v
						}
					}
					if(opt_row) tmp.push(opt_row);
				});
				set_row.options = JSON.stringify(tmp);
			} else {
				set_row.options = '';
			}

			if(-1 === _.indexOf([1, 2], set_row.type)) set_row.options = '';

			set_row.id = await DictFormField.genUUID();
			await DictFormField.create(set_row);

			return true;
		} catch(e) {
			if(e.code.substr(0, 9) != 'E_U_ERROR') sails.log.error(e);
			throw new Error(e.message);
		}
	},

	updateField: async function(field_id, set) {
		try {
			if(!field_id) throw new flaverr(
				'E_U_ERROR',
				new Error('ID为空')
			);

			var field_row = await DictFormField.findOne({id: field_id});
			if(!field_row || !_.size(field_row)) throw new flaverr(
				'E_U_ERROR',
				new Error('记录不存在')
			);

			var set_row = {};
			_.each(set, function(value, fd) {
				switch(fd) {
					case 'name':
						set_row.name = value.trim();
						if(set_row.name.length < 1) {
							throw new flaverr(
								'E_U_ERROR',
								new Error('name为空')
							);
							return false;
						}
						break;
					case 'type':
						set_row.type = parseInt(value) || 0;
						if(set_row.type < 1 || set_row.type > 6) {
							throw new flaverr(
								'E_U_ERROR',
								new Error('type无效')
							);
							return false;
						}
						break;
					case 'options':
						if(_.isArray(value) && value) {
							var tmp = [];
							_.each(value, function(opt) {
								var opt_row = null;
								var k = opt.k.toString().trim();
								var v = opt.v.toString().trim();
								if(k) {
									opt_row = {
										k: k,
										v: v
									}
								}
								if(opt_row) tmp.push(opt_row);
							});
							set_row.options = JSON.stringify(tmp);
						} else {
							set_row.options = '';
						}

						break;
				}
			});

			if(typeof set_row.type == 'undefined') set_row.type = field_row.type;
			if(-1 === _.indexOf([1, 2], set_row.type)) set_row.options = '';

			await DictFormField.update({id: field_id}).set(set_row);

			return true;
		} catch(e) {
			if(e.code != 'E_U_ERROR') sails.log.error(e);
			throw new Error(e.message);
		}
	},

	delField: async function(id) {
		if(!id) throw new flaverr('E_U_ERROR', new Error('记录不存在'));

		var field_row = await DictFormField.findOne({id: id});
		if(!field_row || !_.size(field_row)) throw new flaverr('E_U_ERROR', new Error('记录不存在'));

		try {
			await sails.getDatastore().transaction(async (db, proceed) => {
				try {
					await DictFormField.destroy({
						id: field_row.id
					}).usingConnection(db);

					return proceed(undefined, 'ok');
				} catch(e) {
					sails.log.error(err);
					return proceed(flaverr('E_ERROR', new Error('数据写入失败')));
				}
			});
			return true;
		} catch(e) {
			throw new Error(e.message);
		}
	},

};

