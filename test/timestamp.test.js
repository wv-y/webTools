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

test('时间戳支持千分位逗号', () => {
  assert.equal(timestampToBeijingTime('1,787,566,712'), '2026-08-24 18:18:32')
  assert.equal(
    timestampToBeijingTime('1,787,566,712,000', TIMESTAMP_UNITS.MILLISECONDS),
    '2026-08-24 18:18:32',
  )
  assert.equal(timestampToBeijingTime(' -1,000 '), '1970-01-01 07:43:20')
})

test('时间支持不完整格式，月日补 1、时分秒补 0', () => {
  assert.equal(beijingTimeToTimestamp('2026'), 1767196800)
  assert.equal(
    beijingTimeToTimestamp('2026', TIMESTAMP_UNITS.MILLISECONDS),
    1767196800000,
  )
  assert.equal(beijingTimeToTimestamp('2026-08'), beijingTimeToTimestamp('2026-08-01 00:00:00'))
  assert.equal(beijingTimeToTimestamp('2026-08-24'), beijingTimeToTimestamp('2026-08-24 00:00:00'))
  assert.equal(
    beijingTimeToTimestamp('2026-08-24 18'),
    beijingTimeToTimestamp('2026-08-24 18:00:00'),
  )
  assert.equal(
    beijingTimeToTimestamp('2026-08-24 18:18'),
    beijingTimeToTimestamp('2026-08-24 18:18:00'),
  )
})

test('月、日、时、分、秒支持省略前导 0', () => {
  assert.equal(beijingTimeToTimestamp('2026-1'), beijingTimeToTimestamp('2026-01-01 00:00:00'))
  assert.equal(beijingTimeToTimestamp('2026-10-1'), beijingTimeToTimestamp('2026-10-01 00:00:00'))
  assert.equal(beijingTimeToTimestamp('2026-1-1'), beijingTimeToTimestamp('2026-01-01 00:00:00'))
  assert.equal(
    beijingTimeToTimestamp('2026-10-1 8'),
    beijingTimeToTimestamp('2026-10-01 08:00:00'),
  )
  assert.equal(
    beijingTimeToTimestamp('2026-10-1 8:5'),
    beijingTimeToTimestamp('2026-10-01 08:05:00'),
  )
  assert.equal(
    beijingTimeToTimestamp('2026-10-1 8:5:6'),
    beijingTimeToTimestamp('2026-10-01 08:05:06'),
  )
  assert.equal(
    beijingTimeToTimestamp('2026-1-1 0:0:0'),
    beijingTimeToTimestamp('2026-01-01 00:00:00'),
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
  // 不完整输入同样要拦截越界值
  assert.throws(() => beijingTimeToTimestamp('2026-13'))
  assert.throws(() => beijingTimeToTimestamp('2026-00'))
  assert.throws(() => beijingTimeToTimestamp('2026-08-00'))
  assert.throws(() => beijingTimeToTimestamp('2026-08-24 24'))
  assert.throws(() => beijingTimeToTimestamp('2026-08-24 18:60'))
  assert.throws(() => beijingTimeToTimestamp('2026-08-24 18:18:60'))
  // 有日期前不能只写时间
  assert.throws(() => beijingTimeToTimestamp('2026-08 18'))
  // 单个字段最多 2 位
  assert.throws(() => beijingTimeToTimestamp('2026-123'))
  assert.throws(() => beijingTimeToTimestamp('2026-10-1 8:5:6:7'))
  // 千分位逗号格式错误
  assert.throws(() => timestampToBeijingTime('1,76,712'))
  assert.throws(() => timestampToBeijingTime('1,,712'))
  assert.throws(() => timestampToBeijingTime('1,712,'))
})
