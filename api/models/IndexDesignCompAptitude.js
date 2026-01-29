
module.exports = {
    tableName: 'index_design_comp_aptitude',
    attributes: {
		id: {
			columnName: 'compId',
            type: 'number',
            columnType: 'int(11)',
            description: '',
            required: true
        },

		regDate: {
            type: 'number',
            description: '',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        nEmployee: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        range: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        nCase: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        nPrize: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        createdAt: false,
        updatedAt: false
    },
};

