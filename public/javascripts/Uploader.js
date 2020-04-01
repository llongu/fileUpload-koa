const Uploader = {
  uploadFileStatus: {
    success: 0,
    error: 0,
    total: 0
  },
  fileUpload: {},
  fileRender: {},
  async create(file) {
    this.uploadFileStatus.total++
    const fileRender = new FileRender(file, this)
    console.time()
    const { uploadMsg, chunkList } = await new FileHandle(file).begin()
    console.timeEnd()

    if (!this.repeat(uploadMsg.md5, file)) return
    const fileUpload = new FileUpload(uploadMsg, chunkList, this)

    //统一状态管理
    fileRender.md5 = uploadMsg.md5
    fileRender.loaded()
    this.fileRender[uploadMsg.md5] = fileRender
    this.fileUpload[uploadMsg.md5] = fileUpload
  },
  repeat(md5, file) {
    if (this.fileRender[md5] && this.fileUpload[md5]) {
      console.log('重复文件已移除');
      this.uploadFileStatus.total--
      this.fileRender[md5].removeRepeat(file)
      this.notify()
      return false
    }
    return true
  },

  remove(md5) {
    this.uploadFileStatus.total--
    this.fileUpload[md5].uploadStatus = 'remove'
    delete this.fileUpload[md5]
    this.notify()
  },
  pause(md5) {
    console.warn('pause      ' + md5);
    this.fileUpload[md5].uploadStatus = 'pause'
  },
  continue(md5) {
    console.warn('continue           ' + md5);

    this.fileUpload[md5].uploadStatus = 'upload'
    this.fileUpload[md5].upload()
  },

  progress(md5, num) {
    this.fileRender[md5].renderProgress(num)
  },
  success(md5) {
    this.uploadFileStatus.success++
    this.fileRender[md5].renderSuccess()
    this.notify()
  },
  error(md5) {
    this.uploadFileStatus.error++
    this.fileRender[md5].renderError()
    this.notify()
  },
  notify() {
    const { success, error, total } = this.uploadFileStatus
    if (total === error) {
      console.warn('全部上传失败')
      return
    }
    if (total === success + error) {
      if (error) {
        console.warn(`${success}上传成功，${error}上传失败`)
        return
      }
      console.warn('全部上传成功')
    }
  }
}


