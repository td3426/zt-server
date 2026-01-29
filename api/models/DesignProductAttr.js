
module.exports = {
    datastore: 'factory',
    tableName: 'design_product_attr',

    attributes: {
        designCompId: {
            type: 'number',
            columnType: 'int(11)',
			defaultsTo: 0
        },


        designProductNo: {
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

