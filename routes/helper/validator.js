/**
 * Created by root on 6/17/16.
 */
exports.isMissing = function(str) {
    return (!str || ('' + str).trim().length === 0);
};

exports.isEmail = function(str) {
    return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(str);
};

exports.isJSON = function (string){
    try{
        JSON.parse(string);
    }catch(e){
        return false;
    }
    return true;
}