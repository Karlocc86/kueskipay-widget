chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PRODUCT_DETECTED') {
    chrome.storage.local.set({ productoDetectado: message.data })
  }

  if (message.action === 'openPopup') {
    chrome.storage.local.set({ kpay_initial_tab: message.tab })
    chrome.action.openPopup()
  }
})
