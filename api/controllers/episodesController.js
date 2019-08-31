'use strict';

var cheerio = require('cheerio'),
  request = require('request').defaults({
    rejectUnauthorized: false
  }),
  settings = require('../settings'),
  reqOptions = require('../req-options');

exports.list_all = function (req, res) {

  var terms = (typeof req.params.page == 'string') ? req.params.page : (req.params.terms || '');
  var page = !isNaN(Number(req.params.page)) ? req.params.page : 1;
  var url = settings.base_path + '/animes-lancamentos/page/' + page;
  var min = 12;

  if (terms.length) {
    url = settings.base_path + '/busca/page/' + page + '/?search_query=' + terms + '&tipo=desc';
  }

  request(url, reqOptions, function (error, response, body) {

    if (!response || response.statusCode !== 200 || error) {
      res.json({
        'err': true,
        'msg': 'Não foi possível carregar os lançamentos.'
      });
      return;
    }

    var $ = cheerio.load(body);
    var arr = null;
    var $el = $('.col-sm-6.col-md-4.col-lg-4 .well.well-sm');

    if ($el.length) {
      arr = [];
      $el.each(function (index, el) {

        let obj = {
          'title': $(el).find('.video-title').text(),
          'key': $(el).find('a').attr('href').split('/').filter(String).slice(-2).shift(),
          'slug': $(el).find('a').attr('href').split('/').filter(String).slice(-1).pop(),
          'image': $(el).find('.thumb-overlay img').attr('src'),
          'duration': $(el).find('.duration').text().trim(),
          'has_hd': !!$(el).find('.hd-text-icon').length
        };

        obj.key = obj.key + '|' + obj.slug;

        arr.push(obj);

      });
    }

    res.json({
      'nextPage': $el.length < min ? false : Number(page) + 1,
      'prevPage': Number(page) > 1 ? Number(page) - 1 : false,
      'episodes': arr
    });
  });
};

exports.video = function (req, res) {

  var key = req.params.video_key || '';
  var url = settings.base_path + '/' + key.replace('stream|', 'st/');

  request(url, reqOptions, function (err, response, body) {
    if (!err) {
      var $ = cheerio.load(body);
      let urls = $(' #vcnt > div:nth-child(2) > script').html().match(/(https.*?)(.*?mpd|m3u8)]*/g);;
      if (!urls.length) {
        res.json({
          'err': true,
          'msg': 'Não foi possível carregar o episódio.'
        });
        return;
      };

      res.json({
        urls
      });

    } else {
      console.log(err);
    }
  });

};