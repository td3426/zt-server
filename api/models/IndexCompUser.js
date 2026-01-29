
module.exports = {
    tableName: 'index_comp_user',

    attributes: {

        id: {
            columnName: 'userId',
            type: 'number',
            columnType: 'int(11)',
            required: true
        },

        compId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        deptId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        roleId: {
            type: 'number',
            defaultsTo: 0,
            columnType: 'int(11)',
        },

        mobile: {
            type: 'string',
            maxLength: 20,
            defaultsTo: ''
        },

        mail: {
            type: 'string',
            maxLength: 255,
            defaultsTo: ''
        },

        userName: {
            type: 'string',
            maxLength: 255,
            defaultsTo: ''
        },

        deptName: {
            type: 'string',
            maxLength: 255,
            defaultsTo: ''
        },

        roleName: {
            type: 'string',
            maxLength: 255,
            defaultsTo: ''
        },

        createdAt: false,
        updatedAt: false
    },
};

