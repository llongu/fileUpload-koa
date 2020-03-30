const router = require('koa-router')()
const multiparty = require('multiparty');
const fs = require('fs')
const path = require('path')

const md5FilePath = path.join('service/files/md5.json')

router.get('/', async (ctx, next) => {
  await ctx.render('index.html')
})

router.post('/fileCheck', (ctx, next) => {
  const form = new multiparty.Form();
  createFile(md5FilePath)
  let md5Obj = fs.readFileSync(md5FilePath, 'utf8') || '{}'
  md5Obj = JSON.parse(md5Obj)
  const md5Arr = Object.keys(md5Obj)

  return new Promise(reolve => {
    form.parse(ctx.req, function (err, fields, files) {
      if (err) { throw err; return; }
      const md5 = fields['md5'][0]
      const chunkNum = fields['chunkNum'][0]
      let status = 200
      //检验 MD5 与 已上传数量
      if (!(md5Arr.indexOf(`${md5}`) > -1)) {
        status = 201
        md5Obj = {
          ...md5Obj,
          [md5]: []
        }
        fs.writeFileSync(md5FilePath, JSON.stringify(md5Obj))
      } else if (md5Obj[md5].length !== chunkNum) {//断点续传
        status = 201
      }

      ctx.body = {
        status
      }
      reolve()
    });
  })
})

const uploadMap = {
  // [fileName]:{
  // createWriteStream,
  // current[]
  // }
}

router.post('/fileUpload', async (ctx, next) => {
  const form = new multiparty.Form();
  await new Promise((resolve, reject) => {
    const status = 200
    form.parse(ctx.req, async function (err, fields, files) {
      if (err) { throw err; return; }
      // console.log(fields);
      // console.log(files);
      const name = fields.name[0]
      const md5 = fields.md5[0]
      const file = files.file[0]
      const chunkNum = fields.chunkNum[0]
      const current = fields.current[0]

      if (current == 0) {
        uploadMap[md5] = {}
        uploadMap[md5]['createWriteStream'] = fs.createWriteStream(path.join('service/files/', name))
      }
      const getFile = fs.createReadStream(file.path);
      getFile.pipe(uploadMap[md5]['createWriteStream'], { end: false })
      getFile.on('data', function (chunk) {
        // console.log('图片保存成功');
        // fs.writeFileSync(md5FilePath, JSON.stringify(md5Obj2))
      });

      setTimeout(() => {
        ctx.body = {
          status
        }
        resolve()
      }, 500);
    });
  })
})

function createFile(path) {
  const result = fs.existsSync(path);
  if (!result) {
    fs.writeFileSync(path, `{}`)
  }
}


module.exports = router
