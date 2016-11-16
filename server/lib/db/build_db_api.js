const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('lib', 'utils')

module.exports = function (db, designName) {
  const viewByKeys = function (viewName, keys) {
    return db.view(designName, viewName, {
      keys: keys,
      include_docs: true
    })
    .then(parseNanoResponse)
    .then(parseDocs)
    .then(_.Log(`viewByKeys ${designName} ${viewName} ${keys}`))
  }
  const viewAll = function (viewName, typeName) {
    return db.view(designName, viewName, {
      startkey: [typeName, "0"],
      endkey: [typeName, "z"],
      include_docs: true
    })
    .then(parseNanoResponse)
    .then(parseDocs)
    .then(_.Log(`viewAll ${designName} ${viewName} ${typeName}`))
  }

  const get = function (id) {
    return db.get(id)
    .then(parseNanoResponse)
  }
  const insert = function (doc) {
    return db.insert(doc)
    .then(parseNanoResponse)
  }

  return {
    get: get,
    post: insert,
    // returns with the udpated _id and _rev
    postAndReturn: function (doc) {
      return insert(doc)
      .then(_.property('id'))
      .then(get)
    },
    update: function (id, updateFn) {
      return get(id)
      .then(updateFn)
      .then(insert)
      .then(_.Log('update'))
      // TODO: catch insert errors to retry once
      // to address possible conflicts
    },
    viewByKey: function (viewName, key) {
      return viewByKeys(viewName, [key])
      .then(parseFirst)
      .then(_.Log('viewByKey'))
    },
    viewByKeys: viewByKeys,
    viewAll: viewAll
  }
}

const parseDocs = function (body) {
  return body.rows.map(_.property('doc'))
}
const parseFirst = function (array) {
  return array[0]
}
// nano returns [body, headers]
// just returning the body
const parseNanoResponse = parseFirst
