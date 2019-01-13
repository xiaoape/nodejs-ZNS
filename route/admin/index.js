const express=require('express');
const common=require('../../libs/common');

module.exports=function (){
  var router=express.Router();

  //检查登录状态
  router.use((req, res, next)=>{
    if(!req.session['admin_id'] && req.url!='/login'){ //没有登录
      res.redirect('/admin/login');
    }else{
      next();
    }
  });
//在server.js中已经进行了路由管理，到这里来的都是localhost:8080/admin下，所以这里的'/'其实指的是'/admin'
//最开始访问/admin,检查的是未登录状态，所以被重定向到/login,在login.js中如果验证通过的话，注册session的ID，
//这个时候会再次重定向到'/admin',再次验证sessionID,这时候通过了，然后就渲染index.ejs了
//疑问：这里为什么先检查session?
  router.get('/', (req, res)=>{
    //server.js里面设置了模板文件放在template文件夹，所以这里不用写
    res.render('admin/index.ejs', {});
  });

  router.use('/login', require('./login')());
  router.use('/banners', require('./banners')());
  router.use('/custom', require('./custom')());

  return router;
};
