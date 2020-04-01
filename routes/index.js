const router = require('koa-router')()
const multiparty = require('multiparty');
const fs = require('fs')
const path = require('path')

const md5FilePath = path.join('service/files/md5.json')

const uploadMap = {}//上传对象 stream 映射 
let md5Json = {} //断点续传 查看已上传数量 current chunk

router.get('/', async (ctx, next) => {
  await ctx.render('index.html')
})

router.post('/fileCheck', (ctx, next) => {
  const form = new multiparty.Form();
  createFile(md5FilePath)
  let md5Arr = ''
  try {
    md5Json = JSON.parse(fs.readFileSync(md5FilePath, 'utf8') || '{}')
    md5Arr = Object.keys(md5Json)
  } catch (error) {
    console.log(md5Json);
    console.log(fs.readFileSync(md5FilePath, 'utf8'));
  }

  return new Promise(reolve => {
    form.parse(ctx.req, function (err, fields, files) {
      if (err) { throw err; return; }
      const md5 = fields['md5'][0]
      const chunkNum = fields['chunkNum'][0]

      let status = 200
      //检验 MD5 与 已上传数量 current chunk
      if (!(md5Arr.indexOf(`${md5}`) > -1)) {
        status = 201
        md5Json = {
          ...md5Json,
          [md5]: []
        }
        fs.writeFileSync(md5FilePath, JSON.stringify(md5Json))
      } else if (md5Json[md5].length !== Number(chunkNum)) {
        status = 201
      }
      // const statusArr = [200,200,201]
      // const random=Math.ceil(Math.random()*status.length-1)
      //  status = status[random]

      ctx.body = {
        status
      }
      reolve()
    });
  })
})

router.post('/fileUpload', async (ctx, next) => {
  const form = new multiparty.Form();
  await new Promise((resolve, reject) => {
    const status = 200
    // const statusArr = [200,200,201]
    // const random=Math.ceil(Math.random()*status.length-1)
    // const status = status[random]
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
      /**
       * 现断点续传 文件会损坏
       * 实际需要保存current对应的 chunk createReadStream 后合并
       */
      if (md5Json[md5].indexOf(current) > -1) {
        ctx.body = {
          status
        }
        resolve()
        return
      }

      md5Json[md5].push(current)
      fs.writeFile(md5FilePath, JSON.stringify(md5Json), (e) => {
        if (e) throw e
      })

      const getFile = fs.createReadStream(file.path);
      getFile.pipe(uploadMap[md5]['createWriteStream'], { end: false })
      getFile.on('end', function (chunk) {
        setTimeout(() => {
          ctx.body = {
            status
          }
          resolve()
        }, 500);
      });
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
