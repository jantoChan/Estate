// module "reptile-module.js"
const promise = require('promise')
const charset = require('superagent-charset')
const superagent = require('superagent')
charset(superagent)
const cheerio = require('cheerio')
const eventproxy = require('eventproxy')
const request = require('request')

// 参数说明
// opt={
//   type : 'rent' || 'sale',
//   page : 1, 2 ,3
// }
const get58 = (opt)  => {
  var resultArr=[];
  let page=0;
  let type="";
  let url="";
  page>1 ? page='/pn'+page : page='';
  if (opt.type=='sale') {
    url="http://huizhou.58.com/huicheng/ershoufang/0/"+page+"?PGTID=0d30000c-002d-2d06-4b77-b03bf73d8c31&ClickID=4";
  }else if(opt.type=='rent'){
    url="http://huizhou.58.com/huicheng/chuzu/0/"+page+"?PGTID=0d3090a7-002d-39c6-ed59-8f71e55baab3&ClickID=1";
  }

  //爬虫获取数据
  var reptilePromise= new promise(function (resolve, reject) {
    superagent.get(url).end((err, response) => {
      if (err) console.log(err)
      let $ = cheerio.load(response.text, {decodeEntities: false})
      if (opt.type=="sale") {
        $('#main .tbimg tr').each((index, item) => {
            let resultObj = {
                  title: '',
                  address: '',
                  price: '',
                  links: '',
                  pic: '',
                  date: ''
            };
            resultObj.links = $(item).find('.bthead .t').attr('href');
            resultObj.title = $(item).find('.bthead .t').text().replace(/^\s\s*/, '');
            resultObj.pic = $(item).find('.img_list img').attr('lazy_src');
            resultObj.date=$(item).find('.qj-listleft .qj-listjjr').contents().filter(function() { return this.nodeType === 3; }).text().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            resultObj.price = $(item).find('.qj-listright.btall').html().replace(/^\s\s*/, '');
            resultObj.address = $(item).find('.a_xq1').eq(0).text() +$(item).find('.qj-listleft').contents().filter(function() { return this.nodeType === 3; }).text().replace(/^\s\s*/, '');
            resultArr.push(resultObj);
        })
      }//出售的二手房
      if (opt.type=="rent") {
        $(".listBox .listUl li[logr]").each((index, item) => {
          let resultObj = {
            title: '',
            address: '',
            price: '',
            links: '',
            pic: '',
            date: ''
          };
          var $this=$(item);
          resultObj.links=$this.find(".img_list a").attr("href");
          resultObj.title=$this.find(".des a").text().replace(/\s\s*$/, '');
          resultObj.pic=$this.find(".img_list img").attr("lazy_src");
          resultObj.date=$this.find(".sendTime").text().replace(/\s\s*$/, '');
          resultObj.price=$this.find(".money").html().replace(/\s\s*$/, '') +'<p>'+ $this.find(".room").html().replace(/\s\s*$/, '') + '</p>';
          resultObj.address=$this.find(".add a").text().replace(/\s\s*$/, '')+'-'+$this.find(".add span").text().replace(/\s\s*$/, '');
          resultArr.push(resultObj);
        })
      }//在租的房源
      // response.send(resultArr);
      resolve(resultArr);
    })//sup
  })//promise
  return reptilePromise
}

const getxz = (opt) => {
 var resultArr=[];
  let type="";
  let url="http://house2014.xizi.com/esf/"+opt.type+"/person/81&areaid=22&page="+opt.page;

  //爬虫获取数据
  var reptilePromise= new promise(function (resolve, reject) {
      superagent.get(url) .charset('gbk') .end(function (err, sres) {
        if (err) console.log(err)
        var $ = cheerio.load(sres.text, {decodeEntities: false});
          $('#main #result_show .result_item.cc').each((index, item) => {
              // define an object and update it
              // then push to the result array
              let resultObj = {
                  title: '',
                  address: '',
                  price: '',
                  links: '',
                  pic: '',
                  date: ''
              }

              resultObj.links = $(item).find('h4 a').attr('href');
              resultObj.title = $(item).find('h4 a').text().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
              resultObj.pic = $(item).find('.img_desc.cc img').attr('src');
              resultObj.date=$(item).find('.update_time').text();
              resultObj.price = $(item).find('.h_price.cc .fr').html()+$(item).find('.h_price .fl').html()+'<br/>'+$(item).find('dd .gray').text();
              resultObj.address = $(item).find('dd p').eq(0).text().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
              resultArr.push(resultObj)
          })//each
          resolve(resultArr);
        })
  })//promise
  return reptilePromise
}

//定时爬取58，西子数据
const reptile = () => {
    //58
    let reptileUrls=[
      "http://huizhou.58.com/huicheng/ershoufang/0/?PGTID=0d30000c-002d-2d06-4b77-b03bf73d8c31&ClickID=4",
      "http://huizhou.58.com/huicheng/chuzu/0/?PGTID=0d3090a7-002d-39c6-ed59-8f71e55baab3&ClickID=1",
      "http://house2014.xizi.com/esf/sale/person/81&areaid=22&page=1",
      "http://house2014.xizi.com/esf/rent/person/81&areaid=22&page=1"
    ];
    var returnDat={};
    var sale58=[];
    var rent58=[];
    var salexz=[];
    var rentxz=[];
    var ep = new eventproxy();
    reptileUrls.forEach(function (reptileUrl) {
      superagent.get(reptileUrl)
        .end(function (err, res) {
          ep.emit('estate_html', [reptileUrl, res.text]);
        });
    });//each
    var runPromise = new promise(function (resolve, reject) {
      ep.after('estate_html', reptileUrls.length, function (reptiles) {
        reptiles.map(function (reptilePair) {
          var Url = reptilePair[0];
          var Html = reptilePair[1];
          var $ = cheerio.load(Html, {decodeEntities: false});
          if (Url.indexOf('58')>-1 && Url.indexOf('chuzu')>-1) {
            $(".listUl li[logr]").each( (index, item) => {
              let link=$(item).attr("sortid");
              rent58.push(link);
            })
            returnDat['rent58']=rent58;
          }
          if (Url.indexOf('58')>-1 && Url.indexOf('ershoufang')>-1) {
            $("#main .tbimg tr").each( (index, item) => {
              let link=$(item).attr('logr');
              sale58.push(link);
            })
            returnDat['sale58']=sale58;
          }
          if (Url.indexOf('xz')>-1 && Url.indexOf('sale')>-1) {
            $('#main #result_show .result_item.cc').each( (index, item) => {
              let link = $(item).find('h4 a').attr('href');
              salexz.push(link);
            })
            returnDat['salexz']=salexz;
          }
          if (Url.indexOf('xz')>-1 && Url.indexOf('rent')>-1) {
            $('#main #result_show .result_item.cc').each( (index, item) => {
              let link = $(item).find('h4 a').attr('href');
              rentxz.push(link);
            })
            returnDat['rentxz']=rentxz;
          }
        });
        //返回数据
        resolve(returnDat);
      });//after
    });//promise
    return runPromise;
}


exports.get58 = get58;
exports.getxz = getxz;
exports.reptile = reptile;