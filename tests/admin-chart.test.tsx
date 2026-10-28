import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { JSDOM } from 'jsdom'
import { act } from 'react'

/**
 * 后台柱状图的回归：数值怎么读（柱上标注 / 悬浮 / 聚焦 / 点按）、
 * 以及几个曾经踩过的坑（刻度重复、90 天车道被挤扁、小屏卡片越界）。
 * 这里直接渲染 panels 里的 DayChart / TrafficChart，顺带覆盖缺天补 0 的映射。
 */
async function setup(t: TestContext) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'https://www.cs61bbeyond.com/admin/analytics',
    pretendToBeVisual: true
  })
  const { window } = dom
  const globals = {
    window,
    document: window.document,
    navigator: window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true
  }
  const descriptors = Object.keys(globals).map(
    key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const
  )
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  }

  const { createRoot } = await import('react-dom/client')
  const root = createRoot(window.document.getElementById('root')!)

  async function render(node: React.ReactElement) {
    await act(async () => root.render(node))
  }

  // jsdom 的 window 在类型上是弱类型的，这里按浏览器 DOM 类型收敛一次。
  const document = window.document as unknown as Document
  const MouseEventCtor = (window as unknown as Window).MouseEvent
  const KeyEventCtor = (window as unknown as Window).KeyboardEvent
  const columns = () => [...document.querySelectorAll('button')]
  const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]')
  const text = () => document.getElementById('root')?.textContent ?? ''
  /** 柱子所在的那一行（决定车道间距）。 */
  const rowClassName = () => columns()[0]?.parentElement?.className ?? ''
  /** 绘图区（接指针的那一层）。 */
  const plot = () => columns()[0]?.parentElement?.parentElement as HTMLElement

  /** jsdom 没有布局，这里给绘图区造一个指定宽度、148px 高的盒子。 */
  function stubPlotRect(width = 900) {
    const element = plot()
    Object.defineProperty(element, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width, height: 148, right: width, bottom: 148, x: 0, y: 0, toJSON: () => ({}) })
    })
    return element
  }

  /** 按 0~1 的比例在绘图区上派发指针事件。 */
  async function pointer(ratio: number, kind: 'move' | 'click' = 'move', detail = 1) {
    const element = stubPlotRect()
    const type = kind === 'move' ? 'pointermove' : 'click'
    await act(async () => {
      element.dispatchEvent(
        new MouseEventCtor(type, { bubbles: true, clientX: ratio * 900, detail })
      )
    })
  }

  async function hover(index: number | null) {
    const buttons = columns()
    await act(async () => {
      if (index === null) {
        buttons.forEach(button =>
          button.dispatchEvent(
            new MouseEventCtor('mouseout', { bubbles: true, relatedTarget: document.body })
          )
        )
        return
      }
      buttons[index].dispatchEvent(
        new MouseEventCtor('mouseover', { bubbles: true, relatedTarget: document.body })
      )
    })
  }

  async function focus(index: number) {
    await act(async () => columns()[index].focus())
  }

  async function click(index: number) {
    await act(async () => columns()[index].click())
  }

  /** 在某列上按方向键（roving tabindex 的移动路径）。 */
  async function press(index: number, key: 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End') {
    await act(async () => {
      columns()[index].dispatchEvent(new KeyEventCtor('keydown', { key, bubbles: true, cancelable: true }))
    })
  }

  t.after(async () => {
    await act(async () => root.unmount())
    window.close()
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  })

  return { window, render, columns, tooltip, text, rowClassName, plot, stubPlotRect, pointer, hover, focus, click, press }
}

const trafficDaily = [
  { day: '2026-10-20', pv: 120, uv: 30, bots: 0 },
  { day: '2026-10-21', pv: 0, uv: 0, bots: 0 },
  { day: '2026-10-22', pv: 40, uv: 12, bots: 3 }
]

