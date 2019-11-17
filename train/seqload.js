if (!Array.prototype.map) {
  Array.prototype.map = function(_cb) {
    var arr = this;
    var newArr = [];
    for (i = 0, len = arr.length; i < len; i += 1) {
      newArr.push(_cb(arr[i], i));
    }
    return newArr;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(_cb) {
    var arr = this;
    for (i = 0, len = arr.length; i < len; i += 1) {
      _cb(arr[i], i);
    }
  };
}

function noop() {}
function isObject(_obj) {
  return typeof _obj === 'object' && _obj !== null;
}

function Seqload(_srcs, _options) {
  this.srcs = _srcs;
  this.options = _options;
  this.scripts = [];
  this.cb = noop;
}

Seqload.prototype.init = function(_cb) {
  var ctx = this;
  this.cb = _cb;
  this.scripts = this.srcs.map(function(item) {
    return ctx.generateSrcScript(item);
  });
  this.insertScript();
}

Seqload.prototype.insertScript = function(_index) {
  var ctx = this;
  var index = _index || 0;
  var item = this.scripts[index];
  if (!item) {
    return this.cb.call(window);
  }
  document.head.appendChild(item.el);
  item.el.onload = function() {
    item.cb();
    ctx.insertScript(++index);
  };
}

Seqload.prototype.generateSrcScript = function(_options) {
  var src = _options;
  var cb = noop;
  if (isObject(_options)) {
    src = _options.src;
    cb = _options.cb;
  }
  var script = document.createElement('script');
  script.src = src + '?tag=' + Math.random();
  return {
    cb: cb,
    el: script
  };
}
