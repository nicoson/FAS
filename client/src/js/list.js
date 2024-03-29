APIHOST = (typeof(APIHOST) == 'undefined') ? '' : APIHOST;
let DATA = [];
let CLASSOPTION = new Set();
let DETECTOPTION = new Set();
let ITEMS = {};
let PAGENUM = 0;
let PAGESIZE = 10;
let isScroll = true;    //  控制下拉加载

window.onload = function() {
    setTimeout(init, 1);
}

function init() {
    let range = 7;
    let startDate = new Date();
    let endDate = getDateString(new Date());
    startDate = getDateString(new Date(startDate.setDate(startDate.getDate() - range)));
    document.querySelector('#wa_list_table_datefrom').value = startDate;
    document.querySelector('#wa_list_table_dateto').value = endDate;
    getTableList(false);
    getFilterItem();
}

function getFilterItem() {
    let url = APIHOST + '/getillegalclass';
    fetch(url).then(e => e.json()).then(data => {
        // console.log(data);
        OPTIONS = data;
        let sceneTemp = '';
        let objectTemp = '';
        for(let item in data.classItem) {
            sceneTemp += `<div><label for="wa_list_scene_option_${item}"><input id="wa_list_scene_option_${item}" type="checkbox" data-option="${item}" onchange="sceneOptionChange(event)" />${data.classItem[item]}</label></div>`
        }
        for(let item in data.detectItem) {
            objectTemp += `<div><label for="wa_list_object_option_${item}"><input id="wa_list_object_option_${item}" type="checkbox" data-option="${item}" onchange="objectOptionChange(event)" />${data.detectItem[item]}</label></div>`
        };
        ITEMS = Object.assign(data.classItem, data.detectItem);
        document.querySelector('#wa_list_scene_option_container').innerHTML = sceneTemp;
        document.querySelector('#wa_list_object_option_container').innerHTML = objectTemp;
    });
}

function getTableList(isAppend = false) {
    toggleLoadingModal();
    requestIllegalData().then(res => {
        if(res.code == 200) {
            let ele = document.querySelector('#wa_list_table');
            fillListTable(ele, res.data, isAppend);
            if(isAppend) {
                DATA.push(res.data);
            } else {
                DATA = res.data;
            }
            if(res.data.length == 0) {
                isScroll = false;
            } else {
                isScroll = true;
            }
            document.querySelector('#wa_list_result_num span').innerHTML = res.num;
        }
        toggleLoadingModal();
    });
}

function requestIllegalData() {
    let startDate = document.querySelector('#wa_list_table_datefrom').value;
    let endDate = document.querySelector('#wa_list_table_dateto').value;
    let md5 = document.querySelector("#wa_list_table_filter_md5").value.trim();
    let filetype = document.querySelector('[name=wa_list_table_filter_type]:checked').dataset.value;
    let url = APIHOST + '/getillegaldata';
    postBody.body = JSON.stringify({
        startDate: startDate,
        endDate: endDate,
        md5: md5,
        classifyOption: [...CLASSOPTION],
        detectOption: [...DETECTOPTION],
        filetype: filetype,
        page: PAGENUM,
        pagesize: PAGESIZE
    });
    return new Promise(function(resolve, reject) {
        fetch(url, postBody).then(e => e.json()).then(function(res) {
            resolve(res);
        }).catch(err => reject(err));
    });
}

document.querySelector('section').addEventListener('scroll', function(e) {
    if(isScroll && e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 200) {
        console.log('loading ...');
        isScroll = false;
        PAGENUM++;
        getTableList(true);
    }
});

function getFileMeta(ele, md5) {
    let url = APIHOST + '/getfilemeta';
    postBody.body = JSON.stringify({
        md5: md5
    });
    toggleLoadingModal();
    fetch(url, postBody).then(e => e.json()).then(res => {
        if(res.code == 200) {
            fillSubTable(ele, res.data);
        }
        toggleLoadingModal();
    });
}