test('traffic chart exposes numbers on hover, focus and tap', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(<TrafficChart daily={trafficDaily} />)

  const buttons = ui.columns()
  assert.equal(buttons.length, 3)
  // 悬浮之前没有任何数字卡片，但每列都带着可读的 aria-label。
  assert.equal(ui.tooltip(), null)
  assert.match(buttons[0].getAttribute('aria-label') ?? '', /2026-10-20：PV 120，日 UV 30/)

  await ui.hover(0)
  const card = ui.tooltip()
  assert.ok(card, '悬浮后应出现数值卡片')
  const text = card!.textContent ?? ''
  for (const expected of ['2026-10-20', 'PV', '120', '日 UV', '30']) {
    assert.ok(text.includes(expected), `悬浮卡片应包含 ${expected}，实际是 ${text}`)
  }
  const style = card!.getAttribute('style') ?? ''
  // jsdom 会丢掉 min() / clamp() 这类值，样式里只剩 transform，位置细节看下面的纯函数断言。
  assert.match(style, /translateX\(-50%\)/)
  // jsdom 不认 clamp() / min()，定位数值单独用纯函数覆盖。
  const { tooltipPlacement } = await import('../src/components/admin/chartMath')
  const placement = tooltipPlacement({ index: 0, count: 3, height: '100%' })
  // 卡片宽度与夹紧半宽都用 min()：绘图区比卡片还窄时（小屏）卡片正好铺满绘图区，不会顶出卡片。
  assert.equal(placement.width, 'min(232px, 100%)')
  assert.match(
    placement.left,
    /^clamp\(min\(116px, 50%\), 16\.66\d*%, calc\(100% - min\(116px, 50%\)\)\)$/
  )
  assert.equal(placement.top, 'calc(100% - 100% + 10px)', 'a full-height bar flips its tooltip below the bar top')
  assert.equal(tooltipPlacement({ index: 0, count: 3, height: '49%' }).bottom, 'calc(49% + 10px)', 'bars below half-height keep the tooltip above')
  assert.equal(tooltipPlacement({ index: 0, count: 3, height: '50%' }).top, 'calc(100% - 50% + 10px)', 'bars at half-height flip below to keep enough room')
  assert.equal(tooltipPlacement({ index: 1, count: 90, height: '2px' }).bottom, 'calc(2px + 10px)', 'short bars keep the tooltip above the bar')
  assert.match(ui.tooltip()!.className, /pointer-events-none/, 'tooltips should not intercept pointer interaction')
  assert.doesNotMatch(ui.tooltip()!.className, /max-h-|overflow-y-auto/, 'tooltips must not clip wrapped metrics')

  // 移出绘图区就收起。
  await ui.hover(null)
  assert.equal(ui.tooltip(), null)

  // 键盘聚焦同样能看到数值。
  await ui.focus(0)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-20/)
  await act(async () => ui.columns()[0].blur())
  assert.equal(ui.tooltip(), null)

  // 触屏路径：点按直接钉住卡片。
  await ui.click(1)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-21/)
})

test('traffic chart draws flat bars for zero days and labels every sparse lane', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(<TrafficChart daily={trafficDaily} />)

  const bars = ui.columns().map(
    // 柱子是列里唯一带内联 height 的元素（高亮底与柱外标注都没有 height）
    button => button.querySelector<HTMLElement>('[style*="height"]')!.style.height
  )
  assert.deepEqual(bars, ['100%', '2px', `${(40 / 120) * 100}%`])

  // 3 列属于稀疏视图：逐列写日期 + 星期，不再重复峰值。
  const chartText = ui.text()
  assert.match(chartText, /10-20/)
  assert.match(chartText, /10-21/)
  assert.match(chartText, /10-22/)
  assert.match(chartText, /周二/)
  assert.doesNotMatch(chartText, /峰值/)
})

test('event day chart fills missing days with zeros', async t => {
  const ui = await setup(t)
  const { DayChart } = await import('../src/components/admin/panels')
  await ui.render(
    <DayChart daily={[{ day: '2026-10-21', n: 5 }]} days={3} sinceDay="2026-10-20" />
  )

  const buttons = ui.columns()
  assert.equal(buttons.length, 3)
  assert.match(buttons[0].getAttribute('aria-label') ?? '', /2026-10-20：事件 0/)
  assert.match(buttons[1].getAttribute('aria-label') ?? '', /2026-10-21：事件 5/)
  assert.match(buttons[2].getAttribute('aria-label') ?? '', /2026-10-22：事件 0/)

  await ui.hover(1)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-21/)
  assert.match(ui.tooltip()?.textContent ?? '', /事件 ?5/)
})

