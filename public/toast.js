function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  
  var existing = document.querySelector('.moonstar-toast');
  if (existing) existing.remove();
  
  var toast = document.createElement('div');
  toast.className = 'moonstar-toast toast-' + type;
  
  var icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  
  var titles = { success: 'Success', error: 'Error', info: 'Info' };
  
  toast.innerHTML = '<div class="toast-icon">' + (icons[type] || icons.info) + '</div>' +
    '<div class="toast-content"><div class="toast-title">' + (titles[type] || 'Message') + '</div>' +
    '<div class="toast-message">' + message + '</div></div>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">×</button>' +
    '<div class="toast-progress"></div>';
  
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 400);
  }, duration);
}

var style = document.createElement('style');
style.textContent = '.moonstar-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-150%) scale(0.9);min-width:300px;max-width:92vw;background:#FFF;border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:14px;z-index:99999;box-shadow:0 20px 60px rgba(30,41,59,0.25);transition:all 0.5s cubic-bezier(0.16,1,0.3,1);font-family:Inter,sans-serif;opacity:0;border:1.5px solid rgba(255,255,255,0.9)}.moonstar-toast.show{transform:translateX(-50%) translateY(0) scale(1);opacity:1}.toast-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.toast-content{flex:1}.toast-title{font-size:13px;font-weight:800;margin-bottom:3px}.toast-message{font-size:12px;font-weight:500;color:#64748B;line-height:1.4}.toast-close{background:#F1F5F9;border:none;width:26px;height:26px;border-radius:8px;cursor:pointer;color:#64748B;font-family:Inter,sans-serif;font-weight:800;font-size:14px}.toast-progress{position:absolute;bottom:0;left:0;height:3px;width:100%;transform-origin:left;animation:toastProgress 3s linear forwards}@keyframes toastProgress{from{transform:scaleX(1)}to{transform:scaleX(0)}}.toast-success{border-color:#86EFAC}.toast-success .toast-icon{background:#D1FAE5;color:#059669}.toast-success .toast-title{color:#059669}.toast-success .toast-progress{background:linear-gradient(90deg,#10B981,#34D399)}.toast-error{border-color:#FECACA}.toast-error .toast-icon{background:#FEE2E2;color:#DC2626}.toast-error .toast-title{color:#DC2626}.toast-error .toast-progress{background:linear-gradient(90deg,#DC2626,#EF4444)}.toast-info{border-color:#FECACA}.toast-info .toast-icon{background:#FEE2E2;color:#DC2626}.toast-info .toast-title{color:#DC2626}.toast-info .toast-progress{background:linear-gradient(90deg,#DC2626,#EF4444)}';
document.head.appendChild(style);
