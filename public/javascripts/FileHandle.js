class FileHandle {
  constructor(file) {
    this.file = file
    this.chunkList = []
    this.uploadMsg = {
      name: file.name,
      chunkSize: 1 * 1024 * 1024,
      chunkNum: Math.ceil(file.size / (1 * 1024 * 1024)),
      md5: ''
    }
  }

  getMsg() {
    return this.uploadMsg
  }


  begin() {
    const fileSlice = File.prototype.slice
    let currentChunk = 0;
    const endChunk = this.uploadMsg.chunkNum
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    return new Promise(resolve => {
      fileReader.onload = (e) => {
        if (currentChunk >= endChunk) {
          const md5 = spark.end()
          this.uploadMsg.md5 = md5
          const { uploadMsg, chunkList } = this
          resolve({
            uploadMsg, chunkList
          })
          return
        }
        currentChunk++
        console.log(currentChunk);
        spark.append(e.target.result)
        this.computedFile(fileReader, currentChunk, fileSlice)
      }
      fileReader.onError = function (e) {
        throw new Error(e);
      }
      this.computedFile(fileReader, currentChunk, fileSlice)
    })
  }

  computedFile(fileReader, currentChunk, fileSlice) {
    const start = currentChunk * this.uploadMsg.chunkSize
    const end = start + this.uploadMsg.chunkSize >= this.file.size ? this.file.size : start + this.uploadMsg.chunkSize;
    const blobs = fileSlice.call(this.file, start, end);
    this.chunkList.push(blobs)
    fileReader.readAsArrayBuffer(blobs);
  }

}
