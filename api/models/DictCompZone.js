
const uuidv4 = require('uuid/v4');
const flaverr = require('flaverr');

module.exports = {
    tableName: 'dict_comp_zone',
    attributes: {
       name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

		createdAt: false,
		updatedAt: false,
    },

};

