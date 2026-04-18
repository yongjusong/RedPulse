import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    os.makedirs("docs", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1440, "height": 900})
        
        try:
            # Capture Simulator Mode
            await page.goto("http://localhost:5174", wait_until="networkidle")
            await asyncio.sleep(1)
            await page.screenshot(path="docs/simulator_preflight.png", type="png")
            print("Captured simulator_preflight.png")
            
            # Navigate to Cluster Grid
            await page.click("text=Cluster Grid")
            await asyncio.sleep(2)
            await page.screenshot(path="docs/cluster_grid.png", type="png")
            print("Captured cluster_grid.png")
            
            # Navigate to Impact Form
            await page.click("text=Impact")
            await asyncio.sleep(2)
            await page.screenshot(path="docs/finops_impact.png", type="png")
            print("Captured finops_impact.png")
            
            # Capture Executive Report
            await page.goto("http://localhost:5174/reports/latest_executive_report.html", wait_until="networkidle")
            await asyncio.sleep(1)
            await page.screenshot(path="docs/executive_report.png", type="png", full_page=True)
            print("Captured executive_report.png")

        except Exception as e:
            print("Capture failed:", e)
        finally:
            await browser.close()

asyncio.run(main())
