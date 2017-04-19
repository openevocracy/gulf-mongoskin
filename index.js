/**
 * gulf - Sync anything!
 * Copyright (C) 2013-2015 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var _ = require("underscore");
var Promise = require("bluebird");

// Stores revisions that are synced with the master
function MongoskinAdapter(db, docId) {
  this.db = db;
  this.docId = docId;
  this.reset();
}
module.exports = MongoskinAdapter;

MongoskinAdapter.prototype.reset = function() {
  // FIXME delete history and last id
  /*var insert_history_promise =
    this.db.collection('gulf_revisions').Async();
  var update_lastrevision_id_promise =
    this.db.collection('gulf_lastrevision_id').updateAsync();
  
  return Promise.join(insert_history_promise,
                      update_lastrevision_id_promise);*/
};

MongoskinAdapter.prototype.getRevision = function(revId) {
  /*
    Example:
    revisions collection:
    {_id: 123jkb243, docId: sdfklj98d, revId: 0, content: "Hello World", ottype: ""}
    
    gulf_lastrevision_id collection:
    {_id: sdfklj98d, revId: 0}
  */
  
  return this.db.collection('gulf_revisions').
        findOneAsync({ 'revId': revId, 'docId': this.docId } );
};

MongoskinAdapter.prototype.getLastRevisionId = function() {
  return this.db.collection('gulf_lastrevision_id').
    findOneAsync( { '_id': this.docId } ).then(function (rev) {
      console.log(JSON.stringify(rev));
      
      if(_.isNull(rev))
        return undefined;
      else
        return rev.revId;
    });
    
    //get('revId');
};

MongoskinAdapter.prototype.storeRevision = function(rev) {
  // FIXME: maybe insert instead of updateAsync is appropriate here
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
