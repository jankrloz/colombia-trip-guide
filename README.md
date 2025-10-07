# Colombia Trip Guide 🇨🇴

A simple static website that serves as an interactive guide for a family trip to Colombia. It includes a detailed itinerary, budget summary, lodging information, and general travel recommendations. All data is managed within a single `index.html` file using a JavaScript object.

The live version of this guide is hosted on Netlify:
**[View Live Demo](https://gentle-mochi-05a532.netlify.app/)**

## Features

-   **Interactive Itinerary:** A day-by-day schedule of activities, flights, and lodging.
-   **Budget Overview:** An estimated budget summary with cost distribution charts.
-   **Lodging Details:** A summary of all accommodations with links to their locations.
-   **Travel Recommendations:** Key travel tips regarding currency, safety, and local customs.
-   **Shared Google Maps:** Direct links to curated lists of places of interest for each city.

## Technologies Used

-   **HTML:** For the basic structure of the web page.
-   **[Tailwind CSS](https://tailwindcss.com/):** For styling the user interface.
-   **[Chart.js](https://www.chartjs.org/):** To create interactive charts for the budget summary.
-   **JavaScript:** To dynamically generate the itinerary and other content from the `tripData` object.

## Getting Started

To run this project locally, you don't need any special setup. Just follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jankrloz/colombia-trip-guide.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd colombia-trip-guide
    ```
3.  **Open the `index.html` file in your browser:**
    You can do this by double-clicking the file or by running the following command in your terminal:
    ```bash
    open index.html
    ```

## Data

All the data for the trip (itinerary, budget, lodging, etc.) is stored in a JavaScript object named `tripData` inside the `<script>` tag in the `index.html` file. To modify the trip details, you can edit this object directly.

The `tripData` object has the following structure:

```javascript
const tripData = {
  lodgingSummary: [
    {
      city: "Cartagena",
      name: "Airbnb's Bolivar",
      // ... other lodging details
    },
    // ... other lodging entries
  ],
  days: [
    {
      day: 1,
      date: "Jueves, 10 de Octubre",
      title: "Llegada a Cartagena",
      // ... other day details
    },
    // ... other day entries
  ]
};
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! If you have any suggestions or find any issues, please feel free to open an issue or submit a pull request.