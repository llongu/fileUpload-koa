class FileUpload {
  constructor(uploadMsg, chunkList, UPLOADER) {
    this.http = new XMLHttpRequest()
    this.UPLOADER = UPLOADER

    this.uploadMsg = uploadMsg  //上传信息
    this.chunkList = chunkList  //file blob 
    this.uploadSuccessNum = 0
    this.uploadErrorNum = 0
    this.currentUplodNum = 0
    this.awaitUploadNum = uploadMsg.chunkNum
    this.awaitUploadList = []
    this.uploadStatus = "check | upload | remove | pause"
    this.begin()
  }

  create() {
    this.http.onreadystatechange = this.onreadystatechange
    this.http.onload = this.onload
    this.http.onerror = this.onerror
    this.http.onloadend = this.onloadend
  }

  begin() {
    this.create()
    this.fileCheck()
  }

  fileCheck() {
    this.uploadStatus = 'check'
    this.send(this.uploadMsg)
  }

  beforeUpload() {
    this.uploadStatus = 'upload'
    this.awaitUploadList = this.chunkList.map((item, index) => {
      return {
        file: item,
        ...this.uploadMsg,
        current: index
      }
    })
    this.upload()
  }

  upload() {
    this.send(this.awaitUploadList[this.currentUplodNum])
  }

  onload = (e) => {
    const status = JSON.parse(e.currentTarget.response).status
    if (this.uploadStatus === 'remove') {
      console.log('删除');
      return
    }

    if (this.uploadStatus === 'check') {
      if (status === 200) {
        this.UPLOADER.success(this.uploadMsg.md5)
        console.log('校验成功，上传完成');
        return
      }
      console.log('校验失败，开始上传');
      this.beforeUpload()
      return
    }

    if (this.uploadStatus === 'upload' || this.uploadStatus === 'pause') {
      if (status === 200) {
        this.currentUplodNum++;
        if (this.currentUplodNum === this.awaitUploadNum) {
          this.UPLOADER.success(this.uploadMsg.md5)
          console.log('单文件上传成功');
          return
        }
        this.UPLOADER.progress(this.uploadMsg.md5, Math.ceil(this.currentUplodNum / this.awaitUploadNum * 100))
        console.log('进度处理');
        if (this.uploadStatus === 'pause') {
          console.log('暂停');
          return
        }
        this.upload()
        return
      }
      this.UPLOADER.error(this.uploadMsg.md5)
      console.log('单文件上传失败');
    }

  }

  onerror = (error) => {
    this.UPLOADER.error(this.uploadMsg.md5)
    console.error(error);
  }

  send(data) {
    const sendForm = new FormData()
    Object.keys(data).forEach(item => {
      sendForm.append(item, data[item])
    })
    const url = this.uploadStatus == 'check' ? 'fileCheck' : 'fileUpload'

    this.http.open('post', `./${url}`, true)
    this.http.send(sendForm)
  }

}