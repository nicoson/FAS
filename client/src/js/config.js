// let APIHOST = '';
let APIHOST = 'http://0.0.0.0:3000';
// let APIHOST = 'http://100.100.62.149:3000';

if(sessionStorage.islogin == undefined || sessionStorage.islogin != 'true') {
    location.href = '/index.html';
} else {
    // document.querySelector('section').removeAttribute('class');
}

// initiate navbar
let page = {
    home:   '综合信息平台',
    // edit:   '编辑列表',
    // admin:  '列表管理',
    audit:  '人工审核',
    list:   '结果列表',
    spider: '数据源配置'
};
let navbartmp = '';
for(let i in page) {
    navbartmp += `<a href="/${i}.html" ${location.pathname.indexOf(i+'.html')>0?'class="wa-home-nav-selected"':''} target="_self">${page[i]}</a>`;
}
document.querySelector("#navbar").innerHTML = navbartmp;

let headers = new Headers();
headers.append('Content-Type', 'application/json');
let postBody = {
    method: 'POST',
    headers: headers,
    body: null
};
