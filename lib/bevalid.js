/**
 * BeValid - Javascript object validator.
 *
 * Copyright (c) 2014 Takahiko ONO.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

(function (name) {

	'use strict';

	var _ = require('lodash');

	var BeValid = function (definitions, localeCode) {

		this.locales = {
			_ : require('./i18n/default.json'),
			ja: require('./i18n/ja.json')
		};

		this.localeCode = localeCode;

		this.tests = (function (definitions) {

			var sanitize = function (d) {
				var result = [];

				if (_.isArray(d)) {
					for (var i in d) {
						Array.prototype.push.apply(result, sanitize(d[i]));
					}
				} else if (_.isString(d)) {
					result.push({ type: d, args: [], message: null });
				} else if (_.isObject(d) && d.type) {
					if (typeof d.args == 'undefined') {
						d.args = [];
					} else {
						d.args = (_.isArray(d.args)) ? d.args : [ d.args ];
					}
					d.message = d.message || null;
					result.push(d);
				} else {
					throw new Error('Unexpected definition. (' + JSON.stringify(d) + ')');
				}

				return result;
			}

			var normalize = function (p) {
				return String(p).replace(/\[(\"|\')(\w+)(\"|\')\]/, ".$2", 'g');
			}

			var result = [];
			for (var path in definitions) {
				result.push({ path: normalize(path), definitions: sanitize(definitions[path]) });
			}

			return result;

		})(definitions);


		this.validators = (function () {

			var getMessage = this.getMessage.bind(this);

			var hasLengthProperty = function (data) {
				 return !((data === void(0) || data === null) || (typeof data.length === 'undefined'));
			}

			var isNumber = function (data, options) {
				if (_.isNumber(data)) {
					return null;
				}
				return (String(data).match(/^\-?[0-9]+$/)) ? null : getMessage(options, 'error_not_a_number');
			};

			return {

				isNumber: isNumber,

				isStrictNumber: function (data, options) {
					return (_.isNumber(data)) ? null : getMessage(options, 'error_not_a_strict_number');
				},

				isString: function (data, options) {
					return (_.isString(data)) ? null : getMessage(options, 'error_not_a_string');
				},

				isArray: function (data, options) {
					return (_.isArray(data)) ? null : getMessage(options, 'error_not_a_array');
				},

				isObject: function(data, options) {
					return (_.isObject(data)) ? null : getMessage(options, 'error_not_a_object');
				},

				minLength: function (data, options) {
					if (!hasLengthProperty(data)) {
						return getMessage(options, 'error_no_length_property');
					}
					if (data.length >= (options.args[0] || 0)) {
						return null;
					}
					return getMessage(options, 'error_length_too_short');
				},

				maxLength: function(data, options) {
					if (!hasLengthProperty(data)) {
						return getMessage(options, 'error_no_length_property');
					}
					if (data.length <= (options.args[0] || 0)) {
						return null;
					}
					return getMessage(options, 'error_length_too_long');
				},

				min: function (data, options) {
					var message = isNumber(data, options);
					if (message) {
						return message;
					}
					return (parseFloat(data) >= options.args[0]) ? null : getMessage(options, 'error_value_too_less');
				},

				max: function (data, options) {
					var message = isNumber(data, options)
					if (message) {
						return message;
					}
					return (parseFloat(data) <= options.args[0]) ? null : getMessage(options, 'error_value_too_great');
				}

			};

		}).bind(this)();
	};

	BeValid.prototype.getMessage = function (options, code) {

		var message = code;

		if (options && options.message) {
			message = options.message;
		} else if (this.locales[this.localeCode] && this.locales[this.localeCode][code]) {
			message = this.locales[this.localeCode][code];
		} else if (this.locales._ && this.locales._[code]) {
			message = this.locales._[code];
		}

		var match = String(message).match(/%args\[([0-9]+)\]%/)
		if (match) {
			message = message.replace(match[0], options.args[match[1]]);
		}

		return message.replace('%name%', options.name || 'Unknown');

	};

	/**
	 * Get value of specified path.
	 */
	BeValid.prototype.getValues = function (path, data) {
		var getSubValues = function (data, tmpPath, flatten) {
			var keys = _.keys(data);
			if (keys.length > 0) {
				for (var i in keys) {
					getSubValues(data[keys[i]], tmpPath + '.' + keys[i], flatten);
				}
			}
			flatten[tmpPath.substring(1, tmpPath.length)] = data;
			return flatten;
		};

		return (function (data, regex) {
			var result = [];
			for (var key in data) {
				if (String(key).match(regex)) {
					result.push({ key: key, data: data[key] });
				}
			}
			return result;
		}(getSubValues(data, '', {}), new RegExp("^" + String(path).replace('*', '[^\.]+') + "$")));
	};

	BeValid.prototype.exec = function (data) {

		var result = [];

		for (var i in this.tests) {

			var test = this.tests[i];
			var path = test.path;
			var definitions = test.definitions;

			var values = this.getValues(path, data);

			for (var j in definitions) {
				var definition = definitions[j];

				if (definition.type == 'required') {
					if (values.length === 0) {
						result.push(this.getMessage(definition, 'error_required', path))
					}
				} else {
					var validator = this.validators[definition.type];
					if (!validator) {
						throw new Error('Unknown validator(' + definition.type + ')');
					}

					for ( var i in values) {
						definition.name = definition.name || values[i].key;
						var validationResult = validator(values[i].data, definition);
						if (validationResult !== null) {
							result.push(validationResult);
						}
					}
				}
			}
		}

		return (result.length === 0)? null : result;

	}

	module.exports = BeValid;

})('BeValid');
