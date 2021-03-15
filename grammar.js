module.exports = grammar({
  name: 'sql',

  extras: $ => [
    /\s\n/,
    /\s/,
    $.comment,
    $.marginalia,
  ],

  precedences: $ => [
    [
      'unary_not',
      'binary_exp',
      'binary_times',
      'binary_plus',
      'binary_in',
      'binary_compare',
      'binary_relation',
      'clause_connective',
    ],
  ],

  rules: {
    program: $ => seq(
      $.statement,
      // TODO: other kinds of definitions
    ),

    keyword_select: _ => make_keyword("select"),
    keyword_delete: _ => make_keyword("delete"),
    keyword_create: _ => make_keyword("create"),
    keyword_insert: _ => make_keyword("insert"),
    keyword_replace: _ => make_keyword("replace"),
    keyword_update: _ => make_keyword("update"),
    keyword_into: _ => make_keyword("into"),
    keyword_values: _ => make_keyword("values"),
    keyword_set: _ => make_keyword("set"),
    keyword_from: _ => make_keyword("from"),
    keyword_join: _ => make_keyword("join"),
    keyword_on: _ => make_keyword("on"),
    keyword_where: _ => make_keyword("where"),
    keyword_order_by: _ => make_keyword("order by"),
    keyword_group_by: _ => make_keyword("group by"),
    keyword_having: _ => make_keyword("having"),
    keyword_desc: _ => make_keyword("desc"),
    keyword_asc: _ => make_keyword("asc"),
    keyword_limit: _ => make_keyword("limit"),
    keyword_offset: _ => make_keyword("offset"),
    keyword_primary: _ => make_keyword("primary"),
    keyword_table: _ => make_keyword("table"),
    keyword_key: _ => make_keyword("key"),
    keyword_distinct: _ => make_keyword("distinct"),
    keyword_constraint: _ => make_keyword("constraint"),
    keyword_count: _ => make_keyword("count"),
    keyword_max: _ => make_keyword("max"),
    keyword_min: _ => make_keyword("min"),
    keyword_avg: _ => make_keyword("avg"),
    keyword_in: _ => make_keyword("in"),
    keyword_and: _ => make_keyword("and"),
    keyword_or: _ => make_keyword("or"),
    keyword_not: _ => make_keyword("not"),
    keyword_force: _ => make_keyword("force"),
    keyword_use: _ => make_keyword("use"),
    keyword_index: _ => make_keyword("index"),
    keyword_for: _ => make_keyword("for"),
    keyword_if: _ => make_keyword("if"),
    keyword_exists: _ => make_keyword("exists"),
    keyword_auto_increment: _ => make_keyword("auto_increment"),
    keyword_default: _ => make_keyword("default"),

    _not_null: $ => seq($.keyword_not, $.keyword_null),
    _primary_key: $ => seq($.keyword_primary, $.keyword_key),
    _if_not_exists: $ => seq($.keyword_if, $.keyword_not, $.keyword_exists),
    _default_null: $ => seq($.keyword_default, $.keyword_null),
    direction: $ => choice($.keyword_desc, $.keyword_asc),

    // Types
    keyword_bigint: _ => make_keyword("bigint"),
    keyword_null: _ => make_keyword("null"),
    keyword_date: _ => make_keyword("date"),
    keyword_datetime: _ => make_keyword("datetime"),
    keyword_char: _ => make_keyword("char"),
    keyword_varchar: _ => make_keyword("varchar"),

    _type: $ => choice(
      $.bigint,
      $.keyword_date,
      $.keyword_datetime,
      $.char,
      $.varchar,
    ),

    bigint: $ => sized_type($, $.keyword_bigint),
    char: $ => sized_type($, $.keyword_char),
    varchar: $ => sized_type($, $.keyword_varchar),

    comment: _ => /--.*\n/,
    marginalia: _ => /\/'*.*\*\//,

    statement: $ => choice(
      $._select_statement,
      $._delete_statement,
      $._create_statement,
      $._insert_statement,
      $._update_statement,
    ),

    _select_statement: $ => seq(
      $.select,
      optional($.from),
      ';',
    ),

    select: $ => seq(
      $.keyword_select,
      $.select_expression,
    ),

    select_expression: $ => choice(
      $._field_list,
    ),

    _delete_statement: $ => seq(
      $.delete,
      alias($._delete_from, $.from),
      ';',
    ),

    _delete_from: $ => seq(
      $.keyword_from,
      $.table_expression,
      optional($.where),
      optional($.order_by),
      optional($.limit),
    ),


    delete: $ => seq(
      $.keyword_delete,
      optional($.index_hint),
    ),

    _create_statement: $ => seq(
      $.create,
      ';',
    ),

    create: $ => seq(
      $.keyword_create,
      $.keyword_table,
      optional($._if_not_exists),
      $.table_reference,
      $.column_definitions,
      optional($.table_options),
    ),

    table_reference: $ => seq(
      optional(
        seq(
          field('schema', $.identifier),
          '.',
        ),
      ),
      field('name', $.identifier),
    ),


    _insert_statement: $ => seq(
      $.insert,
      ';',
    ),

    insert: $ => seq(
      choice($.keyword_insert, $.keyword_replace),
      $.keyword_into,
      $.insert_expression,
    ),

    insert_expression: $ => seq(
      $.table_reference,
      optional(alias($._column_list_without_order, $.column_list)),
      $.keyword_values,
      $.list,
    ),

    _column_list_without_order: $ => param_list(alias($._column_without_order, $.column)),
    _column_without_order: $ => field('name', $.identifier),

    _update_statement: $ => seq(
      $.update,
      ';',
    ),

    update: $ => seq(
      $.keyword_update,
      $.update_expression,
    ),

    update_expression: $ => choice(
      $._single_table_update,
      $._multi_table_update,
    ),

    _single_table_update: $ => seq(
      $.table_reference,
      $.keyword_set,
      $.assignment_list,
      optional($.where),
      optional($.order_by),
      optional($.limit),
    ),

    _multi_table_update: $ => seq(
      $._table_references,
      $.keyword_set,
      $.assignment_list,
      optional($.where),
    ),

    _table_references: $ => seq(
      $.table_reference,
      repeat1(
        seq(',', $.table_reference),
      ),
    ),

    assignment_list: $ => seq(
      $.predicate,
      repeat(
        seq(',', $.predicate),
      ),
    ),

    table_options: $ => repeat1($.table_option),
    table_option: $ => choice(
      field('name', alias($.keyword_default, $.identifier)),
      seq(
        field('name', $.identifier),
        '=',
        field('value', $.identifier),
      ),
    ),

    column_definitions: $ => seq(
      '(',
      $.column_definition,
      repeat(
        seq(',', $.column_definition),
      ),
      optional($.constraints),
      ')',
    ),

    column_definition: $ => seq(
      field('name', $.identifier),
      field('type', $._type),
      choice(
        optional($._not_null),
        optional($._default_null),
      ),
      optional($.keyword_auto_increment),
      optional($._primary_key),
      optional($.direction),
    ),

    constraints: $ => seq(
      ',',
      $.constraint,
      repeat(
        seq(',', $.constraint),
      ),
    ),

    constraint: $ => choice(
      $._constraint_literal,
      $._key_constraint,
      $._primary_key_constraint,
    ),

    _constraint_literal: $ => seq(
      $.keyword_constraint,
      field('name', $.identifier),
      $._primary_key,
      $.column_list,
    ),

    _primary_key_constraint: $ => seq(
      $._primary_key,
      $.column_list,
    ),

    _key_constraint: $ => seq(
      $.keyword_key,
      field('name', $.identifier),
      $.column_list,
    ),

    column_list: $ => param_list($.column),

    column: $ => seq(
      field('name', $.identifier),
      optional($.direction),
    ),

    _field_list: $ => choice(
      '*',
      $.literal,
      seq(
        choice(
          $.function_call,
          $.field,
        ),
        repeat(
          seq(
            ',',
            choice(
              $.function_call,
              $.field,
            ),
          ),
        ),
      ),
    ),

    field: $ => choice(
      seq(
        optional(
          seq(
            field('table_alias', $.identifier),
            '.',
          ),
        ),
        field('name', $.identifier),
      ),
    ),

    function_call: $ => seq(
      field('name', $.function_name),
      '(',
      field('parameter',
        choice(
          $.function_call,
          field('parameter', $.field),
        )
      ),
      ')',
    ),

    function_name: $ => alias($._function_name, $.identifier),

    _function_name: $ => choice(
      alias($.keyword_distinct, 'distinct'),
      alias($.keyword_count, 'count'),
      alias($.keyword_max, 'max'),
      alias($.keyword_min, 'min'),
      alias($.keyword_avg, 'avg'),
    ),

    from: $ => seq(
      $.keyword_from,
      $.table_expression,
      optional($.index_hint),
      repeat($.join),
      optional($.where),
      optional($.group_by),
      optional($.order_by),
      optional($.limit),
    ),

    table_expression: $ => seq(
      field('name', $.identifier),
      optional(field('table_alias', $.identifier)),
    ),

    index_hint: $ => seq(
      choice(
        $.keyword_force,
        $.keyword_use,
      ),
      $.keyword_index,
      optional(
        seq(
          $.keyword_for,
          $.keyword_join,
        ),
      ),
      '(',
      field('index_name', $.identifier),
      ')',
    ),

    join: $ => seq(
      $.keyword_join,
      $.table_expression,
      optional($.index_hint),
      $.keyword_on,
      $.predicate,
    ),

    where: $ => seq(
      $.keyword_where,
      $.where_expression,
    ),

    group_by: $ => seq(
      $.keyword_group_by,
      $.identifier,
      optional($._having),
    ),

    _having: $ => seq(
      $.keyword_having,
      $.predicate,
    ),

    order_by: $ => seq(
      $.keyword_order_by,
      $.order_expression,
    ),

    order_expression: $ => seq(
      $._field_list,
      optional($.direction),
    ),

    limit: $ => seq(
      $.keyword_limit,
      $.literal,
      optional($.offset),
    ),

    offset: $ => seq(
      $.keyword_offset,
      $.literal,
    ),

    where_expression: $ => seq(
      $._expression,
    ),

    predicate: $ => choice(
      ...[
        ['+', 'binary_plus'],
        ['-', 'binary_plus'],
        ['*', 'binary_times'],
        ['/', 'binary_times'],
        ['%', 'binary_times'],
        ['^', 'binary_exp'],
        ['=', 'binary_relation'],
        ['<', 'binary_relation'],
        ['<=', 'binary_relation'],
        ['!=', 'binary_relation'],
        ['>=', 'binary_relation'],
        ['>', 'binary_relation'],
        [$.keyword_and, 'clause_connective'],
        [$.keyword_or, 'clause_connective'],
        [$.keyword_in, 'binary_in'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      )
    ),

    _expression: $ => choice(
      $.literal,
      $.list,
      $.field,
      $.predicate,
    ),

    list: $ => param_list($.literal),

    operator: $ => choice(
      '=',
      '>',
      '<',
      '+',
      '-',
      '*',
      '/',
      '%',
      '^',
      '<',
      '<=',
      '!=',
      '>=',
      '>',
      $.keyword_in,
    ),

    literal: $ => prec(2,
      choice(
        $._number,
        $._literal_string,
      ),
    ),
    _literal_string: _ => choice(
      seq("'", /[^']*/, "'"),
      seq('"', /[^']*/, '"'),
    ),
    _number: _ => /\d+/,

    identifier: $ => choice(
      $._identifier,
      seq('`', $._identifier, '`'),
    ),
    _identifier: _ => /([a-zA-Z_$][0-9a-zA-Z_]*)/,
  }

});

function sized_type($, type) {
  return choice(
    type,
    seq(
      type,
      '(',
      field('size', alias($._number, $.literal)),
      ')',
    ),
  )
}

function param_list(field) {
  return seq(
    '(',
    field,
    repeat(
      seq(',', field)
    ),
    ')',
  )
}

function make_keyword(word) {
  return new RegExp(word + "|" + word.toUpperCase());
}