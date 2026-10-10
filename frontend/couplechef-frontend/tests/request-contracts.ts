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

Taro.sendSms({ phoneNumber: '10086', content: 'example' }).then(result => {
  const message: string = result.errMsg
  // @ts-expect-error SMS response is a CallbackResult, not an untyped value
  const invalid: number = result.errMsg
  void message
  void invalid
})
// @ts-expect-error SMS phoneNumber must be a string
Taro.sendSms({ phoneNumber: 10086 })
const application = Taro.getApp<{ household: { name: string } }>({ allowDefault: true })
const householdName: string = application.household.name
// @ts-expect-error app generic preserves custom field types
const invalidHousehold: number = application.household.name
// @ts-expect-error an App instance cannot be a numeric primitive
Taro.getApp<number>()
void householdName
void invalidHousehold

Taro.addInterceptor(chain => {
  const url: string | undefined = chain.requestParams.url
  const timeout: number | undefined = chain.requestParams.timeout
  // @ts-expect-error request body is unknown until validated
  chain.requestParams.data.quantity
  // @ts-expect-error timeout retains the actual numeric option type
  chain.requestParams.timeout = 'slow'
  // @ts-expect-error invalid HTTP method cannot be silently forwarded
  chain.requestParams.method = 'INVALID'
  // @ts-expect-error success callback response data is unknown until validated
  chain.requestParams.success = result => { const quantity: number = result.data.quantity; void quantity }
  void url
  void timeout
  return chain.proceed({ ...chain.requestParams, timeout: 5000 })
})
declare const interceptorChain: Taro.Chain
interceptorChain.proceed({})
interceptorChain.proceed({ url: '/api/storage', method: 'POST', data: { quantity: 500 } })
// @ts-expect-error URL is a string even in an incomplete chain
interceptorChain.proceed({ url: 123 })
// @ts-expect-error callbacks are typed functions
interceptorChain.proceed({ success: 'ok' })

const typedInterceptorOptions: Taro.request.Option<{ success: boolean }> = {
  url: '/api/storage',
  success: result => { const success: boolean = result.data.success; void success },
}
interceptorChain.proceed(typedInterceptorOptions)
// @ts-expect-error explicit response type keeps callback payload validation
interceptorChain.proceed<{ success: boolean }>({ url: '/api/storage', success: result => { const invalid: number = result.data.success; void invalid } })

const subscribeResult: Taro.requestSubscribeMessage.SuccessCallbackResult = {
  errMsg: 'requestSubscribeMessage:ok',
  exampleTemplate: 'accept',
  keep: true,
  refuse: false,
  show: true,
  result: { subscribeEntityIds: [], subscribedEntityIds: [], unsubscribedEntityIds: [], currentSubscribedEntityIds: [] },
}
const subscriptionKept: boolean | undefined = subscribeResult.keep
const subscriptionMessage: string = subscribeResult.errMsg
const dynamicSubscription = subscribeResult['exampleTemplate']
if (typeof dynamicSubscription === 'string') {
  const templateStatus: string = dynamicSubscription
  void templateStatus
}
// @ts-expect-error dynamic keys can refer to optional platform fields and require narrowing
const unsafeTemplateStatus: string = subscribeResult['exampleTemplate']
// @ts-expect-error named boolean fields retain their concrete types
subscribeResult.keep = 'yes'
// @ts-expect-error arbitrary numeric subscription values are invalid
subscribeResult['otherTemplate'] = 123
// @ts-expect-error structured subscription result cannot be replaced with a string
subscribeResult.result = 'accept'
void subscriptionKept
void subscriptionMessage
void unsafeTemplateStatus
