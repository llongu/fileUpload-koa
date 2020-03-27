const router = require('koa-router')()
const multiparty = require('multiparty');
const fs = require('fs')


const imgSavePath = 'service/files/md5.txt'
let chunkNum = 0

router.get('/', async (ctx, next) => {
  await ctx.render('index.html')
})

router.post('/fileCheck', async (ctx, next) => {
  const form = new multiparty.Form();
  const md5s = await fs.readFileSync(imgSavePath, 'utf8')
  const md5sArr = md5s.split(',')

  return new Promise(reolve => {
    form.parse(ctx.req, function (err, fields, files) {
      if (err) { throw err; return; }
      const uploadMd5 = fields['md5'][0]
      chunkNum = fields['chunkNum'][0]
      let status = 200
      if (!(md5sArr.indexOf(uploadMd5) > -1)) {
        status = 201
        fs.appendFile(imgSavePath, `${uploadMd5},`, 'utf8', (e) => {
          if (e) { throw e; return; }
          console.log('md5已存储，开始上传' + uploadMd5);
        })
      }
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
    form.parse(ctx.req, function (err, fields, files) {
      if (err) { throw err; return; }
      // console.log(fields);//除文件外的其他附带信息
      // console.log(files);//文件信息
      const name = fields.name[0]
      const file = files.file[0]
      console.log(name);
      console.log(file);
      console.log(chunkNum);
      const writerStream = fs.createWriteStream(imgSavePath);
      var bu = fs.createReadStream(file.path);
      writerStream.pipe(bu)

      bu.on('data', function (chunk) {
        console.log(chunk.toString());//这是结果
      });

      setTimeout(() => {
        ctx.body = {
          status
        }
        resolve()
      }, 1000);
    });
  })
})
// 合并分片
function mergeChunks(fileName, chunks, callback) {
  console.log('chunks:' + chunks);
  let chunkPaths = chunks.map(function (name) {
    return path.join(imgSavePath, name)
  });

  // 采用Stream方式合并
  let targetStream = fs.createWriteStream(path.join(imgSavePath, fileName));

  const readStream = function (chunkArray, cb) {
    let path = chunkArray.shift();
    let originStream = fs.createReadStream(path);
    originStream.pipe(targetStream, { end: false });
    originStream.on("end", function () {
      // 删除文件
      fs.unlinkSync(path);
      if (chunkArray.length > 0) {
        readStream(chunkArray, callback)
      } else {
        cb()
      }
    });
  };

  readStream(chunkPaths, callback);

}


module.exports = router
