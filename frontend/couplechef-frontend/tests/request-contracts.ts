import Taro from '@tarojs/taro'

interface Payload { name: string; quantity: number }
interface Response { success: boolean; data: Payload[] }
const task = Taro.request<Response, Payload>({ url: '/api/storage', data: { name: '番茄', quantity: 500 } })
task.abort()
task.then(result => {
  const quantity: number = result.data.data[0].quantity
  // @ts-expect-error response retains numeric quantity
  const invalid: string = result.data.data[0].quantity
  void quantity
  void invalid
})
Taro.request<string, string>({ url: '/api/storage', data: 'text' })
Taro.request<ArrayBuffer, ArrayBuffer>({ url: '/api/storage', data: new ArrayBuffer(8) })
// @ts-expect-error boolean is not a supported request body
Taro.request<Response, boolean>({ url: '/api/storage', data: true })
// Scalar JSON responses and unknown validation boundaries retain their exact types.
Taro.request<number>({ url: '/api/storage' }).then(result => { const scalar: number = result.data; void scalar })
Taro.request<unknown>({ url: '/api/storage' }).then(result => {
  // @ts-expect-error unknown response must be validated before reading fields
  result.data.success
})
// @ts-expect-error callback payload must retain the explicit response shape
const option: Taro.request.Option<Response> = { url: '/api/storage', success: result => { const invalid: string = result.data.data[0].quantity; void invalid } }
void option
Taro.cloud.callContainer<Response, Payload>({ path: '/api/storage', data: { name: '番茄', quantity: 500 } }).then(result => {
  const success: boolean = result.data.success
  // @ts-expect-error container response is not an untyped placeholder
  const invalid: number = result.data.success
  void success
  void invalid
})
// @ts-expect-error unsupported container request body
Taro.cloud.callContainer<Response, number>({ path: '/api/storage', data: 42 })
declare const cloud: Taro.Cloud
cloud.callContainer<Response, string>({ path: '/api/storage', data: 'text' })
// @ts-expect-error Cloud instance overload also rejects boolean payload
cloud.callContainer<Response, boolean>({ path: '/api/storage', data: true })
