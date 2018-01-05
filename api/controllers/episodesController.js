'use strict';

var cheerio = require('cheerio'),
    request = require('request'),
    settings = require('../settings');

exports.list_all = function(req, res) {
  
  var terms = (typeof req.params.page == "string") ? req.params.page : (req.params.terms || "");
  var page = !isNaN(Number(req.params.page)) ? req.params.page : 1;
  var url = settings.base_path+"/animes-lancamentos/page/"+page;
  var min = 12;

  if(terms.length){
    url = settings.base_path+"/busca/page/"+page+"/?search_query="+terms+"&tipo=desc";
  }

  request(url, function (error, response, body) {

    if( response.statusCode !== 200 || error ){
      res.json({
        "err" : true,
        "msg" : "Não foi possível carregar os lançamentos."
      });
      return;
    }

    var $ = cheerio.load(body);
    var arr = null;
    var $el = $('.col-sm-6.col-md-4.col-lg-4 .well.well-sm');
    
    if($el.length){
      arr = [];
      $el.each(function(index, el){
        
        let obj = {
          'title': $(el).find('.video-title').text(),
          'key' : $(el).find('a').attr('href').split('/').filter(String).slice(-2).shift(),
          'slug' : $(el).find('a').attr('href').split('/').filter(String).slice(-1).pop(),
          'image' : $(el).find('.thumb-overlay img').attr('src'),
          'duration' : $(el).find('.duration').text().trim(),
          'has_hd' : !!$(el).find('.hd-text-icon').length
        };

        obj.key = obj.key+"|"+obj.slug;

        arr.push(obj);

      });
    }

    res.json({
      'nextPage': $el.length < min ? false : Number(page)+1,
      'prevPage': Number(page) > 1 ? Number(page)-1 : false,
      'episodes': arr
    });
  });
};

exports.video = function(req, res) {
  
  var key = req.params.video_key || "";
  var url = settings.base_path+"/video/"+key.replace("|", "/");

  console.log(url);

  request(url, function(err, response, body){
    console.log(err);
    if(!err) {
      var $ = cheerio.load(body);
      
      var insertVideoUrl = "";

      $('script').map(function(i, a){
        if( $(this).attr('src') ){
          var r = $(this).attr('src').match(/(.*?insertVideo.*?)&nocache=[A-Za-z0-9]*/g);
          if(r){ insertVideoUrl = r[0];}
        };
      });


      if(!insertVideoUrl){
        res.json({
          "err" : true,
          "msg" : "Não foi possível carregar o episódio."
        });
        return;
      };

      request(insertVideoUrl, function(err, response, body){

        if(!err) {
          var str = body
                      .replace(/'/g,"")
                      .replace(/\[/g,"")
                      .replace(/\]/g,"")
                      .replace(/\"/g, "")
                      .match(/source: (.*?),/g).map(function(a){
                        return a.replace(/source: /g, "").slice(0, -1);;
                      });

          res.json(str);

        } else {
          console.log("Error", err);
        }
      });

    } else {
      console.log(err);
    }
  });

};