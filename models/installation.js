var _ = require('lodash');

/**
 * Installation Model connects a mobile application to a device, the user and
 * other information for the server side to locate devices using application
 * id/version, user id, device type, and subscriptions.  Users may have many
 * devices, or Installations, which can receive Notifications from the Application.
 *
 * @property {String} appId The unique identifier for the application this
 * {{Installation}} is registered for.
 * @property {String} appVersion Version of the application currently running on the client (optional).
 * @property {Number} badge The number of the last displayed badge icon (iOS only).
 * @property {Date} created The date the Installation was created.
 * @property {String} deviceToken The device token as provided by GCM or APN.
 * @property {String} deviceType The device type such as `ios`.
 * @property {Date} modified The date the Installation was last updated.
 * @property {String} status Status of the installation, provider dependent, like 'Active'.
 * @property {Array} subscriptions The type of notifications the device is subscribed to.
 * @property {String} timeZone The Time Zone ID of the device, ex: America/Vancouver.
 * @property {String} userId The user id that reported by the device.
 *
 * @class Installation
 * @header Installation
 */
module.exports = function(Installation) {

  Installation.observe('before save', function trip(ctx, next) {
    var install = ctx.instance || ctx.data;
    install.modified = new Date();
    next();
  });

  /**
   * Find installations by application id/version
   * @param {String} deviceType The device type
   * @param {String} appId The application id
   * @param {String} [appVersion] The application version
   * @callback {Function} cb The callback function
   * @param {Error|String} err The error object
   * @param {Installation[]} installations The selected installations
   */
  Installation.findByApp = function(deviceType, appId, appVersion, cb) {
    if (!cb && typeof appVersion === 'function') {
      cb = appVersion;
      appVersion = undefined;
    }
    var filter = {where: {
      appId: appId,
      appVersion: appVersion,
      deviceType: deviceType}
    };
    this.find(filter, cb);
  };

  /**
   * Find installations by user id
   * @param {String} userId The user id
   * @param {String} deviceType The device type
   * @param {Function} cb The callback function
   *
   * @callback {Function} cb The callback function
   * @param {Error|String} err The error object
   * @param {Installation[]} installations The selected installations
   */
  Installation.findByUser = function(deviceType, userId, cb) {
    var filter = {where: {userId: userId, deviceType: deviceType}};
    this.find(filter, cb);
  };

  /**
   * Find installations by subscriptions
   * @param {String|String[]} subscriptions A list of subscriptions
   * @param {String} deviceType The device type
   *
   * @callback {Function} cb The callback function
   * @param {Error|String} err The error object
   * @param {Installation[]} installations The selected installations
   */
  Installation.findBySubscriptions = function(deviceType, subscriptions, cb) {
    if (typeof subscriptions === 'string') {
      subscriptions = subscriptions.split(/[\s,]+/);
    }
    var filter = {where: {
        subscriptions: {inq: subscriptions},
        deviceType: deviceType
      }
    };
    this.find(filter, cb);
  };

  /*!
   * Configure the remoting attributes for a given function
   * @param {Function} fn The function
   * @param {Object} options The options
   * @private
   */
  function setRemoting(fn, options) {
    options = options || {};
    _.forOwn(options, function(value, key) {
      fn[key] = value;
    });
    fn.shared = true;
  }

  var aDefs = {type: 'string', http: {source: 'query'}};

  setRemoting(Installation.findByApp, {
    description: 'Find installations by application id',
    accepts: [
        _.extend({arg: 'deviceType', description: 'Device type'}, aDefs),
        _.extend({arg: 'appId', description: 'Application id'}, aDefs),
        _.extend({arg: 'appVersion', description: 'Application version'}, aDefs)
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'get', path: '/byApp'}
  });

  setRemoting(Installation.findByUser, {
    description: 'Find installations by user id',
    accepts: [
      _.extend({arg: 'deviceType', description: 'Device type'}, aDefs),
      _.extend({arg: 'userId', description: 'User id'}, aDefs)
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'get', path: '/byUser'}
  });

  setRemoting(Installation.findBySubscriptions, {
    description: 'Find installations by subscriptions',
    accepts: [
      _.extend({arg: 'deviceType', description: 'Device type'}, aDefs),
      _.extend({arg: 'subscriptions', description: 'Subscriptions'}, aDefs)
    ],
    returns: {arg: 'data', type: 'object', root: true},
    http: {verb: 'get', path: '/bySubscriptions'}
  });

  return Installation;
};
