var _ = require('lodash'),
	BeValid = require('../lib/bevalid'),
	assert = require('chai').assert;

describe('constructor', function () {
	it('parseDefinition', function () {

		var definition1 = {
			'key1': 'required',
			'key2': [
				'required',
				{ type: 'number' },
				{ type: 'min', args: 0 },
				{ type: 'max', args: [ 100 ] }
			],
			'key3': [
				{ type: 'required', message: 'key3 is required' }
			],
			"foo['bar1'].*": 'required'
		};

		var validator = new BeValid(definition1);
		assert.deepEqual(
			validator.tests,
			[
					{
						"path": "key1",
						"definitions": [
							{ "type": "required", "args": [], "message": null }
						]
					},
					{
						"path": "key2",
						"definitions": [
							{ "type": "required", "args": [], "message": null },
							{ "type": "number", "args": [], "message": null },
							{ "type": "min", "args": [ 0 ], "message": null },
							{ "type": "max", "args": [ 100 ], "message": null }
						]
					},
					{
						"path": "key3",
						"definitions": [
							{ "type": "required", "args": [], "message": "key3 is required" }
						]
					},
					{
						"path": "foo.bar1.*",
						"definitions": [
							{ "type": "required", "args": [], "message": null }
						]
					}
				]);
	});
});

describe('validator', function () {
	var verbose = false;

	var _pass = function (val, name) { assert.isNull(val, name); },
		_fail = function (expect) { return function (val, name) { assert[_.isString(expect) ? 'equal' : 'match'](val, expect, name); } };

	var Suite = function (defaultAssertion) {

		this.validator = new BeValid({});

		this.defaultAssertion = defaultAssertion || _fail;

		this.data = {
			_undefined: { value: void(0) },
			_null: { value: null },
			_boolTrue: { value: true },
			_boolFalse: { value: false },
			_negativeIntNumber: { value: -123 },
			_negativeFloatNumber: { value: -1.3 },
			_zeroIntNumber: { value: 0 },
			_zeroFloatNumber: { value: 0.0 },
			_positiveIntNumber: { value: 123 },
			_positiveFloatNumber: { value: 1.3 },
			_string: { value: 'abc123' },
			_emptyString: { value: '' },
			_positiveNumberString: { value: '123' },
			_negativeNumberString: { value: '-123' },
			_alphabeticString: { value: 'abcd' },
			_date: { value: new Date() },
			_emptyArray: { value: [] },
			_array: { value: [ 1, 2, 3 ] },
			_emptyObject: { value: {} },
			_object: { value: { key: 'value', key2: 'value2' }}
		};

	};

	Suite.prototype = {
		expect: function (name, assertion) {
			(this.data[name] || {}).assertion = assertion;
			return this;
		},
		test: function (name, options) {
			it(name, (function () {

				var validator = this.validator.validators[name];

				for (var key in this.data) {
					var value = this.data[key].value;
					var assertion = this.data[key].assertion || this.defaultAssertion;

					var result = validator(value, options || this.data[key].options || {});

					assertion(result, key);
				}

			}).bind(this));
		}
	};


	describe('validators', function() {

		new Suite(_fail('Unknown is not a string.'))
				.expect('_emptyString', _pass)
				.expect('_string', _pass)
				.expect('_positiveNumberString', _pass)
				.expect('_negativeNumberString', _pass)
				.expect('_alphabeticString', _pass)
					.test('isString');

		new Suite(_fail('Invalid data type for Unknown.'))
				.expect('_emptyString', _pass)
				.expect('_string', _pass)
				.expect('_positiveNumberString', _pass)
				.expect('_negativeNumberString', _pass)
				.expect('_alphabeticString', _pass)
				.expect('_emptyArray', _pass)
				.expect('_array', _pass)
					.test('minLength', { args: [ 0 ] });

		new Suite(_fail('Invalid data type for Unknown.'))
				.expect('_emptyString', _pass)
				.expect('_string', _pass)
				.expect('_positiveNumberString', _pass)
				.expect('_negativeNumberString', _pass)
				.expect('_alphabeticString', _pass)
				.expect('_emptyArray', _pass)
				.expect('_array', _pass)
					.test('maxLength', { args: [ 100 ] });

		new Suite(_fail('Unknown is not a strict number.'))
				.expect('_positiveIntNumber', _pass)
				.expect('_positiveFloatNumber', _pass)
				.expect('_zeroIntNumber', _pass)
				.expect('_zeroFloatNumber', _pass)
				.expect('_negativeIntNumber', _pass)
				.expect('_negativeFloatNumber', _pass)
					.test('isStrictNumber');

		new Suite(_fail('Unknown is not a number.'))
				.expect('_positiveIntNumber', _pass)
				.expect('_positiveFloatNumber', _pass)
				.expect('_zeroIntNumber', _pass)
				.expect('_zeroFloatNumber', _pass)
				.expect('_negativeIntNumber', _pass)
				.expect('_negativeFloatNumber', _pass)
				.expect('_positiveNumberString', _pass)
				.expect('_negativeNumberString', _pass)
					.test('isNumber');

		var MIN_ERR = _fail('Value of Unknown is less than 0.')
		new Suite(_fail('Unknown is not a number.'))
				.expect('_positiveIntNumber', _pass)
				.expect('_positiveFloatNumber', _pass)
				.expect('_positiveNumberString', _pass)
				.expect('_zeroIntNumber', _pass)
				.expect('_zeroFloatNumber', _pass)
				.expect('_negativeIntNumber', MIN_ERR)
				.expect('_negativeFloatNumber', MIN_ERR)
				.expect('_negativeNumberString', MIN_ERR)
					.test('min', { args: [ 0 ] });

		var MAX_ERR = _fail('Value of Unknown is greater than 0.')
		new Suite(_fail('Unknown is not a number.'))
				.expect('_positiveIntNumber', MAX_ERR)
				.expect('_positiveFloatNumber', MAX_ERR)
				.expect('_positiveNumberString', MAX_ERR)
				.expect('_zeroIntNumber', _pass)
				.expect('_zeroFloatNumber', _pass)
				.expect('_negativeIntNumber', _pass)
				.expect('_negativeFloatNumber', _pass)
				.expect('_negativeNumberString', _pass)
					.test('max', { args: [ 0 ] });

		new Suite(_fail('Unknown is not a array.'))
				.expect('_emptyArray', _pass)
				.expect('_array', _pass)
					.test('isArray');


		new Suite(_fail('Unknown is not a object.'))
				.expect('_date', _pass)
				.expect('_emptyArray', _pass)
				.expect('_array', _pass)
				.expect('_emptyObject', _pass)
				.expect('_object', _pass)
					.test('isObject');

	});

})

