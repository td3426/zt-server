
module.exports = {
    list: async function(req, res) {
		let $zone_rows = await DictCompZone.find();
		$zone_rows = _.size($zone_rows) ? $zone_rows : [];
	
		return res.jsonok($zone_rows);
	},

    add: async function(req, res) {
		let $name = cutil.getReq(req, 'name');
		if(!_.size($name)) return res.jsonerr('请输入名称');

		await DictCompZone.create({
			name: $name
		});
	
		return res.jsonok('ok');
	},

    update: async function(req, res) {
		let $id = parseInt(cutil.getReq(req, 'id')) || 0;
		let $name = cutil.getReq(req, 'name');

		if(!$id) return res.jsonerr('id为空');
		if(!_.size($name)) return res.jsonerr('请输入名称');

		if(!await DictCompZone.count({id: $id})) return res.jsonerr('记录不存在');

		await DictCompZone.update({id: $id}).set({
			name: $name
		});
	
		return res.jsonok('ok');
	},
};

