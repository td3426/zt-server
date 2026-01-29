module.exports = {


    friendlyName: 'Cache Set',


    description: 'Cache something.',


    inputs: {
        k: {
            type: 'string',
            description: 'cache key',
            required: true,
            unique: true,
            maxLength: 255,
            example: 'test:key'
        },
        v: {
            type: 'string',
            description: 'cache value',
            required: true,
        }
    },


    exits: {

    },


    fn: async function (inputs, exits) {

        var $k = inputs.k;
        var $v = inputs.v;

        sails.getDatastore('cache').leaseConnection(function during(db, proceed) {
            db.set($k, $v, function (err, result){
                if (err) { return proceed(err); }

                return proceed(undefined, result);
            });
        }).exec(function (err, result){
            if (err) { return exits.error(err); }

            return exits.success(result);
        });
    }


};

