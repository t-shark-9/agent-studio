window.canvasAction = function canvasAction(action, data) {
  window.parent.postMessage({ type: 'canvas-action', action, data }, '*');
};

window.parent.postMessage({ type: 'canvas-ready', preview: true }, '*');