test('sparse charts print the numbers on the bars, dense ones do not', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')

  // 7 天：数字直接标在柱子上。
  await ui.render(<TrafficChart daily={trafficDaily} />)
  assert.match(ui.text(), /120/)
  assert.match(ui.text(), /40/)

  // 30 天：列太窄，只在悬浮卡片里给数字。
  const dense = Array.from({ length: 30 }, (_, index) => ({
    day: `2026-09-${String(index + 1).padStart(2, '0')}`,
    pv: index === 3 ? 777 : index === 10 ? 900 : index,
    uv: 0,
    bots: 0
  }))
  await ui.render(<TrafficChart daily={dense} />)
  assert.doesNotMatch(ui.text(), /777/)
  assert.match(ui.text(), /峰值 900 PV \/ 2026-09-11/)
  await ui.hover(3)
  assert.match(ui.tooltip()?.textContent ?? '', /777/)
})

test('pointer position picks the nearest lane, even when lanes are 1px wide', async () => {
  const { laneFromPointerX } = await import('../src/components/admin/chartMath')
  const rect = { left: 100, width: 900, count: 90 }

  // 90 列铺满 900px：每列 10px，指针落在第 45 列中间。
  assert.equal(laneFromPointerX({ ...rect, clientX: 100 + 45 * 10 + 5 }), 45)
  // 左边界之外/右边界之外都要夹住，不能返回 -1 或 90。
  assert.equal(laneFromPointerX({ ...rect, clientX: 0 }), 0)
  assert.equal(laneFromPointerX({ ...rect, clientX: 2000 }), 89)
  // 车道算宽度分不出来（比如隐藏/未布局）时不要瞎猜。
  assert.equal(laneFromPointerX({ ...rect, width: 0, clientX: 200 }), null)
  assert.equal(laneFromPointerX({ ...rect, count: 0, clientX: 200 }), null)
})

test('pointer position and plot clicks drive the tooltip through the real handlers', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(<TrafficChart daily={trafficDaily} />)

  // 指针移到 50% 处 → 中间那列（2026-10-21，值为 0）。
  await ui.pointer(0.5)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-21/)

  // 指针移到 90% 处 → 最后一列。
  await ui.pointer(0.9)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-22/)

  // 单击绘图区（detail=1）同样选中最近的列。
  await ui.pointer(0.1, 'click', 1)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-20/)

  // 键盘 Enter 产生的 click 没有坐标（detail=0），不能把选区打回第 0 列。
  await ui.pointer(0.9)
  await ui.pointer(0.01, 'click', 0)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-22/)
})

test('the chart is a single tab stop and arrow keys walk through the days', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  const daily = Array.from({ length: 30 }, (_, index) => ({
    day: `2026-09-${String(index + 1).padStart(2, '0')}`,
    pv: 100 + index,
    uv: 10,
    bots: 0
  }))
  await ui.render(<TrafficChart daily={daily} />)

  // 90 天 / 30 天视图若每根柱子都能 Tab，用户要按几十次才能越过图表。
  const tabbable = () => ui.columns().filter(button => button.getAttribute('tabindex') === '0')
  assert.equal(tabbable().length, 1, '整张图只能有一个可 Tab 的列')

  // 初始停在第一列；按右方向键前进，焦点与卡片一起走。
  assert.equal(ui.columns()[0].getAttribute('tabindex'), '0')
  await ui.press(0, 'ArrowRight')
  assert.equal(document.activeElement, ui.columns()[1])
  await act(async () => {})
  assert.equal(ui.columns()[1].getAttribute('tabindex'), '0')
  assert.equal(tabbable().length, 1)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-09-02/)

  // End / Home 直达两端，且不越界。
  await ui.press(1, 'End')
  assert.equal(document.activeElement, ui.columns()[29])
  await ui.press(29, 'End')
  assert.equal(document.activeElement, ui.columns()[29])
  await ui.press(29, 'Home')
  assert.equal(document.activeElement, ui.columns()[0])
  await ui.press(0, 'ArrowLeft')
  assert.equal(document.activeElement, ui.columns()[0])
})

