
const moment = require('moment');

//检查工厂分成合作到期factory_product
async function check_factory_percent_product_expired() {
	const $tm = moment().valueOf();
	sails.log(`check_percent_product_expired start`);

	let $rows = await sails.getDatastore().sendNativeQuery(
		"select factoryProductNo from factory_product" +
		" where priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE + 
		" and expireAt <= " + $tm + 
		" and stat != " + CONST.PRODUCT_STAT_EXPIRED +
		" limit 20"
	);
	$rows = _.size($rows) && $rows.rows || [];
	$rows = _.size($rows) && cutil.getTabCol($rows, 'factoryProductNo') || {};
	$rows = _.size($rows) && Object.keys($rows) || [];

	if(_.size($rows)) {
		await sails.getDatastore().sendNativeQuery(
			"update factory_product" +
			" set stat=" + CONST.PRODUCT_STAT_EXPIRED + "," +
			" banAt=" + $tm + "," +
			" marketPublish=" + CONST.PRODUCT_MARMET_STAT_BAND + "," +
			" marketBanAt=" + $tm + "," +
			" salebookPublish=" + CONST.PRODUCT_HANDBOOK_STAT_BAND + "," +
			" salebookBanAt=" + $tm +
			" where factoryProductNo in ('" + $rows.join("', '") + "')"
		);
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_percent_product_expired end - ${$tm_diff} ms`);
}

//检查设计公司分成合作商品当前合作数量design_product
async function check_design_product_n_cooperated() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_design_product_n_cooperated start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select designProductNo, count(1) as cnt from factory_product" + 
			" where factoryParentProductNo='-' and priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE + " and stat=" + CONST.PRODUCT_STAT_INUSE +
			" group by designProductNo" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'designProductNo') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select designProductNo, nCooperated from design_product where designProductNo in('" + $ids.join("', '") + "')"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n_cooperated = parseInt($rows[$check_row.designProductNo].cnt);
			if(
				_.size($rows[$check_row.designProductNo]) && 
				$n_cooperated != parseInt($check_row.nCooperated)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update design_product set nCooperated=" + $n_cooperated + " where designProductNo='" + $check_row.designProductNo + "'"
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_design_product_n_cooperated end - ${$tm_diff} ms`);

	//await sails.getDatastore().sendNativeQuery(
	//	"update design_product as dp left join (" +
	//	"	select designProductNo, count(1) as cnt from factory_product as fp " + 
	//	"	where priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE + " and stat=" + CONST.PRODUCT_STAT_INUSE +
	//	"	group by designProductNo" +
	//	") as fp on fp.designProductNo=dp.designProductNo" +
	//	" set nCooperated=IFNULL(fp.cnt, 0)" +
	//	" where priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE
	//);
}

//检查工厂商品sku数量factory_product
async function check_factory_product_n_sku() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_factory_product_n_sku start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select factoryProductNo, count(1) as cnt from factory_product_sku" +
			" where stat=" + CONST.PRODUCT_SKU_STAT_ENABLED +
			" group by factoryProductNo" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'factoryProductNo') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select factoryProductNo, skuCount from factory_product where factoryProductNo in('" + $ids.join("', '") + "')"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n_sku = parseInt($rows[$check_row.factoryProductNo].cnt);
			if(
				_.size($rows[$check_row.factoryProductNo]) && 
				$n_sku != parseInt($check_row.skuCount)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update factory_product set skuCount=" + $n_sku + " where factoryProductNo='" + $check_row.factoryProductNo + "'"
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_factory_product_n_sku end - ${$tm_diff} ms`);


	//await sails.getDatastore().sendNativeQuery("update factory_product as pd inner join (" +
	//	"	select factoryProductNo, count(1) as cnt from factory_product_sku " + 
	//	"	where stat=" + CONST.PRODUCT_SKU_STAT_ENABLED + 
	//	"	group by factoryProductNo" +
	//	") as b on b.factoryProductNo=pd.factoryProductNo" +
	//	" set pd.skuCount=IFNULL(b.cnt, 0)" +
	//	" where pd.factoryParentProductNo='-'"
	//);
}

//检查工厂商品起始价格factory_product
async function check_factory_product_start_price() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_factory_product_start_price start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select a.factoryProductNo, min(a.price) as price from factory_product_step_price a " +
			" inner join factory_product_sku b " +
			" on a.skuNo=b.skuNo" +
			" where b.stat=" + CONST.PRODUCT_SKU_STAT_ENABLED +
			" group by a.factoryProductNo" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'factoryProductNo') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select factoryProductNo, startPrice from factory_product where factoryProductNo in('" + $ids.join("', '") + "')"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n_start = parseInt($rows[$check_row.factoryProductNo].price);
			if(
				_.size($rows[$check_row.factoryProductNo]) && 
				$n_start != parseInt($check_row.startPrice)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update factory_product set startPrice=" + $n_start + " where factoryProductNo='" + $check_row.factoryProductNo + "'"
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_factory_product_start_price end - ${$tm_diff} ms`);

	//await sails.getDatastore().sendNativeQuery("update factory_product as pd inner join (" +
	//	"	select a.factoryProductNo, min(a.price) as price from factory_product_step_price a " +
	//	"	inner join factory_product_sku b " +
	//	"	on a.skuNo=b.skuNo" +
	//	"	where b.stat=" + CONST.PRODUCT_SKU_STAT_ENABLED +
	//	"	group by factoryProductNo" +
	//	") as b on b.factoryProductNo=pd.factoryProductNo " +
	//	" set pd.startPrice=IFNULL(b.price, 0)" +
	//	" where pd.factoryParentProductNo='-'"
	//);
}

