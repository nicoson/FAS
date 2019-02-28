
window.onload = function() {
    setTimeout(init, 1);
}

class tableList {
    constructor(ele) {
        this.APIHOST = (typeof(APIHOST) == 'undefined') ? '' : APIHOST;
        this.DATA = [];
        this.USER = {};

        this.init();
    }

    init() {
        let range = 7;
        let startDate = new Date();
        let endDate = this.getDateString(new Date());
        startDate = this.getDateString(new Date(startDate.setDate(startDate.getDate() - range)));
        document.querySelector('#wa_list_table_datefrom').value = startDate;
        document.querySelector('#wa_list_table_dateto').value = endDate;
        this.getTableList(startDate, endDate);
    }

    getDateString(day) {
        return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)}`;
    }

    getFullTime(time) {
        let day = new Date(time)
        return `${day.getFullYear()}-${(day.getMonth()+101).toString().slice(1)}-${(day.getDate()+100).toString().slice(1)} ${(day.getHours()+100).toString().slice(1)}:${(day.getMinutes()+100).toString().slice(1)}:${(day.getSeconds()+100).toString().slice(1)}`;
    }

    isCompany(type, status) {
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

    getTableList(startDate, endDate) {
        let url = this.APIHOST + '/getalldetail';
        postBody.body = JSON.stringify({
            startDate: startDate,
            endDate: endDate
        });
        toggleLoadingModal();
        fetch(url, postBody).then(e => e.json()).then(data => {
            if(data.list == undefined) {
                this.DATA = data.reverse();
            } else {
                this.DATA = data.list.reverse();
            }
            this.USER = data.user;
            this.fillListTable(DATA);
            document.querySelector('#wa_list_result_num span').innerHTML = this.DATA.length;
            this.genExportTable(this.DATA);
            toggleLoadingModal();
        });
    }

    fillListTable(data) {
        let list = `<tr class="wa-list-table-tr-main">
                        <th>序号</th>
                        <th>查处日期</th>
                        <th>文件名</th>
                        <th>文件类型</th>
                        <th>涉嫌违规类型</th>
                        <th>上传日期</th>
                        <th>上传IP</th>
                        <th>端口号</th>
                        <th>用户账号</th>
                    </tr>`;
    
        for(let i in data) {
            list += `<tr class="wa-list-table-tr-main" onclick="tableList.toggleTableRow(event)" data-ind="${i}">
                        <td>${Number(i)+1}</td>
                        <td>${data[i].updated_at.slice(0,19).replace('T', ' ')}</td>
                        <td><p>${data[i].filename}</p></td>
                        <td>${data[i].mimeType}</td>
                        <td>${data[i].type}</td>
                        <td>${this.getFullTime(data[i].putTime/10000)}</td>
                        <td>${data[i].ip.split(':')[0]}</td>
                        <td>${(data[i].ip.split(':')[1] == undefined) ? '' : data[i].ip.split(':')[1]}</td>
                        <td>${data[i].owner}</td>
                    </tr>
                    <tr class="component-hidden"></tr>
                    `;
        }
        document.querySelector('#wa_list_table').innerHTML = list;
    }

    genExportTable(data) {
        let temp = `<tbody>
                        <tr>
                            <th>序号</th>
                            <th>查处日期</th>
                            <th>md5</th>
                            <th>etag</th>
                            <th>文件名</th>
                            <th>外链Domain</th>
                            <th>外链key</th>
                            <th>文件类型</th>
                            <th>涉嫌违规类型</th>
                            <th>上传日期</th>
                            <th>上传IP</th>
                            <th>端口号</th>
                            <th>用户账号</th>
                            
                            <th>名称</th>
                            <th>联系电话</th>
                            <th>email</th>
                            <th>注册时间</th>
                            <th>注册IP</th>
                            <th>注册城市</th>
                            <th>国家</th>
                            <th>账号类型</th>
                            <th>公司名称</th>
                            <th>社会信用号</th>
                            <th>注册地址</th>
                        </tr>`;
        for(let i in data) {
            temp +=     `<tr>
                            <td>${Number(i)+1}</td>
                            <td>${data[i].updated_at.slice(0,19).replace('T', ' ')}</td>
                            <td>${data[i].md5}</td>
                            <td>${data[i].hash}</td>
                            <td>${data[i].filename}</td>
                            <td>${data[i].domains.join(';')}</td>
                            <td>${data[i].key}</td>
                            <td>${data[i].mimeType}</td>
                            <td>${data[i].type}</td>
                            <td>${this.getFullTime(data[i].putTime/10000)}</td>
                            <td>${data[i].ip.split(':')[0]}</td>
                            <td>${(data[i].ip.split(':')[1] == undefined) ? '' : data[i].ip.split(':')[1]}</td>
                            <td>${data[i].owner}</td>
    
                            <td>${this.USER[data[i].owner].DeveloperInfo.fullName}</td>
                            <td>'${this.USER[data[i].owner].DeveloperInfo.phoneNumber}</td>
                            <td>${this.USER[data[i].owner].DeveloperInfo.email}</td>
                            <td>${(new Date(USER[data[i].owner].DeveloperInfo.createAt/1000000)).toJSON().slice(0,-5).replace('T', ' ')}</td>
                            <td>${this.USER[data[i].owner].DeveloperInfo.registerIp}</td>
                            <td>${this.USER[data[i].owner].DeveloperInfo.registerCity}</td>
                            <td>${this.USER[data[i].owner].DeveloperInfo.registerState}</td>
                            <td>${this.isCompany(this.USER[data[i].owner].IdentityInfo.type, USER[data[i].owner].IdentityInfo.status)?'企业':'个人'}</td>
                            <td>${this.USER[data[i].owner].IdentityInfo.enterprise_name}</td>
                            <td>'${this.USER[data[i].owner].IdentityInfo.enterprise_code}</td>
                            <td>${this.USER[data[i].owner].IdentityInfo.contact_address}</td>
                        </tr>`;
        }
        document.querySelector('#wa_list_table_export').innerHTML = temp + '</tbody>';
    }

    static toggleTableRow(event) {
        // console.log(event);
        let res = event.target.closest('tr').nextElementSibling.classList.toggle('component-hidden');
        // console.log(res)
        if(!res) {
            let info = DATA[event.target.closest('tr').dataset.ind];
            this.getUserInfo(event.target.closest('tr').nextElementSibling, info);
        }
    }
}


function getUserInfo(ele, info) {
    let url = APIHOST + '/getbyuid';
    postBody.body = JSON.stringify({
        userinfo: info.owner
    });
    toggleLoadingModal();
    fetch(url, postBody).then(e => e.json()).then(data => {
        console.log(data);
        fillSubTable(ele, data, info);
        toggleLoadingModal();
    });
}


function fillSubTable(ele, datum, info) {
    let temp = '';
    temp = `<td colspan=15 class="wa-list-table-extendpanel">
                <div>
                    <table class="wa-list-subtable-userinfo">
                        <tr><th>md5</th><td>${info.md5}</td></tr>
                        <tr><th>etag</th><td>${info.hash}</td></tr>
                        <tr><th>名称</th><td>${datum.DeveloperInfo.fullName}</td></tr>
                        <tr><th>外链Domain</th><td>${info.domains.join('; \n')}</td></tr>
                        <tr><th>外链key</th><td>${info.key}</td></tr>
                        <tr><th>联系电话</th><td>${datum.DeveloperInfo.phoneNumber}</td></tr>
                        <tr><th>email</th><td>${datum.DeveloperInfo.email}</td></tr>
                        <tr><th>注册时间</th><td>${(new Date(datum.DeveloperInfo.createAt/1000000)).toJSON().slice(0,-5).replace('T', ' ')}</td></tr>
                        <tr><th>注册IP</th><td>${datum.DeveloperInfo.registerIp}</td></tr>
                        <tr><th>注册城市</th><td>${datum.DeveloperInfo.registerCity}</td></tr>
                        <tr><th>国家</th><td>${datum.DeveloperInfo.registerState}</td></tr>`
    if(isCompany(datum.IdentityInfo.type, datum.IdentityInfo.status)) {
        temp +=         `<tr><th>账号类型</th><td>企业</td></tr>
                        <tr><th>公司名称</th><td>${datum.IdentityInfo.enterprise_name}</td></tr>
                        <tr><th>社会信用号</th><td>${datum.IdentityInfo.enterprise_code}</td></tr>
                        <tr><th>注册地址</th><td>${datum.IdentityInfo.contact_address}</td></tr>
        `
    } else {
        temp +=         `<tr><th>账号类型</th><td>个人</td></tr>`
    }

    temp += `       </table>
                    <table class="wa-list-table-subtable-loginfo">
                        <tr>
                            <th>最近登陆时间</th>
                            <th>最近登陆IP</th>
                            <th>操作</th>
                        </tr>`
    
    for(let i in datum.OpLogs) {
        temp += `<tr>
                    <td>${datum.OpLogs[i].time.slice(0,19).replace('T',' ')}</td>
                    <td>${datum.OpLogs[i].remote_addr}</td>
                    <td>${datum.OpLogs[i].op}</td>
                </tr>`
    }

    temp += `</table>
            </div>
            </td>`

    ele.innerHTML = temp;
}







function toggleLoadingModal() {
    document.querySelector('.wa-modal-loading').classList.toggle('component-hidden');
}

function reloadData() {
    let startDate = document.querySelector('#wa_list_table_datefrom').value;
    let endDate = document.querySelector('#wa_list_table_dateto').value;
    getTableList(startDate, endDate);
}




/*==========================================*\
   excel export component: use filesaver.js
\*==========================================*/
var idTmr;
//获取当前浏览器类型
function getExplorer() {
    var explorer = window.navigator.userAgent;
    //ie
    if (explorer.indexOf("MSIE") >= 0) {
        return 'ie';
    }
    //firefox
    else if (explorer.indexOf("Firefox") >= 0) {
        return 'Firefox';
    }
    //Chrome
    else if(explorer.indexOf("Chrome") >= 0){
        return 'Chrome';
    }
    //Opera
    else if(explorer.indexOf("Opera") >= 0){
        return 'Opera';
    }
    //Safari
    else if(explorer.indexOf("Safari") >= 0){
        return 'Safari';
    }
}
  
//获取到类型需要判断当前浏览器需要调用的方法，目前项目中火狐，谷歌，360没有问题
function exportExcel(tableid) {
    if(getExplorer()=='ie') {
        var curTbl = document.getElementById(tableid);
        var oXL = new ActiveXObject("Excel.Application");
        var oWB = oXL.Workbooks.Add();
        var xlsheet = oWB.Worksheets(1);
        var sel = document.body.createTextRange();
        sel.moveToElementText(curTbl);
        sel.select();
        sel.execCommand("Copy");
        xlsheet.Paste();
        oXL.Visible = true;

        try {
            var fname = oXL.Application.GetSaveAsFilename("Excel.xls", "Excel Spreadsheets (*.xls), *.xls");
        } catch (e) {
            print("Nested catch caught " + e);
        } finally {
            oWB.SaveAs(fname);
            oWB.Close(savechanges = false);
            oXL.Quit();
            oXL = null;
            idTmr = window.setInterval("Cleanup();", 1);
        }

    } else {
        fname = `上报文件 ${getDateString(new Date())}.xls`;
        tableToExcel(tableid, fname)
    }
}

function Cleanup() {
    window.clearInterval(idTmr);
    CollectGarbage();
}

//判断浏览器后调用的方法，把table的id传入即可
function tableToExcel(table, name) {
    var template = `<html><head><meta charset="UTF-8"></head><body><table>${document.getElementById(table).innerHTML}</table></body></html>`
    var blob = new Blob([template], {
        type: "application/vnd.ms-excel;charset=charset=utf-8"
    });
    saveAs(blob, name);
}


