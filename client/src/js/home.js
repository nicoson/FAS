APIHOST = (typeof(APIHOST) == 'undefined') ? "" : APIHOST;
let DATA = [];
let IND = null;

window.onload = function() {
    getList();
}

function getList() {
    fetch(APIHOST + '/systemstatus').then(e => e.json()).then(res => {
        if(res.code == 200) {
            let data = res.data;
            // fillStatic(data);
            let taskpooldata = [data.taskpoolnum, data.taskpoolimagenum, data.taskpoolvideonum];
            let fileinfodata = [data.fileinfonum, data.fileinfoimagenum, data.fileinfovideonum];
            drawCharts(taskpooldata,fileinfodata);
        }
    });
}

function startAudit() {
    fetch(APIHOST + '/trigger').then(e => {
        alert('过滤服务已开启 ...');
    });
}

function stopAudit() {
    fetch(APIHOST + '/stopper').then(e => {
        alert('过滤服务已停止 ...');
    });
}

function drawCharts(taskpooldata,fileinfodata) {
    let taskpoolchart = drawBar('wxb_home_taskpool','TaskPool',['待处理','待处理-图片','待处理-视频'],taskpooldata);
    let fileinfochart = drawBar('wxb_home_taskinfo','Illegal',['违规总量', '违规图片', '违规视频'],fileinfodata);
}

function drawBar(ele,title,label,data) {
    var dom = document.getElementById(ele);
    var myChart = echarts.init(dom);
    var app = {};
    let option = null;
    app.title = title;
    
    option = {
        title: [
            // {
            //     text: 'xxx',
            //     textAlign: 'center',
            //     left: '63%',
            //     top: '55%',
            //     textStyle: {
            //         fontSize: 100,
            //         color: 'rgba(255, 255, 255, 0.7)'
            //     }
            // }, 
            {
            text: title,
            left: 'center',
            top: 10,
            textStyle: {
                color: '#aaa',
                fontWeight: 'normal',
                fontSize: 20
            }
        }],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        // legend: {
        //     data: ['2011年', '2012年']
        // },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            // type: 'log',
            type: 'value',
            boundaryGap: [0, 0.01],
            // max: 10000000,
            axisLine: {
                lineStyle: {
                    color: '#ccc'
                }
            }
        },
        yAxis: {
            type: 'category',
            data: label,
            axisLine: {
                lineStyle: {
                    color: '#ccc'
                }
            }
        },
        series: [
            {
                name: '数量',
                type: 'bar',
                data: data
            }
        ]
    };;
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
    return {
        chart: myChart,
        option: option
    };
}