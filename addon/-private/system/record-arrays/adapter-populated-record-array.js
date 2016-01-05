import Ember from 'ember';
import RecordArray from "ember-data/-private/system/record-arrays/record-array";
import ImmutableArrayMixin from "ember-data/-private/system/record-arrays/immutable-array-mixin";
import cloneNull from "ember-data/-private/system/clone-null";

/**
  @module ember-data
*/

var get = Ember.get;

/**
  Represents an ordered list of records whose order and membership is
  determined by the adapter. For example, a query sent to the adapter
  may trigger a search on the server, whose results would be loaded
  into an instance of the `AdapterPopulatedRecordArray`.

  @class AdapterPopulatedRecordArray
  @namespace DS
  @extends DS.RecordArray
*/
export default RecordArray.extend(ImmutableArrayMixin, {
  query: null,

  replace() {
    var type = get(this, 'type').toString();
    throw new Error("The result of a server query (on " + type + ") is immutable.");
  },

  _update() {
    let store = get(this, 'store');
    let modelName = get(this, 'type.modelName');
    let query = get(this, 'query');

    return store._query(modelName, query, this);
  },

  /**
    @method loadRecords
    @param {Array} records
    @param {Object} payload normalized payload
    @private
  */
  loadRecords(records, payload) {
    let token = heimdall.start('AdapterPopulatedRecordArray.loadRecords');
    //TODO Optimize
    var internalModels = Ember.A(records).mapBy('_internalModel');
    this.setProperties({
      content: Ember.A(internalModels),
      isLoaded: true,
      isUpdating: false,
      meta: cloneNull(payload.meta)
    });

    this.set('links', cloneNull(payload.links));

    internalModels.forEach((record) => {
      this.manager.recordArraysForRecord(record).add(this);
    });

    // TODO: should triggering didLoad event be the last action of the runLoop?
    Ember.run.once(this, 'trigger', 'didLoad');
    heimdall.stop(token);
  }
});
