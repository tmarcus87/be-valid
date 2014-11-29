be-valid
========

```
var data1 = {
	key1: 'hogehoge',
	key2: [ 1, 2, 3 ],
	key3: 'piyo',
	key4: {
		key5: {
			key6: "2015-01-01T09:00:00Z";
		}
	}
};

var data2 = { key7: 'fuga' };

var definition = {
	'key1': [ 'required', 'notEmpty' ],
	'key2': [ 'required', 'array' ],
	'key2.*': [
		'number',
		{ type: 'min', args: 0, message: 'key2.* must be >= 0' },
		{ type: 'max', args: [ 100 ], message: 'key2.* must be <= 100' }
	],
	'key3': { type: 'enums', args: [ 'hoge', 'fuga', 'piyo' ] },
	'key4["key5"].key6': [ 'isoDate' ]
}

> var validator = new BeValid(definition)
> console.log(validator.exec(data1));
false;
> console.log(validator.exec(data2));
[
	"'key1' is required'",
	"'key2' is required",
	"'key3' is must be one of the (hoge, fuga, piyo)",
	"'key4.key5.key6' is not isoDate".
]
```