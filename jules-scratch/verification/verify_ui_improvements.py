from playwright.sync_api import sync_playwright, Page, expect

def verify_ui_changes(page: Page):
    """
    This script verifies the UI improvements: the new hero header and zebra-striped tables.
    """
    # 1. Navigate to the application.
    page.goto("http://localhost:5173")

    # 2. Wait for the main heading in the hero component to be visible.
    expect(page.get_by_role("heading", name="Guía Interactiva de Viaje: Colombia 2025 🇨🇴")).to_be_visible(timeout=60000)

    # 3. Find the "Resumen de Hospedajes" collapse container.
    lodging_collapse = page.locator("div.collapse", has_text="Resumen de Hospedajes")

    # 4. Find the checkbox within the collapse container and click it to expand.
    # The checkbox is the actual control element for the daisyUI collapse.
    lodging_collapse.get_by_role("checkbox").click()

    # 5. Wait for the table within that specific collapse element to be visible.
    lodging_table = lodging_collapse.get_by_role("table")
    expect(lodging_table).to_be_visible()

    # 6. Click on the "Itinerario por Día" tab
    page.get_by_role("tab", name="Itinerario por Día").click()

    # 7. Wait for the itinerary table to be visible
    expect(page.locator("#day-contents-container .tab-content:not(.hidden) .table-zebra")).to_be_visible()

    # 8. Take a full-page screenshot to capture all UI changes.
    page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_ui_changes(page)
        browser.close()

if __name__ == "__main__":
    main()