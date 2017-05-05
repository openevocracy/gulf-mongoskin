var _ = require("underscore");
var Promise = require("bluebird");

// Stores revisions that are synced with the master
function MongoskinAdapter(db, docId) {
  this.db = db;
  this.docId = docId;
}
module.exports = MongoskinAdapter;

MongoskinAdapter.prototype.reset = function() {
  // delete history and last id
  var remove_history_promise =
    this.db.collection('gulf_revisions').removeAsync({ 'docId': this.docId });
  var update_lastrevision_id_promise =
    this.db.collection('gulf_lastrevision_id').updateAsync(
      { '_id': this.docId }, { $set: {'revId': 0} });
  
  return Promise.join(remove_history_promise,
                      update_lastrevision_id_promise);
};

MongoskinAdapter.prototype.getRevision = function(revId) {
  /*
    Example:
    gulf_revisions collection:
    {_id: 123jkb243, docId: sdfklj98d, revId: 0, content: "Hello World", ottype: ""}
    
    gulf_lastrevision_id collection:
    {_id: sdfklj98d, revId: 0}
  */
  
  return this.db.collection('gulf_revisions').
    findOneAsync({ 'revId': revId, 'docId': this.docId }, {'_id': false, 'docId': false}).
    then(function(rev) {
      // Rename revId and delete old entry
      rev.id = rev.revId;
      delete rev.revId;
      
      return Promise.resolve(rev);
    });
};

MongoskinAdapter.prototype.getLastRevisionId = function() {
  return this.db.collection('gulf_lastrevision_id').
    findOneAsync( { '_id': this.docId } ).then(function (rev) {
      if(_.isNull(rev))
        return Promise.reject();
      else
        return Promise.resolve(rev.revId);
    });
};

MongoskinAdapter.prototype.storeRevision = function(rev) {
  // FIXME: maybe "insert" instead of "updateAsync" is appropriate here
  var insert_history_promise =
    this.db.collection('gulf_revisions').updateAsync(
      { 'revId': rev.id, 'docId': this.docId }, { $set: _.omit(rev, 'id') },
      { upsert: true } );
  var update_lastrevision_id_promise =
    this.db.collection('gulf_lastrevision_id').updateAsync(
      { '_id': this.docId }, { $set: {'revId': rev.id} },
      { upsert: true } );
  
  return Promise.join(insert_history_promise,
                      update_lastrevision_id_promise);
};
