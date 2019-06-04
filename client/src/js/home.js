APIHOST = (typeof(APIHOST) == 'undefined') ? "" : APIHOST;
let DATA = [];
let IND = null;

window.onload = function() {
    getList();
    setInterval(getStatistics,1000);
}

function getList() {
    fetch(APIHOST + '/systemstatus').then(e => e.json()).then(res => {
        if(res.code == 200) {
            let data = res.data;
            // fillStatic(data);
            let taskpooldata = [data.taskpoolnum, data.taskpoolimagenum, data.taskpoolvideonum];
            let fileinfodata = [data.fileinfoimagenum, data.illegalimage, data.waitimage];
            drawCharts(taskpooldata,fileinfodata);
            document.querySelector('#wxb_home_count').innerHTML = res.count;

            document.querySelector('#wxb_home_table_left tr:nth-of-type(1) td').innerHTML = data.taskpoolvideonum;
            document.querySelector('#wxb_home_table_left tr:nth-of-type(2) td').innerHTML = data.taskpoolimagenum;
            document.querySelector('#wxb_home_table_left tr:nth-of-type(3) td').innerHTML = data.taskpoolnum;
            document.querySelector('#wxb_home_table_right tr:nth-of-type(1) td').innerHTML = data.waitimage;
            document.querySelector('#wxb_home_table_right tr:nth-of-type(2) td').innerHTML = data.illegalimage;
            document.querySelector('#wxb_home_table_right tr:nth-of-type(3) td').innerHTML = data.fileinfoimagenum;
        }
    });
}

function startAudit() {
    console.info('recorder - start time: ', new Date().getTime());
    fetch(APIHOST + '/trigger').then(e => {
        alert('过滤服务已开启 ...');
    });
}

function stopAudit() {
    console.info('recorder - stop time: ', new Date().getTime());
    fetch(APIHOST + '/stopper').then(e => {
        alert('过滤服务已停止 ...');
    });
}

function getStatistics() {
    fetch(APIHOST + '/home/jobstatistic').then(e => e.json()).then(e => {
        document.querySelector('#wxb_home_badcall').innerHTML = e.data.badcall;
        document.querySelector('#wxb_home_legal').innerHTML = e.data.legal;
        document.querySelector('#wxb_home_illegal').innerHTML = e.data.illegal;
    });
}

function drawCharts(taskpooldata,fileinfodata) {
    let taskpoolchart = drawBar('wxb_home_taskpool','TaskPool',['待处理','待处理-图片','待处理-视频'],taskpooldata);
    let fileinfochart = drawBar('wxb_home_taskinfo','Illegal',['机审违规总量', '人审违规图片', '待审图片'],fileinfodata);
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