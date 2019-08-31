'use strict';

var cheerio = require('cheerio'),
  request = require('request').defaults({
    rejectUnauthorized: false
  }),
  settings = require('../settings'),
  reqOptions = require('../req-options');

exports.list_all = function (req, res) {
  var page = !isNaN(Number(req.params.page)) ? req.params.page : 1;
  var url = settings.base_path + "/anime/page/" + page;
  var min = 18;

  request(url, reqOptions, function (error, response, body) {

    if (!response || response.statusCode !== 200 || error) {
      res.json({
        "err": true,
        "msg": "Não foi possível carregar os animes."
      });
      return;
    }

    var $ = cheerio.load(body);
    var arr = [];
    var $el = $('#wrapper > div.container > div.row > div.col-md-9.col-sm-8 > .row');

    $el.children().each(function (i, child) {
      arr.push({
        'title': $(child).find('.imagePlace > .internalUrl > .img-responsive').attr('alt').trimRight(),
        'slug': $(child).find('.imagePlace > .internalUrl').attr('href').split('/').slice(-1).pop(),
        'src': $(child).find('.imagePlace > .internalUrl > .img-responsive').attr('src').trimRight(),
      });
    });

    res.json({
      'nextPage': arr.length < min ? false : Number(page) + 1,
      'animes': arr
    });
  });
};

exports.detail = function (req, res) {
  var slug = req.params.slug || "";
  var url = settings.base_path + "/anime/" + slug;

  request(url, reqOptions, function (error, response, body) {

    if (!response || response.statusCode !== 200 || error) {
      res.json({
        "err": true,
        "msg": "Não foi possível carregar as informações."
      });
      return;
    }

    var $ = cheerio.load(body);
    var arr = false;

    if (!$('#wrapper .list-group-item').length) {

      arr = {
        'lastPageEpisodes': $('.pagination').eq(1).find('ul li:last-child a').attr('href').split('/').filter(String).slice(-1).pop(),
        'image': $('[property="og:image"]').attr('content'),
        'year': $('[itemprop="copyrightYear"]').text(),
        'episodes': $('[itemprop="numberofEpisodes"]').text(),
        'author': $('[itemprop="author"]').text(),
        'description': $('[itemprop="description"]').text().trim(),
        'categories': [],
      };

      $('[itemprop="genre"] a').each(function (i, el) {
        arr.categories.push({
          'name': $(el).text().trim(),
          'slug': $(el).attr('href').trim().split('/').filter(String).slice(-1).pop()
        });
      });

    }

    res.json({
      'data': arr
    });
  });
};

exports.episodes = function (req, res) {
  var slug = req.params.slug || "";
  var page = !isNaN(Number(req.params.page)) ? req.params.page : 1;
  var url = settings.base_path + "/anime/" + slug + "/page/" + page;
  var min = 12;

  console.log(url);

  request(url, reqOptions, function (error, response, body) {

    if (response.statusCode !== 200 || error) {
      res.json({
        "err": true,
        "msg": "Não foi possível carregar as informações."
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

        obj.key = obj.key + "|" + obj.slug;

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