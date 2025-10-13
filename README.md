# Colombia Trip Guide 🇨🇴

A modular, production-ready web application that serves as an interactive guide for a family trip to Colombia. It includes a detailed itinerary, budget summary, lodging information, and general travel recommendations.

The live version of this guide is hosted on Netlify:
**[View Live Demo](https://gentle-mochi-05a532.netlify.app/)**

## Features

-   **Interactive Itinerary:** A day-by-day schedule of activities, flights, and lodging.
-   **Budget Overview:** An estimated budget summary with cost distribution charts.
-   **Lodging Details:** A summary of all accommodations with links to their locations.
-   **Travel Recommendations:** Key travel tips regarding currency, safety, and local customs.
-   **Shared Google Maps:** Direct links to curated lists of places of interest for each city.
-   **Weather Forecast:** A timeline of the expected weather for the duration of the trip.

## Technologies Used

-   **Vite:** A modern front-end build tool that provides a faster and leaner development experience.
-   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
-   **daisyUI:** A component library for Tailwind CSS that provides a set of pre-designed UI components.
-   **Chart.js:** A flexible JavaScript charting library for creating interactive charts.
-   **ESLint:** A static code analysis tool for identifying and fixing problems in JavaScript code.

## Getting Started

To run this project locally, please follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jankrloz/colombia-trip-guide.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd colombia-trip-guide
    ```
3.  **Install the dependencies:**
    ```bash
    npm install
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
5.  **Open your browser** and navigate to the local URL provided by Vite.

## Data

All the data for the trip (itinerary, budget, lodging, etc.) is stored in the `src/data.json` file. To modify the trip details, you can edit this file directly.

The data has the following structure:

```json
{
  "config": {
    "copToMxnRate": 0.006,
    "contingencyRate": 0.15
  },
  "tripData": {
    "lodgingSummary": [
      {
        "city": "Cartagena",
        "name": "Airbnb's Bolivar"
      }
    ],
    "days": [
      {
        "day": 1,
        "date": "Jueves, 10 de Octubre",
        "title": "Llegada a Cartagena"
      }
    ]
  }
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! If you have any suggestions or find any issues, please feel free to open an issue or submit a pull request.