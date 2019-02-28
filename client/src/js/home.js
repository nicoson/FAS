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
            let taskpooldata = [data.taskpoolnum-data.taskpoollocknum, data.taskpoolimagenum, data.taskpoolvideonum, data.taskpoollocknum];
            let fileinfodata = [data.fileinfonum, data.fileinfoimagenum, data.fileinfovideonum, data.fileinforeviewtruenum, data.fileinforeviewtrueimagenum, data.fileinforeviewtruevideonum, data.fileinforeviewnum, data.fileinforeviewimagenum, data.fileinforeviewvideonum];
            let filemetadata = [data.filemetanum, data.filemetaimagenum, data.filemetavideonum, data.filemetaipnum];
            drawCharts(taskpooldata,fileinfodata,filemetadata);
        }
    });
}

function drawCharts(taskpooldata,fileinfodata,filemetadata) {
    let taskpoolchart = drawBar('wxb_home_taskpool','TaskPool',['待处理','待处理-图片','待处理-视频','处理中'],taskpooldata);
    let fileinfochart = drawBar('wxb_home_taskinfo','FileInfo',['总量', '总量-图片', '总量-视频', '已人工审核涉嫌违规', '已人工审核涉嫌违规-图片', '已人工审核涉嫌违规-视频','待人工审核','待人工审核-图片','待人工审核-视频'],fileinfodata);
    let filemetachart = drawBar('wxb_home_taskmeta','FileMeta',['总量', '总量-图片', '总量-视频','独立IP数量'],filemetadata);
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