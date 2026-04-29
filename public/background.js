chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PRODUCT_DETECTED') {
    chrome.storage.local.set({ productoDetectado: message.data })
  }
})
