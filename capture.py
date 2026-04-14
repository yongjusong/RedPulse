import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1280, "height": 800})
        await page.goto("http://localhost:5173", wait_until="networkidle")
        
        try:
            await page.select_option('select.form-control', value='samsung_pm9a3_3_84tb')
            await asyncio.sleep(1)
            await page.click("button.btn-run")
            await asyncio.sleep(3)
        except Exception as e:
            print("Action failed:", e)
            
        await page.screenshot(path="docs/dashboard_v2.png", type="png")
        
        await browser.close()
        print("Successfully captured screenshot to docs/dashboard_v2.png")

asyncio.run(main())
