'use client'

/**
 * 个人中心拿「短信接码对全部用户开放了吗」（docs/短信接码-设计.md §1.2：个人中心快捷功能「我的接码记录」与导航、页脚同理，
 * 要求 features.jiema && jiemaOpen）。jiemaOpen 由 profile/layout.tsx 在服务端读 sms_config 算好（与前台外壳同一个判定），
 * 个人中心页面是客户端组件，经这个 context 取值；没有 Provider 时按「关」（灰度期不出现入口）。
 */
import { createContext, useContext } from 'react'

const JiemaOpenContext = createContext(false)

export function JiemaOpenProvider(props: { value: boolean; children: React.ReactNode }): JSX.Element {
  return <JiemaOpenContext.Provider value={props.value}>{props.children}</JiemaOpenContext.Provider>
}

export function useJiemaOpen(): boolean {
  return useContext(JiemaOpenContext)
}
