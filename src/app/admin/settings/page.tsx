'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* 基础设置 */}
      <Card>
        <CardHeader>
          <CardTitle>基础设置</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-lg">
            <Input label="网站名称" defaultValue="贝果科技" />
            <Input label="联系微信" defaultValue="GenuineMarxist" />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">网站公告</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                rows={3}
                placeholder="请输入网站公告内容..."
              />
            </div>
            <Button type="submit">保存设置</Button>
          </form>
        </CardContent>
      </Card>

      {/* 支付设置 */}
      <Card>
        <CardHeader>
          <CardTitle>支付设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-w-lg">
            {/* 支付宝 */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-medium text-gray-900">支付宝</h4>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
              <div className="space-y-3">
                <Input label="App ID" placeholder="请输入支付宝 App ID" />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">私钥</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                    rows={3}
                    placeholder="请输入应用私钥..."
                  />
                </div>
              </div>
            </div>

            {/* 微信支付 */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-medium text-gray-900">微信支付</h4>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                </label>
              </div>
              <div className="space-y-3">
                <Input label="App ID" placeholder="请输入微信 App ID" />
                <Input label="商户号" placeholder="请输入微信商户号" />
                <Input label="API 密钥" type="password" placeholder="请输入 API 密钥" />
              </div>
            </div>

            <Button type="submit">保存支付设置</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
