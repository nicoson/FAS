APIHOST = (typeof(APIHOST) == 'undefined') ? '' : APIHOST;
let SETTINGS = localStorage.settings ? JSON.parse(localStorage.settings) : {size:30,defaultClass:'normal',font:3,classoption:[],detectoption:[],filetype:'image'};
SETTINGS.size = parseInt(SETTINGS.size);
SETTINGS.font = parseInt(SETTINGS.font);
SETTINGS.filetype = (typeof(SETTINGS.filetype) != 'undefined') ? SETTINGS.filetype : 'image';
let DATA = [];
let USER = {};
let CLASSOPTION = new Set(SETTINGS.classoption);
let DETECTOPTION = new Set(SETTINGS.detectoption);
let ITEMS = {};

window.onload = function() {
    setTimeout(init, 1);
}

function init() {
    // let range = 7;
    // let startDate = new Date();
    // let endDate = getDateString(new Date());
    // startDate = getDateString(new Date(startDate.setDate(startDate.getDate() - range)));
    // document.querySelector('#wa_list_table_datefrom').value = startDate;
    // document.querySelector('#wa_list_table_dateto').value = endDate;
    setSettingBar();
    getFilterItem();
    getTableList();
}

function getFilterItem() {
    let url = APIHOST + '/getillegalclass';
    fetch(url).then(e => e.json()).then(data => {
        // console.log(data);
        OPTIONS = data;
        let sceneTemp = '';
        let objectTemp = '';
        for(let item in data.classItem) {
            sceneTemp += `<div><label for="wa_list_scene_option_${item}"><input id="wa_list_scene_option_${item}" type="checkbox" data-option="${item}" onchange="sceneOptionChange(event)" ${CLASSOPTION.has(item) ? 'checked':''}/>${data.classItem[item]}</label></div>`
        }
        for(let item in data.detectItem) {
            objectTemp += `<div><label for="wa_list_object_option_${item}"><input id="wa_list_object_option_${item}" type="checkbox" data-option="${item}" onchange="objectOptionChange(event)" ${DETECTOPTION.has(item) ? 'checked':''} />${data.detectItem[item]}</label></div>`
        };
        ITEMS = Object.assign(data.classItem, data.detectItem);
        document.querySelector('#wa_list_scene_option_container').innerHTML = sceneTemp;
        document.querySelector('#wa_list_object_option_container').innerHTML = objectTemp;
    });
}

function getTableList() {
    let url = APIHOST + '/rawdata';
    postBody.body = JSON.stringify({
        size: parseInt(SETTINGS.size),
        mimeType: SETTINGS.filetype,
        classifyOption: [...CLASSOPTION],
        detectOption: [...DETECTOPTION]
    });
    toggleLoadingModal();
    // setSettingBar();
    fetch(url, postBody).then(e => e.json()).then(data => {
        console.log(data);
        if(data.code == 200) {
            document.querySelector('section').scrollTop = 0;
            fillCardList(data.data);
            DATA = data.data;
            SETTINGS.defaultClass == 'normal' ? illegalSet(false) : illegalSet(true);
            document.querySelector('#wa_list_result_num span').innerHTML = data.num;
        }
        
        toggleLoadingModal();
    });
}

function setSettingBar() {
    document.querySelector('#wa_list_setting_size').value = SETTINGS.size;
    document.querySelector(`#wa_list_table_filter_type_${SETTINGS.filetype}`).checked = true;
    
    if(SETTINGS.defaultClass == 'normal') {
        document.querySelector('#wa_list_setting_defaultclass_normal').checked = true;
    } else {
        document.querySelector('#wa_list_setting_defaultclass_abnormal').checked = true;
    }
}

