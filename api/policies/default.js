module.exports = async function(req, res, proceed) {

    return res.jsonerr('没有权限');
    // return proceed();

};