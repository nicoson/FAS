APIHOST = (typeof(APIHOST) == 'undefined') ? "" : APIHOST;
let DATA = [];
let IND = null;

window.onload = function() {
    getList();
    getStatistics();
    getDropRatio();
    setInterval(getStatistics, 3000);
}

function getList() {
    fetch(APIHOST + '/systemstatus').then(e => e.json()).then(res => {
        if(res.code == 200) {
            let data = res.data;
            // fillStatic(data);
            let taskpooldata = [data.taskpoolNum, data.taskpoolImageNum, data.taskpoolVideoNum];
            let imageData = [data.allIllegalImageNum, data.auditIllegalImageNum, data.rawIllegalImageNum];
            let videoData = [data.allIllegalVideoNum, data.auditIllegalVideoNum, data.rawIllegalVideoNum];
            drawCharts(taskpooldata,imageData,videoData);
            document.querySelector('#wxb_home_image_count').innerHTML = res.count.IMGCOUNT;
            document.querySelector('#wxb_home_video_count').innerHTML = res.count.VIDCOUNT;

            document.querySelector('#wxb_home_table_left tr:nth-of-type(1) td').innerHTML = data.taskpoolVideoNum;
            document.querySelector('#wxb_home_table_left tr:nth-of-type(2) td').innerHTML = data.taskpoolImageNum;
            document.querySelector('#wxb_home_table_left tr:nth-of-type(3) td').innerHTML = data.taskpoolNum;
            document.querySelector('#wxb_home_table_middle tr:nth-of-type(1) td').innerHTML = data.rawIllegalImageNum;
            document.querySelector('#wxb_home_table_middle tr:nth-of-type(2) td').innerHTML = data.auditIllegalImageNum;
            document.querySelector('#wxb_home_table_middle tr:nth-of-type(3) td').innerHTML = data.allIllegalImageNum;
            document.querySelector('#wxb_home_table_right tr:nth-of-type(1) td').innerHTML = data.rawIllegalVideoNum;
            document.querySelector('#wxb_home_table_right tr:nth-of-type(2) td').innerHTML = data.auditIllegalVideoNum;
            document.querySelector('#wxb_home_table_right tr:nth-of-type(3) td').innerHTML = data.allIllegalVideoNum;
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

function getDropRatio() {
    fetch(APIHOST + '/home/getratio').then(e => e.json()).then(data => {
        document.querySelector('#wxb_home_input_imgdropratio').value = data.imgdropratio;
        document.querySelector('#wxb_home_input_viddropratio').value = data.viddropratio;
    });
}

function setDropRatio(event) {
    console.info('setting drop ratio: ', new Date().getTime());
    let imgdropratio = parseFloat(document.querySelector('#wxb_home_input_imgdropratio').value).toFixed(2);
    let viddropratio = parseFloat(document.querySelector('#wxb_home_input_viddropratio').value).toFixed(2);
    imgdropratio = (imgdropratio > 1) ? 1 : ((imgdropratio < 0) ? 0 : imgdropratio);
    viddropratio = (viddropratio > 1) ? 1 : ((viddropratio < 0) ? 0 : viddropratio);

    postBody.body = JSON.stringify({
        imgdropratio: imgdropratio,
        viddropratio: viddropratio
    });
    fetch(APIHOST + '/home/setratio', postBody).then(e => {
        alert('随机丢弃率设置成功');
    });
}

function getStatistics() {
    fetch(APIHOST + '/home/jobstatistic').then(e => e.json()).then(e => {
        document.querySelector('#wxb_home_image_count').innerHTML = e.data.total.IMGCOUNT;
        document.querySelector('#wxb_home_image_badcall').innerHTML = e.data.img.badcall;
        document.querySelector('#wxb_home_image_legal').innerHTML = e.data.img.legal;
        document.querySelector('#wxb_home_image_illegal').innerHTML = e.data.img.illegal;
        document.querySelector('#wxb_home_video_count').innerHTML = e.data.total.VIDCOUNT;
        document.querySelector('#wxb_home_video_badcall').innerHTML = e.data.video.badcall;
        document.querySelector('#wxb_home_video_legal').innerHTML = e.data.video.legal;
        document.querySelector('#wxb_home_video_illegal').innerHTML = e.data.video.illegal;
    });
}

function drawCharts(taskpooldata,imageData,videoData) {
    let taskpoolchart = drawBar('wxb_home_taskpool','计算任务列表',['待处理','待处理-图片','待处理-视频'],taskpooldata);
    let imageChart = drawBar('wxb_home_imageinfo','图片',['机审违规总量', '人审违规图片', '待审图片'],imageData);
    let videoChart = drawBar('wxb_home_videoinfo','视频',['机审违规总量', '人审违规图片', '待审图片'],videoData);
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