function fillCardList(data) {
    let tmp = '';
    data.map((datum, ind) => {
        let thumb = '';
        if(datum.type == 1) {
            thumb = '<img src="' + datum.uri + '" alt="">';
        } else if(typeof(datum.message) == 'undefined') {
            thumb = '<video src="' + datum.uri + '">';
        } else {
            thumb = '<img src="' + datum.message.cover + '" alt="">';
        }
        tmp += `<div class="wa-list-card ${SETTINGS.defaultClass == 'normal' ? '':'wa-list-card-abnormal'}" onclick="toggleClass(event)" data-index=${ind}>
                    <div class="wa-list-card-frame wa-list-card-frame-size-${SETTINGS.font}">
                        <a href="${datum.uri}" onclick="showContent(event)" target="_blank">
                            ${thumb}
                        </a>
                    </div>
                    <div class="wa-list-card-result">
                        <table>
                            <tr>
                                <td>文件来源：</td>
                                <td>${fileSourceMap(datum.source)+fileIconDom(datum.source)}</td>
                            </tr>
                            <tr>
                                <td>检出方法：</td>
                                <td>模型</td>
                            </tr>
                            <tr>
                                <td>文件类型：</td>
                                <td>${fileTypeMap(datum.type)}</td>
                            </tr>
                            <tr>
                                <td>违规场景：</td>
                                <td>${datum.ops.wangan_mix.labels.length == 0 ? '' : [...(new Set(datum.ops.wangan_mix.labels.map(item => {return ITEMS[item.label]})))].join(',')}</td>
                            </tr>
                            <tr>
                                <td>置信度：</td>
                                <td>${datum.ops.wangan_mix.labels.length == 0 ? '' : (datum.score*100).toFixed(2)}%</td>
                            </tr>
                        </table>
                    </div>
                </div>`
    });
    document.querySelector('#wa_list_table_container').innerHTML = tmp;
    document.querySelector('#wa_list_submit button').dataset['mimeType'] = SETTINGS.filetype;
}


function toggleClass(event) {
    event.target.closest('.wa-list-card').classList.toggle('wa-list-card-abnormal');
    DATA[event.target.closest('.wa-list-card').dataset.index].illegal = !DATA[event.target.closest('.wa-list-card').dataset.index].illegal;
    DATA[event.target.closest('.wa-list-card').dataset.index].manualreview = !DATA[event.target.closest('.wa-list-card').dataset.index].manualreview;
    // console.log(event);
}

function getDateString(day) {
    return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)}`;
}

function toggleLoadingModal() {
    document.querySelector('.wa-modal-loading').classList.toggle('component-hidden');
}

function resetRuleSearch() {
    let size = document.querySelector('#wa_list_setting_size').value.trim();
    let filetype = document.querySelector('[name=wa_list_table_filter_type]:checked').dataset.value;
    let defaultClass = document.querySelector('#wa_list_setting_defaultclass_normal').checked ? 'normal':'abnormal';
    localStorage.settings = JSON.stringify({
        size: size,
        defaultClass: defaultClass,
        font: SETTINGS.font,
        classoption: [...CLASSOPTION],
        detectoption: [...DETECTOPTION],
        filetype: filetype
    });
    SETTINGS.size = size;
    SETTINGS.filetype = filetype;
    SETTINGS.defaultClass = defaultClass;

    getTableList();
}

function resetNormal() {
    document.querySelectorAll('.wa-list-card').forEach(element => {
        element.classList.remove('wa-list-card-abnormal');
    });
    illegalSet(false);
}

function resetIllegal() {
    document.querySelectorAll('.wa-list-card').forEach(element => {
        element.classList.add('wa-list-card-abnormal');
    });
    illegalSet(true);
}

function illegalSet(value) {
    DATA.map(datum => {
        datum.manualreview = value;
        datum.illegal = value;
    });
}

function auditSubmit() {
    if(DATA.length == 0) return;

    let url = APIHOST + '/submitauditdata';
    postBody.body = JSON.stringify({
        mimeType: document.querySelector('#wa_list_submit button').dataset.mimeType,
        data: DATA
    });
    toggleLoadingModal();
    fetch(url, postBody).then(e => e.json()).then(data => {
        console.log(data);
        if(data.code == 200) {
            getTableList();
        }
        toggleLoadingModal();
    });
}

function stretchImg() {
    if(SETTINGS.font == 5) return;
    SETTINGS.font++;
    document.querySelectorAll('.wa-list-card-frame').forEach(ele => {
        ele.classList.remove('wa-list-card-frame-size-1','wa-list-card-frame-size-2','wa-list-card-frame-size-3','wa-list-card-frame-size-4','wa-list-card-frame-size-5');
        ele.classList.add(`wa-list-card-frame-size-${SETTINGS.font}`);
    });
}

function shrinkImg() {
    if(SETTINGS.font == 1) return;
    SETTINGS.font--;
    document.querySelectorAll('.wa-list-card-frame').forEach(ele => {
        ele.classList.remove('wa-list-card-frame-size-1','wa-list-card-frame-size-2','wa-list-card-frame-size-3','wa-list-card-frame-size-4','wa-list-card-frame-size-5');
        ele.classList.add(`wa-list-card-frame-size-${SETTINGS.font}`);
    });
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
    return `<img src="/imgs/favicon/${filename}" />`;
}