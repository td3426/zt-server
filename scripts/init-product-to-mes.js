
module.exports = {
    friendlyName: 'init-product-to-mes',
    description: '',
    inputs: {},
    fn: async function (inputs, exits) {

		$product_rows = await FactoryProduct.find({
			select: ['id']
		});
		$product_ids = cutil.getTabCol($product_rows, 'id');

		for(var $product_id in $product_ids) {
			//sails.log($product_id);
			await FactoryProduct.addSpuToMes($product_id);
			let $sku_rows = await FactoryProductSku.find({
				factoryProductNo: $product_id
			});
			let $sku_ids = cutil.getTabCol($sku_rows, 'id');
			$sku_ids = $sku_ids && _.size($sku_ids) && _.values($sku_ids) || [];
			if(_.size($sku_ids)) {
				//sails.log('sku:', $sku_ids);
				await FactoryProduct.addSkuToMes($sku_ids, $product_id);
			}
		}

		return exits.success();
    }
};

