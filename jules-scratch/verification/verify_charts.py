from playwright.sync_api import sync_playwright, Page, expect

def verify_charts(page: Page):
    """
    This script verifies that all the charts are rendered correctly.
    """
    # 1. Navigate to the application.
    page.goto("http://localhost:5173")

    # 2. Wait for the main heading to be visible.
    expect(page.get_by_role("heading", name="Guía Interactiva de Viaje: Colombia 2025 🇨🇴")).to_be_visible(timeout=60000)

    # 3. Check for the summary charts
    expect(page.locator("#destinationCostChart")).to_be_visible()
    expect(page.locator("#budgetByConceptChart")).to_be_visible()
    expect(page.locator("#weatherTimelineChart")).to_be_visible()
    expect(page.locator("#dailyStackedBudgetChart")).to_be_visible()

    # 4. Switch to the "Itinerario por Día" tab.
    page.get_by_role("tab", name="Itinerario por Día").click()

    # 5. Wait for the daily budget chart for day 1 to be visible.
    expect(page.locator("#dailyBudgetChart-day-1")).to_be_visible()

    # 6. Take a full-page screenshot to capture all UI changes.
    page.screenshot(path="jules-scratch/verification/charts_verification.png", full_page=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_charts(page)
        browser.close()

if __name__ == "__main__":
    main()