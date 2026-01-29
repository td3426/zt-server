
module.exports = {
    datastore: 'factory',
    tableName: 'factory_product_attr',

    attributes: {
        factoryCompId: {
            type: 'number',
            columnType: 'int(11)',
			defaultsTo: 0
        },


        factoryProductNo: {
            type: 'string',
            maxLength: 32,
            defaultsTo: ''
        },

        nameNo: {
            type: 'string',
            maxLength: 32,
            defaultsTo: ''
        },

        valueNo: {
            type: 'string',
            maxLength: 32,
            defaultsTo: ''
        },

		createdAt: false,
		updatedAt: false
    },
};