test('axis ticks never repeat and compact large numbers', async () => {
  const { axisTicks, axisTopPercent } = await import('../src/components/admin/chartMath')
  const { formatCompact } = await import('../src/lib/format')
  // 最大值为 1 时半值也是 1，不能出现「1 / 1 / 0」这种重复刻度。
  assert.deepEqual(axisTicks(1, false), [1, 0])
  assert.deepEqual(axisTicks(2, false), [2, 1, 0])
  assert.deepEqual(axisTicks(3, false), [3, 2, 0])
  assert.deepEqual(axisTicks(232, false), [232, 116, 0])
  assert.ok(Math.abs(axisTopPercent(2, 3) - 100 / 3) < 1e-10)
  assert.equal(axisTopPercent(3, 5), 40)
  // 全 0 时纵轴只剩一个 0，别编造一个「1」当最大值。
  assert.deepEqual(axisTicks(1, true), [0])

  // 窄屏一列只有 20 来像素，柱上数字要压缩，否则会压到隔壁列。
  assert.equal(formatCompact(0), '0')
  assert.equal(formatCompact(999), '999')
  assert.equal(formatCompact(1234), '1.2k')
  assert.equal(formatCompact(12345), '12.3k')
  assert.equal(formatCompact(10500), '10.5k')
  assert.equal(formatCompact(1234567), '1.2M')
})

test('dense charts tighten the lane gap so bars do not collapse', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')

  const lanes = (n: number) =>
    Array.from({ length: n }, (_, index) => ({
      day: new Date(Date.UTC(2026, 8, 1) + index * 86_400_000).toISOString().slice(0, 10),
      pv: 100 + index,
      uv: 10,
      bots: 0
    }))

  // 90 天：间距压到 1px，否则 420px 屏幕上车道宽度会算成负数，柱子整片消失。
  await ui.render(<TrafficChart daily={lanes(90)} />)
  assert.ok(ui.rowClassName().includes('gap-px'), `90 天应使用 gap-px，实际是 ${ui.rowClassName()}`)

  // 30 天：保持 3px 间距。
  await ui.render(<TrafficChart daily={lanes(30)} />)
  assert.ok(ui.rowClassName().includes('gap-[3px]'), `30 天应使用 gap-[3px]，实际是 ${ui.rowClassName()}`)
})

test('narrow traffic tooltip keeps every metric visible without escaping the plot', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(
    <TrafficChart
      daily={[
        { day: '2026-10-20', pv: 40, uv: 12345, bots: 1234 },
        { day: '2026-10-21', pv: 49, uv: 12345, bots: 1234 },
        { day: '2026-10-22', pv: 100, uv: 12345, bots: 1234 },
        { day: '2026-10-23', pv: 0, uv: 12345, bots: 1234 }
      ]}
    />
  )
  // A 320px viewport with parent padding, axis labels and the axis gap leaves about 200px.
  ui.window.innerWidth = 320
  ui.stubPlotRect(200)

  for (const index of [0, 1, 2, 3]) {
    await ui.hover(index)
    const card = ui.tooltip()
    assert.ok(card, `bar ${index} should show its tooltip`)
    assert.equal(card!.style.top, '8px', 'tooltip stays inside the plot at every bar height')
    assert.equal(card!.style.bottom, 'auto')
    assert.doesNotMatch(card!.className, /max-h-|overflow-y-auto/, 'wrapped rows must not be clipped')
    assert.match(card!.className, /pointer-events-none/, 'tooltip must not intercept pointer interaction')
    if (index === 0) {
      const content = card!.textContent ?? ''
      for (const expected of ['PV', '40', '日 UV', '12,345', '爬虫', '1,234']) {
        assert.ok(content.includes(expected), `tooltip should expose ${expected}, actual: ${content}`)
      }
    }
  }

  // Keyboard navigation continues to expose the same complete set of metrics.
  await ui.focus(0)
  assert.match(ui.tooltip()?.textContent ?? '', /爬虫.*1,234/)
})

test('all-zero PV series names its primary unit even when bots were recorded', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(
    <TrafficChart
      daily={[
        { day: '2026-10-20', pv: 0, uv: 0, bots: 6 },
        { day: '2026-10-21', pv: 0, uv: 0, bots: 2 }
      ]}
    />
  )
  assert.match(ui.text(), /这段时间 PV 全是 0/)
  assert.doesNotMatch(ui.text(), /这段时间全是 0/)
  assert.equal(ui.tooltip(), null)
})

