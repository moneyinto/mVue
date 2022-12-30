## Vue2简单实现
### 功能列表
- [x] 数据双向绑定 (object存在问题，一个标签存在多个绑定值时渲染问题)
- [x] data
- [x] methods
- [x] mounted
- [ ] create
- [ ] update
- [ ] destory
- [x] v-model
- [x] v-on (click)
- [x] v-for
- [ ] v-show
- [ ] v-if
- [ ] v-else
- [ ] v-html
- [ ] v-bind
- [ ] v-class
- [ ] v-style

### 使用
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mVue</title>
    <script src="./mVue.js"></script>
</head>

<body>
    <div id="app">
        <h2>{{title}}</h2>
        <input v-model="name">
        <h1>{{name}}</h1>
        <div>计时：{{count}}</div>
        <div>{{obj.a}}</div>
        <div>
            <button v-on:click="clickMe">click me!</button>
        </div>
        <div>ssxxx</div>
        <div class="list" v-for="(item, index) in list">
            <div v-on:click="clickMe"><b>{{item.name}}</b><i>{{index}}</i></div>
        </div>
    </div>

    <script type="text/javascript">
        new mVue({
            el: "#app",
            data: {
                title: "hello world",
                name: "moneyinto",
                obj: {
                    a: 1,
                    b: 2
                },
                count: 1,
                list: [
                    {
                        name: "xx"
                    },
                    {
                        name: "aaa"
                    },
                    {
                        name: "bbb"
                    }
                ]
            },
            methods: {
                clickMe: function () {
                    alert("点击了")
                }
            },
            mounted: function () {
                window.setInterval(() => {
                    this.count++;
                }, 1000);
            }
        });
    </script>
</body>

</html>
```