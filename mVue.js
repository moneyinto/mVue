function Compile(el, vm) {
    this.vm = vm;
    this.el = document.querySelector(el);
    this.fragment = null;
    this.init();
}

Compile.prototype = {
    init: function () {
        if (this.el) {
            this.fragment = this.nodeToFragment(this.el);
            this.compileElement(this.fragment);
            this.el.appendChild(this.fragment);
        } else {
            console.log("Dom元素不存在");
        }
    },
    nodeToFragment: function (el) {
        var fragment = document.createDocumentFragment();
        var child = el.firstChild;
        while (child) {
            // 将Dom元素移入fragment中
            fragment.appendChild(child);
            child = el.firstChild;
        }
        return fragment;
    },
    compileElement: function (el) {
        var childNodes = el.childNodes;
        var self = this;
        [].slice.call(childNodes).forEach(function (node) {
            var reg = /\{\{(.*)\}\}/;
            var text = node.textContent;
            if (self.isElementNode(node)) {
                self.compile(node);
            } else if (self.isTextNode(node) && reg.test(text)) {
                self.compileText(node, reg.exec(text)[1]);
            }

            if (node.childNodes && node.childNodes.length) {
                self.compileElement(node);
            }
        });
    },
    compile: function (node) {
        var nodeAttrs = node.attributes;
        var self = this;
        Array.prototype.forEach.call(nodeAttrs, function (attr) {
            var attrName = attr.name;
            if (self.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (self.isEventDirective(dir)) {
                    // 事件指令
                    self.compileEvent(node, self.vm, exp, dir);
                } else if (self.isModelDirective(dir)) {
                    // v-model 指令
                    self.compileModel(node, self.vm, exp, dir);
                } else if (self.isForDirective(dir)) {
                    // v-for 指令
                    self.compileFor(node, self.vm, exp, dir);
                } else {
                    self.compileElement(node.childNodes);
                }
                node.removeAttribute(attrName);
            }
        });
    },
    compileText: function (node, exp) {
        var self = this;
        var initText = this.vm[exp];
        this.updateText(node, initText);
        new Watcher(this.vm, exp, function (value) {
            self.updateText(node, value);
        });
    },
    compileEvent: function (node, vm, exp, dir) {
        var eventType = dir.split(":")[1];
        var cb = vm.methods && vm.methods[exp];

        if (eventType && cb) {
            node.addEventListener(eventType, cb.bind(vm), false);
        }
    },
    compileModel: function (node, vm, exp, dir) {
        var self = this;
        var val = vm[exp];
        this.modelUpdater(node, val);
        new Watcher(this.vm, exp, function (value) {
            self.modelUpdater(node, value);
        });

        node.addEventListener("input", function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            self.vm[exp] = newValue;
            val = newValue;
        });
    },
    compileFor: function (node, vm, exp, dir) {
        var cacheTags = []; // 暂存生成的dom
        var backNode = node.cloneNode(true);
        cacheTags = this.updateFor(backNode, vm, exp, node);
        var dataKey = exp.substr(exp.lastIndexOf("in") + 2).trim();

        var self = this;
        new Watcher(this.vm, dataKey, function (value) {
            console.log("update", node)
            cacheTags.forEach(function(tag, index) {
                // 保留第一个 为了更新替换
                if (index > 0) tag.parentNode.removeChild(tag)
            });
            var firstChild = cacheTags[0];
            cacheTags = self.updateFor(backNode, vm, exp, firstChild);
        });
    },
    updateFor: function (backNode, vm, exp, node) {
        var regex = "\\((.+?)\\)";
        var item_index = exp.match(regex)[1].trim();
        var item = item_index.split(",")[0].trim(); // item
        var index = item_index.split(",")[1].trim(); // index
        var dataKey = exp.substr(exp.lastIndexOf("in") + 2).trim();
        var todoList = vm.data[dataKey];
        var fragment = document.createDocumentFragment();
        var cacheTags = [];
        var reg = /{{(.*?)}}/g;
        for (var i = 0; i < todoList.length; i++) {
            var todoItem = todoList[i];
            var tag = backNode.cloneNode(true);
            // 移除v-for
            tag.removeAttribute("v-for");
            if (typeof todoItem === "string") {
                tag.innerHTML = tag.innerHTML.replace(
                    reg,
                    function (val, key) {
                        if (key === item) {
                            return todoItem;
                        } else if (key === index) {
                            return i;
                        } else {
                            return val;
                        }
                    }
                );
                fragment.appendChild(tag);
                cacheTags.push(tag);
            } else if (todoItem instanceof Object) {
                tag.innerHTML = tag.innerHTML.replace(
                    reg,
                    function (val, key) {
                        if (key.split(".")[0] === item) {
                            var k = key.split(".")[1];
                            return todoItem[k];
                        } else if (key === index) {
                            return i;
                        } else {
                            return val;
                        }
                    }
                );
                fragment.appendChild(tag);
                cacheTags.push(tag);
            } else if (todoList[i] instanceof Array) {
                console.log("不支持 array");
            }
        }
        node.parentNode.replaceChild(fragment, node);

        var self = this;
        cacheTags.forEach(function(tag) {
            self.compileElement(tag);
        })

        return cacheTags;
    },
    updateText: function (node, value) {
        node.textContent = typeof value == "undefined" ? "" : value;
    },
    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == "undefined" ? "" : value;
    },
    isDirective: function (attr) {
        return attr.indexOf("v-") == 0;
    },
    isEventDirective: function (dir) {
        return dir.indexOf("on:") === 0;
    },
    isModelDirective: function (dir) {
        return dir.indexOf("model") === 0;
    },
    isForDirective: function (dir) {
        return dir.indexOf("for") === 0;
    },
    isElementNode: function (node) {
        return node.nodeType == 1;
    },
    isTextNode: function (node) {
        return node.nodeType == 3;
    }
};

function Observer(data) {
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    walk: function (data) {
        var self = this;
        Object.keys(data).forEach(function (key) {
            self.defineReactive(data, key, data[key]);
        });
    },
    defineReactive: function (data, key, val) {
        var dep = new Dep();
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get: function getter() {
                if (Dep.target) {
                    dep.addSub(Dep.target);
                }
                return val;
            },
            set: function setter(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    if (!value || typeof value !== "object") {
        return;
    }
    return new Observer(value);
}

function Dep() {
    this.subs = [];
}

Dep.prototype = {
    addSub: function (sub) {
        this.subs.push(sub);
    },
    notify: function () {
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }
};

Dep.target = null;

function Watcher(vm, exp, cb) {
    this.cb = cb;
    this.vm = vm;
    this.exp = exp;
    this.value = this.get(); // 将自己添加到订阅器的操作
}

Watcher.prototype = {
    update: function () {
        this.run();
    },
    run: function () {
        var value = this.vm.data[this.exp];
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    },
    get: function () {
        Dep.target = this; // 缓存自己
        var value = this.vm.data[this.exp]; // 强制执行监听器里的get函数
        Dep.target = null; // 释放自己
        return value;
    }
};

function mVue(options) {
    var self = this;
    this.data = options.data;
    this.methods = options.methods;

    Object.keys(this.data).forEach(function (key) {
        self.proxyKeys(key);
    });

    observe(this.data);
    new Compile(options.el, this);
    options.mounted.call(this); // 所有事情处理好后执行mounted函数
}

mVue.prototype = {
    proxyKeys: function (key) {
        var self = this;
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: true,
            get: function getter() {
                return self.data[key];
            },
            set: function setter(newVal) {
                self.data[key] = newVal;
            }
        });
    }
};
