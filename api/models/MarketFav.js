
module.exports = {
    tableName: 'market_fav',
    attributes: {
        compId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

		userId: {
			type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        factoryProductNo: {
            type: 'string',
            maxLength: 255,
            defaultsTo: '',
        },

        priceType: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

    },
};

