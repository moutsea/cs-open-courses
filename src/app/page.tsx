import {redirect} from 'next/navigation';

export default function RootPage() {
  // 检查是否有语言cookie或者根据其他方式确定语言
  // 暂时先重定向到英文，但更好的方式是根据用户的语言偏好
  redirect('/en');
}