//检查设计公司商品起始价格design_product
async function check_design_product_start_price() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_design_product_start_price start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select designProductNo, min(startPrice) as price from factory_product" +
			" where designProductNo is not null and designProductNo!='' and stat=" + CONST.PRODUCT_STAT_PUBLISHED +
			" group by designProductNo" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'designProductNo') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select designProductNo, startPrice from design_product where designProductNo in('" + $ids.join("', '") + "')"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n_start = parseInt($rows[$check_row.designProductNo].price);
			if(
				_.size($rows[$check_row.designProductNo]) && 
				$n_start != parseInt($check_row.startPrice)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update design_product set startPrice=" + $n_start + " where designProductNo='" + $check_row.designProductNo + "'"
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_design_product_start_price end - ${$tm_diff} ms`);


	//await sails.getDatastore().sendNativeQuery("update design_product as dpd inner join (" +
	//	"	select designProductNo, min(startPrice) as startPrice from factory_product " +
	//	"	where designProductNo is not null and designProductNo!='' and stat=" + CONST.PRODUCT_STAT_PUBLISHED +
	//	"	group by designProductNo " +
	//	" ) as b on b.designProductNo=dpd.designProductNo" +
	//	" set dpd.startPrice=b.startPrice" +
	//	" where dpd.designParentProductNo='-'"
	//);
}


//检查工厂集市在售商品数量company
async function check_factory_product_n_market() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_factory_product_n_market start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select factoryCompId, count(1) as cnt from factory_product" +
			" where factoryParentProductNo='-' and marketPublish=" + CONST.PRODUCT_MARMET_STAT_PUBLISHED +
			" group by factoryCompId" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'factoryCompId') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select id, nOnsaleMarketProduct from company where id in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.id].cnt);
			if(
				_.size($rows[$check_row.id]) && 
				$n != parseInt($check_row.nOnsaleMarketProduct)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update company set nOnsaleMarketProduct=" + $n + " where id=" + $check_row.id
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_factory_product_n_market end - ${$tm_diff} ms`);

	
	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update company as comp " +
	//	" left join (" +
	//	"	select pd.factoryCompId, count(1) as cnt from factory_product as pd " +
	//	"	where pd.factoryParentProductNo='-' and pd.marketPublish=" + CONST.PRODUCT_MARMET_STAT_PUBLISHED + 
	//	"	group by pd.factoryCompId" +
	//	" ) as pd on pd.factoryCompId=comp.id" +
	//	" set comp.nOnsaleMarketProduct=ifnull(pd.cnt,0)" +
	//	" where comp.compType=" + CONST.COMPONY_TYPE_FURNITURE_FACTORY + " and certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS
	//);
}

