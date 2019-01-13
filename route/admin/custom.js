const express=require('express');
const common=require('../../libs/common');
const mysql=require('mysql');

var db=mysql.createPool({host: 'localhost', user: 'root', password: 'lp1435075638', database: 'learn'});

const pathLib=require('path');
const fs=require('fs');

module.exports=function (){
  var router=express.Router();

  router.get('/', function (req, res){
    switch(req.query.act){
      //删除已上传的文件
      case 'del':
        db.query(`SELECT * FROM custom_evaluation_table WHERE ID=${req.query.id}`, (err, data)=>{
          if(err){
            console.error(err);
            res.status(500).send('database error').end();
          }else{
            if(data.length==0){
              res.status(404).send('no this custom evaluation').end();
            }else{
              fs.unlink('static/upload/'+data[0].src, (err)=>{
                if(err){
                  console.error(err);
                  res.status(500).send('file opration error').end();
                }else{
                  db.query(`DELETE FROM custom_evaluation_table WHERE ID=${req.query.id}`, (err, data)=>{
                    if(err){
                      console.error(err);
                      res.status(500).send('database error').end();
                    }else{
                      res.redirect('/admin/custom');
                    }
                  });
                }
              });
            }
          }
        });
        break;
      case 'mod':
        db.query(`SELECT * FROM custom_evaluation_table WHERE ID=${req.query.id}`, (err, data)=>{
          if(err){
            console.error(err);
            res.status(500).send('database error').end();
          }else if(data.length==0){
            res.status(404).send('no this evaluation').end();
          }else{
            db.query(`SELECT * FROM custom_evaluation_table`, (err, evaluations)=>{
              if(err){
                console.error(err);
                req.status(500).send('database error').end();
              }else{
                res.render('admin/custom.ejs', {evaluations, mod_data: data[0]});
              }
            });
          }
        });
        break;
      default:
        db.query(`SELECT * FROM custom_evaluation_table`, (err, evaluations)=>{
          if(err){
            console.error(err);
            req.status(500).send('database error').end();
          }else{
            res.render('admin/custom.ejs', {evaluations});
          }
        });
    }
  });
  router.post('/', function (req, res){
    //这里有两个post，一个是上传新数据，另一个是修改数据。它们之间的区别修改数据需要传一个id参数
    var title=req.body.title;
    var description=req.body.description;
//files是multer加到req上面的属性，是一个数组，里面存着上传到服务器里文件的信息
//这里头像有可能没有改变，所以可能没有上传新的文件
    if(req.files[0]){
      //添加新的数据，修改是不需要进行重命名的
      //获取源文件的后缀名
      var ext=pathLib.parse(req.files[0].originalname).ext;
//olaPath是一个没有后缀名的文件
      var oldPath=req.files[0].path;
      var newPath=req.files[0].path+ext;

      var newFileName=req.files[0].filename+ext;
    }else{
      //修改数据，对应后面修改数据
      //如果需要上传的文件没有改变，所以这里置为null
      var newFileName=null;
    }
    //上传了新的数据，这里的newFileName为true
    if(newFileName){
      fs.rename(oldPath, newPath, (err)=>{
        if(err){
          console.error(err);
          res.status(500).send('file opration error').end();
        }else{
          //存在就是修改的post
          if(req.body.mod_id){  //修改。两次都是post提交到同一个页面，那么就用是否有id来区分
            //先删除老的
            db.query(`SELECT * FROM custom_evaluation_table WHERE ID=${req.body.mod_id}`, (err, data)=>{
              if(err){
                console.error(err);
                res.status(500).send('database error').end();
              }else if(data.length==0){
                res.status(404).send('old file not found').end();
              }else{
                fs.unlink('static/upload/'+data[0].src, (err)=>{
                  if(err){
                    console.error(err);
                    res.status(500).send('file opration error').end();
                  }else{
                    db.query(`UPDATE custom_evaluation_table SET \
                      title='${title}', description='${description}', \
                      src='${newFileName}' \
                      WHERE ID=${req.body.mod_id}`, (err)=>{
                        if(err){
                          console.error(err);
                          res.status(500).send('database error').end();
                        }else{
                          res.redirect('/admin/custom');
                        }
                      });
                  }
                });
              }
            });
          }else{                //不存在就是上传新的数据
            db.query(`INSERT INTO custom_evaluation_table \
            (title, description, src)
            VALUES('${title}', '${description}', '${newFileName}')`, (err, data)=>{
              if(err){
                console.error(err);
                res.status(500).send('database error').end();
              }else{
                res.redirect('/admin/custom');
              }
            });
          }
        }
      });
    }else{
      if(req.body.mod_id){  //是修改但是并没有上传新的数据所以就直接修改，不用删除服务器上的数据
        //直接改
        db.query(`UPDATE custom_evaluation_table SET \
          title='${title}', description='${description}' \
          WHERE ID=${req.body.mod_id}`, (err)=>{
            if(err){
              console.error(err);
              res.status(500).send('database error').end();
            }else{
              res.redirect('/admin/custom');
            }
          });
      }else{                //没有上传新的数据且不是修改，就是正常的添加
        db.query(`INSERT INTO custom_evaluation_table \
        (title, description, src)
        VALUES('${title}', '${description}', '${newFileName}')`, (err, data)=>{
          if(err){
            console.error(err);
            res.status(500).send('database error').end();
          }else{
            res.redirect('/admin/custom');
          }
        });
      }
    }
  });

  return router;
};
