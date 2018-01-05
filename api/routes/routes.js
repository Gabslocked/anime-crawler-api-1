'use strict';
module.exports = function(app) {
  var categories = require('../controllers/categoriesController');
  var animes = require('../controllers/animesController');
  var episodes = require('../controllers/episodesController');

  //Categories
  app.route('/category')
    .get(categories.list_all);

  //Animes
  app.route('/anime/:page?')
    .get(animes.list_all);

  app.route('/anime/detail/:slug')
    .get(animes.detail);

  app.route('/anime/episodes/:slug/:page?')
    .get(animes.episodes);

  //Episódios
  app.route('/episodes/:page?/:terms?')
    .get(episodes.list_all);

  app.route('/episode/:video_key')
    .get(episodes.video);


  // app.route('/category/:path')
  //   .get(categories.read_a_task)
  //   .put(todoList.update_a_task)
  //   .delete(todoList.delete_a_task);
};
