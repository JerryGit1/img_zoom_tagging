/**
 * Created by Jerry on 2019/3/14.
 */
    //禁止鼠标右键
    document.oncontextmenu = function(){
        event.returnValue = false;
    };

    var moveRest = "images/move_rest.png";
    var moveGroupHover = "images/move_grouphover.png";
    var moveHover = "images/move_hover.png";
    var movePressed = "images/move_pressed.png";

    var rectRest = "images/rect_rest.png";
    var rectPressed = "images/rect_pressed.png";
    var rectHover = "images/rect_hover.png";
    var rectGroupHover = "images/rect_grouphover.png";

    var drawRest = "images/draw_rest.png";
    var drawPressed = "images/draw_pressed.png";
    var drawHover = "images/draw_hover.png";
    var drawGroupHover = "images/draw_grouphover.png";

    var lassoRest = "images/lasso_rest.png";
    var lassoPressed = "images/lasso_pressed.png";
    var lassoHover = "images/lasso_hover.png";
    var lassoGroupHover = "images/lasso_grouphover.png";


    // store.js
    var data = {
        mode: 'MOVE',
        zoom: 1,
        width: 0,
        height: 0,
        juPull: false, //判断是否点圆点拖动，并瞬间离开,是否拖动点
        curPointIndex: 0, //判断是否点圆点拖动，并瞬间离开,是否拖动点
        activityInProgress: false,
        lasso_close_idx:[],
        annotations: [],
        draw_annotations: [],
        lasso_annotations: [],
    };


    var point = [];


    function AppStore() {}
    AppStore.prototype = new OpenSeadragon.EventSource();
    AppStore.prototype.getAll = function () {
        return data.annotations;
    };
    AppStore.prototype.drawAll = function () {
        return data.draw_annotations;
    };
    AppStore.prototype.lassoAll = function () {
        return data.lasso_annotations;
    };
    AppStore.prototype.getWidth = function () {
        return data.width * data.zoom;
    };
    AppStore.prototype.getHeight = function () {
        return data.height * data.zoom;
    };
    AppStore.prototype.getLast = function () {
        return data.annotations[data.annotations.length - 1];
    };
    AppStore.prototype.drawLast = function () {
        return data.draw_annotations[data.draw_annotations.length - 1];
    };
    AppStore.prototype.getMode = function () {
        return data.mode;
    };
    AppStore.prototype.inMoveMode = function () {
        return this.getMode() === 'MOVE';
    };
    AppStore.prototype.notInMoveMode = function () {
        return !this.inMoveMode();
    };
    AppStore.prototype.isActivityInProgress = function () {
        return data.activityInProgress;
    };
    var Store = new AppStore();

    function is_store(action) {
        switch (action.type) {
            case 'MODE_UPDATE':
                data.mode = action.mode;
                break;
            case 'ACTIVITY_UPDATE':
                data.activityInProgress = action.inProgress;
                break;
            case 'ANNOTATIONS_CREATE':
                if(Store.getMode() == "RECT"){
                    data.annotations.push(action.annotation);
                }else if(Store.getMode() == "DRAW"){
                    data.draw_annotations.push(action.annotation);
                }
                break;
            case 'ANNOTATIONS_LASSO_CREATE':
                data.lasso_annotations.push(action.annotation);
                break;
            case 'ANNOTATIONS_LASSO_DRAG':
                //lasso移动功能
                var p = data.lasso_annotations;
                var x = action.loc.x;
                var y = action.loc.y;
                //改变点的坐标
                p[data.curPointIndex][1].cx = x;
                p[data.curPointIndex][1].cy = y;
                var num_first = data.lasso_close_idx.indexOf(data.curPointIndex>0?data.curPointIndex-1:data.curPointIndex);
                var num_last = data.lasso_close_idx.indexOf(data.curPointIndex+1);
                if(p.length>2){ //线
                    if(data.lasso_close_idx[data.lasso_close_idx.length-1]+1 !== data.curPointIndex || data.curPointIndex !== p.length-1){
                        var num;
                        if(data.lasso_close_idx[0]){
                            num = data.lasso_close_idx[data.lasso_close_idx.length-1]
                        }else{
                            num = 0
                        }
                        //第一个点
                        if(data.curPointIndex == 0 || num_first>=0){
                            if(p[p.length-1][0] == "circle" && num<=data.curPointIndex){
                                //没闭合
                                p[data.curPointIndex+1][1].x1 = x;
                                p[data.curPointIndex+1][1].y1 = y;
                            }else{
                                p[data.curPointIndex+1][1].x1 = x;
                                p[data.curPointIndex+1][1].y1 = y;
                                p[data.lasso_close_idx[num_first+1]][1].x1 = x;
                                p[data.lasso_close_idx[num_first+1]][1].y1 = y;
                            }
                        }else if(data.curPointIndex == p.length-1 || data.curPointIndex == p.length-2 || num_last>=0){
                            //最后一个点
                            if(p[p.length-1][0] == "circle" && num<data.curPointIndex){
                                p[data.curPointIndex-1][1].x2 = x;
                                p[data.curPointIndex-1][1].y2 = y;
                            }else{
                                //闭合
                                p[data.curPointIndex-1][1].x2 = x;
                                p[data.curPointIndex-1][1].y2 = y;
                                p[data.lasso_close_idx[num_last]][1].x2 = x;
                                p[data.lasso_close_idx[num_last]][1].y2 = y;
                            }
                        }else{
                            p[data.curPointIndex-1][1].x2 = x;
                            p[data.curPointIndex-1][1].y2 = y;
                            p[data.curPointIndex+1][1].x1 = x;
                            p[data.curPointIndex+1][1].y1 = y;
                        }
                    }
                }
                break;
            case 'ANNOTATIONS_UPDATE_LAST':
                if(Store.getMode() == "RECT"){
                    OpenSeadragon.extend(Store.getLast()[1], action.update);
                }else if(Store.getMode() == "DRAW"){
                    OpenSeadragon.extend(Store.drawLast()[1], action.update);
                }
                break;
            case 'ANNOTATIONS_RESET':
                data.annotations = action.annotations;
                break;
            case 'ANNOTATIONS_COLOR':
                if(Store.getMode() == "RECT"){
                    data.annotations[action.update.idx][1].stroke = action.update.color;
                }else if(Store.getMode() == "DRAW"){
                    data.draw_annotations[action.update.idx][1].stroke = action.update.color;
                }else if(Store.getMode() == "LASSO"){
                    var info = lasso_slice(action.update.idx);
                    for(var i=info.sat;i<=info.end;i++) {
                        if(action.update.color){
                            if(data.lasso_annotations[i][0] == "line"){
                                data.lasso_annotations[i][1].stroke = action.update.color;
                            }else{
                                data.lasso_annotations[i][1].fill = action.update.color;
                            }
                        }else{
                            if(data.lasso_annotations[i][0] == "line"){
                                data.lasso_annotations[i][1].stroke = data.lasso_annotations[i][2];
                            }else{
                                data.lasso_annotations[i][1].fill = data.lasso_annotations[i][2];
                            }
                        }
                    }
                }
                break;
            case 'ANNOTATIONS_CHECK':
                if(Store.getMode() == "RECT"){
                    data.annotations[action.update.idx][1].opacity = action.update.opacity;
                }else if(Store.getMode() == "DRAW"){
                    data.draw_annotations[action.update.idx][1].opacity = action.update.opacity;
                }else if(Store.getMode() == "LASSO"){
                    var info = lasso_slice(action.update.idx);
                    for(var i=info.sat;i<=info.end;i++) {
                        data.lasso_annotations[i][1].opacity = action.update.opacity;
                    }
                }
                break;
            case 'ANNOTATIONS_CHANGE_CHECK':
                if(Store.getMode() == "RECT"){
                    data.annotations[action.update.idx][2] = action.update.color;
                } else if(Store.getMode() == "DRAW"){
                    data.draw_annotations[action.update.idx][2] = action.update.color;
                } else if(Store.getMode() == "LASSO"){
                    var info = lasso_slice(action.update.idx);
                    for(var i=info.sat;i<=info.end;i++) {
                        data.lasso_annotations[i][2] = action.update.color;
                    }
                }
                break;
            case 'ANNOTATIONS_DELETE_CHECK':
                //删除对应的数组
                if(Store.getMode() == "RECT"){
                    data.annotations.splice(action.update.idx,1);
                }else if(Store.getMode() == "DRAW"){
                    data.draw_annotations.splice(action.update.idx,1);
                }else if(Store.getMode() == "LASSO"){
                    var info = lasso_slice(action.update.idx);
                    var num = info.end - info.sat;
                    data.lasso_close_idx.splice(action.update.idx,1);
                    lasso_delete(num+1,action.update.idx);
                    data.lasso_annotations.splice(info.sat,num+1);
                }
                break;
            case 'ANNOTATIONS_UPDATE_EVENT':
                OpenSeadragon.extend(action.update.last, { d: action.update.d });
                break;
            case 'ZOOM_UPDATE':
                data.zoom = action.zoom;
                break;
            case 'INITIALIZE':
                OpenSeadragon.extend(data, action.options);
                break;
            default:
                break;
        }
        Store.raiseEvent('CHANGE_EVENT');
    }

    //control.js
    //父类
    function Control(options) {
        this.mode = options.Tooltip.toUpperCase();
        var self = this;
        var info = OpenSeadragon.extend({
            onClick: self.onClick
        }, options);
        this.btn = new OpenSeadragon.Button(info);
        if (Store.getMode() === this.mode) {
            this.activate();
        }
        Store.addHandler('CHANGE_EVENT',() => {
            if (Store.getMode() === this.mode) {
                this.activate();
            } else {
                this.deactivate();
            }
        });
    }

    Control.prototype.activate = function () {
        this.btn.imgDown.style.visibility = 'visible';
    };
    Control.prototype.deactivate = function () {
        this.btn.imgDown.style.visibility = 'hidden';
    };
    Control.prototype.onClick = function (e) {
        if (e.eventSource.Tooltip) {
            switch (Store.getMode()) {
                case 'DRAW':
                    draw_close();
                    break;
                case 'LASSO':
                    lasso_close();
                    break;
                default:
                    break;
            }
            selectMode(e.eventSource.Tooltip.toUpperCase(), Store);
            switch (Store.getMode()) {
                case 'DRAW':
                    $(".draw").css("display","block");
                    $(".lasso").css("display","none");
                    $(".rect").css("display","none");
                    break;
                case 'LASSO':
                    $(".lasso").css("display","block");
                    $(".draw").css("display","none");
                    $(".rect").css("display","none");
                    break;
                case 'RECT':
                    $(".rect").css("display","block");
                    $(".draw").css("display","none");
                    $(".lasso").css("display","none");
                    break;
                default:
                    $(".draw").css("display","none");
                    $(".lasso").css("display","none");
                    $(".rect").css("display","none");
                    break;
            }
        }
    };

    //画笔闭合
    function draw_close() {
        for(let i=0;i<data.draw_annotations.length;i++){
            var last = data.draw_annotations[i];
            var d = last[1].d;
            if(d.charAt(d.length-1) !== "Z"){
                if (last && last[0] === 'path') {
                    is_store({type: 'ANNOTATIONS_UPDATE_EVENT',update: { d: `${d} Z`,last:last[1] }});
                }
            }
        }
    }

    //套索闭合【在lasso_ani中添加一根线】
    function lasso_close() {
        var p = data.lasso_annotations;
        var close = this_ani();
        var num;
        if(data.lasso_close_idx.length>0){
            num = data.lasso_close_idx[data.lasso_close_idx.length-1]+1;
        }else{
            num = 0;
        }
        if(close){
            if(close.length>3){
                let ani = data.lasso_annotations;
                is_store({type: 'ANNOTATIONS_LASSO_CREATE',annotation: shapesFactory.lassoLinePath(ani[num][1].cx, ani[num][1].cy, ani[ani.length-1][1].cx, ani[ani.length-1][1].cy)});
                data.lasso_close_idx.push(data.lasso_annotations.length-1);
                $(".lasso").append('<p></p>');
                $(".lasso p:last").append('<input>');
                $(".lasso p:last input:eq(0)").attr('type','checkbox');
                $(".lasso p:last input:eq(0)").attr('checked','checked');
                $(".lasso p:last").append('<input>');
                $(".lasso p:last input:eq(1)").attr('type','color');
                $(".lasso p:last input:eq(1)").attr('value','#ff0000');
                $(".lasso p:last").append('<button>删除</button>');
                lasso_additional();
            }
        }
    }

    //算lasso的开始点与结束点
    function lasso_slice(idx) {
        var end,sat;
        if(idx == 0){
            end = data.lasso_close_idx[idx];
            sat = 0;
        }else{
            end = data.lasso_close_idx[idx];
            sat = data.lasso_close_idx[idx-1]+1;
        }
        return {end:end,sat:sat}
    }
    
    //删除套索时修正闭合数据
    function lasso_delete(num,idx) {
        var c = data.lasso_close_idx;
        for(var i=0;i<c.length;i++){
            if(i >= idx){
                c[i] = c[i] - num;
            }
        }
    }
    

    //加套按钮组
    function Rect() {}
    var rect_parent = new Control({
        Tooltip: 'Rect',
        srcRest: rectRest,
        srcGroup: rectGroupHover,
        srcHover: rectHover,
        srcDown: rectPressed,
    });
    Rect.prototype = rect_parent;

    function Move() {}
    var move_parent = new Control({
        Tooltip: 'Move',
        srcRest: moveRest,
        srcGroup: moveGroupHover,
        srcHover: moveHover,
        srcDown: movePressed,
    });
    Move.prototype = move_parent;

    function Draw() {}
    var draw_parent = new Control({
        Tooltip: 'Draw',
        srcRest: drawRest,
        srcGroup: drawGroupHover,
        srcHover: drawHover,
        srcDown: drawPressed,
    });
    Draw.prototype = draw_parent;

    function Lasso() {}
    var lasso_parent = new Control({
        Tooltip: 'Lasso',
        srcRest: lassoRest,
        srcGroup: lassoGroupHover,
        srcHover: lassoHover,
        srcDown: lassoPressed,
    });
    Lasso.prototype = lasso_parent;

    var controls = [Move,Rect,Draw,Lasso].map(Control => new Control());

    //initialize.js
    function initialize(options) {
        is_store({type: 'INITIALIZE',options});
    }

    //selectMode.js
    function selectMode(mode, Store) {
        is_store({type: 'ACTIVITY_UPDATE',inProgress:false});
        if (Store.getMode() !== mode) { //store中的mode值不与参数一致
            is_store({type: 'MODE_UPDATE',mode});
        }
    }

    //cleanCanvas.js
    function cleanCanvas() {
        is_store({type: 'ACTIVITY_UPDATE',inProgress: false});
        is_store({type: 'ANNOTATIONS_RESET',annotations: []});
    }

    //fillCanvasWith.js
    function fillCanvasWith(annotations) {
        is_store({type: 'ACTIVITY_UPDATE',inProgress: false});
        is_store({type: 'ANNOTATIONS_RESET',annotations});
    }

    //zoom.js
    function zoom(zoomLevel) {
        is_store({type: 'ZOOM_UPDATE',zoom: zoomLevel});
    }

    //release.js
    function release(Store,x,y) {
        switch (Store.getMode()) {
            case 'RECT':
                is_store({type: 'ACTIVITY_UPDATE',inProgress: false});
                //操作页面部分
                $(".rect").append('<p></p>');
                $(".rect p:last").append('<input>');
                $(".rect p:last input:eq(0)").attr('type','checkbox');
                $(".rect p:last input:eq(0)").attr('checked','checked');
                $(".rect p:last").append('<input>');
                $(".rect p:last input:eq(1)").attr('type','color');
                $(".rect p:last input:eq(1)").attr('value','#ff0000');
                $(".rect p:last").append('<button>删除</button>');
                rect_additional();
                break;
            case 'DRAW':
                is_store({type: 'ACTIVITY_UPDATE',inProgress: false});
                $(".draw").append('<p></p>');
                $(".draw p:last").append('<input>');
                $(".draw p:last input:eq(0)").attr('type','checkbox');
                $(".draw p:last input:eq(0)").attr('checked','checked');
                $(".draw p:last").append('<input>');
                $(".draw p:last input:eq(1)").attr('type','color');
                $(".draw p:last input:eq(1)").attr('value','#ff0000');
                $(".draw p:last").append('<button>删除</button>');
                draw_additional();
                break;
            case 'LASSO':
                is_store({type: 'ACTIVITY_UPDATE',inProgress: false});
                lasso_drag_fn(x,y);
                break;
            default:
                break;
        }
    }

    function lasso_drag_fn(x,y) {
        if(data.juPull){
            //控制拖动
            data.juPull = false;
            data.curPointIndex = 0;
        }else {
            //先创建一个圆
            var lasso = data.lasso_annotations;
            if(lasso[lasso.length-1]){
                //判断是否闭合
                if(data.lasso_close_idx[data.lasso_close_idx.length-1] == lasso.length-1){
                    push_lasso_fn([],x,y);
                    //闭合
                }else{
                    //没闭合
                    var info = this_ani();
                    push_lasso_fn(info,x,y);
                }
            }else{
                push_lasso_fn(lasso,x,y);
            }
        }
    }

    //press.js
    var shapesFactory = {
        getPath(x, y, w, h) {
            return [
                'rect',
                {
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    fill: 'none',
                    stroke: 'red',
                    'stroke-width': 3,//线条的半径
                    'stroke-linejoin': 'round',//设置转角弧度，bevel：平角，miter：尖角
                    'stroke-linecap': 'round',//butt:以90度的尖角结束笔划,square:类似于butt,延长相应长度，round:添加起点和终点的半径
                    'vector-effect': 'non-scaling-stroke',//无论如何缩放，边框粗度永远不变，non-scaling-stroke最常用【default | non-scaling-stroke | inherit | <uri>】 *
                },
                'red',
            ];
        },
        drawPath(x, y) {
            return [
                'path',
                {
                    fill: 'none',
                    d: `M${x} ${y}`,
                    stroke: 'red',
                    'stroke-width': 3,
                    'stroke-linejoin': 'round',
                    'stroke-linecap': 'round',
                    'vector-effect': 'non-scaling-stroke',
                },
                'red',
            ];
        },
        lassoLinePath(x1, y1, x2, y2) {
            return [
                'line',
                {
                    x1:x1,
                    y1:y1,
                    x2:x2,
                    y2:y2,
                    stroke: 'red',
                    'stroke-width': 3,
                    'stroke-linejoin': 'round',
                    'stroke-linecap': 'round',
                    'vector-effect': 'non-scaling-stroke',
                },
                'red',
            ];
        },
        lassoCirclePath(cx, cy) {
            return [
                'circle',
                {
                    cx:cx,
                    cy:cy,
                    r:0.6,
                    fill: 'red',
                },
                'red',
            ];
        }
    };

    function press(x, y, Store) {
        //再加一层判断
        switch (Store.getMode()) {
            case 'RECT':
                is_store({type: 'ACTIVITY_UPDATE',inProgress: true});
                let loc = {x:x,y:y};
                point.push(loc);
                is_store({type: 'ANNOTATIONS_CREATE',annotation: shapesFactory.getPath(x, y, 0, 0)});
                break;
            case 'DRAW':
                is_store({type: 'ACTIVITY_UPDATE',inProgress: true});
                is_store({type: 'ANNOTATIONS_CREATE',annotation: shapesFactory.drawPath(x, y)});
                break;
            case 'LASSO':
                is_store({type: 'ACTIVITY_UPDATE',inProgress: true});
                break;
            default:
                break;
        }
    }

    //push lasso数据
    function push_lasso_fn(lasso,x,y) {
        if (lasso.length >= 1) {
            //判断鼠标在第一个圆点中【闭合】
            if(Math.abs((x - lasso[0][1].cx) * (x - lasso[0][1].cx)) + Math.abs((y - lasso[0][1].cy) * (y - lasso[0][1].cy)) <= lasso[0][1].r * lasso[0][1].r){
                lasso_close();
            }else{
                var info = c_lasso(lasso);
                is_store({type: 'ANNOTATIONS_LASSO_CREATE',annotation: shapesFactory.lassoLinePath(info[info.length-1][1].cx, info[info.length-1][1].cy, x, y)});
                is_store({type: 'ANNOTATIONS_LASSO_CREATE',annotation: shapesFactory.lassoCirclePath(x, y)});
            }
        } else {
            is_store({type: 'ANNOTATIONS_LASSO_CREATE',annotation: shapesFactory.lassoCirclePath(x, y)});
        }
    }


    //筛选出circle
    function c_lasso(lasso) {
        var info = [];
        for(var i=0;i<lasso.length;i++){
            if(lasso[i][0] == "circle"){
                info.push(lasso[i]);
            }
        }
        return info;
    }

    //convert.js
    var convertWidth = {
        toPercent(horizontalMeasureInPixels) {
            const totalImageWidthInPixels = Store.getWidth();
            if (totalImageWidthInPixels === 0) { return 0; }
            return (horizontalMeasureInPixels * 100) / totalImageWidthInPixels;
        },
        toPixels(horizontalMeasureAsPercentage) {
            const totalImageWidthInPixels = Store.getWidth();
            if (totalImageWidthInPixels === 0) { return 0; }
            return (horizontalMeasureAsPercentage * totalImageWidthInPixels) / 100;
        },
    };

    var convertHeight = {
        toPercent(verticalMeasureInPixels) {
            const totalImageHeightInPixels = Store.getHeight();
            if (totalImageHeightInPixels === 0) { return 0; }
            return (verticalMeasureInPixels * 100) / totalImageHeightInPixels;
        },
        toPixels(verticalMeasureAsPercentage) {
            const totalImageHeightInPixels = Store.getHeight();
            if (totalImageHeightInPixels === 0) { return 0; }
            return (verticalMeasureAsPercentage * totalImageHeightInPixels) / 100;
        },
    };

    //annotations.js：
    const svgProperties = {
        xmlns: 'http://www.w3.org/2000/svg',
        version: '1.1',
        preserveAspectRatio: 'none',
        viewBox: '0 0 100 100',
        width: '100%',
        height: '100%',
    };

    function isVectorEffectSupported() {
        //svg属性，控制svg描边缩放特性,如果vectorEffect不等于undefined则返回【true能用】.等于则返回【false不能用】
        return document.documentElement.style.vectorEffect !== undefined;
    }

    //声明一组对象
    const svgStyles = {
        cursor: 'default',
        'background-color': 'rgba(0,0,0,0)',//背景颜色
    };

    //操作ani中的对象
    var createAnnotations = (function(){
        //h:不知道文件在哪的引用对象，el:不知道是个什么鬼
        let fn = el => preact.h(...el);
        //检查是否可以用vector-effect属性  IE and Edge fix 处理ie
        if (!isVectorEffectSupported()) {
            fn = (el) => {
                const newEl = el;//声明变量
                //stroke-width跳到了Press中的getPath函数中，调用convert中的convertWidth.toPercent方法
                newEl[1]['stroke-width'] = convertWidth.toPercent(3);
                //调用h(传入...newEl)
                return preact.h(...newEl);
            };
        }
        return fn;//统一返回
    })();


    class Annotations extends preact.Component {
        //返回对像store中的annotations{annotations:[值]}
        componentDidMount() {
            // 将addHandler传入openseadragon
            Store.addHandler('CHANGE_EVENT', () => {
                //setState():【方法】不知道是个什么玩意儿，传入一个对象{annotations:[值]}
                this.setState({ annotations: Store.getAll() });
                this.setState({ draw_annotations: Store.drawAll() });
                this.setState({ lasso_annotations: Store.lassoAll() });
            });
        }
        //鼠标离开元素时触发
        handleMouseLeaveUp(e) {
            if (Store.notInMoveMode()) { //如果不等于
                e.stopPropagation();//阻止事件冒泡
                if(e.button===1){
                    release(Store,...this.coords(e));//判断是否为rect,将store中的activityInProgress参数设为false
                }
            }
        }

        handleMouseUp(e){
            if (Store.notInMoveMode()) { //如果不等于
                e.stopPropagation();//阻止事件冒泡
                if(e.button==2){
                    if(Store.getMode() == "LASSO"){
                        lasso_close();
                    }else if(Store.getMode() == "DRAW"){
                        draw_close();
                    }
                }else {
                    release(Store,...this.coords(e));//判断是否为rect,将store中的activityInProgress参数设为false
                }
            }
        }
        //***********************************
        //核心代码，算svg下面d标签中的位置属性
        coords(e) {
            const rect = this.base.getBoundingClientRect();//getBoundingClientRect获取元素相对于视窗的位置集合
            const offsetX = e.clientX - rect.left;//body可视区域x坐标减去元素svg距离左边的距离
            const offsetY = e.clientY - rect.top;//body可视区域y坐标减去元素svg距离上边的距离
            const x = 100 * offsetX / rect.width;//100*上面算出来的offsetX/元素的宽
            const y = 100 * offsetY / rect.height;//100*上面算出来的offsetY/元素的高
            //Math.round：四舍五入
            return [
                Math.round(x * 100) / 100,//上面算出来的x*100/100
                Math.round(y * 100) / 100,//上面算出来的y*100/100
            ];
        }
        //判断Store中的getMode()是否等于'MOVE'，等于则为false,不等于为true
        //画
        handleMouseDown(e) {
            if (Store.notInMoveMode()) { //如果不等于
                e.stopPropagation();//阻止事件冒泡
                //将算出来的d参数坐标传过去
                if(e.buttons==1){
                    press(...this.coords(e), Store);
                }
            }
        }
        stopPropagation(e){
            if (Store.notInMoveMode()) { //如果不等于
                e.stopPropagation();//阻止事件冒泡
            }
        }
        //判断Store中的getMode()是否等于'MOVE'，等于则为false,不等于为true
        //移动
        handleMouseMove(e) {
            if (Store.notInMoveMode()) { //如果不等于
                e.stopPropagation(); //阻止事件冒泡
                //如果值已更新，则返回true，否则返回false
                //移动时判断闭合*************
                move(...this.coords(e), Store);
            }
        }

        //方法
        render() {
            if(!this.state.annotations){this.state.annotations = [];}
            if(!this.state.draw_annotations){this.state.draw_annotations = [];}
            if(!this.state.lasso_annotations){this.state.lasso_annotations = [];}
            return preact.h(
                    'svg',
                    {
                        ...svgProperties,//所有svgProperties的参数
                        style: svgStyles,//样式对象
                        onMouseDown: this.handleMouseDown.bind(this),//鼠标按下时，传入d标签的坐标，【鼠标按下移动】
                        onPointerDown: this.stopPropagation.bind(this),//window属性，初始按下指针设备时将触发该处理器，等同于mousedown事件
                        onMouseLeave: this.handleMouseLeaveUp.bind(this),//鼠标指针离开元素时，触发该事件
                        onMouseMove: this.handleMouseMove.bind(this),//鼠标移入事件
                        onMouseUp: this.handleMouseUp.bind(this),//鼠标松开事件|右击
                        onPointerUp: this.handleMouseLeaveUp.bind(this),//事件处理函数？
                    },
                    this.state.annotations.map(createAnnotations),//应该是返回Annotations数据？？？？？？？？？？不太理解
                    this.state.draw_annotations.map(createAnnotations),//应该是返回Annotations数据？？？？？？？？？？不太理解
                    this.state.lasso_annotations.map(createAnnotations),
                );
        }
    }


    //move.js
    //update
    function move(x, y, Store) {
        switch (Store.getMode()) {
            //如果是rect
            case 'RECT':
                //判断Store中的isActivityInProgress参数
                if (Store.isActivityInProgress()) { // false
                    var last = Store.getLast();//取Store中的annotations最后一个值
                    //如果存在的话
                    if (last && last[0] === 'rect') {
                        point[point.length-1].width = x - point[point.length-1].x;
                        point[point.length-1].height = y - point[point.length-1].y;
                        if(point[point.length-1].width<0||point[point.length-1].height<0){
                            point[point.length-1].width = 0;
                            point[point.length-1].height = 0;
                        }
                        is_store({type: 'ANNOTATIONS_UPDATE_LAST',update: { width: point[point.length-1].width, height: point[point.length-1].height}});
                    }
                }
                break;
            case 'DRAW':
                //判断Store中的isActivityInProgress参数
                if (Store.isActivityInProgress()) { //问题：此参数为false
                    var last = Store.drawLast();//取Store中的annotations最后一个值
                    //如果存在的话
                    if (last && last[0] === 'path') {
                        const d = last[1].d;
                        is_store({type: 'ANNOTATIONS_UPDATE_LAST',update: { d: `${d} L${x} ${y}` }});
                    }
                }
                break;
            case 'LASSO':
                //拖动时有效
                if(Store.isActivityInProgress()){
                    var p = data.lasso_annotations;
                    //使用update方法更新坐标
                    if (!data.juPull) {
                        for(var i=0;i<p.length;i+=2){
                            if(Math.abs((x - p[i][1].cx) * (x - p[i][1].cx)) + Math.abs((y - p[i][1].cy) * (y - p[i][1].cy)) <= p[i][1].r * p[i][1].r){
                                data.juPull = true;//拖动
                                data.curPointIndex = i;//拖动的当前索引
                                is_store({type: 'ANNOTATIONS_LASSO_DRAG',loc: { x:x,y:y}});
                                return;
                            }
                        }
                    }else{
                        is_store({type: 'ANNOTATIONS_LASSO_DRAG',loc: { x:x,y:y}});
                    }
                }
                break;
            default:
                break;
        }
    }

    function this_ani() {
        return data.lasso_annotations.slice(data.lasso_close_idx[data.lasso_close_idx.length-1]+1,data.lasso_annotations.length);
    }

    //main.js
    let isPluginActive = false;
    let openHandler = null;
    let zoomHandler = null;
    let overlay = null;

    function ifPluginIsActive(fn) {
        //回调函数：
        return function checkIfActive(...args) {
            if (!isPluginActive) {
                //error:OpenSeadragon批注插件未运行
                throw new Error('The OpenSeadragon Annotations plugin is not running');
            } else {
                //对该点的每个坐标应用一个函数并返回一个新点。
                return fn.apply(this, args);//openseadragon中的方法
            }
        };
    }

    //初始化
    OpenSeadragon.Viewer.prototype.initializeAnnotations = function init(cb) {
        const updateZoom = e => zoom(e.zoom);
        const start = () => {
            zoomHandler = updateZoom;
            this.addHandler('zoom', updateZoom);
            const bounds = this.world.getHomeBounds();
            //少了个new，svg就不放大了，，，，
            const rect = new OpenSeadragon.Rect(0, 0, bounds.width, bounds.height);
            overlay = preact.render(preact.h(Annotations));
            this.addOverlay(overlay, rect);
            const currentZoom = this.viewport.getZoom();
            const boundingClientRect = overlay.getBoundingClientRect();
            initialize({
                zoom: currentZoom,
                width: boundingClientRect.width,
                height: boundingClientRect.height,
            });
            controls.forEach((control) => {
                this.addControl(control.btn.element, {
                    anchor: OpenSeadragon.ControlAnchor.BOTTOM_LEFT,
                });
            });
            if (openHandler) {
                this.removeHandler('open', openHandler);
                openHandler = null;
            }
            isPluginActive = true;
            if (cb) { cb(); }
        };

        if (isPluginActive) {
            throw new Error('The OpenSeadragon Annotations plugin is already running');
        }
        if (overlay) {
            throw new Error('An existing overlay has been found');
        }
        if (this.isOpen()) {
            start();
        } else {
            //openHandler上面声明的变量，如果
            if (openHandler) {
                this.removeHandler('open', openHandler);
            }
            openHandler = start;
            this.addOnceHandler('open', start);
        }
    };

    //公开的方法 返回isPluginActive的布尔值
    OpenSeadragon.Viewer.prototype.areAnnotationsActive = function areActive() {
        return isPluginActive;
    };

    //公开方法 执行开始部分代码 rect
    OpenSeadragon.Viewer.prototype.startRecting = ifPluginIsActive(function rect() {
        selectMode('RECT', Store);
    });

    //公开方法，执行停止部分代码 move
    OpenSeadragon.Viewer.prototype.stopRecting = ifPluginIsActive(function stoprect() {
        selectMode('MOVE', Store);
    });

    //公开方法，
    OpenSeadragon.Viewer.prototype.shutdownAnnotations = ifPluginIsActive(function shutdown() {
        if (openHandler !== null) {
            // error:已找到“open”事件的未初始化处理程序
            throw new Error('An untriggered handler for the \'open\' event has been found');
        }
        if (overlay === null) {
            // 对SVG覆盖的空引用
            throw new Error('Null reference to the SVG overlay');
        }
        //删除给定事件的特定事件处理程序。zoomHandler变量的初始值为zoomHandler
        this.removeHandler('zoom', zoomHandler);
        zoomHandler = null;
        this.removeOverlay(overlay);
        overlay = null;
        const ourControls = controls;
        const activeControls = this.controls;
        //遍历8个按钮
        activeControls.forEach((viewportControl) => {
            ourControls.forEach((control) => {
                if (viewportControl.element === control.btn.element) {
                    viewportControl.destroy();
                }
            });
        });
        selectMode('MOVE', Store);
        cleanCanvas();
        isPluginActive = false;
    });

    //公开方法：返回annotations的值
    const get = ifPluginIsActive(() => Store.getAll());

    //公开方法：根据传来的参数改变store的值，2组:activityInProgress and annotations
    const set = ifPluginIsActive((annotations) => {
        fillCanvasWith(annotations);
    });

    //根据传来的参数改变store的值，2组:activityInProgress and annotations
    const clean = ifPluginIsActive(() => {
        cleanCanvas();
    });

    //结果：
    var main_info = {
        get, set, clean
    };


    //附加功能 【还剩删除功能】
    function rect_additional() {
        $(".rect p").mouseenter(function () {
            is_store({type: 'ANNOTATIONS_COLOR',update: { idx: $(this).index(),color:"yellow"}});
        });
        $(".rect p").mouseleave(function(){
            is_store({type: 'ANNOTATIONS_COLOR',update: { idx: $(this).index(),color:data.annotations[$(this).index()][2]}});
        });
        $(".rect p input[type=checkbox]").change(function () {
            if($(this)[0].checked){
                is_store({type: 'ANNOTATIONS_CHECK',update: { idx: $(this).parent().index(),opacity:"1"}});
            }else {
                is_store({type: 'ANNOTATIONS_CHECK',update: { idx: $(this).parent().index(),opacity:"0"}});
            }
        });
        $(".rect p input[type=color]").change(function () {
            is_store({type: 'ANNOTATIONS_CHANGE_CHECK',update: { idx: $(this).parent().index(),color:$(this).val()}});
        });
        // .unbind("click"):
        // 当你的点击事件是套在一个事件中的时候，
        // 里面的点击事件会随着外面的事件执行而累积执行。
        // 外部事件执行一次，点击事件就累积一次。
        $(".rect p button").unbind("click").click(function () {
            var idx = $(this).parent().index();
            var info = confirm("确定要删除吗？"+idx);
            if(info){
                is_store({type: 'ANNOTATIONS_DELETE_CHECK',update: { idx: idx}});
                $(".rect p:eq(0)").remove();
            }
        });
    }
    function draw_additional() {
        $(".draw p").mouseenter(function () {
            is_store({type: 'ANNOTATIONS_COLOR',update: { idx: $(this).index(),color:"yellow"}});
        });
        $(".draw p").mouseleave(function(){
            is_store({type: 'ANNOTATIONS_COLOR',update: { idx: $(this).index(),color:data.draw_annotations[$(this).index()][2]}});
        });
        $(".draw p input[type=checkbox]").change(function () {
            if($(this)[0].checked){
                is_store({type: 'ANNOTATIONS_CHECK',update: { idx: $(this).parent().index(),opacity:"1"}});
            }else {
                is_store({type: 'ANNOTATIONS_CHECK',update: { idx: $(this).parent().index(),opacity:"0"}});
            }
        });
        $(".draw p input[type=color]").change(function () {
            is_store({type: 'ANNOTATIONS_CHANGE_CHECK',update: { idx: $(this).parent().index(),color:$(this).val()}});
        });
        $(".draw p button").unbind("click").click(function () {
            var idx = $(this).parent().index();
            var info = confirm("确定要删除吗？"+idx);
            if(info){
                is_store({type: 'ANNOTATIONS_DELETE_CHECK',update: { idx: idx}});
                $(".draw p:eq(0)").remove();
            }
        });
    }
    function lasso_additional() {
        $(".lasso p").mouseenter(function () {
            is_store({type: 'ANNOTATIONS_COLOR',update: { idx: $(this).index(),color:"yellow"}});
        });
        $(".lasso p").mouseleave(function(){
            is_store({type: 'ANNOTATIONS_COLOR',update: { idx: $(this).index(),color:""}});
        });
        $(".lasso p input[type=checkbox]").change(function () {
            if($(this)[0].checked){
                is_store({type: 'ANNOTATIONS_CHECK',update: { idx: $(this).parent().index(),opacity:"1"}});
            }else {
                is_store({type: 'ANNOTATIONS_CHECK',update: { idx: $(this).parent().index(),opacity:"0"}});
            }
        });
        $(".lasso p input[type=color]").change(function () {
            is_store({type: 'ANNOTATIONS_CHANGE_CHECK',update: { idx: $(this).parent().index(),color:$(this).val()}});
        });
        $(".lasso p button").unbind("click").click(function () {
            var idx = $(this).parent().index();
            var info = confirm("确定要删除吗？"+idx);
            if(info){
                is_store({type: 'ANNOTATIONS_DELETE_CHECK',update: { idx: idx}});
                $(".lasso p:eq(0)").remove();
            }
        });
    }