describe('exec', function () {
	describe('getValues', function() {

		var data = {
			key1: 1,
			key2: [
				{ key3: 3, key4: 4 },
				{ key5: 5 }
			],
			key6: {
				key7: {
					key8: 8
				}
			},
			key9: {
				key10: { val: 0 },
				key11: { val: 0 },
			}
		};

		it('test', function () {

			var validator = new BeValid();
			assert.deepEqual(validator.getValues('key1', data),
				[ { key: 'key1', data: 1 } ]);
			assert.deepEqual(validator.getValues('key2.*', data),
				[ { key: 'key2.0', data: { key3: 3, key4: 4} }, { key: 'key2.1', data: { key5: 5 } } ]);
			assert.deepEqual(validator.getValues('key6.*.key8', data),
				[ { key: 'key6.key7.key8', data: 8 } ]);
			assert.deepEqual(validator.getValues('key9.*.val', data),
				[ { key: 'key9.key10.val', data: 0 }, { key: 'key9.key11.val', data: 0 } ]);
		});
		
	});

	describe('exec', function() {

		it('pass', function () {

			var definition = {
				'key1': 'required',
				'key2.*': [
					'required',
					'isNumber'
				]
			};

			var data = { key1: true, key2: [ 1, '2' ] };
			var validator = new BeValid(definition, 'ja');
			var result = validator.exec(data);
			assert.isNull(result);

		});

		it('fail', function () {
			var definition = {
				'key1': 'required',
				'key2.*': [
					'required',
					{ type: 'isStrictNumber', message: 'Error(%name%)' }
				]
			};

			var data = { key1: true, key2: [ 1, '2' ] };
			var validator = new BeValid(definition, 'ja');
			var result = validator.exec(data);
			assert.deepEqual(result, [ 'Error(key2.0)' ]);
		});

	});
})