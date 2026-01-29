
module.exports = {
    tableName: 'st_company_contact_visited',
    attributes: {
        compId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

		whichChannel : {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)'
        },

        dayAt: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'bigint(20)',
        },

        cnt: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'bigint(20)',
        },

		createdAt: false,
		updatedAt: false
    },
};

