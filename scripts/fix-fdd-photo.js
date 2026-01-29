const moment = require('moment');

module.exports = {
    friendlyName: 'fix-fdd-photo',
    description: '',
    inputs: {},
    fn: async function (inputs, exits) {
		let $has_error = false;
		let $comp_rows = await Comp.find({
			where: {
				certStat: CONST.CERTIFYCATION_STAT_SUCCESS
			},
			select: ["id", "name", "fddVerifyTransactionNo", "creditImage", "agentIdFront", "legalIdFront"]
		});

		let fdd = Fadada.create();
		for(let $idx_comp_rows in $comp_rows) {
			let $comp_row = $comp_rows[$idx_comp_rows];

			if(!_.size($comp_row.fddVerifyTransactionNo)) continue;
			if($comp_row.creditImage.indexOf('/') !== -1) continue;

			let $fdd_comp_row = {};
			try {
				$fdd_comp_row = await fdd.findCompCert($comp_row.fddVerifyTransactionNo);
			} catch($e) {
				sails.log.error("fix-fdd-photo Error: 法大大获取企业认证信息失败", $e);
				$has_error = true;
				continue;
			}

			let $imgs = {};
			$imgs['creditImage'] = $fdd_comp_row.company && $fdd_comp_row.company.organizationPath || '';
			let $principalType = parseInt($fdd_comp_row.manager.type);
			if($principalType == 2) {
				$imgs['agentIdFront'] = $fdd_comp_row.manager && $fdd_comp_row.manager.headPhotoPath || '';
			} else if($principalType == 1) {
				$imgs['legalIdFront'] = $fdd_comp_row.manager && $fdd_comp_row.manager.headPhotoPath || '';
			}

			let $set = {};
			for(let k in $imgs) {
				let $fdName = k;
				let $imgUUID = $imgs[k];
				try {
					$set[$fdName] = await fdd.getFileByUUID($imgUUID);
				} catch($e) {
					sails.log.error('fix-fdd-photo Error: 转存图片失败(' + $comp_row.id + ' - ' + k + ': ' + $imgUUID + ')', $e);
					$has_error = true;
				}
			}

			if(_.size($set)) {
				await Comp.update($comp_row.id).set($set);
			}
		}

		//let $comp_ids = cutil.getTabCol($comp_rows, 'id');
		//$comp_rows = await Comp.find({
		//	id: $comp_ids
		//});

		//let $dataex_api = new DataexApi(req);
		//for(let $idx_comp_rows in $comp_rows) {
		//	let $comp_row = $comp_rows[$idx_comp_rows];
		//	try {
		//		await $dataex_api.notify(sails.config.dataexApi.channelNoCompUpdate, $comp_row);
		//	} catch($e) {
		//		sails.log.error($e);
		//	}
		//}

		if($has_error)
			console.log('数据更新完毕，但是有错误发生');
		else
			console.log('数据更新完毕，全部成功');

        return exits.success();
    }
};

