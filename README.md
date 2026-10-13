# CropCast – Crop Yield Prediction (React frontend)

Frontend-only project. No backend: the CSV is bundled as `src/data.json` and a
k-nearest-neighbours regressor (k=5, standardised inputs) runs in the browser.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Pages
- **Predict yield** – sliders for Fertilizer, Temperature, N, P, K → predicted yield, yield class,
  a matching field image, a "what if" curve and the 5 closest historical records.
- **Explore data** – held-out accuracy (R², RMSE, MAE), yield histogram, correlations, scatter plots, summary table.
- **Image dataset** – 48 labelled field images (4 classes × 12).

## Image dataset (`public/dataset/`)
Classes match yield bands: `low` (<7), `medium` (7–9), `high` (9–11), `very_high` (>11).
Labels: `public/dataset/labels.csv`. The images are procedurally drawn illustrations
(`make_images.py`, needs Pillow), not real photographs. Replace the PNGs with real field photos
using the same folder/file names to upgrade the dataset.

## Notes on the data
Rows in the CSV are sorted in blocks, so evaluate with shuffled splits (the app does).
Held-out R² ≈ 0.99 for kNN; plain linear regression reaches ≈ 0.87.
Column name `yeild` in the CSV is renamed to `yield` in the app.

## Suggestions panel (new)
`src/suggestions.js` + `src/components/Suggestions.jsx`: after each prediction the app
1. tries raising Fertilizer / N / P / K (max +20%) and ranks changes by predicted yield gain,
2. gives heat-stress tips when temperature is above the best fields' range,
3. builds a combined plan (button applies it to the sliders),
4. compares your inputs with the profile of fields that had yield >= 9.
