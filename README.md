# Duo Tax Construction Cost Calculator Redesign

A modern redesign of the embedded **Duo Tax Construction Cost Calculator** component.

This project focuses on improving the calculator interface so it feels clean, professional, responsive, and suitable for publication by a major financial institution such as Commonwealth Bank or Macquarie Bank.

The redesign preserves the calculator’s existing purpose, input fields, CTA area, and “How your estimate is calculated” section while presenting them through a more modern web calculator experience.

## Live Demo

Vercel deployment:

```text
Add live demo URL here
```

## Project Scope

The assignment was to redesign the embedded calculator component, not the entire Duo Tax website.

This implementation focuses on:

* The calculator input form
* Conditional field visibility
* Estimate results panel
* CTA section
* “How your estimate is calculated” breakdown
* Desktop and mobile responsive layouts

The page wrapper is intentionally simple and exists only to present the calculator component cleanly.

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Vercel

## Features

### Modern Calculator Interface

The calculator has been redesigned into a two-panel layout:

* Left panel: user inputs
* Right panel: estimate results and CTA
* Below: dynamic calculation explanation section

The interface uses a professional visual style with clean spacing, subtle borders, card-based hierarchy, readable typography, accessible controls, and responsive behaviour.

### Preserved Calculator Fields

The current calculator fields are maintained, including:

* Investment Property Type
* Construction Completion Year
* Investment Property State
* Build type
* Spec / finish level
* Floor area
* Number of floors
* Bedrooms, where applicable
* Wall type, where applicable
* Basement, where applicable
* Elevator, where applicable
* Mezzanine, where applicable
* Ducted Air-Conditioning

### Conditional Field Behaviour

The calculator shows or hides fields based on the selected property type.

For example:

* Residential property types show bedrooms where applicable.
* Wall type only appears for relevant property types.
* Office and warehouse property types show commercial-relevant options such as mezzanine.
* Hidden fields are not used in the calculation.

### Estimate Results

After the user completes the form and calculates an estimate, the calculator displays:

* Selected finish estimate
* Low estimate
* High estimate
* Cost range

The selected finish estimate is based on the chosen finish level:

* Economy → low estimate
* Standard → mid estimate
* Premium → high estimate
* Luxury → high estimate

### CTA Section

The calculator maintains the required CTA area:

* Order Initial Cost Report
* Email me the results

The CTA is presented inside the results panel so it remains closely connected to the estimate outcome.

### Dynamic “How Your Estimate Is Calculated” Section

The calculator includes a dynamic explanation section that updates after calculation.

It includes:

* User input summary
* Explanation of the calculation approach
* Factors affecting the estimate
* Low, selected, and high estimate totals

Before calculation, this section shows an empty state message instead of fake values.

### Responsive Design

The calculator is responsive across desktop and mobile.

* Desktop: two-column calculator layout with a sticky results panel
* Mobile: stacked layout with form, results, CTA, and explanation sections in sequence

## Calculation Logic

The calculation engine was aligned with the verified source calculator logic where available.

The estimate considers:

* Property type base rate
* Wall type allowance
* Basement, mezzanine, ducted air-conditioning add-ons
* Number of floors
* Bedroom factor where applicable
* Floor area
* Elevator allowance where applicable
* State and construction year BCI adjustment
* Low, mid, and high estimate range

Build type is retained as a required UI/context field, but it does not modify the calculation because it was not verified as a calculation multiplier in the source logic.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

## Deployment

The project is intended to be deployed on Vercel.

After pushing to GitHub, Vercel automatically builds and deploys the latest version from the main branch.

## Notes

This project is a focused component redesign for assessment purposes. It does not attempt to recreate the full Duo Tax website, navigation, footer, blog layout, or surrounding page structure.
