const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('lib', 'utils')
const db = __.require('lib', 'db/db')('things', 'journals')
const Journal = require('./models/commons/journal')
const Version = require('./models/commons/version')
const versions_ = require('./lib/versions')
const promises_ = __.require('lib', 'promises')

module.exports = function (contextName, model) {
  return {
    byId: function (id) {
      return db.viewByKey('byId', [contextName, id])
      .then(_.Log(`${contextName} byId`))
    },
    create: function (data) {
      // first make sure we have valid data
      // we don't want to create a journal or anything if the data isn't valid
      try {
        model.validateData(data)
      } catch (err) {
        // A function should either return sync values
        // or async values (as a promise) but never both.
        // So, to stay consistant, we return a rejected promise
        // instead of just throwing the error
        return promises_.reject(err)
      }

      // then knowning that the data is valid, create a journal document
      return db.post(Journal.create(contextName))
      .then(_.Log('journal post res'))
      // then create a first version document
      .then(function (res) {
        const journalId = res.id
        return versions_.create(journalId, data)
        // then update the journal document to reference the first version
        .then(function (firstVersionDoc) {
          return db.update(journalId, function (journalDoc) {
            return Journal.update(journalDoc, firstVersionDoc)
          })
        })
      })
      .then(_.Log('thing created'))
      .catch(_.ErrorRethrow('thing creation err'))
    },
    currentVersionById: function (id) {
      // there is some magic happening in the currentVersionById view (see db/design_docs/journal.json):
      // as the journal document emits the id of another document in the format {'_id': lastVersionId},
      // using the parameter include_doc will not return the emitting document but the document with the id doc.current._id.
      // This is called Linked documents https://wiki.apache.org/couchdb/Introduction_to_CouchDB_views#Linked_documents
      // The complex key [contextName, id] allows to make sure we don't
      // return a document that doesn't belong to the required context
      return db.viewByKey('currentVersionById', [contextName, id])
      .then(_.Log('currentVersionById'))
      .then(function (doc) {
        if (doc == null) {
          throw error_.new('missing doc', 404, id)
        }
        return doc
      })
      .then(Version.parseCurrentVersion)
    }
  }
}