//检查公司销售手册在售商品数量company
async function check_factory_product_n_salebook() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_factory_product_n_salebook start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select factoryCompId, count(1) as cnt from factory_product" +
			" where factoryParentProductNo='-' and salebookPublish=" + CONST.PRODUCT_MARMET_STAT_PUBLISHED +
			" group by factoryCompId" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'factoryCompId') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select id, nOnsaleSalebookProduct from company where id in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.id].cnt);
			if(
				_.size($rows[$check_row.id]) && 
				$n != parseInt($check_row.nOnsaleSalebookProduct)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update company set nOnsaleSalebookProduct=" + $n + " where id=" + $check_row.id
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_factory_product_n_salebook end - ${$tm_diff} ms`);

	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update company as comp " +
	//	" left join (" +
	//	"	select pd.factoryCompId, count(1) as cnt from factory_product as pd " +
	//	"	where pd.factoryParentProductNo='-' and pd.salebookPublish=" + CONST.PRODUCT_MARMET_STAT_PUBLISHED + 
	//	"	group by pd.factoryCompId" +
	//	" ) as pd on pd.factoryCompId=comp.id" +
	//	" set comp.nOnsaleSalebookProduct=ifnull(pd.cnt,0)" +
	//	" where comp.compType=" + CONST.COMPONY_TYPE_FURNITURE_FACTORY + " and certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS
	//);
}

//检查工厂在售商品总数company
//检查工厂资质索引在售商品总数comp_aptitude_index
async function check_factory_product_n_all() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_factory_product_n_all start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select factoryCompId, count(1) as cnt from factory_product" +
			" where factoryParentProductNo='-' and stat=" + CONST.PRODUCT_MARMET_STAT_PUBLISHED +
			" group by factoryCompId" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'factoryCompId') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select id, nOnsale from company where id in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.id].cnt);
			if(
				_.size($rows[$check_row.id]) && 
				$n != parseInt($check_row.nOnsale)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update company set nOnsale=" + $n + " where id=" + $check_row.id
				);
			}
		}

		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select compId, aptitude_n_onsale from comp_aptitude_index where compId in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.compId].cnt);
			if(
				_.size($rows[$check_row.compId]) && 
				$n != parseInt($check_row.aptitude_n_onsale)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update comp_aptitude_index set aptitude_n_onsale=" + $n + " where compId=" + $check_row.compId
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_factory_product_n_all end - ${$tm_diff} ms`);

	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update company as comp " +
	//	" left join (" +
	//	"	select pd.factoryCompId, count(1) as cnt from factory_product as pd " +
	//	"	where pd.factoryParentProductNo='-' and pd.stat=" + CONST.PRODUCT_STAT_PUBLISHED + 
	//	"	group by pd.factoryCompId" +
	//	" ) as pd on pd.factoryCompId=comp.id" +
	//	" set comp.nOnsale=ifnull(pd.cnt,0)" +
	//	" where comp.compType=" + CONST.COMPONY_TYPE_FURNITURE_FACTORY + " and certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS
	//);
	
	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update comp_aptitude_index as idx " +
	//	" left join (" +
	//	"	select pd.factoryCompId, count(1) as cnt from factory_product as pd " +
	//	"	where pd.factoryParentProductNo='-' and pd.stat=" + CONST.PRODUCT_STAT_PUBLISHED + 
	//	"	group by pd.factoryCompId" +
	//	" ) as pd on pd.factoryCompId=idx.compId" +
	//	" set idx.aptitude_n_onsale=ifnull(pd.cnt,0)" +
	//	" where idx.compType=" + CONST.COMPONY_TYPE_FURNITURE_FACTORY
	//);
}


//检查设计公司版权商品在售数量company
async function check_design_product_n_copy() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_design_product_n_copy start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select createdByCompId, count(1) as cnt from design_product" +
			" where stat=" + CONST.PRODUCT_STAT_PUBLISHED +  " and priceType=" + CONST.PRODUCT_PRICE_TYPE_PRICE +
			" group by createdByCompId" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'createdByCompId') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select id, nProductCopyRight from company where id in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.id].cnt);
			if(
				_.size($rows[$check_row.id]) && 
				$n != parseInt($check_row.nProductCopyRight)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update company set nProductCopyRight=" + $n + " where id=" + $check_row.id
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_design_product_n_copy end - ${$tm_diff} ms`);

	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update company as comp " +
	//	" left join (" +
	//	"	select pd.createdByCompId, count(1) as cnt from design_product as pd " +
	//	"	where pd.stat=" + CONST.PRODUCT_STAT_PUBLISHED +  " and priceType=" + CONST.PRODUCT_PRICE_TYPE_PRICE +
	//	"	group by pd.createdByCompId" +
	//	" ) as pd on pd.createdByCompId=comp.id" +
	//	" set comp.nProductCopyRight=ifnull(pd.cnt,0)" +
	//	" where comp.compType=" + CONST.COMPONY_TYPE_FURNITURE_DESIGNER + " and certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS
	//);
}

//检查设计公司分成合作商品在售数量company
async function check_design_product_n_percent() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_design_product_n_percent start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select createdByCompId, count(1) as cnt from design_product" +
			" where stat=" + CONST.PRODUCT_STAT_PUBLISHED +  " and priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE +
			" group by createdByCompId" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'createdByCompId') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select id, nProductPercent from company where id in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.id].cnt);
			if(
				_.size($rows[$check_row.id]) && 
				$n != parseInt($check_row.nProductPercent)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update company set nProductPercent=" + $n + " where id=" + $check_row.id
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_design_product_n_percent end - ${$tm_diff} ms`);

	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update company as comp " +
	//	" left join (" +
	//	"	select pd.createdByCompId, count(1) as cnt from design_product as pd " +
	//	"	where pd.stat=" + CONST.PRODUCT_STAT_PUBLISHED +  " and priceType=" + CONST.PRODUCT_PRICE_TYPE_PERCENT_PRICE +
	//	"	group by pd.createdByCompId" +
	//	" ) as pd on pd.createdByCompId=comp.id" +
	//	" set comp.nProductPercent=ifnull(pd.cnt,0)" +
	//	" where comp.compType=" + CONST.COMPONY_TYPE_FURNITURE_DESIGNER + " and certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS
	//);
}

