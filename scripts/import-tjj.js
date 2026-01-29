
const moment = require('moment');
const csv = require('fast-csv');

const $zone = [
	'未选择',
	'龙回150亩',
	'龙回三益',
	'龙回半岭',
	'镜坝工业园128亩',
	'镜坝工业园200亩',
	'镜坝工业园703亩',
	'龙岭工业园',
	'东山文峰',
	'东山官坑',
	'唐江镇大岭',
	'龙华工业园50亩',
	'龙华工业园98亩',
	'龙华工业园545亩',
	'龙华高峰101亩',
	'横寨33亩',
];

module.exports = {
    friendlyName: 'import-tjj',
    description: '导入统计局数据',
    inputs: { },
    fn: async function (inputs, exits) {
		let $csv_file = '../data/tjj-gc-20200604.csv';

		let $rows = [];
		let $pm = new Promise((resolved, rejected) => {
			csv.fromPath($csv_file, { headers: true })
				.on('error', $error => {
					sails.log.error($error);
					rejected($error);
				})
				.on('data', $row => {
					$rows.push($row);
				})
				.on('end', $rowCount => {
					sails.log(`Parsed ${$rowCount} rows`);
					resolved($rowCount);
				});
		});
		await $pm;

		//sourceId
		//name
		//legalName
		//addr
		//gc_aptitude_zone
		//area
		for(let $i = 0; $i < $rows.length; $i ++) {
			let $row = $rows[$i];
			sails.log($i + 1 + '...');
			
			let $aptitude_row = {
				ability_service: { //服务能力
					jgsx: [], //加工属性
					mczl: [], //主要加工木材种类
					zdcp: [], //主打产品
					wx: [], //外协
					fwbq: [], //服务标签
				},
				stat: { //工厂现状
					n_employee: 0, //总人数
					reg_date: 0, //成立时间
					area: 0, //工厂面积，平米
					amount: 0, //总产值，万
					n_equipment: 0, //生产设备，台
					zone: 0, //所在区域
					photo: [], //照片
					video: [], //视频
					intro: '' //简介
				},
				relation: { //相关资料
					honor: [], //荣誉
					iso: [], //质量认证
					site: '', //网站
				},
				ability_make: [], //工艺能力
				real_check: { //实地认证
					stat: 1, //实地认证状态，0未认证，1已认证
					expired_at: moment().valueOf() + 1000 * 86400 * 365 //到期日
				}
			};


			let $comp_row      = await Comp.findOne({name: $row.name});
			let $set_comp_row       = {};
			$set_comp_row.sourceId  = $row.sourceId;
			$set_comp_row.name      = $row.name;
			$set_comp_row.legalName = $row.legalName;
			$set_comp_row.addr      = $row.addr;

			if(_.size($comp_row)) {
				try { $comp_row.aptitude = JSON.parse($comp_row.aptitude); } catch($e) {}
				$comp_row.aptitude = _.size($comp_row.aptitude) ? $comp_row.aptitude : {};
				if(_.size($comp_row.aptitude)) $aptitude_row = $comp_row.aptitude;
			}
			
			$aptitude_row.stat.area = $row.area;
			$aptitude_row.stat.zone = _.findIndex($zone, function(v) {return v == $row.gc_aptitude_zone;});
			$aptitude_row.stat.zone = $aptitude_row.stat.zone > 0 ? $aptitude_row.stat.zone : 0;

			$set_comp_row.aptitude      = JSON.stringify($aptitude_row);
			$set_comp_row.aptitudeScore = $comp_row && $comp_row.aptitudeScore || 0;
			$set_comp_row.aptitudeStat  = CONST.APTITUDE_STAT_SUCCESS;
			$set_comp_row.aptitudeMsg   = '';


			if(_.size($comp_row)) {
				await Comp.update({id: $comp_row.id}).set($set_comp_row);
				sails.log($i + 1 + '... update OK');
				continue;
			}

			try {
				await sails.getDatastore('default').transaction(async (db, proceed) => {
					try {
						let $mobile = '140' + await cutil.randomCustom('0123456789', 8);
						while(1) {
							if(!await User.count({mobile: $mobile})) break;
							$mobile = '140' + await cutil.randomCustom('0123456789', 8);
							sails.log('random ...');
						}
						let $password_hash = await sails.helpers.passwords.hashPassword('999999');

						let $user_row = await User.createUser({
							name: await cutil.randomCustom('abcdefghijklmnopqrstuvwxyz', 6),
							mobile: $mobile,
							passwd: $password_hash,
						}, db, true);

						let $comp_code = await cutil.randomCustom('0123456789abcdef', 6);
						while(1) {
							if(!await Comp.count({compCode: $comp_code})) break;
							$comp_code = await cutil.randomCustom('0123456789abcdef', 6);
							sails.log('random ...');
						}
						$set_comp_row.fddOpenId = '';
						$set_comp_row.province  = '';
						$set_comp_row.city      = '';
						$set_comp_row.compCode  = $comp_code;
						$set_comp_row.compType  = CONST.COMPONY_TYPE_FURNITURE_FACTORY;
						$set_comp_row.certStat  = CONST.CERTIFYCATION_STAT_UNAPLLY;
						$set_comp_row.createdBy = $user_row.id;

						let $comp_row = await Comp.create($set_comp_row).fetch().usingConnection(db);

						await CompDeptUserRel.create({
							compId: $comp_row.id,
							deptId: 0,
							userId: $user_row.id
						}).usingConnection(db);

						await User.setUser($user_row.id, {
							step: CONST.USER_STEP_COMP,
							compId: $comp_row.id,
							compCreator: 1
						}, db);

						return proceed(undefined, 'ok');
					} catch (err) {
						return proceed(err);
					}
				});
			} catch ($e) {
				sails.log.error($e);
			}

			sails.log($i + 1 + '... create OK');
		}

        return exits.success();
    }
};

