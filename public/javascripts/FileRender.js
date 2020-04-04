class FileRender {
  constructor(file, UPLOADER) {
    this.UPLOADER = UPLOADER

    this.file = file
    this.md5 = ''
    this.dom = ''
    this.domID = file.name.split('.')[0] + file.size
    this.bindFn = null
    this.begin()
  }

  create() {
    const li = document.createElement('li')
    const h5 = document.createElement('h5')
    const div = document.createElement('div')
    const puse = document.createElement('button')
    const remove = document.createElement('button')
    const span = document.createElement('span')

    li.setAttribute("id", this.domID);
    h5.innerText = this.file.name
    div.innerText = '0%'
    puse.innerText = '暂停'
    remove.innerText = '删除'
    span.innerText = '文件解析中...'
    div.className = 'progress'
    puse.className = 'puse'
    remove.className = 'remove'
    span.className = 'loading'

    li.append(h5, div, puse, remove, span)
    document.getElementById('uploadList').appendChild(li)

    this.dom = document.getElementById(this.domID)
    this.bindFn = this.pause.bind(this)
    puse.addEventListener('click', this.bindFn)
    remove.addEventListener('click', (e)=>this.remove(e))
  }

  begin() {
    this.create()
  }

  loaded() {//read done
    this.dom.getElementsByClassName('loading')[0].innerText = '上传中...'
  }

  pause(e) {
    this.UPLOADER.pause(this.md5)
    const button = this.dom.getElementsByClassName('puse')[0]
    button.innerText = '继续'
    button.disabled = true

    button.removeEventListener('click', this.bindFn)
    this.bindFn = this.continue.bind(this)
    button.addEventListener('click', this.bindFn)
    setTimeout(() => {
      button.disabled = false
    }, 1000);
  }
  continue(e) {
    this.UPLOADER.continue(this.md5)
    const button = this.dom.getElementsByClassName('puse')[0]
    button.innerText = '暂停'
    button.disabled = true

    button.removeEventListener('click', this.bindFn)
    this.bindFn = this.pause.bind(this)
    button.addEventListener('click', this.bindFn)
    setTimeout(() => {
      button.disabled = false
    }, 1000);
  }
  remove(e) {
    this.dom.remove()
    this.UPLOADER.remove(this.md5)
  }
  removeRepeat(file) {
    const domID = file.name.split('.')[0] + file.size
    setTimeout(() => {
      document.getElementById(domID).remove()
    }, 2000);
  }

  renderProgress(num) {
    this.dom.getElementsByClassName('progress')[0].innerText = num + '%'
  }

  renderSuccess() {
    this.renderProgress(100)
    this.dom.className = 'success'
    this.dom.getElementsByClassName('loading')[0].innerText = '上传成功'

  }
  renderError() {
    this.dom.className = 'error'
    this.dom.getElementsByClassName('loading')[0].innerText = '上传失败'
  }

}