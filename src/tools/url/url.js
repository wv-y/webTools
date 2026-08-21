export const URL_MODES = {
  URI: 'encodeURI',
  COMPONENT: 'encodeURIComponent',
  QUERY_VALUES: 'queryValues',
}

export function encodeUrl(value, mode = URL_MODES.URI) {
  if (mode === URL_MODES.QUERY_VALUES) {
    return transformQueryValues(value, encodeURIComponent)
  }

  return mode === URL_MODES.COMPONENT ? encodeURIComponent(value) : encodeURI(value)
}

export function decodeUrl(value, mode = URL_MODES.URI) {
  if (mode === URL_MODES.QUERY_VALUES) {
    return transformQueryValues(value, decodeURIComponent)
  }

  return mode === URL_MODES.COMPONENT ? decodeURIComponent(value) : decodeURI(value)
}

function transformQueryValues(value, transform) {
  const queryStart = value.indexOf('?')

  if (queryStart === -1) {
    return value
  }

  const fragmentStart = value.indexOf('#', queryStart)
  const queryEnd = fragmentStart === -1 ? value.length : fragmentStart
  const query = value.slice(queryStart + 1, queryEnd)
  const transformedQuery = query
    .split('&')
    .map((parameter) => {
      const separator = parameter.indexOf('=')
      return separator === -1
        ? parameter
        : `${parameter.slice(0, separator + 1)}${transform(parameter.slice(separator + 1))}`
    })
    .join('&')

  return `${value.slice(0, queryStart + 1)}${transformedQuery}${value.slice(queryEnd)}`
}
