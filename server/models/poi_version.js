const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('lib', 'utils')
const error_ = __.require('lib', 'error')
const geojson = require('geojson-tools')

const PoiVersion = {
  validateData: function (data) {
    const geojsonTestResult = geojson.isGeoJSON(data, true)
    // if the test fails, returns an error object
    if (geojsonTestResult !== true) {
      throw error_.complete(geojsonTestResult, 400, data)
    }
    const lat = data.geometry.coordinates[0]
    const lon = data.geometry.coordinates[1]
    if (lat < -90 || lat > 90) {
      throw error_.new('coordinate lat out of range', 400, data)
    }
    if (lon < -180 || lon > 360) {
      throw error_.new('coordinate lon out of range', 400, data)
    }
    if (!_.isNonEmptyString(data.properties.name)) {
      throw error_.new('missing name', 400, data)
    }
    return data
  },
  create: function (doc, version) {
    _.log(doc, 'poi creation doc')

    if (!_.isUuid(doc.journal)) {
      throw error_.new('missing journal id', 500, doc)
    }

    // TODO add userid to doc.userid
    doc.author = 'Douglas Adams'
    doc.description = 'Have fun, and thanks for all the fish!'
    // TODO add license from user profile to doc.copyright

    doc.type = 'version'
    doc.timestamp = _.now()
    doc.version = version

    _.log(doc, 'poi creation formatted doc')
    return doc
  },
  parseCurrentVersion: function (versionDoc) {
    // keeping only the data and not the version metadata
    const data = versionDoc.data
    // faking to return the journal document id
    // while it's just the last version
    data._id = versionDoc.journal
    return data
  }
}

module.exports = PoiVersion
