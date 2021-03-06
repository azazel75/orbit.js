import Orbit from 'orbit/core';
import LocalStorageSource from 'orbit/sources/local_storage_source';
import RSVP from 'rsvp';

var source;

///////////////////////////////////////////////////////////////////////////////

module("Unit - LocalStorageSource", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    var schema = {
      idField: '__id',
      models: {
        planet: {
        }
      }
    };

    source = new LocalStorageSource(schema, {autoload: false});
  },

  teardown: function() {
    window.localStorage.removeItem(source.namespace);
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("#add - can insert records and assign ids", function() {
  expect(7);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(source.length('planet'), 1, 'source should contain one record');
    ok(planet.__id, 'id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
    return planet;

  }).then(function(planet) {
    verifyLocalStorageContainsRecord(source.namespace, 'planet', planet);
    source.find('planet', planet.__id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, planet.id, 'record can be looked up by id');
    });
  });
});

test("#update - can update records", function() {
  expect(8);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return source.update('planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, '__id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');
      return updatedPlanet;
    });

  }).then(function(planet) {
    verifyLocalStorageContainsRecord(source.namespace, 'planet', planet);
    source.find('planet', planet.__id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });
  });
});

test("#patch - can patch records", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;

    source.patch('planet', planet.__id, 'name', 'Earth').then(function() {
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet);
      source.find('planet', planet.__id).then(function(foundPlanet) {
        start();
        strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
        equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
        equal(foundPlanet.name, 'Earth', 'name has been updated');
        equal(foundPlanet.classification, 'gas giant', 'classification has not been updated');
      });
    });
  });
});

test("#remove - can delete records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(source.length('planet'), 1, 'source should contain one record');

    source.remove('planet', planet.__id).then(function() {
      start();
      equal(source.length('planet'), 0, 'source should be empty');
    });
  });
});

test("#find - can find all records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  RSVP.all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');

    source.find('planet').then(function(planets) {
      start();
      equal(planets.length, 3, 'find() should return all records');
    });
  });
});

test("it can use a custom local storage namespace for storing data", function() {
  expect(1);

  source.namespace = 'planets';

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    verifyLocalStorageContainsRecord(source.namespace, 'planet', planet);
  });
});

test("autosave can be disabled to delay writing to local storage", function() {
  expect(4);

  source.disableAutosave();

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(source.length('planet'), 1, 'source should contain one record');
    verifyLocalStorageIsEmpty(source.namespace);

    source.enableAutosave();
    verifyLocalStorageContainsRecord(source.namespace, 'planet', planet);
  });
});

