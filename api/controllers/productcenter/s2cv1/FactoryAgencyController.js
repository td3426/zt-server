
const moment = require('moment');

module.exports = {
	listAgencyGroup: async function(req, res) {
		let $factory_comp_id = parseInt(cutil.getReq(req, 'comp_id')) || 0;

		if(!$factory_comp_id) return res.jsonerr('comp_id参数为空');
	
		let $agency_group_rows = await FactoryAgencyGroup.find({
			factoryCompId: $factory_comp_id
		});
	
		let $ret = [];
		_.each($agency_group_rows, function($agency_group_row) {
			let $ret_row = {
				id   : $agency_group_row.id,
				name : $agency_group_row.name
			};
			$ret.push($ret_row);
		});
	
		return res.jsonok($ret);
	},
	
    addAgencyGroup: async function(req, res) {
		let $name = cutil.getReq(req, 'name');
		let $factory_comp_id = req.me.compId;
	
		await FactoryAgencyGroup.create({
			factoryCompId: $factory_comp_id,
			name: $name
		});
	
		return res.jsonok('ok');
	},

    updateAgencyGroup: async function(req, res) {
		let $id = parseInt(cutil.getReq(req, 'group_id')) || 0;
		let $name = cutil.getReq(req, 'name');

		if( !$id ) return res.jsonerr('数据不存在');

		let $agency_group_row = await FactoryAgencyGroup.findOne($id);
		if(!_.size($agency_group_row)) return res.jsonerr('数据不存在');
		if($agency_group_row.factoryCompId != req.me.compId) return res.jsonerr('该分组不属于本企业');

		await FactoryAgencyGroup.update($id).set({
			name: $name
		});

		return res.jsonok('ok');
	},

    delAgencyGroup: async function(req, res) {
		let $factory_comp_id = req.me.compId;
		let $id = parseInt(cutil.getReq(req, 'group_id')) || 0;

		if( !$id ) return res.jsonerr('数据不存在');

		let $agency_group_row = await FactoryAgencyGroup.findOne($id);
		if(!_.size($agency_group_row)) return res.jsonerr('数据不存在');
		if($agency_group_row.factoryCompId != req.me.compId) return res.jsonerr('该分组不属于本企业');

		try {
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					await FactoryAgency.destroy({
						factoryCompId: $factory_comp_id,
						agencyGroupId: $id,
					}).usingConnection(db);

					await FactoryAgency.destroy({
						factoryCompId: $factory_comp_id,
						agencyGroupId: $id,
					}).usingConnection(db);

					await FactoryAgencyGroup.destroy({
						id: $id
					}).usingConnection(db);

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

			sails.log.error($e);
			return res.jsonerr($e.message || $e.toString());
		}

		return res.jsonok('ok');
	},


    addProductToAgencyGroup: async function(req, res) {
		let $spu_ids = req.param('factory_product_no');
		if(!_.isArray($spu_ids) || !_.size($spu_ids)) return res.jsonerr('请选择商品');

		let $group_ids = req.param('group_id');
		if(!_.isArray($group_ids) || !_.size($group_ids)) return res.jsonerr('请选择经销商分组');

		let $tmp = [];

		_.each($spu_ids, function($id) {
			let $spu_id = $id.trim();
			if($spu_id) $tmp.push($spu_id);
		});
		$spu_ids = $tmp;
		if(!_.size($spu_ids)) return res.jsonerr('请选择商品');

		let $factory_product_rows = await FactoryProduct.find({
			id: $spu_ids
		});

		$tmp = [];
		_.each($factory_product_rows, function($factory_product_row) {
			if($factory_product_row.factoryCompId == req.me.compId) {
				$tmp.push($factory_product_row.id);
			}
		});
		$spu_ids = $tmp;
		if(!_.size($spu_ids)) return res.jsonerr('请选择商品');


		$tmp = [];
		_.each($group_ids, function($id) {
			let $group_id = parseInt($id) || 0;
			if($group_id) $tmp.push($group_id);
		});
		$group_ids = $tmp;
		if(!_.size($group_ids)) return res.jsonerr('请选择经销商分组');
	
		let $agency_group_rows = await FactoryAgencyGroup.find({
			id: $group_ids
		});

		$tmp = [];
		_.each($agency_group_rows, function($agency_group_row) {
			if($agency_group_row.factoryCompId == req.me.compId) {
				$tmp.push($agency_group_row.id);
			}
		});
		$group_ids = $tmp;
		if(!_.size($group_ids)) return res.jsonerr('请选择经销商分组');

		let $create_set = [];
		_.each($spu_ids, function($spu_id) {
			_.each($group_ids, function($group_id) {
				$create_set.push({
					factoryCompId    : req.me.compId,
					agencyGroupId    : $group_id,
					factoryProductNo : $spu_id
				});
			});
		});
	
		try {
			await sails.getDatastore('factory').transaction(async (db, proceed) => {
				try {
					await FactoryAgencyGroupProduct.destroy({
						factoryCompId    : req.me.compId,
						agencyGroupId    : $group_ids,
						factoryProductNo : $spu_ids
					}).usingConnection(db);

					await FactoryAgencyGroupProduct.createEach($create_set).usingConnection(db);

					return proceed(undefined, 'ok');
				} catch (err) {
					return proceed(err);
				}
			});
		} catch ($e) {
			if($e.code == 'E_USER_ERROR') return res.jsonerr($e.message);

			sails.log.error($e);
			return res.jsonerr($e.message || $e.toString());
		}
	
		return res.jsonok('ok');
	},

	getProductAgencyGroup: async function(req, res) {
		let $spu_id = cutil.getReq('factory_product_no');
		let $ret = [];

		if($spu_id.length) {
			let $rows = await FactoryAgencyGroupProduct.find({
				where: {
					factoryCompId    : req.me.compId,
					factoryProductNo : $spu_id
				},
				select: ['agencyGroupId']
			});
			$ret = cutil.getTabCol($rows, 'agencyGroupId');
			$ret = _.values($ret);
		}

		return res.jsonok($ret);
	},

    listProductByAgencyGroup: async function(req, res) {
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $group_id = parseInt(cutil.getReq(req, 'group_id'));
		if(!$group_id) return res.jsonerr('group_id参数为空');

		//let $set_no = cutil.getReq(req, 'set_no');
	
		let $factory_product_ids, $n_product_rows;
		/*if(_.size($set_no)) {
			$n_product_rows = await sails.getDatastore().sendNativeQuery(
				"select count(1) as cnt from factory_agency_group_product as ap" +
				" inner join factory_product as p on ap.factoryProductNo=p.factoryProductNo" +
				" where p.setNo='$1' and ap.factoryCompId=$2 and ap.agencyGroupId=$3",
				[$set_no, req.me.compId, $group_id]
			);
			if(!$n_product_rows) return res.jsonok({list: [], total: 0});

			$n_product_rows = _.size($n_product_rows) && _.size(factoryProductNo.rows) && _.size(factoryProductNo.rows[0]) && factoryProductNo.rows[0].cnt || 0;
			$factory_product_ids = await sails.getDatastore().sendNativeQuery(
				"select ap.factoryProductNo from factory_agency_group_product as ap" +
				" inner join factory_product as p on ap.factoryProductNo=p.factoryProductNo" +
				" where p.setNo='$1' and ap.factoryCompId=$2 and ap.agencyGroupId=$3" +
				" limit $4, $5",
				[$set_no, req.me.compId, $group_id, $start, $pagesize]
			);
			$factory_product_ids = _.size($factory_product_ids) && _.size($factory_product_ids.rows) && $factory_product_ids.rows || [];
			let $tmp = []
			_.each($factory_product_ids, function($fpi_row) {
				$tmp.push($fpi_row.factoryProductNo);
			});
			$factory_product_ids = $tmp;
		} else */{
			$n_product_rows = await FactoryAgencyGroupProduct.count({
				factoryCompId: req.me.compId,
				agencyGroupId: $group_id
			});
			if(!$n_product_rows) return res.jsonok({list: [], total: 0});

			$factory_product_ids = await FactoryAgencyGroupProduct.find({
				where: {
					factoryCompId: req.me.compId,
					agencyGroupId: $group_id
				},
				skip: $start,
				limit: $pagesize
			});
			let $tmp = []
			_.each($factory_product_ids, function($fpi_row) {
				$tmp.push($fpi_row.factoryProductNo);
			});
			$factory_product_ids = $tmp;
		}

		let $product_rows = await FactoryProduct.find({
			where: {
				id: $factory_product_ids
			},
			skip: $start,
			limit: $pagesize,
			sort: 'updatedAt desc'
		});
	
		let $product_ids = cutil.getTabCol($product_rows, 'id');

		let $acc_rows = await FactoryProduct.find({
			factoryParentProductNo: _.values($product_ids),
		});
		let $acc_product_ids = cutil.getTabCol($acc_rows, 'id');
		$acc_rows = cutil.indexTabByCol($acc_rows, 'factoryParentProductNo', 'id');

        let $designer_ids = cutil.getTabCol($product_rows, 'designerUserId');
        let $designer_rows = {};
        if($designer_ids) {
            $designer_rows = await User.getUsers(_.values($designer_ids), ['id', 'name', 'avatar', 'compId']);
        }

		let $design_comp_ids = cutil.getTabCol($product_rows, 'designerCompId');
        let $design_comp_rows = await Comp.getComps(_.values($design_comp_ids), ['id', 'name', 'logo']);
		$design_comp_rows = cutil.indexTabByCol($design_comp_rows, 'id');

		let $cat_rows = await ProductCat.find();
		$cat_rows = cutil.indexTabByCol($cat_rows, 'id');

		//let $set_ids = cutil.getTabCol($product_rows, 'setNo');
		//let $set_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$set_rows = cutil.indexTabByCol($set_rows, 'id');
		//$set_ids = cutil.getTabCol($set_rows, 'pid');
		//$pset_rows = await ProductSet.find({
		//	id: _.values($set_ids)
		//});
		//$pset_rows = cutil.indexTabByCol($pset_rows, 'id');


		let $style_ids = cutil.getTabCol($product_rows, 'styleNo');
		let $style_rows = await ProductStyle.find({
			id: _.values($style_ids)
		});
		$style_rows = cutil.indexTabByCol($style_rows, 'id');

		let $sku_rows = await FactoryProductSku.getStepPrice(_.values(_.assign({}, $product_ids, $acc_product_ids)));

		let $ret = [];
		let $tm = moment().valueOf();
		_.each($product_rows, function($row){
            let $ret_row = cutil.snakeCaseObject($row);

			try{ $ret_row.photo_render = $ret_row.photo_render ? JSON.parse($ret_row.photo_render) : []; } catch(e) { $ret_row.photo_render = []; }
			try{ $ret_row.photo_sample = $ret_row.photo_sample ? JSON.parse($ret_row.photo_sample) : []; } catch(e) { $ret_row.photo_sample = []; }

            $ret_row.designer = {
                id: $row.designerUserId,
                name: $designer_rows[$row.designerUserId] && $designer_rows[$row.designerUserId].name ? $designer_rows[$row.designerUserId].name : '',
                avatar: $designer_rows[$row.designerUserId] && $designer_rows[$row.designerUserId].avatar ? $designer_rows[$row.designerUserId].avatar : ''
            };
			delete $ret_row.designerUserId;

			$ret_row.design_comp = {
				id: $row.designerCompId,
				name: $design_comp_rows && $design_comp_rows[$row.designerCompId] ? $design_comp_rows[$row.designerCompId].name : '',
				logo: $design_comp_rows && $design_comp_rows[$row.createdByCompId] ? $design_comp_rows[$row.createdByCompId].logo : ''
			};
			delete $ret_row.designerCompId;

			$ret_row.cat = {
				id: $row.catId,
				name: $cat_rows && $cat_rows[$row.catId] ? $cat_rows[$row.catId].name : ''
			};
			delete $ret_row.cat_id;

			//$ret_row.set = {
			//	id   : $set_rows && $set_rows[$row.setNo] && $set_rows[$row.setNo].pid || '',
			//	name : $set_rows && $set_rows[$row.setNo] && $pset_rows && $pset_rows[$set_rows[$row.setNo].pid] ? $pset_rows[$set_rows[$row.setNo].pid].name : ''
			//};
			//$ret_row.set_id = $row.setNo;
			//delete $ret_row.set_no;

			$ret_row.style = {
				id: $row.styleNo,
				name: $style_rows && $style_rows[$row.styleNo] ? $style_rows[$row.styleNo].name : ''
			};
			delete $ret_row.style_no;

			$ret_row.step_price = $sku_rows[$row.id] || [];
			$ret_row.accessory = [];
			_.each($acc_rows[$row.id], function($acc_row) {
				var $ret_acc_row = {
					id: $acc_row.id,
					name: $acc_row.name,
					stat: $acc_row.stat,
					intro: $acc_row.intro,
					dimension: $acc_row.dimension,
					photo_size: $acc_row.photoSize,
					photo_story: $acc_row.photoStory,
					step_price: $sku_rows[$acc_row.id] || []
				};

				try{ $ret_acc_row.dimension = $ret_acc_row.dimension ? JSON.parse($ret_acc_row.dimension) : {}; } catch(e) { $ret_acc_row.dimension = {}; }
				try{ $ret_acc_row.photo_size = $ret_acc_row.photo_size ? JSON.parse($ret_acc_row.photo_size) : []; } catch(e) { $ret_acc_row.photo_size = []; }
				try{ $ret_acc_row.photo_story = $ret_acc_row.photo_story ? JSON.parse($ret_acc_row.photo_story) : []; } catch(e) { $ret_acc_row.photo_story = []; }

				$ret_row.accessory.push($ret_acc_row);
			});

			delete $ret_row.price;
			delete $ret_row.published_at;

			$ret.push($ret_row);
		});

        return res.jsonok({list: $ret, total: $n_product_rows});
	},


	listAgencyByGroup : async function(req, res) {
		let $group_id = parseInt(cutil.getReq(req, 'group_id'));
		if(!$group_id) return res.jsonerr('请输入group_id');
	
		let $agency_rows = await FactoryAgency.find({
			factoryCompId: req.me.compId,
			agencyGroupId: $group_id
		});

		let $apply_user_ids = cutil.getTabCol($agency_rows, 'applyByUser');
		$apply_user_ids = _.values($apply_user_ids);
		let $user_rows = {};
		if(_.size($apply_user_ids)) {
			$user_rows = await User.find($apply_user_ids);
			$user_rows = cutil.indexTabByCol($user_rows, 'id');
		}

		let $sale_comp_ids = cutil.getTabCol($agency_rows, 'saleCompId');
		$sale_comp_ids = _.values($sale_comp_ids);
		let $sale_comp_rows = {};
		if(_.size($sale_comp_ids)) {
			$sale_comp_rows = await Comp.find($sale_comp_ids);
			$sale_comp_rows = cutil.indexTabByCol($sale_comp_rows, 'id');
		}

		let $ret = [];
		_.each($agency_rows, function($agency_row) {
			let $apply_user = {
				id     : $agency_row.applyByUser,
				name   : _.size($user_rows) && _.size($user_rows[$agency_row.applyByUser]) && $user_rows[$agency_row.applyByUser].name || '',
				mobile : _.size($user_rows) && _.size($user_rows[$agency_row.applyByUser]) && $user_rows[$agency_row.applyByUser].mobile || ''
			};
			let $sale_comp = {
				id: $agency_row.saleCompId,
				name: _.size($sale_comp_rows) && _.size($sale_comp_rows[$agency_row.saleCompId]) && $sale_comp_rows[$agency_row.saleCompId].name || ''
			};
			$ret.push({
				id            : $agency_row.id,
				sale_comp     : $sale_comp,
				stat          : $agency_row.stat,
				apply_by_user : $apply_user,
				apply_at      : $agency_row.applyAt
			});
		});
	
		return res.jsonok($ret);
	},


    applyAgency: async function(req, res) {
		let $factory_id = parseInt(cutil.getReq(req, 'factory_id'));
		let $group_id   = parseInt(cutil.getReq(req, 'group_id'));
	
		if(!$factory_id) return res.jsonerr('factory_id参数为空');
		if(!$group_id) return res.jsonerr('group_id参数为空');

		let $comp_id = req.me.compId;
		if(!$comp_id) return res.jsonerr('企业不存在');

		let $comp_rows = await Comp.find([$comp_id, $factory_id]);
		$comp_rows = cutil.indexTabByCol($comp_rows, 'id');
	
		if(!_.size($comp_rows) || !_.size($comp_rows[$factory_id])) return res.jsonerr('工厂不存在');
		if(!_.size($comp_rows) || !_.size($comp_rows[$comp_id])) return res.jsonerr('企业不存在');

		if($comp_rows[$comp_id].compType != CONST.COMPONY_TYPE_FURNITURE_SELL) return res.jsonerr('销售公司才可以申请');
		if($comp_rows[$comp_id].aptitudeScore < 80) return res.jsonerr('公司资质完成度低于80%不可申请');
	
		let $group_row = await FactoryAgencyGroup.findOne($group_id);
		if(!_.size($group_row)) return res.jsonerr('该经销商分组不存在');
		if($group_row.factoryCompId != $factory_id) return res.jsonerr('该经销商分组不属于该工厂');

		if( await FactoryAgency.count({
			factoryCompId : $factory_id,
			agencyGroupId : $group_id,
			saleCompId    : $comp_id,
			stat          : [CONST.AGENCY_STAT_OK, CONST.AGENCY_STAT_APPLY]
		})) return res.jsonerr('不能重复申请');

		await FactoryAgency.create({
			factoryCompId : $factory_id,
			agencyGroupId : $group_id,
			saleCompId    : $comp_id,
			stat          : CONST.AGENCY_STAT_APPLY,
			applyByUser   : req.me.id,
			applyAt       : moment().valueOf()
		});
	
		return res.jsonok('ok');
	},

	statAgency: async function(req, res) {
		let $factory_comp_id = req.me.compId;
		let $id = parseInt(cutil.getReq(req, 'id')) || 0;
		let $stat = parseInt(cutil.getReq(req, 'stat')) || 0;

		if( !$id ) return res.jsonerr('数据不存在');
		if(_.indexOf([1, 2, 3], $stat) === -1) return res.jsonerr('stat无效');

		let $agency_row = await FactoryAgency.findOne($id);
		if(!_.size($agency_row)) return res.jsonerr('数据不存在');
		if($agency_row.factoryCompId != req.me.compId) return res.jsonerr('该分组不属于本企业');

		//状态，0保留，1已申请，2已通过，3已拒绝
		await FactoryAgency.update($id).set({
			stat: $stat
		});

		return res.jsonok('ok');
	},
};
