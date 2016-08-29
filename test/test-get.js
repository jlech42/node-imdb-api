var https = require('https');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testGetSuccessful = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?t=The%20Toxic%20Avenger&plot=full&r=json').reply(200, require('./data/toxic-avenger.json'));

	return imdb.get('The Toxic Avenger', testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.imdbid, 'tt0090191', "testing returned data");
		test.equal(data.series, false, "testing series bool");
		test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

		test.done();
	}
}

module.exports.testGetUnsuccessful = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?t=The%20Green%20Mile&plot=full&r=json').reply(404);

	return imdb.get('The Green Mile', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.done();
	}
}

module.exports.testGetMadeupMovie = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?t=asdfasdfasdf&plot=full&r=json').reply(200, { Response: "False", Error: "Movie not found!" });

	return imdb.get('asdfasdfasdf', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.deepEqual(err, new imdb.ImdbError('Movie not found!: asdfasdfasdf', { name:'asdfasdfasdf', id: undefined }), "testing film not found error");

		test.done();
	}
}

module.exports.testGetEpisodes = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?t=How%20I%20Met%20Your%20Mother&plot=full&r=json').reply(200, require('./data/how-I-met-your-mother.json'));

	return imdb.get('How I Met Your Mother', testResults);

	function testResults(err, tvshow) {
		var scope = nock('https://imdbapi.poromenos.org').get('/js/?name=How%20I%20Met%20Your%20Mother&year=2001').reply(200, require('./data/how-I-met-your-mother-episodes.json'));
		test.ifError(err);

		test.ok(tvshow);
		test.equal(tvshow.start_year, 2001, "testing start_year");
		test.equal(tvshow.end_year, null, "testing end_year");
		test.equal(tvshow.year, null, "testing year is null");
		test.equal(typeof(tvshow.episodes), "function", "testing for episodes function");
		test.equal(tvshow.series, true, "testing series bool");

		return tvshow.episodes(function(err, data) { testEpisodes(err, data, tvshow); });
	}

	function testEpisodes(err, data, tvshow) {
		test.ifError(err);

		test.ok(data);
		test.equal(data[0].season, 6, "testing a random value");
		test.equal(data[0].number, 18, "testing another value");

		test.equal(typeof(tvshow._episodes), "object", "testing type of _episodes");
		test.equal(tvshow._episodes[0].season, 6, "testing cached value");
		test.equal(tvshow._episodes[0].number, 18, "testing another cached value");

		test.done();
	}
}

module.exports.testUnsuccessfulGetEpisodes = function(test) {
	var scope = nock('https://www.omdbapi.com').get('/?t=How%20I%20Met%20Your%20Mother&plot=full&r=json').reply(200, require('./data/how-I-met-your-mother.json'));

	return imdb.get('How I Met Your Mother', testResults);

	function testResults(err, data) {
		var scope = nock('https://imdbapi.poromenos.org').get('/js/?name=How%20I%20Met%20Your%20Mother&year=2001').reply(404);

		test.ifError(err);
		test.ok(data);

		return data.episodes(testEpisodes);
	}

	function testEpisodes(err, data) {
		test.ifError(data);

		test.deepEqual(err, new Error("could not get episodes"));

		test.done();
	}
}