//检查设计公司在售商品总数company
//检查设计公司资质索引在售商品总数comp_aptitude_index
async function check_design_product_n_all() {
	const $tm = moment().valueOf();
	let $start = 0;
	let $ids = [];
	let $check_rows = [];
	let $rows = [];

	sails.log(`check_design_product_n_all start`);
	while(true) {
		$rows = await sails.getDatastore().sendNativeQuery(
			"select createdByCompId, count(1) as cnt from design_product" +
			" where stat=" + CONST.PRODUCT_STAT_PUBLISHED +
			" group by createdByCompId" +
			" limit " + $start + ", 20"
		);
		$rows = _.size($rows) && $rows.rows || [];
		$rows = _.size($rows) && cutil.indexTabByCol($rows, 'createdByCompId') || {};
		if(!_.size($rows)) break;

		$ids = _.size($rows) && Object.keys($rows) || [];
		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select id, nOnsale from company where id in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.id].cnt);
			if(
				_.size($rows[$check_row.id]) && 
				$n != parseInt($check_row.nOnsale)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update company set nOnsale=" + $n + " where id=" + $check_row.id
				);
			}
		}

		$check_rows = await sails.getDatastore().sendNativeQuery(
			"select compId, aptitude_n_onsale from comp_aptitude_index where compId in(" + $ids.join(", ") + ")"
		);
		$check_rows = _.size($check_rows) && $check_rows.rows || [];
		for(const $check_row of $check_rows) {
			const $n = parseInt($rows[$check_row.compId].cnt);
			if(
				_.size($rows[$check_row.compId]) && 
				$n != parseInt($check_row.aptitude_n_onsale)
			) {
				await sails.getDatastore().sendNativeQuery(
					"update comp_aptitude_index set aptitude_n_onsale=" + $n + " where compId=" + $check_row.compId
				);
			}
		}

		$start += 20;
	}

	const $tm_diff = moment().valueOf() - $tm;
	sails.log(`check_design_product_n_all end - ${$tm_diff} ms`);

	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update company as comp " +
	//	" left join (" +
	//	"	select pd.createdByCompId, count(1) as cnt from design_product as pd " +
	//	"	where pd.stat=" + CONST.PRODUCT_STAT_PUBLISHED + 
	//	"	group by pd.createdByCompId" +
	//	" ) as pd on pd.createdByCompId=comp.id" +
	//	" set comp.nOnsale=ifnull(pd.cnt,0)" +
	//	" where comp.compType=" + CONST.COMPONY_TYPE_FURNITURE_DESIGNER + " and certStat=" + CONST.CERTIFYCATION_STAT_SUCCESS
	//);
	
	//await sails.getDatastore('factory').sendNativeQuery(
	//	"update comp_aptitude_index as idx " +
	//	" left join (" +
	//	"	select pd.createdByCompId, count(1) as cnt from design_product as pd " +
	//	"	where pd.stat=" + CONST.PRODUCT_STAT_PUBLISHED + 
	//	"	group by pd.createdByCompId" +
	//	" ) as pd on pd.createdByCompId=idx.compId" +
	//	" set idx.aptitude_n_onsale=ifnull(pd.cnt,0)" +
	//	" where idx.compType=" + CONST.COMPONY_TYPE_FURNITURE_DESIGNER
	//);
}


module.exports = {
	friendlyName: 'loop-check',
	description: '',
	inputs: {},

	fn: async function (inputs, exits) {
		sails.log('loop-check for data stat and statistics');

		let $tm = moment().valueOf();
		while(true) {
			try {
				sails.log('-------------- loop-check start --------------');
				$tm = moment().valueOf();
				await check_factory_percent_product_expired();
				await check_factory_product_start_price();
				await check_factory_product_n_sku();
				await check_factory_product_n_market();
				await check_factory_product_n_salebook();
				await check_factory_product_n_all();

				await check_design_product_n_cooperated();
				await check_design_product_start_price();
				await check_design_product_n_copy();
				await check_design_product_n_percent();
				await check_design_product_n_all();
				$tm = moment().valueOf() - $tm;
				sails.log(`-------------- loop-check end - ${$tm} ms --------------`);
			} catch($e) {
				sails.log.error($e);
			}

			await cutil.msleep(1000 * 30);
		}

		return exits.success();
	}
};
