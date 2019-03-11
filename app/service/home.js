'use strict';

const Service = require('egg').Service;

class HomeService extends Service {
    /*
     * 根据
     * @param {Array} names 用户名列表
     * @return {Promise[users]} 承载用户列表的 Promise 对象
     */
    async getLimitInfo(uidInfo) {
        this.app.redis.defineCommand('echoHmget', {
            numberOfKeys: 1,
            lua: "return redis.pcall('HMGET', KEYS[1], 'last_mill_second', 'curr_permits', 'max_permits', 'apps')"
        });
        this.app.redis.defineCommand('echoHset', {
            numberOfKeys: 1,
            lua: "return redis.pcall('HSET', KEYS[1], 'last_mill_second', ARGV[1],'curr_permits', ARGV[2])"
        });
        this.app.redis.defineCommand('echoHmset', {
            numberOfKeys: 1,
            lua: "return redis.pcall('HMSET', KEYS[1], 'last_mill_second',ARGV[1], 'curr_permits',ARGV[2], 'max_permits',ARGV[3], 'apps',ARGV[4])"
        });
        this.app.redis.defineCommand('echoExpire', {
            numberOfKeys: 1,
            lua: "return redis.pcall('EXPIRE',KEYS[1],ARGV[1] )"
        });
        this.logger.info('limitInfo uidInfo', uidInfo);
        const limitInfo = await this.app.redis.echoHmget(uidInfo);
        this.logger.info('limitInfo', limitInfo);
        let last_mill_second = limitInfo[0];
        let curr_permits = limitInfo[1];
        let max_permits = limitInfo[2];
        let apps = limitInfo[3];
        let curr_mill_second = Math.round(new Date().getTime() / 1000);
        if (last_mill_second) {
            if (apps === null || apps !== '10001') {
                return 0;
            }
            this.logger.info('last_mill_second', last_mill_second);
            let expect_curr_permits = 1 + Number(curr_permits);
            if (expect_curr_permits > max_permits) {
                return -1;
            }
            await this.app.redis.echoHset(uidInfo, curr_mill_second, expect_curr_permits);
            return 1;
        } else {
            this.logger.info('last_mill_second ok', uidInfo);
            await this.app.redis.echoHmset(uidInfo, curr_mill_second, 1, 5, 10001);
            //await this.app.redis.echoExpire(uidInfo, 20);
            return 1;
        }
    }

    /*
 * 根据
 * @param {Array} names 用户名列表
 * @return {Promise[users]} 承载用户列表的 Promise 对象
 */
    async getLimitInfos(uidInfo) {
        this.app.redis.defineCommand('echoRedis', {
            numberOfKeys: 1,
            lua: " local limitInfo = redis.pcall('HMGET', KEYS[1], 'last_mill_second', 'curr_permits', 'max_permits', 'apps')"
                + " local last_mill_second = limitInfo[1] "
                + " local curr_permits = tonumber(limitInfo[2]) "
                + " local max_permits = tonumber(limitInfo[3]) "
                + " local apps = tonumber(limitInfo[4]) "
                + " local curr_mill_second = '123456789' "
                // + "         return apps "
                + " if(last_mill_second ~= false) "
                + " then "
                + "     if((apps == false) or (apps ~= 10001)) "
                + "     then "
                + "         return 0 "
                + "     else "
                + "         local expect_curr_permits = 1 + curr_permits "
                + "         if(expect_curr_permits > max_permits) "
                + "         then "
                + "             return -1"
                + "         else "
                + "             redis.pcall('HSET', KEYS[1], 'last_mill_second', curr_mill_second,'curr_permits', expect_curr_permits) "
                + "             return 1 "
                + "         end"
                + "     end "
                + " else "
                + "     redis.pcall('HMSET', KEYS[1], 'last_mill_second',curr_mill_second, 'curr_permits',1, 'max_permits',5, 'apps',10001) "
                + "     redis.pcall('EXPIRE',KEYS[1],20)"
                + "     return 2 "
                + " end "
        });
        this.logger.info('limitInfo uidInfo', uidInfo);
        const limitResult = await this.app.redis.echoRedis(uidInfo);
        this.logger.info('limitResult', limitResult);
        return limitResult;
    }

}

module.exports = HomeService;
