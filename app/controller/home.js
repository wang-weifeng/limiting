'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const uid = ctx.query.uid;
    const uidInfo = 'bucket:uid:' + uid
    const getLimit = await ctx.service.home.getLimitInfos(uidInfo);
    ctx.body = {
      data:{
        data:getLimit
      }
    };
  }
}

module.exports = HomeController;
