import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export function success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

export function error(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  )
}

export function unauthorized(message = '请先登录'): NextResponse<ApiResponse> {
  return error(message, 401)
}

export function forbidden(message = '无权限访问'): NextResponse<ApiResponse> {
  return error(message, 403)
}

export function notFound(message = '资源不存在'): NextResponse<ApiResponse> {
  return error(message, 404)
}
