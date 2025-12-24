const isHttpURL = (value) => /^https?:\/\//i.test(String(value || '').trim())

// 支付跳转兼容：
// - 新版后端：返回相对路径（例如 /api/payment/submit?...），直接跳转即可（同域/反代/开发代理）。
// - 旧版后端：直接返回网关 submit.php 的 GET 链接（带 query），需要转为 POST 表单提交，否则浏览器 GET 打开可能出现 404。
export const redirectToPay = (payURL) => {
  const urlStr = String(payURL || '').trim()
  if (!urlStr) return

  if (!isHttpURL(urlStr)) {
    window.location.href = urlStr
    return
  }

  try {
    const u = new URL(urlStr)
    if (u.pathname.endsWith('/pay/submit.php') && Array.from(u.searchParams.keys()).length > 0) {
      const form = document.createElement('form')
      form.method = 'post'
      form.action = `${u.origin}${u.pathname}`

      u.searchParams.forEach((v, k) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = k
        input.value = v
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
      return
    }
  } catch {
    // ignore
  }

  window.location.href = urlStr
}