function fillListTable(ele, data, isAppend=false) {
    let list = isAppend ? '' : `<tr class="wa-list-table-tr-main">
                                    <th>序号</th>
                                    <th>查处日期</th>
                                    <th>文件</th>
                                    <th>md5</th>
                                    <th>文件类型</th>
                                    <th>来源</th>
                                    <th>涉嫌违规场景</th>
                                    <th>置信度</th>
                                    <th>IP端口</th>
                                </tr>`;
    for(let i in data) {
        list += `<tr class="wa-list-table-tr-main" data-ind=${i}>
                    <td>${PAGENUM*PAGESIZE + Number(i) + 1}</td>
                    <td>${new Date(data[i].audit_date).toLocaleDateString()}</td>
                    <td>
                        <a href="${data[i].uri}" target="_blank" onclick="showContent(event)">
                            <img src="${(typeof(data[i].message)=='undefined') ? data[i].uri : data[i].message.cover}">
                        </a>
                    </td>
                    <td><p>${data[i].md5}</p></td>
                    <td>${fileTypeMap(data[i].type)}</td>
                    <td>${fileSourceMap(data[i].source)+fileIconDom(data[i].source)}</td>
                    <td>${data[i].ops.wangan_mix.labels.length == 0 ? '' : [...(new Set(data[i].ops.wangan_mix.labels.map(item => {return ITEMS[item.label]})))].join(',')}</td>
                    <td>${data[i].ops.wangan_mix.labels.length == 0 ? '' : (data[i].ops.wangan_mix.labels[0].score*100).toFixed(2)}%</td>
                    <td>${data[i].up_address}</td>
                </tr>
                <tr class="component-hidden"></tr>`;
    }
    if(isAppend) {
        ele.innerHTML += list;
    } else {
        ele.innerHTML = list;
    }
}

function fillSubTable(ele, data) {
    let temp = `<td colspan=15 class="wa-list-table-extendpanel">
                    <div>
                        <table class="wa-list-subtable-metalist">
                            <tr>
                                <th>序号</th>
                                <th>查处日期</th>
                                <th>涉事IP</th>
                                <th>端口号</th>
                            </tr>`;
    data.map((datum, ind) => {
        temp +=             `<tr>
                                <td>${ind+1}</td>
                                <td>${getFullTime(new Date(datum.create))}</td>
                                <td>${datum.meta.ip}</td>
                                <td>${datum.meta.port}</td>
                            </tr>`
    })

    temp +=             `</table>
                    </div>
                </td>`;

    ele.innerHTML = temp;
}

function getDateString(day) {
    return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)}`;
}

function getFullTime(time) {
    let day = new Date(time)
    return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)} ${(day.getHours()+100).toString().slice(1)}:${(day.getMinutes()+100).toString().slice(1)}:${(day.getSeconds()+100).toString().slice(1)}`;
}

function toggleTableRow(event) {
    // console.log(event);
    let res = event.target.closest('tr').nextElementSibling.classList.toggle('component-hidden');
    // console.log(res)
    if(!res) {
        let md5 = DATA[event.target.closest('tr').dataset.ind].md5;
        getFileMeta(event.target.closest('tr').nextElementSibling, md5);
    }
}

function toggleLoadingModal() {
    document.querySelector('.wa-modal-loading').classList.toggle('component-hidden');
}

function reloadData() {
    PAGENUM = 0;
    isScroll = true;
    getTableList(false);
}

function isCompany(type, status) {
    if(status == 4 || status == 5) {
        return false;
    } else if(type == 1 || type == 2) {
        return false;
    } else if(type == 0 && status == 0) {
        return false;
    } else {
        return true;
    }
}

function sceneOptionChange(event) {
    // console.log(event);
    if(event.target.checked) {
        CLASSOPTION.add(event.target.dataset['option']);
    } else {
        CLASSOPTION.delete(event.target.dataset['option']);
    }    
}

function objectOptionChange(event) {
    if(event.target.checked) {
        DETECTOPTION.add(event.target.dataset['option']);
    } else {
        DETECTOPTION.delete(event.target.dataset['option']);
    }
}

function showContent(event) {
    event.stopPropagation();
}

function fileTypeMap(type) {
    switch(type) {
        case 1:
            return '图片';
        case 2:
            return '视频';
        case 3:
            return '音频';
    }
}

function fileSourceMap(source) {
    switch(source) {
        case 1:
            return '七牛云存储';
        case 2:
            return '新浪微博';
        case 3:
            return '抖音';
        case 4:
            return '秒拍';
    }
}

function fileIconDom(source) {
    let filename = '';
    switch(source) {
        case 1:
            filename = 'qiniu_favicon.ico';
            break;
        case 2:
            filename = 'sina_favicon.png';
            break;
        case 3:
            filename = 'douyin_favicon.ico';
            break;
        case 4:
            filename = 'miaopai_favicon.ico';
            break;
    }
    return `<img class="fas-list-table-icon" src="/imgs/favicon/${filename}" />`;
}