import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beijingTimeToTimestamp,
  formatBeijingTime,
  timestampToBeijingTime,
  TIMESTAMP_UNITS,
} from '../src/tools/timestamp/timestamp.js'

test('秒级和毫秒级时间戳按北京时间显示', () => {
  assert.equal(timestampToBeijingTime('1787566712'), '2026-08-24 18:18:32')
  assert.equal(
    timestampToBeijingTime('1787566712000', TIMESTAMP_UNITS.MILLISECONDS),
    '2026-08-24 18:18:32',
  )
})

test('北京时间转换为秒级和毫秒级时间戳', () => {
  assert.equal(beijingTimeToTimestamp('2026-08-24 18:18:32'), 1787566712)
  assert.equal(
    beijingTimeToTimestamp('2026-08-24 18:18:32', TIMESTAMP_UNITS.MILLISECONDS),
    1787566712000,
  )
})

test('格式化结果不受运行机器时区影响', () => {
  assert.equal(formatBeijingTime(0), '1970-01-01 08:00:00')
  assert.equal(timestampToBeijingTime('-1'), '1970-01-01 07:59:59')
})

test('拒绝错误格式和不存在的北京时间', () => {
  assert.throws(() => beijingTimeToTimestamp('2026/08/24 18:18:32'))
  assert.throws(() => beijingTimeToTimestamp('2026-02-30 18:18:32'))
  assert.throws(() => timestampToBeijingTime('123abc'))
})
