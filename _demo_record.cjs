/**
 * 《工程造价计算器》演示教学录屏
 * 用法：
 *   node _demo_record.cjs          # 正式录制（输出 webm + mp4）
 *   $env:DRY=1; node _demo_record.cjs   # 快速走查（不录制，检查流程是否走得通）
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG || 'C:\\ffmpeg\\ffmpeg-9.0.1-full_build\\bin\\ffmpeg.exe';
const OUT_DIR = path.join(__dirname, '演示录屏');
const APP_URL = 'http://localhost:3000/';

const DRY = process.env.DRY === '1';
const SPEED = DRY ? 0.12 : 1;
const VW = 480;
const VH = 1040;

const log = (...a) => console.log(...a);

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--hide-scrollbars', '--disable-lcd-text'],
  });
  const context = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    recordVideo: DRY ? undefined : { dir: OUT_DIR, size: { width: VW, height: VH } },
  });
  const page = await context.newPage();
  const wait = (ms) => page.waitForTimeout(DRY ? Math.max(360, Math.round(ms * SPEED)) : ms);

  /** 判断页面中是否存在包含指定文本的可见元素 */
  const hasText = (text, prefer) =>
    page.evaluate(
      ({ t, prefer }) => {
        const nodes = [...document.querySelectorAll(prefer || 'button,label,h2,h3,h4,span,div,li,a,p')];
        return nodes.some((e) => (e.textContent || '').trim().includes(t) && e.offsetParent !== null);
      },
      { t: text, prefer },
    );

  /** 等待指定文本出现（最多 timeout 毫秒） */
  const waitForText = async (text, prefer, timeout = 9000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (await hasText(text, prefer)) return true;
      await page.waitForTimeout(130);
    }
    return false;
  };

  /** 断言页面已出现期望内容（用于自检，避免录制出错误画面） */
  const expectText = async (text, label, prefer) => {
    const ok = await waitForText(text, prefer, 9000);
    log(`  [${ok ? 'OK ' : 'WARN'}] 校验「${label || text}」${ok ? '' : ' —— 未出现，请检查'} `);
    return ok;
  };

  /* ---------------- 页面内注入演示 UI ---------------- */
  const installUI = () =>
    page.evaluate(() => {
      if (document.getElementById('__demo_ui')) return;
      const wrap = document.createElement('div');
      wrap.id = '__demo_ui';
      wrap.innerHTML = `
<div id="__demo_cursor" style="position:fixed;left:50%;top:50%;z-index:2147483000;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(0,122,255,.28);border:2px solid rgba(0,122,255,.95);box-shadow:0 0 0 4px rgba(0,122,255,.13);pointer-events:none;opacity:0;transition:left .36s ease,top .36s ease,opacity .25s;"></div>
<div id="__demo_ripple" style="position:fixed;left:50%;top:50%;z-index:2147482999;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:rgba(0,122,255,.45);pointer-events:none;opacity:0;"></div>
<div id="__demo_caption" style="position:fixed;left:0;right:0;bottom:86px;z-index:2147483001;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 16px;pointer-events:none;font-family:'Microsoft YaHei','PingFang SC',sans-serif;"></div>
<div id="__demo_title" style="position:fixed;left:0;right:0;top:32%;z-index:2147483001;display:none;flex-direction:column;align-items:center;gap:10px;padding:0 22px;pointer-events:none;text-align:center;font-family:'Microsoft YaHei','PingFang SC',sans-serif;"></div>`;
      document.body.appendChild(wrap);
    });

  const OUTLINE =
    '-1.5px -1.5px 0 #000,1.5px -1.5px 0 #000,-1.5px 1.5px 0 #000,1.5px 1.5px 0 #000,0 0 5px rgba(0,0,0,.9),0 2px 6px rgba(0,0,0,.55)';

  /** 字幕：白色字体 + 黑色轮廓，无背景 */
  const caption = (text, sub) =>
    page.evaluate(
      ({ t, s, o }) => {
        const c = document.getElementById('__demo_caption');
        if (!c) return;
        c.innerHTML =
          `<div style="font-size:16px;font-weight:800;color:#fff;line-height:1.52;text-align:center;text-shadow:${o}">${t}</div>` +
          (s
            ? `<div style="font-size:13px;font-weight:700;color:#fff;line-height:1.5;text-align:center;text-shadow:${o}">${s}</div>`
            : '');
      },
      { t: text, s: sub || '', o: OUTLINE },
    );

  const clearCaption = () =>
    page.evaluate(() => {
      const c = document.getElementById('__demo_caption');
      if (c) c.innerHTML = '';
    });

  /** 片头/片尾文字：白字黑边，不铺满屏幕 */
  const showTitle = (title, sub) =>
    page.evaluate(
      ({ t, s }) => {
        const out =
          '-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 0 9px rgba(0,0,0,.95),0 3px 10px rgba(0,0,0,.7)';
        const el = document.getElementById('__demo_title');
        el.innerHTML =
          `<div style="font-size:27px;font-weight:900;color:#fff;letter-spacing:3px;line-height:1.4;text-shadow:${out}">${t}</div>` +
          (s ? `<div style="font-size:14px;font-weight:700;color:#fff;line-height:1.8;text-shadow:${out}">${s}</div>` : '');
        el.style.display = 'flex';
      },
      { t: title, s: sub },
    );

  const hideTitle = () =>
    page.evaluate(() => {
      const el = document.getElementById('__demo_title');
      if (el) el.style.display = 'none';
    });

  const glide = async (x, y) => {
    await page.evaluate(({ x, y }) => {
      const c = document.getElementById('__demo_cursor');
      if (!c) return;
      c.style.opacity = '1';
      c.style.left = x + 'px';
      c.style.top = y + 'px';
    }, { x, y });
    await wait(360);
  };

  const ripple = async (x, y) => {
    await page.evaluate(({ x, y }) => {
      const r = document.getElementById('__demo_ripple');
      if (!r) return;
      r.style.transition = 'none';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      r.style.width = '10px';
      r.style.height = '10px';
      r.style.margin = '-5px 0 0 -5px';
      r.style.opacity = '0.85';
      void r.offsetWidth;
      r.style.transition = 'all .5s ease-out';
      r.style.width = '80px';
      r.style.height = '80px';
      r.style.margin = '-40px 0 0 -40px';
      r.style.opacity = '0';
    }, { x, y });
    await wait(200);
  };

  /** 按文本定位“最小可见元素”并打上临时 id */
  let tagSeq = 0;
  const tagByText = async (text, prefer) => {
    tagSeq += 1;
    const id = '__demo_tag_' + tagSeq;
    const ok = await page.evaluate(
      ({ t, id, prefer }) => {
        const nodes = [...document.querySelectorAll(prefer || 'button,label,h2,h3,h4,span,div,li,a,p')];
        const hit = nodes
          .filter((e) => {
            const s = (e.textContent || '').trim();
            if (!s.includes(t)) return false;
            const r = e.getBoundingClientRect();
            return e.offsetParent !== null && r.width > 4 && r.height > 4;
          })
          .sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            return ra.width * ra.height - rb.width * rb.height;
          });
        document.querySelectorAll('[id^="__demo_tag_"]').forEach((e) => e.removeAttribute('id'));
        if (!hit.length) return false;
        hit[0].id = id;
        return true;
      },
      { t: text, id, prefer },
    );
    return ok ? id : null;
  };

  const clickTag = async (id, fallbackText) => {
    const scrolled = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return true;
    }, id);
    if (!scrolled) return false;
    await wait(680);
    const box = await page.locator('#' + id).boundingBox();
    if (!box) {
      log('  [WARN] 元素不可见:', fallbackText);
      return false;
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await glide(x, y);
    await ripple(x, y);
    await page.mouse.click(x, y);
    await wait(900);
    return true;
  };

  /** 点击包含指定文本的元素 */
  const tap = async (text, prefer, label) => {
    await waitForText(text, prefer);
    const id = await tagByText(text, prefer);
    if (!id) {
      log('  [MISS] 未找到:', label || text);
      return false;
    }
    const ok = await clickTag(id, label || text);
    log(`  [${ok ? 'OK ' : 'FAIL'}] 点击 ${label || text}`);
    return ok;
  };

  /** 勾选/选中包含指定文本的选项，带校验与重试 */
  const checkOption = async (text, label) => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const st = await page.evaluate((t) => {
        document.querySelectorAll('[data-demo-target]').forEach((e) => e.removeAttribute('data-demo-target'));
        const labs = [...document.querySelectorAll('label')]
          .filter((e) => (e.textContent || '').includes(t) && e.offsetParent !== null)
          .filter((e) => e.querySelector('input[type=checkbox],input[type=radio]'));
        if (!labs.length) return { found: false };
        labs.sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return ra.width * ra.height - rb.width * rb.height;
        });
        const lab = labs[0];
        lab.setAttribute('data-demo-target', '1');
        lab.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const inp = lab.querySelector('input[type=checkbox],input[type=radio]');
        return { found: true, checked: !!inp.checked };
      }, text);
      if (!st.found) {
        log('  [MISS] 未找到选项:', label || text);
        return false;
      }
      if (st.checked) {
        log(`  [OK ] 已选中 ${label || text}`);
        return true;
      }
      await wait(640);
      const pt = await page.evaluate(() => {
        const lab = document.querySelector('[data-demo-target="1"]');
        if (!lab) return null;
        const inp = lab.querySelector('input[type=checkbox],input[type=radio]');
        const ir = inp.getBoundingClientRect();
        const lr = lab.getBoundingClientRect();
        const useInput = ir.width > 2 && ir.height > 2;
        return {
          x: useInput ? ir.left + ir.width / 2 : lr.left + 10,
          y: useInput ? ir.top + ir.height / 2 : lr.top + lr.height / 2,
        };
      });
      if (!pt) return false;
      await glide(pt.x, pt.y);
      await ripple(pt.x, pt.y);
      await page.mouse.click(pt.x, pt.y);
      await wait(720);
    }
    log('  [FAIL] 勾选失败:', label || text);
    return false;
  };

  /** 选中第 nth 个可见下拉框 */
  const selectVisible = async (nth, target) => {
    const id = '__demo_sel_' + nth;
    const ok = await page.evaluate(
      ({ n, i }) => {
        const sels = [...document.querySelectorAll('select')].filter((e) => e.offsetParent !== null);
        const el = sels[n];
        if (!el) return false;
        document.querySelectorAll('[id^="__demo_sel_"]').forEach((e) => e.removeAttribute('id'));
        el.id = i;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return true;
      },
      { n: nth, i: id },
    );
    if (!ok) {
      log('  [MISS] 未找到第', nth, '个下拉框');
      return false;
    }
    await wait(620);
    const box = await page.locator('#' + id).boundingBox();
    if (box) {
      await glide(box.x + box.width / 2, box.y + box.height / 2);
      await ripple(box.x + box.width / 2, box.y + box.height / 2);
    }
    if (typeof target === 'string') await page.selectOption('#' + id, target);
    else await page.selectOption('#' + id, target);
    await wait(950);
    return true;
  };

  /** 定位第一个可见数字输入框 */
  const focusNumberInput = async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 9000) {
      const ok = await page.evaluate(() => {
        const i = [...document.querySelectorAll('input[type=number]')].filter((e) => e.offsetParent !== null)[0];
        if (!i) return false;
        i.id = '__demo_num';
        i.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return true;
      });
      if (ok) {
        await wait(620);
        return page.locator('#__demo_num').boundingBox();
      }
      await page.waitForTimeout(140);
    }
    return null;
  };

  /** 录入数字（逐位输入，观感更自然） */
  const fillNumber = async (value) => {
    const b = await focusNumberInput();
    if (!b) {
      log('  [MISS] 未找到数字输入框');
      return false;
    }
    await glide(b.x + b.width / 2, b.y + b.height / 2);
    await ripple(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await wait(320);
    await page.keyboard.press('Control+A');
    await page.keyboard.type(String(value), { delay: Math.round(160 * SPEED) });
    await wait(850);
    return true;
  };

  const scrollReport = async (steps, dwell = 1500) => {
    for (const top of steps) {
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'smooth' }), top);
      await wait(dwell);
    }
  };

  /* ---------------- 打开应用并清空历史 ---------------- */
  log('打开应用…');
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await installUI();

  /* =============== 0. 片头 =============== */
  await showTitle('工程造价计算器', 'v2.4.0　|　四类工程咨询费用测算演示<br/>工程设计费 · 工程可研费 · 工程监理费 · 造价咨询费');
  await wait(4800);
  await hideTitle();
  await wait(500);

  /* =============== 1. 界面总览 =============== */
  await caption('系统由“计算器 / 历史 / 我的”三个页面组成', '先认识界面结构');
  await wait(1400);
  await tap('历史', 'nav button', '底部页签「历史」');
  await expectText('历史计算记录', '已进入历史页');
  await caption('「历史」页集中保存每一次测算记录', '支持搜索、筛选与报告全文查看');
  await wait(2200);
  await tap('我的', 'nav button', '底部页签「我的」');
  await expectText('默认省份设置', '已进入我的页');
  await caption('「我的」页用于设置各模块的默认省份', '下次进入计算器自动预选');
  await wait(2400);
  await tap('计算器', 'nav button', '底部页签「计算器」');
  await expectText('测算省份', '已返回计算器');
  await wait(1200);

  /* =============== 2. 工程设计费 =============== */
  await caption('模块一：工程设计费', '依据：计价格〔2002〕10 号《工程设计收费标准》第 7 章');
  await wait(2600);
  await caption('步骤 1：选择测算省份', '第 7 章为全国统一标准，默认选择“全国”');
  await wait(2200);
  await tap('继续', 'button', '步骤 1「继续」');

  await caption('步骤 2：选择工程类别', '类别对应专业调整系数：0.8 / 1.0 / 1.1');
  await wait(2000);
  await selectVisible(0, 'cat-building');
  await wait(1600);
  await caption('选择“建筑、市政、电信工程”，专业调整系数 1.00', '');
  await wait(1500);
  await tap('继续', 'button', '步骤 2「继续」');

  await caption('步骤 3：录入计费额', '建安工程费 + 设备与工器具购置费 + 联合试运转费');
  await wait(2000);
  await fillNumber('2000');
  await caption('录入计费额 2000 万元', '');
  await wait(1400);
  await tap('继续', 'button', '步骤 3「继续」');

  await caption('步骤 4：阶段与调整系数（五个可折叠分区）', '① 工程复杂程度　② 修正（附加）调整系数　③ 计费模式　④ 其他设计收费　⑤ 各阶段工作量比例');
  await wait(3200);
  await tap('Ⅱ级（较复杂）', 'button,div,span', '① 复杂程度：Ⅱ级（较复杂）');
  await caption('① 选择工程复杂程度“Ⅱ级（较复杂）”，系数 1.00', '');
  await wait(1800);

  await tap('修正（附加）调整系数', 'h3,h4,div,button,span', '展开 ② 修正（附加）调整系数');
  await caption('② 勾选修正（附加）调整系数', '多个系数不能连乘，按“各系数之和 − 系数个数 + 1”合并');
  await wait(2600);
  await checkOption('改扩建和技术改造建设项目', '改扩建和技术改造建设项目（含结构加固）1.20');
  await checkOption('室内装修设计', '室内装修设计 1.50');
  await caption('两项系数合并：1.20 + 1.50 − 2 + 1 = 1.7000', '');
  await wait(2400);

  await tap('其他设计收费', 'h3,h4,div,button,span', '展开 ④ 其他设计收费');
  await caption('④ 勾选“总体设计费”，按基本设计收费的 5% 计取', '');
  await wait(2000);
  await checkOption('总体设计费', '总体设计费（基本设计收费 × 5%）');
  await wait(1600);

  await tap('各阶段工作量比例', 'h3,h4,div,button,span', '展开 ⑤ 各阶段工作量比例');
  await caption('⑤ 按表 7.2-1 选择工程类型行，自动填入各阶段比例', '');
  await wait(2600);

  await tap('设计费生成', 'button', '生成工程设计费测算报告');
  await caption('步骤 5：生成测算报告', '系统逐条列出取费依据、档位定位与计算过程');
  await wait(2200);
  await scrollReport([0, 420, 900, 1500, 2100, 2600], 1500);

  /* =============== 3. 工程可研费 =============== */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(900);
  await tap('工程可研费', 'button', '切换到「工程可研费」');
  await expectText('咨询服务类型', '已切到可研费模块');
  await caption('模块二：工程可研费（建设项目前期工作咨询费）', '支持湖南、浙江、广西三套标准');
  await wait(2400);
  await caption('步骤 1：选择测算省份（湖南省）', '');
  await wait(1800);
  await tap('继续', 'button', '步骤 1「继续」');
  await caption('步骤 2：咨询服务类型（可多选）', '一次测算可同时包含多项服务，报告中逐项列示并给出合计');
  await wait(2600);
  await checkOption('编制项目建议书', '编制项目建议书');
  await checkOption('编制可行性研究报告', '编制可行性研究报告');
  await wait(1400);
  await tap('继续', 'button', '步骤 2「继续」');
  await caption('步骤 3：录入估算投资额 8000 万元', '');
  await wait(1600);
  await fillNumber('8000');
  await tap('继续', 'button', '步骤 3「继续」');
  await caption('步骤 4：设置行业调整系数与工程复杂程度系数', '最终费用 = 基准费用 × 行业系数 × 复杂程度系数 × 其他系数');
  await wait(3000);
  await tap('可研费生成', 'button', '生成可研费测算报告');
  await caption('步骤 5：测算报告（两项服务分别计算后合计）', '');
  await wait(2000);
  await scrollReport([0, 420, 900, 1500], 1400);

  /* =============== 4. 工程监理费 =============== */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(900);
  await tap('工程监理费', 'button', '切换到「工程监理费」');
  await expectText('监理服务类型', '已切到监理费模块');
  await caption('模块三：工程监理费（施工阶段监理服务费）', '支持河南、湖南、沪苏浙三套标准');
  await wait(2400);
  await caption('步骤 1：选择测算省份（湖南省）', '');
  await wait(1700);
  await tap('继续', 'button', '步骤 1「继续」');
  await caption('步骤 2：选择监理服务类型', '服务类型决定使用哪一张工程难度调整系数表');
  await wait(2400);
  await tap('房屋建筑工程', 'h4,h3,div,button', '选择「房屋建筑工程」');
  await wait(1200);
  await caption('附加选项：含项目管理服务（加收 20%）', '湖南省另可加收保修阶段监理服务 5%');
  await wait(2400);
  await checkOption('含项目管理服务', '含项目管理服务（加收 20%）');
  await wait(1200);
  await tap('继续', 'button', '步骤 2「继续」');
  await caption('步骤 3：录入计费额 6000 万元', '');
  await wait(1500);
  await fillNumber('6000');
  await tap('继续', 'button', '步骤 3「继续」');
  await caption('步骤 4：选择工程类别（工程难度调整系数）', '');
  await wait(2200);
  await selectVisible(0, { index: 2 });
  await tap('监理费生成', 'button', '生成监理费测算报告');
  await caption('步骤 5：测算报告（费率内插 + 附加调整 + 工作量折算）', '');
  await wait(2000);
  await scrollReport([0, 420, 900], 1400);

  /* =============== 5. 造价咨询费 =============== */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(900);
  await tap('造价咨询费', 'button', '切换到「造价咨询费」');
  await expectText('各省造价咨询计费规章', '已切到造价咨询费模块');
  await caption('模块四：工程造价咨询费', '支持湖南、浙江、贵州三套标准，并可录入自定义省份');
  await wait(2400);
  await caption('步骤 1：选择测算省份（湖南省），选择后自动进入下一步', '');
  await wait(2600);
  await selectVisible(0, '湖南省');
  await wait(1200);
  await caption('步骤 2：选择造价咨询服务类型', '含单项造价服务、全过程造价咨询服务、全过程跟踪审计三类');
  await wait(2600);
  await waitForText('-- 请选择造价咨询服务类型 --', 'select');
  await selectVisible(0, { label: '全过程造价咨询服务（B型）- 设计阶段至竣工阶段' });
  log('  [OK ] 选择 全过程造价咨询服务（B 型）');
  await caption('选择“全过程造价咨询服务（B 型）”，系统自动进入步骤 3', '');
  await wait(1800);
  await caption('步骤 3：录入计费基数 6000 万元', '');
  await fillNumber('6000');
  await tap('继续', 'button', '步骤 3「继续」');
  await caption('步骤 4：选择工程类别（专业调整系数）', '湖南省内置 13 类，贵州省内置 17 类');
  await wait(2400);
  await selectVisible(0, { index: 1 });
  await tap('造价咨询费生成', 'button', '生成造价咨询费测算报告');
  await caption('步骤 5：测算报告（差额累进分段明细）', '');
  await wait(2000);
  await scrollReport([0, 420, 900], 1400);

  /* =============== 6. 历史记录 =============== */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(800);
  await tap('历史', 'nav button', '切换到「历史」页');
  await expectText('历史计算记录', '已进入历史页');
  await caption('历史页：四类测算记录自动保存', '卡片显示模块色标、省份、计费基数与总费用');
  await wait(2600);
  await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'smooth' }));
  await wait(1800);
  await caption('支持按关键词搜索、按模块筛选', '');
  await wait(1200);
  await page.evaluate(() => {
    const el = document.querySelector('input[type=text]') || document.querySelector('input:not([type])');
    if (el) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '造价');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await wait(2200);
  await caption('输入关键词“造价”，列表即时过滤', '');
  await wait(1600);
  await page.evaluate(() => {
    const el = document.querySelector('input[type=text]') || document.querySelector('input:not([type])');
    if (el) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.scrollTo({ top: 280, behavior: 'smooth' });
  });
  await wait(1600);
  await caption('点击任一卡片可查看完整报告并复制全文', '');
  await wait(1400);
  const cardId = await tagByText('综合商业用房', 'h4,div,span').catch(() => null);
  const anyCard = cardId || (await tagByText('全过程造价咨询服务（B型）', 'h4,div,span'));
  if (anyCard) {
    await clickTag(anyCard, '历史记录卡片');
    await caption('报告详情浮层：可复制全文、删除记录、重新测算', '');
    await wait(3000);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === '关闭');
      if (b) b.click();
    });
    await wait(1400);
  }

  /* =============== 7. 我的 =============== */
  await tap('我的', 'nav button', '切换到「我的」页');
  await expectText('默认省份设置', '已进入我的页');
  await caption('我的页：设置各模块默认省份', '工程设计费 / 工程可研费 / 工程监理费 / 造价咨询费');
  await wait(3000);
  await caption('设置后下次进入计算器将自动预选该省份', '页面底部提供版本号与帮助入口');
  await wait(2600);

  /* =============== 8. 片尾 =============== */
  await clearCaption();
  await showTitle('演示结束', '工程造价计算器 v2.4.0<br/>更多操作说明请参阅《工程造价计算器 用户手册》');
  await wait(4600);

  /* ---------------- 收尾 ---------------- */
  const video = DRY ? null : page.video();
  await context.close();
  await browser.close();

  if (DRY) {
    log('DRY 走查结束。');
    return;
  }

  const webm = await video.path();
  const webmTarget = path.join(OUT_DIR, '工程造价计算器-演示教学.webm');
  fs.copyFileSync(webm, webmTarget);
  log('已生成 webm：' + webmTarget);

  const mp4 = path.join(OUT_DIR, '工程造价计算器-演示教学.mp4');
  log('开始转码 mp4…');
  execFileSync(
    FFMPEG,
    [
      '-y',
      '-i',
      webmTarget,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '24',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-r',
      '30',
      mp4,
    ],
    { stdio: 'inherit' },
  );
  const kb = Math.round(fs.statSync(mp4).size / 1024);
  log(`已生成 mp4：${mp4}（${kb} KB）`);
  try {
    fs.unlinkSync(webm);
    fs.unlinkSync(webmTarget);
    log('已清理中间 webm 文件。');
  } catch (e) {
    /* ignore */
  }
}

main().catch((e) => {
  console.error('录制失败：', e);
  process.exit(1);
});
