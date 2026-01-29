
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

	listAgency : async function(req, res) {
	
		let $agency_rows = await FactoryAgency.find({
			saleCompId: req.me.compId,
		});

		let $factory_comp_ids = cutil.getTabCol($agency_rows, 'factoryCompId');
		$factory_comp_ids = _.values($factory_comp_ids);
		let $comp_rows = {};
		if(_.size($factory_comp_ids)) {
			$comp_rows = await Comp.find($factory_comp_ids);
			$comp_rows = cutil.indexTabByCol($comp_rows, 'id');
		}

		let $agency_group_ids = cutil.getTabCol($agency_rows, 'agencyGroupId');
		$agency_group_ids = _.values($agency_group_ids);
		let $agency_group_rows = {};
		if(_.size($agency_group_ids)) {
			$agency_group_rows = await FactoryAgencyGroup.find($agency_group_ids);
			$agency_group_rows = cutil.indexTabByCol($agency_group_rows, 'id');
		}

		let $ret = [];
		_.each($agency_rows, function($agency_row) {
			let $factory = {
				id     : $agency_row.factoryCompId,
				name   : _.size($comp_rows) && _.size($comp_rows[$agency_row.factoryCompId]) && $comp_rows[$agency_row.factoryCompId].name || '',
			};
			let $agency_group = {
				id   : $agency_row.agencyGroupId,
				name : _.size($agency_group_rows) && _.size($agency_group_rows[$agency_row.agencyGroupId]) && $agency_group_rows[$agency_row.agencyGroupId].name || ''
			};
			$ret.push({
				id           : $agency_row.id,
				stat         : $agency_row.stat,
				factory      : $factory,
				agency_group : $agency_group,
				apply_at     : $agency_row.applyAt
			});
		});
	
		return res.jsonok($ret);
	},


    listProductByAgencyGroup: async function(req, res) {
        let $pagesize = parseInt(cutil.getReq(req, 'pagesize')) || 15;
        let $page = parseInt(cutil.getReq(req, 'page')) || 1;
        let $start = ($page - 1) * $pagesize;

		let $factory_comp_id = parseInt(cutil.getReq(req, 'factory_id'));

		let $group_id = parseInt(cutil.getReq(req, 'group_id'));
		if(!$group_id) return res.jsonerr('group_id参数为空');

		if(!await FactoryAgency.count({
			factoryCompId : $factory_comp_id,
			agencyGroupId : $group_id,
			saleCompId    : req.me.compId,
			stat          : CONST.AGENCY_STAT_OK
		})) return res.jsonerr('没有查看这个分组的权限');

		//let $set_no = cutil.getReq(req, 'set_no');
	
		let $factory_product_ids, $n_product_rows;
		/*if(_.size($set_no)) {
			$n_product_rows = await sails.getDatastore().sendNativeQuery(
				"select count(1) as cnt from factory_agency_group_product as ap" +
				" inner join factory_product as p on ap.factoryProductNo=p.factoryProductNo" +
				" where p.setNo='$1' and ap.factoryCompId=$2 and ap.agencyGroupId=$3",
				[$set_no, $factory_comp_id, $group_id]
			);
			if(!$n_product_rows) return res.jsonok({list: [], total: 0});

			$n_product_rows = _.size($n_product_rows) && _.size(factoryProductNo.rows) && _.size(factoryProductNo.rows[0]) && factoryProductNo.rows[0].cnt || 0;
			$factory_product_ids = await sails.getDatastore().sendNativeQuery(
				"select ap.factoryProductNo from factory_agency_group_product as ap" +
				" inner join factory_product as p on ap.factoryProductNo=p.factoryProductNo" +
				" where p.setNo='$1' and ap.factoryCompId=$2 and ap.agencyGroupId=$3" +
				" limit $4, $5",
				[$set_no, $factory_comp_id, $group_id, $start, $pagesize]
			);
			$factory_product_ids = _.size($factory_product_ids) && _.size($factory_product_ids.rows) && $factory_product_ids.rows || [];
			let $tmp = []
			_.each($factory_product_ids, function($fpi_row) {
				$tmp.push($fpi_row.factoryProductNo);
			});
			$factory_product_ids = $tmp;
		} else */{
			$n_product_rows = await FactoryAgencyGroupProduct.count({
				factoryCompId: $factory_comp_id,
				agencyGroupId: $group_id
			});
			if(!$n_product_rows) return res.jsonok({list: [], total: 0});

			$factory_product_ids = await FactoryAgencyGroupProduct.find({
				where: {
					factoryCompId: $factory_comp_id,
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


};

