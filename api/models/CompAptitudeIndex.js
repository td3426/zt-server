
module.exports = {
    tableName: 'comp_aptitude_index',
    attributes: {

		id: {
			columnName: 'compId',
            type: 'number',
            columnType: 'int(11)',
            description: '',
            required: true
        },

        compType: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        aptitude_reg_date: {
            type: 'number',
            description: '',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        aptitude_n_employee: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        aptitude_n_onsale: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        gc_aptitude_real_check_stat: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

		gc_aptitude_zone: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        sj_aptitude_n_case: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },

        sj_aptitude_n_prize: {
            type: 'number',
            description: '',
            defaultsTo: 0,
            columnType: 'int(11)',
            example: '0'
        },


        gc_aptitude_jgsx: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        gc_aptitude_mczl: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        gc_aptitude_zdcp: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        gc_aptitude_ability_make: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        sj_aptitude_range: {
            type: 'string',
            description: '',
			allowNull: true,
            example: 'xxx'
        },

        createdAt: false,
        updatedAt: false
    },
};

