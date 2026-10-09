import '@tarojs/taro'

declare module '@tarojs/taro' {
  /** Interceptor chains may start with empty options; body data needs validation. */
  interface RequestParams<T = unknown> extends Partial<Omit<request.Option<T>, 'data'>> {
    data?: unknown
  }

  interface Chain {
    /** Preserve an explicitly typed response callback when forwarding options. */
    proceed<T = unknown>(requestParams: RequestParams<T>): ReturnType<interceptor>
  }
}
