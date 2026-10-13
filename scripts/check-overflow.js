const http = require('http');

async function test() {
  try {
    const res = await fetch('http://localhost:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('localhost:3000')) || tabs[0];
    if (!pageTab) {
      console.log('No page tab found');
      return;
    }
    const WebSocket = require('ws');
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              const docWidth = document.documentElement.clientWidth;
              const bad = [];
              for (const el of document.querySelectorAll('*')) {
                const rect = el.getBoundingClientRect();
                if (rect.right > docWidth + 2) {
                  bad.push({
                    tag: el.tagName,
                    cls: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
                    right: Math.round(rect.right),
                    width: Math.round(rect.width)
                  });
                }
              }
              return { clientWidth: docWidth, scrollWidth: document.documentElement.scrollWidth, bad: bad.slice(0, 10) };
            })()
          `,
          returnByValue: true
        }
      }));
    });
    ws.on('message', data => {
      const msg = JSON.parse(data);
      console.log(JSON.stringify(msg.result?.result?.value, null, 2));
      ws.close();
      process.exit(0);
    });
  } catch (err) {
    console.error(err);
  }
}

test();
