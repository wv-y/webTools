import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeUrl, encodeUrl, URL_MODES } from '../src/tools/url/url.js'

test('UTF-8 encodeURI 保留 URL 结构字符', () => {
  const source = 'https://example.com/搜索?q=hello world&lang=中文'

  assert.equal(
    encodeUrl(source, URL_MODES.URI),
    'https://example.com/%E6%90%9C%E7%B4%A2?q=hello%20world&lang=%E4%B8%AD%E6%96%87',
  )
})

test('encodeURIComponent 会编码 URL 结构字符', () => {
  assert.equal(
    encodeUrl('搜索?q=hello world', URL_MODES.COMPONENT),
    '%E6%90%9C%E7%B4%A2%3Fq%3Dhello%20world',
  )
})

test('两种模式都可以还原 UTF-8 文本', () => {
  const uri = 'https://example.com/%E6%90%9C%E7%B4%A2?q=hello%20world'
  const component = '%E6%90%9C%E7%B4%A2%3Fq%3Dhello%20world'

  assert.equal(decodeUrl(uri, URL_MODES.URI), 'https://example.com/搜索?q=hello world')
  assert.equal(decodeUrl(component, URL_MODES.COMPONENT), '搜索?q=hello world')
})

test('参数值模式只编码查询参数值', () => {
  const source = 'http://www.esjson.com/unicodeEncode.html?url=https://my.com'

  assert.equal(
    encodeUrl(source, URL_MODES.QUERY_VALUES),
    'http://www.esjson.com/unicodeEncode.html?url=https%3A%2F%2Fmy.com',
  )
})

test('参数值模式支持多个参数、等号和 fragment 往返转换', () => {
  const source = 'https://example.com/path?url=https://my.com?a=1&keyword=中文 空格#result'
  const encoded = encodeUrl(source, URL_MODES.QUERY_VALUES)

  assert.equal(
    encoded,
    'https://example.com/path?url=https%3A%2F%2Fmy.com%3Fa%3D1&keyword=%E4%B8%AD%E6%96%87%20%E7%A9%BA%E6%A0%BC#result',
  )
  assert.equal(decodeUrl(encoded, URL_MODES.QUERY_VALUES), source)
})

test('非法百分号编码会抛出错误', () => {
  assert.throws(() => decodeUrl('%E0%A4%A', URL_MODES.URI), URIError)
})