test('a single-lane chart still positions and reads correctly', async t => {
  const ui = await setup(t)
  const { DayChart } = await import('../src/components/admin/panels')

  await ui.render(<DayChart daily={[{ day: '2026-10-21', n: 9 }]} days={1} sinceDay="2026-10-21" />)
  assert.equal(ui.columns().length, 1)

  await ui.hover(0)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-21/)
  // 单列时指针换算不能越界（count = 1）。
  await ui.pointer(0.99)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-10-21/)
})

test('a broken sinceDay degrades to a hint instead of crashing the page', async t => {
  const ui = await setup(t)
  const { DayChart } = await import('../src/components/admin/panels')

  // 以前这里会 new Date(NaN).toISOString() 抛 RangeError，把整个后台渲染打成 500。
  await ui.render(<DayChart daily={[]} days={7} sinceDay="" />)
  assert.match(ui.text(), /日期范围无效/)
  assert.equal(ui.columns().length, 0)

  await ui.render(<DayChart daily={[]} days={7} sinceDay="not-a-date" />)
  assert.match(ui.text(), /日期范围无效/)
})

test('empty traffic range keeps the empty hint', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(<TrafficChart daily={[]} />)
  assert.equal(ui.columns().length, 0)
  assert.equal(ui.tooltip(), null)
})

test('hovering must not move the tab stop away from the focused column', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  const daily = Array.from({ length: 30 }, (_, index) => ({
    day: `2026-09-${String(index + 1).padStart(2, '0')}`,
    pv: 100 + index,
    uv: 10,
    bots: 0
  }))
  await ui.render(<TrafficChart daily={daily} />)

  const tabbable = () => ui.columns().filter(button => button.getAttribute('tabindex') === '0')
  assert.equal(tabbable().length, 1)
  assert.equal(tabbable()[0], ui.columns()[0], '初始停靠点是第一列')

  // 鼠标划过第 15 列：卡片跟着走，但 Tab 停靠点不能跟着鼠标跑，
  // 否则鼠标用户按 Tab 时焦点会莫名跳进图表中间。
  await ui.hover(15)
  assert.match(ui.tooltip()?.textContent ?? '', /2026-09-16/)
  assert.equal(tabbable().length, 1)
  assert.equal(tabbable()[0], ui.columns()[0], '悬停不该改动 Tab 停靠点')

  // 键盘确实移动过后，停靠点才跟着焦点走。
  await ui.press(0, 'ArrowRight')
  assert.equal(document.activeElement, ui.columns()[1])
  assert.equal(tabbable()[0], ui.columns()[1])

  // 之后再用鼠标悬停别的列，停靠点仍停在刚才键盘到的那一列。
  await ui.hover(20)
  assert.equal(tabbable()[0], ui.columns()[1])
})

for (const { name, focused, hovered, keys } of [
  { name: 'first', focused: 0, hovered: 2, keys: ['Home', 'ArrowLeft'] as const },
  { name: 'last', focused: 2, hovered: 0, keys: ['End', 'ArrowRight'] as const }
]) {
  test(`mouse leave restores the ${name} focused column tooltip after hovering another column`, async t => {
    const ui = await setup(t)
    const { TrafficChart } = await import('../src/components/admin/panels')
    await ui.render(<TrafficChart daily={trafficDaily} />)
    const focusedDay = trafficDaily[focused].day
    const hoveredDay = trafficDaily[hovered].day
    const button = ui.columns()[focused]
    await ui.focus(focused)
    assert.match(ui.tooltip()?.textContent ?? '', new RegExp(focusedDay))

    await ui.hover(hovered)
    assert.match(ui.tooltip()?.textContent ?? '', new RegExp(hoveredDay))
    await ui.hover(null)
    assert.equal(document.activeElement, button, 'mouse leave must keep keyboard focus unchanged')
    assert.match(ui.tooltip()?.textContent ?? '', new RegExp(focusedDay), 'mouse leave restores the focused column')
    assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [button])

    for (const key of keys) {
      await ui.hover(hovered)
      await ui.press(focused, key)
      assert.equal(document.activeElement, button, 'boundary keys keep focus on the same column')
      assert.match(ui.tooltip()?.textContent ?? '', new RegExp(focusedDay), 'boundary keys also restore the focused column')
    }

    await act(async () => button.blur())
    assert.equal(ui.tooltip(), null, 'leaving keyboard focus dismisses its tooltip')
    await ui.hover(hovered)
    await ui.hover(null)
    assert.equal(ui.tooltip(), null, 'remembering a tab stop must not restore a tooltip after blur')
  })
}

