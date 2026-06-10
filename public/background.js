chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PRODUCT_DETECTED') {
    chrome.storage.local.set({ productoDetectado: message.data })
  }

  if (message.type === 'KP_SHOW_NOTIFICATION') {
    const payload = message.payload || {}
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: payload.title || 'KueskiPay',
      message: payload.message || 'Tienes una nueva notificacion.',
      priority: 2,
    })
  }

  if (message.action === 'openPopup') {
    chrome.storage.local.set({ kpay_initial_tab: message.tab })
    chrome.action.openPopup()
  }
})
