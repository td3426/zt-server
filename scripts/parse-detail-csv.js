const csv = require('fast-csv');

module.exports = {
	friendlyName: 'parse detail',
	description: '',
	inputs: {},

	fn: async function (inputs, exits) {
		var rows = [];
		var pm = new Promise((resolved, rejected) => {
			csv
				.parseFile('../data/ganzhou-jiaju-gongchang.csv', { headers: true })
				.on('error', error => {
					sails.log.error(error);
					rejected(error);
				})
				.on('data', row => {
					rows.push(row);
				})
				.on('end', rowCount => {
					sails.log(`Parsed ${rowCount} rows`);
					resolved(rowCount);
				});
		});
		await pm;
		for(var i = 0; i < rows.length; i ++) {
			var row = rows[i];
			var code = row['统一社会信用代码/注册号'];
			code = code == '-' ? '' : code;
			var cond = [];
			if(code.length > 0) {
				cond.push({creditIdCode: code});
				cond.push({regIdcode: code});
			}
			if(cond.length < 1) cond.push({name: row['公司名称']});
			var crows = await CrmResourceCompany.find({
				'or': cond
			});

			if(_.size(crows) == 0) {
				sails.log(row['公司名称'] + ' not found');
				continue;
			}

			var crow = crows[0];
			var tels = row['联系电话（工商信息）'];
			tels = tels.replace('（工商最新）', '');
			tels = tels.split(' ');
			var tmp = [];
			var sets = {};
			for(var itel = 0; itel < tels.length; itel ++) {
				var tel = tels[itel].trim();
				if(tel.length < 3) continue;

				if(crow.tel1.length < 1) {
					sets.tel1 = tel;
				} else if(tel.length == crow.tel1.length) {
					var match = true;
					for(var itel1 = 0; itel1 < crow.tel1.length; itel1 ++) {
						var c1 = crow.tel1.substr(itel1, 1);
						var c2 = tel.substr(itel1, 1);
						if(c1 != '*' && c1 != c2) {
							match = false;
						}
					}
					if(match) {
						sets.tel1 = tel;
					}
				}

				if(typeof sets.tel1 == 'undefined') {
					tmp.push(tel);
				}
			}

			if(tmp.length) sets.tel2 = tmp.join(',');

			if(_.size(sets) < 1) continue;
			await CrmResourceCompany
				.update({
					id: crow.id
				})
				.set(sets);
		}

		return exits.success();
	}
};