function trafficWindow(count: number, endDay = '2026-10-28') {
  const end = Date.parse(`${endDay}T00:00:00Z`)
  return Array.from({ length: count }, (_, index) => ({
    day: new Date(end - (count - 1 - index) * 86_400_000).toISOString().slice(0, 10),
    pv: 100 + index,
    uv: 10,
    bots: 0
  }))
}

for (const { name, before, after } of [
  { name: 'expands from 7 to 30 days', before: trafficWindow(7), after: trafficWindow(30) },
  { name: 'shrinks from 30 to 7 days', before: trafficWindow(30), after: trafficWindow(7) },
  { name: 'moves forward by one day', before: trafficWindow(7), after: trafficWindow(7, '2026-10-29') }
]) {
  test(`chart keeps the focused date when its window ${name}`, async t => {
    const ui = await setup(t)
    const { TrafficChart } = await import('../src/components/admin/panels')
    await ui.render(<TrafficChart daily={before} />)
    await ui.focus(before.length - 1)
    const button = ui.columns()[before.length - 1]
    const day = before.at(-1)!.day
    const nextIndex = after.findIndex(point => point.day === day)

    // 模拟异步范围响应抵达：React 复用同一天的按钮，焦点仍留在该 DOM 上。
    await ui.render(<TrafficChart daily={after} />)
    assert.equal(document.activeElement, button)
    assert.equal(ui.columns()[nextIndex], button)
    assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [button])
    assert.match(ui.tooltip()?.textContent ?? '', new RegExp(`${day}.*PV${after[nextIndex].pv}`))

    await ui.hover(0)
    await ui.hover(null)
    assert.match(ui.tooltip()?.textContent ?? '', new RegExp(day))
    assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [button])
    await ui.press(nextIndex, 'End')
    assert.equal(document.activeElement, ui.columns().at(-1))
    assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [ui.columns().at(-1)])
    assert.match(ui.tooltip()?.textContent ?? '', new RegExp(after.at(-1)!.day))
  })
}

test('chart keeps a hovered date across range updates without moving the tab stop', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  await ui.render(<TrafficChart daily={trafficWindow(7)} />)
  await ui.hover(3)
  const day = trafficWindow(7)[3].day
  await ui.render(<TrafficChart daily={trafficWindow(30)} />)
  assert.match(ui.tooltip()?.textContent ?? '', new RegExp(day))
  assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [ui.columns()[0]])
  await ui.hover(null)
  assert.equal(ui.tooltip(), null)
})

test('chart clears a removed date instead of selecting another date at its old index', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  const original = trafficWindow(7)
  await ui.render(<TrafficChart daily={original} />)
  await ui.focus(0)
  await ui.render(<TrafficChart daily={trafficWindow(7, '2026-10-29')} />)
  assert.equal(ui.tooltip(), null)
  assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [ui.columns()[0]])
  await ui.render(<TrafficChart daily={original} />)
  assert.equal(ui.tooltip(), null, 'a removed selection must not reappear on a later update')
  assert.deepEqual(ui.columns().filter(column => column.tabIndex === 0), [ui.columns()[0]])
})

test('shrinking the series never leaves the chart without a tab stop', async t => {
  const ui = await setup(t)
  const { TrafficChart } = await import('../src/components/admin/panels')
  const span = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      day: `2026-09-${String(index + 1).padStart(2, '0')}`,
      pv: 100 + index,
      uv: 10,
      bots: 0
    }))

  // 30 天视图里把焦点走到第 20 列，再切回 7 天视图：旧的焦点列已不存在，
  // 若不夹紧，整张图会一个可 Tab 的列都没有（键盘用户再也进不来）。
  await ui.render(<TrafficChart daily={span(30)} />)
  await ui.press(0, 'End')
  assert.equal(document.activeElement, ui.columns()[29])

  await ui.render(<TrafficChart daily={span(7)} />)
  const tabbable = () => ui.columns().filter(button => button.getAttribute('tabindex') === '0')
  assert.equal(tabbable().length, 1, '切视图后仍要保留一个停靠点')
  assert.equal(tabbable()[0], ui.columns()[0])
})
