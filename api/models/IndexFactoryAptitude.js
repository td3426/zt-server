
module.exports = {
    tableName: 'index_factory_aptitude',
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

		zoneId: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        nEmployee: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

		realCheckStat: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        jgsx: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        mczl: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        zdcp: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

		abilityMake: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        createdAt: false,
        updatedAt: false
    },
};

