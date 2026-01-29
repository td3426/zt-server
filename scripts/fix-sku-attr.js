const moment = require('moment');

module.exports = {
    friendlyName: 'fix-sku-attr',
    description: '',
    inputs: {},
    fn: async function (inputs, exits) {

		let $cat_attr_rows = await sails.getDatastore().sendNativeQuery(
			"select fcat, fid, fname from t_cat_attr"
		);
		$cat_attr_rows = $cat_attr_rows.rows;
		let $cat_attr_set_rows = cutil.indexTabByCol($cat_attr_rows, 'fcat', 'fid');
		$cat_attr_rows = cutil.indexTabByCol($cat_attr_rows, 'fid');


		let $cat_attr_val_rows = await sails.getDatastore().sendNativeQuery(
			"select fcat_attr, fid, fvalue from t_cat_attr_item where fvalue='其它' group by fcat_attr"
		);
		$cat_attr_val_rows = $cat_attr_val_rows.rows;
		$cat_attr_val_rows = cutil.indexTabByCol($cat_attr_val_rows, 'fcat_attr');


		//删除nameNo为空的属性记录
		await sails.getDatastore().sendNativeQuery(
			"delete from factory_product_sku_attr where nameNo is null or nameNo=''"
		);

		//修复valueNo为空的属性记录
		let $empty_value_no_rows = await FactoryProductSkuAttr.find({
			valueNo: ''
		});
		let $ret_spu_id_arr = cutil.getTabCol($empty_value_no_rows, 'factoryProductNo');
		await sails.getDatastore().sendNativeQuery(
			"update factory_product_sku_attr as sku_attr left join (select fcat_attr, fid, fvalue from t_cat_attr_item where fvalue='其它' group by fcat_attr) as cat_attr on sku_attr.nameNo=cat_attr.fcat_attr set sku_attr.valueNo = cat_attr.fid, sku_attr.attrValue = cat_attr.fvalue where (sku_attr.valueNo = '' or sku_attr.valueNo is null)"
		);

		//这里不处理，允许只有材质颜色，没有其他属性
		//保障SKU在factory_product_sku_attr里面至少存在一条记录
		//let $empty_sku_attr_rows = await sails.getDatastore().sendNativeQuery(
		//	"select spu.catId, sku.skuNo, sku.factoryCompId, sku.factoryProductNo from factory_product_sku as sku left join factory_product_sku_attr as sku_attr on sku.skuNo=sku_attr.skuNo left join factory_product as spu on sku.factoryProductNo=spu.factoryProductNo where sku_attr.id is null"
		//);
		//$empty_sku_attr_rows = $empty_sku_attr_rows && $empty_sku_attr_rows.rows || [];
		//for(let $idx_empty_sku_attr_rows in $empty_sku_attr_rows) {
		//	let $empty_sku_attr_row = $empty_sku_attr_rows[$idx_empty_sku_attr_rows];
		//	let $cat_attr_cat_rows = _.values($cat_attr_set_rows[$empty_sku_attr_row.catId]);
		//	if(!_.size($cat_attr_cat_rows)) continue;

		//	let $name_no            = $cat_attr_cat_rows[0].fid;
		//	let $attr_name          = $cat_attr_cat_rows[0].fname;
		//	let $attr_val_no        = $cat_attr_val_rows[$name_no].fid;
		//	let $attr_val           = $cat_attr_val_rows[$name_no].fvalue;
		//	await FactoryProductSkuAttr.create({
		//		skuNo            : $empty_sku_attr_row.skuNo,
		//		factoryCompId    : $empty_sku_attr_row.factoryCompId,
		//		factoryProductNo : $empty_sku_attr_row.factoryProductNo,
		//		nameNo           : $name_no,
		//		attrName         : $attr_name,
		//		valueNo          : $attr_val_no,
		//		attrValue        : $attr_val
		//	});
		//}

		let $spu_rows = await FactoryProduct.find({
			select: ['id', 'catId', 'factoryCompId']
		});
		$spu_rows = cutil.indexTabByCol($spu_rows, 'id');


		for(let $idx_spu_rows in $spu_rows) {
			let $spu_row = $spu_rows[$idx_spu_rows];

			let $sku_attr_rows = await FactoryProductSkuAttr.find({
				factoryProductNo: $spu_row.id
			});
			$sku_attr_indexed_rows = cutil.indexTabByCol($sku_attr_rows, 'skuNo', 'id');

			let $sku_ids = await FactoryProductSku.find({
				where: {
					factoryProductNo: $spu_row.id
				},
				select: ["id"]
			});
			$sku_ids = _.size($sku_ids) && cutil.getTabCol($sku_ids, 'id') || {};


			let $sku_attr_max_set = {};
			let $cur_cat_attr_rows = _.size($cat_attr_set_rows[$spu_row.catId]) ? $cat_attr_set_rows[$spu_row.catId] : {};
			for(let $idx_sku_attr_rows in $sku_attr_rows) {
				let $sku_attr_row = $sku_attr_rows[$idx_sku_attr_rows];				
				if(!_.size($cur_cat_attr_rows[$sku_attr_row.nameNo])) continue;

				$sku_attr_max_set[$sku_attr_row.nameNo] = $sku_attr_row.nameNo;
			}


			//新增其他选项
			let $db_add_set = [];
			for(let $idx_sku_ids in $sku_ids) {
				let $cur_sku_id = $sku_ids[$idx_sku_ids];
				let $cur_sku_attr_rows = $sku_attr_indexed_rows[$cur_sku_id];
				let $cur_sku_attr_ids  = _.size($cur_sku_attr_rows) ? cutil.getTabCol($cur_sku_attr_rows, 'nameNo') : {};
				let $need_add_set      = _.difference(_.values($sku_attr_max_set), _.values($cur_sku_attr_ids));
				_.each($need_add_set, function($need_add_set_id) {
					let $attr_name   = $cat_attr_rows[$need_add_set_id] ? $cat_attr_rows[$need_add_set_id].fname : '';
					let $attr_val_no = $cat_attr_val_rows[$need_add_set_id] ? $cat_attr_val_rows[$need_add_set_id].fid : '';
					let $attr_val    = $cat_attr_val_rows[$need_add_set_id] ? $cat_attr_val_rows[$need_add_set_id].fvalue : '';

					if(
						!_.size($attr_name) || 
						!_.size($attr_val_no) || 
						!_.size($attr_val)
					) {
						throw new Exception('attrName: ' + $attr_name + '  attr_val_no: ' + $attr_val_no + '  attr_val: ' + $attr_val);
						return true;
					}

					$db_add_set.push({
						skuNo            : $cur_sku_id,
						factoryCompId    : $spu_row.factoryCompId,
						factoryProductNo : $spu_row.id,
						nameNo           : $need_add_set_id,
						attrName         : $attr_name,
						valueNo          : $attr_val_no,
						attrValue        : $attr_val
					});
					$ret_spu_id_arr[$spu_row.id] = $spu_row.id;
					sails.log('新增');
				});
			}

			if(_.size($db_add_set)) await FactoryProductSkuAttr.createEach($db_add_set);

			if(
				!$ret_spu_id_arr[$spu_row.id] &&
				await FactoryProductSkuAttr.count({
					factoryProductNo: $spu_row.id,
					nameNo: {
						'!=': _.values($sku_attr_max_set)
					}
				})
			) {
				sails.log('删除');
				$ret_spu_id_arr[$spu_row.id] = $spu_row.id;
			}

			//属性在当前分类下不存在，需要删除
			await FactoryProductSkuAttr.destroy({
				factoryProductNo: $spu_row.id,
				nameNo: {
					'!=': _.values($sku_attr_max_set)
				}
			});

		}

		sails.log(JSON.stringify(_.values($ret_spu_id_arr)));

        return exits.success();
    }
};

